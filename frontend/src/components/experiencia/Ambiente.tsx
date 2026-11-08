'use client'

import { usePathname } from 'next/navigation'
import { useBrand } from '@/lib/brand/BrandContext'

/**
 * Luz ambiente do sistema: três fontes de luz difusas na cor da marca que
 * derivam devagar, uma "luz de palco" vinda do topo, a textura escolhida em
 * Personalização (pontos, grade, imagem ou liso) e um grão fino de papel.
 *
 * Fica atrás de tudo (z-index -1) e não recebe clique. A cozinha tem a sua
 * própria iluminação escura, então aqui ela fica de fora.
 */
export function Ambiente() {
  const { brand, ready } = useBrand()
  const pathname = usePathname()
  if (pathname?.startsWith('/cozinha')) return null

  const fundo = ready ? brand.background : 'dots'
  const imagemPropria = fundo === 'image' && !!brand.backgroundImage
  // O wallpaper oficial é a base; some só no "liso" ou com imagem própria.
  const wallpaper = fundo !== 'plain' && !imagemPropria

  return (
    <div className="ambiente" aria-hidden data-fundo={fundo} data-wallpaper={wallpaper || undefined}>
      {wallpaper && <div className="ambiente-wallpaper" />}
      <div className="ambiente-luz ambiente-luz-a" />
      <div className="ambiente-luz ambiente-luz-b" />
      <div className="ambiente-luz ambiente-luz-c" />
      <div className="ambiente-palco" />
      {imagemPropria ? (
        <div className="ambiente-imagem" style={{ backgroundImage: `url(${brand.backgroundImage})` }} />
      ) : (
        <div className="ambiente-textura" />
      )}
      <div className="ambiente-grao" />
    </div>
  )
}
