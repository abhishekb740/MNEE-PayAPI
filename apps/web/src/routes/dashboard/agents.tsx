import { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Bot, CheckCircle, Copy, Plus, Trash2 } from 'lucide-react'
import { RegistrationForm } from '@/components/agents/registration-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/dashboard/agents')({
  component: AgentsPage,
})

interface AgentData {
  agentId: string
  apiKey: string
  walletAddress: string
  name?: string
  createdAt: string
}

const STORAGE_KEY = 'mnee-agents'

function getStoredAgents(): AgentData[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function storeAgents(agents: AgentData[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(agents))
}

function AgentsPage() {
  const [agents, setAgents] = useState<AgentData[]>([])
  const [showForm, setShowForm] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    setAgents(getStoredAgents())
  }, [])

  const addAgent = (data: {
    agentId: string
    apiKey: string
    walletAddress?: string
    name?: string
  }) => {
    const newAgent: AgentData = {
      agentId: data.agentId,
      apiKey: data.apiKey,
      walletAddress: data.walletAddress || '',
      name: data.name,
      createdAt: new Date().toISOString(),
    }
    const updated = [newAgent, ...agents]
    setAgents(updated)
    storeAgents(updated)
    setShowForm(false)
  }

  const removeAgent = (agentId: string) => {
    const updated = agents.filter((a) => a.agentId !== agentId)
    setAgents(updated)
    storeAgents(updated)
  }

  const copyApiKey = (agentId: string, apiKey: string) => {
    navigator.clipboard.writeText(apiKey)
    setCopiedId(agentId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">My Agents</h1>
          <p className="mt-2 text-muted-foreground">Manage your AI agents and their API keys</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 size-4" />
            Create Agent
          </Button>
        )}
      </div>

      {/* Registration Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Agent</CardTitle>
            <CardDescription>Register an AI agent to get an API key</CardDescription>
          </CardHeader>
          <CardContent>
            <RegistrationForm onSuccess={(data) => addAgent(data)} />
            <Button className="mt-4" variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Agents List */}
      {agents.length > 0 ? (
        <div className="space-y-4">
          {agents.map((agent) => (
            <Card key={agent.agentId}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                      <Bot className="size-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{agent.name || 'Unnamed Agent'}</h3>
                        <Badge variant="outline">Active</Badge>
                      </div>
                      <p className="font-mono text-muted-foreground text-xs">
                        ID: {agent.agentId.slice(0, 8)}...
                      </p>
                      {agent.walletAddress && (
                        <p className="font-mono text-muted-foreground text-xs">
                          Wallet: {agent.walletAddress.slice(0, 6)}...
                          {agent.walletAddress.slice(-4)}
                        </p>
                      )}
                      <p className="text-muted-foreground text-xs">
                        Created: {new Date(agent.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyApiKey(agent.agentId, agent.apiKey)}
                    >
                      {copiedId === agent.agentId ? (
                        <>
                          <CheckCircle className="mr-2 size-4 text-green-500" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 size-4" />
                          Copy API Key
                        </>
                      )}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => removeAgent(agent.agentId)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                {/* API Key Display */}
                <div className="mt-4 rounded-lg bg-muted p-3">
                  <p className="mb-1 text-muted-foreground text-xs">API Key</p>
                  <code className="break-all font-mono text-sm">{agent.apiKey}</code>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        !showForm && (
          <Card>
            <CardContent className="py-12 text-center">
              <Bot className="mx-auto size-12 text-muted-foreground/50" />
              <h3 className="mt-4 font-semibold text-lg">No Agents Yet</h3>
              <p className="mt-2 text-muted-foreground">
                Create an agent to get an API key and start using the marketplace
              </p>
              <Button className="mt-4" onClick={() => setShowForm(true)}>
                <Plus className="mr-2 size-4" />
                Create Your First Agent
              </Button>
            </CardContent>
          </Card>
        )
      )}

      {/* Usage Guide */}
      {agents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
            <CardDescription>How to use your API key</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="mb-2 font-medium">1. List available tools</p>
                <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-sm">
                  <code>{`curl -H "X-API-Key: YOUR_API_KEY" \\
  ${import.meta.env.DEV ? 'http://localhost:8787' : ''}/api/tools`}</code>
                </pre>
              </div>

              <div>
                <p className="mb-2 font-medium">
                  2. Execute a tool (returns 402 with payment info)
                </p>
                <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-sm">
                  <code>{`curl -X POST -H "X-API-Key: YOUR_API_KEY" \\
  ${import.meta.env.DEV ? 'http://localhost:8787' : ''}/api/tools/market/execute`}</code>
                </pre>
              </div>

              <div>
                <p className="mb-2 font-medium">3. Pay and retry with transaction hash</p>
                <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-sm">
                  <code>{`curl -X POST \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "X-Payment-Tx: 0xYOUR_TX_HASH" \\
  ${import.meta.env.DEV ? 'http://localhost:8787' : ''}/api/tools/market/execute`}</code>
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
