# Wild Atlas — Screen Catalogue (S1–S19)

**Purpose:** the single source of truth for what the user sees, in what order, with which copy, and which API/table feeds it.
**Companion:** `02-STITCH-PROMPTS.md` (visual generation), `03-API-CONTRACTS.md` (JSON), `04-KIRO-MODULES.md` (build).

> **Tamil status:** every Tamil string below is a **draft**. It must be reviewed by `tamilReviewedBy` before publishing. Do not ship unreviewed Tamil.

---

## 0. Screen map

```
JOURNEY A — anonymous, no permission, no account
  S1 Map home ──► S2 Search entry ──► S3 Results ──► S6 Dossier
     │  │                                  │            │
     │  └──► S4 Filter sheet ──────────────┘            └──► S8 Correction
     ├──► S5 Preview card ──────────────────────────────► S6
     ├──► S7 No results (state of S3)
     └──► S9 Location explainer (only when the user taps "Use my location")

JOURNEY B — identity, alerts, trip
  S6 Dossier ──► S10 Link Telegram (web) ──► S11 Confirm (bot)
                                              │
  S1 ──► S9 ──► S12 Live-location instruction (bot) ──► S13 Arrival digest (bot)
                                                          │
                                                          └──► S14 Feedback (bot)
  S10/S13 ──► S15 Alert settings ──► S16 Saved ──► S17 Trip declaration + pack ──► S18 Offline
  Footer/menu ──► S19 Method
```

**15 web surfaces + 4 Telegram chat screens = 19.**

---

## 1. Master table

| # | Screen | Route / trigger | Render | Job | Primary API | Reads from |
|---|---|---|---|---|---|---|
| S1 | Map home | `/` | RSC shell + client map | Land a first-time visitor on a real map with content visible before any ask | `GET /api/places` | `public_place`, `town`, `place_town` |
| S2 | Search entry | overlay on `/` | client | Turn vague intent into a query | `GET /api/search/suggest` | `public_place`, `town` |
| S3 | Search results | `/?q=…` | RSC + client map | Show matches with base town, road km, drive minutes, access badge | `GET /api/search` | `public_place`, `place_town`, `town` |
| S4 | Filter sheet | sheet on `/` | client | Base town → reach time → facets, in that order | `GET /api/towns`, `GET /api/reach` | `town`, `place_town` |
| S5 | Preview card | half sheet on `/` | client | Enough to decide whether to open the dossier | (from S1/S3 payload) | — |
| S6 | Dossier | `/place/[slug]` | RSC, `revalidate 3600` | The reading surface. The product is judged here | `GET /api/places/{slug}` | `public_place`, `source`, `claim`, `image`, `place_town`, `town` |
| S7 | No results | state of S3 | RSC | Never silent, never an empty map with "add one" | (from `GET /api/search`) | `public_place` |
| S8 | Correction | sheet on S6 | client + POST | Flag a wrong field in <20 s, no account | `POST /api/corrections` | writes `correction` |
| S9 | Location explainer | sheet on S1/S3 | client | Ask for location only after the user asks for something | `POST /api/nearby` | `public_place` (in-memory point) |
| S10 | Telegram link (web) | `/settings/telegram` | RSC + client | Show code + deep link, poll status | `POST /api/telegram/link`, `POST /api/telegram/link/status` | writes `link_token`, `device` |
| S11 | Link confirmation | bot `/start <token>` | server | Bind chat to device only after the code matches | webhook | `link_token`, `telegram_conn` |
| S12 | Live-location instruction | bot `/nearby` | server | Explain how to share live location; never claim the bot starts it | webhook | `location_session` |
| S13 | Arrival digest | bot live-location update | server | One message, up to 3 verified places | webhook + `after()` | `notification`, `route_cache` |
| S14 | Feedback | bot callback | server | 👍 / 👎 / ⛔ / ✏️ on every message | webhook | `notification`, `correction` |
| S15 | Alert settings | `/settings/alerts` | RSC + client | Radius, quiet hours, pause, budget, unlink | `GET/PATCH /api/preferences`, `POST /api/telegram/unlink` | `preference`, `telegram_conn`, `notification` |
| S16 | Saved places | `/saved` | client | Device-local saves; bridge into a Trip Pack | none (localStorage) | — |
| S17 | Trip declaration + pack | `/trip/[corridor]` | RSC + client | Download dossiers + tiles on wifi, before the drive | `POST /api/trips`, `GET /api/trip/{corridor}/pack` | `trip`, `trip_stop`, pack manifest |
| S18 | Offline state | `/trip/[corridor]` offline | client | Prove it works with no signal | service worker cache | — |
| S19 | Method | `/method` | static/RSC | Explain verification. A trust surface, not a paragraph | none | static content |

