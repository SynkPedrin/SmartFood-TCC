'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { Bot, Send, RotateCcw, Brain, BookPlus, MessageSquare, Sparkles } from 'lucide-react'
import Markdown from '@/components/Markdown'
import { useIAChat, nextChatId, type ChatMsg } from '@/lib/ia/useChat'
import { useContasCerebro, type ContaCerebro } from '@/lib/ia/useContas'
import { useBrand } from '@/lib/brand/BrandContext'
import { readableOn } from '@/lib/brand/color'

const SUGESTOES = [
  'Analise meu cardápio atual: quantos produtos e categorias existem, faixa de preços e o que está faltando.',
  'Com base nos produtos cadastrados, sugira 3 melhorias concretas para aumentar as vendas.',
  'Quais produtos estão sem descrição ou indisponíveis no cardápio atual?',
]

/** Saudação com o nome que a IA tem no cérebro daquela conta. */
function saudacao(conta?: ContaCerebro): ChatMsg {
  const nome = conta?.iaNome ?? 'o assistente do SmartFood'
  const casa = conta?.nome ?? 'seu restaurante'
  return {
    id: nextChatId(),
    role: 'assistant',
    content: conta
      ? `Olá. Sou **${nome}**, do ${casa}.\n\nLeio o cérebro desta conta e os dados ao vivo do restaurante. Pode perguntar sobre o cardápio, as mesas ou pedir textos.`
      : 'Olá. Ainda não há um cérebro para a conta ativa, então respondo apenas com os dados ao vivo do restaurante.',
  }
}

function iniciais(nome: string): string {
  const p = nome.trim().split(/\s+/)
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase() || '?'
}

