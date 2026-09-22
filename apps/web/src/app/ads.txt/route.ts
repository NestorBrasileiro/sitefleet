import { headers } from 'next/headers';
import { resolveSite } from '@fleet/sites';

/**
 * ads.txt. O AdSense avisa "ganhos em risco" e corta demanda enquanto o arquivo
 * não existir no domínio — é obrigatório, não opcional.
 */
export async function GET() {
  const site = resolveSite((await headers()).get('host'));
  const pub = site.ads.adsenseClient.replace(/^ca-/, '');

  const lines = [
    ...(pub ? [`google.com, ${pub}, DIRECT, f08c47fec0942fa0`] : []),
    ...site.ads.extraAdsTxt,
  ];

  return new Response(lines.join('\n') + (lines.length ? '\n' : ''), {
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=86400' },
  });
}
