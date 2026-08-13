'use client'

import { useEffect, useRef } from 'react'

/**
 * Fundo ambiente discreto: um plano "infinito" de pontos monocromáticos
 * (tom espresso sobre creme) com deriva lenta e parallax sutil ao mouse.
 * Sem glow, sem cor saturada: profundidade e textura, nunca efeito.
 * Respeita prefers-reduced-motion (renderiza estático).
 */
export default function AmbientBg() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const canvas = cv
    const c = ctx

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const GAP = 46 // px entre pontos
    let w = 0, h = 0
    let raf = 0
    let t = 0

    // parallax alvo/atual (suavizado)
    const px = { cur: 0, tgt: 0 }
    const py = { cur: 0, tgt: 0 }

    function resize() {
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      c.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function draw() {
      c.clearRect(0, 0, w, h)
      px.cur += (px.tgt - px.cur) * 0.06
      py.cur += (py.tgt - py.cur) * 0.06

      // deriva lenta contínua
      const driftX = Math.sin(t * 0.00018) * 10
      const driftY = Math.cos(t * 0.00015) * 10
      const ox = px.cur + driftX
      const oy = py.cur + driftY

      const cx = w / 2, cy = h / 2
      const maxD = Math.hypot(cx, cy)

      for (let gx = -1; gx * GAP < w + GAP; gx++) {
        for (let gy = -1; gy * GAP < h + GAP; gy++) {
          const x = gx * GAP + (ox % GAP) + GAP
          const y = gy * GAP + (oy % GAP) + GAP
          // profundidade: pontos ao centro levemente maiores/mais visíveis
          const d = Math.hypot(x - cx, y - cy) / maxD
          const depth = 1 - d
          const r = 0.6 + depth * 1.0
          const a = 0.04 + depth * 0.06
          c.beginPath()
          c.arc(x, y, r, 0, Math.PI * 2)
          c.fillStyle = `rgba(17,17,17,${a})`
          c.fill()
        }
      }
    }

    function tick(now: number) {
      t = now
      draw()
      raf = requestAnimationFrame(tick)
    }

    function onMove(e: PointerEvent) {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2
      const ny = (e.clientY / window.innerHeight - 0.5) * 2
      px.tgt = -nx * 14
      py.tgt = -ny * 14
    }

    resize()
    window.addEventListener('resize', resize)
    if (reduce) {
      draw()
    } else {
      window.addEventListener('pointermove', onMove)
      raf = requestAnimationFrame(tick)
    }

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      aria-hidden
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}
    />
  )
}
