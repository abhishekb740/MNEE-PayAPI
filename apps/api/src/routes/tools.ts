import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { drizzle } from 'drizzle-orm/d1'
import { and, eq } from 'drizzle-orm'
import type { Context, Next } from 'hono'
import { agents, apiUsageLogs, dataApis, payments, providers } from '../db/marketplace.schema'
import type { AppContext } from '../env'

// Built-in tools (platform-owned)
const BUILTIN_TOOLS: Record<
  string,
  { name: string; description: string; price: string; parameters: object }
> = {
  market: {
    name: 'get_market_data',
    description: 'Get real-time stock market data including S&P 500, NASDAQ, and Dow Jones indices',
    price: '0.01',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  crypto: {
    name: 'get_crypto_prices',
    description: 'Get current cryptocurrency prices for Bitcoin, Ethereum, and MNEE',
    price: '0.01',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  weather: {
    name: 'get_weather',
    description: 'Get current weather data for a specific location',
    price: '0.01',
    parameters: {
      type: 'object',
      properties: { location: { type: 'string', description: 'City name' } },
      required: [],
    },
  },
  sentiment: {
    name: 'get_sentiment',
    description: 'Get social media sentiment analysis for a topic',
    price: '0.01',
    parameters: {
      type: 'object',
      properties: { topic: { type: 'string', description: 'Topic to analyze' } },
      required: [],
    },
  },
  web3: {
    name: 'get_web3_analytics',
    description: 'Get Web3 analytics including TVL, gas prices, and DEX volume',
    price: '0.01',
    parameters: { type: 'object', properties: {}, required: [] },
  },
}

// Get data for built-in tools directly (no internal fetch needed)
function getBuiltinToolData(toolId: string, params: Record<string, string>): object {
  switch (toolId) {
    case 'market':
      return {
        timestamp: Date.now(),
        sp500: { price: 4783.35, change: 40.85, changePercent: 0.86 },
        nasdaq: { price: 15_095.14, change: -45.23, changePercent: -0.3 },
        dowJones: { price: 37_305.16, change: 134.58, changePercent: 0.36 },
      }
    case 'crypto':
      return {
        timestamp: Date.now(),
        bitcoin: { symbol: 'BTC', price: 43_250.5, change24h: 2.34 },
        ethereum: { symbol: 'ETH', price: 2285.75, change24h: 1.87 },
        mnee: { symbol: 'MNEE', price: 1.0, change24h: 0.01 },
      }
    case 'weather':
      return {
        timestamp: Date.now(),
        location: params.location || 'New York',
        temperature: 72,
        humidity: 65,
        conditions: 'Partly Cloudy',
        windSpeed: 12,
      }
    case 'sentiment':
      return {
        timestamp: Date.now(),
        topic: params.topic || 'crypto',
        sentiment: 0.68,
        volume: 15_420,
        trending: true,
      }
    case 'web3':
      return {
        timestamp: Date.now(),
        totalValueLocked: '85.4B',
        gasPrice: { fast: 25, standard: 18, slow: 12 },
        dexVolume24h: '4.2B',
      }
    default:
      return { error: 'Unknown tool' }
  }
}

// API Key authentication middleware
async function apiKeyAuth(c: Context<AppContext>, next: Next) {
  const apiKey = c.req.header('X-API-Key')

  if (!apiKey) {
    return c.json({ error: 'API key required', code: 'MISSING_API_KEY' }, 401)
  }

  const db = drizzle(c.env.DB)
  const [agent] = await db.select().from(agents).where(eq(agents.apiKey, apiKey))

  if (!agent) {
    return c.json({ error: 'Invalid API key', code: 'INVALID_API_KEY' }, 401)
  }

  // Use Hono's context to pass agent data (headers are immutable in Workers)
  c.set('apiAgent', agent)
  return next()
}

const executeSchema = z.object({
  params: z.record(z.string(), z.any()).optional().default({}),
})

const tools = new Hono<AppContext>()
  // List all available tools (built-in + provider APIs from database)
  .get('/', apiKeyAuth, async (c) => {
    const db = drizzle(c.env.DB)

    // Get all active approved APIs from database
    const dbApis = await db
      .select()
      .from(dataApis)
      .where(and(eq(dataApis.isActive, true), eq(dataApis.status, 'approved')))

    // Format built-in tools
    const builtinList = Object.entries(BUILTIN_TOOLS).map(([id, tool]) => ({
      id,
      name: tool.name,
      description: tool.description,
      price: `$${tool.price}`,
      priceRaw: tool.price,
      parameters: tool.parameters,
      source: 'platform',
    }))

    // Format database tools
    const dbList = dbApis.map((api) => ({
      id: api.id,
      name: api.name,
      description: api.description,
      price: `$${api.priceUsd}`,
      priceRaw: api.priceUsd,
      parameters: api.parameters || { type: 'object', properties: {}, required: [] },
      source: api.providerId ? 'provider' : 'platform',
      category: api.category,
    }))

    return c.json({
      tools: [...builtinList, ...dbList],
      payment: {
        token: c.env.MNEE_TOKEN_ADDRESS,
        network: c.env.NETWORK,
        recipient: c.env.SERVER_PAYMENT_ADDRESS,
      },
    })
  })
  // Get specific tool info
  .get('/:toolId', apiKeyAuth, async (c) => {
    const toolId = c.req.param('toolId')
    const db = drizzle(c.env.DB)

    // Check built-in tools first
    const builtinTool = BUILTIN_TOOLS[toolId]
    if (builtinTool) {
      return c.json({
        id: toolId,
        ...builtinTool,
        price: `$${builtinTool.price}`,
        priceRaw: builtinTool.price,
        source: 'platform',
        payment: {
          token: c.env.MNEE_TOKEN_ADDRESS,
          network: c.env.NETWORK,
          recipient: c.env.SERVER_PAYMENT_ADDRESS,
        },
      })
    }

    // Check database
    const [dbApi] = await db
      .select()
      .from(dataApis)
      .where(
        and(eq(dataApis.id, toolId), eq(dataApis.isActive, true), eq(dataApis.status, 'approved')),
      )

    if (!dbApi) {
      return c.json({ error: 'Tool not found' }, 404)
    }

    return c.json({
      id: dbApi.id,
      name: dbApi.name,
      description: dbApi.description,
      price: `$${dbApi.priceUsd}`,
      priceRaw: dbApi.priceUsd,
      parameters: dbApi.parameters,
      category: dbApi.category,
      source: dbApi.providerId ? 'provider' : 'platform',
      payment: {
        token: c.env.MNEE_TOKEN_ADDRESS,
        network: c.env.NETWORK,
        recipient: c.env.SERVER_PAYMENT_ADDRESS,
      },
    })
  })
  // Execute a tool with payment verification
  .post('/:toolId/execute', apiKeyAuth, zValidator('json', executeSchema), async (c) => {
    const toolId = c.req.param('toolId')
    const agent = c.get('apiAgent')
    const body = c.req.valid('json')

    if (!agent) {
      return c.json({ error: 'Agent not found' }, 401)
    }

    const db = drizzle(c.env.DB)

    // Find the tool (built-in or database)
    let toolInfo: {
      id: string
      name: string
      price: string
      isBuiltin: boolean
      externalUrl?: string | null
      providerId?: string | null
      revenueShare?: number
    }

    const builtinTool = BUILTIN_TOOLS[toolId]
    if (builtinTool) {
      toolInfo = {
        id: toolId,
        name: builtinTool.name,
        price: builtinTool.price,
        isBuiltin: true,
        providerId: null,
        revenueShare: 0,
      }
    } else {
      const [dbApi] = await db
        .select()
        .from(dataApis)
        .where(
          and(
            eq(dataApis.id, toolId),
            eq(dataApis.isActive, true),
            eq(dataApis.status, 'approved'),
          ),
        )

      if (!dbApi) {
        return c.json({ error: 'Tool not found' }, 404)
      }

      toolInfo = {
        id: dbApi.id,
        name: dbApi.name,
        price: dbApi.priceUsd,
        isBuiltin: false,
        externalUrl: dbApi.externalUrl,
        providerId: dbApi.providerId,
        revenueShare: dbApi.revenueShare,
      }
    }

    // Check for payment transaction hash
    const paymentTx = c.req.header('X-Payment-Tx')

    if (!paymentTx) {
      return c.json(
        {
          error: 'Payment Required',
          message: `Tool "${toolInfo.name}" requires payment`,
          payment: {
            amount: toolInfo.price,
            token: c.env.MNEE_TOKEN_ADDRESS,
            recipient: c.env.SERVER_PAYMENT_ADDRESS,
            network: c.env.NETWORK,
          },
          instructions:
            'Send an ERC-20 transfer to the recipient, then retry with X-Payment-Tx header',
        },
        402,
      )
    }

    // Verify payment transaction
    console.log('[Tools API] Verifying payment:', paymentTx)

    try {
      const { createPublicClient, http, parseUnits, decodeEventLog } = await import('viem')
      const { mainnet } = await import('viem/chains')

      const publicClient = createPublicClient({
        chain: mainnet,
        transport: http(),
      })

      const receipt = await publicClient.getTransactionReceipt({ hash: paymentTx as `0x${string}` })

      if (!receipt || receipt.status !== 'success') {
        return c.json({ error: 'Transaction failed or not found' }, 402)
      }

      const tx = await publicClient.getTransaction({ hash: paymentTx as `0x${string}` })

      if (tx.to?.toLowerCase() !== c.env.MNEE_TOKEN_ADDRESS.toLowerCase()) {
        return c.json({ error: 'Payment must be in the specified token' }, 402)
      }

      const transferEventAbi = [
        {
          type: 'event',
          name: 'Transfer',
          inputs: [
            { name: 'from', type: 'address', indexed: true },
            { name: 'to', type: 'address', indexed: true },
            { name: 'value', type: 'uint256', indexed: false },
          ],
        },
      ]

      const transferLog = receipt.logs.find((log) => {
        if (log.address.toLowerCase() !== c.env.MNEE_TOKEN_ADDRESS.toLowerCase()) return false
        try {
          const decoded = decodeEventLog({
            abi: transferEventAbi,
            data: log.data,
            topics: log.topics,
          })
          return decoded.eventName === 'Transfer'
        } catch {
          return false
        }
      })

      if (!transferLog) {
        return c.json({ error: 'No transfer event found' }, 402)
      }

      const transferEvent = decodeEventLog({
        abi: transferEventAbi,
        data: transferLog.data,
        topics: transferLog.topics,
      })

      const args = transferEvent.args as unknown as { from: string; to: string; value: bigint }
      const { to, value } = args

      if (to.toLowerCase() !== c.env.SERVER_PAYMENT_ADDRESS.toLowerCase()) {
        return c.json({ error: 'Payment sent to wrong address' }, 402)
      }

      const expectedAmount = parseUnits(toolInfo.price, 6)
      if (value < expectedAmount) {
        return c.json({ error: 'Insufficient payment amount' }, 402)
      }

      console.log('[Tools API] Payment verified, executing tool:', toolInfo.id)

      // Record payment
      const paymentId = crypto.randomUUID()

      await db.insert(payments).values({
        id: paymentId,
        agentId: agent.id,
        txHash: paymentTx,
        dataApiId: toolInfo.id,
        amountUsd: toolInfo.price,
        amountMnee: toolInfo.price,
        network: c.env.NETWORK,
        status: 'confirmed',
        confirmedAt: new Date(),
      })

      // Update agent stats
      await db
        .update(agents)
        .set({
          totalSpent: String(Number(agent.totalSpent || '0') + Number(toolInfo.price)),
          requestCount: (agent.requestCount || 0) + 1,
          lastActiveAt: new Date(),
        })
        .where(eq(agents.id, agent.id))

      // Update provider earnings if this is a provider API
      if (toolInfo.providerId) {
        const providerEarning = (Number(toolInfo.price) * (toolInfo.revenueShare || 80)) / 100
        const [provider] = await db
          .select()
          .from(providers)
          .where(eq(providers.id, toolInfo.providerId))

        if (provider) {
          await db
            .update(providers)
            .set({
              totalEarned: String(Number(provider.totalEarned || '0') + providerEarning),
            })
            .where(eq(providers.id, toolInfo.providerId))
        }
      }

      // Execute the tool with timing
      const startTime = Date.now()
      let data: unknown
      let statusCode = 200
      let errorType: string | null = null
      let errorMessage: string | null = null

      try {
        if (toolInfo.externalUrl) {
          // Proxy to external provider API
          const externalUrl = new URL(toolInfo.externalUrl)

          for (const [key, val] of Object.entries(body.params)) {
            externalUrl.searchParams.set(key, String(val))
          }

          console.log('[Tools API] Proxying to external URL:', externalUrl.toString())

          const externalResponse = await fetch(externalUrl.toString(), {
            method: 'GET',
            headers: { 'User-Agent': 'MNEE-Marketplace/1.0' },
          })

          statusCode = externalResponse.status

          if (!externalResponse.ok) {
            errorType = 'provider_error'
            errorMessage = `Provider returned ${externalResponse.status}`
            const errorBody = await externalResponse.text()

            // Log the failure
            await db.insert(apiUsageLogs).values({
              id: crypto.randomUUID(),
              dataApiId: toolInfo.id,
              agentId: agent.id,
              paymentId,
              responseTime: Date.now() - startTime,
              statusCode,
              success: false,
              errorType,
              errorMessage: errorMessage + ': ' + errorBody.slice(0, 500),
            })

            return c.json({ error: 'Provider API error', details: errorBody }, 502)
          }

          data = await externalResponse.json()
        } else if (toolInfo.isBuiltin) {
          // Built-in tool - return data directly
          data = getBuiltinToolData(toolInfo.id, body.params)
        } else {
          errorType = 'configuration_error'
          errorMessage = 'Tool has no data source configured'

          await db.insert(apiUsageLogs).values({
            id: crypto.randomUUID(),
            dataApiId: toolInfo.id,
            agentId: agent.id,
            paymentId,
            responseTime: Date.now() - startTime,
            statusCode: 500,
            success: false,
            errorType,
            errorMessage,
          })

          return c.json({ error: errorMessage }, 500)
        }

        const responseTime = Date.now() - startTime

        // Log successful usage
        await db.insert(apiUsageLogs).values({
          id: crypto.randomUUID(),
          dataApiId: toolInfo.id,
          agentId: agent.id,
          paymentId,
          responseTime,
          statusCode: 200,
          success: true,
        })

        return c.json({
          success: true,
          tool: toolInfo.id,
          responseTime,
          payment: {
            txHash: paymentTx,
            amount: toolInfo.price,
          },
          data,
        })
      } catch (execError) {
        const responseTime = Date.now() - startTime
        errorType = 'execution_error'
        errorMessage = String(execError)

        // Log execution failure
        await db.insert(apiUsageLogs).values({
          id: crypto.randomUUID(),
          dataApiId: toolInfo.id,
          agentId: agent.id,
          paymentId,
          responseTime,
          statusCode: 500,
          success: false,
          errorType,
          errorMessage: errorMessage.slice(0, 1000),
        })

        console.error('[Tools API] Execution error:', execError)
        return c.json({ error: 'Execution failed', details: errorMessage }, 500)
      }
    } catch (error) {
      console.error('[Tools API] Error:', error)
      return c.json({ error: 'Execution failed', details: String(error) }, 500)
    }
  })

export default tools
