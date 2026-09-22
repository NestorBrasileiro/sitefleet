# Runbook

## Primeiro deploy no VPS

Pré-requisitos no servidor: Docker com Compose v2, portas 80 e 443 livres, e o
DNS dos domínios (apex e `www`) apontando para o IP. O Caddy emite os
certificados sozinho no primeiro acesso — se o DNS não estiver propagado, a
emissão falha e ele tenta de novo.

```bash
DEPLOY_HOST=nestor@1.2.3.4 pnpm deploy
```

O script valida conteúdo, confere o Caddyfile, sincroniza o repositório,
reconstrói a imagem no servidor e espera o healthcheck. Se o container não ficar
saudável em 90s, ele despeja os logs e sai com erro — sem deixar meia-versão no ar.

## Adicionando um domínio à frota

```bash
pnpm new-site --id brewgear --domain brewgear.com \
  --name "BrewGear" --tagline "Coffee gear, tested at home." \
  --locales en,pt-BR --accent "#845ef7"
```

Nasce com `enabled: false`: fora do build, fora do Caddyfile, `robots.txt`
bloqueando. Escreva os artigos, aponte o DNS, vire para `true`, rode
`pnpm gen:caddy` e faça o deploy.

## Ligando o AdSense num domínio

1. Adicione o site no painel do AdSense e peça revisão.
2. Copie o `ca-pub-...` para `ads.adsenseClient` em `sites.json`.
3. Crie as unidades de anúncio e copie os IDs para `ads.slots`.
4. Deploy. Confirme que `https://dominio/ads.txt` responde com a linha
   `google.com, pub-..., DIRECT, f08c47fec0942fa0`.

O AdSense leva algumas horas para ler o `ads.txt`. Enquanto não ler, o painel
mostra aviso de "ganhos em risco" — é esperado, não é erro de configuração.

## Diagnóstico

```bash
ssh $DEPLOY_HOST 'cd /srv/sitefleet && docker compose -f infra/compose.yml logs -f web'
ssh $DEPLOY_HOST 'cd /srv/sitefleet && docker compose -f infra/compose.yml ps'
```

**Um domínio serve o conteúdo de outro** → o host não está em `sites.json`.
O resolvedor cai no primeiro site habilitado quando não reconhece o `Host`.

**Certificado não emite** → `docker compose logs caddy`. Quase sempre é DNS
ainda propagando ou porta 80 fechada (o desafio ACME precisa dela).

**Idioma errado** → o cookie `fleet_locale` tem prioridade sobre o navegador.
Apague o cookie do domínio para testar a negociação limpa.

**Build quebra em artigo novo** → o frontmatter é validado por schema e a
mensagem diz o campo e o arquivo. Causa mais comum: `title` ou `description`
com dois-pontos sem aspas.

## Rollback

O deploy não guarda versões anteriores da imagem. Para voltar:

```bash
cd /home/nestor/Work/sitefleet
git revert <commit>
DEPLOY_HOST=... pnpm deploy
```

Se precisar de rollback mais rápido que um rebuild, o próximo passo é taguear as
imagens por commit e passar a usar um registry — vale a pena a partir do momento
em que o build passar de uns 3 minutos.
