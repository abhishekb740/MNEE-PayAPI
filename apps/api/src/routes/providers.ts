import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { drizzle } from 'drizzle-orm/d1'
import { and, eq } from 'drizzle-orm'
import { dataApis, payments, providers } from '../db/marketplace.schema'
import type { AppContext } from '../env'

const registerProviderSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  walletAddress: z.string().startsWith('0x'),
})

const submitApiSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  externalUrl: z.string().url(),
  priceUsd: z.string().regex(/^\d+\.?\d*$/),
  category: z.enum(['finance', 'crypto', 'weather', 'ai', 'data', 'other']),
  method: z.enum(['GET', 'POST']).default('GET'),
  headers: z.record(z.string(), z.string()).optional(),
  parameters: z
    .object({
      type: z.literal('object'),
      properties: z.record(
        z.string(),
        z.object({
          type: z.string(),
          description: z.string().optional(),
        }),
      ),
      required: z.array(z.string()).optional(),
    })
    .optional(),
  exampleResponse: z.any().optional(),
})

const providersRoute = new Hono<AppContext>()
  // Register as a provider (requires auth)
  .post('/register', zValidator('json', registerProviderSchema), async (c) => {
    const body = c.req.valid('json')
    const db = drizzle(c.env.DB)

    // Get user from session (simplified - in production use proper auth middleware)
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ error: 'Authentication required' }, 401)
    }

    // For hackathon, use wallet address as userId
    const userId = body.walletAddress

    // Check if already registered
    const [existing] = await db.select().from(providers).where(eq(providers.userId, userId))

    if (existing) {
      return c.json({
        error: 'Already registered as provider',
        providerId: existing.id,
        apiKey: existing.apiKey,
      })
    }

    const providerId = crypto.randomUUID()
    const apiKey = `prov_${crypto.randomUUID().replace(/-/g, '')}`

    await db.insert(providers).values({
      id: providerId,
      userId,
      name: body.name,
      email: body.email,
      walletAddress: body.walletAddress,
      apiKey,
      status: 'approved', // Auto-approve for hackathon
    })

    return c.json({
      success: true,
      providerId,
      apiKey,
      message: 'Provider account created',
    })
  })

  // Submit a new API (requires provider API key)
  .post('/apis', zValidator('json', submitApiSchema), async (c) => {
    const providerApiKey = c.req.header('X-Provider-Key')
    if (!providerApiKey) {
      return c.json({ error: 'Provider API key required' }, 401)
    }

    const db = drizzle(c.env.DB)
    const [provider] = await db.select().from(providers).where(eq(providers.apiKey, providerApiKey))

    if (!provider) {
      return c.json({ error: 'Invalid provider API key' }, 401)
    }

    if (provider.status !== 'approved') {
      return c.json({ error: 'Provider account not approved' }, 403)
    }

    const body = c.req.valid('json')
    const apiId = `${provider.id.slice(0, 8)}-${body.name.toLowerCase().replace(/\s+/g, '-')}`
    const endpoint = `/api/tools/${apiId}`

    // Check if endpoint already exists
    const [existingApi] = await db.select().from(dataApis).where(eq(dataApis.endpoint, endpoint))

    if (existingApi) {
      return c.json({ error: 'API with this name already exists' }, 400)
    }

    await db.insert(dataApis).values({
      id: apiId,
      providerId: provider.id,
      name: body.name,
      description: body.description,
      endpoint,
      externalUrl: body.externalUrl,
      priceUsd: body.priceUsd,
      category: body.category,
      method: body.method,
      headers: body.headers || null,
      parameters: body.parameters || { type: 'object', properties: {}, required: [] },
      exampleResponse: body.exampleResponse || null,
      status: 'approved', // Auto-approve for hackathon
      isActive: true,
    })

    return c.json({
      success: true,
      apiId,
      endpoint,
      message: 'API submitted and approved',
    })
  })

  // Get provider dashboard data
  .get('/dashboard', async (c) => {
    const providerApiKey = c.req.header('X-Provider-Key')
    if (!providerApiKey) {
      return c.json({ error: 'Provider API key required' }, 401)
    }

    const db = drizzle(c.env.DB)
    const [provider] = await db.select().from(providers).where(eq(providers.apiKey, providerApiKey))

    if (!provider) {
      return c.json({ error: 'Invalid provider API key' }, 401)
    }

    // Get provider's APIs
    const apis = await db.select().from(dataApis).where(eq(dataApis.providerId, provider.id))

    // Get earnings from payments for provider's APIs
    const apiIds = apis.map((a) => a.id)
    let totalEarnings = 0
    let totalRequests = 0

    for (const apiId of apiIds) {
      const apiPayments = await db
        .select()
        .from(payments)
        .where(and(eq(payments.dataApiId, apiId), eq(payments.status, 'confirmed')))

      const api = apis.find((a) => a.id === apiId)
      const revenueShare = (api?.revenueShare || 80) / 100

      for (const payment of apiPayments) {
        totalEarnings += Number.parseFloat(payment.amountUsd) * revenueShare
        totalRequests++
      }
    }

    return c.json({
      provider: {
        id: provider.id,
        name: provider.name,
        email: provider.email,
        walletAddress: provider.walletAddress,
        status: provider.status,
      },
      stats: {
        totalEarnings: totalEarnings.toFixed(2),
        totalRequests,
        apiCount: apis.length,
      },
      apis: apis.map((api) => ({
        id: api.id,
        name: api.name,
        endpoint: api.endpoint,
        price: api.priceUsd,
        status: api.status,
        isActive: api.isActive,
      })),
    })
  })

  // List provider's APIs
  .get('/apis', async (c) => {
    const providerApiKey = c.req.header('X-Provider-Key')
    if (!providerApiKey) {
      return c.json({ error: 'Provider API key required' }, 401)
    }

    const db = drizzle(c.env.DB)
    const [provider] = await db.select().from(providers).where(eq(providers.apiKey, providerApiKey))

    if (!provider) {
      return c.json({ error: 'Invalid provider API key' }, 401)
    }

    const apis = await db.select().from(dataApis).where(eq(dataApis.providerId, provider.id))

    return c.json({ apis })
  })

  // Update API status (active/inactive)
  .patch('/apis/:apiId', async (c) => {
    const providerApiKey = c.req.header('X-Provider-Key')
    if (!providerApiKey) {
      return c.json({ error: 'Provider API key required' }, 401)
    }

    const apiId = c.req.param('apiId')
    const body = await c.req.json()

    const db = drizzle(c.env.DB)
    const [provider] = await db.select().from(providers).where(eq(providers.apiKey, providerApiKey))

    if (!provider) {
      return c.json({ error: 'Invalid provider API key' }, 401)
    }

    const [api] = await db
      .select()
      .from(dataApis)
      .where(and(eq(dataApis.id, apiId), eq(dataApis.providerId, provider.id)))

    if (!api) {
      return c.json({ error: 'API not found or not owned by you' }, 404)
    }

    await db
      .update(dataApis)
      .set({
        isActive: body.isActive ?? api.isActive,
        priceUsd: body.priceUsd ?? api.priceUsd,
      })
      .where(eq(dataApis.id, apiId))

    return c.json({ success: true, message: 'API updated' })
  })

export default providersRoute
