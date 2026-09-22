import { notFound } from 'next/navigation';
import { getSiteById, type Locale, type Site } from '@fleet/sites';
import { getT, type T } from '@fleet/i18n';

export type RouteParams = { site: string; locale: string };

/**
 * Traduz os params do rewrite em site + locale confiáveis.
 * Qualquer combinação que não exista vira 404 — em vez de renderizar um site
 * com o conteúdo de outro.
 */
export async function resolveRoute(
  params: Promise<RouteParams>,
): Promise<{ site: Site; locale: Locale; t: T }> {
  const { site: siteId, locale } = await params;
  const site = getSiteById(siteId);
  if (!site || !site.enabled) notFound();
  if (!(site.locales as readonly string[]).includes(locale)) notFound();
  const typed = locale as Locale;
  return { site, locale: typed, t: getT(typed) };
}
