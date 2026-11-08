'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import axios from 'axios'
import Link from 'next/link'
import { LogIn, Lock, Loader2, User as UserIcon } from 'lucide-react'
import { BrandLogo } from '@/components/BrandLogo'
import { useAuth } from '@/lib/auth/AuthContext'
import { useBrand } from '@/lib/brand/BrandContext'
import { MODO_SITE } from '@/lib/site'

function Formulario() {
  const { entrar } = useAuth()
  const { brand } = useBrand()
  const router = useRouter()
  const params = useSearchParams()
  const candidato = params.get('destino') || '/admin'
  const destino = /^\/(admin|cozinha|produtos|categorias|mesas)(\/|$)/.test(candidato) && !candidato.includes('\\') ? candidato : '/admin'

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
      // Sem resposta do servidor é problema de rede, não de senha errada. Dizer
      // "verifique usuário e senha" nesse caso manda a pessoa procurar no lugar errado.
      if (axios.isAxiosError(err) && !err.response) {
        setErro('Não consegui falar com o servidor. Verifique se a API está no ar.')
      } else {
        const detalhe = axios.isAxiosError(err) ? err.response?.data?.detail : null
        setErro(detalhe || 'Não consegui entrar. Verifique usuário e senha.')
      }
      setEnviando(false)
    }
  }

  return (
    <motion.form
      onSubmit={enviar}
      className="login-card borda-viva"
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="login-arte" aria-hidden>
        <span className="logo-halo">
          <BrandLogo size={72} radius={18} />
        </span>
      </div>
      <div className="login-cabeca">
        <div>
          <h1>{brand.name}</h1>
          <p>Área da equipe. O cardápio do cliente não precisa de login.</p>
        </div>
      </div>

      <label className="login-campo">
        <span>Usuário</span>
        <span className="com-icone">
          <UserIcon size={16} />
          <input
            className="field"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoComplete="username"
            autoFocus
            required
          />
        </span>
      </label>

      <label className="login-campo" style={{ marginBottom: 20 }}>
        <span>Senha</span>
        <span className="com-icone">
          <Lock size={16} />
          <input
            className="field"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </span>
      </label>

      {erro && <p className="login-erro" role="alert">{erro}</p>}

      <button type="submit" className="btn btn-primary" disabled={enviando}>
        {enviando ? <Loader2 size={16} className="spin" /> : <LogIn size={16} />}
        {enviando ? 'Entrando…' : 'Entrar'}
      </button>

      <p className="login-rodape">
        {MODO_SITE === 'equipe' ? (
          <>É da cozinha? <Link href="/cozinha">Abrir a cozinha sem login</Link></>
        ) : (
          <>Veio fazer um pedido? <Link href="/totem">Abrir o cardápio</Link></>
        )}
      </p>
    </motion.form>
  )
}

export default function EntrarPage() {
  return (
    <main className="login-palco">
      <Suspense fallback={null}>
        <Formulario />
      </Suspense>
    </main>
  )
}
