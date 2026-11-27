# Wild Atlas — TypeScript Implementation Plan

**Status:** Draft for Gate 0 approval  

**Date:** 26 November 2026  

**Authoritative product source:** `master.md` (25 November 2026). If this plan and `master.md` disagree, `master.md` wins.  

**Scope:** Phase 1, Stages 0–7. Stage 8 (Signals) is explicitly deferred.  

**Working name:** Wild Atlas. Brand name is still open decision O3.

---

## 0. Read this first

Wild Atlas is a **sourced, bilingual, access-aware field companion** for Coimbatore district and a 60 km radius. It publishes **dossiers, not pins**. Every published place carries:

- an **access point** (where you park or start walking), never just a site coordinate;

- a **base town** with road distance and drive time;

- a **last mile** with surface and time;

- an **access window** with hours, closed days, permits, and night-driving restrictions;

- **documented facts separated from local lore**, each fact carrying a source grade;

- a **verification date** and a human reviewer;

- **Tamil and English** text, authored in both languages, never machine-translated.

The product is not a discovery feed. It is a **trust surface for a small, hand-researched corpus**. The corpus is the moat. The app is the reading surface. Telegram is the delivery mechanism that removes the install barrier and supplies the background location the browser cannot.

### 0.1 What is locked

| Area | Locked decision |

|---|---|

| Framework | Next.js App Router + TypeScript |

| Database | Neon Postgres + PostGIS |

| ORM | Drizzle ORM |

| Map | MapLibre GL JS + PMTiles |

| Delivery | Telegram Bot API |

| Hosting | Vercel |

| Analytics | PostHog |

| Region | Coimbatore district + 60 km |

| Languages | Tamil and English, both authored |

| Commercial | No booking, no payments, no sponsored placement, no paywalled dossier |

| Mobile | PWA only. No native app. No background geofencing in the browser. |

| Content | No AI-generated place descriptions. Human-authored, human-reviewed. |

### 0.2 What this plan decides

This plan converts the product rules into a build sequence a developer can execute without re-reading all ten source documents. It decides:

1. **Exact versions** for the locked stack, including where the docs are now behind the ecosystem.

2. **Repository structure**, module boundaries, and the TypeScript contracts that prevent unsafe publication and unsafe recommendations.

3. **The database schema additions** required to make the existing schema enforceable and privacy-safe.

4. **The route, component, and data-flow design** for the map, dossier, search, distance, Telegram, and Trip Pack surfaces.

5. **The test and CI strategy** that makes the publishing contract and coordinate-safety rules impossible to bypass.

6. **The stage-by-stage sequence with approval gates**, including the parallel content sprint.

### 0.3 The critical path

Engineering is roughly **39 days**. Content is roughly **9 weeks part-time** for 12 dossiers. The critical path is **content, not code**. Start the content sprint during Stage 0. Do not launch the Telegram bot before dossier #6 is verified. A bot with nothing to deliver teaches you nothing.

### 0.4 How to use this document

- Read §1–§3 for context and shape.

- Build Stage 0 from §5–§7 and §17.

- Build the map from §9–§10.

- Build search from §11.

- Build distance from §12.

- Build Telegram from §13.

- Build the Trip Pack from §14.

- Use §16 and §17 as the definition of done.

- Use Appendix A for copy-paste contracts and Appendix B for research sources.

---

## 1. Executive summary

### 1.1 The build in one table

| Layer | Decision | Why |

|---|---|---|

| Runtime | Next.js **15.5.29** App Router, Node 22, React 19.3.1 | Stack is locked to Next 15; 15.5.29 is the latest 15.x. Next 16.4.6 is current but not part of the locked stack. |

| Language | TypeScript **5.9.3** | TypeScript 7.0.2 is current but too new for the Next 15 / ESLint / Drizzle toolchain. Revisit after Phase 1. |

| Styling | Tailwind CSS **4.3.5** + the token CSS from `master.md` §6.2 | Tokens are the source of truth; Tailwind is a utility layer, not a second design system. |

| Data | Neon Postgres + PostGIS, Drizzle **0.45.4**, `postgres` **4.1.1** | PostGIS for geography, trigram search, and reach hulls; Drizzle for typed schema; `postgres` for transactions on Vercel Node runtime. |

| Validation | Zod **4.6.7** | Every external input and every content file is parsed at the boundary. |

| Map | MapLibre GL JS **6.19.0**, PMTiles **4.5.0**, `@protomaps/basemaps` **5.7.2** | Locked stack; Protomaps gives a self-hostable OSM basemap without a tile vendor. |

| Search | Postgres FTS + `pg_trgm` + deterministic synonym parser | No model, no external search service, debuggable, Tamil-capable. |

| Distance | ORS Matrix V2 batch, stored in `place_town` | 500 matrix calls/day free; ~530 pairs is one batch call. Never route at request time. |

| Telegram | Bot API + `grammy` **1.48.0** types/API client, webhook + `after()` processing | Typed Bot API without adopting a framework that hides idempotency and privacy rules. |

| Offline | Trip Pack manifest + service worker (Serwist **9.6.0** spike) | Dossiers, matrix, and PMTiles work in airplane mode. |

| Hosting | Vercel (app + cron) + Cloudflare R2 (PMTiles, images, packs) | Vercel for Next; R2 for zero-egress range requests and immutable pack assets. |

| Analytics | PostHog, consent-gated, no precise location | Product metrics without creating a location ledger. |

| Tests | Vitest **5.1.2**, Playwright **1.65.1**, PostGIS contract tests | The publishing and recommendation contracts are tested against both TypeScript and SQL. |

### 1.2 The five non-negotiable contracts

1. **`publishable()`** — a place cannot appear publicly unless it has ≥1 A/B source, ≥2 sources total, `confidence='SOURCED'`, no unsourced non-lore claim, bilingual required fields, an access point, a verification date within 180 days, licensed images, and a human author and reviewer.

2. **`recommendable()`** — a place cannot enter a push unless it is publishable, currently open or in season, not hazardous/prohibited, not sacred/sensitive/active-religious, not a night-time water/dark-history candidate, not a monsoon water candidate, and not on a night-driving-ban road at night.

3. **Coordinate safety** — public DTOs never contain `place.location`. They contain `access_point` only. The `public_place` SQL view physically excludes `location`. Restricted places store a coarse centroid or the access point, never the exact site.

4. **One taxonomy** — `lib/taxonomy.ts` is imported by the UI, seed scripts, search, and Telegram templates. No facet, status, or surface string literal exists anywhere else.

5. **No request-time routing** — the map, search, and dossier read precomputed `place_town` rows. ORS is called by a batch job, and at most once at notification send time for the winning candidate.

### 1.3 What is deliberately not in this plan

| Not building | Reason |

|---|---|

| User accounts and passwords | `device_id` + `chat_id` is enough through Stage 7. |

| Booking, payments, inventory | Liability, stale data, wrong product. Trip Pack is free in Phase 1; pricing is a later decision. |

| Social feed, profiles, comments | Nobody comes here for other people. |

| Itinerary optimiser | Scope trap; the Trip Pack and base-town model cover the need. |

| AI-generated descriptions | Unverifiable; destroys the only differentiator. |

| Crowdsourced place creation | Cold-start failure; hand-research 12 dossiers first. |

| Sponsored placement | Kills trust and the subscription. |

| `/trending`, `/discover` at launch | Nothing to show; will look broken. |

| Background geofencing in the PWA | Impossible; Telegram live location is the background source. |

| Self-hosted OSRM | 600 MB extract, 8–16 GB RAM, four runs a year. |

| Redis, Elasticsearch, microservices | One Next.js process and one Postgres database handle this for years. |

| Recommendation ML | Deterministic and explainable, or you cannot defend a bad call. |

---

## 2. Research findings that shape the plan

Research was performed on 26 November 2026 with the Firecrawl CLI. Raw outputs are in `.firecrawl/`. The findings below confirm, sharpen, or correct the assumptions in the source documents.

### 2.1 Live competitor checks

| Competitor | What was observed | What it means for Wild Atlas |

|---|---|---|

| **Atlas Obscura** | The Gass Forest Museum page says: *“We've decided not to publish this place on Atlas Obscura.”* It has an About paragraph but no approved photos and no access fields. A site search for Coimbatore/Valparai/Pollachi returns the mainstream **Adiyogi Shiva Statue** entry, two articles, and the India index — not a regional dossier corpus. | The content analog has a **stub, not a dossier**, for a place on our launch list. The gap is not “Atlas Obscura for India”; it is the dossier format itself — sourced, access-aware, verified, bilingual — applied to this region. |

| **AllTrails** | The Coimbatore page lists **4 scenic trails**; the Valparai page lists **5 trails** (Chinnakalar Falls, Sholayar Dam, Topslip, Akkamalai, Iyerpady). Offline maps and conditions are paid features. There are no access points, permits, gate windows, last-mile surfaces, base towns, or Tamil dossiers. | AllTrails validates the utility/revenue analog but leaves the access-truth layer empty. We should not compete on trail volume. We should compete on **whether you can get in when you arrive**. |

| **Zafari** | Google Play shows **100+ downloads**. The site leads with AI trip planning, nearby discovery, SOS, and a 9-tile dashboard; the place page leads with weather. | Not a competitive threat at this scale. It validates that “nearby discovery” is a feature, not a moat. Weather-first is the exact substitution our product rejects. |

| **PinIt** | The explore map reports **220 pins** globally, a flat 13+ category chip row, and **no Coimbatore results** in a site search. The map is the product; the taxonomy conflates type, access, and landform. | Crowdsourcing produces an empty map. This directly validates the decision to hand-research 12 dossiers before launch. |

| **Google Maps** | Ask Maps shipped holiday features in 2026; Local Gems and Trending lists are part of local discovery. Google has distribution and freshness, but no provenance, source grades, access points, last-mile surfaces, or bilingual dossiers. | Google commoditises **discovery**. It does not commoditise **verified access**. Do not try to out-discover Google; out-verify it for one region. |

| **Official tourism** | Tamil Nadu Tourism’s Coimbatore district page and the district site list Maruthamalai, Parambikulam Aliyar, Vaideki, Sengupathi, Siruvani, Valparai, and other attractions. These are listings, not dossiers. | Official pages are **source candidates** (grade B/C) and potential distribution partners, not competitors. |

### 2.2 Findings that change the build

1. **OSM cannot seed the corpus.** The master’s live Overpass query found **zero waterfalls tagged** in a region containing Siruvani, Kovai Kutralam, Monkey Falls, Thirumoorthy Falls, and Chinnakallar. OSM is for basemap geometry and candidate names only. The corpus is 100% manual research.

2. **Telegram live location is not hard-capped at 8 hours.** The Bot API `Location.live_period` is a client-provided duration; the server must accept it and expire sessions on its own 5-minute inactivity rule. Do not encode 8 hours as a ceiling. Do not claim the bot can start live location: it cannot. It can only instruct the user and request a one-shot static location.

3. **The “India competitor” is not competitive.** Zafari’s 100+ installs do not validate a threat. PinIt’s empty map validates the opposite strategy: hand-researched depth.

4. **The category leader has not done this region.** Atlas Obscura has a mainstream Adiyogi entry and articles, but its Gass Forest Museum page is an unpublished stub. The dossier format is unoccupied here.

5. **Tamil sources are thin, not absent.** The master found three useful Tamil sources for Siruvani. The constraint is **authoring**, not translation. Budget a Tamil editor/reviewer from dossier #1.

6. **The browser cannot do background proximity.** The PWA can do one-shot geolocation while visible. Continuous proximity belongs to Telegram live location. This is an architectural constraint, not a feature choice.

### 2.3 Platform and version findings

| Item | Finding on 26 Nov 2026 | Decision |

|---|---|---|

| Next.js | Latest is **16.4.6**; latest 15.x is **15.5.29**. The locked stack says Next 15. Next 16 changes middleware to `proxy.ts`, adds Cache Components, and makes Turbopack the default. | Pin **15.5.29** for Phase 1. Do not mix Next 16 features into the build. Schedule a Next 16 migration spike after Gate 6. |

| TypeScript | Latest is **7.0.2** (native compiler line); 5.9.3 is the stable 5.x line. Next 15’s `eslint-config-next` peers on ESLint 7–9, not 10. | Pin **5.9.3** and ESLint **9.39.5**. Revisit TypeScript 7 after Phase 1. |

| Drizzle | **0.45.4** supports native `geometry(Point,4326)` but has no first-class `geography` column. | Use a small `geographyPoint` custom type for DDL and raw SQL for spatial predicates. Fallback: native geometry + `::geography` casts. Stage 0 spike decides. |

| MapLibre | **6.19.0** is current. | Pin 6.19.0. MapLibre is a client-only dependency; lazy-load it. |

| PMTiles | **4.5.0**; `Protocol` + `maplibregl.addProtocol("pmtiles", protocol.tile)` is the supported integration. | Pin 4.5.0. Host PMTiles on R2 with CORS and range support. |

| Protomaps basemaps | `@protomaps/basemaps` **5.7.2**; `layers("protomaps", namedFlavor("light"), { lang })` builds a style without a vendor key. | Pin 5.7.2. Host glyphs/sprites on R2 for production; use the public assets URL during the spike. |

| ORS | Standard plan: **Matrix V2 500 calls/day, 40/minute**. A 50×50 matrix is 2,500 pairs. | ~530 pairs fit in one or two calls. Batch quarterly, not request-time. |

| Telegram | Bot API `setWebhook` supports `secret_token`; the header is `X-Telegram-Bot-Api-Secret-Token`. Photo captions are capped at **1024 characters**. `getFile` downloads are capped at **20 MB**. A bot cannot start a user’s live location. | Webhook secret validation, 900-character caption budget, and a two-path `/nearby` flow: live-location instructions or a one-shot `request_location` keyboard button. |

| Neon | PostGIS and `pg_trgm` are supported extensions. Use the pooled connection string at runtime and the unpooled string for migrations. | `postgres` driver with `prepare: false`; `DATABASE_URL_UNPOOLED` for Drizzle Kit and migrations. |

### 2.4 Research sources

| Source | URL | Used for |

|---|---|---|

| Atlas Obscura — Gass Forest Museum | https://www.atlasobscura.com/places/gass-forest-museum | Unpublished stub quote; no access fields |

| Atlas Obscura — Adiyogi Shiva Statue | https://www.atlasobscura.com/places/adiyogi-shiva-statue | Mainstream-only regional coverage |

| AllTrails — Coimbatore | https://www.alltrails.com/india/tamil-nadu/coimbatore--2 | 4 trails; no access/gate data |

| AllTrails — Valparai | https://www.alltrails.com/india/tamil-nadu/valparai | 5 trails; trail-only corpus |

| Zafari — Google Play | https://play.google.com/store/apps/details?id=com.bishal.zafari | 100+ installs; feature shape |

| Zafari — home | https://zafari-app.in/ | AI planner, nearby, SOS, dashboard |

| PinIt — explore | https://pinitmap.net/explore | 220 pins; flat taxonomy; no regional coverage |

| Google — Ask Maps 2026 | https://blog.google/products-and-platforms/products/maps/ask-maps-holiday-travel-features-2026/ | Local discovery commoditisation |

| Tamil Nadu Tourism — Coimbatore | https://www.tamilnadutourism.tn.gov.in/destinations/coimbatore-district | Official listing; source candidate |

| Coimbatore district — tourist places | https://coimbatore.nic.in/tourist-places/ | Official listing; source candidate |

| Telegram Bot API | https://core.telegram.org/bots/api | Webhook secret, live location, captions, files |

| Telegram `sendLocation` | https://core.telegram.org/bots/api/methods/sendlocation.md | `live_period`, `horizontal_accuracy` |

| Telegram `setWebhook` | https://core.telegram.org/bots/api/methods/setwebhook.md | `secret_token` header |

| Next.js 16 release | https://nextjs.org/blog/next-16 | Version drift; Next 16 changes |

| Drizzle PostGIS guide | https://orm.drizzle.team/docs/guides/postgis-geometry-point | `geometry(Point,4326)` support |

| Protomaps — MapLibre | https://docs.protomaps.com/basemaps/maplibre | Style, glyphs, sprites |

| Protomaps — PMTiles | https://docs.protomaps.com/pmtiles/maplibre | PMTiles protocol |

| ORS plans | https://openrouteservice.org/plans/ | Matrix 500/day, 40/min |

| Neon PostGIS | https://neon.com/docs/extensions/postgis | Extension support |

---

## 3. Architecture

### 3.1 System shape

```

┌────────────────────────────────────────────────────────────────────┐

│ Browser / installed PWA                                            │

│                                                                    │

│  Next.js RSC pages ──────► server components, no DB in client      │

│  MapLibre + PMTiles ─────► vector basemap + place/town overlays     │

│  Service worker ─────────► Trip Pack cache, offline fallback       │

│  PostHog (consent) ──────► product events, no precise location     │

└───────────────┬────────────────────────────────────────────────────┘

                │ HTTPS

┌───────────────▼────────────────────────────────────────────────────┐

│ Next.js on Vercel (Node runtime)                                   │

│                                                                    │

│  app/ routes ──► db/queries ──► Neon Postgres + PostGIS            │

│  server actions ─► corrections, preferences, trip declaration      │

│  route handlers ─► search suggestions, reach, Telegram, packs      │

│  after() / cron ─► Telegram processing, expiry, purge, jobs        │

└───────┬───────────────────────┬───────────────────────┬────────────┘

        │                       │                       │

        ▼                       ▼                       ▼

  Neon Postgres            Telegram Bot API          Cloudflare R2

  PostGIS + pg_trgm        webhook + send            PMTiles, images, packs

        ▲

        │ quarterly batch

  ORS Matrix V2 ──► place_town rows

```

### 3.2 Request paths

| Path | Flow | Cache |

|---|---|---|

| Map home `/` | RSC reads `public_place` + `town` + top base towns; client map renders; sheet interactions are client-side. | `revalidate = 300`; towns cached 1h |

| Dossier `/place/[slug]` | RSC reads one public place with sources, claims, images, base towns; 12-section renderer. | `revalidate = 3600`; tag `place:<slug>` |

| Search `/?q=...` | RSC parses intent, queries `public_place` + `place_town`, renders map + list. | dynamic |

| Reach `/api/reach` | SQL filters `place_town` by town + minutes; returns cards + convex hull. | `s-maxage=300` |

| Telegram link | Web creates token/code; bot `/start <token>`; user confirms code; web polls status. | no-store |

| Telegram webhook | Validate secret → insert `telegram_update` idempotency row → return 200 → `after()` processes. | no-store |

| Trip Pack | Static manifest + dossier JSON + PMTiles from R2; service worker caches. | immutable |

### 3.3 Architectural principles

1. **Server-first.** No database driver, service key, or ORS key reaches the browser. Client components receive serializable DTOs.

2. **Precompute distance.** The map and dossier read `place_town`. ORS is a batch dependency, not a runtime dependency.

3. **Coordinate safety by construction.** Public DTOs and the `public_place` view have no `location` field. This is not a review rule; it is a type and schema boundary.

4. **One taxonomy, one contract.** `lib/taxonomy.ts`, `lib/publishable.ts`, and `lib/recommendable.ts` are shared by UI, seed, search, and Telegram.

5. **Deterministic recommendations.** The score and reason string are computed from database fields and fixed weights. No model, no prompt, no invented clause.

6. **Content as typed code.** Dossiers are TypeScript modules validated by Zod at build time, seeded idempotently, and checked by CI.

7. **Small surface.** No microservices, no queue service, no Redis. Postgres tables and Vercel `after()`/cron cover the throughput.

8. **Privacy by omission.** No lat/lon in `location_session`; no full Telegram payloads; distance bands, not metres; 90-day purge.

### 3.4 Deployment topology

| Environment | App | Database | Map/pack assets | Telegram |

|---|---|---|---|---|

| Local | `next dev` | Docker PostGIS 16-3.4 or Neon branch | `public/tiles` or R2 dev bucket | Test bot, polling or tunneled webhook |

| Preview | Vercel Preview | Neon branch per PR | R2 preview prefix | Test bot; webhook pointed at the preview only when testing |

| Production | Vercel Production | Neon production branch | R2 production bucket | Production bot; webhook set to the production domain |

Preview deployments must not share the production Telegram bot or production database. Use a separate test bot and a Neon branch.

---

## 4. Repository layout

```

wild-atlas/

├─ app/

│  ├─ layout.tsx                    # fonts, tokens, consent, skip link

│  ├─ page.tsx                      # S1 map home

│  ├─ globals.css

│  ├─ tokens.css                    # master §6.2 tokens

│  ├─ place/[slug]/page.tsx         # S6 dossier

│  ├─ method/page.tsx               # S19 trust surface

│  ├─ saved/page.tsx                # S16 device-local saves

│  ├─ settings/

│  │  ├─ telegram/page.tsx          # S10 link flow

│  │  └─ alerts/page.tsx            # S15 radius/quiet/pause

│  ├─ trip/[corridor]/page.tsx      # S17/S18 trip declaration + offline

│  ├─ _design/tokens/page.tsx       # Gate 0 specimen, noindex

│  ├─ api/

│  │  ├─ search/suggest/route.ts

│  │  ├─ reach/route.ts

│  │  ├─ corrections/route.ts

│  │  ├─ telegram/link/route.ts

│  │  ├─ telegram/link/status/route.ts

│  │  ├─ telegram/webhook/route.ts

│  │  ├─ trip/[corridor]/pack/route.ts

│  │  ├─ cron/telegram/route.ts

│  │  ├─ cron/purge/route.ts

│  │  ├─ revalidate/route.ts

│  │  └─ health/route.ts

│  ├─ sitemap.ts

│  ├─ robots.ts

│  └─ manifest.ts

├─ components/

│  ├─ ui/                           # Button, Badge, Chip, Sheet, Stat...

│  ├─ map/                          # MapCanvas, pins, hull, controls

│  ├─ home/                         # SearchBar, BaseTownSelect, Carousel

│  ├─ place/                        # Dossier sections, sources, correction

│  ├─ settings/                     # TelegramLinkCard, AlertSettings

│  ├─ trip/                         # PackDownload, OfflineBadge

│  └─ analytics/                    # PostHog provider, consent

├─ content/

│  ├─ define.ts                     # definePlace, defineTown, Zod schemas

│  ├─ places/

│  │  ├─ index.ts

│  │  └─ siruvani.ts

│  └─ towns/

│     ├─ index.ts

│     └─ valparai.ts

├─ db/

│  ├─ client.ts

│  ├─ schema/

│  │  ├─ index.ts

│  │  ├─ place.ts

│  │  ├─ town.ts

│  │  ├─ identity.ts

│  │  ├─ telegram.ts

│  │  ├─ trip.ts

│  │  ├─ signals.ts

│  │  ├─ views.ts

│  │  └─ geo.ts

│  ├─ queries/

│  │  ├─ places.ts

│  │  ├─ dossier.ts

│  │  ├─ search.ts

│  │  ├─ reach.ts

│  │  ├─ telegram.ts

│  │  └─ trips.ts

│  ├─ fixtures/

│  │  └─ places.ts

│  └─ migrations/

│     ├─ 0000_extensions.sql

│     ├─ 0001_core.sql

│     ├─ 0002_views.sql

│     └─ ...

├─ lib/

│  ├─ taxonomy.ts

│  ├─ env.ts

│  ├─ env.public.ts

│  ├─ publishable.ts

│  ├─ recommendable.ts

│  ├─ dates.ts

│  ├─ geo.ts

│  ├─ search/

│  │  ├─ intent.ts

│  │  ├─ synonyms.ts

│  │  └─ query.ts

│  ├─ telegram/

│  │  ├─ api.ts

│  │  ├─ update.ts

│  │  ├─ link.ts

│  │  ├─ budget.ts

│  │  ├─ recommend.ts

│  │  ├─ process.ts

│  │  └─ templates.ts

│  ├─ trip/

│  │  └─ manifest.ts

│  ├─ analytics/

│  │  └─ events.ts

│  └─ utils.ts

├─ scripts/

│  ├─ migrate.ts

│  ├─ seed.ts

│  ├─ seed-fixtures.ts

│  ├─ check-publishable.ts

│  ├─ check-content.ts

│  ├─ check-banned-strings.ts

│  ├─ compute-matrix.ts

│  ├─ build-pack.ts

│  ├─ telegram-set-webhook.ts

│  └─ purge.ts

├─ public/

│  ├─ sw.js                          # or generated by Serwist

│  ├─ icons/

│  └─ offline.html

├─ tests/

│  ├─ unit/

│  ├─ integration/

│  ├─ e2e/

│  └─ setup/

├─ .github/workflows/ci.yml

├─ drizzle.config.ts

├─ next.config.ts

├─ tsconfig.json

├─ package.json

└─ README.md

```

### 4.1 Module boundaries

| Layer | May import | Must not import |

|---|---|---|

| `app/**` | `components`, `lib`, `db/queries` | `db/schema` directly, `postgres` |

| `components/**` | `lib/taxonomy`, DTO types | `db/**`, `postgres`, server env |

| `db/queries/**` | `db/client`, `db/schema`, `lib` | `app/**`, `components/**` |

| `lib/**` | other `lib` modules | `db/client` except in explicitly server-only modules |

| `content/**` | `lib/taxonomy`, `content/define` | `db/**`, `app/**` |

| `scripts/**` | everything server-side | browser APIs |

Enforce with ESLint `no-restricted-imports` rules. The most important rule: **`components/**` cannot import `db/**` or `postgres`**.

---

## 5. Stack and dependency pins

### 5.1 Runtime and framework

| Package | Version | Notes |

|---|---|---|

| `node` | 22.x | `engines.node: ">=22 <23"`; `.nvmrc` = `22` |

| `next` | `15.5.29` | Locked stack; latest 15.x |

| `react` | `19.3.1` | Next 15 peer-compatible |

| `react-dom` | `19.3.1` | |

| `typescript` | `5.9.3` | Not TS 7 yet |

| `@types/node` | `^22` | Match runtime |

| `@types/react` | `19.3.3` | |

| `@types/react-dom` | `19.3.0` | |

| `eslint` | `9.39.5` | `eslint-config-next@15.5.29` peers on 7–9 |

| `eslint-config-next` | `15.5.29` | |

| `prettier` | `3.10.1` | Formatting only |

### 5.2 Data and validation

| Package | Version | Notes |

|---|---|---|

| `drizzle-orm` | `0.45.4` | Schema, relations, queries |

| `drizzle-kit` | `0.31.11` | Migrations |

| `postgres` | `4.1.1` | `prepare: false` for pooled Neon |

| `zod` | `4.6.7` | Env, content, API, Telegram |

| `dotenv` | latest | Scripts and Drizzle config |

### 5.3 Map

| Package | Version | Notes |

|---|---|---|

| `maplibre-gl` | `6.19.0` | Client-only |

| `pmtiles` | `4.5.0` | `Protocol` + `addProtocol` |

| `@protomaps/basemaps` | `5.7.2` | Style layers + flavors |

| `@types/geojson` | latest | GeoJSON types |

### 5.4 Telegram and analytics

| Package | Version | Notes |

|---|---|---|

| `grammy` | `1.48.0` | Typed `Api` client and Bot API types; not the webhook framework |

| `posthog-js` | latest | Client, consent-gated |

| `posthog-node` | latest | Server events, no PII |

### 5.5 Testing and tooling

| Package | Version | Notes |

|---|---|---|

| `vitest` | `5.1.2` | Unit + integration |

| `@playwright/test` | `1.65.1` | E2E, offline, mobile viewport |

| `@testing-library/react` | latest | Component tests |

| `@testing-library/jest-dom` | latest | |

| `jsdom` | latest | |

| `axe-core` | latest | Accessibility checks |

| `tsx` | latest | Scripts |

| `@serwist/next` | `9.6.0` | Stage 7 spike; fallback hand-written SW |

### 5.6 Version policy

- Exact pins in `package.json`; commit `package-lock.json`.

- Renovate monthly; no auto-merge for major versions.

- Do not upgrade Next, React, TypeScript, Drizzle, or MapLibre during a gate. Upgrade only between gates with a green test matrix.

- Next 16 migration is a separate, post-Phase-1 project. It will require `proxy.ts`, Cache Components review, and a Turbopack build check.

---

## 6. Configuration and environments

### 6.1 Environment variables

| Variable | Scope | Required | Purpose |

|---|---|---|---|

| `DATABASE_URL` | server | yes | Pooled Neon connection for the app |

| `DATABASE_URL_UNPOOLED` | server/scripts | yes | Direct connection for migrations and batch jobs |

| `NEXT_PUBLIC_SITE_URL` | public | yes | Canonical URLs, deep links, sitemap |

| `NEXT_PUBLIC_PMTILES_URL` | public | yes | Region basemap PMTiles URL (R2) |

| `NEXT_PUBLIC_MAP_ASSETS_URL` | public | no | R2 base for glyphs/sprites; defaults to Protomaps public assets |

| `NEXT_PUBLIC_PACK_BASE_URL` | public | yes | R2 base for Trip Pack assets |

| `NEXT_PUBLIC_IMAGE_BASE_URL` | public | yes | R2 base for licensed images |

| `ORS_API_KEY` | server | yes for batch | ORS Matrix V2 |

| `TELEGRAM_BOT_TOKEN` | server | yes | Bot API |

| `TELEGRAM_WEBHOOK_SECRET` | server | yes | `X-Telegram-Bot-Api-Secret-Token` |

| `TELEGRAM_BOT_USERNAME` | server/public | yes | Deep link `t.me/<username>` |

| `TELEGRAM_WEBHOOK_URL` | server/scripts | yes | `setWebhook` URL |

| `NEXT_PUBLIC_POSTHOG_KEY` | public | no | Analytics |

| `NEXT_PUBLIC_POSTHOG_HOST` | public | no | Analytics host |

| `ADMIN_ALLOWLIST` | server | no | Future admin surface; scripts are the Phase 1 admin |

| `CRON_SECRET` | server | yes | Cron route authorization |

