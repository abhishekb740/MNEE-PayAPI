/**
 * Demo Agent - Autonomous AI Agent using GPT-4 and  payments
 *
 * This agent demonstrates:
 * - MCP tool discovery
 * - Autonomous decision-making with GPT-4
 * - Automatic blockchain payments with
 * - WebSocket streaming to frontend
 */

import { DurableObject } from 'cloudflare:workers'
import OpenAI from 'openai'
import { drizzle } from 'drizzle-orm/d1'
import { eq } from 'drizzle-orm'
import type { Env } from '../env'
import { agents } from '../db/marketplace.schema'
import type { PrivateKeyAccount } from 'viem/accounts'

export interface AgentMessage {
  type: 'thought' | 'action' | 'payment' | 'data' | 'recommendation' | 'error'
  content: string
  metadata?: Record<string, any>
  timestamp: number
}

export class DemoAgent extends DurableObject<Env> {
  private sessions: Set<WebSocket>
  private openai: OpenAI | null
  private agentId: string | null
  private account: PrivateKeyAccount | null

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    this.sessions = new Set()
    this.openai = null
    this.agentId = null
    this.account = null
  }

  async fetch(request: Request): Promise<Response> {
    // Handle WebSocket upgrade
    const upgradeHeader = request.headers.get('Upgrade')
    if (upgradeHeader === 'websocket') {
      const pair = new WebSocketPair()
      const [client, server] = Object.values(pair)

      this.ctx.acceptWebSocket(server)
      this.sessions.add(server)

      // Start agent workflow when client connects
      this.startWorkflow().catch((error) => {
        this.broadcast({
          type: 'error',
          content: `Fatal error: ${error.message}`,
          timestamp: Date.now(),
        })
      })

      return new Response(null, {
        status: 101,
        webSocket: client,
      })
    }

    return new Response('Expected WebSocket', { status: 400 })
  }

  /**
   * Broadcast message to all connected WebSocket clients
   */
  private broadcast(message: AgentMessage) {
    const data = JSON.stringify(message)
    for (const ws of this.sessions) {
      try {
        ws.send(data)
      } catch (_e) {
        this.sessions.delete(ws)
      }
    }
  }

  /**
   * Initialize  payment account
   */
  private async initializePaymentAccount() {
    console.log('[DemoAgent] Initializing payment account...')

    const { privateKeyToAccount } = await import('viem/accounts')

    // Create viem account from WIF
    this.account = privateKeyToAccount(this.env.DEMO_AGENT_WIF as `0x${string}`)
    console.log('[DemoAgent] Payment account created:', this.account.address)
  }

  /**
   * Main agent workflow
   */
  private async startWorkflow() {
    const env = this.env
    const db = drizzle(env.DB)

    console.log('env', env)

    // Initialize OpenAI
    this.openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })

    try {
      // STEP 1: Register as agent
      this.broadcast({
        type: 'thought',
        content: '🤖 Initializing autonomous agent...',
        timestamp: Date.now(),
      })

      this.broadcast({
        type: 'action',
        content: 'Registering with MNEE marketplace...',
        timestamp: Date.now(),
      })

      // Check if agent already exists
      const existingAgent = await db
        .select()
        .from(agents)
        .where(eq(agents.walletAddress, env.DEMO_AGENT_WALLET))
        .get()

      let agentId: string

      if (existingAgent) {
        agentId = existingAgent.id
        this.broadcast({
          type: 'action',
          content: `✅ Found existing registration! Agent ID: ${agentId.substring(0, 8)}...`,
          metadata: { agentId },
          timestamp: Date.now(),
        })
      } else {
        agentId = crypto.randomUUID()
        const apiKey = `mnee_demo_${crypto.randomUUID().replace(/-/g, '')}`

        await db.insert(agents).values({
          id: agentId,
          walletAddress: env.DEMO_AGENT_WALLET,
          name: 'Live Demo Agent',
          email: 'demo@mnee-marketplace.com',
          apiKey,
          totalSpent: '0',
          requestCount: 0,
          lastActiveAt: null,
          createdAt: new Date(),
        })

        this.broadcast({
          type: 'action',
          content: `✅ Registered successfully! Agent ID: ${agentId.substring(0, 8)}...`,
          metadata: { agentId },
          timestamp: Date.now(),
        })
      }

      this.agentId = agentId

      // Initialize payment account
      this.broadcast({
        type: 'action',
        content: '🔌 Initializing payment account...',
        timestamp: Date.now(),
      })

      await this.initializePaymentAccount()

      this.broadcast({
        type: 'action',
        content: '✅ Payment account ready for  transactions',
        timestamp: Date.now(),
      })

      // STEP 2: Discover available APIs
      this.broadcast({
        type: 'thought',
        content: '🔍 Discovering available data APIs in marketplace...',
        timestamp: Date.now(),
      })

      // Available marketplace tools with pricing (mock data for demo)
      const availableTools = [
        {
          name: 'get_market_data',
          description: 'Get real-time stock market indices and trends - $0.01',
          price: 0.01,
          getData: () => ({
            timestamp: Date.now(),
            data: {
              sp500: { price: 4783.35, change: 40.85, changePercent: 0.86, volume: 3_245_678_900 },
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
          }),
        },
        {
          name: 'get_crypto_prices',
          description: 'Get current cryptocurrency prices and 24h changes - $0.01',
          price: 0.01,
          getData: () => ({
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
          }),
        },
        {
          name: 'get_weather_data',
          description: 'Get current weather conditions and forecast - $0.01',
          price: 0.01,
          getData: () => ({
            timestamp: Date.now(),
            location: 'New York',
            data: {
              temperature: 72,
              feelsLike: 70,
              humidity: 65,
              conditions: 'Partly Cloudy',
              windSpeed: 12,
              windDirection: 'NW',
            },
          }),
        },
        {
          name: 'get_sentiment_analysis',
          description: 'Analyze market sentiment from social media and news - $0.01',
          price: 0.01,
          getData: () => ({
            timestamp: Date.now(),
            topic: 'crypto',
            data: {
              sentiment: 0.68,
              volume: 15_420,
              trending: true,
              keywords: ['bullish', 'adoption', 'innovation', 'growth'],
            },
          }),
        },
        {
          name: 'get_web3_analytics',
          description: 'Get blockchain analytics and DeFi metrics - $0.01',
          price: 0.01,
          getData: () => ({
            timestamp: Date.now(),
            data: {
              totalValueLocked: '85.4B',
              tvlChange24h: 2.3,
              activeAddresses24h: 1_250_000,
              transactions24h: 3_456_789,
              dexVolume24h: '4.2B',
            },
          }),
        },
      ]

      const toolPrices: Record<string, number> = {}
      availableTools.forEach((t) => {
        toolPrices[t.name] = t.price
      })

      const toolsList = availableTools
        .map((t) => `• ${t.name}: $${t.price} - ${t.description}`)
        .join('\n')

      this.broadcast({
        type: 'action',
        content: `Found ${availableTools.length} data APIs:\n${toolsList}`,
        metadata: { tools: availableTools.map((t) => t.name) },
        timestamp: Date.now(),
      })

      // STEP 3: Use GPT-4 to decide what to purchase
      this.broadcast({
        type: 'thought',
        content: '🧠 Analyzing available tools and making autonomous purchase decision...',
        timestamp: Date.now(),
      })

      // Convert tools to OpenAI function format
      const openaiTools = availableTools.map((tool) => ({
        type: 'function' as const,
        function: {
          name: tool.name,
          description: tool.description || '',
          parameters: { type: 'object', properties: {} },
        },
      }))

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are an autonomous trading agent with access to various paid data APIs.
Your goal is to choose ONE data API that will provide the most value for making a trading recommendation.
Consider both the cost and the informational value of each API.
Be strategic and cost-conscious.`,
          },
          {
            role: 'user',
            content:
              'Analyze the available tools and choose ONE to purchase for making a trading recommendation. Explain your reasoning.',
          },
        ],
        tools: openaiTools,
        tool_choice: 'required',
      })

      const toolCall = completion.choices[0].message.tool_calls?.[0]
      if (!toolCall || toolCall.type !== 'function') {
        throw new Error('No tool selected by GPT-4')
      }

      const selectedTool = toolCall.function.name
      const toolArgs = JSON.parse(toolCall.function.arguments || '{}')
      const reasoning =
        completion.choices[0].message.content || 'Strategic choice based on value/cost ratio'
      const price = toolPrices[selectedTool] || 0

      this.broadcast({
        type: 'thought',
        content: `💡 Decision: ${selectedTool}\nReasoning: ${reasoning}`,
        metadata: { tool: selectedTool, args: toolArgs, price },
        timestamp: Date.now(),
      })

      // STEP 4 & 5: Execute  payment and fetch data
      this.broadcast({
        type: 'action',
        content: `💳 Initiating automatic blockchain payment: $${price} via ...`,
        metadata: { amount: price, network: env.NETWORK },
        timestamp: Date.now(),
      })

      // Find the selected tool details
      const selectedToolData = availableTools.find((t) => t.name === selectedTool)
      if (!selectedToolData) {
        throw new Error(`Tool not found: ${selectedTool}`)
      }

      console.log('[DemoAgent] Executing tool with payment:', {
        tool: selectedTool,
        price,
        network: env.NETWORK,
        account: this.account?.address,
      })

      // Import viem for blockchain payments
      const { http, createPublicClient, createWalletClient, parseUnits } = await import('viem')
      const { mainnet } = await import('viem/chains')

      let apiData: unknown
      let txHash: `0x${string}` | undefined

      try {
        // Show payment requirement
        this.broadcast({
          type: 'payment',
          content: `💳 Payment required: $${price}`,
          metadata: {
            amount: price.toString(),
            token: env.MNEE_TOKEN_ADDRESS,
            recipient: env.SERVER_PAYMENT_ADDRESS,
            network: env.NETWORK,
          },
          timestamp: Date.now(),
        })

        // Execute blockchain payment
        this.broadcast({
          type: 'action',
          content: '⛓️ Executing blockchain payment on Ethereum...',
          timestamp: Date.now(),
        })

        const walletClient = createWalletClient({
          account: this.account!,
          chain: mainnet,
          transport: http(),
        })

        const paymentToken = env.MNEE_TOKEN_ADDRESS as `0x${string}`
        const recipient = env.SERVER_PAYMENT_ADDRESS as `0x${string}`
        const amount = parseUnits(price.toString(), 6) // 6 decimals

        console.log('[DemoAgent] Sending token transfer:', {
          token: paymentToken,
          from: this.account!.address,
          to: recipient,
          amount: amount.toString(),
        })

        // Execute transfer
        const hash = await walletClient.writeContract({
          address: paymentToken,
          abi: [
            {
              name: 'transfer',
              type: 'function',
              stateMutability: 'nonpayable',
              inputs: [
                { name: 'to', type: 'address' },
                { name: 'amount', type: 'uint256' },
              ],
              outputs: [{ type: 'bool' }],
            },
          ],
          functionName: 'transfer',
          args: [recipient, amount],
        })

        txHash = hash
        console.log('[DemoAgent] Transaction submitted:', txHash)

        this.broadcast({
          type: 'payment',
          content: `✅ Payment transaction submitted: ${txHash.substring(0, 10)}...`,
          metadata: { txHash, amount: price },
          timestamp: Date.now(),
        })

        // Wait for confirmation
        this.broadcast({
          type: 'action',
          content: '⏳ Waiting for transaction confirmation...',
          timestamp: Date.now(),
        })

        const publicClient = createPublicClient({
          chain: mainnet,
          transport: http(),
        })

        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
        console.log('[DemoAgent] Transaction confirmed:', receipt.transactionHash)

        this.broadcast({
          type: 'payment',
          content: '✅ Payment confirmed on blockchain!',
          metadata: { txHash, blockNumber: Number(receipt.blockNumber) },
          timestamp: Date.now(),
        })

        // Payment confirmed - now get the data directly
        console.log('[DemoAgent] Payment verified, fetching data...')
        apiData = selectedToolData.getData()

        console.log('[DemoAgent] Data fetched successfully:', {
          tool: selectedTool,
          txHash,
        })
      } catch (error) {
        console.error('[DemoAgent] Error:', error)
        this.broadcast({
          type: 'error',
          content: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: Date.now(),
        })
        throw error
      }

      if (txHash) {
        this.broadcast({
          type: 'payment',
          content: `✅ Payment successful! $${price} paid on ${env.NETWORK}`,
          metadata: {
            amount: price,
            network: env.NETWORK,
            txHash,
            blockExplorer: `https://etherscan.io/tx/${txHash}`,
          },
          timestamp: Date.now(),
        })
      }

      this.broadcast({
        type: 'data',
        content: `✅ Data received from ${selectedTool}`,
        metadata: {
          data: apiData,
          preview: JSON.stringify(apiData).substring(0, 200) + '...',
        },
        timestamp: Date.now(),
      })

      // STEP 6: Analyze data with GPT-4
      this.broadcast({
        type: 'thought',
        content: '📈 Analyzing data and formulating trading recommendation...',
        timestamp: Date.now(),
      })

      const analysis = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content:
              'You are a professional trading analyst. Provide concise, actionable trading insights based on the data. Be specific and clear.',
          },
          {
            role: 'user',
            content: `Analyze this data and provide a trading recommendation:\n\n${JSON.stringify(apiData, null, 2)}`,
          },
        ],
        max_tokens: 500,
      })

      const recommendation = analysis.choices[0].message.content || 'Analysis complete'

      // STEP 7: Deliver recommendation
      this.broadcast({
        type: 'recommendation',
        content: recommendation,
        metadata: { totalCost: price, apiUsed: selectedTool },
        timestamp: Date.now(),
      })

      this.broadcast({
        type: 'action',
        content: `✅ Demo complete! Total cost: $${price} (paid on ${env.NETWORK})`,
        metadata: {
          agentId: this.agentId,
          totalCost: price,
          network: env.NETWORK,
          txHash,
        },
        timestamp: Date.now(),
      })
    } catch (error) {
      console.error('Agent workflow error:', error)
      this.broadcast({
        type: 'error',
        content: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        timestamp: Date.now(),
      })
    }
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    // Handle incoming messages if needed (e.g., user can interrupt/reset)
    if (typeof message === 'string') {
      try {
        const data = JSON.parse(message)
        if (data.type === 'reset') {
          this.agentId = null
          this.broadcast({
            type: 'action',
            content: 'Agent reset by user',
            timestamp: Date.now(),
          })
        }
      } catch (_e) {
        // Ignore malformed messages
      }
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
    this.sessions.delete(ws)
  }

  async webSocketError(ws: WebSocket, error: unknown) {
    this.sessions.delete(ws)
  }
}
