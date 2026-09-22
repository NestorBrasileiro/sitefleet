import { SITES, ENABLED_SITES } from './registry';
import type { Site, Locale } from './schema';

const byId = new Map(SITES.map((s) => [s.id, s]));

/** Host -> site. Construído uma vez; erro alto e cedo se houver colisão. */
const byHost = new Map<string, Site>();
for (const site of SITES) {
  for (const host of [site.domain, ...site.aliases]) {
    const key = host.toLowerCase();
    const clash = byHost.get(key);
    if (clash && clash.id !== site.id) {
      throw new Error(`Host "${key}" registrado em dois sites: ${clash.id} e ${site.id}`);
    }
    byHost.set(key, site);
  }
  // Dev: <id>.localhost resolve sem mexer em /etc/hosts.
  byHost.set(`${site.id}.localhost`, site);
}

const stripPort = (host: string) => host.toLowerCase().trim().split(':')[0] ?? '';

/** Site padrão quando o host não bate com nada (dev em localhost puro, healthcheck). */
export const FALLBACK_SITE: Site = ENABLED_SITES[0] ?? SITES[0]!;

export function resolveSite(host: string | null | undefined): Site {
  if (!host) return FALLBACK_SITE;
  const bare = stripPort(host);
  return byHost.get(bare) ?? byHost.get(host.toLowerCase()) ?? FALLBACK_SITE;
}

export function getSiteById(id: string): Site | undefined {
  return byId.get(id);
}

/** Site + locale válido para ele. Locale desconhecido cai no defaultLocale. */
export function coerceLocale(site: Site, locale: string | undefined): Locale {
  if (locale && (site.locales as readonly string[]).includes(locale)) return locale as Locale;
  return site.defaultLocale;
}

export function canonicalUrl(site: Site, locale: Locale, path = ''): string {
  const proto = site.domain.endsWith('.localhost') ? 'http' : 'https';
  const clean = path.replace(/^\/+/, '');
  return `${proto}://${site.domain}/${locale}${clean ? `/${clean}` : ''}`;
}
