# MNEE Marketplace

**AI Agent Tool Marketplace - Pay per API call with MNEE tokens**

Build AI agents that autonomously pay for data APIs using on-chain micropayments.

```
Agent → Discovers Tools → Makes Payment → Gets Data
         (GET /tools)      (MNEE transfer)   (verified on-chain)
```

## How It Works

1. **Agent registers** and gets an API key
2. **Agent discovers tools** via `GET /api/tools`
3. **Agent requests a tool** → receives `402 Payment Required` with payment details
4. **Agent sends MNEE** to the specified address on Ethereum
5. **Agent retries** with `X-Payment-Tx` header containing the tx hash
6. **Server verifies** the payment on-chain and returns the data

No escrow. No accounts. Just direct blockchain payments verified in real-time.

---

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) v1.3+
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/) (Cloudflare CLI)
- Ethereum wallet with MNEE tokens (or USDC for testing)
- OpenAI API key (for the demo agent)

### 1. Install Dependencies

```bash
git clone https://github.com/your-repo/mnee-marketplace
cd mnee-marketplace
bun install
```

### 2. Configure Environment

```bash
# Copy the example env file
cp .env.example .env
```

Edit `.env` in the root directory:

```bash
# Your Ethereum wallet that receives payments
SERVER_PAYMENT_ADDRESS=0xYourAddress

# Private key for the demo agent (needs MNEE/USDC balance)
DEMO_AGENT_WIF=0xYourPrivateKey

# OpenAI API key for GPT-4 decision making
OPENAI_API_KEY=sk-...

```

### 3. Initialize Database

```bash
cd apps/api

# Generate migrations (if schema changed)
bunx drizzle-kit generate
```

### 4. Start Development Server

```bash
# From root directory
bun run dev
```

This starts:
- **API**: http://localhost:8787
- **Web**: http://localhost:5173 (proxies `/api` to 8787)

---

## Running the LangChain Agent

The `scripts/agent-langchain.ts` demonstrates a complete AI agent that:
1. Receives a natural language query
2. Uses GPT-4 to decide which tool to call
3. Automatically pays for the API with MNEE
4. Returns the data

### Setup

Add these to your `.env` file in the root:

```bash
OPENAI_API_KEY=sk-your-key
AGENT_API_KEY=mnee_your_agent_api_key
WALLET_PRIVATE_KEY=0xYourPrivateKey
```

### Run

```bash
# Ask about weather
bun scripts/agent-langchain.ts "What's the weather in Tokyo?"

# Ask about crypto
bun scripts/agent-langchain.ts "What's the current Bitcoin price?"

# Ask about stocks
bun scripts/agent-langchain.ts "How are the stock markets doing?"
```

### Example Output

```
🤖 Agent ready. Ask about markets, crypto, or weather.

User: What's the weather in Tokyo?

Tool calls:
  - get_weather({"location":"tokyo"})
  💰 Payment required: $0.01
  💳 Sending $0.01 MNEE to 0xdC050c7f...
  ✅ Payment sent: 0x4b82ab2d7bb433df...
    Result: {"timestamp":1735312345,"location":"tokyo","data":{"temperature":45,"conditions":"Cloudy"}}
```

---

## API Reference

### Authentication

All endpoints require an API key in the `X-API-Key` header:

```bash
curl -H "X-API-Key: mnee_your_key" https://mnee.market/api/tools
```

### Endpoints

#### List Available Tools

```bash
GET /api/tools
```

Returns all available tools with pricing:

```json
{
  "tools": [
    {
      "id": "market",
      "name": "get_market_data",
      "description": "Get real-time stock market data",
      "price": "$0.01",
      "parameters": {}
    },
    {
      "id": "crypto",
      "name": "get_crypto_prices",
      "description": "Get cryptocurrency prices",
      "price": "$0.01"
    },
    {
      "id": "weather",
      "name": "get_weather",
      "description": "Get weather for a location",
      "price": "$0.01",
      "parameters": {
        "properties": { "location": { "type": "string" } }
      }
    }
  ],
  "payment": {
    "token": "0x8cce...",
    "network": "ethereum",
    "recipient": "0xdC05..."
  }
}
```

#### Execute Tool (Payment Required)

```bash
POST /api/tools/:toolId/execute
Content-Type: application/json

{
  "params": { "location": "Tokyo" }
}
```

**Step 1**: First call returns `402 Payment Required`:

