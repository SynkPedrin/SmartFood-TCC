/**
 * O mesmo código publica dois sites, escolhidos por NEXT_PUBLIC_SITE no build:
 *
 * - `mesa`: o que vai no QR code das mesas. A raiz já é o cardápio do cliente;
 *   cozinha, gestão e login não existem nesse endereço.
 * - `equipe`: o endereço do restaurante. A raiz mostra dois acessos (Cozinha,
 *   sem login, e Gestor, com senha); o cardápio do cliente não abre aqui.
 * - sem valor (`completo`): tudo junto, como no desenvolvimento local.
 */
export type ModoSite = 'mesa' | 'equipe' | 'completo'

export const MODO_SITE: ModoSite =
  process.env.NEXT_PUBLIC_SITE === 'mesa' || process.env.NEXT_PUBLIC_SITE === 'equipe'
    ? process.env.NEXT_PUBLIC_SITE
    : 'completo'

/** Endereço público do site das mesas, usado no QR code gerado pela gestão. */
export function urlDasMesas(): string {
  const configurado = process.env.NEXT_PUBLIC_MESA_URL?.replace(/\/$/, '')
  if (configurado) return configurado
  return typeof window === 'undefined' ? '' : window.location.origin
}
