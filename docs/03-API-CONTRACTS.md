# Wild Atlas — API Contracts

**Version:** 1.0 · 27 November 2026
**Base URL:** `http://localhost:3000` (local) · `https://<preview>.vercel.app` (preview) · `https://<domain>` (production)
**Content type:** `application/json; charset=utf-8` on every request and response
**Importable collection:** [`../postman/WildAtlas.postman_collection.json`](../postman/WildAtlas.postman_collection.json)

This file is the contract. If Kiro, the UI, or a test disagrees with it, this file wins until you deliberately change it here first.

---

## 1. Conventions

### 1.1 Shape

- Success responses are **resource-shaped** top-level objects (`{ "places": [...] }`), never a generic `{data: ...}` wrapper.
- Errors are **always** `{ "error": { code, message, details?, requestId } }`.
- A required key is present even when its value is `null`. Optional keys are omitted, not nulled.
- Lists are capped. There is no cursor pagination in Phase 1 because the corpus is ≤200 places.

### 1.2 Types

| Type | JSON | Rules |
|---|---|---|
| `Localized` | `{ "en": string, "ta": string }` | Both present on every public object. Never machine-translated. |
| `GeoPoint` | `{ "lon": number, "lat": number }` | WGS84, 5 decimals max. **Only ever `accessPoint` in public JSON.** |
| `Date` | `"2026-10-12"` | Date-only, `YYYY-MM-DD`, IST calendar date. |
| `Timestamp` | `"2026-11-27T06:12:00.000Z"` | UTC, ISO 8601, milliseconds, `Z`. |
| `Minutes` | integer | Drive time is **rounded up** (4 801 s → 81). |
| `Km` | number | One decimal (34.0). Road distance is town centre → access point. |
| `Enum` | UPPER_SNAKE | Comes from `lib/taxonomy.ts`. No free strings. |

### 1.3 Language

`?lang=en|ta` on every read endpoint. Resolution order: query → `wa_lang` cookie → `DEFAULT_LANG`. A missing or invalid value is not an error; it falls back. Response echoes `"lang"` where the payload is language-dependent.

### 1.4 Identity

- Anonymous device identity is the **`wa_device` httpOnly cookie** (UUID v4, `SameSite=Lax`, `Secure` in production, 1 year).
- Endpoints that need identity create the cookie on first use (`POST /api/corrections`, `/api/telegram/link`, `/api/preferences`, `/api/trips`).
- **Dev/test override:** `X-Device-Id: <uuid>` is accepted only when `NODE_ENV !== 'production'`. Postman uses the cookie jar; the header exists for scripted runs.
- No login, no password, no email required.

### 1.5 Caching headers

| Endpoint | `Cache-Control` |
|---|---|
| `GET /api/places`, `/api/search`, `/api/reach`, `/api/taxonomy`, `/api/towns` | `public, s-maxage=300, stale-while-revalidate=600` |
| `GET /api/places/{slug}` | `public, s-maxage=3600, stale-while-revalidate=86400` |
| `GET /api/search/suggest` | `public, s-maxage=60` |
| `GET /api/trip/{corridor}/pack` | `public, max-age=60, must-revalidate` |
| `GET /api/health` | `no-store` |
| `GET /api/preferences`, `POST /api/nearby`, link endpoints, trips | `no-store` |
| Pack assets on R2 | `public, max-age=31536000, immutable` |

### 1.6 Rate limits

| Endpoint | Limit | Key | Response |
|---|---|---|---|
| `POST /api/corrections` | 5 / hour | IP hash | 429 + `Retry-After` |
| `POST /api/telegram/link` | 10 / hour | device | 429 |
| `POST /api/telegram/link/status` | 60 / hour | device | 429 |
| `GET /api/search/suggest` | 60 / minute | IP hash | 429 |
| `GET /api/search` | 60 / minute | IP hash | 429 |
| `POST /api/nearby` | 30 / minute | device or IP hash | 429 |
| `POST /api/trips` | 10 / day | device | 429 |
| `POST /api/telegram/webhook` | — (Telegram only) | secret header | 403 |
| `POST /api/cron/*`, `/api/revalidate` | — | `Bearer CRON_SECRET` | 401 |

Every limited response carries `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` (epoch seconds).

### 1.7 Idempotency

| Endpoint | Mechanism |
|---|---|
| `POST /api/telegram/webhook` | `telegram_update.update_id` primary key |
| `POST /api/corrections` | none (duplicates allowed; triage dedupes) |
| `POST /api/trips` | one `PLANNED` trip per `(device, corridor)`; a second call returns the existing trip (200, not 201) |
| `POST /api/telegram/link` | a new token invalidates the previous unused one for that device |

---

