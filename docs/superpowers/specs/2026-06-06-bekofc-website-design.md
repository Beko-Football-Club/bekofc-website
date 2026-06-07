# BEKO FC Website — Design Spec

**Project:** Promotional website for BEKO FOOT Officiel, a women's soccer team in Douala, Cameroon
**Domain:** `bekofc.com` (to be registered via AWS Route 53)
**Repository:** `github.com/Beko-Football-Club/bekofc-website`
**Date:** 2026-06-06
**Status:** Draft for user review

---

## 1. Goals

Primary, in priority order:

1. **Build awareness and fandom.** Fans discover the team, follow news, view photos and videos.
2. **Attract sponsors.** Pitch local businesses with a structured 3-tier sponsorship offering.
3. **Recruit players and staff.** Provide a contact path for prospective players and staff.
4. **Accept donations.** Mobile money (MTN MoMo, Orange Money) for local fans; PayPal for international donors.

## 2. Non-goals (v1)

- Online ticket sales
- Merchandise store
- Match livestream embeds
- Mailing list / email newsletter
- Push notifications / PWA install prompt
- Editorial / approval workflow in the CMS
- Per-user CMS role permissions
- Donor wall on donate page
- On-site search
- Native player tryout signup form (a generic contact path is sufficient)

These can be added post-launch without re-architecting.

## 3. Constraints

- **Audience location:** primarily Douala / Cameroon, with diaspora reach. Mobile-first; assume 3G connections common.
- **Languages:** French primary, English secondary. The architecture supports adding more languages later (e.g., Duala, Pidgin) by adding a locale folder; only `fr` and `en` are populated for v1.
- **Hosting:** AWS, under the user's `default` profile, and *only* that profile. **All AWS work for this project — `aws` CLI calls, Terraform/CDK runs, deploy steps, IAM provisioning, every operation that touches AWS — must use the `default` profile.** The project folder enforces this via `AWS_PROFILE=default` in `.claude/settings.local.json` so child shells inherit it. Implementation must not pass `--profile <other>`, set `AWS_PROFILE` to a different value, or hardcode another profile name in scripts, CI configs, or Terraform/CDK provider blocks. CI (GitHub Actions) doesn't use profiles — it authenticates via OIDC into the same AWS account that the `default` profile points to; the implementation plan must verify this is the same account before provisioning.
- **Cost:** ~$2/month AWS + $13/year domain. Free third-party services where possible.
- **Editing:** non-technical staff must be able to update content without touching code. Each admin needs a GitHub account (free) to authenticate to the CMS.
- **No backend server.** Static site only. Anything dynamic goes through third-party services.
- **Content sources:** photos, videos, and logo provided by the team founders. Facebook integration is **deliberately not included** (token logistics not viable; CMS replaces it as the publishing surface).

## 4. Stack

| Layer | Choice | Why |
|---|---|---|
| Static site generator | **Astro** | Fast, content-collections built in, native i18n routing, ships zero JS by default |
| CMS | **Decap CMS** (formerly Netlify CMS) | Free, open-source, GitHub-backed, no server to host |
| Auth for CMS | **GitHub OAuth (direct)** | No proxy to maintain. Admins log in with their GitHub account. |
| Source / content storage | **GitHub (Beko-Football-Club org)** | Source of truth. Content is markdown + images committed to repo. Videos in S3. |
| CI/CD | **GitHub Actions** | Free at this scale. Build + deploy on every push to `main`. |
| Hosting | **AWS S3 + CloudFront** | Site bucket private, served via CloudFront with OAC. CDN edges in Cape Town and Lagos serve Cameroon traffic. |
| DNS / domain | **AWS Route 53** | Domain registered and DNS hosted in the same AWS account. |
| TLS | **AWS ACM** (us-east-1) | Free certificates, DNS-validated. |
| AWS auth from GitHub | **OIDC** | No long-lived AWS keys in GitHub secrets. |
| Contact form | **Web3Forms** | Free, unlimited, no account needed. |
| Donations (international) | **PayPal donate button** | Works for Cameroon-based merchants. Embedded as HTML snippet from settings. |
| Donations (local) | **MTN MoMo + Orange Money numbers, displayed with copy buttons** | Standard Cameroonian fundraising UX. No third-party integration. |
| Analytics | **Google Analytics 4** | Free, ubiquitous. Loaded async. |
| Email | **ImprovMX** | Free email forwarding `contact@bekofc.com` → existing inbox. |
| Cookie consent | **CookieYes** | Free up to 25k pageviews/mo. |

