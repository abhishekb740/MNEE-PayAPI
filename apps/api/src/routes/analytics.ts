import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import { and, desc, eq, gte, inArray } from 'drizzle-orm'
import { agents, apiUsageLogs, dataApis, payments, providers } from '../db/marketplace.schema'
import type { AppContext } from '../env'

// Helper to calculate percentile from sorted array
function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const index = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, index)]
}

// Helper to get time filter
function getTimeFilter(period: string): Date {
  const now = new Date()
  switch (period) {
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000)
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    default:
      return new Date(0) // All time
  }
}

const analytics = new Hono<AppContext>()
  // Platform overview with reliability metrics
  .get('/overview', async (c) => {
    const db = drizzle(c.env.DB)
    const period = c.req.query('period') || 'all'
    const since = getTimeFilter(period)

    // Get usage logs with time filter
    const logs = await db.select().from(apiUsageLogs).where(gte(apiUsageLogs.createdAt, since))

    const uniqueAgents = new Set(logs.map((log) => log.agentId)).size
    const successfulLogs = logs.filter((log) => log.success)
    const failedLogs = logs.filter((log) => !log.success)

    // Calculate latency percentiles from successful requests
    const responseTimes = successfulLogs
      .map((log) => log.responseTime)
      .filter((t): t is number => t !== null && t > 0)

    // Get confirmed payments for revenue
    const confirmedPayments = await db
      .select()
      .from(payments)
      .where(and(eq(payments.status, 'confirmed'), gte(payments.createdAt, since)))

    const totalRevenue = confirmedPayments.reduce(
      (sum: number, p) => sum + Number.parseFloat(p.amountUsd),
      0,
    )

    // Top APIs by usage count
    const apiCounts = logs.reduce(
      (acc, log) => {
        acc[log.dataApiId] = (acc[log.dataApiId] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const topApis = Object.entries(apiCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([apiId, count]) => ({ apiId, count }))

    // Error breakdown
    const errorCounts = failedLogs.reduce(
      (acc, log) => {
        const type = log.errorType || 'unknown'
        acc[type] = (acc[type] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return c.json({
      period,
      totalRevenue: totalRevenue.toFixed(2),
      totalRequests: logs.length,
      successfulRequests: successfulLogs.length,
      failedRequests: failedLogs.length,
      successRate:
        logs.length > 0 ? ((successfulLogs.length / logs.length) * 100).toFixed(1) : '100',
      uniqueAgents,
      latency: {
        p50: Math.round(percentile(responseTimes, 50)),
        p95: Math.round(percentile(responseTimes, 95)),
        p99: Math.round(percentile(responseTimes, 99)),
        avg:
          responseTimes.length > 0
            ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
            : 0,
      },
      topApis,
      errorBreakdown: errorCounts,
    })
  })
  // Recent activity feed
  .get('/activity', async (c) => {
    const db = drizzle(c.env.DB)
    const limit = Math.min(Number(c.req.query('limit')) || 20, 100)

    const recentLogs = await db
      .select()
      .from(apiUsageLogs)
      .orderBy(desc(apiUsageLogs.createdAt))
      .limit(limit)

    return c.json({
      activity: recentLogs.map((log) => ({
        id: log.id,
        toolId: log.dataApiId,
        agentId: log.agentId.slice(0, 8) + '...',
        success: log.success,
        responseTime: log.responseTime,
        errorType: log.errorType,
        createdAt: log.createdAt,
      })),
    })
  })
  // Per-tool reliability stats
  .get('/tools/:toolId/stats', async (c) => {
    const toolId = c.req.param('toolId')
    const period = c.req.query('period') || '7d'
    const since = getTimeFilter(period)
    const db = drizzle(c.env.DB)

    const logs = await db
      .select()
      .from(apiUsageLogs)
      .where(and(eq(apiUsageLogs.dataApiId, toolId), gte(apiUsageLogs.createdAt, since)))

    const successfulLogs = logs.filter((log) => log.success)
    const responseTimes = successfulLogs
      .map((log) => log.responseTime)
      .filter((t): t is number => t !== null && t > 0)

    const toolPayments = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.dataApiId, toolId),
          eq(payments.status, 'confirmed'),
          gte(payments.createdAt, since),
        ),
      )

    const revenue = toolPayments.reduce((sum, p) => sum + Number.parseFloat(p.amountUsd), 0)

    return c.json({
      toolId,
      period,
      totalRequests: logs.length,
      successfulRequests: successfulLogs.length,
      failedRequests: logs.length - successfulLogs.length,
      successRate:
        logs.length > 0 ? ((successfulLogs.length / logs.length) * 100).toFixed(1) : '100',
      revenue: revenue.toFixed(2),
      latency: {
        p50: Math.round(percentile(responseTimes, 50)),
        p95: Math.round(percentile(responseTimes, 95)),
        p99: Math.round(percentile(responseTimes, 99)),
        avg:
          responseTimes.length > 0
            ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
            : 0,
      },
      uniqueAgents: new Set(logs.map((l) => l.agentId)).size,
    })
  })
  .get('/apis/:apiId', async (c) => {
    const apiId = c.req.param('apiId')
    const db = drizzle(c.env.DB)

    const [api] = await db.select().from(dataApis).where(eq(dataApis.id, apiId))

    if (!api) {
      return c.json({ error: 'API not found' }, 404)
    }

    const logs = await db.select().from(apiUsageLogs).where(eq(apiUsageLogs.dataApiId, apiId))

    const apiPayments = await db
      .select()
      .from(payments)
      .where(and(eq(payments.dataApiId, apiId), eq(payments.status, 'confirmed')))

    const revenue = apiPayments.reduce((sum: number, p) => sum + Number.parseFloat(p.amountUsd), 0)

    return c.json({
      api: {
        id: api.id,
        name: api.name,
        price: api.priceUsd,
      },
      requestCount: logs.length,
      revenue: revenue.toFixed(2),
    })
  })
  // Get analytics for specific agents (by API keys)
  .post('/my-agents', async (c) => {
    const db = drizzle(c.env.DB)
    const body = await c.req.json<{ apiKeys: string[]; period?: string }>()
    const period = body.period || 'all'
    const since = getTimeFilter(period)

    if (!body.apiKeys || body.apiKeys.length === 0) {
      return c.json({
        agents: [],
        totals: {
          spent: '0.00',
          requests: 0,
          successRate: '100',
          latency: { p50: 0, p95: 0, avg: 0 },
        },
      })
    }

    // Get agents by API keys
    const agentsList = await db
      .select()
      .from(agents)
      .where(
        inArray(
          agents.apiKey,
          body.apiKeys.filter((k) => k.startsWith('mnee_')),
        ),
      )

    if (agentsList.length === 0) {
      return c.json({
        agents: [],
        totals: {
          spent: '0.00',
          requests: 0,
          successRate: '100',
          latency: { p50: 0, p95: 0, avg: 0 },
        },
      })
    }

    const agentIds = agentsList.map((a) => a.id)

    // Get usage logs for these agents with time filter
    const logs = await db
      .select()
      .from(apiUsageLogs)
      .where(and(inArray(apiUsageLogs.agentId, agentIds), gte(apiUsageLogs.createdAt, since)))

    // Get payments for these agents
    const agentPayments = await db
      .select()
      .from(payments)
      .where(
        and(
          inArray(payments.agentId, agentIds),
          eq(payments.status, 'confirmed'),
          gte(payments.createdAt, since),
        ),
      )

    // Calculate per-agent stats with reliability metrics
    const agentStats = agentsList.map((agent) => {
      const agentLogs = logs.filter((l) => l.agentId === agent.id)
      const successfulLogs = agentLogs.filter((l) => l.success)
      const failedLogs = agentLogs.filter((l) => !l.success)
      const agentPays = agentPayments.filter((p) => p.agentId === agent.id)
      const spent = agentPays.reduce((sum, p) => sum + Number.parseFloat(p.amountUsd), 0)

      // Latency from successful requests
      const responseTimes = successfulLogs
        .map((log) => log.responseTime)
        .filter((t): t is number => t !== null && t > 0)

      // Top tools used by this agent
      const toolCounts = agentLogs.reduce(
        (acc, log) => {
          acc[log.dataApiId] = (acc[log.dataApiId] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      const topTools = Object.entries(toolCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([toolId, count]) => ({ toolId, count }))

      return {
        id: agent.id,
        name: agent.name,
        walletAddress: agent.walletAddress,
        totalSpent: spent.toFixed(2),
        requestCount: agentLogs.length,
        successCount: successfulLogs.length,
        failedCount: failedLogs.length,
        successRate:
          agentLogs.length > 0
            ? ((successfulLogs.length / agentLogs.length) * 100).toFixed(1)
            : '100',
        latency: {
          p50: Math.round(percentile(responseTimes, 50)),
          p95: Math.round(percentile(responseTimes, 95)),
          avg:
            responseTimes.length > 0
              ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
              : 0,
        },
        lastActiveAt: agent.lastActiveAt,
        topTools,
      }
    })

    // Overall totals
    const totalSpent = agentPayments.reduce((sum, p) => sum + Number.parseFloat(p.amountUsd), 0)
    const allSuccessful = logs.filter((l) => l.success)
    const allResponseTimes = allSuccessful
      .map((log) => log.responseTime)
      .filter((t): t is number => t !== null && t > 0)

    return c.json({
      period,
      agents: agentStats,
      totals: {
        spent: totalSpent.toFixed(2),
        requests: logs.length,
        successful: allSuccessful.length,
        failed: logs.length - allSuccessful.length,
        successRate:
          logs.length > 0 ? ((allSuccessful.length / logs.length) * 100).toFixed(1) : '100',
        latency: {
          p50: Math.round(percentile(allResponseTimes, 50)),
          p95: Math.round(percentile(allResponseTimes, 95)),
          avg:
            allResponseTimes.length > 0
              ? Math.round(allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length)
              : 0,
        },
      },
    })
  })
  // Get analytics for provider (by provider API key)
  .get('/my-provider', async (c) => {
    const db = drizzle(c.env.DB)
    const providerKey = c.req.header('X-Provider-Key')
    const period = c.req.query('period') || 'all'
    const since = getTimeFilter(period)

    if (!providerKey) {
      return c.json({ error: 'Provider key required' }, 401)
    }

    // Get provider by API key
    const [provider] = await db.select().from(providers).where(eq(providers.apiKey, providerKey))

    if (!provider) {
      return c.json({ error: 'Provider not found' }, 404)
    }

    // Get provider's APIs
    const providerApis = await db
      .select()
      .from(dataApis)
      .where(eq(dataApis.providerId, provider.id))

    if (providerApis.length === 0) {
      return c.json({
        period,
        provider: {
          id: provider.id,
          name: provider.name,
          totalEarned: provider.totalEarned || '0.00',
        },
        apis: [],
        totals: {
          earned: '0.00',
          requests: 0,
          successRate: '100',
          latency: { p50: 0, p95: 0, avg: 0 },
        },
      })
    }

    const apiIds = providerApis.map((a) => a.id)

    // Get usage logs for these APIs with time filter
    const logs = await db
      .select()
      .from(apiUsageLogs)
      .where(and(inArray(apiUsageLogs.dataApiId, apiIds), gte(apiUsageLogs.createdAt, since)))

    // Get payments for these APIs
    const apiPayments = await db
      .select()
      .from(payments)
      .where(
        and(
          inArray(payments.dataApiId, apiIds),
          eq(payments.status, 'confirmed'),
          gte(payments.createdAt, since),
        ),
      )

    // Calculate per-API stats with reliability metrics
    const apiStats = providerApis.map((api) => {
      const apiLogs = logs.filter((l) => l.dataApiId === api.id)
      const successfulLogs = apiLogs.filter((l) => l.success)
      const apiPays = apiPayments.filter((p) => p.dataApiId === api.id)
      const revenue = apiPays.reduce((sum, p) => sum + Number.parseFloat(p.amountUsd), 0)
      const providerEarning = revenue * ((api.revenueShare || 80) / 100)

      // Latency from successful requests
      const responseTimes = successfulLogs
        .map((log) => log.responseTime)
        .filter((t): t is number => t !== null && t > 0)

      return {
        id: api.id,
        name: api.name,
        price: api.priceUsd,
        requestCount: apiLogs.length,
        successCount: successfulLogs.length,
        failedCount: apiLogs.length - successfulLogs.length,
        successRate:
          apiLogs.length > 0 ? ((successfulLogs.length / apiLogs.length) * 100).toFixed(1) : '100',
        latency: {
          p50: Math.round(percentile(responseTimes, 50)),
          p95: Math.round(percentile(responseTimes, 95)),
          avg:
            responseTimes.length > 0
              ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
              : 0,
        },
        revenue: revenue.toFixed(2),
        earned: providerEarning.toFixed(2),
        isActive: api.isActive,
        status: api.status,
      }
    })

    // Overall totals
    const totalRevenue = apiPayments.reduce((sum, p) => sum + Number.parseFloat(p.amountUsd), 0)
    const avgRevenueShare =
      providerApis.reduce((sum, api) => sum + (api.revenueShare || 80), 0) / providerApis.length
    const totalEarned = totalRevenue * (avgRevenueShare / 100)
    const allSuccessful = logs.filter((l) => l.success)
    const allResponseTimes = allSuccessful
      .map((log) => log.responseTime)
      .filter((t): t is number => t !== null && t > 0)

    return c.json({
      period,
      provider: {
        id: provider.id,
        name: provider.name,
        totalEarned: provider.totalEarned || '0.00',
      },
      apis: apiStats,
      totals: {
        earned: totalEarned.toFixed(2),
        requests: logs.length,
        successful: allSuccessful.length,
        failed: logs.length - allSuccessful.length,
        successRate:
          logs.length > 0 ? ((allSuccessful.length / logs.length) * 100).toFixed(1) : '100',
        latency: {
          p50: Math.round(percentile(allResponseTimes, 50)),
          p95: Math.round(percentile(allResponseTimes, 95)),
          avg:
            allResponseTimes.length > 0
              ? Math.round(allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length)
              : 0,
        },
      },
    })
  })

export default analytics