```json
{
  "error": "Payment Required",
  "payment": {
    "amount": "0.01",
    "token": "0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF",
    "recipient": "0xdC050c7f76D0Ccd80A30B41556d08C85354c99A5",
    "network": "ethereum"
  }
}
```

**Step 2**: Send MNEE tokens to the recipient address (your wallet → our wallet)

**Step 3**: Retry with payment proof:

```bash
POST /api/tools/weather/execute
X-API-Key: mnee_your_key
X-Payment-Tx: 0xabc123...  # Your transaction hash
Content-Type: application/json

{
  "params": { "location": "Tokyo" }
}
```

**Response**:

```json
{
  "success": true,
  "tool": "weather",
  "payment": {
    "txHash": "0xabc123...",
    "amount": "0.01"
  },
  "data": {
    "timestamp": 1735312345,
    "location": "Tokyo",
    "data": {
      "temperature": 45,
      "conditions": "Cloudy",
      "humidity": 65
    }
  }
}
```

---

## Available Tools

| Tool ID | Name | Description | Price |
|---------|------|-------------|-------|
| `market` | Market Data | S&P 500, NASDAQ, Dow Jones indices | $0.01 |
| `crypto` | Crypto Prices | BTC, ETH, MNEE prices | $0.01 |
| `weather` | Weather | Current weather for any city | $0.01 |
| `sentiment` | Sentiment | Social media sentiment analysis | $0.01 |
| `web3` | Web3 Analytics | TVL, gas prices, DEX volume | $0.01 |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Your AI Agent                          │
│  (Python/JS/Any language with HTTP + Ethereum support)      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    MNEE Marketplace API                      │
│                  (Cloudflare Workers)                        │
├─────────────────────────────────────────────────────────────┤
│  GET /api/tools          → List available tools              │
│  POST /api/tools/:id/execute → Execute with payment proof    │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────────┐
│   Ethereum Mainnet      │     │      Data Providers         │
│   (Payment Verification)│     │   (Market, Crypto, Weather) │
│                         │     │                             │
│   MNEE Token:           │     │   Built-in or third-party   │
│   0x8cce...             │     │   APIs proxied through us   │
└─────────────────────────┘     └─────────────────────────────┘
```

---

## Project Structure

```
mnee-marketplace/
├── apps/
│   ├── api/                    # Hono API (Cloudflare Worker)
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── tools.ts    # Tool discovery & execution
│   │   │   │   ├── data.ts     # Data endpoints (market, crypto, etc.)
│   │   │   │   ├── agents.ts   # Agent registration
│   │   │   │   └── demo.ts     # Demo agent WebSocket
│   │   │   ├── agents/
│   │   │   │   └── demo-agent.ts  # Durable Object agent
│   │   │   └── db/
│   │   │       └── marketplace.schema.ts
│   │   └── drizzle/            # Database migrations
│   └── web/                    # React frontend
├── scripts/
│   └── agent-langchain.ts      # Example LangChain agent
└── packages/
    └── config/                 # Shared configuration
```

---

## Development

### Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev servers (API + Web) |
| `bun run build` | Build for production |
| `bun run deploy` | Deploy to Cloudflare |
| `bun run check` | Lint & format with Biome |

### Database

```bash
cd apps/api

# Generate migration after schema changes
bunx drizzle-kit generate

# Apply to local D1
bunx wrangler d1 migrations apply payapi --local

# Apply to production
bunx wrangler d1 migrations apply payapi --remote
```

### Testing Payments

For development, you can use USDC on Ethereum mainnet instead of MNEE:

1. Update `apps/api/alchemy.run.ts`:
   ```ts
   MNEE_TOKEN_ADDRESS: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' // USDC
   ```

2. Fund your test wallet with some USDC

3. Run the agent script - it will automatically pay and verify on-chain

---

## Token Information

**MNEE Token** (Ethereum Mainnet):
- Contract: `0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF`
- Decimals: 6
- 1 MNEE = $1 USD (stablecoin)

---

## Tech Stack

- **Runtime**: Cloudflare Workers + Durable Objects
- **Framework**: Hono (API) + React (Web)
- **Database**: Cloudflare D1 (SQLite) + Drizzle ORM
- **Blockchain**: Viem for Ethereum interactions
- **AI**: OpenAI GPT-4 for tool selection
- **Agent Framework**: LangChain (example script)

---

## License

MIT