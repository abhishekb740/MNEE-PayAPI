import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import { apiUsageLogs } from '../db/marketplace.schema'
import type { AppContext } from '../env'

// Helper to log API usage
async function logUsage(c: any, dataApiId: string) {
  try {
    const db = drizzle(c.env.DB)
    const agentId = c.req.header('X-Agent-ID') || 'anonymous'

    // Don't pass createdAt - let database default handle it
    await db.insert(apiUsageLogs).values({
      id: crypto.randomUUID(),
      dataApiId,
      agentId,
      paymentId: null,
      responseTime: 0,
      statusCode: 200,
    })
  } catch (error) {
    console.error('Failed to log usage:', error)
  }
}

const data = new Hono<AppContext>()

// Pricing configuration for each endpoint (in token, 6 decimals)
// Lowered for testing with limited funds
const PRICING: Record<string, { price: string; description: string }> = {
  '/market': { price: '0.01', description: 'Real-time stock market data' },
  '/crypto': { price: '0.01', description: 'Cryptocurrency prices' },
  '/weather': { price: '0.01', description: 'Weather data' },
  '/sentiment': { price: '0.01', description: 'Market sentiment analysis' },
  '/web3': { price: '0.01', description: 'Web3 analytics' },
}

// Payment verification middleware
data.use('/*', async (c, next) => {
  console.log('[Data API] Request:', c.req.method, c.req.path)
  console.log('[Data API] Headers:', Object.fromEntries(c.req.raw.headers.entries()))

  // Skip root endpoint
  if (c.req.path === '/data' || c.req.path === '/data/') {
    return next()
  }

  // Extract endpoint from path
  const endpoint = c.req.path.replace('/data', '')
  const pricing = PRICING[endpoint]

  if (!pricing) {
    return next() // Unknown endpoint, let it 404
  }

  // Check for payment transaction hash
  const paymentTx = c.req.header('X-Payment-Tx')

  if (!paymentTx) {
    // No payment provided, return 402 Payment Required
    console.log('[Data API] No payment found, returning 402')
    return c.json(
      {
        error: 'Payment Required',
        message: 'This endpoint requires payment',
        payment: {
          amount: pricing.price,
          token: c.env.MNEE_TOKEN_ADDRESS,
          recipient: c.env.SERVER_PAYMENT_ADDRESS,
          network: c.env.NETWORK,
          description: pricing.description,
        },
      },
      402,
    )
  }

  // Verify payment transaction
  console.log('[Data API] Verifying payment transaction:', paymentTx)

  try {
    const { createPublicClient, http, parseUnits, decodeEventLog } = await import('viem')
    const { mainnet } = await import('viem/chains')

    const publicClient = createPublicClient({
      chain: mainnet,
      transport: http(),
    })

    // Get transaction receipt
    const receipt = await publicClient.getTransactionReceipt({ hash: paymentTx as `0x${string}` })

    if (!receipt || receipt.status !== 'success') {
      console.error('[Data API] Transaction failed or not found')
      return c.json({ error: 'Invalid payment transaction' }, 402)
    }

    // Verify transaction is to the payment token contract
    const tx = await publicClient.getTransaction({ hash: paymentTx as `0x${string}` })

    if (tx.to?.toLowerCase() !== c.env.MNEE_TOKEN_ADDRESS.toLowerCase()) {
      console.error('[Data API] Transaction is not to payment token contract')
      return c.json({ error: 'Payment must be in the specified token' }, 402)
    }

    // Decode Transfer event from logs to verify recipient and amount
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

    // Find Transfer event in logs
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
      console.error('[Data API] No Transfer event found')
      return c.json({ error: 'Invalid payment: no transfer event' }, 402)
    }

    // Decode the transfer event
    const transferEvent = decodeEventLog({
      abi: transferEventAbi,
      data: transferLog.data,
      topics: transferLog.topics,
    })

    const args = transferEvent.args as unknown as { from: string; to: string; value: bigint }
    const { to, value } = args

    // Verify recipient is the server payment address
    if (to.toLowerCase() !== c.env.SERVER_PAYMENT_ADDRESS.toLowerCase()) {
      console.error('[Data API] Payment sent to wrong address:', to)
      return c.json({ error: 'Payment must be sent to server address' }, 402)
    }

    // Verify amount
    const expectedAmount = parseUnits(pricing.price, 6)
    if (value < expectedAmount) {
      console.error(
        '[Data API] Insufficient amount:',
        value.toString(),
        'expected:',
        expectedAmount.toString(),
      )
      return c.json({ error: 'Insufficient payment amount' }, 402)
    }

    console.log('[Data API] Payment verified:', {
      tx: paymentTx,
      to,
      amount: value.toString(),
    })

    return next()
  } catch (error) {
    console.error('[Data API] Payment verification error:', error)
    return c.json({ error: 'Payment verification failed' }, 402)
  }
})

