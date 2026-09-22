'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Locale } from '@fleet/sites';

/**
 * Troca de idioma.
 *
 * Aponta para /api/lang porque o slug muda entre idiomas ("air-fryer-guide" vs
 * "guia-air-fryer"): trocar só o prefixo da URL daria 404. O handler resolve a
 * tradução do artigo atual e redireciona.
 */
export function LocaleSwitcher({
  locales,
  current,
}: {
  locales: readonly Locale[];
  current: Locale;
}) {
  const pathname = usePathname();
  if (locales.length < 2) return null;

  return (
    <span className="flex items-center gap-2 border-l border-[var(--line)] pl-4">
      {locales.map((l) => (
        <Link
          key={l}
          href={`/api/lang?to=${encodeURIComponent(l)}&from=${encodeURIComponent(pathname)}`}
          hrefLang={l}
          prefetch={false}
          aria-current={l === current ? 'true' : undefined}
          className={
            l === current
              ? 'font-semibold text-[var(--accent)]'
              : 'text-[var(--fg-muted)] hover:text-[var(--accent)]'
          }
        >
          {l === 'pt-BR' ? 'PT' : l.toUpperCase()}
        </Link>
      ))}
    </span>
  );
}
