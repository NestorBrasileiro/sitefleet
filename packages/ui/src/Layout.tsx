import Link from 'next/link';
import type { Site, Locale } from '@fleet/sites';
import type { T } from '@fleet/i18n';
import { formatDate } from '@fleet/i18n';
import type { ArticleMeta } from '@fleet/content';
import { LocaleSwitcher } from './LocaleSwitcher';

export function Header({ site, locale, t }: { site: Site; locale: Locale; t: T }) {
  const base = `/${locale}`;
  return (
    <header className="border-b border-[var(--line)]">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <Link href={base} className="text-lg font-bold tracking-tight">
          {site.name[locale]}
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href={`${base}/artigos`} className="hover:text-[var(--accent)]">
            {t('nav.articles')}
          </Link>
          <Link href={`${base}/sobre`} className="hover:text-[var(--accent)]">
            {t('nav.about')}
          </Link>
          <LocaleSwitcher locales={site.locales} current={locale} />
        </nav>
      </div>
    </header>
  );
}

export function Footer({ site, locale, t }: { site: Site; locale: Locale; t: T }) {
  const base = `/${locale}`;
  return (
    <footer className="mt-16 border-t border-[var(--line)] bg-[var(--surface)]">
      <div className="mx-auto max-w-5xl space-y-3 px-4 py-8 text-sm text-[var(--fg-muted)]">
        <nav className="flex flex-wrap gap-4">
          <Link href={`${base}/sobre`}>{t('nav.about')}</Link>
          <Link href={`${base}/contato`}>{t('nav.contact')}</Link>
          <Link href={`${base}/privacidade`}>{t('nav.privacy')}</Link>
        </nav>
        <p>{t('footer.disclosure')}</p>
        <p>
          © {new Date().getFullYear()} {site.name[locale]}. {t('footer.rights')}
        </p>
      </div>
    </footer>
  );
}

export function ArticleCard({
  article,
  locale,
  t,
}: {
  article: ArticleMeta;
  locale: Locale;
  t: T;
}) {
  return (
    <article className="border-b border-[var(--line)] py-6 last:border-0">
      <h2 className="text-xl font-semibold leading-snug">
        <Link href={`/${locale}/${article.slug}`} className="hover:text-[var(--accent)]">
          {article.title}
        </Link>
      </h2>
      <p className="mt-2 text-[var(--fg-muted)]">{article.description}</p>
      <p className="mt-3 flex flex-wrap gap-x-3 text-xs uppercase tracking-wide text-[var(--fg-muted)]">
        <span>{formatDate(article.updated ?? article.date, locale)}</span>
        <span aria-hidden="true">·</span>
        <span>{t('article.readingTime', { n: article.readingMinutes })}</span>
        <span aria-hidden="true">·</span>
        <Link href={`/${locale}/categoria/${encodeURIComponent(article.category)}`}>
          {article.category}
        </Link>
      </p>
    </article>
  );
}

/** Wrapper tipográfico das páginas de artigo. */
export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="prose prose-lg max-w-none prose-headings:scroll-mt-24 prose-a:text-[var(--accent)] dark:prose-invert">
      {children}
    </div>
  );
}
