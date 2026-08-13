'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  motion, AnimatePresence,
  useMotionValue, useSpring,
} from 'framer-motion'
import gsap from 'gsap'
import Image from 'next/image'
import {
  LayoutDashboard, Tag, ShoppingBag, UtensilsCrossed,
} from 'lucide-react'

const NAV = [
  { href: '/',           icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/categorias', icon: Tag,             label: 'Categorias' },
  { href: '/produtos',   icon: ShoppingBag,     label: 'Produtos'   },
  { href: '/mesas',      icon: UtensilsCrossed, label: 'Mesas'      },
]

/* ─────────────────────────────────────────
   MAGNETIC PILL - each nav item (light theme)
───────────────────────────────────────── */
function MagneticPill({
  href, label, icon, isActive, onClick,
}: {
  href: string; label: string; icon: React.ReactNode
  isActive: boolean; onClick?: () => void
}) {
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 380, damping: 28, mass: 0.6 })
  const sy = useSpring(my, { stiffness: 380, damping: 28, mass: 0.6 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    mx.set((e.clientX - (r.left + r.width  / 2)) * 0.28)
    my.set((e.clientY - (r.top  + r.height / 2)) * 0.28)
  }
  const handleMouseLeave = () => { mx.set(0); my.set(0) }

  return (
    <Link href={href} style={{ textDecoration: 'none' }} onClick={onClick}>
      <motion.div
        style={{ x: sx, y: sy }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        whileTap={{ scale: 0.9 }}
      >
        <motion.div
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 40,
            position: 'relative', cursor: 'pointer',
            userSelect: 'none', minHeight: 44,
          }}
          whileHover={{ scale: 1.06 }}
          transition={{ type: 'spring', stiffness: 500, damping: 28 }}
        >
          {/* Active background highlight */}
          {isActive && (
            <motion.div
              layoutId="island-active-bg"
              style={{
                position: 'absolute', inset: 0, borderRadius: 40,
                background: 'linear-gradient(135deg,rgba(123,46,255,0.18),rgba(0,224,184,0.12))',
                border: '2px solid rgba(123,46,255,0.45)',
                boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
              }}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          {/* Hover state background */}
          {!isActive && (
            <motion.div
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              style={{
                position: 'absolute', inset: 0, borderRadius: 40,
                background: 'rgba(0,0,0,0.06)',
                border: '1px solid var(--border)',
              }}
            />
          )}
          <span style={{
            position: 'relative', zIndex: 1,
            color: isActive ? '#7b2eff' : 'rgba(17,17,17,0.50)',
            display: 'flex',
          }}>
            {icon}
          </span>
          <span style={{
            fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 700,
            color: isActive ? '#111111' : 'rgba(17,17,17,0.55)',
            whiteSpace: 'nowrap', position: 'relative', zIndex: 1,
            letterSpacing: '-0.01em',
          }}>
            {label}
          </span>
        </motion.div>
      </motion.div>
    </Link>
  )
}

/* ─────────────────────────────────────────
   DYNAMIC ISLAND - sandy light theme
───────────────────────────────────────── */
export function DynamicIsland() {
  const [expanded, setExpanded]   = useState(false)
  const [wasActive, setWasActive] = useState('')
  const islandRef  = useRef<HTMLDivElement>(null)
  const pathname   = usePathname()
  const active     = NAV.find(n => n.href === pathname) ?? NAV[0]
  const ActiveIcon = active.icon

  /* GSAP elastic bounce on route change */
  useEffect(() => {
    if (!islandRef.current || pathname === wasActive) return
    setWasActive(pathname)
    gsap.fromTo(
      islandRef.current,
      { scale: 0.93 },
      { scale: 1, duration: 0.55, ease: 'elastic.out(1, 0.45)' }
    )
  }, [pathname])

  /* GSAP glow burst on expand */
  useEffect(() => {
    if (!islandRef.current) return
    if (expanded) {
      gsap.to(islandRef.current, {
        boxShadow: '0 0 0 2.5px rgba(0,0,0,0.75), 0 6px 16px rgba(0,0,0,0.06), 0 4px 32px rgba(123,46,255,0.18)',
        duration: 0.35, ease: 'power2.out',
      })
    } else {
      gsap.to(islandRef.current, {
        boxShadow: '0 0 0 2px rgba(0,0,0,0.75), 0 6px 16px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.10)',
        duration: 0.3, ease: 'power2.inOut',
      })
    }
  }, [expanded])

  return (
    <div style={{
      position: 'fixed', top: 18, left: '50%', transform: 'translateX(-50%)',
      zIndex: 900, pointerEvents: 'none',
    }}>
      <motion.div
        ref={islandRef}
        layout
        onHoverStart={() => setExpanded(true)}
        onHoverEnd={() => setExpanded(false)}
        style={{
          pointerEvents: 'auto',
          background: 'rgba(255,255,255,0.94)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderRadius: 100,
          overflow: 'hidden',
          position: 'relative',
          cursor: 'default',
          border: '1px solid var(--border)',
          boxShadow: '0 6px 16px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.10)',
        }}
        transition={{ layout: { type: 'spring', stiffness: 420, damping: 36, mass: 0.75 } }}
      >
        {/* Top highlight shimmer */}
        <div style={{
          position: 'absolute', top: 0, left: '10%', right: '10%', height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.90), transparent)',
          pointerEvents: 'none',
        }} />

        {/* Bottom purple glow accent */}
        <motion.div
          animate={{ opacity: expanded ? 0.5 : 0.20 }}
          transition={{ duration: 0.35 }}
          style={{
            position: 'absolute', bottom: -18, left: '20%', right: '20%', height: 28,
            background: 'radial-gradient(ellipse at center, rgba(123,46,255,0.45) 0%, transparent 70%)',
            filter: 'blur(7px)',
            pointerEvents: 'none', zIndex: -1,
          }}
        />

        <AnimatePresence mode="wait" initial={false}>
          {expanded ? (
            /* ── EXPANDED ── */
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12, delay: 0.04 }}
              style={{ display: 'flex', alignItems: 'center', padding: '7px 8px', gap: 1 }}
            >
              {/* Logo mark */}
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: 'linear-gradient(135deg, #7b2eff, #6a1fe0, #00e0b8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginRight: 5, overflow: 'hidden',
                border: '1px solid var(--border)',
                boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
              }}>
                <Image
                  src="/logo.png"
                  width={22} height={22}
                  alt="SmartFood"
                  style={{ filter: 'invert(1)', mixBlendMode: 'screen', objectFit: 'contain' }}
                />
              </div>

              {NAV.map(item => (
                <MagneticPill
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={<item.icon size={13} />}
                  isActive={pathname === item.href}
                  onClick={() => setExpanded(false)}
                />
              ))}
            </motion.div>
          ) : (
            /* ── COLLAPSED ── */
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '10px 18px', whiteSpace: 'nowrap',
              }}
            >
              {/* SF logomark mini */}
              <div style={{
                width: 24, height: 24, borderRadius: 7, flexShrink: 0,
                background: 'linear-gradient(135deg, #7b2eff, #00e0b8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
                border: '1px solid var(--border)',
                boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
              }}>
                <Image
                  src="/logo.png"
                  width={14} height={14}
                  alt="SF"
                  style={{ filter: 'invert(1)', mixBlendMode: 'screen', objectFit: 'contain' }}
                />
              </div>
              <ActiveIcon size={14} style={{ color: '#7b2eff', flexShrink: 0 }} />
              <span style={{
                fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 800,
                color: '#111111', letterSpacing: '-0.02em',
              }}>
                {active.label}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
