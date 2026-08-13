'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, BookOpen, UtensilsCrossed,
  ClipboardList, Bot, Home, ChefHat, Palette,
} from 'lucide-react'
import { BrandLogo } from '@/components/BrandLogo'
import { useBrand } from '@/lib/brand/BrandContext'

const NAV_SECTIONS = [
  {
    label: 'Início',
    items: [
      { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    ],
  },
  {
    label: 'Cardápio',
    items: [
      { href: '/admin/cardapio', icon: BookOpen, label: 'Cardápio' },
      { href: '/admin/mesas', icon: UtensilsCrossed, label: 'Mesas' },
    ],
  },
  {
    label: 'Operações',
    items: [
      { href: '/admin/pedidos', icon: ClipboardList, label: 'Pedidos' },
    ],
  },
  {
    label: 'IA SmartFood',
    items: [
      { href: '/admin/ia', icon: Bot, label: 'Conversas' },
    ],
  },
  {
    label: 'Conta',
    items: [
      { href: '/admin/personalizacao', icon: Palette, label: 'Personalização' },
    ],
  },
]

const FOOTER_LINKS = [
  { href: '/', icon: Home, label: 'Seleção de modo' },
  { href: '/cozinha', icon: ChefHat, label: 'Ir para Cozinha' },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { brand } = useBrand()

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <aside className="admin-sidebar-wrap">
      {/* Logo */}
      <div style={{
        padding: '22px 14px 18px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
      }}>
        <BrandLogo size={80} radius={16} />
        <div className="sidebar-logo-text" style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 18, fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.03em',
          textAlign: 'center',
        }}>
          {brand.name}
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
        {NAV_SECTIONS.map(section => (
          <div key={section.label} style={{ marginBottom: 6 }}>
            <div className="sidebar-section-label" style={{
              fontSize: 10, fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              padding: '10px 10px 4px',
            }}>
              {section.label}
            </div>

            {section.items.map(item => {
              const active = isActive(item.href, 'exact' in item ? item.exact as boolean : false)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={active ? 'nav-item nav-item-active' : 'nav-item'}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 11,
                    padding: '9px 12px', borderRadius: 8,
                    textDecoration: 'none', marginBottom: 2,
                    fontSize: 13.5, fontWeight: active ? 600 : 500,
                    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                    background: active ? 'var(--bg-surface)' : 'transparent',
                    position: 'relative',
                    transition: 'background 0.14s ease, color 0.14s ease',
                    minHeight: 42,
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      e.currentTarget.style.background = 'rgba(22,22,26,0.035)'
                      e.currentTarget.style.color = 'var(--text-primary)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = 'var(--text-secondary)'
                    }
                  }}
                >
                  {active && <span aria-hidden style={{ position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, borderRadius: 3, background: 'var(--primary)' }} />}
                  <Icon size={16} style={{ flexShrink: 0, color: active ? 'var(--primary)' : 'currentColor', opacity: active ? 1 : 0.7 }} />
                  <span className="sidebar-label">{item.label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '10px 8px 14px',
        borderTop: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        {FOOTER_LINKS.map(item => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 10,
                textDecoration: 'none', marginBottom: 2,
                fontSize: 13, fontWeight: 600,
                color: 'var(--text-muted)',
                transition: 'all 0.14s ease',
                minHeight: 40,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(0,0,0,0.05)'
                e.currentTarget.style.color = 'var(--text-primary)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--text-muted)'
              }}
            >
              <Icon size={15} style={{ flexShrink: 0 }} />
              <span className="sidebar-label">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </aside>
  )
}
