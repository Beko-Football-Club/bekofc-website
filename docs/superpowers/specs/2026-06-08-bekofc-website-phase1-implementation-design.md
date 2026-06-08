# BEKO FC Website — Phase 1 Implementation Design

**Project:** Build the full BEKO FC public website (10 pages, FR/EN, real layout, brand-styled) with Astro content collections seeded from real assets, deferring CMS auth until Sveltia/GitHub PKCE limitation is resolved.
**Parent spec:** `docs/superpowers/specs/2026-06-06-bekofc-website-design.md`
**Date:** 2026-06-08
**Status:** Draft for user review

---

## 1. Goal & non-goals

### Goal

Replace the current bilingual "Coming soon" placeholder with the full Phase 1 site as defined in the parent design spec §6 — all 10 pages in French and English, real navigation, real layout, real interactivity, brand-styled around the BEKO FC logo — driven entirely from Astro content collections so the (deferred) CMS can later edit the same files without code changes.

### Non-goals (this round)

The following are spec-faithful but explicitly deferred to a follow-up round:

- **CMS authentication (Sveltia / GitHub OAuth).** Sveltia rejects PKCE for GitHub today (verified 2026-06-08). Editing this round happens by committing markdown directly. A separate effort will pick a working auth strategy (Cloudflare Worker, PAT-only, or Netlify-proxy revert).
- **GA4 + CookieYes wiring.** Spec §16 puts both in Phase 2 (launch polish). Skipped this round.
- **Real-content swap-in beyond what's already on disk.** Pages render with realistic placeholder copy where founders haven't supplied real text yet; layout is locked, content is swappable per-file later.
- **Real Web3Forms key.** The contact form is wired structurally; key is a placeholder in `settings.yml` until the user creates the free Web3Forms account.
- **Pre-launch checklist + DNS cutover ceremony.** Site is built and deployable; final launch day is a separate task.

## 2. Brand identity

Sourced from the team logo `BekoFC-LOGO.jpeg` (yellow/black/white shield, woman footballer silhouette, "Beko Football de Douala" + "B.F.D." banner).

### 2.1 Names

- **Display name (nav, headers, social):** `BEKO FC`
- **Full name (About / founder story / SEO description):** `Beko Football de Douala (B.F.D.)`
- **Tagline (FR primary):** to be drafted; placeholder used until founders confirm
- **Domain:** `bekofc.com`

### 2.2 Color tokens

CSS custom properties in `site/src/styles/tokens.css`:

| Token | Value | Use |
|---|---|---|
| `--color-primary` | `#FFD700` | Beko yellow — buttons, accents, hero band |
| `--color-on-primary` | `#0A0A0A` | Text on yellow surfaces |
| `--color-ink` | `#0A0A0A` | Primary body text, headings |
| `--color-paper` | `#FFFFFF` | Page background |
| `--color-muted` | `#6B6B6B` | Secondary text (dates, captions) |
| `--color-soft` | `#F5F5F5` | Subtle section backgrounds |
| `--color-border` | `#E5E5E5` | Card / table borders |

### 2.3 Typography

- **Display (headlines, hero, page titles):** `Anton` — condensed sans, free Google Font, ships well at large sizes, classic football-club energy.
- **Body (everything else):** `Inter` — neutral, hyper-legible at small sizes, optimized for mobile screens.

Both loaded via `<link rel="preconnect">` + Google Fonts CSS with `display=swap`. Total weight after subset: ~50KB woff2.

### 2.4 Logo treatment

- Source: `BekoFC-LOGO.jpeg` (raster, 132KB)
- Derived assets (one-shot generation in `scripts/import-assets.mjs`):
  - `site/public/uploads/logo.svg` — vectorized via `potrace` (deterministic, ~5-15KB)
  - `site/public/favicon.svg` — same as logo.svg, replaces the current placeholder favicon
  - `site/public/uploads/logo-og.png` — 1200×630 OG image, logo centered on yellow background
  - `site/public/uploads/logo.jpeg` — original kept as raster fallback
- Header placement: 32-40px tall, left-aligned, paired with "BEKO FC" wordmark in Anton

