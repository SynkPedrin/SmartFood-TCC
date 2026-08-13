'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ClipboardList, DollarSign, TrendingUp, Users,
  CheckCircle, Clock, XCircle, Eye,
} from 'lucide-react'

type Status = 'concluido' | 'preparando' | 'cancelado'

interface Pedido {
  id: number
  mesa: number
  itens: string[]
  total: number
  status: Status
  hora: string
}

const MOCK_PEDIDOS: Pedido[] = [
  { id: 1047, mesa: 3,  itens: ['Frango Grelhado x2', 'Suco Natural x2'],         total: 89.80,  status: 'concluido',  hora: '12:45' },
  { id: 1046, mesa: 7,  itens: ['Pizza Margherita x1', 'Coca-Cola x2'],            total: 67.50,  status: 'concluido',  hora: '12:38' },
  { id: 1045, mesa: 1,  itens: ['Bife Acebolado x1', 'Batata Frita x1'],           total: 52.00,  status: 'preparando', hora: '12:52' },
  { id: 1044, mesa: 12, itens: ['Salada Caesar x2', 'Água Mineral x2'],            total: 38.00,  status: 'preparando', hora: '12:55' },
  { id: 1043, mesa: 5,  itens: ['Lasanha Bolonhesa x3', 'Vinho Tinto 500ml x1'],  total: 148.00, status: 'concluido',  hora: '11:30' },
  { id: 1042, mesa: 9,  itens: ['Hambúrguer Artesanal x2', 'Batata Frita x2'],    total: 96.00,  status: 'concluido',  hora: '11:15' },
  { id: 1041, mesa: 2,  itens: ['Peixe Grelhado x1'],                              total: 44.90,  status: 'cancelado',  hora: '11:00' },
  { id: 1040, mesa: 4,  itens: ['Risoto de Camarão x2', 'Suco Natural x2'],        total: 132.00, status: 'concluido',  hora: '10:45' },
]

const STATUS_CFG: Record<Status, { label: string; badgeCls: string; dotCls: string; icon: React.ReactNode }> = {
  concluido:  { label: 'Concluído',  badgeCls: 'badge-ok',   dotCls: 'dot-ok',   icon: <CheckCircle size={12} /> },
  preparando: { label: 'Preparando', badgeCls: 'badge-warn', dotCls: 'dot-warn', icon: <Clock       size={12} /> },
  cancelado:  { label: 'Cancelado',  badgeCls: 'badge-err',  dotCls: 'dot-err',  icon: <XCircle     size={12} /> },
}

type Filter = 'todos' | Status

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }
const rowAnim = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 280, damping: 26 } },
}

export default function PedidosPage() {
  const [filter, setFilter] = useState<Filter>('todos')

  const filtered = filter === 'todos' ? MOCK_PEDIDOS : MOCK_PEDIDOS.filter(p => p.status === filter)
  const totalReceita = MOCK_PEDIDOS.filter(p => p.status === 'concluido').reduce((s, p) => s + p.total, 0)
  const totalPedidos = MOCK_PEDIDOS.length
  const ticketMedio  = totalReceita / MOCK_PEDIDOS.filter(p => p.status === 'concluido').length

  const STATS = [
    { icon: DollarSign, label: 'Receita hoje',   value: `R$ ${totalReceita.toFixed(2)}`, color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.28)', shadow: '0 6px 16px rgba(0,0,0,0.06)' },
    { icon: ClipboardList, label: 'Total de pedidos', value: String(totalPedidos),        color: '#7b2eff', bg: 'rgba(123,46,255,0.12)', border: 'rgba(123,46,255,0.28)', shadow: '0 6px 16px rgba(0,0,0,0.06)' },
    { icon: TrendingUp, label: 'Ticket médio',   value: `R$ ${ticketMedio.toFixed(2)}`,  color: '#00e0b8', bg: 'rgba(0,224,184,0.12)', border: 'rgba(0,224,184,0.28)', shadow: '0 6px 16px rgba(0,0,0,0.06)' },
    { icon: Users, label: 'Mesas atendidas',     value: '8',                             color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.28)', shadow: '0 6px 16px rgba(0,0,0,0.06)' },
  ]

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'concluido', label: 'Concluídos' },
    { key: 'preparando', label: 'Em preparo' },
    { key: 'cancelado', label: 'Cancelados' },
  ]

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} style={{ marginBottom: 32 }}>
        <h1 className="page-title">Pedidos</h1>
        <p className="page-sub">Histórico e status dos pedidos de hoje</p>
      </motion.div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 14, marginBottom: 36 }}>
        {STATS.map((s, i) => {
          const Icon = s.icon
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }} className="stat-card">
              <div className="stat-icon" style={{ background: s.bg, color: s.color, border: `2px solid ${s.border}`, boxShadow: s.shadow }}>
                <Icon size={19} strokeWidth={1.75} />
              </div>
              <div className="stat-number" style={{ fontSize: '1.65rem' }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </motion.div>
          )
        })}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: '8px 18px', borderRadius: 10,
              border: `2px solid ${filter === f.key ? 'rgba(123,46,255,0.40)' : 'rgba(0,0,0,0.16)'}`,
              background: filter === f.key ? 'rgba(123,46,255,0.10)' : '#fff',
              color: filter === f.key ? '#7b2eff' : 'var(--text-secondary)',
              fontSize: 13, fontWeight: 700,
              fontFamily: 'Inter, sans-serif',
              cursor: 'pointer',
              boxShadow: filter === f.key ? '0 6px 16px rgba(0,0,0,0.06)' : '0 6px 16px rgba(0,0,0,0.06)',
              transition: 'all 0.14s ease',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
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
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const cfg = STATUS_CFG[p.status]
              return (
                <motion.tr key={p.id} variants={rowAnim}>
                  <td style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, color: 'var(--text-primary)' }}>#{p.id}</td>
                  <td>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 36, height: 36, borderRadius: 10,
                      background: 'rgba(123,46,255,0.10)',
                      border: '2px solid rgba(123,46,255,0.22)',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 14, fontWeight: 800, color: '#7b2eff',
                    }}>
                      {p.mesa}
                    </span>
                  </td>
                  <td style={{ maxWidth: 260 }}>
                    <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {p.itens.join(', ')}
                    </div>
                  </td>
                  <td style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, color: '#00e0b8', fontSize: 15 }}>
                    R$ {p.total.toFixed(2)}
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{p.hora}</td>
                  <td>
                    <span className={`badge ${cfg.badgeCls}`} style={{ fontSize: 11 }}>
                      {cfg.icon}
                      {cfg.label}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-icon btn-sm" title="Ver detalhes">
                      <Eye size={13} />
                    </button>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </motion.div>

      <p style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
        * Dados simulados para demonstração. Integração com API de pedidos em desenvolvimento.
      </p>
    </div>
  )
}
