# Telegram Proximity Engine — Buildable Spec & Blind Spot Register

**Status:** Implementation specification. New file — no existing document modified.
**Source docs analysed:** `deep-research-report.md`, `wild-atlas-v2-skeleton.md`, `base-towns.md`, `trendingplace.md`, `clarification.md`, `telegram.md`.
**Supersedes:** `telegram.md` §3 (location sources), §7 (notification rules), §10 (schema), §15 (acceptance criteria). Everything else in that file stands.
**Stack assumed:** Next.js + TypeScript, Neon Postgres + PostGIS, Drizzle, MapLibre/PMTiles, Vercel, Telegram Bot API.

---

## 1. The thesis, corrected

`telegram.md` says the feature is: *"when a user enables location sharing, identify nearby destinations and notify via Telegram."*

That is the mechanism, not the value. The value is narrower and much stronger:

> **Wild Atlas is the only travel product that can deliver verified, access-aware destination intelligence to a traveller with zero installation — and can receive their live location without a native app.**

Two facts make that true:

1. **Telegram supports live location.** A user can share a live location into a chat for up to 8 hours, and the bot receives `edited_message` updates as they move. Telegram is a native app with background location permission. **This is your background geofencing, obtained for free.**
2. **The bot requires no install, no account, and no app store.** For a tourism board, that is the pitch: *your destination content reaches tourists before they download anything.*

So the feature is not "a Telegram bot." It is **zero-install, background-capable, verified destination delivery.** That is defensible. "A Telegram bot that tells you about nearby places" is not.

---

## 2. The central blind spot

`telegram.md` §3 and §16 are honest: a PWA cannot track location when closed. But §1 then promises notification "when a user enables location sharing," which — if the only location source is `watchPosition` — means:

> **The notification only fires while the user is looking at the app that already shows them the information.**

That is the whole feature failing silently. Section 4 of this document fixes it. Everything else is secondary.

### The fix: two location sources, not one

```
PATH A — FOREGROUND (PWA)                     PATH B — BACKGROUND (Telegram live location)
─────────────────────────────                 ──────────────────────────────────────────
navigator.geolocation.watchPosition           User taps "Share live location" in the chat
  ↓ threshold 250 m / 60 s                      ↓ Telegram sends edited_message updates
POST /api/location/update                     POST /api/telegram/webhook (location update)
  ↓                                             ↓
PostGIS ST_DWithin                            PostGIS ST_DWithin
  ↓                                             ↓
In-app map/list update                        Telegram push notification
  (no push needed)                              (phone in pocket, app closed, driving)

Use when: browsing, planning, walking         Use when: moving, driving, hands-free
Lifetime: tab session                          Lifetime: 15 min / 1 h / 8 h (user's choice)
```

Path B is the product. Path A is table stakes.

**What Path B buys you that nothing else in the stack can:**

| Requirement | PWA route | Telegram live location |
|---|---|---|
| Works with app closed | No | **Yes** |
| Works with phone in pocket | No | **Yes** |
| Native background permission | Not possible | Already granted to Telegram |
| App store submission | Not needed | Not needed |
| Install required | No | No |
| Battery cost | Browser GPS | Telegram's, already running |

**Honest limitations of Path B — design around them, don't hide them:**

1. **Telegram throttles live-location updates.** Expect roughly one update per 60–90 seconds while moving, not continuous. Fine for a 10 km radius; useless for 1 km. Hence the minimum radius of 5 km.
2. **8-hour cap.** A trip longer than 8 hours requires re-sharing. Prompt for it in the pre-trip message.
3. **The user must start it.** No silent tracking. That is a feature, not a bug, and it should be stated in the UI.
4. **It needs data.** Remote ghat sections have none. See blind spot #3.

---

## 3. Blind spot register

Ordered by how badly each one breaks the product.