| `DEFAULT_LANG` | server/public | no | `ta` or `en`; Gate 0 decision |

| `REGION_BBOX` | server | no | Default `75.8,10.2,77.8,11.8` |

| `R2_ACCOUNT_ID` | scripts | no | Pack/image upload |

| `R2_ACCESS_KEY_ID` | scripts | no | Pack/image upload |

| `R2_SECRET_ACCESS_KEY` | scripts | no | Pack/image upload |

| `R2_BUCKET` | scripts | no | Pack/image upload |

| `SENTRY_DSN` | server | no | Optional error tracking |

### 6.2 Validation

`lib/env.ts` parses server env with Zod at module load. `lib/env.public.ts` parses only `NEXT_PUBLIC_*`. A missing required variable fails the build or the first request with a clear message. Never read `process.env` directly outside these modules.

```ts

// lib/env.ts

import { z } from 'zod';

const serverSchema = z.object({

  DATABASE_URL: z.url(),

  DATABASE_URL_UNPOOLED: z.url(),

  ORS_API_KEY: z.string().min(1),

  TELEGRAM_BOT_TOKEN: z.string().min(1),

  TELEGRAM_WEBHOOK_SECRET: z.string().min(16),

  TELEGRAM_BOT_USERNAME: z.string().min(1),

  TELEGRAM_WEBHOOK_URL: z.url(),

  CRON_SECRET: z.string().min(16),

  DEFAULT_LANG: z.enum(['ta', 'en']).default('ta'),

});

export const env = serverSchema.parse({

  DATABASE_URL: process.env.DATABASE_URL,

  DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED,

  ORS_API_KEY: process.env.ORS_API_KEY,

  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,

  TELEGRAM_WEBHOOK_SECRET: process.env.TELEGRAM_WEBHOOK_SECRET,

  TELEGRAM_BOT_USERNAME: process.env.TELEGRAM_BOT_USERNAME,

  TELEGRAM_WEBHOOK_URL: process.env.TELEGRAM_WEBHOOK_URL,

  CRON_SECRET: process.env.CRON_SECRET,

  DEFAULT_LANG: process.env.DEFAULT_LANG,

});

```

### 6.3 Local development

```bash

# 1. Database (Docker)

docker run --name wa-pg \

  -e POSTGRES_PASSWORD=wildatlas \

  -e POSTGRES_DB=wildatlas \

  -p 5432:5432 \

  -d postgis/postgis:16-3.4

# 2. Install

npm ci

# 3. Configure

cp .env.example .env.local

# DATABASE_URL=postgres://postgres:wildatlas@localhost:5432/wildatlas

# DATABASE_URL_UNPOOLED=postgres://postgres:wildatlas@localhost:5432/wildatlas

# 4. Migrate, seed, run

npm run db:migrate

npm run db:seed

npm run dev

```

Use a Neon branch instead of Docker if you want preview parity. Do not develop against the production branch.

### 6.4 Migrations

- `drizzle-kit generate` produces SQL from the Drizzle schema.

- Hand-written custom migrations cover `CREATE EXTENSION`, views, functions, triggers, and trigram/FTS indexes.

- Migration order:

  1. `0000_extensions.sql` — `postgis`, `pg_trgm`.

  2. `0001_core.sql` — tables, constraints, indexes.

  3. `0002_views.sql` — `publishable_place`, `public_place`, `is_recommendable`.

  4. Later migrations — additions only.

- Never edit an applied migration. Add a new one.

- Run migrations with the **unpooled** connection in a separate CI/deploy job, before the app deploy.

- Preview environments use Neon branches; seed fixtures, not production data.

- `drizzle-kit check` runs in CI.

### 6.5 `.env.example`

```bash

DATABASE_URL=postgres://user:pass@host/db?sslmode=require

DATABASE_URL_UNPOOLED=postgres://user:pass@host/db?sslmode=require

NEXT_PUBLIC_SITE_URL=http://localhost:3000

NEXT_PUBLIC_PMTILES_URL=http://localhost:3000/tiles/coimbatore.pmtiles

NEXT_PUBLIC_PACK_BASE_URL=http://localhost:3000/packs

NEXT_PUBLIC_IMAGE_BASE_URL=http://localhost:3000/images

ORS_API_KEY=

TELEGRAM_BOT_TOKEN=

TELEGRAM_WEBHOOK_SECRET=

TELEGRAM_BOT_USERNAME=

TELEGRAM_WEBHOOK_URL=

NEXT_PUBLIC_POSTHOG_KEY=

NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com

CRON_SECRET=

DEFAULT_LANG=ta

REGION_BBOX=75.8,10.2,77.8,11.8

```

---

## 7. Domain model and TypeScript contracts

### 7.1 Taxonomy — the single source of truth

```ts

// lib/taxonomy.ts

export const FACETS = [

  'NATURE', 'WATER', 'SACRED', 'HERITAGE',

  'INDUSTRIAL', 'URBAN', 'DARK_HISTORY',

] as const;

export type Facet = (typeof FACETS)[number];

export const SIGNALS = ['OBSCURITY', 'NARRATIVE', 'RISING'] as const;

export type Signal = (typeof SIGNALS)[number];

export const ACCESS_STATUS = [

  'OPEN', 'SEASONAL', 'PERMIT', 'RESTRICTED', 'CLOSED',

] as const;

export type AccessStatus = (typeof ACCESS_STATUS)[number];

export const SAFETY_CLASS = ['LOW', 'MODERATE', 'HAZARDOUS', 'PROHIBITED'] as const;

export type SafetyClass = (typeof SAFETY_CLASS)[number];

export const CULTURAL_STATUS = ['SECULAR', 'RELIGIOUS_ACTIVE', 'SACRED', 'SENSITIVE'] as const;

export type CulturalStatus = (typeof CULTURAL_STATUS)[number];

export const CONFIDENCE = ['SOURCED', 'PARTIAL', 'UNVERIFIED'] as const;

export type Confidence = (typeof CONFIDENCE)[number];

export const LAST_MILE_SURFACE = ['PAVED', 'GRAVEL', 'JEEP', 'WALK', 'BOAT'] as const;

export type LastMileSurface = (typeof LAST_MILE_SURFACE)[number];

export const SOURCE_GRADE = ['A', 'B', 'C', 'D'] as const;

export type SourceGrade = (typeof SOURCE_GRADE)[number];

export const TOWN_SERVICE = [

  'FUEL', 'FUEL_24H', 'HOSPITAL', 'PHARMACY', 'ATM', 'BUS', 'EV', 'MECHANIC',

] as const;

export type TownService = (typeof TOWN_SERVICE)[number];

export const ROAD_IN = ['PAVED', 'GHAT', 'GRAVEL'] as const;

export type RoadIn = (typeof ROAD_IN)[number];

export const SEASONAL_RISK = ['NONE', 'MONSOON', 'LANDSLIDE'] as const;

export type SeasonalRisk = (typeof SEASONAL_RISK)[number];

export const LANGUAGES = ['en', 'ta'] as const;

export type Language = (typeof LANGUAGES)[number];

/** UI metadata lives here so a facet cannot drift between DB and screen. */

export const FACET_META: Record<Facet, { en: string; ta: string; token: string }> = {

  NATURE:       { en: 'Nature',       ta: 'இயற்கை',       token: '--facet-nature' },

  WATER:        { en: 'Water',        ta: 'நீர்நிலை',      token: '--facet-water' },

  SACRED:       { en: 'Sacred',       ta: 'தெய்வீகம்',     token: '--facet-sacred' },

  HERITAGE:     { en: 'Heritage',     ta: 'பாரம்பரியம்',   token: '--facet-heritage' },

  INDUSTRIAL:   { en: 'Industrial',   ta: 'தொழில்துறை',    token: '--facet-industrial' },

  URBAN:        { en: 'Urban',        ta: 'நகர்ப்புறம்',   token: '--facet-urban' },

  DARK_HISTORY: { en: 'Dark History', ta: 'இருண்ட வரலாறு', token: '--facet-dark' },

};

export const ACCESS_META: Record<AccessStatus, { en: string; ta: string; token: string }> = {

  OPEN:       { en: 'Open',        ta: 'திறந்துள்ளது',    token: '--status-open' },

  SEASONAL:   { en: 'Seasonal',    ta: 'பருவகாலம்',       token: '--status-seasonal' },

  PERMIT:     { en: 'Permit',      ta: 'அனுமதி தேவை',     token: '--status-permit' },

  RESTRICTED: { en: 'Restricted',  ta: 'கட்டுப்படுத்தப்பட்டது', token: '--status-restricted' },

  CLOSED:     { en: 'Closed',      ta: 'மூடப்பட்டுள்ளது', token: '--status-closed' },

};

/** UI-only state for drafts/previews. Public places always have a real status. */

export type AccessBadgeState = AccessStatus | 'UNKNOWN';

/** Banned strings — the old taxonomy. CI greps for these. */

export const BANNED_UI_STRINGS = [

  'Mystery', 'Hidden Gems', 'Trending', 'Adventure',

] as const;

```

### 7.2 Core DTOs

The public DTO is deliberately smaller than the database row. It has **no `location` field**. If a component needs a coordinate, it gets `accessPoint`.

```ts

// lib/types.ts

import type {

  AccessStatus, Confidence, CulturalStatus, Facet, Language,

  LastMileSurface, SafetyClass, SourceGrade, TownService,

} from './taxonomy';

export type Localized = { en: string; ta: string };

export type GeoPoint = { lon: number; lat: number };

export type PlaceCard = {

  slug: string;

  name: Localized;

  summary: Localized;

  facets: Facet[];

  accessStatus: AccessStatus;

  accessPoint: GeoPoint;

  lastVerifiedAt: string;        // ISO date

  thumbnailUrl: string | null;

  /** Present only when a base town is selected or a matrix row exists. */

  roadKm?: number;

  driveMinutes?: number;

  distanceKind: 'ROAD' | 'CROW' | 'UNKNOWN';

};

export type SourceDto = {

  id: string;

  grade: SourceGrade;

  kind: string;

  title: string;

  url: string | null;

  retrievedAt: string;

  notes: string | null;

};

export type ClaimDto = {

  id: string;

  section: 'documented' | 'lore' | 'practical' | 'access';

  statement: Localized;

  sourceId: string | null;

  isFolklore: boolean;

};

export type ImageDto = {

  url: string;

  width: number | null;

  height: number | null;

  license: string;

  attribution: string;

  sourceUrl: string | null;

};

export type BaseTownDto = {

  slug: string;

  name: Localized;

  character: Localized;

  roadKm: number;

  driveMinutes: number;

  services: TownService[];

  isGateway: boolean;

};

export type Dossier = {

  slug: string;

  name: Localized;

  summary: Localized;

  story: Localized;

  body: {

    documented: Localized | null;

    lore: Localized | null;

    gettingThere: Localized | null;

    practical: Localized | null;

  };

  facets: Facet[];

  accessStatus: AccessStatus;

  accessPoint: GeoPoint;

  accessPointLabel: Localized | null;

  safetyClass: SafetyClass;

  culturalStatus: CulturalStatus;

  confidence: Confidence;

  lastVerifiedAt: string;

  verifiedBy: string;

  sources: SourceDto[];

  claims: ClaimDto[];

  images: ImageDto[];

  baseTowns: BaseTownDto[];

  lastMile: {

    surface: LastMileSurface;

    km: number;

    minutes: number;

    note: Localized | null;

  };

  accessWindow: {

    opens: string | null;

    closes: string | null;

    closedDays: string | null;

    permitRequired: boolean;

    permitNote: Localized | null;

    nightDrivingBanned: boolean;

    seasonStartMonth: number | null;

    seasonEndMonth: number | null;

  };

  carryingCapacityNote: Localized | null;

  /** Null for non-secular places; never rendered for them. */

  narrativeScore: number | null;

};

```

### 7.3 Type-level coordinate safety

Do not define a `location` field on `PlaceCard`, `Dossier`, `BaseTownDto`, `TripPackPlace`, or any API response. If an internal type needs it, keep it in `db/schema` and never map it into a public DTO.

```ts

// db/types.ts — internal only

export type PlaceRow = typeof place.$inferSelect;

export type PlaceWithRelations = PlaceRow & {

  sources: SourceRow[];

  claims: ClaimRow[];

  images: ImageRow[];

};

// lib/types.ts — public

// No `location`. Only `accessPoint`.

```

A contract test serializes every public DTO and asserts that the JSON does not contain `"location"` or a site-coordinate key.

### 7.4 Database schema

The full schema is in `master.md` Appendix A. This plan keeps it and adds only what is required to enforce safety, search, idempotency, and privacy.

#### Table inventory

| Table | Purpose | Key fields |

|---|---|---|

| `place` | Dossier root | `slug`, bilingual fields, `location` (internal), `access_point`, facets, access, safety, cultural, last mile, confidence, scores, authorship, verification |

| `source` | Evidence | `place_id`, `grade` A–D, `kind`, `title`, `url`, `retrieved_at` |

| `claim` | Atomic fact or lore | `place_id`, `section`, bilingual statement, `source_id`, `is_folklore` |

| `image` | Licensed image | `place_id`, `url`, dimensions, `license`, `attribution` |

| `correction` | Reader report | `place_id`, `field`, `message`, `channel`, `status` |

| `verification_event` | Verification audit | `place_id`, `verified_at`, `verified_by`, `outcome` |

| `town` | Base town | `slug`, bilingual name, `location`, population, elevation, stays, services, road, risk, gateway |

| `place_town` | Precomputed matrix | `place_id`, `town_id`, `road_km`, `drive_minutes`, `engine`, `computed_at` |

| `device` | Anonymous device | `device_uuid`, `home_geohash5`, timestamps |

| `telegram_conn` | Bot binding | `device_id`, `chat_id`, active/blocked, timestamps |

| `link_token` | Link handshake | `device_id`, `token_hash`, `code`, `expires_at`, `used_at`, attempts |

| `preference` | Notification settings | radius, facets, language, quiet hours, tz, enabled, digest, pause |

| `location_session` | Live session metadata | source, started/last/expires, status; **no lat/lon** |

| `notification` | Sent/queued messages | device, place, kind, distance band, score terms, Telegram message, delivery, feedback |

| `trip` | Declared trip | device, origin/destination town, corridor, dates |

| `trip_stop` | Trip stops | trip, place, order, notified |

| `signal_daily` | Future signals | place, date, source, value |

| `discovery_event` | Future ledger | place, awareness date, evidence, verification, publication |

| `candidate` | Future Scout | name variants, centroid, precision, novelty, emergence, status |

| `candidate_signal` | Future Scout evidence | candidate, source, URL, captured, raw text |

#### Schema additions to `master.md`

These do not change product rules. They make existing rules enforceable and the system operable.

| Addition | Why |

|---|---|

| `place.publish_site_coordinates boolean not null default true` | The master’s `publishable()` references `publishes_site_coordinates`; the column must exist. Set `false` for every `RESTRICTED` place. |

| `place.tamil_reviewed_by text` | Tamil must be reviewed by a native speaker. `reviewed_by` alone does not prove it. |

| `town.carrying_capacity_note_en/ta` | `base-towns.md` requires a carrying-capacity note for towns adjacent to active sacred sites. |

| `place.search` indexes | FTS on English/Tamil names and summaries; trigram on names. |

| `telegram_update` | Idempotency for webhook retries. Stores no message payload and no coordinates. |

| `route_cache` | 30-minute cache for the one winner route at send time. Keyed by geohash7 + place. |

| `rate_limit` | Fixed-window rate limiting for corrections, link creation, and suggestions without Redis. |

| `job_run` | Audit for matrix, pack, purge, and webhook sweeper runs. |

| `notification.batch_id` | Groups the rows of one digest so the daily budget counts messages, not places. |

| `preference.last_digest_at`, `last_digest_geohash5` | Digest trigger: new geohash5 cell after ≥30 minutes. |

| `link_token.attempts` | Limit code-confirmation attempts. |

| `place.updated_at` trigger | Keep `updated_at` correct without app discipline. |

#### `place` — key columns and types

```ts

// db/schema/place.ts

import {

  boolean, check, date, index, integer, jsonb, numeric, pgTable,

  text, time, timestamp, uuid,

} from 'drizzle-orm/pg-core';

import { sql } from 'drizzle-orm';

import type {

  AccessStatus, Confidence, CulturalStatus, Facet, LastMileSurface, SafetyClass,

} from '@/lib/taxonomy';

import { geographyPoint, point } from './geo';

export type PlaceBody = {

  story?: string;

  documented?: string;

  lore?: string | null;

  gettingThere?: string | null;

  practical?: string | null;

};

export const place = pgTable('place', {

  id: uuid('id').primaryKey().defaultRandom(),

  slug: text('slug').notNull().unique(),

  nameEn: text('name_en').notNull(),

  nameTa: text('name_ta').notNull(),

  nameVariants: text('name_variants').array().notNull().default(sql`'{}'::text[]`),

  summaryEn: text('summary_en').notNull(),

  summaryTa: text('summary_ta').notNull(),

  bodyEn: jsonb('body_en').$type<PlaceBody>().notNull(),

  bodyTa: jsonb('body_ta').$type<PlaceBody>().notNull(),

  /** Internal only. Never selected into a public DTO. */

  location: geographyPoint('location').notNull(),

  /** Public meeting/parking point. This is the map pin. */

  accessPoint: geographyPoint('access_point').notNull(),

  accessPointLabelEn: text('access_point_label_en'),

  accessPointLabelTa: text('access_point_label_ta'),

  facets: text('facets').array().$type<Facet[]>().notNull(),

  accessStatus: text('access_status').$type<AccessStatus>().notNull(),

  seasonStartMonth: integer('season_start_month'),

  seasonEndMonth: integer('season_end_month'),

  accessOpens: time('access_opens'),

  accessCloses: time('access_closes'),

  closedDays: text('closed_days'),

  permitRequired: boolean('permit_required').notNull().default(false),

  permitNoteEn: text('permit_note_en'),

  permitNoteTa: text('permit_note_ta'),

  nightDrivingBanned: boolean('night_driving_banned').notNull().default(false),

  safetyClass: text('safety_class').$type<SafetyClass>().notNull(),

  culturalStatus: text('cultural_status').$type<CulturalStatus>().notNull().default('SECULAR'),

  carryingCapacityNoteEn: text('carrying_capacity_note_en'),

  carryingCapacityNoteTa: text('carrying_capacity_note_ta'),

  lastMileSurface: text('last_mile_surface').$type<LastMileSurface>(),

  lastMileKm: numeric('last_mile_km', { precision: 5, scale: 1 }),

  lastMileMinutes: integer('last_mile_minutes'),

  lastMileNoteEn: text('last_mile_note_en'),

  lastMileNoteTa: text('last_mile_note_ta'),

  confidence: text('confidence').$type<Confidence>().notNull().default('UNVERIFIED'),

  obscurityScore: numeric('obscurity_score', { precision: 4, scale: 3 }),

  narrativeScore: numeric('narrative_score', { precision: 4, scale: 3 }),

  risingScore: numeric('rising_score', { precision: 4, scale: 3 }),

  publishSiteCoordinates: boolean('publish_site_coordinates').notNull().default(true),

  authoredBy: text('authored_by').notNull(),

  reviewedBy: text('reviewed_by'),

  tamilReviewedBy: text('tamil_reviewed_by'),

  lastVerifiedAt: date('last_verified_at'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),

  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),

}, (t) => [

  index('place_location_gix').using('gist', t.location),

  index('place_access_gix').using('gist', t.accessPoint),

  index('place_facets_idx').using('gin', t.facets),

  check('place_access_status_ck', sql`${t.accessStatus} IN ('OPEN','SEASONAL','PERMIT','RESTRICTED','CLOSED')`),

  check('place_safety_ck', sql`${t.safetyClass} IN ('LOW','MODERATE','HAZARDOUS','PROHIBITED')`),

  check('place_cultural_ck', sql`${t.culturalStatus} IN ('SECULAR','RELIGIOUS_ACTIVE','SACRED','SENSITIVE')`),

  check('place_confidence_ck', sql`${t.confidence} IN ('SOURCED','PARTIAL','UNVERIFIED')`),

  check('place_season_ck', sql`(${t.seasonStartMonth} IS NULL AND ${t.seasonEndMonth} IS NULL) OR (${t.seasonStartMonth} BETWEEN 1 AND 12 AND ${t.seasonEndMonth} BETWEEN 1 AND 12)`),

]);

export const pointOf = (lon: number, lat: number) => point(lon, lat);

```

#### PostGIS and Drizzle

Drizzle 0.45 has native `geometry(Point,4326)` but no `geography` column. The schema uses a small custom type:

```ts

// db/schema/geo.ts

import { customType } from 'drizzle-orm/pg-core';

/**

 * `data` is an EWKT string: "SRID=4326;POINT(76.7 10.95)".

 * Reads of the raw column are avoided; queries select ST_X/ST_Y.

 */

export const geographyPoint = customType<{

  data: string;

  driverData: string;

}>({

  dataType() {

    return 'geography(Point,4326)';

  },

  toDriver(value) {

    return value;

  },

});

export const point = (lon: number, lat: number) =>

  `SRID=4326;POINT(${lon} ${lat})`;

```

**Stage 0 spike (timebox: 2 hours).** Prove that:

1. `drizzle-kit generate` emits `geography(Point,4326)`.

2. A Drizzle insert with `point(76.7, 10.95)` round-trips.

3. `ST_X(access_point::geometry)` and `ST_Y(access_point::geometry)` return numbers.

4. `ST_DWithin(access_point, ST_SetSRID(ST_MakePoint($1,$2),4326)::geography, $3)` uses the GiST index (`EXPLAIN`).

If any step fails, fall back to native `geometry(Point,4326)` plus explicit `::geography` casts and a GiST index on the geometry column. The public contract and tests do not change.

All spatial SQL uses **metres**:

```sql

ST_DWithin(

  p.access_point,

  ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,

  $3

)

```

Never compare raw geometry distances in degrees.

#### `town` and `place_town`

```ts

// db/schema/town.ts

export const town = pgTable('town', {

  id: uuid('id').primaryKey().defaultRandom(),

  slug: text('slug').notNull().unique(),

  nameEn: text('name_en').notNull(),

  nameTa: text('name_ta').notNull(),

  location: geographyPoint('location').notNull(),

  population: integer('population'),

  elevationM: integer('elevation_m'),

  stayCount: integer('stay_count').notNull().default(0),

  characterEn: text('character_en'),

  characterTa: text('character_ta'),

  services: text('services').array().$type<TownService[]>().notNull().default(sql`'{}'::text[]`),

  roadIn: text('road_in').$type<RoadIn>(),

  seasonalRisk: text('seasonal_risk').$type<SeasonalRisk>(),

  isGateway: boolean('is_gateway').notNull().default(false),

  carryingCapacityNoteEn: text('carrying_capacity_note_en'),

  carryingCapacityNoteTa: text('carrying_capacity_note_ta'),

  lastVerifiedAt: date('last_verified_at'),

});

export const placeTown = pgTable('place_town', {

  placeId: uuid('place_id').notNull().references(() => place.id, { onDelete: 'cascade' }),

  townId: uuid('town_id').notNull().references(() => town.id, { onDelete: 'cascade' }),

  roadKm: numeric('road_km', { precision: 6, scale: 1 }).notNull(),

  driveMinutes: integer('drive_minutes').notNull(),

  routeNoteEn: text('route_note_en'),

  routeNoteTa: text('route_note_ta'),

  engine: text('engine').notNull(),

  computedAt: timestamp('computed_at', { withTimezone: true }).notNull().defaultNow(),

}, (t) => [

  primaryKey({ columns: [t.placeId, t.townId] }),

  index('place_town_reach_idx').using('btree', t.townId, t.driveMinutes),

]);

```

#### Privacy and idempotency tables

```ts

// db/schema/telegram.ts

export const telegramUpdate = pgTable('telegram_update', {

  updateId: bigint('update_id', { mode: 'bigint' }).primaryKey(),

  receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),

  processedAt: timestamp('processed_at', { withTimezone: true }),

  attempts: integer('attempts').notNull().default(0),

  lastError: text('last_error'),

  kind: text('kind'), // message | edited_message | callback_query

  /** No payload, no coordinates, no token, no message text. */

});

export const routeCache = pgTable('route_cache', {

  geohash7: text('geohash7').notNull(),

  placeId: uuid('place_id').notNull().references(() => place.id, { onDelete: 'cascade' }),

  roadKm: numeric('road_km', { precision: 6, scale: 1 }).notNull(),

  driveMinutes: integer('drive_minutes').notNull(),

  engine: text('engine').notNull(),

  computedAt: timestamp('computed_at', { withTimezone: true }).notNull().defaultNow(),

}, (t) => [primaryKey({ columns: [t.geohash7, t.placeId] })]);

```

`location_session` keeps its master shape: `source`, `started_at`, `last_location_at`, `expires_at`, `status`. It has **no lat/lon column**. A live location is evaluated in memory during processing and discarded.

#### `publishable_place` view — IDs only

The predicate view deliberately exposes **only `id`**. It cannot leak `location`, `publish_site_coordinates`, or any other internal column even if a future query selects `*` from it.

```sql

CREATE OR REPLACE VIEW publishable_place AS

SELECT p.id

FROM place p

WHERE

  (SELECT count(*) FROM source s

    WHERE s.place_id = p.id AND s.grade IN ('A','B')) >= 1

  AND (SELECT count(*) FROM source s WHERE s.place_id = p.id) >= 2

  AND p.confidence = 'SOURCED'

  AND NOT EXISTS (

    SELECT 1 FROM claim c

    WHERE c.place_id = p.id AND c.section <> 'lore' AND c.source_id IS NULL

  )

  AND p.name_en <> '' AND p.name_ta <> ''

  AND p.summary_en <> '' AND p.summary_ta <> ''

  AND p.body_en->>'documented' <> '' AND p.body_ta->>'documented' <> ''

  AND p.access_point IS NOT NULL

  AND p.access_status IS NOT NULL

  AND p.last_verified_at IS NOT NULL

  AND p.last_verified_at >= current_date - 180

  AND NOT (p.access_status = 'RESTRICTED' AND p.publish_site_coordinates)

  AND NOT (p.access_status = 'SEASONAL'

           AND (p.season_start_month IS NULL OR p.season_end_month IS NULL))

  AND NOT (p.cultural_status <> 'SECULAR' AND p.narrative_score IS NOT NULL)

  AND NOT EXISTS (

    SELECT 1 FROM image i

    WHERE i.place_id = p.id

      AND (i.license IS NULL OR i.license = '' OR i.attribution IS NULL OR i.attribution = '')

  )

  AND p.authored_by IS NOT NULL AND p.authored_by NOT LIKE 'ai%'

  AND p.reviewed_by IS NOT NULL;

```

The `>= current_date - 180` boundary matches the TypeScript contract (`daysSince(...) > 180` fails). At exactly 180 days a place is still publishable; at 181 it is not.

#### `public_place` view — coordinate safety by construction

```sql

CREATE OR REPLACE VIEW public_place AS

SELECT

  p.id, p.slug,

  p.name_en, p.name_ta, p.name_variants,

  p.summary_en, p.summary_ta,

  p.body_en, p.body_ta,

  p.access_point, p.access_point_label_en, p.access_point_label_ta,

  p.facets, p.access_status,

  p.season_start_month, p.season_end_month,

  p.access_opens, p.access_closes, p.closed_days,

  p.permit_required, p.permit_note_en, p.permit_note_ta,

  p.night_driving_banned,

  p.safety_class, p.cultural_status,

  p.carrying_capacity_note_en, p.carrying_capacity_note_ta,

  p.last_mile_surface, p.last_mile_km, p.last_mile_minutes,

  p.last_mile_note_en, p.last_mile_note_ta,

  p.confidence, p.obscurity_score, p.narrative_score, p.rising_score,

  p.authored_by, p.reviewed_by, p.tamil_reviewed_by,

  p.last_verified_at, p.created_at, p.updated_at

FROM place p

JOIN publishable_place pp ON pp.id = p.id;

```

**No `location` column. No `publish_site_coordinates` column.** Public queries use `public_place`, never `place`. This is the strongest coordinate-safety mechanism in the build.

#### `is_recommendable` function

```sql

CREATE OR REPLACE FUNCTION is_recommendable(

  p_id uuid,

  at timestamptz DEFAULT now(),

  tz text DEFAULT 'Asia/Kolkata'

) RETURNS boolean

LANGUAGE sql STABLE AS $$

  SELECT EXISTS (

    SELECT 1

    FROM public_place p

    WHERE p.id = p_id

      AND (

        p.access_status IN ('OPEN', 'PERMIT')

        OR (

          p.access_status = 'SEASONAL'

          AND (

            (p.season_start_month <= p.season_end_month

              AND EXTRACT(month FROM at AT TIME ZONE tz)::int

                  BETWEEN p.season_start_month AND p.season_end_month)

            OR

            (p.season_start_month > p.season_end_month

              AND (

                EXTRACT(month FROM at AT TIME ZONE tz)::int >= p.season_start_month

                OR EXTRACT(month FROM at AT TIME ZONE tz)::int <= p.season_end_month

              ))

          )

        )

      )

      AND p.safety_class IN ('LOW','MODERATE')

      AND p.cultural_status = 'SECULAR'

      AND NOT (

        (EXTRACT(hour FROM at AT TIME ZONE tz)::int >= 18

         OR EXTRACT(hour FROM at AT TIME ZONE tz)::int < 6)

        AND p.facets && ARRAY['WATER','DARK_HISTORY']::text[]

      )

      AND NOT (

        EXTRACT(month FROM at AT TIME ZONE tz)::int BETWEEN 6 AND 9

        AND p.facets && ARRAY['WATER']::text[]

      )

      AND NOT (

        (EXTRACT(hour FROM at AT TIME ZONE tz)::int >= 18

         OR EXTRACT(hour FROM at AT TIME ZONE tz)::int < 6)

        AND p.night_driving_banned

      )

  );

$$;

```

