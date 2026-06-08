# BEKO FC Website — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the bilingual "Coming soon" placeholder with the full Phase 1 site — all 10 pages in FR/EN, brand-styled around the BEKO FC logo, driven from Astro content collections seeded with real assets, with working interactivity (lang switcher, lightbox, copy buttons, contact form), full SEO meta, and CI quality gates. CMS auth, GA4, and CookieYes are explicitly deferred.

**Architecture:** Astro 5 with built-in i18n; single `[lang]/` dynamic segment with bilingual URL slugs from a route map; content lives at repo root under `content/` (Astro's `contentDir: '../content'`) so the deferred CMS can later edit the same files; pure server-rendered pages with tiny vanilla JS islands for the four interactions. No React, no Tailwind, no framework dependencies added beyond `@astrojs/sitemap`, `vitest`, and `@lhci/cli`.

**Tech Stack:** Astro 5, TypeScript (strict), Zod content schemas, vitest, lychee link checker, Lighthouse CI, AWS S3 + CloudFront (existing infra), GitHub Actions OIDC (existing).

**Spec reference:** `docs/superpowers/specs/2026-06-08-bekofc-website-phase1-implementation-design.md`

---

## Phase A — Foundation (i18n routes, content schemas, layouts, vitest)

### Task A1: Install new dependencies

**Files:**
- Modify: `site/package.json`
- Modify: `site/package-lock.json` (regenerated)

- [ ] **Step 1: Add new dev/runtime dependencies**

Run from `site/` directory:

```bash
cd site && npm install --save @astrojs/sitemap@^3 && npm install --save-dev vitest@^2 @vitest/ui@^2
```

Expected: `package.json` now lists `@astrojs/sitemap` under `dependencies` and `vitest`, `@vitest/ui` under `devDependencies`.

- [ ] **Step 2: Add test scripts to `site/package.json`**

Open `site/package.json`, add to the `"scripts"` object:

```json
    "test": "vitest run",
    "test:watch": "vitest"
```

Final `scripts` object should contain `dev`, `build`, `check`, `preview`, `astro`, `test`, `test:watch`.

- [ ] **Step 3: Verify install**

Run: `cd site && npx vitest --version`
Expected: prints a version like `2.x.x`

- [ ] **Step 4: Commit**

```bash
git add site/package.json site/package-lock.json
git commit -m "chore(site): add sitemap, vitest deps for phase 1"
```

---

### Task A2: Create vitest config

**Files:**
- Create: `site/vitest.config.ts`

- [ ] **Step 1: Write the config**

Create `site/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    globals: false,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
```

- [ ] **Step 2: Verify config loads**

Run: `cd site && npx vitest run --reporter=basic`
Expected: `No test files found, exiting with code 1` — config loaded but no tests yet. This is correct.

- [ ] **Step 3: Commit**

```bash
git add site/vitest.config.ts
git commit -m "chore(site): vitest config"
```

---

### Task A3: Build i18n route map (TDD)

**Files:**
- Create: `site/src/i18n/routes.ts`
- Test: `site/src/i18n/routes.test.ts`

- [ ] **Step 1: Write the failing test**

Create `site/src/i18n/routes.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { routeFor, equivalentRoute, type Lang, type PageKey } from './routes';

describe('routeFor', () => {
  it('returns FR slug for FR pages', () => {
    expect(routeFor('news', 'fr')).toBe('/fr/actualites');
    expect(routeFor('team', 'fr')).toBe('/fr/equipe');
    expect(routeFor('matches', 'fr')).toBe('/fr/matchs');
    expect(routeFor('gallery', 'fr')).toBe('/fr/galerie');
    expect(routeFor('sponsors', 'fr')).toBe('/fr/partenaires');
    expect(routeFor('join', 'fr')).toBe('/fr/rejoindre');
    expect(routeFor('donate', 'fr')).toBe('/fr/don');
    expect(routeFor('contact', 'fr')).toBe('/fr/contact');
    expect(routeFor('privacy', 'fr')).toBe('/fr/confidentialite');
    expect(routeFor('home', 'fr')).toBe('/fr');
  });

  it('returns EN slug for EN pages', () => {
    expect(routeFor('news', 'en')).toBe('/en/news');
    expect(routeFor('team', 'en')).toBe('/en/team');
    expect(routeFor('matches', 'en')).toBe('/en/matches');
    expect(routeFor('gallery', 'en')).toBe('/en/gallery');
    expect(routeFor('sponsors', 'en')).toBe('/en/sponsors');
    expect(routeFor('join', 'en')).toBe('/en/join');
    expect(routeFor('donate', 'en')).toBe('/en/donate');
    expect(routeFor('contact', 'en')).toBe('/en/contact');
    expect(routeFor('privacy', 'en')).toBe('/en/privacy');
    expect(routeFor('home', 'en')).toBe('/en');
  });
});

describe('equivalentRoute', () => {
  it('maps FR home to EN home', () => {
    expect(equivalentRoute('/fr/', 'en')).toBe('/en/');
    expect(equivalentRoute('/fr', 'en')).toBe('/en/');
  });

  it('maps FR top-level pages to EN equivalents', () => {
    expect(equivalentRoute('/fr/actualites/', 'en')).toBe('/en/news/');
    expect(equivalentRoute('/fr/equipe/', 'en')).toBe('/en/team/');
    expect(equivalentRoute('/fr/matchs/', 'en')).toBe('/en/matches/');
    expect(equivalentRoute('/fr/galerie/', 'en')).toBe('/en/gallery/');
    expect(equivalentRoute('/fr/partenaires/', 'en')).toBe('/en/sponsors/');
    expect(equivalentRoute('/fr/rejoindre/', 'en')).toBe('/en/join/');
    expect(equivalentRoute('/fr/don/', 'en')).toBe('/en/donate/');
    expect(equivalentRoute('/fr/contact/', 'en')).toBe('/en/contact/');
    expect(equivalentRoute('/fr/confidentialite/', 'en')).toBe('/en/privacy/');
  });

  it('maps EN top-level pages to FR equivalents', () => {
    expect(equivalentRoute('/en/news/', 'fr')).toBe('/fr/actualites/');
    expect(equivalentRoute('/en/team/', 'fr')).toBe('/fr/equipe/');
    expect(equivalentRoute('/en/privacy/', 'fr')).toBe('/fr/confidentialite/');
  });

  it('preserves news detail slug across locales', () => {
    expect(equivalentRoute('/fr/actualites/match-vs-yaounde/', 'en')).toBe('/en/news/match-vs-yaounde/');
    expect(equivalentRoute('/en/news/match-vs-yaounde/', 'fr')).toBe('/fr/actualites/match-vs-yaounde/');
  });

  it('falls back to other-lang home for unknown routes', () => {
    expect(equivalentRoute('/fr/unknown-path/', 'en')).toBe('/en/');
    expect(equivalentRoute('/some-stray-path', 'en')).toBe('/en/');
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

Run: `cd site && npx vitest run src/i18n/routes.test.ts`
Expected: FAIL — `Cannot find module './routes'`

- [ ] **Step 3: Implement `routes.ts`**

Create `site/src/i18n/routes.ts`:

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd site && npx vitest run src/i18n/routes.test.ts`
Expected: PASS — all tests green.

- [ ] **Step 5: Commit**

```bash
git add site/src/i18n/routes.ts site/src/i18n/routes.test.ts
git commit -m "feat(i18n): bilingual route map with equivalent-route helper"
```

---

### Task A4: Build translations helper

**Files:**
- Create: `site/src/i18n/t.ts`

- [ ] **Step 1: Implement the helper**

Create `site/src/i18n/t.ts`:

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add site/src/i18n/t.ts
git commit -m "feat(i18n): translations helper reading from content collection"
```

---

### Task A5: Update astro.config.mjs to read content from repo root

**Files:**
- Modify: `site/astro.config.mjs`

- [ ] **Step 1: Add sitemap and content path config**

Replace the entire content of `site/astro.config.mjs`:

```javascript
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://bekofc.com',
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr', 'en'],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: true,
    },
  },
  build: {
    format: 'directory',
  },
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'fr',
        locales: { fr: 'fr-FR', en: 'en-US' },
      },
    }),
  ],
});
```

- [ ] **Step 2: Verify config loads**

Run: `cd site && npx astro check`
Expected: completes (may have other errors from missing content collection files, but not from config syntax).

- [ ] **Step 3: Commit**

```bash
git add site/astro.config.mjs
git commit -m "feat(site): wire @astrojs/sitemap with i18n config"
```

---

### Task A6: Define content collection schemas

**Files:**
- Create: `site/src/content/config.ts`

- [ ] **Step 1: Write the schemas**

Create `site/src/content/config.ts`:

```typescript
import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

const CONTENT_ROOT = '../content';

const settings = defineCollection({
  loader: file(`${CONTENT_ROOT}/settings.yml`),
  schema: z.object({
    team_name: z.object({ fr: z.string(), en: z.string() }),
    tagline: z.object({ fr: z.string(), en: z.string() }),
    contact_email: z.string().email(),
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
    facebook_url: z.string().url().optional(),
    instagram_url: z.string().url().optional(),
    momo_number: z.string().optional(),
    orange_money_number: z.string().optional(),
    paypal_link: z.string().url().optional(),
    sponsor_inquiry_email: z.string().email(),
    default_og_image: z.string().default('/uploads/logo-og.png'),
    web3forms_access_key: z.string().optional(),
  }),
});

const sponsorTiers = defineCollection({
  loader: file(`${CONTENT_ROOT}/sponsor-tiers.yml`),
  schema: z.object({
    tiers: z.array(
      z.object({
        slug: z.enum(['principal', 'officiel', 'supporter']),
        name: z.object({ fr: z.string(), en: z.string() }),
        price: z.object({ fr: z.string(), en: z.string() }),
        benefits: z.object({
          fr: z.array(z.string()),
          en: z.array(z.string()),
        }),
        prominence: z.number().int(),
      })
    ),
  }),
});

const translations = defineCollection({
  loader: file(`${CONTENT_ROOT}/translations.yml`),
  schema: z.object({
    translations: z.object({
      fr: z.record(z.record(z.string())),
      en: z.record(z.record(z.string())),
    }),
  }),
});

const pages = defineCollection({
  loader: glob({ base: `${CONTENT_ROOT}/pages`, pattern: '**/*.md' }),
  schema: z.object({
    title: z.object({ fr: z.string(), en: z.string() }),
    hero_headline: z.object({ fr: z.string(), en: z.string() }).optional(),
    hero_subhead: z.object({ fr: z.string(), en: z.string() }).optional(),
    hero_image: z.string().optional(),
    body_fr: z.string().optional(),
    body_en: z.string().optional(),
    sections: z
      .array(
        z.object({
          heading: z.object({ fr: z.string(), en: z.string() }),
          body: z.object({ fr: z.string(), en: z.string() }),
        })
      )
      .optional(),
  }),
});

const news = defineCollection({
  loader: glob({ base: `${CONTENT_ROOT}/news`, pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    date: z.coerce.date(),
    lang: z.enum(['fr', 'en']),
    hero_image: z.string().optional(),
    author: z.string().optional(),
    tags: z.array(z.string()).optional(),
    status: z.enum(['draft', 'published']).default('published'),
  }),
});

const players = defineCollection({
  loader: glob({ base: `${CONTENT_ROOT}/players`, pattern: '**/*.md' }),
  schema: z.object({
    name: z.string(),
    position: z.enum(['GK', 'DF', 'MF', 'FW']),
    jersey_number: z.number().int().min(1).max(99),
    photo: z.string().optional(),
    bio_fr: z.string().optional(),
    bio_en: z.string().optional(),
    status: z.enum(['active', 'former']).default('active'),
    display_order: z.number().int().default(99),
  }),
});

const staff = defineCollection({
  loader: glob({ base: `${CONTENT_ROOT}/staff`, pattern: '**/*.md' }),
  schema: z.object({
    name: z.string(),
    role_fr: z.string(),
    role_en: z.string(),
    photo: z.string().optional(),
    bio_fr: z.string().optional(),
    bio_en: z.string().optional(),
    display_order: z.number().int().default(99),
  }),
});

const matches = defineCollection({
  loader: glob({ base: `${CONTENT_ROOT}/matches`, pattern: '**/*.md' }),
  schema: z.object({
    date: z.coerce.date(),
    kickoff: z.string().optional(),
    opponent: z.string(),
    home_or_away: z.enum(['home', 'away']),
    location: z.string(),
    status: z.enum(['upcoming', 'completed']),
    beko_score: z.number().int().nonnegative().optional(),
    opponent_score: z.number().int().nonnegative().optional(),
    recap_fr: z.string().optional(),
    recap_en: z.string().optional(),
    related_news: z.string().optional(),
    player_stats: z
      .array(
        z.object({
          player_id: z.string(),
          started: z.boolean().default(false),
          minutes_played: z.number().int().min(0).max(120).default(0),
          goals: z.number().int().nonnegative().default(0),
          assists: z.number().int().nonnegative().default(0),
          yellow_cards: z.number().int().min(0).max(2).default(0),
          red_cards: z.number().int().min(0).max(1).default(0),
        })
      )
      .optional(),
  }),
});

const sponsors = defineCollection({
  loader: glob({ base: `${CONTENT_ROOT}/sponsors`, pattern: '**/*.md' }),
  schema: z.object({
    name: z.string(),
    logo: z.string().optional(),
    website: z.string().url().optional(),
    tier: z.enum(['principal', 'officiel', 'supporter']),
    active: z.boolean().default(true),
    display_order: z.number().int().default(99),
  }),
});

const standings = defineCollection({
  loader: glob({ base: `${CONTENT_ROOT}/standings`, pattern: '**/*.yml' }),
  schema: z.object({
    position: z.number().int().min(1),
    team: z.string(),
    played: z.number().int().nonnegative(),
    won: z.number().int().nonnegative(),
    drawn: z.number().int().nonnegative(),
    lost: z.number().int().nonnegative(),
    goals_for: z.number().int().nonnegative(),
    goals_against: z.number().int().nonnegative(),
    goal_difference: z.number().int(),
    points: z.number().int().nonnegative(),
    is_beko: z.boolean().default(false),
  }),
});

const gallery = defineCollection({
  loader: glob({ base: `${CONTENT_ROOT}/gallery`, pattern: '**/*.yml' }),
  schema: z.object({
    type: z.enum(['image', 'video']),
    src: z.string(),
    poster: z.string().optional(),
    caption_fr: z.string().optional(),
    caption_en: z.string().optional(),
    album: z.string().optional(),
    date: z.coerce.date().optional(),
    display_order: z.number().int().default(99),
  }),
});

export const collections = {
  settings,
  'sponsor-tiers': sponsorTiers,
  translations,
  pages,
  news,
  players,
  staff,
  matches,
  sponsors,
  standings,
  gallery,
};
```

- [ ] **Step 2: Commit**

```bash
git add site/src/content/config.ts
git commit -m "feat(content): zod schemas for all collections + singletons"
```

---

### Task A7: Seed minimal singleton content files (so the build doesn't fail)

**Files:**
- Create: `content/settings.yml`
- Create: `content/sponsor-tiers.yml`
- Create: `content/translations.yml`

- [ ] **Step 1: Write `content/settings.yml`**

Create `content/settings.yml`:

```yaml
team_name:
  fr: "BEKO FC"
  en: "BEKO FC"
tagline:
  fr: "Beko Football de Douala — fierté féminine du foot camerounais"
  en: "Beko Football de Douala — pride of Cameroonian women's football"
contact_email: "contact@bekofc.com"
phone: ""
whatsapp: ""
facebook_url: ""
instagram_url: ""
momo_number: "+237 6XX XXX XXX"
orange_money_number: "+237 6XX XXX XXX"
paypal_link: ""
sponsor_inquiry_email: "contact@bekofc.com"
default_og_image: "/uploads/logo-og.png"
web3forms_access_key: ""
```

- [ ] **Step 2: Write `content/sponsor-tiers.yml`**

Create `content/sponsor-tiers.yml`:

```yaml
tiers:
  - slug: principal
    name:
      fr: "Partenaire Principal"
      en: "Principal Partner"
    price:
      fr: "Sur devis"
      en: "On request"
    benefits:
      fr:
        - "Logo principal sur le maillot"
        - "Présence sur toutes les communications officielles"
        - "Mention prioritaire sur le site web et les réseaux sociaux"
        - "Espace VIP aux matchs à domicile"
      en:
        - "Primary logo on team jersey"
        - "Presence on all official communications"
        - "Priority mention on website and social media"
        - "VIP space at home matches"
    prominence: 1
  - slug: officiel
    name:
      fr: "Partenaire Officiel"
      en: "Official Partner"
    price:
      fr: "Sur devis"
      en: "On request"
    benefits:
      fr:
        - "Logo sur les supports de communication"
        - "Mention sur le site web et les réseaux sociaux"
        - "Invitations aux matchs à domicile"
      en:
        - "Logo on communication materials"
        - "Mention on website and social media"
        - "Invitations to home matches"
    prominence: 2
  - slug: supporter
    name:
      fr: "Supporter"
      en: "Supporter"
    price:
      fr: "Sur devis"
      en: "On request"
    benefits:
      fr:
        - "Mention sur le site web"
        - "Reconnaissance dans les communications annuelles"
      en:
        - "Mention on website"
        - "Recognition in annual communications"
    prominence: 3
```

- [ ] **Step 3: Write `content/translations.yml`**

Create `content/translations.yml`:

```yaml
translations:
  fr:
    nav:
      home: "Accueil"
      news: "Actualités"
      team: "L'Équipe"
      matches: "Matchs"
      gallery: "Galerie"
      sponsors: "Partenaires"
      join: "Rejoindre"
      donate: "Faire un don"
      contact: "Contact"
    buttons:
      copy: "Copier"
      copied: "Copié !"
      submit: "Envoyer"
      learn_more: "En savoir plus"
      donate: "Faire un don"
      sponsor: "Devenir partenaire"
      read_more: "Lire la suite"
    empty:
      no_news: "Pas encore d'actualités. Revenez bientôt."
      no_matches: "Calendrier à venir."
      no_players: "L'effectif sera publié prochainement."
      no_staff: "Le staff sera publié prochainement."
      no_sponsors: "Devenez notre premier partenaire — contactez-nous."
      no_gallery: "Photos et vidéos à venir."
      no_standings: "Classement à venir."
    labels:
      coming_soon: "Bientôt disponible"
      upcoming: "À venir"
      completed: "Terminé"
      home_match: "Domicile"
      away_match: "Extérieur"
      position: "Poste"
      jersey: "Numéro"
      matches_played: "Matchs joués"
      goals: "Buts"
      assists: "Passes décisives"
      yellow_cards: "Cartons jaunes"
      red_cards: "Cartons rouges"
      minutes: "Minutes jouées"
      sponsor_inquiry: "Devenir partenaire"
      paypal_unavailable: "Les dons internationaux sont temporairement indisponibles. Contactez-nous."
      prefer_email: "Préférez l'email direct ?"
      fallback_email: "Envoyer un email"
      other_lang: "English"
    meta:
      site_name: "BEKO FC"
      site_description: "Site officiel de Beko Football de Douala — équipe féminine de football basée à Douala, Cameroun."
  en:
    nav:
      home: "Home"
      news: "News"
      team: "The Team"
      matches: "Matches"
      gallery: "Gallery"
      sponsors: "Sponsors"
      join: "Join"
      donate: "Donate"
      contact: "Contact"
    buttons:
      copy: "Copy"
      copied: "Copied!"
      submit: "Send"
      learn_more: "Learn more"
      donate: "Donate"
      sponsor: "Become a sponsor"
      read_more: "Read more"
    empty:
      no_news: "No news yet. Check back soon."
      no_matches: "Schedule coming soon."
      no_players: "Roster to be published soon."
      no_staff: "Staff to be published soon."
      no_sponsors: "Be our first sponsor — contact us."
      no_gallery: "Photos and videos coming soon."
      no_standings: "Standings coming soon."
    labels:
      coming_soon: "Coming soon"
      upcoming: "Upcoming"
      completed: "Completed"
      home_match: "Home"
      away_match: "Away"
      position: "Position"
      jersey: "Number"
      matches_played: "Matches played"
      goals: "Goals"
      assists: "Assists"
      yellow_cards: "Yellow cards"
      red_cards: "Red cards"
      minutes: "Minutes played"
      sponsor_inquiry: "Become a sponsor"
      paypal_unavailable: "International donations are temporarily unavailable. Please contact us."
      prefer_email: "Prefer direct email?"
      fallback_email: "Send an email"
      other_lang: "Français"
    meta:
      site_name: "BEKO FC"
      site_description: "Official website of Beko Football de Douala — women's football team based in Douala, Cameroon."
