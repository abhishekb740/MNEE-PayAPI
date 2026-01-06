/**
 * MCP-Inspired Tool Definitions for Marketplace APIs
 *
 * Defines all marketplace data APIs as OpenAI function calling tools.
 * Each tool includes pricing information so GPT-4 can make cost-aware decisions.
 */

export const marketplaceTools = [
  {
    type: 'function' as const,
    function: {
      name: 'get_market_data',
      description: `Fetches stock market indices (S&P 500, NASDAQ, Dow Jones) with prices, changes, and volume.
                    Cost: $0.05 USD (0.05 MNEE).
                    Useful for: Understanding equity market sentiment, index performance analysis, trading decisions.`,
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_crypto_prices',
      description: `Fetches cryptocurrency prices for BTC, ETH, and MNEE with market cap and 24h volume/change.
                    Cost: $0.03 USD (0.03 MNEE).
                    Useful for: Crypto market analysis, trading decisions, portfolio valuation.`,
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_weather_data',
      description: `Fetches weather data for a specified location including temperature, conditions, wind, humidity.
                    Cost: $0.02 USD (0.02 MNEE).
                    Useful for: Weather-sensitive trading strategies, agricultural commodities analysis.`,
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'City name (e.g., "New York", "London")',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_sentiment_analysis',
      description: `Fetches social sentiment analysis from Twitter, Reddit, and news for a topic.
                    Cost: $0.10 USD (0.10 MNEE).
                    Useful for: Gauging market sentiment, detecting trends, risk assessment.`,
      parameters: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'Topic to analyze (e.g., "crypto", "stocks", "tech")',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_web3_analytics',
      description: `Fetches Web3 and DeFi metrics: TVL, DEX volume, gas prices, active addresses, top protocols.
                    Cost: $0.08 USD (0.08 MNEE).
                    Useful for: DeFi analysis, blockchain activity assessment, gas optimization.`,
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
]

/**
 * Get the price for a specific tool in USD
 */
export function getToolPrice(toolName: string): string {
  const prices: Record<string, string> = {
    get_market_data: '0.05',
    get_crypto_prices: '0.03',
    get_weather_data: '0.02',
    get_sentiment_analysis: '0.10',
    get_web3_analytics: '0.08',
  }
  return prices[toolName] || '0'
}

/**
 * Map tool names to database API IDs
 */
export function toolToApiId(toolName: string): string {
  const mapping: Record<string, string> = {
    get_market_data: 'market-data',
    get_crypto_prices: 'crypto-prices',
    get_weather_data: 'weather-data',
    get_sentiment_analysis: 'social-sentiment',
    get_web3_analytics: 'web3-analytics',
  }
  return mapping[toolName] || ''
}

/**
 * Map tool names to API endpoints
 */
export function toolToEndpoint(toolName: string, args?: Record<string, any>): string {
  const baseEndpoints: Record<string, string> = {
    get_market_data: '/api/data/market',
    get_crypto_prices: '/api/data/crypto',
    get_weather_data: `/api/data/weather?location=${args?.location || 'New York'}`,
    get_sentiment_analysis: `/api/data/sentiment?topic=${args?.topic || 'crypto'}`,
    get_web3_analytics: '/api/data/web3',
  }
  return baseEndpoints[toolName] || '/api/data/market'
}
