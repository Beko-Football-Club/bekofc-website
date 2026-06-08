export type Lang = 'fr' | 'en';
export type PageKey =
  | 'home'
  | 'news'
  | 'team'
  | 'matches'
  | 'gallery'
  | 'sponsors'
  | 'join'
  | 'donate'
  | 'contact'
  | 'privacy';

const SLUGS: Record<PageKey, Record<Lang, string>> = {
  home:     { fr: '',                en: '' },
  news:     { fr: 'actualites',      en: 'news' },
  team:     { fr: 'equipe',          en: 'team' },
  matches:  { fr: 'matchs',          en: 'matches' },
  gallery:  { fr: 'galerie',         en: 'gallery' },
  sponsors: { fr: 'partenaires',     en: 'sponsors' },
  join:     { fr: 'rejoindre',       en: 'join' },
  donate:   { fr: 'don',             en: 'donate' },
  contact:  { fr: 'contact',         en: 'contact' },
  privacy:  { fr: 'confidentialite', en: 'privacy' },
};

export function routeFor(page: PageKey, lang: Lang): string {
  const slug = SLUGS[page][lang];
  return slug ? `/${lang}/${slug}` : `/${lang}`;
}

export function equivalentRoute(currentPath: string, otherLang: Lang): string {
  const cleaned = currentPath.replace(/\/+$/, '');
  const segments = cleaned.split('/').filter(Boolean);

  if (segments.length === 0 || (segments.length === 1 && (segments[0] === 'fr' || segments[0] === 'en'))) {
    return `/${otherLang}/`;
  }

  const currentLang: Lang | null =
    segments[0] === 'fr' ? 'fr' : segments[0] === 'en' ? 'en' : null;
  if (!currentLang) {
    return `/${otherLang}/`;
  }

  const topSlug = segments[1];
  const detailSlug = segments[2];

  for (const [key, langs] of Object.entries(SLUGS)) {
    if (langs[currentLang] === topSlug) {
      const otherTop = langs[otherLang];
      if (!otherTop) return `/${otherLang}/`;
      return detailSlug
        ? `/${otherLang}/${otherTop}/${detailSlug}/`
        : `/${otherLang}/${otherTop}/`;
    }
  }

  return `/${otherLang}/`;
}
