import type { Lang } from './routes';

export type Translations = {
  nav: {
    home: string;
    news: string;
    team: string;
    matches: string;
    gallery: string;
    sponsors: string;
    join: string;
    donate: string;
    contact: string;
  };
  buttons: {
    copy: string;
    copied: string;
    submit: string;
    learn_more: string;
    donate: string;
    sponsor: string;
    read_more: string;
  };
  empty: {
    no_news: string;
    no_matches: string;
    no_players: string;
    no_staff: string;
    no_sponsors: string;
    no_gallery: string;
    no_standings: string;
  };
  labels: {
    coming_soon: string;
    upcoming: string;
    completed: string;
    home_match: string;
    away_match: string;
    position: string;
    jersey: string;
    matches_played: string;
    goals: string;
    assists: string;
    yellow_cards: string;
    red_cards: string;
    minutes: string;
    sponsor_inquiry: string;
    paypal_unavailable: string;
    prefer_email: string;
    fallback_email: string;
    other_lang: string;
  };
  meta: {
    site_name: string;
    site_description: string;
  };
};

export async function getTranslations(lang: Lang): Promise<Translations> {
  const { getEntry } = await import('astro:content');
  const entry = await getEntry('translations', 'translations');
  if (!entry) {
    throw new Error('translations.yml singleton missing — see content/translations.yml');
  }
  return (entry.data as { translations: Record<Lang, Translations> }).translations[lang];
}
