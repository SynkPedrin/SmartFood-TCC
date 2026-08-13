'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { Bot, Send, User, RotateCcw, ChevronRight, Brain, BookPlus } from 'lucide-react'
import Markdown from '@/components/Markdown'
import { useIAChat, nextChatId, type ChatMsg } from '@/lib/ia/useChat'
import { useContasCerebro } from '@/lib/ia/useContas'
import { useBrand } from '@/lib/brand/BrandContext'

const SUGGESTIONS = [
  { label: 'Resumo do cardápio',   prompt: 'Analise meu cardápio atual: quantos produtos e categorias existem, faixa de preços e o que está faltando.' },
  { label: 'Gerar descrição',      prompt: 'Gere uma descrição curta e apetitosa para um "Frango Grelhado com limão, alho e azeite".' },
  { label: 'Otimizar cardápio',    prompt: 'Com base nos produtos cadastrados, sugira 3 melhorias concretas para aumentar as vendas.' },
  { label: 'Produtos sem foto',    prompt: 'Quais produtos estão sem descrição ou indisponíveis no cardápio atual?' },
  { label: 'Ideia de promoção',    prompt: 'Sugira uma promoção usando os pratos que realmente existem no meu cardápio.' },
]

const GREETING = `Olá. Sou o assistente do SmartFood.

Estou conectado aos dados reais do seu restaurante: produtos, categorias e mesas cadastrados. Posso analisar o cardápio, gerar descrições de pratos e sugerir promoções com base no que existe.

Escolha uma sugestão ao lado ou escreva sua pergunta.`

function makeGreeting(): ChatMsg {
  return { id: nextChatId(), role: 'assistant', content: GREETING }
}

