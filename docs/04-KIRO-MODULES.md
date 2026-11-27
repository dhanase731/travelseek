# Wild Atlas — Kiro Module Pack (M0–M9)

**Purpose:** build the product one self-contained module at a time. Each module has its own kickoff prompt. You never paste `master.md`, `IMPLEMENTATION-PLAN.md`, or this whole file into Kiro.

---

## 0. How to use Kiro

1. Open the repo in Kiro.
2. **New Spec** → paste the module's **Kickoff prompt** (the fenced block).
3. Kiro produces `requirements.md`, `design.md`, `tasks.md`.
4. Read `tasks.md`. Delete anything that is not in the module's scope. Approve.
5. Let Kiro implement task by task.
6. Run the module's **Acceptance** commands. Do not start the next module until they pass.
7. Commit. Tag `m0`, `m1`, …

**Three rules for every module:**

- Kiro may only create or edit files listed in the module. If it wants a new file, it must say why in `design.md` first.
- Kiro must not add a dependency that is not in the locked stack. No exceptions.
- Kiro must not invent a JSON field. If a field is missing, it stops and asks.

---

## 1. Module map

| Module | Name | Ships | Depends on | Est. |
|---|---|---|---|---|
| M0 | Foundation & contracts | schema, views, predicates, tokens page, `/api/health`, CI | — | 4 d |
| M1 | Content pipeline + seed | `content/define.ts`, Siruvani, seed, content CI | M0 | 2 d |
| M2 | Public read API | `/api/taxonomy`, `/api/towns`, `/api/places`, `/api/places/{slug}` | M0, M1 | 2 d |
| M3 | Map shell | S1, S4, S5 | M2 | 4 d |
| M4 | Dossier | S6, S8, S19 | M3 | 4 d |
| M5 | Search | S2, S3, S7, S9 + 3 endpoints | M4 | 3 d |
| M6 | Distance & reach | 22 towns, matrix batch, `/api/reach` | M5 | 5 d |
| M7 | Telegram | S10–S15 + 5 endpoints | M6 | 9 d |
| M8 | Trip Pack & offline | S16, S17, S18 + 2 endpoints | M7 | 4 d |
| M9 | Hardening & launch | cron, purge, revalidate, a11y, e2e | M8 | 4 d |

Total ≈ 41 engineering days, plus content. **Content is the critical path.** Do not start M7 before dossier #6 is verified.

---

## M0 · Foundation & contracts

**Goal:** a repo where an unsafe place cannot exist and an unsafe coordinate cannot leak.

**Ships:** Next.js app skeleton · full Drizzle schema · `publishable_place` / `public_place` / `is_recommendable` · `publishable()` / `recommendable()` · fixtures + parity tests · tokens page · `/api/health` · CI.

**Files**

```
package.json  tsconfig.json  next.config.ts  drizzle.config.ts  .env.example  .nvmrc
app/layout.tsx  app/page.tsx  app/globals.css  app/tokens.css
app/_design/tokens/page.tsx  app/api/health/route.ts
lib/env.ts  lib/env.public.ts  lib/taxonomy.ts  lib/types.ts  lib/dates.ts  lib/geo.ts
lib/publishable.ts  lib/recommendable.ts
db/client.ts  db/schema/{index,geo,place,town,identity,telegram,trip,signals,views}.ts
db/migrations/{0000_extensions,0001_core,0002_views}.sql
db/fixtures/places.ts  scripts/{migrate,seed-fixtures,check-publishable}.ts
tests/{unit,integration}/…  .github/workflows/ci.yml
```

**Must obey**

- Pins: Next 15.5.29, React 19.3.1, TS 5.9.3, Tailwind 4.3.5, Drizzle 0.45.4, `postgres` 4.1.1 (`prepare: false`), Zod 4.6.7, Vitest 5.1.2.
- `geographyPoint` custom type; 2-hour spike; fallback to `geometry` + `::geography` casts.
- `publishable_place` exposes **only `id`**.
- `public_place` has **no `location`**, **no `publish_site_coordinates`**.
- `is_recommendable` allows `OPEN`, `PERMIT`, in-season `SEASONAL`; excludes `CLOSED`, `RESTRICTED`, non-`SECULAR`, `HAZARDOUS`/`PROHIBITED`, night+WATER/DARK_HISTORY, monsoon+WATER, night+night-driving-ban.
- 180-day boundary is `last_verified_at >= current_date - 180`.
- `/_design/tokens` renders every token, badge, chip, button, type specimen; `noindex`.
- `check:publishable` exits non-zero on any failure.

**Acceptance**

```bash
npm run lint && npm run typecheck
npm run db:migrate
npm run check:publishable          # rejects bad-place, accepts valid fixture
npm run test                       # parity + coordinate-safety tests pass
npm run build
```

**Kickoff prompt**

