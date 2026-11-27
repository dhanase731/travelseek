# WILD ATLAS — MASTER BUILD HANDBOOK

**For:** a developer joining with zero context.
**Goal:** read this one file, then start building without needing the other seven.
**Region:** Coimbatore district + 60 km (Kongu Nadu, Anaimalai, Palakkad gap).
**Stack:** Next.js + TypeScript, Neon Postgres + PostGIS, MapLibre, Telegram.
**Status:** Pre-build. Nothing implemented yet.

---

## 0. How to use this document

| If you want to | Read |
|---|---|
| Understand what we are building and why | §1, §2, §3 |
| Know what's hard and what will bite you | §5 |
| See the system shape | §6, §7 |
| Start coding today | §19, then §20, §21 |
| Know the data rules | §8, §9, §10 |
| Build the Telegram layer | §13 |
| Know what NOT to build | §24 |
| Know who said what and what was overruled | §27 |

**Rule:** if this document and any older file disagree, **this document wins**.

---

## 1. The product in one page

Wild Atlas is a **sourced, bilingual, access-aware field companion** for one region.

Every place is a **dossier**, not a listing:

- coordinates (and a separate **access point**)
- a **base town** with road distance and drive time
- a **last mile** (paved / gravel / jeep / walk) with its own time
- an **access window** (hours, permits, seasonal closure, night-driving ban)
- **documented history** separated from **local lore**, each with a source
- a source grade A–D, a confidence level, and a **last-verified date**
- **Tamil and English**

**The promise:** *every claim is traceable, and you know whether you can actually get in.*

**Not:** a booking site, a social network, an itinerary planner, a global POI directory, a "trending places" feed.

**Why it exists:** Google shipped Ask Maps with Gemini in March 2026, including India, and Maps now has "Local Gems" and "Trending" layers. Generic discovery was commoditised. Sourced regional narrative and verified access were not. That gap is the product.

---

## 2. Decisions locked

| # | Decision | Consequence |
|---|---|---|
| D1 | Solo builder, TypeScript end-to-end | One language, one deployable, one DB. No Spring Boot, JWT server, Redis, ELK, microservices. |
| D2 | Coimbatore + 60 km only | Density over breadth. Ooty is **out** of scope (~90 km). Mettupalayam is in. |
| D3 | Publish **places**, not routes | Safety mitigation is the **unit of publication**: place + access point + base town + access window. Never a bare pin. |
| D4 | Revenue = DMO partnership **then** subscription | DMO funds the corpus; the corpus earns the subscription. Flat regional sponsorship only — **never pay-for-placement**. |
| D5 | No background geofencing on the PWA | Replaced by **Telegram live location**, which is genuine background. |
| D6 | No AI-generated descriptions | Enforced by the publishing contract (§10), not by a prompt. |
| D7 | Tamil authored, not translated | From dossier #1. Translating at the end produces translated marketing. |
| D8 | 12 dossiers in Phase 1, not 24 | 24 in four weeks is arithmetically impossible solo (§5, B11). |

---

## 3. Market reality that shapes the build

| Claim | Reality | Implication |
|---|---|---|
| Google gives $200/month free | Ended **1 March 2025**. Now per-SKU caps: 10k Essentials / 5k Pro / 1k Enterprise per month (India: 70k / 35k / 7k). Text Search ≈ **$32 per 1,000**. | **No Google Places.** OSM/Overpass + Wikidata + manual research. Directions via deep link only. |
| Instagram gives trend data | 30 unique hashtags/week, business account + app review | Unusable for momentum |
| TikTok gives trend data | Research API is academic-only | Unusable |
| Browsers can do proximity alerts | Only while the tab is alive and focused | Use Telegram live location (§13) |
| Offline maps are a nice-to-have | They are **the** feature in the Western Ghats | Trip Pack is core, not polish |

**The comparable that matters:** AllTrails charges **$35.99–79.99/yr** and monetises **offline maps, trail conditions, wrong-turn alerts** — not inspiration. Third-party estimates put it near 6M subscribers and $245–330M revenue, plus B2B data licensing. Lesson: **inspiration is top-of-funnel; utility is the revenue.**

---

## 4. The moat

Not the app. Not the map. Not the bot.

1. **Access status + last-mile + gate timings**, maintained. Nobody does this well.
2. **Narrative provenance** — fact separated from lore, each with a citation and a grade.
3. **The discovery ledger** — an append-only record of *when* each place entered public awareness and on what evidence. Google cannot reconstruct it. Only exists if captured from day one.
4. **Tamil-language authority** — toponym gazetteer + transliteration. Genuinely hard to copy.
5. **Regional density** — 150 excellent places in Coimbatore beats 50,000 scraped globally.

The Telegram bot is **not** the moat. It is the distribution trick that removes the install barrier.

---

## 5. Blind spot register (master)

Every known way this project fails, and what enforces the fix. "Enforced by" is the important column — a rule without an enforcement point is a wish.

### 5A. Corpus and editorial

| # | Blind spot | Consequence | Solution | Enforced by |
|---|---|---|---|---|
| B1 | Rules live in prose | An agent builds a schema where a published place has zero sources | Publishing contract as a database predicate | `lib/publishable.ts` + CI |
| B2 | Corpus decay — closures, timings, privatisation | A stale dossier is worse than none | `lastVerifiedAt` + 90-day recheck queue + visible staleness badge | Weekly SQL job |
| B3 | Circular obscurity — using your own source count | The less you research, the more "hidden" a place looks | Obscurity from **external** documentation only (reviews, photos, articles, Wikidata) | `computeObscurity.ts` |
| B4 | "Rising" not computable at week 5 | A derivative needs history. Week 5 has one snapshot | Start `signal_daily` at week 0; ship **"Newly verified"** badge until 8 weeks exist | `signal_daily` table |
| B5 | 24 dossiers in 4 weeks | 6/wk × 6h = 36h research + 20h build = 56h/wk | **12 dossiers**, 3/week | Phase gate §18 |
| B6 | Tamil translated at the end | Reads as translated marketing; loses local trust | Authored alongside English from dossier #1 | Dossier template |
| B7 | No correction channel | No way to learn about errors | "This is wrong" button in Phase 1; Telegram feedback buttons | §15, §13.4 |
| B8 | Cultural insensitivity | Framing living deities as "haunted" offends the community you need | `culturalStatus`; `narrativeScore` must be NULL for non-secular | §10 predicate |
| B9 | Last mile cannot be computed | Routing engines don't know it's a jeep track | Ground truth only; `UNKNOWN` is a valid value with a visible label | §12.3 |
| B10 | Scout yield ≈ 1 publishable per 1,000 signals | Planning for volume kills the project | Position as research accelerator (6h → 40min per lead) | Phase 5 only |
| B11 | Safety inversion — publishing destroys | The act of publication is the pressure | Access point only; no bare pins; `carryingCapacityNote` | §10 predicate |

