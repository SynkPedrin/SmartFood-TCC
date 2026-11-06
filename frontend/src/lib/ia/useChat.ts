'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useBrand } from '@/lib/brand/BrandContext'
import type { IAMode } from './prompts'
import { TOKEN_KEY } from '@/lib/api'

export interface ChatMsg {
  id: number
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
  error?: boolean
}

let seq = 1
const nextId = () => seq++

/**
 * Hook de chat com streaming real via /api/ia/chat (Ollama no servidor, Groq como reserva).
 * Consome o corpo da resposta como texto incremental e atualiza a bolha
 * do assistente em tempo real.
 */
export function useIAChat(mode: IAMode, initial: ChatMsg[], contaOverride?: string, produtoIds?: number[]) {
  const [messages, setMessages] = useState<ChatMsg[]>(initial)
  const [loading, setLoading] = useState(false)
  const [fonte, setFonte] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  // A conta decide qual cérebro do vault responde. O inbox passa a conversa
  // selecionada; sem override, vale a conta ativa da marca.
  const { brand } = useBrand()
  const conta = contaOverride ?? brand.accountId
  const anterior = useRef(conta)
  useEffect(() => {
    if (anterior.current !== conta) { abortRef.current?.abort(); abortRef.current=null; Promise.resolve().then(() => { setMessages(initial); setLoading(false); setFonte(null) }); anterior.current = conta }
    return () => { abortRef.current?.abort() }
    // Apenas a conta deve reiniciar a conversa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conta])

  const send = useCallback(async (text: string) => {
    const prompt = text.trim()
    if (!prompt || loading) return

    const userMsg: ChatMsg = { id: nextId(), role: 'user', content: prompt }
    const aiId = nextId()

    // histórico enviado ao servidor (antes de adicionar a bolha vazia da IA)
    const payload = [...messages, userMsg]
      .filter(m => !m.error)
      .map(m => ({ role: m.role, content: m.content }))

    setMessages(prev => [
      ...prev,
      userMsg,
      { id: aiId, role: 'assistant', content: '', streaming: true },
    ])
    setLoading(true)

    const ctrl = new AbortController()
    abortRef.current = ctrl

    try {
      const res = await fetch('/api/ia/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(mode === 'admin' && localStorage.getItem(TOKEN_KEY) ? { Authorization: `Token ${localStorage.getItem(TOKEN_KEY)}` } : {}) },
        body: JSON.stringify({ mode, conta, messages: payload, produtoIds }),
        signal: ctrl.signal,
      })

      if (!res.ok || !res.body) {
        let detail = ''
        try { detail = (await res.json())?.error ?? '' } catch { /* noop */ }
        throw new Error(detail || `Erro ${res.status}`)
      }

      setFonte(res.headers.get('X-Assistente'))
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let acc = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        acc += decoder.decode(value, { stream: true })
        if (abortRef.current !== ctrl) return
        setMessages(prev =>
          prev.map(m => (m.id === aiId ? { ...m, content: acc } : m)),
        )
      }

      setMessages(prev =>
        prev.map(m =>
          m.id === aiId
            ? { ...m, streaming: false, content: acc || '_(sem resposta)_' }
            : m,
        ),
      )
    } catch (err) {
      if (abortRef.current !== ctrl) return
      const msg =
        err instanceof DOMException && err.name === 'AbortError'
          ? '_(resposta cancelada)_'
          : `⚠️ Não consegui responder agora. ${err instanceof Error ? err.message : ''}`.trim()
      setMessages(prev =>
        prev.map(m =>
          m.id === aiId ? { ...m, streaming: false, content: msg, error: true } : m,
        ),
      )
    } finally {
      if (abortRef.current === ctrl) { setLoading(false); abortRef.current = null }
    }
  }, [messages, loading, mode, conta, produtoIds])

  /** Recomeça a conversa. Aceita uma mensagem só ou uma thread inteira (troca de conversa). */
  const reset = useCallback((inicial: ChatMsg | ChatMsg[]) => {
    abortRef.current?.abort()
    abortRef.current = null
    setMessages(Array.isArray(inicial) ? inicial : [inicial])
    setLoading(false)
  }, [])

  return { messages, loading, send, reset, fonte }
}

export { nextId as nextChatId }
