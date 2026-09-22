import { z } from 'zod';

/**
 * Frontmatter de todo artigo. Validado no build (tools/check-content.mjs) e na
 * leitura — um MDX malformado falha alto em vez de renderizar página quebrada,
 * que é o tipo de coisa que derruba aprovação no AdSense.
 */
/**
 * O YAML converte 2026-02-10 sem aspas num Date do JS. Exigir aspas em toda
 * data seria uma pegadinha esperando para acontecer, então normalizamos aqui
 * e seguimos com string ISO em todo o resto do código.
 */
const isoDate = z
  .union([z.string(), z.date()])
  .transform((v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v))
  .pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'use o formato YYYY-MM-DD'));

export const frontmatterSchema = z.object({
  title: z.string().min(10).max(120),
  /** Vira <meta name="description"> e o texto do card. Google corta ~155. */
  description: z.string().min(50).max(200),
  /** ISO YYYY-MM-DD. Aceita data sem aspas no YAML. */
  date: isoDate,
  updated: isoDate.optional(),
  category: z.string().min(1),
  tags: z.array(z.string()).default([]),
  /** Caminho em /public ou URL absoluta. */
  cover: z.string().optional(),
  coverAlt: z.string().optional(),
  /** Slug do mesmo artigo no outro idioma, para hreflang correto. */
  translationKey: z.string().optional(),
  /** Perguntas que viram JSON-LD FAQPage — puxa rich result e tempo na página. */
  faq: z
    .array(z.object({ q: z.string(), a: z.string() }))
    .default([]),
  draft: z.boolean().default(false),
  /** Destaca na home. */
  featured: z.boolean().default(false),
});

export type Frontmatter = z.infer<typeof frontmatterSchema>;

export type ArticleMeta = Frontmatter & {
  slug: string;
  siteId: string;
  locale: string;
  readingMinutes: number;
  /** Chave de tradução efetiva (translationKey ?? slug). */
  tkey: string;
};

export type Article = ArticleMeta & { body: string };
