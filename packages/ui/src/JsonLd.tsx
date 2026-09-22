import type { Site, Locale } from '@fleet/sites';
import { canonicalUrl } from '@fleet/sites';
import type { ArticleMeta } from '@fleet/content';

function Ld({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}

export function WebsiteLd({ site, locale }: { site: Site; locale: Locale }) {
  return (
    <Ld
      data={{
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: site.name[locale],
        url: canonicalUrl(site, locale),
        inLanguage: locale,
        publisher: { '@type': 'Organization', name: site.name[locale] },
      }}
    />
  );
}

/**
 * Article + FAQPage. O FAQ é o que tem chance real de virar rich result e
 * puxar clique sem subir posição.
 */
export function ArticleLd({
  site,
  locale,
  article,
}: {
  site: Site;
  locale: Locale;
  article: ArticleMeta;
}) {
  const url = canonicalUrl(site, locale, article.slug);
  return (
    <>
      <Ld
        data={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: article.title,
          description: article.description,
          datePublished: article.date,
          dateModified: article.updated ?? article.date,
          inLanguage: locale,
          mainEntityOfPage: url,
          url,
          ...(article.cover ? { image: [article.cover] } : {}),
          author: { '@type': 'Organization', name: site.name[locale] },
          publisher: { '@type': 'Organization', name: site.name[locale] },
        }}
      />
      {article.faq.length > 0 && (
        <Ld
          data={{
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: article.faq.map((f) => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          }}
        />
      )}
    </>
  );
}

export function BreadcrumbLd({ items }: { items: { name: string; url: string }[] }) {
  return (
    <Ld
      data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((it, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: it.name,
          item: it.url,
        })),
      }}
    />
  );
}
