import { relations, sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// API Providers - Companies/individuals who list APIs on the marketplace
export const providers = sqliteTable(
  'providers',
  {
    id: text('id').primaryKey(), // UUID
    userId: text('user_id').notNull(), // Links to auth user
    name: text('name').notNull(), // Company/provider name
    email: text('email').notNull(),
    walletAddress: text('wallet_address').notNull(), // Where to receive payments
    apiKey: text('api_key').notNull().unique(), // For provider API access
    totalEarned: text('total_earned').notNull().default('0'), // Total USD earned
    status: text('status').notNull().default('pending'), // 'pending', 'approved', 'suspended'
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [index('providers_user_idx').on(table.userId)],
)

// Data API Definitions - Available services in the marketplace
export const dataApis = sqliteTable(
  'data_apis',
  {
    id: text('id').primaryKey(), // e.g., 'market-data'
    providerId: text('provider_id').references(() => providers.id), // null = platform-owned
    name: text('name').notNull(), // e.g., 'Market Data API'
    description: text('description').notNull(),
    endpoint: text('endpoint').notNull().unique(), // e.g., '/api/tools/market-data'
    externalUrl: text('external_url'), // Provider's actual API URL to proxy to
    priceUsd: text('price_usd').notNull(), // e.g., '0.05'
    revenueShare: integer('revenue_share').notNull().default(80), // Provider gets 80%, platform 20%
    category: text('category').notNull(), // e.g., 'finance', 'crypto', 'weather'
    method: text('method').notNull().default('GET'), // HTTP method
    headers: text('headers', { mode: 'json' }), // Required headers for external API
    parameters: text('parameters', { mode: 'json' }), // JSON schema for parameters
    exampleResponse: text('example_response', { mode: 'json' }), // Example response
    isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
    status: text('status').notNull().default('pending'), // 'pending', 'approved', 'rejected'
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index('apis_provider_idx').on(table.providerId),
    index('apis_category_idx').on(table.category),
  ],
)

// Payment Transactions - Track all MNEE payments from agents
export const payments = sqliteTable(
  'payments',
  {
    id: text('id').primaryKey(), // UUID
    txHash: text('tx_hash').notNull().unique(), // Ethereum transaction hash
    agentId: text('agent_id').notNull(), // Agent identifier (wallet address or ID)
    dataApiId: text('data_api_id').notNull(), // Tool ID (built-in or from dataApis)
    amountUsd: text('amount_usd').notNull(), // Amount in USD (MNEE is 1:1)
    amountMnee: text('amount_mnee').notNull(), // Amount in MNEE tokens
    network: text('network').notNull(), // 'mainnet' or 'base-sepolia'
    status: text('status').notNull().default('pending'), // 'pending', 'confirmed', 'failed'
    metadata: text('metadata', { mode: 'json' }), // Additional payment data
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    confirmedAt: integer('confirmed_at', { mode: 'timestamp_ms' }),
  },
  (table) => [
    index('payments_agent_idx').on(table.agentId),
    index('payments_api_idx').on(table.dataApiId),
    index('payments_created_idx').on(table.createdAt),
  ],
)

// Agent Registry - Track registered agents
export const agents = sqliteTable(
  'agents',
  {
    id: text('id').primaryKey(), // UUID
    walletAddress: text('wallet_address').notNull().unique(), // Ethereum wallet address
    name: text('name'), // Optional friendly name
    email: text('email'), // Optional contact email
    apiKey: text('api_key').notNull().unique(), // For authenticated requests
    totalSpent: text('total_spent').notNull().default('0'), // Total USD spent
    requestCount: integer('request_count').notNull().default(0),
    lastActiveAt: integer('last_active_at', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [index('agents_wallet_idx').on(table.walletAddress)],
)

// API Usage Logs - Track every API request for analytics
export const apiUsageLogs = sqliteTable(
  'api_usage_logs',
  {
    id: text('id').primaryKey(),
    dataApiId: text('data_api_id').notNull(), // Tool ID (built-in or from dataApis)
    agentId: text('agent_id').notNull(),
    paymentId: text('payment_id'), // Optional reference to payment
    responseTime: integer('response_time'), // milliseconds
    statusCode: integer('status_code').notNull(),
    success: integer('success', { mode: 'boolean' }).notNull().default(true),
    errorType: text('error_type'), // 'payment_failed', 'provider_error', 'timeout', etc.
    errorMessage: text('error_message'), // Detailed error for debugging
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index('usage_api_idx').on(table.dataApiId),
    index('usage_agent_idx').on(table.agentId),
    index('usage_created_idx').on(table.createdAt),
    index('usage_success_idx').on(table.success),
  ],
)

// Provider Payouts - Track payments to API providers
export const providerPayouts = sqliteTable(
  'provider_payouts',
  {
    id: text('id').primaryKey(),
    providerId: text('provider_id')
      .notNull()
      .references(() => providers.id),
    amount: text('amount').notNull(), // Amount in USD
    txHash: text('tx_hash'), // Payout transaction hash (null if pending)
    status: text('status').notNull().default('pending'), // 'pending', 'processing', 'completed', 'failed'
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
  },
  (table) => [index('payouts_provider_idx').on(table.providerId)],
)

// Relations
export const providersRelations = relations(providers, ({ many }) => ({
  apis: many(dataApis),
  payouts: many(providerPayouts),
}))

export const dataApisRelations = relations(dataApis, ({ one, many }) => ({
  provider: one(providers, {
    fields: [dataApis.providerId],
    references: [providers.id],
  }),
  payments: many(payments),
  usageLogs: many(apiUsageLogs),
}))

export const paymentsRelations = relations(payments, ({ one }) => ({
  dataApi: one(dataApis, {
    fields: [payments.dataApiId],
    references: [dataApis.id],
  }),
}))

export const agentsRelations = relations(agents, ({ many }) => ({
  usageLogs: many(apiUsageLogs),
}))

export const apiUsageLogsRelations = relations(apiUsageLogs, ({ one }) => ({
  dataApi: one(dataApis, {
    fields: [apiUsageLogs.dataApiId],
    references: [dataApis.id],
  }),
  payment: one(payments, {
    fields: [apiUsageLogs.paymentId],
    references: [payments.id],
  }),
}))

export const providerPayoutsRelations = relations(providerPayouts, ({ one }) => ({
  provider: one(providers, {
    fields: [providerPayouts.providerId],
    references: [providers.id],
  }),
}))

// Export all tables as a schema object
export const marketplaceSchema = {
  providers,
  dataApis,
  payments,
  agents,
  apiUsageLogs,
  providerPayouts,
} as const
