import { NextResponse, type NextRequest } from 'next/server'

/**
 * Separa os dois sites publicados a partir do mesmo código (ver lib/site.ts).
 * No modo `completo` (desenvolvimento) não interfere em nada.
 */
const MODO = process.env.NEXT_PUBLIC_SITE

/** Rotas da equipe: não existem no site das mesas. */
const DA_EQUIPE = /^\/(admin|cozinha|entrar|equipe|produtos|categorias|mesas)(\/|$)/

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (MODO === 'mesa') {
    // A raiz já é o cardápio; o QR antigo (/totem?mesa=N) continua valendo.
    if (pathname === '/') {
      const url = req.nextUrl.clone()
      url.pathname = '/totem'
      return NextResponse.rewrite(url)
    }
    if (DA_EQUIPE.test(pathname)) return NextResponse.redirect(new URL('/', req.url))
  }

  if (MODO === 'equipe') {
    if (pathname === '/') {
      const url = req.nextUrl.clone()
      url.pathname = '/equipe'
      return NextResponse.rewrite(url)
    }
    if (pathname.startsWith('/totem')) return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
}

export const config = {
  // Páginas apenas: API interna, assets e arquivos com extensão passam direto.
  matcher: ['/((?!api|_next|images|favicon|.*\\..*).*)'],
}