## 3. Architecture

### 3.1 Stack

Unchanged from parent spec §4. No new framework dependencies. Pure Astro + vanilla JS islands.

### 3.2 Routing & i18n

Spec §6 mandates `/` → `/fr/` redirect, parallel `/fr/...` and `/en/...` trees, FR/EN switcher in header.

**Implementation:** Astro's built-in i18n (stable in Astro 5) with a single `[lang]/` dynamic segment.

```
site/src/pages/
├── index.astro                       # redirect to /fr/
├── 404.astro                         # bilingual 404
└── [lang]/
    ├── index.astro                   # home
    ├── actualites/                   # FR slug; EN equivalent: news/
    │   ├── index.astro
    │   └── [slug].astro
    ├── equipe/                       # EN: team/
    ├── matchs/                       # EN: matches/
    ├── galerie/                      # EN: gallery/
    ├── partenaires/                  # EN: sponsors/
    ├── rejoindre/                    # EN: join/
    ├── don/                          # EN: donate/
    ├── contact/
    └── confidentialite/              # EN: privacy/
```

Bilingual URL slugs (`actualites` ↔ `news`, etc.) are mapped centrally:

- `site/src/i18n/routes.ts` exports:
  - `routeFor(page: PageKey, lang: 'fr' | 'en'): string` — e.g., `routeFor('news', 'fr')` → `'/fr/actualites'`
  - `equivalentRoute(currentPath: string, otherLang: 'fr' | 'en'): string` — used by the language switcher to produce the URL for the same page in the other language

Both functions are pure, unit-tested.

### 3.3 Layouts

```
BaseLayout              html shell, full <head>, <meta> tags, OG, JSON-LD slot, lang attribute
└── SiteLayout          + header (logo, nav, lang switcher), footer (contact, socials, secondary nav)
    └── PageLayout      + page-title hero (used by inner pages); optional breadcrumb
```

Home uses `SiteLayout` directly (its own full-bleed hero composition).

### 3.4 Content collections (`site/src/content/config.ts`)

Schemas defined with Zod via `defineCollection({ schema })`. Build fails on schema violation, which catches typos before deploy. Content lives at **repo root** under `content/` (matches parent spec §7 layout) so the deferred CMS can write to the same paths without rewiring.

Astro is configured with `contentDir: '../content'` to read from outside `site/`.

Collections:

| Collection | Type | Schema fields (key ones) |
|---|---|---|
| `news` | content (markdown) | `title`, `slug`, `date`, `lang`, `hero_image?`, `author?`, `tags?`, `status` |
| `players` | content (markdown) | `name`, `position` (GK/DF/MF/FW), `jersey_number`, `photo?`, `bio_fr`, `bio_en`, `status`, `display_order` |
| `staff` | content (markdown) | `name`, `role_fr`, `role_en`, `photo?`, `bio_fr?`, `bio_en?`, `display_order` |
| `matches` | content (markdown) | `date`, `kickoff`, `opponent`, `home_or_away`, `location`, `status`, `beko_score?`, `opponent_score?`, `recap_fr?`, `recap_en?`, `related_news?`, `player_stats?: PlayerMatchStat[]` |
| `sponsors` | content (markdown) | `name`, `logo?`, `website?`, `tier` (Principal/Officiel/Supporter), `active`, `display_order` |
| `standings` | data (yaml) | `position`, `team`, `played`, `won`, `drawn`, `lost`, `goals_for`, `goals_against`, `goal_difference`, `points`, `is_beko` |
| `gallery` | data (yaml) | `type` (image/video), `src`, `caption_fr?`, `caption_en?`, `album?`, `date`, `display_order` |
| `pages` | content (markdown) | per-page hero/body copy, FR + EN side-by-side fields |

Singletons (data files at `content/`):

- `settings.yml` — team contact info, socials, donate numbers/links, default OG image, web3forms_access_key
- `sponsor-tiers.yml` — three tier definitions with bilingual fields and benefit lists
- `translations.yml` — shared UI strings (nav labels, button text, common phrases)

### 3.5 Build-time stat aggregation (parent spec §7.3)

