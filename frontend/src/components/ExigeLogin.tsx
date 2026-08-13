'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'

/**
 * Guarda de rota da área interna. Enquanto a sessão está sendo verificada não
 * mostra nada, e sem sessão manda para /entrar guardando para onde voltar.
 *
 * A proteção séria é a da API: aqui é só para não exibir tela que não vai
 * funcionar. Quem chamar a API sem token continua levando 401.
 */
export function ExigeLogin({ children }: { children: React.ReactNode }) {
  const { usuario, carregando } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!carregando && !usuario) {
      router.replace(`/entrar?destino=${encodeURIComponent(pathname)}`)
    }
  }, [carregando, usuario, router, pathname])

  if (carregando) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Verificando sessão…</span>
      </div>
    )
  }

  if (!usuario) return null

  return <>{children}</>
}