```

- [ ] **Step 4: Verify schemas accept the seed content**

Run: `cd site && npx astro check`
Expected: completes without complaining about `settings`, `sponsor-tiers`, or `translations` collection schema mismatches. (May still complain about missing pages/components — those land later.)

- [ ] **Step 5: Commit**

```bash
git add content/settings.yml content/sponsor-tiers.yml content/translations.yml
git commit -m "feat(content): seed singletons (settings, sponsor tiers, translations)"
```

---

### Task A8: Build stat aggregation helper (TDD)

**Files:**
- Create: `site/src/lib/stats.ts`
- Test: `site/src/lib/stats.test.ts`

- [ ] **Step 1: Write the failing test**

Create `site/src/lib/stats.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { aggregateStats, type MatchInput } from './stats';

const baseMatch: Omit<MatchInput, 'status' | 'player_stats'> = {
  date: new Date('2026-09-15'),
  opponent: 'FC Yaounde',
  home_or_away: 'home',
  location: 'Douala',
};

describe('aggregateStats', () => {
  it('returns empty stats for no matches', () => {
    const result = aggregateStats([]);
    expect(result.byPlayer.size).toBe(0);
    expect(result.byTeam.matches_played).toBe(0);
    expect(result.byTeam.goals_for).toBe(0);
    expect(result.byTeam.goals_against).toBe(0);
  });

  it('ignores upcoming matches', () => {
    const result = aggregateStats([
      {
        ...baseMatch,
        status: 'upcoming',
        player_stats: [{ player_id: 'p1', started: true, minutes_played: 90, goals: 1, assists: 0, yellow_cards: 0, red_cards: 0 }],
      },
    ]);
    expect(result.byPlayer.size).toBe(0);
    expect(result.byTeam.matches_played).toBe(0);
  });

  it('counts a single completed match', () => {
    const result = aggregateStats([
      {
        ...baseMatch,
        status: 'completed',
        beko_score: 2,
        opponent_score: 1,
        player_stats: [
          { player_id: 'p1', started: true, minutes_played: 90, goals: 2, assists: 0, yellow_cards: 1, red_cards: 0 },
          { player_id: 'p2', started: true, minutes_played: 80, goals: 0, assists: 1, yellow_cards: 0, red_cards: 0 },
          { player_id: 'p3', started: false, minutes_played: 0, goals: 0, assists: 0, yellow_cards: 0, red_cards: 0 },
        ],
      },
    ]);
    expect(result.byPlayer.size).toBe(2); // p3 didn't play
    expect(result.byPlayer.get('p1')?.goals).toBe(2);
    expect(result.byPlayer.get('p1')?.matches_played).toBe(1);
    expect(result.byPlayer.get('p1')?.yellow_cards).toBe(1);
    expect(result.byPlayer.get('p2')?.assists).toBe(1);
    expect(result.byPlayer.get('p2')?.minutes_played).toBe(80);
    expect(result.byTeam.matches_played).toBe(1);
    expect(result.byTeam.goals_for).toBe(2);
    expect(result.byTeam.goals_against).toBe(1);
    expect(result.byTeam.wins).toBe(1);
    expect(result.byTeam.draws).toBe(0);
    expect(result.byTeam.losses).toBe(0);
  });

  it('sums across multiple completed matches', () => {
    const result = aggregateStats([
      {
        ...baseMatch,
        status: 'completed',
        beko_score: 2,
        opponent_score: 1,
        player_stats: [
          { player_id: 'p1', started: true, minutes_played: 90, goals: 2, assists: 0, yellow_cards: 0, red_cards: 0 },
        ],
      },
      {
        ...baseMatch,
        status: 'completed',
        beko_score: 0,
        opponent_score: 0,
        player_stats: [
          { player_id: 'p1', started: true, minutes_played: 90, goals: 0, assists: 1, yellow_cards: 0, red_cards: 0 },
        ],
      },
    ]);
    expect(result.byPlayer.get('p1')?.goals).toBe(2);
    expect(result.byPlayer.get('p1')?.assists).toBe(1);
    expect(result.byPlayer.get('p1')?.matches_played).toBe(2);
    expect(result.byTeam.matches_played).toBe(2);
    expect(result.byTeam.wins).toBe(1);
    expect(result.byTeam.draws).toBe(1);
    expect(result.byTeam.losses).toBe(0);
  });

  it('counts a loss', () => {
    const result = aggregateStats([
      {
        ...baseMatch,
        status: 'completed',
        beko_score: 0,
        opponent_score: 3,
        player_stats: [],
      },
    ]);
    expect(result.byTeam.wins).toBe(0);
    expect(result.byTeam.losses).toBe(1);
  });

  it('treats missing player_stats as no players played', () => {
    const result = aggregateStats([
      {
        ...baseMatch,
        status: 'completed',
        beko_score: 1,
        opponent_score: 0,
      },
    ]);
    expect(result.byPlayer.size).toBe(0);
    expect(result.byTeam.matches_played).toBe(1);
    expect(result.byTeam.goals_for).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

Run: `cd site && npx vitest run src/lib/stats.test.ts`
Expected: FAIL — `Cannot find module './stats'`

- [ ] **Step 3: Implement `stats.ts`**

Create `site/src/lib/stats.ts`:

```typescript
export type PlayerMatchStat = {
  player_id: string;
  started: boolean;
  minutes_played: number;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
};

export type MatchInput = {
  date: Date;
  opponent: string;
  home_or_away: 'home' | 'away';
  location: string;
  status: 'upcoming' | 'completed';
  beko_score?: number;
  opponent_score?: number;
  player_stats?: PlayerMatchStat[];
};

export type PlayerStats = {
  player_id: string;
  matches_played: number;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  minutes_played: number;
};

export type TeamStats = {
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
};

export function aggregateStats(matches: MatchInput[]): {
  byPlayer: Map<string, PlayerStats>;
  byTeam: TeamStats;
} {
  const byPlayer = new Map<string, PlayerStats>();
  const byTeam: TeamStats = {
    matches_played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goals_for: 0,
    goals_against: 0,
  };

  for (const m of matches) {
    if (m.status !== 'completed') continue;

    byTeam.matches_played += 1;
    byTeam.goals_for += m.beko_score ?? 0;
    byTeam.goals_against += m.opponent_score ?? 0;
    if ((m.beko_score ?? 0) > (m.opponent_score ?? 0)) byTeam.wins += 1;
    else if ((m.beko_score ?? 0) === (m.opponent_score ?? 0)) byTeam.draws += 1;
    else byTeam.losses += 1;

    for (const ps of m.player_stats ?? []) {
      const played = ps.started || ps.minutes_played > 0;
      if (!played) continue;

      const existing = byPlayer.get(ps.player_id) ?? {
        player_id: ps.player_id,
        matches_played: 0,
        goals: 0,
        assists: 0,
        yellow_cards: 0,
        red_cards: 0,
        minutes_played: 0,
      };

      existing.matches_played += 1;
      existing.goals += ps.goals;
      existing.assists += ps.assists;
      existing.yellow_cards += ps.yellow_cards;
      existing.red_cards += ps.red_cards;
      existing.minutes_played += ps.minutes_played;

      byPlayer.set(ps.player_id, existing);
    }
  }

  return { byPlayer, byTeam };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd site && npx vitest run src/lib/stats.test.ts`
Expected: PASS — all 6 tests green.

- [ ] **Step 5: Commit**

```bash
git add site/src/lib/stats.ts site/src/lib/stats.test.ts
git commit -m "feat(lib): build-time stat aggregation with vitest coverage"
```

---

### Task A9: Create `BaseLayout.astro` with full SEO `<head>`

**Files:**
- Modify: `site/src/layouts/BaseLayout.astro`

- [ ] **Step 1: Replace `BaseLayout.astro` with the full SEO version**

Replace the entire content of `site/src/layouts/BaseLayout.astro`:

```astro
---
import { getEntry } from 'astro:content';
import type { Lang } from '../i18n/routes';
import { equivalentRoute } from '../i18n/routes';

interface Props {
  title: string;
  description?: string;
  lang: Lang;
  ogImage?: string;
  canonicalPath?: string;
  ogType?: 'website' | 'article';
}

const { title, description, lang, ogImage, canonicalPath, ogType = 'website' } = Astro.props;

const settings = await getEntry('settings', 'settings');
const translations = await getEntry('translations', 'translations');
if (!settings) throw new Error('content/settings.yml is missing');
if (!translations) throw new Error('content/translations.yml is missing');

const t = translations.data.translations[lang];
const finalDescription = description ?? t.meta.site_description;
const finalOgImage = ogImage ?? settings.data.default_og_image;
const fullTitle = `${title} — ${t.meta.site_name}`;

const canonical = canonicalPath ?? Astro.url.pathname;
const canonicalUrl = new URL(canonical, Astro.site).toString();
const otherLang: Lang = lang === 'fr' ? 'en' : 'fr';
const otherUrl = new URL(equivalentRoute(Astro.url.pathname, otherLang), Astro.site).toString();
const ogImageUrl = new URL(finalOgImage, Astro.site).toString();
---

<!doctype html>
<html lang={lang}>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>{fullTitle}</title>
    <meta name="description" content={finalDescription} />

    <link rel="canonical" href={canonicalUrl} />
    <link rel="alternate" hreflang={lang} href={canonicalUrl} />
    <link rel="alternate" hreflang={otherLang} href={otherUrl} />
    <link rel="alternate" hreflang="x-default" href={new URL(`/${lang}/`, Astro.site).toString()} />

    <meta property="og:title" content={fullTitle} />
    <meta property="og:description" content={finalDescription} />
    <meta property="og:type" content={ogType} />
    <meta property="og:url" content={canonicalUrl} />
    <meta property="og:image" content={ogImageUrl} />
    <meta property="og:locale" content={lang === 'fr' ? 'fr_FR' : 'en_US'} />
    <meta property="og:site_name" content={t.meta.site_name} />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={fullTitle} />
    <meta name="twitter:description" content={finalDescription} />
    <meta name="twitter:image" content={ogImageUrl} />

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700&display=swap"
    />

    <slot name="head" />
  </head>
  <body>
    <slot />
  </body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add site/src/layouts/BaseLayout.astro
git commit -m "feat(layout): full SEO head in BaseLayout (OG, hreflang, canonical, fonts)"
```

---

### Task A10: Migrate `/fr/` and `/en/` directories to `[lang]/`

**Files:**
- Create: `site/src/pages/[lang]/index.astro`
- Modify: `site/src/pages/index.astro` (already redirects, leave as-is — verify)
- Delete: `site/src/pages/fr/index.astro`
- Delete: `site/src/pages/en/index.astro`

- [ ] **Step 1: Create the dynamic `[lang]/index.astro`**

Create `site/src/pages/[lang]/index.astro`:

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import type { Lang } from '../../i18n/routes';

export function getStaticPaths() {
  return [{ params: { lang: 'fr' } }, { params: { lang: 'en' } }];
}

const lang = Astro.params.lang as Lang;
const title = lang === 'fr' ? 'Accueil' : 'Home';
---

<BaseLayout title={title} lang={lang}>
  <main style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 4rem auto; padding: 0 1rem; text-align: center;">
    <h1 style="font-family: 'Anton', sans-serif;">BEKO FC</h1>
    <p>{lang === 'fr' ? "Site en construction." : "Site under construction."}</p>
    <p><a href={lang === 'fr' ? '/en/' : '/fr/'}>{lang === 'fr' ? 'English' : 'Français'}</a></p>
  </main>
</BaseLayout>
```

- [ ] **Step 2: Verify the existing root redirect still works**

Read `site/src/pages/index.astro` — confirm it returns `Astro.redirect('/fr/')`. (It does per current state; if not, replace its content with `---\nreturn Astro.redirect('/fr/');\n---\n`.)

- [ ] **Step 3: Delete the old static FR/EN directories**

```bash
rm site/src/pages/fr/index.astro
rm site/src/pages/en/index.astro
rmdir site/src/pages/fr site/src/pages/en
```

- [ ] **Step 4: Run a full build to verify**

```bash
cd site && npm run build
```

Expected: build succeeds, `dist/fr/index.html` and `dist/en/index.html` exist.

- [ ] **Step 5: Commit**

```bash
git add site/src/pages/[lang]/index.astro
git rm site/src/pages/fr/index.astro site/src/pages/en/index.astro
git commit -m "refactor(routes): migrate fr/, en/ static dirs to [lang]/ dynamic segment"
```

---

### Task A11: Verify Phase A in browser

- [ ] **Step 1: Start dev server**

Run: `cd site && npm run dev`

- [ ] **Step 2: Manually verify the following URLs return 200 and render placeholder text in Inter font**

- `http://localhost:4321/` → redirects to `/fr/`
- `http://localhost:4321/fr/` → renders FR placeholder, has correct `<title>`, OG meta in `<head>`
- `http://localhost:4321/en/` → renders EN placeholder
- View source: `<link rel="alternate" hreflang="en">` points to `/en/`, JSON-LD/OG tags populated

- [ ] **Step 3: Run `astro check` and `vitest`**

```bash
cd site && npx astro check && npx vitest run
```

Expected: both pass.

- [ ] **Step 4: Commit checkpoint**

If any small fixes were needed in step 2:

```bash
git add -A
git commit -m "chore(phase-a): verify foundation builds and renders"
```

End of Phase A. Foundation laid: routing, schemas, layouts, tests.

---

## Phase A.5 — Brand pass (logo, tokens, fonts)

### Task A5.1: Add asset import script

**Files:**
- Create: `scripts/import-assets.mjs`

- [ ] **Step 1: Write the import script**

Create `scripts/import-assets.mjs`:

```javascript
#!/usr/bin/env node
/**
 * One-shot asset import. Run from repo root: node scripts/import-assets.mjs
 *
 * Inputs (assumed by user setup):
 *   ~/Downloads/BekoFC-LOGO.jpeg                — primary logo
 *   ~/Downloads/Beko-FC/                        — photo + video subfolder
 *
 * Outputs:
 *   site/public/uploads/logo.jpeg               — raster fallback
 *   site/public/uploads/logo.svg                — vectorized (potrace) or PNG-passthrough
 *   site/public/favicon.svg                     — same as logo.svg
 *   site/public/uploads/logo-og.png             — 1200x630 OG image
 *   site/public/uploads/photos/<NN>-<slug>.jpeg — curated 12 gallery photos
 *   site/local-media/<NN>-<slug>.mp4            — video staging (gitignored)
 */
import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';
import { homedir } from 'node:os';
import { execSync } from 'node:child_process';

const HOME = homedir();
const DOWNLOADS = join(HOME, 'Downloads');
const LOGO_SRC = join(DOWNLOADS, 'BekoFC-LOGO.jpeg');
const BEKO_FOLDER = join(DOWNLOADS, 'Beko-FC');

const REPO = process.cwd();
const UPLOADS = join(REPO, 'site', 'public', 'uploads');
const PHOTOS = join(UPLOADS, 'photos');
const FAVICON = join(REPO, 'site', 'public', 'favicon.svg');
const LOCAL_MEDIA = join(REPO, 'site', 'local-media');

mkdirSync(UPLOADS, { recursive: true });
mkdirSync(PHOTOS, { recursive: true });
mkdirSync(LOCAL_MEDIA, { recursive: true });

if (!existsSync(LOGO_SRC)) {
  console.error(`MISSING: ${LOGO_SRC}`);
  process.exit(1);
}
copyFileSync(LOGO_SRC, join(UPLOADS, 'logo.jpeg'));
console.log('✓ logo.jpeg copied');

let svgWritten = false;
try {
  execSync('potrace --version', { stdio: 'ignore' });
  execSync(`potrace --svg -o "${join(UPLOADS, 'logo.svg')}" "${LOGO_SRC}"`, { stdio: 'inherit' });
  copyFileSync(join(UPLOADS, 'logo.svg'), FAVICON);
  svgWritten = true;
  console.log('✓ logo.svg vectorized via potrace');
} catch {
  console.warn('⚠ potrace unavailable — falling back to JPEG favicon link in BaseLayout');
}

if (!svgWritten) {
  copyFileSync(LOGO_SRC, FAVICON.replace(/\.svg$/, '.jpeg'));
  console.log('✓ favicon.jpeg fallback written (update BaseLayout link if needed)');
}

const photos = existsSync(BEKO_FOLDER)
  ? readdirSync(BEKO_FOLDER).filter((f) => /\.(jpe?g|png)$/i.test(f))
  : [];
const videos = existsSync(BEKO_FOLDER)
  ? readdirSync(BEKO_FOLDER).filter((f) => /\.mp4$/i.test(f))
  : [];

photos.slice(0, 12).forEach((f, i) => {
  const dst = join(PHOTOS, `${String(i + 1).padStart(2, '0')}-team.jpeg`);
  copyFileSync(join(BEKO_FOLDER, f), dst);
});
console.log(`✓ ${Math.min(photos.length, 12)} photos curated to site/public/uploads/photos/`);

videos.forEach((f, i) => {
  const dst = join(LOCAL_MEDIA, `${String(i + 1).padStart(2, '0')}-clip.mp4`);
  copyFileSync(join(BEKO_FOLDER, f), dst);
});
console.log(`✓ ${videos.length} videos staged to site/local-media/`);

console.log('\nNext: ensure site/public/uploads/logo-og.png exists (1200x630). Generate manually or use ImageMagick:');
console.log(`  magick -size 1200x630 xc:#FFD700 \\( "${join(UPLOADS, 'logo.jpeg')}" -resize 500x \\) -gravity center -composite "${join(UPLOADS, 'logo-og.png')}"`);
```

- [ ] **Step 2: Make it executable and run it**

```bash
chmod +x scripts/import-assets.mjs
node scripts/import-assets.mjs
```

Expected: prints checkmarks for logo, photos, videos. Final hint shows the `magick` command for OG image.

- [ ] **Step 3: Generate the OG image (best effort)**

If ImageMagick is installed:

```bash
magick -size 1200x630 xc:#FFD700 \( site/public/uploads/logo.jpeg -resize 500x \) -gravity center -composite site/public/uploads/logo-og.png
```

If not installed, create a placeholder by copying the logo:

```bash
cp site/public/uploads/logo.jpeg site/public/uploads/logo-og.png
```

The OG image can be improved later; the structure is what matters for now.

- [ ] **Step 4: Update `.gitignore` to exclude `site/local-media/`**

Append to `.gitignore` if not already present:

```
# Local-only video staging (videos go to S3 media bucket)
site/local-media/
```

- [ ] **Step 5: Commit**

```bash
git add scripts/import-assets.mjs site/public/uploads/ site/public/favicon.svg .gitignore
git commit -m "feat(assets): import logo + photos, generate favicon, OG image"
```

---

### Task A5.2: Brand color & typography tokens

**Files:**
- Create: `site/src/styles/tokens.css`
- Create: `site/src/styles/global.css`

- [ ] **Step 1: Write `tokens.css`**

Create `site/src/styles/tokens.css`:

```css
:root {
  --color-primary: #FFD700;
  --color-on-primary: #0A0A0A;
  --color-ink: #0A0A0A;
  --color-paper: #FFFFFF;
  --color-muted: #6B6B6B;
  --color-soft: #F5F5F5;
  --color-border: #E5E5E5;

  --font-display: 'Anton', 'Impact', 'Helvetica Neue', sans-serif;
  --font-body: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;

  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  --space-16: 4rem;

  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;

  --max-content: 72rem;
  --max-prose: 40rem;
}
```

- [ ] **Step 2: Write `global.css`**

Create `site/src/styles/global.css`:

```css
@import './tokens.css';

*, *::before, *::after { box-sizing: border-box; }

html { scroll-behavior: smooth; }

body {
  margin: 0;
  font-family: var(--font-body);
  color: var(--color-ink);
  background: var(--color-paper);
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3, h4 {
  font-family: var(--font-display);
  font-weight: 400;
  letter-spacing: 0.02em;
  margin: 0 0 var(--space-4);
  line-height: 1.1;
}

h1 { font-size: clamp(2rem, 5vw, 3.5rem); }
h2 { font-size: clamp(1.5rem, 3.5vw, 2.5rem); }
h3 { font-size: clamp(1.25rem, 2.5vw, 1.75rem); }

p { margin: 0 0 var(--space-4); }

a {
  color: var(--color-ink);
  text-decoration: underline;
  text-underline-offset: 2px;
}
a:hover { color: var(--color-on-primary); background: var(--color-primary); }

button, .btn {
  font-family: var(--font-body);
  font-weight: 600;
  cursor: pointer;
  border: 2px solid var(--color-ink);
  background: var(--color-primary);
  color: var(--color-on-primary);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-sm);
  font-size: 1rem;
  transition: transform 0.05s ease;
}
button:hover, .btn:hover { transform: translateY(-1px); }

img, video { max-width: 100%; height: auto; display: block; }

.container {
  width: 100%;
  max-width: var(--max-content);
  margin: 0 auto;
  padding: 0 var(--space-4);
}

.prose { max-width: var(--max-prose); margin: 0 auto; }

.sr-only {
  position: absolute; width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
}
```

- [ ] **Step 3: Wire `global.css` into `BaseLayout.astro`**

Edit `site/src/layouts/BaseLayout.astro` — add this import to the frontmatter at the top:

```astro
---
import '../styles/global.css';
import { getEntry } from 'astro:content';
// ... rest unchanged
---
```

(Insert as the very first line under the opening `---`.)

- [ ] **Step 4: Verify build**

Run: `cd site && npm run build`
Expected: build succeeds, dist HTML files include the CSS link.

- [ ] **Step 5: Commit**

```bash
git add site/src/styles/ site/src/layouts/BaseLayout.astro
git commit -m "feat(brand): color tokens, Anton + Inter typography, base global styles"
```

---

End of Phase A.5. Brand visible in placeholder pages.

---

## Phase B — Static pages + shared components

### Task B1: Create `SiteLayout.astro` (header + footer)

**Files:**
- Create: `site/src/components/Header.astro`
- Create: `site/src/components/Footer.astro`
- Create: `site/src/components/LangSwitch.astro`
- Create: `site/src/layouts/SiteLayout.astro`

- [ ] **Step 1: Write `LangSwitch.astro`**

Create `site/src/components/LangSwitch.astro`:

```astro
---
import { equivalentRoute, type Lang } from '../i18n/routes';
interface Props { lang: Lang; }
const { lang } = Astro.props;
const otherLang: Lang = lang === 'fr' ? 'en' : 'fr';
const otherUrl = equivalentRoute(Astro.url.pathname, otherLang);
const label = otherLang === 'en' ? 'EN' : 'FR';
---
<a href={otherUrl} class="lang-switch" aria-label={`Switch to ${label}`}>
  <span class="lang-switch__current">{lang.toUpperCase()}</span>
  <span class="lang-switch__sep">|</span>
  <span class="lang-switch__other">{label}</span>
</a>

<style>
  .lang-switch {
    display: inline-flex;
    gap: var(--space-2);
    text-decoration: none;
    font-weight: 600;
    font-size: 0.95rem;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
  }
  .lang-switch:hover { background: var(--color-primary); color: var(--color-on-primary); }
  .lang-switch__current { color: var(--color-ink); }
  .lang-switch__sep { color: var(--color-muted); }
  .lang-switch__other { color: var(--color-muted); }
  .lang-switch:hover .lang-switch__other { color: var(--color-on-primary); }
</style>
```

- [ ] **Step 2: Write `Header.astro`**

Create `site/src/components/Header.astro`:

```astro
---
import { getTranslations } from '../i18n/t';
import { routeFor, type Lang } from '../i18n/routes';
import LangSwitch from './LangSwitch.astro';

interface Props { lang: Lang; }
const { lang } = Astro.props;
const t = await getTranslations(lang);

const navLinks = [
  { key: 'home',     label: t.nav.home,     href: routeFor('home', lang) },
  { key: 'news',     label: t.nav.news,     href: routeFor('news', lang) },
  { key: 'team',     label: t.nav.team,     href: routeFor('team', lang) },
  { key: 'matches',  label: t.nav.matches,  href: routeFor('matches', lang) },
  { key: 'gallery',  label: t.nav.gallery,  href: routeFor('gallery', lang) },
  { key: 'sponsors', label: t.nav.sponsors, href: routeFor('sponsors', lang) },
  { key: 'join',     label: t.nav.join,     href: routeFor('join', lang) },
  { key: 'donate',   label: t.nav.donate,   href: routeFor('donate', lang) },
  { key: 'contact',  label: t.nav.contact,  href: routeFor('contact', lang) },
];

const homeHref = routeFor('home', lang);
---

<header class="site-header">
  <div class="container site-header__inner">
    <a href={homeHref} class="brand" aria-label="BEKO FC">
      <img src="/uploads/logo.svg" alt="" class="brand__logo" onerror="this.src='/uploads/logo.jpeg'" />
      <span class="brand__name">BEKO FC</span>
    </a>

    <nav class="site-nav" aria-label="Primary">
      <button class="site-nav__toggle" aria-expanded="false" aria-controls="site-nav-list">
        <span class="sr-only">Menu</span>
        <span aria-hidden="true">☰</span>
      </button>
      <ul id="site-nav-list" class="site-nav__list">
        {navLinks.map((link) => (
          <li><a href={link.href} class="site-nav__link">{link.label}</a></li>
        ))}
      </ul>
    </nav>

    <LangSwitch lang={lang} />
  </div>
</header>

<style>
  .site-header { background: var(--color-paper); border-bottom: 1px solid var(--color-border); position: sticky; top: 0; z-index: 100; }
  .site-header__inner { display: flex; align-items: center; gap: var(--space-4); padding: var(--space-3) var(--space-4); }
  .brand { display: flex; align-items: center; gap: var(--space-3); text-decoration: none; color: var(--color-ink); }
  .brand:hover { background: transparent; }
  .brand__logo { width: 40px; height: 40px; }
  .brand__name { font-family: var(--font-display); font-size: 1.5rem; letter-spacing: 0.05em; }

  .site-nav { margin-left: auto; }
  .site-nav__toggle { display: none; background: transparent; border: 1px solid var(--color-border); padding: var(--space-2) var(--space-3); }
  .site-nav__list { display: flex; gap: var(--space-4); list-style: none; margin: 0; padding: 0; }
  .site-nav__link { text-decoration: none; color: var(--color-ink); font-weight: 500; padding: var(--space-2); }
  .site-nav__link:hover { background: var(--color-primary); }

  @media (max-width: 900px) {
    .site-nav__toggle { display: inline-flex; }
    .site-nav__list { display: none; position: absolute; top: 100%; left: 0; right: 0; flex-direction: column; background: var(--color-paper); border-bottom: 1px solid var(--color-border); padding: var(--space-4); }
    .site-nav[data-open="true"] .site-nav__list { display: flex; }
  }
</style>

<script>
  const toggle = document.querySelector('.site-nav__toggle');
  const nav = toggle?.closest('.site-nav');
  toggle?.addEventListener('click', () => {
    const open = nav?.getAttribute('data-open') === 'true';
    nav?.setAttribute('data-open', open ? 'false' : 'true');
    toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
  });
</script>
```

- [ ] **Step 3: Write `Footer.astro`**

Create `site/src/components/Footer.astro`:

```astro
---
import { getEntry } from 'astro:content';
import { getTranslations } from '../i18n/t';
import { routeFor, type Lang } from '../i18n/routes';

interface Props { lang: Lang; }
const { lang } = Astro.props;
const t = await getTranslations(lang);
const settings = await getEntry('settings', 'settings');
const s = settings!.data;
---

<footer class="site-footer">
  <div class="container site-footer__inner">
    <div class="site-footer__brand">
      <strong>BEKO FC</strong>
      <p class="site-footer__sub">Beko Football de Douala — B.F.D.</p>
    </div>

    <div class="site-footer__contact">
      <p><a href={`mailto:${s.contact_email}`}>{s.contact_email}</a></p>
      {s.whatsapp && <p>WhatsApp: <a href={`https://wa.me/${s.whatsapp.replace(/\D/g, '')}`}>{s.whatsapp}</a></p>}
      <ul class="site-footer__socials">
        {s.facebook_url && <li><a href={s.facebook_url} rel="noopener">Facebook</a></li>}
        {s.instagram_url && <li><a href={s.instagram_url} rel="noopener">Instagram</a></li>}
      </ul>
    </div>

    <nav class="site-footer__nav" aria-label="Secondary">
      <ul>
        <li><a href={routeFor('contact', lang)}>{t.nav.contact}</a></li>
        <li><a href={routeFor('sponsors', lang)}>{t.nav.sponsors}</a></li>
        <li><a href={routeFor('donate', lang)}>{t.nav.donate}</a></li>
        <li><a href={routeFor('privacy', lang)}>{lang === 'fr' ? 'Confidentialité' : 'Privacy'}</a></li>
      </ul>
    </nav>
  </div>
  <div class="site-footer__copy">
    <p>© {new Date().getFullYear()} Beko Football de Douala</p>
  </div>
</footer>

<style>
  .site-footer { margin-top: var(--space-16); background: var(--color-ink); color: var(--color-paper); }
  .site-footer a { color: var(--color-paper); }
  .site-footer a:hover { color: var(--color-on-primary); background: var(--color-primary); }
  .site-footer__inner { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: var(--space-8); padding: var(--space-12) var(--space-4); }
  .site-footer__sub { color: var(--color-muted); margin-top: var(--space-2); }
  .site-footer__socials { list-style: none; margin: var(--space-3) 0 0; padding: 0; display: flex; gap: var(--space-3); }
  .site-footer__nav ul { list-style: none; margin: 0; padding: 0; }
  .site-footer__nav li { margin-bottom: var(--space-2); }
  .site-footer__copy { border-top: 1px solid var(--color-muted); padding: var(--space-4); text-align: center; }
  @media (max-width: 720px) { .site-footer__inner { grid-template-columns: 1fr; } }
</style>
```

- [ ] **Step 4: Write `SiteLayout.astro`**

Create `site/src/layouts/SiteLayout.astro`:

```astro
---
import BaseLayout from './BaseLayout.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import type { Lang } from '../i18n/routes';

interface Props {
  title: string;
  description?: string;
  lang: Lang;
  ogImage?: string;
  canonicalPath?: string;
  ogType?: 'website' | 'article';
}

const props = Astro.props;
---

<BaseLayout {...props}>
  <slot name="head" slot="head" />
  <Header lang={props.lang} />
  <slot />
  <Footer lang={props.lang} />
</BaseLayout>
```

- [ ] **Step 5: Update `[lang]/index.astro` to use `SiteLayout`**

Replace the content of `site/src/pages/[lang]/index.astro`:

```astro
---
import SiteLayout from '../../layouts/SiteLayout.astro';
import { getTranslations } from '../../i18n/t';
import type { Lang } from '../../i18n/routes';

export function getStaticPaths() {
  return [{ params: { lang: 'fr' } }, { params: { lang: 'en' } }];
}

const lang = Astro.params.lang as Lang;
const t = await getTranslations(lang);
---

<SiteLayout title={t.nav.home} lang={lang}>
  <main class="container" style="padding-top: var(--space-12); padding-bottom: var(--space-12);">
    <h1>BEKO FC</h1>
    <p>{lang === 'fr' ? 'Site en construction.' : 'Site under construction.'}</p>
  </main>
</SiteLayout>
```

- [ ] **Step 6: Build and visual-verify**

Run: `cd site && npm run dev`

Visit `http://localhost:4321/fr/` — header (logo + nav + lang switcher), footer, brand colors visible. Click `EN` — switches to `/en/`.

- [ ] **Step 7: Commit**

```bash
git add site/src/components/Header.astro site/src/components/Footer.astro site/src/components/LangSwitch.astro site/src/layouts/SiteLayout.astro site/src/pages/[lang]/index.astro
git commit -m "feat(layout): SiteLayout with Header (nav + lang switch) and Footer"
```

---

### Task B2: Empty-state component

**Files:**
- Create: `site/src/components/EmptyState.astro`

- [ ] **Step 1: Write component**

Create `site/src/components/EmptyState.astro`:

```astro
---
interface Props { message: string; }
const { message } = Astro.props;
---
<div class="empty-state">
  <p>{message}</p>
</div>
<style>
  .empty-state { padding: var(--space-12) var(--space-4); text-align: center; color: var(--color-muted); background: var(--color-soft); border-radius: var(--radius-md); }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add site/src/components/EmptyState.astro
git commit -m "feat(components): EmptyState bilingual message component"
```

---

### Task B3: Privacy page (FR + EN)

**Files:**
- Create: `content/pages/privacy.md`
- Create: `site/src/pages/[lang]/confidentialite.astro` (FR — but slug-mapped at request time; in Astro we generate paths via `getStaticPaths` so we put both under one file using lang-aware slug)
- Create: `site/src/pages/[lang]/privacy.astro`

Note: Astro file-based routing requires literal segment names. Since FR uses `/fr/confidentialite/` and EN uses `/en/privacy/`, we need two files. Each file restricts itself to the matching `lang`.

- [ ] **Step 1: Write privacy content**

Create `content/pages/privacy.md`:

```markdown
---
title:
  fr: "Politique de confidentialité"
  en: "Privacy Policy"
body_fr: |
  Cette politique décrit comment BEKO FC collecte et utilise les données personnelles.

  **Données collectées :** ce site utilise un formulaire de contact qui transmet votre nom, email et message à notre équipe via Web3Forms. Nous n'utilisons pas de cookies de suivi sur cette version du site.

  **Conservation :** les messages reçus via le formulaire sont conservés dans notre boîte email. Pour demander leur suppression, contactez `contact@bekofc.com`.

  **Vos droits :** vous pouvez à tout moment demander l'accès, la rectification ou la suppression de vos données personnelles en nous écrivant.
body_en: |
  This policy describes how BEKO FC collects and uses personal data.

  **Data collected:** this site uses a contact form that transmits your name, email and message to our team via Web3Forms. We do not use tracking cookies in this version of the site.

  **Retention:** messages received via the form are kept in our email inbox. To request deletion, contact `contact@bekofc.com`.

  **Your rights:** you may at any time request access, rectification or deletion of your personal data by writing to us.
---
```

- [ ] **Step 2: Write `[lang]/confidentialite.astro`**

Create `site/src/pages/[lang]/confidentialite.astro`:

```astro
---
import SiteLayout from '../../layouts/SiteLayout.astro';
import { getEntry } from 'astro:content';

export function getStaticPaths() {
  return [{ params: { lang: 'fr' } }];
}

const lang = 'fr' as const;
const page = await getEntry('pages', 'privacy');
if (!page) throw new Error('content/pages/privacy.md missing');
const body = page.data.body_fr ?? '';
const title = page.data.title.fr;
---

<SiteLayout title={title} lang={lang}>
  <main class="container prose" style="padding: var(--space-12) var(--space-4);">
    <h1>{title}</h1>
    <article set:html={body.replace(/\n\n/g, '</p><p>').replace(/^/, '<p>').replace(/$/, '</p>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>')} />
  </main>
</SiteLayout>
```

- [ ] **Step 3: Write `[lang]/privacy.astro`**

Create `site/src/pages/[lang]/privacy.astro`:

```astro
---
import SiteLayout from '../../layouts/SiteLayout.astro';
import { getEntry } from 'astro:content';

export function getStaticPaths() {
  return [{ params: { lang: 'en' } }];
}

const lang = 'en' as const;
const page = await getEntry('pages', 'privacy');
if (!page) throw new Error('content/pages/privacy.md missing');
const body = page.data.body_en ?? '';
const title = page.data.title.en;
---

<SiteLayout title={title} lang={lang}>
  <main class="container prose" style="padding: var(--space-12) var(--space-4);">
    <h1>{title}</h1>
    <article set:html={body.replace(/\n\n/g, '</p><p>').replace(/^/, '<p>').replace(/$/, '</p>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>')} />
  </main>
</SiteLayout>
```

- [ ] **Step 4: Build and verify**

Run: `cd site && npm run build`
Then: `cd site && npm run dev`

Visit `/fr/confidentialite/` and `/en/privacy/` — both render with body text. Switch language via header — links to the correct other-language URL.

- [ ] **Step 5: Commit**

```bash
git add content/pages/privacy.md site/src/pages/[lang]/confidentialite.astro site/src/pages/[lang]/privacy.astro
git commit -m "feat(pages): privacy policy FR + EN"
```

---

### Task B4: Join page (FR + EN)

**Files:**
- Create: `content/pages/join.md`
- Create: `site/src/pages/[lang]/rejoindre.astro`
- Create: `site/src/pages/[lang]/join.astro`

- [ ] **Step 1: Write join content**

Create `content/pages/join.md`:

```markdown
---
title:
  fr: "Rejoindre BEKO FC"
  en: "Join BEKO FC"
hero_headline:
  fr: "Joue avec nous."
  en: "Play with us."
hero_subhead:
  fr: "Joueuses, encadrement, bénévoles — BEKO FC accueille toutes les passionnées du football féminin à Douala."
  en: "Players, staff, volunteers — BEKO FC welcomes everyone passionate about women's football in Douala."
body_fr: |
  Nous recrutons toute l'année des joueuses motivées de tous niveaux et tous âges.

  L'encadrement technique et bénévole est également ouvert : entraîneurs, kinés, intendance, communication.

  **Contact :** envoyez-nous un message via le formulaire de contact ou écrivez directement à `contact@bekofc.com`. Nous reviendrons vers vous sous 48 h.
body_en: |
  We welcome motivated players of all levels and ages year-round.

  Technical and volunteer staff opportunities are also open: coaches, physios, logistics, communications.

  **Contact:** send us a message via the contact form or write directly to `contact@bekofc.com`. We'll respond within 48 hours.
---
```

- [ ] **Step 2: Write `[lang]/rejoindre.astro`**

Create `site/src/pages/[lang]/rejoindre.astro`:

```astro
---
import SiteLayout from '../../layouts/SiteLayout.astro';
import { getEntry } from 'astro:content';

export function getStaticPaths() { return [{ params: { lang: 'fr' } }]; }

const lang = 'fr' as const;
const page = await getEntry('pages', 'join');
if (!page) throw new Error('content/pages/join.md missing');
const settings = await getEntry('settings', 'settings');
const s = settings!.data;
const d = page.data;
---

<SiteLayout title={d.title.fr} lang={lang}>
  <main class="container" style="padding: var(--space-12) var(--space-4);">
    <header class="page-hero">
      <h1>{d.hero_headline?.fr ?? d.title.fr}</h1>
      {d.hero_subhead && <p class="page-hero__sub">{d.hero_subhead.fr}</p>}
    </header>
    <article class="prose" set:html={(d.body_fr ?? '').replace(/\n\n/g, '</p><p>').replace(/^/, '<p>').replace(/$/, '</p>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>')} />
    <div class="cta-row">
      <a class="btn" href={`mailto:${s.contact_email}`}>{s.contact_email}</a>
      {s.whatsapp && <a class="btn" href={`https://wa.me/${s.whatsapp.replace(/\D/g, '')}`}>WhatsApp</a>}
    </div>
  </main>
</SiteLayout>

<style>
  .page-hero { padding: var(--space-8) 0; border-bottom: 4px solid var(--color-primary); margin-bottom: var(--space-8); }
  .page-hero__sub { font-size: 1.2rem; color: var(--color-muted); }
  .cta-row { display: flex; gap: var(--space-4); flex-wrap: wrap; margin-top: var(--space-8); }
</style>
```

- [ ] **Step 3: Write `[lang]/join.astro`**

Create `site/src/pages/[lang]/join.astro` — same as `rejoindre.astro` but `lang = 'en'`, reads `d.title.en`, `d.hero_headline?.en`, `d.hero_subhead?.en`, `d.body_en`. Reuse the same style block.

```astro
---
import SiteLayout from '../../layouts/SiteLayout.astro';
import { getEntry } from 'astro:content';

export function getStaticPaths() { return [{ params: { lang: 'en' } }]; }

const lang = 'en' as const;
const page = await getEntry('pages', 'join');
if (!page) throw new Error('content/pages/join.md missing');
const settings = await getEntry('settings', 'settings');
const s = settings!.data;
const d = page.data;
---

<SiteLayout title={d.title.en} lang={lang}>
  <main class="container" style="padding: var(--space-12) var(--space-4);">
    <header class="page-hero">
      <h1>{d.hero_headline?.en ?? d.title.en}</h1>
      {d.hero_subhead && <p class="page-hero__sub">{d.hero_subhead.en}</p>}
    </header>
    <article class="prose" set:html={(d.body_en ?? '').replace(/\n\n/g, '</p><p>').replace(/^/, '<p>').replace(/$/, '</p>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>')} />
    <div class="cta-row">
      <a class="btn" href={`mailto:${s.contact_email}`}>{s.contact_email}</a>
      {s.whatsapp && <a class="btn" href={`https://wa.me/${s.whatsapp.replace(/\D/g, '')}`}>WhatsApp</a>}
    </div>
  </main>
</SiteLayout>

<style>
  .page-hero { padding: var(--space-8) 0; border-bottom: 4px solid var(--color-primary); margin-bottom: var(--space-8); }
  .page-hero__sub { font-size: 1.2rem; color: var(--color-muted); }
  .cta-row { display: flex; gap: var(--space-4); flex-wrap: wrap; margin-top: var(--space-8); }
</style>
```

- [ ] **Step 4: Verify in browser**

Visit `/fr/rejoindre/` and `/en/join/` — both render hero + body + CTAs.

- [ ] **Step 5: Commit**

```bash
git add content/pages/join.md site/src/pages/[lang]/rejoindre.astro site/src/pages/[lang]/join.astro
git commit -m "feat(pages): join (rejoindre/join) FR + EN"
```

---

### Task B5: Donate page (FR + EN, includes copy buttons)

**Files:**
- Create: `content/pages/donate.md`
- Create: `site/src/components/CopyButton.astro`
- Create: `site/src/pages/[lang]/don.astro`
- Create: `site/src/pages/[lang]/donate.astro`

- [ ] **Step 1: Write donate content**

Create `content/pages/donate.md`:

```markdown
---
title:
  fr: "Faire un don"
  en: "Donate"
hero_headline:
  fr: "Soutenez le foot féminin à Douala."
  en: "Support women's football in Douala."
hero_subhead:
  fr: "Vos dons financent l'équipement, le transport et les frais d'inscription en championnat."
  en: "Your donations fund equipment, transport and league registration fees."
body_fr: |
  BEKO FC est une équipe entièrement bénévole. Chaque contribution compte — du transport hebdomadaire vers les terrains aux maillots, ballons, et frais administratifs.

  **Donateurs locaux :** utilisez Mobile Money (MTN MoMo ou Orange Money) ci-dessous.

  **Donateurs internationaux :** vous pouvez utiliser PayPal lorsque le lien est disponible. Sinon, contactez-nous pour les modalités.

  **Merci** de croire en notre projet et en nos joueuses.
body_en: |
  BEKO FC is a fully volunteer-run team. Every contribution matters — from weekly transport to the pitch, to jerseys, balls, and administrative fees.

  **Local donors:** use Mobile Money (MTN MoMo or Orange Money) below.

  **International donors:** you can use PayPal when a link is available. Otherwise, contact us for alternatives.

  **Thank you** for believing in our project and our players.
---
```

- [ ] **Step 2: Write `CopyButton.astro`**

Create `site/src/components/CopyButton.astro`:

```astro
---
interface Props { value: string; label: string; copiedLabel: string; }
const { value, label, copiedLabel } = Astro.props;
---
<button class="copy-btn" data-copy={value} data-copied-label={copiedLabel} type="button">
  <span class="copy-btn__label">{label}</span>
</button>

<style>
  .copy-btn { display: inline-flex; align-items: center; gap: var(--space-2); }
</style>

<script>
  document.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;
    const btn = target.closest('.copy-btn') as HTMLButtonElement | null;
    if (!btn) return;
    const text = btn.dataset.copy;
    const copiedLabel = btn.dataset.copiedLabel ?? 'Copied!';
    if (!text) return;

    const labelEl = btn.querySelector('.copy-btn__label') as HTMLElement | null;
    const originalLabel = labelEl?.textContent ?? '';

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      if (labelEl) labelEl.textContent = copiedLabel;
      setTimeout(() => { if (labelEl) labelEl.textContent = originalLabel; }, 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  });
</script>
```

- [ ] **Step 3: Write donate page (FR)**

Create `site/src/pages/[lang]/don.astro`:

```astro
---
import SiteLayout from '../../layouts/SiteLayout.astro';
import CopyButton from '../../components/CopyButton.astro';
import { getEntry } from 'astro:content';
import { getTranslations } from '../../i18n/t';

export function getStaticPaths() { return [{ params: { lang: 'fr' } }]; }

const lang = 'fr' as const;
const t = await getTranslations(lang);
const page = await getEntry('pages', 'donate');
const settings = await getEntry('settings', 'settings');
if (!page || !settings) throw new Error('donate page or settings missing');
const d = page.data;
const s = settings.data;
---

<SiteLayout title={d.title.fr} lang={lang}>
  <main class="container" style="padding: var(--space-12) var(--space-4);">
    <header class="page-hero">
      <h1>{d.hero_headline?.fr ?? d.title.fr}</h1>
      {d.hero_subhead && <p class="page-hero__sub">{d.hero_subhead.fr}</p>}
    </header>

    <article class="prose" set:html={(d.body_fr ?? '').replace(/\n\n/g, '</p><p>').replace(/^/, '<p>').replace(/$/, '</p>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')} />

    <section class="donate-section">
      <h2>Mobile Money</h2>
      <div class="donate-method">
        <strong>MTN MoMo</strong>
        <code>{s.momo_number}</code>
        <CopyButton value={s.momo_number ?? ''} label={t.buttons.copy} copiedLabel={t.buttons.copied} />
      </div>
      <div class="donate-method">
        <strong>Orange Money</strong>
        <code>{s.orange_money_number}</code>
        <CopyButton value={s.orange_money_number ?? ''} label={t.buttons.copy} copiedLabel={t.buttons.copied} />
      </div>
    </section>

    <section class="donate-section">
      <h2>PayPal</h2>
      {s.paypal_link ? (
        <p><a class="btn" href={s.paypal_link} rel="noopener">PayPal</a></p>
      ) : (
        <p class="paypal-unavailable">{t.labels.paypal_unavailable} — <a href={`mailto:${s.contact_email}`}>{s.contact_email}</a></p>
      )}
    </section>
  </main>
</SiteLayout>

<style>
  .page-hero { padding: var(--space-8) 0; border-bottom: 4px solid var(--color-primary); margin-bottom: var(--space-8); }
  .page-hero__sub { font-size: 1.2rem; color: var(--color-muted); }
  .donate-section { margin-top: var(--space-12); }
  .donate-method { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-4); padding: var(--space-4); border: 1px solid var(--color-border); border-radius: var(--radius-md); margin-bottom: var(--space-3); }
  .donate-method code { background: var(--color-soft); padding: var(--space-2) var(--space-3); border-radius: var(--radius-sm); font-size: 1.1rem; }
  .paypal-unavailable { background: var(--color-soft); padding: var(--space-4); border-radius: var(--radius-md); }
</style>
```

- [ ] **Step 4: Write donate page (EN)**

Create `site/src/pages/[lang]/donate.astro` — same structure as `don.astro` but `lang = 'en'`, fields `.en`, body `body_en`. Copy the file from step 3, change `lang` to `'en'`, change `getStaticPaths` to return `[{ params: { lang: 'en' } }]`, change all `.fr` to `.en` and `body_fr` to `body_en`.

- [ ] **Step 5: Verify**

Visit `/fr/don/` and `/en/donate/` — copy buttons work, PayPal section shows fallback message.

- [ ] **Step 6: Commit**

```bash
git add content/pages/donate.md site/src/components/CopyButton.astro site/src/pages/[lang]/don.astro site/src/pages/[lang]/donate.astro
git commit -m "feat(pages): donate (don/donate) with copy-to-clipboard MoMo/Orange"
```

---

### Task B6: Contact page + ContactForm

**Files:**
- Create: `content/pages/contact.md`
- Create: `site/src/components/ContactForm.astro`
- Create: `site/src/pages/[lang]/contact.astro`

- [ ] **Step 1: Write contact content**

Create `content/pages/contact.md`:

```markdown
---
title:
  fr: "Contact"
  en: "Contact"
hero_headline:
  fr: "Écrivez-nous."
  en: "Write to us."
hero_subhead:
  fr: "Réponse sous 48 h ouvrées. Pour les sujets urgents, utilisez WhatsApp."
  en: "Response within 48 working hours. For urgent matters, use WhatsApp."
---
```

- [ ] **Step 2: Write `ContactForm.astro`**

Create `site/src/components/ContactForm.astro`:

```astro
---
import { getEntry } from 'astro:content';
import { getTranslations } from '../i18n/t';
import type { Lang } from '../i18n/routes';

interface Props { lang: Lang; }
const { lang } = Astro.props;
const t = await getTranslations(lang);
const settings = await getEntry('settings', 'settings');
const s = settings!.data;
const accessKey = s.web3forms_access_key ?? '';
const subjectPrefix = lang === 'fr' ? 'Contact via bekofc.com' : 'Contact via bekofc.com';
const mailto = `mailto:${s.contact_email}?subject=${encodeURIComponent(subjectPrefix)}`;
---

<form class="contact-form" action="https://api.web3forms.com/submit" method="POST" data-mailto={mailto}>
  <input type="hidden" name="access_key" value={accessKey} />
  <input type="hidden" name="subject" value={subjectPrefix} />
  <input type="checkbox" name="botcheck" class="sr-only" tabindex="-1" autocomplete="off" />

  <label>
    <span>{lang === 'fr' ? 'Nom' : 'Name'}</span>
    <input type="text" name="name" required autocomplete="name" />
  </label>
  <label>
    <span>Email</span>
    <input type="email" name="email" required autocomplete="email" />
  </label>
  <label>
    <span>{lang === 'fr' ? 'Message' : 'Message'}</span>
    <textarea name="message" rows="6" required></textarea>
  </label>

  <div class="contact-form__actions">
    <button type="submit" class="btn">{t.buttons.submit}</button>
    <a class="contact-form__mailto" href={mailto}>{t.labels.prefer_email} {t.labels.fallback_email}</a>
  </div>

  <p class="contact-form__status" role="status" aria-live="polite" hidden></p>
</form>

<style>
  .contact-form { display: grid; gap: var(--space-4); max-width: 36rem; }
  .contact-form label { display: grid; gap: var(--space-2); }
  .contact-form label span { font-weight: 600; }
  .contact-form input, .contact-form textarea {
    font-family: var(--font-body); font-size: 1rem; padding: var(--space-3);
    border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: var(--color-paper);
  }
  .contact-form__actions { display: flex; gap: var(--space-4); align-items: center; flex-wrap: wrap; }
  .contact-form__mailto { color: var(--color-muted); }
  .contact-form__status { padding: var(--space-3); border-radius: var(--radius-sm); }
  .contact-form__status[data-state="ok"] { background: var(--color-primary); color: var(--color-on-primary); }
  .contact-form__status[data-state="error"] { background: #fdd; color: #800; }
</style>

<script>
  const form = document.querySelector('.contact-form') as HTMLFormElement | null;
  if (form) {
    form.addEventListener('submit', async (e) => {
      const accessKey = (form.querySelector('input[name="access_key"]') as HTMLInputElement).value;
      if (!accessKey) return;
      e.preventDefault();
      const status = form.querySelector('.contact-form__status') as HTMLElement;
      status.hidden = false;
      status.removeAttribute('data-state');
      status.textContent = form.lang === 'fr' ? 'Envoi…' : 'Sending…';
      const data = new FormData(form);
      try {
        const res = await fetch(form.action, { method: 'POST', body: data });
        if (!res.ok) throw new Error('http ' + res.status);
        status.textContent = form.lang === 'fr' ? 'Merci, message reçu.' : 'Thanks, message received.';
        status.dataset.state = 'ok';
        form.reset();
      } catch {
        status.textContent = form.lang === 'fr' ? 'Erreur — utilisez le lien email ci-dessus.' : 'Error — please use the email link above.';
        status.dataset.state = 'error';
      }
    });
  }
</script>
```

- [ ] **Step 3: Write `[lang]/contact.astro`**

Create `site/src/pages/[lang]/contact.astro`:

```astro
---
import SiteLayout from '../../layouts/SiteLayout.astro';
import ContactForm from '../../components/ContactForm.astro';
import { getEntry } from 'astro:content';
import type { Lang } from '../../i18n/routes';

export function getStaticPaths() {
  return [{ params: { lang: 'fr' } }, { params: { lang: 'en' } }];
}

const lang = Astro.params.lang as Lang;
const page = await getEntry('pages', 'contact');
const settings = await getEntry('settings', 'settings');
if (!page || !settings) throw new Error('contact page or settings missing');
const d = page.data;
const s = settings.data;
const title = d.title[lang];
---

<SiteLayout title={title} lang={lang}>
  <main class="container" style="padding: var(--space-12) var(--space-4);">
    <header class="page-hero">
      <h1>{d.hero_headline?.[lang] ?? title}</h1>
      {d.hero_subhead && <p class="page-hero__sub">{d.hero_subhead[lang]}</p>}
    </header>

    <div class="contact-grid">
      <section>
        <h2>{lang === 'fr' ? 'Coordonnées' : 'Contact info'}</h2>
        <ul class="contact-list">
          <li>Email — <a href={`mailto:${s.contact_email}`}>{s.contact_email}</a></li>
          {s.phone && <li>{lang === 'fr' ? 'Téléphone' : 'Phone'} — <a href={`tel:${s.phone}`}>{s.phone}</a></li>}
          {s.whatsapp && <li>WhatsApp — <a href={`https://wa.me/${s.whatsapp.replace(/\D/g, '')}`}>{s.whatsapp}</a></li>}
          {s.facebook_url && <li>Facebook — <a href={s.facebook_url} rel="noopener">{s.facebook_url}</a></li>}
          {s.instagram_url && <li>Instagram — <a href={s.instagram_url} rel="noopener">{s.instagram_url}</a></li>}
        </ul>
      </section>
      <section>
        <h2>{lang === 'fr' ? 'Formulaire' : 'Form'}</h2>
        <ContactForm lang={lang} />
      </section>
    </div>
  </main>
</SiteLayout>

<style>
  .page-hero { padding: var(--space-8) 0; border-bottom: 4px solid var(--color-primary); margin-bottom: var(--space-8); }
  .page-hero__sub { font-size: 1.2rem; color: var(--color-muted); }
  .contact-grid { display: grid; grid-template-columns: 1fr 2fr; gap: var(--space-12); margin-top: var(--space-8); }
  .contact-list { list-style: none; padding: 0; }
  .contact-list li { padding: var(--space-2) 0; border-bottom: 1px solid var(--color-border); }
  @media (max-width: 720px) { .contact-grid { grid-template-columns: 1fr; } }
</style>
```

- [ ] **Step 4: Verify**

Visit `/fr/contact/` and `/en/contact/` — form renders, mailto fallback present, fields validate. Submit without `web3forms_access_key` set: form posts natively (Web3Forms returns its own thank-you).

- [ ] **Step 5: Commit**

```bash
git add content/pages/contact.md site/src/components/ContactForm.astro site/src/pages/[lang]/contact.astro
git commit -m "feat(pages): contact + Web3Forms form with mailto fallback"
```

---

End of Phase B. Four simplest pages live: privacy, join, donate, contact. Header, footer, lang switch, copy buttons, contact form all working bilingually.

---

## Phase C — Data-driven pages (news, team, matches, sponsors, gallery, home)

### Task C1: Seed news content

**Files:**
- Create: `content/news/2026-09-15-match-vs-yaounde.fr.md`
- Create: `content/news/2026-09-15-match-vs-yaounde.en.md`
- Create: `content/news/2026-09-01-saison-debute.fr.md`
- Create: `content/news/2026-09-01-season-begins.en.md`
- Create: `content/news/2026-08-15-nouveau-staff.fr.md`
- Create: `content/news/2026-08-15-new-staff.en.md`

- [ ] **Step 1: Write 3 FR news posts and 3 EN equivalents**

Create `content/news/2026-09-15-match-vs-yaounde.fr.md`:

```markdown
---
title: "Victoire 2-1 face à FC Yaoundé"
slug: "match-vs-yaounde"
date: 2026-09-15
lang: fr
hero_image: "/uploads/photos/01-team.jpeg"
status: published
---

Le BEKO FC s'est imposé 2-1 hier à domicile face à FC Yaoundé devant un public chaleureux.

Une première mi-temps maîtrisée et un dernier quart d'heure intense ont scellé la victoire. Bravo à toute l'équipe.
```

Create `content/news/2026-09-15-match-vs-yaounde.en.md`:

```markdown
---
title: "2-1 win against FC Yaounde"
slug: "match-vs-yaounde"
date: 2026-09-15
lang: en
hero_image: "/uploads/photos/01-team.jpeg"
status: published
---

BEKO FC won 2-1 yesterday at home against FC Yaounde in front of a warm crowd.

A controlled first half and an intense final quarter sealed the victory. Well done to the entire team.
```

Create `content/news/2026-09-01-saison-debute.fr.md`:

```markdown
---
title: "La saison 2026/27 démarre"
slug: "saison-debute"
date: 2026-09-01
lang: fr
hero_image: "/uploads/photos/02-team.jpeg"
status: published
---

L'effectif est au complet et la préparation s'est terminée par deux victoires en match amical.

Le calendrier officiel du championnat est désormais en ligne sur la page Matchs.
```

Create `content/news/2026-09-01-season-begins.en.md`:

```markdown
---
title: "2026/27 season begins"
slug: "season-begins"
date: 2026-09-01
lang: en
hero_image: "/uploads/photos/02-team.jpeg"
status: published
---

The squad is complete and pre-season concluded with two friendly wins.

The official league schedule is now online on the Matches page.
```

Create `content/news/2026-08-15-nouveau-staff.fr.md`:

```markdown
---
title: "Bienvenue au nouveau staff technique"
slug: "nouveau-staff"
date: 2026-08-15
lang: fr
hero_image: "/uploads/photos/03-team.jpeg"
status: published
---

Nous accueillons cette saison deux nouveaux entraîneurs qui rejoignent l'équipe technique. Leur expérience apportera un nouveau souffle à notre projet.

Plus d'informations sur la page L'Équipe.
```

Create `content/news/2026-08-15-new-staff.en.md`:

```markdown
---
title: "Welcoming the new technical staff"
slug: "new-staff"
date: 2026-08-15
lang: en
hero_image: "/uploads/photos/03-team.jpeg"
status: published
---

This season we welcome two new coaches joining the technical team. Their experience will bring fresh energy to our project.

More information on The Team page.
```

- [ ] **Step 2: Verify schemas accept the content**

Run: `cd site && npx astro check`
Expected: no schema errors on the news collection.

- [ ] **Step 3: Commit**

```bash
git add content/news/
git commit -m "feat(content): seed 3 news posts (FR + EN)"
```

---

### Task C2: News list and detail pages

**Files:**
- Create: `site/src/components/NewsCard.astro`
- Create: `site/src/pages/[lang]/actualites/index.astro`
- Create: `site/src/pages/[lang]/news/index.astro`
- Create: `site/src/pages/[lang]/actualites/[slug].astro`
- Create: `site/src/pages/[lang]/news/[slug].astro`

- [ ] **Step 1: Write `NewsCard.astro`**

Create `site/src/components/NewsCard.astro`:

```astro
---
import { routeFor, type Lang } from '../i18n/routes';

interface Props {
  lang: Lang;
  slug: string;
  title: string;
  date: Date;
  hero_image?: string;
  excerpt?: string;
}

const { lang, slug, title, date, hero_image, excerpt } = Astro.props;
const href = `${routeFor('news', lang)}/${slug}/`;
const dateStr = new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
---

<article class="news-card">
  {hero_image && <a href={href} class="news-card__media"><img src={hero_image} alt="" loading="lazy" /></a>}
  <div class="news-card__body">
    <time datetime={date.toISOString()}>{dateStr}</time>
    <h3><a href={href}>{title}</a></h3>
    {excerpt && <p>{excerpt}</p>}
  </div>
</article>

<style>
  .news-card { border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden; background: var(--color-paper); display: flex; flex-direction: column; }
  .news-card__media img { width: 100%; aspect-ratio: 16/9; object-fit: cover; }
  .news-card__body { padding: var(--space-4); }
  .news-card__body time { color: var(--color-muted); font-size: 0.9rem; }
  .news-card__body h3 { margin: var(--space-2) 0; font-size: 1.5rem; }
  .news-card__body h3 a { text-decoration: none; }
</style>
```

- [ ] **Step 2: Write FR news list page**

Create `site/src/pages/[lang]/actualites/index.astro`:

```astro
---
import SiteLayout from '../../../layouts/SiteLayout.astro';
import NewsCard from '../../../components/NewsCard.astro';
import EmptyState from '../../../components/EmptyState.astro';
import { getCollection } from 'astro:content';
import { getTranslations } from '../../../i18n/t';

export function getStaticPaths() { return [{ params: { lang: 'fr' } }]; }

const lang = 'fr' as const;
const t = await getTranslations(lang);
const posts = (await getCollection('news', (e) => e.data.lang === 'fr' && e.data.status === 'published'))
  .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
---

<SiteLayout title={t.nav.news} lang={lang}>
  <main class="container" style="padding: var(--space-12) var(--space-4);">
    <header class="page-hero">
      <h1>{t.nav.news}</h1>
    </header>
    {posts.length === 0 ? (
      <EmptyState message={t.empty.no_news} />
    ) : (
      <div class="news-grid">
        {posts.map((p) => (
          <NewsCard
            lang={lang}
            slug={p.data.slug}
            title={p.data.title}
            date={p.data.date}
            hero_image={p.data.hero_image}
          />
        ))}
      </div>
    )}
  </main>
</SiteLayout>

<style>
  .page-hero { padding: var(--space-8) 0; border-bottom: 4px solid var(--color-primary); margin-bottom: var(--space-8); }
  .news-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-6); }
</style>
```

- [ ] **Step 3: Write EN news list page**

Create `site/src/pages/[lang]/news/index.astro` — mirror of actualites/index.astro with `lang = 'en'`, filtering `e.data.lang === 'en'`. Same template; copy from step 2 and change the lang/locale.

```astro
---
import SiteLayout from '../../../layouts/SiteLayout.astro';
import NewsCard from '../../../components/NewsCard.astro';
import EmptyState from '../../../components/EmptyState.astro';
import { getCollection } from 'astro:content';
import { getTranslations } from '../../../i18n/t';

export function getStaticPaths() { return [{ params: { lang: 'en' } }]; }

const lang = 'en' as const;
const t = await getTranslations(lang);
const posts = (await getCollection('news', (e) => e.data.lang === 'en' && e.data.status === 'published'))
  .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
---

<SiteLayout title={t.nav.news} lang={lang}>
  <main class="container" style="padding: var(--space-12) var(--space-4);">
    <header class="page-hero">
      <h1>{t.nav.news}</h1>
    </header>
    {posts.length === 0 ? (
      <EmptyState message={t.empty.no_news} />
    ) : (
      <div class="news-grid">
        {posts.map((p) => (
          <NewsCard
            lang={lang}
            slug={p.data.slug}
            title={p.data.title}
            date={p.data.date}
            hero_image={p.data.hero_image}
          />
        ))}
      </div>
    )}
  </main>
</SiteLayout>

<style>
  .page-hero { padding: var(--space-8) 0; border-bottom: 4px solid var(--color-primary); margin-bottom: var(--space-8); }
  .news-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-6); }