`site/src/lib/stats.ts`:

```typescript
export function aggregateStats(matches: MatchEntry[]): {
  byPlayer: Map<string, PlayerStats>
  byTeam: TeamStats
}
```

Reads all `content/matches/*.md` entries with `status: completed`, sums per-player `goals`, `assists`, `yellow_cards`, `red_cards`, `minutes_played`, `matches_played` (= count of matches where `started || minutes_played > 0`). Pure function; recomputed every build; no persistence.

Tested with vitest using fixture data covering: empty list, single match, multiple matches, player who didn't start, mixed completed/upcoming.

### 3.6 Components

Located at `site/src/components/`:

| Component | Purpose |
|---|---|
| `Header.astro` | Logo, nav (9 links from `translations.yml`), lang switcher |
| `Footer.astro` | Contact email, socials, secondary nav, privacy link |
| `LangSwitch.astro` | Renders `<a>` to `equivalentRoute(...)` — pure server-rendered, no JS |
| `JsonLd.astro` | Renders typed JSON-LD `<script type="application/ld+json">` |
| `NewsCard.astro` | Used on home + news list |
| `PlayerCard.astro` | Used on team page roster grid + on player detail blocks |
| `MatchRow.astro` | Used on matches page (upcoming + completed lists) |
| `StandingsTable.astro` | League table; highlights `is_beko` row |
| `SponsorCard.astro` | Tier card (sponsors page) and active-sponsor logo grid |
| `GalleryTile.astro` | Image / video thumbnail with lightbox `data-` attributes |
| `Lightbox.astro` | Native `<dialog>` modal, mounted once globally |
| `VideoPlayer.astro` | Inline `<video controls>` rendered into the lightbox |
| `CopyButton.astro` | Donate page copy-to-clipboard button |
| `ContactForm.astro` | Web3Forms POST + mailto fallback |
| `EmptyState.astro` | Bilingual "no data yet" component |

### 3.7 Per-page rendering

Each page is one Astro template under `[lang]/` consuming collections + singletons.

| Page | Sources |
|---|---|
| Home | `pages/home.md` + top 3 `news` + next `match` (status=upcoming) + 6 latest `gallery` + active `sponsors` |
| News list | `news` filtered by lang, paginated 10/page (Astro `paginate()`) |
| News detail | `news[<slug>.<lang>].md`, layout: hero image, title, date, body |
| Team | `pages/team.md` + `staff` + `players` + `aggregateStats(matches)` |
| Matches | `standings` table + `matches.upcoming` + `matches.completed` |
| Gallery | `gallery` collection, lightbox/video wired, lazy-load |
| Sponsors | `pages/sponsors.md` + `sponsor-tiers.yml` + active `sponsors` |
| Join | `pages/join.md` + `settings.yml` (whatsapp, contact email) |
| Donate | `pages/donate.md` + `settings.yml` (momo, orange, paypal); PayPal section conditional on link presence |
| Contact | `pages/contact.md` + `settings.yml` + `ContactForm` |
| Privacy | `pages/privacy.md` (markdown body, two lang variants) |

Empty states: every list-driven page renders the spec's translated empty messages ("Calendrier à venir" / "Schedule coming soon") when its collection is empty.

## 4. Interactive features

All four are vanilla JS in tiny `<script>` islands. Total JS budget: ~3.5KB minified, vs spec §11 budget of 30KB.

### 4.1 Language switcher

Pure server-side. `LangSwitch.astro` renders `<a href={equivalentRoute(Astro.url.pathname, otherLang)}>`. Zero JS. URL is the state — bookmarks/sharing/no-flash all just work.

### 4.2 Donate copy-to-clipboard

`CopyButton.astro` renders `<button data-copy="+237 6XX XXX XXX">Copier</button>`. One global script (~30 lines) attaches a delegated click handler:

- `navigator.clipboard.writeText()` happy path
- Falls back to `document.execCommand('copy')` for older UC Browser (spec §12)
- Swaps button label to "Copié !" / "Copied!" for 2s then reverts

### 4.3 Gallery lightbox + inline video

