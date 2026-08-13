'use client'

import { useEffect, useRef, useState } from 'react'
import { TOKEN_KEY } from '@/lib/api'

/**
 * Assina o WebSocket da cozinha e chama `aoMudar` quando a fila muda.
 *
 * O socket só avisa: quem busca a fila é a própria tela, pela API. Se a conexão
 * cair, ou se o servidor estiver sem Channels, `conectado` volta false e a tela
 * segue com a busca periódica, que continua sendo a rede de segurança.
 */
export function useFilaAoVivo(aoMudar: () => void): { conectado: boolean } {
  const [conectado, setConectado] = useState(false)
  // Guarda o callback numa ref para não reconectar a cada render da página.
  const callback = useRef(aoMudar)
  callback.current = aoMudar

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return

    let socket: WebSocket | null = null
    let tentativa = 0
    let reconectar: ReturnType<typeof setTimeout> | undefined
    let encerrado = false

    const base = process.env.NEXT_PUBLIC_WS_URL
      ?? (process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000/api/v1')
        .replace(/^http/, 'ws')
        .replace(/\/api\/v1\/?$/, '')

    function conectar() {
      if (encerrado) return
      socket = new WebSocket(`${base}/ws/cozinha/?token=${encodeURIComponent(token!)}`)

      socket.onopen = () => { tentativa = 0; setConectado(true) }

      socket.onmessage = evento => {
        try {
          const dado = JSON.parse(evento.data)
          if (dado.tipo === 'fila') callback.current()
        } catch {
          /* frame que não é JSON não interessa aqui */
        }
      }

      socket.onclose = () => {
        setConectado(false)
        if (encerrado) return
        // Espera crescente até 30s: cozinha com servidor fora não fica
        // martelando a rede.
        const espera = Math.min(30_000, 1_000 * 2 ** tentativa++)
        reconectar = setTimeout(conectar, espera)
      }

      socket.onerror = () => socket?.close()
    }

    conectar()

    return () => {
      encerrado = true
      clearTimeout(reconectar)
      socket?.close()
    }
  }, [])

  return { conectado }
}