</style>
```

- [ ] **Step 4: Write FR news detail page**

Create `site/src/pages/[lang]/actualites/[slug].astro`:

```astro
---
import SiteLayout from '../../../layouts/SiteLayout.astro';
import { getCollection, render } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getCollection('news', (e) => e.data.lang === 'fr' && e.data.status === 'published');
  return posts.map((p) => ({ params: { lang: 'fr', slug: p.data.slug }, props: { post: p } }));
}

const lang = 'fr' as const;
const { post } = Astro.props;
const { Content } = await render(post);
const dateStr = new Intl.DateTimeFormat('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }).format(post.data.date);
---

<SiteLayout title={post.data.title} lang={lang} description={post.data.title} ogImage={post.data.hero_image} ogType="article">
  <article class="container news-detail" style="padding: var(--space-12) var(--space-4);">
    <header class="news-detail__header">
      <h1>{post.data.title}</h1>
      <time datetime={post.data.date.toISOString()}>{dateStr}</time>
      {post.data.author && <p class="news-detail__author">— {post.data.author}</p>}
    </header>
    {post.data.hero_image && <img class="news-detail__hero" src={post.data.hero_image} alt="" />}
    <div class="prose news-detail__body"><Content /></div>
  </article>
</SiteLayout>

<style>
  .news-detail { max-width: 48rem; margin: 0 auto; }
  .news-detail__header { padding: var(--space-6) 0; border-bottom: 4px solid var(--color-primary); margin-bottom: var(--space-6); }
  .news-detail__header time { color: var(--color-muted); }
  .news-detail__author { color: var(--color-muted); margin-top: var(--space-2); }
  .news-detail__hero { width: 100%; aspect-ratio: 16/9; object-fit: cover; border-radius: var(--radius-md); margin-bottom: var(--space-8); }
  .news-detail__body { font-size: 1.1rem; }
</style>
```

- [ ] **Step 5: Write EN news detail page**

Create `site/src/pages/[lang]/news/[slug].astro` — same template, change `lang === 'fr'` to `'en'` and `'fr-FR'` to `'en-US'`.

```astro
---
import SiteLayout from '../../../layouts/SiteLayout.astro';
import { getCollection, render } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getCollection('news', (e) => e.data.lang === 'en' && e.data.status === 'published');
  return posts.map((p) => ({ params: { lang: 'en', slug: p.data.slug }, props: { post: p } }));
}