### 5B. Geo and distance

| # | Blind spot | Consequence | Solution | Enforced by |
|---|---|---|---|---|
| B12 | Straight-line ≠ travel distance | "7 km" is 50 min; user arrives at a closed gate | Crow-flies filter → route **only the winner** at send time | §12.4 |
| B13 | Last mile ignored | Sedan cannot proceed; user turns back | Two-number model: town→access point, then access point→site | Schema fields |
| B14 | Gate timings treated as metadata | Stale "1h20m" sends someone to a locked gate | `accessOpens/Closes`, `closedDays`, `nightDrivingBanned`, same verification discipline | §9 |
| B15 | Distance has 4 meanings | Ambiguity → support load and distrust | Publish the definition: **town centre → access point** | UI footnote |
| B16 | Outside-region users | A user in Chennai sees "nearest 480 km" and assumes the app is broken | `in_region` flag → planning mode with base-town selector | §12.6 |
| B17 | Matrix drifts from reality | New bypasses, missing ghat links | Quarterly rebuild + 10-pair manual spot check | `compute-matrix.ts` |
| B18 | Selecting 3 base towns is political | Funnels demand; DMO asks why their town is missing | Publish the selection rule on the page | Copy in §12.2 |

### 5C. Telegram and notifications

| # | Blind spot | Consequence | Solution | Enforced by |
|---|---|---|---|---|
| B19 | Single location source (PWA only) | Notification fires only while the user stares at the app | **Dual path**: PWA foreground + Telegram live location background | §13.2 |
| B20 | No notification budget | A drive through Valparai passes 8 places → 8 alerts → mute | Max 3/day, 1 per 30 min, 1 per place per 7 days | `canNotify()` |
| B21 | No trip-intent gate | Urban alerts at home in week 1 → permanent mute | Suppress within 15 km `homeGeohash` unless a trip is declared | `canNotify()` |
| B22 | No signal where it matters | Remote waterfall has no data | **Trip Pack** offline (dossiers + PMTiles); alerts are best-effort | §15 |
| B23 | Caption limit ignored | Photo captions cap at **1024 chars**; the template is ~2× that | Caption budget 900 chars incl. Tamil | Template tests |
| B24 | Rate limits unhandled | ~1 msg/sec/chat; bursts → 429 | Token bucket + `retry_after` backoff | Outbound queue |
| B25 | Webhook retries duplicate | Telegram retries non-200 → duplicate alerts | Idempotency on `updateId`; 200 in <2 s; process async | §13.5 |
| B26 | Link-token forwarding | Attacker binds their chat to your account, receives your alerts | 5-min expiry, single use, **confirmation code in both surfaces** | §13.3 |
| B27 | Session never ends | Tab close fires nothing; `ACTIVE` forever; stale `/nearby` | `visibilitychange` + server heartbeat timeout 5 min | §13.6 |
| B28 | `/trending`, `/discover` premature | With 12 places and no history they return nothing or noise | Ship `/nearby`, `/radius`, `/pause`, `/resume`, `/stop` only | §13.7 |
| B29 | Persona mismatch | At 5 km and 60 km/h the turn-off is already passed | State it: built for walkers, cyclists, people with time | Product copy |
| B30 | Image licensing | CC-BY without attribution is a licence breach | `license` + `attribution` required; **no image if unknown** | §9 |

### 5D. Privacy, security, legal

| # | Blind spot | Consequence | Solution | Enforced by |
|---|---|---|---|---|
| B31 | Trilateration | `(placeId, distanceMeters)` × 3 rows reconstructs a position | Store **distance bands**, never metres; no candidate coords | Schema |
| B32 | "No location history" contradicted by schema | The privacy claim is false | Only sent notifications persist; 90-day purge; aggregate counters | Retention job |
| B33 | Third-party transfer | Coordinates transit Telegram's servers | Disclose in privacy notice; Telegram is **not** your processor | Legal page |
| B34 | Identity undefined | Schema uses `userId`; MVP has no auth | `deviceId` (localStorage) + `chatId` + link token | §13.3 |
| B35 | Legal fear misplaced | The risk is not "defamation for calling a place restricted" | Disclaimer about **no guarantee of access**, landowner takedown path | Terms page |
| B36 | Wrong safety emphasis | Telling someone a place is open when it isn't | `accessStatus` sourced; `UNKNOWN` allowed; "verify before travel" | Dossier copy |
| B37 | DPDP 2023 ignored | India's operative law, not GDPR | Purpose limitation, retention limits, grievance contact | §17 |

### 5E. Product and business

| # | Blind spot | Consequence | Solution | Enforced by |
|---|---|---|---|---|
| B38 | No commercial gate | Week 12 arrives with no next move | DMO pitch at Phase 4 using real traffic data | §18 |
| B39 | Taxonomy drift | Old chip list reappears in every new doc | One `taxonomy.ts`, imported by UI and seed | §8 |
| B40 | No event taxonomy | "Track basic events" is unmeasurable | Fixed list of 9 events | §23 |
| B41 | Feature creep | Booking, itineraries, social feed | Written non-goals | §24 |

---

## 6. System architecture

```
┌───────────────────────────────────────────────────────────────────────┐
│  CLIENT — Next.js PWA (mobile-first)                                  │
│  MapLibre + PMTiles · bottom sheet · facet chips · dossier pages      │
│  offline Trip Pack (service worker + cached dossiers)                 │
│  "This is wrong" button on every dossier                              │
└───────────────┬───────────────────────────────────┬───────────────────┘
                │ HTTPS                             │ Telegram app
                │ (lat/lon per request, stateless)  │ (live location)
┌───────────────▼───────────────────────────────────▼───────────────────┐
│  APP — Next.js App Router (RSC + server actions)                      │
│  /place/[slug]  /region/[slug]  /trip/[slug]  /api/*                  │
│  search · intent resolution · nearby · telegram webhook · prefs       │
└───────┬───────────────────────┬───────────────────────┬───────────────┘
        │                       │                       │
┌───────▼──────────┐  ┌─────────▼─────────┐  ┌──────────▼────────────┐
│ CORPUS           │  │ SIGNALS           │  │ DELIVERY              │
│ Postgres+PostGIS │  │ obscurity         │  │ Telegram Bot API      │
│ place·source·    │  │ narrative         │  │ outbound queue        │
│ claim·town·      │  │ rising            │  │ Resend (email)        │
│ place_town·image │  │ discovery_ledger  │  │ PostHog (analytics)   │
└───────▲──────────┘  └─────────▲─────────┘  └───────────────────────┘
        │                       │
┌───────┴───────────────────────┴───────────────────────────────────────┐
│  CONTENT OPS (horizontal — the actual moat)                           │
│  Airtable/Sheets → validate → sync → publish → re-verify → correct    │
└───────────────────────────────────────────────────────────────────────┘
```

