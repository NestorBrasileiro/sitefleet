import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import readingTime from 'reading-time';
import { frontmatterSchema, type Article, type ArticleMeta } from './schema';

/**
 * Raiz do conteúdo. CONTENT_DIR manda (é o que o Docker seta); senão sobe a
 * árvore procurando /content, o que faz `next dev` funcionar de apps/web.
 */
function findContentRoot(): string {
  const fromEnv = process.env.CONTENT_DIR;
  if (fromEnv) return path.resolve(fromEnv);
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    const candidate = path.join(/* turbopackIgnore: true */ dir, 'content');
    if (fs.existsSync(/* turbopackIgnore: true */ candidate) && fs.statSync(candidate).isDirectory())
      return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error('Diretório content/ não encontrado. Defina CONTENT_DIR.');
}

const CONTENT_ROOT = findContentRoot();

/**
 * Cache em memória. Em produção o processo é longo e o conteúdo é imutável até
 * o próximo deploy, então cacheia para sempre; em dev, nunca, para hot reload.
 */
const CACHE_ENABLED = process.env.NODE_ENV === 'production';
const cache = new Map<string, unknown>();

function memo<T>(key: string, compute: () => T): T {
  if (!CACHE_ENABLED) return compute();
  if (cache.has(key)) return cache.get(key) as T;
  const value = compute();
  cache.set(key, value);
  return value;
}

function localeDir(siteId: string, locale: string): string {
  return path.join(/* turbopackIgnore: true */ CONTENT_ROOT, siteId, locale);
}

function parseFile(siteId: string, locale: string, file: string): Article {
  const full = path.join(/* turbopackIgnore: true */ localeDir(siteId, locale), file);
  const raw = fs.readFileSync(/* turbopackIgnore: true */ full, 'utf8');
  const { data, content } = matter(raw);
  const parsed = frontmatterSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(
      `Frontmatter inválido em ${siteId}/${locale}/${file}:\n` +
        parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n'),
    );
  }
  const slug = file.replace(/\.mdx?$/, '');
  return {
    ...parsed.data,
    slug,
    siteId,
    locale,
    tkey: parsed.data.translationKey ?? slug,
    readingMinutes: Math.max(1, Math.round(readingTime(content).minutes)),
    body: content,
  };
}

/** Todos os artigos publicados de um site+locale, mais novo primeiro. */
export function getArticles(siteId: string, locale: string): ArticleMeta[] {
  return memo(`list:${siteId}:${locale}`, () => {
    const dir = localeDir(siteId, locale);
    if (!fs.existsSync(/* turbopackIgnore: true */ dir)) return [];
    return fs
      .readdirSync(/* turbopackIgnore: true */ dir)
      .filter((f) => /\.mdx?$/.test(f))
      .map((f) => parseFile(siteId, locale, f))
      .filter((a) => !a.draft || process.env.NODE_ENV !== 'production')
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .map(({ body: _body, ...meta }) => meta);
  });
}

export function getArticle(siteId: string, locale: string, slug: string): Article | null {
  return memo(`one:${siteId}:${locale}:${slug}`, () => {
    for (const ext of ['.mdx', '.md']) {
      const file = `${slug}${ext}`;
      const candidate = path.join(/* turbopackIgnore: true */ localeDir(siteId, locale), file);
      if (fs.existsSync(/* turbopackIgnore: true */ candidate)) {
        const article = parseFile(siteId, locale, file);
        if (article.draft && process.env.NODE_ENV === 'production') return null;
        return article;
      }
    }
    return null;
  });
}

/** Slug do mesmo artigo em outro locale — sem isso o hreflang mente. */
export function getTranslatedSlug(
  siteId: string,
  fromLocale: string,
  slug: string,
  toLocale: string,
): string | null {
  const source = getArticles(siteId, fromLocale).find((a) => a.slug === slug);
  if (!source) return null;
  return getArticles(siteId, toLocale).find((a) => a.tkey === source.tkey)?.slug ?? null;
}

export function getCategories(siteId: string, locale: string): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const a of getArticles(siteId, locale)) {
    counts.set(a.category, (counts.get(a.category) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function getArticlesByCategory(
  siteId: string,
  locale: string,
  category: string,
): ArticleMeta[] {
  const wanted = category.toLowerCase();
  return getArticles(siteId, locale).filter((a) => a.category.toLowerCase() === wanted);
}

/**
 * Relacionados por tags em comum, depois por categoria. Interlinking é o
 * barato que mais move pageviews/sessão — e pageviews é o que vira receita.
 */
export function getRelated(article: ArticleMeta, limit = 4): ArticleMeta[] {
  const pool = getArticles(article.siteId, article.locale).filter((a) => a.slug !== article.slug);
  const tags = new Set(article.tags);
  return pool
    .map((a) => {
      const shared = a.tags.filter((t) => tags.has(t)).length;
      return { a, score: shared * 2 + (a.category === article.category ? 1 : 0) };
    })
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score)
    .slice(0, limit)
    .map((x) => x.a);
}

export { CONTENT_ROOT };
