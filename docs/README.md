# Wild Atlas — Build Pack (Screens · Stitch · API · Kiro)

**Date:** 27 November 2026
**Status:** Ready for Gate 0
**Purpose:** Four deliverables that let you build Wild Atlas module by module without ever pasting the whole project into Kiro:

| # | File | What it answers |
|---|---|---|
| 1 | [`01-SCREENS.md`](./01-SCREENS.md) | Every screen the user sees: route, layout, copy (EN/TA), states, which API, which tables |
| 2 | [`02-STITCH-PROMPTS.md`](./02-STITCH-PROMPTS.md) | One ready-to-paste Stitch AI prompt per screen (S1–S19) |
| 3 | [`03-API-CONTRACTS.md`](./03-API-CONTRACTS.md) | Input JSON, output JSON, error JSON, DB objects, Postman runbook |
| 4 | [`04-KIRO-MODULES.md`](./04-KIRO-MODULES.md) | 10 self-contained Kiro modules (M0–M9), each with its own kickoff prompt |
| — | [`../postman/`](../postman/) | Importable Postman collection + local environment |

---

## 0. Authority resolution (read once, then never again)

Three documents claim to win. They are 95% identical. This pack resolves it as follows.

| Domain | Authority | Why |
|---|---|---|
| Product scope, taxonomy, screen inventory, publishing/recommendation rules | `master.md` + `PROMPT-screen-flow.md` (restated by `REVERSE-ENGINEERING-SPEC.md`) | These define the product, not the implementation |
| Versions, schema DDL, view SQL, query shape, CI, deployment | `IMPLEMENTATION-PLAN.md` | Newest, version-pinned, and fixes defects in the older handbook |
| This pack | `docs/01`–`docs/04` + `postman/` | Operative for screens, JSON contracts, and module boundaries |

### Conflict register (3 items, all resolved)

| # | Conflict | Older doc says | This pack uses | Why |
|---|---|---|---|---|
| C1 | `PERMIT` in `recommendable()` | `access_status = 'OPEN'` or in-season `SEASONAL` only | `OPEN`, `PERMIT`, in-season `SEASONAL` | `IMPLEMENTATION-PLAN.md` §7.6 already has the SQL and the parity test. **Mitigation:** a `PERMIT` place may only enter a digest if `permitNote` exists, and its digest line must state the permit. If you want the stricter rule, delete `'PERMIT'` from one `IN (...)` and one test — a Gate 0 toggle, not a rewrite. |
| C2 | Column name | `place.publishes_site_coordinates` | `place.publish_site_coordinates` | The TypeScript predicate and the SQL view must reference the same column; the shorter name is used everywhere in this pack. |
| C3 | Device identity | `device_uuid` in `localStorage` | `wa_device` httpOnly cookie (UUID) | httpOnly keeps the identifier out of JS and out of XSS reach; Postman handles it automatically via its cookie jar. A dev-only `X-Device-Id` header override exists for scripted tests. |

**Everything else agrees.** Where the older handbook and the plan differ on wording only, the plan's wording is used.

---

## 1. What the user actually sees

**19 surfaces total: 15 web + 4 Telegram.**

| Journey | Screens | Count |
|---|---|---|
| **A — Anonymous discovery** (no identity, no permission) | S1 map home · S2 search entry · S3 results · S4 filter sheet · S5 preview card · S6 dossier · S7 no-results · S8 correction · S9 location explainer | 9 |
| **B — Identity, alerts, trip** | S10 Telegram link (web) · S11 link confirmation (bot) · S12 live-location instruction (bot) · S13 arrival digest (bot) · S14 feedback (bot) · S15 alert settings · S16 saved · S17 trip declaration + pack · S18 offline · S19 method | 10 |

Web routes: `/`, `/place/[slug]`, `/settings/telegram`, `/settings/alerts`, `/saved`, `/trip/[corridor]`, `/method`, plus `/_design/tokens` (internal, noindex) and 404/410.

---

## 2. Locked stack (do not re-litigate inside a module)

| Layer | Pin |
|---|---|
| Runtime | Node 22.x, Next.js **15.5.29** (App Router), React 19.3.1 |
| Language | TypeScript **5.9.3**, ESLint 9.39.5, Prettier 3.10.1 |
| Styling | Tailwind **4.3.5** + `tokens.css` copied from `master.md` §6.2 |
| Data | Neon Postgres + PostGIS, Drizzle **0.45.4**, `postgres` **4.1.1** (`prepare: false`) |
| Validation | Zod **4.6.7** (`z.url()`, `z.iso.date()`) |
| Map | MapLibre **6.19.0**, PMTiles **4.5.0**, `@protomaps/basemaps` **5.7.2** |
| Telegram | `grammy` **1.48.0** (typed `Api` client only) |
| Tests | Vitest **5.1.2**, Playwright **1.65.1** |
| Hosting | Vercel + Neon + Cloudflare R2 |