## 2. Error envelope

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Query parameter 'within' must be one of 30, 60, 90, 120.",
    "details": [
      { "path": "within", "message": "Invalid enum value" }
    ],
    "requestId": "req_01JCV8Z3K4"
  }
}
```

| `code` | HTTP | When |
|---|---|---|
| `VALIDATION_FAILED` | 400 | Zod parse failure on query, body, or params |
| `UNAUTHORIZED` | 401 | Missing/wrong `Authorization: Bearer` on cron or revalidate |
| `FORBIDDEN` | 403 | Wrong webhook secret; cross-origin state change |
| `NOT_FOUND` | 404 | Unknown slug, trip, or corridor |
| `METHOD_NOT_ALLOWED` | 405 | Wrong verb |
| `CONFLICT` | 409 | Second active trip for the same corridor with different dates |
| `GONE` | 410 | Retired dossier |
| `PAYLOAD_TOO_LARGE` | 413 | Body > 1 MB (webhook) or > 8 KB (other writes) |
| `UNPROCESSABLE` | 422 | `MATRIX_UNAVAILABLE`, `OUT_OF_REGION`, `PLACE_NOT_PUBLIC` |
| `RATE_LIMITED` | 429 | Limit exceeded; `Retry-After` present |
| `INTERNAL` | 500 | Unhandled; never leaks a stack trace or SQL |
| `UNAVAILABLE` | 503 | DB or dependency down; `Retry-After: 30` |

`message` is human-readable English for developers. **User-facing copy lives in the UI, not in `error.message`.** The one exception is `zeroResult.message`, which is localized product copy.

---

## 3. Field safety — what may never appear in a response

| Field | Stored in | In public JSON? | Notes |
|---|---|---|---|
| `place.location` | `place` | **Never** | Site coordinate. The `public_place` view has no such column. |
| `place.publish_site_coordinates` | `place` | **Never** | Internal policy flag. |
| `town.location` | `town` | **Never** | Select explicit town columns only. |
| `chat_id` | `telegram_conn` | **Never** | Not even in `/api/preferences`; return `linked: true`. |
| `token_hash` | `link_token` | **Never** | The raw token is returned once, to the creating device. |
| `home_geohash5` | `device` | **Never** | Coarse home cell. |
| `location_session` coordinates | not stored | — | Point evaluated in memory and discarded. |
| `notification.score_terms` | `notification` | **Never** | Internal explanation. |
| Correction message text | `correction` | **Never** | Not in analytics, not in logs. |

A CI test serializes every public DTO and asserts the string `"location"` does not occur.

---

## 4. DTOs

### 4.1 `Distance`

```json
{ "kind": "ROAD", "roadKm": 34.0, "driveMinutes": 80, "fromTown": "coimbatore", "computedAt": "2026-11-01T00:00:00.000Z" }
```
```json
{ "kind": "CROW", "crowM": 4100 }
```
```json
{ "kind": "UNKNOWN" }
```

Rules: `ROAD` only when a `place_town` row exists. `CROW` is straight-line and **must** be labelled as such in the UI. `UNKNOWN` excludes the place from time filters.

### 4.2 `PlaceCard`

```json
{
  "slug": "siruvani-falls",
  "name": { "en": "Siruvani Falls", "ta": "சிறுவாணி அருவி" },
  "summary": {
    "en": "A perennial falls inside the Siruvani reserve, reached through a forest checkpost.",
    "ta": "சிறுவாணி காப்புக்காட்டுக்குள், வனச் சோதனைச் சாவடி வழியாக அடையக்கூடிய நீர்வீழ்ச்சி."
  },
  "facets": ["WATER", "NATURE"],
  "accessStatus": "OPEN",
  "accessPoint": { "lon": 76.7012, "lat": 10.9481 },
  "accessPointLabel": {
    "en": "Forest checkpost on the Siruvani road",
    "ta": "சிறுவாணி சாலையில் உள்ள வனச் சோதனைச் சாவடி"
  },
  "lastVerifiedAt": "2026-10-12",
  "thumbnailUrl": null,
  "distance": { "kind": "ROAD", "roadKm": 34.0, "driveMinutes": 80, "fromTown": "coimbatore", "computedAt": "2026-11-01T00:00:00.000Z" }
}
```

`distance` is `null` when no town context exists. `thumbnailUrl` is `null` unless a licensed image exists.

### 4.3 `Dossier`

```json
{
  "slug": "siruvani-falls",
  "name": { "en": "Siruvani Falls", "ta": "சிறுவாணி அருவி" },
  "summary": { "en": "…", "ta": "…" },
  "story": { "en": "…", "ta": "…" },
  "body": {
    "documented": { "en": "…", "ta": "…" },
    "lore": { "en": "…", "ta": "…" },
    "gettingThere": { "en": "…", "ta": "…" },
    "practical": { "en": "…", "ta": "…" }
  },
  "facets": ["WATER", "NATURE"],
  "accessStatus": "OPEN",
  "accessPoint": { "lon": 76.7012, "lat": 10.9481 },
  "accessPointLabel": { "en": "…", "ta": "…" },
  "safetyClass": "MODERATE",
  "culturalStatus": "SECULAR",
  "confidence": "SOURCED",
  "lastVerifiedAt": "2026-10-12",
  "verifiedBy": "R. Kumar",
  "sources": [
    {
      "id": "3f1c2a90-6d0e-4a51-9c3e-2b7a1f0d9e11",
      "grade": "A",
      "kind": "gazetteer",
      "title": "Coimbatore District Gazetteer, 1966",
      "url": null,
      "retrievedAt": "2026-09-30",
      "notes": "Access route and reserve boundary."
    },
    {
      "id": "8b7d4c21-1a2f-4e88-b0c5-5d9e6f3a7c42",
      "grade": "B",
      "kind": "news",
      "title": "Forest department restricts Siruvani entry during monsoon",
      "url": "https://example.com/siruvani-entry",
      "retrievedAt": "2026-10-02",
      "notes": null
    }
  ],
  "claims": [
    {
      "id": "c1a2…",
      "section": "access",
      "statement": { "en": "Permit issued at the checkpost, 08:00–16:00.", "ta": "சாவடியில் 08:00–16:00 அனுமதி வழங்கப்படுகிறது." },
      "sourceId": "3f1c2a90-6d0e-4a51-9c3e-2b7a1f0d9e11",
      "isFolklore": false
    },
    {
      "id": "c2b3…",
      "section": "lore",
      "statement": { "en": "Local accounts hold that the falls never run dry.", "ta": "இந்த அருவி ஒருபோதும் வற்றாது என உள்ளூர் கூற்றுகள் சொல்கின்றன." },
      "sourceId": null,
      "isFolklore": true
    }
  ],
  "images": [
    {
      "url": "https://img.example.com/siruvani-01.jpg",
      "width": 1600,
      "height": 1067,
      "license": "CC BY-SA 4.0",
      "attribution": "Photo: A. Raman / CC BY-SA 4.0",
      "sourceUrl": "https://commons.example.org/wiki/Siruvani"
    }
  ],
  "baseTowns": [
    {
      "slug": "coimbatore",
      "name": { "en": "Coimbatore", "ta": "கோயம்புத்தூர்" },
      "character": { "en": "Largest city; hospitals, fuel, most stays.", "ta": "பெரிய நகரம்; மருத்துவமனைகள், எரிபொருள், அதிக தங்குமிடங்கள்." },
      "roadKm": 34.0,
      "driveMinutes": 80,
      "services": ["FUEL_24H", "HOSPITAL", "ATM", "BUS"],
      "isGateway": true
    }
  ],
  "lastMile": {
    "surface": "JEEP",
    "km": 4.2,
    "minutes": 25,
    "note": { "en": "Rough jeep track after the checkpost.", "ta": "சாவடிக்குப் பிறகு கரடுமுரடான ஜீப் சாலை." }
  },
  "accessWindow": {
    "opens": "06:00",
    "closes": "17:00",
    "closedDays": null,
    "permitRequired": true,
    "permitNote": { "en": "Permit at the checkpost; carry photo ID.", "ta": "சாவடியில் அனுமதி; புகைப்பட அடையாள அட்டை எடுத்துச் செல்லவும்." },
    "nightDrivingBanned": true,
    "seasonStartMonth": null,
    "seasonEndMonth": null
  },
  "carryingCapacityNote": null,
  "narrativeScore": 0.72
}
```

Rules:
- `verifiedBy` is a **display name**, not the raw `human:` identifier.
- `narrativeScore` is `null` whenever `culturalStatus !== "SECULAR"`. The UI never renders it as a badge.
- `images` excludes any row without licence and attribution; it can be `[]`.
- `baseTowns` is at most 3, ranked by `driveMinutes`.

### 4.4 `Place` (envelope)

```json
{ "place": { …Dossier… }, "lang": "en" }
```

---

## 5. Endpoints — public read

### 01 · `GET /api/health`

**Auth:** none · **Cache:** `no-store`

**Response 200**
```json
{ "ok": true, "db": "up", "latencyMs": 12, "version": "0.1.0", "time": "2026-11-27T06:12:00.000Z" }
```
**Response 503**
```json
{ "error": { "code": "UNAVAILABLE", "message": "Database check failed.", "requestId": "req_01JCV8Z3K4" } }
```
**DB:** `SELECT 1` only. No schema names, no table names, no connection string.
**Postman:** assert `status === 200` and `body.db === "up"`.

---

### 02 · `GET /api/taxonomy`

**Auth:** none · **Cache:** 300 s

**Query:** `lang` (`en|ta`, default env)

**Response 200**
```json
{
  "lang": "en",
  "facets": [
    { "key": "NATURE", "label": "Nature", "labelTa": "இயற்கை", "token": "--facet-nature" },
    { "key": "WATER", "label": "Water", "labelTa": "நீர்நிலை", "token": "--facet-water" },
    { "key": "SACRED", "label": "Sacred", "labelTa": "தெய்வீகம்", "token": "--facet-sacred" },
    { "key": "HERITAGE", "label": "Heritage", "labelTa": "பாரம்பரியம்", "token": "--facet-heritage" },
    { "key": "INDUSTRIAL", "label": "Industrial", "labelTa": "தொழில்துறை", "token": "--facet-industrial" },
    { "key": "URBAN", "label": "Urban", "labelTa": "நகர்ப்புறம்", "token": "--facet-urban" },
    { "key": "DARK_HISTORY", "label": "Dark History", "labelTa": "இருண்ட வரலாறு", "token": "--facet-dark" }
  ],
  "accessStatuses": [
    { "key": "OPEN", "label": "Open", "labelTa": "திறந்துள்ளது", "token": "--status-open" },
    { "key": "SEASONAL", "label": "Seasonal", "labelTa": "பருவகாலம்", "token": "--status-seasonal" },
    { "key": "PERMIT", "label": "Permit", "labelTa": "அனுமதி தேவை", "token": "--status-permit" },
    { "key": "RESTRICTED", "label": "Restricted", "labelTa": "கட்டுப்படுத்தப்பட்டது", "token": "--status-restricted" },
    { "key": "CLOSED", "label": "Closed", "labelTa": "மூடப்பட்டுள்ளது", "token": "--status-closed" }
  ],
  "surfaces": ["PAVED", "GRAVEL", "JEEP", "WALK", "BOAT"],
  "services": ["FUEL", "FUEL_24H", "HOSPITAL", "PHARMACY", "ATM", "BUS", "EV", "MECHANIC"],
  "corridors": [
    { "slug": "coimbatore-valparai", "label": { "en": "Coimbatore → Valparai", "ta": "கோயம்புத்தூர் → வால்பாறை" }, "places": 6 },
    { "slug": "coimbatore-anaikatti", "label": { "en": "Coimbatore → Anaikatti", "ta": "கோயம்புத்தூர் → ஆனைக்கட்டி" }, "places": 4 },
    { "slug": "coimbatore-topslip", "label": { "en": "Coimbatore → Topslip", "ta": "கோயம்புத்தூர் → டாப்ஸ்லிப்" }, "places": 5 }
  ]
}
```
**DB:** none — generated from `lib/taxonomy.ts`; `corridors[].places` from `public_place` counts.
**Why:** the UI never hardcodes a facet label or colour token.

---

### 03 · `GET /api/towns`

**Auth:** none · **Cache:** 300 s

**Query:** `eligible` (`true` default) · `lang`

**Response 200**
```json
{
  "count": 22,
  "towns": [
    {
      "slug": "valparai",
      "name": { "en": "Valparai", "ta": "வால்பாறை" },
      "character": { "en": "Tea town; most stays in the estate belt.", "ta": "தேயிலை நகரம்; தோட்டப் பகுதியில் அதிக தங்குமிடங்கள்." },
      "elevationM": 1063,
      "stayCount": 12,
      "services": ["FUEL", "HOSPITAL", "PHARMACY", "ATM"],
      "roadIn": "GHAT",
      "seasonalRisk": "LANDSLIDE",
      "isGateway": false,
      "lastVerifiedAt": "2026-10-01",
      "matrix": { "computedAt": "2026-11-01T00:00:00.000Z", "stale": false }
    }
  ]
}
```

**Never present:** `location`, `id`, `population` (not needed by the UI).
**Eligibility filter (`eligible=true`):** `stay_count >= 3` AND `services @> {FUEL}` AND `road_in IN ('PAVED','GHAT')` AND `last_verified_at >= current_date - 180`.
**DB:** `town`, `place_town` (for `matrix`).
**Postman:** assert `body.towns[0]` has no `location` key.

---

### 04 · `GET /api/places`

**Auth:** none · **Cache:** 300 s

**Query**

| Param | Type | Default | Rules |
|---|---|---|---|
| `town` | slug | — | If present, `within` is required |
| `within` | 30 \| 60 \| 90 \| 120 | 60 | Minutes |
| `facets` | csv | — | Subset of `FACETS`; OR semantics — a place matches if it has any listed facet |
| `bbox` | `minLon,minLat,maxLon,maxLat` | — | 4 numbers |
| `limit` | 1–200 | 200 | |
| `lang` | `en\|ta` | env | |

**Response 200**
```json
{
  "count": 1,
  "filter": { "town": "coimbatore", "withinMinutes": 60, "facets": [], "bbox": null },
  "places": [ { "slug": "siruvani-falls", "name": { "en": "Siruvani Falls", "ta": "சிறுவாணி அருவி" }, "summary": { "en": "…", "ta": "…" }, "facets": ["WATER", "NATURE"], "accessStatus": "OPEN", "accessPoint": { "lon": 76.7012, "lat": 10.9481 }, "accessPointLabel": { "en": "…", "ta": "…" }, "lastVerifiedAt": "2026-10-12", "thumbnailUrl": null, "distance": { "kind": "ROAD", "roadKm": 34.0, "driveMinutes": 80, "fromTown": "coimbatore", "computedAt": "2026-11-01T00:00:00.000Z" } } ],
  "meta": { "generatedAt": "2026-11-27T06:12:00.000Z", "matrixStale": false, "clamped": false }
}
```

**Errors**

| Status | Code | When |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Bad enum, bad bbox, `within` without `town` is allowed (ignored) |
| 422 | `MATRIX_UNAVAILABLE` | `town` has no `place_town` rows |

**DB:** `public_place` (explicit columns, `ST_X/ST_Y(access_point::geometry)`), `place_town`, `town` slug only.
**Rules:** `within` without `town` is ignored, not an error. Unknown `facets` → 400. `limit` is clamped to 200.
**Postman:** assert `count >= 0`, `Array.isArray(body.places)`, and no `"location"` in the raw response.

---

### 05 · `GET /api/places/{slug}`

**Auth:** none · **Cache:** 3600 s, tag `place:<slug>`

**Path:** `slug` (`^[a-z0-9-]+$`)

**Response 200**
```json
{ "place": { …Dossier… }, "lang": "en" }
```
**Errors:** 404 `NOT_FOUND` (unknown or not publishable) · 410 `GONE` (retired) · 422 `PLACE_NOT_PUBLIC` (exists but fails `publishable()` — do not reveal why).
**DB:** `public_place` + `source` + `claim` + `image` + `place_town` join `town` with explicit columns.
**Rules:** four explicit selects in `Promise.all`; never `db.query.publicPlace.findFirst` (views have no relations); never select `town.location`.
**Postman:** assert `body.place.sources.length >= 2`, `body.place.accessPoint` exists, and no `"location"` key.

---

### 06 · `GET /api/search`

**Auth:** none · **Cache:** 300 s

**Query:** `q` (required, 1–120) · `town` · `within` · `facets` · `lang`

**Response 200 — results**
```json
{
  "intent": {
    "raw": "waterfalls near Valparai",
    "facets": ["WATER"],
    "signals": [],
    "townHint": "valparai",
    "placeHint": null,
    "freeText": ""
  },
  "count": 2,
  "places": [ { …PlaceCard… } ],
  "zeroResult": null,
  "lang": "en"
}
```

**Response 200 — zero**
```json
{
  "intent": { "raw": "qwertyuiop", "facets": [], "signals": [], "townHint": null, "placeHint": null, "freeText": "qwertyuiop" },
  "count": 0,
  "places": [],
  "zeroResult": {
    "reason": "NO_MATCH",
    "message": { "en": "No exact match — did you mean…", "ta": "சரியான பொருத்தம் இல்லை — இவை உங்களுக்கு உதவுமா…" },
    "nearest": [ { …PlaceCard… }, { …PlaceCard… }, { …PlaceCard… } ]
  },
  "lang": "en"
}
```

**Response 200 — out of region** (only when a `town` param resolves outside `REGION_BBOX`; in Phase 1 every registry town is inside it, so this is a guard, not a common state. Proximity out-of-region is `POST /api/nearby` → `inRegion:false`.)
```json
{
  "intent": { "raw": "waterfalls near Chennai", "facets": ["WATER"], "signals": [], "townHint": null, "placeHint": null, "freeText": "chennai" },
  "count": 0,
  "places": [],
  "zeroResult": {
    "reason": "OUT_OF_REGION",
    "message": { "en": "Wild Atlas covers Coimbatore district and 60 km around it.", "ta": "வைல்ட் அட்லஸ் கோயம்புத்தூர் மாவட்டம் மற்றும் 60 கி.மீ சுற்றளவை மட்டுமே கொண்டுள்ளது." },
    "nearest": []
  },
  "lang": "en"
}
```
**Rule:** an unrecognised place word (e.g. "Chennai") is `NO_MATCH`, not `OUT_OF_REGION`. Do not build an out-of-region gazetteer in Phase 1.
**Errors:** 400 `VALIDATION_FAILED` (empty `q`, unknown facet).
**DB:** `public_place` + `place_town` (rank by trigram + FTS; filter by town reach).
**Rules:** deterministic parser only — no model call. `nearest` is at most 3 and only for `NO_MATCH`.
**Postman:** `q=சிறுவாணி` → first result slug is `siruvani-falls`; `q=qwertyuiop` → `zeroResult.reason === "NO_MATCH"` and 3 nearest.

---

### 07 · `GET /api/search/suggest`

**Auth:** none · **Cache:** 60 s

**Query:** `q` (1–120) · `lang`

**Response 200**
```json
{
  "query": "sir",
  "suggestions": [
    { "type": "place", "slug": "siruvani-falls", "label": "Siruvani Falls", "subLabel": "சிறுவாணி அருவி · Water" },
    { "type": "town", "slug": "coimbatore", "label": "Coimbatore", "subLabel": "கோயம்புத்தூர்" },
    { "type": "facet", "slug": null, "label": "Waterfalls", "subLabel": "2 places" }
  ]
}
```
**Rules:** max 8; `type` ∈ `place|town|facet`; `slug` is `null` for facets. Empty `q` → `{ "query": "", "suggestions": [] }`, not 400.
**DB:** `public_place` names + `name_variants`, `town` names, `lib/search/synonyms.ts`.
**Postman:** `q=sir` includes the Siruvani place suggestion; `q=` returns 200 with an empty array.

---

### 08 · `POST /api/nearby`

**Auth:** device (cookie or dev header) · **Cache:** `no-store`

**Body**
```json
{ "lat": 10.9481, "lon": 76.7012, "radiusM": 15000, "facets": ["WATER"], "lang": "en" }
```

**Validation:** `lat` −90..90 · `lon` −180..180 · `radiusM` one of 5 000 / 10 000 / 15 000 / 25 000 · `facets` ≤7 · body ≤2 KB.

**Response 200**
```json
{
  "inRegion": true,
  "count": 1,
  "places": [
    {
      "slug": "siruvani-falls",
      "name": { "en": "Siruvani Falls", "ta": "சிறுவாணி அருவி" },
      "summary": { "en": "…", "ta": "…" },
      "facets": ["WATER", "NATURE"],
      "accessStatus": "OPEN",
      "accessPoint": { "lon": 76.7012, "lat": 10.9481 },
      "accessPointLabel": { "en": "…", "ta": "…" },
      "lastVerifiedAt": "2026-10-12",
      "thumbnailUrl": null,
      "distance": { "kind": "CROW", "crowM": 4100 }
    }
  ],
  "hull": null,
  "meta": { "radiusM": 15000, "generatedAt": "2026-11-27T06:12:00.000Z" }
}
```
**Response 200 — outside region**
```json
{ "inRegion": false, "count": 0, "places": [], "hull": null, "meta": { "radiusM": 15000, "generatedAt": "…" } }
```

**Errors:** 400 `VALIDATION_FAILED`.
**DB:** `public_place` with `ST_DWithin(access_point, point, radiusM)`, `LIMIT 50`.
**Rules:** the coordinate is used in the query and **never stored, logged, or echoed**. `distance.kind` is always `CROW` here. `hull` is `null` when fewer than 3 points.
**Postman:** `lat=13.0827, lon=80.2707` (Chennai) → `inRegion: false`, `count: 0`.

---

### 09 · `GET /api/reach`

**Auth:** none · **Cache:** 300 s

**Query:** `town` (required) · `within` (required, 30/60/90/120) · `facets` · `lang`

**Response 200**
```json
{
  "town": {
    "slug": "valparai",
    "name": { "en": "Valparai", "ta": "வால்பாறை" },
    "services": ["FUEL", "HOSPITAL"],
    "isGateway": false
  },
  "withinMinutes": 60,
  "count": 4,
  "places": [ { …PlaceCard… } ],
  "hull": { "type": "Polygon", "coordinates": [[[76.91, 10.28], [76.99, 10.31], [76.97, 10.38], [76.91, 10.28]]] },
  "hullLabel": "approximate reach",
  "matrix": { "computedAt": "2026-11-01T00:00:00.000Z", "stale": false, "engine": "ors-driving-car-v2" }
}
```
**Errors:** 404 `NOT_FOUND` (town) · 422 `MATRIX_UNAVAILABLE` (no rows for the town) · 400 `VALIDATION_FAILED`.
**DB:** `place_town` (`town_id`, `drive_minutes <= within`), `public_place`, `town` (explicit columns), `ST_ConvexHull(ST_Collect(...))`.
**Rules:** `hull` is `null` when fewer than 3 points. The hull is decoration; the numbers are authoritative. Label it `approximate reach` in the UI.
**Postman:** `town=valparai&within=60` → 200; `town=valparai` without `within` → 400.

---

## 6. Endpoints — device writes

### 10 · `POST /api/corrections`

**Auth:** device (cookie created on first use) · **Cache:** `no-store` · **Limit:** 5/hour/IP hash

**Body**
```json
{
  "placeSlug": "siruvani-falls",
  "field": "accessWindow",
  "message": "Gate was closed at 16:30 on 24 Nov 2026. The sign says 17:00.",
  "channel": "WEB",
  "website": ""
}
```

| Field | Rules |
|---|---|
| `placeSlug` | must resolve to a public place |
| `field` | `accessWindow` \| `location` \| `lastMile` \| `sources` \| `other` |
| `message` | 10–2 000 chars, plain text, HTML rejected |
| `channel` | `WEB` only (bot writes its own rows server-side) |
| `website` | honeypot — must be empty; if filled, return 201 and write nothing |

**Response 201**
```json
{
  "id": "0f1e2d3c-4b5a-6978-8796-a5b4c3d2e1f0",
  "status": "OPEN",
  "receivedAt": "2026-11-27T06:12:00.000Z",
  "message": {
    "en": "Thank you. A reviewer checks this within 48 hours.",
    "ta": "நன்றி. 48 மணி நேரத்தில் ஒரு சரிபார்ப்பாளர் இதைப் பார்க்கிறார்."
  }
}
```

**Errors:** 400 `VALIDATION_FAILED` · 404 `NOT_FOUND` (slug) · 429 `RATE_LIMITED`.
**Honeypot:** if `website` is non-empty, return **201** with `{ "status": "OPEN", "receivedAt": "…", "message": {…} }` and **no `id`**, and write no row.
**DB:** writes `correction` (`status='OPEN'`), `rate_limit`; upserts `device`.
**Rules:** the message is never rendered as HTML; it is stored raw and reviewed by a human.
**Postman:** valid body → 201; 6th call in an hour → 429 with `Retry-After`; `website: "x"` → 201 with no row.

---

### 11 · `POST /api/telegram/link`

**Auth:** device · **Cache:** `no-store` · **Limit:** 10/hour/device

**Body:** none (`{}` accepted)

**Response 201**
```json
{
  "token": "9f3c1b7a4e2d8c6f0a5b9d3e7f1c2a8b4d6e0f3a5c7b9d1e2f4a6c8b0d2e4f6a",
  "code": "4F2A",
  "deepLink": "https://t.me/WildAtlasBot?start=9f3c1b7a4e2d8c6f0a5b9d3e7f1c2a8b4d6e0f3a5c7b9d1e2f4a6c8b0d2e4f6a",
  "expiresIn": 300,
  "expiresAt": "2026-11-27T06:17:00.000Z",
  "botUsername": "WildAtlasBot"
}
```
**Errors:** 429 `RATE_LIMITED`.
**DB:** upserts `device`; inserts `link_token` (`token_hash = sha256(token)`, `code`, `expires_at = now() + 5 min`, `attempts = 0`); invalidates prior unused tokens for the device.
**Rules:** `token` is returned **once**; only its hash is stored. `code` uses `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (no `I`, `O`, `0`, `1`). The token must never appear in a query string or a log.
**Postman:** save `token` and `code` to environment variables in the test script.

