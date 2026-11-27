# Wild Atlas — Product Skeleton v2

**Status:** Planning document. Supersedes the phased plan, stack, and monetisation sections of `deep-research-report.md`.
**Scope:** Coimbatore district + 60 km radius (Kongu Nadu, Anaimalai, Palakkad gap).
**Constraint:** Solo builder, TypeScript end-to-end.
**Date:** November 2026.

---

## 1. Decisions locked

| Decision | Choice | Consequence |
|---|---|---|
| Builder | Solo, TypeScript end-to-end | One language, one deployable, one database. No Spring Boot, JWT server, Redis, ELK, or microservices. |
| Launch wedge | Coimbatore + surrounding district | Corpus is regional, not national. Density over breadth. |
| Revenue | DMO partnership **and** consumer subscription | Sequenced, not simultaneous. DMO money funds the corpus; the corpus makes the subscription worth paying for. |
| Core promise | Sourced local discovery, not algorithmic popularity | Editorial work is the product. |

**The one rule that protects both revenue lines:** a tourism-board deal is a flat regional sponsorship. It is never pay-for-placement. The moment a place appears because someone paid, the trust premise and the subscription both die.

---

## 2. What this product is

A map-first field companion for the Coimbatore region that answers one question: *what is genuinely worth a detour near me, and can I trust what I'm reading?*

Every place is a **dossier**: coordinates, access status, a documented history separated from local lore, a source for every claim, and a date it was last checked.

**This is not:**
- a booking platform
- a social network
- an itinerary planner
- a global POI directory
- a "trending places" feed

Those are deliberate exclusions, not backlog items. Each one dilutes the only thing that makes this defensible.

---

## 3. Why the original plan needed revision

| Original assumption | Reality (verified Nov 2026) | Resolution |
|---|---|---|
| "$200 monthly Google credit" | Discontinued 1 March 2025. Replaced by per-SKU caps: 10k Essentials / 5k Pro / 1k Enterprise per month (India: 70k / 35k / 7k). Text Search Pro ≈ $32 per 1,000 calls; Autocomplete ≈ $2.83 per 1,000. | Drop Google Places at MVP. Use OSM/Overpass, Wikidata, and manual curation. |
| Proximity alerts as flagship feature | Browsers cannot track location while closed. "Last-known location" alerts fire about where the user *was*. | Replace with check-in trip briefings. Revisit geofencing only with a native client. |
| Trend signals from Instagram / TikTok | Instagram: 30 unique hashtags per week. TikTok Research API: academic-only. Google Trends: no official API. | Use Wikimedia Pageviews + first-party events + OSM edit velocity. |
| "Mystery" as a category | In this district, most candidates are living devotional sites. Framing them as haunted is offensive and self-defeating. | `Sacred` is a facet. Narrative scoring applies only to abandoned, disputed, or folkloric-historical sites. |
| One single-select chip row | Mixes type, temporal state, narrative, and visibility into one control. | Three independent layers: facets, signals, status. |
| "Verified content" | No editorial process was specified. | Say **sourced**, with a confidence grade and a `lastVerified` date. |
| 10–15 day MVP with 50 places | 50 sourced, bilingual dossiers is 60–100 hours of research before any code. | Content is the critical path. Phase 0 is a 4-week corpus sprint. |
| Desktop two-column as invariant | The user is on a hill with a phone. | Mobile map + bottom sheet is primary. Desktop is secondary. |

Competitive note: Google shipped **Ask Maps with Gemini on 12 March 2026 (US and India)**, and Maps now surfaces literal **"Local Gems"** and **"Trending"** layers. Generic discovery was commoditised this year. Sourced regional narrative was not.

---

## 4. Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  CLIENT — Next.js PWA                                        │
│  MapLibre + PMTiles · bottom sheet · facet chips · dossiers   │
│  offline pack (service worker) · "this is wrong" button       │
└───────────────────────────┬──────────────────────────────────┘
                            │  HTTPS  (lat, lon, radius, facets)
