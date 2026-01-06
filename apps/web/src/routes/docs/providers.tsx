import { createFileRoute, Link } from '@tanstack/react-router'
import { Layout } from '@/components/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UserPlus, Package, DollarSign, Settings, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/docs/providers')({
  component: ProviderDocsPage,
})

function ProviderDocsPage() {
  return (
    <Layout>
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8">
          <Badge variant="outline" className="mb-4">
            For API Providers
          </Badge>
          <h1 className="mb-3 text-4xl font-bold">Provider Guide</h1>
          <p className="text-lg text-muted-foreground">
            List your APIs and earn money when AI agents use them.
          </p>
        </div>

        {/* Revenue Model */}
        <Card className="mb-8 border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <DollarSign className="size-5" />
              80% Revenue Share
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-700 dark:text-green-300">
              You keep 80% of every API call. When an agent pays $0.10 for your API, you earn $0.08
              sent directly to your wallet.
            </p>
          </CardContent>
        </Card>

        {/* Quick Start */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Start earning in 3 steps</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                1
              </div>
              <div>
                <p className="font-medium">Register as Provider</p>
                <p className="text-sm text-muted-foreground">
                  Enter your name, email, and wallet address to receive payments
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                2
              </div>
              <div>
                <p className="font-medium">Submit Your API</p>
                <p className="text-sm text-muted-foreground">
                  Add your API endpoint URL, set pricing, and define parameters
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                3
              </div>
              <div>
                <p className="font-medium">Start Earning</p>
                <p className="text-sm text-muted-foreground">
                  Once approved, agents can discover and pay for your API
                </p>
              </div>
            </div>
            <div className="pt-2">
              <Button asChild>
                <Link to="/dashboard/provider">
                  Become a Provider <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Sections */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">How It Works</h2>

          {/* Registration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="size-5" />
                Provider Registration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Register to get your provider API key. This key is used to manage your API listings
                (not for consuming tools).
              </p>

              <div>
                <p className="mb-2 text-sm font-medium">Required Information</p>
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  <li>
                    <strong>Provider Name</strong> - Your company or service name
                  </li>
                  <li>
                    <strong>Email</strong> - For account notifications
                  </li>
                  <li>
                    <strong>Wallet Address</strong> - Ethereum address to receive MNEE payments
                  </li>
                </ul>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">After Registration</p>
                <p className="text-sm text-muted-foreground">
                  You'll receive a provider API key (starts with{' '}
                  <code className="rounded bg-muted px-1">prov_</code>). Use this to authenticate
                  when submitting APIs.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Submitting APIs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="size-5" />
                Submitting Your API
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Add your API to the marketplace. We'll proxy requests to your endpoint after
                verifying payment.
              </p>

              <div>
                <p className="mb-2 text-sm font-medium">API Details</p>
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  <li>
                    <strong>Name</strong> - Clear, descriptive name (e.g., "Real-time Weather API")
                  </li>
                  <li>
                    <strong>Description</strong> - What data your API provides
                  </li>
                  <li>
                    <strong>Category</strong> - Finance, Crypto, Weather, AI, Data, or Other
                  </li>
                  <li>
                    <strong>Endpoint URL</strong> - Your API's public URL (we'll proxy to this)
                  </li>
                  <li>
                    <strong>Price</strong> - USD per call (minimum $0.001)
                  </li>
                </ul>
              </div>

              <div className="rounded-lg border p-4">
                <p className="mb-3 text-sm font-medium">Example API Configuration</p>
                <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
                  <code>{`{
  "name": "Stock Price API",
  "description": "Get real-time stock prices with historical data",
  "category": "finance",
  "externalUrl": "https://api.myservice.com/stocks",
  "priceUsd": "0.05",
  "parameters": {
    "type": "object",
    "properties": {
      "symbol": {
        "type": "string",
        "description": "Stock ticker symbol (e.g., AAPL)"
      },
      "range": {
        "type": "string",
        "description": "Time range: 1d, 5d, 1m, 1y"
      }
    },
    "required": []
  }
}`}</code>
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Parameters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="size-5" />
                Defining Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Parameters let agents pass data to your API. They're defined using JSON Schema
                format.
              </p>

              <div>
                <p className="mb-2 text-sm font-medium">Parameter Types</p>
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  <li>
                    <code className="rounded bg-muted px-1">string</code> - Text values
                  </li>
                  <li>
                    <code className="rounded bg-muted px-1">number</code> - Numeric values
                  </li>
                  <li>
                    <code className="rounded bg-muted px-1">boolean</code> - True/false values
                  </li>
                </ul>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">How Parameters Are Sent</p>
                <p className="text-sm text-muted-foreground">
                  When an agent calls your API, we append parameters as query strings:
                </p>
                <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-4 text-sm">
                  <code>{`# Agent's request:
POST /tools/your-api/execute
{ "params": { "symbol": "AAPL", "range": "1d" } }

# We call your endpoint:
GET https://api.myservice.com/stocks?symbol=AAPL&range=1d`}</code>
                </pre>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  API Requirements
                </p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-amber-700 dark:text-amber-300">
                  <li>Your endpoint must accept GET requests</li>
                  <li>Return JSON responses</li>
                  <li>Be publicly accessible (no auth required from our proxy)</li>
                  <li>Respond within 30 seconds</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Payment Flow */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="size-5" />
                Payment & Earnings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Understand how you get paid when agents use your API.
              </p>

              <div>
                <p className="mb-2 text-sm font-medium">Payment Flow</p>
                <ol className="list-inside list-decimal space-y-2 text-sm text-muted-foreground">
                  <li>
                    Agent discovers your API via{' '}
                    <code className="rounded bg-muted px-1">GET /tools</code>
                  </li>
                  <li>Agent sends MNEE payment to our escrow address</li>
                  <li>We verify the on-chain transaction</li>
                  <li>We call your API and return data to the agent</li>
                  <li>Your 80% share is credited to your provider account</li>
                </ol>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">Earnings Example</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="pb-2 text-left font-medium">Your Price</th>
                        <th className="pb-2 text-left font-medium">Agent Pays</th>
                        <th className="pb-2 text-left font-medium">You Earn (80%)</th>
                        <th className="pb-2 text-left font-medium">Platform (20%)</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr className="border-b">
                        <td className="py-2">$0.01</td>
                        <td className="py-2">$0.01</td>
                        <td className="py-2">$0.008</td>
                        <td className="py-2">$0.002</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">$0.10</td>
                        <td className="py-2">$0.10</td>
                        <td className="py-2">$0.08</td>
                        <td className="py-2">$0.02</td>
                      </tr>
                      <tr>
                        <td className="py-2">$1.00</td>
                        <td className="py-2">$1.00</td>
                        <td className="py-2">$0.80</td>
                        <td className="py-2">$0.20</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">Tracking Earnings</p>
                <p className="text-sm text-muted-foreground">
                  View your earnings, request count, and API performance on your{' '}
                  <Link to="/dashboard/provider" className="text-primary hover:underline">
                    Provider Dashboard
                  </Link>
                  .
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-lg border bg-muted/50 p-6">
          <h3 className="font-semibold">Ready to list your API?</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Register as a provider and start earning when AI agents use your data.
          </p>
          <div className="mt-4 flex gap-3">
            <Button asChild>
              <Link to="/dashboard/provider">Become a Provider</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/docs/agents">View Agent Docs</Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
