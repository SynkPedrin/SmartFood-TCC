/**
 * Resolve a URL da foto de um produto. A API devolve caminhos relativos
 * (/media/produtos/x.webp) servidos pelo backend; aqui viramos URL absoluta.
 * Sem foto, o cardápio cai no placeholder local.
 */
/** Origem do backend (sem o /api/v1): base para fotos e links para a documentação. */
export const API_ORIGEM = (process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000/api/v1')
  .replace(/\/api\/v1\/?$/, '')

export const IMAGEM_FALLBACK = '/images/menu/default-food.svg'

export function imagemUrl(imagem: string | null | undefined): string {
  if (!imagem) return IMAGEM_FALLBACK
  if (imagem.startsWith('http')) return imagem
  return `${API_ORIGEM}${imagem}`
}

/** onError dos <img> do cardápio: se a foto falhar (ex.: media fora do ar), cai no placeholder. */
export function onImagemErro(e: React.SyntheticEvent<HTMLImageElement>) {
  const el = e.currentTarget
  if (!el.src.endsWith(IMAGEM_FALLBACK)) el.src = IMAGEM_FALLBACK
}
