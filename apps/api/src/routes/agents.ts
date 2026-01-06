import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { drizzle } from 'drizzle-orm/d1'
import { eq } from 'drizzle-orm'
import { agents } from '../db/marketplace.schema'
import type { AppContext } from '../env'

const registerSchema = z.object({
  walletAddress: z.string().startsWith('0x'),
  name: z.string().optional(),
  email: z.string().email().optional(),
})

const agentsRoute = new Hono<AppContext>()
  // Register new agent
  .post('/register', zValidator('json', registerSchema), async (c) => {
    const body = c.req.valid('json')
    const db = drizzle(c.env.DB)

    // Check if agent already exists
    const [existing] = await db
      .select()
      .from(agents)
      .where(eq(agents.walletAddress, body.walletAddress))

    if (existing) {
      return c.json(
        {
          error: 'Agent already registered',
          agentId: existing.id,
          apiKey: existing.apiKey,
          walletAddress: existing.walletAddress,
        },
        400,
      )
    }

    // Create new agent
    const agentId = crypto.randomUUID()
    const apiKey = `mnee_${crypto.randomUUID().replace(/-/g, '')}`

    await db.insert(agents).values({
      id: agentId,
      walletAddress: body.walletAddress,
      name: body.name || null,
      email: body.email || null,
      apiKey,
      totalSpent: '0',
      requestCount: 0,
      lastActiveAt: null,
    })

    return c.json(
      {
        success: true,
        agentId,
        apiKey,
        walletAddress: body.walletAddress,
        message: 'Agent registered successfully',
      },
      201,
    )
  })
  // Get agent by ID
  .get('/:id', async (c) => {
    const id = c.req.param('id')
    const db = drizzle(c.env.DB)

    const [agent] = await db.select().from(agents).where(eq(agents.id, id))

    if (!agent) {
      return c.json({ error: 'Agent not found' }, 404)
    }

    return c.json({
      id: agent.id,
      walletAddress: agent.walletAddress,
      name: agent.name,
      email: agent.email,
      totalSpent: agent.totalSpent,
      requestCount: agent.requestCount,
      lastActiveAt: agent.lastActiveAt,
      createdAt: agent.createdAt,
    })
  })
  // Get agent stats
  .get('/:id/stats', async (c) => {
    const id = c.req.param('id')
    const db = drizzle(c.env.DB)

    const [agent] = await db.select().from(agents).where(eq(agents.id, id))

    if (!agent) {
      return c.json({ error: 'Agent not found' }, 404)
    }

    return c.json({
      totalSpent: agent.totalSpent,
      requestCount: agent.requestCount,
      lastActiveAt: agent.lastActiveAt,
    })
  })

export default agentsRoute
