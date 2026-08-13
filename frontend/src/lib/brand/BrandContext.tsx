'use client'

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { BrandConfig, DEFAULT_BRAND, STORAGE_KEY } from './types'
import { shade, isHex } from './color'

interface BrandContextValue {
  brand: BrandConfig
  /** Persistência hidratada do localStorage (evita flash de estado default). */
  ready: boolean
  update: (patch: Partial<BrandConfig>) => void
  reset: () => void
}

const BrandContext = createContext<BrandContextValue | null>(null)

/** Aplica o acento como variáveis CSS globais → propaga a tudo que usa os tokens. */
function applyAccent(accent: string) {
  if (typeof document === 'undefined' || !isHex(accent)) return
  const root = document.documentElement.style
  const strong = shade(accent, -0.18)
  // dirige o sistema novo (primary + gradiente) e as aliases legadas
  root.setProperty('--primary', accent)
  root.setProperty('--primary-strong', strong)
  root.setProperty('--primary-soft', 'color-mix(in srgb, ' + accent + ' 10%, transparent)')
  root.setProperty('--brand', accent)
  root.setProperty('--terracotta', accent)
  root.setProperty('--terracotta-d', strong)
  root.setProperty('--terracotta-l', shade(accent, 0.35))
  root.setProperty('--gradient-brand', `linear-gradient(135deg, ${accent}, var(--secondary))`)
  root.setProperty('--gradient-h', `linear-gradient(135deg, ${accent}, var(--secondary))`)
}

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [brand, setBrand] = useState<BrandConfig>(DEFAULT_BRAND)
  const [ready, setReady] = useState(false)

  // Hidrata do localStorage no cliente.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<BrandConfig>
        setBrand({ ...DEFAULT_BRAND, ...parsed })
      }
    } catch {
      /* ignora config corrompida */
    }
    setReady(true)
  }, [])

  // Aplica acento sempre que mudar.
  useEffect(() => {
    applyAccent(brand.accent)
  }, [brand.accent])

  const update = useCallback((patch: Partial<BrandConfig>) => {
    setBrand(prev => {
      const next = { ...prev, ...patch }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* quota */ }
      return next
    })
  }, [])

  const reset = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* noop */ }
    setBrand(DEFAULT_BRAND)
  }, [])

  const value = useMemo(() => ({ brand, ready, update, reset }), [brand, ready, update, reset])

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>
}

export function useBrand(): BrandContextValue {
  const ctx = useContext(BrandContext)
  if (!ctx) throw new Error('useBrand deve ser usado dentro de <BrandProvider>')
  return ctx
}
