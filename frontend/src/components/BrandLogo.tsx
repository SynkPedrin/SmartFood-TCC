'use client'

import Image from 'next/image'
import { useBrand } from '@/lib/brand/BrandContext'

interface BrandLogoProps {
  /** Lado do quadro (px). */
  size?: number
  /** Raio da borda (usado só para logo custom). */
  radius?: number
  /** Compat: não desenha mais chip escuro. */
  onDark?: boolean
  style?: React.CSSProperties
}

/**
 * Marca da conta (white-label). Sem moldura: mostra o logo custom se houver,
 * senão o logo padrão em sua cor nativa (o `multiply` faz o branco sumir em
 * qualquer fundo). Fonte única para hub, totem, cozinha e admin.
 */
export function BrandLogo({ size = 40, radius = 12, style }: BrandLogoProps) {
  const { brand } = useBrand()
  const custom = brand.logo

  return (
    <div
      style={{
        width: size, height: size, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        borderRadius: custom ? radius : 0,
        ...style,
      }}
    >
      {custom ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={custom}
          alt={brand.name}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      ) : (
        <Image
          src="/logo.png"
          width={Math.round(size * 1.7)}
          height={Math.round(size * 1.7)}
          alt={brand.name}
          priority
          style={{ objectFit: 'contain', mixBlendMode: 'multiply' }}
        />
      )}
    </div>
  )
}