```
You are building the foundation of "Wild Atlas", a sourced, bilingual (Tamil/English), access-aware travel dossier app for Coimbatore district + 60 km. This module is M0 only: repo, schema, contracts, tokens, CI. There is no application code yet.

STACK (exact pins, do not change): Node 22, Next.js 15.5.29 App Router, React 19.3.1, TypeScript 5.9.3, Tailwind CSS 4.3.5, ESLint 9.39.5, Drizzle ORM 0.45.4, drizzle-kit 0.31.11, postgres 4.1.1 (prepare:false), Zod 4.6.7, Vitest 5.1.2, Playwright 1.65.1.

CREATE:
1. Next.js app with app/, components/, db/, lib/, content/, scripts/, tests/ and the config files. Node engines ">=22 <23".
2. lib/taxonomy.ts as the ONLY source of facet/status/surface strings. Export FACETS (NATURE, WATER, SACRED, HERITAGE, INDUSTRIAL, URBAN, DARK_HISTORY), ACCESS_STATUS (OPEN, SEASONAL, PERMIT, RESTRICTED, CLOSED), SAFETY_CLASS, CULTURAL_STATUS, CONFIDENCE, LAST_MILE_SURFACE, SOURCE_GRADE, TOWN_SERVICE, ROAD_IN, SEASONAL_RISK, LANGUAGES, FACET_META, ACCESS_META, BANNED_UI_STRINGS (Mystery, Hidden Gems, Trending, Adventure).
3. lib/env.ts (Zod, server-only) and lib/env.public.ts (NEXT_PUBLIC_* only). Never read process.env elsewhere.
4. db/schema/geo.ts with a customType geographyPoint returning "geography(Point,4326)". Timebox a spike: drizzle-kit generate must emit geography, an insert must round-trip, ST_X/ST_Y must read, ST_DWithin must use a GiST index. If any step fails, fall back to geometry(Point,4326) plus explicit ::geography casts and record the decision in design.md.
5. Full schema: place, source, claim, image, correction, verification_event, town, place_town, device, telegram_conn, link_token, preference, location_session (NO lat/lon column), notification, trip, trip_stop, signal_daily, discovery_event, candidate, candidate_signal, telegram_update, route_cache, rate_limit, job_run. Use text + CHECK constraints, not Postgres enums. Add place.publish_site_coordinates boolean default true, place.tamil_reviewed_by, town.carrying_capacity_note_en/ta, link_token.attempts, notification.batch_id, preference.last_digest_at, preference.last_digest_geohash5.
6. Migrations: 0000_extensions (postgis, pg_trgm), 0001_core (tables, checks, indexes incl. GiST on place.location and place.access_point, GIN on facets, trigram on name_en/name_ta/name_variants, place_town(town_id, drive_minutes)), 0002_views.
7. publishable_place view exposing ONLY p.id. Enforce: >=1 A/B source, >=2 sources, confidence SOURCED, no unsourced non-lore claim, bilingual name/summary/documented, access_point not null, last_verified_at >= current_date - 180, not (RESTRICTED and publish_site_coordinates), SEASONAL needs both months, non-SECULAR needs narrative_score null, every image has licence and attribution, authored_by not null and not like 'ai%', reviewed_by not null.
8. public_place view: every place column EXCEPT location and publish_site_coordinates, joined to publishable_place. Public queries must use this view only.
9. is_recommendable(p_id uuid, at timestamptz default now(), tz text default 'Asia/Kolkata') returning boolean: OPEN/PERMIT or in-season SEASONAL, safety LOW/MODERATE, cultural_status SECULAR, no night+WATER/DARK_HISTORY, no monsoon(6-9)+WATER, no night+night_driving_banned.
10. lib/publishable.ts and lib/recommendable.ts mirroring the SQL exactly. Contract tests compare TS vs SQL on fixtures at 2026-07-15 12:00 IST, 2026-07-15 20:30 IST, 2026-01-15 20:30 IST, 2026-01-15 10:00 IST.
11. Fixtures: valid-siruvani, no-sources, stale-181, restricted-with-coords, seasonal-no-window, sacred-with-narrative, bad-image, unreviewed, hazardous, closed, active-temple, night-water, monsoon-water, night-driving-ban, no-matrix. Fixtures are seeded only in test/preview.
12. app/tokens.css from the master palette, app/globals.css mapping Tailwind 4 @theme, app/_design/tokens/page.tsx (noindex) showing swatches, type scale EN+TA, five access badges + unknown, seven facet chips, buttons, spacing, sheet outline.
13. app/api/health/route.ts: SELECT 1, returns {ok, db, latencyMs, version, time}, no-store, no schema details.
14. ESLint no-restricted-imports: components/** and app/** (client) may not import db/** or postgres. lib/** may not import db/client except in server-only modules.
15. GitHub Actions CI: install, lint, typecheck, migrate, seed fixtures, check:publishable (before fixtures), build, test.
16. Coordinate-safety test: serialize every public DTO and assert the JSON contains no "location" key and no "publish_site_coordinates".

DO NOT: add auth, booking, payments, Redis, ORM relations on views, a UI component library, dark mode, or any dependency not listed. Do not create a `location` field on any public type.

DELIVER: requirements.md, design.md, tasks.md first. Then implement tasks. Acceptance: npm run lint, typecheck, db:migrate, check:publishable (rejects bad-place), test, build all pass.
```

---

## M1 · Content pipeline + seed

**Goal:** one real dossier in the database, validated at build time, seeded idempotently.

**Ships:** `content/define.ts` · Siruvani dossier · 2 thin dev places · `scripts/seed.ts` · `check:content` · `check:banned` · verification event.

**Files**

```
content/define.ts  content/places/{index,siruvani}.ts  content/towns/index.ts
scripts/{seed,check-content,check-banned-strings}.ts
db/queries/seed.ts
```

**Must obey**

- `definePlace()` parses with Zod and rejects: `RESTRICTED` + `publishSiteCoordinates: true`; non-`SECULAR` + non-null `narrativeScore`; `authoredBy`/`reviewedBy`/`tamilReviewedBy` not matching `^human:`; `SEASONAL` without both months; story >150 English words.
- Every non-lore claim has a `sourceKey` that resolves to a source in the same file.
- `sources.length >= 2` and at least one `A|B`.
- Seed is idempotent: upsert by `slug`, replace child rows in one transaction, write a `verification_event`.
- `check:banned` greps `app/`, `components/`, `content/`, `lib/telegram/` for the four banned strings and exits non-zero.
- Tamil is authored, not translated. `tamilReviewedBy` is required. **If you do not yet have a Tamil reviewer, use `human:pending-tamil-review` and let `check:content` fail in production mode** — do not fake a reviewer.

**Acceptance**

```bash
npm run db:seed && npm run db:seed      # second run changes nothing
npm run check:content
npm run check:banned
psql $DATABASE_URL -c "select count(*) from public_place;"   # 1
```

**Kickoff prompt**

```
You are adding the content pipeline to an existing Next.js 15 + TypeScript + Drizzle + PostGIS repo called Wild Atlas. M0 is complete: lib/taxonomy.ts, db/schema, publishable_place, public_place, publishable() and recommendable() exist. This module is M1 only: typed content, one real dossier, an idempotent seed, and content CI.

CREATE:
1. content/define.ts: a Zod schema placeSeedSchema and a definePlace(input) function. Fields: slug (^[a-z0-9-]+$), name{en,ta}, nameVariants[], summary{en,ta}, story{en,ta}, body{documented,lore,gettingThere,practical} each localized or null (documented required), facets 1-3, accessStatus, safetyClass, culturalStatus, location{lon,lat} (INTERNAL, never a public DTO), accessPoint{lon,lat}, accessPointLabel{en,ta}, seasonStartMonth/seasonEndMonth (required if SEASONAL), accessOpens, accessCloses, closedDays, permitRequired, permitNote, nightDrivingBanned, lastMile{surface,km,minutes,note}, carryingCapacityNote, sources[{key,grade,kind,title,url,retrievedAt,notes}] min 2, claims[{section,en,ta,sourceKey,isFolklore}], images[{url,width,height,license,attribution,sourceUrl}], confidence, narrativeScore, obscurityScore, risingScore, publishSiteCoordinates, authoredBy, reviewedBy, tamilReviewedBy, lastVerifiedAt.
2. definePlace must throw on: RESTRICTED with publishSiteCoordinates true; non-SECULAR with a non-null narrativeScore; an author/reviewer not matching ^human:; SEASONAL missing a month; a non-lore claim whose sourceKey does not resolve; fewer than 2 sources; no A/B source; a story over 150 English words; a missing accessPointLabel.
3. content/places/siruvani.ts: a complete, realistic Siruvani Falls dossier with 2+ sources (at least one grade A or B), 4-6 claims (at least one lore claim with sourceKey null and isFolklore true), accessPoint at the forest checkpost (NOT the falls), lastMile JEEP 4.2 km 25 min, access window 06:00-17:00, permit required, nightDrivingBanned true, bilingual copy, authoredBy human:content-team, reviewedBy human:r.kumar, tamilReviewedBy human:pending-tamil-review, lastVerifiedAt 2026-10-12. Mark clearly in a comment that the Tamil must be reviewed.
4. content/places/index.ts exporting all places; two extra thin dev places (one SEASONAL, one RELIGIOUS_ACTIVE) so list and dossier states can be built. They may be marked DRAFT but must still pass definePlace.
5. scripts/seed.ts: connect with DATABASE_URL_UNPOOLED, for each place upsert by slug inside a transaction, delete and re-insert source/claim/image rows, resolve claim.sourceKey to the inserted source ids, upsert town rows if present, and write a verification_event (CONFIRMED) only when the place is new or changed. Idempotent: running twice must not duplicate rows or change updated_at.
6. scripts/check-content.ts: iterate content/places, run definePlace, assert >=2 sources, >=1 A/B, every non-lore claim has a source, tamilReviewedBy present, lastMile present, restricted places do not publish site coordinates, non-secular places have null narrativeScore, no banned string, slug unique. Exit non-zero with a per-place report.
7. scripts/check-banned-strings.ts: grep app/, components/, content/, lib/telegram/ for "Mystery", "Hidden Gems", "Trending", "Adventure" (case-insensitive, word-boundary) and fail.
8. Add npm scripts: db:seed, check:content, check:banned.

DO NOT: generate descriptions with AI, invent Tamil, add a CMS, add an admin UI, add an images CDN, or write a `location` value into any public view or DTO. Do not add dependencies.

DELIVER requirements.md, design.md, tasks.md first. Acceptance: db:seed twice is idempotent; check:content and check:banned pass; public_place contains exactly the publishable places.
```

