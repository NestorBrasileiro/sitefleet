import { z } from 'zod';

/** Locales suportados em toda a frota. Adicione aqui antes de usar em um site. */
export const LOCALES = ['en', 'pt-BR'] as const;
export type Locale = (typeof LOCALES)[number];

export const localeSchema = z.enum(LOCALES);

/** Tema = variáveis CSS injetadas no <html>. Sem rebuild por site. */
export const themeSchema = z.object({
  accent: z.string(),
  accentFg: z.string().default('#ffffff'),
  bg: z.string().default('#ffffff'),
  fg: z.string().default('#111827'),
  bgDark: z.string().default('#0b0f19'),
  fgDark: z.string().default('#e5e7eb'),
  font: z.enum(['sans', 'serif']).default('sans'),
});
export type Theme = z.infer<typeof themeSchema>;

export const adsSchema = z.object({
  /** ca-pub-XXXXXXXXXXXXXXXX. Vazio = anúncios desligados (placeholder no lugar). */
  adsenseClient: z.string().default(''),
  /** IDs dos slots criados no painel do AdSense. */
  slots: z
    .object({
      header: z.string().default(''),
      inArticle: z.string().default(''),
      sidebar: z.string().default(''),
      footer: z.string().default(''),
    })
    .prefault({}),
  /** Linhas extras de ads.txt (ex.: revendedores diretos além do AdSense). */
  extraAdsTxt: z.array(z.string()).default([]),
});
export type Ads = z.infer<typeof adsSchema>;

export const siteSchema = z.object({
  /** Slug interno. Também é o nome da pasta em content/<id>/. */
  id: z.string().regex(/^[a-z0-9-]+$/),
  /** Domínio canônico, sem protocolo. */
  domain: z.string(),
  /** Hosts extras que resolvem para este site (www, staging, localhost:3000). */
  aliases: z.array(z.string()).default([]),
  /** Nome exibido. Por locale, com fallback para o primeiro locale. */
  name: z.record(z.string(), z.string()),
  tagline: z.record(z.string(), z.string()),
  /** Locales que ESTE site publica. O detector nunca manda para um locale ausente. */
  locales: z.array(localeSchema).min(1),
  defaultLocale: localeSchema,
  theme: themeSchema,
  ads: adsSchema.prefault({}),
  /** Usado em páginas legais e no rodapé — AdSense exige contato + política. */
  legal: z.object({
    owner: z.string(),
    email: z.string(),
    country: z.string().default('BR'),
  }),
  /** Analytics self-hosted (Plausible/Umami). Vazio = desligado. */
  analyticsScript: z.string().default(''),
  /** false = fora do build e do Caddyfile. Útil para preparar site antes do domínio. */
  enabled: z.boolean().default(true),
})
  .refine((s) => s.locales.includes(s.defaultLocale), {
    message: 'defaultLocale precisa estar em locales',
    path: ['defaultLocale'],
  })
  .refine((s) => s.locales.every((l) => s.name[l] && s.tagline[l]), {
    message: 'todo locale listado precisa de name e tagline',
    path: ['name'],
  });

export type Site = z.infer<typeof siteSchema>;
