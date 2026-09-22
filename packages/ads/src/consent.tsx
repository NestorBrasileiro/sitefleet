'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const COOKIE = 'fleet_consent';
const MAX_AGE = 60 * 60 * 24 * 180; // 180 dias

export type ConsentState = 'unknown' | 'granted' | 'denied';

type Ctx = { consent: ConsentState; setConsent: (v: Exclude<ConsentState, 'unknown'>) => void };
const ConsentContext = createContext<Ctx>({ consent: 'unknown', setConsent: () => {} });

function readCookie(): ConsentState {
  if (typeof document === 'undefined') return 'unknown';
  const hit = document.cookie.split('; ').find((c) => c.startsWith(`${COOKIE}=`));
  const value = hit?.split('=')[1];
  return value === 'granted' || value === 'denied' ? value : 'unknown';
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    adsbygoogle?: unknown[];
  }
}

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setState] = useState<ConsentState>('unknown');

  // O cookie só existe no cliente; ler no efeito evita mismatch de hidratação.
  useEffect(() => setState(readCookie()), []);

  const setConsent = useCallback((value: Exclude<ConsentState, 'unknown'>) => {
    document.cookie = `${COOKIE}=${value}; path=/; max-age=${MAX_AGE}; SameSite=Lax`;
    setState(value);
    // Consent Mode v2: atualiza o estado sem recarregar a página.
    window.gtag?.('consent', 'update', {
      ad_storage: value,
      ad_user_data: value,
      ad_personalization: value,
      analytics_storage: value,
    });
  }, []);

  return <ConsentContext.Provider value={{ consent, setConsent }}>{children}</ConsentContext.Provider>;
}

export const useConsent = () => useContext(ConsentContext);

/**
 * Banner. Só aparece enquanto a escolha é desconhecida.
 *
 * Recusar não desliga os anúncios: com Consent Mode v2 o AdSense passa a servir
 * anúncios não personalizados, que rendem menos mas rendem. Desligar de vez
 * seria jogar fora receita que a lei não exige jogar.
 */
export function ConsentBanner({
  text,
  accept,
  reject,
  learnMore,
  privacyHref,
}: {
  text: string;
  accept: string;
  reject: string;
  learnMore: string;
  privacyHref: string;
}) {
  const { consent, setConsent } = useConsent();
  if (consent !== 'unknown') return null;

  return (
    <div
      role="dialog"
      aria-label={text}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--line)] bg-[var(--bg)]/95 p-4 backdrop-blur"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--fg-muted)]">
          {text}{' '}
          <a href={privacyHref} className="underline underline-offset-2">
            {learnMore}
          </a>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setConsent('denied')}
            className="rounded-md border border-[var(--line)] px-4 py-2 text-sm font-medium"
          >
            {reject}
          </button>
          <button
            type="button"
            onClick={() => setConsent('granted')}
            className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-fg)]"
          >
            {accept}
          </button>
        </div>
      </div>
    </div>
  );
}
