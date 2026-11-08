'use client'

import { usePathname } from 'next/navigation'
import { useBrand } from '@/lib/brand/BrandContext'

/**
 * Textura de fundo escolhida em Personalização (pontos, grade, imagem ou liso),
 * sempre discreta. Fica atrás de tudo e não recebe clique. A cozinha tem fundo
 * próprio, escuro, e fica de fora.
 */
export function Ambiente() {
  const { brand, ready } = useBrand()
  const pathname = usePathname()
  if (!ready || pathname?.startsWith('/cozinha')) return null

  return (
    <div className="ambiente" aria-hidden data-fundo={brand.background}>
      {brand.background === 'image' && brand.backgroundImage && (
        <div className="ambiente-imagem" style={{ backgroundImage: `url(${brand.backgroundImage})` }} />
      )}
    </div>
  )
}