---

### 12 · `POST /api/telegram/link/status`

**Auth:** device · **Cache:** `no-store` · **Limit:** 60/hour/device

**Body**
```json
{ "token": "9f3c1b7a4e2d8c6f0a5b9d3e7f1c2a8b4d6e0f3a5c7b9d1e2f4a6c8b0d2e4f6a" }
```

**Response 200**
```json
{
  "status": "PENDING",
  "expiresAt": "2026-11-27T06:17:00.000Z",
  "linkedAt": null,
  "botUsername": "WildAtlasBot"
}
```
`status` ∈ `PENDING | LINKED | EXPIRED | INVALID`.

| Status | Meaning |
|---|---|
| `PENDING` | Token exists, unused, not expired, no active connection yet |
| `LINKED` | `telegram_conn.is_active = true` for this device; `linkedAt` set |
| `EXPIRED` | `expires_at < now()` and never used |
| `INVALID` | Unknown token, wrong device, or invalidated by attempts |

**Errors:** 400 `VALIDATION_FAILED` (missing token).
**DB:** reads `link_token`, `telegram_conn`. **Never returns `chat_id`.**
**Rules:** polling stops after 150 s; the web page shows `Code expired. Get a new one.`

---

### 13 · `POST /api/telegram/unlink`

**Auth:** device · **Cache:** `no-store`

