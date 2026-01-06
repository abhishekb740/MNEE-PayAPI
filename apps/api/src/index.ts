import type { IncomingRequestCfProperties } from '@cloudflare/workers-types'
import { config } from '@repo/config'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createAuth } from './auth'
import type { AppContext } from './env'
import { demoTodosRoutes } from './routes/demo-todos'
import { seedRoutes } from './routes/seed'
import data from './routes/data'
import analytics from './routes/analytics'
import agents from './routes/agents'
import demo from './routes/demo'
import tools from './routes/tools'
import providersRoute from './routes/providers'

// Export Durable Objects for Workers runtime
export { DemoAgent } from './agents/demo-agent'

const app = new Hono<AppContext>()

app.use(
  '/*',
  cors({
    origin: (origin) => origin, // Allow all origins (return the requesting origin)
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Payment-Tx', 'X-Provider-Key'],
    exposeHeaders: ['Content-Length', 'X-Request-Id'],
    maxAge: 600,
  }),
)

// Auth routes - handle all Better Auth endpoints
// Note: /api prefix is stripped by the web worker before reaching here
app.on(['POST', 'GET'], '/auth/**', (c) => {
  const auth = createAuth(c.env, c.req.raw.cf as IncomingRequestCfProperties)
  return auth.handler(c.req.raw)
})

const routes = app
  .get('/', (c) =>
    c.json({
      message: `Welcome to ${config.appName} API`,
      description: config.description,
    }),
  )
  .get('/ping', (c) => c.json({ pong: Date.now() }))
  .get('/time', (c) =>
    c.json({
      iso: new Date().toISOString(),
      unix: Date.now(),
    }),
  )
  .get('/random', (c) =>
    c.json({
      number: Math.floor(Math.random() * 100),
      uuid: crypto.randomUUID(),
    }),
  )
  .route('/demo/todos', demoTodosRoutes)
  .route('/seed', seedRoutes)
  .route('/data', data)
  .route('/analytics', analytics)
  .route('/agents', agents)
  .route('/demo', demo)
  .route('/tools', tools)
  .route('/providers', providersRoute)

export type AppType = typeof routes
export default app
