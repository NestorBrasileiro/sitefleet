import { ENABLED_SITES } from '@fleet/sites';

/** Healthcheck do container. Não toca no disco: só confirma que o app subiu. */
export function GET() {
  return Response.json({ ok: true, sites: ENABLED_SITES.length, at: new Date().toISOString() });
}
