#!/usr/bin/env node
/**
 * Checagens que o schema por arquivo não alcança, porque são relações entre
 * arquivos. Roda antes do build; falha alto.
 *
 *  - slug duplicado dentro do mesmo site+locale
 *  - translationKey apontando para tradução que não existe
 *  - translationKey usado por dois artigos do mesmo locale (hreflang ambíguo)
 *  - site habilitado sem conteúdo em algum locale que ele declara publicar
 *  - artigo sem categoria usada em nenhum outro lugar (categoria órfã = página com 1 item)
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import matter from 'gray-matter';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sites = JSON.parse(readFileSync(path.join(root, 'packages/sites/sites.json'), 'utf8'));

const errors = [];
const warnings = [];

for (const site of sites) {
  if (site.enabled === false) continue;

  const byLocale = new Map();

  for (const locale of site.locales) {
    const dir = path.join(root, 'content', site.id, locale);
    if (!existsSync(dir)) {
      errors.push(`${site.id}: declara o locale "${locale}" mas content/${site.id}/${locale}/ não existe`);
      byLocale.set(locale, []);
      continue;
    }
    const files = readdirSync(dir).filter((f) => /\.mdx?$/.test(f));
    if (files.length === 0) {
      errors.push(`${site.id}/${locale}: nenhum artigo — o site ficaria com página vazia indexada`);
    }

    const articles = files.map((f) => {
      const { data } = matter(readFileSync(path.join(dir, f), 'utf8'));
      return { file: f, slug: f.replace(/\.mdx?$/, ''), ...data };
    });

    const seenSlug = new Set();
    const seenKey = new Map();
    for (const a of articles) {
      if (seenSlug.has(a.slug)) errors.push(`${site.id}/${locale}: slug duplicado "${a.slug}"`);
      seenSlug.add(a.slug);

      const key = a.translationKey ?? a.slug;
      if (seenKey.has(key)) {
        errors.push(
          `${site.id}/${locale}: translationKey "${key}" em dois artigos (${seenKey.get(key)} e ${a.file}) — hreflang fica ambíguo`,
        );
      }
      seenKey.set(key, a.file);
    }
    byLocale.set(locale, articles);
  }

  // Cobertura de tradução entre os locales do site.
  const keysPerLocale = new Map(
    [...byLocale].map(([l, arts]) => [l, new Set(arts.map((a) => a.translationKey ?? a.slug))]),
  );
  for (const [locale, keys] of keysPerLocale) {
    for (const other of site.locales) {
      if (other === locale) continue;
      for (const key of keys) {
        if (!keysPerLocale.get(other)?.has(key)) {
          warnings.push(`${site.id}: "${key}" existe em ${locale} mas não em ${other} — sem hreflang recíproco`);
        }
      }
    }
  }

  // Categorias com um artigo só geram página fina, que o Google trata como spam.
  for (const [locale, arts] of byLocale) {
    const counts = new Map();
    for (const a of arts) counts.set(a.category, (counts.get(a.category) ?? 0) + 1);
    for (const [cat, n] of counts) {
      if (n === 1 && arts.length > 3) {
        warnings.push(`${site.id}/${locale}: categoria "${cat}" tem 1 artigo só — página fina`);
      }
    }
  }
}

for (const w of warnings) console.warn(`aviso  ${w}`);
for (const e of errors) console.error(`ERRO   ${e}`);

console.log(`\n${errors.length} erro(s), ${warnings.length} aviso(s).`);
process.exit(errors.length > 0 ? 1 : 0);
