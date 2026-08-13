import { NextRequest } from 'next/server'
import { carregarCerebro, registrarMemoria } from '@/lib/ia/cerebro'

// Escreve no vault: runtime Node.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Body {
  conta?: string
  texto?: string
  autor?: string
}

/**
 * Ensina algo ao cérebro da conta. O aprendizado vira um item datado em
 * `Contas/<slug>/Memoria/AAAA-MM-DD.md` e passa a valer na próxima resposta.
 */
export async function POST(req: NextRequest) {
  let body: Body
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  const conta = (body.conta ?? '').trim().toLowerCase()
  const texto = (body.texto ?? '').trim()

  if (!conta) return Response.json({ error: 'Conta não informada.' }, { status: 400 })
  if (!texto) return Response.json({ error: 'Nada para memorizar.' }, { status: 400 })

  const cerebro = await carregarCerebro(conta)
  if (!cerebro) {
    return Response.json(
      { error: `A conta "${conta}" não tem cérebro no vault.` },
      { status: 404 },
    )
  }

  const salvo = await registrarMemoria(conta, texto, body.autor?.trim() || 'admin')
  if (!salvo) {
    return Response.json({ error: 'Não consegui gravar a memória.' }, { status: 500 })
  }

  return Response.json({ ok: true, conta, arquivo: salvo.arquivo })
}
