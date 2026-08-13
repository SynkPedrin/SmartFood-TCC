'use client'

import { useBrand } from '@/lib/brand/BrandContext'
import AmbientBg from '@/components/AmbientBg'

/**
 * Plano de fundo white-label. Renderiza o estilo escolhido na conta,
 * sempre discreto para não competir com o conteúdo.
 * Deve ficar atrás do conteúdo (zIndex 0); o conteúdo usa zIndex >= 1.
 */
export function BrandBackground() {
  const { brand, ready } = useBrand()
  if (!ready) return null

  if (brand.background === 'plain') return null

  if (brand.background === 'grid') {
    return (
      <div
        aria-hidden
        style={{
          position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
          backgroundImage:
            'linear-gradient(rgba(17,17,17,0.045) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgba(17,17,17,0.045) 1px, transparent 1px)',
          backgroundSize: '46px 46px',
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 45%, #000 25%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 45%, #000 25%, transparent 100%)',
        }}
      />
    )
  }

  if (brand.background === 'image' && brand.backgroundImage) {
    return (
      <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div
          style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${brand.backgroundImage})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            opacity: 0.14,
          }}
        />
        {/* véu creme para manter tudo clean e legível */}
        <div style={{ position: 'absolute', inset: 0, background: 'var(--bg-root)', opacity: 0.55 }} />
      </div>
    )
  }

  // default: 'dots'
  return <AmbientBg />
}