---

## 2. Journey A — anonymous discovery

### S1 · Map home

- **Route:** `/` — RSC shell, client map, `revalidate 300`
- **Entry:** every first visit, every shared link without `?place=`
- **Rule:** content is visible **before** any permission prompt. No modal on load.
- **Layout, top → bottom:**
  1. Top bar (56 px): wordmark `Wild Atlas` · language toggle `EN | த` · menu (Method, Saved, Settings)
  2. Search pill: `Search a place, a town, a waterfall…`
  3. Control row: `Base town: Valparai ▾` · `Within 60 min ▾` · `Filters`
  4. Map canvas (MapLibre + PMTiles): round pins = places, square pins = towns, selected place lines to top 3 towns
  5. Bottom sheet, collapsed 18%: `12 verified places within 60 min of Valparai` + drag handle
  6. Half state 45%: horizontal card carousel (S5 cards)
  7. Expanded 85%: vertical list with access badges
- **Copy (EN / TA):**
  - `Search a place, a town, a waterfall…` / `இடம், நகரம், அருவி தேடுங்கள்…`
  - `Base town` / `அடித்தள நகரம்`
  - `Within 60 min` / `60 நிமிடங்களுக்குள்`
  - `Filters` / `வடிகட்டி`
  - `12 verified places within 60 min of Valparai` / `வால்பாறையிலிருந்து 60 நிமிடங்களில் 12 சரிபார்க்கப்பட்ட இடங்கள்`
  - `Verified 12 Oct 2026` / `சரிபார்ப்பு 12 அக். 2026`
- **States:**
  - Loading: map skeleton + 3 ghost cards, never a spinner-only screen.
  - WebGL unavailable: list view + `Map unavailable on this device. The list below has everything.`
  - Empty filter: `No verified places match. Try a wider reach or another base town.`
  - Offline: thin banner `Offline — showing your saved trip pack.` Map falls back to cached tiles or hides with a note.
  - Location denied: nothing breaks; base town stays the control.
- **Interactions:** tap pin → S5; drag sheet → snap 18/45/85; `Esc` collapses; tap search → S2; tap Filters → S4; `?place=slug` flies to pin and opens half sheet.
- **API:** `GET /api/places?town=&within=&facets=&limit=200`
- **DB:** `public_place` (no `location`), `town` (no `location`), `place_town`
- **Analytics:** `map_view {lang, places_count}`, `base_town_change {town_slug, within_minutes}`
- **Acceptance:** 3+ pins at access points; no console errors; no permission prompt on load; 390×844 has no horizontal scroll.

---

### S2 · Search entry

- **Trigger:** tap the search pill on S1. Overlay, not a route change.
- **Layout:** back arrow · input (autofocus, `enterKeyHint="search"`) · grouped suggestions · footer hint
- **Groups:** `Places` / `Towns` / `Topics` — max 8 suggestions total
- **Copy:**
  - Placeholder: `Try "waterfall near Valparai"` / `"வால்பாறை அருகில் அருவி" என்று முயற்சிக்கவும்`
  - Group headers: `Places` / `இடங்கள்`, `Towns` / `நகரங்கள்`, `Topics` / `தலைப்புகள்`
  - Hint: `Tamil or English. Both work.` / `தமிழ் அல்லது ஆங்கிலம். இரண்டும் வேலை செய்யும்.`
- **States:** idle (recent searches from localStorage, max 5) · typing (debounced 200 ms) · no suggestions (`Search for "…"`) · offline (`Search needs a connection. Your saved packs still open.`)
- **Interactions:** tap suggestion → S3 with `?q=`; Enter → S3; `Esc` closes and returns focus to the pill.
- **API:** `GET /api/search/suggest?q=&lang=`
- **DB:** `public_place` names + variants, `town` names
- **Analytics:** none until submit (`search` fires on S3)
- **Acceptance:** Tamil input returns Tamil suggestions; keyboard never covers the input on iOS; 44 px rows.

---

### S3 · Search results

- **Route:** `/?q=…` — RSC, dynamic
- **Layout:**
  1. Same top bar + search pill showing the query
  2. Intent row: chips `Waterfalls ×` · `Valparai ×` · `60 min ×` — removable
  3. Count line: `2 places match "waterfalls near Valparai"`
  4. Map with filtered pins (dimmed outside reach)
  5. List, sorted by drive time, each row = S5 card in list form
  6. Sort control: `Drive time` (default) · `Recently verified`
