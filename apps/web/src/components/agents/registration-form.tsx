import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface RegistrationFormProps {
  onSuccess?: (data: { agentId: string; apiKey: string }) => void
}

export function RegistrationForm({ onSuccess }: RegistrationFormProps) {
  const [walletAddress, setWalletAddress] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const mutation = useMutation({
    mutationFn: async (data: {
      walletAddress: string
      name?: string
      email?: string
    }): Promise<{ agentId: string; apiKey: string; walletAddress: string }> => {
      const res = await api.agents.register.$post({ json: data })
      const responseData = await res.json()

      // If agent already exists, still return the data for display
      if (!res.ok) {
        if ('agentId' in responseData && 'apiKey' in responseData) {
          // Agent already exists - return existing data
          return {
            agentId: responseData.agentId,
            apiKey: responseData.apiKey,
            walletAddress: responseData.walletAddress || data.walletAddress,
          }
        }
        throw new Error(responseData.error || 'Failed to register agent')
      }
      return {
        agentId: responseData.agentId,
        apiKey: responseData.apiKey,
        walletAddress: responseData.walletAddress || data.walletAddress,
      }
    },
    onSuccess: (data) => {
      // Pass name from form state since API doesn't return it
      const agentData = { ...data, name: name || undefined }
      setWalletAddress('')
      setName('')
      setEmail('')
      setErrors({})
      onSuccess?.(agentData)
    },
    onError: (error) => {
      setErrors({ submit: error.message })
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors({})

    // Client-side validation
    const newErrors: Record<string, string> = {}
    if (!walletAddress) {
      newErrors.walletAddress = 'Wallet address is required'
    } else if (!walletAddress.startsWith('0x')) {
      newErrors.walletAddress = 'Wallet address must start with 0x'
    }
    if (email && !email.includes('@')) {
      newErrors.email = 'Invalid email address'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    mutation.mutate({
      walletAddress,
      ...(name && { name }),
      ...(email && { email }),
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register New Agent</CardTitle>
        <CardDescription>
          Register your AI agent to access the marketplace with MNEE payments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="walletAddress">
              Wallet Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="walletAddress"
              placeholder="0x..."
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              aria-invalid={!!errors.walletAddress}
            />
            {errors.walletAddress && (
              <p className="text-sm text-destructive">{errors.walletAddress}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Agent Name (optional)</Label>
            <Input
              id="name"
              placeholder="My Trading Agent"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email (optional)</Label>
            <Input
              id="email"
              type="email"
              placeholder="agent@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!errors.email}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>

          {errors.submit && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {errors.submit}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? 'Registering...' : 'Register Agent'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
