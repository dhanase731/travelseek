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