| # | Blind spot | Why it hurts | Solution |
|---|---|---|---|
| **1** | **Single location source** — PWA only | Notification fires only while the user stares at the app | Dual path (§2). Telegram live location is the primary background channel. |
| **2** | **No signal in exactly the places that matter** | The remote waterfall has no data; the alert never arrives where it is most valuable | Pre-trip **Trip Pack** (offline dossiers + PMTiles for the corridor) downloaded on wifi. Telegram alerts are explicitly *best-effort*. The app must work with zero bars — that is the actual product. |
| **3** | **No notification budget** | A drive through Valparai passes 8 places. Per-destination cooldown does not stop 8 different alerts | Hard budget: **max 3/day, max 1 per 30 min, max 1 per place per 7 days**. Batch into an **Arrival Digest** (§7). |
| **4** | **No trip-intent gate** | First week: user is at home in Coimbatore, gets 5 urban "hidden gem" alerts, mutes the bot forever | Alert only when **outside a 15 km home radius**, or when a trip is declared. Store `home_geohash` on first session. |
| **5** | **Straight-line distance presented as travel distance** | "7 km away" across a valley is 50 minutes. User drives, arrives at dusk, gate closed | Filter by crow-flies (cheap), then **route only the winning candidate at send time** (§6.4). Say "7 km straight line · ~38 min by road". |
| **6** | **No rejection gates in the engine** | §6 lists criteria but never forbids anything. It will recommend a closed tiger reserve at 18:30 | `recommendable()` predicate, enforced in SQL (§6.2). Not a prompt, not a checklist. |
| **7** | **Identity is undefined** | Schema uses `user_id`; the MVP has no auth. Nothing joins | `telegram_chat_id` is the bot identity. `device_id` (localStorage UUID) is the web identity. The link token binds them. No auth needed (§9.1). |
| **8** | **Privacy claim is false as specified** | `location_sessions` + `notification_history` + `destination_recommendation_events(distance_meters)` lets you **trilaterate** a user from 3 rows | Store `distance_band`, never metres. No candidate coordinates. 90-day purge. Aggregate-only evaluation counts (§10). |
| **9** | **No feedback loop** | You cannot learn that a place closed, or that the alerts are annoying | Inline keyboard on **every** message: `👍 Useful · 👎 Not now · ⛔ Closed · ✏️ Wrong info`. Routes to the correction table (the corpus moat). |
| **10** | **No group support** | Family/group trips are the highest-intent use case | Deliberate Phase 2 item, not an omission. One sharer, many readers (§8.4). |
| **11** | **Caption limit ignored** | Telegram caps photo captions at **1024 chars**. The §9 template is double that. Messages will be silently truncated or rejected | Template budget: 900 chars including Tamil. Photo caption only; long text as a follow-up message (§8.1). |
| **12** | **Rate limits unhandled** | ~1 msg/sec per chat; bursts return 429 with `retry_after` | Outbound queue with token bucket + backoff (§8.2). |
| **13** | **Webhook retries duplicate messages** | Telegram retries any non-200; duplicate alerts destroy trust | Idempotency on `update_id`; respond 200 in <2 s, process async (§9.3). |
| **14** | **Link-token forwarding attack** | A forwarded deep link lets someone bind *their* chat to *your* account and receive your location alerts | 5-minute expiry, single use, and a **confirmation code shown in both surfaces** (§9.2). |
| **15** | **Session never ends** | Tab close fires no reliable event; `is_active` stays true and `/nearby` serves stale coordinates forever | `visibilitychange` + server-side heartbeat timeout (5 min) — §5.3. |
| **16** | **`/trending` and `/discover` cannot be delivered yet** | With 12–24 places and no signal history, both return nothing or noise | Ship `/nearby`, `/radius`, `/pause`, `/stop` only. Gate `/trending` on 8 weeks of signal ledger. |
| **17** | **No image licensing** | "Appropriately licensed" is not a pipeline. CC-BY without attribution is a licence breach | `image` table with `license`, `attribution`, `source_url`. **No image if licence unknown.** (§11.3) |
| **18** | **No bot onboarding without a token** | A stranger pressing `/start` gets nothing to do | Tokenless onboarding: create anonymous chat record, defaults, show a 6-character link code (§9.2). |
| **19** | **Acceptance criteria are a demo checklist** | "User can connect Telegram" proves nothing about whether anyone wants this | Behavioural gates: alert open rate, mute rate, "closed" reports (§14). |
| **20** | **Persona mismatch, unstated** | At 5 km and 60 km/h, the user passes the turn-off before the message lands. Proximity alerts only work for slow travel | State it: **this is for walkers, cyclists, and people with time.** Highway drivers get the pre-trip Trip Pack instead. |

