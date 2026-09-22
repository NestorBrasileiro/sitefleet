#!/usr/bin/env node
/**
 * Adiciona um site à frota: entrada em sites.json, pastas de conteúdo e um
 * artigo inicial por idioma. Depois disso é só escrever.
 *
 *   node tools/new-site.mjs --id brewgear --domain brewgear.com \
 *     --name "BrewGear" --tagline "Coffee gear, tested at home." \
 *     --locales en,pt-BR --accent "#845ef7"
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1 || !process.argv[i + 1]) {
    if (fallback !== undefined) return fallback;
    console.error(`Faltou --${name}`);
    process.exit(1);
  }
  return process.argv[i + 1];
}

const id = arg('id');
const domain = arg('domain');
const name = arg('name');
const tagline = arg('tagline');
const accent = arg('accent', '#1971c2');
const locales = arg('locales', 'en').split(',').map((l) => l.trim()).filter(Boolean);

if (!/^[a-z0-9-]+$/.test(id)) {
  console.error('--id aceita só minúsculas, números e hífen (vira nome de pasta e chave de rota).');
  process.exit(1);
}

const sitesPath = path.join(root, 'packages/sites/sites.json');
const sites = JSON.parse(readFileSync(sitesPath, 'utf8'));

if (sites.some((s) => s.id === id)) {
  console.error(`Já existe site com id "${id}".`);
  process.exit(1);
}
const clash = sites.find((s) => s.domain === domain || (s.aliases ?? []).includes(domain));
if (clash) {
  console.error(`Domínio "${domain}" já pertence a "${clash.id}".`);
  process.exit(1);
}

const byLocale = (value) => Object.fromEntries(locales.map((l) => [l, value]));

sites.push({
  id,
  domain,
  aliases: [`www.${domain}`],
  name: byLocale(name),
  tagline: byLocale(tagline),
  locales,
  defaultLocale: locales[0],
  theme: { accent },
  legal: { owner: 'Nestor', email: `contato@${domain}` },
  // Nasce desligado: sem conteúdo, indexar o domínio só queima reputação.
  enabled: false,
});

writeFileSync(sitesPath, JSON.stringify(sites, null, 2) + '\n');

const today = new Date().toISOString().slice(0, 10);
for (const locale of locales) {
  const dir = path.join(root, 'content', id, locale);
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'primeiro-artigo.mdx');
  if (existsSync(file)) continue;
  writeFileSync(
    file,
    `---
title: "Troque este título por uma pergunta real que as pessoas buscam"
description: "Duas linhas explicando o que o leitor leva daqui. Entre 50 e 200 caracteres, porque e isso que aparece no Google."
date: ${today}
category: "Guias"
tags: []
translationKey: primeiro-artigo
draft: true
faq:
  - q: "Uma pergunta que o artigo responde"
    a: "A resposta curta, em uma ou duas frases."
---

Primeiro parágrafo responde a pergunta do título direto. Sem introdução.

## Um subtítulo que também é uma busca

Corpo do texto.

<Ad />

## Outro bloco

Mais corpo. Remova \`draft: true\` do frontmatter quando estiver pronto.
`,
  );
}

console.log(`Site "${id}" criado (enabled: false).

Próximos passos:
  1. Escreva em content/${id}/${locales[0]}/ — mire 15 artigos antes de pedir AdSense.
  2. Aponte o DNS de ${domain} para o VPS.
  3. Vire "enabled": true em packages/sites/sites.json.
  4. pnpm gen:caddy && pnpm deploy`);