---

## 3. The five contracts that make every module safe

Every Kiro prompt in `04-KIRO-MODULES.md` repeats the ones it needs. Never assume Kiro remembers them.

1. **`publishable()`** — a place cannot appear publicly without ≥1 A/B source, ≥2 sources, `confidence='SOURCED'`, no unsourced non-lore claim, bilingual required fields, an access point, verification ≤180 days, licensed images, human author **and** human reviewer.
2. **`recommendable()`** — publishable **and** open/permit/in-season **and** `LOW|MODERATE` safety **and** `SECULAR` **and** not night+water/dark-history **and** not monsoon+water **and** not night+night-driving-ban.
3. **Coordinate safety** — public JSON has `accessPoint` only. Never `location`. The `public_place` view physically has no `location` column. `town` selects never include `town.location`.
4. **One taxonomy** — `lib/taxonomy.ts` is the only place facet/status/surface strings exist. UI, seed, search, and Telegram templates import it.
5. **No request-time routing** — map, search, and dossier read precomputed `place_town`. ORS is a batch job, plus at most one pair at notification send time.

---

## 4. Module map (build in this order)

| Module | Name | Ships screens | Ships endpoints | Depends on |
|---|---|---|---|---|
| **M0** | Foundation & contracts | `/_design/tokens` | `/api/health` | — |
| **M1** | Content pipeline + seed | — | — | M0 |
| **M2** | Public read API | data for S1/S6 | `/api/taxonomy`, `/api/towns`, `/api/places`, `/api/places/{slug}` | M0, M1 |
| **M3** | Map shell | S1, S4, S5 | — | M2 |
| **M4** | Dossier | S6, S8, S19 | `/api/corrections` | M3 |
| **M5** | Search | S2, S3, S7, S9 | `/api/search`, `/api/search/suggest`, `/api/nearby` | M4 |
| **M6** | Distance & reach | S4 town control, S6 stat row | `/api/reach` | M5 |
| **M7** | Telegram | S10–S15 | `/api/telegram/*`, `/api/preferences` | M6 |
| **M8** | Trip Pack & offline | S16, S17, S18 | `/api/trips`, `/api/trip/{corridor}/pack` | M7 |
| **M9** | Hardening & launch | all states | `/api/cron/*`, `/api/revalidate` | M8 |

**Rule:** M3 can start once M2 returns 3 seeded places. Do **not** start M7 before dossier #6 is verified — a bot with nothing to deliver teaches you nothing.

---

## 5. How to use this pack

### With Stitch AI
1. Open `02-STITCH-PROMPTS.md`.
2. Paste **Block A (global style)** first, then the screen block (S1…S19).
3. Generate mobile **390×844** first; ask for a 1440×900 desktop variant only after the mobile screen is right.
4. Export/screenshot into `.research/ui-gate-N/` and attach it to the gate.

### With Kiro
1. Open `04-KIRO-MODULES.md`, copy the kickoff prompt for the module you are on.
2. In Kiro: **New Spec** → paste → let it produce `requirements.md`, `design.md`, `tasks.md`.
3. Approve the tasks, then let it implement.
4. Run the module's acceptance commands before moving on.

Never paste `master.md` or `IMPLEMENTATION-PLAN.md` into Kiro. Each module prompt already contains its slice.

### With Postman
1. Import `postman/WildAtlas.postman_collection.json` and `postman/WildAtlas.local.postman_environment.json`.
2. Select the environment, run **00 → 01 → 02 → …** in order.
3. Requests 90–99 are negative tests. They must fail in the documented way.
4. Every read request asserts that the response contains no `"location"` key.

---

## 6. Gate 0 decisions still open

| # | Decision | Recommendation | Blocks |
|---|---|---|---|
| O1 | Default language | **Tamil-first**, English toggle (`DEFAULT_LANG=ta`) | S1, S6, tokens |
| O2 | Brand name | Test a Coimbatore-first name; "Wild Atlas" is a working name | S1, S19, bot username |
| O3 | Analytics consent | Consent-gated PostHog; no events before consent | M0, M3 |
| O4 | Restricted-place storage | Coarse centroid or access point in a private seed store | M1 |
| O5 | Token palette | Approve `master.md` §6.2 as-is or request changes | `/_design/tokens` |

Nothing in this pack blocks on those except the two marked.

---

## 7. Non-negotiables for every module

- Public JSON never contains `location`, `publish_site_coordinates`, `chat_id`, `token_hash`, `home_geohash5`.
- No hotel names, prices, ratings, or availability anywhere.
- Banned strings: **Mystery, Hidden Gems, Trending, Adventure** — CI greps for them.
- Status is never colour-only; the badge always carries the word.
- Minimum tap target 44×44 px.
- Tamil copy in this pack is a **draft** and must be signed off by `tamilReviewedBy` before publishing.