data
  // Market Data API - Stock indices
  .get('/market', async (c) => {
    await logUsage(c, 'market-data')

    return c.json({
      timestamp: Date.now(),
      data: {
        sp500: {
          price: 4783.35,
          change: 40.85,
          changePercent: 0.86,
          volume: 3_245_678_900,
        },
        nasdaq: {
          price: 15_095.14,
          change: -45.23,
          changePercent: -0.3,
          volume: 4_567_890_123,
        },
        dowJones: {
          price: 37_305.16,
          change: 134.58,
          changePercent: 0.36,
          volume: 2_876_543_210,
        },
      },
    })
  })
  // Crypto Prices API
  .get('/crypto', async (c) => {
    await logUsage(c, 'crypto-prices')

    return c.json({
      timestamp: Date.now(),
      data: {
        bitcoin: {
          symbol: 'BTC',
          price: 43_250.5,
          marketCap: 847_000_000_000,
          volume24h: 28_500_000_000,
          change24h: 2.34,
        },
        ethereum: {
          symbol: 'ETH',
          price: 2285.75,
          marketCap: 275_000_000_000,
          volume24h: 15_200_000_000,
          change24h: 1.87,
        },
        mnee: {
          symbol: 'MNEE',
          price: 1.0,
          marketCap: 103_412_221,
          volume24h: 850_000,
          change24h: 0.01,
        },
      },
    })
  })
  // Weather Data API
  .get('/weather', async (c) => {
    const location = c.req.query('location') || 'New York'
    await logUsage(c, 'weather-data')

    return c.json({
      timestamp: Date.now(),
      location,
      data: {
        temperature: 72,
        feelsLike: 70,
        humidity: 65,
        conditions: 'Partly Cloudy',
        windSpeed: 12,
        windDirection: 'NW',
        pressure: 1013,
        visibility: 10,
      },
    })
  })
  // Social Sentiment API
  .get('/sentiment', async (c) => {
    const topic = c.req.query('topic') || 'crypto'
    await logUsage(c, 'social-sentiment')

    return c.json({
      timestamp: Date.now(),
      topic,
      data: {
        sentiment: 0.68, // -1 to 1
        volume: 15_420,
        trending: true,
        keywords: ['bullish', 'adoption', 'innovation', 'growth'],
        sources: {
          twitter: { sentiment: 0.72, volume: 8900 },
          reddit: { sentiment: 0.65, volume: 4200 },
          news: { sentiment: 0.64, volume: 2320 },
        },
      },
    })
  })
  // Web3 Analytics API
  .get('/web3', async (c) => {
    await logUsage(c, 'web3-analytics')

    return c.json({
      timestamp: Date.now(),
      data: {
        totalValueLocked: '85.4B',
        tvlChange24h: 2.3,
        activeAddresses24h: 1_250_000,
        transactions24h: 3_456_789,
        gasPrice: {
          ethereum: { fast: 25, standard: 18, slow: 12 },
          polygon: { fast: 35, standard: 28, slow: 20 },
        },
        dexVolume24h: '4.2B',
        topProtocols: [
          { name: 'Uniswap', tvl: '5.2B', volume24h: '1.8B' },
          { name: 'Aave', tvl: '8.1B', volume24h: '320M' },
          { name: 'Curve', tvl: '4.3B', volume24h: '890M' },
        ],
      },
    })
  })
  // List all available APIs (hardcoded for public listing)
  .get('/', (c) => {
    // Return hardcoded list based on PRICING config
    const apis = [
      {
        id: 'market',
        name: 'Market Data API',
        description: 'Real-time stock market data including S&P 500, NASDAQ, and Dow Jones',
        endpoint: '/api/data/market',
        price: '$0.01',
        category: 'finance',
      },
      {
        id: 'crypto',
        name: 'Crypto Prices API',
        description: 'Current cryptocurrency prices for Bitcoin, Ethereum, and MNEE',
        endpoint: '/api/data/crypto',
        price: '$0.01',
        category: 'crypto',
      },
      {
        id: 'weather',
        name: 'Weather Data API',
        description: 'Current weather data for any location worldwide',
        endpoint: '/api/data/weather',
        price: '$0.01',
        category: 'weather',
      },
      {
        id: 'sentiment',
        name: 'Social Sentiment API',
        description: 'Social media sentiment analysis for any topic',
        endpoint: '/api/data/sentiment',
        price: '$0.01',
        category: 'ai',
      },
      {
        id: 'web3',
        name: 'Web3 Analytics API',
        description: 'Web3 analytics including TVL, gas prices, and DEX volume',
        endpoint: '/api/data/web3',
        price: '$0.01',
        category: 'crypto',
      },
    ]

    return c.json({ apis })
  })

export default data
