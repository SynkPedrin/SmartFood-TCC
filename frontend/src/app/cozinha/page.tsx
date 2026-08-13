'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { Home, RefreshCw, Clock, ChefHat, CheckCircle, Bell } from 'lucide-react'
import { BrandLogo } from '@/components/BrandLogo'
import { useBrand } from '@/lib/brand/BrandContext'

type Status = 'novo' | 'preparando' | 'pronto'

interface Item { nome: string; qtd: number }
interface Pedido {
  id: number
  mesa: number
  itens: Item[]
  hora: string
  status: Status
  urgente?: boolean
}

const INICIAL: Pedido[] = [
  { id: 1047, mesa: 3,  itens: [{ nome: 'Frango Grelhado', qtd: 2 }, { nome: 'Suco Natural', qtd: 2 }], hora: '12:45', status: 'novo', urgente: true },
  { id: 1048, mesa: 7,  itens: [{ nome: 'Pizza Margherita', qtd: 1 }, { nome: 'Coca-Cola', qtd: 2 }],   hora: '12:48', status: 'novo' },
  { id: 1049, mesa: 11, itens: [{ nome: 'Hambúrguer Artesanal', qtd: 2 }, { nome: 'Batata Frita', qtd: 2 }], hora: '12:50', status: 'novo' },
  { id: 1045, mesa: 1,  itens: [{ nome: 'Bife Acebolado', qtd: 1 }, { nome: 'Batata Frita', qtd: 1 }, { nome: 'Suco', qtd: 1 }], hora: '12:38', status: 'preparando', urgente: true },
  { id: 1046, mesa: 12, itens: [{ nome: 'Salada Caesar', qtd: 2 }], hora: '12:42', status: 'preparando' },
  { id: 1043, mesa: 5,  itens: [{ nome: 'Lasanha Bolonhesa', qtd: 3 }, { nome: 'Vinho Tinto', qtd: 1 }], hora: '12:20', status: 'pronto' },
  { id: 1044, mesa: 9,  itens: [{ nome: 'Risoto de Camarão', qtd: 2 }], hora: '12:25', status: 'pronto' },
]

const COLS: { key: Status; label: string; color: string; bg: string; border: string; shadow: string; actionLabel: string; nextStatus: Status | null }[] = [
  { key: 'novo',       label: 'Novos Pedidos', color: '#ef4444', bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.35)', shadow: '0 6px 16px rgba(0,0,0,0.06)', actionLabel: 'Iniciar Preparo', nextStatus: 'preparando' },
  { key: 'preparando', label: 'Em Preparo',    color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.35)', shadow: '0 6px 16px rgba(0,0,0,0.06)', actionLabel: 'Marcar Pronto',   nextStatus: 'pronto' },
  { key: 'pronto',     label: 'Prontos',       color: '#10b981', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.35)', shadow: '0 6px 16px rgba(0,0,0,0.06)', actionLabel: 'Entregue ✓',      nextStatus: null },
]

function useTimer() {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
  useEffect(() => {
    const id = setInterval(() => setTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })), 1000)
    return () => clearInterval(id)
  }, [])
  return time
}

function elapsed(hora: string): string {
  const [h, m] = hora.split(':').map(Number)
  const now = new Date()
  const diff = (now.getHours() * 60 + now.getMinutes()) - (h * 60 + m)
  if (diff <= 0) return '< 1 min'
  if (diff < 60) return `${diff} min`
  return `${Math.floor(diff / 60)}h ${diff % 60}min`
}

const cardAnim = {
  hidden:  { opacity: 0, scale: 0.93, y: 12 },
  visible: { opacity: 1, scale: 1,    y: 0,  transition: { type: 'spring', stiffness: 280, damping: 26 } },
  exit:    { opacity: 0, scale: 0.88, y: -12, transition: { duration: 0.22 } },
}

