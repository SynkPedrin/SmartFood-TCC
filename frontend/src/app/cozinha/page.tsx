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

const COLS: { key: Coluna; label: string; color: string; actionLabel: string; nextStatus: PedidoStatus }[] = [
  { key: 'recebido',   label: 'Novos pedidos', color: '#ff6b6b', actionLabel: 'Iniciar preparo', nextStatus: 'preparando' },
  { key: 'preparando', label: 'Em preparo',    color: '#fbbf24', actionLabel: 'Marcar pronto',   nextStatus: 'pronto' },
  { key: 'pronto',     label: 'Prontos',       color: '#34d399', actionLabel: 'Entregue',        nextStatus: 'entregue' },
]

/** Pedido que entrou há menos disso ainda "acende" para chamar o olhar. */
const RECENTE_MS = 45_000

const agora = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

function useTimer() {
  // Começa vazio de propósito: a hora do servidor nunca bate com a do navegador
  // e a diferença quebrava a hidratação do React.
  const [time, setTime] = useState('')
  useEffect(() => {
    const primeiro = setTimeout(() => setTime(agora()), 0)
    const id = setInterval(() => setTime(agora()), 1000)
    return () => { clearTimeout(primeiro); clearInterval(id) }
  }, [])
  return time
}

/** Minutos desde que o pedido entrou na fila. */
function esperaEmMinutos(criadoEm: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(criadoEm).getTime()) / 60_000))
}

/** Entrou na fila há poucos segundos: o cartão acende para chamar o olhar. */
function acabouDeChegar(criadoEm: string): boolean {
  return Date.now() - new Date(criadoEm).getTime() < RECENTE_MS
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

  const novos = byStatus('recebido').length

  return (
    <div className="kitchen-shell">
      <header className="kitchen-header">
        <span className="logo-halo">
          <BrandLogo size={36} radius={10} />
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <ChefHat size={18} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.03em' }}>
            Cozinha {brand.name}
          </span>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <AnimatePresence>
            {novos > 0 && (
              <motion.span
                key="novos"
                className="kds-pilula"
                style={{ '--c': '#ff6b6b' } as React.CSSProperties}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Bell size={13} />
                {novos} novo{novos > 1 ? 's' : ''}
              </motion.span>
            )}
          </AnimatePresence>

          <span
            className="kds-pilula"
            title={conectado ? 'Recebendo pedidos em tempo real' : 'Sem tempo real: atualizando a cada 5s'}
            style={{ '--c': conectado ? '#34d399' : '#a8a8b8' } as React.CSSProperties}
          >
            {conectado ? <i className="pulso" aria-hidden /> : <Radio size={13} />}
            {conectado ? 'Ao vivo' : 'Periódico'}
          </span>

          {isError && (
            <span className="kds-pilula" style={{ '--c': '#ff6b6b' } as React.CSSProperties}>
              <WifiOff size={13} /> Sem conexão com a API
            </span>
          )}

          <span className="kds-relogio">{time || '--:--:--'}</span>

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

      <div className="kitchen-cols">
        {COLS.map(col => {
          const orders = byStatus(col.key)
          const cor = { '--c': col.color } as React.CSSProperties
          return (
            <div key={col.key} className="kitchen-col">
              <div className="kitchen-col-header">
                <span className="kds-coluna" style={cor}>
                  <i className="pulso" aria-hidden />
                  {col.label}
                  <b key={orders.length}>{orders.length}</b>
                </span>
              </div>

              <div className="kitchen-col-body">
                {orders.length === 0 && (
                  <div className="kds-vazio">
                    <CheckCircle size={34} />
                    <p>Nenhum pedido aqui</p>
                  </div>
                )}

                <AnimatePresence>
                  {orders.map(pedido => {
                    const espera = esperaEmMinutos(pedido.criado_em)
                    const urgente = espera >= LIMITE_URGENTE
                    const recente = col.key === 'recebido' && acabouDeChegar(pedido.criado_em)
                    return (
                    <motion.div
                      key={pedido.id}
                      variants={cardAnim}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                      className={`kitchen-order-card${urgente ? ' urgente' : recente ? ' chegou' : ''}`}
                      style={{ '--anel-cor': col.color } as React.CSSProperties}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="kds-mesa">{pedido.mesa_numero}</div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                              Mesa
                            </div>
                            {urgente && (
                              <span className="kds-pilula" style={{ '--c': '#ff6b6b', padding: '2px 8px', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em' } as React.CSSProperties}>
                                Urgente
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginTop: 4 }}>
                            Pedido #{pedido.id}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, fontWeight: 750, color: col.color, fontVariantNumeric: 'tabular-nums' }}>
                            <Clock size={12} />
                            {formatarEspera(espera)}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{hora(pedido.criado_em)}</div>
                        </div>
                      </div>

                      <div className="kds-itens">
                        {pedido.itens.map(item => (
                          <div key={item.id} style={{
                            display: 'flex', justifyContent: 'space-between', gap: 10,
                            fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)',
                            padding: '5px 0',
                          }}>
                            <span>
                              {item.produto_nome}
                              {item.observacao && (
                                <span style={{ display: 'block', fontSize: 11.5, fontWeight: 500, color: '#fbbf24', marginTop: 2 }}>
                                  ⚑ {item.observacao}
                                </span>
                              )}
                            </span>
                            <span style={{ fontWeight: 800, color: col.color, minWidth: 26, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                              ×{item.quantidade}
                            </span>
                          </div>
                        ))}
                      </div>

                      <button
                        className="kds-acao"
                        style={cor}
                        onClick={() => mudarStatus.mutate({ id: pedido.id, status: col.nextStatus })}
                        disabled={mudarStatus.isPending}
                      >
                        {col.key === 'pronto' ? <CheckCircle size={15} /> : <ChefHat size={15} />}
                        {col.actionLabel}
                      </button>
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
