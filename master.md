# WILD ATLAS — MASTER BUILD BOOK

**Audience:** one developer, no prior context.
**Deliverable:** build the product by following stages in order.
**Region:** Coimbatore district + 60 km (Kongu Nadu, Anaimalai, Palakkad gap).
**Stack:** Next.js 15 + TypeScript · Neon Postgres + PostGIS · MapLibre + PMTiles · Telegram Bot API.
**Date of this research:** 25 November 2026.
**Status:** pre-build. Nothing implemented.

---

## HOW TO USE THIS BOOK

This file contains three parts. Read them in order the first time; afterwards use it as a reference.

| Part | Contains | Read when |
|---|---|---|
| **PART I — Market research** | Competitor teardowns, measured evidence, pain points, the gap, the unique solution | Before you write any code. This decides *what* to build. |
| **PART II — UI reference & approval flow** | Extracted design tokens, screen-by-screen teardown, the page-by-page build order with approval gates | Before you build any screen. |
| **PART III — Build handbook** | Stages 0–6. Each stage lists MCP tool calls with exact input JSON and expected output JSON, plus a pass/fail gate. | While building. |

**Rule:** if this document and any earlier file in this repo disagree, **this document wins**. Part I contains four findings that correct earlier specs; they are flagged with **[CORRECTION]**.

**The one-sentence product:**
> Wild Atlas publishes *dossiers, not pins* — every claim traceable to a source, every place carrying an access point, a base town, a drive time, a last mile, and a gate window.

---

# PART I — MARKET RESEARCH

## 1. Why this research exists

Earlier documents in this repo asserted things about competitors. Several were wrong. This part replaces assertion with measured evidence, gathered on 25 November 2026.

**Method.** Five competitor products were scraped live (marketing sites, web app screens, Play Store listings). Design tokens were extracted programmatically from the resulting screenshots rather than described from memory. Market facts were verified against primary sources (Google's own blog and pricing pages, Telegram's Bot API reference, live Overpass queries). Where a claim could not be verified, it is marked **UNVERIFIED** and not used to justify a decision.

**The evidence bundle** lives in `.research/`:

```
.research/
├── raw/                    # JSON scrape payloads + markdown
│   ├── ao-home.json        # Atlas Obscura homepage
│   ├── ao-place.json       # Atlas Obscura place page (Gass Forest Museum)
│   ├── at-trail3.json      # AllTrails trail detail (Kalavantin Durg)
│   ├── at-explore.json     # AllTrails map explore (Tamil Nadu)
│   ├── at-plans.json       # AllTrails pricing / feature split
│   ├── at-play.json        # AllTrails Play Store listing
│   ├── zafari-home.json    # Zafari marketing site
│   ├── zafari-play.json    # Zafari Play Store listing
│   └── pinit-explore.json  # PinIt map explore
└── shots/
    ├── CONTACT-SHEET.jpg   # all captures at a glance
    ├── ao-home.jpg, ao-place.jpg
    ├── at-trail.jpg, at-explore.jpg
    ├── at-app-1..8.jpg     # AllTrails mobile screens
    ├── zafari-app-1..3-big.jpg
    └── pinit-explore.jpg
```

---

## 2. Competitor teardowns

### 2.1 Atlas Obscura — the content analog

**What it is:** global catalogue of unusual places, editorial + community, since 2009.

**Measured facts from the scrape:**

- Homepage hero: *"The Definitive Guide to The World's Hidden Wonders."* Single search field, "Place of the Day" feature card, horizontal nav (Places / Foods / Stories / Newsletters).
- Place page structure: breadcrumb → **title** → "Added by {user}" → **Been Here / Want To Go / Added To List** triad → photo block → **About** → free-text prose.
- There is **no** access status, no permit field, no gate timing, no last-mile surface, no drive time, no source grades, no verification date.

**The decisive finding.** One of the 12 places on your own launch list — **Gass Forest Museum, Coimbatore** — has an Atlas Obscura page. It reads:

> *"We've decided not to publish this place on Atlas Obscura."*
> *"No Approved Photos Yet."*
> Been Here: 0 · Want to Go: 0 · Added to List: 0

This is the single most useful piece of evidence in the research. Atlas Obscura — the category leader, the product your own docs call "the content analog" — has a **stub, not a dossier**, for a place in your launch region. It has never been filled in.

**What this means:** the gap is not "Atlas Obscura but for India." The gap is that the dossier format itself — sourced, access-aware, verified, bilingual — has not been applied to this region by anyone, including the company whose entire brand is doing that globally.

**Weaknesses measured:**
- Prose-only: "About" is an unstructured essay. Nothing is machine-checkable, nothing is graded.
- No field utility: no drive time, no gate window, no last mile.
- Coverage is thin outside North America and Europe — a Coimbatore place is a stub with zero photos.
- Trustpilot complaints (scraped) include *"Rubbish site, not fit for purpose against its own set of criteria"* — the "is this still true?" problem is a known complaint, not a hypothesis.

### 2.2 AllTrails — the utility/revenue analog

**What it is:** trail discovery and navigation. The product your docs correctly identify as the revenue lesson: *inspiration is top-of-funnel; utility is the revenue.*

**Measured facts:**

| Fact | Value | Source |
|---|---|---|
| Plus price | **$35.99/yr** | alltrails.com/plans (scraped) |
| Peak price | **$79.99/yr** | secondary press (USA Today, SlashGear) — not on the scraped page |
| Paying subscribers | **1M+** | third-party teardown (search snippet) |
| Monthly visits | ~13.75M | same |
| Profitable since | 2017 | same |

**Paid feature split (scraped from /plans) — this is the business model to copy:**

```
Plus membership includes:
  • Unlimited Map Downloads      → "know where you are, even offline"
  • Trail Conditions             → "trail-specific weather, snow depth"
  • Wrong-Turn Alerts            → "alerts if you go off route"
  • Member Deals
  • Connect Garmin & COROS
```

Nobody pays for the trail descriptions. They pay for **offline maps, current conditions, and safety alerts.** That is the same axis Wild Atlas is built on (Trip Pack, access status, notification budget). The pricing is validated by a $35.99/yr product with a million subscribers on exactly this feature set.

**Place page structure (the pattern worth copying):**

```
Title                          →  breadcrumb
Rating · Difficulty · Location
[Overview] [Conditions] [Reviews] [Nearby]     ← tab bar
Hero image + map thumbnail + photo count
10.3 km  Length │ 901 m  Elevation gain │ ⇄ Out-and-back   ← stat row
Prose description … "more"
─────────── sticky action bar ───────────
[♥ Save]  [Get directions]  [Send to phone]
```

Three things to steal outright:
1. The **stat row** — three numbers, big, labelled, scannable. Wild Atlas's version is *town→access point km*, *drive minutes*, *last mile*.
2. The **sticky action bar** — Save / Directions / Send to phone, always reachable.
3. The **Conditions tab** — a named surface for "is it open right now." This is your access window, already legitimised by a product with 1M subscribers.

**The decisive finding.** The AllTrails map of Tamil Nadu, captured at a zoom showing Coimbatore, Pollachi, Valparai, Anaimalai, Topslip, Palakkad:

> **Zero trail pins across the entire Coimbatore–Anaimalai–Valparai region.**
> The nearest pins are green teddy-bear "family friendly" markers near Salem and one at Silent Valley.

A product with **1M+ paying subscribers and 13.75M monthly visits has no coverage of your region at all.** Not thin coverage. None. The map screenshot is in `.research/shots/at-explore.jpg` and it is worth looking at directly.

**Weaknesses measured:**
- Trail-shaped only. A temple, a museum, an abandoned estate bungalow, a restricted valley — none of it fits "trail."
- English-only. No Tamil.
- No provenance. A description is a description; nothing is graded or dated.
- Monetisation friction is a live complaint: *"AllTrails asks money to download [GPX]… AllTrails is the only company I know that doesn't let you plot routes even though you've paid"* (Trustpilot/Reddit snippets). The lesson cuts both ways — charge for **offline + alerts**, never for the data itself.

### 2.3 Zafari — the "India competitor"

Your deep-research-report lists Zafari as the India-specific competitor: *"GPS-driven Nearby Discovery shows hidden temples, waterfalls… sorted by real road distance."*

**Measured facts:**

| Fact | Value | Source |
|---|---|---|
| Play Store installs | **100+** | play.google.com listing, scraped |
| Rating | not established at this scale | listing |
| Content rating | Everyone · Contains ads · In-app purchases | listing |

**100+ downloads.** This is not a competitor. It is a hobby project with a marketing site that reads better than the product.

**What its actual app looks like (Play Store screenshots, measured):**

- **Home = a dashboard of 9 feature tiles**: SABDHAN SOS, Train Tracker, Flight Tracker, Explore Map, Community, Yatra AI, SOS, Daily Dashboard. "Explore Map" is *one card among nine*.
- **Place page = a generic POI card**: hero photo → "Place" chip → name → state → **weather widget (18°C, Partly cloudy)** → rating → About (one paragraph) → **7-day weather forecast** → Photos ("Be the first to add a photo!") → Rating / Now / Known Spot stat row.
- **Trip planner = a grid of state tiles** with emoji, each showing "N zones."

**What this tells you:**
1. Discovery is not the product's centre. It is one tile in a utilities dashboard. Everything else is SOS, trains, flights, community.
2. The place page is a **weather card**, not a dossier. Weather is the most prominent element — because weather is easy to fetch, and sources/access are hard. That is the exact substitution your product rejects.
3. **"Be the first to add a photo"** — the coverage is so thin that the app asks users to fill it.
4. The taxonomy is flat categories: Temple, Waterfall, Café, Hotel, Viewpoint, Market. No facets/signals/status separation.

**Verdict:** Zafari proves the *demand hypothesis* (someone built it) and disproves the *competitive threat* (100+ installs). It is a useful UI reference for exactly one thing: what your product must **not** look like — a dashboard of tiles where discovery competes with a train tracker.

### 2.4 PinIt — the crowdsourced map analog

**What it is:** free crowdsourced "hidden gems" map.

**Measured facts:**
- The `/explore` page, captured at a UK-wide zoom, shows a **completely empty map**: "No pins found. Oh no, there aren't any pins in this area." and separately "0 pins" in the sidebar.
- Taxonomy is a **flat 13-item chip row**: All · Waterfalls · Beaches · Caves · Castles · Scenic points · Adventure · Historical landmarks · Coves · Tourist attractions · Sea pools · Wild swimming · Reservoirs · Lakes · Nature reserves · Mountain peaks · Cliffs.
- Layout: full-bleed map, left sidebar list, floating zoom controls, bottom "Add one" prompt.
- Tiles: OpenFreeMap / OpenMapTiles / OpenStreetMap.

