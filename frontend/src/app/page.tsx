'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Monitor, ChefHat, LayoutDashboard, ArrowRight } from 'lucide-react'
import { BrandBackground } from '@/components/BrandBackground'
import { BrandLogo } from '@/components/BrandLogo'
import { useBrand } from '@/lib/brand/BrandContext'

const SURFACES = [
  {
    href: '/totem',
    index: '01',
    icon: Monitor,
    label: 'Totem',
    role: 'Cliente',
    desc: 'Cardápio e pedidos direto na mesa, pela tela de autoatendimento.',
    accent: 'var(--terracotta)',
  },
  {
    href: '/cozinha',
    index: '02',
    icon: ChefHat,
    label: 'Cozinha',
    role: 'Produção',
    desc: 'Fila de pedidos em preparo, organizada por etapa e prioridade.',
    accent: 'var(--sage)',
  },
  {
    href: '/admin',
    index: '03',
    icon: LayoutDashboard,
    label: 'Administração',
    role: 'Gestão',
    desc: 'Cardápio, mesas, pedidos e indicadores do restaurante.',
    accent: 'var(--mustard)',
  },
]

const ease = [0.16, 1, 0.3, 1] as const

export default function Home() {
  const { brand } = useBrand()
  return (
    <main
      style={{
        minHeight: '100dvh',
        background: 'var(--bg-root)',
        display: 'flex',
        alignItems: 'center',
        padding: '48px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <BrandBackground />
      <div
        className="hub-grid"
        style={{
          width: '100%',
          maxWidth: 1080,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.15fr)',
          gap: 'clamp(40px, 7vw, 96px)',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* ── Masthead ── */}
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 30 }}>
            <BrandLogo size={52} radius={14} />
            <span
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 11, fontWeight: 500,
                letterSpacing: '0.22em', textTransform: 'uppercase',
                color: 'var(--text-muted)',
              }}
            >
              {brand.name}
            </span>
          </div>

          <h1
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 'clamp(2.6rem, 6vw, 4.1rem)',
              fontWeight: 700,
              lineHeight: 0.98,
              letterSpacing: '-0.045em',
              color: 'var(--text-primary)',
              marginBottom: 22,
            }}
          >
            Gestão de<br />restaurante,<br />
            <span style={{ color: 'var(--terracotta)' }}>ponta a ponta.</span>
          </h1>

          <p
            style={{
              fontSize: '1.02rem',
              lineHeight: 1.6,
              color: 'var(--text-secondary)',
              maxWidth: 380,
              marginBottom: 32,
            }}
          >
            Uma plataforma, três ambientes de trabalho, do pedido na mesa
            à cozinha e à administração. Selecione por onde entrar.
          </p>

          <div
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'var(--text-muted)',
              borderTop: '1.5px solid var(--border-subtle)',
              paddingTop: 16,
            }}
          >
            <span>TCC UniSalesiano</span>
            <span aria-hidden style={{ opacity: 0.4 }}>·</span>
            <span>2026</span>
          </div>
        </motion.header>

        {/* ── Surface index ── */}
        <motion.nav
          aria-label="Ambientes"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } } }}
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          {SURFACES.map(s => {
            const Icon = s.icon
            return (
              <motion.div
                key={s.href}
                variants={{
                  hidden: { opacity: 0, y: 14 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
                }}
              >
                <Link href={s.href} className="hub-card" style={{ ['--accent' as string]: s.accent }}>
                  <span className="hub-card-rule" aria-hidden />

                  <span
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 12, fontWeight: 500,
                      color: 'var(--text-muted)', width: 22, flexShrink: 0,
                    }}
                  >
                    {s.index}
                  </span>

                  <span className="hub-card-icon" style={{ color: s.accent }} aria-hidden>
                    <Icon size={22} strokeWidth={1.75} />
                  </span>

                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '1.35rem', fontWeight: 700,
                          letterSpacing: '-0.03em', color: 'var(--text-primary)',
                        }}
                      >
                        {s.label}
                      </span>
                      <span
                        style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {s.role}
                      </span>
                    </span>
                    <span
                      style={{
                        display: 'block', marginTop: 4,
                        fontSize: '0.86rem', lineHeight: 1.5,
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {s.desc}
                    </span>
                  </span>

                  <ArrowRight size={18} strokeWidth={2} className="hub-card-arrow" aria-hidden />
                </Link>
              </motion.div>
            )
          })}
        </motion.nav>
      </div>
    </main>
  )
}
