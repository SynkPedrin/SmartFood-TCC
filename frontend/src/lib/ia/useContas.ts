'use client'

import { useEffect, useState } from 'react'

/** Espelho client-side de ContaMeta (o tipo do servidor vive em lib/ia/cerebro.ts). */
export interface ContaCerebro {
  slug: string
  nome: string
  segmento?: string
  plano?: string
  accent?: string
  iaNome?: string
  iaTom?: string
}

interface Estado {
  contas: ContaCerebro[]
  /** false quando o vault do cérebro não está acessível neste ambiente. */
  disponivel: boolean
  carregando: boolean
}

/** Lê as contas que têm cérebro no vault. Uma chamada por montagem, sem cache global. */
export function useContasCerebro(): Estado {
  const [estado, setEstado] = useState<Estado>({ contas: [], disponivel: false, carregando: true })

  useEffect(() => {
    let vivo = true
    fetch('/api/ia/contas')
      .then(r => r.json())
      .then((d: { disponivel?: boolean; contas?: ContaCerebro[] }) => {
        if (!vivo) return
        setEstado({
          contas: d.contas ?? [],
          disponivel: Boolean(d.disponivel),
          carregando: false,
        })
      })
      .catch(() => {
        if (vivo) setEstado({ contas: [], disponivel: false, carregando: false })
      })
    return () => { vivo = false }
  }, [])

  return estado
}
