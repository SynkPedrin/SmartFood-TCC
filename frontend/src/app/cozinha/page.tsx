'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Home, RefreshCw, Clock, ChefHat, CheckCircle, Bell, WifiOff, Radio } from 'lucide-react'
import { BrandLogo } from '@/components/BrandLogo'
import { ExigeLogin } from '@/components/ExigeLogin'
import { useBrand } from '@/lib/brand/BrandContext'
import { pedidosApi } from '@/lib/api'
import { useFilaAoVivo } from '@/lib/pedidos/useFilaAoVivo'
import type { PaginatedResponse, Pedido, PedidoStatus } from '@/types'

/** A fila da cozinha é o recorte aberto do pedido: recebido, em preparo, pronto. */
type Coluna = Extract<PedidoStatus, 'recebido' | 'preparando' | 'pronto'>

/** Minutos de espera a partir dos quais o cartão pede atenção. */
const LIMITE_URGENTE = 20

/** Busca periódica: rápida quando o WebSocket está fora, folgada quando está no ar. */
const INTERVALO_SEM_SOCKET = 5_000
const INTERVALO_COM_SOCKET = 30_000

const COLS: { key: Coluna; label: string; color: string; bg: string; border: string; shadow: string; actionLabel: string; nextStatus: PedidoStatus }[] = [
  { key: 'recebido',   label: 'Novos Pedidos', color: '#ef4444', bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.35)', shadow: '0 6px 16px rgba(0,0,0,0.06)', actionLabel: 'Iniciar Preparo', nextStatus: 'preparando' },
  { key: 'preparando', label: 'Em Preparo',    color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.35)', shadow: '0 6px 16px rgba(0,0,0,0.06)', actionLabel: 'Marcar Pronto',   nextStatus: 'pronto' },
  { key: 'pronto',     label: 'Prontos',       color: '#10b981', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.35)', shadow: '0 6px 16px rgba(0,0,0,0.06)', actionLabel: 'Entregue',        nextStatus: 'entregue' },
]

const agora = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

function useTimer() {
  // Começa vazio de propósito: a hora do servidor nunca bate com a do navegador
  // e a diferença quebrava a hidratação do React.
  const [time, setTime] = useState('')
  useEffect(() => {
    setTime(agora())
    const id = setInterval(() => setTime(agora()), 1000)
    return () => clearInterval(id)
  }, [])
  return time
}

/** Minutos desde que o pedido entrou na fila. */
function esperaEmMinutos(criadoEm: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(criadoEm).getTime()) / 60_000))
}

function formatarEspera(minutos: number): string {
  if (minutos < 1) return '< 1 min'
  if (minutos < 60) return `${minutos} min`
  return `${Math.floor(minutos / 60)}h ${minutos % 60}min`
}

function hora(criadoEm: string): string {
  return new Date(criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

const cardAnim = {
  hidden:  { opacity: 0, scale: 0.93, y: 12 },
  visible: { opacity: 1, scale: 1,    y: 0,  transition: { type: 'spring', stiffness: 280, damping: 26 } },
  exit:    { opacity: 0, scale: 0.88, y: -12, transition: { duration: 0.22 } },
}

export default function CozinhaPage() {
  return (
    <ExigeLogin>
      <Cozinha />
    </ExigeLogin>
  )
}

function Cozinha() {
  const { brand } = useBrand()
  const time = useTimer()
  const queryClient = useQueryClient()

  // O WebSocket avisa na hora que a fila mudou; a busca periódica fica como
  // rede de segurança e desacelera quando o socket está no ar.
  const { conectado } = useFilaAoVivo(() => {
    queryClient.invalidateQueries({ queryKey: ['pedidos'] })
  })

  const { data, isError, isFetching, refetch } = useQuery<PaginatedResponse<Pedido>>({
    queryKey: ['pedidos', 'fila'],
    queryFn: () => pedidosApi.listar({ aberto: true }),
    refetchInterval: conectado ? INTERVALO_COM_SOCKET : INTERVALO_SEM_SOCKET,
    refetchOnWindowFocus: true,
  })

  const pedidos = data?.results ?? []

  const mudarStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: PedidoStatus }) =>
      pedidosApi.mudarStatus(id, status),
    onSuccess: (_res, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] })
      queryClient.invalidateQueries({ queryKey: ['mesas'] })
      toast.success(
        status === 'preparando' ? 'Preparo iniciado' :
        status === 'pronto' ? 'Pedido pronto' : 'Pedido entregue',
      )
    },
    onError: () => toast.error('Não consegui atualizar o pedido'),
  })

  const byStatus = (s: Coluna) => pedidos.filter(p => p.status === s)

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
            {byStatus('recebido').length > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 12px', borderRadius: 10,
                background: 'rgba(239,68,68,0.10)', border: '2px solid rgba(239,68,68,0.35)',
                boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
              }}>
                <Bell size={13} style={{ color: '#ef4444' }} />
                <span style={{ fontSize: 13, fontWeight: 800, color: '#ef4444' }}>
                  {byStatus('recebido').length} novo{byStatus('recebido').length > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

          <div
            title={conectado ? 'Recebendo pedidos em tempo real' : 'Sem tempo real: atualizando a cada 5s'}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 11.5, fontWeight: 700,
              color: conectado ? '#10b981' : 'var(--text-muted)',
            }}
          >
            <Radio size={13} />
            {conectado ? 'ao vivo' : 'periódico'}
          </div>

          {isError && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 10,
              background: 'rgba(239,68,68,0.10)', border: '2px solid rgba(239,68,68,0.35)',
            }}>
              <WifiOff size={13} style={{ color: '#ef4444' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#ef4444' }}>Sem conexão com a API</span>
            </div>
          )}

          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
            {time}
          </div>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="btn btn-ghost btn-sm"
            style={{ gap: 7 }}
          >
            <RefreshCw size={13} style={isFetching ? { animation: 'spin 0.9s linear infinite' } : undefined} />
            Atualizar
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
                  {orders.map(pedido => {
                    const espera = esperaEmMinutos(pedido.criado_em)
                    const urgente = espera >= LIMITE_URGENTE
                    return (
                    <motion.div
                      key={pedido.id}
                      variants={cardAnim}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                      className={`kitchen-order-card${urgente ? ' urgente' : ''}`}
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
                              {pedido.mesa_numero}
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                              Mesa
                            </div>
                            {urgente && (
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
                            {formatarEspera(espera)}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{hora(pedido.criado_em)}</div>
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
                          <div key={item.id} style={{
                            display: 'flex', justifyContent: 'space-between',
                            fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
                            padding: '3px 0',
                            borderBottom: i < pedido.itens.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                          }}>
                            <span>
                              {item.produto_nome}
                              {item.observacao && (
                                <span style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>
                                  {item.observacao}
                                </span>
                              )}
                            </span>
                            <span style={{
                              fontFamily: 'Inter, sans-serif',
                              fontWeight: 800, color: col.color,
                              minWidth: 24, textAlign: 'right',
                            }}>×{item.quantidade}</span>
                          </div>
                        ))}
                      </div>

                      {/* Action button */}
                      {col.nextStatus !== undefined && (
                        <button
                          onClick={() => mudarStatus.mutate({ id: pedido.id, status: col.nextStatus })}
                          disabled={mudarStatus.isPending}
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
                    )
                  })}
                </AnimatePresence>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