┌───────────────────────────▼──────────────────────────────────┐
│  APP — Next.js App Router (RSC + server actions)             │
│  /search · /place/[slug] · /trip/[slug] · /admin(intake)     │
│  query understanding · pagination · caching headers          │
└───────────────┬───────────────────────────────┬──────────────┘
                │                               │
   ┌────────────▼─────────────┐    ┌────────────▼─────────────┐
   │  CORPUS — Postgres+PostGIS│    │  SIGNALS — batch         │
   │  place · source · facet   │    │  obscurity · narrative   │
   │  access · verification    │    │  momentum                │
   │  geography(Point,4326)    │    │  (nightly, idempotent)   │
   └────────────▲─────────────┘    └────────────▲─────────────┘
                │                               │
   ┌────────────┴───────────────────────────────┴─────────────┐
   │  CONTENT OPS  (horizontal — the actual moat)             │
   │  Airtable/Sheets → validate → sync → publish → re-verify │
   │  + public correction intake + 90-day recheck queue       │
   └──────────────────────────────────────────────────────────┘
```

**Deliberately stateless location.** The client sends `lat/lon` per request; nothing is stored. This keeps the privacy claim architectural rather than a promise, and avoids DPDP exposure for location history.

### Stack

| Layer | Choice | Rationale |
|---|---|---|
| App | Next.js (App Router) + TypeScript | SSR for dossier SEO pages; RSC for the map shell. |
| DB | Postgres + PostGIS on Neon | `ST_DWithin` is the query engine. No external search service needed under ~5,000 places. |
| ORM | Drizzle | Raw PostGIS SQL without ORM friction. |
| Map | MapLibre GL + Protomaps PMTiles on R2 | No per-load billing, offline-capable, no Google base-map dependency. |
| Tiles source | Protomaps / MapTiler | Never use `tile.openstreetmap.org` in production. |
| Geocoding | Nominatim (self-host) or MapTiler free tier | Avoids Text Search costs. |
| Directions | Deep link `google.com/maps/dir/?api=1&destination=lat,lon` | Free, no API key, no terms exposure. |
| Editorial | Airtable/Sheets → typed sync script | Do not build a CMS before the corpus justifies it. |
| Analytics | PostHog Cloud (free tier) | Event data required from day one for the metrics in §9. |
| Notifications | Telegram Bot API + Resend | Free. Telegram also serves as identity before auth exists. |
| Hosting | Vercel + Neon | Single deploy, preview environments. |

**Estimated cost:** under $40/month through Phase 1.

### Deliberately omitted

Spring Boot · JWT auth server · Redis · ELK · Google Places · Mapbox · vector search · recommendation ML · background geofencing.

Each is either a cost, a legal risk, or a solution to a problem that does not exist at 24 places.

---

## 5. Information architecture

Three independent layers replace the single chip row.

```
FACETS   (multi-select)
         Nature · Water · Sacred · Heritage · Industrial · Urban · Dark History

SIGNALS  (computed badges)
         Obscurity   — how far below mainstream attention
         Narrative   — strength of documented lore/history (never for Sacred)
         Rising      — attention velocity, not raw popularity

STATUS   (editorial badges)
         Access      OPEN · SEASONAL · PERMIT · RESTRICTED · CLOSED
         Verified    12 Nov 2026  (visible on every dossier)
