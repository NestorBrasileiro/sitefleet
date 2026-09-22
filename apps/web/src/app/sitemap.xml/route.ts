import { headers } from 'next/headers';
import { resolveSite, canonicalUrl, type Locale } from '@fleet/sites';
import { getArticles, getCategories, getTranslatedSlug } from '@fleet/content';

const STATIC_PATHS = ['', 'artigos', 'sobre', 'contato', 'privacidade'];

function xmlEscape(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Sitemap por domínio, com <xhtml:link rel="alternate"> entre os idiomas.
 * O Google só trata duas URLs como traduções uma da outra se ambas se
 * apontarem — daí o alternate ir em todas as entradas, inclusive na própria.
 */
export async function GET() {
  const site = resolveSite((await headers()).get('host'));

  type Entry = { loc: string; lastmod?: string; alternates: { locale: Locale; href: string }[] };
  const entries: Entry[] = [];

  for (const locale of site.locales) {
    for (const path of STATIC_PATHS) {
      entries.push({
        loc: canonicalUrl(site, locale, path),
        alternates: site.locales.map((l) => ({ locale: l, href: canonicalUrl(site, l, path) })),
      });
    }

    for (const c of getCategories(site.id, locale)) {
      entries.push({
        loc: canonicalUrl(site, locale, `categoria/${encodeURIComponent(c.name)}`),
        alternates: [],
      });
    }

    for (const a of getArticles(site.id, locale)) {
      const alternates = site.locales
        .map((l) => {
          const slug = l === locale ? a.slug : getTranslatedSlug(site.id, locale, a.slug, l);
          return slug ? { locale: l, href: canonicalUrl(site, l, slug) } : null;
        })
        .filter((x): x is { locale: Locale; href: string } => x !== null);
      entries.push({ loc: canonicalUrl(site, locale, a.slug), lastmod: a.updated ?? a.date, alternates });
    }
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries
  .map(
    (e) => `  <url>
    <loc>${xmlEscape(e.loc)}</loc>${e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : ''}
${e.alternates
  .map((alt) => `    <xhtml:link rel="alternate" hreflang="${alt.locale}" href="${xmlEscape(alt.href)}"/>`)
  .join('\n')}
  </url>`,
  )
  .join('\n')}
</urlset>`;

  return new Response(body, {
    headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' },
  });
}
