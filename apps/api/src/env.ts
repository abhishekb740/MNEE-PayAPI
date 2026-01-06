import type { Session, User } from 'better-auth'
import type { createAuth } from './auth'
import type { agents } from './db/marketplace.schema'
import type { WorkerEnv } from './env.d'

export type Auth = ReturnType<typeof createAuth>
export type Agent = typeof agents.$inferSelect

export interface AppContext {
  Bindings: WorkerEnv
  Variables: {
    auth: Auth
    user: User | null
    session: Session | null
    apiAgent: Agent | null
  }
}

// Simpler type alias for places that only need bindings
export type Env = WorkerEnv
