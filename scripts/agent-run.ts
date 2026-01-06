#!/usr/bin/env bun
/**
 * Test script for agent API requests
 * Usage:
 *   bun scripts/agent-run.ts                     # List tools
 *   bun scripts/agent-run.ts --execute market    # Execute a tool
 *   bun scripts/agent-run.ts --key <api_key>     # Use specific API key
 */

const API_BASE = process.env.API_URL || 'http://localhost:5174/api'

// Parse command line args
const args = process.argv.slice(2)
let apiKey = process.env.AGENT_API_KEY || ''
let executeToolId: string | null = null
let showHelp = false

for (let i = 0; i < args.length; i++) {
  const arg = args[i]
  if (arg === '--key' || arg === '-k') {
    apiKey = args[++i] || ''
  } else if (arg === '--execute' || arg === '-e') {
    executeToolId = args[++i] || null
  } else if (arg === '--help' || arg === '-h') {
    showHelp = true
  } else if (!arg.startsWith('-')) {
    executeToolId = arg
  }
}

if (showHelp) {
  console.log(`
Agent API Test Script

Usage:
  bun scripts/agent-run.ts [options] [tool_id]

Options:
  --key, -k <key>      API key (or set AGENT_API_KEY env var)
  --execute, -e <id>   Execute a specific tool
  --help, -h           Show this help

Examples:
  bun scripts/agent-run.ts                        # List all tools
  bun scripts/agent-run.ts market                 # Execute 'market' tool
  bun scripts/agent-run.ts --key mnee_xxx market  # Use specific key

Environment:
  API_URL          API base URL (default: http://localhost:8787)
  AGENT_API_KEY    Default API key
`)
  process.exit(0)
}

if (!apiKey) {
  console.error('❌ No API key provided. Use --key or set AGENT_API_KEY env var')
  console.log('\nTo create an agent and get a key:')
  console.log('  1. Go to http://localhost:5173/dashboard/agents')
  console.log('  2. Create an agent')
  console.log('  3. Copy the API key')
  process.exit(1)
}

console.log('🤖 Agent API Test')
console.log('━'.repeat(50))
console.log(`API: ${API_BASE}`)
console.log(`Key: ${apiKey.slice(0, 15)}...`)
console.log('')

async function listTools() {
  console.log('📋 Fetching available tools...\n')

  const res = await fetch(`${API_BASE}/tools`, {
    headers: { 'X-API-Key': apiKey },
  })

  if (!res.ok) {
    const error = await res.text()
    console.error(`❌ Failed to fetch tools: ${res.status}`)
    console.error(error)
    return null
  }

  const data = await res.json()

  console.log(`Found ${data.tools.length} tools:\n`)

  for (const tool of data.tools) {
    console.log(`  ${tool.id}`)
    console.log(`    Name: ${tool.name}`)
    console.log(`    Price: ${tool.price}`)
    console.log(`    Source: ${tool.source}`)
    if (tool.description) {
      console.log(`    Desc: ${tool.description.slice(0, 60)}...`)
    }
    console.log('')
  }

  console.log('Payment Info:')
  console.log(`  Token: ${data.payment.token}`)
  console.log(`  Recipient: ${data.payment.recipient}`)
  console.log(`  Network: ${data.payment.network}`)

  return data
}

async function executeTool(toolId: string, params: Record<string, any> = {}) {
  console.log(`\n⚡ Executing tool: ${toolId}`)
  console.log('━'.repeat(50))

  // First call - will get 402 Payment Required
  console.log('\n1️⃣  Requesting tool (no payment)...')

  const res1 = await fetch(`${API_BASE}/tools/${toolId}/execute`, {
    method: 'POST',
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ params }),
  })

  const data1 = await res1.json()

  if (res1.status === 402) {
    console.log('\n✅ Got 402 Payment Required (expected)')
    console.log('\nPayment Details:')
    console.log(`  Amount: $${data1.payment.amount}`)
    console.log(`  Token: ${data1.payment.token}`)
    console.log(`  Recipient: ${data1.payment.recipient}`)
    console.log(`  Network: ${data1.payment.network}`)
    console.log('\n📝 Instructions:')
    console.log('  1. Send MNEE tokens to the recipient address')
    console.log('  2. Get the transaction hash')
    console.log('  3. Retry with X-Payment-Tx header')
    console.log('\nExample with payment:')
    console.log(`  curl -X POST ${API_BASE}/tools/${toolId}/execute \\`)
    console.log(`    -H "X-API-Key: ${apiKey}" \\`)
    console.log(`    -H "X-Payment-Tx: 0xYOUR_TX_HASH" \\`)
    console.log(`    -H "Content-Type: application/json" \\`)
    console.log(`    -d '{"params": {}}'`)
  } else if (res1.ok) {
    console.log('\n✅ Tool executed successfully!')
    console.log('\nResponse:')
    console.log(JSON.stringify(data1, null, 2))
  } else {
    console.error(`\n❌ Error: ${res1.status}`)
    console.error(JSON.stringify(data1, null, 2))
  }

  return data1
}

async function main() {
  try {
    // Always list tools first
    const toolsData = await listTools()

    if (!toolsData) {
      process.exit(1)
    }

    // Execute if requested
    if (executeToolId) {
      await executeTool(executeToolId)
    } else {
      console.log('\n💡 To execute a tool, run:')
      console.log(`   bun scripts/agent-run.ts --key ${apiKey} <tool_id>`)
    }
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

main()