**Two non-negotiable properties:**

1. **Stateless location.** The client sends `lat/lon` per request. Nothing is stored. This makes the privacy claim architectural, not a promise.
2. **The corpus is the only stateful asset.** Everything else can be rebuilt from it.

---

## 7. Stack and cost

| Layer | Choice | Why | Cost/mo |
|---|---|---|---|
| App | Next.js App Router + TypeScript | SSR for dossier SEO; RSC for map shell | $0–20 |
| DB | Neon Postgres + PostGIS | `ST_DWithin` is the query engine | $0–19 |
| ORM | Drizzle | Raw PostGIS SQL without fighting the ORM | — |
| Map | MapLibre GL + Protomaps PMTiles on R2 | No per-load billing; offline-capable | $1–5 |
| Tiles | Protomaps / MapTiler | **Never** `tile.openstreetmap.org` in production | incl. |
| Geocoding | Nominatim self-host or MapTiler | Avoids $32/1k text search | $0 |
| Routing (batch) | OpenRouteService free tier | ~530 pairs, 4× per year | $0 |
| Directions | `google.com/maps/dir/?api=1&destination=lat,lon` | Free, no key, no ToS risk | $0 |
| Editorial | Airtable/Sheets → typed sync script | Don't build a CMS before the corpus justifies it | $0 |
| Analytics | PostHog Cloud free tier | Needed from day one | $0 |
| Alerts | Telegram Bot API | Free; also the background location layer | $0 |
| Email | Resend free tier | Fallback only | $0 |
| Hosting | Vercel | Webhook route on Node runtime | incl. |

**Total: under $40/month** through Phase 2.

**Never introduce:** Spring Boot, a separate auth server, Redis, ELK, a vector database, recommendation ML, background geolocation in the browser.

---

## 8. Taxonomy — single source of truth

Three **independent** layers. Do not merge them. This is the most frequently violated rule in the project's history.

```ts
// lib/taxonomy.ts  ← imported by UI, seed data, and the Telegram templates

export const FACETS = [
  'NATURE', 'WATER', 'SACRED', 'HERITAGE',
  'INDUSTRIAL', 'URBAN', 'DARK_HISTORY',
] as const;

export const SIGNALS = ['OBSCURITY', 'NARRATIVE', 'RISING'] as const;
// computed / editorial — never user-facing filters

export const ACCESS_STATUS = ['OPEN','SEASONAL','PERMIT','RESTRICTED','CLOSED'] as const;
export const SAFETY_CLASS  = ['LOW','MODERATE','HAZARDOUS','PROHIBITED'] as const;
export const CULTURAL_STATUS = ['SECULAR','RELIGIOUS_ACTIVE','SACRED','SENSITIVE'] as const;
export const CONFIDENCE    = ['SOURCED','PARTIAL','UNVERIFIED'] as const;
```

| Layer | Rendered as | Multi-select | Notes |
|---|---|---|---|
| Facets | Chips | Yes | Real types: Nature, Water, Sacred, Heritage, Industrial, Urban, Dark History |
| Signals | Badges | n/a | Obscurity, Narrative, Rising — computed/editorial, **not filters** |
| Status | Badges | n/a | Access + Verified date |

**Banned strings in UI copy and filters:** `Mystery`, `Hidden Gems`, `Trending` as category chips, `Adventure`. Those are the old taxonomy and they conflate the three layers.

**The Sacred rule:** `narrativeScore` is `NULL` whenever `culturalStatus !== 'SECULAR'`. A living deity is never a "Local Legend" badge.

---

## 9. Data model

Postgres + PostGIS. Enums as `text` + `CHECK` for easier migrations.