const lang = 'en' as const;
const { post } = Astro.props;
const { Content } = await render(post);
const dateStr = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(post.data.date);
---

<SiteLayout title={post.data.title} lang={lang} description={post.data.title} ogImage={post.data.hero_image} ogType="article">
  <article class="container news-detail" style="padding: var(--space-12) var(--space-4);">
    <header class="news-detail__header">
      <h1>{post.data.title}</h1>
      <time datetime={post.data.date.toISOString()}>{dateStr}</time>
      {post.data.author && <p class="news-detail__author">— {post.data.author}</p>}
    </header>
    {post.data.hero_image && <img class="news-detail__hero" src={post.data.hero_image} alt="" />}
    <div class="prose news-detail__body"><Content /></div>
  </article>
</SiteLayout>

<style>
  .news-detail { max-width: 48rem; margin: 0 auto; }
  .news-detail__header { padding: var(--space-6) 0; border-bottom: 4px solid var(--color-primary); margin-bottom: var(--space-6); }
  .news-detail__header time { color: var(--color-muted); }
  .news-detail__author { color: var(--color-muted); margin-top: var(--space-2); }
  .news-detail__hero { width: 100%; aspect-ratio: 16/9; object-fit: cover; border-radius: var(--radius-md); margin-bottom: var(--space-8); }
  .news-detail__body { font-size: 1.1rem; }
