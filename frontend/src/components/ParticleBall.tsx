'use client'

import { useEffect, useRef } from 'react'

interface Particula {
  x: number; y: number; z: number
  ox: number; oy: number
  vx: number; vy: number
  fase: number
}

/**
 * Bola de partículas do SmartFood IA: gira sem parar, repele as partículas
 * quando o ponteiro encosta e acelera/pulsa enquanto `thinking` (respondendo).
 */
export default function ParticleBall({ size = 44, thinking = false }: { size?: number; thinking?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const thinkingRef = useRef(thinking)
  thinkingRef.current = thinking

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = size * dpr
    canvas.height = size * dpr
    ctx.scale(dpr, dpr)

    const total = size >= 40 ? 110 : 46
    const raio = size * 0.34
    const centro = size / 2

    // pontos distribuídos de forma uniforme na esfera (espiral de Fibonacci)
    const pts: Particula[] = []
    const aureo = Math.PI * (3 - Math.sqrt(5))
    for (let i = 0; i < total; i++) {
      const y = 1 - (i / (total - 1)) * 2
      const r = Math.sqrt(1 - y * y)
      const teta = aureo * i
      pts.push({
        x: Math.cos(teta) * r, y, z: Math.sin(teta) * r,
        ox: 0, oy: 0, vx: 0, vy: 0,
        fase: Math.random() * Math.PI * 2,
      })
    }

    const ponteiro = { x: -9999, y: -9999 }
    let angulo = 0
    let raf = 0
    let t0 = performance.now()

    const frame = (now: number) => {
      const dt = Math.min((now - t0) / 16.7, 3)
      t0 = now
      const pensando = thinkingRef.current
      const t = now / 1000
      angulo += (pensando ? 0.055 : 0.012) * dt

      ctx.clearRect(0, 0, size, size)

      const inclinacao = Math.sin(t * 0.35) * 0.25
      const cosA = Math.cos(angulo), sinA = Math.sin(angulo)
      const cosI = Math.cos(inclinacao), sinI = Math.sin(inclinacao)

      for (const p of pts) {
        // rotação em Y e leve balanço em X
        const x = p.x * cosA + p.z * sinA
        let z = -p.x * sinA + p.z * cosA
        const y = p.y * cosI - z * sinI
        z = p.y * sinI + z * cosI

        // respiração constante; pensando, pulsa rápido e forte
        const pulso = 1 + Math.sin(t * (pensando ? 6 : 1.6) + p.fase) * (pensando ? 0.16 : 0.05)
        const persp = 1.6 / (1.6 + z)
        let sx = centro + x * raio * pulso * persp
        let sy = centro + y * raio * pulso * persp

        // repulsão ao ponteiro, com mola de volta ao lugar
        const dx = sx + p.ox - ponteiro.x
        const dy = sy + p.oy - ponteiro.y
        const alcance = size * 0.55
        const d2 = dx * dx + dy * dy
        if (d2 < alcance * alcance) {
          const d = Math.sqrt(d2) || 1
          const forca = ((alcance - d) / alcance) * (pensando ? 3.2 : 2.2)
          p.vx += (dx / d) * forca
          p.vy += (dy / d) * forca
        }
        p.vx += -p.ox * 0.06
        p.vy += -p.oy * 0.06
        p.vx *= 0.86
        p.vy *= 0.86
        p.ox += p.vx * dt
        p.oy += p.vy * dt

        sx += p.ox
        sy += p.oy

        // profundidade define cor (violeta atrás, turquesa na frente) e tamanho
        const frente = (1 - z) / 2
        const cr = Math.round(139 - 139 * frente)
        const cg = Math.round(77 + 147 * frente)
        const cb = Math.round(255 - 71 * frente)
        ctx.beginPath()
        ctx.arc(sx, sy, (0.9 + frente * 1.5) * (size / 44) * (pensando ? 1.15 : 1), 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${0.25 + frente * 0.75})`
        ctx.fill()
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    const mover = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      ponteiro.x = e.clientX - rect.left
      ponteiro.y = e.clientY - rect.top
    }
    const sair = () => { ponteiro.x = -9999; ponteiro.y = -9999 }
    canvas.addEventListener('pointermove', mover)
    canvas.addEventListener('pointerleave', sair)

    return () => {
      cancelAnimationFrame(raf)
      canvas.removeEventListener('pointermove', mover)
      canvas.removeEventListener('pointerleave', sair)
    }
  }, [size])

  return (
    <canvas
      ref={ref}
      style={{ width: size, height: size, display: 'block', flexShrink: 0, touchAction: 'none', cursor: 'pointer' }}
      aria-hidden
    />
  )
}