- **Copy:**
  - `2 places match "waterfalls near Valparai"` / `"வால்பாறை அருகில் அருவி"க்கு 2 இடங்கள்`
  - `Drive time` / `பயண நேரம்` · `Recently verified` / `சமீபத்தில் சரிபார்க்கப்பட்டது`
  - `Straight-line distance` / `நேர் தூரம்` (only when `distance.kind = CROW`)
  - `Drive time not verified` / `பயண நேரம் சரிபார்க்கப்படவில்லை`
- **States:** loading (3 skeleton rows) · results · zero → S7 · API error (`Something went wrong. Retry.` + last good results preserved) · offline
- **Interactions:** tap card → S6; tap pin → S5; remove chip → re-query; change sort → client re-order only.
- **API:** `GET /api/search?q=&town=&within=&facets=&lang=`
- **DB:** `public_place`, `place_town`, `town`
- **Analytics:** `search {query_length, lang, zero_results}`
- **Acceptance:** `சிறுவாணி` returns Siruvani first; nonsense returns S7 with 3 nearest; no English facet labels when `lang=ta`.

---

### S4 · Filter sheet

- **Trigger:** `Filters` on S1, or a chip on S3.
- **Order is deliberate: base town first, then reach, then facets.** Nobody plans a trip by facet; they plan from where they sleep.
- **Layout:**
  1. Title `Filters` + `Reset`
  2. `Base town` — native `<select>`, grouped `Gateway` / `Hill stations` / `Cities`
  3. `Within` — segmented `30 / 60 / 90 min`
  4. `Facets` — 7 chips, multi-select: Nature, Water, Sacred, Heritage, Industrial, Urban, Dark History
  5. Sticky footer: `Show 12 places` (primary, disabled at 0 with `No places — widen the reach`)
- **Copy:**
  - `Base town` / `அடித்தள நகரம்` · `Within` / `இதற்குள்` · `Facets` / `வகைகள்`
  - `Show 12 places` / `12 இடங்களைக் காட்டு`
  - `No places — widen the reach` / `இடங்கள் இல்லை — நேரத்தை அதிகரிக்கவும்`
- **States:** default · no matrix for a town (`Drive times for this town are not verified yet` and the reach control is disabled) · 0 results.
- **Interactions:** changes write URL params immediately (shareable); sheet closes on apply; `Esc` closes without applying.
- **API:** `GET /api/towns?eligible=true`, `GET /api/reach?town=&within=`
- **DB:** `town` (`stay_count >= 3`, `services @> {FUEL}`, `road_in IN (PAVED,GHAT)`), `place_town`
- **Analytics:** `base_town_change`, `facet_toggled`
- **Acceptance:** base town is the first control; 44 px chips; applying updates count before closing.

---

### S5 · Preview card

- **Trigger:** tap a pin or a carousel card.
- **Layout:** 96 px thumbnail (or neutral placeholder) · name (Tamil first when `ta`) · 2 facet chips + `+n` · access badge · distance line · verified line · actions `Open dossier` / `Save` / `Share`
- **Copy:**
  - `34 km · 1 h 20 m from Valparai` / `வால்பாறையிலிருந்து 34 கி.மீ · 1 மணி 20 நிமிடம்`
  - `Last mile: 4.2 km jeep track` / `கடைசி மைல்: 4.2 கி.மீ ஜீப் சாலை`
  - `Open dossier` / `முழு விவரம்` · `Save` / `சேமி` · `Share` / `பகிர்`
- **Rules:** never show crow-flies as drive time; never show a hotel; access badge is text + colour, never colour alone.
- **States:** saved / unsaved; `distance.kind = UNKNOWN` → `Drive time not verified`; restricted place → badge `RESTRICTED` and no site coordinate anywhere.
- **API:** payload already loaded; no extra call.
- **DB:** `public_place`, `place_town`
- **Analytics:** `place_card_open {slug, position}`, `save {slug, saved}`, `share {slug, method}`
- **Acceptance:** every card carries an access badge and a verified date; tapping the card (not the button) opens S6.

---

### S6 · Dossier

- **Route:** `/place/[slug]` — RSC, `revalidate 3600`, tag `place:<slug>`
- **Layout, fixed order (12 sections):**
  1. Header: Tamil name, English name, facet chips, access badge, verified badge
  2. One-line hook (≤150 words story begins here)
  3. Hero image — **only** if licence + attribution exist
  4. Stat row, always 3 slots: `town → access` km · drive minutes · last mile
  5. `The Story` (≤150 words, neutral)
  6. `What is documented` — each claim + grade chip A/B/C/D
  7. `What is told` — lore, tinted block, italic lead, always attributed
  8. `Getting there` — route, last mile, transport
  9. `Where to base yourself` — max 3 towns, km, minutes, one character line
  10. `Practical` — hours, entry, season, what to carry
  11. `Sensitivity note` — required when `culturalStatus ≠ SECULAR`
  12. `Sources` table + `Verification` block + `This is wrong`
