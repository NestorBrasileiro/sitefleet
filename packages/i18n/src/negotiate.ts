import type { Locale, Site } from '@fleet/sites';

type Ranked = { tag: string; q: number };

/**
 * Parseia Accept-Language ("pt-BR,pt;q=0.9,en;q=0.8") em tags ordenadas por
 * qualidade. É esse header que carrega o idioma do navegador/SO do usuário.
 */
export function parseAcceptLanguage(header: string | null | undefined): Ranked[] {
  if (!header) return [];
  return header
    .split(',')
    .map((part): Ranked | null => {
      const [tagRaw, ...params] = part.trim().split(';');
      const tag = tagRaw?.trim().toLowerCase();
      if (!tag) return null;
      const qParam = params.find((p) => p.trim().startsWith('q='));
      const q = qParam ? Number.parseFloat(qParam.trim().slice(2)) : 1;
      return { tag, q: Number.isFinite(q) ? q : 0 };
    })
    .filter((r): r is Ranked => r !== null && r.q > 0)
    .sort((a, b) => b.q - a.q);
}

/**
 * Escolhe o melhor locale que ESTE site publica.
 * Match exato ("pt-br" -> "pt-BR") ganha de match por idioma base ("pt" -> "pt-BR").
 * "*" e nenhum match caem no defaultLocale do site.
 */
export function negotiateLocale(site: Site, acceptLanguage: string | null | undefined): Locale {
  const ranked = parseAcceptLanguage(acceptLanguage);
  if (ranked.length === 0) return site.defaultLocale;

  const available = site.locales.map((l) => ({ locale: l, lower: l.toLowerCase() }));

  for (const { tag } of ranked) {
    if (tag === '*') return site.defaultLocale;
    const exact = available.find((a) => a.lower === tag);
    if (exact) return exact.locale;
  }
  for (const { tag } of ranked) {
    const base = tag.split('-')[0];
    if (!base) continue;
    const loose = available.find((a) => a.lower.split('-')[0] === base);
    if (loose) return loose.locale;
  }
  return site.defaultLocale;
}