```sql
-- ─────────────────────────────── CORPUS ───────────────────────────────

create table place (
  id                  uuid primary key default gen_random_uuid(),
  slug                text unique not null,
  name_en             text not null,
  name_ta             text not null,
  name_variants       text[] not null default '{}',   -- transliterations for search
  summary_en          text not null,
  summary_ta          text not null,
  body_en             jsonb not null,                  -- {documented, lore, gettingThere, practical}
  body_ta             jsonb not null,

  location            geography(Point,4326) not null,  -- the site
  access_point        geography(Point,4326) not null,  -- where you actually park/start
  access_point_label_en text,
  access_point_label_ta text,

  facets              text[] not null,
  access_status       text not null check (access_status in
                        ('OPEN','SEASONAL','PERMIT','RESTRICTED','CLOSED')),
  season_start_month  int check (season_start_month between 1 and 12),
  season_end_month    int check (season_end_month between 1 and 12),
  access_opens        time,
  access_closes       time,
  closed_days         text,
  permit_required     boolean not null default false,
  permit_note_en      text,
  permit_note_ta      text,
  night_driving_banned boolean not null default false,

  safety_class        text not null check (safety_class in
                        ('LOW','MODERATE','HAZARDOUS','PROHIBITED')),
  cultural_status     text not null default 'SECULAR' check (cultural_status in
                        ('SECULAR','RELIGIOUS_ACTIVE','SACRED','SENSITIVE')),
  carrying_capacity_note_en text,
  carrying_capacity_note_ta text,

  last_mile_surface   text check (last_mile_surface in
                        ('PAVED','GRAVEL','JEEP','WALK','BOAT')),
  last_mile_km        numeric(5,1),
  last_mile_minutes   int,
  last_mile_note_en   text,
  last_mile_note_ta   text,

  confidence          text not null default 'UNVERIFIED' check (confidence in
                        ('SOURCED','PARTIAL','UNVERIFIED')),
  obscurity_score     numeric(4,3),
  narrative_score     numeric(4,3),
  rising_score        numeric(4,3),

  authored_by         text not null,      -- 'human:<name>' | 'ai' (ai fails the contract)
  reviewed_by         text,
  last_verified_at    date,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index place_location_gix on place using gist (location);
create index place_access_gix   on place using gist (access_point);
create index place_facets_idx   on place using gin (facets);
create index place_fts_idx      on place using gin (
  to_tsvector('simple', coalesce(name_en,'') || ' ' || coalesce(name_ta,'')));

create table source (
  id            uuid primary key default gen_random_uuid(),
  place_id      uuid not null references place(id) on delete cascade,
  grade         text not null check (grade in ('A','B','C','D')),
  kind          text not null,              -- wikipedia | news | gazetteer | book | local
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
  source_id   uuid references source(id),   -- NULL is allowed only for lore
  is_folklore boolean not null default false
);

create table image (
  id           uuid primary key default gen_random_uuid(),
  place_id     uuid not null references place(id) on delete cascade,
  url          text not null,
  width        int, height int,
  license      text,                        -- must be non-null to publish
  attribution  text,                        -- must be non-null to publish
  source_url   text
);

create table correction (
  id           uuid primary key default gen_random_uuid(),
  place_id     uuid not null references place(id) on delete cascade,
  field        text,
  message      text not null,
  channel      text not null check (channel in ('WEB','TELEGRAM')),
  submitted_by text,
  status       text not null default 'OPEN' check (status in
                 ('OPEN','ACCEPTED','REJECTED','DUPLICATE')),
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

-- ─────────────────────────── SIGNALS / LEDGER ─────────────────────────

create table signal_daily (
  place_id   uuid not null references place(id) on delete cascade,
  date       date not null,
  source     text not null,      -- wikipedia | youtube | reddit | news | first_party
  value      numeric not null,   -- raw series, never overwritten
  primary key (place_id, date, source)
);

create table discovery_event (       -- the licensable asset
  id                  uuid primary key default gen_random_uuid(),
  place_id            uuid not null references place(id),
  entered_awareness_at date not null,
  evidence            jsonb not null,   -- signal snapshot
  verified_at         date,
  published_at        date
);

-- ───────────────────────────── GEO / DISTANCE ─────────────────────────

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
  engine         text not null,      -- e.g. 'ors-driving-car'
  computed_at    timestamptz not null default now(),
  primary key (place_id, town_id)
);
create index place_town_reach_idx on place_town (town_id, drive_minutes);

-- ───────────────────────────── IDENTITY ───────────────────────────────

create table device (
  id            uuid primary key default gen_random_uuid(),
  device_uuid   text unique not null,     -- from localStorage
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
  code        text not null,           -- 4-char confirmation code
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
  status           text not null default 'ACTIVE' check (status in
                     ('ACTIVE','EXPIRED','CLOSED'))
  -- deliberately NO lat/lon column
);

create table notification (
  id            uuid primary key default gen_random_uuid(),
  device_id     uuid not null references device(id) on delete cascade,
  place_id      uuid references place(id),
  kind          text not null check (kind in ('DIGEST','SINGLE','TRIP')),
  distance_band text not null check (distance_band in
                  ('0-5','5-10','10-15','15-25')),
  score_terms   jsonb,
  tg_message_id bigint,
  delivery      text not null default 'QUEUED' check (delivery in
                  ('QUEUED','SENT','FAILED')),
  feedback      text check (feedback in ('USEFUL','NOT_NOW','CLOSED','WRONG_INFO')),
  sent_at       timestamptz not null default now()
);
create index notification_budget_idx on notification (device_id, sent_at desc);

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

-- ───────────────────────────── SCOUT ──────────────────────────────────

create table candidate (
  id            uuid primary key default gen_random_uuid(),
  name_variants jsonb not null,
  centroid      geography(Point,4326),
  precision     text check (precision in ('EXACT','APPROX','UNKNOWN')),
  novelty       text check (novelty in ('NEW_TO_CORPUS','KNOWN_LOW_DOC','KNOWN')),
  emergence     numeric,
  status        text not null default 'NEW' check (status in
                  ('NEW','TRIAGED','VERIFYING','VERIFIED','PUBLISHED','REJECTED','QUARANTINED')),
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

**Four hard rules on this schema:**

1. No published dossier without ≥1 A/B source (§10).
2. No coordinates inside restricted or private land — publish `access_point` only.
3. Every `claim` in `documented` and `practical` must have a `source_id`.
4. `last_verified_at` older than 180 days demotes the dossier and shows a staleness notice.

---

## 10. The publishing contract

This is the most important file in the repo. It converts every "do not" in the docs into something the build cannot violate.

```ts
// lib/publishable.ts

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

  const undocumented = p.claims.filter(
    c => c.section !== 'lore' && !c.source_id
  );
  if (undocumented.length) {
    r.push(`${undocumented.length} claim(s) missing a source`);
  }

  const badImages = p.images.filter(i => !i.license || !i.attribution);
  if (badImages.length) r.push(`${badImages.length} image(s) missing licence or attribution`);

  if (!p.authored_by || p.authored_by === 'ai') r.push('must be human-authored');
  if (!p.reviewed_by) r.push('must be reviewed by a human');

  return r.length ? { ok: false, reasons: r } : { ok: true };
}
```

```bash
# scripts/check-publishable.ts   →   npm run check:publishable
# Runs in CI and before every deploy. Exits non-zero on failure.
```

**Why this matters:** an LLM asked to "build a travel app" will produce a schema where a place can be published with no sources. This predicate makes that state unreachable.

---

## 11. The recommendation contract

Used by the nearby endpoint and every Telegram send.

```sql
-- A place may enter the candidate set only if ALL hold.
publishable_ok :=
      confidence = 'SOURCED'
  AND last_verified_at > now() - interval '180 days'
  AND (SELECT count(*) FROM source WHERE place_id = p.id AND grade IN ('A','B')) >= 1;

access_ok :=
      access_status = 'OPEN'
  OR (access_status = 'SEASONAL'
      AND extract(month from current_date)::int
          BETWEEN season_start_month AND season_end_month);

safety_ok :=
      safety_class IN ('LOW','MODERATE')
  AND cultural_status = 'SECULAR'
  AND NOT (night_now AND facets && ARRAY['WATER','DARK_HISTORY'])
  AND NOT (monsoon_now AND facets && ARRAY['WATER'])
  AND NOT (night_now AND night_driving_banned);
```

**Never recommend `CLOSED` or `RESTRICTED` as a visit.** They appear only in the app, under an explicit "not visitable" label.

### Scoring (deterministic, explainable)

```
score = 0.30 * proximity    (1 - clamp(distance / radius, 0, 1))
      + 0.20 * obscurity    (external documentation, inverted)
      + 0.15 * narrative    (editorial 0..1, NULL for sacred)
      + 0.15 * rising       (0.5 neutral until 8 weeks of signal data)
      + 0.20 * preference   (1.0 exact facet match, 0.5 adjacent, 0 none)