</style>
```

- [ ] **Step 6: Verify**

Visit `/fr/actualites/`, `/en/news/`, click into any post. Switching language on a detail page goes to the news list (because slugs differ — that's acceptable; spec doesn't require slug-level cross-mapping).

- [ ] **Step 7: Commit**

```bash
git add site/src/components/NewsCard.astro site/src/pages/[lang]/actualites/ site/src/pages/[lang]/news/
git commit -m "feat(news): list and detail pages FR + EN"
```

---

### Task C3: Seed players, staff, matches, standings

**Files:**
- Create: `content/players/01-aisha-mbeki.md` through `08-...md` (8 players)
- Create: `content/staff/01-coach-koffi.md` through `03-...md` (3 staff)
- Create: `content/matches/2026-09-15-vs-yaounde.md` and 3 more (4 total: 2 upcoming, 2 completed)
- Create: `content/standings/<team>.yml` × 8

- [ ] **Step 1: Write 8 player files**

For each of the 8 players, create `content/players/<NN>-<name-slug>.md` with this template (vary name, position, jersey, display_order):

`content/players/01-aisha-mbeki.md`:
```markdown
---
name: "Aisha Mbeki"
position: "GK"
jersey_number: 1
photo: "/uploads/photos/04-team.jpeg"
bio_fr: "Gardienne expérimentée, capitaine de l'équipe."
bio_en: "Experienced goalkeeper, team captain."
status: active
display_order: 1
---
```

`content/players/02-marie-tchana.md`:
```markdown
---
name: "Marie Tchana"
position: "DF"
jersey_number: 4
bio_fr: "Défenseure centrale, lectrice du jeu."
bio_en: "Center back, reads the game well."
status: active
display_order: 2
---
```

`content/players/03-fatou-bidoung.md`:
```markdown
---
name: "Fatou Bidoung"
position: "DF"
jersey_number: 5
bio_fr: "Latérale rapide et offensive."
bio_en: "Fast attacking full-back."
status: active
display_order: 3
---
```

`content/players/04-laurence-eto.md`:
```markdown
---
name: "Laurence Eto"
position: "MF"
jersey_number: 8
bio_fr: "Milieu de terrain box-to-box."
bio_en: "Box-to-box midfielder."
status: active
display_order: 4
---
```

`content/players/05-grace-mbangue.md`:
```markdown
---
name: "Grace Mbangue"
position: "MF"
jersey_number: 10
bio_fr: "Meneuse de jeu créative, vice-capitaine."
bio_en: "Creative playmaker, vice-captain."
status: active
display_order: 5
---
```

`content/players/06-naomi-ndongo.md`:
```markdown
---
name: "Naomi Ndongo"
position: "FW"
jersey_number: 9
bio_fr: "Avant-centre, finisseuse clinique."
bio_en: "Center forward, clinical finisher."
status: active
display_order: 6
---
```

`content/players/07-cynthia-essomba.md`:
```markdown
---
name: "Cynthia Essomba"
position: "FW"
jersey_number: 11
bio_fr: "Ailière gauche, dribbleuse."
bio_en: "Left winger, skilful dribbler."
status: active
display_order: 7
---
```

`content/players/08-julia-tchoupo.md`:
```markdown
---
name: "Julia Tchoupo"
position: "MF"
jersey_number: 6
bio_fr: "Milieu défensive, récupération."
bio_en: "Defensive midfielder, ball-winner."
status: active
display_order: 8
---
```

- [ ] **Step 2: Write 3 staff files**

`content/staff/01-coach-koffi.md`:
```markdown
---
name: "Pierre Koffi"
role_fr: "Entraîneur principal"
role_en: "Head coach"
bio_fr: "Plus de 15 ans d'expérience dans le football féminin camerounais."
bio_en: "More than 15 years of experience in Cameroonian women's football."
display_order: 1
---
```

`content/staff/02-physio-mbarga.md`:
```markdown
---
name: "Sandrine Mbarga"
role_fr: "Préparatrice physique"
role_en: "Physical trainer"
display_order: 2
---
```

`content/staff/03-manager-noah.md`:
```markdown
---
name: "Marcel Noah"
role_fr: "Intendant"
role_en: "Team manager"
display_order: 3
---
```

- [ ] **Step 3: Write 4 match files**

`content/matches/2026-09-15-vs-yaounde.md`:
```markdown
---
date: 2026-09-15
kickoff: "16:00"
opponent: "FC Yaoundé"
home_or_away: home
location: "Stade Akwa, Douala"
status: completed
beko_score: 2
opponent_score: 1
recap_fr: "Victoire 2-1 obtenue dans la dernière demi-heure."
recap_en: "2-1 win secured in the final half-hour."
related_news: "match-vs-yaounde"
player_stats:
  - { player_id: "01-aisha-mbeki",     started: true, minutes_played: 90, goals: 0, assists: 0, yellow_cards: 0, red_cards: 0 }
  - { player_id: "02-marie-tchana",    started: true, minutes_played: 90, goals: 0, assists: 0, yellow_cards: 1, red_cards: 0 }
  - { player_id: "03-fatou-bidoung",   started: true, minutes_played: 90, goals: 0, assists: 1, yellow_cards: 0, red_cards: 0 }
  - { player_id: "04-laurence-eto",    started: true, minutes_played: 85, goals: 0, assists: 0, yellow_cards: 0, red_cards: 0 }
  - { player_id: "05-grace-mbangue",   started: true, minutes_played: 90, goals: 1, assists: 1, yellow_cards: 0, red_cards: 0 }
  - { player_id: "06-naomi-ndongo",    started: true, minutes_played: 90, goals: 1, assists: 0, yellow_cards: 0, red_cards: 0 }
  - { player_id: "07-cynthia-essomba", started: true, minutes_played: 75, goals: 0, assists: 1, yellow_cards: 0, red_cards: 0 }
  - { player_id: "08-julia-tchoupo",   started: false, minutes_played: 15, goals: 0, assists: 0, yellow_cards: 0, red_cards: 0 }
---
```

`content/matches/2026-09-08-vs-bafia.md`:
```markdown
---
date: 2026-09-08
kickoff: "15:30"
opponent: "Bafia FC"
home_or_away: away
location: "Stade Bafia"
status: completed
beko_score: 1
opponent_score: 1
recap_fr: "Match nul équilibré loin de nos bases."
recap_en: "Even draw away from home."
player_stats:
  - { player_id: "01-aisha-mbeki",     started: true, minutes_played: 90, goals: 0, assists: 0, yellow_cards: 0, red_cards: 0 }
  - { player_id: "02-marie-tchana",    started: true, minutes_played: 90, goals: 0, assists: 0, yellow_cards: 0, red_cards: 0 }
  - { player_id: "03-fatou-bidoung",   started: true, minutes_played: 90, goals: 0, assists: 0, yellow_cards: 0, red_cards: 0 }
  - { player_id: "04-laurence-eto",    started: true, minutes_played: 90, goals: 0, assists: 0, yellow_cards: 0, red_cards: 0 }
  - { player_id: "05-grace-mbangue",   started: true, minutes_played: 90, goals: 0, assists: 0, yellow_cards: 1, red_cards: 0 }
  - { player_id: "06-naomi-ndongo",    started: true, minutes_played: 90, goals: 1, assists: 0, yellow_cards: 0, red_cards: 0 }
---
```

`content/matches/2026-09-22-vs-buea.md`:
```markdown
---
date: 2026-09-22
kickoff: "16:00"
opponent: "Buea Ladies"
home_or_away: home
location: "Stade Akwa, Douala"
status: upcoming
---
```

`content/matches/2026-09-29-vs-bamenda.md`:
```markdown
---
date: 2026-09-29
kickoff: "16:00"
opponent: "Bamenda FC"
home_or_away: away
location: "Stade Bamenda"
status: upcoming
---
```

- [ ] **Step 4: Write 8 standings files**

For each league team, create `content/standings/<slug>.yml`. Example:

`content/standings/beko-fc.yml`:
```yaml
position: 3
team: "BEKO FC"
played: 2
won: 1
drawn: 1
lost: 0
goals_for: 3
goals_against: 2
goal_difference: 1
points: 4
is_beko: true
```

`content/standings/fc-yaounde.yml`:
```yaml
position: 5
team: "FC Yaoundé"
played: 2
won: 0
drawn: 1
lost: 1
goals_for: 1
goals_against: 2
goal_difference: -1
points: 1
is_beko: false
```

`content/standings/bafia-fc.yml`:
```yaml
position: 4
team: "Bafia FC"
played: 2
won: 1
drawn: 1
lost: 0
goals_for: 3
goals_against: 2
goal_difference: 1
points: 4
is_beko: false
```

`content/standings/buea-ladies.yml`:
```yaml
position: 2
team: "Buea Ladies"
played: 2
won: 2
drawn: 0
lost: 0
goals_for: 5
goals_against: 1
goal_difference: 4
points: 6
is_beko: false
```

`content/standings/bamenda-fc.yml`:
```yaml
position: 1
team: "Bamenda FC"
played: 2
won: 2
drawn: 0
lost: 0
goals_for: 6
goals_against: 1
goal_difference: 5
points: 6
is_beko: false
```

`content/standings/limbe-fc.yml`:
```yaml
position: 6
team: "Limbe FC"
played: 2
won: 0
drawn: 1
lost: 1
goals_for: 2
goals_against: 4
goal_difference: -2
points: 1
is_beko: false
```

`content/standings/kribi-stars.yml`:
```yaml
position: 7
team: "Kribi Stars"
played: 2
won: 0
drawn: 0
lost: 2
goals_for: 0
goals_against: 4
goal_difference: -4
points: 0
is_beko: false
```

`content/standings/garoua-fc.yml`:
```yaml
position: 8
team: "Garoua FC"
played: 2
won: 0
drawn: 0
lost: 2
goals_for: 1
goals_against: 5
goal_difference: -4
points: 0
is_beko: false
```

- [ ] **Step 5: Verify schemas**

Run: `cd site && npx astro check`
Expected: no schema violations.

- [ ] **Step 6: Commit**

```bash
git add content/players/ content/staff/ content/matches/ content/standings/
git commit -m "feat(content): seed players, staff, matches, standings"
```

---

### Task C4: Team page

**Files:**
- Create: `content/pages/team.md`
- Create: `site/src/components/PlayerCard.astro`
- Create: `site/src/pages/[lang]/equipe.astro`
- Create: `site/src/pages/[lang]/team.astro`

- [ ] **Step 1: Write team content**

Create `content/pages/team.md`:

```markdown
---
title:
  fr: "L'Équipe"
  en: "The Team"
hero_headline:
  fr: "Beko Football de Douala."
  en: "Beko Football de Douala."
hero_subhead:
  fr: "Une équipe féminine fondée à Douala, Cameroun. Notre nom complet : Beko Football de Douala (B.F.D.)."
  en: "A women's football team founded in Douala, Cameroon. Full name: Beko Football de Douala (B.F.D.)."
sections:
  - heading: { fr: "Notre histoire", en: "Our story" }
    body:
      fr: "BEKO FC est née d'une volonté locale de créer un espace compétitif et bienveillant pour le football féminin à Douala. Le club soutient ses joueuses sur et hors du terrain."
      en: "BEKO FC was born from a local desire to create a competitive and supportive space for women's football in Douala. The club supports its players on and off the pitch."
  - heading: { fr: "Notre mission", en: "Our mission" }
    body:
      fr: "Donner aux joueuses du Cameroun les moyens de progresser, dans un cadre exigeant et solidaire."
      en: "Give Cameroonian players the means to progress, in a demanding and supportive environment."
