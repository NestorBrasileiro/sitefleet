import type { Metadata } from 'next';
import { getArticles, getCategories } from '@fleet/content';
import { ArticleCard } from '@fleet/ui';
import { AdSlot } from '@fleet/ads';
import Link from 'next/link';
import { resolveRoute, type RouteParams } from '@/lib/params';
import { buildMetadata } from '@/lib/metadata';

export async function generateMetadata({ params }: { params: Promise<RouteParams> }): Promise<Metadata> {
  const { site, locale } = await resolveRoute(params);
  const translations = Object.fromEntries(site.locales.map((l) => [l, '']));
  return buildMetadata({
    site,
    locale,
    title: `${site.name[locale]} — ${site.tagline[locale]}`,
    description: site.tagline[locale] ?? '',
    translations,
  });
}

export default async function HomePage({ params }: { params: Promise<RouteParams> }) {
  const { site, locale, t } = await resolveRoute(params);
  const articles = getArticles(site.id, locale);
  const categories = getCategories(site.id, locale);

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
      <div>
        <section className="border-b border-[var(--line)] pb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{site.name[locale]}</h1>
          <p className="mt-3 text-lg text-[var(--fg-muted)]">{site.tagline[locale]}</p>
        </section>

        {/* Anúncio abaixo do título: acima da dobra sem empurrar o conteúdo,
            que é o que o Google exige em "melhores práticas de posicionamento". */}
        <AdSlot
          client={site.ads.adsenseClient}
          slot={site.ads.slots.header}
          format="horizontal"
          minHeight={90}
          label={t('ads.placeholder')}
          className="my-8"
        />

        <h2 className="text-xl font-semibold">{t('home.latest')}</h2>
        <div>
          {articles.map((a) => (
            <ArticleCard key={a.slug} article={a} locale={locale} t={t} />
          ))}
          {articles.length === 0 && (
            <p className="py-8 text-[var(--fg-muted)]">{t('category.empty')}</p>
          )}
        </div>
      </div>

      <aside className="space-y-8">
        {categories.length > 0 && (
          <nav>
            <h2 className="text-sm font-semibold uppercase tracking-wide">{t('nav.articles')}</h2>
            <ul className="mt-3 space-y-1 text-sm">
              {categories.map((c) => (
                <li key={c.name}>
                  <Link
                    href={`/${locale}/categoria/${encodeURIComponent(c.name)}`}
                    className="text-[var(--fg-muted)] hover:text-[var(--accent)]"
                  >
                    {c.name} ({c.count})
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
        <AdSlot
          client={site.ads.adsenseClient}
          slot={site.ads.slots.sidebar}
          format="rectangle"
          minHeight={600}
          label={t('ads.placeholder')}
          className="sticky top-6"
        />
      </aside>
    </div>
  );
}
