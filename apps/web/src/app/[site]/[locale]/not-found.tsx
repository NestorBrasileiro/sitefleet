import Link from 'next/link';
import { getT } from '@fleet/i18n';

/**
 * 404 sem params (o not-found do App Router não recebe os do segmento).
 * Fica em inglês por ser o denominador comum da frota.
 */
export default function NotFound() {
  const t = getT('en');
  return (
    <div className="py-16 text-center">
      <h1 className="text-3xl font-bold">{t('notFound.title')}</h1>
      <p className="mt-3 text-[var(--fg-muted)]">{t('notFound.body')}</p>
      <Link href="/" className="mt-6 inline-block font-medium text-[var(--accent)] underline">
        {t('nav.home')}
      </Link>
    </div>
  );
}