---

## M2 · Public read API

**Goal:** the four read endpoints the map and dossier need, with coordinate safety proven by tests.

**Ships:** `GET /api/taxonomy`, `/api/towns`, `/api/places`, `/api/places/{slug}` + DTO mappers + query modules.

**Files**

```
db/queries/{places,dossier,towns}.ts  db/queries/map-*.ts
lib/types.ts (extend)  lib/api/errors.ts  lib/api/respond.ts
app/api/taxonomy/route.ts  app/api/towns/route.ts
app/api/places/route.ts  app/api/places/[slug]/route.ts
tests/integration/{places,dossier,coordinate-safety}.test.ts
```

**Must obey**

- Contracts in `docs/03-API-CONTRACTS.md` §5 (01–05). Field names are fixed.
- `public_place` only; explicit column lists; `ST_X/ST_Y(access_point::geometry)`.
- `town` selects never include `location`.
- `limit` clamped to 200; every list has `LIMIT`.
- Errors use the shared envelope; 404 for unknown **or** unpublished; 410 only for a retired place.
- `verifiedBy` strips the `human:` prefix.

**Acceptance**

```bash
npm run test -- tests/integration
curl -s localhost:3000/api/places | jq '.count, (.places[0] | keys)'
curl -s localhost:3000/api/places/siruvani-falls | jq '.place.sources | length'
curl -s localhost:3000/api/towns | grep -c location    # 0
```

**Kickoff prompt**

```
You are adding the public read API to an existing Next.js 15 App Router + TypeScript + Drizzle + Neon PostGIS repo called Wild Atlas. M0 (schema, views, contracts) and M1 (seeded content) are complete.

CONTRACT (do not rename fields): implement exactly these four endpoints from docs/03-API-CONTRACTS.md:
- GET /api/taxonomy?lang=  -> {lang, facets[], accessStatuses[], surfaces[], services[], corridors[]} generated from lib/taxonomy.ts, with corridor place counts from public_place.
- GET /api/towns?eligible=true&lang= -> {count, towns[{slug,name,character,elevationM,stayCount,services,roadIn,seasonalRisk,isGateway,lastVerifiedAt,matrix{computedAt,stale}}]}. NEVER select town.location.
- GET /api/places?town=&within=&facets=&bbox=&limit=&lang= -> {count, filter, places[PlaceCard], meta{generatedAt,matrixStale,clamped}}. PlaceCard = {slug,name{en,ta},summary{en,ta},facets,accessStatus,accessPoint{lon,lat},accessPointLabel{en,ta},lastVerifiedAt,thumbnailUrl,distance{kind:"ROAD",roadKm,driveMinutes,fromTown,computedAt}|{kind:"CROW",crowM}|{kind:"UNKNOWN"}|null}.
- GET /api/places/{slug}?lang= -> {place:Dossier, lang}. Dossier = {slug,name,summary,story,body{documented,lore,gettingThere,practical},facets,accessStatus,accessPoint,accessPointLabel,safetyClass,culturalStatus,confidence,lastVerifiedAt,verifiedBy,sources[],claims[],images[],baseTowns[],lastMile{surface,km,minutes,note},accessWindow{opens,closes,closedDays,permitRequired,permitNote,nightDrivingBanned,seasonStartMonth,seasonEndMonth},carryingCapacityNote,narrativeScore}.

RULES:
1. Public queries read the public_place view only, never the place table.
2. Dossier uses four explicit selects in Promise.all (place, sources, claims+images, baseTowns). Base towns: join place_town to town, stay_count>=3, services contains FUEL, road_in in (PAVED,GHAT), order by drive_minutes, limit 3. Select town columns explicitly; never town.location.
3. PlaceCard.distance is null when no town is given. When town+within are given, join place_town and return kind ROAD. If the town has no place_town rows, return 422 MATRIX_UNAVAILABLE.
4. Use ST_X(access_point::geometry), ST_Y(access_point::geometry) as numbers; convert Postgres numerics to JS numbers; dates to YYYY-MM-DD; timestamps to ISO Z.
5. Strip the "human:" prefix from verifiedBy.
6. Shared error envelope {error:{code,message,details?,requestId}} and shared codes VALIDATION_FAILED 400, NOT_FOUND 404, GONE 410, UNPROCESSABLE 422, INTERNAL 500.
7. Cache-Control exactly as docs/03-API-CONTRACTS.md §1.5.
8. Zod-validate every query param. Unknown facet -> 400. limit clamped to 200.
9. Dossier 404 when the slug is unknown OR not in public_place (never reveal which). 410 only when place.access_status='CLOSED' and confidence='PARTIAL' and a verification_event outcome RETIRED exists.
10. Never use db.query.publicPlace.findFirst (views have no relations).

TESTS: integration tests that assert every response has no "location" key and no "publish_site_coordinates"; towns response has no location; dossier returns >=2 sources; unknown slug -> 404; bad facet -> 400; limit 500 -> clamped.

DO NOT: add write endpoints, auth, pagination cursors, a GraphQL layer, ORM relations on views, or select * from any view. Do not add dependencies.

DELIVER requirements.md, design.md, tasks.md first. Acceptance: npm run test -- tests/integration passes; curl checks above pass.
```

---

## M3 · Map shell

**Goal:** S1, S4, S5 with a real map, real pins, a three-snap sheet, and base-town-first controls.

**Ships:** `/` map home · `MapCanvas` · pins · `BottomSheet` · `PlaceCard` · filter sheet · URL state.

**Files**