---

## 4. What the product does that others don't

Keep this table; it is the DMO pitch.

| Existing solution | What it gives | What it cannot |
|---|---|---|
| Google Maps | Distance, hours, reviews, huge coverage | No source-graded history, no access window, no folklore, no Tamil authority, no zero-install channel |
| Atlas Obscura | Rich stories | No live proximity, no access status, no field utility, no India depth |
| TripAdvisor | Reviews, rankings | No verified access, no obscurity, commercial bias |
| Zafari (India) | Nearby by road distance, SOS | Not source-verified, no dossiers, no access gating, no background channel |
| Instagram / Xiaohongshu | Emergence, virality | No verification, no safety gating, causes overcrowding |
| **Wild Atlas + Telegram** | **Verified dossier + access status + drive time + delivered with zero install, in the user's pocket, in Tamil** | — |

The bot is not the moat. **The corpus is the moat; the bot is the distribution trick that removes the install barrier.** Say it that way to a tourism board.

---

## 5. Location model

### 5.1 Path A — foreground

```
watchPosition({ enableHighAccuracy: radius <= 5000, maximumAge: 30000, timeout: 15000 })
Send to backend only when:  movement > 250 m  OR  elapsed > 60 s
```

`enableHighAccuracy: true` on a 15 km radius is pure battery waste — 100 m accuracy is irrelevant at that scale.

### 5.2 Path B — Telegram live location

```
User: /nearby  →  bot replies with a "Share live location" keyboard button
                      ↓
Telegram message: { location: { lat, lon }, live_period: 28800 }
                      ↓
Updates arrive as edited_message: { location: { lat, lon }, ... }
                      ↓
Backend: same evaluation pipeline, different transport
```

Detect: `message.location.live_period != null` → live; `edited_message` with location → update.

### 5.3 Session state machine

```
IDLE ──start──▶ ACTIVE ──update──▶ ACTIVE
                  │                 │
                  │                 ├─ heartbeat timeout 5 min ──▶ EXPIRED
                  ├─ user /stop ────────────────────────────────▶ CLOSED
                  ├─ live_period elapsed ───────────────────────▶ EXPIRED
                  └─ visibilitychange(hidden) + 5 min ──────────▶ EXPIRED

EXPIRED / CLOSED ──▶ no further notifications. /nearby refuses with a
                     "share location again" prompt, never stale data.
```

Server-side expiry is mandatory: `last_location_at < now() - interval '5 minutes'` closes the session in a nightly sweep and on every read.

---

## 6. Recommendation engine

### 6.1 The one rule

> Never recommend a destination because it is close. Recommend it because it is **verified, accessible now, and genuinely interesting** — and only then check whether it is close.

### 6.2 `recommendable()` — hard gates, in SQL

```sql
-- A place may enter the candidate set only if ALL of these hold.
publishable_ok :=
      sources_ab >= 1
  AND source_count >= 2
  AND confidence = 'SOURCED'
  AND last_verified_at > now() - interval '180 days';

access_ok :=
      access_status = 'OPEN'
  OR (access_status = 'SEASONAL' AND current_date <@ season_window);

safety_ok :=
      safety_class IN ('LOW','MODERATE')
  AND NOT (safety_class = 'HAZARDOUS')
  AND NOT (cultural_status IN ('SACRED','SENSITIVE'))
  AND NOT (night_now AND facet && ARRAY['WATER','DARK_HISTORY'])   -- no waterfall pushes after dusk
  AND NOT (monsoon_now AND facet && ARRAY['WATER'] )               -- Jun–Sep in the Ghats
  AND NOT (night_now AND night_driving_banned);

narrative_ok :=
      cultural_status = 'SECULAR';   -- narrative score must be NULL otherwise

recommendable := publishable_ok AND access_ok AND safety_ok AND narrative_ok;
```

**`CLOSED` and `RESTRICTED` are never candidates.** They appear only in the app, under an explicit "not visitable" label — never in a push.

### 6.3 Scoring (deterministic, explainable)