- **Sticky mobile action bar:** `Open in maps` · `Save` · `Share` · `This is wrong`. No booking button, ever.
- **Copy:**
  - `What is documented` / `ஆவணப்படுத்தப்பட்டவை`
  - `What is told` / `கூறப்படுபவை`
  - `Getting there` / `அங்கு செல்வது எப்படி`
  - `Where to base yourself` / `எங்கு தங்கலாம்`
  - `Practical` / `நடைமுறை தகவல்`
  - `Last verified 12 Oct 2026 by R. Kumar` / `கடைசி சரிபார்ப்பு 12 அக். 2026 — R. குமார்`
  - `This is wrong` / `இது தவறு`
  - `Distance is town centre to access point. Times are driving only.` / `தூரம் நகர மையத்திலிருந்து அணுகல் புள்ளி வரை. நேரம் ஓட்டும் நேரம் மட்டும்.`
- **Rules:** unknown values render `UNKNOWN` in grey — the slot is never removed. A claim without a source cannot render. `narrativeScore` is never read for non-secular places. JSON-LD `TouristAttraction` uses the access point; omit `geo` when restricted.
- **States:** normal · retired → 410 with nearest alternatives · not found → 404 · stale (>180 d) → dossier is not public at all (the view excludes it) · offline → cached HTML + `Offline copy` badge.
- **API:** `GET /api/places/{slug}?lang=`
- **DB:** `public_place`, `source`, `claim`, `image`, `place_town` + `town` (explicit columns, **never** `town.location`)
- **Analytics:** `dossier_view`, `dossier_practical_view`, `directions_click`
- **Acceptance:** all 12 sections; EN/TA toggle preserves the page; sources visible; no `location` in the JSON; stat row has 3 slots even when unknown.

---

### S7 · No results / out of region

- **Trigger:** `GET /api/search` returns `count: 0`, or a location outside `REGION_BBOX`.
- **Layout:** message · nearest 3 cards · two actions
- **Copy:**
  - In region: `No exact match — did you mean…` / `சரியான பொருத்தம் இல்லை — இவை உங்களுக்கு உதவுமா…`
  - Out of region: `Wild Atlas covers Coimbatore district and 60 km around it.` / `வைல்ட் அட்லஸ் கோயம்புத்தூர் மாவட்டம் மற்றும் 60 கி.மீ சுற்றளவை மட்டுமே கொண்டுள்ளது.`
  - Actions: `Widen to 90 min` / `90 நிமிடங்களாக விரிவுபடுத்து` · `Search the whole region` / `முழு பகுதியிலும் தேடு`
- **Rules:** never a blank screen; never "be the first to add one"; never a generic error.
- **API:** same as S3 (payload contains `zeroResult.nearest`)
- **DB:** `public_place`
- **Analytics:** `search_zero {query_length}`
- **Acceptance:** `qwertyuiop` returns exactly this screen with 3 real places.

---

### S8 · Correction

- **Trigger:** `This is wrong` on S6 or a card.
- **Layout:** title · field picker (`Access window`, `Location`, `Last mile`, `Sources`, `Other`) · textarea (max 2 000, live counter) · optional email (not required) · hidden honeypot `website` · `Send report`
- **Copy:**
  - `What is wrong?` / `என்ன தவறு?`
  - `No account needed. A reviewer checks this within 48 hours.` / `கணக்கு தேவையில்லை. 48 மணி நேரத்தில் ஒரு சரிபார்ப்பாளர் பார்க்கிறார்.`
  - Success: `Thank you. Your report is with a reviewer.` / `நன்றி. உங்கள் தகவல் சரிபார்ப்பாளரிடம் உள்ளது.`
- **States:** idle · submitting (button spinner, disabled) · success (sheet closes, toast) · rate limited (`Too many reports. Try again in an hour.`) · error (preserve text).
- **API:** `POST /api/corrections`
- **DB:** writes `correction` (`status=OPEN`); rate limit row in `rate_limit`
- **Analytics:** `correction_submit {field}` — never the message text
- **Acceptance:** submit creates a row; 6th submit in an hour returns 429; honeypot filled → silent 201, no row.

---

### S9 · Location explainer