```
app/page.tsx  app/(home)/home-shell.tsx
components/map/{MapCanvas,PlacePins,TownPins,ReachHull,SelectedLines}.tsx
components/home/{TopBar,SearchBar,ControlRow,BaseTownSelect,ReachSelect,FilterSheet}.tsx
components/place/{PlaceCard,PlaceCarousel,PlaceList,AccessBadge,FacetChip,StatRow}.tsx
components/ui/{Button,Sheet,Select,Badge,EmptyState,LanguageToggle}.tsx
lib/use-home-state.ts  lib/map/style.ts  lib/map/geojson.ts
public/tiles/coimbatore.pmtiles (gitignored)  scripts/fetch-tiles.ts
```

**Must obey**

- MapLibre + PMTiles loaded lazily; `addProtocol('pmtiles')` once.
- Pins use `accessPoint`. Never `location`.
- Round pins = places, square pins = towns. Colour = status; shape = type.
- Control order: base town → within → facets.
- Sheet snaps 18 / 45 / 85; `Esc` collapses; focus returns.
- No permission prompt on load. No dark mode. No gradient.
- Empty state: `No verified places match. Try a wider reach or another base town.`
- WebGL unavailable → list view, never a blank canvas.

**Acceptance**

```bash
npm run dev
# Playwright: 3+ pins, sheet snaps, base town changes count, Esc collapses
npx playwright test tests/e2e/map.spec.ts
```

**Kickoff prompt**

```
You are building the map shell for Wild Atlas, a bilingual Tamil/English access-aware travel app for Coimbatore district + 60 km. The repo already has M0 (tokens, schema, contracts), M1 (seeded content), M2 (GET /api/places, /api/towns, /api/taxonomy).

BUILD SCREENS S1, S4, S5:
S1 "/" — top bar (wordmark, EN|த toggle, menu: Method/Saved/Settings); search pill; control row [Base town select] [Within 30/60/90] [Filters]; MapLibre map; bottom sheet with three snap points 18%/45%/85%; collapsed header "N verified places within X of Y"; half state horizontal PlaceCard carousel; expanded vertical list.
S4 filter sheet — base town FIRST (native select grouped Gateway/Hill/Cities), then Within segmented 30/60/90, then 7 facet chips, sticky footer "Show N places", Reset. Applying writes URL params q/town/within/facets/place and closes.
S5 preview card — thumbnail or neutral placeholder, bilingual name, max 2 facet chips + overflow, access badge, distance line, verified line, actions Open dossier / Save / Share.

TECH:
1. app/page.tsx is a server component that calls getPlaceCards() and getTowns() and passes serializable DTOs to a client HomeShell. No db import in any client component.
2. MapCanvas is 'use client' and dynamically imported. Lazy-load maplibre-gl, pmtiles, @protomaps/basemaps. Use PMTiles Protocol + maplibregl.addProtocol once at module scope. Style from @protomaps/basemaps layers('protomaps', namedFlavor('light'), {lang:'en'}). Centre [76.9558, 11.0168], zoom 8.6, maxZoom 14.
3. Pins: circles for places coloured by accessStatus (OPEN #1E7A4C, SEASONAL #A06A0B, PERMIT #23558C, RESTRICTED #8C3A23, CLOSED #6B6B6B, unknown #8E918B); squares for towns. Use accessPoint only. Tap pin -> select place -> flyTo -> sheet to 45% and show S5.
4. URL state hook useHomeState parses/writes q, town, within, facets, place, lang with useRouter/useSearchParams. useDeferredValue for search input; useTransition for filter changes.
5. BottomSheet: pointer events with capture, three snaps, keyboard ArrowUp/ArrowDown/Escape, safe-area insets, aria-live polite on the count.
6. PlaceCard must never show crow-flies as drive time. If distance.kind is CROW, label "Straight-line distance"; UNKNOWN -> "Drive time not verified".
7. Empty filter state with the exact copy above plus nearest 3 if available. WebGL failure -> render the list and a short message, no blank canvas.
8. Accessibility: 44px targets, status never colour-only (badge text), focus ring, skip link, map has a list alternative.
9. Analytics: map_view, base_town_change, place_card_open, save, share — only after consent.

DO NOT: add clustering, dark mode, a component library, a state library (Redux/Zustand/SWR), a geolocation prompt on load, hotel data, or a second design system. Do not read the DB from the client. Do not show `location`.

DELIVER requirements.md, design.md, tasks.md first. Acceptance: Playwright map.spec.ts passes; 3+ pins at access points; sheet snaps; base town changes the count; no console errors; 390x844 no horizontal scroll.
```

---

## M4 · Dossier

**Goal:** S6, S8, S19. The reading surface and the trust surface.

**Ships:** `/place/[slug]` 12 sections · correction sheet + API · `/method` · 404/410 · JSON-LD.

**Files**

```
app/place/[slug]/page.tsx  app/place/[slug]/not-found.tsx
app/place/[slug]/opengraph-image.tsx (optional)
components/place/{DossierHeader,StatRow,DocumentedClaims,LoreBlock,GettingThere,BaseTowns,Practical,SensitivityNote,SourcesTable,VerificationBlock,CorrectionSheet,StickyActionBar}.tsx
app/api/corrections/route.ts
app/method/page.tsx  content/method.ts
lib/rate-limit.ts  lib/jsonld.ts
```

**Must obey**

- Fixed section order 1–12. Stat row always 3 slots; unknown → `UNKNOWN`.
- Every documented/practical claim shows a grade chip. A claim without a source cannot render (the query excludes it and CI fails).
- `What is told` is visually distinct; lore is attributed.
- `culturalStatus !== SECULAR` → sensitivity note; `narrativeScore` never read.
- `This is wrong` always visible; sticky bar: Open in maps · Save · Share · This is wrong. No booking.
- Correction: 5/hour/IP hash, honeypot `website`, 2 000 char cap, no HTML.
- JSON-LD `TouristAttraction` uses `accessPoint`; omit `geo` when restricted.

**Acceptance**

```bash
npm run test -- tests/integration/corrections.test.ts
npx playwright test tests/e2e/dossier.spec.ts
# 12 sections, EN/TA toggle, sources, verification, correction creates a row
```

**Kickoff prompt**

