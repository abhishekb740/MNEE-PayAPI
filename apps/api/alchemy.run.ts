import path from 'node:path'
import { config } from '@repo/config'
import alchemy from 'alchemy'
import { D1Database, DurableObjectNamespace, KVNamespace, Worker } from 'alchemy/cloudflare'

const app = await alchemy(`${config.appName}-api`, {
  password: process.env.ALCHEMY_PASSWORD,
})

const db = await D1Database('db', {
  name: `${config.appName}-db`,
  adopt: true,
  migrationsDir: path.join(import.meta.dirname, 'drizzle'),
})

const kv = await KVNamespace('kv', {
  title: `${config.appName}-sessions`,
})

const demoAgent = DurableObjectNamespace('demoAgent', {
  className: 'DemoAgent',
  sqlite: true,
})

export const api = await Worker('worker', {
  name: `${config.appName}-api`,
  entrypoint: path.join(import.meta.dirname, 'src', 'index.ts'),
  bindings: {
    DB: db,
    KV: kv,
    DEMO_AGENT: demoAgent,

    // Direct Blockchain Payment Configuration (Ethereum Mainnet)
    SERVER_PAYMENT_ADDRESS: '0xdC050c7f76D0Ccd80A30B41556d08C85354c99A5', // Your revenue wallet
    DEMO_AGENT_WALLET: '0xdC050c7f76D0Ccd80A30B41556d08C85354c99A5', // Agent's wallet address
    DEMO_AGENT_WIF: alchemy.secret(process.env.DEMO_AGENT_PRIVATE_KEY), // Agent's private key

    // Payment Token on Ethereum Mainnet
    // Switch to MNEE for hackathon: 0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF
    MNEE_TOKEN_ADDRESS: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC on Ethereum

    NETWORK: 'ethereum', // Ethereum mainnet
    OPENAI_API_KEY: alchemy.secret(process.env.OPENAI_API_KEY),
  },
  compatibilityFlags: ['nodejs_compat'],
  url: false,
  placement: {
    mode: 'smart',
  },
  dev: {
    port: 8787,
  },
  observability: {
    logs: {
      enabled: true,
      persist: false,
    },
    traces: {
      enabled: true,
      persist: false,
    },
  },
})

await app.finalize()