- **Trigger:** only when the user taps `Use my location`. Never on load.
- **Layout:** title · three bullets · primary `Allow once` · secondary `Choose a base town instead`
- **Copy:**
  - `Use your location?` / `உங்கள் இருப்பிடத்தைப் பயன்படுத்தவா?`
  - `Used once, to sort places by distance.` / `ஒருமுறை மட்டும் — தூரப்படி வரிசைப்படுத்த.`
  - `Not stored. Not tracked in the background.` / `சேமிக்கப்படாது. பின்னணியில் கண்காணிக்கப்படாது.`
  - `For background alerts, link Telegram.` / `பின்னணி அறிவிப்புகளுக்கு டெலிகிராமை இணைக்கவும்.`
  - `Allow once` / `ஒருமுறை அனுமதி` · `Choose a base town instead` / `அடித்தள நகரத்தைத் தேர்ந்தெடு`
- **States:** prompt · granted (map recenters, `distance.kind=CROW`, label `Straight-line distance`) · denied (`Location off. Pick a base town — everything still works.`) · timeout.
- **API:** `POST /api/nearby` (body, `no-store`)
- **DB:** reads `public_place`; **writes nothing** — the point is evaluated in memory and discarded
- **Analytics:** none (no coordinates, no event)
- **Acceptance:** no permission prompt before this tap; denied path never breaks the map; response contains no stored location.

---

## 3. Journey B — identity, alerts, trip

### S10 · Link Telegram — web

- **Route:** `/settings/telegram` — RSC + client, `no-store`
- **Layout:** three numbered steps · large 4-character code · copy button · `Open Telegram` button · countdown · status line · unlink block when linked
- **Copy:**
  - `Link Telegram` / `டெலிகிராமை இணை`
  - Step 1 `Open Telegram and press Start.` / `டெலிகிராமைத் திறந்து Start அழுத்துங்கள்.`
  - Step 2 `Enter this code in the chat.` / `இந்தக் குறியீட்டை அரட்டையில் உள்ளிடுங்கள்.`
  - Step 3 `Come back here. This page updates itself.` / `இங்கே திரும்பி வாருங்கள். இந்தப் பக்கம் தானாக புதுப்பிக்கும்.`
  - `Expires in 4:58` / `4:58 இல் காலாவதியாகும்`
  - `Waiting for Telegram…` / `டெலிகிராமிற்காக காத்திருக்கிறது…`
  - Linked: `Linked. At most 3 digests a day.` / `இணைக்கப்பட்டது. நாளொன்றுக்கு அதிகபட்சம் 3 அறிவிப்புகள்.`
  - `Unlink` / `இணைப்பை நீக்கு`
- **States:** creating · code shown · expired (`Code expired. Get a new one.`) · linked · error.
- **API:** `POST /api/telegram/link`, then `POST /api/telegram/link/status` every 2 s (max 150 s), `POST /api/telegram/unlink`
- **DB:** writes `device` (upsert), `link_token`; reads `telegram_conn`
- **Analytics:** `telegram_link_start`, `telegram_link_complete`
- **Acceptance:** code is 4 chars from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`; token never appears in a URL query string; page never receives `chat_id`.

---

### S11 · Telegram — link confirmation

- **Trigger:** `/start` or `/start <token>` in the bot.
- **Copy (bot, HTML parse mode):**
  - No token: `Open Wild Atlas → Settings → Telegram and press "Open Telegram" there. A bare link cannot be linked.` / `வைல்ட் அட்லஸ் → Settings → Telegram திறந்து "Open Telegram" அழுத்துங்கள்.`
  - With token: `Enter the 4-character code shown in Wild Atlas.` / `வைல்ட் அட்லஸில் காட்டப்படும் 4 எழுத்துக் குறியீட்டை உள்ளிடுங்கள்.`
  - Success: `Linked. You will get at most 3 verified place digests a day.\n\n/nearby /radius /pause /stop`
  - Wrong code: `That code does not match. 2 attempts left.` / `குறியீடு பொருந்தவில்லை. 2 முயற்சிகள் மீதம்.`
- **Rules:** `chat_id` comes from the update, never from a request body. 3 wrong attempts invalidate the token. Forwarded deep link alone never binds.
- **API:** `POST /api/telegram/webhook` → `after()`
- **DB:** `telegram_update` (idempotency), `link_token` (`attempts`, `used_at`), `telegram_conn`, `preference`
- **Acceptance:** wrong code 3× → token invalid; replay of the same `update_id` → one bind.

---

### S12 · Telegram — live-location instruction

- **Trigger:** `/nearby` with no active session.
- **Copy:**
  - `The bot cannot start live location for you — Telegram only lets you start it.` / `பாட் உங்கள் நேரடி இருப்பிடத்தைத் தொடங்க முடியாது — டெலிகிராம் மட்டுமே அதைத் தொடங்க அனுமதிக்கும்.`
  - `Attach → Location → Share Live Location → 1 hour.` / `இணைப்பு → இருப்பிடம் → நேரடி இருப்பிடத்தைப் பகிர் → 1 மணி.`
  - `Or tap below to send one location now.` / `அல்லது இப்போது ஒரு இருப்பிடத்தை அனுப்ப கீழே அழுத்துங்கள்.`
  - Button: `Send current location` / `தற்போதைய இருப்பிடத்தை அனுப்பு` (`request_location: true`)
- **Rules:** never say the bot starts, extends, or monitors live location. Expiry is server-side: `last_location_at < now() - 5 min`.
- **API:** webhook; `sendMessage` with `reply_markup.keyboard`
- **DB:** `location_session` (no lat/lon column), `telegram_conn`
- **Acceptance:** `/nearby` on an expired session prompts and never serves stale data.

---

### S13 · Telegram — arrival digest

- **Trigger:** first live-location update inside `REGION_BBOX`, then at most one per 30 min, max 3/day.
- **Layout:** one message, up to 3 places, footer, 2 keyboard rows.
- **Copy template:**
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
  ```
  Buttons — row 1: `[ Explore ] [ Directions ]`; row 2: `[ 👍 Useful ] [ 👎 Not now ] [ ⛔ Closed ] [ ✏️ Wrong ]`