## 5. Architecture

### 5.1 Visitor request flow

```
Visitor browser
  → Route 53 (bekofc.com)
    → CloudFront (HTTPS, edge cache)
      → S3 (private, OAC-authenticated)
        → Pre-built static HTML
```

Pages are pre-built. No server, no database. CloudFront edge cache returns most requests directly.

### 5.2 Admin publish flow

```
Admin browser
  → bekofc.com/admin/  (Decap CMS, served by S3)
    → GitHub OAuth (admin signs in)
      → Admin edits in CMS form, clicks "Publish"
        → Decap commits markdown / image to GitHub repo
          → GitHub Actions: `npm run build` → S3 sync → CloudFront invalidation
            → Live in ~60–90 seconds
```

If the build fails, the deploy step doesn't run, and the previous good version stays live.

### 5.3 AWS resources

1. **S3 bucket `bekofc-com-site`** — private, OAC-only, versioning on, lifecycle rule deleting old versions after 30 days.
2. **S3 bucket `bekofc-com-media`** — for video uploads. Public-read via CloudFront only. Separate from site bucket so videos don't bloat the Git repo.
3. **CloudFront distribution** — fronts the site bucket at `/`. The media bucket is fronted by a separate CloudFront distribution (or a second origin + cache behavior on the same distribution at `/media/*`) so video cache settings can differ from HTML. Custom domain `bekofc.com` and `www.bekofc.com`. HTML cached 5 min; hashed JS/CSS/images cached 1 year. Videos cached 1 day at the edge. Compression on for text/HTML. Custom 404 page.
4. **ACM certificate** in us-east-1 covering `bekofc.com` and `*.bekofc.com`.
5. **Route 53 hosted zone** for `bekofc.com` with A/AAAA alias records pointing to CloudFront.
6. **IAM OIDC provider + role** trusting `github.com/Beko-Football-Club` repos. Role permissions limited to `s3:PutObject`/`s3:DeleteObject` on the two buckets and `cloudfront:CreateInvalidation` on the distribution.

Infrastructure is defined as code (Terraform or AWS CDK — to be chosen in implementation plan). All resources reproducible from scratch in ~30 minutes.

## 6. Pages

All pages have French (`/fr/...`) and English (`/en/...`) variants. `/` redirects to `/fr/`. Header has a `FR | EN` switcher.

### 6.1 Home (`/fr/`, `/en/`)
- Hero with team logo, name, tagline, hero image, primary CTAs (Donate, Become a sponsor)
- Latest 3 news posts as cards
- Next match teaser (hidden if no future match scheduled)
- Last 6 gallery photos
- About snippet linking to The Team
- Sponsors strip (logos, hidden if no active sponsors)
- Footer CTAs

### 6.2 News / Actualités (`/fr/actualites/`, `/en/news/`)
- Paginated list (10 per page)
- Per-post page at `/fr/actualites/<slug>/` and `/en/news/<slug>/`
- Each post: title, hero image, date, body (markdown), optional author, optional tags

### 6.3 The Team / L'Équipe (`/fr/equipe/`, `/en/team/`)
- Club story (mission, history, founders)
- Staff section (hidden if empty)
- Roster grid: player cards with photo, name, position, jersey number, short bio, **stats badge** (matches, goals, assists). Hidden until at least 1 player exists.
- Stats tab/section showing aggregated team and player stats for the current season
- Contact block

### 6.4 Matches / Matchs (`/fr/matchs/`, `/en/matches/`)
- **League standings table** at the top — shows position, team, P/W/D/L, GF/GA, GD, points. Manually maintained by admin. BEKO row visually highlighted.
- Upcoming matches: date, kickoff, opponent, home/away, location
- Recent results: date, opponent, score, optional recap, optional photo
- Empty state: "Calendrier à venir" / "Schedule coming soon" if both lists empty