The SQL function and the TypeScript `recommendable()` must agree. The contract test seeds fixtures and compares both at fixed timestamps.

### 7.5 `publishable()` — the TypeScript contract

```ts

// lib/publishable.ts

import type { PlaceWithRelations } from '@/db/types';

import { daysSince } from './dates';

export type PublishCheck = { ok: true } | { ok: false; reasons: string[] };

export function publishable(p: PlaceWithRelations): PublishCheck {

  const r: string[] = [];

  // Provenance

  const ab = p.sources.filter((s) => s.grade === 'A' || s.grade === 'B').length;

  if (ab < 1) r.push('needs at least one A or B grade source');

  if (p.sources.length < 2) r.push('needs at least two sources');

  if (p.confidence !== 'SOURCED') r.push('confidence must be SOURCED');

  const undocumented = p.claims.filter((c) => c.section !== 'lore' && !c.sourceId);

  if (undocumented.length) r.push(`${undocumented.length} claim(s) missing a source`);

  // Bilingual

  if (!p.nameEn || !p.nameTa) r.push('bilingual name required');

  if (!p.summaryEn || !p.summaryTa) r.push('bilingual summary required');

  if (!p.bodyEn?.documented || !p.bodyTa?.documented) {

    r.push('documented section required in both languages');

  }

  // Geo / access

  if (!p.location) r.push('location required');

  if (!p.accessPoint) r.push('access point required');

  if (!p.accessStatus) r.push('access status required');

  if (!p.lastVerifiedAt) r.push('verification date required');

  if (p.lastVerifiedAt) {

    const ageDays = daysSince(p.lastVerifiedAt);

    if (ageDays > 180) r.push(`stale: verified ${ageDays} days ago`);

  }

  if (p.accessStatus === 'RESTRICTED' && p.publishSiteCoordinates) {

    r.push('restricted place must not publish site coordinates');

  }

  if (

    p.accessStatus === 'SEASONAL' &&

    (!p.seasonStartMonth || !p.seasonEndMonth)

  ) {

    r.push('seasonal place needs a season window');

  }

  // Cultural safety

  if (p.culturalStatus !== 'SECULAR' && p.narrativeScore !== null) {

    r.push('narrative score must be NULL for non-secular places');

  }

  // Images

  const badImages = p.images.filter((i) => !i.license || !i.attribution);

  if (badImages.length) r.push(`${badImages.length} image(s) missing licence or attribution`);

  // Authorship

  if (!p.authoredBy || p.authoredBy.startsWith('ai')) r.push('must be human-authored');

  if (!p.reviewedBy) r.push('must be reviewed by a human');

  return r.length ? { ok: false, reasons: r } : { ok: true };

}

```

`check:publishable` runs this over every place in the database and exits non-zero on any failure. The production database contains only publishable places; drafts stay in `content/` until they pass.

### 7.6 `recommendable()` — the TypeScript contract

```ts

// lib/recommendable.ts

import type { PlaceWithRelations } from '@/db/types';

import { publishable, type PublishCheck } from './publishable';

import { zonedParts } from './dates';

export const MONSOON_MONTHS = [6, 7, 8, 9] as const;

export const NIGHT_START_HOUR = 18;

export const NIGHT_END_HOUR = 6;

export type RecommendableInput = {

  place: PlaceWithRelations;

  at: Date;

  tz: string;

};

export function recommendable({

  place,

  at,

  tz,

}: RecommendableInput): PublishCheck {

  const pub = publishable(place);

  if (!pub.ok) return pub;

  const reasons: string[] = [];

  const { hour, month } = zonedParts(at, tz);

  const isNight = hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR;

  const isMonsoon = MONSOON_MONTHS.includes(month as 6 | 7 | 8 | 9);

  // Access

  if (place.accessStatus === 'CLOSED' || place.accessStatus === 'RESTRICTED') {

    reasons.push(`access status ${place.accessStatus} is never recommendable`);

  }

  if (place.accessStatus === 'SEASONAL') {

    const start = place.seasonStartMonth;

    const end = place.seasonEndMonth;

    const inSeason =

      start != null && end != null &&

      (start <= end

        ? month >= start && month <= end

        : month >= start || month <= end);

    if (!inSeason) reasons.push('outside the published season window');

  }

  // Safety

  if (place.safetyClass === 'HAZARDOUS' || place.safetyClass === 'PROHIBITED') {

    reasons.push(`safety class ${place.safetyClass} is never recommendable`);

  }

  // Cultural: the spec is stricter than "sacred/sensitive".

  // Only SECULAR places enter a push. Dossiers may still publish others.

  if (place.culturalStatus !== 'SECULAR') {

    reasons.push(`cultural status ${place.culturalStatus} is not recommendable`);

  }

  if (isNight && place.facets.some((f) => f === 'WATER' || f === 'DARK_HISTORY')) {

    reasons.push('night-time water/dark-history candidate');

  }

  if (isMonsoon && place.facets.includes('WATER')) {

    reasons.push('monsoon water candidate');

  }

  if (isNight && place.nightDrivingBanned) {

    reasons.push('night driving banned on the access road');

  }

  return reasons.length ? { ok: false, reasons } : { ok: true };

}

```

### 7.7 Contract parity tests

| Test | Setup | Assertion |

|---|---|---|

| Publishable parity | Insert valid, no-source, stale, restricted-with-coordinates, seasonal-without-window, sacred-with-narrative, bad-image, unreviewed fixtures | `publishable(fixture).ok === (SELECT EXISTS (SELECT 1 FROM publishable_place WHERE id = fixture.id))` |

| Recommendable parity | Insert open, seasonal-in, seasonal-out, hazardous, sacred, active-religious, night-water, monsoon-water, night-driving fixtures | `recommendable(fixture, at, tz).ok === is_recommendable(fixture.id, at, tz)` at fixed timestamps |

| Coordinate safety | Fetch every public DTO and every Trip Pack JSON | Serialized JSON contains no `"location"` key and no site coordinate |

| Restricted place | Insert restricted fixture with `publish_site_coordinates=false` | `public_place` has no `location`; dossier returns access point only |

| Draft visibility | Insert unpublishable fixture | No public query returns it; `check:publishable` fails |

These tests are the reason the contract is real. Without parity tests, the SQL view and the TypeScript function drift.

---

## 8. Data access and queries

### 8.1 Database client

Use `postgres` with the pooled Neon connection string. `prepare: false` is required for PgBouncer transaction pooling. The client is cached in development to avoid a new pool on every hot reload.

```ts

// db/client.ts

import { drizzle } from 'drizzle-orm/postgres-js';

import postgres from 'postgres';

import { env } from '@/lib/env';

import * as schema from './schema';

const globalForDb = globalThis as unknown as {

  sql?: ReturnType<typeof postgres>;

};

const sql =

  globalForDb.sql ??

  postgres(env.DATABASE_URL, {

    prepare: false,

    max: 5,

    idle_timeout: 20,

    connect_timeout: 10,

    // Local Docker PostGIS has no TLS; Neon requires it.

    ssl: env.DATABASE_URL.includes('localhost') ? false : 'require',

  });

if (process.env.NODE_ENV !== 'production') globalForDb.sql = sql;

export const db = drizzle(sql, { schema });

export type Db = typeof db;

```

Migrations and batch jobs use `DATABASE_URL_UNPOOLED` through a separate client in `scripts/db.ts`. Never run a long transaction through the pooled connection.

### 8.2 Query module rules

1. Every public query reads `public_place`, never `place`.

2. Every query returns a DTO, not a raw row. Numeric strings become numbers; `bigint` becomes a string at the boundary; dates become ISO strings.

3. Every query has a `LIMIT`.

4. No query is built by string concatenation. Use Drizzle `sql` parameters.

5. Spatial predicates use `::geography` and metres.

6. `cache()` wraps read-only functions used more than once in one request.

### 8.3 Map home query

At 12–200 places, load all publishable places in the region. Do not add a bbox endpoint until the corpus exceeds ~500 places.

```ts

// db/queries/places.ts

import { cache } from 'react';

import { and, asc, eq, sql } from 'drizzle-orm';

import { db } from '@/db/client';

import { publicPlace } from '@/db/schema/views';

import type { PlaceCard } from '@/lib/types';

export const getPlaceCards = cache(async (): Promise<PlaceCard[]> => {

  const rows = await db

    .select({

      slug: publicPlace.slug,

      nameEn: publicPlace.nameEn,

      nameTa: publicPlace.nameTa,

      summaryEn: publicPlace.summaryEn,

      summaryTa: publicPlace.summaryTa,

      facets: publicPlace.facets,

      accessStatus: publicPlace.accessStatus,

      lon: sql<number>`ST_X(${publicPlace.accessPoint}::geometry)`,

      lat: sql<number>`ST_Y(${publicPlace.accessPoint}::geometry)`,

      lastVerifiedAt: publicPlace.lastVerifiedAt,

    })

    .from(publicPlace)

    .orderBy(asc(publicPlace.nameEn))

    .limit(500);

  return rows.map((r) => ({

    slug: r.slug,

    name: { en: r.nameEn, ta: r.nameTa },

    summary: { en: r.summaryEn, ta: r.summaryTa },

    facets: r.facets,

    accessStatus: r.accessStatus,

    accessPoint: { lon: Number(r.lon), lat: Number(r.lat) },

    lastVerifiedAt: r.lastVerifiedAt,

    thumbnailUrl: null,

    distanceKind: 'UNKNOWN',

  }));

});

```

`publicPlace` is the Drizzle view declaration. If Drizzle’s view inference is awkward for the aggregate views, declare the view in raw SQL and define a matching `pgView` with explicit columns, or use a typed `sql` query. The public DTO test is the source of truth.

### 8.4 Nearby query

Use this for a one-shot “near me” search or a map recenter. It filters by crow-flies and returns the distance kind as `CROW`; the UI must label it as straight-line and must not present it as a drive time.

```sql

SELECT

  p.slug, p.name_en, p.name_ta, p.summary_en, p.summary_ta,

  p.facets, p.access_status, p.last_verified_at,

  ST_X(p.access_point::geometry) AS lon,

  ST_Y(p.access_point::geometry) AS lat,

  ROUND(ST_Distance(

    p.access_point,

    ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography

  )::numeric) AS crow_m

FROM public_place p

WHERE ST_DWithin(

  p.access_point,

  ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,

  $3

)

ORDER BY crow_m

LIMIT 50;

```

### 8.5 Dossier query

Four explicit selects batched with `Promise.all`. Avoid N+1.

`public_place` is a SQL view, so Drizzle's relational query API (`db.query.publicPlace.findFirst({ with: ... })`) does **not** apply: relations are declared on tables, not views. Select explicit columns instead. This also guarantees that `town.location` never enters the dossier payload.

```ts

// db/queries/dossier.ts

import { and, asc, eq, gte, inArray, sql } from 'drizzle-orm';

import { db } from '@/db/client';

import { claim, image, placeTown, source, town } from '@/db/schema';

import { publicPlace } from '@/db/schema/views';

import type { Dossier } from '@/lib/types';

import type { Language } from '@/lib/taxonomy';

import { mapDossier } from './map-dossier';

export async function getDossier(slug: string, lang: Language): Promise<Dossier | null> {

  const [placeRow] = await db

    .select({

      id: publicPlace.id,

      slug: publicPlace.slug,

      nameEn: publicPlace.nameEn,

      nameTa: publicPlace.nameTa,

      summaryEn: publicPlace.summaryEn,

      summaryTa: publicPlace.summaryTa,

      bodyEn: publicPlace.bodyEn,

      bodyTa: publicPlace.bodyTa,

      facets: publicPlace.facets,

      accessStatus: publicPlace.accessStatus,

      accessPointLon: sql<number>`ST_X(${publicPlace.accessPoint}::geometry)`,

      accessPointLat: sql<number>`ST_Y(${publicPlace.accessPoint}::geometry)`,

      accessPointLabelEn: publicPlace.accessPointLabelEn,

      accessPointLabelTa: publicPlace.accessPointLabelTa,

      safetyClass: publicPlace.safetyClass,

      culturalStatus: publicPlace.culturalStatus,

      confidence: publicPlace.confidence,

      lastVerifiedAt: publicPlace.lastVerifiedAt,

      reviewedBy: publicPlace.reviewedBy,

      lastMileSurface: publicPlace.lastMileSurface,

      lastMileKm: publicPlace.lastMileKm,

      lastMileMinutes: publicPlace.lastMileMinutes,

      lastMileNoteEn: publicPlace.lastMileNoteEn,

      lastMileNoteTa: publicPlace.lastMileNoteTa,

      accessOpens: publicPlace.accessOpens,

      accessCloses: publicPlace.accessCloses,

      closedDays: publicPlace.closedDays,

      permitRequired: publicPlace.permitRequired,

      permitNoteEn: publicPlace.permitNoteEn,

      permitNoteTa: publicPlace.permitNoteTa,

      nightDrivingBanned: publicPlace.nightDrivingBanned,

      seasonStartMonth: publicPlace.seasonStartMonth,

      seasonEndMonth: publicPlace.seasonEndMonth,

      carryingCapacityNoteEn: publicPlace.carryingCapacityNoteEn,

      carryingCapacityNoteTa: publicPlace.carryingCapacityNoteTa,

      narrativeScore: publicPlace.narrativeScore,

    })

    .from(publicPlace)

    .where(eq(publicPlace.slug, slug))

    .limit(1);

  if (!placeRow) return null;

  const [sources, claims, images, baseTowns] = await Promise.all([

    db.select({

      id: source.id,

      grade: source.grade,

      kind: source.kind,

      title: source.title,

      url: source.url,

      retrievedAt: source.retrievedAt,

      notes: source.notes,

    }).from(source).where(eq(source.placeId, placeRow.id)).orderBy(asc(source.grade)),

    db.select({

      id: claim.id,

      section: claim.section,

      statementEn: claim.statementEn,

      statementTa: claim.statementTa,

      sourceId: claim.sourceId,

      isFolklore: claim.isFolklore,

    }).from(claim).where(eq(claim.placeId, placeRow.id)),

    db.select({

      url: image.url,

      width: image.width,

      height: image.height,

      license: image.license,

      attribution: image.attribution,

      sourceUrl: image.sourceUrl,

    }).from(image).where(eq(image.placeId, placeRow.id)),

    db.select({

      slug: town.slug,

      nameEn: town.nameEn,

      nameTa: town.nameTa,

      characterEn: town.characterEn,

      characterTa: town.characterTa,

      services: town.services,

      isGateway: town.isGateway,

      roadKm: placeTown.roadKm,

      driveMinutes: placeTown.driveMinutes,

    })

      .from(placeTown)

      .innerJoin(town, eq(town.id, placeTown.townId))

      .where(and(

        eq(placeTown.placeId, placeRow.id),

        gte(town.stayCount, 3),

        sql`${town.services} @> ARRAY['FUEL']::text[]`,

        inArray(town.roadIn, ['PAVED', 'GHAT']),

      ))

      .orderBy(asc(placeTown.driveMinutes))

      .limit(3),

  ]);

  return mapDossier({ place: placeRow, sources, claims, images, baseTowns }, lang);

}

```

`mapDossier` converts Postgres numerics to numbers, dates to ISO strings, and picks the requested language. It never reads `location`, because neither the view nor the town select exposes it.

**Base-town rule:** only towns that pass the published selection rule are eligible: `stay_count >= 3`, `services` contains `FUEL`, and `road_in IN ('PAVED','GHAT')`. Return at most three, ranked by `drive_minutes`. Never show hotels.

### 8.6 Reach query

```sql

WITH reachable AS (

  SELECT

    p.slug, p.name_en, p.name_ta, p.summary_en, p.summary_ta,

    p.facets, p.access_status, p.last_verified_at,

    pt.road_km, pt.drive_minutes,

    p.access_point

  FROM place_town pt

  JOIN public_place p ON p.id = pt.place_id

  WHERE pt.town_id = $1

    AND pt.drive_minutes <= $2

)

SELECT

  json_agg(json_build_object(

    'slug', slug,

    'nameEn', name_en,

    'nameTa', name_ta,

    'summaryEn', summary_en,

    'summaryTa', summary_ta,

    'facets', facets,

    'accessStatus', access_status,

    'lastVerifiedAt', last_verified_at,

    'roadKm', road_km,

    'driveMinutes', drive_minutes,

    'lon', ST_X(access_point::geometry),

    'lat', ST_Y(access_point::geometry)

  )) AS places,

  ST_AsGeoJSON(

    ST_ConvexHull(ST_Collect(access_point::geometry))

  ) AS hull

FROM reachable;

```

If fewer than three points, return `hull: null` and let the client hide the hull. Label the hull **“approximate reach”** and treat the numbers as authoritative.

### 8.7 Caching and revalidation

| Data | Strategy | Invalidation |

|---|---|---|

| Towns | `unstable_cache` 1h or route `revalidate = 3600` | Town verification script |

| Place cards | Route `revalidate = 300` | Time-based |

| Dossier | Route `revalidate = 3600`, tag `place:<slug>` | Verification/correction admin route |

| Reach | `s-maxage=300, stale-while-revalidate=600` | Time-based |

| Search suggestions | `s-maxage=60` | Time-based |

| Telegram link status | `no-store` | N/A |

| Trip Pack assets | `immutable` | Content-hash filenames |

| Trip Pack manifest | `no-cache` | New version on pack build |

Do not cache personalized responses. Device cookies and Telegram status responses are always `no-store`.

### 8.8 Query performance checks

Add integration tests that run `EXPLAIN (ANALYZE, BUFFERS)` for:

- `ST_DWithin` nearby query uses `place_access_gix`.

- `place_town` reach query uses `place_town_reach_idx`.

- Tamil trigram search uses `place_name_ta_trgm_idx` when the query is long enough.

- `public_place` does not cause a sequential scan of `source`, `claim`, or `image` at 200 places. If it does, switch `publishable_place` to a materialized view refreshed on verification, or add a `is_publishable` cached column. At 12 places this is not a blocker; the test prevents silent regression.

---

## 9. Routes, screens, and components

### 9.1 Screen inventory and routes

The authoritative screen inventory is `PROMPT-screen-flow.md` S1–S19. This plan preserves the routes.

| Screen | Route | Rendering | Primary data | Gate |

|---|---|---|---|---|

| S1 Map home | `/` | RSC shell + client map | `public_place`, `town`, top base towns | UI 1–2 |

| S2 Search entry | overlay on `/` | client | suggestions API | UI 4 |

| S3 Search results | `/?q=...` | RSC | search query + map | UI 4 |

| S4 Filter sheet | sheet on `/` | client | towns, facets, reach options | UI 2/4 |

| S5 Place preview card | bottom-sheet half | client | `PlaceCard` | UI 2 |

| S6 Dossier | `/place/[slug]` | RSC | `Dossier` | UI 3 |

| S7 No results / out of region | state of S3 | RSC | nearest 3 + message | UI 4 |

| S8 Correction | sheet on S6 | client + server action | correction API | UI 3 |

| S9 Location explainer | sheet on S1/S3 | client | one-shot geolocation | UI 2 |

| S10 Link Telegram — web | `/settings/telegram` | RSC + client | link API | UI 5 |

| S11 Telegram link confirmation | bot | server | webhook | UI 5 |

| S12 Telegram live-location instruction | bot | server | webhook | UI 5 |

| S13 Arrival digest | bot | server | recommendation | UI 5 |

| S14 Telegram feedback | bot | server | callback | UI 5 |

| S15 Alert settings | `/settings/alerts` | RSC + client | preferences | UI 5 |

| S16 Saved places | `/saved` | client | localStorage | UI 3 |

| S17 Trip declaration → pack | `/trip/[corridor]` | RSC + client | trip API, pack manifest | UI 6 |

| S18 Offline state | `/trip/[corridor]` | client | service worker cache | UI 6 |

| S19 Method | `/method` | static/RSC | editorial | UI 0/3 |

Additional non-screen routes:

| Route | Purpose |

|---|---|

| `/_design/tokens` | Gate 0 specimen; `noindex` |

| `/api/search/suggest` | Search suggestions |

| `/api/reach` | Reach cards + hull |

| `/api/corrections` | Correction submission |

| `/api/telegram/link` | Create link token/code |

| `/api/telegram/link/status` | Poll link status |

| `/api/telegram/webhook` | Bot webhook |

| `/api/trip/[corridor]/pack` | Pack manifest |

| `/api/cron/telegram` | Queue sweeper, session expiry |

| `/api/cron/purge` | 90-day retention |

| `/api/revalidate` | On-demand dossier tag revalidation |

| `/api/health` | DB health |

### 9.2 Layout

```tsx

// app/layout.tsx

import { Inter, Noto_Sans_Tamil } from 'next/font/google';

import 'maplibre-gl/dist/maplibre-gl.css';

import './tokens.css';

import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

const tamil = Noto_Sans_Tamil({

  subsets: ['tamil'],

  variable: '--font-noto-tamil',

  display: 'swap',

});

export default async function RootLayout({ children }: { children: React.ReactNode }) {

  const lang = await getLanguage();

  return (

    <html lang={lang} className={`${inter.variable} ${tamil.variable}`}>

      <body>

        <a className="skip-link" href="#main">Skip to content</a>

        <AnalyticsConsent />

        {children}

      </body>

    </html>

  );

}

```

The root layout reads the language cookie. The toggle writes the cookie and a `?lang=` parameter so a shared link preserves the language.

### 9.3 Language handling

- `Language = 'en' | 'ta'`.

- Resolution order: `?lang=` → cookie `wa_lang` → `DEFAULT_LANG`.

- The toggle preserves all other query parameters.

- `pick(lang, en, ta)` is the only helper that chooses a localized string.

- Tamil blocks get `lang="ta"` and class `ta`; English blocks get `lang="en"`.

- `generateMetadata` emits `alternates.languages` for `en` and `ta`.

- The map basemap labels default to English in Phase 1. Tamil map labels require a Tamil glyph fontstack; evaluate at Gate 1. Do not block the UI on Tamil basemap labels.

- Reading the language cookie makes the route dynamic. Cache **data** with `unstable_cache`, not the HTML, and treat the `revalidate` values in §8.7 as data-cache lifetimes. If Gate 1 requires statically rendered dossiers, move language into the path (`/en/place/...`, `/ta/place/...`) and use `generateStaticParams`; that is a post-Gate 1 change, not a launch blocker.

### 9.4 Component tree — home

```

app/page.tsx (RSC)

└─ HomeShell (client)

   ├─ TopBar

   │  ├─ Wordmark

   │  ├─ LanguageToggle

   │  └─ Menu (Method, Saved, Settings)

   ├─ SearchBar

   ├─ ControlRow

   │  ├─ BaseTownSelect   ← first control

   │  ├─ ReachSelect      ← 30 / 60 / 90 min

   │  └─ FacetChips

   ├─ MapCanvas

   │  ├─ Basemap

   │  ├─ PlacePins

   │  ├─ TownPins

   │  ├─ ReachHull

   │  └─ SelectedLines

   ├─ BottomSheet

   │  ├─ SheetHeader ("N places within X of Y")

   │  ├─ PlaceCarousel (half state)

   │  └─ PlaceList (expanded state)

   └─ LocationExplainer (only when the user asks for "near me")

```

### 9.5 Component tree — dossier

```

app/place/[slug]/page.tsx (RSC)

└─ DossierPage

   ├─ DossierHeader

   │  ├─ Tamil name / English name

   │  ├─ FacetChips

   │  ├─ AccessBadge

   │  └─ VerifiedBadge

   ├─ HeroImage (only if licence + attribution)

   ├─ StatRow (road km · drive minutes · last mile)

   ├─ StorySection

   ├─ DocumentedClaims (grade chips)

   ├─ LoreSection (visually distinct)

   ├─ GettingThere

   ├─ BaseTowns (max 3)

   ├─ Practical

   ├─ SensitivityNote (when cultural_status ≠ SECULAR)

   ├─ SourcesTable

   ├─ VerificationBlock

   └─ CorrectionSheet

```

### 9.6 State management

- No Redux, Zustand, or SWR.

- URL search params are the source of truth for `q`, `town`, `within`, `facets`, `lang`, `place`.

- A small `useHomeState` hook parses and writes search params with `useRouter`/`useSearchParams`.

- `useDeferredValue` for search input.

- `useTransition` for navigation and filter changes.

- Saved places are `localStorage` only; no database table.

- Selected place is shareable via `?place=slug`; the map flies to it and the sheet opens to half.

### 9.7 Error, loading, and empty states

| State | Behaviour |

|---|---|

| Map WebGL unavailable | Render the list view with a message; no blank canvas. |

| No places in the current filter | “No verified places match. Try a wider reach or another base town.” Show nearest 3 if available. |

| Search zero results | “No exact match — did you mean…” plus nearest 3 publishable places. Never a blank screen. |

| Dossier not found | 404 with links to the map and method page. |

| Dossier retired | 410 with an explanation and the nearest alternatives. |

| Offline | Cached dossier/pack badge; map tiles from cache; no broken images. |

| API error | Retry affordance; preserve the last good state. |

| Location denied | Manual base-town fallback; no broken map. |

### 9.8 Accessibility

- Minimum 44×44 px tap targets.

- Status is never colour-only; the badge text says OPEN/SEASONAL/PERMIT/RESTRICTED/CLOSED.

- Map has an accessible list alternative; pins are not the only way to select a place.

- Bottom sheet is keyboard operable; Escape collapses; focus returns to the trigger.

- `aria-live="polite"` for search result counts and filter changes.

- Tamil line-height 1.75; English body 1.65; max measure 68ch.

- `prefers-reduced-motion` disables map fly animations.

- Skip link to `#main`.

- Run axe-core on home, dossier, search, and settings.

### 9.9 Analytics events

| Event | When | Properties |

|---|---|---|

| `map_view` | Home map interactive | `lang`, `places_count` |

| `base_town_change` | Base town selected | `town_slug`, `within_minutes` |

| `place_card_open` | Card tapped | `slug`, `position` |

| `dossier_view` | Dossier loaded | `slug`, `lang`, `access_status` |

| `dossier_practical_view` | Practical section in viewport | `slug` |

| `directions_click` | “Open in maps” | `slug` |

| `save` | Save toggled | `slug`, `saved` |

| `share` | Share/copy link | `slug`, `method` |

| `search` | Search submitted | `query_length`, `lang`, `zero_results` |

| `search_zero` | Zero results | `query_length` |

| `telegram_link_start` | Code shown | none |

| `telegram_link_complete` | Linked | none |

| `digest_open` | Deep link opened | `batch_id` (no coordinates) |

| `feedback_useful` | 👍 | `batch_id` |

| `correction_submit` | Correction sent | `field` |

| `pack_download` | Pack downloaded | `corridor`, `bytes` |

| `pack_offline_open` | Offline dossier opened | `slug` |

No event contains a coordinate, a chat ID, a token, or a free-text correction message.

---

## 10. UI system and map shell

### 10.1 Tokens

`app/tokens.css` is copied from `master.md` §6.2 without reinterpretation. `app/globals.css` imports Tailwind and maps semantic names:

```css

@import "tailwindcss";

@import "./tokens.css";

@theme inline {

  --color-page: var(--surface-page);

  --color-raised: var(--surface-raised);

  --color-sunken: var(--surface-sunken);

  --color-ink: var(--ink-primary);

  --color-ink-secondary: var(--ink-secondary);

  --color-brand: var(--brand-700);

  --color-status-open: var(--status-open);

  --color-status-seasonal: var(--status-seasonal);

  --color-status-permit: var(--status-permit);

  --color-status-restricted: var(--status-restricted);

  --color-status-closed: var(--status-closed);

  --color-status-unknown: var(--status-unknown);

  --font-sans: var(--font-inter), var(--font-ui);

  --font-tamil: var(--font-noto-tamil), var(--font-tamil);

}

.ta {

  font-family: var(--font-tamil);

  line-height: 1.75;

}

```

Rules:

1. Status colours are semantic only.

2. `--status-unknown` is always visible when a value is missing. In public data this should not happen, but previews and stale responses must not hide it.

3. No gradients, glassmorphism, or dark mode in Phase 1.

4. Tamil and English share the same type scale; Tamil gets extra line-height.

5. `/_design/tokens` renders swatches, type specimens, badges, chips, buttons, and spacing. It is the Gate 0 approval artefact.

### 10.2 Base components

| Component | Responsibility |

|---|---|

| `Button` | Primary/secondary/ghost; 44px min; loading state |

| `Badge` | Access, verified, confidence, grade |

| `FacetChip` | Icon + bilingual label; active state |

| `Stat` | Big number, small uppercase label, `UNKNOWN` fallback |

| `SourceRow` | Grade chip, title, kind, retrieved date, external link |

| `Sheet` | Three-snap bottom sheet; keyboard and pointer support |

| `Select` | Native select on mobile for reliability |

| `EmptyState` | Message + nearest alternatives |

| `LanguageToggle` | EN / த; preserves params |

| `CopyButton` | Code and share link |

### 10.3 Map initialisation

MapLibre is client-only. Lazy-load the map chunk so the dossier and method pages do not pay for it.

