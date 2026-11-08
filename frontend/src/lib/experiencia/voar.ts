/**
 * Faz a foto do prato "voar" em arco até a sacola quando o cliente adiciona
 * um item. É só feedback visual: o carrinho já foi atualizado antes.
 * Sem animação se o sistema pede movimento reduzido.
 */
export function voarParaSacola(origem: HTMLImageElement | null | undefined) {
  if (!origem || typeof window === 'undefined') return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  if (typeof origem.animate !== 'function') return

  const de = origem.getBoundingClientRect()
  if (!de.width || !de.height) return

  const lado = Math.min(de.width, de.height, 132)
  const cx = de.left + de.width / 2
  const cy = de.top + de.height / 2

  const sacola = document.querySelector<HTMLElement>('.cart-dock')
  const alvo = sacola?.getBoundingClientRect()
  const ax = alvo ? alvo.left + 38 : window.innerWidth / 2
  const ay = alvo ? alvo.top + alvo.height / 2 : window.innerHeight - 44
  const dx = ax - cx
  const dy = ay - cy

  const copia = document.createElement('img')
  copia.src = origem.currentSrc || origem.src
  copia.alt = ''
  copia.setAttribute('aria-hidden', 'true')
  Object.assign(copia.style, {
    position: 'fixed',
    left: `${cx - lado / 2}px`,
    top: `${cy - lado / 2}px`,
    width: `${lado}px`,
    height: `${lado}px`,
    objectFit: 'cover',
    borderRadius: '50%',
    zIndex: '9999',
    pointerEvents: 'none',
    boxShadow: '0 18px 40px rgba(20,16,40,.28), 0 0 0 3px #fff',
    willChange: 'transform, opacity',
  } satisfies Partial<CSSStyleDeclaration>)
  document.body.appendChild(copia)

  const voo = copia.animate(
    [
      { transform: 'translate(0,0) scale(.9)', opacity: 1 },
      { transform: `translate(${dx * 0.35}px, ${dy * 0.35 - 140}px) scale(.62)`, opacity: 1, offset: 0.4 },
      { transform: `translate(${dx * 0.8}px, ${dy * 0.8 - 40}px) scale(.3)`, opacity: 1, offset: 0.8 },
      { transform: `translate(${dx}px, ${dy}px) scale(.12)`, opacity: 0.2 },
    ],
    { duration: 760, easing: 'cubic-bezier(.45,0,.25,1)' },
  )

  const fim = () => {
    copia.remove()
    document.querySelector<HTMLElement>('.cart-dock')?.animate(
      [
        { transform: 'translateX(-50%) scale(1)' },
        { transform: 'translateX(-50%) scale(1.045)' },
        { transform: 'translateX(-50%) scale(1)' },
      ],
      { duration: 380, easing: 'cubic-bezier(.3,1.6,.5,1)' },
    )
  }
  voo.onfinish = fim
  voo.oncancel = fim
}