### 6.5 Gallery / Galerie (`/fr/galerie/`, `/en/gallery/`)
- Grid of photos and video thumbnails, lazy-loaded
- Click photo → lightbox; click video → inline `<video>` player
- Optional album/tag filter
- Videos served from `bekofc-com-media` S3 bucket via CloudFront

### 6.6 Sponsors / Partenaires (`/fr/partenaires/`, `/en/sponsors/`)
- Pitch hero with value prop
- Audience stats section (followers, attendance, demographics — admin fills in)
- Three tier cards (Partenaire Principal, Partenaire Officiel, Supporter) with name, price, benefits list, CTA
- Current sponsors logo grid (hidden if no active sponsors)
- Sponsorship inquiry email / form

### 6.7 Join / Rejoindre (`/fr/rejoindre/`, `/en/join/`)
- Short pitch: open to players and staff
- Contact email + WhatsApp link
- No tryout schedule, no form

### 6.8 Donate / Faire un don (`/fr/don/`, `/en/donate/`)
- Pitch: why donations matter, what they fund
- **Mobile money section:** MTN MoMo number + Orange Money number, each with copy-to-clipboard button and bilingual instructions
- **International cards section:** PayPal donate button (rendered only if PayPal link is configured in settings; otherwise a "temporarily unavailable" note with contact link)
- Thank-you note

### 6.9 Contact (`/fr/contact/`, `/en/contact/`)
- Email, phone (optional), WhatsApp, FB link, IG link
- Optional embedded map of training/match location
- Contact form: name, email, subject, message → Web3Forms → email
- Form has fallback `mailto:` link for when JS / form service fails

### 6.10 Privacy policy (`/fr/confidentialite/`, `/en/privacy/`)
- Standard short policy. Links from footer only.

## 7. Content model

Stored in Git as markdown / YAML under `content/`. Decap exposes each as a CMS form.

### 7.1 Singletons

**`content/settings.yml`** — site-wide settings
- Team name, tagline (FR/EN)
- Contact email, phone, WhatsApp number
- Social links (FB URL, IG URL)
- MTN MoMo number, Orange Money number, PayPal link
- Sponsor inquiry email
- Default OG image

**`content/sponsor-tiers.yml`** — three tier definitions
- Per tier: name (FR/EN), price (free text), benefits list (FR/EN), display prominence

**`content/translations.yml`** — shared UI strings
- Nav labels, button text, common phrases. Centralized so templates contain no hard-coded copy.

**`content/pages/{home,team,sponsors,donate,join,contact}.md`** — page-specific copy
- Hero headline, subhead, hero image, body sections, page-specific CTAs

### 7.2 Collections

**`content/news/`** — news posts (long-form, separate file per language)
- Filenames: `2026-08-10-match-vs-x.fr.md` and `2026-08-10-match-vs-x.en.md`
- Frontmatter: title, slug, date, hero image, optional author, optional tags, status (draft/published)
- Body: markdown

**`content/players/`** — one file per player
- Frontmatter: name, position (GK/DF/MF/FW), jersey number, photo, bio (FR/EN), status (active/former), display order
- **Stats are computed at build time** from the matches collection (see 7.3)

**`content/staff/`** — one file per staff member
- Name, role (FR/EN), photo, optional bio, display order

**`content/matches/`** — one file per match
- Frontmatter: date, kickoff time, opponent, home/away, location, status (upcoming/completed), BEKO score, opponent score, recap (FR/EN, for completed), optional related news post slug
- **Per-match player stats** (for completed matches): list of `{ player_id, goals, assists, yellow_cards, red_cards, minutes_played, started }`
- Build step aggregates these into per-player and per-team season totals

**`content/sponsors/`** — one file per sponsor
- Name, logo, website link, tier (Principal/Officiel/Supporter), active flag, display order

**`content/standings/`** — league table rows (one file per team in the league)
- Position, team name, played, won, drawn, lost, goals for, goals against, goal difference, points, is_beko (bool)
- Admin updates after each match week

**`content/gallery/`** — one file per gallery item
- Type (image / video), file URL (image in repo `/uploads/`, video in S3 media bucket), caption (FR/EN), album/tag, date, display order

