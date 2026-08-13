import { NextRequest } from 'next/server'
import { loadSnapshot, snapshotToContext } from '@/lib/ia/context'
import { carregarCerebro, cerebroToContext } from '@/lib/ia/cerebro'
import { systemPrompt, type IAMode } from '@/lib/ia/prompts'

// Roda no runtime Node (não Edge): precisa de fetch server-side ao Django
// e da chave GROQ_API_KEY que vive só no servidor.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

interface ChatMessage { role: 'user' | 'assistant' | 'system'; content: string }

interface Body {
  mode?: IAMode
  /** Slug da conta: escolhe qual cérebro do vault será carregado. */
  conta?: string
  messages?: ChatMessage[]
}

/** Conta usada quando o client não manda nenhuma. */
const CONTA_PADRAO = process.env.CEREBRO_CONTA_PADRAO ?? 'smartfood-demo'

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return Response.json(
      { error: 'GROQ_API_KEY não configurada no servidor.' },
      { status: 500 },
    )
  }

  let body: Body
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  const mode: IAMode = body.mode === 'totem' ? 'totem' : 'admin'
  const history = (body.messages ?? []).filter(
    m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim(),
  )

  if (!history.length) {
    return Response.json({ error: 'Nenhuma mensagem enviada.' }, { status: 400 })
  }

  // Duas fontes independentes, ambas best-effort:
  // snapshot = dados ao vivo do Django · cérebro = memória da conta no vault.
  const slug = (body.conta ?? CONTA_PADRAO).trim().toLowerCase()
  const [snapshot, cerebro] = await Promise.all([
    loadSnapshot(),
    carregarCerebro(slug),
  ])
  const context = snapshotToContext(snapshot)
  const memoria = cerebro ? cerebroToContext(cerebro) : null

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt(mode, context, memoria) },
    ...history.slice(-12), // mantém a conversa curta o suficiente pro contexto
  ]

  const groqRes = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',
      messages,
      temperature: mode === 'totem' ? 0.7 : 0.4,
      max_tokens: 1024,
      stream: true,
    }),
  })

  if (!groqRes.ok || !groqRes.body) {
    const detail = await groqRes.text().catch(() => '')
    return Response.json(
      { error: 'Falha ao chamar a Groq.', detail: detail.slice(0, 500) },
      { status: 502 },
    )
  }

  // Reescreve o SSE da Groq (OpenAI-compat) como um stream de texto puro,
  // extraindo apenas os deltas de conteúdo, mais simples pro client consumir.
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = groqRes.body!.getReader()
      let buffer = ''
      try {
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''
          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed.startsWith('data:')) continue
            const data = trimmed.slice(5).trim()
            if (data === '[DONE]') { controller.close(); return }
            try {
              const json = JSON.parse(data)
              const delta = json.choices?.[0]?.delta?.content
              if (delta) controller.enqueue(encoder.encode(delta))
            } catch {
              // ignora keep-alives / linhas parciais
            }
          }
        }
        controller.close()
      } catch (err) {
        controller.error(err)
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      // Qual cérebro respondeu: facilita depurar e provar o isolamento por conta.
      'X-Cerebro': cerebro ? cerebro.conta.slug : 'nenhum',
    },
  })
}