```
score =  0.30 * proximity     (1 - clamp(distance / radius, 0, 1))
       + 0.20 * obscurity     (external documentation, inverted)
       + 0.15 * narrative     (editorial, 0..1, NULL for sacred)
       + 0.15 * rising        (0.5 neutral until the ledger has 8 weeks)
       + 0.20 * preference    (facet match: 1.0 exact, 0.5 adjacent, 0 otherwise)

Tie-break: lower distance. Then older last_verified_at? No — newer.
```

The `reason` string is generated **from the contributing terms**, not written by a model:

```
"If you like waterfalls, this is the least-documented one within 15 km.
 Verified 12 Oct 2026. 7 km straight line, about 38 min by road."
```

Every clause maps to a computed term or a database field. Nothing is invented.

### 6.4 Route only the winner

Do not route every candidate. At send time:

```
1. ST_DWithin filter (crow-flies)          → 0–20 candidates, instant
2. recommendable() + score + sort          → 1 candidate
3. ONE routing call (ORS matrix, 1 pair)   → road_km, drive_minutes
4. Cache by (geohash7, place_id) for 30 min
5. Send
```

At 3 notifications/day/user, this is ~3 routing calls/day/user — trivial on a free tier. The displayed distance is then honest, and no API sits in the hot path of the map.

### 6.5 Explainability requirement

Every notification must be reconstructible. Store `{proximity, obscurity, narrative, rising, preference}` in `notification_history.score_terms`. If a user asks "why this?", the answer exists.

---

## 7. Notification budget and batching

### 7.1 The rules, in order of evaluation

```
IF quiet_hours(now, tz)                  → skip
IF paused                                 → skip
IF within home_radius (15 km) AND no trip → skip
IF sent_today >= 3                        → skip
IF sent_in_last_30_min                    → defer (batch)
IF sent_this_place_within_7_days          → skip
IF distance > radius                      → skip
IF NOT recommendable(place)               → skip
ELSE send
```

### 7.2 Arrival Digest — the default, not an option

Instead of one message per place, send **one** when a user enters a new area:

```
🌿 3 verified places near you (Valparai, within 15 km)

1. Puthuthottam — tea-estate ecology, lion-tailed macaque
   4.1 km · open · verified 12 Oct
2. Chinnakallar — among the wettest places in India
   9.8 km · open · seasonal note
3. Nallamudi viewpoint — the least-documented view in the estate belt
   12.4 km · open · verified 02 Nov

[ Open in Wild Atlas ]  [ Not now ]
```

One message instead of three. This single change is the difference between a useful bot and a muted bot. Real-time single alerts remain available for a declared trip corridor.

### 7.3 Digest triggers

- Enters a new `geohash5` cell (~5 km) after ≥30 min of no digest
- Or a declared trip waypoint is reached
- Or explicit `/nearby`

---

## 8. Telegram constraints that shape the implementation

### 8.1 Message limits

| Constraint | Value | Consequence |
|---|---|---|
| Text message | 4096 chars | Long dossiers must be paginated |
| **Photo caption** | **1024 chars** | Template budget must fit both EN and TA |
| Inline keyboard rows | 8 buttons, 8 per row | Feedback + links = 2 rows max |
| `parse_mode` | HTML or MarkdownV2 | **Use HTML** — MarkdownV2 escaping is a bug factory |
| File/photo source | Public URL or upload | Serve from R2/CDN, not from the request |

**Template budget (caption):**

```
┌ line 1: name + facet badge                 ~60
├ line 2: why (max 2 sentences)             ~220
├ line 3: distance + drive + access         ~120
├ line 4: verified + safety note            ~120
├ Tamil variant (same fields)               ~350
└ total                                     ~870  ✓ under 1024
```

If it does not fit, the photo goes alone with a two-line caption and the full dossier loads in the app.

### 8.2 Outbound queue

```
Token bucket per chat: 1 msg/sec, burst 3
Global: 20 msg/sec
On 429: respect header retry_after exactly, then retry once
On 403 (bot blocked): mark connection inactive, stop all sends
On 400 (chat not found): same
```

### 8.3 Parsing

- `/start <payload>` and `/start` both valid
- `t.me/<bot>?start=<token>` → payload arrives as `/start <token>`
- All commands case-insensitive; strip `@botname` suffix

---