**What this tells you:**
1. **Crowdsourcing produces an empty map.** This is the cold-start failure, captured in the wild. It directly validates your decision to hand-research 12 dossiers rather than launch a contribution button.
2. The **flat chip row is the taxonomy mistake** your own docs already identify. 17 chips with no hierarchy, mixing type (Waterfalls) with access (Wild swimming) with landform (Cliffs). Your three-layer model (facets / signals / status) exists precisely to avoid this. Seeing it rendered makes the reason obvious.
3. The map-dominant layout is worth copying. The chip taxonomy is not.

### 2.5 Google Maps — the commoditiser

**[CORRECTION]** Verified, 25 Nov 2026:

- **Ask Maps + Immersive Navigation shipped 12 March 2026** — confirmed directly from `blog.google/products-and-platforms/products/maps/ask-maps-immersive-navigation/`, dated Mar 12, 2026. Your doc's date is correct.
- **"Local Gems" and "Trending" are real ranking layers** — confirmed via industry analysis describing Google's three local ranking layers: *"Top Lists (historic standbys), Local Gems (emerging year-over-year favourites), and Trending (highly immediate weekly behavioral spikes)."* Your doc's claim is correct.
- **Gemini-curated result blocks** now appear in Maps for food & beverage searches — confirmed via practitioner reporting. The commoditisation is extending.

**Consequence for the build: nothing changes, and the docs are right.** Generic discovery is commoditised. What Google cannot do:
- Grade a source A–D and show it.
- Separate documented history from local lore, with attribution.
- Publish an access point instead of a site pin for restricted land.
- Tell you the gate closes at 17:00 and the last mile is a jeep track.
- Be authoritative in Tamil for Kongu Nadu toponyms.

Those five things are the entire product.

### 2.6 The competitor matrix

| Capability | Google Maps | Atlas Obscura | AllTrails | Zafari | PinIt | **Wild Atlas** |
|---|---|---|---|---|---|---|
| POI coverage, global | ●●●●● | ●●●○○ | ●●●○○ | ●○○○○ | ●●○○○ | ●○○○○ (by design) |
| **Coverage of Coimbatore–Anaimalai** | ●●●●○ | ●○○○○ (stub) | **○○○○○** | ●○○○○ | ○○○○○ | ●●●●○ (target) |
| Source grading + citation | ○○○○○ | ●●○○○ | ○○○○○ | ○○○○○ | ○○○○○ | ●●●●● |
| Fact vs. lore separation | ○○○○○ | ●○○○○ | ○○○○○ | ○○○○○ | ○○○○○ | ●●●●● |
| Access status + gate window | ●●○○○ | ○○○○○ | ●●○○○ (Conditions) | ○○○○○ | ○○○○○ | ●●●●● |
| Last mile + surface | ○○○○○ | ○○○○○ | ●○○○○ | ○○○○○ | ○○○○○ | ●●●●● |
| Drive time from a base town | ●●●○○ | ○○○○○ | ●●○○○ | ●●●○○ | ○○○○○ | ●●●●● |
| Verified date, visible | ○○○○○ | ○○○○○ | ●●○○○ | ○○○○○ | ○○○○○ | ●●●●● |
| Tamil authority | ●●○○○ | ○○○○○ | ○○○○○ | ○○○○○ | ○○○○○ | ●●●●● |
| Offline field pack | ●●●●● | ○○○○○ | ●●●●● (paid) | ○○○○○ | ○○○○○ | ●●●●○ |
| Zero-install delivery | ○○○○○ | ○○○○○ | ○○○○○ | ○○○○○ | ○○○○○ | ●●●●● |

The row that matters is the second one. Every other product is either deep somewhere else, or empty here.

---

## 3. User pain points — from evidence, not assumption

Each pain below is tied to something observed in the research, not invented.

### P1. "The place was closed when I got there"

**Evidence:** Google Maps routing failures are a documented pattern in Indian media — cars led onto unfinished bridges, tourists sent 60 miles off course, foreign tourists stranded after navigation failed (multiple news sources, Nov 2024–2026). AllTrails charges money specifically for **"Conditions — trail-specific weather, snow depth"** and **"Wrong-Turn Alerts."** A million people pay $35.99/yr for exactly this uncertainty.

**The pain in one line:** you can know a place exists and still not know whether you can get in.

**Wild Atlas answer:** `access_status` + `access_opens/closes` + `closed_days` + `permit_required` + `night_driving_banned`, each sourced and dated, surfaced as a badge on every card.

### P2. "7 km took 50 minutes"

**Evidence:** Zafari's entire homepage pitch is built on this pain: *"real road distance, not aerial guesses. 2.1 km means 2.1 km by road — not a straight line through buildings."* A competitor making this its headline means the pain is real and felt.

**Wild Atlas answer:** the three-number model — town→access point, access point→site, access window. Zafari fixes one of the three (road vs. straight line) and ignores the last mile and the gate.

### P3. "Nobody tells me if the information is true"

**Evidence:** Atlas Obscura's own trust problem — Trustpilot: *"not fit for purpose against its own set of criteria."* Its Gass Forest page is a stub marked unpublished. Reviews, where they exist, are unverifiable.

**Wild Atlas answer:** source grades A–D, a citation per claim, `confidence`, and a visible `last_verified_at`. **No dossier publishes without ≥1 A/B source and ≥2 sources total** — enforced by code, not by an editorial rule.

### P4. "Everything is written for tourists, not for people who live here"

**Evidence:** The Tamil content search returned exactly **three** useful sources for Siruvani: a Tamil Wikipedia article, one local site (`coimbatore.tamilnaducities.in`), and a 1.5K-view YouTube video. Compare that with the volume of English travel content. The information asymmetry is measurable.

**Wild Atlas answer:** Tamil authored alongside English from dossier #1, toponym gazetteer in `name_variants`, `pg_trgm` fuzzy search so typing `சிறுவாணி` finds Siruvani. No competitor has this.

**[FINDING]** Tamil sources *do* exist — this is not the empty-web situation your earlier docs feared. Tamil Wikipedia has a Siruvani article; local Tamil sites carry history and timing details. The constraint is **thin, not absent**: expect 1–3 usable Tamil sources per place, which means the Tamil text must be *authored* from those sources by a Tamil speaker, not machine-translated. This confirms D7 in your build docs.

### P5. "The app I paid for won't let me use my own data"

**Evidence:** AllTrails GPX restriction backlash — *"AllTrails asks money to download them"*, *"the only company I know that doesn't let you plot routes even though you've paid."*

**Wild Atlas answer:** the paid unit is **offline utility** (Trip Pack), never the dossier. Free reading forever. This is also the correct commercial position for a DMO partnership.

### P6. "Hidden gem maps are empty"

**Evidence:** PinIt's explore map, captured, showed **zero pins** with "No pins found." Zafari, with 100+ installs, asks users to "be the first to add a photo."

**Wild Atlas answer:** hand-researched corpus before launch. No contribution button in Phase 1. 12 verified dossiers beat an empty map.

---

## 4. The unique solution

### 4.1 What nobody is doing

Read the matrix row by row. Each competitor is strong on one axis:

- **Google** — coverage and navigation.
- **Atlas Obscura** — narrative, globally, without verification or access.
- **AllTrails** — utility and offline, for trails only, in English, and not here.
- **Zafari** — one good idea (road distance), 100+ installs.
- **PinIt** — a map, empty.

Nobody occupies the intersection of **verified provenance × access reality × regional density × Tamil authority**.

### 4.2 The solution, stated precisely

> **Wild Atlas is a sourced, bilingual, access-aware field companion for one region.** Every place is a dossier: an access point, a base town with drive time, a last mile with surface and time, an access window with hours and permits, documented history separated from local lore — each claim carrying a source grade and a verification date, in Tamil and English.

It is defensible for five reasons, in descending order of durability:

| # | Moat | Why it holds | Who could copy it |
|---|---|---|---|
| 1 | **Access status + last mile + gate timings, maintained** | Requires ground truth and re-verification every 90 days. Google cannot reconstruct gate timings; AllTrails has no people here. | Nobody quickly. It is labour, not code. |
| 2 | **Discovery ledger** — append-only record of when each place entered public awareness | Only exists if captured from day one. Cannot be back-filled. | Nobody, ever, retrospectively. |
| 3 | **Tamil-language authority** — toponym gazetteer + transliteration | Thin source base makes it slow and specialist. | A competitor could, with a Tamil team and 12 months. |
| 4 | **Narrative provenance** — fact/lore split, graded, dated | Requires editorial discipline encoded in the schema. | Anyone willing to do the work. |
| 5 | **Regional density** — 150 excellent places in one district | Depth beats breadth at the point of use. | Anyone local, slowly. |

The Telegram bot is **not** on this list. It is the distribution trick — zero install, background location — that removes the barrier to using the corpus. Say it that way to a tourism board.

### 4.3 The commercial shape the evidence supports

AllTrails proves the model at $35.99/yr × 1M+ subscribers with a feature set of *offline maps + conditions + alerts*. Wild Atlas maps onto it almost exactly:

| AllTrails paid feature | Wild Atlas equivalent | Phase |
|---|---|---|
| Unlimited Map Downloads | **Trip Pack** — dossiers + PMTiles for a corridor, works in airplane mode | 2 |
| Trail Conditions | **Access status** — open/seasonal/permit/closed, gate window, last-verified date | 1 |
| Wrong-Turn Alerts | **Proximity digest** via Telegram live location, with a hard notification budget | 3 |
| — | **Bilingual Tamil dossiers** | 1 |
| — | **Sourced claims with grades** | 1 |

Price the Trip Pack at **₹399/year**. Never paywall the dossier. Never take pay-for-placement.

---

## 5. Findings that change the build

Four things the research corrected. These are the reason this document supersedes the others.

### [CORRECTION 1] OSM/Overpass cannot seed the corpus

Your docs assume OSM/Overpass is the discovery backbone ("OSM for candidate discovery only", "Overpass for features").

**Measured:** a live Overpass query across the Coimbatore–Anaimalai bbox `(10.9, 76.6, 11.5, 77.1)` for `natural=waterfall` returned:

```json
{ "elements": [ { "type": "count", "tags": { "nodes": "0" } } ] }
```

**Zero.** Not "few." Zero waterfalls are tagged in OSM across a region containing Siruvani, Kovai Kutralam, Monkey Falls, Thirumoorthy Falls and Chinnakallar.

**Consequence:** OSM is useful for **basemap geometry and candidate names only**. It is not a seed source for places. The corpus is 100% manual research. Budget accordingly — this is why Phase 1 is 12 dossiers, not 24.

**Also measured:** the public Overpass endpoint (`overpass-api.de`) returned **502 — "at capacity, all query workers busy"** on the first attempt. Mirrors varied: `overpass.kumi.systems` worked; `overpass.private.coffee` and `maps.mail.ru` failed. Any automated harvesting needs backoff-multi-mirror logic or a paid/self-hosted instance.

### [CORRECTION 2] Telegram live location is not hard-capped at 8 hours

Your specs state a hard "8-hour cap" on `live_period` and design the trip flow around it.

**Measured from Telegram's Bot API reference:**