```
You are building the dossier and method screens for Wild Atlas. M0-M3 are complete (schema, content, read API, map shell). Implement S6, S8, S19.

S6 /place/[slug] — server component, revalidate 3600, tag place:<slug>. Call getDossier(slug, lang). Render exactly 12 sections in this order:
1 header (Tamil name, English name, facet chips, access badge, verified badge)
2 one-line hook
3 hero image ONLY if license and attribution exist, otherwise no image block
4 stat row with EXACTLY 3 slots: town->access road km, drive minutes, last mile (km, minutes, surface). Unknown -> "UNKNOWN" in grey, never omit a slot
5 "The Story" (<=150 words, neutral)
6 "What is documented" — each claim with a source grade chip A/B/C/D
7 "What is told" — lore in a tinted block, italic lead, always attributed; visually distinct from section 6
8 "Getting there"
9 "Where to base yourself" — max 3 towns, ranked by drive minutes, each with km, minutes, one character line. Never hotels, prices, ratings, or availability
10 "Practical" — hours, entry, season, what to carry
11 "Sensitivity note" — required when culturalStatus != SECULAR; never render narrativeScore for those
12 "Sources" table (title, type, grade, link, retrieved) + "Verification" block (last verified, by whom, confidence) + "This is wrong"

Sticky mobile action bar: Open in maps (google.com/maps/dir/?api=1&destination=<accessPoint.lat>,<accessPoint.lon>), Save, Share, This is wrong. No booking button.

S8 correction sheet — field picker (accessWindow, location, lastMile, sources, other), textarea max 2000 with counter, hidden honeypot input name="website", POST /api/corrections. Show the localized success message, close the sheet, toast. 429 -> "Too many reports. Try again in an hour."

S19 /method — static page: what verified means, source grades A-D table, fact vs lore rule, the 180-day rule, corrections, what we refuse to publish, privacy, "No AI-written descriptions." Reachable from the menu and every dossier footer.

API: POST /api/corrections exactly per docs/03-API-CONTRACTS.md §6 (10). Zod validation, rate limit 5/hour/IP hash using the rate_limit table, placeSlug must resolve to public_place, channel WEB only, honeypot filled -> 201 and write nothing, message never rendered as HTML.

SEO: generateMetadata with alternates.languages en/ta, canonical, and JSON-LD TouristAttraction using the access point. Omit geo for restricted places. 404 for unknown/unpublished; 410 for retired with nearest 3.

DO NOT: add a booking button, hotel names, weather, comments, a paywall, an account, or AI-written copy. Do not read place.location. Do not add dependencies.

DELIVER requirements.md, design.md, tasks.md first. Acceptance: Playwright dossier.spec.ts passes (12 sections, EN/TA toggle, sources, verification, correction row created); Lighthouse a11y >=95.
```

---

## M5 · Search

**Goal:** S2, S3, S7, S9. Deterministic bilingual search that never returns a blank screen.

**Ships:** intent parser · synonyms · trigram+FTS SQL · 3 endpoints · zero-result nearest 3 · one-shot nearby.

**Files**

```
lib/search/{intent,synonyms,query,rank}.ts
app/api/search/route.ts  app/api/search/suggest/route.ts  app/api/nearby/route.ts
components/home/{SearchOverlay,SuggestList,IntentChips,ResultsHeader,NoResults}.tsx
app/(search)/results.tsx
tests/unit/{intent,synonyms}.test.ts  tests/integration/search.test.ts
```

**Must obey**

- Parser: NFC, lowercase, collapse whitespace, longest synonym first, known names before trigram, never invent a facet.
- Tamil: `to_tsvector('simple', …)` + `pg_trgm`; never translate the query into English.
- Zero results → nearest 3 by `ST_Distance(access_point, town.location)` and the localized message. Never blank.
- Out of region → `OUT_OF_REGION` with the coverage message, no nearest.
- `POST /api/nearby` uses the body, `no-store`, never stores or echoes the coordinate.
- No model calls.

**Acceptance**

```bash
npm run test -- tests/unit tests/integration/search.test.ts
# சிறுவாணி -> siruvani-falls first
# "waterfalls near Valparai" -> intent.facets [WATER], townHint valparai
# qwertyuiop -> zeroResult NO_MATCH + 3 nearest
```

**Kickoff prompt**

```
You are adding search to Wild Atlas. M0-M4 are complete. Implement S2, S3, S7, S9 and three endpoints.

ENDPOINTS (exact contracts in docs/03-API-CONTRACTS.md §5-6):
- GET /api/search?q=&town=&within=&facets=&lang= -> {intent{raw,facets,signals,townHint,placeHint,freeText}, count, places[PlaceCard], zeroResult{reason,message{en,ta},nearest[]}|null, lang}
- GET /api/search/suggest?q=&lang= -> {query, suggestions[{type:"place"|"town"|"facet", slug|null, label, subLabel}]} max 8
- POST /api/nearby body {lat,lon,radiusM,facets?,lang?} -> {inRegion,count,places,hull,meta{radiusM,generatedAt}} with distance.kind CROW. no-store. Never store or echo the coordinate.

PARSER (lib/search/intent.ts, lib/search/synonyms.ts):
Normalize NFC, lowercase, collapse whitespace. Match longest synonym phrase first and remove matched tokens from freeText. Synonyms include waterfall/falls/அருவி/நீர்வீழ்ச்சி -> WATER; temple/கோயில் -> SACRED; fort/கோட்டை -> HERITAGE; forest/jungle -> NATURE; abandoned/dark history -> DARK_HISTORY; hidden/obscure -> OBSCURITY. Match known place and town names and name_variants (exact, then trigram >= 0.4). Never invent a facet from an unknown word.

SQL: public_place + place_town. Rank by GREATEST(similarity(name_en,q), similarity(name_ta,q)) then ts_rank, then last_verified_at desc. Filter facets with && when provided. Filter by town reach when town+within are provided. Tamil uses to_tsvector('simple', ...); never translate Tamil to English. Limit 50.

ZERO RESULTS: if no match, return 200 with count 0 and zeroResult.reason NO_MATCH, the localized message, and up to 3 nearest publishable places (by ST_Distance to the town, or to the region centroid). If the town is outside REGION_BBOX (75.8,10.2,77.8,11.8), return OUT_OF_REGION with the coverage message and nearest []. Never return a blank screen or a 500.

UI:
S2 search overlay — autofocus input, grouped suggestions Places/Towns/Topics, recent searches from localStorage (max 5), Esc returns focus to the pill.
S3 results — intent chips (removable), count line, map with filtered pins, list sorted by drive time, sort control Drive time / Recently verified. Label crow-flies as "Straight-line distance"; label missing matrix as "Drive time not verified".
S7 no results — message + nearest 3 + "Widen to 90 min" / "Search the whole region".
S9 location explainer — only on tap, three bullets (used once, not stored, not tracked in background), Allow once / Choose a base town instead. Denied -> "Location off. Pick a base town — everything still works."

DO NOT: call an LLM, use Elasticsearch, translate the query, store coordinates, add a search index service, or add dependencies.

DELIVER requirements.md, design.md, tasks.md first. Acceptance: unit tests for the parser; integration tests for Tamil exact, phrase, intent, synonym, zero-result, out-of-region, injection ('; DROP TABLE place; -- returns 200 with zero results).
```

---

## M6 · Distance & reach

**Goal:** the three-number model live for 12 places and 22 towns, precomputed.

**Ships:** town registry · matrix batch script · `/api/reach` · reach hull · dossier base-town block · freshness.

**Files**

```
content/towns/{index,*.ts}  22 files or one registry
scripts/compute-matrix.ts  scripts/check-towns.ts
db/queries/{reach,towns}.ts
app/api/reach/route.ts
components/map/ReachHull.tsx  components/place/BaseTowns.tsx  components/home/ReachSelect.tsx
tests/unit/matrix.test.ts  tests/integration/reach.test.ts
```

**Must obey**