```tsx

// components/map/MapCanvas.tsx

'use client';

import { useEffect, useRef } from 'react';

import type { Map as MapLibreMap } from 'maplibre-gl';

export function MapCanvas({ places, towns, lang }: MapCanvasProps) {

  const container = useRef<HTMLDivElement>(null);

  const mapRef = useRef<MapLibreMap | null>(null);

  useEffect(() => {

    let cancelled = false;

    (async () => {

      const [{ default: maplibregl }, { Protocol }, { layers, namedFlavor }] =

        await Promise.all([

          import('maplibre-gl'),

          import('pmtiles'),

          import('@protomaps/basemaps'),

        ]);

      if (cancelled || !container.current) return;

      const protocol = new Protocol();

      maplibregl.addProtocol('pmtiles', protocol.tile);

      const assetsBase =

        process.env.NEXT_PUBLIC_MAP_ASSETS_URL ??

        'https://protomaps.github.io/basemaps-assets';

      const style = {

        version: 8 as const,

        glyphs: `${assetsBase}/fonts/{fontstack}/{range}.pbf`,

        sprite: `${assetsBase}/sprites/v4/light`,

        sources: {

          protomaps: {

            type: 'vector' as const,

            url: `pmtiles://${process.env.NEXT_PUBLIC_PMTILES_URL}`,

            attribution:

              '<a href="https://protomaps.com">Protomaps</a> © <a href="https://openstreetmap.org">OpenStreetMap</a>',

          },

        },

        layers: layers('protomaps', namedFlavor('light'), { lang: 'en' }),

      };

      const map = new maplibregl.Map({

        container: container.current,

        style,

        center: [76.9558, 11.0168],

        zoom: 8.6,

        maxZoom: 14,

        minZoom: 7,

        attributionControl: { compact: true },

      });

      mapRef.current = map;

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

      map.on('load', () => {

        map.addSource('places', { type: 'geojson', data: placesToGeoJSON(places) });

        map.addSource('towns', { type: 'geojson', data: townsToGeoJSON(towns) });

        map.addLayer({

          id: 'place-pins',

          type: 'circle',

          source: 'places',

          paint: {

            'circle-radius': 9,

            'circle-color': [

              'match', ['get', 'accessStatus'],

              'OPEN', '#1E7A4C',

              'SEASONAL', '#A06A0B',

              'PERMIT', '#23558C',

              'RESTRICTED', '#8C3A23',

              'CLOSED', '#6B6B6B',

              '#8E918B',

            ],

            'circle-stroke-width': 2,

            'circle-stroke-color': '#FCFCFA',

          },

        });

        map.addLayer({

          id: 'town-pins',

          type: 'symbol',

          source: 'towns',

          layout: {

            'icon-image': 'town-square',

            'icon-size': 0.9,

            'text-field': ['get', 'name'],

            'text-size': 12,

            'text-offset': [0, 1.4],

            'text-anchor': 'top',

          },

          paint: { 'text-color': '#5C5F5A', 'text-halo-color': '#FCFCFA', 'text-halo-width': 1 },

        });

      });

      return () => map.remove();

    })();

    return () => {

      cancelled = true;

      mapRef.current?.remove();

      mapRef.current = null;

    };

  }, [places, towns, lang]);

  return <div ref={container} className="h-full w-full" aria-label="Map of verified places" />;

}

```

Implementation notes:

- `addProtocol('pmtiles')` is global. Add it once at module scope or use a ref-counted helper. Do not remove it while another map is alive.

- The `town-square` icon must be generated as an SDF image or supplied as a sprite. Place pins are circles; town pins are squares. Shape encodes type; colour encodes status.

- Pins use `accessPoint`, never `location`.

- Selected place: add a `LineString` source to the top three base towns and a `symbol` layer with `drive_minutes` labels.

- Selected town: filter places to `driveMinutes <= within`, dim the rest, and add the reach hull with a low-opacity fill. Label it “approximate reach.”

- Geocontrol is one-shot. Do not use `trackUserLocation: true`; the PWA does not do background tracking.

- At 200+ places, add clustering. Do not add it at 12.

### 10.4 PMTiles hosting and extraction

1. Build or download a Protomaps basemap extract for the region.

2. Extract a z0–z14 PMTiles file with a bounding box that covers Coimbatore + 60 km.

3. Upload to R2 with `Content-Type: application/vnd.pmtiles`, `Accept-Ranges: bytes`, and CORS allowing `GET`, `HEAD`, `Range`.

4. Set `NEXT_PUBLIC_PMTILES_URL` to the R2 URL.

5. Host glyphs and sprites on R2 for production. The public `protomaps.github.io` assets are acceptable for the Gate 1 spike only.

```bash

# Example; verify the current Protomaps build URL before running.

pmtiles extract \

  https://build.protomaps.com/20261125.pmtiles \

  public/tiles/coimbatore.pmtiles \

  --bbox=75.8,10.2,77.8,11.8 \

  --maxzoom=14

```

Do not commit PMTiles files to git. Use R2 or a local ignored directory.

### 10.5 Bottom sheet

- Three snap points: **18%**, **45%**, **85%** of viewport height.

- Collapsed: drag handle + “N places within X of Y.”

- Half: horizontal card carousel; tapping a card selects the pin and flies to it.

- Expanded: vertical list; map dimmed above.

- Pointer events with capture; keyboard: ArrowUp/ArrowDown changes snap, Escape collapses.

- Safe-area insets for iOS.

- Do not use free-scroll; it feels unpolished and is hard to dismiss.

- Test on a 390×844 viewport and a 1440×900 desktop viewport.

### 10.6 Place card

Every card carries:

- thumbnail (licensed) or a neutral placeholder;

- bilingual name;

- facet chips (max 2 + overflow);

- access badge;

- road km and drive minutes **only** when a base town is selected and a matrix row exists;

- verified date;

- save button.

Never display crow-flies as a drive time. If only crow-flies is known, label it “straight-line” and use `distanceKind='CROW'`.

### 10.7 Dossier renderer

The section order is fixed by `master.md` §7.2:

1. Name (Tamil / English) + facets + access badge + verified badge.

2. One-line hook.

3. Hero image only if licence and attribution exist.

4. Stat row: town→access km · drive minutes · last mile.

5. The Story (≤150 words, neutral).

6. What is documented (claims + grade chips).

7. What is told (lore, attributed, visually distinct).

8. Getting there (route, last mile, transport).

9. Where to base yourself (≤3 towns, km, minutes, character).

10. Practical (hours, entry, season, what to carry).

11. Sensitivity note (required when `cultural_status ≠ SECULAR`).

12. Sources + Verification + “This is wrong.”

Rules:

- The stat row always has three slots. Unknown values render `UNKNOWN` in grey; never omit the slot.

- Every documented/practical claim has a grade chip. A claim without a source cannot be published.

- Lore is visually distinct: tinted background, italic lead, “What is told” heading.

- When `cultural_status ≠ SECULAR`, section 7 renders a sensitivity statement and `narrativeScore` is not read.

- `[This is wrong]` is always visible.

- Sticky mobile action bar: Open in maps · Save · Share · This is wrong. No booking button.

- JSON-LD `TouristAttraction` uses the access point, not the site. Omit `geo` for restricted places.

### 10.8 Gate 0 specimen

`/_design/tokens` shows:

- all surface, ink, brand, status, and facet colours;

- type scale with English and Tamil specimens;

- access badges in all five states plus unknown;

- facet chips in all seven facets;

- buttons in all variants and states;

- spacing and radius samples;

- the three snap-point sheet outline.

It is `noindex` and is not linked from the public navigation. Gate 0 approval is a screenshot pair (390px and 1440px) plus a live preview URL.

---

## 11. Search

### 11.1 Intent decomposition

Search is deterministic. It does not call a model. The parser extracts:

- **facets** from a synonym table;

- **signals** from words like “hidden” or “obscure”;

- **place/town hints** from known names and trigram matches;

- **free text** for the remaining tokens.

```ts

// lib/search/intent.ts

import type { Facet, Signal } from '@/lib/taxonomy';

export type SearchIntent = {

  raw: string;

  facets: Facet[];

  signals: Signal[];

  placeHint: string | null;

  townHint: string | null;

  freeText: string;

};

export type KnownName = {

  type: 'place' | 'town';

  slug: string;

  en: string;

  ta: string;

  variants: string[];

};

```

```ts

// lib/search/synonyms.ts

import type { Facet, Signal } from '@/lib/taxonomy';

export const INTENT: Record<string, { facet?: Facet; signal?: Signal }> = {

  waterfall: { facet: 'WATER' },

  waterfalls: { facet: 'WATER' },

  falls: { facet: 'WATER' },

  அருவி: { facet: 'WATER' },

  நீர்வீழ்ச்சி: { facet: 'WATER' },

  temple: { facet: 'SACRED' },

  temples: { facet: 'SACRED' },

  கோயில்: { facet: 'SACRED' },

  fort: { facet: 'HERITAGE' },

  கோட்டை: { facet: 'HERITAGE' },

  forest: { facet: 'NATURE' },

  jungle: { facet: 'NATURE' },

  abandoned: { facet: 'DARK_HISTORY' },

  'dark history': { facet: 'DARK_HISTORY' },

  hidden: { signal: 'OBSCURITY' },

  obscure: { signal: 'OBSCURITY' },

};

```

Parser rules:

1. Normalize to NFC, lowercase, collapse whitespace.

2. Match the longest synonym phrase first; remove matched tokens from the free text.

3. Match known place/town names and variants; prefer exact, then trigram ≥ 0.4.

4. If multiple towns match, keep the highest similarity and put the rest in free text.

5. If no facet/signal/name matches, the whole query is free text.

6. The parser never invents a facet from an unknown word.

### 11.2 Search SQL

Use `public_place` plus `place_town`. The corpus is tiny; correctness and debuggability matter more than micro-optimization.

```sql

WITH params AS (

  SELECT

    $1::text AS q,

    $2::text[] AS facets,

    $3::uuid AS town_id,

    $4::int AS within_minutes

),

ranked AS (

  SELECT

    p.*,

    similarity(p.name_en, (SELECT q FROM params)) AS sim_en,

    similarity(p.name_ta, (SELECT q FROM params)) AS sim_ta,

    ts_rank(

      to_tsvector('english', coalesce(p.name_en, '') || ' ' || coalesce(p.summary_en, '')),

      websearch_to_tsquery('english', (SELECT q FROM params))

    ) AS rank_en,

    ts_rank(

      to_tsvector('simple', coalesce(p.name_ta, '') || ' ' || coalesce(p.name_en, '')),

      websearch_to_tsquery('simple', (SELECT q FROM params))

    ) AS rank_ta

  FROM public_place p

  WHERE

    (SELECT facets FROM params) = '{}'::text[]

    OR p.facets && (SELECT facets FROM params)

),

filtered AS (

  SELECT r.*

  FROM ranked r

  LEFT JOIN place_town pt

    ON pt.place_id = r.id

   AND pt.town_id = (SELECT town_id FROM params)

  WHERE

    (SELECT town_id FROM params) IS NULL

    OR pt.drive_minutes <= (SELECT within_minutes FROM params)

)

SELECT *

FROM filtered

WHERE

  sim_en > 0.2 OR sim_ta > 0.2 OR rank_en > 0 OR rank_ta > 0

ORDER BY

  GREATEST(sim_en, sim_ta) DESC,

  GREATEST(rank_en, rank_ta) DESC,

  last_verified_at DESC

LIMIT 50;

```

For variants, add:

```sql

OR EXISTS (

  SELECT 1 FROM unnest(p.name_variants) v

  WHERE similarity(v, (SELECT q FROM params)) > 0.35

)

```

At 12–200 places, this is fast. Add a GIN trigram index on `name_en` and `name_ta`; the variant `unnest` scan is acceptable at this size.

### 11.3 Tamil search

- Use `pg_trgm` on `name_ta`, `summary_ta`, and `name_variants`.

- Use `to_tsvector('simple', ...)` for Tamil; Postgres has no Tamil stemmer, and `simple` avoids false stemming.

- Normalize NFC before querying.

- Test `சிறுவாணி`, `சிறுவாணி அருவி`, and a misspelling.

- Do not machine-translate the query into English and search English fields. That hides Tamil content and produces false matches.

### 11.4 Zero-result state

If the primary query returns zero:

1. If a town is selected, find the nearest three publishable places by `ST_Distance(access_point, town.location)`.

2. If no town, use the region centroid or the user’s one-shot location.

3. Return them with the message: **“No exact match — did you mean…”**

4. Never return a blank screen, an empty map with “add one,” or a generic error.

### 11.5 Suggestions

`GET /api/search/suggest?q=&lang=` returns at most 8 suggestions:

- exact/trigram place names;

- town names;

- facet labels when the query matches a synonym.

Each suggestion has `type`, `slug` (if any), `label`, and `subLabel`. The endpoint is `s-maxage=60`, no-store for personalized inputs.

### 11.6 Search tests

| Test | Input | Expected |

|---|---|---|

| Tamil exact | `சிறுவாணி` | Siruvani first |

| Tamil phrase | `சிறுவாணி அருவி` | Siruvani first |

| English intent | `waterfalls near Valparai` | WATER facet + Valparai town + results |

| Synonym | `falls` | WATER facet |

| Hidden signal | `hidden waterfall` | WATER + OBSCURITY |

| Zero results | `qwertyuiop` | nearest 3 + “no exact match” |

| Base town filter | `waterfall` + Valparai + 60 min | only places with `place_town.drive_minutes <= 60` |

| No matrix | place without `place_town` | excluded from time filter, labelled unknown |

| Tamil no English leakage | `ta` UI | no English facet labels in results |

| Injection | `'; DROP TABLE place; --` | no error; zero results |

---

## 12. Distance and base towns

### 12.1 The three-number model

The published unit is not one distance. It is:

```

town centre → access point   road_km, drive_minutes

access point → site          last_mile_km, last_mile_minutes, surface

access window                opens, closes, closed_days, permit, night_driving

```

Rules:

- All road distances are **town centre → access point**. This definition appears as a footnote wherever distances are shown.

- The last mile is **access point → site**, with surface and time.

- The access window is separate from the distance. A place can be close and closed.

- Never show hotels. Show towns only.

- One outbound “See stays in X” link is allowed later; no prices, availability, or inventory claims.

- The map pin is the access point. The site coordinate is internal.

### 12.2 Town registry

The launch registry is the 22 towns in `base-towns.md` §6, subject to verification. The published selection rule is:

> Settlements with at least three registered places to stay, year-round road access, and fuel. Ranked by drive time. Never by commission.

SQL filter for eligible base towns:

```sql

SELECT t.*

FROM town t

WHERE t.stay_count >= 3

  AND t.services @> ARRAY['FUEL']::text[]

  AND t.road_in IN ('PAVED','GHAT')

  AND t.last_verified_at > current_date - 180

ORDER BY t.name_en;

```

`Topslip` is a special case: it is in-reserve, has forest accommodation, and may not meet the private-stay rule. Do not promote it as a base town unless the registry data proves it. It can still appear as a place.

Every town row needs `stay_count`, `services`, `road_in`, `seasonal_risk`, and `last_verified_at` confirmed before it appears. The town registry is editorial data, not scraped.

### 12.3 Matrix batch

Use ORS Matrix V2. The free standard plan allows **500 matrix calls/day and 40/minute**. A 50×50 request is 2,500 pairs. The launch corpus is ~12 places × 22 towns = 264 pairs; even 24 × 22 = 528 pairs fits in one or two calls.

```ts

// scripts/compute-matrix.ts

type MatrixProvider = {

  name: string;

  compute(args: {

    sources: { id: string; lon: number; lat: number }[];

    destinations: { id: string; lon: number; lat: number }[];

  }): Promise<{

    rows: { sourceId: string; destinationId: string; meters: number; seconds: number }[];

  }>;

};

```

ORS request shape:

```http

POST https://api.openrouteservice.org/v2/matrix/driving-car

Authorization: <ORS_API_KEY>

Content-Type: application/json

{

  "locations": [[lon, lat], ...],

  "sources": [0, 1, ...],

  "destinations": [22, 23, ...],

  "metrics": ["distance", "duration"],

  "units": "m"

}

```

Implementation rules:

1. Load publishable places and eligible towns.

2. Build chunks of at most 20 sources × 25 destinations (well under the 50×50 limit).

3. Call ORS sequentially with a 1.5-second gap; respect `429` and `Retry-After`.

4. Convert `distance` metres to `road_km` rounded to one decimal; `duration` seconds to `drive_minutes` rounded up.

5. Upsert `place_town` with `engine='ors-driving-car-v2'` and `computed_at=now()`.

6. Record a `job_run` row with pair count, call count, errors, and duration.

7. Run a 10-pair manual spot check against known routes. Store the check in `job_run.detail`.

8. `--dry-run` prints the plan and makes no calls.

9. `--place=<slug>` and `--town=<slug>` allow a targeted refresh.

Never call ORS from a page render, a search request, or the map. The only runtime call is at most one pair at notification send time for the winning candidate.

### 12.4 Matrix freshness

- `computed_at` older than **120 days** is a warning.

- Recompute quarterly and after any road/gate change.

- If a place has no matrix row, the UI shows **“drive time not verified”** and excludes it from time filters. It does not fall back to crow-flies as if it were a drive time.

- If a matrix row is stale, show the date and label it “last computed.”

- The `place_town` engine string makes vendor changes traceable.

### 12.5 Reach hull

- “Places within 60 minutes of Valparai” is a `place_town` query, not an isochrone.

- The hull is `ST_ConvexHull(ST_Collect(access_point::geometry))` of the reachable places.

- If fewer than three points, no hull.

- Label it **“approximate reach.”** Treat the numbers as authoritative and the hull as decoration.

- Dim places outside the threshold; do not remove them from the map without a way to restore them.

### 12.6 Dossier block

```

WHERE TO BASE YOURSELF

Valparai     34 km   1h 20m   Tea town · most stays · fuel + hospital

Pollachi     58 km   1h 45m   Gateway · 24h fuel · larger hospitals

Anaikatti    22 km   0h 45m   Closest · 4 stays · no fuel after 20:00

Last mile    4.2 km jeep track, 25 min

Access       06:00–17:00 · permit at gate · no night driving

```

Rules:

- Maximum three towns, ranked by drive time.

- Each row shows road km, drive minutes, and one character line.

- Do not show a hotel name, price, rating, or availability.

- Footnote: *“Distance is town centre to access point. Times are driving only.”*

- If fewer than three towns qualify, show fewer. Do not fill the slot with an unverified town.

### 12.7 Distance tests

| Test | Setup | Assertion |

|---|---|---|

| Matrix units | 34,000 m, 4,800 s | 34.0 km, 80 min |

| Rounding | 4,801 s | 81 min (ceil) |

| No matrix row | place without `place_town` | UI says “not verified”; excluded from time filter |

| Base-town ranking | three towns with 45/80/105 min | rendered in that order |

| Max three | four eligible towns | only three rendered |

| Hotel leak | any dossier | no hotel/price/availability string |

| Hull | 2 points | `hull: null` |

| Hull label | 5 points | “approximate reach” visible |

| Stale matrix | `computed_at` 121 days | warning shown |

| Cross-border | Kerala town | state flag/note present |

---

## 13. Telegram

### 13.1 What Telegram is for

Telegram is the **distribution trick**: zero install, a familiar chat surface, and a background location source the browser cannot provide. It is not a second app. It delivers one digest of verified places near the user, with feedback buttons, and links back to the dossier.

What it must never do:

- recommend a closed, restricted, hazardous, sacred, or stale place;

- send more than three messages per day;

- send three messages where one digest would do;

- store the user’s coordinates;

- claim the bot can start live location;

- auto-publish a correction or a “closed” report.

### 13.2 Bot commands

| Command | Behaviour |

|---|---|

| `/start` | Welcome; if a token is present, begin link confirmation; if not, explain linking from the web. |

| `/start <token>` | Look up the token hash; bind a **pending** connection; ask for the 4-character code shown on the web page. |

| `/nearby` | If an active live session exists, evaluate now; otherwise explain live location and offer a one-shot location button. |

| `/radius` | Choose 5 / 10 / 15 / 25 km. |

| `/pause` | Pause notifications for 24 hours. |

| `/resume` | Resume notifications. |

| `/stop` | Disable notifications and unlink. |

| `/settings` | Show current radius, quiet hours, language, digest mode, and link status. |

| `/help` | Explain verification, privacy, and how to correct a place. |

Do not ship `/trending` or `/discover` in Phase 1. There is not enough signal history.

### 13.3 Link flow — two-step code

The 4-character code is a second factor, not decoration. A forwarded deep link must not bind an account.

```

WEB /settings/telegram

  1. Ensure device cookie (wa_device).

  2. POST /api/telegram/link

     → { token, code, expiresIn: 300, deepLink }

  3. Show code 4F2A and "Open Telegram".

  4. Poll POST /api/telegram/link/status { token } every 2s.

TELEGRAM

  5. User opens t.me/<bot>?start=<token>.

  6. Webhook validates the secret and inserts update_id.

  7. Handler hashes the token, finds an unused unexpired link_token.

  8. Binds chat_id from the update to a PENDING telegram_conn.

  9. Bot: "Enter the 4-character code shown in Wild Atlas."

 10. User sends 4F2A.

 11. Handler compares the code; on match:

       - telegram_conn.is_active = true

       - link_token.used_at = now()

       - notifications_enabled = true (preference)

       - bot: "Linked. You will get at most 3 verified place digests a day."

     On mismatch:

       - attempts += 1

       - after 3 attempts, invalidate the token.

```

Why this works:

- The token is in the deep link; the code is only on the web page.

- A forwarded deep link alone cannot complete the link.

- `chat_id` comes from the update, never from a request body claim.

- The web page only learns “linked” and the code it already displayed; it never receives `chat_id`.

Schema additions:

```sql

ALTER TABLE link_token ADD COLUMN attempts int NOT NULL DEFAULT 0;

```

`link_token` stores `token_hash` (SHA-256), `code`, `expires_at`, `used_at`, `attempts`. Tokens expire in 5 minutes. Codes use an unambiguous alphabet (`ABCDEFGHJKLMNPQRSTUVWXYZ23456789`), 4 characters.

### 13.4 Webhook

```ts

// app/api/telegram/webhook/route.ts

import { after } from 'next/server';

import { timingSafeEqual } from 'node:crypto';

import { db } from '@/db/client';

import { telegramUpdate } from '@/db/schema/telegram';

import { env } from '@/lib/env';

import { parseTelegramUpdate } from '@/lib/telegram/update';

import { processTelegramUpdate } from '@/lib/telegram/process';

export const runtime = 'nodejs';

export const maxDuration = 10;

export async function POST(req: Request) {

  const secret = req.headers.get('x-telegram-bot-api-secret-token') ?? '';

  const expected = env.TELEGRAM_WEBHOOK_SECRET;

  if (

    secret.length !== expected.length ||

    !timingSafeEqual(Buffer.from(secret), Buffer.from(expected))

  ) {

    return new Response('forbidden', { status: 403 });

  }

  const update = parseTelegramUpdate(await req.json());

  if (!update) return new Response('ok'); // ignore malformed updates

  const inserted = await db

    .insert(telegramUpdate)

    .values({

      updateId: BigInt(update.update_id),

      kind: update.kind,

    })

    .onConflictDoNothing()

    .returning({ id: telegramUpdate.updateId });

  // Already processed or already queued: acknowledge without duplicate work.

  if (inserted.length === 0) return new Response('ok');

  after(() => processTelegramUpdate(update));

  return new Response('ok');

}

```

Rules:

1. Validate the secret header with a timing-safe comparison.

2. Reject non-POST and oversized bodies.

3. Insert `update_id` for idempotency. Store **no payload** and **no coordinates**.

4. Return 200 immediately; process in `after()`.

5. Never run PostGIS or routing inside the webhook request.

6. If `after()` fails, log a structured error. The next live-location update will retry the evaluation; commands can be resent by the user. A cron sweeper marks stuck rows and alerts.

7. `export const runtime = 'nodejs'`; do not use Edge.

### 13.5 Processing pipeline

```

parse update

  ├─ message /start

  ├─ message /start <token>

  ├─ message 4-char code

  ├─ message /nearby

  ├─ message /radius | /pause | /resume | /stop | /settings | /help

  ├─ message location (one-shot)

  ├─ edited_message location (live)

  └─ callback_query (feedback)

       ↓

resolve device/chat/preference

       ↓

for location:

  session = active session or one-shot

  candidates = ST_DWithin(access_point, current_point, radius)

  candidates = filter is_recommendable(place, now, tz)

  candidates = score + sort

  winner = top 1 (or top 3 for digest)

  route = route_cache or one ORS pair

  budget = shouldNotify(...)

  send digest or single

  insert notification rows

```

For a digest, evaluate up to 20 crow-flies candidates, filter, score, take 3. Do not route all 20. Route only the final 3, and only if the digest is actually sent. Cache by `(geohash7, place_id)` for 30 minutes.

#### 13.5.1 Region gate

Before querying candidates, run a cheap region check. A user in Chennai must not receive a “nearby” push, and the bot must not pretend the region is empty.

```ts

// lib/geo.ts

export type Bbox = { minLon: number; minLat: number; maxLon: number; maxLat: number };

export const REGION_BBOX: Bbox = {

  minLon: 75.8, minLat: 10.2, maxLon: 77.8, maxLat: 11.8,

};

export function inRegion(point: GeoPoint, bbox: Bbox = REGION_BBOX): boolean {

  return (

    point.lon >= bbox.minLon && point.lon <= bbox.maxLon &&

    point.lat >= bbox.minLat && point.lat <= bbox.maxLat

  );

}

```

- The bbox is a coarse gate, not the reach model. Exact proximity still uses `ST_DWithin` in metres.

- If `inRegion` is false: skip the candidate query, send one planning-mode message (“Wild Atlas covers Coimbatore district and 60 km around it. Browse the map or declare a trip.”), and do not create a notification row.

- If `inRegion` is true but no candidates pass: send the zero-result message, not a generic error.

- The bbox comes from `REGION_BBOX`; changing it is a product decision, not a config tweak.

### 13.6 Scoring

```

score =  0.30 * proximity     (1 - clamp(distance / radius, 0, 1))

       + 0.20 * obscurity     (external documentation, inverted)

       + 0.15 * narrative     (editorial, 0..1, NULL for non-secular)

       + 0.15 * rising        (0.5 neutral until 8 weeks of ledger)

       + 0.20 * preference    (facet match: 1.0 exact, 0.5 adjacent, 0)

```

Tie-break: lower distance, then newer `last_verified_at`. The `reason` string is generated from the contributing terms:

> “If you like waterfalls, this is the least-documented one within 15 km. Verified 12 Oct 2026. 7 km straight line, about 38 min by road.”

Every clause maps to a field or a computed term. No model writes the reason.

### 13.7 Notification budget

Evaluate in this order. The first match wins.

```ts

// lib/telegram/budget.ts

export type BudgetInput = {

  now: Date;

  tz: string;

  quietStart: string | null;

  quietEnd: string | null;

  pausedUntil: Date | null;

  notificationsEnabled: boolean;

  homeDistanceM: number | null;

  hasActiveTrip: boolean;

  sentToday: number;

  lastSentAt: Date | null;

  lastSentToPlaceAt: Date | null;

  distanceM: number;

  radiusM: number;

  recommendable: boolean;

};

export type BudgetDecision =

  | { action: 'send' }

  | { action: 'skip'; reason: string }

  | { action: 'defer'; reason: string };

export function shouldNotify(input: BudgetInput): BudgetDecision {

  if (!input.notificationsEnabled) return { action: 'skip', reason: 'notifications disabled' };

  if (isQuietHours(input.now, input.tz, input.quietStart, input.quietEnd)) {

    return { action: 'skip', reason: 'quiet hours' };

  }

  if (input.pausedUntil && input.pausedUntil > input.now) {

    return { action: 'skip', reason: 'paused' };

  }

  if (

    input.homeDistanceM != null &&

    input.homeDistanceM < 15_000 &&

    !input.hasActiveTrip

  ) {

    return { action: 'skip', reason: 'within home radius and no trip' };

  }

  if (input.sentToday >= 3) return { action: 'skip', reason: 'daily budget' };

  if (input.lastSentAt && input.now.getTime() - input.lastSentAt.getTime() < 30 * 60_000) {

    return { action: 'defer', reason: '30-minute batching window' };

  }

  if (

    input.lastSentToPlaceAt &&

    input.now.getTime() - input.lastSentToPlaceAt.getTime() < 7 * 24 * 60 * 60_000

  ) {

    return { action: 'skip', reason: 'place sent within 7 days' };

  }

  if (input.distanceM > input.radiusM) return { action: 'skip', reason: 'outside radius' };

  if (!input.recommendable) return { action: 'skip', reason: 'not recommendable' };

  return { action: 'send' };

}

```

Rules:

- **Digest is the default.** One message with three places beats three messages.

- `sentToday` counts distinct `notification.batch_id`, not rows.

- `lastSentToPlaceAt` is per place.

- Quiet hours handle overnight windows (e.g., 22:00–07:00).

- Home radius is 15 km from `home_geohash5`; if no home, skip the gate.

- A declared trip corridor bypasses the home-radius gate.

- `CLOSED` and `RESTRICTED` never enter the candidate set.

### 13.8 Live location

Facts:

- A bot **cannot start** a user’s live location. The user starts it from Telegram’s attachment menu.

- `Location.live_period` is a client-provided duration. Do not hard-code 8 hours.

- `edited_message.location` carries live updates.

- Server-side expiry is mandatory: `last_location_at < now() - interval '5 minutes'` → `EXPIRED`.

- `/nearby` on an expired session prompts to re-share and never serves stale data.

Flow:

```

User: /nearby

Bot: "To share live location: attach → Location → Share Live Location.

      Or tap the button below for a one-shot location."

     [Send current location]  ← KeyboardButton request_location

User shares live location

  → message.location.live_period (e.g. 28800)

  → create location_session (source TELEGRAM_LIVE, expires_at now + live_period)

  → first evaluation

  → edited_message.location updates

  → update last_location_at, evaluate with budget

  → user stops or 5 min silence

  → session EXPIRED; no more sends

```

One-shot path:

- `KeyboardButton.request_location` sends a single static fix.

- Process it once; do not create a long-lived session.

- It is the fallback for users who do not want continuous sharing.

Privacy:

- No lat/lon column in `location_session`.

- No coordinates in `telegram_update`.

- No coordinates in `notification`.

- Distance is stored as a band: `0-5`, `5-10`, `10-15`, `15-25`.

- `home_geohash5` is a coarse home cell, not a precise address.

- 90-day purge for sessions and notifications.

### 13.9 Templates

Use `parse_mode: 'HTML'`, escape `<`, `>`, `&`. Photo captions are capped at **1024 characters**; target **900** including Tamil.

