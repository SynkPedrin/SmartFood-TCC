'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Tag, ShoppingBag, UtensilsCrossed,
  ExternalLink, ChevronRight, X, Menu, Zap,
} from 'lucide-react'

const NAV = [
  { href: '/',          icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/categorias', icon: Tag,             label: 'Categorias' },
  { href: '/produtos',   icon: ShoppingBag,     label: 'Produtos'   },
  { href: '/mesas',      icon: UtensilsCrossed, label: 'Mesas'      },
]

interface Props {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: Props) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`mobile-overlay ${open ? 'open' : ''}`}
        onClick={onClose}
      />

      <nav className={`sidebar ${open ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🍽</div>
          <span className="sidebar-logo-name">SmartFood</span>
          <span className="sidebar-logo-tag">v1.0</span>
        </div>

        <div className="sidebar-divider" />

        {/* Navigation */}
        <div className="sidebar-nav">
          <span className="nav-section">Menu principal</span>

          {NAV.map((item) => {
            const active = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`nav-item ${active ? 'active' : ''}`}
              >
                <Icon className="nav-icon" />
                <span>{item.label}</span>
                {active && (
                  <motion.div
                    layoutId="active-pill"
                    className="ml-auto"
                    initial={false}
                  >
                    <ChevronRight
                      size={14}
                      style={{ color: 'var(--purple-light)', opacity: 0.7 }}
                    />
                  </motion.div>
                )}
              </Link>
            )
          })}

          <span className="nav-section" style={{ marginTop: 8 }}>Ferramentas</span>

          <a
            href="http://localhost:8000/api/schema/swagger-ui/"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-item"
          >
            <ExternalLink className="nav-icon" />
            <span>API Docs</span>
          </a>
        </div>

        {/* Footer */}
        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'rgba(34,211,165,.12)',
              border: '1px solid rgba(34,211,165,.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Zap size={13} style={{ color: 'var(--teal)' }} />
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>
                Sprint 1
              </p>
              <p style={{ fontSize: 11, color: 'var(--muted)' }}>TCC - Banco de Dados III</p>
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}

/* ─── Mobile top bar ─── */
export function MobileTopBar({
  onOpen,
}: { onOpen: () => void }) {
  return (
    <header className="mobile-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 9,
          background: 'linear-gradient(135deg,var(--purple),var(--teal))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
        }}>
          🍽
        </div>
        <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 15, letterSpacing: '-0.03em' }}>
          SmartFood
        </span>
      </div>
      <button
        onClick={onOpen}
        className="btn-ghost btn btn-icon"
        aria-label="Abrir menu"
      >
        <Menu size={18} />
      </button>
    </header>
  )
}
