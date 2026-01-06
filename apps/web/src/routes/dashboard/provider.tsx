import { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { CheckCircle, Copy, DollarSign, Package, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'

export const Route = createFileRoute('/dashboard/provider')({
  component: ProviderPage,
})

interface ProviderData {
  providerId: string
  apiKey: string
}

interface ApiData {
  id: string
  name: string
  endpoint: string
  price: string
  status: string
  isActive: boolean
}

interface DashboardData {
  provider: {
    id: string
    name: string
    email: string
    walletAddress: string
    status: string
  }
  stats: {
    totalEarnings: string
    totalRequests: number
    apiCount: number
  }
  apis: ApiData[]
}

const STORAGE_KEY = 'mnee-provider'

function getStoredProvider(): ProviderData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

function storeProvider(data: ProviderData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function ProviderPage() {
  const [providerData, setProviderData] = useState<ProviderData | null>(null)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [copied, setCopied] = useState(false)
  const [showApiForm, setShowApiForm] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Provider registration form state
  const [regForm, setRegForm] = useState({
    name: '',
    email: '',
    walletAddress: '',
  })

  // API submission form state
  const [apiForm, setApiForm] = useState({
    name: '',
    description: '',
    externalUrl: '',
    priceUsd: '0.01',
    category: 'data' as const,
  })

  // Parameters for the API
  const [params, setParams] = useState<Array<{ name: string; type: string; description: string }>>(
    [],
  )

  const addParam = () => {
    setParams([...params, { name: '', type: 'string', description: '' }])
  }

  const removeParam = (index: number) => {
    setParams(params.filter((_, i) => i !== index))
  }

  const updateParam = (index: number, field: string, value: string) => {
    const updated = [...params]
    updated[index] = { ...updated[index], [field]: value }
    setParams(updated)
  }

  // Build parameters schema for API
  const buildParametersSchema = () => {
    if (params.length === 0) return undefined
    const properties: Record<string, { type: string; description?: string }> = {}
    for (const p of params) {
      if (p.name) {
        properties[p.name] = { type: p.type, description: p.description || undefined }
      }
    }
    return { type: 'object' as const, properties, required: [] }
  }

  // Load stored provider on mount
  useEffect(() => {
    const loadProvider = async () => {
      const stored = getStoredProvider()
      if (stored) {
        setProviderData(stored)
        // Fetch dashboard inline to avoid dependency issues
        try {
          const res = await api.providers.dashboard.$get(
            {},
            { headers: { 'X-Provider-Key': stored.apiKey } },
          )
          if (res.ok) {
            const data = await res.json()
            setDashboardData(data as DashboardData)
          }
        } catch (error) {
          console.error('Failed to fetch dashboard:', error)
        }
      }
      setIsLoading(false)
    }
    loadProvider()
  }, [])

  const registerMutation = useMutation({
    mutationFn: async (data: typeof regForm) => {
      const res = await api.providers.register.$post(
        { json: data },
        { headers: { Authorization: 'Bearer token' } },
      )
      const result = await res.json()
      // Handle "already registered" as success (returns existing credentials)
      if ('providerId' in result && 'apiKey' in result) {
        return result
      }
      if (!res.ok) {
        // Handle Zod validation errors
        if (
          'error' in result &&
          typeof result.error === 'object' &&
          result.error?.name === 'ZodError'
        ) {
          const zodError = JSON.parse(result.error.message)
          const messages = zodError.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
          throw new Error(messages)
        }
        throw new Error(('error' in result ? result.error : null) || 'Registration failed')
      }
      return result
    },
    onSuccess: (data) => {
      if (!('providerId' in data && 'apiKey' in data)) return
      const provider = {
        providerId: data.providerId,
        apiKey: data.apiKey,
      }
      setProviderData(provider)
      storeProvider(provider) // Persist to localStorage
      // Fetch dashboard data
      fetchDashboard(data.apiKey)
    },
  })

  const submitApiMutation = useMutation({
    mutationFn: async (data: typeof apiForm) => {
      if (!providerData?.apiKey) throw new Error('Not registered as provider')
      const payload = {
        ...data,
        parameters: buildParametersSchema(),
      }
      const res = await api.providers.apis.$post(
        { json: payload },
        { headers: { 'X-Provider-Key': providerData.apiKey } },
      )
      if (!res.ok) {
        const errorData = await res.json()
        // Handle Zod validation errors
        if (
          'error' in errorData &&
          typeof errorData.error === 'object' &&
          errorData.error?.name === 'ZodError'
        ) {
          const zodError = JSON.parse(errorData.error.message)
          const messages = zodError.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
          throw new Error(messages)
        }
        throw new Error(('error' in errorData ? errorData.error : null) || 'API submission failed')
      }
      return res.json()
    },
    onSuccess: () => {
      setShowApiForm(false)
      setApiForm({
        name: '',
        description: '',
        externalUrl: '',
        priceUsd: '0.01',
        category: 'data',
      })
      setParams([]) // Clear parameters
      // Refresh dashboard
      if (providerData?.apiKey) {
        fetchDashboard(providerData.apiKey)
      }
    },
  })

  const fetchDashboard = async (apiKey: string) => {
    try {
      const res = await api.providers.dashboard.$get({}, { headers: { 'X-Provider-Key': apiKey } })
      if (res.ok) {
        const data = await res.json()
        setDashboardData(data as DashboardData)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard:', error)
    }
  }

  const copyApiKey = () => {
    if (providerData?.apiKey) {
      navigator.clipboard.writeText(providerData.apiKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Show loading while checking localStorage
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  // If not registered, show registration form
  if (!providerData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Become a Provider</h1>
          <p className="mt-2 text-muted-foreground">
            List your APIs and earn money every time an AI agent uses them
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Provider Registration</CardTitle>
              <CardDescription>
                Register to start listing your APIs. You'll earn 80% of every API call.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault()
                  registerMutation.mutate(regForm)
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="name">Provider Name</Label>
                  <Input
                    id="name"
                    placeholder="My API Company"
                    required
                    value={regForm.name}
                    onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    placeholder="provider@example.com"
                    required
                    type="email"
                    value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wallet">Wallet Address</Label>
                  <Input
                    id="wallet"
                    placeholder="0x..."
                    required
                    value={regForm.walletAddress}
                    onChange={(e) => setRegForm({ ...regForm, walletAddress: e.target.value })}
                  />
                  <p className="text-muted-foreground text-xs">
                    Your wallet address for receiving payments (80% revenue share)
                  </p>
                </div>

                <Button className="w-full" disabled={registerMutation.isPending} type="submit">
                  {registerMutation.isPending ? 'Registering...' : 'Register as Provider'}
                </Button>

                {registerMutation.isError && (
                  <p className="text-destructive text-sm">{registerMutation.error.message}</p>
                )}
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
              <CardDescription>Earn money when AI agents use your APIs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  1
                </div>
                <div>
                  <p className="font-medium">Register as Provider</p>
                  <p className="text-muted-foreground text-sm">
                    Get your provider API key to manage your listings
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  2
                </div>
                <div>
                  <p className="font-medium">Submit Your APIs</p>
                  <p className="text-muted-foreground text-sm">
                    Add your API endpoints with pricing and descriptions
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  3
                </div>
                <div>
                  <p className="font-medium">Earn 80% Revenue</p>
                  <p className="text-muted-foreground text-sm">
                    When agents pay for your API, you keep 80% of every call
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Registered provider dashboard
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Provider Dashboard</h1>
          <p className="mt-2 text-muted-foreground">Manage your APIs and track earnings</p>
        </div>
        <Button onClick={() => setShowApiForm(true)}>
          <Plus className="mr-2 size-4" />
          Add API
        </Button>
      </div>

      {/* Provider API Key */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="size-5 text-green-500" />
            Provider Registered
          </CardTitle>
          <CardDescription>Use this key to manage your API listings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded bg-muted px-3 py-2 font-mono text-sm">
              {providerData.apiKey}
            </code>
            <Button size="icon" variant="outline" onClick={copyApiKey}>
              {copied ? (
                <CheckCircle className="size-4 text-green-500" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {dashboardData && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="size-5 text-green-500" />
                <span className="text-2xl font-bold">${dashboardData.stats.totalEarnings}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">
                {dashboardData.stats.totalRequests.toLocaleString()}
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Listed APIs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{dashboardData.stats.apiCount}</span>
            </CardContent>
          </Card>
        </div>
      )}

      {/* API Submission Form */}
      {showApiForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New API</CardTitle>
            <CardDescription>Submit your API to the marketplace</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault()
                submitApiMutation.mutate(apiForm)
              }}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="apiName">API Name</Label>
                  <Input
                    id="apiName"
                    placeholder="My Weather API"
                    required
                    value={apiForm.name}
                    onChange={(e) => setApiForm({ ...apiForm, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={apiForm.category}
                    onValueChange={(value) =>
                      setApiForm({ ...apiForm, category: value as typeof apiForm.category })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="crypto">Crypto</SelectItem>
                      <SelectItem value="weather">Weather</SelectItem>
                      <SelectItem value="ai">AI</SelectItem>
                      <SelectItem value="data">Data</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what your API does and what data it returns..."
                  required
                  minLength={10}
                  value={apiForm.description}
                  onChange={(e) => setApiForm({ ...apiForm, description: e.target.value })}
                />
                <p className="text-muted-foreground text-xs">Minimum 10 characters</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="externalUrl">API Endpoint URL</Label>
                  <Input
                    id="externalUrl"
                    placeholder="https://api.example.com/data"
                    required
                    type="url"
                    value={apiForm.externalUrl}
                    onChange={(e) => setApiForm({ ...apiForm, externalUrl: e.target.value })}
                  />
                  <p className="text-muted-foreground text-xs">We'll proxy requests to this URL</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price per Call (USD)</Label>
                  <Input
                    id="price"
                    min="0.001"
                    required
                    step="0.001"
                    type="number"
                    value={apiForm.priceUsd}
                    onChange={(e) => setApiForm({ ...apiForm, priceUsd: e.target.value })}
                  />
                  <p className="text-muted-foreground text-xs">You'll earn 80% of this amount</p>
                </div>
              </div>

              {/* Parameters Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>API Parameters (Optional)</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addParam}>
                    <Plus className="mr-1 size-3" />
                    Add Parameter
                  </Button>
                </div>
                {params.length > 0 && (
                  <div className="space-y-2">
                    {params.map((param, index) => (
                      <div key={index} className="flex items-start gap-2 rounded border p-3">
                        <div className="flex-1 grid gap-2 md:grid-cols-3">
                          <Input
                            placeholder="name"
                            value={param.name}
                            onChange={(e) => updateParam(index, 'name', e.target.value)}
                          />
                          <Select
                            value={param.type}
                            onValueChange={(value) => updateParam(index, 'type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="string">string</SelectItem>
                              <SelectItem value="number">number</SelectItem>
                              <SelectItem value="boolean">boolean</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="description"
                            value={param.description}
                            onChange={(e) => updateParam(index, 'description', e.target.value)}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                          onClick={() => removeParam(index)}
                        >
                          <span className="sr-only">Remove parameter</span>×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-muted-foreground text-xs">
                  Define query parameters your API accepts (e.g., location, symbol, date)
                </p>
              </div>

              <div className="flex gap-2">
                <Button disabled={submitApiMutation.isPending} type="submit">
                  {submitApiMutation.isPending ? 'Submitting...' : 'Submit API'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowApiForm(false)}>
                  Cancel
                </Button>
              </div>

              {submitApiMutation.isError && (
                <p className="text-destructive text-sm">{submitApiMutation.error.message}</p>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      {/* Listed APIs */}
      <Card>
        <CardHeader>
          <CardTitle>Your APIs</CardTitle>
          <CardDescription>APIs you've listed in the marketplace</CardDescription>
        </CardHeader>
        <CardContent>
          {dashboardData?.apis && dashboardData.apis.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.apis.map((api) => (
                <div
                  key={api.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    <Package className="size-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{api.name}</p>
                      <code className="text-muted-foreground text-xs">{api.endpoint}</code>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">${api.price}</span>
                    <Badge variant={api.isActive ? 'default' : 'secondary'}>
                      {api.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <Package className="mx-auto size-12 text-muted-foreground/50" />
              <p className="mt-2 text-muted-foreground">No APIs listed yet</p>
              <Button className="mt-4" variant="outline" onClick={() => setShowApiForm(true)}>
                <Plus className="mr-2 size-4" />
                Add Your First API
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