- **Rules:** caption budget 900 chars (hard cap 1 024). `parse_mode: HTML`. `disable_web_page_preview`. Every message carries feedback buttons. No coordinates in `notification`; distance stored as a band (`0-5`, `5-10`, `10-15`, `15-25`).
- **API:** webhook → candidate query → `recommendable()` → score → route winner (cache 30 min) → `sendMessage`
- **DB:** `public_place`, `place_town`, `preference`, `notification`, `route_cache`, `location_session`
- **Acceptance:** 10 pings in 60 s → ≤1 message; 6 places passed in 20 min → exactly 1 digest; `⛔ Closed` writes a correction and never changes the place.

---

### S14 · Telegram — feedback callbacks

- **Copy:**
  - `👍` → `Thanks — noted.` / `நன்றி — பதிவு செய்யப்பட்டது.`
  - `👎` → `Noted. This place is hidden for 7 days.` / `பதிவு செய்யப்பட்டது. இந்த இடம் 7 நாட்களுக்கு மறைக்கப்படும்.`
  - `⛔` → `Thanks. We will check whether it is closed.` / `நன்றி. மூடப்பட்டுள்ளதா என்பதைச் சரிபார்ப்போம்.`
  - `✏️` → `Thanks. A reviewer will look at this place.` / `நன்றி. ஒரு சரிபார்ப்பாளர் இதைப் பார்ப்பார்.`
- **Rules:** `⛔` and `✏️` insert `correction` rows; nothing auto-changes. `👎` sets a 7-day per-place suppression.
- **API:** webhook `callback_query` → `answerCallbackQuery`
- **DB:** `notification.feedback`, `correction`
- **Acceptance:** every callback answers within 2 s; no duplicate correction on a replayed callback.

---

### S15 · Alert settings

- **Route:** `/settings/alerts` — RSC + client, `no-store`
- **Layout:**
  1. Link status card (`Linked as @…` / `Not linked` + `Link Telegram`)
  2. `Notifications` toggle
  3. `Radius` segmented `5 / 10 / 15 / 25 km`
  4. `Quiet hours` two time inputs + `Overnight` hint
  5. `Pause` — `Pause for 24 hours` / `Resume now`
  6. `Today's budget` — `1 of 3 digests sent`
  7. `Digest only` — read-only note: `One message with up to 3 places. Never three messages.`
  8. `Privacy` — `No coordinates stored. Distance is saved as a band only.`
  9. `Unlink Telegram`
- **Copy:**
  - `Alerts` / `அறிவிப்புகள்` · `Radius` / `சுற்றளவு` · `Quiet hours` / `அமைதி நேரம்`
  - `Pause for 24 hours` / `24 மணி நேரம் இடைநிறுத்து`
  - `1 of 3 digests sent` / `3 இல் 1 அறிவிப்பு அனுப்பப்பட்டது`
  - `No coordinates stored.` / `இருப்பிட ஒருங்கிணைப்புகள் சேமிக்கப்படுவதில்லை.`
