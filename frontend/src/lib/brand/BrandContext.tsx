'use client'

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { BrandConfig, DEFAULT_BRAND, STORAGE_KEY } from './types'
import { shade, isHex } from './color'
import { api } from '@/lib/api'

interface BrandContextValue {
  brand: BrandConfig
  /** Persistência hidratada do localStorage (evita flash de estado default). */
  ready: boolean
  update: (patch: Partial<BrandConfig>) => void
  reset: () => void
  save: () => Promise<void>
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
    let vivo = true
    Promise.resolve().then(async () => {
      try {
        const {data} = await api.get<Partial<BrandConfig>>('/restaurante/')
        return { ...DEFAULT_BRAND, ...data }
      } catch {
        try { return { ...DEFAULT_BRAND, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } } catch { return DEFAULT_BRAND }
      }
    }).then(data => { if (vivo) { setBrand(data); setReady(true) } })
    return () => { vivo = false }

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
    setBrand(prev => ({ ...DEFAULT_BRAND, accountId: prev.accountId }))
  }, [])

  const save = useCallback(async () => {
    const {data} = await api.patch<BrandConfig>('/restaurante/', brand)
    const {data: confirmado} = await api.get<BrandConfig>('/restaurante/')
    if (confirmado.name !== data.name || confirmado.accent !== data.accent) throw new Error('Não foi possível confirmar a configuração salva.')
    setBrand({ ...DEFAULT_BRAND, ...confirmado })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(confirmado))
  }, [brand])
  const value = useMemo(() => ({ brand, ready, update, reset, save }), [brand, ready, update, reset, save])

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>
}

export function useBrand(): BrandContextValue {
  const ctx = useContext(BrandContext)
  if (!ctx) throw new Error('useBrand deve ser usado dentro de <BrandProvider>')
  return ctx
}