> *"`live_period` — New period in seconds during which the location can be updated, starting from the message send date. **If 0x7FFFFFFF is specified, then the location can be updated forever.** Otherwise, the new value must not exceed the current live_period by more than a day, and the live location expiration date must remain within the next 90 days."*

**Consequence:** the 8-hour figure is the maximum offered by the **Telegram client UI** (the user sees 15 min / 1 hour / 8 hours), not an API limit. A bot can extend a live location indefinitely by editing it with a larger `live_period`.

**What to build:** accept 8 hours as the *user-facing* default because that is what the client button offers, but do not encode it as an architectural ceiling. Design the session state machine to handle `live_period` up to `0x7FFFFFFF`, and let long trips be extended server-side rather than forcing a re-share. The re-share prompt remains a fallback, not the primary path.

### [CORRECTION 3] The "India competitor" is not competitive

Zafari has **100+ Play Store installs**. It is not a threat, and it should not shape product decisions. It *is* a useful negative UI reference (see §2.3). Remove it from the competitive-risk register; keep it in the design-reference folder.

### [CORRECTION 4] The category leader has not done this region either

Atlas Obscura's page for **Gass Forest Museum** — your own launch dossier #12 — is an unpublished stub with zero photos. This does not weaken the thesis; it sharpens it. The dossier format applied to Kongu Nadu is unoccupied by everyone, including the company whose brand is "hidden wonders."

**The risk this creates:** you cannot claim "hidden" for places Atlas Obscura or Google already lists. Your differentiator is **verification and access**, not novelty of place. Write copy accordingly — never "nobody knows about this," always "here is what is documented, and here is whether you can get in."

---

# PART II — UI REFERENCE & APPROVAL FLOW

## 6. Measured design tokens

Colours were sampled programmatically from the captured screenshots at known UI regions (CTA buttons, banners, map tiles), not estimated.

### 6.1 What each competitor actually uses

| Product | Surface | Accent | Character |
|---|---|---|---|
| **Atlas Obscura** | Warm white `#FCFCFC` | Deep forest `#183830` / `#184038` | Editorial, serif-adjacent, generous whitespace. Reads like a magazine. |
| **AllTrails** | Warm white `#FCFCFC` + map beige `#E4E4D8` | Bright lime `#90F070` | High-contrast, pill-heavy, map-forward. Reads like a utility. |
| **Zafari** | Near-black `#0C0C18` | Vivid orange `#F87010` | Dark, dense, dashboard tiles. Reads like a games app. |
| **PinIt** | Map blue `#9CB4FC` dominant | Deep green `#007050` | Map-dominant, minimal chrome, list on the left. |

### 6.2 The palette decision for Wild Atlas

Use **Atlas Obscura's warmth** for reading surfaces (dossier pages are long-form), and **AllTrails' structure** for utility surfaces (map, cards, action bars). Reject Zafari's dark dashboard entirely — it signals "app with many toys," which is the opposite of the product.

```css
/* tokens.css — single source of truth. Import in app/layout.tsx */

:root {
  /* ── Surfaces ─────────────────────────────────────────── */
  --surface-page:     #FCFCFA;  /* warm white, matches AO/AllTrails reading comfort */
  --surface-raised:   #FFFFFF;  /* cards, sheets */
  --surface-sunken:   #F3F2EE;  /* map chrome, filter bar background */
  --surface-inverse:  #14201C;  /* rare: snackbar, active nav */

  /* ── Ink ──────────────────────────────────────────────── */
  --ink-primary:      #1A1A18;  /* body + headings */
  --ink-secondary:    #5C5F5A;  /* labels, meta */
  --ink-tertiary:     #8E918B;  /* disabled, footnotes */
  --ink-inverse:      #FCFCFA;

  /* ── Brand: deep forest green ─────────────────────────────
     Chosen because it reads as "landscape + trustworthy" and is
     distinguishable from AllTrails' lime and AO's dark teal.      */
  --brand-900:        #0F2A22;
  --brand-800:        #163A2F;
  --brand-700:        #1E4E3F;  /* primary buttons, active states */
  --brand-600:        #276651;
  --brand-100:        #E4EEE9;  /* tinted backgrounds, badges */

  /* ── Access status (semantic — never used decoratively) ─ */
  --status-open:      #1E7A4C;  /* green: proven open */
  --status-open-bg:   #E6F3EC;
  --status-seasonal:  #A06A0B;  /* amber: conditional */
  --status-seasonal-bg:#FBF1DF;
  --status-permit:    #23558C;  /* blue: extra step */
  --status-permit-bg: #E4EDF7;
  --status-restricted:#8C3A23;  /* rust: do not visit */
  --status-restricted-bg:#F8E9E4;
  --status-closed:    #6B6B6B;  /* grey: not visitable */
  --status-closed-bg: #EDEDEB;
  --status-unknown:   #8E918B;  /* NEVER hide an unknown */
  --status-unknown-bg:#F3F2EE;

  /* ── Facets (chips) ───────────────────────────────────── */
  --facet-nature:     #3C7A4A;
  --facet-water:      #2B6E8F;
  --facet-sacred:     #8A5A1E;
  --facet-heritage:   #7A4A6B;
  --facet-industrial: #5C5A52;
  --facet-urban:      #4A5C6B;
  --facet-dark:       #4A3A3A;

  /* ── Type ─────────────────────────────────────────────────
     One family. No display faces. Editorial authority comes from
     size and spacing, not from a serif costume.                   */
  --font-ui: "Inter", system-ui, -apple-system, sans-serif;
  --font-tamil: "Noto Sans Tamil", "Latha", sans-serif;

  --text-xs:   0.75rem;  /* 12px — badges, footnotes */
  --text-sm:   0.875rem; /* 14px — labels, meta */
  --text-base: 1rem;     /* 16px — body */
  --text-lg:   1.125rem; /* 18px — lead paragraph */
  --text-xl:   1.5rem;   /* 24px — card title */
  --text-2xl:  2rem;     /* 32px — dossier title */
  --text-3xl:  2.5rem;   /* 40px — town hero */

  --leading-tight: 1.2;
  --leading-body:  1.65;   /* long-form reading */

  /* ── Space (4px base) ─────────────────────────────────── */
  --space-1: 0.25rem;  --space-2: 0.5rem;   --space-3: 0.75rem;
  --space-4: 1rem;     --space-6: 1.5rem;   --space-8: 2rem;
  --space-12: 3rem;    --space-16: 4rem;

  /* ── Radius & elevation ───────────────────────────────── */
  --radius-sm: 6px;   --radius-md: 10px;  --radius-lg: 16px;
  --radius-pill: 999px;
  --shadow-card: 0 1px 2px rgba(20,32,28,0.06), 0 4px 12px rgba(20,32,28,0.05);
  --shadow-sheet: 0 -2px 8px rgba(20,32,28,0.08), 0 -16px 40px rgba(20,32,28,0.10);

  --tap-min: 44px;  /* iOS/Android minimum target */
}
```

**Rules that go with the tokens:**

1. **Status colours are semantic only.** Never use `--status-open` as a decorative green. A green chip means "verified open," or it means nothing.
2. **`--status-unknown` must always be visible.** A place with no verified access status shows a grey "Access not verified" badge — never a blank space, never an optimistic default.
3. **Tamil and English share the same scale.** `--font-tamil` is a fallback stack on `.ta` elements; Tamil runs taller, so bump `line-height` by ~0.1 on Tamil blocks.
4. **No gradient, no glassmorphism, no dark mode in Phase 1.** Long-form reading surfaces need one honest theme.

### 6.3 Type and spacing — what the references agree on

| Decision | Reference evidence | Choice |
|---|---|---|
| Card title size | AllTrails ~24px bold | `--text-xl` (24px), weight 600 |
| Body measure | AO ~70ch paragraph | `max-width: 68ch` |
| Meta row | AllTrails `4.6 ★ · Hard · Panvel` | `--text-sm`, `--ink-secondary`, `·` separators |
| Stat row | AllTrails `10.3 km / 901 m / ⇄` — number big, label small | Number `--text-2xl` 600; label `--text-xs` uppercase |
| Filter chips | AllTrails pill with icon + label, ~40px tall | `--radius-pill`, `--tap-min` height, icon 18px |
| Bottom sheet | AllTrails mobile: rounded top, drag handle, photo cards | `--radius-lg` top corners, `--shadow-sheet` |

---

## 7. Screen-by-screen teardown

### 7.1 Home — map + list (primary surface)

**What the references do:**

- **AllTrails mobile:** search pill at top with filter icon → row of pill filters (Nearby · Top picks · Wildflower) → vertical card carousel (photo, bookmark circle, title, park, `★ 4.8 · Hard · 5.7 mi · Est. 3h 30m`) → floating green **Map** FAB at the bottom.
- **PinIt:** full-bleed map, left sidebar list, floating +/− and locate controls, bottom prompt.
- **AllTrails desktop map:** full-bleed map, floating filter pills across the top, collapsible "Explore trails" panel top-left, map-layer and zoom controls right.

**The decision:** copy AllTrails' mobile structure, not PinIt's. Reason: AllTrails' card carousel lets you *read* without leaving the map, which is the whole point of a discovery surface. PinIt's empty sidebar shows what happens without content.

```
┌─────────────────────────────────────────┐
│  Wild Atlas              [EN|த]    ☰    │  ← 56px top bar
├─────────────────────────────────────────┤
│  [🔍 Search…]                    [⚙]    │  ← search pill + filter
│  ┌──────────┐ ┌─────────┐ ┌──────────┐  │
│  │Base town │ │within   │ │Nature  ▾ │  │  ← base town FIRST
│  │ Valparai │ │60 min ▾ │ │Water   ▾ │  │
│  └──────────┘ └─────────┘ └──────────┘  │
├─────────────────────────────────────────┤
│                                         │
│              MAP (MapLibre)             │
│         round = place, square = town    │
│                                         │
├─────────────────────────────────────────┤
│  ═══ (drag handle)                      │  ← bottom sheet
│  7 places within 60 min of Valparai     │
│  ┌──────────┐ ┌──────────┐ ┌─────────┐  │
│  │ [photo]  │ │ [photo]  │ │ [photo] │  │  ← horizontal cards
│  │ Puthu-   │ │ Chinna-  │ │ Nalla-  │  │
│  │ thottam  │ │ kallar   │ │ mudi    │  │
│  │ 4.1 km   │ │ 9.8 km   │ │ 12.4 km │  │
│  │ ● open   │ │ ● seas.  │ │ ● open  │  │
│  └──────────┘ └──────────┘ └─────────┘  │
└─────────────────────────────────────────┘
```

**Differences from every reference — deliberate:**

1. **Base town is the first control**, before facets. Your docs are right that it is the highest-value control for anyone actually going somewhere. No competitor has it.
2. **Every card carries an access badge**, coloured from the semantic scale. No competitor does this.
3. **Tamil toggle in the top bar**, not buried in settings.
4. **Place pins are round, town pins are square.** Shape encodes type; colour encodes status. Two channels, never one.