- **States:** not linked (radius/quiet disabled with `Link Telegram to set alerts`) · linked · paused (banner + resume) · saving (optimistic, rollback on error).
- **API:** `GET/PATCH /api/preferences`, `POST /api/telegram/unlink`
- **DB:** `preference`, `telegram_conn`, `notification` (count today)
- **Analytics:** none with values; only `settings_change {field}` if enabled later
- **Acceptance:** radius only accepts 5 000/10 000/15 000/25 000; overnight quiet hours work (22:00–07:00); pause hides digests immediately.

---

### S16 · Saved places

- **Route:** `/saved` — client only
- **Layout:** title + count · list of saved cards · per-row `Remove` · footer `Build a trip pack` → S17 · empty state
- **Copy:**
  - `Saved` / `சேமிக்கப்பட்டவை`
  - `Saved on this device only.` / `இந்தச் சாதனத்தில் மட்டும் சேமிக்கப்படுகிறது.`
  - Empty: `Nothing saved yet. Tap Save on any dossier.` / `இன்னும் எதுவும் சேமிக்கப்படவில்லை. ஏதேனும் ஒரு விவரத்தில் Save அழுத்துங்கள்.`
  - `Build a trip pack` / `பயணத் தொகுப்பை உருவாக்கு`
- **Rules:** localStorage only — no table, no API, no sync. Store `{slug, name, savedAt}`; never coordinates.
- **States:** empty · populated · `In your offline pack` badge when the slug is in a downloaded pack.
- **API:** none
- **DB:** none
- **Analytics:** `save` (on toggle, from S5/S6)
- **Acceptance:** survives reload; clearing storage empties the list without an error.

---

### S17 · Trip declaration → Trip Pack

- **Route:** `/trip/[corridor]` — RSC + client
- **Corridors:** `coimbatore-valparai`, `coimbatore-anaikatti`, `coimbatore-topslip`
- **Layout:**
  1. Title + corridor name
  2. Dates (`startsAt`, `endsAt`) — optional but recommended
  3. Pack summary: `6 dossiers · 38 MB map · 22 towns`
  4. `Download pack` primary; progress bar; `Cancel`
  5. Storage line: `Uses about 40 MB. 2.1 GB free.`
  6. `Delete pack`
  7. Note: `Works in airplane mode. Distances are precomputed.`
- **Copy:**
  - `Trip pack` / `பயணத் தொகுப்பு`
  - `Download before you drive.` / `புறப்படும் முன் பதிவிறக்குங்கள்.`
  - `6 dossiers · 38 MB map · 22 towns` / `6 விவரங்கள் · 38 எம்பி வரைபடம் · 22 நகரங்கள்`
  - `Download pack` / `தொகுப்பைப் பதிவிறக்கு`
  - `Works in airplane mode.` / `விமானப் பயன்முறையிலும் வேலை செய்யும்.`
- **States:** not downloaded · downloading (progress, cancel) · downloaded (version + date) · quota warning (`Not enough space. Free 50 MB and retry.`) · metered warning.
- **API:** `POST /api/trips`, `GET /api/trip/{corridor}/pack`, then direct R2 fetches for tiles/dossiers
- **DB:** `trip`, `trip_stop`; pack manifest built offline from `public_place` + `place_town`
- **Analytics:** `pack_download {corridor, bytes}`
- **Acceptance:** prompt appears on declaration, not on first session; pack JSON contains no `location`; delete frees cache.

---

### S18 · Offline state

- **Trigger:** `navigator.onLine === false`, or a fetch failure with a pack present.
- **Layout:** thin top banner · `Offline copy` badge on cached dossiers · map from cached PMTiles · uncached dossier → message + link to saved
- **Copy:**
  - `Offline — showing your saved trip pack.` / `இணையமில்லை — சேமித்த பயணத் தொகுப்பு காட்டப்படுகிறது.`
  - `This place is not in your pack.` / `இந்த இடம் உங்கள் தொகுப்பில் இல்லை.`
  - `Back online.` / `மீண்டும் இணைப்பில்.` (toast, no reload)
- **Rules:** never a browser error page; never a broken image; API calls are network-only with an offline message.
- **API:** none (service worker)
- **DB:** none
- **Acceptance:** airplane mode → dossier text, Tamil, badge, stat row, sources all render; tiles render or the map hides with a note; returning online recovers without reload.

---

### S19 · Method

- **Route:** `/method` — static/RSC
- **Layout:**
  1. `How Wild Atlas is verified`
  2. What "verified" means (a human checked access, not just existence)
  3. Source grades A–D table
  4. Fact vs lore rule
  5. The 180-day rule
  6. Corrections and who reviews them
  7. What we refuse to publish (restricted, sacred promotion, unsafe)
  8. Privacy in one paragraph
  9. `No AI-written descriptions.` + contact