/** Tira a marcação do Markdown para a prévia de uma linha na lista. */
function limpo(texto: string): string {
  return texto.replace(/[#*_`>]/g, '').replace(/\s+/g, ' ').trim()
}

function horaAgora(): string {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export default function IAPage() {
  const { brand } = useBrand()
  const { contas, carregando } = useContasCerebro()

  // Conversa aberta. Começa na conta ativa da marca e passa a ser escolhida na lista.
  const [slug, setSlug] = useState(brand.accountId)
  const conta = contas.find(c => c.slug === slug)

  const { messages, loading, send, reset } = useIAChat('admin', [], slug)

  const [input, setInput] = useState('')
  const [aprendizado, setAprendizado] = useState('')
  const [salvando, setSalvando] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Threads por conta: trocar de conversa e voltar não perde o que já foi dito.
  const threads = useRef<Record<string, ChatMsg[]>>({})
  const slugAtual = useRef(slug)
  const contasCarregadas = useRef(false)

  useEffect(() => { threads.current[slugAtual.current] = messages }, [messages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  // A saudação só entra depois que o vault responde, para abrir a conversa já com
  // o nome certo da IA em vez de trocar a bolha na cara do usuário.
  useEffect(() => {
    if (carregando || contasCarregadas.current) return
    contasCarregadas.current = true
    reset([saudacao(contas.find(c => c.slug === slugAtual.current))])
  }, [contas, carregando, reset])

  const abrirConversa = useCallback((novo: string) => {
    if (novo === slugAtual.current) return
    threads.current[slugAtual.current] = messages
    slugAtual.current = novo
    setSlug(novo)
    setInput('')
    reset(threads.current[novo] ?? [saudacao(contas.find(c => c.slug === novo))])
  }, [messages, reset, contas])

  function submit(text: string) {
    if (!text.trim() || loading) return
    send(text)
    setInput('')
  }

  /** Grava o aprendizado no vault da conta aberta. Vale a partir da próxima resposta. */
  async function ensinar() {
    const texto = aprendizado.trim()
    if (!texto || salvando) return
    setSalvando(true)
    try {
      const res = await fetch('/api/ia/memoria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conta: slug, texto }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? `Erro ${res.status}`)
      setAprendizado('')
      toast.success(`Memorizado em ${data.arquivo}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Não consegui gravar no cérebro')
    } finally {
      setSalvando(false)
    }
  }

  /** Prévia da lista: a última fala da conversa, como num inbox de verdade. */
  const previa = useMemo(() => {
    const mapa: Record<string, string> = {}
    for (const [s, msgs] of Object.entries(threads.current)) {
      const ultima = msgs[msgs.length - 1]
      if (ultima) mapa[s] = limpo(ultima.content)
    }
    const ultima = messages[messages.length - 1]
    if (ultima) mapa[slug] = limpo(ultima.content)
    return mapa
  }, [messages, slug])

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'var(--terracotta)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid var(--ink)',
            }}>
              <MessageSquare size={16} style={{ color: '#fff' }} />
            </div>
            <h1 className="page-title" style={{ marginBottom: 0 }}>Conversas</h1>
          </div>
          <p className="page-sub">Uma conversa por conta, cada uma com o cérebro e a voz da própria IA</p>
        </div>
        <button
          onClick={() => { reset([saudacao(conta)]); setInput('') }}
          className="btn btn-ghost btn-sm"
          style={{ gap: 7 }}
        >
          <RotateCcw size={13} /> Nova conversa
        </button>
      </motion.div>

      <div className="inbox">
        {/* ─── coluna 1: conversas ─── */}
        <aside className="inbox-list">
          <div className="inbox-list-head">
            <div className="inbox-list-title">Caixa de entrada</div>
            <div className="inbox-list-sub">
              {carregando ? 'lendo o vault…' : `${contas.length} conta${contas.length === 1 ? '' : 's'} com cérebro`}
            </div>
          </div>
          <div className="inbox-scroll">
            {contas.map(c => {
              const cor = c.accent ?? '#6e56cf'
              return (
                <button
                  key={c.slug}
                  onClick={() => abrirConversa(c.slug)}
                  className={`inbox-item${c.slug === slug ? ' active' : ''}`}
                >
                  <span className="inbox-avatar" style={{ background: cor, color: readableOn(cor) }}>
                    {iniciais(c.nome)}
                  </span>
                  <span className="inbox-item-body">
                    <span className="inbox-item-top">
                      <span className="inbox-item-name">{c.nome}</span>
                      {c.iaNome && <span className="inbox-item-meta">{c.iaNome}</span>}
                    </span>
                    <span className="inbox-item-preview">
                      {previa[c.slug] ?? c.segmento ?? 'Nenhuma mensagem ainda'}
                    </span>
                  </span>
                </button>
              )
            })}
            {!carregando && !contas.length && (
              <p style={{ padding: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                Nenhuma conta com cérebro no vault.
              </p>
            )}
          </div>
        </aside>

        {/* ─── coluna 2: a conversa ─── */}
        <section className="inbox-thread">
          <header className="chat-head">
            <span
              className="inbox-avatar"
              style={{ background: conta?.accent ?? '#6e56cf', color: readableOn(conta?.accent ?? '#6e56cf'), width: 36, height: 36, borderRadius: 11 }}
            >
              {conta ? iniciais(conta.nome) : <Bot size={16} />}
            </span>
            <div style={{ minWidth: 0 }}>
              <div className="chat-head-name">{conta?.nome ?? brand.accountId}</div>
              <div className="chat-head-sub">
                {conta
                  ? <><Brain size={10} style={{ display: 'inline', verticalAlign: -1, marginRight: 3 }} />{conta.iaNome ? `${conta.iaNome} · ` : ''}cérebro carregado</>
                  : 'sem cérebro, respondendo só com dados ao vivo'}
              </div>
            </div>
          </header>

          <div className="chat-doodle">
            <AnimatePresence initial={false}>
              {messages.map(m => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                  className={`msg-row ${m.role === 'user' ? 'out' : 'in'}`}
                >
                  <div className={`bubble ${m.role === 'user' ? 'out' : 'in'}${m.error ? ' err' : ''}`}>
                    {m.role === 'assistant'
                      ? (m.content ? <Markdown>{m.content}</Markdown> : <TypingDots />)
                      : m.content}
                    {(!m.streaming || m.role === 'user') && m.content && (
                      <span className="bubble-time">{horaAgora()}</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>

          <div className="chat-composer">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(input) } }}
              placeholder="Digite uma mensagem"
              rows={1}
              className="chat-input"
            />
            <button
              onClick={() => submit(input)}
              disabled={!input.trim() || loading}
              className="btn btn-primary btn-icon"
              style={{ borderRadius: '50%', width: 40, height: 40, flexShrink: 0 }}
              aria-label="Enviar mensagem"
            >
              <Send size={16} />
            </button>
          </div>
        </section>

        {/* ─── coluna 3: detalhes da conta ─── */}
        <aside className="inbox-details">
          <div className="details-title">Detalhes da conta</div>

          {conta ? (
            <>
              <div className="details-field">
                <div className="details-label">Restaurante</div>
                <div className="details-value">{conta.nome}</div>
              </div>
              <div className="details-field">
                <div className="details-label">Cérebro</div>
                <div className="details-value">cerebro/Contas/{conta.slug}/</div>
              </div>
              {conta.iaNome && (
                <div className="details-field">
                  <div className="details-label">Nome da IA</div>
                  <div className="details-value">{conta.iaNome}</div>
                </div>
              )}
              {conta.segmento && (
                <div className="details-field">
                  <div className="details-label">Segmento</div>
                  <div className="details-value">{conta.segmento}</div>
                </div>
              )}
              {conta.iaTom && (
                <div className="details-field">
                  <div className="details-label">Tom de voz</div>
                  <div className="details-value" style={{ fontWeight: 500, lineHeight: 1.5 }}>{conta.iaTom}</div>
                </div>
              )}
            </>
          ) : (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              A conta <code>{brand.accountId}</code> não tem cérebro no vault. Crie a pasta
              em <code>cerebro/Contas/</code> ou troque a conta ativa em Personalização.
            </p>
          )}

          {/* Ensinar ao cérebro */}
          <div style={{ marginTop: 20 }}>
            <div className="details-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <BookPlus size={12} /> Ensinar ao cérebro
            </div>
            <p style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 9 }}>
              Vira memória permanente {conta ? `de ${conta.nome}` : 'da conta'} e passa a valer na próxima resposta.
            </p>
            <textarea
              value={aprendizado}
              onChange={e => setAprendizado(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); ensinar() } }}
              placeholder="Ex: não oferecer sobremesa no almoço de semana."
              rows={3}
              maxLength={600}
              style={{
                width: '100%', resize: 'vertical',
                background: '#f6f6f7', border: '1px solid var(--border)',
                borderRadius: 10, padding: '9px 11px',
                fontFamily: 'inherit', fontSize: 12.5,
                color: 'var(--text-primary)', outline: 'none',
              }}
            />
            <button
              onClick={ensinar}
              disabled={!aprendizado.trim() || salvando || !conta}
              className="btn btn-ghost btn-sm"
              style={{ marginTop: 8, width: '100%', justifyContent: 'center', gap: 6 }}
            >
              <BookPlus size={13} /> {salvando ? 'Gravando…' : 'Memorizar'}
            </button>
          </div>

          {/* Sugestões */}
          <div style={{ marginTop: 20 }}>
            <div className="details-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={12} /> Perguntas rápidas
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {SUGESTOES.map(s => (
                <button
                  key={s}
                  onClick={() => submit(s)}
                  disabled={loading}
                  style={{
                    textAlign: 'left', padding: '9px 11px', borderRadius: 10,
                    background: '#fff', border: '1px solid var(--border)',
                    fontSize: 11.5, lineHeight: 1.5, color: 'var(--text-secondary)',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.55 : 1,
                  }}
                >
                  {s.length > 78 ? `${s.slice(0, 78)}…` : s}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '3px 2px' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)', animation: `pulse-dot 1.2s ease ${i * 0.2}s infinite` }} />
      ))}
    </div>
  )
}