## 9. Identity, linking, webhook

### 9.1 Identity without auth

```
device_id     UUID in localStorage          — web identity, anonymous
chat_id       Telegram chat id              — bot identity
link          telegram_link_tokens binds them

No accounts. No passwords. No email.
Account upgrade later attaches a user_id to an existing device/chat pair.
```

This is why the product can ship in weeks, not months.

### 9.2 Linking flow, hardened

```
1. Web: POST /api/telegram/link
   → { token: random(32 bytes), code: "4F2A", expires_in: 300 }

2. Web shows: "Open @WildAtlasBot and press Start.
              Confirm the code shown in the chat is 4F2A."

3. User opens t.me/WildAtlasBot?start=<token> → /start <token>

4. Webhook:
   - validate secret header
   - find token WHERE used_at IS NULL AND expires_at > now()
   - bind chat_id from the UPDATE, never from the request body's claim
   - mark used_at
   - reply: "Connected to Wild Atlas. Confirmation code 4F2A."

5. Web polls or receives a push; both surfaces show 4F2A. Mismatch → unlink.
```

A forwarded deep link now binds the *forwarder's* chat and the code will not match the victim's screen. Five-minute expiry makes it worse than useless as an attack.

### 9.3 Webhook hardening

```
setWebhook(url, secret_token = TELEGRAM_WEBHOOK_SECRET)

Handler:
  1. reject if header X-Telegram-Bot-Api-Secret-Token != secret
  2. INSERT update_id ... ON CONFLICT DO NOTHING   ← idempotency
  3. return 200 immediately (< 2 s)
  4. process in after() / queue
  5. never do PostGIS + routing inside the webhook request
```

Vercel: use a route with `export const runtime = 'nodejs'`, and keep the handler under 2 seconds. Telegram retries aggressively on timeout.

---

## 10. Privacy corrections

The spec's claim — *"do not store continuous location history"* — is violated by its own schema.

**The trilateration problem:** `destination_recommendation_events` stores `(destination_id, distance_meters, evaluated_at)`. Three rows against known place coordinates intersect to a precise user position. That is a location history in disguise, and it is the exact thing the document promises not to keep.

**Corrections:**

| Store | Instead of | Why |
|---|---|---|
| `distance_band` (0–5, 5–10, 10–15, 15–25 km) | `distance_meters` | Bands don't triangulate |
| Nothing | candidate coordinates | Only the winner survives |
| Aggregate daily counters | one row per evaluation | Removes the write amplifier |
| 90-day purge | indefinite | DPDP purpose limitation |
| `notification_history` only for sent messages | events for every evaluation | History = what was sent |

Also: coordinates transit Telegram's servers. That is a **third-party transfer** under DPDP 2023 and must be disclosed in the privacy notice. Telegram is not your data processor.

---

## 11. Data model (revised)

### 11.1 Identity and linkage

```
device            id, device_uuid, created_at, home_geohash5, last_seen_at
telegram_conn     id, device_id, chat_id UNIQUE, tg_username, is_active,
                  connected_at, disconnected_at, blocked_by_user bool
link_token        id, device_id, token_hash, code, expires_at, used_at
```

### 11.2 Sessions and preferences

```
location_session  id, device_id, source enum(PWA|TELEGRAM_LIVE),
                  started_at, last_location_at, expires_at,
                  status enum(ACTIVE|EXPIRED|CLOSED)
                  -- no lat/lon column. Position lives in memory + Redis-less cache only.

preference        device_id PK, radius_m enum(5000,10000,15000,25000),
                  facets[], language enum(EN|TA), quiet_start, quiet_end, tz,
                  notifications_enabled, paused_until, digest_mode bool
```

### 11.3 Notifications

```
notification      id, device_id, place_id, kind enum(DIGEST|SINGLE|TRIP),
                  distance_band, score_terms jsonb, sent_at,
                  tg_message_id, delivery enum(QUEUED|SENT|FAILED),
                  feedback enum(NULL|USEFUL|NOT_NOW|CLOSED|WRONG_INFO)
```

### 11.4 Images

```
image             id, place_id, url, width, height,
                  license, attribution, source_url
                  -- publish only if license AND attribution are non-null
```