```

🌿 <b>3 verified places near you</b>

<i>Valparai · within 15 km</i>

<b>1. Puthuthottam</b> — tea-estate ecology

4.1 km · <b>OPEN</b> · verified 12 Oct 2026

<b>2. Chinnakallar</b> — among the wettest places in India

9.8 km · <b>SEASONAL</b> · verified 02 Nov 2026

<b>3. Nallamudi viewpoint</b> — least-documented view

12.4 km · <b>OPEN</b> · verified 02 Nov 2026

<i>Distances are road distance to access point.</i>

[ Open in Wild Atlas ]  [ Not now ]

[ 👍 Useful ] [ 👎 Not now ] [ ⛔ Closed ] [ ✏️ Wrong ]

```

Rules:

- One message, not three.

- Every message carries feedback buttons.

- `⛔ Closed` and `✏️ Wrong` insert a `correction` row; they never auto-change the place.

- `👍 Useful` records feedback; `👎 Not now` suppresses the place for 7 days.

- Tamil and English templates share the same structure and budget.

- No image unless licence and attribution are present; if an image is sent, attribution goes in the caption.

- `disable_web_page_preview: true` for text messages.

### 13.10 Telegram tests

| Test | Expected |

|---|---|

| Replayed `update_id` | one processing run, one send |

| Wrong secret header | 403, no DB write |

| Forwarded deep link without code | no active connection |

| Wrong code 3 times | token invalidated |

| Bot blocked (403) | connection inactive, no further sends |

| 429 from Telegram | `retry_after` honoured, no duplicate |

| 10 location pings in 60 s | ≤1 message |

| Drive past 6 places in 20 min | exactly 1 digest |

| Quiet hours | 0 sends; resume at boundary |

| Place becomes CLOSED | removed from candidates immediately |

| Stale 181 days | excluded |

| Sacred place | never a candidate |

| Waterfall at 20:30 | suppressed |

| Monsoon + waterfall | suppressed |

| Night + night-driving ban | suppressed |

| Tamil caption | <1024 chars, no English leakage |

| `/nearby` on expired session | prompt, no stale data |

| User in Chennai | `in_region=false`, planning mode, no proximity push |

### 13.11 Telegram operations

- `npm run telegram:set-webhook` sets `url`, `secret_token`, `allowed_updates=['message','edited_message','callback_query']`, and `drop_pending_updates=true` on first setup only.

- A kill switch `TELEGRAM_SEND_ENABLED=false` disables outbound sends without undeploying.

- A cron sweeper marks `telegram_update` rows stuck for >5 minutes and alerts.

- A daily purge deletes expired `link_token`, `location_session` older than 90 days, and `notification` older than 90 days.

- Logs include `update_id`, `kind`, `outcome`, and latency; never message text, tokens, chat IDs, or coordinates.

---

## 14. Trip Pack and offline

### 14.1 What the pack contains

A Trip Pack is a corridor-scoped offline bundle:

- public dossier JSON for every publishable place in the corridor;

- the cached HTML of each dossier page (so reading works without hydration);

- a corridor PMTiles extract at max zoom 14;

- the `place_town` matrix subset for the corridor;

- a manifest with versions, sizes, hashes, and URLs.

```ts

// lib/trip/manifest.ts

export type PackManifest = {

  version: string;

  corridor: string;

  generatedAt: string;

  region: { bbox: [number, number, number, number] };

  dossiers: {

    slug: string;

    pageUrl: string;

    jsonUrl: string;

    bytes: number;

    sha256: string;

  }[];

  tiles: {

    url: string;

    maxZoom: number;

    bytes: number;

    sha256: string;

  };

  matrix: {

    url: string;

    places: number;

    towns: number;

    bytes: number;

  };

  places: string[];

};

```

### 14.2 Generation

`scripts/build-pack.ts`:

1. Validate the corridor slug (`coimbatore-valparai`, `coimbatore-anaikatti`, `coimbatore-topslip`).

2. Query publishable places whose access point is within the corridor buffer.

3. Render each dossier JSON from `public_place`; assert no `location` key.

4. Query `place_town` for the selected places and corridor towns.

5. Extract the corridor PMTiles with `pmtiles extract` (offline, CI/manual).

6. Write the manifest with content hashes.

7. Upload JSON, PMTiles, and manifest to R2 under a versioned prefix.

8. Record a `job_run` row.

Do not generate packs at request time. Do not put a 40 MB PMTiles file in git.

### 14.3 Download UX

- The download prompt fires **on trip declaration**, not on first session. That is when the user has wifi and intent.

- Show bytes, place count, and tile count before download.

- Show progress and a cancel action.

- Use `navigator.storage.estimate()` to warn about quota.

- Allow deleting a pack.

- If the user is on a metered connection, warn before downloading.

### 14.4 Service worker

Use Serwist if its Next 15 integration is clean; otherwise use a hand-written service worker. The spike decides. The behaviour is fixed:

| Request | Strategy |

|---|---|

| App shell, fonts, CSS, JS | Precache; stale-while-revalidate |

| Dossier page HTML | Network-first; fallback to cached HTML |

| Dossier JSON | Cache-first; versioned by pack |

| PMTiles | Cache full file; serve byte ranges from cache |

| Manifest | Network-first; fallback to cached manifest |

| API | Network-only; offline fallback message |

| Images | Cache-first; versioned |

PMTiles uses HTTP range requests. A normal `cache.put(url, response)` for the full file will not satisfy a later `Range` request. The service worker must:

1. Download the full PMTiles file with `fetch(url)` and store the `ArrayBuffer` in Cache Storage under a versioned key.

2. Intercept `fetch` requests with a `Range` header for that URL.

3. Read the cached `ArrayBuffer`, slice the requested range, and return a `206 Partial Content` response with `Content-Range`, `Accept-Ranges`, and `Content-Length`.

4. Return `416` for invalid ranges.

If this proves unreliable, fallback options:

- Ship a lower-zoom PMTiles extract that fits comfortably in cache and accept coarser offline tiles.

- Ship a static low-zoom raster/GeoJSON fallback for the offline map.

- Keep dossiers offline and label the map “online only” for Phase 1. Do not pretend the map works offline if it does not.

### 14.5 Airplane-mode test

The test that matters:

1. Declare a trip on wifi.

2. Download the pack.

3. Turn off the network / set Playwright `context.setOffline(true)`.

4. Open the cached dossier: title, Tamil text, access badge, stat row, sources, verification all render.

5. Open the map: tiles render from cache; pins render.

6. Open a non-cached dossier: clear offline message, not a browser error.

7. Return online: the app recovers without a reload.

If anything 404s, the pack is wrong.

### 14.6 Pricing

`master.md` suggests ₹399/year for the Trip Pack. **Do not implement payments in Phase 1.** Ship the pack free to a small beta and measure:

- pack download completion;

- offline reopen rate;

- return trips;

- willingness-to-pay interviews.

Payment integration is a separate project with tax, refunds, and store-policy work. It is not on the critical path.

---

## 15. Signals (deferred)

Do not build the Signals UI until **eight weeks of `signal_daily` data** exist.

What ships instead:

- **“Newly verified”** badge for places verified in the last 30 days. This is recency you control.

- `rising_score` returns `0.5` (neutral) and is not rendered.

- The discovery ledger tables exist in Stage 0 but are not written or read by the UI.

When the data exists, the formula is:

```

emergence = attention_velocity / (1 + documentation)

```

The Stage 8 work is a separate plan: source ingestion, deduplication, candidate triage, editorial review, and a publication gate. Do not let it leak into Phase 1.

---

## 16. Security, privacy, and operations

### 16.1 Threat model

| Threat | Impact | Mitigation |

|---|---|---|

| Forged Telegram webhook | Spam, account binding | Secret header, timing-safe compare, private chat only |

| Replayed webhook | Duplicate messages | `telegram_update.update_id` primary key |

| Forwarded deep link | Account hijack | Two-step 4-character code, 5-minute expiry, 3 attempts |

| Site-coordinate leak | Safety risk at restricted places | `public_place` view has no `location`; DTO types have no `location`; tests |

| Location trilateration | Privacy harm | No lat/lon storage; distance bands; geohash5 home; 90-day purge |

| Correction spam | Ops burden | Rate limit, honeypot, field picker, no account |

| Search injection | Data leak/error | Parameterized SQL; Zod input; no raw SQL concatenation |

| XSS via content | Session/data compromise | Content is trusted TS, not user HTML; React escaping; CSP |

| Image hotlink/licence | Legal/reliability | Licence + attribution required; own R2 copies |

| ORS key leak | Cost/abuse | Server-only; batch only; rotate |

| Telegram token leak | Bot takeover | Server-only; rotate via BotFather; never log |

| Pack scraping | Bandwidth | Public assets are not secret; rate limit manifests; R2 cache |

| Denial of wallet | Cost | ORS batch caps; Telegram budget; Vercel/R2 spend alerts |

### 16.2 Webhook and API hardening

- Telegram webhook: secret header, POST only, JSON only, body limit 1 MB, `update_id` idempotency, private chats only.

- Link endpoints: same-site cookie, Origin check, rate limit 10/hour/device, no token in query strings.

- Corrections: rate limit 5/hour/IP hash, honeypot field, max 2,000 characters, no HTML rendering.

- Search suggestions: rate limit 60/minute/IP hash, max query length 120.

- Cron routes: `Authorization: Bearer ${CRON_SECRET}`; reject if missing.

- Revalidate route: same secret; only known tags.

- Health route: `SELECT 1`; no schema details.

- All route handlers validate input with Zod and return typed JSON errors.

### 16.3 CSRF and cookies

- `wa_device` cookie: `httpOnly`, `secure` in production, `sameSite=lax`, 1 year, random UUID.

- Server actions: Next’s built-in origin check; additionally verify `Origin`/`Sec-Fetch-Site` for state-changing route handlers.

- No authentication cookies in Phase 1.

- No CORS for browser APIs; same-origin only. Telegram calls the webhook server-to-server.

### 16.4 Content Security Policy

Start with a strict policy that permits the map and analytics:

```

default-src 'self';

script-src 'self' 'unsafe-inline';

style-src 'self' 'unsafe-inline';

img-src 'self' data: blob: https://<R2_HOST> https://<POSTHOG_HOST>;

font-src 'self' https://<R2_HOST>;

connect-src 'self' https://<R2_HOST> https://<POSTHOG_HOST>;

worker-src 'self' blob:;

child-src 'self' blob:;

frame-ancestors 'none';

base-uri 'self';

object-src 'none';

form-action 'self';

```

`'unsafe-inline'` for scripts is an accepted Phase 1 trade-off because Next 15 injects inline bootstrap scripts and the app renders no user HTML. Tighten to a nonce-based policy in a post-launch security pass. Do not add third-party scripts without updating the policy.

### 16.5 Privacy design

| Data | Stored? | Retention | Notes |

|---|---|---|---|

| Precise user location | No | — | Evaluated in memory only |

| `location_session` | Metadata only | 90 days | No lat/lon |

| `home_geohash5` | Yes | Until device deletion | ~5 km cell |

| `notification.distance_band` | Yes | 90 days | 0–5, 5–10, 10–15, 15–25 |

| Telegram `chat_id` | Yes | Until unlink + 30 days | Needed to send |

| Telegram message text | No | — | Not stored |

| Telegram update payload | No | — | Only `update_id` + kind |

| Correction message | Yes | 2 years | User-provided; no account |

| PostHog events | Yes | Per PostHog retention | No coordinates, no chat IDs |

| Server logs | Yes | 30 days | No coordinates, tokens, or chat IDs |

Privacy policy must state:

- no account required;

- location is used only while a session is active;

- the bot stores no coordinates;

- the app stores no precise location history;

- Telegram is a third party with its own privacy policy;

- corrections are public content after review;

- analytics is consent-gated.

### 16.6 Retention and purge

`scripts/purge.ts` / `/api/cron/purge`:

```sql

DELETE FROM location_session

WHERE last_location_at < now() - interval '90 days';

DELETE FROM notification

WHERE sent_at < now() - interval '90 days';

DELETE FROM link_token

WHERE expires_at < now() - interval '1 day';

DELETE FROM telegram_update

WHERE received_at < now() - interval '30 days';

DELETE FROM rate_limit

WHERE window_start < now() - interval '1 day';

```

Run daily. Log counts, not rows. Do not purge `correction` or `verification_event` automatically; they are the audit trail.

### 16.7 Backups and restore

- Neon point-in-time restore for the production branch.

- Weekly logical dump to R2 (`pg_dump --format=custom`), encrypted at rest.

- Test a restore into a Neon branch quarterly.

- Content is in git; the database can be rebuilt from content + migrations, but corrections and verification history cannot. Back those up.

- R2 pack assets are reproducible from content and PMTiles extracts; version them by hash.

### 16.8 Observability

| Signal | Tool | Alert |

|---|---|---|

| Request latency/5xx | Vercel logs | 5xx > 1% for 10 min |

| DB connection errors | Vercel logs | Any sustained error |

| Telegram 429/403 | Structured logs | 429 spike; 403 marks blocked |

| Webhook processing lag | `telegram_update` | Rows stuck >5 min |

| Matrix job | `job_run` | Failure or >120 days stale |

| Pack job | `job_run` | Failure or hash mismatch |

| Publishable check | CI/deploy | Any failure blocks deploy |

| Search zero rate | PostHog | >20% for a week |

| Notification mute rate | PostHog/DB | >30% within 7 days → kill real-time |

Structured log shape:

```json

{

  "level": "info",

  "route": "/api/telegram/webhook",

  "request_id": "...",

  "update_id": "123",

  "kind": "edited_message",

  "outcome": "queued",

  "latency_ms": 42

}

```

Never log coordinates, chat IDs, tokens, message text, or correction text.

### 16.9 Cost estimate

| Item | Monthly |

|---|---|

| Vercel Pro | ~$20 |

| Neon Launch | ~$19 |

| Cloudflare R2 | ~$1–5 (storage + operations; zero egress) |

| ORS | $0 (free tier; quarterly batch) |

| Telegram | $0 |

| PostHog | $0–$20 depending on volume |

| Domain | ~$1 |

| **Total** | **~$40–65/month** |

The expensive input is editorial time, not infrastructure.

### 16.10 Runbooks

| Incident | Action |

|---|---|

| Telegram bot compromised | Revoke token in BotFather; set new token; `setWebhook`; rotate secret; audit `telegram_conn`. |

| Bad recommendation sent | Disable `TELEGRAM_SEND_ENABLED`; inspect `notification.score_terms`; fix data; re-enable. |

| Site coordinates leaked | Disable the route; purge caches; rotate affected data; notify according to policy. |

| ORS outage | Matrix stays; do not route at request time; notification winner can fall back to crow-flies + “approx” or skip send. |

| R2 outage | Map/pack offline; dossiers still render from DB; show degraded banner. |

| Neon outage | Static method page and cached dossiers; map/pack offline; status page. |

| Publishable check fails | Block deploy; fix content/source/review; do not bypass. |

---

## 17. Testing and CI

### 17.1 Test pyramid

| Layer | Tool | Scope | Target |

|---|---|---|---|

| Unit | Vitest | taxonomy, dates, `publishable`, `recommendable`, budget, intent, templates, geo helpers | 90% for contract modules |

| Integration | Vitest + PostGIS | queries, views, functions, parity tests, `EXPLAIN` | all critical queries |

| Component | Testing Library | badges, sheet, cards, forms, language toggle | key interactions |

| E2E | Playwright | map, dossier, search, Telegram link (mocked), pack offline | all gates |

| Manual | Checklist | real Telegram bot, real phone, real drive | before launch |

### 17.2 Fixtures

`db/fixtures/places.ts` seeds:

| Fixture | Purpose |

|---|---|

| `valid-siruvani` | Passes publishable and recommendable |

| `no-sources` | Fails “needs two sources” and “A/B source” |

| `stale-181` | Fails 180-day check |

| `restricted-with-coords` | Fails restricted coordinate check |

| `seasonal-no-window` | Fails seasonal window |

| `sacred-with-narrative` | Fails narrative null |

| `bad-image` | Fails licence/attribution |

| `unreviewed` | Fails human reviewer |

| `hazardous` | Publishable but not recommendable |

| `closed` | Publishable but never recommendable |

| `active-temple` | Publishable but not recommendable |

| `night-water` | Recommendable in day, not at night |

| `monsoon-water` | Recommendable outside monsoon, not inside |

| `night-driving-ban` | Recommendable in day, not at night |

| `no-matrix` | Excluded from time filter |

Fixtures are seeded only in test/preview databases, never production.

### 17.3 Contract tests

1. **Publishable parity** — TS vs `publishable_place`.

2. **Recommendable parity** — TS vs `is_recommendable` at fixed timestamps:

   - 2026-07-15 12:00 IST (monsoon day)

   - 2026-07-15 20:30 IST (monsoon night)

   - 2026-01-15 20:30 IST (dry night)

   - 2026-01-15 10:00 IST (dry day)

3. **Coordinate safety** — serialize every public DTO and Trip Pack JSON; assert no `location`, no site coordinate, no `publish_site_coordinates`.

4. **Public visibility** — unpublishable fixtures never appear in `public_place`.

5. **Banned strings** — CI grep over `app/`, `components/`, `content/`, `lib/telegram/`.

6. **Tamil review** — every content place has `tamilReviewedBy`; no machine-translation marker.

### 17.4 E2E scenarios

| Scenario | Steps | Assertion |

|---|---|---|

| Gate 0 tokens | Open `/_design/tokens` | All swatches, badges, type specimens render |

| Map shell | Open `/` | Map canvas, 3+ pins, town squares, no console errors |

| Pin at access point | Select Siruvani | Pin coordinates equal `accessPoint`, not `location` |

| Bottom sheet | Drag to 18/45/85 | Snaps; cards visible; Escape collapses |

| Base town | Select Valparai, 60 min | Cards re-sort by drive time; hull appears |

| Dossier | Open `/place/siruvani` | All 12 sections; Tamil toggle; sources; verification |

| Sacred | Open a sacred dossier | Sensitivity note; no narrative badge |

| Correction | Submit a correction | Success; row created; rate limit after 5 |

| Search Tamil | Type `சிறுவாணி` | Siruvani first |

| Search intent | Type `waterfalls near Valparai` | WATER facet; Valparai; results |

| Search zero | Type `qwertyuiop` | Nearest 3 + message |

| Telegram link | Web code + mocked bot `/start` + code | Linked; wrong code fails |

| Telegram digest | Mock 10 location updates | ≤1 message; budget respected |

| Trip pack | Declare trip, download, go offline | Dossier and tiles render |

| Offline miss | Open uncached dossier | Clear offline state |

| Accessibility | axe on home/dossier/search/settings | No critical violations |

| Mobile | 390×844 | No horizontal scroll; 44px targets |

### 17.5 CI pipeline

```yaml

# .github/workflows/ci.yml

name: ci

on:

  pull_request:

  push:

    branches: [main]

jobs:

  verify:

    runs-on: ubuntu-latest

    services:

      postgres:

        image: postgis/postgis:16-3.4

        env:

          POSTGRES_PASSWORD: test

          POSTGRES_DB: wildatlas_test

        ports: ['5432:5432']

        options: >-

          --health-cmd "pg_isready -U postgres"

          --health-interval 5s

          --health-timeout 5s

          --health-retries 10

    env:

      DATABASE_URL: postgres://postgres:test@localhost:5432/wildatlas_test

      DATABASE_URL_UNPOOLED: postgres://postgres:test@localhost:5432/wildatlas_test

      TELEGRAM_BOT_TOKEN: test

      TELEGRAM_WEBHOOK_SECRET: test-secret-1234567890

      TELEGRAM_BOT_USERNAME: test_bot

      TELEGRAM_WEBHOOK_URL: https://example.com/api/telegram/webhook

      CRON_SECRET: test-cron-secret-1234567890

      ORS_API_KEY: test

    steps:

      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4

        with:

          node-version: 22

          cache: npm

      - run: npm ci

      - run: npm run lint

      - run: npm run typecheck

      - run: npm run db:migrate

      - run: npm run db:seed

      - run: npm run check:content

      - run: npm run check:banned

      # Fixtures are intentionally unpublishable. Run this before seeding them.

      - run: npm run check:publishable

      - run: npm run build

      - run: npm run db:fixtures

      - run: npm run test

      - run: npx playwright install --with-deps chromium

      - run: npm run test:e2e

```

Production deploy job:

1. Run migrations with `DATABASE_URL_UNPOOLED`.

2. Run `db:seed` to upsert content (idempotent).

3. Run `check:publishable` against production.

4. Deploy to Vercel.

5. Smoke test `/api/health`, `/`, one dossier, one search.

6. `telegram:set-webhook` only when the bot config changes.

### 17.6 Performance budgets

| Metric | Target |

|---|---|

| LCP on dossier (mobile 4G) | < 2.5 s |

| INP | < 200 ms |

| CLS | < 0.1 |

| Initial JS (excluding lazy map chunk) | < 250 KB gzip |

| Map interactive | < 3 s on a mid-range Android |

| Search response | < 300 ms p95 |

| Dossier response | < 400 ms p95 |

| PMTiles first tile | < 1 s on 4G |

| Lighthouse accessibility | ≥ 95 |

| Lighthouse SEO | ≥ 95 |

| Lighthouse performance (home, mobile) | ≥ 80 (map-heavy pages are exempt from 90) |

### 17.7 Acceptance checklist

From `master.md` §11, plus this plan’s additions:

```

□ Place with 0 sources → publishable() fails

□ Restricted place → no site coordinates in any response

□ Sacred place → narrative_score is null, no legend badge

□ last_verified_at = 181 days → excluded from recommendable()

□ Waterfall at 20:30 → suppressed

□ Monsoon + waterfall → suppressed

□ Search "சிறுவாணி" → returns Siruvani

□ Search "waterfalls near Valparai" → WATER facet + Valparai radius

□ Search nonsense → "no exact match" + nearest 3

□ Base town change → distances recompute, hull updates

□ Offline mode → dossiers readable, tiles from cache

□ Location denied → manual base-town fallback, no broken map

□ Tab hidden 5 min → session EXPIRED

□ /nearby on expired session → prompt, never stale data

□ 10 GPS pings in 60s → ≤1 message

□ 6 places in 20 min → exactly 1 digest

□ Webhook replayed with same update_id → 1 send

□ Forwarded link token → code mismatch → no bind

□ Bot blocked → connection inactive, no further sends

□ Photo caption with Tamil → under 1024 chars

□ User in Chennai → in_region false, planning mode

□ Airplane mode → Trip Pack readable

□ Map pin is at access_point, not location (for all 12 places)

□ Public DTOs contain no "location" key

□ Trip Pack JSON contains no "location" key

□ Tamil reviewer recorded for every dossier

□ Banned strings absent from UI and content

□ check:publishable passes against production before deploy

```

---

## 18. Build sequence and gates

### 18.1 Stage table

| Stage | Days | Deliverables | Gate | Approval artefact |

|---|---|---|---|---|

| **0 Foundation** | 4 | Repo, Next 15.5.29, TS 5.9.3, Tailwind 4, Neon/PostGIS, Drizzle schema, `publishable_place`/`public_place`, `publishable()`/`recommendable()`, fixtures, CI, tokens | **Gate 0** | Live `/_design/tokens` + `check:publishable` rejects `bad-place`; 390/1440 screenshots |

| **1 Seed corpus** | 2 | Siruvani content module, seed script, dossier query/renderer skeleton, source table, verification | **Gate 1** | `/place/siruvani` renders Tamil/English, OPEN badge, verified badge, sources; pin at access point |

| **2 Map shell** | 4 | PMTiles extract, R2, MapLibre, pins, bottom sheet, cards, base-town control, reach | **UI 1–2** | `/` with real map, 3+ pins, 3 snap points, base-town control; 390/1440 screenshots |

| **3 Dossier** | 4 | 12-section renderer, claims/grade chips, lore, base towns, practical, sensitivity, correction | **UI 3** | Full Siruvani dossier, EN/TA toggle, mobile/desktop |

| **4 Search** | 3 | Intent parser, FTS + trigram, Tamil, zero-result nearest 3, suggestions | **UI 4** | `சிறுவாணி` → Siruvani; nonsense → nearest 3 |

| **5 Distance** | 5 | 22-town registry, ORS matrix batch, `place_town`, dossier block, reach hull, freshness | **Gate 5** | Three-number model live for 12 places; hull; matrix job audit |

| **6 Telegram** | 9 | Link flow, webhook, queue, budget, digest, live location, templates, feedback | **UI 5** | Real bot: link in <60s, digest, live location, feedback |

| **7 Trip Pack** | 4 | Manifest, pack generation, service worker, offline PMTiles, airplane test | **UI 6** | Download pack, pull network, dossiers/tiles still render |

| **8 Signals** | 4 | Deferred until 8 weeks of `signal_daily` | — | Separate plan |

**Phase 1 engineering: 35 days.** With Stage 8: 39 days. Add review, content, and buffer: **10–12 weeks** for one full-stack engineer plus a Tamil editor/reviewer.

### 18.2 First 10 working days

| Day | Work | Output |

|---|---|---|

| 1 | `git init`, Next 15.5.29, TS 5.9.3, Tailwind 4, ESLint 9, Prettier, folder structure, env validation, CI skeleton | `npm run dev` works; `npm run typecheck` passes |

| 2 | Neon/Docker, PostGIS + pg_trgm, Drizzle schema, migrations, `postgres` client | `npm run db:migrate` creates all tables |

| 3 | `publishable_place`, `public_place`, `publishable()`, `recommendable()`, fixtures, parity tests | `npm run check:publishable` rejects `bad-place` |

| 4 | `tokens.css`, fonts, `/_design/tokens`, base UI components | Gate 0 preview ready |

| 5 | Siruvani research and content module; seed script | Siruvani row in DB with sources/claims |

| 6 | Dossier query, 12-section skeleton, source/grade chips, verification block | `/place/siruvani` renders |

| 7 | PMTiles extract, R2 upload, MapLibre init, 3 pins at access points | Map renders |

| 8 | Bottom sheet 3 snap points, place cards, base-town control | UI Gate 2 preview |

| 9 | Gate 1/2 review fixes; accessibility pass | Approved map shell |

| 10 | Dossier polish, correction sheet, start content #2 | UI Gate 3 preview |

### 18.3 Gate rules

- No gate advances on silence. The reviewer replies **approve** or a specific change.

- Each gate produces a Vercel preview URL plus two screenshots: mobile 390 px and desktop 1440 px, stored in `.research/ui-gate-N/`.

- Gate 0 locks tokens, type, and language default.

- Gate 1 locks the map layout.

- Gate 2 locks the interaction model.

- Gate 3 locks the content contract.

- Gate 4 locks search behaviour.

- Gate 5 locks delivery.

- Gate 6 locks offline.

- A change after a gate is a new ticket, not a silent rewrite.

### 18.4 Definition of done

- All Stage 0–7 gates approved.

- 12 dossiers publishable, each with Tamil review.

- `check:publishable` passes against production before deploy.

- All acceptance checks in §17.7 pass.

- Public DTOs and packs contain no site coordinates.

- Telegram link, digest, live location, feedback, and stop work on a real phone.

- Trip Pack works in airplane mode.

- Lighthouse accessibility ≥95 on home, dossier, search, method.

- Error tracking, uptime alerts, and spend alerts configured.

- Privacy policy and method page published.

- Backup restore tested.

- Kill switch tested.

---

## 19. Content operations

### 19.1 Dossier template

Each `content/places/<slug>.ts` exports a `definePlace({...})` object with:

| Field | Required | Notes |

|---|---|---|

| `slug` | yes | Lowercase, hyphenated, stable |

| `name.en`, `name.ta` | yes | Tamil authored, not translated |

| `nameVariants` | yes | Toponyms, misspellings, former names |

| `summary.en`, `summary.ta` | yes | One-line hook |

| `story.en`, `story.ta` | yes | ≤150 words English; neutral |

| `body.documented`, `body.lore`, `body.gettingThere`, `body.practical` | yes for documented; others optional | Prose, bilingual |

| `facets` | yes | 1–3 facets from taxonomy |

| `accessStatus` | yes | OPEN/SEASONAL/PERMIT/RESTRICTED/CLOSED |

| `safetyClass` | yes | LOW/MODERATE/HAZARDOUS/PROHIBITED |

| `culturalStatus` | yes | SECULAR/RELIGIOUS_ACTIVE/SACRED/SENSITIVE |

| `location` | yes | Internal; for RESTRICTED use a coarse centroid or access point |

| `accessPoint` | yes | Public map pin |

| `accessPointLabel` | yes | “Forest checkpost on the Siruvani road” |

| `seasonStartMonth`, `seasonEndMonth` | if SEASONAL | 1–12 |

| `accessOpens`, `accessCloses`, `closedDays` | recommended | Hours and closures |

| `permitRequired`, `permitNote` | if permit | Who, where, lead time |

| `nightDrivingBanned` | yes | Boolean |

| `lastMile.surface`, `km`, `minutes`, `note` | yes | Product requires the last mile |

| `carryingCapacityNote` | if non-secular or sensitive | Bilingual |

| `sources` | yes | ≥2, ≥1 A/B |

| `claims` | yes | Each non-lore claim has a source key |

| `images` | optional | Licence + attribution mandatory |

| `confidence` | yes | SOURCED for publication |

| `authoredBy` | yes | `human:<name>` |

| `reviewedBy` | yes | `human:<name>` |

| `tamilReviewedBy` | yes | `human:<name>` |

| `lastVerifiedAt` | yes | ISO date |

| `narrativeScore` | only SECULAR | Null for non-secular |

| `obscurityScore` | optional | 0–1 |

| `risingScore` | optional | 0.5 neutral in Phase 1 |

### 19.2 Source grading

| Grade | Definition | Examples |

|---|---|---|

| **A** | Primary/official/gazetteer | District gazetteer, ASI, forest department notification, survey map |

