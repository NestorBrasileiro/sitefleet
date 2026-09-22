import type { Metadata } from 'next';
import { resolveRoute, type RouteParams } from '@/lib/params';
import { buildMetadata } from '@/lib/metadata';
import { legalPage } from '@/lib/legal';
import { LegalBody } from '@/components/LegalBody';

const KIND = 'contato' as const;

export async function generateMetadata({ params }: { params: Promise<RouteParams> }): Promise<Metadata> {
  const { site, locale } = await resolveRoute(params);
  const page = legalPage(KIND, site, locale);
  return buildMetadata({
    site,
    locale,
    title: `${page.title} — ${site.name[locale]}`,
    description: page.blocks[0]?.p[0] ?? page.title,
    path: KIND,
    translations: Object.fromEntries(site.locales.map((l) => [l, KIND])),
  });
}

export default async function Page({ params }: { params: Promise<RouteParams> }) {
  const { site, locale } = await resolveRoute(params);
  return <LegalBody page={legalPage(KIND, site, locale)} />;
}
