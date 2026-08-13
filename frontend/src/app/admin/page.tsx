'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { categoriasApi, produtosApi, mesasApi } from '@/lib/api'
import {
  Tag, ShoppingBag, UtensilsCrossed, CheckCircle,
  ArrowUpRight, BookOpen, ClipboardList,
} from 'lucide-react'

function Counter({ to }: { to: number }) {
  const [val, setVal] = useState(0)
  const started = useRef(false)
  useEffect(() => {
    if (started.current || to === 0) { setVal(to); return }
    started.current = true
    const t0 = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - t0) / 900, 1)
      setVal(Math.round((1 - Math.pow(1 - progress, 3)) * to))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [to])
  return <span>{val}</span>
}

const STAT_CFG = [
  { icon: Tag, label: 'Categorias' },
  { icon: ShoppingBag, label: 'Produtos' },
  { icon: UtensilsCrossed, label: 'Mesas' },
  { icon: CheckCircle, label: 'Mesas livres' },
]

const QUICK = [
  { href: '/admin/cardapio', icon: BookOpen, label: 'Cardápio', desc: 'Categorias e produtos do menu.' },
  { href: '/admin/mesas', icon: UtensilsCrossed, label: 'Mesas', desc: 'Status e ocupação do salão.' },
  { href: '/admin/pedidos', icon: ClipboardList, label: 'Pedidos', desc: 'Acompanhamento do dia.' },
]

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
}

export default function AdminDashboard() {
  const { data: cats }  = useQuery({ queryKey: ['categorias'], queryFn: categoriasApi.listar })
  const { data: prods } = useQuery({ queryKey: ['produtos'],   queryFn: produtosApi.listar })
  const { data: mesas } = useQuery({ queryKey: ['mesas'],      queryFn: mesasApi.listar })

  const livres = mesas?.results?.filter((m: { status: string }) => m.status === 'disponivel').length ?? 0
  const stats = [cats?.count ?? 0, prods?.count ?? 0, mesas?.count ?? 0, livres]

  const now = new Date()
  const hora = now.getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'
  const dataFmt = now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 40 }}
      >
        <div>
          <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.035em', color: 'var(--text-primary)', lineHeight: 1.05 }}>
            {saudacao}
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: 6 }}>
            Um panorama do seu restaurante.
          </p>
        </div>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
          letterSpacing: '0.06em', color: 'var(--text-muted)',
          textTransform: 'capitalize', paddingBottom: 4,
        }}>
          {dataFmt}
        </span>
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        variants={stagger} initial="hidden" animate="show"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 16, marginBottom: 48 }}
      >
        {STAT_CFG.map((s, i) => {
          const Icon = s.icon
          return (
            <motion.div key={s.label} variants={item} className="kpi-card">
              <span className="kpi-rule" aria-hidden />
              <div className="kpi-top">
                <span className="kpi-value"><Counter to={stats[i]} /></span>
                <span className="kpi-icon"><Icon size={17} strokeWidth={1.75} /></span>
              </div>
              <div className="kpi-label">{s.label}</div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* 2-col grid: quick access + assistant */}
      <div className="dash-grid">
        {/* Quick access */}
        <div>
          <h2 className="dash-section">Acesso rápido</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {QUICK.map((q, i) => {
              const Icon = q.icon
              return (
                <motion.div
                  key={q.href}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.07, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link href={q.href} className="quick-row">
                    <span className="quick-icon"><Icon size={19} strokeWidth={1.75} /></span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span className="quick-label">{q.label}</span>
                      <span className="quick-desc">{q.desc}</span>
                    </span>
                    <ArrowUpRight size={16} className="quick-arrow" />
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Assistant - honesto, sem métricas inventadas */}
        <motion.div
          initial={{ opacity: 0, x: 14 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.28, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="dash-section">Assistente</h2>
          <div className="assist-card">
            <div className="assist-body">
              <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: 10, fontWeight: 500 }}>
                Converse com os dados do seu restaurante.
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 18 }}>
                Análise de cardápio, geração de descrições e sugestões, a partir
                dos {stats[1]} produto{stats[1] === 1 ? '' : 's'} e {stats[0]} categoria{stats[0] === 1 ? '' : 's'} cadastrados.
              </p>
              <Link href="/admin/ia" className="btn btn-primary" style={{ width: '100%' }}>
                Abrir assistente
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
