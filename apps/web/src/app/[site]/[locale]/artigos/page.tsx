import type { Metadata } from 'next';
import { getArticles } from '@fleet/content';
import { ArticleCard } from '@fleet/ui';
import { resolveRoute, type RouteParams } from '@/lib/params';
import { buildMetadata } from '@/lib/metadata';

export async function generateMetadata({ params }: { params: Promise<RouteParams> }): Promise<Metadata> {
  const { site, locale, t } = await resolveRoute(params);
  return buildMetadata({
    site,
    locale,
    title: `${t('nav.articles')} — ${site.name[locale]}`,
    description: site.tagline[locale] ?? '',
    path: 'artigos',
    translations: Object.fromEntries(site.locales.map((l) => [l, 'artigos'])),
  });
}

export default async function ArticlesPage({ params }: { params: Promise<RouteParams> }) {
  const { site, locale, t } = await resolveRoute(params);
  const articles = getArticles(site.id, locale);
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold">{t('nav.articles')}</h1>
      <div className="mt-6">
        {articles.map((a) => (
          <ArticleCard key={a.slug} article={a} locale={locale} t={t} />
        ))}
        {articles.length === 0 && <p className="py-8 text-[var(--fg-muted)]">{t('category.empty')}</p>}
      </div>
    </div>
  );
}
