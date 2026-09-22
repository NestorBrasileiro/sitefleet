import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getArticle, getArticles, getRelated, getTranslatedSlug } from '@fleet/content';
import { ENABLED_SITES, type Locale } from '@fleet/sites';
import { formatDate } from '@fleet/i18n';
import { Prose, ArticleLd, BreadcrumbLd } from '@fleet/ui';
import { AdSlot } from '@fleet/ads';
import { canonicalUrl } from '@fleet/sites';
import { resolveRoute, type RouteParams } from '@/lib/params';
import { buildMetadata } from '@/lib/metadata';
import { MdxBody } from '@/lib/mdx';

type Params = RouteParams & { slug: string };

export async function generateStaticParams() {
  return ENABLED_SITES.flatMap((s) =>
    s.locales.flatMap((locale) =>
      getArticles(s.id, locale).map((a) => ({ site: s.id, locale, slug: a.slug })),
    ),
  );
}

/** Slugs irmãos em outros idiomas — base do hreflang. */
function translationsFor(siteId: string, locale: Locale, slug: string, locales: readonly Locale[]) {
  const out: Partial<Record<Locale, string>> = { [locale]: slug };
  for (const other of locales) {
    if (other === locale) continue;
    const translated = getTranslatedSlug(siteId, locale, slug, other);
    if (translated) out[other] = translated;
  }
  return out;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { site, locale } = await resolveRoute(params as Promise<RouteParams>);
  const { slug } = await params;
  const article = getArticle(site.id, locale, slug);
  if (!article) return {};
  return buildMetadata({
    site,
    locale,
    title: `${article.title} — ${site.name[locale]}`,
    description: article.description,
    path: slug,
    translations: translationsFor(site.id, locale, slug, site.locales),
    image: article.cover,
    publishedTime: article.date,
    modifiedTime: article.updated ?? article.date,
  });
}

export default async function ArticlePage({ params }: { params: Promise<Params> }) {
  const { site, locale, t } = await resolveRoute(params as Promise<RouteParams>);
  const { slug } = await params;
  const article = getArticle(site.id, locale, slug);
  if (!article) notFound();

  const related = getRelated(article);

  return (
    <article className="mx-auto max-w-3xl">
      <nav className="text-sm text-[var(--fg-muted)]">
        <Link href={`/${locale}`}>{t('nav.home')}</Link>
        <span aria-hidden="true"> / </span>
        <Link href={`/${locale}/categoria/${encodeURIComponent(article.category)}`}>
          {article.category}
        </Link>
      </nav>

      <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">{article.title}</h1>
      <p className="mt-3 flex flex-wrap gap-x-3 text-sm text-[var(--fg-muted)]">
        <time dateTime={article.updated ?? article.date}>
          {t('article.updated')} {formatDate(article.updated ?? article.date, locale)}
        </time>
        <span aria-hidden="true">·</span>
        <span>{t('article.readingTime', { n: article.readingMinutes })}</span>
      </p>

      <AdSlot
        client={site.ads.adsenseClient}
        slot={site.ads.slots.header}
        format="horizontal"
        minHeight={90}
        label={t('ads.placeholder')}
        className="my-6"
      />

      <Prose>
        <MdxBody source={article.body} site={site} t={t} />
      </Prose>

      {article.faq.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-bold">FAQ</h2>
          <dl className="mt-4 space-y-4">
            {article.faq.map((f) => (
              <div key={f.q} className="rounded-lg border border-[var(--line)] p-4">
                <dt className="font-semibold">{f.q}</dt>
                <dd className="mt-1 text-[var(--fg-muted)]">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-12 border-t border-[var(--line)] pt-6">
          <h2 className="text-xl font-semibold">{t('article.related')}</h2>
          <ul className="mt-3 space-y-2">
            {related.map((r) => (
              <li key={r.slug}>
                <Link href={`/${locale}/${r.slug}`} className="text-[var(--accent)] hover:underline">
                  {r.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <AdSlot
        client={site.ads.adsenseClient}
        slot={site.ads.slots.footer}
        format="auto"
        minHeight={280}
        label={t('ads.placeholder')}
        className="mt-10"
      />

      <ArticleLd site={site} locale={locale} article={article} />
      <BreadcrumbLd
        items={[
          { name: site.name[locale] ?? site.id, url: canonicalUrl(site, locale) },
          {
            name: article.category,
            url: canonicalUrl(site, locale, `categoria/${encodeURIComponent(article.category)}`),
          },
          { name: article.title, url: canonicalUrl(site, locale, slug) },
        ]}
      />
    </article>
  );
}
