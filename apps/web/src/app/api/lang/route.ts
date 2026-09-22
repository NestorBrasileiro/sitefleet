import { headers } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { resolveSite, coerceLocale } from '@fleet/sites';
import { getArticle, getTranslatedSlug } from '@fleet/content';

const RESERVED = new Set(['artigos', 'sobre', 'contato', 'privacidade', 'categoria']);

/**
 * Troca de idioma preservando a página.
 *
 * Existe porque o slug é traduzido: trocar "/en/best-kettlebells" por
 * "/pt-BR/best-kettlebells" daria 404. Aqui procuramos o irmão pelo
 * translationKey e só caímos na home quando não há tradução publicada.
 */
export async function GET(req: NextRequest) {
  const site = resolveSite((await headers()).get('host'));
  const to = coerceLocale(site, req.nextUrl.searchParams.get('to') ?? undefined);
  const from = req.nextUrl.searchParams.get('from') ?? '/';

  const segments = from.split('/').filter(Boolean);
  const fromLocale = segments[0] ?? site.defaultLocale;
  const rest = segments.slice(1);
  let target = `/${to}`;

  if (rest.length === 1 && rest[0] && !RESERVED.has(rest[0])) {
    // Artigo: procura a tradução pelo translationKey.
    const slug = decodeURIComponent(rest[0]);
    if (getArticle(site.id, fromLocale, slug)) {
      const translated = getTranslatedSlug(site.id, fromLocale, slug, to);
      if (translated) target = `/${to}/${encodeURIComponent(translated)}`;
    }
  } else if (rest.length > 0 && rest[0] && RESERVED.has(rest[0])) {
    // Páginas fixas têm o mesmo caminho nos dois idiomas.
    target = `/${to}/${rest.join('/')}`;
  }

  // Location relativo de propósito: montar a URL absoluta aqui usaria o origin
  // interno do container e jogaria o usuário em localhost:3000 atrás do Caddy.
  // O RFC 7231 permite Location relativo e o navegador resolve contra o
  // domínio público.
  const res = new NextResponse(null, { status: 302, headers: { Location: target } });
  // Escolha explícita do usuário passa a mandar no middleware.
  res.cookies.set('fleet_locale', to, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
  return res;
}