- ORS Matrix V2 **batch only**. Chunks ≤20 sources × 25 destinations, sequential with 1.5 s gap, honour 429/`Retry-After`. 500 calls/day, 40/min.
- Convert metres → `road_km` 1 decimal; seconds → `drive_minutes` ceil.
- Upsert `place_town` with `engine='ors-driving-car-v2'`, `computed_at=now()`; write `job_run`.
- `--dry-run`, `--place=`, `--town=`.
- Never call ORS in a page render, search request, or map.
- Eligibility: `stay_count >= 3`, `services @> {FUEL}`, `road_in IN (PAVED,GHAT)`, verified ≤180 days.
- Hull: `ST_ConvexHull(ST_Collect(access_point::geometry))`, `null` under 3 points, label `approximate reach`.
- Stale >120 days → warning + `matrix.stale: true`.

**Acceptance**

```bash
npm run matrix -- --dry-run
npm run matrix
psql $DATABASE_URL -c "select count(*) from place_town;"   # >= 264
curl -s "localhost:3000/api/reach?town=valparai&within=60" | jq '.count, .hullLabel'
npm run test -- tests/unit/matrix.test.ts
```

**Kickoff prompt**

```
You are adding the distance subsystem to Wild Atlas. M0-M5 are complete. This module ships the 22-town registry, the ORS Matrix V2 batch job, /api/reach, the reach hull, and the dossier base-town block.

DATA:
1. content/towns — a typed registry of 22 towns (Coimbatore, Mettupalayam, Karamadai, Perur, Thadagam, Anaikatti, Alandurai, Madukkarai, Pollachi, Anaimalai, Sethumadai, Topslip, Valparai, Aliyar, Palakkad KL, Mannarkkad KL, Sathyamangalam, Bhavani, Avinashi, Sulur, Annur, Coonoor). Fields: slug, name{en,ta}, location{lon,lat} (INTERNAL, never public), population, elevationM, stayCount, character{en,ta}, services[], roadIn, seasonalRisk, isGateway, carryingCapacityNote, lastVerifiedAt. Mark Kerala towns with a state note. Topslip may not qualify as a base town; do not force it.
2. scripts/check-towns.ts validates eligibility (stayCount>=3, services includes FUEL, roadIn PAVED|GHAT, verified <=180 days) and prints eligible/ineligible.

MATRIX JOB (scripts/compute-matrix.ts):
- MatrixProvider interface {name, compute({sources,destinations})}.
- ORS Matrix V2: POST https://api.openrouteservice.org/v2/matrix/driving-car with Authorization: ORS_API_KEY, {locations:[[lon,lat]...], sources:[...], destinations:[...], metrics:["distance","duration"], units:"m"}.
- Chunks of at most 20 sources x 25 destinations. Sequential calls with a 1.5s gap. Honour 429 and Retry-After.
- Convert metres to road_km (1 decimal) and seconds to drive_minutes (Math.ceil).
- Upsert place_town (place_id, town_id, road_km, drive_minutes, engine='ors-driving-car-v2', computed_at=now()).
- Write a job_run row with pair count, call count, errors, duration.
- Flags: --dry-run prints the plan and makes no calls; --place=<slug>; --town=<slug>.
- NEVER call ORS from a page, a route handler at request time, search, or the map.

API: GET /api/reach?town=&within=&facets=&lang= exactly per docs/03-API-CONTRACTS.md §5 (09): {town,withinMinutes,count,places, hull GeoJSON Polygon|null, hullLabel:"approximate reach", matrix{computedAt,stale,engine}}. 404 unknown town, 422 MATRIX_UNAVAILABLE when no rows.

UI:
- S4 reach control enabled only for towns with matrix rows; otherwise show "Drive times for this town are not verified yet".
- S1/S3 selecting a town dims places beyond the threshold and draws the hull at low opacity, labelled "approximate reach".
- S6 base-town block: max 3 towns, ranked by drive minutes, each with km, minutes, one character line, and the footnote "Distance is town centre to access point. Times are driving only." Never hotels.
- Stale matrix (>120 days) shows "last computed" and a warning.

TESTS: metres 34000 + seconds 4800 -> 34.0 km, 80 min; 4801 s -> 81 min; no matrix row -> excluded from time filters and labelled "Drive time not verified"; 2 hull points -> hull null; 4 eligible towns -> 3 rendered; stale 121 days -> warning.

DO NOT: route at request time, self-host OSRM, show hotels/prices, add a routing SDK, or add dependencies beyond the ORS HTTP call.

DELIVER requirements.md, design.md, tasks.md first. Acceptance: matrix dry-run, a real run producing >=264 rows, /api/reach 200 with hull, unit tests pass.
```

---

## M7 · Telegram

**Goal:** S10–S15. Link, live location, digest, feedback, settings — with the budget and the privacy rules enforced.

**Ships:** 5 endpoints · webhook + `after()` · link handshake · budget · digest · templates · bot commands.

**Files**

```
lib/telegram/{api,update,link,budget,recommend,process,templates,commands}.ts
app/api/telegram/{link,link/status,unlink,webhook}/route.ts
app/api/preferences/route.ts
app/settings/{telegram,alerts}/page.tsx
components/settings/{TelegramLinkCard,CodeDisplay,AlertSettings,RadiusSelect,QuietHours}.tsx
scripts/telegram-set-webhook.ts
tests/unit/{budget,templates,link}.test.ts  tests/integration/webhook.test.ts
```

**Must obey**

- Two-step link: token in deep link, 4-char code only on the web page, 5-min TTL, 3 attempts, `chat_id` from the update only.
- Webhook: timing-safe secret compare, 1 MB body cap, insert `update_id` + kind only, return 200 immediately, process in `after()`. Never PostGIS/routing in the request.
- `recommendable()` before scoring. `CLOSED`/`RESTRICTED` never candidates.
- Budget order: disabled → quiet → paused → home 15 km without trip → 3/day → 30-min batch defer → 7-day place suppression → radius → recommendable → send.
- Digest default: one message, up to 3 places. Max 3/day. `batch_id` groups rows.
- Caption ≤900 chars (hard 1 024). HTML parse mode. `disable_web_page_preview`.
- No coordinates in `notification`, `telegram_update`, or logs. Distance band only.
- Region gate bbox `75.8,10.2,77.8,11.8`; outside → planning-mode message, no notification row.
- Bot cannot start live location. Say so. Server expiry: 5 min without an update.
- `TELEGRAM_SEND_ENABLED=false` kill switch.

**Acceptance**

```bash
npm run test -- tests/unit/budget.test.ts tests/unit/templates.test.ts
npm run test -- tests/integration/webhook.test.ts
npm run telegram:set-webhook
# real phone: link <60s, /nearby, digest, feedback, /stop
```

**Kickoff prompt**

