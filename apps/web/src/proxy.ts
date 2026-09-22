import { NextResponse, type NextRequest } from 'next/server';
import { SITES, resolveSite, coerceLocale } from '@fleet/sites';
import { negotiateLocale } from '@fleet/i18n';

const LOCALE_COOKIE = 'fleet_locale';
const SITE_IDS = new Set(SITES.map((s) => s.id));

/** Arquivos e rotas que não passam pelo prefixo de locale. */
const PASSTHROUGH = new Set([
  '/robots.txt',
  '/sitemap.xml',
  '/feed.xml',
  '/ads.txt',
  '/favicon.ico',
  '/manifest.webmanifest',
]);

export default function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (PASSTHROUGH.has(pathname)) return NextResponse.next();

  const site = resolveSite(req.headers.get('host'));
  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];

  // O caminho interno /{siteId}/... é só alvo de rewrite. Se chegou de fora,
  // é um domínio servindo o conteúdo de outro — sai 404 em vez de conteúdo
  // duplicado, que o Google pune.
  if (first && SITE_IDS.has(first)) {
    return new NextResponse(null, { status: 404 });
  }

  const requested = first && /^[a-z]{2}(-[A-Z]{2})?$/.test(first) ? first : null;
  const valid = requested !== null && (site.locales as readonly string[]).includes(requested);

  if (!valid) {
    // Sem locale usável na URL: decide por cookie (escolha explícita anterior)
    // e, na falta dele, pelo Accept-Language — que é o idioma do navegador/SO.
    const cookie = req.cookies.get(LOCALE_COOKIE)?.value;
    const fromCookie =
      cookie && (site.locales as readonly string[]).includes(cookie) ? cookie : null;
    const locale = fromCookie ?? negotiateLocale(site, req.headers.get('accept-language'));

    // Se o primeiro segmento *parecia* locale mas este site não publica nele,
    // ele é descartado em vez de virar slug.
    const rest = requested !== null ? segments.slice(1) : segments;
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}${rest.length ? `/${rest.join('/')}` : ''}`;
    url.search = search;
    return NextResponse.redirect(url, 307);
  }

  const locale = coerceLocale(site, requested);
  const rest = segments.slice(1);

  // Rewrite interno: a chave de cache passa a incluir o site. Sem isso,
  // /en/algo de dois domínios diferentes disputaria a mesma entrada.
  const url = req.nextUrl.clone();
  url.pathname = `/${site.id}/${locale}${rest.length ? `/${rest.join('/')}` : ''}`;

  const res = NextResponse.rewrite(url);
  res.headers.set('x-site-id', site.id);
  res.headers.set('x-locale', locale);
  if (req.cookies.get(LOCALE_COOKIE)?.value !== locale) {
    res.cookies.set(LOCALE_COOKIE, locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
  }
  // Varia por idioma: sem isso um CDN entrega a versão em inglês pra quem
  // pediu português.
  res.headers.set('Vary', 'Accept-Language, Cookie');
  return res;
}

export const config = {
  // /api/ fica de fora: são handlers globais (healthcheck, troca de idioma),
  // não páginas, e prefixá-los com locale quebraria os dois.
  matcher: [
    '/((?!api/|_next/static|_next/image|assets/|.*\\.(?:png|jpg|jpeg|gif|svg|webp|avif|ico|txt|xml|webmanifest)$).*)',
  ],
};