export default function IAPage() {
  const { messages, loading, send, reset } = useIAChat('admin', [makeGreeting()])
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const { brand } = useBrand()
  const { contas } = useContasCerebro()
  const conta = contas.find(c => c.slug === brand.accountId)

  // Ensinar ao cérebro
  const [aprendizado, setAprendizado] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function submit(text: string) {
    if (!text.trim() || loading) return
    send(text)
    setInput('')
  }

  /** Grava o aprendizado no vault da conta. Vale a partir da próxima resposta. */
  async function ensinar() {
    const texto = aprendizado.trim()
    if (!texto || salvando) return
    setSalvando(true)
    try {
      const res = await fetch('/api/ia/memoria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conta: brand.accountId, texto }),
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

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg, #8b4dff, #00e0b8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid var(--border)', boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
              }}>
                <Bot size={17} style={{ color: '#fff' }} />
              </div>
              <h1 className="page-title" style={{ marginBottom: 0 }}>Assistente IA</h1>
            </div>
            <p className="page-sub">Converse com os dados do restaurante: cardápio, mesas e operação</p>
            <p style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>
              <Brain size={13} style={{ color: 'var(--terracotta)' }} />
              {conta
                ? <>Cérebro ativo: <strong style={{ color: 'var(--text-secondary)' }}>{conta.nome}</strong>{conta.iaNome ? ` · IA ${conta.iaNome}` : ''}</>
                : <>Sem cérebro para a conta <code>{brand.accountId}</code>. Respondendo só com os dados ao vivo.</>}
            </p>
          </div>
          <button onClick={() => { reset(makeGreeting()); setInput('') }} className="btn btn-ghost btn-sm" style={{ gap: 7 }}>
            <RotateCcw size={13} /> Nova conversa
          </button>
        </div>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24, alignItems: 'start' }}>

        {/* Chat area */}
        <div style={{
          background: '#fff',
          border: '1px solid var(--border)',
          borderRadius: 20,
          boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
          display: 'flex', flexDirection: 'column',
          height: 'calc(100vh - 220px)', minHeight: 520,
          overflow: 'hidden',
        }}>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            <AnimatePresence initial={false}>
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                  style={{
                    display: 'flex',
                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                    gap: 10, marginBottom: 18, alignItems: 'flex-start',
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                    background: msg.role === 'assistant'
                      ? 'linear-gradient(135deg, #8b4dff, #00e0b8)'
                      : 'rgba(0,0,0,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid var(--border)',
                    boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
                    marginTop: 2,
                  }}>
                    {msg.role === 'assistant'
                      ? <Bot size={15} style={{ color: '#fff' }} />
                      : <User size={15} style={{ color: 'var(--text-secondary)' }} />
                    }
                  </div>

                  {/* Bubble */}
                  <div style={{
                    maxWidth: '78%',
                    background: msg.role === 'assistant'
                      ? (msg.error ? '#fef2f2' : '#f6f6f7')
                      : 'linear-gradient(135deg, #7b2eff, #00e0b8)',
                    border: msg.role === 'assistant'
                      ? `2px solid ${msg.error ? 'rgba(239,68,68,0.30)' : 'rgba(0,0,0,0.12)'}`
                      : '1px solid var(--border)',
                    borderRadius: msg.role === 'assistant' ? '4px 18px 18px 18px' : '18px 4px 18px 18px',
                    padding: '14px 16px',
                    boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
                  }}>
                    {msg.role === 'assistant'
                      ? (
                        <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-primary)' }}>
                          {msg.content
                            ? <Markdown>{msg.content}</Markdown>
                            : <TypingDots />}
                          {msg.streaming && msg.content && (
                            <span style={{ display: 'inline-block', width: 2, height: 15, background: '#7b2eff', marginLeft: 2, verticalAlign: 'middle', animation: 'pulse-dot 0.8s ease infinite', borderRadius: 2 }} />
                          )}
                        </div>
                      )
                      : <div style={{ fontSize: 14, lineHeight: 1.65, color: '#fff', fontWeight: 500 }}>{msg.content}</div>
                    }
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            borderTop: '1px solid var(--border)',
            padding: '14px 16px',
            display: 'flex', gap: 10, alignItems: 'flex-end',
            background: '#fff',
          }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(input) } }}
              placeholder="Digite sua pergunta... (Enter para enviar)"
              rows={1}
              style={{
                flex: 1, resize: 'none', overflow: 'hidden',
                background: '#f6f6f7', border: '1px solid var(--border)',
                borderRadius: 12, padding: '10px 14px',
                fontFamily: 'Inter, sans-serif', fontSize: 14,
                color: 'var(--text-primary)', outline: 'none',
                boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
                transition: 'border-color 0.18s, box-shadow 0.18s',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = '#7b2eff'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.18)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)' }}
            />
            <button
              onClick={() => submit(input)}
              disabled={!input.trim() || loading}
              className="btn btn-primary btn-icon"
              style={{ borderRadius: 12, flexShrink: 0 }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>

        {/* Suggestions sidebar */}
        <div>
          <h3 style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>
            Sugestões rápidas
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {SUGGESTIONS.map((s, i) => (
              <motion.button
                key={s.label}
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => submit(s.prompt)}
                disabled={loading}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 14px', borderRadius: 12, textAlign: 'left',
                  background: '#fff',
                  border: '1px solid var(--border)',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
                  cursor: loading ? 'not-allowed' : 'pointer', width: '100%',
                  fontSize: 13, fontWeight: 600,
                  color: 'var(--text-secondary)',
                  fontFamily: 'Inter, sans-serif',
                  transition: 'all 0.16s ease',
                  opacity: loading ? 0.55 : 1,
                }}
                onMouseEnter={e => {
                  if (loading) return
                  e.currentTarget.style.background = 'rgba(123,46,255,0.07)'
                  e.currentTarget.style.borderColor = 'rgba(123,46,255,0.35)'
                  e.currentTarget.style.color = '#7b2eff'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#fff'
                  e.currentTarget.style.borderColor = 'rgba(0,0,0,0.18)'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }}
              >
                <Bot size={14} style={{ flexShrink: 0, color: '#7b2eff', opacity: 0.7 }} />
                <span style={{ flex: 1 }}>{s.label}</span>
                <ChevronRight size={13} style={{ flexShrink: 0, opacity: 0.4 }} />
              </motion.button>
            ))}
          </div>

          {/* Ensinar ao cérebro da conta */}
          <div style={{ marginTop: 20, padding: 14, borderRadius: 14, background: '#fff', border: '1px solid var(--border)', boxShadow: '0 6px 16px rgba(0,0,0,0.06)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
              <BookPlus size={14} style={{ color: 'var(--terracotta)' }} /> Ensinar ao cérebro
            </h3>
            <p style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 10 }}>
              O que você escrever vira memória permanente {conta ? `de ${conta.nome}` : 'da conta'} e passa a valer na próxima resposta.
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
                fontFamily: 'Inter, sans-serif', fontSize: 12.5,
                color: 'var(--text-primary)', outline: 'none',
              }}
            />
            <button
              onClick={ensinar}
              disabled={!aprendizado.trim() || salvando}
              className="btn btn-ghost btn-sm"
              style={{ marginTop: 8, width: '100%', justifyContent: 'center', gap: 6 }}
            >
              <BookPlus size={13} /> {salvando ? 'Gravando…' : 'Memorizar'}
            </button>
          </div>

          <div style={{ marginTop: 16, padding: '14px', borderRadius: 14, background: 'rgba(123,46,255,0.07)', border: '2px solid rgba(123,46,255,0.20)', boxShadow: '0 6px 16px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
              <strong style={{ color: 'var(--terracotta)' }}>Respostas ao vivo</strong> geradas pela Groq (Llama 3.3), com base nos produtos, categorias e mesas cadastrados mais o cérebro da conta. Com o backend offline, o assistente avisa e responde apenas com o cérebro e conhecimento geral.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '2px 0' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#7b2eff', animation: `pulse-dot 1.2s ease ${i * 0.2}s infinite` }} />
      ))}
    </div>
  )
}