```
You are adding Telegram to Wild Atlas. M0-M6 are complete. Implement S10-S15 and the Telegram endpoints.

LINK (two-step):
POST /api/telegram/link -> {token,code,deepLink,expiresIn:300,expiresAt,botUsername}. Generate a 32-byte random token, store ONLY sha256(token) in link_token with a 4-char code from ABCDEFGHJKLMNPQRSTUVWXYZ23456789, expires_at now+5min, attempts 0. Invalidate previous unused tokens for the device. Return the token once.
POST /api/telegram/link/status body {token} -> {status:PENDING|LINKED|EXPIRED|INVALID,expiresAt,linkedAt,botUsername}. NEVER return chat_id.
POST /api/telegram/unlink -> {unlinked,notificationsEnabled:false}; set telegram_conn.is_active=false, preference.notifications_enabled=false.
Bot /start <token>: hash the token, find an unused unexpired row, bind chat_id FROM THE UPDATE to a PENDING telegram_conn, ask for the 4-char code. Wrong code increments attempts; 3 wrong attempts invalidate. A bare /start with no token explains linking from the web. A forwarded deep link alone never binds.

WEBHOOK POST /api/telegram/webhook:
- Compare X-Telegram-Bot-Api-Secret-Token to TELEGRAM_WEBHOOK_SECRET with timingSafeEqual; 403 otherwise.
- Reject non-POST, >1MB, non-JSON. Parse the Update; ignore malformed with 200.
- Insert telegram_update(update_id, kind) ON CONFLICT DO NOTHING. If the insert returns nothing, return 200 without processing.
- Return 200 immediately; run processTelegramUpdate in after(). runtime nodejs. Store no payload, no text, no coordinates.

PIPELINE:
- Resolve device/chat/preference.
- Commands: /start, /nearby, /radius (5/10/15/25 km), /pause (24h), /resume, /stop, /settings, /help. Do not ship /trending or /discover.
- Location: if inRegion(lat,lon) is false (bbox 75.8,10.2,77.8,11.8), send one planning-mode message and create NO notification row. Otherwise ST_DWithin candidates (limit 20), filter with is_recommendable(id, now, tz), score 0.30 proximity + 0.20 obscurity + 0.15 narrative + 0.15 rising + 0.20 preference, tie-break lower distance then newer last_verified_at, take top 3.
- Route only the winners: route_cache keyed (geohash7, place_id) 30 min, else one ORS pair. Never route 20 candidates.
- Budget in this order: notifications disabled; quiet hours; paused; home <15km and no active trip; sentToday>=3 (count distinct batch_id); lastSentAt <30min -> defer; place sent <7 days; distance>radius; not recommendable; else send.
- One digest message, up to 3 places, batch_id groups notification rows, distance_band only (0-5,5-10,10-15,15-25).
- Live location: a bot cannot start it. /nearby explains Attach > Location > Share Live Location, and offers a KeyboardButton request_location one-shot fallback. Server expiry: last_location_at < now()-5min -> EXPIRED; /nearby on an expired session prompts, never serves stale data.
- Templates: HTML, escape &,<,>, caption budget 900 chars (hard 1024), disable_web_page_preview. Every message has row1 [Explore][Directions] and row2 [👍 Useful][👎 Not now][⛔ Closed][✏️ Wrong]. ⛔ and ✏️ insert correction rows; 👎 suppresses the place 7 days. Answer every callback within 2s.
- Kill switch TELEGRAM_SEND_ENABLED=false skips all outbound sends.

SETTINGS:
GET/PATCH /api/preferences exactly per docs/03-API-CONTRACTS.md §6 (14-15). radiusM only 5000/10000/15000/25000; quiet HH:MM; notificationsEnabled true requires an active connection (422 TELEGRAM_NOT_LINKED). Never return chat_id or home_geohash5.
S15 /settings/alerts — link status, notifications toggle, radius segmented, quiet hours, pause 24h/resume, "1 of 3 digests sent", digest-only note, privacy note, unlink.

TESTS: replayed update_id -> one send; wrong secret -> 403 no DB write; forwarded token without code -> no bind; wrong code 3x -> invalid; 10 pings in 60s -> <=1 message; 6 places in 20 min -> exactly 1 digest; quiet hours -> 0; CLOSED/stale/sacred/night-water/monsoon-water/night-ban -> suppressed; Tamil caption <1024; Chennai -> inRegion false; /nearby on expired -> prompt.

DO NOT: claim the bot starts live location, store coordinates, store message text, auto-publish a correction, add a queue service, or add dependencies beyond grammy.

DELIVER requirements.md, design.md, tasks.md first. Acceptance: unit + integration tests pass; a real phone links in <60s and receives one digest.
```

---

## M8 · Trip Pack & offline

**Goal:** S16, S17, S18. Download on wifi, read in airplane mode.

**Ships:** pack manifest · build script · 2 endpoints · service worker · saved places · offline UI.

**Files**

```
lib/trip/manifest.ts  scripts/build-pack.ts
app/api/trips/route.ts  app/api/trips/[tripId]/route.ts
app/api/trip/[corridor]/pack/route.ts
app/trip/[corridor]/page.tsx  app/saved/page.tsx
components/trip/{PackSummary,DownloadButton,ProgressBar,OfflineBadge}
public/sw.js (or Serwist)  public/offline.html
tests/e2e/offline.spec.ts
```

**Must obey**

- Pack = dossier JSON + cached HTML + corridor PMTiles (max z14) + matrix subset + manifest with sha256.
- Built offline, never at request time. Upload to R2 under a versioned prefix.
- Manifest served `max-age=60, must-revalidate`; assets `immutable`.
- Service worker: app shell SWR; dossier HTML network-first with cache fallback; dossier JSON cache-first; PMTiles **full file cached as ArrayBuffer and sliced for `Range` requests** (206 with `Content-Range`); 416 invalid; API network-only.
- Pack JSON contains no `location`.
- Download prompt on trip declaration, not first session. Show bytes, places, tiles; warn on metered; check `navigator.storage.estimate()`.
- S16 saved is localStorage only: `{slug, name, savedAt}`. No coordinates, no API.

**Acceptance**

```bash
npm run pack -- --corridor=coimbatore-valparai
npx playwright test tests/e2e/offline.spec.ts
# declare trip -> download -> context.setOffline(true) -> dossier + tiles render -> uncached dossier shows the offline message
```

**Kickoff prompt**

