'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, X, ChefHat, User } from 'lucide-react'
import Markdown from '@/components/Markdown'
import { useIAChat, nextChatId, type ChatMsg } from '@/lib/ia/useChat'

const CHIPS = [
  'O que você recomenda?',
  'Tem opção vegetariana?',
  'Qual é o prato mais pedido?',
  'O que combina para beber?',
]

function greeting(): ChatMsg {
  return {
    id: nextChatId(),
    role: 'assistant',
    content: 'Olá! Posso recomendar pratos, explicar ingredientes e sugerir combinações do nosso cardápio. O que você está com vontade de comer?',
  }
}

/**
 * Assistente de IA do totem ("Chef IA"): botão flutuante + bottom-sheet de chat.
 * Fala com o cliente na mesa via /api/ia/chat (mode=totem), recomendando
 * apenas pratos reais do cardápio.
 */
export default function ChefIA({ raised = false }: { raised?: boolean }) {
  const [open, setOpen] = useState(false)
  const { messages, loading, send, reset } = useIAChat('totem', [greeting()])
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  function submit(text: string) {
    if (!text.trim() || loading) return
    send(text)
    setInput('')
  }

  return (
    <>
      {/* Floating action button */}
      <motion.button
        onClick={() => setOpen(true)}
        aria-label="Abrir Chef IA"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: open ? 0 : 1, opacity: open ? 0 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        whileHover={{ scale: 1.06, y: -2 }}
        whileTap={{ scale: 0.94 }}
        style={{
          position: 'fixed',
          right: 20,
          bottom: raised ? 104 : 24,
          zIndex: 400,
          width: 60, height: 60, borderRadius: '50%',
          background: 'linear-gradient(135deg, #8b4dff, #6a1fe0, #00e0b8)',
          border: '1px solid var(--border)',
          boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          transition: 'bottom 0.25s ease',
        }}
      >
        <ChefHat size={26} style={{ color: '#fff' }} />
        <span style={{
          position: 'absolute', top: -4, right: -4,
          background: '#fff', color: '#7b2eff',
          fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 999,
          border: '1px solid var(--border)', letterSpacing: '0.02em',
          fontFamily: 'Inter, sans-serif',
        }}>IA</span>
      </motion.button>

      {/* Chat sheet */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: 520,
                height: '78dvh', maxHeight: 720,
                background: '#fff',
                border: '1px solid var(--border)',
                borderBottom: 'none',
                borderRadius: '22px 22px 0 0',
                boxShadow: '0 1px 0 0 rgba(0,0,0,0.05)',
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: 'linear-gradient(135deg, #8b4dff, #00e0b8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid var(--border)', boxShadow: '0 6px 16px rgba(0,0,0,0.06)', flexShrink: 0,
                }}>
                  <ChefHat size={20} style={{ color: '#fff' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 17, fontWeight: 800, color: '#111111', letterSpacing: '-0.03em' }}>Chef IA</div>
                  <div style={{ fontSize: 12, color: 'rgba(17,17,17,0.50)', fontWeight: 600 }}>Recomendações do cardápio</div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Fechar"
                  style={{ background: 'rgba(0,0,0,0.06)', border: '1px solid var(--border)', borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 6px 16px rgba(0,0,0,0.06)' }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                      gap: 9, marginBottom: 14, alignItems: 'flex-start',
                    }}
                  >
                    <div style={{
                      width: 30, height: 30, borderRadius: 9, flexShrink: 0, marginTop: 2,
                      background: msg.role === 'assistant' ? 'linear-gradient(135deg, #8b4dff, #00e0b8)' : 'rgba(0,0,0,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '1px solid var(--border)', boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
                    }}>
                      {msg.role === 'assistant' ? <ChefHat size={13} style={{ color: '#fff' }} /> : <User size={13} style={{ color: 'var(--text-secondary)' }} />}
                    </div>
                    <div style={{
                      maxWidth: '80%',
                      background: msg.role === 'assistant' ? (msg.error ? '#fef2f2' : '#f6f6f7') : 'linear-gradient(135deg, #7b2eff, #00e0b8)',
                      border: `2px solid ${msg.role === 'assistant' ? (msg.error ? 'rgba(239,68,68,0.30)' : 'rgba(0,0,0,0.12)') : 'rgba(0,0,0,0.30)'}`,
                      borderRadius: msg.role === 'assistant' ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                      padding: '11px 14px',
                      boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
                    }}>
                      {msg.role === 'assistant'
                        ? (msg.content ? <Markdown>{msg.content}</Markdown> : <Dots />)
                        : <div style={{ fontSize: 14, lineHeight: 1.55, color: '#fff', fontWeight: 500 }}>{msg.content}</div>}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Suggestion chips */}
              {messages.length <= 1 && (
                <div style={{ display: 'flex', gap: 8, padding: '0 16px 10px', flexWrap: 'wrap', flexShrink: 0 }}>
                  {CHIPS.map(c => (
                    <button
                      key={c}
                      onClick={() => submit(c)}
                      disabled={loading}
                      style={{
                        padding: '8px 13px', borderRadius: 999,
                        border: '2px solid rgba(123,46,255,0.30)', background: 'rgba(123,46,255,0.06)',
                        fontSize: 12.5, fontWeight: 700, color: '#7b2eff', cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif', boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
                      }}
                    >{c}</button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div style={{ borderTop: '1px solid var(--border)', padding: '12px 14px', display: 'flex', gap: 9, alignItems: 'flex-end', flexShrink: 0 }}>
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(input) } }}
                  placeholder="Pergunte ao Chef..."
                  rows={1}
                  style={{
                    flex: 1, resize: 'none', overflow: 'hidden',
                    background: '#f6f6f7', border: '1px solid var(--border)', borderRadius: 12,
                    padding: '11px 14px', fontFamily: 'Inter, sans-serif', fontSize: 14,
                    color: 'var(--text-primary)', outline: 'none', boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
                    minHeight: 44,
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#7b2eff'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.18)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)' }}
                />
                <button
                  onClick={() => submit(input)}
                  disabled={!input.trim() || loading}
                  aria-label="Enviar"
                  style={{
                    flexShrink: 0, width: 46, height: 46, borderRadius: 12,
                    background: input.trim() && !loading ? 'linear-gradient(135deg, #7b2eff, #00e0b8)' : 'rgba(0,0,0,0.12)',
                    border: '1px solid var(--border)', boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                  }}
                >
                  <Send size={17} style={{ color: '#fff' }} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function Dots() {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '2px 0' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#7b2eff', animation: `pulse-dot 1.2s ease ${i * 0.2}s infinite` }} />
      ))}
    </div>
  )
}
