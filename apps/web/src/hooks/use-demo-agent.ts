import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/api'

export interface AgentMessage {
  type: 'thought' | 'action' | 'payment' | 'data' | 'recommendation' | 'error'
  content: string
  metadata?: Record<string, any>
  timestamp: number
}

export type AgentStatus = 'idle' | 'connecting' | 'running' | 'completed' | 'error'

const STORAGE_KEY = 'demo-agent-state'

function loadPersistedState(): { messages: AgentMessage[]; status: AgentStatus } {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Only restore if the session is recent (within last 5 minutes)
      const lastMessage = parsed.messages?.[parsed.messages.length - 1]
      if (lastMessage && Date.now() - lastMessage.timestamp < 5 * 60 * 1000) {
        return parsed
      }
    }
  } catch {
    // Ignore storage errors
  }
  return { messages: [], status: 'idle' }
}

function persistState(messages: AgentMessage[], status: AgentStatus) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, status }))
  } catch {
    // Ignore storage errors
  }
}

export function useDemoAgent() {
  const [messages, setMessages] = useState<AgentMessage[]>(() => loadPersistedState().messages)
  const [status, setStatus] = useState<AgentStatus>(() => loadPersistedState().status)
  const [ws, setWs] = useState<WebSocket | null>(null)

  // Persist state changes
  useEffect(() => {
    persistState(messages, status)
  }, [messages, status])

  const startAgent = useCallback(async () => {
    setStatus('connecting')
    setMessages([])

    try {
      // Get WebSocket URL from API
      const res = await api.demo.start.$get()

      // Handle auth errors
      if (res.status === 401) {
        setStatus('error')
        setMessages([
          {
            type: 'error',
            content: 'Please sign in to run the demo agent.',
            timestamp: Date.now(),
          },
        ])
        return
      }

      // Handle rate limit errors
      if (res.status === 429) {
        const errorData = (await res.json()) as { message?: string }
        setStatus('error')
        setMessages([
          {
            type: 'error',
            content: errorData.message || 'Rate limit exceeded. Try again later.',
            timestamp: Date.now(),
          },
        ])
        return
      }

      if (!res.ok) {
        throw new Error('Failed to start agent')
      }

      const data = (await res.json()) as { wsUrl: string }
      const wsUrl = data.wsUrl

      // Connect WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = window.location.host
      const wsConnection = new WebSocket(`${protocol}//${host}/api${wsUrl}`)

      wsConnection.onopen = () => {
        setStatus('running')
      }

      wsConnection.onmessage = (event) => {
        const message: AgentMessage = JSON.parse(event.data)
        setMessages((prev) => [...prev, message])

        if (message.type === 'recommendation') {
          setStatus('completed')
        } else if (message.type === 'error') {
          setStatus('error')
        }
      }

      wsConnection.onerror = (error) => {
        console.error('WebSocket error:', error)
        setStatus('error')
        setMessages((prev) => [
          ...prev,
          {
            type: 'error',
            content: 'WebSocket connection error',
            timestamp: Date.now(),
          },
        ])
      }

      wsConnection.onclose = () => {
        if (status === 'running') {
          setStatus('completed')
        }
      }

      setWs(wsConnection)
    } catch (error) {
      console.error('Failed to start agent:', error)
      setStatus('error')
      setMessages((prev) => [
        ...prev,
        {
          type: 'error',
          content: `Failed to start agent: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: Date.now(),
        },
      ])
    }
  }, [status])

  const reset = useCallback(() => {
    ws?.close()
    setWs(null)
    setMessages([])
    setStatus('idle')
    sessionStorage.removeItem(STORAGE_KEY)
  }, [ws])

  useEffect(() => {
    return () => {
      ws?.close()
    }
  }, [ws])

  return { messages, status, startAgent, reset }
}
