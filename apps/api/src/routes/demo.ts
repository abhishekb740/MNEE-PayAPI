/**
 * Demo Agent Routes
 *
 * Handles WebSocket connections to the autonomous demo agent
 * Requires authentication and rate limits to 3 runs per hour per user
 */

import { Hono } from 'hono'
import type { AppContext } from '../env'
import { createAuth } from '../auth'

const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour in ms
const RATE_LIMIT_MAX = 3 // max runs per window

const demo = new Hono<AppContext>()
  // Start a new demo agent session
  .get('/start', async (c) => {
    // Verify user is authenticated
    const auth = createAuth(c.env)
    const session = await auth.api.getSession({ headers: c.req.raw.headers })

    if (!session?.user) {
      return c.json({ error: 'Authentication required', code: 'UNAUTHORIZED' }, 401)
    }

    const userId = session.user.id

    // Check rate limit using KV
    const rateLimitKey = `demo-ratelimit:${userId}`
    const now = Date.now()

    try {
      const stored = await c.env.KV.get(rateLimitKey)
      let rateData: { count: number; windowStart: number } = stored
        ? JSON.parse(stored)
        : { count: 0, windowStart: now }

      // Reset window if expired
      if (now - rateData.windowStart > RATE_LIMIT_WINDOW) {
        rateData = { count: 0, windowStart: now }
      }

      // Check if rate limited
      if (rateData.count >= RATE_LIMIT_MAX) {
        const resetIn = Math.ceil((rateData.windowStart + RATE_LIMIT_WINDOW - now) / 60_000)
        return c.json(
          {
            error: 'Rate limit exceeded',
            code: 'RATE_LIMITED',
            message: `Demo limited to ${RATE_LIMIT_MAX} runs per hour. Try again in ${resetIn} minutes.`,
            resetIn,
          },
          429,
        )
      }

      // Increment count
      rateData.count++
      await c.env.KV.put(rateLimitKey, JSON.stringify(rateData), {
        expirationTtl: 3600, // 1 hour TTL
      })
    } catch (error) {
      console.error('Rate limit check failed:', error)
      // Continue on KV errors to not block the demo
    }

    // Create a unique Durable Object instance for this session
    const sessionId = crypto.randomUUID()
    const id = c.env.DEMO_AGENT.idFromName(`demo-session-${sessionId}`)

    return c.json({
      sessionId,
      wsUrl: `/demo/connect?id=${id.toString()}`,
    })
  })
  // Connect to demo agent via WebSocket
  .get('/connect', async (c) => {
    const idString = c.req.query('id')
    if (!idString) {
      return c.text('Missing session ID', 400)
    }

    try {
      // Get the Durable Object stub
      const id = c.env.DEMO_AGENT.idFromString(idString)
      const stub = c.env.DEMO_AGENT.get(id)

      // Forward the request to the Durable Object (WebSocket upgrade)
      return await stub.fetch(c.req.raw)
    } catch (error) {
      console.error('Demo agent connection error:', error)
      return c.text('Failed to connect to demo agent', 500)
    }
  })

export default demo