```
You are adding the Trip Pack and offline mode to Wild Atlas. M0-M7 are complete. Implement S16, S17, S18.

PACK:
1. lib/trip/manifest.ts defines PackManifest {version, corridor, generatedAt, region{bbox}, dossiers[{slug,pageUrl,jsonUrl,bytes,sha256}], tiles{url,maxZoom,bytes,sha256}, matrix{url,places,towns,bytes}, places[]}.
2. scripts/build-pack.ts: validate corridor in (coimbatore-valparai, coimbatore-anaikatti, coimbatore-topslip); query publishable places inside the corridor buffer; render each dossier JSON from public_place and ASSERT no "location" key; query place_town for the places and corridor towns; extract a z0-z14 PMTiles with `pmtiles extract` (skip with a clear message if the CLI is absent); write the manifest with sha256 for every asset; upload to R2 under /<version>/<corridor>/; write a job_run row. Never build at request time. Never commit PMTiles to git.
3. GET /api/trip/{corridor}/pack returns the manifest exactly per docs/03-API-CONTRACTS.md §7 (18). 404 unknown corridor or no pack.
4. POST /api/trips and GET /api/trips/{tripId} per docs/03-API-CONTRACTS.md §7 (16-17). Idempotent: an identical PLANNED trip for the same corridor returns 200 with the same tripId. Insert trip_stop rows for publishable places in the corridor, ordered by drive minutes. Declaring a trip bypasses the home-radius gate until endsAt.

SERVICE WORKER:
- Precache app shell, fonts, CSS, JS (stale-while-revalidate).
- Dossier HTML: network-first, fallback to cached HTML.
- Dossier JSON: cache-first, versioned by pack.
- PMTiles: fetch the full file once, store the ArrayBuffer in Cache Storage under a versioned key. Intercept Range requests for that URL, slice the ArrayBuffer, return 206 with Content-Range, Accept-Ranges, Content-Length. Return 416 for invalid ranges. If this is unreliable, ship a lower-zoom extract and say so in design.md — never pretend the map works offline.
- API: network-only with an offline message.
- Manifest: network-first with cached fallback.

UI:
S17 /trip/[corridor] — corridor name, dates, pack summary ("6 dossiers · 38 MB map · 22 towns"), Download pack with progress and cancel, storage estimate, delete pack, "Works in airplane mode." Prompt on declaration, not first session.
S18 offline — thin banner "Offline — showing your saved trip pack.", "Offline copy" badge on cached dossiers, uncached dossier shows "This place is not in your pack.", return online toast without reload. Never a browser error page or a broken image.
S16 /saved — localStorage only, list of saved cards, remove, "Build a trip pack", empty state. Never store coordinates.

TESTS (Playwright): declare a trip, download, setOffline(true), open a cached dossier and assert title, Tamil text, access badge, stat row, sources all render; tiles render or the map hides with a note; open an uncached dossier and assert the offline message; go online and assert recovery without reload. Assert the manifest JSON has no "location".

DO NOT: add payments, a subscription, background sync, a native app, or a second cache library. Do not fetch pack assets at request time.

DELIVER requirements.md, design.md, tasks.md first. Acceptance: offline.spec.ts passes in airplane mode; manifest has no location.
```

---

## M9 · Hardening & launch

**Goal:** the app survives production: cron, purge, rate limits, logs, CSP, e2e, Lighthouse, runbooks.

**Ships:** `/api/cron/telegram`, `/api/cron/purge`, `/api/revalidate` · structured logs · security headers · e2e suite · launch checklist.

**Files**

```
app/api/cron/{telegram,purge}/route.ts  app/api/revalidate/route.ts
lib/{logger,rate-limit,security}.ts  middleware.ts (security headers only)
tests/e2e/{a11y,search,telegram-mock,pack}.spec.ts
docs/runbooks.md
```

**Must obey**

- Cron + revalidate: `Authorization: Bearer CRON_SECRET`, allowlist tags, `no-store`.
- Purge: 90-day sessions/notifications, 1-day expired tokens, 30-day updates, 1-day rate limits. Never purge corrections or verification events.
- Logs: `{level, route, request_id, update_id?, kind?, outcome, latency_ms}`. Never coordinates, chat IDs, tokens, message text, correction text.
- CSP as specified; `frame-ancestors 'none'`, `object-src 'none'`.
- Lighthouse a11y ≥95 on home, dossier, search, method.
- Kill switch tested. Backup restore tested once.

**Acceptance**

```bash
npm run test:e2e
npx lighthouse http://localhost:3000 --only-categories=accessibility --quiet
curl -i localhost:3000/api/cron/purge          # 401
curl -i -H "Authorization: Bearer $CRON_SECRET" localhost:3000/api/cron/purge
```

**Kickoff prompt**

```
You are hardening Wild Atlas for launch. M0-M8 are complete. This module adds operations, security, and the end-to-end suite. No new product features.

ENDPOINTS:
- POST /api/cron/telegram (Bearer CRON_SECRET): expire location_session where last_location_at < now()-5min; flag telegram_update rows unprocessed for >5min; retry eligible notifications. Return {ok,job:"telegram-sweeper",scanned,expiredSessions,stuckUpdates,durationMs}.
- POST /api/cron/purge (Bearer CRON_SECRET): delete location_session and notification older than 90 days, link_token expired >1 day, telegram_update older than 30 days, rate_limit older than 1 day. Never delete correction or verification_event. Return {ok,job:"purge",deleted{...},durationMs}.
- POST /api/revalidate (Bearer CRON_SECRET): body {tags[]}; allowlist ^place:[a-z0-9-]+$ plus places, towns, taxonomy; return {ok,revalidated[]}.
All three: no-store, 401 without/with wrong bearer, Zod-validated bodies, no stack traces.

SECURITY:
- middleware.ts sets CSP (default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: <R2> <POSTHOG>; font-src 'self' <R2>; connect-src 'self' <R2> <POSTHOG>; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'), X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy geolocation=(self).
- lib/logger.ts: structured JSON logs with request_id; never log coordinates, chat_id, tokens, message text, correction text, or the DATABASE_URL.
- lib/rate-limit.ts: fixed-window using the rate_limit table (no Redis), returning X-RateLimit-* and Retry-After.
- Verify the kill switch TELEGRAM_SEND_ENABLED=false stops all outbound Telegram sends.
- Verify every public response still has no "location" key (run the contract test).

TESTS (Playwright):
- a11y: axe on /, /place/siruvani-falls, /?q=waterfall, /method — no critical violations.
- mobile: 390x844, no horizontal scroll, 44px targets.
- search: Tamil exact, intent, zero-result nearest 3.
- telegram-mock: mocked webhook replay -> one send; wrong secret -> 403.
- pack: declare, download, offline, recover.
- Lighthouse accessibility >=95 on the four pages.

DOCS: docs/runbooks.md with: bot compromised, bad recommendation sent, site coordinates leaked, ORS outage, R2 outage, Neon outage, publishable check fails, restore from backup. Each with the exact first action.

DO NOT: add a new feature, a new page, an admin UI, Redis, Sentry unless already configured, or a dependency not in the locked stack. Do not weaken the CSP to make a third-party script work.

DELIVER requirements.md, design.md, tasks.md first. Acceptance: full e2e green, axe clean, Lighthouse a11y >=95, cron 401/200 verified, kill switch verified.
```

---

## 2. Copy-paste index

| Module | Paste this into Kiro |
|---|---|
| M0 | M0 kickoff prompt (schema + contracts) |
| M1 | M1 kickoff prompt (content + seed) |
| M2 | M2 kickoff prompt (read API) |
| M3 | M3 kickoff prompt (map shell) |
| M4 | M4 kickoff prompt (dossier) |
| M5 | M5 kickoff prompt (search) |
| M6 | M6 kickoff prompt (distance) |
| M7 | M7 kickoff prompt (Telegram) |
| M8 | M8 kickoff prompt (Trip Pack) |
| M9 | M9 kickoff prompt (hardening) |

**If Kiro asks for context you did not give it:** point it at `docs/03-API-CONTRACTS.md` for that module's endpoints and at `docs/01-SCREENS.md` for that module's screens. Do not paste the whole project.