### 7.2 Dossier page — the reading surface

**What the references do:** Atlas Obscura gives *title → actions → photo → About prose*. AllTrails gives *title → tabs → hero → stat row → prose → sticky actions*.

**The decision:** AllTrails' information architecture (stat row, tabs, sticky actions) with Atlas Obscura's reading warmth, plus the sections no competitor has.

```
┌─────────────────────────────────────────┐
│ ← Coimbatore        [EN|த]         ⋯    │
├─────────────────────────────────────────┤
│  சிறுவாணி அருவி                          │  ← Tamil first when TA selected
│  Siruvani Falls                          │
│  Nature · Water        [● OPEN] [✓ 12 Oct]│
│  ─────────────────────────────────────  │
│  [      hero image, licensed     ]       │
├─────────────────────────────────────────┤
│  34 km        1h 20m       4.2 km jeep   │  ← STAT ROW
│  to access    drive        last mile     │
├─────────────────────────────────────────┤
│  The Story                               │
│  ≤150 words, neutral, no hype            │
│                                          │
│  What is documented                      │
│  • Fact one.             [A · ASI]       │  ← every claim graded
│  • Fact two.             [B · The Hindu] │
│                                          │
│  What is told                            │
│  "Local accounts hold…"  [C · residents] │  ← lore, always attributed
│                                          │
│  Getting there                           │
│  From Valparai: 34 km, 1h20m             │
│  Last mile: 4.2 km jeep track, 25 min    │
│                                          │
│  Where to base yourself                  │
│  Valparai   34 km  1h20  most stays      │
│  Pollachi   58 km  1h45  gateway         │
│  Anaikatti  22 km  0h45  closest         │
│                                          │
│  Practical                               │
│  06:00–17:00 · permit at gate            │
│  No night driving · closed Tue           │
│                                          │
│  Sources                                 │
│  Title · type · grade · link · retrieved │
│                                          │
│  Verification                            │
│  Last verified 12 Oct 2026 by <name>     │
│  Confidence: SOURCED                     │
│                                          │
│  [ This is wrong ]                       │  ← always visible
└─────────────────────────────────────────┘
```

**Non-negotiables on this page:**

- The **stat row** is above the prose. Three numbers, always. If a number is unknown, show `UNKNOWN` with a grey style — never omit the slot.
- Every claim in *documented* and *practical* renders with its **grade chip**. A claim without a source cannot be published, so it cannot appear.
- *What is told* is visually distinguished (tinted background, italic lead) so lore never reads as fact.
- **Sensitivity note** appears above Sources when `cultural_status !== 'SECULAR'`, and `narrative_score` is absent entirely.
- **`[This is wrong]`** is always visible — the cheapest corpus maintenance channel in the product.

### 7.3 Telegram digest — the delivery surface

**What the references do:** none of them have this. Zafari has SOS and community chat, not proximity delivery.

**Constraints measured from Telegram's Bot API:** text 4096 chars; **photo caption 1024 chars**; inline keyboard up to 8 buttons per row; use `parse_mode: HTML` (MarkdownV2 escaping is a bug factory); ~1 msg/sec per chat.

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

Rules: caption budget **900 chars including Tamil**; one message, never three; every message carries feedback buttons; `⛔ Closed` and `✏️ Wrong` write to `correction`.

### 7.4 The four remaining surfaces

| Surface | Pattern source | Key rule |
|---|---|---|
| **Trip Pack** (offline) | AllTrails "Unlimited Map Downloads" | Download prompt on *trip declaration*, when the user has wifi and intent — not on first session. |
| **Search results** | AllTrails filter pills | Zero results → never silent; show nearest 3 + "no exact match". |
| **Base town selector** | none — new | Published selection rule on the page itself. |
| **Correction form** | none — new | One textarea, one field picker, no account required. Credit the submitter. |
| **Link Telegram** | none — new | 4-character code shown in **both** surfaces. Defeats forwarded deep links. |

---

## 8. UI execution flow — approval gates

**This is the process. Do not build a screen before its gate is approved.**

Each gate produces something reviewable. You approve, adjust, or reject. Only then does the next gate open. This exists because UI built without approval is UI rebuilt later.

```
GATE 0 · TOKENS
  Produce: tokens.css + type specimen page at /_design/tokens
  You see: colour swatches, type scale, status badges, spacing
  Approve → everything downstream inherits it
        │
        ▼
GATE 1 · MAP SHELL
  Produce: /  with real MapLibre + PMTiles, 3 seed pins, empty sheet
  You see: the map renders, pans, zooms; pins look right at 3 zoom levels
  Approve → layout is locked
        │
        ▼
GATE 2 · CARDS + SHEET
  Produce: /  with horizontal card carousel, access badges, base-town control
  You see: scroll cards, tap to select → map flies to pin
  Approve → interaction model locked
        │
        ▼
GATE 3 · DOSSIER
  Produce: /place/[slug] with all 12 sections from §7.2, real Siruvani data
  You see: the full reading experience, EN + TA toggle, mobile + desktop
  Approve → content contract locked
        │
        ▼
GATE 4 · SEARCH + FILTERS
  Produce: search overlay, facet chips, Tamil input, zero-result state
  You see: type "சிறுவாணி" → Siruvani; nonsense → nearest 3
  Approve → search behaviour locked
        │
        ▼
GATE 5 · TELEGRAM
  Produce: /settings/telegram link flow with 4-char code
  You see: real bot, real message, real digest
  Approve → delivery locked
        │
        ▼
GATE 6 · TRIP PACK
  Produce: offline download + airplane-mode test
  You see: pull the network cable, everything still reads
  Approve → ship Phase 1
```

**Why gates and not a single review:** each gate is cheap to change and expensive to un-change. Approving tokens costs 10 minutes. Rebuilding a dossier page after the tokens change costs two days.

**The approval artefact per gate:** a live URL (Vercel preview) plus 2 screenshots (mobile 390px, desktop 1440px) in `.research/ui-gate-N/`. You reply with approve / the specific change. No gate advances on silence.

---

## 9. What the UI must never do

Learned from the teardowns. Each is a real failure observed in a competitor.

| Never | Seen in | Why it matters here |
|---|---|---|
| Show a dashboard of feature tiles | Zafari (9 tiles, Explore is one) | Discovery is the product, not a tile among toys |
| Show weather as the most prominent fact | Zafari place page | Weather is easy; access is hard. Leading with weather signals you substituted. |
| Use a flat 17-item chip row | PinIt | Conflates type, access, and landform. Your three-layer model exists to prevent this. |
| Default to a dark UI | Zafari | Signifies a games app; destroys long-form reading |
| Show an empty map with "add one" | PinIt | Crowdsourcing cold-start. Launch with content. |
| Hide an unknown value | all of them | Unknown access is the most important thing to show |
| Paywall the reading | AllTrails (GPX backlash) | Paywall offline utility, never the dossier |
| Show a single distance number | all of them | The three-number model is the differentiator |
| Show lore in the same visual weight as fact | Atlas Obscura (prose only) | The fact/lore split is half the product |
| Put facets before base town | all of them | Nobody plans a trip by facet; they plan from a place they sleep |

---

# PART III — BUILD HANDBOOK

## 10. How the MCP layer works in this build

The build consumes MCP servers as **tool surfaces**. Every stage below names the MCP server, the tool, the input JSON, and the expected output JSON. A developer should be able to run each stage by calling these tools in order.

### 10.1 MCP servers used

| Server | Package / source | Purpose in build | Write access |
|---|---|---|---|
| **postgres-mcp** | `crystaldba/postgres-mcp` (MIT) | All schema, seed, and query operations | Yes (dev DB only) |
| **firecrawl-mcp** | Firecrawl | Research during content ops; competitor/URL extraction | No (external) |
| **filesystem-mcp** | reference server | Read `content/`, write exports | Yes (repo only) |
| **bbox-mcp** | `iamvibhorsingh/bbox-mcp-server` | Overpass queries, H3 indexing, coordinate conversion | No |
| **playwright-mcp** | Microsoft | UI verification at each gate; screenshot capture | No |
| **telegram-mcp** | `chigwell/telegram-mcp` (Apache-2.0) | Bot registration checks, test sends | Yes (bot only) |

**Safety rule:** `postgres-mcp` is configured in **restricted mode** — no `DROP`, no `TRUNCATE`, no unrestricted DDL in production. Migrations run through `drizzle-kit`, not through the MCP tool. The MCP tool is for inspection, seeding, and querying during development.

### 10.2 The JSON envelope convention

Every MCP tool response in this book is shown as:

```json
// INPUT
{ "tool": "<tool_name>", "arguments": { ... } }

// OUTPUT (expected)
{ "content": [ { "type": "text", "text": "<result>" } ] }
```

Where the tool returns structured data, the `text` payload is shown as the JSON string it contains. This is the actual MCP protocol shape — `content` is always an array of typed blocks.

### 10.3 Stage map

```
STAGE 0  Foundation         repo, DB, schema, contracts, CI          → GATE 0
STAGE 1  Seed corpus        Siruvani dossier, end-to-end vertical     → proves architecture
STAGE 2  Map shell          MapLibre + PMTiles + pins                 → UI GATE 1–2
STAGE 3  Dossier page       12-section renderer, bilingual            → UI GATE 3
STAGE 4  Search             FTS + pg_trgm + Tamil + intent            → UI GATE 4
STAGE 5  Distance           towns, matrix, three-number model         → UI GATE 2 (revised)
STAGE 6  Telegram           bot, link, webhook, digest, budget        → UI GATE 5
STAGE 7  Trip Pack          offline bundle                            → UI GATE 6
STAGE 8  Signals            obscurity, ledger, rising                 → defer until 8 weeks data
```

---

## STAGE 0 — FOUNDATION

**Goal:** a repo where a place with zero sources *cannot* be published, and a valid place *can*.
**Duration:** 4 days.
**Gate:** `npm run check:publishable` rejects an empty-source place and accepts Siruvani.

### 0.1 Scaffold

```bash
npx create-next-app@latest wild-atlas --typescript --app --tailwind --eslint
cd wild-atlas
npm i drizzle-orm postgres zod
npm i -D drizzle-kit tsx @types/node
npm i maplibre-gl pmtiles
```

```bash
# .env.local  — never commit
DATABASE_URL=postgres://...
NEXT_PUBLIC_MAP_STYLE_URL=https://...
NEXT_PUBLIC_PMTILES_URL=https://...
ORS_API_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
TELEGRAM_BOT_USERNAME=
NEXT_PUBLIC_POSTHOG_KEY=
ADMIN_ALLOWLIST=you@example.com
```

### 0.2 MCP: create the database extensions

