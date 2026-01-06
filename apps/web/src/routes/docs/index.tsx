import { createFileRoute, Link } from '@tanstack/react-router'
import { Layout } from '@/components/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bot, Server, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/docs/')({
  component: DocsIndexPage,
})

function DocsIndexPage() {
  return (
    <Layout>
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="mb-3 text-4xl font-bold">Documentation</h1>
          <p className="text-lg text-muted-foreground">
            Everything you need to get started with PayAPI
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Agent Docs */}
          <Card className="relative overflow-hidden transition-shadow hover:shadow-lg">
            <CardHeader>
              <div className="mb-2 flex size-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                <Bot className="size-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>Agent Integration</CardTitle>
              <CardDescription>For developers building AI agents that consume APIs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Get your API key</li>
                <li>Discover available tools</li>
                <li>Make paid API calls</li>
                <li>Python & JavaScript examples</li>
              </ul>
              <Button asChild className="w-full">
                <Link to="/docs/agents">
                  Read Agent Docs <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Provider Docs */}
          <Card className="relative overflow-hidden transition-shadow hover:shadow-lg">
            <CardHeader>
              <div className="mb-2 flex size-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                <Server className="size-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle>Provider Guide</CardTitle>
              <CardDescription>For API providers who want to earn from their data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Register as a provider</li>
                <li>Submit your APIs</li>
                <li>Define parameters</li>
                <li>Earn 80% revenue share</li>
              </ul>
              <Button asChild variant="outline" className="w-full">
                <Link to="/docs/providers">
                  Read Provider Docs <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="mt-12 rounded-lg border bg-muted/50 p-6 text-center">
          <h3 className="font-semibold">Need help getting started?</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Check out the live demo to see how agents interact with the marketplace.
          </p>
          <div className="mt-4">
            <Button variant="outline" asChild>
              <Link to="/demo">View Live Demo</Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
