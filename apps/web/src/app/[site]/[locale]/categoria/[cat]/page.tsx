import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getArticlesByCategory, getCategories } from '@fleet/content';
import { ArticleCard } from '@fleet/ui';
import { ENABLED_SITES } from '@fleet/sites';
import { resolveRoute, type RouteParams } from '@/lib/params';
import { buildMetadata } from '@/lib/metadata';

type Params = RouteParams & { cat: string };

export async function generateStaticParams() {
  return ENABLED_SITES.flatMap((s) =>
    s.locales.flatMap((locale) =>
      getCategories(s.id, locale).map((c) => ({ site: s.id, locale, cat: c.name })),
    ),
  );
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { site, locale, t } = await resolveRoute(params as Promise<RouteParams>);
  const { cat } = await params;
  const name = decodeURIComponent(cat);
  return buildMetadata({
    site,
    locale,
    title: `${t('category.title', { name })} — ${site.name[locale]}`,
    description: `${t('category.title', { name })}. ${site.tagline[locale] ?? ''}`.trim(),
    path: `categoria/${encodeURIComponent(name)}`,
  });
}

export default async function CategoryPage({ params }: { params: Promise<Params> }) {
  const { site, locale, t } = await resolveRoute(params as Promise<RouteParams>);
  const { cat } = await params;
  const name = decodeURIComponent(cat);
  const articles = getArticlesByCategory(site.id, locale, name);
  if (articles.length === 0) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold">{t('category.title', { name })}</h1>
      <div className="mt-6">
        {articles.map((a) => (
          <ArticleCard key={a.slug} article={a} locale={locale} t={t} />
        ))}
      </div>
    </div>
  );
}
