import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PaymentTransaction } from './payment-transaction'
import { AlertCircle, Brain, CreditCard, Database, TrendingUp, Zap } from 'lucide-react'
import type { AgentMessage as AgentMessageType } from '@/hooks/use-demo-agent'

const icons = {
  thought: Brain,
  action: Zap,
  payment: CreditCard,
  data: Database,
  recommendation: TrendingUp,
  error: AlertCircle,
}

const colors = {
  thought: 'bg-blue-500/10 text-blue-600 border-blue-200',
  action: 'bg-green-500/10 text-green-600 border-green-200',
  payment: 'bg-purple-500/10 text-purple-600 border-purple-200',
  data: 'bg-orange-500/10 text-orange-600 border-orange-200',
  recommendation: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
  error: 'bg-red-500/10 text-red-600 border-red-200',
}

interface AgentMessageProps {
  message: AgentMessageType
}

export function AgentMessage({ message }: AgentMessageProps) {
  const Icon = icons[message.type]

  return (
    <Card className={`border-l-4 ${colors[message.type]} overflow-hidden`}>
      <div className="p-4">
        <div className="mb-2 flex items-center gap-2 flex-wrap">
          <Icon className="h-4 w-4 flex-shrink-0" />
          <Badge variant="outline" className="capitalize">
            {message.type}
          </Badge>
          <span className="ml-auto text-xs text-muted-foreground flex-shrink-0">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
        </div>

        <div className="whitespace-pre-wrap text-sm break-words">{message.content}</div>

        {message.type === 'payment' &&
          message.metadata?.txHash &&
          message.metadata?.blockExplorer && (
            <PaymentTransaction
              txHash={message.metadata.txHash}
              etherscanUrl={message.metadata.blockExplorer}
              amount={message.metadata.amount}
              network={message.metadata.network}
            />
          )}

        {message.type === 'data' && message.metadata?.preview && (
          <pre className="mt-2 overflow-x-auto rounded bg-muted p-2 text-xs max-w-full">
            {message.metadata.preview}
          </pre>
        )}
      </div>
    </Card>
  )
}
