import { headers } from 'next/headers';
import { resolveSite, canonicalUrl } from '@fleet/sites';
import { getArticles } from '@fleet/content';

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** RSS no locale padrão do site. Agregadores ainda mandam tráfego de cauda longa. */
export async function GET() {
  const site = resolveSite((await headers()).get('host'));
  const locale = site.defaultLocale;
  const articles = getArticles(site.id, locale).slice(0, 30);
  const home = canonicalUrl(site, locale);

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${esc(site.name[locale] ?? site.id)}</title>
  <link>${home}</link>
  <description>${esc(site.tagline[locale] ?? '')}</description>
  <language>${locale}</language>
  <atom:link href="https://${site.domain}/feed.xml" rel="self" type="application/rss+xml"/>
${articles
  .map((a) => {
    const url = canonicalUrl(site, locale, a.slug);
    return `  <item>
    <title>${esc(a.title)}</title>
    <link>${url}</link>
    <guid isPermaLink="true">${url}</guid>
    <pubDate>${new Date(`${a.date}T00:00:00Z`).toUTCString()}</pubDate>
    <description>${esc(a.description)}</description>
  </item>`;
  })
  .join('\n')}
</channel>
</rss>`;

  return new Response(body, {
    headers: { 'content-type': 'application/rss+xml; charset=utf-8', 'cache-control': 'public, max-age=3600' },
  });
}