`GalleryTile.astro` renders `<a href="..." data-lightbox="image|video">...</a>`. Without JS, the link opens the asset directly (graceful fallback). With JS:

- Single global `<dialog>` element (`Lightbox.astro`) mounted in `SiteLayout`
- Click handler reads `data-lightbox` to decide image vs. video rendering
- Native `<dialog>` provides Esc-to-close, backdrop click, focus trap for free
- ~80 lines vanilla

### 4.4 Contact form (Web3Forms + mailto fallback)

`ContactForm.astro` renders a standard `<form action="https://api.web3forms.com/submit" method="POST">`. POSTs natively without JS (Web3Forms returns its own thank-you page).

Hidden inputs: `access_key` (from `settings.yml`), `subject`, honeypot field. Progressive enhancement script (~1KB) intercepts submit, posts via fetch, shows inline success/error.

Always rendered alongside: `<a href="mailto:contact@bekofc.com?subject=...&body=...">` labeled "Préférez l'email direct ?" / "Prefer direct email?" — covers JS-off, network-blocked, and Web3Forms-down cases (spec §6.9, §9).

## 5. SEO meta & error handling

### 5.1 SEO meta (no GA4/CookieYes this round)

`BaseLayout` accepts `title`, `description`, `ogImage?`, `lang`, `canonicalPath` props. Renders for every page:

- `<title>` with site suffix
- `<meta description>`
- Full **Open Graph** (`og:title`, `og:description`, `og:image`, `og:url`, `og:locale`, `og:type`)
- **Twitter Card** (`summary_large_image`)
- `<link rel="canonical">`
- `<link rel="alternate" hreflang="fr|en|x-default">` so Google indexes both locales correctly

**JSON-LD structured data:**

- `SportsTeam` schema on home and team page (name, logo, location: Douala, CM)
- `NewsArticle` on news detail (headline, datePublished, author, image)
- `SportsEvent` on each upcoming match (when `matches` has `status: upcoming` entries)
- `Organization` in footer (sponsor inquiry email, social links)

`robots.txt` and `sitemap.xml` are auto-generated by `@astrojs/sitemap`. Default OG image from `settings.yml`; pages override (news posts use their hero image).

### 5.2 Error handling (this round)

| Failure | Behavior |
|---|---|
| Empty collection | Translated empty-state copy renders; rest of page intact |
| Missing optional asset (player photo) | Generic SVG silhouette placeholder; no layout shift |
| Build error | CI fails, last good version stays live (parent spec §9) |
| Web3Forms down or JS off | Native form POST, then mailto fallback link adjacent |
| PayPal link missing | Donate page renders; PayPal section replaced with translated "indisponible temporairement" + contact link |
| Bad path (`/fr/typo/`) | Custom `404.astro` (bilingual, links back to home) |

CloudFront's existing 404 redirects (parent spec §5.3 / `infra/cloudfront.tf`) point at `/404.html` — Astro will emit `/404.html` from `src/pages/404.astro` so this rule continues to work.

## 6. Asset pipeline

### 6.1 Inventory (sourced from user, 2026-06-08)

- **Logo:** `BekoFC-LOGO.jpeg` (Downloads root)
- **Beko-FC subfolder:** 4 photos + 4 videos (~37MB total)
- **Downloads root, today's batch:** ~33 photos + 2 videos
- **Total:** ~37 photos, 6 videos

### 6.2 Import script

`scripts/import-assets.mjs` (idempotent, manual-run):

1. Copy `BekoFC-LOGO.jpeg` → `site/public/uploads/logo.jpeg`
2. Vectorize → `site/public/uploads/logo.svg` (via `potrace`; if unavailable, fall back to JPEG with a flag in the script)
3. Copy `logo.svg` to `site/public/favicon.svg` (replaces current placeholder)
4. Generate `site/public/uploads/logo-og.png` (1200×630, logo centered on yellow background)
5. Copy curated 12 photos → `site/public/uploads/photos/<NN>-<slug>.jpeg` (gallery seed)
6. Copy remaining ~25 photos → `site/public/uploads/photos/_archive/` (untracked path-listed in `.gitignore` is acceptable; or committed for safekeeping — implementation plan picks one)
7. Copy videos → `site/local-media/<NN>-<slug>.mp4` (gitignored; staging area only)
8. Generate `content/gallery/initial-import.yml` listing every imported asset

