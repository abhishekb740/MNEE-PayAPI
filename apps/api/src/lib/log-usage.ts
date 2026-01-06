import type { Context } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import type { AppContext } from '../env'
import { apiUsageLogs } from '../db/marketplace.schema'

export async function logApiUsage(
  c: Context<AppContext>,
  dataApiId: string,
  statusCode = 200,
  paymentId?: string,
) {
  try {
    const db = drizzle(c.env.DB)
    const startTime = Date.now()

    // Get agent ID from header or use 'anonymous'
    const agentId = c.req.header('X-Agent-ID') || 'anonymous'

    await db.insert(apiUsageLogs).values({
      id: crypto.randomUUID(),
      dataApiId,
      agentId,
      paymentId: paymentId || null,
      responseTime: Date.now() - startTime,
      statusCode,
    })
  } catch (error) {
    // Don't fail the request if logging fails
    console.error('Failed to log API usage:', error)
  }
}
