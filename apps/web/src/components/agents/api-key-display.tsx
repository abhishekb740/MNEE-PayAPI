import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ApiKeyDisplayProps {
  apiKey: string
  agentId: string
  walletAddress?: string
}

export function ApiKeyDisplay({ apiKey, agentId, walletAddress }: ApiKeyDisplayProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(apiKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-primary">Agent Registered Successfully!</CardTitle>
        <CardDescription>Save your API key securely - it won't be shown again</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="api-key" className="text-sm font-medium">
            API Key
          </label>
          <div className="flex gap-2">
            <Input
              id="api-key"
              value={apiKey}
              readOnly
              className="font-mono text-sm"
              onClick={(e) => e.currentTarget.select()}
            />
            <Button onClick={copyToClipboard} variant="outline" className="shrink-0">
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="agent-id" className="text-sm font-medium">
            Agent ID
          </label>
          <Input id="agent-id" value={agentId} readOnly className="font-mono text-sm" />
        </div>

        {walletAddress && (
          <div className="space-y-2">
            <label htmlFor="wallet" className="text-sm font-medium">
              Wallet Address
            </label>
            <Input id="wallet" value={walletAddress} readOnly className="font-mono text-sm" />
          </div>
        )}

        <div className="rounded-md bg-muted p-4 text-sm">
          <p className="mb-2 font-medium">Next steps:</p>
          <ul className="list-inside list-disc space-y-1 text-muted-foreground">
            <li>Include this API key in your agent's HTTP headers</li>
            <li>Fund your wallet with MNEE tokens</li>
            <li>Browse the marketplace to access data APIs</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
