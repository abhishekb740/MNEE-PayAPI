import { createFileRoute, Link } from '@tanstack/react-router'
import { Layout } from '@/components/layout'
import { DemoAgentChat } from '@/components/agents/demo-agent-chat'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export const Route = createFileRoute('/demo')({
  component: DemoPage,
})

function DemoPage() {
  return (
    <Layout>
      <div className="container mx-auto max-w-4xl px-4 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-3 text-4xl font-bold">See It In Action</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Watch an AI agent autonomously discover APIs, decide which to use, pay for data, and
            deliver results - no human intervention.
          </p>
        </div>

        {/* Demo Chat */}
        <div className="mb-8">
          <DemoAgentChat />
        </div>

        {/* What You Just Saw */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4">What happens when you click "Launch Agent":</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
              <div>
                <div className="font-medium text-primary">1. Discovery</div>
                <p className="text-muted-foreground">
                  Agent queries available APIs and their prices
                </p>
              </div>
              <div>
                <div className="font-medium text-primary">2. Decision</div>
                <p className="text-muted-foreground">AI evaluates options and picks the best one</p>
              </div>
              <div>
                <div className="font-medium text-primary">3. Payment</div>
                <p className="text-muted-foreground">Sends micropayment via blockchain</p>
              </div>
              <div>
                <div className="font-medium text-primary">4. Result</div>
                <p className="text-muted-foreground">Receives data and completes its task</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Ready to build your own autonomous agent?</p>
          <div className="flex justify-center gap-4">
            <Button asChild>
              <Link to="/docs/agents" className="gap-2">
                Start Building
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/marketplace">Browse APIs</Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
