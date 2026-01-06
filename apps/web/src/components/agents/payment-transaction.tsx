import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PaymentTransactionProps {
  txHash: string
  etherscanUrl: string
  amount: string
  network?: string
}

export function PaymentTransaction({
  txHash,
  etherscanUrl,
  amount,
  network,
}: PaymentTransactionProps) {
  return (
    <div className="mt-3 rounded-lg border bg-card p-3 overflow-hidden">
      <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
        <div className="min-w-0 flex-1">
          <div className="text-xs text-muted-foreground">Transaction Hash</div>
          <div className="font-mono text-sm truncate">{txHash}</div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(etherscanUrl, '_blank')}
          className="flex-shrink-0 w-full sm:w-auto"
        >
          <span className="truncate">View on Etherscan</span>
          <ExternalLink className="ml-2 h-3 w-3 flex-shrink-0" />
        </Button>
      </div>
      <div className="mt-2 text-xs text-muted-foreground break-words">
        Amount: {amount} MNEE • Network: {network || 'mainnet'}
      </div>
    </div>
  )
}
