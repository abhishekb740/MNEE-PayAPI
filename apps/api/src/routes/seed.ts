import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import type { AppContext } from '../env'
import { dataApis } from '../db/marketplace.schema'

const seedRoutes = new Hono<AppContext>()

const seedData = [
  {
    id: 'market-data',
    name: 'Market Data API',
    description:
      'Real-time stock market data including S&P 500, NASDAQ, and Dow Jones indices with price changes and percentages.',
    endpoint: '/market',
    priceUsd: '0.05',
    category: 'finance',
    network: 'mainnet' as const,
    isActive: true,
  },
  {
    id: 'crypto-prices',
    name: 'Crypto Prices API',
    description:
      'Live cryptocurrency prices, market caps, and 24h trading volumes for Bitcoin, Ethereum, MNEE and other major tokens.',
    endpoint: '/crypto',
    priceUsd: '0.03',
    category: 'crypto',
    network: 'mainnet' as const,
    isActive: true,
  },
  {
    id: 'weather-data',
    name: 'Weather Data API',
    description:
      'Current weather conditions including temperature, humidity, wind speed and conditions for any location worldwide.',
    endpoint: '/weather',
    priceUsd: '0.02',
    category: 'weather',
    network: 'mainnet' as const,
    isActive: true,
  },
  {
    id: 'social-sentiment',
    name: 'Social Sentiment API',
    description:
      'AI-powered sentiment analysis of social media discussions with volume metrics, trending status, and keyword extraction.',
    endpoint: '/sentiment',
    priceUsd: '0.10',
    category: 'analytics',
    network: 'mainnet' as const,
    isActive: true,
  },
  {
    id: 'web3-analytics',
    name: 'Web3 Analytics API',
    description:
      'Comprehensive Web3 protocol metrics including TVL, active addresses, gas prices, and DEX trading volumes.',
    endpoint: '/web3',
    priceUsd: '0.08',
    category: 'crypto',
    network: 'mainnet' as const,
    isActive: true,
  },
]

seedRoutes.get('/', async (c) => {
  try {
    const db = drizzle(c.env.DB)

    // Insert data APIs
    for (const api of seedData) {
      await db.insert(dataApis).values(api).onConflictDoNothing()
    }

    return c.json({
      success: true,
      message: 'Marketplace seeded successfully!',
      seeded: seedData.length,
      apis: seedData.map((api) => ({ name: api.name, endpoint: api.endpoint })),
    })
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      500,
    )
  }
})

export { seedRoutes }