| **B** | Reputable secondary | Major newspaper, established book, university paper, official tourism page |

| **C** | Local/community | Local blog, resident account, temple committee, NGO page |

| **D** | Unverified/social | Instagram reel, YouTube comment, anonymous post |

`publishable()` requires ≥1 A/B and ≥2 total. Grade C can support lore and color, but not the core documented claim. Grade D is a lead, not a source.

### 19.3 Tamil review

- Tamil is authored from Tamil sources plus the English research, not machine-translated.

- A native Tamil reviewer signs off on `name.ta`, `summary.ta`, `story.ta`, `body.ta`, `accessPointLabel.ta`, `permitNote.ta`, `lastMileNote.ta`, and `carryingCapacityNote.ta`.

- `tamilReviewedBy` is required by `check:content`.

- Review Tamil line length and line-height on mobile; Tamil runs longer than English.

- Do not use “Mystery,” “Hidden Gems,” “Trending,” or “Adventure” in either language. Use the approved vocabulary: obscure, little-documented, locally told, newly verified.

### 19.4 Verification cadence

- Every place has a `last_verified_at`.

- 180 days is the publication limit.

- Seasonal places are re-verified at the season boundary.

- A `verification_event` is written for every check: `CONFIRMED`, `CHANGED`, or `RETIRED`.

- `CHANGED` updates fields and the date; `RETIRED` sets `access_status='CLOSED'` and `confidence='PARTIAL'`, which removes it from `public_place`.

- Corrections are triaged within 48 hours; accepted corrections update the dossier and create a verification event.

- A place with no verification in 180 days disappears from public queries. This is intentional.

### 19.5 Proposed launch slate

This is an **editorial slate, not a final list**. Verify access, sources, and cultural status before publishing. Balance facets, access states, and cultural sensitivity.

| # | Place | Facets | Likely access | Why it earns a slot |

|---|---|---|---|---|

| 1 | Siruvani Falls | WATER, NATURE | OPEN + permit note | Vertical slice; Tamil sources exist; access point differs from falls |

| 2 | Puthuthottam | NATURE | OPEN | Tea-estate ecology; lion-tailed macaque; near Valparai |

| 3 | Chinnakallar | WATER, NATURE | SEASONAL | Among the wettest places in India; monsoon gate |

| 4 | Nallamudi viewpoint | NATURE | OPEN | Least-documented view in the estate belt |

| 5 | Topslip | NATURE | PERMIT | Forest gate, timing-critical, strong access story |

| 6 | Parambikulam | NATURE, WATER | PERMIT | Cross-border permit; Kerala rules |

| 7 | Aliyar Dam | WATER, INDUSTRIAL | OPEN | Reservoir, dam history, gateway to Valparai |

| 8 | Monkey Falls | WATER | SEASONAL/PERMIT | Roadside waterfall; monsoon and gate window |

| 9 | Gass Forest Museum | HERITAGE, URBAN | OPEN | Atlas Obscura stub; source-rich; city context |

| 10 | Adiyogi | URBAN, HERITAGE | OPEN | Mainstream but source-rich; tests “not only obscure” |

| 11 | Marudhamalai | SACRED | RELIGIOUS_ACTIVE | Dossier yes, push no; tests cultural gate |

| 12 | Velliangiri | SACRED, NATURE | SEASONAL | Seasonal pilgrimage; tests sensitivity and season |

Alternative candidates if one fails: Anaikatti, Sethumadai, Masani Amman, Kooduthurai, Bhavani Sagar, Kovai Kutralam. Do not expand to 24 until 12 are verified.

### 19.6 Content CI

`check:content` fails if:

- a required bilingual field is missing;

- a source is missing a grade/title/retrieved date;

- fewer than two sources or no A/B source;

- a non-lore claim has no source key;

- `tamilReviewedBy` is missing;

- last-mile fields are missing;

- a restricted place has `publishSiteCoordinates: true`;

- a non-secular place has a narrative score;

- an image lacks licence/attribution;

- a banned string appears;

- the story exceeds 150 English words;

- the slug duplicates another place;

- the place has no access point label.

---

## 20. Risks and mitigations

| Risk | Likelihood | Impact | Mitigation | Gate |

|---|---|---|---|---|

| Content takes longer than 9 weeks | High | High | Start now; 12 not 24; one research/editor pair; publish in order; do not launch bot before #6 | 0–6 |

| Tamil quality reads as translation | High | High | Native reviewer from dossier #1; `tamilReviewedBy`; review on mobile | 0/3 |

| Access data goes stale | High | High | 180-day limit; verification events; corrections; seasonal re-check | 3/5 |

| PMTiles offline range serving fails | Medium | High | Stage 7 spike; full-file cache + 206 slicing; fallback to lower zoom or dossiers-only offline | 7 |

| Drizzle geography custom type fails | Medium | Medium | Stage 0 spike; fallback to geometry + `::geography` casts | 0 |

| Telegram webhook processing loses an update | Medium | Medium | `update_id` idempotency; `after()`; cron sweeper; next live update retries; kill switch | 6 |

| Telegram bot cannot start live location | Certain | Medium | Explicit instruction screen; one-shot `request_location` fallback; never claim otherwise | 6 |

| Site coordinates leak | Low | Critical | `public_place` view; DTO types; serialization tests; coarse restricted location | 0/3/7 |

| Location privacy harm | Medium | High | No lat/lon storage; bands; geohash5; 90-day purge; consent analytics | 6 |

| Image licence problem | Medium | Medium | Licence + attribution required; own R2 copy; source URL | 3 |

| ORS free-tier change | Low | Medium | Matrix batch only; provider interface; stored data; manual fallback | 5 |

| Next 15 maintenance ends | Medium | Low | Next 16 migration spike after Phase 1 | post-7 |

| Low-end Android map performance | Medium | Medium | Lazy map chunk; 12–50 pins; no clustering until 200; test on a real device | 2 |

| Scope creep (accounts, booking, AI) | High | High | Non-goals table; gates; “not in Phase 1” list | all |

| Search Tamil misses | Medium | Medium | Trigram + simple FTS; native test queries; zero-result fallback | 4 |

| Pack download too large | Medium | Medium | Corridor extract; show bytes; wifi prompt; delete option | 7 |

| Correction spam | Low | Medium | Rate limit; honeypot; field picker; no account | 3 |

| Vendor spend surprise | Low | Medium | ORS batch caps; Telegram budget; Vercel/R2 alerts | all |

---

## 21. Open decisions

### 21.1 From `master.md`

| # | Decision | Recommendation | Blocks |

|---|---|---|---|

| O1 | Tamil-first or bilingual-first UI | **Tamil-first default, English toggle.** Configurable via `DEFAULT_LANG`; confirm at Gate 0. | Gate 0 |

| O2 | Digest-only or digest + single alerts | **Digest-only by default**; single alerts only for a declared trip corridor. | Stage 6 |

| O3 | Brand name | “Wild Atlas” is generic and global. Test a Coimbatore-first name before Gate 0. | Gate 0 |

| O4 | DMO target | District administration vs TTDC vs a private anchor. | Stage 8 |

| O5 | WhatsApp fallback | Not now. Telegram skews technical; DMO audiences skew family. | Stage 8 |

| O6 | Trip Pack price | ₹399/year later; **free beta in Phase 1**. | Stage 7 |

### 21.2 New decisions from this plan

| # | Decision | Recommendation | Blocks |

|---|---|---|---|

| N1 | Next 15 vs 16 | **15.5.29** for Phase 1; Next 16 migration after Gate 6. | Stage 0 |

| N2 | TypeScript 5.9 vs 7 | **5.9.3**; revisit after Phase 1. | Stage 0 |

| N3 | Tamil map labels | English basemap labels in Phase 1; evaluate a Tamil glyph fontstack at Gate 1. | Gate 1 |

| N4 | Service worker library | Serwist spike; hand-written SW fallback. | Stage 7 |

| N5 | Admin surface | Scripts + SQL in Phase 1; no admin UI. | Stage 0 |

| N6 | Analytics consent | Consent-gated PostHog; no analytics before consent. | Gate 0 |

| N7 | Pack/image host | **Cloudflare R2** (range requests, zero egress). | Stage 2/7 |

| N8 | Restricted location storage | Private repo; coarse centroid or access point; never exact site. | Stage 0/1 |

| N9 | PWA foreground session | Optional Stage 6.5; Telegram live location first. | Stage 6 |

| N10 | Trip Pack payment | Out of scope; measure willingness to pay. | post-7 |

### 21.3 Gate 0 approval packet

Gate 0 needs a decision on:

1. **Default language** — Tamil-first (recommended) or English-first.

2. **Brand name** — keep Wild Atlas or test a regional name.

3. **Analytics consent** — consent-gated PostHog (recommended) or Vercel Analytics only.

4. **Restricted-place policy** — coarse centroid/access point in a private repo (recommended) or a separate private seed store.

5. **Token palette** — approve the master palette as-is or request specific changes.

Everything else can proceed without blocking.

---

## Appendix A — Copy-paste skeletons

### A.1 Date and timezone helpers

```ts

// lib/dates.ts

export function daysSince(date: string | Date, now = new Date()): number {

  const then = typeof date === 'string' ? new Date(`${date}T00:00:00Z`) : date;

  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  return Math.floor((today.getTime() - then.getTime()) / 86_400_000);

}

export function zonedParts(date: Date, tz: string): { hour: number; month: number } {

  const parts = new Intl.DateTimeFormat('en-GB', {

    timeZone: tz,

    hour: '2-digit',

    hourCycle: 'h23',

    month: '2-digit',

  }).formatToParts(date);

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);

  return { hour: get('hour'), month: get('month') };

}

export function isQuietHours(

  now: Date,

  tz: string,

  start: string | null,

  end: string | null,

): boolean {

  if (!start || !end) return false;

  const { hour } = zonedParts(now, tz);

  const s = Number(start.slice(0, 2));

  const e = Number(end.slice(0, 2));

  return s <= e ? hour >= s && hour < e : hour >= s || hour < e;

}

```

### A.2 Content definition

```ts

// content/define.ts

import { z } from 'zod';

import {

  ACCESS_STATUS, CONFIDENCE, CULTURAL_STATUS, FACETS,

  LAST_MILE_SURFACE, SAFETY_CLASS, SOURCE_GRADE,

} from '@/lib/taxonomy';

const localized = z.object({ en: z.string().min(1), ta: z.string().min(1) });

const point = z.object({ lon: z.number().min(-180).max(180), lat: z.number().min(-90).max(90) });

const sourceSchema = z.object({

  key: z.string().min(1),

  grade: z.enum(SOURCE_GRADE),

  kind: z.string().min(1),

  title: z.string().min(1),

  url: z.url().nullable(),

  retrievedAt: z.iso.date(),

  notes: z.string().nullable().optional(),

});

const claimSchema = z.object({

  section: z.enum(['documented', 'lore', 'practical', 'access']),

  en: z.string().min(1),

  ta: z.string().min(1),

  sourceKey: z.string().nullable().optional(),

  isFolklore: z.boolean().optional(),

});

export const placeSeedSchema = z.object({

  slug: z.string().regex(/^[a-z0-9-]+$/),

  name: localized,

  nameVariants: z.array(z.string()).default([]),

  summary: localized,

  story: localized,

  body: z.object({

    documented: localized.nullable(),

    lore: localized.nullable(),

    gettingThere: localized.nullable(),

    practical: localized.nullable(),

  }),

  facets: z.array(z.enum(FACETS)).min(1).max(3),

  accessStatus: z.enum(ACCESS_STATUS),

  safetyClass: z.enum(SAFETY_CLASS),

  culturalStatus: z.enum(CULTURAL_STATUS),

  location: point,

  accessPoint: point,

  accessPointLabel: localized,

  seasonStartMonth: z.number().int().min(1).max(12).nullable(),

  seasonEndMonth: z.number().int().min(1).max(12).nullable(),

  accessOpens: z.string().nullable(),

  accessCloses: z.string().nullable(),

  closedDays: z.string().nullable(),

  permitRequired: z.boolean(),

  permitNote: localized.nullable(),

  nightDrivingBanned: z.boolean(),

  lastMile: z.object({

    surface: z.enum(LAST_MILE_SURFACE),

    km: z.number().min(0),

    minutes: z.number().int().min(0),

    note: localized.nullable(),

  }),

  carryingCapacityNote: localized.nullable(),

  sources: z.array(sourceSchema).min(2),

  claims: z.array(claimSchema),

  images: z.array(z.object({

    url: z.url(),

    width: z.number().int().nullable(),

    height: z.number().int().nullable(),

    license: z.string().min(1),

    attribution: z.string().min(1),

    sourceUrl: z.url().nullable(),

  })).default([]),

  confidence: z.enum(CONFIDENCE),

  narrativeScore: z.number().min(0).max(1).nullable(),

  obscurityScore: z.number().min(0).max(1).nullable(),

  risingScore: z.number().min(0).max(1).nullable(),

  publishSiteCoordinates: z.boolean(),

  authoredBy: z.string().regex(/^human:/),

  reviewedBy: z.string().regex(/^human:/),

  tamilReviewedBy: z.string().regex(/^human:/),

  lastVerifiedAt: z.iso.date(),

});

export type PlaceSeed = z.infer<typeof placeSeedSchema>;

export function definePlace(input: PlaceSeed): PlaceSeed {

  const parsed = placeSeedSchema.parse(input);

  if (parsed.accessStatus === 'RESTRICTED' && parsed.publishSiteCoordinates) {

    throw new Error(`${parsed.slug}: restricted place must not publish site coordinates`);

  }

  if (parsed.culturalStatus !== 'SECULAR' && parsed.narrativeScore !== null) {

    throw new Error(`${parsed.slug}: narrative score must be null for non-secular places`);

  }

  return parsed;

}

```

### A.3 Publishable check script

```ts

// scripts/check-publishable.ts

import { db } from '@/db/client';

import { publishable } from '@/lib/publishable';

async function main() {

  const places = await db.query.place.findMany({

    with: { sources: true, claims: true, images: true },

  });

  let failed = 0;

  for (const p of places) {

    const result = publishable(p);

    if (!result.ok) {

      failed += 1;

      console.error(`FAIL ${p.slug}\n  ${result.reasons.join('\n  ')}`);

    }

  }

  if (failed) {

    console.error(`\n${failed} place(s) not publishable.`);

    process.exit(1);

  }

  console.log(`✓ all ${places.length} places publishable`);

}

main().catch((error) => {

  console.error(error);

  process.exit(1);

});

```

### A.4 Telegram API client

```ts

// lib/telegram/api.ts

import { Api, GrammyError, HttpError } from 'grammy';

import { env } from '@/lib/env';

const api = new Api(env.TELEGRAM_BOT_TOKEN);

export async function sendMessage(chatId: string, text: string, extra?: Record<string, unknown>) {

  try {

    return await api.sendMessage(chatId, text, {

      parse_mode: 'HTML',

      link_preview_options: { is_disabled: true },

      ...extra,

    });

  } catch (error) {

    if (error instanceof GrammyError && error.error_code === 429) {

      const retryAfter = error.parameters?.retry_after ?? 5;

      throw new RetryAfterError(retryAfter);

    }

    if (error instanceof GrammyError && error.error_code === 403) {

      throw new BotBlockedError();

    }

    throw error;

  }

}

export class RetryAfterError extends Error {

  constructor(public readonly seconds: number) {

    super(`retry after ${seconds}s`);

  }

}

export class BotBlockedError extends Error {

  constructor() {

    super('bot blocked by user');

  }

}

```

### A.5 Telegram template helpers

```ts

// lib/telegram/templates.ts

export function escapeHtml(value: string): string {

  return value

    .replaceAll('&', '&amp;')

    .replaceAll('<', '&lt;')

    .replaceAll('>', '&gt;');

}

export function fitCaption(text: string, max = 900): string {

  if (text.length <= max) return text;

  return `${text.slice(0, max - 1).trimEnd()}…`;

}

export function renderDigest(places: DigestPlace[], lang: 'en' | 'ta'): string {

  // Build from place fields only. No model, no invented clauses.

  // Assert fitCaption(result) === result in tests.

  return fitCaption(buildDigest(places, lang));

}

```

### A.6 Set webhook script

```ts

// scripts/telegram-set-webhook.ts

import { Api } from 'grammy';

import { env } from '@/lib/env';

const api = new Api(env.TELEGRAM_BOT_TOKEN);

await api.setWebhook(env.TELEGRAM_WEBHOOK_URL, {

  secret_token: env.TELEGRAM_WEBHOOK_SECRET,

  allowed_updates: ['message', 'edited_message', 'callback_query'],

  drop_pending_updates: process.argv.includes('--drop-pending'),

});

console.log('webhook set');

```

### A.7 Package scripts

```json

{

  "scripts": {

    "dev": "next dev",

    "build": "next build",

    "start": "next start",

    "lint": "eslint .",

    "typecheck": "tsc --noEmit",

    "test": "vitest run",

    "test:watch": "vitest",

    "test:e2e": "playwright test",

    "db:generate": "drizzle-kit generate",

    "db:migrate": "tsx scripts/migrate.ts",

    "db:seed": "tsx scripts/seed.ts",

    "db:fixtures": "tsx scripts/seed-fixtures.ts",

    "check:publishable": "tsx scripts/check-publishable.ts",

    "check:content": "tsx scripts/check-content.ts",

    "check:banned": "tsx scripts/check-banned-strings.ts",

    "matrix": "tsx scripts/compute-matrix.ts",

    "pack": "tsx scripts/build-pack.ts",

    "telegram:set-webhook": "tsx scripts/telegram-set-webhook.ts",

    "purge": "tsx scripts/purge.ts"

  }

}

```

---

## Appendix B — Traceability matrix

| Master stage / gate | Plan sections | Acceptance |

|---|---|---|

| Stage 0 Foundation | §5, §6, §7, §8.1, §17.3 | `check:publishable` rejects `bad-place`; schema/views migrate; Gate 0 tokens approved |

| Stage 1 Seed Siruvani | §8.5, §10.7, §19 | `/place/siruvani` renders 12 sections; pin at access point; sources/verification |

| Stage 2 Map shell | §9, §10.3–10.6 | Map renders; 3 pins; 3 snap points; base town control |

| Stage 3 Dossier | §10.7 | All 12 sections; EN/TA; claims/grade chips; sensitivity; correction |

| Stage 4 Search | §11 | Tamil exact; intent; zero-result nearest 3 |

| Stage 5 Distance | §12 | Three-number model; 22 towns; matrix batch; hull; freshness |

| Stage 6 Telegram | §13 | Link <60s; digest; live location; feedback; budget; tests |

| Stage 7 Trip Pack | §14 | Airplane-mode dossiers + tiles; no 404 |

| Stage 8 Signals | §15 | Deferred until 8 weeks of data |

| UI Gate 0 | §10.1, §10.8 | Tokens page approved |

| UI Gate 1 | §10.3 | Map shell approved |

| UI Gate 2 | §10.5, §10.6 | Cards + sheet approved |

| UI Gate 3 | §10.7 | Dossier approved |

| UI Gate 4 | §11 | Search approved |

| UI Gate 5 | §13 | Telegram approved |

| UI Gate 6 | §14 | Offline approved |

---

## Appendix C — What to build first, in one page

If you only read one section, read this:

1. **Day 1:** create the repo, pin Next 15.5.29 / TypeScript 5.9.3 / React 19.3.1 / Tailwind 4.3.5, add `lib/taxonomy.ts` and `lib/env.ts`.

2. **Day 2:** create Neon/Docker PostGIS, run `CREATE EXTENSION postgis; CREATE EXTENSION pg_trgm;`, add the Drizzle schema and migrations.

3. **Day 3:** create `publishable_place`, `public_place`, `is_recommendable`, `publishable()`, `recommendable()`, fixtures, and parity tests.

4. **Day 4:** copy the master tokens into `tokens.css`, build `/_design/tokens`, and request Gate 0 approval.

5. **Day 5:** research and seed Siruvani from `content/places/siruvani.ts`; render `/place/siruvani`.

6. **Day 6–8:** add PMTiles, MapLibre, access-point pins, the 3-snap sheet, cards, and the base-town control.

7. **Day 9–10:** polish the dossier, add the correction sheet, and start dossier #2.

8. **Do not build Telegram until the map and dossier are approved.** Do not build the Trip Pack until the matrix exists. Do not build Signals until eight weeks of data exist.

The sequence is deliberate: **contract → content → reading surface → map → search → distance → delivery → offline**. Every later stage depends on the earlier contract being real. If `publishable()` is not enforced in Stage 0, every later surface will publish something it should not.

---

*End of plan.*

# WILD ATLAS — REVERSE ENGINEERING SPECIFICATION

> **Product:** Wild Atlas — a sourced, bilingual (Tamil/English), access-aware field companion for Coimbatore district + 60 km (Kongu Nadu, Anaimalai hills, Palakkad gap).  

> **Status:** Pre-build. Nothing implemented. This document reverse-engineers every module from the existing specs and from real-world competitor websites, so a developer can build it module by module.  

> **Authoritative sources reconciled:** `WILD-ATLAS-MASTER-BUILD.md` (wins on conflicts), `master.md`, `wild-atlas-v2-skeleton.md`, `base-towns.md`, `telegram-proximity-spec.md`, `trendingplace.md`, `clarification.md`, `telegram.md`, `deep-research-report.md`, `PROMPT-screen-flow.md`.

---

## 1. REVERSE-ENGINEERING METHOD

This specification was produced by reverse-engineering the project in four passes, mirroring the skills of reverse engineering applied to each module:

| Pass | Skill applied | Output |

|------|---------------|--------|

| **Structural teardown** | Folder/inventory analysis of `d:\travelseek` — every `.md` spec, research scrape JSON, screenshot, and console log catalogued | §2 Existing Folder Structure |

| **Competitor feature extraction** | Measured teardowns of Atlas Obscura, AllTrails, Zafari, PinIt, Google Maps from live scrapes in research assets | §3 Competitor Reverse-Engineering |

| **Module feature reversal** | Each product module traced back to the real website pattern it copies (or deliberately rejects) | §4 Module Specifications |

| **Schema & contract reversal** | Database tables, publishing contract, recommendation contract, and API contracts reconstructed from the specs | §5–§9 Data, Contracts, Architecture |

Every feature below is tagged with its **source of truth**: either a real website (measured from scrape/screenshot) or an internal spec decision. Where the project deliberately **rejects** a competitor pattern, that is noted as an anti-pattern.

---

## 2. EXISTING FOLDER STRUCTURE (REVERSE-ENGINEERED INVENTORY)

The workspace at `d:\travelseek` contains no application code. It is a research-and-specification repository.

### 2.1 Authoritative specification documents (Markdown)

| File | Role | Status |

|------|------|--------|

| `WILD-ATLAS-MASTER-BUILD.md` | Master build handbook — authoritative build plan, schema, contracts, phases, gates | Authoritative |

| `master.md` | Master build book — Part I market research, Part II UI reference & approval gates, Part III build handbook | Superseded in part |

| `wild-atlas-v2-skeleton.md` | Product skeleton v2 — taxonomy, data model, phases, moat, launch corpus (24 candidates) | Current |

| `base-towns.md` | Base towns & travel distance — town registry, last-mile model, precomputed matrix | Current |

| `telegram-proximity-spec.md` | Telegram proximity engine — dual location path, blind-spot register, webhook, message templates | Current |

| `trendingplace.md` | Scout spec — emergence detection, discovery ledger, corrected agent prompt | Current |

| `clarification.md` | Key decisions — stack, scope, roadmap, agent prompt | Partial |

| `telegram.md` | Original Telegram location-aware discovery engine spec | Partial (superseded by telegram-proximity-spec.md) |

| `deep-research-report.md` | Original product strategy & technical blueprint — superseded stack and proximity model | Superseded |

| `PROMPT-screen-flow.md` | Screen-by-screen walkthrough — Journeys A & B, screen inventory S1–S19, Telegram strings, acceptance check | Current |

| `neon-postgis.md` | Neon + PostGIS setup notes | Reference |

| `nextjs16.md`, `nextjs-blog.md` | Next.js notes | Reference |

| `pmtiles-maplibre.md`, `protomaps-basemaps-*.md`, `protomaps-pmtiles.md`, `protomaps-getting-started.md`, `protomaps-downloads.md` | MapLibre + PMTiles / Protomaps basemap setup notes | Reference |

| `ors-plans.md` | OpenRouteService plans | Reference |

### 2.2 Research evidence bundle (competitor scrapes + screenshots)

These live in the repo root (flat, not under `.research/` as `master.md` originally assumed — `master.md` is corrected here):

| Asset | Source website | What was reverse-engineered |

|-------|---------------|----------------------------|

| `ao-home.json`, `ao-home.png` | Atlas Obscura homepage | Hero, search field, Place of the Day card, nav |

| `ao-place.json`, `ao-place.jpg`, `ao-place.png` | Atlas Obscura place page (Gass Forest Museum) | Breadcrumb → title → actions → photo → prose; stub with zero photos |

| `at-home.json`, `alltrails-home.png` | AllTrails homepage | Search pill, pill filters, card carousel, map FAB |

| `at-trail.json`, `at-trail.jpg/png`, `at-trail2.json`, `at-trail3.json` | AllTrails trail detail | Stat row, tabs, sticky action bar, conditions tab |

| `at-explore.json`, `at-explore.jpg/png` | AllTrails map explore (Tamil Nadu) | Zero pins in Coimbatore–Anaimalai–Valparai region |

| `at-plans.json` | AllTrails pricing | $35.99/yr Plus, paid feature split (offline maps, conditions, wrong-turn alerts) |

| `at-play.json` | AllTrails Play Store | 5Cr+ installs, 4.2★ |

| `at-app-1..14.jpg` | AllTrails mobile screens | Mobile UI patterns |

| `zafari-home.json`, `zafari-home.png` | Zafari marketing site | 9-tile dashboard, Explore Map as one tile |

| `zafari-play.json` | Zafari Play Store | 100+ installs |

| `zafari-app-1..5.jpg/png` | Zafari app screenshots | Weather-leading place page, flat categories |

| `pinit-home.json`, `pinit-explore.json`, `pinit-explore.jpg/png` | PinIt | Empty map "No pins found", flat 13+ chip row, sidebar list |

| `search-*.json` (many) | Web searches | Competitor discovery, API pricing, PostGIS/Drizzle docs, Telegram live location |

| `CONTACT-SHEET.jpg` | All captures at a glance | Visual reference |

### 2.3 Logs & transient files

`console-*.log`, `page-*.yml`, `page-2*.yml`, `settings.local.json`, `shot-urls.txt`, `tmp-url.txt` — transient research artifacts, not part of the product.

---

## 3. COMPETITOR REVERSE-ENGINEERING (FROM REAL WEBSITES)

Five real products were scraped live on 25 Nov 2026. Each is reverse-engineered below: what was measured, what Wild Atlas copies, and what it rejects.

### 3.1 Atlas Obscura — the content analog (atlasobscura.com)

**Measured from live scrape:**

- Homepage hero: *"The Definitive Guide to The World's Hidden Wonders."* Single search field, "Place of the Day" feature card, horizontal nav (Places / Foods / Stories / Newsletters).

- Place page structure: breadcrumb → title → "Added by {user}" → Been Here / Want To Go / Added To List triad → photo block → About (free-text prose).

- **No access status, no permit field, no gate timing, no last-mile surface, no drive time, no source grades, no verification date.**