```json
// INPUT → postgres-mcp
{
  "tool": "execute_sql",
  "arguments": {
    "sql": "CREATE EXTENSION IF NOT EXISTS postgis; CREATE EXTENSION IF NOT EXISTS pg_trgm;"
  }
}

// OUTPUT (expected)
{
  "content": [{ "type": "text", "text": "{\"result\":\"Extensions created\",\"rows_affected\":0}" }]
}
```

### 0.3 Taxonomy — the single source of truth

```ts
// lib/taxonomy.ts  ← imported by UI, seed, and Telegram templates.
// No string literal for a facet exists anywhere else in the repo.

export const FACETS = [
  'NATURE', 'WATER', 'SACRED', 'HERITAGE',
  'INDUSTRIAL', 'URBAN', 'DARK_HISTORY',
] as const;
export type Facet = typeof FACETS[number];

export const SIGNALS = ['OBSCURITY', 'NARRATIVE', 'RISING'] as const;
export type Signal = typeof SIGNALS[number];

export const ACCESS_STATUS = [
  'OPEN', 'SEASONAL', 'PERMIT', 'RESTRICTED', 'CLOSED',
] as const;
export type AccessStatus = typeof ACCESS_STATUS[number];

export const SAFETY_CLASS = ['LOW', 'MODERATE', 'HAZARDOUS', 'PROHIBITED'] as const;
export const CULTURAL_STATUS = ['SECULAR', 'RELIGIOUS_ACTIVE', 'SACRED', 'SENSITIVE'] as const;
export const CONFIDENCE = ['SOURCED', 'PARTIAL', 'UNVERIFIED'] as const;
export const LAST_MILE_SURFACE = ['PAVED', 'GRAVEL', 'JEEP', 'WALK', 'BOAT'] as const;

// UI metadata lives here too, so a facet cannot drift between DB and screen.
export const FACET_META: Record<Facet, { en: string; ta: string; token: string }> = {
  NATURE:     { en: 'Nature',       ta: 'இயற்கை',      token: '--facet-nature' },
  WATER:      { en: 'Water',        ta: 'நீர்நிலை',     token: '--facet-water' },
  SACRED:     { en: 'Sacred',       ta: 'தெய்வீகம்',    token: '--facet-sacred' },
  HERITAGE:   { en: 'Heritage',     ta: 'பாரம்பரியம்',  token: '--facet-heritage' },
  INDUSTRIAL: { en: 'Industrial',   ta: 'தொழில்துறை',   token: '--facet-industrial' },
  URBAN:      { en: 'Urban',        ta: 'நகர்ப்புறம்',  token: '--facet-urban' },
  DARK_HISTORY:{ en: 'Dark History',ta: 'இருண்ட வரலாறு', token: '--facet-dark' },
};

/** Banned strings — the old taxonomy. A CI check greps for these. */
export const BANNED_UI_STRINGS = [
  'Mystery', 'Hidden Gems', 'Trending', 'Adventure',
] as const;
```

### 0.4 Schema

```sql
-- db/schema.sql  (drizzle-kit will generate TS from the migrations)

CREATE TABLE place (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                text UNIQUE NOT NULL,
  name_en             text NOT NULL,
  name_ta             text NOT NULL,
  name_variants       text[] NOT NULL DEFAULT '{}',
  summary_en          text NOT NULL,
  summary_ta          text NOT NULL,
  body_en             jsonb NOT NULL,
  body_ta             jsonb NOT NULL,

  location            geography(Point,4326) NOT NULL,
  access_point        geography(Point,4326) NOT NULL,
  access_point_label_en text,
  access_point_label_ta text,

  facets              text[] NOT NULL,
  access_status       text NOT NULL CHECK (access_status IN
                        ('OPEN','SEASONAL','PERMIT','RESTRICTED','CLOSED')),
  season_start_month  int CHECK (season_start_month BETWEEN 1 AND 12),
  season_end_month    int CHECK (season_end_month BETWEEN 1 AND 12),
  access_opens        time,
  access_closes       time,
  closed_days         text,
  permit_required     boolean NOT NULL DEFAULT false,
  permit_note_en      text,
  permit_note_ta      text,
  night_driving_banned boolean NOT NULL DEFAULT false,

  safety_class        text NOT NULL CHECK (safety_class IN
                        ('LOW','MODERATE','HAZARDOUS','PROHIBITED')),
  cultural_status     text NOT NULL DEFAULT 'SECULAR' CHECK (cultural_status IN
                        ('SECULAR','RELIGIOUS_ACTIVE','SACRED','SENSITIVE')),
  carrying_capacity_note_en text,
  carrying_capacity_note_ta text,

  last_mile_surface   text CHECK (last_mile_surface IN
                        ('PAVED','GRAVEL','JEEP','WALK','BOAT')),
  last_mile_km        numeric(5,1),
  last_mile_minutes   int,
  last_mile_note_en   text,
  last_mile_note_ta   text,

  confidence          text NOT NULL DEFAULT 'UNVERIFIED' CHECK (confidence IN
                        ('SOURCED','PARTIAL','UNVERIFIED')),
  obscurity_score     numeric(4,3),
  narrative_score     numeric(4,3),
  rising_score        numeric(4,3),

  authored_by         text NOT NULL,
  reviewed_by         text,
  last_verified_at    date,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX place_location_gix ON place USING gist (location);
CREATE INDEX place_access_gix   ON place USING gist (access_point);
CREATE INDEX place_facets_idx   ON place USING gin (facets);
CREATE INDEX place_name_trgm_idx ON place USING gin (name_en gin_trgm_ops);
CREATE INDEX place_name_ta_trgm_idx ON place USING gin (name_ta gin_trgm_ops);
CREATE INDEX place_variants_trgm_idx ON place
  USING gin (array_to_string(name_variants,' ') gin_trgm_ops);

CREATE TABLE source (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id      uuid NOT NULL REFERENCES place(id) ON DELETE CASCADE,
  grade         text NOT NULL CHECK (grade IN ('A','B','C','D')),
  kind          text NOT NULL,  -- wikipedia | news | gazetteer | book | local
  title         text NOT NULL,
  url           text,
  retrieved_at  date NOT NULL,
  notes         text
);

CREATE TABLE claim (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id    uuid NOT NULL REFERENCES place(id) ON DELETE CASCADE,
  section     text NOT NULL CHECK (section IN
                ('documented','lore','practical','access')),
  statement_en text NOT NULL,
  statement_ta text NOT NULL,
  source_id   uuid REFERENCES source(id),   -- NULL allowed only for lore
  is_folklore boolean NOT NULL DEFAULT false
);

CREATE TABLE image (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id     uuid NOT NULL REFERENCES place(id) ON DELETE CASCADE,
  url          text NOT NULL,
  width        int, height int,
  license      text,          -- non-null required to publish
  attribution  text,          -- non-null required to publish
  source_url   text
);

CREATE TABLE correction (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id     uuid NOT NULL REFERENCES place(id) ON DELETE CASCADE,
  field        text,
  message      text NOT NULL,
  channel      text NOT NULL CHECK (channel IN ('WEB','TELEGRAM')),
  submitted_by text,
  status       text NOT NULL DEFAULT 'OPEN' CHECK (status IN
                 ('OPEN','ACCEPTED','REJECTED','DUPLICATE')),
  resolved_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE verification_event (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id    uuid NOT NULL REFERENCES place(id) ON DELETE CASCADE,
  verified_at date NOT NULL,
  verified_by text NOT NULL,
  outcome     text NOT NULL CHECK (outcome IN ('CONFIRMED','CHANGED','RETIRED')),
  notes       text
);
```

The full schema — including `town`, `place_town`, `device`, `telegram_conn`, `link_token`, `preference`, `location_session`, `notification`, `trip`, `trip_stop`, `signal_daily`, `discovery_event` — is in Appendix A. Run it all in Stage 0; the tables are cheap and the migrations are painful to interleave later.

### 0.5 The publishing contract

This is the most important file in the repo. It converts prose rules into an unreachable state.

```ts
// lib/publishable.ts

import type { PlaceWithRelations } from '@/db/types';
import { daysSince } from './dates';

export type PublishCheck = { ok: true } | { ok: false; reasons: string[] };

export function publishable(p: PlaceWithRelations): PublishCheck {
  const r: string[] = [];

  // ── Provenance ────────────────────────────────────────────
  const ab = p.sources.filter(s => s.grade === 'A' || s.grade === 'B').length;
  if (ab < 1) r.push('needs at least one A or B grade source');
  if (p.sources.length < 2) r.push('needs at least two sources');
  if (p.confidence !== 'SOURCED') r.push('confidence must be SOURCED');

  const undocumented = p.claims.filter(c => c.section !== 'lore' && !c.source_id);
  if (undocumented.length) r.push(`${undocumented.length} claim(s) missing a source`);

  // ── Bilingual ─────────────────────────────────────────────
  if (!p.name_en || !p.name_ta) r.push('bilingual name required');
  if (!p.summary_en || !p.summary_ta) r.push('bilingual summary required');
  if (!p.body_en?.documented || !p.body_ta?.documented)
    r.push('documented section required in both languages');

  // ── Geo / access ──────────────────────────────────────────
  if (!p.location) r.push('location required');
  if (!p.access_point) r.push('access point required');
  if (!p.access_status) r.push('access status required');
  if (!p.last_verified_at) r.push('verification date required');

  const ageDays = daysSince(p.last_verified_at);
  if (ageDays > 180) r.push(`stale: verified ${ageDays} days ago`);

  if (p.access_status === 'RESTRICTED' && p.publishes_site_coordinates)
    r.push('restricted place must not publish site coordinates');

  if (p.access_status === 'SEASONAL' && (!p.season_start_month || !p.season_end_month))
    r.push('seasonal place needs a season window');

  // ── Cultural safety ───────────────────────────────────────
  if (p.cultural_status !== 'SECULAR' && p.narrative_score !== null)
    r.push('narrative score must be NULL for non-secular places');

  // ── Images ────────────────────────────────────────────────
  const badImages = p.images.filter(i => !i.license || !i.attribution);
  if (badImages.length) r.push(`${badImages.length} image(s) missing licence or attribution`);

  // ── Authorship ────────────────────────────────────────────
  if (!p.authored_by || p.authored_by === 'ai') r.push('must be human-authored');
  if (!p.reviewed_by) r.push('must be reviewed by a human');

  return r.length ? { ok: false, reasons: r } : { ok: true };
}
```

```ts
// scripts/check-publishable.ts
// npm run check:publishable — runs in CI and before deploy.
// Fetches every place, runs publishable(), exits non-zero on any failure.

import { db } from '@/db';
import { publishable } from '@/lib/publishable';

async function main() {
  const places = await db.query.places.findMany({ with: relations });
  let failed = 0;
  for (const p of places) {
    const res = publishable(p);
    if (!res.ok) {
      failed++;
      console.error(`FAIL ${p.slug}\n  ${res.reasons.join('\n  ')}`);
    }
  }
  if (failed) { console.error(`\n${failed} place(s) not publishable.`); process.exit(1); }
  console.log(`✓ all ${places.length} places publishable`);
}
main();
```