```

Tie-break: lower distance, then newer `last_verified_at`.

**Every reason string is generated from the terms that fired.** No model writes copy:

> *"If you like waterfalls, this is the least-documented one within 15 km. Verified 12 Oct 2026. 7 km straight line, about 38 min by road."*

Persist `score_terms` on every notification so "why this?" is always answerable.

---

## 12. Geo and distance subsystem

### 12.1 Precompute, never route at request time

```
PUBLISH TIME (quarterly)
  place × town → ORS matrix → place_town rows

REQUEST TIME
  SELECT * FROM place_town WHERE town_id = $1 AND drive_minutes <= 60
  → indexed read. No routing call. No latency. No vendor dependency.
```

No self-hosted OSRM. ~600 MB extract, 8–16 GB RAM, four runs a year — pure ops burden.

### 12.2 Base towns

Published selection rule — put this on the page:

> *Settlements with at least three registered places to stay, year-round road access, and fuel. Ranked by drive time. Never by commission.*

Candidate registry (verify `stay_count`, `services`, `last_verified_at` before publishing):

| Town | Role |
|---|---|
| Coimbatore | City base, airport, hospitals |
| Mettupalayam | North gateway, NMR |
| Karamadai | West, temple town |
| Perur | Southwest edge |
| Thadagam | Anaikatti road |
| Anaikatti | Closest to Siruvani corridor |
| Alandurai | Foothills, Siruvani road |
| Madukkarai | South, Palakkad road |
| Pollachi | Gateway to Anaimalai |
| Anaimalai | Masani Amman — carrying-capacity note required |
| Sethumadai | Topslip gate, timings critical |
| Topslip | In-reserve, restricted, forest accommodation |
| Valparai | Hill base, most stays, seasonal landslide risk |
| Aliyar | Mid-hill stopover |
| Palakkad (KL) | Cross-border gateway |
| Mannarkkad (KL) | North Kerala approach |
| Sathyamangalam | East, Dhimbam ghat |
| Bhavani | Kooduthurai confluence |
| Avinashi | East, temple |
| Sulur | Airport-adjacent |
| Annur | North highway |
| Coonoor / Kotagiri / Ooty | Nilgiris, 60–90 min from Mettupalayam |

### 12.3 The three-number model

Never show one distance. Show three facts:

```
town → access point : 34 km, 1h 20m
access point → site :  4.2 km jeep track, 25 min
access window       : 06:00–17:00 · permit at gate · no night driving
```

**Definition, published in the UI:** *distance is town centre to access point; times are driving only.*

### 12.4 Route only the winner

```
1. ST_DWithin filter (crow-flies)         → 0–20 candidates, instant
2. recommendable() + score + sort         → 1 candidate
3. ONE routing call (ORS matrix, 1 pair)  → road_km, drive_minutes
4. Cache by (geohash7, place_id) 30 min
5. Send
```

~3 routing calls/day/user. Trivial on a free tier.

### 12.5 Day-reach

"Places within 60 min of Valparai" is a `GROUP BY` over `place_town`. If a shaded polygon is wanted, use the convex hull of reachable places — honest, derived from real routes, no extra engine.

### 12.6 Region gate

```ts
if (outsideBBox(lat, lon, COIMBATORE_BBOX)) {
  return { in_region: false, mode: 'PLANNING' };  // base-town selector pinned open
}
```

Without this, a user in Chennai sees "nearest 480 km" and concludes the app is broken.

---

## 13. Telegram subsystem

### 13.1 Why it exists

Telegram is not a notification channel bolted on. It is two things the PWA cannot be:

1. **The background location layer.** Telegram is a native app with background permission. A bot receives **live location** updates via `edited_message` for up to 8 hours.
2. **Zero-install distribution.** No app store, no account, no download.

That is the sentence for a tourism board: *your destination content reaches tourists before they download anything.*

### 13.2 Dual location path

```
PATH A — FOREGROUND (PWA)
  watchPosition({ enableHighAccuracy: radius <= 5000, maximumAge: 30000 })
  send when movement > 250 m OR elapsed > 60 s
  → updates the in-app map and list

PATH B — BACKGROUND (Telegram live location)
  user taps "Share live location" in the chat
  → edited_message with location updates
  → POST /api/telegram/webhook
  → PostGIS → recommendable() → digest → send
```

**Path B is the product.** Path A is table stakes.

Honest limits: ~1 update per 60–90 s (fine at 10 km, useless at 1 km → minimum radius 5 km); 8-hour cap; user must start it; needs data (hence the Trip Pack).

### 13.3 Identity and linking — no auth

```
device_id    UUID in localStorage     — web identity
chat_id      Telegram chat id         — bot identity
link_token   binds them, 5-min TTL, single use, 4-char code
```

Flow:

```
1. POST /api/telegram/link → { token, code: "4F2A", expires_in: 300 }
2. Web shows: "Open @WildAtlasBot, press Start. Confirm the chat shows 4F2A."
3. User opens t.me/WildAtlasBot?start=<token>
4. Webhook: validate secret header → find unused unexpired token →
   bind chat_id FROM THE UPDATE (never from a request body claim) →
   mark used → reply with the code
5. Both surfaces show 4F2A. Mismatch → unlink.
```

The code defeats a forwarded deep link: the attacker's chat binds, but the code won't match the victim's screen.

### 13.4 Feedback on every message

```
Row 1:  [ Explore ]   [ Directions ]
Row 2:  [ 👍 Useful ] [ 👎 Not now ] [ ⛔ Closed ] [ ✏️ Wrong ]
```

`⛔ Closed` and `✏️ Wrong` write to `correction`. This is the cheapest corpus-maintenance channel in the product — a field report from someone standing at the place.

### 13.5 Webhook hardening

```
setWebhook(url, secret_token = TELEGRAM_WEBHOOK_SECRET)

1. reject if header X-Telegram-Bot-Api-Secret-Token != secret
2. INSERT update_id ... ON CONFLICT DO NOTHING     ← idempotency
3. return 200 immediately (< 2 s)
4. process in after() / queue
5. never run PostGIS + routing inside the webhook request
```

Use `runtime = 'nodejs'`. Telegram retries aggressively on timeout.

### 13.6 Session lifecycle

```
IDLE ──start──▶ ACTIVE ──update──▶ ACTIVE
                  ├─ heartbeat 5 min ──▶ EXPIRED
                  ├─ user /stop ───────▶ CLOSED
                  ├─ live_period ends ─▶ EXPIRED
                  └─ page hidden 5 min ▶ EXPIRED