---
```

- [ ] **Step 2: Write `PlayerCard.astro`**

Create `site/src/components/PlayerCard.astro`:

```astro
---
import type { Lang } from '../i18n/routes';

interface Props {
  lang: Lang;
  name: string;
  position: 'GK' | 'DF' | 'MF' | 'FW';
  jersey_number: number;
  photo?: string;
  bio?: string;
  matches_played?: number;
  goals?: number;
  assists?: number;
}

const { lang, name, position, jersey_number, photo, bio, matches_played = 0, goals = 0, assists = 0 } = Astro.props;
const positionLabel: Record<string, { fr: string; en: string }> = {
  GK: { fr: 'GAR', en: 'GK' },
  DF: { fr: 'DEF', en: 'DF' },
  MF: { fr: 'MIL', en: 'MF' },
  FW: { fr: 'ATT', en: 'FW' },
};
const posLabel = positionLabel[position][lang];
---

<article class="player-card">
  <div class="player-card__media">
    {photo ? <img src={photo} alt={name} loading="lazy" /> : <div class="player-card__silhouette">{name.split(' ').map(p => p[0]).join('').slice(0, 2)}</div>}
    <span class="player-card__jersey">#{jersey_number}</span>
  </div>
  <div class="player-card__body">
    <h3>{name}</h3>
    <p class="player-card__position">{posLabel}</p>
    {bio && <p class="player-card__bio">{bio}</p>}
    <ul class="player-card__stats">
      <li><strong>{matches_played}</strong> {lang === 'fr' ? 'mat.' : 'GP'}</li>
      <li><strong>{goals}</strong> {lang === 'fr' ? 'buts' : 'G'}</li>
      <li><strong>{assists}</strong> {lang === 'fr' ? 'p.d.' : 'A'}</li>
    </ul>
  </div>
</article>

<style>
  .player-card { border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden; background: var(--color-paper); }
  .player-card__media { position: relative; aspect-ratio: 1; background: var(--color-soft); }
  .player-card__media img { width: 100%; height: 100%; object-fit: cover; }
  .player-card__silhouette { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-size: 3rem; color: var(--color-muted); }
  .player-card__jersey { position: absolute; top: var(--space-2); right: var(--space-2); background: var(--color-primary); color: var(--color-on-primary); font-family: var(--font-display); padding: var(--space-1) var(--space-3); border-radius: var(--radius-sm); font-size: 1.25rem; }
  .player-card__body { padding: var(--space-3); }
  .player-card__body h3 { font-size: 1.25rem; margin: 0; }
  .player-card__position { color: var(--color-muted); font-size: 0.85rem; margin: 0 0 var(--space-2); }
  .player-card__bio { font-size: 0.9rem; color: var(--color-muted); margin-bottom: var(--space-3); }
  .player-card__stats { list-style: none; margin: 0; padding: var(--space-2) 0 0; display: flex; gap: var(--space-3); border-top: 1px solid var(--color-border); }
  .player-card__stats li { font-size: 0.85rem; color: var(--color-muted); }
  .player-card__stats strong { color: var(--color-ink); font-family: var(--font-display); font-size: 1.1rem; margin-right: var(--space-1); }
</style>
```

- [ ] **Step 3: Write FR team page**

Create `site/src/pages/[lang]/equipe.astro`:

```astro
---
import SiteLayout from '../../layouts/SiteLayout.astro';
import PlayerCard from '../../components/PlayerCard.astro';
import EmptyState from '../../components/EmptyState.astro';
import { getEntry, getCollection } from 'astro:content';
import { getTranslations } from '../../i18n/t';
import { aggregateStats } from '../../lib/stats';

export function getStaticPaths() { return [{ params: { lang: 'fr' } }]; }

const lang = 'fr' as const;
const t = await getTranslations(lang);
const page = await getEntry('pages', 'team');
const players = (await getCollection('players', (e) => e.data.status === 'active'))
  .sort((a, b) => a.data.display_order - b.data.display_order);
const staff = (await getCollection('staff'))
  .sort((a, b) => a.data.display_order - b.data.display_order);
const matchEntries = await getCollection('matches');
const matches = matchEntries.map((m) => m.data);
const stats = aggregateStats(matches);
const d = page!.data;
---

