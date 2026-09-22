# SiteFleet

Uma frota de sites de conteúdo monetizados com display ads, servida por **um
único app Next.js** multi-tenant. Um build, um container, N domínios.

Plano de implementação e a conta de receita: [`docs/PLANO.md`](docs/PLANO.md).
Operação do dia a dia: [`docs/RUNBOOK.md`](docs/RUNBOOK.md).

## Rodando local

```bash
pnpm install
pnpm dev
```

Cada site tem seu próprio host em dev, sem mexer em `/etc/hosts`:

- http://homegymly.localhost:3000
- http://plantnook.localhost:3000
- http://churrasqueiro.localhost:3000

`localhost:3000` puro cai no primeiro site habilitado.

O idioma vem do seu navegador. Para testar o outro, use o seletor no cabeçalho
ou force pelo header:

```bash
curl -I -H 'Host: homegymly.com' -H 'Accept-Language: pt-BR' http://127.0.0.1:3000/
```

## Estrutura

```
apps/web/            App Next.js que serve todos os domínios
  src/proxy.ts       Host -> site, Accept-Language -> locale, rewrite interno
  src/app/[site]/[locale]/   Páginas (o prefixo [site] nunca aparece na URL)
packages/sites/      sites.json: a frota. Fonte única de domínios e temas.
packages/content/    Loader de MDX + validação de frontmatter
packages/i18n/       Negociação de idioma e dicionários de UI
packages/ui/         Componentes compartilhados e JSON-LD
packages/ads/        Slots AdSense e Consent Mode v2
content/<site>/<locale>/*.mdx   Os artigos
infra/               Dockerfile, compose, Caddyfile (gerado), deploy.sh
tools/               Geradores e validadores
```

## Comandos

| Comando | O que faz |
|---|---|
| `pnpm dev` | Servidor de desenvolvimento |
| `pnpm build` | Build de produção (pré-renderiza tudo) |
| `pnpm check` | Valida conteúdo e confere se o Caddyfile está em dia |
| `pnpm new-site --id x --domain x.com --name "X" --tagline "..."` | Adiciona um site |
| `pnpm gen:caddy` | Regenera `infra/Caddyfile` a partir de `sites.json` |
| `DEPLOY_HOST=user@ip pnpm deploy` | Deploy no VPS |

## Adicionando um artigo

Crie `content/<site>/<locale>/<slug>.mdx`. O nome do arquivo vira a URL.

```mdx
---
title: "Use aspas: o YAML quebra com dois-pontos sem elas"
description: "Entre 50 e 200 caracteres. É o que aparece no resultado do Google."
date: 2026-09-22
category: "Guias"
tags: [tag-um, tag-dois]
translationKey: mesmo-valor-nas-duas-traducoes
faq:
  - q: "Uma pergunta"
    a: "A resposta, que vira JSON-LD de FAQPage."
---

Primeiro parágrafo responde o título direto.

<Ad />

<Callout type="warn">Aviso destacado.</Callout>
```

`translationKey` é o que liga as versões em idiomas diferentes — é dele que sai
o `hreflang` correto. `pnpm check` avisa quando uma tradução está faltando.

## Ligando os anúncios

Em `packages/sites/sites.json`, no site:

```json
"ads": {
  "adsenseClient": "ca-pub-0000000000000000",
  "slots": { "header": "1234567890", "inArticle": "...", "sidebar": "...", "footer": "..." }
}
```

Sem isso, os slots renderizam um placeholder tracejado — dá para avaliar o
layout antes de ter conta aprovada. O `ads.txt` de cada domínio sai do
`adsenseClient` automaticamente.
