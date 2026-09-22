import Link from 'next/link';
import Image from 'next/image';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { AdSlot } from '@fleet/ads';
import type { Site } from '@fleet/sites';
import type { T } from '@fleet/i18n';

/** Links internos viram <Link> (navegação client-side); externos ganham rel seguro. */
function MdxLink({ href = '', ...rest }: React.ComponentProps<'a'>) {
  if (href.startsWith('/')) return <Link href={href} {...rest} />;
  if (href.startsWith('#')) return <a href={href} {...rest} />;
  return <a href={href} target="_blank" rel="noopener noreferrer nofollow sponsored" {...rest} />;
}

function MdxImage({ src, alt = '', ...rest }: React.ComponentProps<'img'>) {
  if (typeof src !== 'string') return null;
  return (
    <Image
      src={src}
      alt={alt}
      width={1200}
      height={675}
      className="rounded-lg"
      sizes="(max-width: 768px) 100vw, 768px"
      {...(rest as Record<string, unknown>)}
    />
  );
}

/** Callout para dicas/avisos dentro do artigo. */
function Callout({ type = 'note', children }: { type?: 'note' | 'warn'; children: React.ReactNode }) {
  return (
    <aside
      className={`not-prose my-6 rounded-lg border-l-4 p-4 text-sm ${
        type === 'warn'
          ? 'border-amber-500 bg-amber-500/10'
          : 'border-[var(--accent)] bg-[var(--surface)]'
      }`}
    >
      {children}
    </aside>
  );
}

/**
 * Componentes disponíveis dentro do MDX. Depende do site porque `<Ad />` precisa
 * do client/slot daquele domínio.
 */
export function mdxComponents(site: Site, t: T) {
  return {
    a: MdxLink,
    img: MdxImage,
    Callout,
    /** Anúncio no meio do texto: use no MDX, depois do 2º ou 3º parágrafo. */
    Ad: () => (
      <div className="not-prose my-8">
        <AdSlot
          client={site.ads.adsenseClient}
          slot={site.ads.slots.inArticle}
          format="fluid"
          layout="in-article"
          minHeight={250}
          label={t('ads.placeholder')}
        />
      </div>
    ),
  };
}

export function MdxBody({ source, site, t }: { source: string; site: Site; t: T }) {
  return (
    <MDXRemote
      source={source}
      components={mdxComponents(site, t)}
      options={{
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [
            rehypeSlug,
            [
              rehypeAutolinkHeadings,
              { behavior: 'append', properties: { className: 'heading-anchor', ariaHidden: true, tabIndex: -1 }, content: { type: 'text', value: '#' } },
            ],
          ],
        },
      }}
    />
  );
}
