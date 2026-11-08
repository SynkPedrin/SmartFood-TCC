'use client'

import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react'
import { TOKEN_KEY } from '@/lib/api'
import type { Alerta } from '@/lib/ia/diagnostico'

const COR: Record<Alerta['nivel'], string> = { alta: '#dc2626', media: '#d97706', info: '#6b7280' }

/**
 * O que pede atenção agora, sem o gestor perguntar: pedido atrasado, prato pronto
 * parado, mesa sem atendimento, lacuna no cardápio. Vem de regras no servidor e
 * se atualiza pelo canal ao vivo do salão. Clicar pede à IA o plano de ação.
 */
export default function PontosDeAtencao({ onPerguntar, ocupado }: { onPerguntar: (texto: string) => void; ocupado: boolean }) {
  const { data, isError, isLoading } = useQuery<{ alertas: Alerta[] }>({
    queryKey: ['diagnostico'],
    queryFn: async () => {
      const token = localStorage.getItem(TOKEN_KEY)
      const res = await fetch('/api/ia/diagnostico', { headers: token ? { Authorization: `Token ${token}` } : {} })
      if (!res.ok) throw new Error('diagnóstico indisponível')
      return res.json()
    },
    // Atraso depende do relógio, não só de eventos: confere a cada minuto.
    refetchInterval: 60_000,
  })
  const alertas = data?.alertas ?? []

  return (
    <div style={{ marginBottom: 20, padding: 14, borderRadius: 14, background: '#fff', border: '1px solid var(--border)', boxShadow: '0 6px 16px rgba(0,0,0,0.06)' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
        <AlertTriangle size={14} style={{ color: '#d97706' }} /> Pontos de atenção agora
      </h3>
      {isLoading ? (
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Conferindo cozinha, salão e cardápio…</p>
      ) : isError ? (
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Não foi possível conferir agora.</p>
      ) : !alertas.length ? (
        <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#047857' }}>
          <CheckCircle2 size={14} /> Tudo dentro do esperado.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {alertas.slice(0, 5).map((a) => (
            <button
              key={a.texto}
              type="button"
              disabled={ocupado}
              title={a.acao}
              onClick={() => onPerguntar(`Como resolvo agora: ${a.texto}? Sugestão inicial: ${a.acao}.`)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px', borderRadius: 10,
                border: '1px solid var(--border)', background: '#fafafa', textAlign: 'left', width: '100%',
                fontSize: 12, lineHeight: 1.35, color: 'var(--text-secondary)', cursor: ocupado ? 'not-allowed' : 'pointer',
                fontFamily: 'Manrope, sans-serif',
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: COR[a.nivel], marginTop: 5, flexShrink: 0 }} />
              <span style={{ flex: 1 }}>
                <strong style={{ color: 'var(--text-primary)', fontWeight: 650 }}>{a.texto}.</strong> {a.acao}.
              </span>
              <ChevronRight size={13} style={{ flexShrink: 0, opacity: 0.4, marginTop: 2 }} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
