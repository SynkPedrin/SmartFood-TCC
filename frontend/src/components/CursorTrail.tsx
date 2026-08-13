'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number; y: number
  vx: number; vy: number
  life: number
  size: number
  r: number; g: number; b: number
}

/* Brand palette - off-white, purple, cyan */
const PALETTE = [
  [124, 53, 208],  // brand purple
  [166, 127, 232], // brand purple-light
  [32, 217, 154],  // brand cyan
  [94, 232, 200],  // brand cyan-light
  [239, 237, 232], // brand off-white
  [200, 180, 240], // purple-offwhite blend
]

export function CursorTrail() {
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const rafRef       = useRef<number>(0)
  const prevRef      = useRef({ x: -1, y: -1 })

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx    = canvas.getContext('2d')!

    /* Resize canvas to viewport */
    function resize() {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    /* Spawn particles on mouse move */
    function onMouseMove(e: MouseEvent) {
      const { x: px, y: py } = prevRef.current
      const dx = e.clientX - px
      const dy = e.clientY - py
      const dist = Math.hypot(dx, dy)

      if (dist > 4 || px === -1) {
        const count = Math.min(Math.ceil(dist / 4), 8)
        for (let i = 0; i < count; i++) {
          const [r, g, b] = PALETTE[Math.floor(Math.random() * PALETTE.length)]
          const angle = Math.random() * Math.PI * 2
          const speed = Math.random() * 1.8 + 0.4
          particlesRef.current.push({
            x: e.clientX + (Math.random() - 0.5) * 6,
            y: e.clientY + (Math.random() - 0.5) * 6,
            vx: Math.cos(angle) * speed * 0.6,
            vy: Math.sin(angle) * speed * 0.6 - 0.6,
            life: 1,
            size: Math.random() * 3 + 1,
            r, g, b,
          })
        }
        /* Hard cap to avoid memory growth */
        if (particlesRef.current.length > 250) {
          particlesRef.current.splice(0, particlesRef.current.length - 250)
        }
        prevRef.current = { x: e.clientX, y: e.clientY }
      }
    }
    window.addEventListener('mousemove', onMouseMove)

    /* Render loop */
    function tick() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i]

        /* Physics */
        p.life -= 0.024
        if (p.life <= 0) { particlesRef.current.splice(i, 1); continue }
        p.x  += p.vx
        p.y  += p.vy
        p.vy -= 0.025   /* float up gently */
        p.vx *= 0.975
        p.vy *= 0.975

        const a = p.life
        const { r, g, b } = p

        /* Outer glow halo */
        const haloR = p.size * 5
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, haloR)
        grd.addColorStop(0, `rgba(${r},${g},${b},${a * 0.35})`)
        grd.addColorStop(1, `rgba(${r},${g},${b},0)`)
        ctx.fillStyle = grd
        ctx.beginPath()
        ctx.arc(p.x, p.y, haloR, 0, Math.PI * 2)
        ctx.fill()

        /* Core dot */
        ctx.globalAlpha = a * 0.9
        ctx.fillStyle = `rgb(${r},${g},${b})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * p.life * 0.7, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
      }

      rafRef.current = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0,
        zIndex: 950,
        pointerEvents: 'none',
        mixBlendMode: 'multiply',
      }}
    />
  )
}
