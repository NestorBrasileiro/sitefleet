import type { Metadata } from 'next';
import { canonicalUrl, type Locale, type Site } from '@fleet/sites';

/**
 * Metadata de uma página. O que importa aqui para receita:
 * canonical certo (evita canibalizar a própria página) e hreflang completo
 * (manda o usuário de cada idioma para a versão que ele lê).
 */
export function buildMetadata({
  site,
  locale,
  title,
  description,
  path = '',
  translations = {},
  image,
  noindex = false,
  publishedTime,
  modifiedTime,
}: {
  site: Site;
  locale: Locale;
  title: string;
  description: string;
  path?: string;
  /** locale -> path naquele locale. Só entram os que realmente existem. */
  translations?: Partial<Record<Locale, string>>;
  image?: string;
  noindex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
}): Metadata {
  const url = canonicalUrl(site, locale, path);
  const languages: Record<string, string> = {};
  for (const [loc, p] of Object.entries(translations)) {
    languages[loc] = canonicalUrl(site, loc as Locale, p);
  }
  languages['x-default'] = canonicalUrl(site, site.defaultLocale, translations[site.defaultLocale] ?? path);

  return {
    title,
    description,
    metadataBase: new URL(`https://${site.domain}`),
    alternates: { canonical: url, languages },
    robots: noindex ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      type: publishedTime ? 'article' : 'website',
      title,
      description,
      url,
      siteName: site.name[locale],
      locale: locale.replace('-', '_'),
      ...(image ? { images: [{ url: image }] } : {}),
      ...(publishedTime ? { publishedTime, modifiedTime: modifiedTime ?? publishedTime } : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}