### 7.3 Build-time stat aggregation

A small Astro integration (or build script) reads all entries in `content/matches/` and produces, per player:

- Matches played (count of matches where `started` or `minutes_played > 0`)
- Goals (sum)
- Assists (sum)
- Yellow cards (sum)
- Red cards (sum)
- Minutes played (sum)

Aggregated stats are exposed to player pages and the team-stats section of `/equipe/`. No persistence — recomputed every build.

### 7.4 Bilingual editing UX

- **Short fields** (player bios, page headlines, captions): Decap renders FR and EN inputs side-by-side in the same form.
- **Long-form** (news posts): two separate files, one per language. Easier to edit a full article without cramped UI.

### 7.5 Image and video storage

- **Images** committed to the Git repo at `public/uploads/` (referenced as `/uploads/foo.jpg`). Tolerable up to ~1GB total; we revisit if the repo bloats.
- **Videos** uploaded directly to the `bekofc-com-media` S3 bucket via Decap's S3 backend. URL stored in the gallery item frontmatter. Site renders `<video>` tags pointing at the CloudFront URL.

## 8. Admin workflow

```
Admin → bekofc.com/admin/
  → GitHub OAuth login
  → picks collection (News, Players, Matches, Sponsors, Standings, Gallery, etc.)
  → creates / edits an entry via form
  → uploads images (committed to repo) or videos (uploaded to S3)
  → "Publish" → commit to main → site rebuilds → live in ~60–90 sec
```

- All admins (org members with write access) can edit everything. No role-based restrictions in v1.
- No editorial review workflow. Versioned in Git; mistakes are one revert away.
- Drafts save without committing to main (committed to a draft branch by Decap).

## 9. Error handling

| Failure | Visitor sees | Recovery |
|---|---|---|
| Build fails | Last good version stays live (S3 only updates after success) | GitHub Actions emails the org. Fix and re-push. |
| CloudFront stale cache | Up to 5 min stale on HTML | Deploy invalidates `/*`; usually instant. |
| Missing image | Broken image icon on that page; rest of page renders | Fix in CMS, republish. |
| Decap unreachable (GitHub down) | Visitors unaffected | Wait it out (GitHub > 99.9% uptime). |
| Web3Forms down | Form shows error + `mailto:` fallback link | No action; service usually returns. |
| PayPal link missing/invalid | Donate page renders without PayPal section + "international donations temporarily unavailable" note | Admin fixes link in settings. |
| Site fails to build for >24h | Site stale but live | Email alert + manual fix. |

**Backups:** Git history is the backup. AWS infra is reproducible from Terraform/CDK code. Total recovery from worst case (~AWS account loss): ~30 min.

## 10. Testing

| Layer | Approach |
|---|---|
| Build | `npm run build` runs in CI on every PR. Catches broken markdown, missing references, type errors. |
| Links | `lychee` or equivalent linkchecker in CI. Catches broken internal/external links. |
| Lighthouse | Lighthouse CI in deploy pipeline. Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95. |
| Components | Light unit tests for the bilingual rendering helper and stat-aggregation logic. |
| End-to-end | None for v1. Site is mostly static. Contact form tested manually pre-launch. |
| Pre-launch checklist | Manual: every page renders FR + EN, all forms work, donate buttons resolve, mobile + desktop, contact form delivers a real test email, GA4 records hits. |

No visual regression suite, no Playwright suite for v1.

## 11. Performance and accessibility budgets

- LCP < 2.5s on 3G
- Total page weight < 500KB on home (excluding hero image, which is responsive + lazy-loaded)
- Lighthouse: Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95
- Images: responsive `<picture>`, WebP with JPEG fallback, lazy-loaded below the fold
- Fonts: system fonts or one variable font with `font-display: swap`
- JavaScript: minimal — lightbox, language switcher, analytics. Total JS < 30KB.

## 12. Browser and device support

- Chrome, Firefox, Safari, Edge — last 2 versions
- iOS Safari, Android Chrome — last 2 versions
- UC Browser (still common in Cameroon) — informal manual testing
- Screen widths 320px – 2560px
- No IE11 support

