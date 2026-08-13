import { listarContas, vaultRoot } from '@/lib/ia/cerebro'

// Precisa de fs: runtime Node, nunca Edge.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Lista as contas que possuem cérebro no vault, para o seletor da interface. */
export async function GET() {
  const root = await vaultRoot()
  if (!root) {
    return Response.json(
      { disponivel: false, contas: [], erro: 'Vault do cérebro não encontrado.' },
      { status: 200 },
    )
  }

  const contas = await listarContas()
  return Response.json({ disponivel: true, contas })
}
