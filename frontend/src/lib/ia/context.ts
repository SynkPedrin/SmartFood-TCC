/**
 * Server-only helpers para a IA (Groq).
 * Busca dados reais do backend Django e monta um "contexto" textual
 * que é injetado no system prompt. Se o backend estiver fora, degrada
 * de forma limpa (a IA continua respondendo, avisando que não há dados).
 *
 * NUNCA importar este arquivo em componentes client. Ele só roda no
 * servidor (route handlers). Usa INTERNAL_API_URL, sem NEXT_PUBLIC.
 */

const API = process.env.INTERNAL_API_URL ?? 'http://127.0.0.1:8000/api/v1'

interface Paginated<T> { results?: T[] }

interface Categoria { id: number; nome: string; descricao?: string; ativo?: boolean }
interface Produto {
  id: number
  nome: string
  descricao?: string
  preco: string
  disponivel: boolean
  tempo_preparo: number
  categoria_detalhe?: { nome?: string }
}
interface Mesa { id: number; numero: number; status: string; status_display?: string; capacidade?: number }

async function getJSON<T>(path: string, timeoutMs = 2500): Promise<T | null> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(`${API}${path}`, {
      signal: ctrl.signal,
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}

export interface RestaurantSnapshot {
  online: boolean
  categorias: Categoria[]
  produtos: Produto[]
  mesas: Mesa[]
}

/** Coleta um retrato atual do restaurante a partir do backend. */
export async function loadSnapshot(): Promise<RestaurantSnapshot> {
  const [cat, prod, mesa] = await Promise.all([
    getJSON<Paginated<Categoria>>('/categorias/'),
    getJSON<Paginated<Produto>>('/produtos/'),
    getJSON<Paginated<Mesa>>('/mesas/'),
  ])

  const online = cat !== null || prod !== null || mesa !== null

  return {
    online,
    categorias: cat?.results ?? [],
    produtos: prod?.results ?? [],
    mesas: mesa?.results ?? [],
  }
}

function brl(v: string | number) {
  return `R$ ${Number(v).toFixed(2)}`
}

/** Serializa o snapshot em texto compacto para caber no prompt. */
export function snapshotToContext(s: RestaurantSnapshot): string {
  if (!s.online) {
    return [
      'STATUS DO SISTEMA: o backend de dados está OFFLINE no momento.',
      'Você NÃO tem acesso a produtos, categorias ou mesas reais agora.',
      'Se o usuário pedir números específicos (vendas, estoque, mesas), explique com',
      'transparência que os dados ao vivo estão indisponíveis e ofereça ajuda geral',
      '(ideias de cardápio, textos, estratégias). NUNCA invente métricas ou valores.',
    ].join(' ')
  }

  const lines: string[] = []
  lines.push('DADOS REAIS DO RESTAURANTE (fonte: banco de dados, ao vivo):')

  // Categorias
  if (s.categorias.length) {
    lines.push(`\nCATEGORIAS (${s.categorias.length}):`)
    for (const c of s.categorias) lines.push(`- ${c.nome}${c.descricao ? ` - ${c.descricao}` : ''}`)
  } else {
    lines.push('\nCATEGORIAS: nenhuma cadastrada.')
  }

  // Produtos
  if (s.produtos.length) {
    lines.push(`\nPRODUTOS (${s.produtos.length}):`)
    for (const p of s.produtos) {
      const cat = p.categoria_detalhe?.nome ? ` [${p.categoria_detalhe.nome}]` : ''
      const disp = p.disponivel ? '' : ' (INDISPONÍVEL)'
      const tempo = p.tempo_preparo ? ` · ${p.tempo_preparo}min` : ''
      const desc = p.descricao ? ` - ${p.descricao}` : ''
      lines.push(`- ${p.nome}${cat}: ${brl(p.preco)}${tempo}${disp}${desc}`)
    }
  } else {
    lines.push('\nPRODUTOS: nenhum cadastrado.')
  }

  // Mesas (resumo por status)
  if (s.mesas.length) {
    const byStatus = s.mesas.reduce<Record<string, number>>((acc, m) => {
      acc[m.status] = (acc[m.status] ?? 0) + 1
      return acc
    }, {})
    const resumo = Object.entries(byStatus).map(([k, v]) => `${v} ${k}`).join(', ')
    lines.push(`\nMESAS (${s.mesas.length}): ${resumo}.`)
  } else {
    lines.push('\nMESAS: nenhuma cadastrada.')
  }

  return lines.join('\n')
}
