import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

const CONTENT_ROOT = '../../../content';

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
