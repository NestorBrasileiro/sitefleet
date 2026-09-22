import type { Site } from '@fleet/sites';

/**
 * O tema de cada site vira custom properties no <html>. É isso que deixa um
 * único build servir 10 marcas diferentes: nenhum CSS por site, só valores.
 */
export function ThemeVars({ site }: { site: Site }) {
  const t = site.theme;
  const css = `
:root{
  --accent:${t.accent};--accent-fg:${t.accentFg};
  --bg:${t.bg};--fg:${t.fg};
  --fg-muted:color-mix(in oklab, ${t.fg} 62%, ${t.bg});
  --line:color-mix(in oklab, ${t.fg} 14%, ${t.bg});
  --surface:color-mix(in oklab, ${t.fg} 4%, ${t.bg});
  --font-body:${t.font === 'serif' ? 'var(--font-serif)' : 'var(--font-sans)'};
}
@media (prefers-color-scheme: dark){
  :root{
    --bg:${t.bgDark};--fg:${t.fgDark};
    --fg-muted:color-mix(in oklab, ${t.fgDark} 60%, ${t.bgDark});
    --line:color-mix(in oklab, ${t.fgDark} 18%, ${t.bgDark});
    --surface:color-mix(in oklab, ${t.fgDark} 7%, ${t.bgDark});
  }
}`.trim();
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