```

Server-side sweep: `last_location_at < now() - interval '5 minutes'` → `EXPIRED`. `/nearby` on an expired session must prompt to re-share, never serve stale data.

### 13.7 Commands — ship only these

| Command | Ships | Notes |
|---|---|---|
| `/start` | ✅ | Tokenless onboarding supported |
| `/nearby` | ✅ | Requires an ACTIVE session |
| `/radius` | ✅ | 5 / 10 / 15 / 25 km |
| `/pause`, `/resume` | ✅ | |
| `/preferences` | ✅ | |
| `/stop` | ✅ | Explains disconnect |
| `/help` | ✅ | |
| `/trending` | ❌ defer | Needs 8 weeks of signal ledger |
| `/discover` | ❌ defer | Needs preference history + corpus depth |

### 13.8 Notification budget

Evaluated in order:

```
IF quiet hours                → skip
IF paused                     → skip
IF within 15 km home AND no trip → skip
IF sent today >= 3            → skip
IF sent in last 30 min        → defer (batch into digest)
IF this place within 7 days   → skip
IF distance > radius          → skip
IF NOT recommendable(place)   → skip
ELSE send
```

**Digest is the default, not an option.** One message with three places beats three messages.

```
🌿 3 verified places near you
Valparai · within 15 km

1. Puthuthottam — 4.1 km · open
2. Chinnakallar — 9.8 km · open, seasonal note
3. Nallamudi viewpoint — 12.4 km · open

[ Open in Wild Atlas ]  [ Not now ]
```

### 13.9 Telegram's real constraints

| Constraint | Value | Consequence |
|---|---|---|
| Text message | 4096 chars | Long dossiers must be paginated |
| **Photo caption** | **1024 chars** | Budget 900 including both languages |
| Inline keyboard | 8 buttons/row | Two rows is the practical max |
| `parse_mode` | HTML or MarkdownV2 | **Use HTML** — MarkdownV2 escaping is a bug factory |
| Outbound rate | ~1 msg/sec/chat, ~20/sec global | Token bucket + `retry_after` backoff |
| Photo source | Public URL or upload | Serve from R2/CDN |

---

## 14. Search and intent

A query like `"hidden waterfalls near Valparai"` must decompose into three things. This is unspecified in most docs and is the main search risk.

```
1. INTENT   → facet hints      "hidden"→OBSCURITY, "waterfall"→WATER,
                                "haunted"→DARK_HISTORY, "temple"→SACRED
2. PLACE    → geocode hint     "Valparai" → town centroid
3. RADIUS   → default          town → 25 km, GPS → user's preference
```

Implementation, in order of cost:

1. **Postgres FTS** on `name_en`, `name_ta`, and `to_tsvector('simple', ...)`.
2. **`pg_trgm` fuzzy** on `name_variants` — this is what makes Tamil typing work.
3. **Facet mapping** from a small synonym table (fast, no model).
4. **Failure state:** if no result, show the nearest 3 places by distance with "no exact match — did you mean".

**Tamil search is mandatory.** A user typing `சிறுவாணி` must find Siruvani. Store transliterations in `name_variants` and index them.

```sql
create extension if not exists pg_trgm;
create index place_name_trgm_idx on place using gin (name_en gin_trgm_ops);
create index place_name_ta_trgm_idx on place using gin (name_ta gin_trgm_ops);
create index place_variants_trgm_idx on place using gin (array_to_string(name_variants,' ') gin_trgm_ops);
```

---

## 15. UI surfaces

### 15.1 Map + list (primary)

- Mobile-first: full-screen map, draggable bottom sheet.
- Desktop: map + side list.
- Town pins square and muted; place pins round and primary.
- Selecting a place draws lines to its top three towns with minutes labelled.
- Selecting a town dims places beyond the reach threshold and shows a hull.

### 15.2 Dossier page

```
Name (Tamil / English) · facets · access badge · verified badge
One-line hook
The Story              ≤150 words, neutral
What is documented     facts, each with source + grade
What is told           lore, attributed — "local accounts hold…"
Getting there          route, last mile, transport
Where to base yourself 3 towns · km · minutes · character
Practical              timings, entry, best season, what to carry
Sensitivity note       required when culturalStatus ≠ SECULAR
Sources                table: title · type · grade · link
Verification           last verified · by whom · confidence
[ This is wrong ]      ← always visible
```

### 15.3 Search controls

```
[ Search… ]  [ Base town: Valparai ▾ ]  [ within 60 min ▾ ]
Facets: Nature · Water · Sacred · Heritage · Industrial · Urban · Dark History
```

Base town is the highest-value control. More useful than facet chips for anyone actually going somewhere.

### 15.4 Trip Pack

- Downloadable for a corridor (e.g. "Coimbatore → Valparai").
- Contains: dossiers, PMTiles for the corridor (max zoom 14), `place_town` rows.
- Works in airplane mode.
- This is the paid subscription unit later: **₹399/year**.

---

## 16. Content operations

### 16.1 Pipeline

```
candidate → screen (access, safety, sensitivity) → research
        → draft bilingual → source audit → publish
        → 90-day recheck → correct or retire
