'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

/** Quais consultas cada aviso do salão deixa velhas. */
const AFETADAS: Record<string, string[][]> = {
  mesa: [['mesas'], ['mesa-pedidos'], ['diagnostico']],
  pedido: [['pedidos'], ['mesas'], ['mesa-pedidos'], ['indicadores'], ['acompanhamento'], ['diagnostico']],
  cardapio: [['produtos'], ['categorias'], ['diagnostico']],
}

/**
 * Mantém todas as telas abertas sincronizadas: totem, cozinha e administração.
 *
 * Assina o WebSocket público do salão e, a cada aviso (mesa ocupada, pedido
 * novo, cardápio alterado), invalida as consultas afetadas; o TanStack Query
 * busca de novo só o que está na tela. O socket só avisa, a API continua sendo
 * a fonte dos dados. Sem conexão, as telas seguem com a busca periódica.
 */
export function SalaoAoVivo() {
  const qc = useQueryClient()

  useEffect(() => {
    let socket: WebSocket | null = null
    let tentativa = 0
    let reconectar: ReturnType<typeof setTimeout> | undefined
    let encerrado = false

    const base = process.env.NEXT_PUBLIC_WS_URL
      || (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1')
        .replace(/^http/, 'ws')
        .replace(/\/api\/v1\/?$/, '')

    const invalidar = (tipos: string[]) => {
      for (const tipo of tipos)
        for (const queryKey of AFETADAS[tipo] ?? []) qc.invalidateQueries({ queryKey })
    }

    function conectar() {
      if (encerrado) return
      socket = new WebSocket(`${base}/ws/salao/`)
      socket.onopen = () => {
        // Reconectou: o que mudou enquanto a conexão esteve fora não chegou por aviso.
        if (tentativa > 0) invalidar(Object.keys(AFETADAS))
        tentativa = 0
      }
      socket.onmessage = (evento) => {
        try {
          const dado = JSON.parse(evento.data)
          if (dado.tipo in AFETADAS) invalidar([dado.tipo])
        } catch {
          /* frame que não é JSON não interessa aqui */
        }
      }
      socket.onclose = () => {
        if (encerrado) return
        tentativa++
        reconectar = setTimeout(conectar, Math.min(30_000, 1_000 * 2 ** tentativa))
      }
      socket.onerror = () => socket?.close()
    }

    // Aba que volta a ficar visível pode ter perdido avisos (celular em repouso).
    const aoVoltar = () => { if (document.visibilityState === 'visible') invalidar(Object.keys(AFETADAS)) }
    document.addEventListener('visibilitychange', aoVoltar)
    conectar()

    return () => {
      encerrado = true
      clearTimeout(reconectar)
      document.removeEventListener('visibilitychange', aoVoltar)
      socket?.close()
    }
  }, [qc])

  return null
}