### 6.3 Video hosting

- **Bucket:** `bekofc-com-media` (already in `infra/s3.tf`, OAC-authenticated)
- **CloudFront cache behavior:** `/media/*` already configured in `infra/cloudfront.tf` (line 65-75) with `CachingOptimized` policy
- **Public URL:** `https://bekofc.com/media/<file>` (NOT a separate `media.bekofc.com` subdomain)
- **Upload:** `scripts/upload-media.sh` runs `aws s3 sync site/local-media/ s3://bekofc-com-media/ --profile default` (per parent spec §3 binding constraint: only `default` profile)
- **Reference in content:** `content/gallery/<slug>.yml` stores `src: /media/<file>.mp4`
- **Site rendering:** `<video src="/media/<file>.mp4" controls preload="metadata">`

### 6.4 Gallery seed

- **Image entries:** 12 (curated subset of the ~37 photos covering training, match action, team groups)
- **Video entries:** 6 (one per .mp4)
- **Captions:** placeholder bilingual captions, e.g., `caption_fr: "Entraînement à Douala"` / `caption_en: "Training session in Douala"` — refined when founders confirm what each photo shows

### 6.5 Performance

Per parent spec §11 (LCP < 2.5s on 3G, total page weight < 500KB on home excluding hero):

- All images use Astro's `<Image>` from `astro:assets` (responsive `<picture>`, WebP + JPEG fallback, lazy by default)
- Hero image: `loading="eager"` + `fetchpriority="high"`
- Videos: `preload="metadata"` only — no autoplay, no thumbnail preload
- Fonts: subset Anton + Inter to Latin + Latin-Ext (covers FR diacritics), `font-display: swap`

## 7. Repo layout

```
bekofc-website/
├── content/                          # NEW — repo root, outside site/
│   ├── settings.yml
│   ├── sponsor-tiers.yml
│   ├── translations.yml
│   ├── pages/{home,team,sponsors,donate,join,contact,privacy}.md
│   ├── news/<slug>.<lang>.md
│   ├── players/<num>-<slug>.md
│   ├── staff/<num>-<slug>.md
│   ├── matches/<date>-<opponent>.md
│   ├── sponsors/<slug>.md
│   ├── standings/<team>.yml
│   └── gallery/<slug>.yml
├── scripts/                          # NEW
│   ├── import-assets.mjs
│   └── upload-media.sh
├── site/
│   ├── astro.config.mjs              # CHANGED — i18n, sitemap, content dir = ../content
│   ├── package.json                  # CHANGED — adds @astrojs/sitemap, vitest, @lhci/cli
│   ├── public/
│   │   ├── admin/                    # untouched (Sveltia, deferred)
│   │   ├── uploads/                  # NEW — logo, photos
│   │   │   ├── logo.svg
│   │   │   ├── logo.jpeg
│   │   │   ├── logo-og.png
│   │   │   └── photos/
│   │   ├── favicon.svg               # OVERWRITTEN — now the logo
│   │   └── robots.txt                # NEW (auto-generated)
│   ├── local-media/                  # NEW — gitignored video staging
│   ├── src/
│   │   ├── content/config.ts         # NEW — Zod schemas
│   │   ├── i18n/{routes,t}.ts        # NEW
│   │   ├── lib/{stats,stats.test,routes.test}.ts  # NEW
│   │   ├── styles/tokens.css         # NEW — color/font tokens
│   │   ├── styles/global.css         # NEW — base styles
│   │   ├── layouts/{Base,Site,Page}Layout.astro  # CHANGED/NEW
│   │   ├── components/               # NEW — see §3.6
│   │   └── pages/
│   │       ├── index.astro           # CHANGED — redirect to /fr/
│   │       ├── 404.astro             # NEW
│   │       └── [lang]/               # NEW — replaces fr/, en/
│   └── tsconfig.json                 # CHANGED — content collection types
├── .github/workflows/
│   ├── deploy.yml                    # CHANGED — add lychee + lighthouse-ci
│   └── ci.yml                        # NEW — astro check + build + vitest on PRs
└── .lighthouserc.json                # NEW
```