<SiteLayout title={d.title.fr} lang={lang}>
  <main class="container" style="padding: var(--space-12) var(--space-4);">
    <header class="page-hero">
      <h1>{d.hero_headline?.fr ?? d.title.fr}</h1>
      {d.hero_subhead && <p class="page-hero__sub">{d.hero_subhead.fr}</p>}
    </header>

    {d.sections?.map((sec) => (
      <section class="prose" style="margin-bottom: var(--space-8);">
        <h2>{sec.heading.fr}</h2>
        <p>{sec.body.fr}</p>
      </section>
    ))}

    <section>
      <h2>Encadrement</h2>
      {staff.length === 0 ? <EmptyState message={t.empty.no_staff} /> : (
        <ul class="staff-list">
          {staff.map((s) => (
            <li>
              <strong>{s.data.name}</strong> — {s.data.role_fr}
              {s.data.bio_fr && <p>{s.data.bio_fr}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>

    <section>
      <h2>Effectif</h2>
      {players.length === 0 ? <EmptyState message={t.empty.no_players} /> : (
        <div class="players-grid">
          {players.map((p) => {
            const ps = stats.byPlayer.get(p.id.replace(/\.md$/, ''));
            return (
              <PlayerCard
                lang={lang}
                name={p.data.name}
                position={p.data.position}
                jersey_number={p.data.jersey_number}
                photo={p.data.photo}
                bio={p.data.bio_fr}
                matches_played={ps?.matches_played ?? 0}
                goals={ps?.goals ?? 0}
                assists={ps?.assists ?? 0}
              />
            );
          })}
        </div>
      )}
    </section>

    <section class="team-stats">
      <h2>Statistiques de la saison</h2>
      <ul class="team-stats__list">
        <li><strong>{stats.byTeam.matches_played}</strong> {t.labels.matches_played}</li>
        <li><strong>{stats.byTeam.wins}</strong> V</li>
        <li><strong>{stats.byTeam.draws}</strong> N</li>
        <li><strong>{stats.byTeam.losses}</strong> D</li>
        <li><strong>{stats.byTeam.goals_for}</strong> {t.labels.goals}</li>
        <li><strong>{stats.byTeam.goals_against}</strong> Bc</li>
      </ul>
    </section>
  </main>
</SiteLayout>

<style>
  .page-hero { padding: var(--space-8) 0; border-bottom: 4px solid var(--color-primary); margin-bottom: var(--space-8); }
  .page-hero__sub { font-size: 1.2rem; color: var(--color-muted); }
  section h2 { margin-top: var(--space-12); }
  .staff-list { list-style: none; padding: 0; }
  .staff-list li { padding: var(--space-3) 0; border-bottom: 1px solid var(--color-border); }
  .players-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: var(--space-4); }
  .team-stats__list { list-style: none; padding: var(--space-6); margin: 0; display: flex; flex-wrap: wrap; gap: var(--space-6); background: var(--color-soft); border-radius: var(--radius-md); }
  .team-stats__list strong { font-family: var(--font-display); font-size: 2rem; margin-right: var(--space-2); }
</style>
```

- [ ] **Step 4: Write EN team page**

Create `site/src/pages/[lang]/team.astro` — same template as `equipe.astro` but `lang = 'en'`, all `.fr` → `.en`, `bio_fr` → `bio_en`, `role_fr` → `role_en`, headings translated ("Staff" / "Roster" / "Season statistics" / "Matches played"). Adjust strong-stat letters to W/D/L/F/A.

```astro
---
import SiteLayout from '../../layouts/SiteLayout.astro';
import PlayerCard from '../../components/PlayerCard.astro';
import EmptyState from '../../components/EmptyState.astro';
import { getEntry, getCollection } from 'astro:content';
import { getTranslations } from '../../i18n/t';
import { aggregateStats } from '../../lib/stats';

export function getStaticPaths() { return [{ params: { lang: 'en' } }]; }

const lang = 'en' as const;
const t = await getTranslations(lang);
const page = await getEntry('pages', 'team');
const players = (await getCollection('players', (e) => e.data.status === 'active'))
  .sort((a, b) => a.data.display_order - b.data.display_order);
const staff = (await getCollection('staff'))
  .sort((a, b) => a.data.display_order - b.data.display_order);
const matchEntries = await getCollection('matches');
const matches = matchEntries.map((m) => m.data);
const stats = aggregateStats(matches);
const d = page!.data;
---

<SiteLayout title={d.title.en} lang={lang}>
  <main class="container" style="padding: var(--space-12) var(--space-4);">
    <header class="page-hero">
      <h1>{d.hero_headline?.en ?? d.title.en}</h1>
      {d.hero_subhead && <p class="page-hero__sub">{d.hero_subhead.en}</p>}
    </header>

    {d.sections?.map((sec) => (
      <section class="prose" style="margin-bottom: var(--space-8);">
        <h2>{sec.heading.en}</h2>
        <p>{sec.body.en}</p>
      </section>
    ))}

    <section>
      <h2>Staff</h2>
      {staff.length === 0 ? <EmptyState message={t.empty.no_staff} /> : (
        <ul class="staff-list">
          {staff.map((s) => (
            <li>
              <strong>{s.data.name}</strong> — {s.data.role_en}
              {s.data.bio_en && <p>{s.data.bio_en}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>

    <section>
      <h2>Roster</h2>
      {players.length === 0 ? <EmptyState message={t.empty.no_players} /> : (
        <div class="players-grid">
          {players.map((p) => {
            const ps = stats.byPlayer.get(p.id.replace(/\.md$/, ''));
            return (
              <PlayerCard
                lang={lang}
                name={p.data.name}
                position={p.data.position}
                jersey_number={p.data.jersey_number}
                photo={p.data.photo}
                bio={p.data.bio_en}
                matches_played={ps?.matches_played ?? 0}
                goals={ps?.goals ?? 0}
                assists={ps?.assists ?? 0}
              />
            );
          })}
        </div>
      )}
    </section>

    <section class="team-stats">
      <h2>Season statistics</h2>
      <ul class="team-stats__list">
        <li><strong>{stats.byTeam.matches_played}</strong> {t.labels.matches_played}</li>
        <li><strong>{stats.byTeam.wins}</strong> W</li>
        <li><strong>{stats.byTeam.draws}</strong> D</li>
        <li><strong>{stats.byTeam.losses}</strong> L</li>
        <li><strong>{stats.byTeam.goals_for}</strong> {t.labels.goals}</li>
        <li><strong>{stats.byTeam.goals_against}</strong> GA</li>
      </ul>
    </section>
  </main>
</SiteLayout>

<style>
  .page-hero { padding: var(--space-8) 0; border-bottom: 4px solid var(--color-primary); margin-bottom: var(--space-8); }
  .page-hero__sub { font-size: 1.2rem; color: var(--color-muted); }
  section h2 { margin-top: var(--space-12); }
  .staff-list { list-style: none; padding: 0; }
  .staff-list li { padding: var(--space-3) 0; border-bottom: 1px solid var(--color-border); }
  .players-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: var(--space-4); }
  .team-stats__list { list-style: none; padding: var(--space-6); margin: 0; display: flex; flex-wrap: wrap; gap: var(--space-6); background: var(--color-soft); border-radius: var(--radius-md); }
  .team-stats__list strong { font-family: var(--font-display); font-size: 2rem; margin-right: var(--space-2); }
</style>
```

- [ ] **Step 5: Verify**

Visit `/fr/equipe/` and `/en/team/` — roster grid renders, season stats show real aggregated numbers (Aisha 2 GP, Marie 2 GP, Naomi 2 GP 2G, Grace 1 GP 1G 1A, etc.).

- [ ] **Step 6: Commit**

```bash
git add content/pages/team.md site/src/components/PlayerCard.astro site/src/pages/[lang]/equipe.astro site/src/pages/[lang]/team.astro
git commit -m "feat(team): page with roster, staff, season stats from match data"
```

---

### Task C5: Matches page (standings + upcoming + completed)

**Files:**
- Create: `site/src/components/StandingsTable.astro`
- Create: `site/src/components/MatchRow.astro`
- Create: `site/src/pages/[lang]/matchs.astro`
- Create: `site/src/pages/[lang]/matches.astro`

- [ ] **Step 1: Write `StandingsTable.astro`**

Create `site/src/components/StandingsTable.astro`:

```astro
---
import type { Lang } from '../i18n/routes';
import { getCollection } from 'astro:content';

interface Props { lang: Lang; }
const { lang } = Astro.props;
const rows = (await getCollection('standings'))
  .map((e) => e.data)
  .sort((a, b) => a.position - b.position);
const headers = lang === 'fr'
  ? ['#', 'Équipe', 'J', 'G', 'N', 'P', 'BP', 'BC', '+/-', 'Pts']
  : ['#', 'Team', 'P', 'W', 'D', 'L', 'GF', 'GA', 'GD', 'Pts'];
---

<table class="standings">
  <thead>
    <tr>{headers.map((h) => <th>{h}</th>)}</tr>
  </thead>
  <tbody>
    {rows.map((r) => (
      <tr class:list={["standings__row", { "standings__row--beko": r.is_beko }]}>
        <td>{r.position}</td>
        <td>{r.team}</td>
        <td>{r.played}</td>
        <td>{r.won}</td>
        <td>{r.drawn}</td>
        <td>{r.lost}</td>
        <td>{r.goals_for}</td>
        <td>{r.goals_against}</td>
        <td>{r.goal_difference}</td>
        <td><strong>{r.points}</strong></td>
      </tr>
    ))}
  </tbody>
</table>

<style>
  .standings { width: 100%; border-collapse: collapse; font-size: 0.95rem; }
  .standings th, .standings td { padding: var(--space-2) var(--space-3); text-align: left; border-bottom: 1px solid var(--color-border); }
  .standings th { background: var(--color-soft); font-family: var(--font-display); letter-spacing: 0.05em; }
  .standings__row--beko { background: var(--color-primary); }
  .standings__row--beko td { font-weight: 700; }
</style>
```

- [ ] **Step 2: Write `MatchRow.astro`**

Create `site/src/components/MatchRow.astro`:

```astro
---
import type { Lang } from '../i18n/routes';

interface Props {
  lang: Lang;
  date: Date;
  kickoff?: string;
  opponent: string;
  home_or_away: 'home' | 'away';
  location: string;
  status: 'upcoming' | 'completed';
  beko_score?: number;
  opponent_score?: number;
  recap?: string;
}

const { lang, date, kickoff, opponent, home_or_away, location, status, beko_score, opponent_score, recap } = Astro.props;
const dateStr = new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short' }).format(date);
const venue = home_or_away === 'home' ? (lang === 'fr' ? 'Domicile' : 'Home') : (lang === 'fr' ? 'Extérieur' : 'Away');
const left = home_or_away === 'home' ? 'BEKO FC' : opponent;
const right = home_or_away === 'home' ? opponent : 'BEKO FC';
const leftScore = home_or_away === 'home' ? beko_score : opponent_score;
const rightScore = home_or_away === 'home' ? opponent_score : beko_score;
---

<article class="match-row">
  <div class="match-row__meta">
    <time datetime={date.toISOString()}>{dateStr}</time>
    {kickoff && <span class="match-row__kickoff">{kickoff}</span>}
    <span class="match-row__venue">{venue} — {location}</span>
  </div>
  <div class="match-row__teams">
    <span class="match-row__team">{left}</span>
    {status === 'completed' ? (
      <span class="match-row__score">{leftScore} – {rightScore}</span>
    ) : (
      <span class="match-row__vs">vs</span>
    )}
    <span class="match-row__team">{right}</span>
  </div>
  {recap && <p class="match-row__recap">{recap}</p>}
</article>

<style>
  .match-row { padding: var(--space-4); border: 1px solid var(--color-border); border-radius: var(--radius-md); margin-bottom: var(--space-3); background: var(--color-paper); }
  .match-row__meta { display: flex; gap: var(--space-3); flex-wrap: wrap; color: var(--color-muted); font-size: 0.9rem; margin-bottom: var(--space-3); }
  .match-row__teams { display: flex; align-items: center; justify-content: center; gap: var(--space-4); font-family: var(--font-display); font-size: 1.5rem; }
  .match-row__score { background: var(--color-primary); padding: var(--space-1) var(--space-3); border-radius: var(--radius-sm); }
  .match-row__vs { color: var(--color-muted); font-size: 1rem; }
  .match-row__recap { margin: var(--space-3) 0 0; color: var(--color-muted); }
</style>
```

- [ ] **Step 3: Write FR matches page**

Create `site/src/pages/[lang]/matchs.astro`:

```astro
---
import SiteLayout from '../../layouts/SiteLayout.astro';
import StandingsTable from '../../components/StandingsTable.astro';
import MatchRow from '../../components/MatchRow.astro';
import EmptyState from '../../components/EmptyState.astro';
import { getCollection } from 'astro:content';
import { getTranslations } from '../../i18n/t';

export function getStaticPaths() { return [{ params: { lang: 'fr' } }]; }

const lang = 'fr' as const;
const t = await getTranslations(lang);
const matches = (await getCollection('matches')).map((m) => m.data);
const upcoming = matches.filter((m) => m.status === 'upcoming').sort((a, b) => a.date.getTime() - b.date.getTime());
const completed = matches.filter((m) => m.status === 'completed').sort((a, b) => b.date.getTime() - a.date.getTime());
const standings = await getCollection('standings');
---

<SiteLayout title={t.nav.matches} lang={lang}>
  <main class="container" style="padding: var(--space-12) var(--space-4);">
    <header class="page-hero">
      <h1>{t.nav.matches}</h1>
    </header>

    <section>
      <h2>Classement</h2>
      {standings.length === 0 ? <EmptyState message={t.empty.no_standings} /> : <StandingsTable lang={lang} />}
    </section>

    <section>
      <h2>Matchs à venir</h2>
      {upcoming.length === 0 ? <EmptyState message={t.empty.no_matches} /> : (
        upcoming.map((m) => <MatchRow lang={lang} {...m} recap={undefined} />)
      )}
    </section>

    <section>
      <h2>Résultats récents</h2>
      {completed.length === 0 ? <EmptyState message={t.empty.no_matches} /> : (
        completed.map((m) => <MatchRow lang={lang} {...m} recap={m.recap_fr} />)
      )}
    </section>
  </main>
</SiteLayout>

<style>
  .page-hero { padding: var(--space-8) 0; border-bottom: 4px solid var(--color-primary); margin-bottom: var(--space-8); }
  section h2 { margin-top: var(--space-12); }
</style>
```

- [ ] **Step 4: Write EN matches page**

Create `site/src/pages/[lang]/matches.astro` — mirror with `lang = 'en'`, headings "Standings" / "Upcoming matches" / "Recent results", `recap_en` instead of `recap_fr`.

```astro
---
import SiteLayout from '../../layouts/SiteLayout.astro';
import StandingsTable from '../../components/StandingsTable.astro';
import MatchRow from '../../components/MatchRow.astro';
import EmptyState from '../../components/EmptyState.astro';
import { getCollection } from 'astro:content';
import { getTranslations } from '../../i18n/t';

export function getStaticPaths() { return [{ params: { lang: 'en' } }]; }

const lang = 'en' as const;
const t = await getTranslations(lang);
const matches = (await getCollection('matches')).map((m) => m.data);
const upcoming = matches.filter((m) => m.status === 'upcoming').sort((a, b) => a.date.getTime() - b.date.getTime());
const completed = matches.filter((m) => m.status === 'completed').sort((a, b) => b.date.getTime() - a.date.getTime());
const standings = await getCollection('standings');
---

<SiteLayout title={t.nav.matches} lang={lang}>
  <main class="container" style="padding: var(--space-12) var(--space-4);">
    <header class="page-hero">
      <h1>{t.nav.matches}</h1>
    </header>

    <section>
      <h2>Standings</h2>
      {standings.length === 0 ? <EmptyState message={t.empty.no_standings} /> : <StandingsTable lang={lang} />}
    </section>

    <section>
      <h2>Upcoming matches</h2>
      {upcoming.length === 0 ? <EmptyState message={t.empty.no_matches} /> : (
        upcoming.map((m) => <MatchRow lang={lang} {...m} recap={undefined} />)
      )}
    </section>

    <section>
      <h2>Recent results</h2>
      {completed.length === 0 ? <EmptyState message={t.empty.no_matches} /> : (
        completed.map((m) => <MatchRow lang={lang} {...m} recap={m.recap_en} />)
      )}
    </section>
  </main>
</SiteLayout>

<style>
  .page-hero { padding: var(--space-8) 0; border-bottom: 4px solid var(--color-primary); margin-bottom: var(--space-8); }
  section h2 { margin-top: var(--space-12); }
</style>
```

- [ ] **Step 5: Verify**

Visit `/fr/matchs/` and `/en/matches/` — standings table shows BEKO row highlighted yellow, upcoming + completed lists render with scores.

- [ ] **Step 6: Commit**

```bash
git add site/src/components/StandingsTable.astro site/src/components/MatchRow.astro site/src/pages/[lang]/matchs.astro site/src/pages/[lang]/matches.astro
git commit -m "feat(matches): page with standings, upcoming, results"
```

---

### Task C6: Sponsors page

**Files:**
- Create: `content/pages/sponsors.md`
- Create: `content/sponsors/sample-sponsor-1.md` × 3
- Create: `site/src/components/SponsorCard.astro`
- Create: `site/src/pages/[lang]/partenaires.astro`
- Create: `site/src/pages/[lang]/sponsors.astro`

- [ ] **Step 1: Write sponsors page content**

Create `content/pages/sponsors.md`:

```markdown
---
title:
  fr: "Partenaires"
  en: "Sponsors"
hero_headline:
  fr: "Soutenez le foot féminin camerounais."
  en: "Support Cameroonian women's football."
hero_subhead:
  fr: "BEKO FC propose trois niveaux de partenariat adaptés à votre engagement."
  en: "BEKO FC offers three partnership tiers tailored to your commitment."
body_fr: |
  Devenir partenaire de BEKO FC, c'est s'associer à un projet sportif local, fédérateur et porteur de valeurs.

  Notre audience grandit chaque saison : présence aux matchs, suivi en ligne, présence dans la presse locale.

  Pour discuter des modalités, contactez-nous à `contact@bekofc.com`.
body_en: |
  Becoming a BEKO FC partner means joining a local, unifying sports project rooted in strong values.

  Our audience grows every season — match-day attendance, online following, local press coverage.

  To discuss the details, contact us at `contact@bekofc.com`.
---
```

- [ ] **Step 2: Seed 3 sponsors**

`content/sponsors/example-tech-cm.md`:
```markdown
---
name: "Example Tech CM"
website: "https://example-tech.cm"
tier: principal
active: true
display_order: 1
---
```

`content/sponsors/douala-imprimerie.md`:
```markdown
---
name: "Douala Imprimerie"
tier: officiel
active: true
display_order: 2
---
```

`content/sponsors/cafe-beko.md`:
```markdown
---
name: "Café Beko"
tier: supporter
active: true
display_order: 3
---
```

- [ ] **Step 3: Write `SponsorCard.astro`**

Create `site/src/components/SponsorCard.astro`:

```astro
---
interface Props { name: string; logo?: string; website?: string; }
const { name, logo, website } = Astro.props;
---
<div class="sponsor-card">
  {website ? (
    <a href={website} rel="noopener" class="sponsor-card__link">
      {logo ? <img src={logo} alt={name} /> : <strong>{name}</strong>}
    </a>
  ) : (
    logo ? <img src={logo} alt={name} /> : <strong>{name}</strong>
  )}
</div>

<style>
  .sponsor-card { padding: var(--space-4); border: 1px solid var(--color-border); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; min-height: 100px; background: var(--color-paper); }
  .sponsor-card img { max-width: 140px; max-height: 60px; }
  .sponsor-card__link { text-decoration: none; }
</style>
```

- [ ] **Step 4: Write FR sponsors page**

Create `site/src/pages/[lang]/partenaires.astro`:

```astro
---
import SiteLayout from '../../layouts/SiteLayout.astro';
import SponsorCard from '../../components/SponsorCard.astro';
import EmptyState from '../../components/EmptyState.astro';
import { getEntry, getCollection } from 'astro:content';
import { getTranslations } from '../../i18n/t';

export function getStaticPaths() { return [{ params: { lang: 'fr' } }]; }

const lang = 'fr' as const;
const t = await getTranslations(lang);
const page = await getEntry('pages', 'sponsors');
const tiers = (await getEntry('sponsor-tiers', 'sponsor-tiers'))!.data.tiers;
const sponsors = (await getCollection('sponsors', (e) => e.data.active))
  .sort((a, b) => a.data.display_order - b.data.display_order);
const settings = await getEntry('settings', 'settings');
const inquiryEmail = settings!.data.sponsor_inquiry_email;
const d = page!.data;
---

<SiteLayout title={d.title.fr} lang={lang}>
  <main class="container" style="padding: var(--space-12) var(--space-4);">
    <header class="page-hero">
      <h1>{d.hero_headline?.fr ?? d.title.fr}</h1>
      {d.hero_subhead && <p class="page-hero__sub">{d.hero_subhead.fr}</p>}
    </header>

    <article class="prose" set:html={(d.body_fr ?? '').replace(/\n\n/g, '</p><p>').replace(/^/, '<p>').replace(/$/, '</p>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>')} />

    <section class="tiers">
      {tiers.sort((a, b) => a.prominence - b.prominence).map((tier) => (
        <article class="tier">
          <h3>{tier.name.fr}</h3>
          <p class="tier__price">{tier.price.fr}</p>
          <ul class="tier__benefits">
            {tier.benefits.fr.map((b) => <li>{b}</li>)}
          </ul>
          <a class="btn" href={`mailto:${inquiryEmail}?subject=${encodeURIComponent(tier.name.fr)}`}>{t.labels.sponsor_inquiry}</a>
        </article>
      ))}
    </section>

    <section>
      <h2>Nos partenaires actuels</h2>
      {sponsors.length === 0 ? <EmptyState message={t.empty.no_sponsors} /> : (
        <div class="sponsors-grid">
          {sponsors.map((s) => <SponsorCard name={s.data.name} logo={s.data.logo} website={s.data.website} />)}
        </div>
      )}
    </section>
  </main>
</SiteLayout>

<style>
  .page-hero { padding: var(--space-8) 0; border-bottom: 4px solid var(--color-primary); margin-bottom: var(--space-8); }
  .page-hero__sub { font-size: 1.2rem; color: var(--color-muted); }
  .tiers { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: var(--space-4); margin: var(--space-12) 0; }
  .tier { padding: var(--space-6); border: 2px solid var(--color-ink); border-radius: var(--radius-md); display: flex; flex-direction: column; gap: var(--space-3); background: var(--color-paper); }
  .tier__price { font-family: var(--font-display); font-size: 1.5rem; }
  .tier__benefits { padding-left: var(--space-6); margin: 0; }
  .tier .btn { margin-top: auto; align-self: start; }
  .sponsors-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: var(--space-4); }
  section h2 { margin-top: var(--space-12); }
</style>
```

- [ ] **Step 5: Write EN sponsors page**

Create `site/src/pages/[lang]/sponsors.astro` — same structure, `lang = 'en'`, fields `.en`, body `body_en`.

```astro
---
import SiteLayout from '../../layouts/SiteLayout.astro';
import SponsorCard from '../../components/SponsorCard.astro';
import EmptyState from '../../components/EmptyState.astro';
import { getEntry, getCollection } from 'astro:content';
import { getTranslations } from '../../i18n/t';

export function getStaticPaths() { return [{ params: { lang: 'en' } }]; }

const lang = 'en' as const;
const t = await getTranslations(lang);
const page = await getEntry('pages', 'sponsors');
const tiers = (await getEntry('sponsor-tiers', 'sponsor-tiers'))!.data.tiers;
const sponsors = (await getCollection('sponsors', (e) => e.data.active))
  .sort((a, b) => a.data.display_order - b.data.display_order);
const settings = await getEntry('settings', 'settings');
const inquiryEmail = settings!.data.sponsor_inquiry_email;
const d = page!.data;
---

<SiteLayout title={d.title.en} lang={lang}>
  <main class="container" style="padding: var(--space-12) var(--space-4);">
    <header class="page-hero">
      <h1>{d.hero_headline?.en ?? d.title.en}</h1>
      {d.hero_subhead && <p class="page-hero__sub">{d.hero_subhead.en}</p>}
    </header>

    <article class="prose" set:html={(d.body_en ?? '').replace(/\n\n/g, '</p><p>').replace(/^/, '<p>').replace(/$/, '</p>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>')} />

    <section class="tiers">
      {tiers.sort((a, b) => a.prominence - b.prominence).map((tier) => (
        <article class="tier">
          <h3>{tier.name.en}</h3>
          <p class="tier__price">{tier.price.en}</p>
          <ul class="tier__benefits">
            {tier.benefits.en.map((b) => <li>{b}</li>)}
          </ul>
          <a class="btn" href={`mailto:${inquiryEmail}?subject=${encodeURIComponent(tier.name.en)}`}>{t.labels.sponsor_inquiry}</a>
        </article>
      ))}
    </section>

    <section>
      <h2>Current partners</h2>
      {sponsors.length === 0 ? <EmptyState message={t.empty.no_sponsors} /> : (
        <div class="sponsors-grid">
          {sponsors.map((s) => <SponsorCard name={s.data.name} logo={s.data.logo} website={s.data.website} />)}
        </div>
      )}
    </section>
  </main>
</SiteLayout>

<style>
  .page-hero { padding: var(--space-8) 0; border-bottom: 4px solid var(--color-primary); margin-bottom: var(--space-8); }
  .page-hero__sub { font-size: 1.2rem; color: var(--color-muted); }
  .tiers { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: var(--space-4); margin: var(--space-12) 0; }
  .tier { padding: var(--space-6); border: 2px solid var(--color-ink); border-radius: var(--radius-md); display: flex; flex-direction: column; gap: var(--space-3); background: var(--color-paper); }
  .tier__price { font-family: var(--font-display); font-size: 1.5rem; }
  .tier__benefits { padding-left: var(--space-6); margin: 0; }
  .tier .btn { margin-top: auto; align-self: start; }
  .sponsors-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: var(--space-4); }
  section h2 { margin-top: var(--space-12); }
</style>
```

- [ ] **Step 6: Verify**

Visit `/fr/partenaires/` and `/en/sponsors/` — three tier cards, three sample sponsors visible.

- [ ] **Step 7: Commit**

```bash
git add content/pages/sponsors.md content/sponsors/ site/src/components/SponsorCard.astro site/src/pages/[lang]/partenaires.astro site/src/pages/[lang]/sponsors.astro
git commit -m "feat(sponsors): page with tier cards + active sponsor grid"
```

---

### Task C7: Home page

**Files:**
- Create: `content/pages/home.md`
- Modify: `site/src/pages/[lang]/index.astro` (replace placeholder)

- [ ] **Step 1: Write home content**

Create `content/pages/home.md`:

```markdown
---
title:
  fr: "Accueil"
  en: "Home"
hero_headline:
  fr: "BEKO FC."
  en: "BEKO FC."
hero_subhead:
  fr: "Beko Football de Douala — fierté féminine du foot camerounais."
  en: "Beko Football de Douala — pride of Cameroonian women's football."
hero_image: "/uploads/photos/01-team.jpeg"
---
```

- [ ] **Step 2: Replace `[lang]/index.astro` with the real home composition**

Replace `site/src/pages/[lang]/index.astro`:

```astro
---
import SiteLayout from '../../layouts/SiteLayout.astro';
import NewsCard from '../../components/NewsCard.astro';
import MatchRow from '../../components/MatchRow.astro';
import SponsorCard from '../../components/SponsorCard.astro';
import { getEntry, getCollection } from 'astro:content';
import { getTranslations } from '../../i18n/t';
import { routeFor, type Lang } from '../../i18n/routes';

export function getStaticPaths() {
  return [{ params: { lang: 'fr' } }, { params: { lang: 'en' } }];
}

const lang = Astro.params.lang as Lang;
const t = await getTranslations(lang);
const page = await getEntry('pages', 'home');
const d = page!.data;

const allNews = await getCollection('news', (e) => e.data.lang === lang && e.data.status === 'published');
const news = allNews.sort((a, b) => b.data.date.getTime() - a.data.date.getTime()).slice(0, 3);

const matches = (await getCollection('matches')).map((m) => m.data);
const nextMatch = matches.filter((m) => m.status === 'upcoming').sort((a, b) => a.date.getTime() - b.date.getTime())[0];

const gallery = (await getCollection('gallery')).map((g) => g.data).sort((a, b) => a.display_order - b.display_order).slice(0, 6);

const sponsors = (await getCollection('sponsors', (e) => e.data.active))
  .sort((a, b) => a.data.display_order - b.data.display_order);
---

<SiteLayout title={t.nav.home} lang={lang}>
  <section class="hero">
    {d.hero_image && <img class="hero__bg" src={d.hero_image} alt="" />}
    <div class="hero__overlay"></div>
    <div class="container hero__inner">
      <h1>{d.hero_headline?.[lang] ?? 'BEKO FC'}</h1>
      {d.hero_subhead && <p class="hero__sub">{d.hero_subhead[lang]}</p>}
      <div class="hero__cta">
        <a class="btn" href={routeFor('donate', lang)}>{t.buttons.donate}</a>
        <a class="btn btn--ghost" href={routeFor('sponsors', lang)}>{t.buttons.sponsor}</a>
      </div>
    </div>
  </section>

  <main class="container" style="padding: var(--space-12) var(--space-4);">
    <section>
      <h2>{t.nav.news}</h2>
      {news.length > 0 ? (
        <div class="news-grid">
          {news.map((p) => (
            <NewsCard lang={lang} slug={p.data.slug} title={p.data.title} date={p.data.date} hero_image={p.data.hero_image} />
          ))}
        </div>
      ) : <p>{t.empty.no_news}</p>}
    </section>

    {nextMatch && (
      <section>
        <h2>{lang === 'fr' ? 'Prochain match' : 'Next match'}</h2>
        <MatchRow lang={lang} {...nextMatch} recap={undefined} />
      </section>
    )}

    {gallery.length > 0 && (
      <section>
        <h2>{t.nav.gallery}</h2>
        <div class="gallery-strip">
          {gallery.map((g) => (
            <a href={routeFor('gallery', lang)} class="gallery-strip__tile">
              <img src={g.poster ?? g.src} alt={g.caption_fr ?? g.caption_en ?? ''} loading="lazy" />
            </a>
          ))}
        </div>
      </section>
    )}

    {sponsors.length > 0 && (
      <section>
        <h2>{t.nav.sponsors}</h2>
        <div class="sponsors-strip">
          {sponsors.map((s) => <SponsorCard name={s.data.name} logo={s.data.logo} website={s.data.website} />)}
        </div>
      </section>
    )}
  </main>
</SiteLayout>

<style>
  .hero { position: relative; min-height: 70vh; display: flex; align-items: center; overflow: hidden; }
  .hero__bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; }
  .hero__overlay { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(10,10,10,0.6) 0%, rgba(10,10,10,0.4) 100%); z-index: 1; }
  .hero__inner { position: relative; z-index: 2; color: var(--color-paper); padding: var(--space-16) var(--space-4); }
  .hero__inner h1 { font-size: clamp(3rem, 8vw, 6rem); margin: 0 0 var(--space-4); }
  .hero__sub { font-size: clamp(1.1rem, 2vw, 1.4rem); max-width: 36rem; }
  .hero__cta { display: flex; gap: var(--space-3); margin-top: var(--space-6); flex-wrap: wrap; }
  .btn--ghost { background: transparent; color: var(--color-paper); border-color: var(--color-paper); }
  section h2 { margin-top: var(--space-12); border-left: 6px solid var(--color-primary); padding-left: var(--space-3); }
  .news-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-6); }
  .gallery-strip { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: var(--space-3); }
  .gallery-strip__tile img { aspect-ratio: 1; object-fit: cover; border-radius: var(--radius-sm); }
  .sponsors-strip { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: var(--space-4); }
</style>
```

- [ ] **Step 3: Verify**

Visit `/fr/` and `/en/` — full home renders: hero, latest 3 news, next match, top 6 gallery (placeholder until C8), sponsors strip.

- [ ] **Step 4: Commit**

```bash
git add content/pages/home.md site/src/pages/[lang]/index.astro
git commit -m "feat(home): hero, latest news, next match, gallery strip, sponsors"
```

---

End of Phase C. Data-driven pages live: news (list + detail), team (with stat aggregation), matches (standings + lists), sponsors (tier cards + grid), home (composition).

---

## Phase D — Interactive features (gallery lightbox + video, asset upload, 404)

### Task D1: Seed gallery entries

**Files:**
- Create: `content/gallery/01-team-photo.yml` through `12-...yml` (12 image entries)
- Create: `content/gallery/v01-clip.yml` through `v06-...yml` (6 video entries)

- [ ] **Step 1: Write 12 image gallery entries**

For each, create `content/gallery/<NN>-team.yml`:

`content/gallery/01-team.yml`:
```yaml
type: image
src: "/uploads/photos/01-team.jpeg"
caption_fr: "L'équipe BEKO FC à l'entraînement"
caption_en: "BEKO FC team in training"
album: training
date: 2026-09-10
display_order: 1
```

Repeat for `02` through `12` — increment `src` filename, vary `display_order` 2..12, vary `caption_fr/en` slightly (use placeholder captions like "Match action", "Team huddle", etc.).

For brevity, write a small script — or just paste 12 files. Each should reference a real `/uploads/photos/<NN>-team.jpeg` (the import script generated those).

Sample variations:
- `02-team.yml`: `caption_fr: "Avant le coup d'envoi"`, `caption_en: "Before kickoff"`, `album: matchday`
- `03-team.yml`: `caption_fr: "Échauffement"`, `caption_en: "Warm-up"`, `album: training`
- ...

- [ ] **Step 2: Write 6 video gallery entries**

`content/gallery/v01-clip.yml`:
```yaml
type: video
src: "/media/01-clip.mp4"
poster: "/uploads/photos/01-team.jpeg"
caption_fr: "Action de match"
caption_en: "Match action"
album: matchday
date: 2026-09-15
display_order: 13
```

Repeat for `v02` through `v06`, each pointing at `/media/<NN>-clip.mp4`. Use distinct posters and captions.

- [ ] **Step 3: Verify schemas**

Run: `cd site && npx astro check`

- [ ] **Step 4: Commit**

```bash
git add content/gallery/
git commit -m "feat(content): seed gallery (12 photos + 6 videos)"
```

---

### Task D2: Gallery components (Lightbox + VideoPlayer + Tile)

**Files:**
- Create: `site/src/components/Lightbox.astro`
- Create: `site/src/components/GalleryTile.astro`

- [ ] **Step 1: Write `Lightbox.astro` (mounted globally in SiteLayout)**

Create `site/src/components/Lightbox.astro`:

```astro
---
import type { Lang } from '../i18n/routes';
interface Props { lang: Lang; }
const { lang } = Astro.props;
const closeLabel = lang === 'fr' ? 'Fermer' : 'Close';
---

<dialog class="lightbox" aria-label={closeLabel}>
  <button class="lightbox__close" aria-label={closeLabel}>×</button>
  <div class="lightbox__content"></div>
</dialog>

<style>
  .lightbox {
    border: none; padding: 0; background: rgba(10, 10, 10, 0.92);
    width: 90vw; max-width: 1200px; max-height: 90vh;
    border-radius: var(--radius-md);
  }
  .lightbox::backdrop { background: rgba(10, 10, 10, 0.85); }
  .lightbox__close {
    position: absolute; top: 1rem; right: 1rem; z-index: 10;
    background: var(--color-primary); color: var(--color-on-primary);
    border: none; border-radius: 50%; width: 40px; height: 40px;
    font-size: 1.5rem; line-height: 1; padding: 0;
  }
  .lightbox__content { display: flex; align-items: center; justify-content: center; padding: 2rem; }
  .lightbox__content img, .lightbox__content video { max-width: 100%; max-height: 80vh; }
</style>

<script>
  const lightbox = document.querySelector('.lightbox') as HTMLDialogElement | null;
  const content = lightbox?.querySelector('.lightbox__content') as HTMLElement | null;
  const closeBtn = lightbox?.querySelector('.lightbox__close') as HTMLButtonElement | null;

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const tile = target.closest('[data-lightbox]') as HTMLAnchorElement | null;
    if (!tile || !lightbox || !content) return;
    e.preventDefault();
    const type = tile.dataset.lightbox;
    const src = tile.getAttribute('href') ?? '';
    const caption = tile.dataset.caption ?? '';

    content.innerHTML = '';
    if (type === 'video') {
      const v = document.createElement('video');
      v.src = src;
      v.controls = true;
      v.autoplay = true;
      v.preload = 'metadata';
      content.appendChild(v);
    } else {
      const img = document.createElement('img');
      img.src = src;
      img.alt = caption;
      content.appendChild(img);
    }
    lightbox.showModal();
  });

  closeBtn?.addEventListener('click', () => {
    if (lightbox?.open) lightbox.close();
    if (content) content.innerHTML = '';
  });

  lightbox?.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      lightbox.close();
      if (content) content.innerHTML = '';
    }
  });

  lightbox?.addEventListener('close', () => {
    if (content) content.innerHTML = '';
  });
