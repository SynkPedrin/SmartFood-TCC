/**
 * Cérebro por conta. Server-only.
 *
 * Lê o vault Obsidian em `cerebro/` e monta a memória de longo prazo da conta
 * que está falando com a IA. Cada conta tem sua própria pasta em
 * `cerebro/Contas/<slug>/`, e uma conta nunca enxerga o cérebro de outra.
 *
 * NUNCA importar em componentes client: usa `fs` e só roda em route handlers.
 */

import { promises as fs } from 'fs'
import path from 'path'

/** Teto de caracteres do cérebro dentro do prompt (protege a janela de contexto). */
const MAX_CHARS = 12_000
/** Quantas notas de memória (as mais recentes) entram no prompt. */
const MAX_MEMORIAS = 5
/** TTL do cache em memória. O chat lê o cérebro a cada mensagem. */
const CACHE_MS = 15_000

/** Ordem de leitura: identidade antes de detalhe, detalhe antes de memória. */
const ORDEM = ['Conta', 'Identidade', 'Diretrizes', 'Cardapio', 'Operacao']

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,63}$/

export interface ContaMeta {
  slug: string
  nome: string
  segmento?: string
  plano?: string
  accent?: string
  iaNome?: string
  iaTom?: string
}

export interface SecaoCerebro {
  titulo: string
  texto: string
}

export interface Cerebro {
  conta: ContaMeta
  secoes: SecaoCerebro[]
  memorias: SecaoCerebro[]
}

/* ────────────────────────────── localização do vault ───────────────────────── */

let rootCache: string | null | undefined

/**
 * Candidatos, em ordem: env explícita, o vault que viaja com o app (`frontend/cerebro`,
 * o caso normal em dev e em serverless) e a raiz do repositório, para scripts que rodam
 * de um nível acima.
 */
function candidatos(): string[] {
  const env = process.env.CEREBRO_DIR
  const cwd = process.cwd()
  return [
    ...(env ? [path.resolve(env)] : []),
    path.join(cwd, 'cerebro'),
    path.join(cwd, 'frontend', 'cerebro'),
    path.join(cwd, '..', 'cerebro'),
  ]
}

async function isDir(p: string): Promise<boolean> {
  try {
    return (await fs.stat(p)).isDirectory()
  } catch {
    return false
  }
}

/** Raiz do vault, ou null se o cérebro não estiver disponível neste deploy. */
export async function vaultRoot(): Promise<string | null> {
  if (rootCache !== undefined) return rootCache
  for (const c of candidatos()) {
    if (await isDir(path.join(c, 'Contas'))) {
      rootCache = c
      return c
    }
  }
  rootCache = null
  return null
}

/* ─────────────────────────────── frontmatter ───────────────────────────────── */

interface Doc { meta: Record<string, string>; corpo: string }

