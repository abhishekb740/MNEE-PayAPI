import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import type { AgentStatus as AgentStatusType } from '@/hooks/use-demo-agent'

interface AgentStatusProps {
  status: AgentStatusType
}

export function AgentStatus({ status }: AgentStatusProps) {
  const variants = {
    idle: { variant: 'secondary' as const, label: 'Idle', spinning: false },
    connecting: { variant: 'secondary' as const, label: 'Connecting...', spinning: true },
    running: { variant: 'default' as const, label: 'Running', spinning: true },
    completed: { variant: 'default' as const, label: 'Completed', spinning: false },
    error: { variant: 'destructive' as const, label: 'Error', spinning: false },
  }

  const config = variants[status]

  return (
    <Badge variant={config.variant} className="gap-1">
      {config.spinning && <Loader2 className="h-3 w-3 animate-spin" />}
      {config.label}
    </Badge>
  )
}
