#!/usr/bin/env bun
/**
 * Simple LangChain agent example using PayAPI tools
 *
 * Install: bun add @langchain/openai @langchain/core zod viem
 *
 * Usage:
 *   OPENAI_API_KEY=sk-xxx AGENT_API_KEY=mnee_xxx bun scripts/agent-langchain.ts "query"
 *
 * With auto-payment (requires wallet):
 *   OPENAI_API_KEY=sk-xxx AGENT_API_KEY=mnee_xxx WALLET_PRIVATE_KEY=0x... bun scripts/agent-langchain.ts "query"
 */

import { ChatOpenAI } from '@langchain/openai'
import { tool } from '@langchain/core/tools'
import { HumanMessage } from '@langchain/core/messages'
import { z } from 'zod'
import { createPublicClient, createWalletClient, http, parseUnits } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { mainnet } from 'viem/chains'

const API_BASE = process.env.API_URL || 'http://localhost:5174/api'
const AGENT_API_KEY = process.env.AGENT_API_KEY || 'mnee_demo_e0c7eaa584094c5a9d2cffbdc26753a3'
const WALLET_PRIVATE_KEY =
  process.env.WALLET_PRIVATE_KEY ||
  '0x838cfef75beba36850de80eeb19bef7425df3b7b11a6cd6972135d18c5d734c1'

// MNEE Token ABI (just transfer function)
const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const

if (!AGENT_API_KEY) {
  console.error('Set AGENT_API_KEY environment variable')
  process.exit(1)
}

// Helper to send MNEE payment
async function sendPayment(
  amount: string,
  token: string,
  recipient: string,
): Promise<string | null> {
  if (!WALLET_PRIVATE_KEY) {
    console.log('  💡 Set WALLET_PRIVATE_KEY to enable auto-payment')
    return null
  }

  try {
    const account = privateKeyToAccount(WALLET_PRIVATE_KEY as `0x${string}`)
    const walletClient = createWalletClient({
      account,
      chain: mainnet,
      transport: http(),
    })

    console.log(`  💳 Sending $${amount} MNEE to ${recipient.slice(0, 10)}...`)

    const hash = await walletClient.writeContract({
      address: token as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [recipient as `0x${string}`, parseUnits(amount, 6)], // MNEE has 6 decimals
    })

    console.log(`  ✅ Payment sent: ${hash.slice(0, 20)}...`)

    // Wait for confirmation
    const publicClient = createPublicClient({
      chain: mainnet,
      transport: http(),
    })
    await publicClient.waitForTransactionReceipt({ hash })

    return hash
  } catch (error) {
    console.error('  ❌ Payment failed:', error)
    return null
  }
}

// Helper to call a tool with payment handling
async function callToolWithPayment(
  toolId: string,
  params: Record<string, any> = {},
): Promise<string> {
  // First attempt
  const res1 = await fetch(`${API_BASE}/tools/${toolId}/execute`, {
    method: 'POST',
    headers: {
      'X-API-Key': AGENT_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ params }),
  })

  if (res1.status !== 402) {
    const data = await res1.json()
    return res1.ok ? JSON.stringify(data.data) : JSON.stringify(data)
  }

  // Payment required
  const paymentInfo = await res1.json()
  const { amount, token, recipient } = paymentInfo.payment

  console.log(`  💰 Payment required: $${amount}`)

  // Try to send payment
  const txHash = await sendPayment(amount, token, recipient)

  if (!txHash) {
    return `Payment required: Send $${amount} MNEE to ${recipient}`
  }

  // Retry with payment proof
  const res2 = await fetch(`${API_BASE}/tools/${toolId}/execute`, {
    method: 'POST',
    headers: {
      'X-API-Key': AGENT_API_KEY,
      'X-Payment-Tx': txHash,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ params }),
  })

  const data = await res2.json()
  return res2.ok ? JSON.stringify(data.data) : JSON.stringify(data)
}

// Create tools that call PayAPI with automatic payment
const getMarketData = tool(async () => callToolWithPayment('market'), {
  name: 'get_market_data',
  description: 'Get real-time stock market data (S&P 500, NASDAQ, Dow Jones). Costs $0.01.',
  schema: z.object({}),
})

const getCryptoData = tool(async () => callToolWithPayment('crypto'), {
  name: 'get_crypto_prices',
  description: 'Get current cryptocurrency prices (BTC, ETH). Costs $0.01.',
  schema: z.object({}),
})

const getWeather = tool(async ({ location }) => callToolWithPayment('weather', { location }), {
  name: 'get_weather',
  description: 'Get weather for a location. Costs $0.01.',
  schema: z.object({
    location: z.string().describe('City name'),
  }),
})

async function main() {
  const model = new ChatOpenAI({
    model: 'gpt-4o',
  })

  const modelWithTools = model.bindTools([getMarketData, getCryptoData, getWeather])

  console.log('🤖 Agent ready. Ask about markets, crypto, or weather.\n')

  const query = process.argv[2] || "What's the current stock market looking like?"
  console.log(`User: ${query}\n`)

  const response = await modelWithTools.invoke([new HumanMessage(query)])

  console.log('Assistant:', response.content)

  if (response.tool_calls?.length) {
    console.log('\nTool calls:')
    for (const call of response.tool_calls) {
      console.log(`  - ${call.name}(${JSON.stringify(call.args)})`)

      // Execute the tool based on name
      let result: string
      switch (call.name) {
        case 'get_market_data':
          result = await getMarketData.invoke({})
          break
        case 'get_crypto_prices':
          result = await getCryptoData.invoke({})
          break
        case 'get_weather':
          result = await getWeather.invoke(call.args as { location: string })
          break
        default:
          result = 'Unknown tool'
      }
      console.log(`    Result: ${result}`)
    }
  }
}

main().catch(console.error)