</script>
```

- [ ] **Step 2: Write `GalleryTile.astro`**

Create `site/src/components/GalleryTile.astro`:

```astro
---
interface Props {
  type: 'image' | 'video';
  src: string;
  poster?: string;
  caption?: string;
}
const { type, src, poster, caption } = Astro.props;
const thumbSrc = type === 'video' ? (poster ?? '') : src;
---

<a class="gallery-tile" href={src} data-lightbox={type} data-caption={caption ?? ''} aria-label={caption ?? src}>
  <img src={thumbSrc} alt={caption ?? ''} loading="lazy" />
  {type === 'video' && (
    <span class="gallery-tile__play" aria-hidden="true">▶</span>
  )}
  {caption && <figcaption class="gallery-tile__caption">{caption}</figcaption>}
</a>

<style>
  .gallery-tile { position: relative; display: block; aspect-ratio: 1; overflow: hidden; border-radius: var(--radius-sm); background: var(--color-soft); text-decoration: none; }
  .gallery-tile:hover { background: var(--color-soft); }
  .gallery-tile img { width: 100%; height: 100%; object-fit: cover; }
  .gallery-tile__play {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    width: 56px; height: 56px; border-radius: 50%;
    background: var(--color-primary); color: var(--color-on-primary);
    display: flex; align-items: center; justify-content: center;
    font-size: 1.5rem; padding-left: 4px;
  }
  .gallery-tile__caption {
    position: absolute; bottom: 0; left: 0; right: 0;
    background: linear-gradient(180deg, transparent 0%, rgba(10,10,10,0.7) 100%);
    color: var(--color-paper); padding: var(--space-2);
    font-size: 0.85rem; opacity: 0; transition: opacity 0.15s;
  }
  .gallery-tile:hover .gallery-tile__caption { opacity: 1; }
</style>
```

- [ ] **Step 3: Mount lightbox in SiteLayout**

Edit `site/src/layouts/SiteLayout.astro` — add Lightbox at the bottom (above Footer):

```astro
---
import BaseLayout from './BaseLayout.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import Lightbox from '../components/Lightbox.astro';
import type { Lang } from '../i18n/routes';

interface Props {
  title: string;
  description?: string;
  lang: Lang;
  ogImage?: string;
  canonicalPath?: string;
  ogType?: 'website' | 'article';
}

const props = Astro.props;
---

<BaseLayout {...props}>
  <slot name="head" slot="head" />
  <Header lang={props.lang} />
  <slot />
  <Lightbox lang={props.lang} />
  <Footer lang={props.lang} />
</BaseLayout>
```

- [ ] **Step 4: Commit**

```bash
git add site/src/components/Lightbox.astro site/src/components/GalleryTile.astro site/src/layouts/SiteLayout.astro
git commit -m "feat(gallery): Lightbox + GalleryTile components, mounted globally"
```

---

### Task D3: Gallery page

**Files:**
- Create: `site/src/pages/[lang]/galerie.astro`
- Create: `site/src/pages/[lang]/gallery.astro`

- [ ] **Step 1: Write FR gallery page**

Create `site/src/pages/[lang]/galerie.astro`:

```astro
---
import SiteLayout from '../../layouts/SiteLayout.astro';
import GalleryTile from '../../components/GalleryTile.astro';
import EmptyState from '../../components/EmptyState.astro';
import { getCollection } from 'astro:content';
import { getTranslations } from '../../i18n/t';

export function getStaticPaths() { return [{ params: { lang: 'fr' } }]; }

const lang = 'fr' as const;
const t = await getTranslations(lang);
const items = (await getCollection('gallery')).map((g) => g.data).sort((a, b) => a.display_order - b.display_order);
---

<SiteLayout title={t.nav.gallery} lang={lang}>
  <main class="container" style="padding: var(--space-12) var(--space-4);">
    <header class="page-hero">
      <h1>{t.nav.gallery}</h1>
    </header>
    {items.length === 0 ? <EmptyState message={t.empty.no_gallery} /> : (
      <div class="gallery-grid">
        {items.map((g) => (
          <GalleryTile type={g.type} src={g.src} poster={g.poster} caption={g.caption_fr} />
        ))}
      </div>
    )}
  </main>
</SiteLayout>

<style>
  .page-hero { padding: var(--space-8) 0; border-bottom: 4px solid var(--color-primary); margin-bottom: var(--space-8); }
  .gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: var(--space-3); }
</style>
```

- [ ] **Step 2: Write EN gallery page**

Create `site/src/pages/[lang]/gallery.astro` — same as `galerie.astro` but `lang = 'en'`, `caption_en` instead of `caption_fr`.

```astro
---
import SiteLayout from '../../layouts/SiteLayout.astro';
import GalleryTile from '../../components/GalleryTile.astro';
import EmptyState from '../../components/EmptyState.astro';
import { getCollection } from 'astro:content';
import { getTranslations } from '../../i18n/t';

export function getStaticPaths() { return [{ params: { lang: 'en' } }]; }

const lang = 'en' as const;
const t = await getTranslations(lang);
const items = (await getCollection('gallery')).map((g) => g.data).sort((a, b) => a.display_order - b.display_order);
---

<SiteLayout title={t.nav.gallery} lang={lang}>
  <main class="container" style="padding: var(--space-12) var(--space-4);">
    <header class="page-hero">
      <h1>{t.nav.gallery}</h1>
    </header>
    {items.length === 0 ? <EmptyState message={t.empty.no_gallery} /> : (
      <div class="gallery-grid">
        {items.map((g) => (
          <GalleryTile type={g.type} src={g.src} poster={g.poster} caption={g.caption_en} />
        ))}
      </div>
    )}
  </main>
</SiteLayout>

<style>
  .page-hero { padding: var(--space-8) 0; border-bottom: 4px solid var(--color-primary); margin-bottom: var(--space-8); }
  .gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: var(--space-3); }
</style>
```

- [ ] **Step 3: Verify**

Visit `/fr/galerie/` and `/en/gallery/` — grid renders, click photo → lightbox image, click video tile → lightbox video plays. Esc closes. Backdrop click closes.

- [ ] **Step 4: Commit**

```bash
git add site/src/pages/[lang]/galerie.astro site/src/pages/[lang]/gallery.astro
git commit -m "feat(gallery): page with lightbox-enabled grid"
```

---

### Task D4: Custom 404 page

**Files:**
- Create: `site/src/pages/404.astro`
- Delete: `site/public/404.html`

- [ ] **Step 1: Write `404.astro`**

Create `site/src/pages/404.astro`:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="404 — Page non trouvée / Page not found" lang="fr">
  <main style="font-family: var(--font-body); max-width: 600px; margin: 4rem auto; padding: 0 1rem; text-align: center;">
    <h1 style="font-family: var(--font-display); font-size: 4rem;">404</h1>
    <p><strong>FR :</strong> La page demandée n'existe pas. <a href="/fr/">Retour à l'accueil</a>.</p>
    <p><strong>EN:</strong> The page you're looking for doesn't exist. <a href="/en/">Return home</a>.</p>
  </main>
</BaseLayout>
```

- [ ] **Step 2: Delete legacy `404.html`**

```bash
rm site/public/404.html
```

- [ ] **Step 3: Verify**

Run: `cd site && npm run build`
Confirm `dist/404.html` exists (Astro emits it from `404.astro`).

Visit `http://localhost:4321/nonexistent-path` in dev — bilingual 404 renders.

- [ ] **Step 4: Commit**

```bash
git add site/src/pages/404.astro
git rm site/public/404.html
git commit -m "feat(routes): bilingual custom 404"
```

---

### Task D5: Upload videos to S3 media bucket

**Files:**
- Create: `scripts/upload-media.sh`

- [ ] **Step 1: Write upload script**

Create `scripts/upload-media.sh`:

```bash
#!/usr/bin/env bash
# Sync staged videos in site/local-media/ to the bekofc-com-media S3 bucket.
# Bucket and CloudFront cache behavior are pre-provisioned (infra/s3.tf, infra/cloudfront.tf).
# Per project binding constraint: only the `default` AWS profile.
set -euo pipefail

BUCKET="bekofc-com-media"
SRC_DIR="site/local-media"
PROFILE="default"

if [[ ! -d "$SRC_DIR" ]]; then
  echo "Missing source dir $SRC_DIR — run scripts/import-assets.mjs first."
  exit 1
fi

# Verify default profile is the right account
ACCOUNT_ID=$(aws sts get-caller-identity --profile "$PROFILE" --query Account --output text)
echo "Using AWS account: $ACCOUNT_ID (profile: $PROFILE)"
read -p "Continue with sync to s3://$BUCKET/ ? [y/N] " confirm
[[ "$confirm" == "y" || "$confirm" == "Y" ]] || { echo "Aborted."; exit 1; }

aws s3 sync "$SRC_DIR/" "s3://$BUCKET/" \
  --profile "$PROFILE" \
  --content-type "video/mp4" \
  --cache-control "public, max-age=86400"

echo "✓ Sync complete."
echo "Verify a file is reachable: curl -I https://bekofc.com/media/01-clip.mp4"
```

- [ ] **Step 2: Make executable and run**

```bash
chmod +x scripts/upload-media.sh
./scripts/upload-media.sh
```

Expected: prompts for confirmation, syncs videos, returns success.

- [ ] **Step 3: Verify a video is reachable**

```bash
curl -I https://bekofc.com/media/01-clip.mp4
```

Expected: `200 OK`, `Content-Type: video/mp4`.

- [ ] **Step 4: Commit (script only — no binary content)**

```bash
git add scripts/upload-media.sh
git commit -m "feat(scripts): upload-media.sh to sync videos to S3 media bucket"
```

---

### Task D6: Web3Forms key (user-provided)

**Files:**
- Modify: `content/settings.yml`

- [ ] **Step 1: User registers at https://web3forms.com/**

User goes to web3forms.com, enters their `contact@bekofc.com` (or chosen) email, receives a key by email.

- [ ] **Step 2: Update `web3forms_access_key` in `content/settings.yml`**

Replace `web3forms_access_key: ""` with the actual key (e.g., `web3forms_access_key: "abc123-def456-..."`).

- [ ] **Step 3: Verify the form posts**

Run: `cd site && npm run dev`
Visit `/en/contact/`, fill in the form, submit. Expected: inline status message changes to "Thanks, message received." Check the registered email arrives.

- [ ] **Step 4: Commit**

```bash
git add content/settings.yml
git commit -m "feat(forms): wire real Web3Forms access key"
```

---

End of Phase D. Gallery interactivity, asset upload, 404, contact form all working.

---

## Phase E — Quality gates + deploy

### Task E1: CI workflow for PRs (lint + test + build)

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Write CI workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: site/package-lock.json
      - name: Install dependencies
        working-directory: site
        run: npm ci
      - name: Type check
        working-directory: site
        run: npx astro check
      - name: Unit tests
        working-directory: site
        run: npm test
      - name: Build
        working-directory: site
        run: npm run build
      - name: Link check (lychee)
        uses: lycheeverse/lychee-action@v2
        with:
          args: --no-progress --base 'site/dist' 'site/dist/**/*.html'
          fail: true
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: PR workflow runs astro check, vitest, build, lychee"
```

---

### Task E2: Lighthouse CI config

**Files:**
- Create: `.lighthouserc.json`
- Modify: `.github/workflows/ci.yml` (add LHCI step)

- [ ] **Step 1: Write Lighthouse CI config**

Create `.lighthouserc.json`:

```json
{
  "ci": {
    "collect": {
      "staticDistDir": "site/dist",
      "url": [
        "http://localhost/fr/index.html",
        "http://localhost/en/index.html",
        "http://localhost/fr/equipe/index.html",
        "http://localhost/en/team/index.html",
        "http://localhost/fr/matchs/index.html",
        "http://localhost/en/matches/index.html"
      ],
      "settings": {
        "preset": "desktop"
      },
      "numberOfRuns": 1
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:seo": ["error", { "minScore": 0.95 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

- [ ] **Step 2: Add LHCI dev dep**

Run from `site/`:

```bash
cd site && npm install --save-dev @lhci/cli@^0.13
```

- [ ] **Step 3: Update CI workflow with LHCI job**

Append to `.github/workflows/ci.yml`:

```yaml

  lighthouse:
    runs-on: ubuntu-latest
    needs: check
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: site/package-lock.json
      - name: Install dependencies
        working-directory: site
        run: npm ci
      - name: Build
        working-directory: site
        run: npm run build
      - name: Lighthouse CI
        run: npx --prefix site @lhci/cli@0.13.x autorun --config=../.lighthouserc.json
```

- [ ] **Step 4: Commit**

```bash
git add .lighthouserc.json site/package.json site/package-lock.json .github/workflows/ci.yml
git commit -m "ci: lighthouse CI gate (perf 90, a11y 95, seo 95)"
```

---

### Task E3: Smoke verification before push

- [ ] **Step 1: Build and serve locally**

```bash
cd site && npm run build && npx astro preview
```

- [ ] **Step 2: Manual smoke list — visit each URL, confirm renders correctly**

In browser (preview at `http://localhost:4321`):
- `/` → redirects to `/fr/`
- `/fr/` and `/en/` — hero, news, next match, gallery strip, sponsors strip
- `/fr/actualites/` and `/en/news/` — list with 3 cards each
- `/fr/actualites/match-vs-yaounde/` and `/en/news/match-vs-yaounde/` — detail
- `/fr/equipe/` and `/en/team/` — staff, roster (8 players), season stats
- `/fr/matchs/` and `/en/matches/` — standings (BEKO highlighted), upcoming, completed
- `/fr/galerie/` and `/en/gallery/` — grid, click photo → lightbox image, click video → lightbox video
- `/fr/partenaires/` and `/en/sponsors/` — 3 tiers + 3 sponsors
- `/fr/rejoindre/` and `/en/join/` — pitch + CTAs
- `/fr/don/` and `/en/donate/` — copy buttons work, PayPal section shows fallback
- `/fr/contact/` and `/en/contact/` — form posts, mailto link works
- `/fr/confidentialite/` and `/en/privacy/` — body renders
- `/fr/this-does-not-exist/` → 404 page

For each page: language switcher in header goes to correct equivalent URL.

In dev tools, verify:
- `<meta property="og:title">` set on each page
- `<link rel="alternate" hreflang="fr">` and `="en"` present
- Lighthouse mobile report ≥ 90 perf, ≥ 95 a11y, ≥ 95 SEO on home

- [ ] **Step 3: Run all checks**

```bash
cd site && npx astro check && npm test && npm run build
```

Expected: all pass.

- [ ] **Step 4: Commit any tweaks discovered during smoke**

```bash
git add -A
git commit -m "chore(phase-e): smoke verification fixes"
```

---

### Task E4: Push to main and verify live deploy

- [ ] **Step 1: Push to main**

```bash
git push origin main
```

GitHub Actions runs `deploy.yml`: build → S3 sync → CloudFront invalidate.

- [ ] **Step 2: Watch the deploy workflow**

```bash
gh run watch
```

Expected: green check mark.

- [ ] **Step 3: Verify live with Playwright**

In Claude Code, drive the live site to confirm:

- Visit `https://bekofc.com/` — redirects to `/fr/`
- Hero loads with team photo, brand colors visible
- Click `EN` — switches to English
- Visit a few inner pages, confirm they render

If the verify skill is available, invoke it pointing at `https://bekofc.com/` for a complete pass.

- [ ] **Step 4: Final commit message-as-tag if desired**

```bash
git tag -a phase-1-shipped -m "Phase 1 (real layout, brand, no CMS) live at bekofc.com"
git push --tags
```

---

End of Phase E. Site shipped — `bekofc.com` shows full BEKO FC site, all 10 pages live in FR + EN, brand-styled, with working interactivity.

---

## Self-review (writer's pass)

**Spec coverage:**
- Brand identity (spec §2): tokens.css + Anton/Inter + logo handling — Tasks A5.1, A5.2
- Routing/i18n (spec §3.2): routes.ts + [lang]/ migration — Tasks A3, A10
- Layouts (spec §3.3): Base/Site/Page — Tasks A9, B1, D2
- Content collections (spec §3.4): config.ts + 9 collections + 3 singletons — Tasks A6, A7, C1, C3, C6, D1
- Stat aggregation (spec §3.5): stats.ts + tests — Task A8
- Components (spec §3.6): Header, Footer, LangSwitch, EmptyState, NewsCard, PlayerCard, MatchRow, StandingsTable, SponsorCard, GalleryTile, Lightbox, CopyButton, ContactForm — Tasks B1, B2, B5, B6, C2, C4, C5, C6, D2
- All 10 pages (spec §3.7): Privacy B3, Join B4, Donate B5, Contact B6, News C2, Team C4, Matches C5, Sponsors C6, Home C7, Gallery D3
- Interactive features (spec §4): LangSwitch (B1), CopyButton (B5), Lightbox + Video (D2), ContactForm (B6) — all four covered
- SEO (spec §5.1): full head in BaseLayout — Task A9; sitemap via @astrojs/sitemap — Task A5
- Error/empty handling (spec §5.2): EmptyState component (B2), 404 page (D4), PayPal fallback (B5)
- Asset pipeline (spec §6): import-assets.mjs (A5.1), upload-media.sh (D5)
- Repo layout (spec §7): content/ at root (A6 config), scripts/ (A5.1, D5)
- Testing (spec §8): vitest (A2, A3, A8), astro check + lychee in CI (E1), Lighthouse (E2)
- Phased rollout (spec §9): A → A.5 → B → C → D → E mirrors spec §9 phases

**Placeholder scan:** No "TBD"/"TODO" in steps. Web3Forms key is intentionally user-provided in Task D6 with explicit instructions; settings.yml has placeholders (`""`) that are documented and acceptable for the design.

**Type consistency:**
- `Lang` type used uniformly from `i18n/routes.ts`
- `PageKey` defined once in `routes.ts`, imported elsewhere
- Stat types (`PlayerStats`, `TeamStats`, `MatchInput`) consistent between `stats.ts` and consumers (Team page reads `byPlayer.get(...)`)
- Translation key paths consistent: `t.nav.*`, `t.buttons.*`, `t.empty.*`, `t.labels.*`, `t.meta.*` all align between `t.ts` and `translations.yml` and component usage
- Slug conventions: news files use `<date>-<slug>.<lang>.md` per spec §7.1; players use `<NN>-<slug>.md`; verified consumers (Team page) read `p.id.replace(/\.md$/, '')` to match the player_id strings in match files

No issues found.

---
