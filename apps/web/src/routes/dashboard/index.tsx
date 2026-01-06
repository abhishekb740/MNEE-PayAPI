import { Link, createFileRoute } from '@tanstack/react-router'
import { BookOpen, Key, ShoppingBag, Zap } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'

export const Route = createFileRoute('/dashboard/')({
  component: Dashboard,
})

function Dashboard() {
  const { user } = useAuth()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Welcome back, {user?.name}!</p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="transition-colors hover:border-primary/50">
          <CardHeader className="pb-2">
            <Key className="size-8 text-primary" />
          </CardHeader>
          <CardContent>
            <CardTitle className="text-base">Create Agent</CardTitle>
            <CardDescription className="mt-1">Get an API key for your AI agent</CardDescription>
            <Button asChild className="mt-4" size="sm" variant="outline">
              <Link to="/dashboard/agents">Get Started</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="transition-colors hover:border-primary/50">
          <CardHeader className="pb-2">
            <ShoppingBag className="size-8 text-primary" />
          </CardHeader>
          <CardContent>
            <CardTitle className="text-base">Browse Tools</CardTitle>
            <CardDescription className="mt-1">Explore available data APIs</CardDescription>
            <Button asChild className="mt-4" size="sm" variant="outline">
              <Link to="/marketplace">View Marketplace</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="transition-colors hover:border-primary/50">
          <CardHeader className="pb-2">
            <BookOpen className="size-8 text-primary" />
          </CardHeader>
          <CardContent>
            <CardTitle className="text-base">Read Docs</CardTitle>
            <CardDescription className="mt-1">Learn how to integrate</CardDescription>
            <Button asChild className="mt-4" size="sm" variant="outline">
              <Link to="/docs">View Docs</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="transition-colors hover:border-primary/50">
          <CardHeader className="pb-2">
            <Zap className="size-8 text-primary" />
          </CardHeader>
          <CardContent>
            <CardTitle className="text-base">Try Demo</CardTitle>
            <CardDescription className="mt-1">See a live agent in action</CardDescription>
            <Button asChild className="mt-4" size="sm" variant="outline">
              <Link to="/demo">Watch Demo</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>Follow these steps to integrate with the marketplace</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-inside list-decimal space-y-3 text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">Create an Agent</span> - Register your
              AI agent to get an API key
            </li>
            <li>
              <span className="font-medium text-foreground">Discover Tools</span> - Call{' '}
              <code className="rounded bg-muted px-1">GET /api/tools</code> to list available APIs
            </li>
            <li>
              <span className="font-medium text-foreground">Execute Tools</span> - Call{' '}
              <code className="rounded bg-muted px-1">POST /api/tools/:id/execute</code> to use a
              tool
            </li>
            <li>
              <span className="font-medium text-foreground">Handle Payment</span> - When you get a
              402 response, send payment and retry with your transaction hash
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
