import { createFileRoute, Link } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { Bot, Server, ArrowRight } from 'lucide-react'

export const Route = createFileRoute('/dashboard/profile')({
  component: Profile,
})

function Profile() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Profile</h1>
        <p className="mt-2 text-muted-foreground">Your account information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
          <CardDescription>Your PayAPI account information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="font-medium text-sm">Name</p>
              <p className="text-muted-foreground text-sm">{user?.name || '-'}</p>
            </div>
            <div>
              <p className="font-medium text-sm">Email</p>
              <p className="text-muted-foreground text-sm">{user?.email || '-'}</p>
            </div>
            <div>
              <p className="font-medium text-sm">Email Verified</p>
              <p className="text-muted-foreground text-sm">{user?.emailVerified ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="size-5 text-primary" />
              Agent Builder
            </CardTitle>
            <CardDescription>Create AI agents that can discover and pay for APIs</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link to="/dashboard/agents">
                Manage Agents <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Server className="size-5 text-primary" />
              API Provider
            </CardTitle>
            <CardDescription>List your APIs and earn when agents use them</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link to="/dashboard/provider">
                Provider Dashboard <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
