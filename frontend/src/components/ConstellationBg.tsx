'use client'

import { useEffect, useRef } from 'react'

interface SandDot {
  x: number; y: number
  vx: number; vy: number
  r: number
  baseX: number; baseY: number
  warm: number /* 0..1, how warm the sand color is */
}

interface Node {
  x: number; y: number
  vx: number; vy: number
  r: number
  baseX: number; baseY: number
  type: 'purple' | 'cyan'
}

const SAND_COUNT  = 130
const NODE_COUNT  = 50
const LINK_DIST   = 130
const REPEL_DIST  = 160
const SAND_SPEED  = 0.18
const NODE_SPEED  = 0.26

export function ConstellationBg() {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const sandRef    = useRef<SandDot[]>([])
  const nodesRef   = useRef<Node[]>([])
  const mouseRef   = useRef({ x: -9999, y: -9999 })
  const rafRef     = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx    = canvas.getContext('2d')!

    function resize() {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
      init()
    }

    function init() {
      /* Sand particles - tiny, warm beige drift */
      sandRef.current = Array.from({ length: SAND_COUNT }, () => {
        const x = Math.random() * canvas.width
        const y = Math.random() * canvas.height
        const angle = Math.random() * Math.PI * 2
        return {
          x, y, baseX: x, baseY: y,
          vx: Math.cos(angle) * SAND_SPEED,
          vy: Math.sin(angle) * SAND_SPEED,
          r: Math.random() * 1.2 + 0.4,
          warm: Math.random(),
        }
      })

      /* Constellation nodes - purple & cyan */
      nodesRef.current = Array.from({ length: NODE_COUNT }, (_, i) => {
        const x = Math.random() * canvas.width
        const y = Math.random() * canvas.height
        const angle = Math.random() * Math.PI * 2
        return {
          x, y, baseX: x, baseY: y,
          vx: Math.cos(angle) * NODE_SPEED,
          vy: Math.sin(angle) * NODE_SPEED,
          r: Math.random() * 1.8 + 0.8,
          type: i % 2 === 0 ? 'purple' : 'cyan',
        }
      })
    }

    resize()
    window.addEventListener('resize', resize)

    function onMouseMove(e: MouseEvent) {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }
    function onMouseLeave() {
      mouseRef.current = { x: -9999, y: -9999 }
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseleave', onMouseLeave)

    function moveDot(d: SandDot | Node, speed: number) {
      const { x: mx, y: my } = mouseRef.current
      const dx = d.x - mx; const dy = d.y - my
      const distSq = dx * dx + dy * dy
      if (distSq < REPEL_DIST * REPEL_DIST) {
        const dist = Math.sqrt(distSq)
        const force = (REPEL_DIST - dist) / REPEL_DIST * 0.6
        d.vx += (dx / dist) * force
        d.vy += (dy / dist) * force
      }
      /* spring back toward base */
      d.vx += (d.baseX - d.x) * 0.00012
      d.vy += (d.baseY - d.y) * 0.00012
      d.vx *= 0.988; d.vy *= 0.988
      d.x += d.vx; d.y += d.vy

      /* wrap */
      if (d.x < -20) d.x = canvas.width + 20
      if (d.x > canvas.width + 20) d.x = -20
      if (d.y < -20) d.y = canvas.height + 20
      if (d.y > canvas.height + 20) d.y = -20
    }

    function tick() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const sands = sandRef.current
      const nodes = nodesRef.current

      /* ── Update sand dots ── */
      for (const s of sands) moveDot(s, SAND_SPEED)

      /* ── Update constellation nodes ── */
      for (const n of nodes) moveDot(n, NODE_SPEED)

      /* ── Draw constellation lines ── */
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i]; const b = nodes[j]
          const dx = a.x - b.x; const dy = a.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < LINK_DIST) {
            const fade = 1 - dist / LINK_DIST
            const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y)
            const colorA = a.type === 'purple' ? '123,46,255' : '0,224,184'
            const colorB = b.type === 'purple' ? '123,46,255' : '0,224,184'
            grad.addColorStop(0, `rgba(${colorA},${0.18 * fade})`)
            grad.addColorStop(1, `rgba(${colorB},${0.12 * fade})`)
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = grad
            ctx.lineWidth = fade * 1.1
            ctx.stroke()
          }
        }
      }

      /* ── Draw sand particles ── */
      for (const s of sands) {
        /* warm beige range: #c8b89a → #e8d5b7 */
        const r = Math.round(200 + s.warm * 32)
        const g = Math.round(184 + s.warm * 17)
        const b = Math.round(154 + s.warm * 12)
        const alpha = 0.30 + s.warm * 0.18
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fill()
      }

      /* ── Draw constellation nodes with glow ── */
      for (const n of nodes) {
        const isPurple = n.type === 'purple'
        const [cr, cg, cb] = isPurple ? [123,46,255] : [0,224,184]

        /* Glow halo */
        const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 6)
        grd.addColorStop(0, `rgba(${cr},${cg},${cb},0.22)`)
        grd.addColorStop(1, `rgba(${cr},${cg},${cb},0)`)
        ctx.fillStyle = grd
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r * 6, 0, Math.PI * 2)
        ctx.fill()

        /* Core dot */
        ctx.fillStyle = `rgba(${cr},${cg},${cb},0.55)`
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fill()

        /* Black outline ring */
        ctx.strokeStyle = `rgba(0,0,0,0.12)`
        ctx.lineWidth = 0.8
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r + 0.8, 0, Math.PI * 2)
        ctx.stroke()
      }

      rafRef.current = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseleave', onMouseLeave)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.9,
      }}
    />
  )
}
