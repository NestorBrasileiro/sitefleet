import type { Locale } from '@fleet/sites';

/** Strings de UI. Conteúdo de artigo vem do MDX, não daqui. */
const en = {
  'nav.home': 'Home',
  'nav.articles': 'Articles',
  'nav.about': 'About',
  'nav.contact': 'Contact',
  'nav.privacy': 'Privacy',
  'home.latest': 'Latest articles',
  'home.readMore': 'Read more',
  'article.updated': 'Updated',
  'article.readingTime': '{n} min read',
  'article.related': 'Related articles',
  'article.toc': 'On this page',
  'category.title': 'Category: {name}',
  'category.empty': 'Nothing published here yet.',
  'search.placeholder': 'Search articles',
  'search.empty': 'No articles matched.',
  'notFound.title': 'Page not found',
  'notFound.body': 'That page does not exist. Try the latest articles.',
  'consent.text': 'We use cookies for ads and traffic measurement.',
  'consent.accept': 'Accept',
  'consent.reject': 'Reject',
  'consent.learn': 'Privacy policy',
  'ads.placeholder': 'Ad slot',
  'footer.rights': 'All rights reserved.',
  'footer.disclosure': 'This site is supported by advertising.',
  'lang.switch': 'Language',
} as const;

export type MessageKey = keyof typeof en;

const ptBR: Record<MessageKey, string> = {
  'nav.home': 'Início',
  'nav.articles': 'Artigos',
  'nav.about': 'Sobre',
  'nav.contact': 'Contato',
  'nav.privacy': 'Privacidade',
  'home.latest': 'Últimos artigos',
  'home.readMore': 'Ler mais',
  'article.updated': 'Atualizado em',
  'article.readingTime': '{n} min de leitura',
  'article.related': 'Artigos relacionados',
  'article.toc': 'Nesta página',
  'category.title': 'Categoria: {name}',
  'category.empty': 'Nada publicado aqui ainda.',
  'search.placeholder': 'Buscar artigos',
  'search.empty': 'Nenhum artigo encontrado.',
  'notFound.title': 'Página não encontrada',
  'notFound.body': 'Essa página não existe. Veja os últimos artigos.',
  'consent.text': 'Usamos cookies para anúncios e medição de tráfego.',
  'consent.accept': 'Aceitar',
  'consent.reject': 'Recusar',
  'consent.learn': 'Política de privacidade',
  'ads.placeholder': 'Espaço de anúncio',
  'footer.rights': 'Todos os direitos reservados.',
  'footer.disclosure': 'Este site é mantido por publicidade.',
  'lang.switch': 'Idioma',
};

const DICTS: Record<Locale, Record<MessageKey, string>> = { en, 'pt-BR': ptBR };

/** Tradutor. Interpola {chave} a partir de `vars`. */
export function getT(locale: Locale) {
  const dict = DICTS[locale] ?? en;
  return function t(key: MessageKey, vars?: Record<string, string | number>): string {
    const raw = dict[key] ?? en[key] ?? key;
    if (!vars) return raw;
    return raw.replace(/\{(\w+)\}/g, (m, k: string) => String(vars[k] ?? m));
  };
}

export type T = ReturnType<typeof getT>;

/** Para <html lang> e Intl. */
export const HTML_LANG: Record<Locale, string> = { en: 'en', 'pt-BR': 'pt-BR' };

export function formatDate(date: string | Date, locale: Locale): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(HTML_LANG[locale] ?? 'en', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(d);
}
