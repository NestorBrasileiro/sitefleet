#!/usr/bin/env bash
# Deploy para o VPS. Idempotente: pode rodar de novo sem medo.
#
#   DEPLOY_HOST=user@1.2.3.4 bash infra/deploy.sh
#
# Manda o repositório para o servidor e reconstrói lá. Build remoto (em vez de
# push de imagem) evita depender de registry; se um dia a build ficar pesada,
# troque por `docker buildx --push` e um registry privado.
set -euo pipefail

HOST="${DEPLOY_HOST:?defina DEPLOY_HOST=user@servidor}"
REMOTE_DIR="${REMOTE_DIR:-/srv/sitefleet}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$REPO_ROOT"

echo "==> Validando conteúdo"
node tools/check-content.mjs

echo "==> Conferindo Caddyfile"
node tools/gen-caddy.mjs --check

echo "==> Sincronizando para $HOST:$REMOTE_DIR"
ssh "$HOST" "mkdir -p '$REMOTE_DIR'"
rsync -az --delete \
  --exclude node_modules --exclude .next --exclude .turbo --exclude .git \
  ./ "$HOST:$REMOTE_DIR/"

echo "==> Build e subida"
# --remove-orphans limpa containers de serviços que saíram do compose.
ssh "$HOST" "cd '$REMOTE_DIR' && docker compose -f infra/compose.yml up -d --build --remove-orphans"

echo "==> Aguardando healthcheck"
for i in $(seq 1 30); do
  status=$(ssh "$HOST" "cd '$REMOTE_DIR' && docker compose -f infra/compose.yml ps --format '{{.Health}}' web" 2>/dev/null || true)
  if [ "$status" = "healthy" ]; then
    echo "==> web saudável"
    ssh "$HOST" "cd '$REMOTE_DIR' && docker image prune -f >/dev/null"
    echo "==> Deploy concluído"
    exit 0
  fi
  sleep 3
done

echo "!! web não ficou saudável. Logs:" >&2
ssh "$HOST" "cd '$REMOTE_DIR' && docker compose -f infra/compose.yml logs --tail=60 web" >&2
exit 1
