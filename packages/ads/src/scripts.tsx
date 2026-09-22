import Script from 'next/script';

/**
 * Consent Mode v2, estado padrão.
 *
 * Tem que rodar ANTES de qualquer script do Google, por isso é um <script>
 * inline cru e não next/script — beforeInteractive não garante ordem contra o
 * loader do AdSense. Nega por padrão só nas regiões que exigem (EEA/UK/CH);
 * no resto (Brasil, EUA) já entra concedido, senão você perde receita em todo
 * lugar para cumprir uma regra europeia.
 */
export function ConsentModeDefaults() {
  const js = `
window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
window.gtag=gtag;
gtag('consent','default',{
  ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',
  region:['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IS','IE','IT','LV','LI','LT','LU','MT','NL','NO','PL','PT','RO','SK','SI','ES','SE','GB','CH'],
  wait_for_update:500
});
gtag('consent','default',{
  ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted',analytics_storage:'granted'
});
`.trim();
  return <script id="consent-defaults" dangerouslySetInnerHTML={{ __html: js }} />;
}

/** Loader do AdSense. Não renderiza nada se o site ainda não tem client id. */
export function AdSenseScript({ client }: { client: string }) {
  if (!client) return null;
  return (
    <Script
      id="adsbygoogle"
      strategy="afterInteractive"
      async
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
    />
  );
}

/** Analytics self-hosted (Plausible/Umami). Sem cookie, sem banner. */
export function AnalyticsScript({ src, domain }: { src: string; domain: string }) {
  if (!src) return null;
  return <Script id="analytics" strategy="afterInteractive" defer src={src} data-domain={domain} />;
}
