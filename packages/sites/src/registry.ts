import rawSites from '../sites.json' with { type: 'json' };
import { siteSchema, type Site } from './schema';

/**
 * A frota vive em sites.json, não aqui.
 *
 * Fica em JSON porque quem precisa da lista não é só o app: o gerador do
 * Caddyfile e os scripts de deploy leem o mesmo arquivo sem compilar
 * TypeScript. Uma fonte só evita o clássico "adicionei o domínio no código e
 * esqueci do proxy reverso".
 *
 * Campos e regras de validação: packages/sites/src/schema.ts
 *
 * Nichos escolhidos por demanda de anunciante razoável, conteúdo evergreen e
 * distância de YMYL (saúde/finanças/jurídico), onde o Google exige autoridade
 * comprovada e a aprovação no AdSense trava.
 *
 * `enabled: false` = fora do build, do sitemap e do Caddyfile; robots.txt sai
 * bloqueando. Ligue quando o domínio estiver apontado e houver conteúdo.
 */
export const SITES: Site[] = (rawSites as unknown[]).map((s, i) => {
  const parsed = siteSchema.safeParse(s);
  if (!parsed.success) {
    const id = (s as { id?: string }).id ?? `#${i}`;
    throw new Error(
      `sites.json: entrada "${id}" inválida:\n` +
        parsed.error.issues.map((x) => `  - ${x.path.join('.')}: ${x.message}`).join('\n'),
    );
  }
  return parsed.data;
});

export const ENABLED_SITES: Site[] = SITES.filter((s) => s.enabled);
