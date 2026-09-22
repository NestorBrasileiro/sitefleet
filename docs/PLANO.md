# Plano de implementação — SiteFleet

Objetivo: ~10 sites de conteúdo monetizados com display ads, rodando na sua
infra, com o menor custo operacional possível por site.

---

## 1. A decisão de arquitetura, e por que ela é essa

**Um app Next.js serve os 10 domínios.** O domínio entra pelo header `Host`,
um proxy resolve qual site é, e o rewrite interno `/{site}/{locale}/...` mantém
as chaves de cache separadas.

A alternativa óbvia — 10 projetos, 10 containers, 10 pipelines — custa 10x em
manutenção para entregar a mesma coisa. Subir uma versão do Next, corrigir um
bug de layout ou adicionar um formato de anúncio passaria a ser dez tarefas.
Com um app só, é uma.

O preço disso: um bug de deploy derruba os dez ao mesmo tempo. Para um projeto
solo de renda passiva, essa troca compensa. Se um site um dia crescer a ponto de
justificar isolamento, o Caddy aponta aquele domínio para um segundo container
sem mexer no resto.

**Idioma vem do navegador.** O `Accept-Language` carrega a configuração do
navegador/SO. O proxy negocia contra os idiomas que *aquele* site publica e
redireciona para `/en/...` ou `/pt-BR/...`. A escolha manual grava cookie e
passa a mandar.

---

## 2. A conta que decide tudo

Antes do cronograma, o número que define se isso vale a pena:

```
receita/mês = pageviews/mês ÷ 1000 × RPM
```

RPM realista de display, nichos não-YMYL:

| Mercado | RPM típico | 50k pageviews/mês |
|---|---|---|
| EN-US / EN-UK | US$ 8 – 25 | US$ 400 – 1.250 |
| pt-BR | R$ 3 – 10 | R$ 150 – 500 |

Isso é o motivo de a frota nascer majoritariamente em inglês, com pt-BR como
segundo idioma onde o conteúdo se traduz bem. O esforço de escrever é o mesmo;
a receita não é.

**O custo real não é infra, é conteúdo.** Um VPS de US$ 10–20/mês roda os dez.
O que custa são os artigos: ~30 por site para começar a ter tração, ~300 no
total. É aí que o projeto vive ou morre.

**Prazo honesto:** site novo leva de 3 a 6 meses para o Google mandar tráfego
relevante, e de 9 a 12 para estabilizar. Nada do que está aqui muda isso.

---

## 3. Fases

### Fase 0 — Feito (este repositório)

- [x] Monorepo, app multi-tenant, registry de sites em `sites.json`
- [x] i18n por `Accept-Language` com fallback por site
- [x] MDX com frontmatter validado (Zod), FAQ, categorias, relacionados
- [x] Slots de anúncio com altura reservada (CLS) e Consent Mode v2
- [x] SEO: canonical, hreflang recíproco, JSON-LD (Article/FAQ/Breadcrumb), sitemap, RSS
- [x] Páginas legais geradas por site (exigência do AdSense)
- [x] `ads.txt` e `robots.txt` por domínio
- [x] Docker + Caddy com TLS automático, deploy por script
- [x] 3 sites de exemplo com conteúdo bilíngue real

### Fase 1 — Validar com 3 sites (semanas 1–8)

Não lance os dez de uma vez. Três sites revelam se o processo funciona antes de
você multiplicar o erro por dez.

1. **Registrar 3 domínios** e apontar o DNS para o VPS. Domínio envelhecendo em
   paralelo ao conteúdo economiza semanas depois.
2. **Escrever 15–20 artigos por site** antes de pedir AdSense. Menos que isso a
   inscrição é reprovada por "conteúdo insuficiente".
3. **Pedir AdSense** com um domínio só primeiro. Aprovado o primeiro, os outros
   entram no mesmo publisher sem nova análise de conta.
4. **Preencher `ads.txt`**: o `adsenseClient` em `sites.json` gera o arquivo.
5. **Search Console**: verificar os 3 domínios, submeter sitemap.

Critério para seguir: um dos três passando de 5k pageviews/mês no mês 3.

### Fase 2 — Escalar para 10 (meses 3–8)

Só depois que a Fase 1 responder o que funciona.

- `pnpm new-site --id ... --domain ...` para cada site novo
- Nichos já pré-selecionados em `sites.json` (`enabled: false`)
- Meta: 30 artigos por site antes de ligar `enabled: true`
- Traduzir para pt-BR só o que performou em inglês — tradução de artigo morto é
  trabalho jogado fora

### Fase 3 — Otimizar receita (contínuo)

Nesta ordem, porque é a ordem do retorno:

1. **Interlinking.** Artigos relacionados já estão automáticos; o ganho maior
   vem de links no meio do texto. Mais pageviews por sessão é o multiplicador
   mais barato que existe.
2. **Atualizar o que já ranqueia.** Um artigo na posição 8 que sobe para 3
   triplica o tráfego dele. Escrever um artigo novo do zero rende menos.
3. **Densidade de anúncios.** Suba devagar e meça: anúncio a mais derruba CWV,
   CWV pior derruba ranking, e o saldo pode ser negativo.
4. **Afiliados.** Em nichos de equipamento (`homegymly`, `brewgear`, `deskrig`,
   `trailkit`), afiliado costuma superar display. O componente `<Ad />` e os
   links com `rel="sponsored"` já estão prontos para isso.

---

## 4. O que pode dar errado

**Reprovação no AdSense.** Causa quase sempre: pouco conteúdo, páginas legais
ausentes ou conteúdo genérico demais. As páginas legais o repositório gera; o
resto é conteúdo.

**Conteúdo em escala sem valor próprio.** A política antispam do Google mira
"scaled content abuse" — publicação em volume sem valor original,
independentemente de como foi produzida. Usar IA para rascunhar é aceito;
publicar em massa sem revisão, teste ou experiência própria é o que derruba o
domínio inteiro. Na prática: se o artigo não tem nada que só você poderia ter
escrito, ele é passivo, não ativo.

**Concentração.** Dez sites no mesmo publisher AdSense: uma suspensão de conta
derruba a receita dos dez de uma vez. Mitigação parcial é diversificar formato
de receita (afiliados, newsletter) antes de diversificar plataforma.

**Um container para dez domínios.** Já descrito acima. O healthcheck e o
`restart: unless-stopped` cobrem o caso comum; o que não cobrem é deploy ruim.
Rode `pnpm check` antes de `pnpm deploy` — o script já faz isso.

---

## 5. Cadência semanal sugerida

| Dia | Tarefa | Tempo |
|---|---|---|
| Seg | Pesquisa de pauta (3 artigos), rascunho de 1 | 2h |
| Qua | Rascunho de 2 artigos | 2h |
| Sex | Revisão, publicação, interlinking, `pnpm deploy` | 1h |
| Mensal | Search Console: o que subiu, o que caiu, o que atualizar | 1h |

3 artigos/semana ≈ 150/ano. Distribuído em 10 sites é pouco; concentrado nos 3
que funcionam é o suficiente. É por isso que a Fase 1 existe.
