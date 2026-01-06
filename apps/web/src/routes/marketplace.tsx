import { createFileRoute, Link } from '@tanstack/react-router'
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Layout } from '@/components/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, Zap } from 'lucide-react'

const marketplaceQueryOptions = queryOptions({
  queryKey: ['marketplace-apis'],
  queryFn: async () => {
    const res = await api.data.$get()
    if (!res.ok) throw new Error('Failed to fetch marketplace data')
    return res.json()
  },
})

export const Route = createFileRoute('/marketplace')({
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(marketplaceQueryOptions),
  component: MarketplacePage,
})

function MarketplacePage() {
  const { data } = useSuspenseQuery(marketplaceQueryOptions)

  return (
    <Layout>
      <div className="container mx-auto max-w-6xl px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="mb-3 text-4xl font-bold">Available APIs</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            These APIs are available for your AI agents to discover and pay for autonomously. Each
            call is a micropayment - no subscriptions required.
          </p>
          <div className="mt-6 flex gap-3">
            <Button asChild variant="outline" size="sm">
              <Link to="/docs/agents" className="gap-2">
                <BookOpen className="size-4" />
                How to use these APIs
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="mb-8 flex items-center gap-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <Zap className="size-4 text-primary" />
            {data.apis.length} APIs available
          </span>
          <span>Starting at $0.01/call</span>
        </div>

        {/* API Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.apis.map((apiItem) => (
            <Card
              key={apiItem.id}
              className="flex flex-col hover:border-primary/50 transition-colors"
            >
              <CardHeader>
                <div className="mb-2 flex items-center justify-between">
                  <Badge variant="secondary">{apiItem.category}</Badge>
                  <span className="text-lg font-bold text-primary">{apiItem.price}</span>
                </div>
                <CardTitle className="text-lg">{apiItem.name}</CardTitle>
                <CardDescription className="line-clamp-2">{apiItem.description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto pt-0">
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground mb-1">Endpoint</p>
                  <code className="text-xs font-mono break-all">{apiItem.endpoint}</code>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            Want to list your own API and earn from AI agents?
          </p>
          <Button asChild variant="outline">
            <Link to="/docs/providers">Become a Provider</Link>
          </Button>
        </div>
      </div>
    </Layout>
  )
}
