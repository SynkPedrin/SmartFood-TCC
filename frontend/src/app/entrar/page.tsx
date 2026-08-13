'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import axios from 'axios'
import { LogIn, Lock, User as UserIcon } from 'lucide-react'
import { BrandLogo } from '@/components/BrandLogo'
import { useAuth } from '@/lib/auth/AuthContext'
import { useBrand } from '@/lib/brand/BrandContext'

function Formulario() {
  const { entrar } = useAuth()
  const { brand } = useBrand()
  const router = useRouter()
  const params = useSearchParams()
  const destino = params.get('destino') || '/admin'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (enviando) return
    setErro('')
    setEnviando(true)
    try {
      await entrar(username.trim(), password)
      router.replace(destino)
    } catch (err) {
      const detalhe = axios.isAxiosError(err) ? err.response?.data?.detail : null
      setErro(detalhe || 'Não consegui entrar. Verifique usuário e senha.')
      setEnviando(false)
    }
  }

  return (
    <motion.form
      onSubmit={enviar}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{
        width: '100%', maxWidth: 380,
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: 18,
        boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
        padding: 28,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 22 }}>
        <BrandLogo size={52} radius={14} />
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 19, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            {brand.name}
          </h1>
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 3 }}>
            Área da equipe. O cardápio do cliente não precisa de login.
          </p>
        </div>
      </div>

      <label style={{ display: 'block', marginBottom: 14 }}>
        <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
          Usuário
        </span>
        <span style={{ position: 'relative', display: 'block' }}>
          <UserIcon size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="field"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoComplete="username"
            autoFocus
            required
            style={{ paddingLeft: 34 }}
          />
        </span>
      </label>

      <label style={{ display: 'block', marginBottom: 18 }}>
        <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
          Senha
        </span>
        <span style={{ position: 'relative', display: 'block' }}>
          <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="field"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            style={{ paddingLeft: 34 }}
          />
        </span>
      </label>

      {erro && (
        <p style={{
          fontSize: 12.5, color: '#b91c1c', background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.28)', borderRadius: 10,
          padding: '9px 11px', marginBottom: 14,
        }}>
          {erro}
        </p>
      )}

      <button
        type="submit"
        className="btn btn-primary"
        disabled={enviando}
        style={{ width: '100%', justifyContent: 'center', gap: 8 }}
      >
        <LogIn size={15} /> {enviando ? 'Entrando…' : 'Entrar'}
      </button>
    </motion.form>
  )
}

export default function EntrarPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Suspense fallback={null}>
        <Formulario />
      </Suspense>
    </div>
  )
}