```

`Trending` is not a category. `Hidden Gem` is not a category. Both are outputs of the corpus, not filters over it.

---

## 6. Data model

### Core fields

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `slug` | text | Stable, human-readable URL. |
| `name_en`, `name_ta` | text | Bilingual is mandatory. |
| `location` | `geography(Point,4326)` | GiST indexed. |
| `access_point` | `geography(Point,4326)` | Where you actually park/start; differs from the site for restricted places. |
| `facets` | enum[] | From §5. |
| `access_status` | enum | OPEN / SEASONAL / PERMIT / RESTRICTED / CLOSED. |
| `season_window` | int4range | Month range. Critical in the Western Ghats. |
| `safety_class` | enum | LOW / MODERATE / HAZARDOUS / PROHIBITED. |
| `cultural_status` | enum | SECULAR / RELIGIOUS_ACTIVE / SACRED / SENSITIVE. |
| `confidence` | enum | SOURCED / PARTIAL / UNVERIFIED. |
| `last_verified_at` | date | Drives the visible badge and the recheck queue. |
| `verified_by` | text | Person or process. |
| `obscurity_score` | numeric | Derived. |
| `narrative_score` | numeric | Derived. Null for `SACRED` / `RELIGIOUS_ACTIVE`. |
| `momentum_score` | numeric | Derived. |
| `summary_en`, `summary_ta` | text | ≤ 160 chars. |
| `body_en`, `body_ta` | jsonb | Structured dossier sections (§7). |

### Supporting tables

- `source` — `place_id`, `type`, `title`, `url`, `grade`, `retrieved_at`
- `correction` — `place_id`, `submitted_by`, `field`, `claim`, `status`, `resolved_by`
- `verification_event` — `place_id`, `verified_at`, `verified_by`, `outcome`, `notes`
- `signal_daily` — `place_id`, `date`, `source`, `value` (raw series, never overwritten)

### Rules

1. **No coordinates inside restricted or private land.** Publish the `access_point`, not the site.
2. **No dossier without at least one A or B-grade source** (§7.2).
3. **`last_verified_at` older than 180 days demotes the dossier** in ranking and shows a staleness notice.
4. **Every published claim resolves to a `source` row.** No orphan sentences.

---

## 7. Content operations

This is the subsystem the original document reduced to a single bullet. It is the product.

### 7.1 Pipeline

```
candidate → screen (access, safety, sensitivity) → research
        → draft (bilingual) → source audit → publish
        → 90-day recheck → correct or retire