- Gass Forest Museum (Coimbatore, launch dossier #12): unpublished stub — *"We've decided not to publish this place on Atlas Obscura."* Zero photos, zero engagement.

**What Wild Atlas copies:**

- Narrative place page with photo block and prose.

- Editorial warmth, generous whitespace, serif-adjacent character.

**What Wild Atlas rejects (anti-patterns):**

- Prose-only "About" — unstructured, not machine-checkable, not graded.

- No field utility (no drive time, gate window, last mile).

- Thin coverage outside North America/Europe — a Coimbatore place is a stub.

**Reverse-engineered feature:** dossier page with **structured claims + source grades + verification date**, fixing Atlas Obscura's trust gap.

### 3.2 AllTrails — the utility/revenue analog (alltrails.com)

**Measured from live scrape:**

- Plus price: **$35.99/yr**; Peak: $79.99/yr (secondary press); 1M+ paying subscribers; ~13.75M monthly visits; profitable since 2017.

- Paid feature split: Unlimited Map Downloads, Trail Conditions, Wrong-Turn Alerts, Member Deals, Connect Garmin & COROS.

- **Nobody pays for trail descriptions. They pay for offline maps, current conditions, and safety alerts.**

- Place page pattern: Title → breadcrumb → Rating · Difficulty · Location → [Overview][Conditions][Reviews][Nearby] tab bar → Hero image + map thumbnail + photo count → stat row (10.3 km / 901 m / Out-and-back) → prose → sticky action bar [♥ Save][Get directions][Send to phone].

- AllTrails map of Tamil Nadu at Coimbatore zoom: **zero trail pins** across Coimbatore–Anaimalai–Valparai. Nearest pins near Salem and Silent Valley.

- Mobile: search pill at top + filter icon → pill filters (Nearby, Top picks) → vertical card carousel (photo, bookmark circle, title, park, ★ difficulty · distance · est. time) → floating green Map FAB.

**What Wild Atlas copies (three things stolen outright):**

1. **Stat row** — three big numbers with small labels. Wild Atlas version: town→access point km, drive minutes, last mile.

2. **Sticky action bar** — Save / Directions / Send to phone, always reachable.

3. **Conditions tab** — a named surface for "is it open right now." Wild Atlas version: access window (opens/closes, permits, night-driving ban).

**What Wild Atlas rejects:**

- Paywalling the data itself (GPX download backlash). Wild Atlas paywalls offline utility (Trip Pack), never the dossier.

- Trail-shaped only — no temples, museums, estate bungalows, restricted valleys.

- English-only, no Tamil.

**Reverse-engineered feature:** the three-number stat row, sticky action bar, access/conditions surface, and the business model (inspiration free, utility paid at ₹399/yr).

### 3.3 Zafari — the India competitor (play.google.com, zafari marketing site)

**Measured:**

- **100+ Play Store installs.** Not a competitor; a hobby project.

- Home = dashboard of 9 feature tiles (SABDHAN SOS, Train Tracker, Flight Tracker, Explore Map, Community, Yatra AI, SOS, Daily Dashboard). "Explore Map" is one card among nine.

- Place page = generic POI card: hero photo → "Place" chip → name → state → **weather widget (18°C, Partly cloudy)** → rating → About paragraph → 7-day weather forecast → Photos ("Be the first to add a photo!") → Rating / Now / Known Spot stat row.

- Trip planner = grid of state tiles with emoji.

- Flat taxonomy: Temple, Waterfall, Café, Hotel, Viewpoint, Market. No facets/signals/status separation.

**What Wild Atlas copies:** nothing positive. Zafari is a **negative UI reference** — exactly what the product must NOT look like (dashboard of tiles where discovery competes with a train tracker; weather as the most prominent fact).

**Reverse-engineered feature:** none — used only to validate the "no dashboard tiles, no weather widget, no flat chip row" rules.

### 3.4 PinIt — the crowdsourced map analog (pinitmap.net)

**Measured:**

- `/explore` at UK-wide zoom: **completely empty map** — "No pins found. Oh no, there aren't any pins in this area." Sidebar: "0 pins."

- Flat 13+ item chip row: All · Waterfalls · Beaches · Caves · Castles · Scenic points · Adventure · Historical landmarks · Coves · Tourist attractions · Sea pools · Wild swimming · Reservoirs · Lakes · Nature reserves · Mountain peaks · Cliffs. (Mixes type, access, and landform.)

- Layout: full-bleed map, left sidebar list, floating zoom controls, bottom "Add one" prompt.

- Tiles: OpenFreeMap / OpenMapTiles / OpenStreetMap.

**What Wild Atlas copies:** map-dominant layout (full-bleed map, list beside it).

**What Wild Atlas rejects:** flat chip row (the taxonomy mistake), crowdsourcing cold-start (empty map), "add one" prompt.

**Reverse-engineered feature:** none positive; validates the decision to hand-research 12 dossiers before launch and to use a three-layer taxonomy (facets / signals / status) instead of a flat chip row.

### 3.5 Google Maps — the commoditiser (maps.google.com)

**Measured (verified 25 Nov 2026):**

- Ask Maps + Immersive Navigation shipped 12 March 2026 (US and India).

- "Local Gems" and "Trending" are real ranking layers.

- Gemini-curated result blocks appear for food & beverage searches.

**What Google cannot do (Wild Atlas's entire differentiator):**

1. Grade a source A–D and show it.

2. Separate documented history from local lore, with attribution.

3. Publish an access point instead of a site pin for restricted land.

4. Tell you the gate closes at 17:00 and the last mile is a jeep track.

5. Be authoritative in Tamil for Kongu Nadu toponyms.

**Reverse-engineered feature:** source grading, fact/lore split, access point vs site coordinates, access window, Tamil toponym gazetteer.

### 3.6 Competitor capability matrix (reverse-engineered)

| Capability | Google Maps | Atlas Obscura | AllTrails | Zafari | PinIt | Wild Atlas |

|---|---|---|---|---|---|---|

| POI coverage, global | ●●●●● | ●●●○○ | ●●●○○ | ●○○○○ | ●●○○○ | ●○○○○ (by design) |

| Coverage of Coimbatore–Anaimalai | ●●●●○ | ●○○○○ (stub) | ○○○○○ | ●○○○○ | ○○○○○ | ●●●●○ (target) |

| Source grading + citation | ○○○○○ | ●●○○○ | ○○○○○ | ○○○○○ | ○○○○○ | ●●●●● |

| Fact vs. lore separation | ○○○○○ | ●○○○○ | ○○○○○ | ○○○○○ | ○○○○○ | ●●●●● |

| Access status + gate window | ●●○○○ | ○○○○○ | ●●○○○ (Conditions) | ○○○○○ | ○○○○○ | ●●●●● |

| Last mile + surface | ○○○○○ | ○○○○○ | ●○○○○ | ○○○○○ | ○○○○○ | ●●●●● |

| Drive time from a base town | ●●●○○ | ○○○○○ | ●●○○○ | ●●●○○ | ○○○○○ | ●●●●● |

| Verified date, visible | ○○○○○ | ○○○○○ | ●●○○○ | ○○○○○ | ○○○○○ | ●●●●● |

| Tamil authority | ●●○○○ | ○○○○○ | ○○○○○ | ○○○○○ | ○○○○○ | ●●●●● |

| Offline field pack | ●●●●● | ○○○○○ | ●●●●● (paid) | ○○○○○ | ○○○○○ | ●●●●○ |

| Zero-install delivery | ○○○○○ | ○○○○○ | ○○○○○ | ○○○○○ | ○○○○○ | ●●●●● |

---

## 4. MODULE-BY-MODULE REVERSE-ENGINEERED FEATURES

Each module below lists: the real-world pattern it is reverse-engineered from, the feature specification, and the anti-patterns it rejects.

### Module 1 — Dossier System (the core product)

**Reverse-engineered from:** Atlas Obscura (place page narrative), AllTrails (stat row, tabs, sticky actions), Zafari (rejected — weather-leading page).

**Specification:**

Every place is a **dossier**, not a listing. A dossier contains:

| Section | Content | Source pattern |

|---|---|---|

| Title | `name_ta` / `name_en` (bilingual, Tamil first when TA selected) | Atlas Obscura title |

| Hook | One-line hook, ≤150 words, neutral, no hype | Atlas Obscura lead |

| Facets | Nature · Water · Sacred · Heritage · Industrial · Urban · Dark History | Three-layer taxonomy (rejects flat chip row) |

| Access badge | OPEN / SEASONAL / PERMIT / RESTRICTED / CLOSED, coloured semantically | AllTrails Conditions tab |

| Verified badge | Last verified date + by whom + confidence | Wild Atlas original |

| Stat row | Town→access point (km, min); access point→site (last mile km, min, surface); access window (opens–closes, permit, night ban) | AllTrails stat row (stolen outright) |

| Hero image | Licensed image with attribution | Atlas Obscura photo block |

| The Story | ≤150 words, neutral | Atlas Obscura prose |

| What is documented | Facts, each with source + grade chip (A/B/C/D) | Wild Atlas original |

| What is told | Lore, attributed ("local accounts hold…"), tinted background, italic lead | Wild Atlas original (rejects Atlas Obscura's lore-as-fact) |

| Getting there | Route, last mile, transport, time from Coimbatore | Base-towns module |

| Where to base yourself | Max 3 towns, ranked by drive time, km, minutes, character | base-towns.md |

| Practical | Timings, entry, best season, what to carry | Wild Atlas original |

| Sensitivity note | Required when `cultural_status !== SECULAR` | Wild Atlas original |

| Sources | Table: title · type · grade · link · retrieved | Wild Atlas original |

| Verification | Last verified · by whom · confidence | Wild Atlas original |

| [This is wrong] | Always visible correction button | Wild Atlas original |

**Non-negotiables (reverse-engineered from competitor failures):**

- Stat row above the prose. Three numbers always. If unknown, show `UNKNOWN` grey — never omit the slot.

- Every claim in `documented` and `practical` renders with its grade chip. A claim without a source cannot be published.

- *What is told* visually distinguished (tinted background, italic) so lore never reads as fact.

- `[This is wrong]` always visible — the cheapest corpus maintenance channel.

- No weather widget anywhere above access status (Zafari anti-pattern).

- No dashboard of feature tiles (Zafari anti-pattern).

### Module 2 — Map + List Discovery Surface

**Reverse-engineered from:** AllTrails mobile (card carousel over map), PinIt (full-bleed map + sidebar list), AllTrails desktop (filter pills across top).

**Specification (mobile-primary, desktop-secondary):**

- Top bar (56px): Wild Atlas logo · [EN|த] toggle · ☰ menu.

- Search pill + filter icon.

- **Base town control FIRST** (before facets): `[Base town: Valparai ▾] [within 60 min ▾]`. This is the highest-value control; no competitor has it.

- Facet chips: Nature · Water · Sacred · Heritage · Industrial · Urban · Dark History (multi-select).

- Map (MapLibre GL + PMTiles): round pins = places, square pins = towns. Shape encodes type; colour encodes access status.

- Horizontal card carousel over map (AllTrails pattern): photo, title, distance to access point, access badge.

- Bottom sheet (draggable): list of results with access badges; tap → map flies to pin → dossier.

**Deliberate differences from every reference:**

1. Base town is the first control, before facets.

2. Every card carries an access badge, coloured from the semantic status scale.

3. Tamil toggle in the top bar, not buried in settings.

4. Place pins round, town pins square — two channels (shape + colour), never one.

**Anti-patterns rejected:**

- Empty map with "be the first to add one" (PinIt).

- Flat 17-item chip row mixing type/access/landform (PinIt).

- Facets before base town (all competitors).

- Dark UI default (Zafari).

### Module 3 — Base Towns & Distance Model

**Reverse-engineered from:** Real travel planning pain ("7 km took 50 minutes", gate closed on arrival). No competitor does this.

**Specification:**

The published unit is **three numbers, not one**:

```

town → access point   : road_km, drive_minutes

access point → site   : last_mile_km, last_mile_minutes, surface

access window         : opens, closes, closed_days, permit, night_driving_banned

```

**Data model:**

- `town` table: id, slug, name_en, name_ta, location, population, elevation_m, stay_count, character_en/ta, services[], road_in, seasonal_risk, is_gateway, last_verified_at.

- `place_town` table (precomputed matrix): place_id, town_id, road_km, drive_minutes, route_note_en/ta, engine, computed_at. Composite PK.

- `place` additions: last_mile_surface, last_mile_km, last_mile_minutes, last_mile_note_en/ta, access_opens, access_closes, closed_days, permit_required, permit_note_en/ta, night_driving_banned.

**Architecture — precomputed, not on-demand:**

- Publish time (quarterly): place × town → ORS/GraphHopper matrix API → store road_km, drive_minutes, engine_version, computed_at.

- Request time: plain indexed read from `place_town`. Zero per-request routing cost. No self-hosted OSRM (~600 MB extract, 8–16 GB RAM — pure ops burden).

**UI surfaces:**

- Dossier block "Where to base yourself": max 3 towns, ranked by drive time, towns only (never hotels), one outbound link "See stays in [town]" (no price/availability claim).

- Map: selecting a place draws lines to top 3 towns with minutes labelled; selecting a town dims places beyond reach threshold and shows convex hull.

- Search control: single control `Base town: [Valparai ▾] within [60 min ▾]`. Changing it re-sorts by drive time and updates map hull.

**Anti-patterns rejected:**

- One distance number standing in for the three-number model (all competitors).

- Showing hotels/inventory (implies commission).

- Four different meanings of "distance" — one definition published: town centre → access point.

**Candidate town registry (22 towns):** Coimbatore, Mettupalayam, Karamadai, Perur, Thadagam, Anaikatti, Alandurai, Madukkarai, Pollachi, Anaimalai, Sethumadai, Topslip, Valparai, Aliyar, Palakkad (KL), Mannarkkad (KL), Sathyamangalam, Bhavani, Avinashi, Sulur, Annur, Coonoor/Kotagiri/Ooty (Nilgiris). Each verified for stay_count ≥ 3, year-round road access, fuel.

### Module 4 — Telegram Proximity Engine (zero-install background delivery)

**Reverse-engineered from:** Telegram Bot API (core.telegram.org/bots/api, measured 25 Nov 2026). No competitor has this.

**Thesis (reverse-engineered value):**

> Wild Atlas is the only travel product that can deliver verified, access-aware destination intelligence to a traveller with **zero installation** — and receive their live location without a native app.

Telegram is a native app with background location permission. The bot gets `edited_message` live-location updates for up to 8 hours (`live_period` up to `0x7FFFFFFF` — indefinite editable). The 8-hour figure is the **Telegram client UI max** (15 min / 1 h / 8 h buttons), not an API limit.

**Dual location path:**

| Path | Source | Use when | Lifetime |

|---|---|---|---|

| A — Foreground (PWA) | `navigator.geolocation.watchPosition()` | Browsing, planning, walking | Tab session |

| B — Background (Telegram live location) | User shares live location in chat | Moving, driving, hands-free | 15 min / 1 h / 8 h (user's choice) |

**Path B is the product. Path A is table stakes.**

**Identity (no auth):**

- `device_id` — UUID in localStorage (web identity).

- `chat_id` — Telegram chat id (bot identity).

- `link_token` — binds them, 5-min TTL, single-use, 4-char confirmation code.

- No password, no email, no sign-up form. User counts as "signed in" when device is linked to Telegram chat.

**Linking flow:**

1. `POST /api/telegram/link` → `{ token, code: "4F2A", expires_in: 300 }`.

2. Web shows: "Open @WildAtlasBot, press Start. Confirm the chat shows 4F2A."

3. User opens `t.me/WildAtlasBot?start=<token>` → `/start <token>`.

4. Webhook: validate secret header → find unused unexpired token → bind `chat_id` **from the update** (never from request body claim) → mark used → reply with code.

5. Both surfaces show 4F2A. Mismatch → unlink. (Defeats forwarded deep-link attack.)

**Recommendation contract (`recommendable()`) — hard gates in SQL:**

```sql

publishable_ok :=

      confidence = 'SOURCED'

  AND last_verified_at > now() - interval '180 days'

  AND (SELECT count(*) FROM source WHERE place_id = p.id AND grade IN ('A','B')) >= 1;

access_ok :=

      access_status = 'OPEN'

  OR (access_status = 'SEASONAL' AND current_month BETWEEN season_start_month AND season_end_month);

safety_ok :=

      safety_class IN ('LOW','MODERATE')

  AND cultural_status = 'SECULAR'

  AND NOT (night_now AND facets && ARRAY['WATER','DARK_HISTORY'])

  AND NOT (monsoon_now AND facets && ARRAY['WATER'])

  AND NOT (night_now AND night_driving_banned);

recommendable := publishable_ok AND access_ok AND safety_ok;

```

**CLOSED and RESTRICTED are never candidates.** They appear only in the app under "not visitable" — never in a push.

**Scoring (deterministic, explainable):**

```

score = 0.30 * proximity    (1 - clamp(distance / radius, 0, 1))

      + 0.20 * obscurity    (external documentation, inverted)

      + 0.15 * narrative    (editorial 0..1, NULL for sacred)

      + 0.15 * rising       (0.5 neutral until 8 weeks of signal data)

      + 0.20 * preference   (1.0 exact facet match, 0.5 adjacent, 0 none)

```

Tie-break: lower distance, then newer `last_verified_at`.

**Route only the winner:**

1. `ST_DWithin` filter (crow-flies) → 0–20 candidates.

2. `recommendable()` + score + sort → 1 candidate.

3. ONE routing call (ORS matrix, 1 pair) → road_km, drive_minutes.

4. Cache by (geohash7, place_id) 30 min.

5. Send.

**Notification budget (evaluated in order, stop at first true):**

1. Inside quiet hours → skip.

2. Paused → skip.

3. Within 15 km of home AND no trip declared → skip.

4. Sent today ≥ 3 → skip.

5. Sent in last 30 min → defer (batch into digest).

6. This place within 7 days → skip.

7. Distance > radius → skip.

8. NOT recommendable → skip.

9. Else → send.

**Digest (default, not an option):** one message with up to 3 places. Never three messages.

**Telegram constraints:**

- Text message: 4096 chars.

- **Photo caption: 1024 chars** → budget 900 chars including Tamil.

- Inline keyboard: 8 buttons/row; two rows max.

- `parse_mode`: **HTML** (MarkdownV2 is a bug factory).

- Outbound rate: ~1 msg/sec/chat, ~20/sec global → token bucket + `retry_after` backoff.

- Webhook: idempotency on `update_id`, return 200 in <2 s, process async, never PostGIS + routing inside webhook.

**Session state machine:**

```

IDLE ──start──▶ ACTIVE ──update──▶ ACTIVE

                ├─ heartbeat 5 min ──▶ EXPIRED

                ├─ user /stop ───────▶ CLOSED

                ├─ live_period ends ─▶ EXPIRED

                └─ page hidden 5 min ▶ EXPIRED

```

Server-side sweep: `last_location_at < now() - 5 min` → EXPIRED. `/nearby` on expired session prompts re-share, never stale data.

**Commands shipped:** `/start`, `/nearby`, `/radius` (5/10/15/25 km), `/pause`, `/resume`, `/preferences`, `/stop`, `/help`. Deferred: `/trending` (needs 8 weeks of signal ledger), `/discover` (needs preference history + corpus depth).

**Inline keyboard on every message:**

Row 1: [ Explore ] [ Directions ]

Row 2: [ 👍 Useful ] [ 👎 Not now ] [ ⛔ Closed ] [ ✏️ Wrong ]

`⛔ Closed` and `✏️ Wrong` write to `correction` table.

**Privacy (architectural, not a promise):**

- Store `distance_band` (0-5, 5-10, 10-15, 15-25 km), **never** metres.

- No candidate coordinates stored. Only the winner survives.

- No `lat/lon` column on `location_session`. Position in memory for request duration only.

- 90-day purge. DPDP 2023 purpose limitation.

- Telegram is a third-party transfer — disclose in privacy notice.

### Module 5 — Trip Pack (offline utility)

**Reverse-engineered from:** AllTrails "Unlimited Map Downloads" (paid feature), Komoot one-time region purchase.

**Specification:**

- Downloadable for a corridor (e.g. "Coimbatore → Valparai").

- Contains: dossiers, PMTiles for the corridor (max zoom 14), `place_town` rows.

- Works in airplane mode.

- Prompt on **trip declaration** (when user has wifi and intent), not on first session.

- This is the paid subscription unit: **₹399/year**. Never paywall the dossier. Never take pay-for-placement.

**Anti-patterns rejected:**

- Paywalling reading/dossiers (AllTrails GPX backlash).

- $35.99-style trial offer inside first session.

### Module 6 — Scout / Emergence Detection (back-office research tool)

**Reverse-engineered from:** Instagram / Xiaohongshu emergence detection (rejected — invisible, unverified, destructive), Atlas Obscura (provenance, rejected — no emergence signal).

**Specification:**

Scout is a **back-office research tool**. It produces candidate leads for a human. It never publishes.

**Core formula:**

```

emergence = attention_velocity / (1 + documentation)

```

- Rising mentions + 2 reviews = emerging.

- Rising mentions + 4,000 reviews = popular.

- Flat mentions + 0 reviews = dormant — not a lead.

**Scoring:**

```

attention(t) = 3*mentions + 2*engagement + 1*wikimedia_pageviews + 1*search_impressions

velocity     = (attention_7d - attention_prev_7d) / max(attention_prev_7d, 5)

documentation = log1p(reviews) + log1p(photos) + log1p(articles) + log1p(osm_present) + log1p(wikidata + wikipedia)

emergence    = velocity * decay(days_since_last_signal) / (1 + documentation)

```

**Minimum evidence gate (candidate discarded below this):**

- ≥ 8 signals

- ≥ 3 distinct source types

- Signals spanning ≥ 2 distinct weeks

**Pipeline:** HARVEST → EXTRACT → CLUSTER → NOVELTY → SCORE → TRIAGE → VERIFY → PUBLISH

**Triage queue UI (one candidate per card):**

- Name variants (Tamil / Latin)

- Signal list with dates and links

- Map with centroid and precision flag

- Documentation check result

- `open_questions[]` — field checklist

- Three buttons: **Verify** · **Quarantine** · **Reject**, each with reason code

**Reason codes:** `NOT_A_PLACE`, `ALREADY_DOCUMENTED`, `PRIVATE_LAND`, `RESTRICTED_AREA`, `CULTURALLY_SENSITIVE`, `UNSAFE`, `INSUFFICIENT_EVIDENCE`, `DUPLICATE`.

**Sources obtainable:**

| Source | Access | Use |

|---|---|---|

| YouTube Data API | 10k quota/day; ~100 searches/day | Title/description mining, view velocity |

| Reddit API | Commercial, low cost | Regional subs, trip reports |

| Local news RSS (Tamil + English) | Free | Opening announcements, accidents, closures |

| Tamil blogs and vlogs | Scrape with care / manual | Highest-value signal |

| OSM notes + changesets | Free, ODbL | New paths, new names |

| Wikimedia Pageviews API | Free, no auth | Cleanest legal attention proxy |

| Google Maps | No new-listing feed | Documentation check only |

| Instagram Graph | 30 hashtags/week, business + app review | Marginal |

| TikTok Research | Academic only | Unusable |

**Hard rules for the research agent (never output fabricated data):**

1. Never output a coordinate not read from a cited source. `UNKNOWN` otherwise. Never estimate.

2. `UNKNOWN` is the expected value for every field except name, source_url, captured_at.

3. Every field carries provenance: `{value, source_url, retrieved_at, confidence: HIGH|MEDIUM|LOW}`.

4. Never merge name variants without cited evidence. Otherwise emit both + `POSSIBLE_DUPLICATE`.

5. Refuse and flag: private land, active litigation, restricted reserve, self-harm sites, active worship sites where promotion would intrude.

6. Rank by emergence = velocity / documentation. Never by raw popularity.

### Module 7 — Search & Intent Resolution

**Reverse-engineered from:** Real search behaviour ("hidden waterfalls near Valparai", Tamil toponyms).

**Specification:**

A query decomposes into three things:

1. **INTENT** → facet hints: "hidden"→OBSCURITY, "waterfall"→WATER, "haunted"→DARK_HISTORY, "temple"→SACRED.

2. **PLACE** → geocode hint: "Valparai" → town centroid.

3. **RADIUS** → default: town → 25 km, GPS → user's preference.

**Implementation (order of cost):**

1. Postgres FTS on `name_en`, `name_ta` (`to_tsvector('simple', ...)`).

2. `pg_trgm` fuzzy on `name_variants` — makes Tamil typing work (`சிறுவாணி` → Siruvani).

3. Facet mapping from a small synonym table (no model).

4. Failure state: no result → show nearest 3 places by distance + "no exact match — did you mean".

**Tamil search is mandatory.** Store transliterations in `name_variants`, index with `gin_trgm_ops`.

**Banned strings in UI:** Mystery, Hidden Gems, Trending as category chips, Adventure. (Old taxonomy — conflates the three layers.)

### Module 8 — Correction Loop

**Reverse-engineered from:** Field reporting — a user standing at a place reporting it's closed.

**Specification:**

- Visible **[This is wrong]** button on every dossier from Phase 1.

- Telegram feedback buttons (`⛔ Closed`, `✏️ Wrong`) write to `correction`.

- Routes to `correction` table, triaged weekly, submitter credited.

- `correction`: place_id, field, message, channel (WEB|TELEGRAM), submitted_by, status (OPEN|ACCEPTED|REJECTED|DUPLICATE), resolved_at, created_at.

- This is the cheapest corpus-maintenance channel — a field report arriving at the exact moment someone is standing there.

---

## 5. DATA MODEL (REVERSE-ENGINEERED SCHEMA)

Postgres + PostGIS on Neon. Enums as `text` + `CHECK` constraints. Drizzle ORM.

### 5.1 Corpus tables

```sql

-- extensions

create extension if not exists postgis;

create extension if not exists pg_trgm;

-- place (core dossier)

create table place (

  id                  uuid primary key default gen_random_uuid(),

  slug                text unique not null,

  name_en             text not null,

  name_ta             text not null,

  name_variants       text[] not null default '{}',

  summary_en          text not null,

  summary_ta          text not null,

  body_en             jsonb not null,   -- {documented, lore, gettingThere, practical}

  body_ta             jsonb not null,

  location            geography(Point,4326) not null,   -- the site

  access_point        geography(Point,4326) not null,   -- where you park/start

  access_point_label_en text,

  access_point_label_ta text,

  facets              text[] not null,

  access_status       text not null check (access_status in ('OPEN','SEASONAL','PERMIT','RESTRICTED','CLOSED')),

  season_start_month  int check (season_start_month between 1 and 12),

  season_end_month    int check (season_end_month between 1 and 12),

  access_opens        time,

  access_closes       time,

  closed_days         text,

  permit_required     boolean not null default false,

  permit_note_en      text,

  permit_note_ta      text,

  night_driving_banned boolean not null default false,

  safety_class        text not null check (safety_class in ('LOW','MODERATE','HAZARDOUS','PROHIBITED')),

  cultural_status     text not null default 'SECULAR' check (cultural_status in ('SECULAR','RELIGIOUS_ACTIVE','SACRED','SENSITIVE')),

  carrying_capacity_note_en text,

  carrying_capacity_note_ta text,

  last_mile_surface   text check (last_mile_surface in ('PAVED','GRAVEL','JEEP','WALK','BOAT')),

  last_mile_km        numeric(5,1),

  last_mile_minutes   int,

  last_mile_note_en   text,

  last_mile_note_ta   text,

  confidence          text not null default 'UNVERIFIED' check (confidence in ('SOURCED','PARTIAL','UNVERIFIED')),

  obscurity_score     numeric(4,3),

  narrative_score     numeric(4,3),

  rising_score        numeric(4,3),

  authored_by         text not null,   -- 'human:<name>' | 'ai' (ai fails contract)

  reviewed_by         text,

  last_verified_at    date,

  created_at          timestamptz not null default now(),

  updated_at          timestamptz not null default now()

);

create index place_location_gix on place using gist (location);

create index place_access_gix   on place using gist (access_point);

create index place_facets_idx   on place using gin (facets);

create index place_fts_idx      on place using gin (to_tsvector('simple', coalesce(name_en,'') || ' ' || coalesce(name_ta,'')));

create index place_name_trgm_idx on place using gin (name_en gin_trgm_ops);

create index place_name_ta_trgm_idx on place using gin (name_ta gin_trgm_ops);

create index place_variants_trgm_idx on place using gin (array_to_string(name_variants,' ') gin_trgm_ops);

```

### 5.2 Supporting corpus tables

```sql

create table source (

  id            uuid primary key default gen_random_uuid(),

  place_id      uuid not null references place(id) on delete cascade,

  grade         text not null check (grade in ('A','B','C','D')),

  kind          text not null,   -- wikipedia | news | gazetteer | book | local

  title         text not null,

  url           text,

  retrieved_at  date not null,

  notes         text

);

create table claim (

  id          uuid primary key default gen_random_uuid(),

  place_id    uuid not null references place(id) on delete cascade,

  section     text not null check (section in ('documented','lore','practical','access')),

  statement   text not null,

  source_id   uuid references source(id),   -- NULL allowed only for lore

  is_folklore boolean not null default false

);

create table image (

  id           uuid primary key default gen_random_uuid(),

  place_id     uuid not null references place(id) on delete cascade,

  url          text not null,

  width        int, height int,

  license      text,   -- must be non-null to publish

  attribution  text,   -- must be non-null to publish

  source_url   text

);

create table correction (

  id           uuid primary key default gen_random_uuid(),

  place_id     uuid not null references place(id) on delete cascade,

  field        text,

  message      text not null,

  channel      text not null check (channel in ('WEB','TELEGRAM')),

  submitted_by text,

  status       text not null default 'OPEN' check (status in ('OPEN','ACCEPTED','REJECTED','DUPLICATE')),

  resolved_at  timestamptz,

  created_at   timestamptz not null default now()

);

create table verification_event (

  id          uuid primary key default gen_random_uuid(),

  place_id    uuid not null references place(id) on delete cascade,

  verified_at date not null,

  verified_by text not null,

  outcome     text not null check (outcome in ('CONFIRMED','CHANGED','RETIRED')),

  notes       text

);

```

### 5.3 Source grading (reverse-engineered from Atlas Obscura's trust problem)

| Grade | Definition | Usable alone? |

|---|---|---|

| **A** | Primary: official records, temple/estate administration, ASI, gazetteer, peer-reviewed | Yes |

| **B** | Reputable secondary: established press, published books, government tourism material | Yes, with attribution |

| **C** | Community: named local residents, trekking groups, blogs | Lore only, always attributed |

| **D** | Unsourced folklore, forwarded content, AI summaries | **Never published** |

### 5.4 Signals / discovery ledger

```sql

create table signal_daily (

  place_id   uuid not null references place(id) on delete cascade,

  date       date not null,

  source     text not null,   -- wikipedia | youtube | reddit | news | first_party

  value      numeric not null,

  primary key (place_id, date, source)

);

create table discovery_event (

  id                  uuid primary key default gen_random_uuid(),

  place_id            uuid not null references place(id),

  entered_awareness_at date not null,

  evidence            jsonb not null,

  verified_at         date,

  published_at        date

);

```

### 5.5 Geo / distance tables

```sql

create table town (

  id                uuid primary key default gen_random_uuid(),

  slug              text unique not null,

  name_en           text not null,

  name_ta           text not null,

  location          geography(Point,4326) not null,

  population        int,

  elevation_m       int,

  stay_count        int not null default 0,

  character_en      text,

  character_ta      text,

  services          text[] not null default '{}',  -- FUEL, FUEL_24H, HOSPITAL, ...

  road_in           text check (road_in in ('PAVED','GHAT','GRAVEL')),

  seasonal_risk     text check (seasonal_risk in ('NONE','MONSOON','LANDSLIDE')),

  is_gateway        boolean not null default false,

  last_verified_at  date

);

create table place_town (

  place_id       uuid not null references place(id) on delete cascade,

  town_id        uuid not null references town(id) on delete cascade,

  road_km        numeric(6,1) not null,

  drive_minutes  int not null,

  route_note_en  text,

  route_note_ta  text,

  engine         text not null,   -- e.g. 'ors-driving-car'

  computed_at    timestamptz not null default now(),

  primary key (place_id, town_id)

);

create index place_town_reach_idx on place_town (town_id, drive_minutes);

```

### 5.6 Four hard rules on this schema

1. No published dossier without ≥1 A/B source.

2. No coordinates inside restricted or private land — publish `access_point` only.

3. Every `claim` in `documented` and `practical` must have a `source_id`.

4. `last_verified_at` older than 180 days demotes the dossier and shows a staleness notice.

### 5.7 Identity / Telegram tables

```sql

create table device (

  id            uuid primary key default gen_random_uuid(),

  device_uuid   text unique not null,   -- from localStorage

  home_geohash5 text,

  created_at    timestamptz not null default now(),

  last_seen_at  timestamptz

);

create table telegram_conn (

  id              uuid primary key default gen_random_uuid(),

  device_id       uuid not null references device(id) on delete cascade,

  chat_id         bigint unique not null,

  tg_username     text,

  is_active       boolean not null default true,

  blocked_by_user boolean not null default false,

  connected_at    timestamptz not null default now(),

  disconnected_at timestamptz

);

create table link_token (

  id          uuid primary key default gen_random_uuid(),

  device_id   uuid not null references device(id) on delete cascade,

  token_hash  text not null,

  code        text not null,   -- 4-char confirmation code

  expires_at  timestamptz not null,

  used_at     timestamptz

);

create table preference (

  device_id             uuid primary key references device(id) on delete cascade,

  radius_m              int not null default 10000 check (radius_m in (5000,10000,15000,25000)),

  facets                text[] not null default '{}',

  language              text not null default 'EN' check (language in ('EN','TA')),

  quiet_start           time,

  quiet_end             time,

  tz                    text not null default 'Asia/Kolkata',

  notifications_enabled boolean not null default false,

  digest_mode           boolean not null default true,

  paused_until          timestamptz,

  updated_at            timestamptz not null default now()

);

create table location_session (

  id               uuid primary key default gen_random_uuid(),

  device_id        uuid not null references device(id) on delete cascade,

  source           text not null check (source in ('PWA','TELEGRAM_LIVE')),

  started_at       timestamptz not null default now(),

  last_location_at timestamptz not null default now(),

  expires_at       timestamptz not null,

  status           text not null default 'ACTIVE' check (status in ('ACTIVE','EXPIRED','CLOSED'))

  -- deliberately NO lat/lon column

);

create table notification (

  id            uuid primary key default gen_random_uuid(),

  device_id     uuid not null references device(id) on delete cascade,

  place_id      uuid references place(id),

  kind          text not null check (kind in ('DIGEST','SINGLE','TRIP')),

  distance_band text not null check (distance_band in ('0-5','5-10','10-15','15-25')),

  score_terms   jsonb,

  tg_message_id bigint,

  delivery      text not null default 'QUEUED' check (delivery in ('QUEUED','SENT','FAILED')),

  feedback      text check (feedback in ('USEFUL','NOT_NOW','CLOSED','WRONG_INFO')),

   sent_at       timestamptz not null default now()

);

create index notification_budget_idx on notification (device_id, sent_at desc);

```

### 5.8 Trip / Scout tables

```sql

create table trip (

  id           uuid primary key default gen_random_uuid(),

  device_id    uuid not null references device(id) on delete cascade,

  origin_town  uuid references town(id),

  dest_town    uuid references town(id),

  corridor     geography(LineString,4326),

  starts_at    timestamptz,

  ends_at      timestamptz

);

create table trip_stop (

  trip_id     uuid not null references trip(id) on delete cascade,

  place_id    uuid not null references place(id),

  ord         int not null,

  notified_at timestamptz,

  primary key (trip_id, place_id)

);

create table candidate (

  id            uuid primary key default gen_random_uuid(),

  name_variants jsonb not null,

  centroid      geography(Point,4326),

  precision     text check (precision in ('EXACT','APPROX','UNKNOWN')),

  novelty       text check (novelty in ('NEW_TO_CORPUS','KNOWN_LOW_DOC','KNOWN')),

  emergence     numeric,

  status        text not null default 'NEW' check (status in ('NEW','TRIAGED','VERIFYING','VERIFIED','PUBLISHED','REJECTED','QUARANTINED')),

  open_questions jsonb,

  created_at    timestamptz not null default now()

);

create table candidate_signal (

  candidate_id uuid not null references candidate(id) on delete cascade,

  source       text not null,

  url          text,

  captured_at  timestamptz not null,

  raw_text     text

);

```

---

## 6. THE PUBLISHING CONTRACT (ENFORCED IN CODE)

`lib/publishable.ts` — converts every "do not" into something the build cannot violate. Runs in CI and before every deploy (`npm run check:publishable`).

```ts

export type PublishCheck = { ok: true } | { ok: false; reasons: string[] };

export function publishable(p: PlaceWithRelations): PublishCheck {

  const r: string[] = [];

  const ab = p.sources.filter(s => s.grade === 'A' || s.grade === 'B').length;

  if (ab < 1) r.push('needs at least one A or B grade source');

  if (p.sources.length < 2) r.push('needs at least two sources');

  if (p.confidence !== 'SOURCED') r.push('confidence must be SOURCED');

  if (!p.name_en || !p.name_ta) r.push('bilingual name required');

  if (!p.summary_en || !p.summary_ta) r.push('bilingual summary required');

  if (!p.body_en?.documented || !p.body_ta?.documented) r.push('documented section required');

  if (!p.location) r.push('location required');

  if (!p.access_point) r.push('access point required');

  if (!p.access_status) r.push('access status required');

  if (!p.last_verified_at) r.push('verification date required');

  const ageDays = daysSince(p.last_verified_at);

  if (ageDays > 180) r.push(`stale: verified ${ageDays} days ago`);

  if (p.access_status === 'RESTRICTED' && p.publishes_site_coordinates) {

    r.push('restricted place must not publish site coordinates');

  }

  if (p.cultural_status !== 'SECULAR' && p.narrative_score !== null) {

    r.push('narrative score must be NULL for non-secular places');

  }

  if (p.access_status === 'SEASONAL' && (!p.season_start_month || !p.season_end_month)) {

    r.push('seasonal place needs a season window');

  }

  const undocumented = p.claims.filter(c => c.section !== 'lore' && !c.source_id);

  if (undocumented.length) r.push(`${undocumented.length} claim(s) missing a source`);

  const badImages = p.images.filter(i => !i.license || !i.attribution);

  if (badImages.length) r.push(`${badImages.length} image(s) missing licence or attribution`);

  if (!p.authored_by || p.authored_by === 'ai') r.push('must be human-authored');

  if (!p.reviewed_by) r.push('must be reviewed by a human');

  return r.length ? { ok: false, reasons: r } : { ok: true };

}

```

**Why this matters:** an LLM asked to "build a travel app" will produce a schema where a place can be published with no sources. This predicate makes that state unreachable.

---

## 7. THE RECOMMENDATION CONTRACT (ENFORCED IN SQL)

Used by `/api/nearby` and every Telegram send.

```sql

publishable_ok :=

      confidence = 'SOURCED'

  AND last_verified_at > now() - interval '180 days'

  AND (SELECT count(*) FROM source WHERE place_id = p.id AND grade IN ('A','B')) >= 1;

access_ok :=

      access_status = 'OPEN'

  OR (access_status = 'SEASONAL'

      AND extract(month from current_date)::int BETWEEN season_start_month AND season_end_month);

safety_ok :=

      safety_class IN ('LOW','MODERATE')

  AND cultural_status = 'SECULAR'

  AND NOT (night_now AND facets && ARRAY['WATER','DARK_HISTORY'])

  AND NOT (monsoon_now AND facets && ARRAY['WATER'])

  AND NOT (night_now AND night_driving_banned);

recommendable := publishable_ok AND access_ok AND safety_ok;

```

**Never recommend `CLOSED` or `RESTRICTED` as a visit.** They appear only in the app under "not visitable."

**Every reason string generated from the terms that fired** — no model writes copy:

> *"If you like waterfalls, this is the least-documented one within 15 km. Verified 12 Oct 2026. 7 km straight line, about 38 min by road."*

Persist `score_terms` on every notification so "why this?" is always answerable.

---

## 8. ARCHITECTURE & STACK

### 8.1 System architecture (reverse-engineered from constraints)

```

CLIENT — Next.js PWA (mobile-first)

  MapLibre + PMTiles · bottom sheet · facet chips · dossier pages

  offline Trip Pack (service worker + cached dossiers)

  "This is wrong" button on every dossier

      │ HTTPS (lat/lon per request, stateless)     Telegram app (live location)

      ▼                                            ▼

APP — Next.js App Router (RSC + server actions)

  /place/[slug]  /region/[slug]  /trip/[slug]  /api/*

  search · intent resolution · nearby · telegram webhook · prefs

      │                       │                       │

┌───▼──────────┐   ┌─────────▼─────────┐   ┌──────────▼────────────┐

│ CORPUS       │   │ SIGNALS           │   │ DELIVERY              │

│ Postgres+P   │   │ obscurity         │   │ Telegram Bot API      │

│ place·source │   │ narrative         │   │ outbound queue        │

│ claim·town   │   │ rising            │   │ Resend (email)        │

│ place_town   │   │ discovery_ledger  │   │ PostHog (analytics)   │

│ image        │   │                   │   │                       │

└───────▲──────┘   └─────────▲─────────┘   └───────────────────────┘

        │                       │

        └─────── CONTENT OPS ───┘ (horizontal — the actual moat)

        Airtable/Sheets → validate → sync → publish → re-verify → correct

```

**Two non-negotiable properties:**

1. **Stateless location.** Client sends `lat/lon` per request. Nothing stored. Privacy claim is architectural.

2. **The corpus is the only stateful asset.** Everything else can be rebuilt from it.

### 8.2 Stack and cost

| Layer | Choice | Why | Cost/mo |

|---|---|---|---|

| App | Next.js App Router + TypeScript | SSR for dossier SEO; RSC for map shell | $0–20 |

| DB | Neon Postgres + PostGIS | `ST_DWithin` is the query engine | $0–19 |

| ORM | Drizzle | Raw PostGIS SQL without ORM friction | — |

| Map | MapLibre GL + Protomaps PMTiles on R2 | No per-load billing; offline-capable | $1–5 |

| Tiles | Protomaps / MapTiler | **Never** `tile.openstreetmap.org` in production | incl. |

| Geocoding | Nominatim self-host or MapTiler | Avoids $32/1k text search | $0 |

| Routing (batch) | OpenRouteService free tier | ~530 pairs, 4× per year | $0 |

| Directions | `google.com/maps/dir/?api=1&destination=lat,lon` | Free, no key, no ToS risk | $0 |

| Editorial | Airtable/Sheets → typed sync script | Don't build a CMS before corpus justifies it | $0 |

| Analytics | PostHog Cloud free tier | Needed from day one | $0 |

| Alerts | Telegram Bot API | Free; also background location layer | $0 |

| Email | Resend free tier | Fallback only | $0 |

| Hosting | Vercel | Webhook route on Node runtime | incl. |

**Total: under $40/month** through Phase 2.

**Never introduce:** Spring Boot, separate auth server, Redis, ELK, vector database, recommendation ML, background geolocation in browser.

### 8.3 Environment variables

```

DATABASE_URL=postgres://...

NEXT_PUBLIC_MAP_STYLE_URL=https://...

NEXT_PUBLIC_PMTILES_URL=https://...

ORS_API_KEY=

TELEGRAM_BOT_TOKEN=

TELEGRAM_WEBHOOK_SECRET=

TELEGRAM_BOT_USERNAME=

NEXT_PUBLIC_POSTHOG_KEY=

RESEND_API_KEY=

ADMIN_ALLOWLIST=you@example.com

```

**Never commit `.env`. Never expose `TELEGRAM_BOT_TOKEN` or `ORS_API_KEY` to client.**

---

## 9. UI SURFACES & SCREEN FLOWS (REVERSE-ENGINEERED)

Screen inventory from `PROMPT-screen-flow.md` — two journeys, screens S1–S19.

### Journey A — Anonymous discovery (no identity, no permission granted)

| # | Screen | Route | Job | Pattern basis |

|---|---|---|---|---|

| S1 | Map home, anonymous | `/` | Land someone who's never heard of this on a real map with content visible before any ask | AllTrails mobile: search pill above pill-filter row |

| S2 | Search entry and suggestions | overlay on `/` | Turn vague intent ("waterfall near Pollachi") into a query | AllTrails search pill |

| S3 | Search results — map + list | `/?q=` | Show matches with base town, road distance, drive minutes, access badge | AllTrails card carousel over map |

| S4 | Filter sheet | sheet on `/` | Base town, reach time, facets — in that priority order | base-towns.md (new — no precedent) |

| S5 | Place preview card | bottom-sheet half state | Enough to decide whether to open the dossier; no paywall, no sign-up wall | AllTrails card |

| S6 | Dossier | `/place/[slug]` | The reading surface — the whole product is judged here | AllTrails tabs + AO prose warmth |

| S7 | No-results / out-of-region | state of S3 | Never silent, never an empty map with "add one" | PinIt anti-pattern (rejected) |

| S8 | Correction report | sheet on S6 | Any reader flags a wrong field in <20 seconds, no account needed | Wild Atlas original |

### Journey B — Identity, alerts, and the trip

| # | Screen | Route | Job | Pattern basis |

|---|---|---|---|---|

| S9 | Location permission explainer | sheet on S1/S3 | Ask for location only after user has asked for something, with reason first | Wild Atlas original |

| S10 | Link Telegram — web side | `/settings/telegram` | Show 4-char code and bot deep link | Wild Atlas original |

| S11 | Telegram chat — link confirmation | bot | Confirm binding from update, echo same 4-char code | Wild Atlas original |

| S12 | Telegram chat — live-location instruction | bot | **Bot cannot start live location.** Instruct user via their client, confirm first update arrived | Telegram Bot API measured fact |

| S13 | Arrival digest — the notification | bot | One message, three places, when user enters a new area | Wild Atlas original |

| S14 | Telegram chat — feedback callbacks | bot | 👍 / 👎 / ⛔ Closed / ✏️ Wrong on every message | Wild Atlas original |

| S15 | Alert settings — web | `/settings/alerts` | Radius (5/10/15/25 km), quiet hours, pause, show budget | Wild Atlas original |

| S16 | Saved places | `/saved` | Device-local saves, bridge into Trip Pack | Wild Atlas original |

| S17 | Trip declaration → Trip Pack | `/trip/[corridor]` | Download dossiers + map tiles on wifi, before the drive | AllTrails offline downloads |

| S18 | Offline state | `/trip/[corridor]` after download | Prove it works with no signal | AllTrails offline downloads |

| S19 | Method page | `/method` | Explain how verification works. Trust surface, a screen not a paragraph | Wild Atlas original |

### Key UI rules (reverse-engineered from competitor failures)

| Never | Seen in | Why it matters |

|---|---|---|

| Dashboard of feature tiles | Zafari (9 tiles) | Discovery is the product, not a tile among toys |

| Weather as most prominent fact | Zafari place page | Weather is easy; access is hard |

| Flat chip row mixing type/access/landform | PinIt | Three-layer model exists to prevent this |

| Dark UI default | Zafari | Destroys long-form reading |

| Empty map with "add one" | PinIt | Crowdsourcing cold-start |

| Hide an unknown value | all of them | Unknown access is the most important thing to show |

| Paywall the reading | AllTrails GPX backlash | Paywall offline utility, never the dossier |

| Single distance number | all of them | Three-number model is the differentiator |

| Lore same visual weight as fact | Atlas Obscura prose-only | Fact/lore split is half the product |

| Facets before base town | all of them | Nobody plans a trip by facet; they plan from where they sleep |

| Copy implying the bot tracks the user | — | Bot cannot start/extend/monitor live location |

### Design tokens (measured from competitor screenshots)

```css

:root {

  --surface-page:     #FCFCFA;

  --surface-raised:   #FFFFFF;

  --surface-sunken:   #F3F2EE;

  --surface-inverse:  #14201C;

  --ink-primary:      #1A1A18;

  --ink-secondary:    #5C5F5A;

  --ink-tertiary:     #8E918B;

  --ink-inverse:      #FCFCFA;

  --brand-900:        #0F2A22;

  --brand-700:        #1E4E3F;  /* primary buttons */

  --brand-100:        #E4EEE9;

  --status-open:      #1E7A4C;   --status-open-bg: #E6F3EC;

  --status-seasonal:  #A06A0B;   --status-seasonal-bg: #FBF1DF;

  --status-permit:    #23558C;   --status-permit-bg: #E4EDF7;

  --status-restricted:#8C3A23;   --status-restricted-bg:#F8E9E4;

  --status-closed:    #6B6B6B;   --status-closed-bg: #EDEDEB;

  --status-unknown:   #8E918B;   --status-unknown-bg:#F3F2EE;

  --facet-nature:     #3C7A4A;   --facet-water: #2B6E8F;

  --facet-sacred:     #8A5A1E;   --facet-heritage: #7A4A6B;

  --facet-industrial: #5C5A52;   --facet-urban: #4A5C6B;   --facet-dark: #4A3A3A;

  --font-ui: "Inter", system-ui, -apple-system, sans-serif;

  --font-tamil: "Noto Sans Tamil", "Latha", sans-serif;

  --tap-min: 44px;

}

```

**Rules:** status colours semantic only; `--status-unknown` always visible; Tamil and English share the same scale (Tamil line-height +0.1); no gradient, no glassmorphism, no dark mode in Phase 1.

### Language rules (reverse-engineered register)

**Use instead (only these):** "Newly verified", "Rarely documented", "Worth a detour", "Among the wettest places in India".

**Never render anywhere:** Mystery, Mysterious, Hidden Gem, Hidden Gems, Trending, Secret Spot, Off the Beaten Path, Adventure.

**Register:** Neutral, specific, unhyped. Distances in km and minutes. Times in 24-hour format. No exclamation marks outside bot greeting. No emoji in web product. No "discover the hidden wonders of…" copy.

**Bilingual:** Tamil and English authored alongside each other, never machine-translated. EN / தமிழ் toggle in top bar, not in settings. Tamil line-height ~1.75.

---

## 10. BUILD PLAN — 5 STAGES WITH PASS/FAIL GATES

| Stage | Weeks | Build | Gate |

|---|---|---|---|

| **0 — Foundation** | 1 | Repo, schema, migrations, seed 3 places, `publishable()` + CI, taxonomy module, PostHog events | `check:publishable` rejects 0-source place, accepts valid one |

| **1 — Corpus + Map** | 2–4 | 12 bilingual dossiers, map + facets, dossier page, Tamil search, "This is wrong", SEO pages | 500 organic sessions **or** >40% of readers reach Practical |

| **2 — Field utility** | 5–7 | 22 towns verified, distance matrix, last mile, access window, Trip Pack offline, save (localStorage) | ≥20% of savers reopen during a trip |

| **3 — Telegram core** | 8–10 | Bot, link + code, Path A, digest, budget, `/nearby`, `/radius`, `/pause`, feedback buttons | Link completion >60%; "not now" <30%; 10 rapid updates → ≤1 message |

| **4 — Background proximity** | 11–12 | **Path B: live location**, route-the-winner, trip corridor alerts | Alert arrives with app never opened; mute rate <15% in 7 days |

| **5 — Signals + revenue** | Month 4 | `signal_daily` from week 0 → obscurity; rising only after 8 weeks; DMO pitch; paid Trip Pack | One paying DMO conversation **or** 1% paid conversion |

**Critical path is content, not code.** Stage 1 cannot be compressed by writing faster.

**Do not launch the bot before dossier #6 is verified** — a bot with nothing to deliver teaches you nothing.

### Effort estimate

| Workstream | Days |

|---|---|

| Schema + migrations + contracts + CI | 4 |

| Map + dossier page + search | 8 |

| Distance matrix + base towns + Trip Pack | 7 |

| Telegram core (link, webhook, digest, budget, feedback) | 9 |

| Telegram live location + corridor | 5 |

| Signals + ledger | 4 |

| Polish, tests, deploy | 5 |

| **Total engineering** | **~42 days** |

| **Content** | **12 dossiers × ~6h ≈ 9 weeks part-time** |

### First 48 hours (definition of done: one dossier renders from DB)

1. Scaffold: `npx create-next-app@latest wild-atlas --typescript --app --tailwind`

2. Database: Neon project, enable PostGIS + pg_trgm extensions.

3. Drizzle: paste schema from §5 into `db/schema.ts`; `drizzle-kit generate && drizzle-kit push`.

4. Contracts: `lib/taxonomy.ts`, `lib/publishable.ts` from §8 (§8 taxonomy) and §10.

5. Seed 3 places: Perur, Siruvani, Manjampatti (one of each risk class).

6. Map: `npm i maplibre-gl pmtiles`; Protomaps PMTiles for Tamil Nadu.

7. Verify spine: Open `/place/siruvani` → dossier renders from DB → map pin at **access point**, verified badge, source list.

**Definition of done for day 2:** one dossier renders from the database, with a map pin at the **access point**, a verified badge, and a source list. That single vertical slice proves the entire architecture.

### Repository structure

```

wild-atlas/

├── app/

│   ├── (public)/

│   │   ├── page.tsx                 # map + list

│   │   ├── place/[slug]/page.tsx    # dossier

│   │   ├── region/[slug]/page.tsx   # SEO landing

│   │   └── trip/[slug]/page.tsx     # trip pack

│   ├── admin/

│   │   ├── publish-queue/page.tsx

│   │   ├── corrections/page.tsx

│   │   └── recheck/page.tsx

│   └── api/

│       ├── location/{start,update,stop}/route.ts

│       ├── telegram/{link,webhook,disconnect}/route.ts

│       ├── nearby/route.ts

│       └── notifications/preferences/route.ts

├── components/

│   ├── map/            # MapView, PlacePin, TownPin, ReachHull

│   ├── dossier/        # DossierHeader, Documented, Lore, Sources, BaseTowns

│   └── sheet/          # BottomSheet, FilterBar

├── db/

│   ├── schema.ts       # §5

│   ├── migrations/

│   └── seed/           # 12 dossiers as typed objects

├── lib/

│   ├── taxonomy.ts     # single source of truth

│   ├── publishable.ts  # §10

│   ├── recommendable.ts# §11

│   ├── geo.ts          # bbox, haversine, geohash

│   ├── search.ts       # FTS + trigram + intent mapping

│   ├── telegram/       # bot client, templates, queue, rate limiter

│   └── analytics.ts    # 9 events

├── scripts/

│   ├── sync-airtable.ts

│   ├── compute-matrix.ts

│   ├── check-publishable.ts

│   └── recheck-queue.ts

├── content/            # editorial source of truth

└── docs/               # this handbook + older specs

```

**Rule:** `lib/taxonomy.ts` imported by UI, seed, and Telegram templates. No string literals for facets anywhere else.

---

## 11. TEST MATRIX & ACCEPTANCE CRITERIA

### Acceptance check (pass/fail, one line per test)

- [ ] Place with 0 sources → `publishable()` fails

- [ ] Restricted place → no site coordinates in any response

- [ ] Sacred place → `narrativeScore` is null

- [ ] `last_verified_at` = 181 days → excluded from `recommendable()`

- [ ] Waterfall at 20:30 → suppressed from notifications

- [ ] Monsoon + waterfall → suppressed

- [ ] Search `சிறுவாணி` → returns Siruvani

- [ ] Search "waterfalls near Valparai" → WATER facet + Valparai radius

- [ ] Search nonsense → "no exact match" + nearest 3

- [ ] Base town change → distances recompute, map hull updates

- [ ] Offline mode → dossiers readable, tiles render from cache

- [ ] Location permission denied → manual base-town fallback, no broken map

- [ ] Tab hidden 5 min → session EXPIRED

- [ ] `/nearby` on expired session → prompt, never stale data

- [ ] 10 GPS pings in 60 s → ≤1 message

- [ ] 6 places passed in 20 min → exactly 1 digest

- [ ] Webhook replayed with same `update_id` → 1 send

- [ ] Forwarded link token → code mismatch → no bind

- [ ] Bot blocked → connection inactive, no further sends

- [ ] Photo caption with Tamil → under 1024 chars

- [ ] User in Chennai → `in_region: false`, planning mode

- [ ] Airplane mode → Trip Pack readable

### Metrics and kill criteria (target by week 12)

| Metric | Target | Kill threshold |

|---|---|---|

| Organic sessions/week | 1,500 | <500 by wk 4 |

| Dossier completion (reach Practical) | >40% | <20% |

| Zero-result searches | <8% | >20% |

| Save rate per dossier view | >10% | <3% |

| Reopen during trip | >20% of savers | <5% |

| Corrections/month | >5 | 0 for 2 months |

| Telegram link completion | >60% | <25% |

| Digest open rate | >45% | <20% |

| "Not now" per digest | <30% | >50% |

| Mute/unlink within 7 days | <15% | **>30% → stop real-time alerts** |

| `⛔ Closed` reports per 100 alerts | <5 | >15 (data is stale) |

**Hard stop:** if >30% of users disable notifications within a week, the proximity model is wrong. Move to trip-only delivery and stop real-time alerts.

### Event taxonomy (nine events, fixed now)

`search_performed {query, result_count, base_town}`, `facet_toggled {facet, state}`, `place_opened {place_id, from}`, `dossier_reached {place_id, section}`, `town_selected {town_id, reach_minutes}`, `directions_clicked {place_id, base_town}`, `place_saved {place_id}`, `correction_submitted {place_id, field}`, `offline_pack_downloaded {region}`.

**North Star:** weekly qualified discoveries — a dossier opened **and** an action taken (directions, save, share).

---

## 12. WHAT NOT TO BUILD (NON-GOALS)

Each non-goal has a reason, not a preference:

| Don't build | Why |

|---|---|

| Booking / payments | Liability, stale inventory, wrong product |

| User accounts and passwords | `device_id` + `chat_id` is enough through Stage 4 |

| Social feed / profiles | Nobody comes here for other people |

| Itinerary optimiser | Scope trap; Trip Pack covers the need |

| Global or national coverage | Density is the moat |

| Background geofencing in the browser | Impossible; use Telegram live location |

| AI-generated descriptions | Unverifiable; destroys the only differentiator |

| Sponsored placement | Kills trust and the subscription |

| `/trending`, `/discover` at launch | Nothing to show; will look broken |

| Self-hosted OSRM | 600 MB extract, 8–16 GB RAM, 4 runs/year |

| Google Places | $32/1k text search + ToS forbids OSM basemap |

| Microservices, Redis, ELK | One process handles this for years |

| Recommendation ML | Deterministic and explainable, or you can't defend a bad call |

## 13. OPEN DECISIONS

| # | Decision | Recommendation |

|---|---|---|

| O1 | Digest-only, or digest + single alerts? | Digest-only by default; single alerts only on declared trip corridor |

| O2 | Group trips in Stage 5? | Yes — family travel is highest-intent. One sharer, many readers |

| O3 | Trip Pack prompt timing | On trip declaration (user has wifi and intent), not first session |

| O4 | Brand name | "Wild Atlas" is generic/global. Test a Coimbatore-first name; Tamil search may reward it |

| O5 | DMO target | District administration vs TTDC vs private anchor (estate group, Isha) |

| O6 | Tamil-first or bilingual-first UI | Tamil default, English toggle. Harder, stronger moat |

| O7 | WhatsApp fallback | Not now. Telegram skews technical; DMO audiences skew family. Revisit Stage 5 |

---

## 14. RESEARCH EVIDENCE INDEX (TRACEABILITY)

Every claim in this specification traces to a measured source:

| Claim | Evidence | How measured |

|---|---|---|

| Atlas Obscura Gass Forest page is unpublished stub | `ao-place.json`, `ao-place.jpg` | Live scrape, 25 Nov 2026 |

| AO has no access/permit/gate fields | `ao-place.json` | Field inspection |

| AllTrails Plus $35.99/yr | `at-plans.json` | Live scrape of /plans |

| AllTrails paid features = offline + conditions + alerts | `at-plans.json` | Scraped feature list |

| AllTrails zero pins in Coimbatore region | `at-explore.jpg` | Visual inspection of live map |

| AllTrails place page: Conditions tab + stat row + sticky bar | `at-trail.jpg` | Screenshot |

| Zafari 100+ installs | `zafari-play.json` | Play Store listing |

| Zafari home = 9-tile dashboard | `zafari-app-1-big.jpg` | Play Store screenshot |

| Zafari place page leads with weather | `zafari-app-3-big.jpg` | Play Store screenshot |

| PinIt explore map = zero pins | `pinit-explore.jpg` | Live capture |

| PinIt taxonomy = flat 13+ chip row | `pinit-explore.json` | Scraped chip labels |

| Google Ask Maps shipped 12 Mar 2026 (India) | `blog.google` | Primary source |

| OSM has 0 waterfalls tagged in region bbox | Live Overpass query | Count query, `nodes: 0` |

| Telegram `live_period` supports up to `0x7FFFFFFF` | `core.telegram.org/bots/api` | Primary API reference |

| Telegram photo caption limit 1024 chars | API reference | Primary source |

| Tamil sources exist but thin (3 for Siruvani) | Firecrawl Tamil search | Search results |

**Unverified (not used to justify decisions):** AllTrails exact subscriber count/revenue; any Zafari user-base figure beyond Play Store install bracket.

## 15. ONE PARAGRAPH TO REMEMBER

> Wild Atlas is a sourced, bilingual, access-aware field companion for the Coimbatore region. It publishes **dossiers, not pins** — every claim traceable, every place carrying an access point, a base town, a drive time, a last mile and a gate window. The corpus is the moat; the app is the reading surface; Telegram is the distribution trick that removes the install barrier and supplies the background location the browser cannot. Build depth before breadth, enforce the publishing contract in code, and let the gate numbers decide what happens next.

---

*End of reverse-engineering specification. This document is the authoritative build reference. If this document and any earlier file disagree, this document wins.*

read this is my plan to build my product i want step by step screens what is the in put json format and what it the output json format what communicates with server and database which i can test with postman i use kiro to develop i dont want to tell it the whole project i willl complete it by module by module what are the necessary screens that are the user will see give me the screens prompt to do in stitch ai