### 0.6 GATE 0 — the verification

```json
// INPUT → postgres-mcp: insert a deliberately invalid place
{
  "tool": "execute_sql",
  "arguments": {
    "sql": "INSERT INTO place (slug,name_en,name_ta,summary_en,summary_ta,body_en,body_ta,location,access_point,facets,access_status,safety_class,confidence,authored_by) VALUES ('bad-place','Bad','கெட்டது','x','x','{}','{}',ST_MakePoint(76.9,11.0)::geography,ST_MakePoint(76.9,11.0)::geography,'{NATURE}','OPEN','LOW','UNVERIFIED','human:test');"
  }
}

// THEN: npm run check:publishable
// EXPECTED: exit 1, with reasons including
//   "needs at least one A or B grade source"
//   "needs at least two sources"
//   "confidence must be SOURCED"
//   "verification date required"
//   "must be reviewed by a human"
```

**Gate 0 passes when:** `check:publishable` exits 1 for `bad-place` with the expected reasons, and exits 0 after Siruvani (Stage 1) is seeded.

---

## STAGE 1 — SEED CORPUS (the vertical slice)

**Goal:** one real dossier renders from the database, with a map pin at the **access point**, a verified badge, and a source list.
**Duration:** 2 days (research included).
**Gate:** `/place/siruvani` renders every section; the pin is at the access point, not the falls.

This stage proves the entire architecture. Everything after it is repetition.

### 1.1 Research Siruvani — using firecrawl-mcp

```json
// INPUT → firecrawl-mcp
{
  "tool": "firecrawl_search",
  "arguments": {
    "query": "Siruvani Falls Coimbatore access point timing entry permit history",
    "limit": 8,
    "sources": ["web"]
  }
}

// OUTPUT (shape)
{
  "content": [{
    "type": "text",
    "text": "{\"success\":true,\"data\":[{\"url\":\"https://...\",\"title\":\"...\",\"description\":\"...\"}]}"
  }]
}
```

Then scrape the two or three that matter:

```json
// INPUT → firecrawl-mcp
{
  "tool": "firecrawl_scrape",
  "arguments": {
    "url": "https://ta.wikipedia.org/wiki/சிறுவாணி_அருவி",
    "formats": ["markdown"],
    "onlyMainContent": true
  }
}

// OUTPUT (shape)
{
  "content": [{
    "type": "text",
    "text": "{\"success\":true,\"data\":{\"markdown\":\"## சிறுவாணி அருவி\\n...\",\"metadata\":{\"language\":\"ta\",\"statusCode\":200}}}"
  }]
}
```

**Research rule:** for every fact you write, record `{ value, source_url, retrieved_at, grade }`. A fact with no source URL does not go in the dossier. This is the difference between a corpus and a blog.

### 1.2 Seed the place

```json
// INPUT → postgres-mcp (single statement; use a transaction in practice)
{
  "tool": "execute_sql",
  "arguments": {
    "sql": "BEGIN;\n\nINSERT INTO place (\n  slug, name_en, name_ta, name_variants,\n  summary_en, summary_ta, body_en, body_ta,\n  location, access_point, access_point_label_en, access_point_label_ta,\n  facets, access_status, access_opens, access_closes, closed_days,\n  permit_required, permit_note_en, night_driving_banned,\n  safety_class, cultural_status,\n  last_mile_surface, last_mile_km, last_mile_minutes, last_mile_note_en,\n  confidence, authored_by, reviewed_by, last_verified_at\n) VALUES (\n  'siruvani',\n  'Siruvani Falls',\n  'சிறுவாணி அருவி',\n  ARRAY['Siruvani','Kovai Kutralam','சிறுவாணி'],\n  'A waterfall in the Siruvani hills west of Coimbatore, reached through reserve forest.',\n  'கோயம்புத்தூருக்கு மேற்கே சிறுவாணி மலைகளில் உள்ள அருவி.',\n  '{\"documented\":\"The Siruvani dam was built in 1929 to supply Coimbatore.\",\"lore\":null,\"gettingThere\":null,\"practical\":null}',\n  '{\"documented\":\"சிறுவாணி அணை 1929 ஆம் ஆண்டு கட்டப்பட்டது.\",\"lore\":null,\"gettingThere\":null,\"practical\":null}',\n  ST_SetSRID(ST_MakePoint(76.7000, 10.9500),4326)::geography,\n  ST_SetSRID(ST_MakePoint(76.7120, 10.9430),4326)::geography,\n  'Forest checkpost on the Siruvani road',\n  'சிறுவாணி சாலையில் உள்ள வனத்துறை சோதனைச்சாவடி',\n  ARRAY['NATURE','WATER'],\n  'OPEN', '06:00'::time, '17:00'::time, 'Tuesday',\n  true, 'Entry permit issued at the checkpost; carry ID.', false,\n  'MODERATE', 'SECULAR',\n  'PAVED', 0.5, 5, 'Short paved walk from the parking area.',\n  'SOURCED', 'human:you', 'human:reviewer', '2026-11-20'\n);\n\nINSERT INTO source (place_id, grade, kind, title, url, retrieved_at)\nSELECT id, 'B', 'news', 'Siruvani water supply history', 'https://example.org/siruvani', '2026-11-20'\nFROM place WHERE slug = 'siruvani';\n\nINSERT INTO source (place_id, grade, kind, title, url, retrieved_at)\nSELECT id, 'A', 'gazetteer', 'Coimbatore District Gazetteer', NULL, '2026-11-20'\nFROM place WHERE slug = 'siruvani';\n\nCOMMIT;"
  }
}

// OUTPUT (expected)
{ "content": [{ "type": "text", "text": "{\"result\":\"COMMIT\",\"rows_affected\":4}" }] }
```

### 1.3 Verify publishability

```json
// INPUT → postgres-mcp
{
  "tool": "execute_sql",
  "arguments": {
    "sql": "SELECT p.slug, p.confidence, p.access_status, p.last_verified_at, count(s.id) AS sources, count(s.id) FILTER (WHERE s.grade IN ('A','B')) AS ab_sources FROM place p LEFT JOIN source s ON s.place_id = p.id GROUP BY p.id;"
  }
}

// OUTPUT (expected)
{
  "content": [{
    "type": "text",
    "text": "[{\"slug\":\"siruvani\",\"confidence\":\"SOURCED\",\"access_status\":\"OPEN\",\"last_verified_at\":\"2026-11-20\",\"sources\":2,\"ab_sources\":2}]"
  }]
}
```

**Gate 1 passes when:** `npm run check:publishable` exits 0, and `/place/siruvani` renders the Tamil name, English name, OPEN badge, 20 Nov 2026 verified badge, and a two-row sources table — while the `bad-place` fixture still fails.

---

## STAGE 2 — MAP SHELL

**Goal:** `/` renders a real map with place pins, a draggable bottom sheet, and base-town-first controls.
**Duration:** 4 days.
**Gate:** UI GATE 1 and GATE 2 (§8).

### 2.1 The nearby query

```json
// INPUT → postgres-mcp
{
  "tool": "execute_sql",
  "arguments": {
    "sql": "SELECT p.id, p.slug, p.name_en, p.name_ta, p.facets, p.access_status, p.last_verified_at, ST_X(p.access_point::geometry) AS lon, ST_Y(p.access_point::geometry) AS lat, ROUND(ST_Distance(p.access_point, ST_SetSRID(ST_MakePoint($1,$2),4326)::geography)::numeric) AS crow_m FROM place p WHERE ST_DWithin(p.access_point, ST_SetSRID(ST_MakePoint($1,$2),4326)::geography, $3) AND p.confidence = 'SOURCED' AND p.last_verified_at > now() - interval '180 days' ORDER BY crow_m LIMIT 50;",
    "params": [76.9558, 11.0168, 15000]
  }
}

// OUTPUT (expected shape)
{
  "content": [{
    "type": "text",
    "text": "[{\"id\":\"...\",\"slug\":\"siruvani\",\"name_en\":\"Siruvani Falls\",\"name_ta\":\"சிறுவாணி அருவி\",\"facets\":[\"NATURE\",\"WATER\"],\"access_status\":\"OPEN\",\"last_verified_at\":\"2026-11-20\",\"lon\":76.712,\"lat\":10.943,\"crow_m\":16400}]"
  }]
}
```

**Note the last field: `crow_m` is crow-flies, not drive distance.** The UI must never render it as a driving distance. That is the P2 pain point. Drive time comes from `place_town` (Stage 5).

### 2.2 Map rendering rules

```ts
// components/map/PlacePin.tsx — shape encodes type, colour encodes status
const PIN = {
  place: { shape: 'circle',  size: 18 },
  town:  { shape: 'square',  size: 14 },
} as const;

const STATUS_COLOUR = {
  OPEN:       'var(--status-open)',
  SEASONAL:   'var(--status-seasonal)',
  PERMIT:     'var(--status-permit)',
  RESTRICTED: 'var(--status-restricted)',
  CLOSED:     'var(--status-closed)',
} as const;
```

- Pin sits at **`access_point`**, never at `location`. For restricted places the two differ by kilometres, and publishing the site pin is the safety failure the product exists to prevent.
- Selecting a place draws labelled lines to its top three base towns with drive minutes.
- Selecting a town dims places beyond the reach threshold and shows the convex hull of reachable places, labelled "approximate reach."
- Town pins are square and muted; place pins round and primary.

### 2.3 Bottom sheet behaviour

```
collapsed   →  18% height: drag handle + "N places within X of Y"
half        →  45% height: horizontal card carousel
expanded    →  85% height: vertical list, map dimmed above
```

Only 3 snap points. Free-scroll sheets feel unpolished and are hard to dismiss.

---

## STAGE 3 — DOSSIER PAGE

**Goal:** the 12-section renderer from §7.2, bilingual, with grade chips.
**Duration:** 4 days.
**Gate:** UI GATE 3.

### 3.1 The dossier query

```json
// INPUT → postgres-mcp
{
  "tool": "execute_sql",
  "arguments": {
    "sql": "SELECT p.*, (SELECT json_agg(json_build_object('id',s.id,'grade',s.grade,'kind',s.kind,'title',s.title,'url',s.url,'retrieved_at',s.retrieved_at) ORDER BY s.grade) FROM source s WHERE s.place_id=p.id) AS sources, (SELECT json_agg(json_build_object('section',c.section,'statement_en',c.statement_en,'statement_ta',c.statement_ta,'source_id',c.source_id,'is_folklore',c.is_folklore)) FROM claim c WHERE c.place_id=p.id) AS claims, (SELECT json_agg(json_build_object('url',i.url,'license',i.license,'attribution',i.attribution)) FROM image i WHERE i.place_id=p.id AND i.license IS NOT NULL) AS images FROM place p WHERE p.slug = $1;",
    "params": ["siruvani"]
  }
}
```

### 3.2 Section render order — fixed