```

Owner: you. Cadence: 6 dossiers per week in Phase 0, 2 per week thereafter.

### 7.2 Source grading

| Grade | Definition | Usable alone? |
|---|---|---|
| **A** | Primary: official records, temple/estate administration, archaeological survey, gazetteer, peer-reviewed. | Yes |
| **B** | Reputable secondary: established press, published books, government tourism material. | Yes, with attribution |
| **C** | Community testimony: local residents, trekking groups, named blogs. | Only for lore, always labelled |
| **D** | Unsourced folklore, forwarded content, AI summaries. | **Never published** |

### 7.3 Dossier template

```
Title (Tamil / English)
One-line hook                                     [bilingual]
Facets · Access status · Season · Safety · Cultural status
The Story                     ≤150 words, neutral, no hype
What is documented            facts, each with source + grade
What is told                  lore, attributed ("local accounts hold…")
Getting there                 route, last mile, transport, time from Coimbatore
Practical                     timings, entry, best season, what to carry
Sensitivity note              required when cultural_status ≠ SECULAR
Sources                       table: title · type · grade · link · retrieved
Verification                  last verified · by whom · confidence
```

### 7.4 Correction loop

A visible **"This is wrong"** control on every dossier from Phase 0. Routes to `correction`, triaged weekly, and the submitter is credited. This is the cheapest moat available and the only way the corpus stays alive.

---

## 8. Launch corpus — 24 candidates

Every entry below is a **candidate requiring verification**. Nothing here is asserted as fact until it passes §7.2.

### Sacred and folk heritage — frame as devotion and lore, never as "haunted"
1. Perur Pateeswarar Temple — Kanaka Sabhai, Chola-era Kongu heritage
2. Marudamalai Murugan — hill shrine, siddhar cave tradition
3. Koniamman Temple — founding legend of Kovai
4. Eachanari Vinayagar — the idol that reputedly would not be moved
5. Masani Amman, Anaimalai — folk goddess, justice-ordeal tradition
6. Vellingiri Andavar — seven-hill climb and the taboo on the seventh
7. Bhavani Kooduthurai — triveni confluence (day-trip radius)

### Landscape and hidden nature
8. Siruvani and Kovai Kutralam — waterfall and the "sweetest water" claim
9. Monkey Falls, Aliyar
10. Thirumoorthy Falls and cave temple — Athiri muni legend
11. Chinnakallar, Valparai — among the wettest places in India
12. Puthuthottam — lion-tailed macaque and tea-estate ecology
13. Anaikatti–Siruvani corridor — elephant movement, tribal villages
14. Palamalai hills — low-traffic viewpoint
15. Vellalore tank and Noyyal — ancient irrigation, urban ecology

### Abandoned and dark heritage
16. Manjampatti valley — lost settlement inside Anamalai Tiger Reserve. `RESTRICTED`. **No site coordinates published.**
17. Colonial estate bungalows, Valparai / Anaikatti
18. Nilgiri Mountain Railway approach, Mettupalayam — industrial heritage
19. Sathyamangalam–Dhimbam — Veerappan-era history, handled as history, not glorification
20. Kodiveri — Chola-era irrigation engineering

### Urban and institutional curiosity
21. Gass Forest Museum — colonial natural-history collection
22. TNAU campus and botanical garden
23. Isha Dhyanalinga — modern wonder, audience anchor, not mystery
24. Kangeyam and the Kongu cattle heritage

### Why these two entries prove the model

- **Manjampatti** is a place a conventional travel app would happily pin, sending people into a tiger reserve without a permit. Publishing the `access_point` and `RESTRICTED` status instead is the product working correctly.
- **Masani Amman** is a living goddess. Treating her as a "mystery attraction" would be offensive and would cost the local relationships the corpus depends on. `cultural_status = RELIGIOUS_ACTIVE`, no narrative score, lore attributed.

### Two corpus rules that follow

1. **Bilingual is mandatory.** Tamil and English for every dossier. It doubles the SEO surface, it is the only realistic path to local corrections, and it is genuinely hard to fake.
2. **Monsoon is a data problem, not a content problem.** Valparai and the ghat roads close or become dangerous. `season_window` and `access_status` are the differentiators no competitor maintains.

---

## 9. Behaviour loops

| Loop | Trigger | Success state | Handled failure |
|---|---|---|---|
| **Discovery** | Open app or land on SEO page | Map + facets + results | Permission denied → manual location; zero results → nearest-facet suggestion |
| **Inspection** | Card or marker | Dossier read to Practical section | Missing source → dossier not published in the first place |
| **Decision** | Save or directions | Saved locally; deep link opened | No signal → offline pack prompt |
| **Trip** | "I'm going to Valparai" | Briefing + offline pack + 6-site route | Seasonal closure → alternate route surfaced |
| **Correction** | "This is wrong" | `correction` row, credited | Duplicate → merged, submitter notified |
| **Contribution** | Phase 2+ | Local guide submits a candidate | Rejected → reason given, relationship preserved |

There is no alert loop in v2. Proximity notifications return only with a native client and real background permission.

---

## 10. Phases and gates

| Phase | Weeks | Build | Gate to pass |
|---|---|---|---|
| **0 — Corpus + SEO** | 1–4 | 24 bilingual dossiers · map + facets · mobile PWA · SEO pages · correction button · no auth, no signals, no alerts | 500+ organic sessions; >40% of dossier readers reach "Practical". If they don't read, the thesis is wrong. |
| **1 — Field utility** | 5–8 | Offline pack for the Anaimalai/Valparai loop · access status surfaced · save via localStorage → Telegram identity · directions deep link | ≥20% of savers reopen **during** a trip. This is the subscription signal. |
| **2 — Signals + revenue** | 9–12 | Momentum (Wikimedia Pageviews + first-party) · check-in briefings · Telegram channel · DMO pitch with real traffic numbers | One paying DMO conversation, or 1% conversion on the paid offline pack. |
| **3 — Scale** | Month 4+ | Second region (Nilgiris or Palakkad) · native client only if geofencing justifies it · contributor intake | Phase 2 revenue covers content ops for one region. |

**Pricing test in Phase 2:** ₹399/year for offline packs, access status, and trip briefings. Not "ad-free." Not "extra filters."

---

## 11. Metrics and kill criteria

**North Star:** weekly *qualified discoveries* — a dossier opened **and** an action taken (directions, save, share).

| Metric | Target by week 12 |
|---|---|
| Organic sessions / week | 1,500 |
| Dossier completion (reach Practical) | > 40% |
| Zero-result searches | < 8% |
| Save rate per dossier view | > 10% |
| Return-during-trip | > 20% of savers |
| Corrections received / month | > 5 |
| Dossiers with all required fields | 100% |

**Kill criteria — stop and rethink if:**
- Fewer than 25% of 30 interviewees say they would use it on their *next* trip.
- Fewer than 500 organic sessions by week 4 with 24 indexed dossiers.
- Dossier completion below 20% — the content is not the problem the market has.

---

## 12. Risk register

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| 1 | **Corpus decay** — closures, changed timings, privatised land | High | Visible `lastVerified`; 90-day recheck queue; demote stale dossiers. |
| 2 | **Cultural insensitivity** — treating living deities as attractions | High | `cultural_status` gate; no narrative score on active sacred sites; local reviewer per region. |
| 3 | **Legal access** — tiger reserve, private land, trespass | High | `access_status` + `access_point` only; no coordinates in restricted zones; permit guidance published. |
| 4 | **Safety liability** — remote falls, ghat roads, monsoon | High | `safety_class`; seasonal gates; explicit "no facility, no signal" language; no promotion during closure. |
| 5 | **Google commoditisation** — Ask Maps / Local Gems | Medium | Compete on sourced regional depth and Tamil-language authority, not on generic discovery. |
| 6 | **Licensing** — OSM ODbL share-alike; Nominatim and tile usage policies | Medium | OSM for candidate discovery only; write original content; licensed tile provider; self-host geocoder. |
| 7 | **Solo bandwidth** | Medium | Content-first sequencing; no auth, no alerts, no native app before week 9. |
| 8 | **DMO sales cycle** | Medium | Pitch with Phase 0 traffic data, not a deck. Target district administration and TTDC. |
| 9 | **Seasonality** — usage collapses after the trip | Medium | Trip briefings and offline packs create pre-trip and on-trip usage, not just inspiration. |
| 10 | **DPDP Act 2023** | Medium | Stateless location; consent for alerts only; retention limits; grievance contact before launch. |

---

## 13. Non-goals

Explicitly out of scope, and staying out until the conditions are met:

- Booking or payments
- User profiles / social feed
- Itinerary optimisation
- Global or national coverage
- Background geofencing (requires native + explicit permission)
- AI-generated descriptions (verification cost exceeds writing cost)
- Sponsored placement of any kind

---

## 14. Open decisions

1. **Name.** "Wild Atlas" is generic and globally-scoped. A Coimbatore-first brand may convert better locally and rank better in Tamil search. Test before buying a domain.
2. **DMO target.** Coimbatore district administration vs Tamil Nadu Tourism (TTDC) vs a private anchor (estate group, Isha). Each implies a different pitch and different editorial constraints.
3. **Tamil-first or bilingual-first.** Recommendation: Tamil as the default surface, English as a toggle. It is a harder build and a stronger moat.
4. **Auth timing.** Telegram identity is sufficient through Phase 2. Real accounts only when contribution volume demands them.
5. **Native app trigger.** Only when geofenced alerts and offline reliability can be shown to drive paid conversion — not before.

---

## 15. Immediate next artefacts

1. Postgres/PostGIS schema with the §6 fields, constraints, and indexes.
2. Dossier template as an Airtable base with the §7.3 fields and source grading.
3. The first six dossiers — Perur, Marudamalai, Koniamman, Eachanari, Siruvani, Manjampatti — chosen because they cover all three risk classes: active devotion, safe nature, and restricted access.
4. `lastVerified` recheck queue as a simple weekly query.

---

### One-line summary

A sourced, bilingual, access-aware field companion for the Coimbatore region — funded by regional tourism partnerships, monetised later by offline utility, and defended by a corpus that is expensive to verify and impossible to scrape.
