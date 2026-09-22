#!/usr/bin/env node
/**
 * Gera infra/Caddyfile a partir de packages/sites/sites.json.
 *
 * Escrito à mão, o Caddyfile some com um domínio na hora que você adiciona o
 * oitavo site. Gerado, adicionar site é editar um JSON e rodar isto.
 *
 *   node tools/gen-caddy.mjs            # escreve infra/Caddyfile
 *   node tools/gen-caddy.mjs --check    # falha se estiver desatualizado (CI)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sites = JSON.parse(readFileSync(path.join(root, 'packages/sites/sites.json'), 'utf8'));
const enabled = sites.filter((s) => s.enabled !== false);

const email = process.env.ACME_EMAIL || 'nestorcruzbrasileiro@gmail.com';

const header = `# GERADO POR tools/gen-caddy.mjs — não edite à mão.
# Regenere com: pnpm gen:caddy

{
	email ${email}
	servers {
		trusted_proxies static private_ranges
	}
}

(common) {
	encode zstd gzip

	header {
		Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
		X-Content-Type-Options "nosniff"
		Referrer-Policy "strict-origin-when-cross-origin"
		-Server
	}

	# Assets do Next são content-hashed: podem ser imutáveis no cliente.
	@immutable path /_next/static/* /assets/*
	header @immutable Cache-Control "public, max-age=31536000, immutable"

	# HTML muda a cada deploy; o proxy revalida, o usuário recebe rápido.
	@html not path /_next/static/* /assets/*
	header @html Cache-Control "public, max-age=0, s-maxage=600, stale-while-revalidate=86400"

	reverse_proxy web:3000 {
		header_up X-Forwarded-Host {host}
	}
}
`;

const blocks = enabled.map((site) => {
  const apex = site.domain;
  const www = (site.aliases ?? []).filter((a) => a !== apex);
  // www redireciona para o apex: duas URLs servindo o mesmo HTML divide sinal
  // de ranking e duplica o inventário no AdSense.
  const redirect = www.length
    ? `\n${www.join(', ')} {\n\tredir https://${apex}{uri} permanent\n}\n`
    : '';
  return `${apex} {\n\timport common\n}\n${redirect}`;
});

const out = header + '\n' + blocks.join('\n');
const target = path.join(root, 'infra/Caddyfile');

if (process.argv.includes('--check')) {
  const current = readFileSync(target, 'utf8');
  if (current !== out) {
    console.error('Caddyfile desatualizado. Rode: pnpm gen:caddy');
    process.exit(1);
  }
  console.log('Caddyfile em dia.');
} else {
  writeFileSync(target, out);
  console.log(`Caddyfile gerado: ${enabled.length} sites (${enabled.map((s) => s.domain).join(', ')})`);
}
