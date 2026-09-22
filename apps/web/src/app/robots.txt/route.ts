import { headers } from 'next/headers';
import { resolveSite } from '@fleet/sites';

export async function GET() {
  const site = resolveSite((await headers()).get('host'));

  // Site desativado nunca deve ser indexado: domínio estacionado que entra no
  // índice vazio queima a reputação antes de existir conteúdo.
  const body = site.enabled
    ? `User-agent: *
Allow: /

Sitemap: https://${site.domain}/sitemap.xml
`
    : `User-agent: *
Disallow: /
`;

  return new Response(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=86400' },
  });
}