**Body:** none

**Response 200**
```json
{ "unlinked": true, "notificationsEnabled": false }
```
**Errors:** 401 `UNAUTHORIZED` (no device) — or 200 with `unlinked: false` when nothing was linked. Use the latter.
**DB:** `telegram_conn.is_active = false`, `disconnected_at = now()`; `preference.notifications_enabled = false`; deletes unused `link_token` rows.
**Rules:** unlink does not delete the device or its corrections.

---

### 14 · `GET /api/preferences`

**Auth:** device · **Cache:** `no-store`

**Response 200**
```json
{
  "radiusM": 10000,
  "facets": ["WATER", "NATURE"],
  "language": "en",
  "quietStart": "22:00",
  "quietEnd": "07:00",
  "timezone": "Asia/Kolkata",
  "notificationsEnabled": true,
  "digestMode": true,
  "pausedUntil": null,
  "telegram": { "linked": true, "linkedAt": "2026-11-20T10:00:00.000Z" },
  "budget": { "sentToday": 1, "dailyLimit": 3, "nextEligibleAt": null },
  "updatedAt": "2026-11-25T09:30:00.000Z"
}
```
**First call** creates defaults: `radiusM 10000`, `digestMode true`, `notificationsEnabled false`, `timezone Asia/Kolkata`, `language = DEFAULT_LANG`.
**DB:** `preference`, `telegram_conn` (boolean only), `notification` (count today's distinct `batch_id`).
**Never:** `chat_id`, `home_geohash5`, `device_id`.

---

### 15 · `PATCH /api/preferences`

**Auth:** device · **Cache:** `no-store`

**Body** (any subset)
```json
{
  "radiusM": 15000,
  "facets": ["WATER"],
  "language": "ta",
  "quietStart": "21:30",
  "quietEnd": "06:30",
  "notificationsEnabled": true,
  "digestMode": true,
  "pausedUntil": null
}
```

| Field | Rules |
|---|---|
| `radiusM` | 5 000 / 10 000 / 15 000 / 25 000 only |
| `facets` | subset of `FACETS`, ≤7 |
| `language` | `en` \| `ta` |
| `quietStart` / `quietEnd` | `HH:MM` 24 h; equal values = disabled |
| `notificationsEnabled` | `true` only allowed when a connection is active → else 422 `TELEGRAM_NOT_LINKED` |
| `pausedUntil` | ISO timestamp or `null`; `POST /api/preferences/pause` is not needed — send `now + 24h` |

**Response 200:** same shape as `GET /api/preferences`.
**Errors:** 400 `VALIDATION_FAILED` · 422 `TELEGRAM_NOT_LINKED`.
**DB:** `preference` upsert; reads `telegram_conn`.
**Postman:** PATCH `radiusM: 15000` → echo 15000; PATCH `radiusM: 12000` → 400.

---

## 7. Endpoints — trips and packs

### 16 · `POST /api/trips`

**Auth:** device · **Cache:** `no-store` · **Limit:** 10/day

**Body**
```json
{
  "corridor": "coimbatore-valparai",
  "startsAt": "2026-12-05T04:30:00.000Z",
  "endsAt": "2026-12-06T14:00:00.000Z"
}
```

**Response 201**
```json
{
  "tripId": "6f0c9a2e-1b3d-4c5e-8a7b-9d0e1f2a3b4c",
  "corridor": "coimbatore-valparai",
  "corridorLabel": { "en": "Coimbatore → Valparai", "ta": "கோயம்புத்தூர் → வால்பாறை" },
  "startsAt": "2026-12-05T04:30:00.000Z",
  "endsAt": "2026-12-06T14:00:00.000Z",
  "status": "PLANNED",
  "pack": {
    "version": "2026.11.27-1",
    "manifestUrl": "/api/trip/coimbatore-valparai/pack",
    "bytes": 41234567,
    "places": 6,
    "tilesMaxZoom": 14
  },
  "homeRadiusBypassed": true,
  "createdAt": "2026-11-27T06:12:00.000Z"
}
```
**Response 200** when an identical `PLANNED` trip for the same corridor exists (idempotent).
**Errors:** 400 `VALIDATION_FAILED` (unknown corridor, `endsAt <= startsAt`) · 409 `CONFLICT` (different dates) · 429.
**DB:** `trip`, `trip_stop` (insert publishable places whose access point is inside the corridor buffer, ordered by `drive_minutes` from the origin town).
**Rules:** declaring a trip bypasses the 15 km home-radius gate until `endsAt`. It does not enable single alerts unless `digestMode` is false.
**Postman:** save `tripId`; repeat the same body → 200 with the same `tripId`.

---

### 17 · `GET /api/trips/{tripId}`

**Auth:** device (must own the trip) · **Cache:** `no-store`

**Response 200**
```json
{
  "tripId": "6f0c9a2e-1b3d-4c5e-8a7b-9d0e1f2a3b4c",
  "corridor": "coimbatore-valparai",
  "corridorLabel": { "en": "Coimbatore → Valparai", "ta": "கோயம்புத்தூர் → வால்பாறை" },
  "startsAt": "2026-12-05T04:30:00.000Z",
  "endsAt": "2026-12-06T14:00:00.000Z",
  "status": "PLANNED",
  "stops": [
    { "slug": "puthuthottam", "name": { "en": "Puthuthottam", "ta": "புத்துத்தோட்டம்" }, "order": 1, "driveMinutes": 35, "notifiedAt": null }
  ],
  "pack": { "version": "2026.11.27-1", "manifestUrl": "/api/trip/coimbatore-valparai/pack", "bytes": 41234567, "places": 6, "tilesMaxZoom": 14 }
}
```
**Errors:** 404 `NOT_FOUND` (unknown or another device's trip).
**DB:** `trip`, `trip_stop` join `public_place`.

---

### 18 · `GET /api/trip/{corridor}/pack`

**Auth:** none · **Cache:** `max-age=60, must-revalidate`

**Response 200**
```json
{
  "version": "2026.11.27-1",
  "corridor": "coimbatore-valparai",
  "generatedAt": "2026-11-27T05:00:00.000Z",
  "region": { "bbox": [76.60, 10.20, 77.30, 10.70] },
  "dossiers": [
    {
      "slug": "siruvani-falls",
      "jsonUrl": "https://packs.example.com/2026.11.27-1/coimbatore-valparai/siruvani-falls.json",
      "pageUrl": "/place/siruvani-falls",
      "bytes": 48211,
      "sha256": "9a1f…"
    }
  ],
  "tiles": {
    "url": "https://packs.example.com/2026.11.27-1/coimbatore-valparai/tiles.pmtiles",
    "maxZoom": 14,
    "bytes": 39811234,
    "sha256": "4c7d…"
  },
  "matrix": {
    "url": "https://packs.example.com/2026.11.27-1/coimbatore-valparai/matrix.json",
    "places": 6,
    "towns": 22,
    "bytes": 9120
  },
  "places": ["siruvani-falls", "puthuthottam", "chinnakallar", "nallamudi-viewpoint", "topslip", "aliyar-dam"]
}
```
**Errors:** 404 `NOT_FOUND` (unknown corridor or no pack built).
**DB:** none at request time — reads the immutable manifest from R2 (cached). The manifest is built offline from `public_place` + `place_town`.
**Rules:** every `dossiers[].jsonUrl` is versioned by pack version; no `location` key anywhere; `pageUrl` is same-origin.
**Postman:** assert `body.places.length === body.dossiers.length` and no `"location"` in the response.

---

### 19 · `DELETE /api/trips/{tripId}`

**Auth:** device (owner) · **Cache:** `no-store`

**Response 200**
```json
{ "deleted": true, "tripId": "6f0c9a2e-1b3d-4c5e-8a7b-9d0e1f2a3b4c" }
```
**DB:** `trip.status = 'CANCELLED'` (soft), `trip_stop` retained for audit.
**Rules:** deleting a trip does not delete a downloaded pack from the device; the service worker is told to evict via the client.

---

## 8. Endpoints — internal

### 20 · `POST /api/telegram/webhook`

**Auth:** `X-Telegram-Bot-Api-Secret-Token: <TELEGRAM_WEBHOOK_SECRET>` (timing-safe compare)
**Cache:** `no-store` · **Body limit:** 1 MB · **Runtime:** `nodejs`

**Request** — a Telegram `Update` (external schema). Minimal test body:
```json
{
  "update_id": 900000001,
  "message": {
    "message_id": 42,
    "date": 1795766400,
    "chat": { "id": 123456789, "type": "private" },
    "from": { "id": 123456789, "is_bot": false, "first_name": "Test" },
    "text": "/start 9f3c1b7a4e2d8c6f0a5b9d3e7f1c2a8b4d6e0f3a5c7b9d1e2f4a6c8b0d2e4f6a"
  }
}
```
**Response 200:** plain text `ok` (not JSON).
**Errors:** 403 `FORBIDDEN` (bad/missing secret) · 405 · 413.
**DB:** inserts `telegram_update` (`update_id`, `kind`) with `ON CONFLICT DO NOTHING`; returns immediately; `after()` runs `processTelegramUpdate`.
**Rules:** store **no payload**, **no coordinates**, **no message text**. Never run PostGIS or routing inside the request. A replayed `update_id` → 200 and no second send.
**Postman:** send twice with the same `update_id`; both 200; assert `notification` count did not change (check via DB, not API).

---

### 21 · `POST /api/cron/telegram`

**Auth:** `Authorization: Bearer <CRON_SECRET>`
**Cache:** `no-store` · Vercel cron: every 5 minutes

**Response 200**
```json
{
  "ok": true,
  "job": "telegram-sweeper",
  "scanned": 4,
  "expiredSessions": 2,
  "stuckUpdates": 0,
  "durationMs": 120
}
```
**DB:** `location_session` (`last_location_at < now() - 5 min` → `EXPIRED`), `telegram_update` (`processed_at IS NULL AND received_at < now() - 5 min` → alert), `notification` retry queue.
**Rules:** never sends a message for an expired session; logs counts, not rows.
**Postman:** no header → 401; wrong bearer → 401.

---

### 22 · `POST /api/cron/purge`

**Auth:** Bearer `CRON_SECRET` · daily 02:00 IST

**Response 200**
```json
{
  "ok": true,
  "job": "purge",
  "deleted": { "location_session": 3, "notification": 12, "link_token": 5, "telegram_update": 40, "rate_limit": 9 },
  "durationMs": 84
}
```
**DB:** deletes `location_session` and `notification` older than 90 days; `link_token` expired >1 day; `telegram_update` older than 30 days; `rate_limit` older than 1 day.
**Rules:** never purges `correction` or `verification_event` (audit trail). Logs counts only.

---

### 23 · `POST /api/revalidate`

**Auth:** Bearer `CRON_SECRET` · **Cache:** `no-store`

**Body**
```json
{ "tags": ["place:siruvani-falls"] }
```
**Response 200**
```json
{ "ok": true, "revalidated": ["place:siruvani-falls"] }
```
**Errors:** 400 `VALIDATION_FAILED` (tag not matching `^place:[a-z0-9-]+$` or `^(places|towns|taxonomy)$`) · 401.
**Rules:** allowlist only; never accept arbitrary paths.

---

## 9. Who talks to what

```
Browser / PWA
  │  fetch same-origin JSON only
  ▼
Next.js route handler or RSC  ──►  db/queries/*.ts  ──►  Drizzle  ──►  postgres  ──►  Neon + PostGIS
  │                                                                     │
  │                                                                     └── public_place (no location)
  ├──► Telegram Bot API (server only: TELEGRAM_BOT_TOKEN)
  ├──► OpenRouteService (batch job only: ORS_API_KEY)
  └──► Cloudflare R2 (PMTiles, images, packs — public, immutable)
```

| Layer | May hold | Must never hold |
|---|---|---|
| Browser | `accessPoint`, slugs, localized text, device cookie (httpOnly, not readable by JS) | `DATABASE_URL`, `TELEGRAM_BOT_TOKEN`, `ORS_API_KEY`, `CRON_SECRET`, `chat_id`, `token_hash`, `home_geohash5`, `place.location` |
| Route handler / RSC | everything server-side | nothing beyond the request lifetime for coordinates |
| Query module | SQL + DTO mapping | HTTP concerns |
| Neon | all data | plaintext link tokens (hash only), coordinates in `location_session` |
| Telegram | `chat_id`, messages | our database |
| R2 | PMTiles, images, packs | any `location` key in dossier JSON |

### 9.1 Request flows

| Flow | Sequence |
|---|---|
| Map load | RSC → `getPlaceCards()` → `public_place` + `place_town` → `PlaceCard[]` → client map |
| Dossier | RSC → `getDossier(slug)` → 4 parallel selects → `Dossier` → 12-section renderer |
| Search | route → intent parser → SQL (trigram + FTS) → rank → `PlaceCard[]` or `zeroResult` |
| Correction | client → `POST /api/corrections` → Zod → rate limit → `correction` insert → 201 |
| Link | client → `POST /api/telegram/link` → `link_token` insert → code shown → user `/start <token>` → webhook → bind pending → user sends code → active |
| Digest | webhook → `telegram_update` insert → 200 → `after()` → `ST_DWithin` → `recommendable()` → score → route winner → budget → `sendMessage` → `notification` insert |
| Pack | `POST /api/trips` → `trip` insert; manifest prebuilt by `scripts/build-pack.ts` → R2; client fetches manifest + assets |

### 9.2 Query rules (enforced in review + tests)

1. Public reads use `public_place`, never `place`.
2. `town` selects list columns explicitly; `town.location` never appears.
3. Every list has a `LIMIT`.
4. Spatial predicates use `::geography` and metres.
5. Numeric strings become numbers at the mapper boundary; `bigint` becomes a string.
6. No SQL string concatenation — Drizzle `sql` parameters only.

---

## 10. Postman runbook

### 10.1 Import

1. Import `postman/WildAtlas.postman_collection.json`.
2. Import `postman/WildAtlas.local.postman_environment.json`.
3. Select **Wild Atlas — Local**.
4. Start the app: `npm run dev` (and `npm run db:seed` once).

### 10.2 Environment variables

| Variable | Initial value | Set by |
|---|---|---|
| `baseUrl` | `http://localhost:3000` | you |
| `lang` | `en` | you |
| `slug` | `siruvani-falls` | you |
| `town` | `valparai` | you |
| `corridor` | `coimbatore-valparai` | you |
| `tripId` | — | `16 · Create trip` test script |
| `linkToken` | — | `11 · Create link` test script |
| `linkCode` | — | `11 · Create link` test script |
| `cronSecret` | `local-cron-secret-123456` | you (must match `.env.local`) |
| `webhookSecret` | `local-webhook-secret-123456` | you (must match `.env.local`) |
| `deviceId` | `11111111-1111-4111-8111-111111111111` | you (dev only) |

### 10.3 Run order

| Folder | Requests | Must pass |
|---|---|---|
| 00 Health | 01 | 200, `db: up` |
| 01 Read | 02–05 | 200; no `location` key |
| 02 Search | 06–08 | Tamil query ranks Siruvani first; nonsense → `NO_MATCH` |
| 03 Geo | 08b, 09 | reach 200; Chennai → `inRegion:false` |
| 04 Write | 10 | 201; rate limit after 5 |
| 05 Telegram | 11–13 | 201 + code; webhook binds pending; status `PENDING`; unlink 200 |
| 06 Prefs | 14–15 | defaults; invalid radius → 400 |
| 07 Trips | 16–19 | 201; repeat → 200 same id; manifest has no `location` |
| 08 Internal | 20–23 | 401 without bearer; 200 with |
| 09 Negative | 90–99 | see below |

### 10.4 Negative tests (folder 09)

| # | Request | Expected |
|---|---|---|
| 90 | `GET /api/places/siruvani-falls` with `slug=does-not-exist` | 404 `NOT_FOUND` |
| 91 | `GET /api/places?facets=BANANA` | 400 `VALIDATION_FAILED` |
| 92 | `GET /api/reach?town=valparai` (no `within`) | 400 |
| 93 | `POST /api/corrections` with a 2 100-character message | 400 |
| 94 | `POST /api/corrections` with `website` filled | 201, no row |
| 95 | `POST /api/telegram/webhook` without the secret header | 403 |
| 96 | `POST /api/cron/purge` without bearer | 401 |
| 97 | `POST /api/nearby` with `lat: 200` | 400 |
| 98 | `GET /api/trip/not-a-corridor/pack` | 404 `NOT_FOUND` |
| 99 | `POST /api/trips` with `endsAt` before `startsAt` | 400 |

### 10.5 The assertion that matters

Put this in every read request's **Tests** tab:

```js
pm.test('no site coordinates leaked', () => {
  pm.expect(pm.response.text()).to.not.include('"location"');
  pm.expect(pm.response.text()).to.not.include('publish_site_coordinates');
});
```

If that assertion ever fails, stop the build. It is the one bug this product cannot survive.

---

## 11. Contract change process

1. Change this file first, in a PR that touches nothing else.
2. Update `postman/WildAtlas.postman_collection.json` in the same PR.
3. Update the affected Kiro module prompt in `04-KIRO-MODULES.md`.
4. Add or change one test in the same PR.
5. Bump `Version` at the top.

Never let a module invent a field that is not here. If a screen needs a field, add it to the DTO here, add it to `public_place`, then implement.
