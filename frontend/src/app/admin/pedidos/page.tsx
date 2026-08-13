'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  ClipboardList, DollarSign, TrendingUp, Users,
  CheckCircle, Clock, XCircle, ChefHat, Bell, WifiOff,
} from 'lucide-react'
import { pedidosApi } from '@/lib/api'
import type { PaginatedResponse, Pedido, PedidoStatus } from '@/types'

const STATUS_CFG: Record<PedidoStatus, { label: string; badgeCls: string; icon: React.ReactNode }> = {
  recebido:   { label: 'Recebido',   badgeCls: 'badge-warn', icon: <Bell        size={12} /> },
  preparando: { label: 'Em preparo', badgeCls: 'badge-warn', icon: <ChefHat     size={12} /> },
  pronto:     { label: 'Pronto',     badgeCls: 'badge-ok',   icon: <Clock       size={12} /> },
  entregue:   { label: 'Entregue',   badgeCls: 'badge-ok',   icon: <CheckCircle size={12} /> },
  cancelado:  { label: 'Cancelado',  badgeCls: 'badge-err',  icon: <XCircle     size={12} /> },
}

type Filtro = 'todos' | PedidoStatus

const FILTROS: { key: Filtro; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'recebido', label: 'Recebidos' },
  { key: 'preparando', label: 'Em preparo' },
  { key: 'pronto', label: 'Prontos' },
  { key: 'entregue', label: 'Entregues' },
  { key: 'cancelado', label: 'Cancelados' },
]

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } }
const rowAnim = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 280, damping: 26 } },
}

const brl = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`

function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function ehHoje(iso: string): boolean {
  const d = new Date(iso)
  const hoje = new Date()
  return d.toDateString() === hoje.toDateString()
}

export default function PedidosPage() {
  const [filtro, setFiltro] = useState<Filtro>('todos')

  const { data, isLoading, isError } = useQuery<PaginatedResponse<Pedido>>({
    queryKey: ['pedidos', 'todos'],
    queryFn: () => pedidosApi.listar(),
    refetchInterval: 15_000,
  })

  const pedidos = useMemo(() => data?.results ?? [], [data])

  // Faturamento só conta pedido entregue: pedido em preparo ainda pode ser cancelado.
  const stats = useMemo(() => {
    const doDia = pedidos.filter(p => ehHoje(p.criado_em))
    const entregues = doDia.filter(p => p.status === 'entregue')
    const receita = entregues.reduce((s, p) => s + Number(p.total), 0)
    const mesas = new Set(doDia.map(p => p.mesa)).size
    return {
      receita,
      pedidosHoje: doDia.length,
      ticket: entregues.length ? receita / entregues.length : 0,
      mesas,
    }
  }, [pedidos])

  const filtrados = filtro === 'todos' ? pedidos : pedidos.filter(p => p.status === filtro)

  const CARTOES = [
    { icon: DollarSign,    label: 'Receita hoje',      value: brl(stats.receita),   color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.28)' },
    { icon: ClipboardList, label: 'Pedidos hoje',      value: String(stats.pedidosHoje), color: '#7b2eff', bg: 'rgba(123,46,255,0.12)', border: 'rgba(123,46,255,0.28)' },
    { icon: TrendingUp,    label: 'Ticket médio',      value: brl(stats.ticket),    color: '#00e0b8', bg: 'rgba(0,224,184,0.12)', border: 'rgba(0,224,184,0.28)' },
    { icon: Users,         label: 'Mesas atendidas',   value: String(stats.mesas),  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.28)' },
  ]

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} style={{ marginBottom: 32 }}>
        <h1 className="page-title">Pedidos</h1>
        <p className="page-sub">Histórico e status dos pedidos, direto do banco</p>
      </motion.div>

      {isError && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 16px', borderRadius: 12, marginBottom: 20,
          background: 'rgba(239,68,68,0.10)', border: '2px solid rgba(239,68,68,0.30)',
        }}>
          <WifiOff size={15} style={{ color: '#ef4444' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#ef4444' }}>
            Não consegui falar com a API. Verifique se o backend está no ar.
          </span>
        </div>
      )}

      {/* Indicadores do dia */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 14, marginBottom: 36 }}>
        {CARTOES.map((s, i) => {
          const Icon = s.icon
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }} className="stat-card">
              <div className="stat-icon" style={{ background: s.bg, color: s.color, border: `2px solid ${s.border}`, boxShadow: '0 6px 16px rgba(0,0,0,0.06)' }}>
                <Icon size={19} strokeWidth={1.75} />
              </div>
              <div className="stat-number" style={{ fontSize: '1.65rem' }}>{isLoading ? '...' : s.value}</div>
              <div className="stat-label">{s.label}</div>
            </motion.div>
          )
        })}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {FILTROS.map(f => {
          const ativo = filtro === f.key
          const quantos = f.key === 'todos' ? pedidos.length : pedidos.filter(p => p.status === f.key).length
          return (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
              style={{
                padding: '8px 18px', borderRadius: 10,
                border: `2px solid ${ativo ? 'rgba(123,46,255,0.40)' : 'rgba(0,0,0,0.16)'}`,
                background: ativo ? 'rgba(123,46,255,0.10)' : '#fff',
                color: ativo ? '#7b2eff' : 'var(--text-secondary)',
                fontSize: 13, fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
                transition: 'all 0.14s ease',
              }}
            >
              {f.label} {quantos > 0 && <span style={{ opacity: 0.6 }}>({quantos})</span>}
            </button>
          )
        })}
      </div>

      {/* Tabela */}
      <motion.div className="table-wrap" variants={stagger} initial="hidden" animate="show">
        <table className="data-table">
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Mesa</th>
              <th>Itens</th>
              <th>Total</th>
              <th>Hora</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map(p => {
              const cfg = STATUS_CFG[p.status]
              return (
                <motion.tr key={p.id} variants={rowAnim}>
                  <td style={{ fontWeight: 800, color: 'var(--text-primary)' }}>#{p.id}</td>
                  <td>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 36, height: 36, borderRadius: 10,
                      background: 'rgba(123,46,255,0.10)',
                      border: '2px solid rgba(123,46,255,0.22)',
                      fontSize: 14, fontWeight: 800, color: '#7b2eff',
                    }}>
                      {p.mesa_numero}
                    </span>
                  </td>
                  <td style={{ maxWidth: 300 }}>
                    <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {p.itens.map(i => `${i.produto_nome} x${i.quantidade}`).join(', ')}
                    </div>
                  </td>
                  <td style={{ fontWeight: 800, color: '#00e0b8', fontSize: 15 }}>
                    {brl(Number(p.total))}
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{hora(p.criado_em)}</td>
                  <td>
                    <span className={`badge ${cfg.badgeCls}`} style={{ fontSize: 11 }}>
                      {cfg.icon}
                      {cfg.label}
                    </span>
                  </td>
                </motion.tr>
              )
            })}

            {!isLoading && !filtrados.length && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-muted)', fontSize: 13 }}>
                  {pedidos.length
                    ? 'Nenhum pedido com esse status.'
                    : 'Nenhum pedido registrado ainda. Faça um pelo totem para ver aqui.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </motion.div>
    </div>
  )
}
