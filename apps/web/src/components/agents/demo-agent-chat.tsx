import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useDemoAgent } from '@/hooks/use-demo-agent'
import { AgentMessage } from './agent-message'
import { AgentStatus } from './agent-status'
import { Play, RotateCcw } from 'lucide-react'
import { useAuthDialog } from '@/components/auth/auth-dialog'
import { useAuth } from '@/hooks/use-auth'

export function DemoAgentChat() {
  const { messages, status, startAgent, reset } = useDemoAgent()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { openDialog } = useAuthDialog()

  return (
    <Card className="flex flex-col h-[calc(100vh-16rem)] max-h-[700px]">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate">Autonomous Agent</CardTitle>
            <CardDescription className="truncate">
              Watch the agent work in real-time
            </CardDescription>
          </div>
          <AgentStatus status={status} />
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 min-h-0 overflow-hidden p-0 pt-0">
        {/* Messages Area */}
        <ScrollArea className="flex-1 h-full px-6">
          {messages.length === 0 && status === 'idle' && (
            <div className="py-4 space-y-4">
              <p className="text-center text-sm text-muted-foreground">
                {isAuthenticated
                  ? 'Click "Launch Agent" to start the autonomous workflow'
                  : 'Sign in to launch the autonomous agent demo (3 runs per hour)'}
              </p>

              {/* System Prompts */}
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Agent System Prompts
                </p>
                <div>
                  <p className="text-xs font-semibold text-primary mb-1">Decision Making</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    "You are an autonomous trading agent with access to various paid data APIs. Your
                    goal is to choose ONE data API that will provide the most value for making a
                    trading recommendation. Consider both the cost and the informational value of
                    each API. Be strategic and cost-conscious."
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-primary mb-1">Analysis</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    "You are a professional trading analyst. Provide concise, actionable trading
                    insights based on the data. Be specific and clear."
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3 py-4">
            {messages.map((message, index) => (
              <AgentMessage key={index} message={message} />
            ))}
          </div>
        </ScrollArea>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-shrink-0 px-6 pb-6">
          {!(isAuthenticated || authLoading) && status === 'idle' && (
            <Button onClick={openDialog} className="w-full gap-2">
              Sign in to Launch Agent
            </Button>
          )}

          {isAuthenticated && status === 'idle' && (
            <Button onClick={startAgent} className="w-full gap-2">
              <Play className="h-4 w-4" />
              Launch Agent
            </Button>
          )}

          {(status === 'completed' || status === 'error') && (
            <Button onClick={reset} variant="outline" className="w-full gap-2">
              <RotateCcw className="h-4 w-4" />
              Reset and Run Again
            </Button>
          )}

          {(status === 'connecting' || status === 'running') && (
            <Button disabled className="w-full">
              Agent is working...
            </Button>
          )}

          {authLoading && status === 'idle' && (
            <Button disabled className="w-full">
              Loading...
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