```
1  Name (Tamil / English) + facets + access badge + verified badge
2  One-line hook
3  Hero image (only if licence AND attribution are present)
4  Stat row:  town→access km  ·  drive minutes  ·  last mile
5  The Story            ≤150 words, neutral
6  What is documented   each claim + grade chip
7  What is told         lore, attributed, visually distinct
8  Getting there        route, last mile, transport
9  Where to base yourself  ≤3 towns, km, minutes, character
10 Practical            hours, entry, season, what to carry
11 Sensitivity note     required when cultural_status ≠ SECULAR
12 Sources + Verification + [This is wrong]
```

**The sacred rule, enforced in the renderer:** when `cultural_status !== 'SECULAR'`, section 7 renders a sensitivity statement and `narrative_score` is not read at all. A living deity is never a "Local Legend" badge.

### 3.3 Tamil rendering

```tsx
// Every text node is bilingual-aware. Tamil is never machine-translated.
<Text en={place.name_en} ta={place.name_ta} />

// .ta { font-family: var(--font-tamil); line-height: 1.75; }
```

---

## STAGE 4 — SEARCH

**Goal:** Postgres FTS + `pg_trgm` + Tamil + intent decomposition.
**Duration:** 3 days.
**Gate:** UI GATE 4.

### 4.1 Intent decomposition

```
"hidden waterfalls near Valparai"
   → INTENT  facets=[WATER]  signal=OBSCURITY
   → PLACE   geocode "Valparai" → town centroid
   → RADIUS  default 25 km from a town, user preference from GPS
```

Synonym table (no model, fast, debuggable):

```ts
// lib/search/synonyms.ts
export const INTENT: Record<string, { facet?: Facet; signal?: Signal }> = {
  waterfall: { facet: 'WATER' },  falls: { facet: 'WATER' },
  அருவி: { facet: 'WATER' },      நீர்வீழ்ச்சி: { facet: 'WATER' },
  temple: { facet: 'SACRED' },    கோயில்: { facet: 'SACRED' },
  fort: { facet: 'HERITAGE' },    கோட்டை: { facet: 'HERITAGE' },
  forest: { facet: 'NATURE' },    jungle: { facet: 'NATURE' },
  abandoned: { facet: 'DARK_HISTORY' }, 'dark history': { facet: 'DARK_HISTORY' },
  hidden: { signal: 'OBSCURITY' }, obscure: { signal: 'OBSCURITY' },
};
```

### 4.2 The search query

```json
// INPUT → postgres-mcp  (Tamil input: சிறுவாணி)
{
  "tool": "execute_sql",
  "arguments": {
    "sql": "SELECT slug, name_en, name_ta, similarity(name_ta, $1) AS sim FROM place WHERE name_ta % $1 OR name_en % $1 OR array_to_string(name_variants,' ') % $1 ORDER BY sim DESC LIMIT 10;",
    "params": ["சிறுவாணி"]
  }
}

// OUTPUT (expected)
{
  "content": [{
    "type": "text",
    "text": "[{\"slug\":\"siruvani\",\"name_en\":\"Siruvani Falls\",\"name_ta\":\"சிறுவாணி அருவி\",\"sim\":1.0}]"
  }]
}
```

**Failure state is mandatory:** zero results returns the nearest 3 places by distance plus "no exact match — did you mean…". Never a blank screen.

---

## STAGE 5 — DISTANCE & BASE TOWNS

**Goal:** the three-number model, precomputed. Never route at request time.
**Duration:** 5 days.

### 5.1 The batch

```
PUBLISH TIME (quarterly)
  place × town → ORS matrix → place_town rows

REQUEST TIME
  SELECT * FROM place_town WHERE town_id=$1 AND drive_minutes<=$2
  → indexed read. No routing call. No latency. No vendor dependency.
```

~530 pairs for 12 places × 22 towns. A batch job, not a service.

### 5.2 The dossier block

```
WHERE TO BASE YOURSELF
Valparai     34 km   1h 20m   Tea town · most stays · fuel + hospital
Pollachi     58 km   1h 45m   Gateway · 24h fuel · larger hospitals
Anaikatti    22 km   0h 45m   Closest · 4 stays · no fuel after 20:00

Last mile    4.2 km jeep track, 25 min
Access       06:00–17:00 · permit at gate · no night driving
```

Rules: maximum three towns, ranked by drive time; **never show hotels**; one outgoing "See stays in X" link; footnote *"Distance is town centre to access point. Times are driving only."*

---

## STAGE 6 — TELEGRAM

**Goal:** link flow, webhook, digest, notification budget, live location.
**Duration:** 9 days.
**Gate:** UI GATE 5.

### 6.1 Linking (defeats forwarded links)

```json
// INPUT → an internal route, shown for contract clarity
// POST /api/telegram/link
{ "device_id": "5f2c...-uuid" }

// OUTPUT
{
  "token": "a7f3c9e1b4d2...32bytes",
  "code": "4F2A",
  "expires_in": 300
}
```

Then `/start <token>` arrives at the webhook. The handler binds `chat_id` **from the update**, never from a request body claim. Both surfaces display `4F2A`; mismatch unlinks.

### 6.2 Webhook hardening

```
1. reject if X-Telegram-Bot-Api-Secret-Token != TELEGRAM_WEBHOOK_SECRET
2. INSERT update_id ... ON CONFLICT DO NOTHING      ← idempotency
3. return 200 immediately (< 2s)
4. process in after() / queue
5. never run PostGIS + routing inside the webhook request
```

`export const runtime = 'nodejs'`. Telegram retries aggressively on timeout.

### 6.3 Notification budget — evaluated in order

```
IF quiet hours                    → skip
IF paused                         → skip
IF within 15 km of home AND no trip→ skip
IF sent today >= 3                → skip
IF sent in last 30 min            → defer (batch)
IF this place within 7 days       → skip
IF distance > radius              → skip
IF NOT recommendable(place)       → skip
ELSE send
```

**Digest is the default.** One message with three places beats three messages. This single decision is the difference between a useful bot and a muted bot.

### 6.4 Live location — corrected per [CORRECTION 2]

```
User: /nearby  →  bot asks for live location
      ↓
message.location.live_period = 28800       (8h — the client default)
      ↓
edited_message updates arrive              (detect: edited_message.location)
      ↓
same evaluation pipeline, different transport
```

Session expiry is server-side: `last_location_at < now() - interval '5 minutes'` → `EXPIRED`. A `/nearby` on an expired session prompts to re-share and **never serves stale data**.

Do not encode 8 hours as a ceiling. Accept and extend `live_period` server-side up to `0x7FFFFFFF`.

---

## STAGE 7 — TRIP PACK (offline)

**Goal:** dossiers + PMTiles for a corridor, working in airplane mode.
**Duration:** 4 days.
**Gate:** UI GATE 6.

```json
// GET /api/trip/valparai/pack
{
  "region": "coimbatore-valparai",
  "generated_at": "2026-11-25T10:00:00Z",
  "dossiers": [{ "slug": "siruvani", "json_url": "/pack/siruvani.json", "bytes": 18400 }],
  "tiles": { "pmtiles_url": "/pack/valparai-corridor.pmtiles", "max_zoom": 14, "bytes": 42000000 },
  "matrix": { "places": 12, "towns": 8, "json_url": "/pack/matrix.json" }
}
```

Download prompt fires **on trip declaration**, not on first session — that is when the user has wifi and intent.

**The test that matters:** pull the network cable. Titles, text, badges, and map tiles still render. If anything 404s, the pack is wrong.

---

## STAGE 8 — SIGNALS (defer)

**Do not build until eight weeks of `signal_daily` exist.**

```
emergence = attention_velocity / (1 + documentation)
```

Until then, ship the **"Newly verified"** badge — recency you control — instead of "Rising," which you cannot compute and would be amplifying. `rising_score` returns `0.5` (neutral) and the UI does not show it.

---

## 11. The test matrix — all must pass before launch

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
```

---

## 12. Build order, effort, and the critical path

| Stage | Days | Depends on | Gate |
|---|---|---|---|
| 0 Foundation | 4 | — | check:publishable rejects/accepts |
| 1 Seed Siruvani | 2 | 0 | one dossier end-to-end |
| 2 Map shell | 4 | 1 | UI 1–2 |
| 3 Dossier page | 4 | 1 | UI 3 |
| 4 Search | 3 | 3 | UI 4 |
| 5 Distance/towns | 5 | 2 | three-number model live |
| 6 Telegram | 9 | 5 | UI 5 |
| 7 Trip Pack | 4 | 5 | UI 6 |
| 8 Signals | 4 | 8 weeks data | — |
| **Engineering total** | **~39 days** | | |
| **Content** | 12 dossiers × ~6h ≈ **9 weeks part-time** | | |

**The critical path is content, not code.** Stage 1 cannot be compressed by writing faster. Build Stages 0–3 in parallel with the content sprint. Do not launch the bot before dossier #6 is verified — a bot with nothing to deliver teaches you nothing.

**Stage 6 is the one that decides whether the product is real.** Do not let it slip to the end.

---

## 13. Metrics and kill criteria

**North Star:** weekly *qualified discoveries* — a dossier opened **and** an action taken (directions, save, share).

| Metric | Target (wk 12) | Kill |
|---|---|---|
| Organic sessions/week | 1,500 | <500 by wk 4 |
| Dossier completion (reaches Practical) | >40% | <20% |
| Zero-result searches | <8% | >20% |
| Save rate per dossier view | >10% | <3% |
| Reopen during trip | >20% of savers | <5% |
| Corrections/month | >5 | 0 for two months |
| Telegram link completion | >60% | <25% |
| Digest open rate | >45% | <20% |
| Mute/unlink within 7 days | <15% | **>30% → stop real-time alerts** |

**The kill criterion that matters:** if more than 30% of users disable notifications within a week, the proximity model is wrong. Move to trip-only delivery and stop real-time alerts.

---

## 14. What not to build

Each has a reason, not a preference.

| Don't build | Why |
|---|---|
| Booking / payments | Liability, stale inventory, wrong product |
| User accounts and passwords | `device_id` + `chat_id` is enough through Stage 7 |
| Social feed / profiles | Nobody comes here for other people |
| Itinerary optimiser | Scope trap; Trip Pack covers the need |
| Global or national coverage | Density is the moat |
| Background geofencing in the browser | Impossible; use Telegram live location |
| AI-generated descriptions | Unverifiable; destroys the only differentiator |
| Sponsored placement | Kills trust and the subscription |
| `/trending`, `/discover` at launch | Nothing to show; will look broken |
| Self-hosted OSRM | 600 MB extract, 8–16 GB RAM, four runs a year |
| Google Places | Cost + ToS forbids OSM basemap |
| Redis, ELK, microservices | One process handles this for years |
| Recommendation ML | Deterministic and explainable, or you cannot defend a bad call |

---

## 15. Open decisions still requiring your call

| # | Decision | Recommendation | Blocks |
|---|---|---|---|
| O1 | Tamil-first or bilingual-first UI | Tamil default, English toggle. Harder, stronger moat. | UI GATE 0 |
| O2 | Digest-only or digest + single alerts | Digest-only; single alerts only on a declared corridor | Stage 6 |
| O3 | Brand name | "Wild Atlas" is generic and global. Test a Coimbatore-first name. | UI GATE 0 |
| O4 | DMO target | District administration vs TTDC vs a private anchor | Stage 8 |
| O5 | WhatsApp fallback | Not now. Telegram skews technical; DMO audiences skew family. | Stage 8 |
| O6 | Trip Pack price | ₹399/year | Stage 7 |

---

## 16. Glossary

| Term | Meaning |
|---|---|
| **Dossier** | A published place record: story, documented facts, lore, access, sources, verification |
| **Facet** | A type: Nature, Water, Sacred, Heritage, Industrial, Urban, Dark History |
| **Signal** | A computed/editorial attribute (Obscurity, Narrative, Rising). **Not a filter** |
| **Access point** | Where you actually park or start walking — distinct from the site |
| **Last mile** | Access point → site, with surface and time |
| **Access window** | Hours, closed days, permits, seasonal closure, night-driving ban |
| **Base town** | Nearest settlement with stays, fuel, and year-round road access |
| **Trip Pack** | Offline bundle: dossiers + tiles + matrix for a corridor |
| **Discovery ledger** | Append-only record of when each place entered public awareness |
| **Publishing contract** | `publishable()` — the predicate preventing unsourced or unsafe publication |
| **Recommendation contract** | `recommendable()` — the hard gates preventing bad pushes |

---

## 17. One paragraph to remember

> Wild Atlas is a sourced, bilingual, access-aware field companion for the Coimbatore region. It publishes **dossiers, not pins** — every claim traceable, every place carrying an access point, a base town, a drive time, a last mile, and a gate window. The corpus is the moat; the app is the reading surface; Telegram is the distribution trick that removes the install barrier and supplies the background location the browser cannot. Build depth before breadth, enforce the publishing contract in code, and let the gate numbers decide what happens next.

---

# APPENDIX A — FULL SCHEMA

Run in Stage 0 alongside the core tables.

```sql
-- ── GEO / DISTANCE ─────────────────────────────────────────────
CREATE TABLE town (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              text UNIQUE NOT NULL,
  name_en           text NOT NULL,
  name_ta           text NOT NULL,
  location          geography(Point,4326) NOT NULL,
  population        int,
  elevation_m       int,
  stay_count        int NOT NULL DEFAULT 0,
  character_en      text,
  character_ta      text,
  services          text[] NOT NULL DEFAULT '{}',
  road_in           text CHECK (road_in IN ('PAVED','GHAT','GRAVEL')),
  seasonal_risk     text CHECK (seasonal_risk IN ('NONE','MONSOON','LANDSLIDE')),
  is_gateway        boolean NOT NULL DEFAULT false,
  last_verified_at  date
);