export default function CozinhaPage() {
  const { brand } = useBrand()
  const [pedidos, setPedidos] = useState<Pedido[]>(INICIAL)
  const time = useTimer()

  function avancar(id: number, next: Status | null) {
    if (!next) {
      setPedidos(prev => prev.filter(p => p.id !== id))
      toast.success('Pedido marcado como entregue!')
      return
    }
    setPedidos(prev => prev.map(p => p.id === id ? { ...p, status: next } : p))
    toast.success(next === 'preparando' ? 'Preparo iniciado!' : 'Pedido pronto!')
  }

  const byStatus = (s: Status) => pedidos.filter(p => p.status === s)

  return (
    <div className="kitchen-shell">
      {/* Header */}
      <header className="kitchen-header">
        <BrandLogo size={36} radius={10} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ChefHat size={18} style={{ color: 'var(--terracotta)' }} />
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            Cozinha {brand.name}
          </span>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {byStatus('novo').length > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 12px', borderRadius: 10,
                background: 'rgba(239,68,68,0.10)', border: '2px solid rgba(239,68,68,0.35)',
                boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
              }}>
                <Bell size={13} style={{ color: '#ef4444' }} />
                <span style={{ fontSize: 13, fontWeight: 800, color: '#ef4444' }}>
                  {byStatus('novo').length} novo{byStatus('novo').length > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
            {time}
          </div>

          <button
            onClick={() => { setPedidos([...INICIAL]); toast.success('Dados atualizados') }}
            className="btn btn-ghost btn-sm"
            style={{ gap: 7 }}
          >
            <RefreshCw size={13} /> Atualizar
          </button>

          <Link href="/" className="btn btn-ghost btn-sm" style={{ gap: 7 }}>
            <Home size={13} /> Sair
          </Link>
        </div>
      </header>

      {/* Kanban columns */}
      <div className="kitchen-cols">
        {COLS.map(col => {
          const orders = byStatus(col.key)
          return (
            <div key={col.key} className="kitchen-col">
              {/* Column header */}
              <div className="kitchen-col-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    padding: '6px 14px', borderRadius: 10,
                    background: col.bg, border: `2px solid ${col.border}`,
                    boxShadow: col.shadow,
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color, boxShadow: `0 0 6px ${col.color}` }} />
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 800, color: col.color, letterSpacing: '-0.01em' }}>
                      {col.label}
                    </span>
                    <span style={{
                      minWidth: 22, height: 22, borderRadius: 7,
                      background: col.color, color: '#fff',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 800,
                    }}>
                      {orders.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Orders */}
              <div className="kitchen-col-body">
                {orders.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                    <CheckCircle size={32} style={{ opacity: 0.25, margin: '0 auto 10px', display: 'block' }} />
                    <p style={{ fontSize: 13, fontWeight: 600 }}>Nenhum pedido aqui</p>
                  </div>
                )}

                <AnimatePresence>
                  {orders.map(pedido => (
                    <motion.div
                      key={pedido.id}
                      variants={cardAnim}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                      className={`kitchen-order-card${pedido.urgente ? ' urgente' : ''}`}
                    >
                      {/* Top row */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                              fontFamily: 'Inter, sans-serif',
                              fontSize: 28, fontWeight: 900, letterSpacing: '-0.04em',
                              color: 'var(--text-primary)', lineHeight: 1,
                            }}>
                              {pedido.mesa}
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                              Mesa
                            </div>
                            {pedido.urgente && (
                              <span style={{
                                padding: '2px 8px', borderRadius: 7,
                                background: 'rgba(239,68,68,0.12)',
                                border: '1.5px solid rgba(239,68,68,0.35)',
                                color: '#ef4444', fontSize: 9, fontWeight: 800,
                                textTransform: 'uppercase', letterSpacing: '0.08em',
                              }}>
                                Urgente
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginTop: 3 }}>
                            Pedido #{pedido.id}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: col.color }}>
                            <Clock size={11} />
                            {elapsed(pedido.hora)}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{pedido.hora}</div>
                        </div>
                      </div>

                      {/* Items */}
                      <div style={{
                        padding: '10px 12px', borderRadius: 10,
                        background: 'rgba(0,0,0,0.03)',
                        border: '1px solid var(--border)',
                        marginBottom: 12,
                      }}>
                        {pedido.itens.map((item, i) => (
                          <div key={i} style={{
                            display: 'flex', justifyContent: 'space-between',
                            fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
                            padding: '3px 0',
                            borderBottom: i < pedido.itens.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                          }}>
                            <span>{item.nome}</span>
                            <span style={{
                              fontFamily: 'Inter, sans-serif',
                              fontWeight: 800, color: col.color,
                              minWidth: 24, textAlign: 'right',
                            }}>×{item.qtd}</span>
                          </div>
                        ))}
                      </div>

                      {/* Action button */}
                      {col.nextStatus !== undefined && (
                        <button
                          onClick={() => avancar(pedido.id, col.nextStatus)}
                          style={{
                            width: '100%', padding: '10px',
                            borderRadius: 10, border: `2px solid ${col.border}`,
                            background: col.bg,
                            color: col.color, fontSize: 13, fontWeight: 800,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                            fontFamily: 'Inter, sans-serif',
                            boxShadow: col.shadow,
                            transition: 'all 0.16s ease',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(0.92)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                          onMouseLeave={e => { e.currentTarget.style.filter = ''; e.currentTarget.style.transform = '' }}
                        >
                          {col.key === 'pronto' ? <CheckCircle size={14} /> : <ChefHat size={14} />}
                          {col.actionLabel}
                        </button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
