'use client'

import { useEffect } from 'react'

/**
 * Superfícies que acendem sob o cursor. Um único ouvinte para a página toda:
 * acha a superfície sob o ponteiro e grava a posição em --mx/--my; o CSS
 * desenha a luz no fundo e o brilho na borda a partir dessas variáveis.
 */
export const SUPERFICIES = [
  '.luz',
  '.operation-kpi',
  '.operation-card',
  '.mode-card',
  '.food-card',
  '.table-option',
  '.kitchen-order-card',
  '.glass',
  '.glass-static',
  '.brand-card',
  '.stat-card',
  '.mesa-card',
  '.quick-row',
  '.login-card',
  '.order-summary',
  '.table-wrap',
  '.inbox',
].join(',')

/**
 * Elementos com [data-tilt] inclinam em 3D na direção do cursor
 * (--rx/--ry em graus) e recebem --gx/--gy em % para o reflexo.
 */
export function LuzDoCursor() {
  useEffect(() => {
    // Em tela de toque não há cursor: nada a acompanhar.
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)')

    let quadro = 0
    let ultimo: PointerEvent | null = null
    let inclinado: HTMLElement | null = null

    const soltar = (el: HTMLElement) => {
      el.style.removeProperty('--rx')
      el.style.removeProperty('--ry')
      el.removeAttribute('data-tilt-ativo')
    }

    const aplicar = () => {
      quadro = 0
      const e = ultimo
      if (!e) return
      const alvo = e.target instanceof Element ? e.target : null

      const sup = alvo?.closest<HTMLElement>(SUPERFICIES)
      if (sup) {
        const r = sup.getBoundingClientRect()
        sup.style.setProperty('--mx', `${e.clientX - r.left}px`)
        sup.style.setProperty('--my', `${e.clientY - r.top}px`)
      }

      const tilt = alvo?.closest<HTMLElement>('[data-tilt]') ?? null
      if (inclinado && inclinado !== tilt) soltar(inclinado)
      inclinado = tilt
      if (tilt) {
        const r = tilt.getBoundingClientRect()
        const nx = (e.clientX - r.left) / r.width
        const ny = (e.clientY - r.top) / r.height
        tilt.style.setProperty('--gx', `${(nx * 100).toFixed(1)}%`)
        tilt.style.setProperty('--gy', `${(ny * 100).toFixed(1)}%`)
        if (!reduzir.matches) {
          const forca = Number(tilt.dataset.tilt) || 6
          tilt.style.setProperty('--rx', `${((0.5 - ny) * forca).toFixed(2)}deg`)
          tilt.style.setProperty('--ry', `${((nx - 0.5) * forca).toFixed(2)}deg`)
          tilt.setAttribute('data-tilt-ativo', '')
        }
      }
    }

    const mover = (e: PointerEvent) => {
      ultimo = e
      if (!quadro) quadro = requestAnimationFrame(aplicar)
    }
    const sair = () => {
      if (inclinado) soltar(inclinado)
      inclinado = null
    }

    document.addEventListener('pointermove', mover, { passive: true })
    document.documentElement.addEventListener('pointerleave', sair)
    return () => {
      document.removeEventListener('pointermove', mover)
      document.documentElement.removeEventListener('pointerleave', sair)
      if (quadro) cancelAnimationFrame(quadro)
    }
  }, [])

  return null
}
