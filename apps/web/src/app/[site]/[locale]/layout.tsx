import '../../globals.css';
import { ENABLED_SITES } from '@fleet/sites';
import { HTML_LANG } from '@fleet/i18n';
import { ThemeVars, Header, Footer, WebsiteLd } from '@fleet/ui';
import { ConsentProvider, ConsentBanner, ConsentModeDefaults, AdSenseScript, AnalyticsScript } from '@fleet/ads';
import { resolveRoute, type RouteParams } from '@/lib/params';

/**
 * Este é o root layout: o app não tem app/layout.tsx porque todo request passa
 * pelo rewrite /{site}/{locale}/..., e só aqui existem site e locale como
 * params — o que mantém as páginas estáticas (nenhum headers() no caminho).
 */
export async function generateStaticParams() {
  return ENABLED_SITES.flatMap((s) => s.locales.map((locale) => ({ site: s.id, locale })));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<RouteParams>;
}) {
  const { site, locale, t } = await resolveRoute(params);

  return (
    <html lang={HTML_LANG[locale]} suppressHydrationWarning>
      <head>
        <ConsentModeDefaults />
        <ThemeVars site={site} />
        {/* Handshake com o AdSense antes do script principal: economiza ~100ms
            no primeiro anúncio, que é onde mora a maior parte da viewability. */}
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" crossOrigin="" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <ConsentProvider>
          <Header site={site} locale={locale} t={t} />
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
          <Footer site={site} locale={locale} t={t} />
          <ConsentBanner
            text={t('consent.text')}
            accept={t('consent.accept')}
            reject={t('consent.reject')}
            learnMore={t('consent.learn')}
            privacyHref={`/${locale}/privacidade`}
          />
        </ConsentProvider>
        <WebsiteLd site={site} locale={locale} />
        <AdSenseScript client={site.ads.adsenseClient} />
        <AnalyticsScript src={site.analyticsScript} domain={site.domain} />
      </body>
    </html>
  );
}