### 11.5 Trip (enables the useful half of the feature)

```
trip              id, device_id, origin_place_id, dest_place_id,
                  corridor geography(LineString,4326), starts_at, ends_at
trip_stop         trip_id, place_id, order, notified_at
```

`trip` is not scope creep — it is how the feature remains useful for anyone moving faster than walking pace.

---

## 12. API contracts

```
POST /api/location/start        { device_id, source }            → { session_id, expires_at }
POST /api/location/update       { session_id, lat, lon, accuracy, ts }
                                 → { updated: true, in_region: bool }
POST /api/location/stop         { session_id }

POST /api/telegram/link                                          → { token, code, expires_in }
POST /api/telegram/webhook      (secret header, raw update)
POST /api/telegram/disconnect   { device_id }

GET  /api/nearby?lat&lon&radius&facets                           → candidates + bands
GET  /api/notifications/preferences?device_id
PATCH /api/notifications/preferences

GET  /api/trip/:id/pack                                          → offline manifest
```

All endpoints: input validation (zod), per-device rate limit, no coordinate logging.

**`in_region` matters:** if the user is outside the Coimbatore bbox, return `{ in_region: false }` and the UI switches to planning mode with a base-town selector. Without this, a user in Chennai sees "nearest place 480 km" and concludes the app is broken.

---

## 13. Message templates

### 13.1 Single alert (EN)

```
🌿 <b>Puthuthottam</b> · Nature · Water
Tea-estate ecology on the Valparai plateau; reliable for lion-tailed macaque.
4.1 km · open · est. 12 min by road
Verified 02 Nov 2026 · stay on the estate road, don't enter blocks
```
*(Tamil variant follows the same four lines; draft strings must be approved by a native reviewer before launch.)*

### 13.2 Digest (EN)

```
🌿 3 verified places near you
<i>Valparai · within 15 km</i>

<b>1. Puthuthottam</b> — 4.1 km · open
<b>2. Chinnakallar</b> — 9.8 km · open, seasonal note
<b>3. Nallamudi viewpoint</b> — 12.4 km · open

[ Open in Wild Atlas ]  [ Not now ]
```

### 13.3 Inline keyboard, every message

```
Row 1:  [ Explore ]        [ Directions ]
Row 2:  [ 👍 Useful ]  [ 👎 Not now ]  [ ⛔ Closed ]  [ ✏️ Wrong ]
```

`⛔ Closed` and `✏️ Wrong` write to the correction table. This is the cheapest corpus-maintenance channel in the entire product — a field report arriving at the exact moment someone is standing there.

### 13.4 Bot copy that must exist

| Situation | Message |
|---|---|
| `/start` no token | "Welcome. Share your live location and I'll find verified places near you. [Share location]" |
| No places in radius | "Nothing verified within 15 km. Nearest is 22 km — want me to widen the radius?" — never silence |
| Session expired | "Your location sharing ended. [Resume]" |
| Bot blocked | mark inactive, never retry |
| Outside region | "You're outside the Coimbatore region. [Plan a trip]" |

---

## 14. Metrics and kill criteria

| Metric | Target by week 12 | Kill threshold |
|---|---|---|
| Link completion (token issued → chat bound) | > 60% | < 25% |
| Digest open rate | > 45% | < 20% |
| "Not now" rate per digest | < 30% | > 50% |
| Mute/unlink within 7 days | < 15% | > 30% |
| `⛔ Closed` reports per 100 alerts | < 5 | > 15 (data is stale) |
| Correction → resolved within 7 days | 100% | — |
| Alerts sent / alerts actionable (directions tapped) | > 1 in 5 | < 1 in 15 |

**Hard stop:** if more than 30% of users disable notifications within a week, the proximity model is wrong. Move to trip-only delivery and stop real-time alerts.

---

## 15. Build order with gates