CREATE TABLE place_town (
  place_id       uuid NOT NULL REFERENCES place(id) ON DELETE CASCADE,
  town_id        uuid NOT NULL REFERENCES town(id) ON DELETE CASCADE,
  road_km        numeric(6,1) NOT NULL,
  drive_minutes  int NOT NULL,
  route_note_en  text,
  route_note_ta  text,
  engine         text NOT NULL,
  computed_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (place_id, town_id)
);
CREATE INDEX place_town_reach_idx ON place_town (town_id, drive_minutes);

-- ── IDENTITY ───────────────────────────────────────────────────
CREATE TABLE device (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_uuid   text UNIQUE NOT NULL,
  home_geohash5 text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_seen_at  timestamptz
);

CREATE TABLE telegram_conn (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id       uuid NOT NULL REFERENCES device(id) ON DELETE CASCADE,
  chat_id         bigint UNIQUE NOT NULL,
  tg_username     text,
  is_active       boolean NOT NULL DEFAULT true,
  blocked_by_user boolean NOT NULL DEFAULT false,
  connected_at    timestamptz NOT NULL DEFAULT now(),
  disconnected_at timestamptz
);

CREATE TABLE link_token (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id   uuid NOT NULL REFERENCES device(id) ON DELETE CASCADE,
  token_hash  text NOT NULL,
  code        text NOT NULL,
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz
);

CREATE TABLE preference (
  device_id             uuid PRIMARY KEY REFERENCES device(id) ON DELETE CASCADE,
  radius_m              int NOT NULL DEFAULT 10000 CHECK (radius_m IN (5000,10000,15000,25000)),
  facets                text[] NOT NULL DEFAULT '{}',
  language              text NOT NULL DEFAULT 'EN' CHECK (language IN ('EN','TA')),
  quiet_start           time,
  quiet_end             time,
  tz                    text NOT NULL DEFAULT 'Asia/Kolkata',
  notifications_enabled boolean NOT NULL DEFAULT false,
  digest_mode           boolean NOT NULL DEFAULT true,
  paused_until          timestamptz,
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE location_session (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id        uuid NOT NULL REFERENCES device(id) ON DELETE CASCADE,
  source           text NOT NULL CHECK (source IN ('PWA','TELEGRAM_LIVE')),
  started_at       timestamptz NOT NULL DEFAULT now(),
  last_location_at timestamptz NOT NULL DEFAULT now(),
  expires_at       timestamptz NOT NULL,
  status           text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN
                     ('ACTIVE','EXPIRED','CLOSED'))
  -- deliberately NO lat/lon column
);

CREATE TABLE notification (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id     uuid NOT NULL REFERENCES device(id) ON DELETE CASCADE,
  place_id      uuid REFERENCES place(id),
  kind          text NOT NULL CHECK (kind IN ('DIGEST','SINGLE','TRIP')),
  distance_band text NOT NULL CHECK (distance_band IN ('0-5','5-10','10-15','15-25')),
  score_terms   jsonb,
  tg_message_id bigint,
  delivery      text NOT NULL DEFAULT 'QUEUED' CHECK (delivery IN
                  ('QUEUED','SENT','FAILED')),
  feedback      text CHECK (feedback IN ('USEFUL','NOT_NOW','CLOSED','WRONG_INFO')),
  sent_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notification_budget_idx ON notification (device_id, sent_at DESC);

CREATE TABLE trip (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id    uuid NOT NULL REFERENCES device(id) ON DELETE CASCADE,
  origin_town  uuid REFERENCES town(id),
  dest_town    uuid REFERENCES town(id),
  corridor     geography(LineString,4326),
  starts_at    timestamptz,
  ends_at      timestamptz
);

CREATE TABLE trip_stop (
  trip_id     uuid NOT NULL REFERENCES trip(id) ON DELETE CASCADE,
  place_id    uuid NOT NULL REFERENCES place(id),
  ord         int NOT NULL,
  notified_at timestamptz,
  PRIMARY KEY (trip_id, place_id)
);

-- ── SIGNALS / LEDGER ───────────────────────────────────────────
CREATE TABLE signal_daily (
  place_id   uuid NOT NULL REFERENCES place(id) ON DELETE CASCADE,
  date       date NOT NULL,
  source     text NOT NULL,
  value      numeric NOT NULL,
  PRIMARY KEY (place_id, date, source)
);

CREATE TABLE discovery_event (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id             uuid NOT NULL REFERENCES place(id),
  entered_awareness_at date NOT NULL,
  evidence             jsonb NOT NULL,
  verified_at          date,
  published_at         date
);

-- ── SCOUT (Stage 8+) ───────────────────────────────────────────
CREATE TABLE candidate (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_variants  jsonb NOT NULL,
  centroid       geography(Point,4326),
  precision      text CHECK (precision IN ('EXACT','APPROX','UNKNOWN')),
  novelty        text CHECK (novelty IN ('NEW_TO_CORPUS','KNOWN_LOW_DOC','KNOWN')),
  emergence      numeric,
  status         text NOT NULL DEFAULT 'NEW' CHECK (status IN
                   ('NEW','TRIAGED','VERIFYING','VERIFIED','PUBLISHED','REJECTED','QUARANTINED')),
  open_questions jsonb,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE candidate_signal (
  candidate_id uuid NOT NULL REFERENCES candidate(id) ON DELETE CASCADE,
  source       text NOT NULL,
  url          text,
  captured_at  timestamptz NOT NULL,
  raw_text     text
);
```

---

# APPENDIX B — EVIDENCE INDEX

Every claim in Part I traced to its source file.

| Claim | Evidence file | How measured |
|---|---|---|
| Atlas Obscura Gass Forest page is an unpublished stub | `.research/raw/ao-place.json`, `.research/shots/ao-place.jpg` | Live scrape, 25 Nov 2026 |
| Atlas Obscura has no access/permit/gate fields | `.research/raw/ao-place.json` | Field inspection of page markdown |
| AllTrails Plus $35.99/yr | `.research/raw/at-plans.json` | Live scrape of /plans |
| AllTrails Peak $79.99/yr | Search results (USA Today, SlashGear) | **Secondary — not on scraped page** |
| AllTrails paid features = offline + conditions + alerts | `.research/raw/at-plans.json` | Scraped feature list |
| AllTrails has zero pins in Coimbatore region | `.research/shots/at-explore.jpg` | Visual inspection of live map |
| AllTrails place page has Conditions tab + stat row + sticky bar | `.research/shots/at-trail.jpg` | Screenshot |
| Zafari has 100+ installs | `.research/raw/zafari-play.json` | Play Store listing |
| Zafari home is a 9-tile dashboard | `.research/shots/zafari-app-1-big.jpg` | Play Store screenshot |
| Zafari place page leads with weather | `.research/shots/zafari-app-3-big.jpg` | Play Store screenshot |
| PinIt explore map renders zero pins | `.research/shots/pinit-explore.jpg` | Live capture |
| PinIt taxonomy is a flat 13+ chip row | `.research/raw/pinit-explore.json` | Scraped chip labels |
| Google Ask Maps shipped 12 Mar 2026 | `blog.google` (search result, dated) | Primary source |
| Google has Local Gems / Trending layers | Industry analysis (search result) | Secondary source |
| OSM has 0 waterfalls tagged in region bbox | Live Overpass query, 25 Nov 2026 | Count query, `nodes: 0` |
| Overpass public endpoint at capacity | Overpass 502 response | Live request |
| Telegram `live_period` supports up to `0x7FFFFFFF` | `core.telegram.org/bots/api` | Primary API reference |
| Telegram photo caption limit is 1024 chars | API reference + spec comparison | Primary source |
| Tamil sources exist but are thin (3 sources for Siruvani) | `firecrawl search` Tamil query | Search results |
| Google Maps routing failures documented in India | Multiple news sources | Secondary sources |

**Unverified and therefore not used to justify any decision:**
- AllTrails exact subscriber count and revenue (third-party estimate only).
- Any figure on Zafari's user base beyond the Play Store install bracket.

---

*End of master build book.*
