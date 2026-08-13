'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, TOKEN_KEY } from '@/lib/api'

export interface Usuario {
  id: number
  username: string
  first_name: string
  is_staff: boolean
}

interface AuthValue {
  usuario: Usuario | null
  /** true enquanto o token salvo ainda não foi validado no servidor. */
  carregando: boolean
  entrar: (username: string, password: string) => Promise<void>
  sair: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [carregando, setCarregando] = useState(true)

  // Token guardado não é sessão válida: pode ter sido revogado no servidor.
  // Por isso a sessão só é considerada boa depois que /auth/eu/ confirma.
  useEffect(() => {
    const token = typeof window === 'undefined' ? null : localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setCarregando(false)
      return
    }
    api.get<Usuario>('/auth/eu/')
      .then(r => setUsuario(r.data))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
        setUsuario(null)
      })
      .finally(() => setCarregando(false))
  }, [])

  const entrar = useCallback(async (username: string, password: string) => {
    const { data } = await api.post<{ token: string; usuario: Usuario }>('/auth/login/', { username, password })
    localStorage.setItem(TOKEN_KEY, data.token)
    setUsuario(data.usuario)
  }, [])

  const sair = useCallback(async () => {
    try {
      await api.post('/auth/logout/')
    } catch {
      /* token já pode ter expirado: sair localmente mesmo assim */
    }
    localStorage.removeItem(TOKEN_KEY)
    setUsuario(null)
  }, [])

  const value = useMemo(() => ({ usuario, carregando, entrar, sair }), [usuario, carregando, entrar, sair])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return ctx
}