The existing `site/public/admin/` (Sveltia config) is untouched. When the deferred CMS-auth fix lands, Sveltia will already be pointed at `content/` and edits will Just Work.

## 8. Testing

Per parent spec §10:

| Layer | Approach |
|---|---|
| TypeScript / template types | `astro check` in CI on every PR |
| Build | `astro build` — guarantees every page renders, every collection schema validates |
| Links | `lychee` action in CI — internal + external link check |
| Unit | `vitest` on `src/lib/stats.ts` and `src/i18n/routes.ts` (~6-10 tests) |
| Performance / a11y | Lighthouse CI gates: Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95 (mobile profile) |
| End-to-end | None this round (per parent spec §10) |

Manual smoke checklist before deploy: every page FR + EN, all forms, every interaction, mobile + desktop.

## 9. Phased rollout

| Phase | Deliverables | Exit criteria |
|---|---|---|
| **A** Foundation | i18n routes, content schemas, layouts (Base/Site/Page), `[lang]/` migration, vitest setup | Site builds; FR + EN home renders via new routing; `astro check` clean |
| **A.5** Brand pass | `tokens.css`, fonts wired, logo SVG-traced, header logo, OG image generated | Logo and brand colors visible in dev; favicon updated |
| **B** Static pages | Header, Footer, LangSwitch, EmptyState, JsonLd; Donate, Join, Privacy, Contact (no form yet); `translations.yml` populated | 4 simple pages render bilingually with full nav; switcher works |
| **C** Data-driven pages | News list + detail, Team (roster + staff + stats), Matches (standings + lists), Sponsors, Home composition; all seed data | Every page renders FR + EN with seed data; build-time stat totals visible on team page |
| **D** Interactive features | CopyButton, Lightbox, VideoPlayer, Gallery wired, ContactForm (Web3Forms + mailto), 404.astro, asset import, video upload to S3 | All four interactions work in browser; mailto fallback verified; videos play from `/media/*` |
| **E** Quality gates + deploy | lychee CI, Lighthouse CI config, robots/sitemap, manual smoke pass, push to main → CloudFront deploy → Playwright verify live | `bekofc.com` shows full site, all 10 pages live FR + EN, Lighthouse green, lychee clean |

Estimated rough size: ~5-7 working sessions (one phase per session, A.5 folded into a B prelude).

## 10. Out of scope (combined follow-up later)

1. Sveltia / GitHub OAuth fix (CMS unblocked)
2. Real founder copy swap-in (mission, history, audience numbers, tagline, sponsor benefit lists)
3. Real photo curation + captioning (replacing placeholder gallery captions)
4. Real player roster (replacing placeholder players)
5. Real match data (replacing seed matches)
6. GA4 + CookieYes wiring
7. Real Web3Forms key swap (if user has not created the account during Phase D)
8. Pre-launch checklist + Phase 2 polish per parent spec §16
9. Custom typography refinement (if Anton/Inter pairing needs changing once founders see it in context)

## 11. Open items requiring user input during implementation

These don't block the implementation plan but will be requested as the affected phase begins:

- **Web3Forms access key** (Phase D) — user creates account at web3forms.com (~2 min), pastes key into `settings.yml`
- **MTN MoMo number** (Phase B donate page) — placeholder `+237 6XX XXX XXX` until provided
- **Orange Money number** (Phase B donate page) — placeholder until provided
- **PayPal donate link** (Phase B donate page) — placeholder; donate page hides PayPal section if absent
- **Real contact email** (Phase B contact + donate + footer) — placeholder `contact@bekofc.com` (matches parent spec)
- **WhatsApp number** (Phase B contact + join) — placeholder until provided
- **Facebook + Instagram URLs** (Phase B footer + contact) — placeholder until provided
- **Tagline (FR)** (Phase A.5 / B home hero) — placeholder until provided