/** Parser mínimo de frontmatter YAML plano (chave: valor). Nada de dependência extra. */
function parseDoc(raw: string): Doc {
  const meta: Record<string, string> = {}
  let corpo = raw

  if (raw.startsWith('---')) {
    const fim = raw.indexOf('\n---', 3)
    if (fim !== -1) {
      const bloco = raw.slice(3, fim)
      corpo = raw.slice(fim + 4).replace(/^\r?\n/, '')
      for (const linha of bloco.split('\n')) {
        const m = linha.match(/^([a-zA-Z_][\w-]*)\s*:\s*(.*)$/)
        if (!m) continue
        meta[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
      }
    }
  }

  return { meta, corpo: corpo.trim() }
}

/* ──────────────────────────────── leitura ──────────────────────────────────── */

function contaDir(root: string, slug: string): string {
  return path.join(root, 'Contas', slug)
}

async function lerDoc(file: string): Promise<Doc | null> {
  try {
    return parseDoc(await fs.readFile(file, 'utf8'))
  } catch {
    return null
  }
}

function metaToConta(slug: string, meta: Record<string, string>): ContaMeta {
  return {
    slug,
    nome: meta.nome || slug,
    segmento: meta.segmento,
    plano: meta.plano,
    accent: meta.accent,
    iaNome: meta.ia_nome,
    iaTom: meta.ia_tom,
  }
}

/** Lista as contas que têm cérebro no vault. */
export async function listarContas(): Promise<ContaMeta[]> {
  const root = await vaultRoot()
  if (!root) return []

  let entradas: string[]
  try {
    entradas = await fs.readdir(path.join(root, 'Contas'))
  } catch {
    return []
  }

  const contas: ContaMeta[] = []
  for (const slug of entradas.sort()) {
    if (!SLUG_RE.test(slug)) continue
    const doc = await lerDoc(path.join(contaDir(root, slug), 'Conta.md'))
    if (!doc) continue
    contas.push(metaToConta(slug, doc.meta))
  }
  return contas
}

const cache = new Map<string, { em: number; valor: Cerebro | null }>()

/**
 * Carrega o cérebro de uma conta. Devolve null quando o vault não existe, o slug
 * é inválido ou a conta não tem cérebro: a IA degrada para persona + dados ao vivo.
 */
export async function carregarCerebro(slug: string): Promise<Cerebro | null> {
  if (!SLUG_RE.test(slug)) return null

  const agora = Date.now()
  const hit = cache.get(slug)
  if (hit && agora - hit.em < CACHE_MS) return hit.valor

  const valor = await lerCerebro(slug)
  cache.set(slug, { em: agora, valor })
  return valor
}

async function lerCerebro(slug: string): Promise<Cerebro | null> {
  const root = await vaultRoot()
  if (!root) return null

  const dir = contaDir(root, slug)
  const conta = await lerDoc(path.join(dir, 'Conta.md'))
  if (!conta) return null

  const secoes: SecaoCerebro[] = []
  for (const nome of ORDEM) {
    const doc = nome === 'Conta' ? conta : await lerDoc(path.join(dir, `${nome}.md`))
    if (doc?.corpo) secoes.push({ titulo: nome, texto: doc.corpo })
  }

  // Memórias: arquivos datados, os mais recentes primeiro (nome AAAA-MM-DD ordena sozinho).
  const memorias: SecaoCerebro[] = []
  let arquivos: string[] = []
  try {
    arquivos = (await fs.readdir(path.join(dir, 'Memoria')))
      .filter(f => f.endsWith('.md'))
      .sort()
      .reverse()
      .slice(0, MAX_MEMORIAS)
  } catch {
    /* conta sem memória ainda */
  }
  for (const f of arquivos) {
    const doc = await lerDoc(path.join(dir, 'Memoria', f))
    if (doc?.corpo) memorias.push({ titulo: f.replace(/\.md$/, ''), texto: doc.corpo })
  }

  return { conta: metaToConta(slug, conta.meta), secoes, memorias }
}

/* ──────────────────────────── serialização pro prompt ──────────────────────── */

/** Converte o cérebro em texto para o system prompt, respeitando o teto de caracteres. */
export function cerebroToContext(c: Cerebro): string {
  const { conta } = c
  const cab = [
    `CÉREBRO DA CONTA "${conta.nome}" (slug: ${conta.slug}).`,
    'Este bloco é a memória de longo prazo desta conta específica.',
    'Ele define quem você é, como fala e o que pode ou não fazer AQUI.',
    'Vale sobre preferências genéricas, mas os DADOS AO VIVO do banco têm precedência',
    'sobre qualquer preço, disponibilidade ou status escrito aqui.',
    conta.iaNome ? `Seu nome nesta conta é ${conta.iaNome}.` : '',
    conta.iaTom ? `Tom de voz: ${conta.iaTom}.` : '',
    conta.segmento ? `Segmento: ${conta.segmento}.` : '',
  ].filter(Boolean).join(' ')

  const partes = [cab]
  let orcamento = MAX_CHARS - cab.length

  const empilha = (rotulo: string, s: SecaoCerebro) => {
    const bloco = `\n\n### ${rotulo}: ${s.titulo}\n${s.texto}`
    if (bloco.length > orcamento) {
      if (orcamento > 400) {
        partes.push(bloco.slice(0, orcamento - 20) + '\n[...]')
        orcamento = 0
      }
      return
    }
    partes.push(bloco)
    orcamento -= bloco.length
  }

  for (const s of c.secoes) empilha('CÉREBRO', s)
  for (const m of c.memorias) empilha('MEMÓRIA', m)

  return partes.join('')
}

/* ─────────────────────────── escrita: aprender algo ────────────────────────── */

function hojeISO(): string {
  // Data local do servidor, no formato do nome de arquivo do vault.
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/**
 * Acrescenta um aprendizado em `Contas/<slug>/Memoria/AAAA-MM-DD.md`.
 * Append-only: memória antiga nunca é reescrita.
 */
export async function registrarMemoria(
  slug: string,
  texto: string,
  autor = 'admin',
): Promise<{ arquivo: string } | null> {
  if (!SLUG_RE.test(slug)) return null

  const root = await vaultRoot()
  if (!root) return null

  const dir = contaDir(root, slug)
  if (!(await isDir(dir))) return null

  const limpo = texto.trim().replace(/\s*\n\s*/g, ' ').slice(0, 600)
  if (!limpo) return null

  const data = hojeISO()
  const arquivo = path.join(dir, 'Memoria', `${data}.md`)
  await fs.mkdir(path.dirname(arquivo), { recursive: true })

  const existe = await fs
    .access(arquivo)
    .then(() => true)
    .catch(() => false)

  const d = new Date()
  const hora = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  const item = `- **[${data.slice(8)}/${data.slice(5, 7)} ${hora} · ${autor}]** ${limpo}\n`

  if (!existe) {
    const cabecalho =
      `---\ntipo: memoria\nconta: ${slug}\ndata: ${data}\n---\n\n# Memória · ${data}\n\n`
    await fs.writeFile(arquivo, cabecalho + item, 'utf8')
  } else {
    await fs.appendFile(arquivo, item, 'utf8')
  }

  cache.delete(slug)
  return { arquivo: path.relative(root, arquivo) }
}
