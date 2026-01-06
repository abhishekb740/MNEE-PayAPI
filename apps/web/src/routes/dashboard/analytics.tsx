import { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Bot,
  Server,
  DollarSign,
  Activity,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api } from '@/lib/api'

export const Route = createFileRoute('/dashboard/analytics')({
  component: Analytics,
})

interface AgentData {
  agentId: string
  apiKey: string
}

interface ProviderData {
  providerId: string
  apiKey: string
}

function getStoredAgents(): AgentData[] {
  try {
    const stored = localStorage.getItem('mnee-agents')
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function getStoredProvider(): ProviderData | null {
  try {
    const stored = localStorage.getItem('mnee-provider')
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

function SuccessRateBadge({ rate }: { rate: string }) {
  const numRate = Number.parseFloat(rate)
  const variant = numRate >= 99 ? 'default' : numRate >= 95 ? 'secondary' : 'destructive'
  const color =
    numRate >= 99
      ? 'text-green-600 dark:text-green-400'
      : numRate >= 95
        ? 'text-yellow-600 dark:text-yellow-400'
        : 'text-red-600 dark:text-red-400'

  return <span className={`font-semibold ${color}`}>{rate}%</span>
}

function LatencyDisplay({ latency }: { latency: { p50: number; p95: number; avg: number } }) {
  return (
    <div className="flex gap-4 text-sm">
      <div>
        <span className="text-muted-foreground">p50:</span>{' '}
        <span className="font-medium">{latency.p50}ms</span>
      </div>
      <div>
        <span className="text-muted-foreground">p95:</span>{' '}
        <span className="font-medium">{latency.p95}ms</span>
      </div>
    </div>
  )
}

function Analytics() {
  const [storedAgents, setStoredAgents] = useState<AgentData[]>([])
  const [storedProvider, setStoredProvider] = useState<ProviderData | null>(null)
  const [period, setPeriod] = useState('7d')

  useEffect(() => {
    setStoredAgents(getStoredAgents())
    setStoredProvider(getStoredProvider())
  }, [])

  // Fetch agent analytics
  const agentAnalytics = useQuery({
    queryKey: ['agent-analytics', storedAgents.map((a) => a.apiKey), period],
    queryFn: async () => {
      if (storedAgents.length === 0) return null
      const res = await api.analytics['my-agents'].$post({
        json: { apiKeys: storedAgents.map((a) => a.apiKey), period },
      })
      if (!res.ok) throw new Error('Failed to fetch agent analytics')
      return res.json()
    },
    enabled: storedAgents.length > 0,
  })

  // Fetch provider analytics
  const providerAnalytics = useQuery({
    queryKey: ['provider-analytics', storedProvider?.apiKey, period],
    queryFn: async () => {
      if (!storedProvider?.apiKey) return null
      const res = await api.analytics['my-provider'].$get(
        { query: { period } },
        { headers: { 'X-Provider-Key': storedProvider.apiKey } },
      )
      if (!res.ok) {
        if (res.status === 404) return null
        throw new Error('Failed to fetch provider analytics')
      }
      return res.json()
    },
    enabled: !!storedProvider?.apiKey,
  })

  const hasAgents = storedAgents.length > 0
  const hasProvider = !!storedProvider

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Analytics</h1>
          <p className="mt-2 text-muted-foreground">Track your activity across the marketplace</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24h</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue={hasAgents ? 'agents' : hasProvider ? 'provider' : 'agents'}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="agents" className="flex items-center gap-2">
            <Bot className="size-4" />
            Agent Activity
          </TabsTrigger>
          <TabsTrigger value="provider" className="flex items-center gap-2">
            <Server className="size-4" />
            Provider Activity
          </TabsTrigger>
        </TabsList>

        {/* Agent Activity Tab */}
        <TabsContent value="agents" className="space-y-4 mt-6">
          {hasAgents ? (
            agentAnalytics.isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading analytics...</div>
            ) : agentAnalytics.data ? (
              <>
                {/* Agent Totals */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <DollarSign className="size-4" />
                        Total Spent
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">${agentAnalytics.data.totals.spent}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Activity className="size-4" />
                        Requests
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">
                        {agentAnalytics.data.totals.requests.toLocaleString()}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-sm">
                        <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                          <CheckCircle className="size-3" />
                          {agentAnalytics.data.totals.successful}
                        </span>
                        <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                          <XCircle className="size-3" />
                          {agentAnalytics.data.totals.failed}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Zap className="size-4" />
                        Success Rate
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">
                        <SuccessRateBadge rate={agentAnalytics.data.totals.successRate} />
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Clock className="size-4" />
                        Latency
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">
                        {agentAnalytics.data.totals.latency.avg}ms
                      </p>
                      <LatencyDisplay latency={agentAnalytics.data.totals.latency} />
                    </CardContent>
                  </Card>
                </div>

                {/* Per-Agent Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle>Agent Breakdown</CardTitle>
                    <CardDescription>Performance metrics per agent</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {agentAnalytics.data.agents.length > 0 ? (
                      <div className="space-y-4">
                        {agentAnalytics.data.agents.map((agent: any) => (
                          <div key={agent.id} className="rounded-lg border p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold">{agent.name || 'Unnamed Agent'}</h4>
                                <p className="text-xs text-muted-foreground font-mono">
                                  {agent.walletAddress?.slice(0, 6)}...
                                  {agent.walletAddress?.slice(-4)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">${agent.totalSpent}</p>
                                <p className="text-xs text-muted-foreground">
                                  {agent.requestCount} requests
                                </p>
                              </div>
                            </div>

                            <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Success:</span>{' '}
                                <SuccessRateBadge rate={agent.successRate} />
                              </div>
                              <div>
                                <span className="text-muted-foreground">p50:</span>{' '}
                                <span className="font-medium">{agent.latency.p50}ms</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">p95:</span>{' '}
                                <span className="font-medium">{agent.latency.p95}ms</span>
                              </div>
                            </div>

                            {agent.topTools && agent.topTools.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {agent.topTools.map((tool: any) => (
                                  <Badge key={tool.toolId} variant="secondary">
                                    {tool.toolId}: {tool.count}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">No activity yet</p>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : null
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Bot className="mx-auto size-12 text-muted-foreground/50" />
                <h3 className="mt-4 font-semibold text-lg">No Agents Yet</h3>
                <p className="mt-2 text-muted-foreground">
                  Create an agent to start tracking your API usage
                </p>
                <Button className="mt-4" asChild>
                  <Link to="/dashboard/agents">Create Agent</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Provider Activity Tab */}
        <TabsContent value="provider" className="space-y-4 mt-6">
          {hasProvider ? (
            providerAnalytics.isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading analytics...</div>
            ) : providerAnalytics.data ? (
              <>
                {/* Provider Totals */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200 flex items-center gap-2">
                        <TrendingUp className="size-4" />
                        Total Earned
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-green-800 dark:text-green-200">
                        ${providerAnalytics.data.totals.earned}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Activity className="size-4" />
                        Requests
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">
                        {providerAnalytics.data.totals.requests.toLocaleString()}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-sm">
                        <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                          <CheckCircle className="size-3" />
                          {providerAnalytics.data.totals.successful}
                        </span>
                        <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                          <XCircle className="size-3" />
                          {providerAnalytics.data.totals.failed}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Zap className="size-4" />
                        Success Rate
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">
                        <SuccessRateBadge rate={providerAnalytics.data.totals.successRate} />
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Clock className="size-4" />
                        Latency
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">
                        {providerAnalytics.data.totals.latency.avg}ms
                      </p>
                      <LatencyDisplay latency={providerAnalytics.data.totals.latency} />
                    </CardContent>
                  </Card>
                </div>

                {/* Per-API Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle>API Performance</CardTitle>
                    <CardDescription>Reliability and revenue per API</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {providerAnalytics.data.apis.length > 0 ? (
                      <div className="space-y-4">
                        {providerAnalytics.data.apis.map((apiItem: any) => (
                          <div key={apiItem.id} className="rounded-lg border p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold">{apiItem.name}</h4>
                                  <Badge variant={apiItem.isActive ? 'default' : 'secondary'}>
                                    {apiItem.status}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  ${apiItem.price} per call
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-green-600 dark:text-green-400">
                                  +${apiItem.earned}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {apiItem.requestCount} requests
                                </p>
                              </div>
                            </div>

                            <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Success:</span>{' '}
                                <SuccessRateBadge rate={apiItem.successRate} />
                              </div>
                              <div>
                                <span className="text-muted-foreground">p50:</span>{' '}
                                <span className="font-medium">{apiItem.latency.p50}ms</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">p95:</span>{' '}
                                <span className="font-medium">{apiItem.latency.p95}ms</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground text-sm">No APIs listed yet</p>
                        <Button className="mt-4" variant="outline" asChild>
                          <Link to="/dashboard/provider">Add Your First API</Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : null
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Server className="mx-auto size-12 text-muted-foreground/50" />
                <h3 className="mt-4 font-semibold text-lg">Not a Provider Yet</h3>
                <p className="mt-2 text-muted-foreground">
                  Register as a provider to list your APIs and earn from AI agents
                </p>
                <Button className="mt-4" asChild>
                  <Link to="/dashboard/provider">Become a Provider</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
