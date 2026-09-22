# syntax=docker/dockerfile:1.7

# ---------- deps ----------
FROM node:24-alpine AS deps
RUN corepack enable
# pnpm 11 faz verificação interativa de dependências antes dos scripts; em
# build não-interativo isso falha em vez de perguntar.
ENV CI=true
WORKDIR /repo
# Só os manifests primeiro: mudar um artigo não invalida a camada de node_modules.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/web/package.json apps/web/
COPY packages/sites/package.json packages/sites/
COPY packages/i18n/package.json packages/i18n/
COPY packages/content/package.json packages/content/
COPY packages/ui/package.json packages/ui/
COPY packages/ads/package.json packages/ads/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && pnpm install --frozen-lockfile

# ---------- build ----------
FROM node:24-alpine AS build
RUN corepack enable
ENV CI=true
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/web/node_modules ./apps/web/node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN pnpm --filter @fleet/web build

# ---------- runtime ----------
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# O loader de conteúdo procura content/ subindo a árvore; no container o
# caminho é fixo, então dizemos onde é em vez de deixar adivinhar.
ENV CONTENT_DIR=/app/content

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# standalone já traz o subconjunto de node_modules que o server usa.
COPY --from=build --chown=nextjs:nodejs /repo/apps/web/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=nextjs:nodejs /repo/apps/web/public ./apps/web/public
COPY --from=build --chown=nextjs:nodejs /repo/content ./content

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "apps/web/server.js"]