- **Copy:**
  - `How Wild Atlas is verified` / `வைல்ட் அட்லஸ் எப்படி சரிபார்க்கப்படுகிறது`
  - `Every fact has a source. Every source has a grade.` / `ஒவ்வொரு தகவலுக்கும் ஆதாரம். ஒவ்வொரு ஆதாரத்துக்கும் தரம்.`
  - `A place disappears after 180 days without re-verification.` / `180 நாட்களுக்கு மறுசரிபார்ப்பு இல்லாவிட்டால் இடம் நீங்கும்.`
  - `No AI-written descriptions.` / `AI எழுதிய விவரங்கள் இல்லை.`
- **States:** static; no personalization.
- **API:** none
- **DB:** none (content module)
- **Analytics:** `method_view` (optional)
- **Acceptance:** reachable from the menu and the footer of every dossier; Lighthouse a11y ≥95.

---

## 4. System states (not separate screens)

| State | Where | Behaviour |
|---|---|---|
| 404 | any route | `We could not find that place.` + links to map and method |
| 410 | retired dossier | `This place has been retired.` + nearest 3 + reason |
| 500 | any route | `Something went wrong.` + retry + map link; never a stack trace |
| Rate limited | S8, S10 | `Too many requests. Try again in an hour.` + `Retry-After` |
| Maintenance | global | Banner only; dossiers from cache still readable |
| No JS | `/`, `/place` | RSC content + list; map replaced by a static image + list |
| Reduced motion | all | No fly animations, no sheet spring |

---

## 5. Screen → API → database matrix

| Screen | Endpoint | Server module | Tables / views | Writes |
|---|---|---|---|---|
| S1 | `GET /api/places` | `db/queries/places.ts` | `public_place`, `town`, `place_town` | — |
| S2 | `GET /api/search/suggest` | `db/queries/search.ts` | `public_place`, `town` | — |
| S3 | `GET /api/search` | `db/queries/search.ts` | `public_place`, `place_town` | — |
| S4 | `GET /api/towns`, `GET /api/reach` | `db/queries/reach.ts` | `town`, `place_town` | — |
| S5 | — (payload) | — | — | — |
| S6 | `GET /api/places/{slug}` | `db/queries/dossier.ts` | `public_place`, `source`, `claim`, `image`, `place_town`, `town` | — |
| S7 | `GET /api/search` | `db/queries/search.ts` | `public_place` | — |
| S8 | `POST /api/corrections` | `app/api/corrections/route.ts` | `correction`, `rate_limit` | ✔ |
| S9 | `POST /api/nearby` | `db/queries/places.ts` | `public_place` | — (in-memory point) |
| S10 | `POST /api/telegram/link`, `…/status`, `…/unlink` | `lib/telegram/link.ts` | `device`, `link_token`, `telegram_conn` | ✔ |
| S11–S14 | `POST /api/telegram/webhook` | `lib/telegram/process.ts` | `telegram_update`, `telegram_conn`, `link_token`, `location_session`, `notification`, `correction`, `route_cache` | ✔ |
| S15 | `GET/PATCH /api/preferences` | `app/api/preferences/route.ts` | `preference`, `telegram_conn`, `notification` | ✔ |
| S16 | — | — | localStorage | — |
| S17 | `POST /api/trips`, `GET /api/trip/{corridor}/pack` | `lib/trip/manifest.ts` | `trip`, `trip_stop`, pack manifest | ✔ |
| S18 | — | service worker | — | — |
| S19 | — | static | — | — |

**Browser never imports `db/**` or `postgres`.** Enforced by ESLint `no-restricted-imports`; see `04-KIRO-MODULES.md` M0.

---

## 6. Analytics map (consent-gated, no coordinates)

| Event | Screen | Properties |
|---|---|---|
| `map_view` | S1 | `lang`, `places_count` |
| `base_town_change` | S1/S4 | `town_slug`, `within_minutes` |
| `place_card_open` | S5 | `slug`, `position` |
| `dossier_view` | S6 | `slug`, `lang`, `access_status` |
| `dossier_practical_view` | S6 | `slug` |
| `directions_click` | S6 | `slug` |
| `save` | S5/S6 | `slug`, `saved` |
| `share` | S5/S6 | `slug`, `method` |
| `search` | S3 | `query_length`, `lang`, `zero_results` |
| `search_zero` | S7 | `query_length` |
| `telegram_link_start` | S10 | — |
| `telegram_link_complete` | S10 | — |
| `correction_submit` | S8 | `field` |
| `pack_download` | S17 | `corridor`, `bytes` |
| `pack_offline_open` | S18 | `slug` |

Never: a coordinate, a chat ID, a token, or free-text correction content.
