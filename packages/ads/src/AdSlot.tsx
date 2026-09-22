'use client';

import { useEffect, useRef } from 'react';

export type AdFormat = 'auto' | 'fluid' | 'rectangle' | 'horizontal';

/**
 * Uma unidade do AdSense.
 *
 * `minHeight` não é decoração: o slot reserva a altura antes do anúncio chegar.
 * Sem isso o conteúdo pula quando o iframe carrega, o CLS despenca, e CLS ruim
 * derruba tanto o ranking quanto o preço que os anunciantes pagam.
 */
export function AdSlot({
  client,
  slot,
  format = 'auto',
  layout,
  minHeight = 280,
  label,
  className = '',
}: {
  client: string;
  slot: string;
  format?: AdFormat;
  layout?: string;
  minHeight?: number;
  label: string;
  className?: string;
}) {
  const ref = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (!client || !slot || pushed.current) return;
    // O StrictMode do React roda o efeito duas vezes em dev; um push duplicado
    // no mesmo <ins> faz o AdSense lançar "already have ads in them".
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle ?? []).push({});
    } catch {
      // Adblock ou script bloqueado: o placeholder abaixo continua de pé.
    }
  }, [client, slot]);

  // Sem configuração ainda: mostra o buraco onde o anúncio vai, para dar pra
  // avaliar o layout antes de ter conta aprovada.
  if (!client || !slot) {
    return (
      <div
        className={`flex items-center justify-center rounded-md border border-dashed border-[var(--line)] text-xs text-[var(--fg-muted)] ${className}`}
        style={{ minHeight }}
        aria-hidden="true"
      >
        {label}
      </div>
    );
  }

  return (
    <div className={className} style={{ minHeight }}>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: 'block', minHeight }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        {...(layout ? { 'data-ad-layout': layout } : {})}
        data-full-width-responsive="true"
      />
    </div>
  );
}