## 13. Costs

| Item | Cost |
|---|---|
| AWS (S3 + CloudFront + Route 53 zone + ACM) | ~$2/month |
| Route 53 domain `bekofc.com` | ~$13/year |
| GitHub (org, repos, Actions) | $0 |
| Web3Forms, PayPal, GA4, ImprovMX, CookieYes | $0 |
| Video storage (S3) | < $0.50/month at < 20GB |
| **Total** | **~$2.50/month + $13/year** |

## 14. AWS account & profile (binding constraint)

Every AWS operation for this project — local CLI runs, Terraform/CDK apply, GitHub Actions deploys — must target the AWS account associated with the `default` profile in `~/.aws/config` (the user's "personal" AWS account).

**Verification step (must run as the first action of Phase 0):**

```bash
aws sts get-caller-identity --profile default
```

The returned `Account` ID is the **target account** for the project. Record it in `infra/README.md` and bake it into Terraform/CDK as a variable (`aws_account_id`). Subsequent runs assert that the active account ID matches before applying changes (`terraform`'s `data.aws_caller_identity` + a precondition, or CDK's `env` configuration with explicit account/region).

**Forbidden:**
- Passing `--profile <name>` for any non-`default` profile
- Setting `AWS_PROFILE=<other>` in scripts, GitHub Actions, or Terraform/CDK
- Hardcoding any other AWS account ID anywhere in the codebase
- Storing AWS credentials for any other account in this repo or its CI secrets

**OIDC role:** the IAM role assumed by GitHub Actions must live *in the same account as the `default` profile*. Its trust policy must restrict the role to the `Beko-Football-Club/bekofc-website` repository on the `main` branch (and optionally `pull_request` for preview deploys). No cross-account role assumption.

If at any point implementation discovers it would need a resource in a different AWS account, it must stop and surface the question to the user before proceeding.

## 15. Open items the team must provide

These don't block design but block launch:

- Logo (vector preferred)
- Brand colors (or designer to pick from logo)
- Hero photos + gallery photos + videos
- Founder/club story copy (FR + EN)
- MTN MoMo and Orange Money numbers for donations
- PayPal business account + donate button HTML
- Sponsor tier prices and benefit details
- Audience numbers for sponsor pitch (followers, attendance estimates)
- Contact email + WhatsApp number
- GitHub accounts for all admins (each admin needs one to log in to Decap)

## 16. Phased rollout

**Phase 0 — infra and skeleton (week 1)**
- Verify `default` profile points to the correct AWS account (`aws sts get-caller-identity --profile default`); record the account ID in `infra/README.md`
- AWS account / IAM OIDC setup (in the `default`-profile account, no other)
- Domain registered, Route 53 zone, ACM cert
- S3 buckets, CloudFront distribution
- Astro project scaffolded, Decap admin reachable, GitHub Actions deploying
- "Coming soon" placeholder live at `bekofc.com`

**Phase 1 — core content & site (weeks 2–3)**
- All 10 pages rendering with seed content (founder-provided photos/videos/copy)
- CMS forms for all collections + singletons
- Bilingual rendering working
- Contact form, donate page, sponsor pitch pages live
- League standings table, player roster, basic stats wired up

**Phase 2 — polish & launch (week 4)**
- Lighthouse / accessibility tuning to hit budgets
- GA4, cookie banner
- Pre-launch checklist completed
- DNS cutover from placeholder to full site

**Total: ~4 weeks of effort.** This is a rough sketch; the implementation plan will sequence concrete tasks.

---

## Appendix A — Design decisions (history)

- **No Facebook integration.** Public scraping is fragile and against ToS; Graph API requires a token the user can't generate. The CMS replaces Facebook as the publishing surface.
- **Static site + Decap chosen over Sanity** to avoid vendor lock-in and keep content in Git.
- **OIDC chosen over IAM user keys** to avoid long-lived AWS credentials in GitHub secrets.
- **Per-match stat entry chosen over running totals** for accuracy and auditability.
- **League table on Matches page** rather than its own page, to keep nav at 9 items.
- **Native video uploads via S3 (not Git LFS)** because video sizes outgrow Git fast.