| Phase | Work | Days | Gate |
|---|---|---|---|
| **A** | Bot creation, `/start` tokenless, link flow + code, webhook + idempotency, disconnect | 4 | A stranger can connect in under 60 s and receive one test message |
| **B** | `device`, `preference`, `location_session`; Path A; `visibilitychange` + expiry sweep; `/nearby` | 3 | Session expires correctly when the tab closes |
| **C** | `recommendable()` in SQL; scoring; reason generation; `/radius`, `/pause`, `/resume`, `/stop` | 3 | A closed reserve cannot be produced by any input |
| **D** | Digest + budget + dedup + queue + 429 handling | 2.5 | 10 rapid location updates produce ≤ 1 message |
| **E** | **Path B: Telegram live location** | 2 | Phone in pocket, app never opened, alert arrives |
| **F** | Templates EN + TA, caption budget, images with licence gate, feedback buttons | 2.5 | Every message under 1024 chars, with attribution |
| **G** | Trip pack + corridor alerts | 3 | Pack downloads and works with airplane mode on |
| **H** | Test matrix, metrics, kill criteria wired | 3 | All 20 blind spots have a passing test |

**Total: ~23 dev days**, excluding content. Phase E is the one that decides whether the product is real — do not let it slip to the end.

---

## 16. Test matrix

```
□ Location permission denied → clear fallback, no broken map
□ Tab backgrounded → session expires in 5 min
□ Tab closed → no further sends, /nearby refuses
□ 10 GPS pings in 60 s at same spot → 0 duplicate messages
□ Movement 200 m → no send (under 250 m threshold)
□ Drive past 6 places in 20 min → exactly 1 digest
□ Quiet hours → 0 sends, resume at boundary
□ Place becomes CLOSED → immediate removal from candidates
□ last_verified_at 181 days → excluded
□ Place with 1 source → excluded
□ Sacred site → narrative_score NULL, no legend badge
□ Waterfall at 20:30 → suppressed
□ Monsoon + waterfall → suppressed
□ Tamil selected → all strings Tamil, no English leakage, caption < 1024
□ 429 from Telegram → retry_after honoured, no duplicate
□ Bot blocked mid-session → connection marked inactive, no further sends
□ Webhook replayed with same update_id → 1 send
□ Forwarded link token → code mismatch → unlink, no data leak
□ User in Chennai → in_region false, planning mode
□ No data (airplane mode) → cached dossiers readable, map renders
□ Live location expires at 1 h → clear message, resume offered
```

---

## 17. Resource analysis

| File | Contributes | Gap it leaves |
|---|---|---|
| `deep-research-report.md` | Original vision, competitor set (pre-2026) | Unrealistic stack, impossible proximity model, stale API assumptions |
| `wild-atlas-v2-skeleton.md` | Taxonomy, data model, phases, moat | No delivery channel; alerts deferred with no replacement |
| `base-towns.md` | Town matrix, last mile, access window | Static distances; no live-position routing |
| `trendingplace.md` | Scout pipeline, discovery ledger | Not wired to notifications |
| `clarification.md` | Consolidated decisions, master prompt | Reverts taxonomy; 24-in-4-weeks is arithmetically impossible |
| `telegram.md` | Strong engineering discipline, correct refusal of fake background tracking | Single location source; no budget, no gates, no feedback, privacy claim contradicted by its own schema |

**Net:** the corpus, taxonomy, distance model and bot transport are all spec'd. What was missing was **the background location source** — and Telegram already provides it. That is the single unlock in this document.

**Content dependency:** none of the above works without 12 verified dossiers. The bot is a delivery mechanism; it has nothing to deliver until the corpus exists. Build A–D in parallel with the content sprint, but do not launch the bot before place #6 is verified.

---

## 18. Open decisions

1. **Digest-only or digest+single?** Recommendation: digest-only by default, single alerts reserved for a declared trip corridor.
2. **Group trips in Phase 2?** One sharer, many readers. Highest-intent use case, but adds permission and spam complexity.
3. **Trip Pack download prompt** — on first session or on trip declaration? Recommendation: trip declaration, because that is when the user has wifi and intent.
4. **Tamil strings** require a native reviewer before launch. Machine translation of travel copy reads as marketing and costs trust exactly where the product claims authority.
5. **WhatsApp fallback?** Telegram skews technical and male; a DMO audience skews family. Keep Telegram for launch; note WhatsApp Business as the Phase 4 expansion channel.

---

## 19. One-line summary

Telegram is not a notification channel bolted onto the app — **it is the background location layer the PWA cannot provide, and the zero-install distribution the app store cannot beat.**
