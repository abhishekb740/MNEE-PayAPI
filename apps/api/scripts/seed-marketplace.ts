import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { dataApis } from '../src/db/marketplace.schema'

// Connect to local SQLite database
const sqlite = new Database(
  '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/mnee-marketplace-db.sqlite',
)
const db = drizzle(sqlite)

const seedData = [
  {
    id: 'market-data',
    name: 'Market Data API',
    description:
      'Real-time stock market data including S&P 500, NASDAQ, and Dow Jones indices with price changes and percentages.',
    endpoint: '/market',
    priceUsd: '0.05',
    category: 'finance',
    network: 'mainnet',
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
    network: 'mainnet',
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
    network: 'mainnet',
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
    network: 'mainnet',
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
    network: 'mainnet',
    isActive: true,
  },
]

async function seed() {
  console.log('🌱 Seeding marketplace data...')

  try {
    // Insert data APIs
    for (const api of seedData) {
      await db.insert(dataApis).values(api).onConflictDoNothing()
      console.log(`✅ Seeded: ${api.name} (${api.endpoint})`)
    }

    console.log('\n✨ Marketplace seeded successfully!')
    console.log(`📊 Total APIs: ${seedData.length}`)
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  }
}

seed()
