import type { Locale, Site } from '@fleet/sites';

type Page = { title: string; blocks: { h?: string; p: string[] }[] };

/**
 * Sobre / Contato / Privacidade.
 *
 * O AdSense reprova domínio sem política de privacidade que mencione cookies de
 * terceiros e o uso de dados por parceiros de anúncio, e sem uma forma de
 * contato. Gerado a partir do registry para não existir site da frota sem isso.
 */
export function legalPage(kind: 'sobre' | 'contato' | 'privacidade', site: Site, locale: Locale): Page {
  const name = site.name[locale] ?? site.id;
  const tagline = site.tagline[locale] ?? '';
  const { owner, email } = site.legal;
  const pt = locale === 'pt-BR';

  if (kind === 'sobre') {
    return pt
      ? {
          title: `Sobre o ${name}`,
          blocks: [
            { p: [`${name} publica guias práticos e testados. ${tagline}`] },
            {
              h: 'Como escrevemos',
              p: [
                'Cada artigo parte de uma pergunta concreta e responde direto, sem enrolação. Quando recomendamos um produto, explicamos o critério.',
                'Artigos são revisados e a data de atualização fica visível no topo.',
              ],
            },
            { h: 'Quem mantém', p: [`Editado por ${owner}. Fale com a gente em ${email}.`] },
          ],
        }
      : {
          title: `About ${name}`,
          blocks: [
            { p: [`${name} publishes practical, tested guides. ${tagline}`] },
            {
              h: 'How we write',
              p: [
                'Every article starts from a concrete question and answers it directly. When we recommend a product, we explain the criteria.',
                'Articles get reviewed, and the update date stays visible at the top.',
              ],
            },
            { h: 'Who runs it', p: [`Edited by ${owner}. Reach us at ${email}.`] },
          ],
        };
  }

  if (kind === 'contato') {
    return pt
      ? {
          title: 'Contato',
          blocks: [
            { p: [`Escreva para ${email}. Respondemos correções, sugestões de pauta e pedidos de remoção.`] },
            { h: 'Correções', p: ['Achou um erro? Mande o link e o trecho. Corrigimos e registramos a data.'] },
          ],
        }
      : {
          title: 'Contact',
          blocks: [
            { p: [`Write to ${email}. We answer corrections, topic suggestions and removal requests.`] },
            { h: 'Corrections', p: ['Spotted an error? Send the link and the passage. We fix it and log the date.'] },
          ],
        };
  }

  return pt
    ? {
        title: 'Política de Privacidade',
        blocks: [
          { p: [`Esta política vale para ${site.domain}, operado por ${owner}.`] },
          {
            h: 'Dados que coletamos',
            p: [
              'Não pedimos cadastro nem coletamos nome, CPF ou endereço. Guardamos um cookie com sua escolha de idioma e outro com sua decisão sobre cookies de publicidade.',
              'Medimos tráfego de forma agregada, sem identificar visitantes individualmente.',
            ],
          },
          {
            h: 'Publicidade e cookies de terceiros',
            p: [
              'Este site exibe anúncios do Google AdSense. O Google e seus parceiros usam cookies para exibir anúncios com base em visitas anteriores suas a este e a outros sites.',
              'Você pode desativar a publicidade personalizada nas Configurações de anúncios do Google. Se recusar o consentimento no banner, continuamos exibindo anúncios, porém não personalizados.',
            ],
          },
          {
            h: 'Seus direitos (LGPD/GDPR)',
            p: [
              `Você pode pedir acesso, correção ou exclusão de qualquer dado, e revogar o consentimento a qualquer momento, pelo e-mail ${email}.`,
              'Para revogar o consentimento de cookies, apague os cookies deste site no seu navegador; o banner aparecerá de novo.',
            ],
          },
        ],
      }
    : {
        title: 'Privacy Policy',
        blocks: [
          { p: [`This policy covers ${site.domain}, operated by ${owner}.`] },
          {
            h: 'What we collect',
            p: [
              'No account, no name or address. We store one cookie with your language choice and one with your advertising-cookie decision.',
              'Traffic is measured in aggregate, without identifying individual visitors.',
            ],
          },
          {
            h: 'Advertising and third-party cookies',
            p: [
              'This site shows Google AdSense ads. Google and its partners use cookies to serve ads based on your prior visits to this and other websites.',
              'You can opt out of personalised advertising in Google Ads Settings. If you decline consent in the banner, ads keep running but are not personalised.',
            ],
          },
          {
            h: 'Your rights (GDPR/LGPD)',
            p: [
              `You can request access, correction or deletion of any data, and withdraw consent at any time, at ${email}.`,
              'To withdraw cookie consent, clear this site’s cookies in your browser; the banner will reappear.',
            ],
          },
        ],
      };
}