```

Cadence: 3 dossiers/week in Phase 1, 2/week after.

### 16.2 Source grading

| Grade | Definition | Usable alone? |
|---|---|---|
| **A** | Primary: official records, temple/estate administration, ASI, gazetteer, peer-reviewed | Yes |
| **B** | Reputable secondary: established press, published books, government tourism material | Yes, with attribution |
| **C** | Community: named local residents, trekking groups, blogs | Lore only, always attributed |
| **D** | Unsourced folklore, forwarded content, AI summaries | **Never published** |

### 16.3 Dossier template

See §15.2. Every factual sentence must resolve to a `claim` with a `source_id`.

### 16.4 Recheck queue — the entire content-ops system at this scale

```sql
SELECT id, slug, last_verified_at
FROM place
WHERE last_verified_at < current_date - interval '90 days'
ORDER BY last_verified_at;
```

Run weekly. Ten minutes. This is what prevents the corpus from rotting.

### 16.5 Launch corpus — 12 candidates (verify every one)

**Sacred / folk — frame as devotion and lore, never as haunted**
1. Perur Pateeswarar Temple — Kanaka Sabhai, Chola-era Kongu heritage
2. Marudamalai Murugan — hill shrine, siddhar cave tradition
3. Koniamman Temple — founding legend of Kovai
4. Eachanari Vinayagar — the idol that reputedly would not be moved

**Landscape / hidden nature**
5. Siruvani & Kovai Kutralam — waterfall and the "sweetest water" claim
6. Monkey Falls, Aliyar
7. Thirumoorthy Falls + cave temple — Athiri muni legend
8. Chinnakallar, Valparai — among the wettest places in India

**Abandoned / dark heritage**
9. Manjampatti valley — lost settlement inside Anamalai Tiger Reserve. `RESTRICTED`. **No site coordinates.**
10. Colonial estate bungalows, Valparai / Anaikatti
11. Sathyamangalam–Dhimbam — Veerappan-era history, handled as history, not glorification

**Urban / institutional**
12. Gass Forest Museum — colonial natural-history collection

**Why these two prove the model:**
- **Manjampatti** is where a conventional app would publish a pin into a tiger reserve. You publish an access point and `RESTRICTED`.
- **Masani Amman** (Phase 2) is a living goddess. `RELIGIOUS_ACTIVE`, no narrative score, lore attributed.

---

## 17. Privacy, security, legal

### 17.1 The privacy claim — and its trap

> *"We do not store location history."*

The naive schema breaks this promise. `(place_id, distance_meters, evaluated_at)` × 3 rows trilaterates a user.

**Rules:**

| Store | Instead of | Why |
|---|---|---|
| `distance_band` (`0-5`,`5-10`,`10-15`,`15-25`) | `distance_meters` | Bands don't triangulate |
| Nothing | candidate coordinates | Only the winner survives |
| Aggregate daily counters | one row per evaluation | Removes write amplification |
| Sent notifications only | every evaluation | History = what was sent |
| 90-day purge | indefinite | DPDP purpose limitation |

No `lat/lon` column on `location_session`. Position exists in memory for the duration of a request.

### 17.2 DPDP 2023 (India), not GDPR

- Purpose limitation: location used only to answer "what's near me", now.
- Retention limit: 90 days on notifications; sessions expire in 5 minutes.
- Grievance contact published.
- Consent recorded at the moment of enablement, revocable in one tap.
- **Telegram is a third-party transfer.** Coordinates transit Telegram's servers. Telegram is not your data processor. Disclose it.

### 17.3 Security checklist

```
☑ HTTPS only
☑ Telegram bot token server-side only, never in client bundle
☑ Webhook secret header validated
☑ Link tokens hashed at rest, single-use, 5-min TTL
☑ All inputs validated with zod
☑ Per-device rate limits
☑ No precise coordinates in logs
☑ Admin routes behind a simple allowlist
☑ Dependency audit in CI
```

### 17.4 Legal and safety

- **Terms:** no guarantee of access or conditions; information may be out of date; verify before travel.
- **Takedown path:** landowner or authority can request removal; respond within 7 days.
- **No coordinates** for restricted zones, private land, or sacred interiors.
- **Safety floor:** `HAZARDOUS` never gets a push. No waterfall pushes after dusk. No monsoon waterfall pushes.
- **Carrying capacity:** required note when a base town sits next to an active sacred site.

---

## 18. Build plan

Each stage has a **pass/fail gate**. Do not proceed on a failed gate — change the plan instead.

| Stage | Weeks | Build | Gate |
|---|---|---|---|
| **0 — Foundation** | 1 | Repo, schema, migrations, seed 3 places, `publishable()` + CI, taxonomy module, PostHog events | `npm run check:publishable` correctly rejects a place with 0 sources and accepts a valid one |
| **1 — Corpus + Map** | 2–4 | 12 bilingual dossiers, map + facets, dossier page, Tamil search, "This is wrong", SEO pages | 500 organic sessions **or** 40% of readers reach the Practical section |
| **2 — Field utility** | 5–7 | 22 towns verified, distance matrix, last mile, access window, Trip Pack offline, save (localStorage) | ≥20% of savers reopen **during** a trip |
| **3 — Telegram core** | 8–10 | Bot, link + code, Path A, digest, budget, `/nearby`, `/radius`, `/pause`, feedback buttons | Link completion >60%; "not now" <30%; 10 rapid updates → ≤1 message |
| **4 — Background proximity** | 11–12 | **Path B: live location**, route-the-winner, trip corridor alerts | Alert arrives with the app never opened; mute rate <15% in 7 days |
| **5 — Signals + revenue** | Month 4 | `signal_daily` from week 0 → obscurity; rising only after 8 weeks; DMO pitch with real numbers; paid Trip Pack | One paying DMO conversation **or** 1% paid conversion |

**Critical path is content, not code.** Stage 1 cannot be compressed by writing faster.

**Build Stage 0–3 in parallel with the content sprint.** Do not launch the bot before dossier #6 is verified — a bot with nothing to deliver teaches you nothing.

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

---

## 19. First 48 hours

```bash
# 1. Scaffold
npx create-next-app@latest wild-atlas --typescript --app --tailwind
cd wild-atlas

# 2. Database
#    Create a Neon project, enable PostGIS
psql $DATABASE_URL -c 'create extension if not exists postgis;'
psql $DATABASE_URL -c 'create extension if not exists pg_trgm;'

# 3. Drizzle
npm i drizzle-orm postgres && npm i -D drizzle-kit
#    paste the schema from §9 into db/schema.ts
npx drizzle-kit generate && npx drizzle-kit push

# 4. Taxonomy + contracts (copy from §8, §10)
mkdir -p lib && touch lib/taxonomy.ts lib/publishable.ts

# 5. Seed 3 places
#    Perur, Siruvani, Manjampatti — one of each risk class
#    Run npm run check:publishable → fix until it passes

# 6. Map
npm i maplibre-gl pmtiles
#    Add a Protomaps PMTiles source for Tamil Nadu

