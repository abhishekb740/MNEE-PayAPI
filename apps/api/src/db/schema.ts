// Combine all schemas here for migrations
import { users, sessions, accounts, verifications } from './auth.schema'
import {
  providers,
  dataApis,
  payments,
  agents,
  apiUsageLogs,
  providerPayouts,
} from './marketplace.schema'

// Export all tables for drizzle-kit to detect
export {
  users,
  sessions,
  accounts,
  verifications,
  providers,
  dataApis,
  payments,
  agents,
  apiUsageLogs,
  providerPayouts,
}

export const schema = {
  users,
  sessions,
  accounts,
  verifications,
  providers,
  dataApis,
  payments,
  agents,
  apiUsageLogs,
  providerPayouts,
} as const
