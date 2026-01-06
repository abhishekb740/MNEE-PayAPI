import { createFileRoute, Link } from '@tanstack/react-router'
import { Layout } from '@/components/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Key, Search, CreditCard, Code, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/docs/agents')({
  component: AgentDocsPage,
})

function AgentDocsPage() {
  return (
    <Layout>
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8">
          <Badge variant="outline" className="mb-4">
            For Agent Builders
          </Badge>
          <h1 className="mb-3 text-4xl font-bold">Agent Integration Guide</h1>
          <p className="text-lg text-muted-foreground">
            Build AI agents that discover and pay for APIs autonomously.
          </p>
        </div>

        {/* Quick Start */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
            <CardDescription>Get your agent making paid API calls in 3 steps</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                1
              </div>
              <div>
                <p className="font-medium">Create an Agent</p>
                <p className="text-sm text-muted-foreground">
                  Go to Dashboard → Agents → Create Agent to get your API key
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                2
              </div>
              <div>
                <p className="font-medium">Discover Tools</p>
                <p className="text-sm text-muted-foreground">
                  Call <code className="rounded bg-muted px-1">GET /tools</code> to see available
                  APIs and their prices
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                3
              </div>
              <div>
                <p className="font-medium">Pay & Execute</p>
                <p className="text-sm text-muted-foreground">
                  Send MNEE payment, then call the tool with your transaction hash
                </p>
              </div>
            </div>
            <div className="pt-2">
              <Button asChild>
                <Link to="/dashboard/agents">
                  Create Your Agent <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* API Reference */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">API Reference</h2>

          {/* Authentication */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="size-5" />
                Authentication
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                All API calls require your agent API key in the header:
              </p>
              <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
                <code>{'X-API-Key: mnee_your_api_key_here'}</code>
              </pre>
              <p className="text-sm text-muted-foreground">
                Get your API key from the{' '}
                <Link to="/dashboard/agents" className="text-primary hover:underline">
                  Agents Dashboard
                </Link>
                .
              </p>
            </CardContent>
          </Card>

          {/* List Tools */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="size-5" />
                Discover Tools
              </CardTitle>
              <CardDescription>GET /tools</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                List all available tools with their prices and parameters.
              </p>
              <div>
                <p className="mb-2 text-sm font-medium">Request</p>
                <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
                  <code>{`curl https://api.mnee.market/tools \\
  -H "X-API-Key: mnee_your_key"`}</code>
                </pre>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Response</p>
                <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
                  <code>{`{
  "tools": [
    {
      "id": "market",
      "name": "get_market_data",
      "description": "Get real-time stock market data",
      "price": "$0.01",
      "priceRaw": "0.01",
      "parameters": {
        "type": "object",
        "properties": {},
        "required": []
      },
      "source": "platform"
    },
    {
      "id": "crypto",
      "name": "get_crypto_prices",
      "description": "Get cryptocurrency prices",
      "price": "$0.01",
      "priceRaw": "0.01",
      "parameters": { ... }
    }
  ],
  "payment": {
    "token": "0x8cce...",
    "network": "mainnet",
    "recipient": "0xdC05..."
  }
}`}</code>
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Execute Tool */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="size-5" />
                Execute Tool (with Payment)
              </CardTitle>
              <CardDescription>POST /tools/:toolId/execute</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">Execute a tool by providing payment proof.</p>

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Payment Flow
                </p>
                <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-amber-700 dark:text-amber-300">
                  <li>Call execute without payment → get 402 with payment details</li>
                  <li>Send MNEE tokens to the recipient address</li>
                  <li>Retry with X-Payment-Tx header containing your tx hash</li>
                </ol>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">Step 1: Get Payment Requirements</p>
                <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
                  <code>{`curl -X POST https://api.mnee.market/tools/market/execute \\
  -H "X-API-Key: mnee_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"params": {}}'`}</code>
                </pre>
                <p className="mt-2 mb-2 text-sm font-medium">Response (402 Payment Required)</p>
                <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
                  <code>{`{
  "error": "Payment Required",
  "payment": {
    "amount": "0.01",
    "token": "0x8cce...",
    "recipient": "0xdC05...",
    "network": "mainnet"
  }
}`}</code>
                </pre>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">Step 2: Send MNEE Payment</p>
                <p className="text-sm text-muted-foreground">
                  Transfer the required amount of MNEE tokens to the recipient address. Save the
                  transaction hash.
                </p>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">Step 3: Retry with Payment Proof</p>
                <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
                  <code>{`curl -X POST https://api.mnee.market/tools/market/execute \\
  -H "X-API-Key: mnee_your_key" \\
  -H "X-Payment-Tx: 0xabc123..." \\
  -H "Content-Type: application/json" \\
  -d '{"params": {}}'`}</code>
                </pre>
                <p className="mt-2 mb-2 text-sm font-medium">Response (Success)</p>
                <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
                  <code>{`{
  "success": true,
  "tool": "market",
  "payment": {
    "txHash": "0xabc123...",
    "amount": "0.01"
  },
  "data": {
    "sp500": { "price": 5234.18, "change": 0.45 },
    "nasdaq": { "price": 16432.55, "change": 0.62 },
    "dowJones": { "price": 39872.11, "change": 0.28 }
  }
}`}</code>
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Code Examples */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="size-5" />
                Code Examples
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="mb-2 text-sm font-medium">Python</p>
                <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
                  <code>{`import requests
from web3 import Web3

API_KEY = "mnee_your_key"
API_BASE = "https://api.mnee.market"

# 1. Discover available tools
tools = requests.get(
    f"{API_BASE}/tools",
    headers={"X-API-Key": API_KEY}
).json()

print(f"Available tools: {[t['name'] for t in tools['tools']]}")

# 2. Try to execute (get payment requirements)
response = requests.post(
    f"{API_BASE}/tools/market/execute",
    headers={"X-API-Key": API_KEY},
    json={"params": {}}
)

if response.status_code == 402:
    payment = response.json()["payment"]

    # 3. Send MNEE payment (using your wallet)
    w3 = Web3(Web3.HTTPProvider("https://eth-mainnet.g.alchemy.com/v2/..."))
    mnee = w3.eth.contract(address=payment["token"], abi=ERC20_ABI)

    tx_hash = mnee.functions.transfer(
        payment["recipient"],
        int(float(payment["amount"]) * 1e6)  # MNEE has 6 decimals
    ).transact({"from": YOUR_WALLET})

    # 4. Retry with payment proof
    data = requests.post(
        f"{API_BASE}/tools/market/execute",
        headers={
            "X-API-Key": API_KEY,
            "X-Payment-Tx": tx_hash.hex()
        },
        json={"params": {}}
    ).json()

    print(f"Market data: {data['data']}")`}</code>
                </pre>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">JavaScript / TypeScript</p>
                <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
                  <code>{`import { createPublicClient, createWalletClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const API_KEY = 'mnee_your_key'
const API_BASE = 'https://api.mnee.market'

// 1. Discover tools
const { tools, payment: paymentInfo } = await fetch(\`\${API_BASE}/tools\`, {
  headers: { 'X-API-Key': API_KEY }
}).then(r => r.json())

console.log('Available:', tools.map(t => t.name))

// 2. Try to execute
const response = await fetch(\`\${API_BASE}/tools/market/execute\`, {
  method: 'POST',
  headers: { 'X-API-Key': API_KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({ params: {} })
})

if (response.status === 402) {
  const { payment } = await response.json()

  // 3. Send MNEE payment
  const walletClient = createWalletClient({
    chain: mainnet,
    transport: http()
  })

  const txHash = await walletClient.writeContract({
    address: payment.token,
    abi: ERC20_ABI,
    functionName: 'transfer',
    args: [payment.recipient, BigInt(payment.amount * 1e6)]
  })

  // 4. Retry with payment proof
  const data = await fetch(\`\${API_BASE}/tools/market/execute\`, {
    method: 'POST',
    headers: {
      'X-API-Key': API_KEY,
      'X-Payment-Tx': txHash,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ params: {} })
  }).then(r => r.json())

  console.log('Market data:', data.data)
}`}</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Next Steps */}
        <div className="mt-12 rounded-lg border bg-muted/50 p-6">
          <h3 className="font-semibold">Ready to build?</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your agent and start integrating with the marketplace.
          </p>
          <div className="mt-4 flex gap-3">
            <Button asChild>
              <Link to="/dashboard/agents">Create Agent</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/demo">See Live Demo</Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