# 7. Verify the whole spine
#    Open /place/siruvani → dossier renders from DB → map pin at access point
```

**Definition of done for day 2:** one dossier renders from the database, with a map pin at the **access point**, a verified badge, and a source list.

That single vertical slice proves the entire architecture. Everything after it is repetition.

---

## 20. Repository structure

```
wild-atlas/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                    # map + list
│   │   ├── place/[slug]/page.tsx       # dossier
│   │   ├── region/[slug]/page.tsx      # SEO landing (waterfalls-near-coimbatore)
│   │   └── trip/[slug]/page.tsx        # trip pack
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
│   ├── schema.ts       # §9
│   ├── migrations/
│   └── seed/           # 12 dossiers as typed objects
├── lib/
│   ├── taxonomy.ts     # §8 — single source of truth
│   ├── publishable.ts  # §10
│   ├── recommendable.ts# §11
│   ├── geo.ts          # bbox, haversine, geohash
│   ├── search.ts       # FTS + trigram + intent mapping
│   ├── telegram/       # bot client, templates, queue, rate limiter
│   └── analytics.ts    # the 9 events
├── scripts/
│   ├── sync-airtable.ts
│   ├── compute-matrix.ts
│   ├── check-publishable.ts
│   └── recheck-queue.ts
├── content/            # editorial source of truth (see §16)
└── docs/               # this handbook + older specs
```

**Rule:** `lib/taxonomy.ts` is imported by UI, seed, and Telegram templates. No string literals for facets anywhere else.

---

## 21. Environment

```bash
DATABASE_URL=postgres://...
NEXT_PUBLIC_MAP_STYLE_URL=https://...          # or PMTiles URL
NEXT_PUBLIC_PMTILES_URL=https://...
ORS_API_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
TELEGRAM_BOT_USERNAME=
NEXT_PUBLIC_POSTHOG_KEY=
RESEND_API_KEY=
ADMIN_ALLOWLIST=you@example.com
```

**Never** commit `.env`. **Never** expose `TELEGRAM_BOT_TOKEN` or `ORS_API_KEY` to the client.

---

## 22. Test matrix

```
□ Place with 0 sources → publishable() fails
□ Restricted place → no site coordinates in response
□ Sacred place → narrativeScore is null
□ last_verified_at = 181 days → excluded from recommendable()
□ Waterfall at 20:30 → suppressed
□ Monsoon + waterfall → suppressed
□ Search "சிறுவாணி" → returns Siruvani
□ Search "waterfalls near Valparai" → WATER facet + Valparai radius
□ Search nonsense → "no exact match" + nearest 3
□ Base town change → distances recompute, map hull updates
□ Offline mode → dossiers readable, tiles render from cache
□ Location permission denied → manual base-town fallback, no broken map
□ Tab hidden 5 min → session EXPIRED
□ /nearby on expired session → prompt, never stale data
□ 10 GPS pings in 60 s → ≤1 message
□ 6 places passed in 20 min → exactly 1 digest
□ Webhook replayed with same update_id → 1 send
□ Forwarded link token → code mismatch → no bind
□ Bot blocked → connection inactive, no further sends
□ Photo caption with Tamil → under 1024 chars
□ User in Chennai → in_region false, planning mode
□ Airplane mode → Trip Pack readable
```

---

## 23. Metrics and kill criteria

**North Star:** weekly **qualified discoveries** — a dossier opened **and** an action taken (directions, save, share).

| Metric | Target (wk 12) | Kill |
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

### Event taxonomy (fix this now — nine events)

```
search_performed       {query, result_count, base_town}
facet_toggled          {facet, state}
place_opened           {place_id, from: map|list|search|direct}
dossier_reached        {place_id, section}
town_selected          {town_id, reach_minutes}
directions_clicked     {place_id, base_town}
place_saved            {place_id}
correction_submitted   {place_id, field}
offline_pack_downloaded{region}
```

**The kill criterion that matters:** if >30% of users disable notifications within a week, the proximity model is wrong. Move to trip-only delivery and stop real-time alerts.

---

## 24. What NOT to build

Non-goals. Each has a reason, not a preference.

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

---

## 25. Open decisions

| # | Decision | Recommendation |
|---|---|---|
| O1 | Digest-only, or digest + single alerts? | Digest-only by default; single alerts only on a declared trip corridor |
| O2 | Group trips in Stage 5? | Yes — family travel is the highest-intent use case. One sharer, many readers |
| O3 | Trip Pack prompt timing | On trip declaration (user has wifi and intent), not on first session |
| O4 | Brand name | "Wild Atlas" is generic and global. Test a Coimbatore-first name; Tamil search may reward it |
| O5 | DMO target | District administration vs TTDC vs a private anchor (estate group, Isha) |
| O6 | Tamil-first or bilingual-first UI | Tamil default, English toggle. Harder, stronger moat |
| O7 | WhatsApp fallback | Not now. Telegram skews technical; DMO audiences skew family. Revisit at Stage 5 |

---

## 26. Glossary

| Term | Meaning |
|---|---|
| **Dossier** | A published place record: story, documented facts, lore, access, sources, verification |
| **Facet** | A type: Nature, Water, Sacred, Heritage, Industrial, Urban, Dark History |
| **Signal** | A computed/editorial attribute: Obscurity, Narrative, Rising. Not a filter |
| **Access point** | Where you actually park or start walking — distinct from the site |
| **Last mile** | Access point → site, with surface and time |
| **Access window** | Hours, closed days, permits, seasonal closure, night-driving ban |
| **Base town** | Nearest settlement with stays, fuel, and year-round road access |
| **Trip Pack** | Offline bundle: dossiers + tiles + matrix for a corridor |
| **Scout** | The emergence-detection back office. Produces leads, never publishes |
| **Discovery ledger** | Append-only record of when each place entered public awareness |
| **Publishing contract** | `publishable()` — the predicate that prevents unsourced or unsafe publication |
| **Recommendation contract** | `recommendable()` — the hard gates that prevent bad pushes |

---

## 27. Document lineage

| File | Status | What survived |
|---|---|---|
| `deep-research-report.md` | **Superseded** | Vision, competitor framing. Stack and proximity model rejected |
| `wild-atlas-v2-skeleton.md` | **Current** | Taxonomy, data model, phases, moat |
| `base-towns.md` | **Current** | Town matrix, last mile, access window |
| `trendingplace.md` | **Current** | Scout pipeline, discovery ledger, corrected agent prompt |
| `clarification.md` | **Partial** | Consolidated decisions. Reverted taxonomy and 24-in-4-weeks rejected |
| `telegram.md` | **Partial** | Engineering discipline. Single location source, budget, gates superseded |
| `telegram-proximity-spec.md` | **Current** | Dual location path, all Telegram detail |
| **This handbook** | **Authoritative** | Everything above, reconciled |

**Explicitly overruled:**
- "Mystery / Hidden Gems / Trending" as category chips → three-layer taxonomy
- Proximity alerts via PWA only → dual path with Telegram live location
- 24 dossiers in 4 weeks → 12
- Tamil translated in Phase 3 → authored from dossier #1
- Spring Boot + JWT + Redis + ELK → Next.js + Neon only
- Google Places → OSM/Wikidata/manual
- "Verified content" → "sourced", with grade and date

---

## 28. One paragraph to remember

> Wild Atlas is a sourced, bilingual, access-aware field companion for the Coimbatore region. It publishes **dossiers, not pins** — every claim traceable, every place carrying an access point, a base town, a drive time, a last mile and a gate window. The corpus is the moat; the app is the reading surface; Telegram is the distribution trick that removes the install barrier and supplies the background location the browser cannot. Build depth before breadth, enforce the publishing contract in code, and let the gate numbers decide what happens next.
