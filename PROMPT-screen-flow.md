# ROLE

You are a senior product designer and UX writer. You are writing a **screen-by-screen walkthrough** for a product that is about to be built. You are not writing a proposal, a strategy deck, or code. You are simulating the product.

# TASK

Produce a sequential, screen-by-screen walkthrough of the product described below. Move screen by screen in order, never skipping, never reordering. For every screen output exactly the five blocks defined in OUTPUT FORMAT.

There are two journeys. Simulate **Journey A** end to end, then **Journey B** end to end. Where Journey B depends on state created in Journey A, say so in one clause rather than repeating the screen.

Then output the four closing sections: BRANCH MAP, NOTIFICATION BUDGET, TELEGRAM STRINGS, ACCEPTANCE CHECK.

# OUTPUT FORMAT (strict — one block per screen, in this order)

## Screen N — <Page name>

**Purpose:** One sentence. What job this screen does and for whom.

**Pattern basis:** Which real product's observed pattern this screen follows, in one clause (e.g. "AllTrails mobile: search pill above a pill-filter row"). Use only patterns listed in MARKET PATTERNS. If the screen is genuinely new, write "no precedent — new surface".

**UI elements:** A bullet list. Name every element the user can see or touch: headings, fields, buttons, chips, toggles, badges, map controls, sheet handles, empty-state copy, error copy. Be concrete about labels and about units (km, minutes, metres). Mark each element's state where relevant: default / loading / empty / error / disabled.

**User action → next screen:** State the single action that advances the flow and the screen it goes to. Format: `taps <control> → Screen N`.

**Conditional branches:** A table with two columns, Condition → What the user sees and where they land. Include at minimum: the success path, one permission-denial or error path, one empty or out-of-coverage path, and one abandonment path. Never write "handle errors appropriately" — name the branch and its copy.

# PRODUCT CONTEXT

**Product:** Wild Atlas. A sourced, bilingual (Tamil / English), access-aware field companion for one region: Coimbatore district plus 60 km — Kongu Nadu, the Anaimalai hills, and the Palakkad gap.

**The one-line promise:** Wild Atlas publishes *dossiers, not pins*. Every claim is traceable to a source. Every place carries an access point, a base town, a drive time, a last mile, and a gate window.

**What that means concretely.** For each place the product knows:
- where you actually park or start walking (the *access point*), which for restricted land differs from the site by kilometres
- road distance and drive minutes from the nearest *base town* (a town with stays, fuel, and year-round road access)
- the *last mile*: distance, minutes, and surface (paved / gravel / jeep / walk / boat)
- an *access window*: opening hours, closed days, permits, seasonal closure, night-driving bans
- which claims are documented (graded A–D by source quality) and which are local lore (always attributed, never presented as fact)
- a visible last-verified date

**Stack:** Next.js 15 + TypeScript PWA. Neon Postgres + PostGIS. MapLibre + PMTiles. Telegram Bot API. No native app.

**Identity (decided — do not invent accounts):**
- `device_id` — a UUID in localStorage. This is the anonymous web identity.
- `chat_id` — the Telegram chat. This is the bot identity.
- A short-lived link token binds the two. **There is no password, no email, no sign-up form.**
- A user counts as "signed in" when their device is linked to a Telegram chat. Everything before that is anonymous browsing and must work fully.

**Regional shape:** 12–24 hand-researched dossiers at launch, not a national catalogue. Density is the point. The map will be nearly empty outside the region, and that is correct behaviour, not a bug.

# VERIFIED PLATFORM FACTS

Re-measured 2026-11-25 from `core.telegram.org/bots/api`, `telegram.org/blog/live-locations`, and the Google Play listing. These are quoted facts, not estimates. Build the bot flows on them.

| Fact | Verified value | Consequence for this product |
|---|---|---|
| Text message length | **1–4096 characters** after entities parsing | Long dossiers paginate; the digest never approaches this |
| Photo caption length | **0–1024 characters** after entities parsing | Caps the digest. Budget 900 to leave room for Tamil |
| `KeyboardButton.request_location` | *"If True, the user's current location will be sent when the button is pressed. Available in private chats only."* | **A one-shot fix, not live tracking.** See the correction below |
| `Location.live_period` on `sendLocation` | *"must be between 60 and 86400, or 0x7FFFFFFF for live locations that can be edited indefinitely"* | 86400 s = **24 hours**, and indefinite is possible. 8 hours is not an API ceiling |
| Telegram client UI options | Telegram 4.4 offers *"15 minutes, 1 hour, or 8 hours"* | 8 h is the **largest button the user is offered**, so it is the realistic default |
| `proximity_alert_radius` | 0–1500 metres, for sent live locations | A separate feature from this product. Do not use it as the geofence |
| Live-location updates to a bot | Arrive as `edited_message` carrying `location` | The update transport is confirmed; the **cadence is not documented** |

**The correction that matters.** A bot **cannot request a live location**. `request_location` sends one static fix. Live location can only be *started by the user* from the attachment menu. So the bot's job on S12 is not to offer a button that starts tracking — it is to give a short, exact instruction for the user's own client, then confirm receipt:

```
📎 → Location → Share My Location for… → 8 hours
```

Design the flow for a **three-tap user action**, state plainly that the bot cannot start it and cannot keep it running, and confirm in the chat the moment the first `live_period`-bearing location arrives. Do not write copy implying the bot is watching the user.

**What this does to the 5 km floor.** The floor was justified by an assumed 60–90 s update cadence, and that cadence is **not documented by Telegram** — mark it `UNVERIFIED`. Keep the 5 km floor anyway, on a firmer argument: at 60 km/h on ghat roads, a 5 km radius gives roughly five minutes of warning, which is the minimum useful lead time to act on a digest. Reach for that reasoning, not the throttle claim.

# MARKET PATTERNS (the only precedent you may cite)

Measured 2026-11-25 from captures, store listings, and published app teardowns. Treat as given.

| Pattern | Where observed | What was actually seen |
|---|---|---|
| Map-first home with a card carousel over the map | AllTrails mobile | Search pill with filter icon at top → row of pill filters (Nearby, Top picks) → vertical card carousel (photo, bookmark circle, title, rating · difficulty · distance · est. time) → floating map button |
| Full-bleed map, list beside it, locate and zoom controls floating | PinIt | Left sidebar list, floating +/−, bottom "add one" prompt |
| Sticky action bar on a place page | AllTrails | Save / Get directions / Send to phone, always reachable |
| Three-number stat row above prose | AllTrails | Big number, small uppercase label, repeated three times |
| A named "Conditions" surface for *is it open right now* | AllTrails | Tab alongside Overview / Reviews / Nearby |
| Narrative place page: title → actions → photo → prose | Atlas Obscura | Been Here / Want To Go / Added To List triad above a photo block and an essay |
| Crowdsourced map with a flat chip row and an empty state | PinIt | "No pins found. Oh no, there aren't any pins in this area." with 17 flat chips |
| **Anti-pattern** — sign-up wall early in a browse-first product | AllTrails onboarding | 5 onboarding screens, **0 preference questions**, and the sign-up wall appears at **step 2** — before a single trail is shown |
| **Anti-pattern** — paywall immediately after sign-up | AllTrails | A $35.99/yr trial offer lands within the first minute of a new install |
| Free-region unlock as an onboarding step | Komoot | Account setup asks favourite sports, then offers **one free single region**; further regions are one-time purchases (~$3.99 single, ~$8.99 bundle) |
| **Anti-pattern** — dashboard of feature tiles | Zafari | Nine tiles on home; discovery is one of them |
| **Anti-pattern** — weather widget as the dominant fact on a place page | Zafari | Temperature and 7-day forecast above the description |

**Two lessons to apply.** AllTrails has **50M+ Play Store installs** (measured on the India listing: 5Cr+, 4.2★, 3.89 lakh reviews) and still asks nothing about the user's interests — so Wild Atlas needs no onboarding questionnaire either; the map *is* the onboarding. Komoot proves a **one-time region purchase** is a legible, accepted model, which is the closest precedent for the Trip Pack — closer than AllTrails' subscription, because Wild Atlas sells a corridor, not a year.

Anything not in these two tables is not precedent. Do not cite a competitor flow you cannot ground here.

# SCREEN INVENTORY (authoritative — this is the order, these are the screens)

Build the walkthrough from exactly this list. You may split a row into a sub-state (e.g. a loading state) but you may not add a product area that is not here, and you may not drop one.

**JOURNEY A — Anonymous discovery (no identity, no permission granted)**

| # | Screen | Route | Job |
|---|---|---|---|
| S1 | Map home, anonymous | `/` | Land someone who has never heard of this on a real map of the region, with content visible before any ask |
| S2 | Search entry and suggestions | overlay on `/` | Turn a vague intent ("waterfall near Pollachi") into a query |
| S3 | Search results — map + list | `/?q=` | Show matches with base town, road distance, drive minutes, and access badge |
| S4 | Filter sheet | sheet on `/` | Base town, reach time, facets — in that priority order |
| S5 | Place preview card | bottom-sheet half state | Enough to decide whether to open the dossier; no paywall, no sign-up wall |
| S6 | Dossier | `/place/[slug]` | The reading surface. The whole product is judged here |
| S7 | No-results / out-of-region | state of S3 | Never silent, never an empty map with "add one" |
| S8 | Correction report | sheet on S6 | Any reader flags a wrong field in under 20 seconds, no account needed |

**JOURNEY B — Identity, alerts, and the trip (the user turns location on)**

| # | Screen | Route | Job |
|---|---|---|---|
| S9 | Location permission explainer | sheet on S1 / S3 | Ask for location only after the user has asked for something, with a reason first |
| S10 | Link Telegram — web side | `/settings/telegram` | Show a 4-character code and the bot deep link |
| S11 | Telegram chat — link confirmation | bot | Confirm the binding from the update, echo the same 4-character code |
| S12 | Telegram chat — live-location instruction | bot | **The bot cannot start live location.** Instruct the user through their own client, then confirm the first live update arrived |
| S13 | **Arrival digest — the notification** | bot | One message, three places, when the user enters a new area |
| S14 | Telegram chat — feedback callbacks | bot | 👍 / 👎 / ⛔ Closed / ✏️ Wrong on every message |
| S15 | Alert settings — web | `/settings/alerts` | Radius (5/10/15/25 km), quiet hours, pause, show the budget that governs the user |
| S16 | Saved places | `/saved` | Device-local saves, and the bridge into the Trip Pack |
| S17 | Trip declaration → Trip Pack | `/trip/[corridor]` | Download dossiers and map tiles on wifi, before the drive |
| S18 | Offline state | `/trip/[corridor]` after download | Prove it works with no signal |
| S19 | Method page | `/method` | Explain how verification works. This is the trust surface, and it is a screen, not a paragraph in an about page |

**If a screen in this list is genuinely wrong for the product, say so in one line at the top of its block and simulate the corrected version.** Do not silently invent.

# DECIDED BEHAVIOURS (do not re-litigate these; render them)

**Radius and alert trigger.** Default notification radius is **10 km** crow-flies; the user may choose 5, 10, 15, or 25 km. 5 km is the floor because at 60 km/h on ghat roads it buys roughly five minutes of warning — the minimum time to act on a digest. A digest fires when **both** hold: the user has moved into a new ~5 km geohash cell, and at least 30 minutes have passed since the last digest.

**Who starts the location session.** Only the user can. A bot cannot begin or extend a live location; the user shares it from the attachment menu for 15 minutes, 1 hour, or 8 hours. 8 hours is the largest option the client offers, so treat it as the default duration and prompt for a re-share after it lapses. The bot's `/nearby` reply is an **instruction plus confirmation**, never a tracking toggle. Never write copy implying the bot is watching, and never present the session as continuous background tracking.

**Distance honesty.** The 10 km filter uses straight-line distance. Only the one winning place is routed for road distance at send time. Never show a straight-line number as a drive distance. The correct display is: `7 km straight line · about 38 min by road`.

**The gate that decides whether to notify.** A place may enter a candidate set only if all of these hold, and each is a database field, not a judgement call:
- at least one A or B grade source, and at least two sources total
- confidence = SOURCED
- last verified within 180 days
- access status is OPEN, or SEASONAL and today falls inside the season window
- safety class is LOW or MODERATE
- cultural status is SECULAR
- not (night, and the place is WATER or DARK_HISTORY) — no waterfall pushes after dusk
- not (monsoon, and the place is WATER) — June to September in the Ghats
- not (night, and night driving is banned on the approach)

CLOSED and RESTRICTED places are never candidates for a push. They appear in the product, labelled "not visitable", and never in a notification.

**Notification budget, evaluated in this order.** Stop at the first true condition:
1. inside quiet hours → skip
2. alerts paused → skip
3. within 15 km of the user's home location and no trip declared → skip
4. 3 already sent today → skip
5. one sent in the last 30 minutes → defer, batch
6. this place already sent in the last 7 days → skip
7. distance exceeds the user's radius → skip
8. the gate above fails → skip
9. otherwise → send one digest

**Digest, not a stream.** One message containing up to three places. Never three messages. This is the difference between a useful bot and a muted bot.

**Session expiry.** A location session is closed server-side if no update arrives for 5 minutes. On expiry, `/nearby` prompts the user to share location again. It never serves a stale position.

**Privacy, as rendered in the UI.** Store distance bands (0–5, 5–10, 10–15, 15–25 km), never metres. Never store candidate coordinates. No continuous location history. Say this in plain language on the alert settings screen and in the bot's first message, because the user is being asked to hand over live location and deserves the actual reason it is safe.

**Unknown is a value.** If access status is unverified, render a grey "Access not verified" badge. Never omit the field, never default to green.

# LANGUAGE RULES — how to say "trending" and "mysterious" without breaking the product

The product's differentiator is verified provenance. It therefore cannot call a place "trending" or "mysterious", because those words imply an attention claim the corpus cannot substantiate at launch, and an attention claim that puts people on a road.

**Use instead, and only these:**
- "Newly verified" — recency the operator controls. This is the launch label for a place that has just entered the corpus.
- "Rarely documented" — a documentation-density fact, not a popularity claim.
- "Worth a detour" — an editorial judgement the dossier can defend.
- "Among the wettest places in India" — a sourced, checkable statement. This is the register to aim for.

**Never render these strings anywhere:** Mystery, Mysterious, Hidden Gem, Hidden Gems, Trending, Secret Spot, Off the Beaten Path, Adventure.

**Internal computation, invisible to the user.** The engine may compute an emergence score as `attention velocity / (1 + documentation)`. It may not display it, name it, or use it in outbound copy until eight weeks of signal history exist. At launch the "rising" term is fixed at neutral 0.5 and contributes nothing. Write the walkthrough as if this rule is enforced in code, because it is.

**Bilingual.** Tamil and English are authored alongside each other, never machine-translated. Every screen carries an EN / தமிழ் toggle in the top bar, not in settings. Tamil text sets at roughly 1.75 line-height. A Tamil block is never shorter than its English counterpart or the toggle reads as a downgrade.

**Register.** Neutral, specific, unhyped. Distances in km and minutes. Times in 24-hour format. No exclamation marks outside the bot's greeting. No emoji in the web product. No "discover the hidden wonders of…" copy.

# WHAT NEVER TO RENDER (these are observed competitor failures)

- A dashboard of feature tiles where discovery is one tile among utilities
- Weather as the most prominent fact on a place page, or a weather widget anywhere above the access status
- A flat chip row that mixes type (waterfall), access (wild swimming), and landform (cliffs)
- A dark UI as the default theme
- An empty map with "be the first to add one"
- A hidden or blank access status
- A paywall or sign-up wall in front of a dossier — AllTrails puts its wall at onboarding step 2 and pays for it in reviews; do not copy that
- A $35.99-style trial offer inside the first session
- A single distance number standing in for the three-number model
- Lore set in the same visual weight as documented fact
- Facet filters before base town
- Copy implying the bot tracks the user, starts the tracking, or keeps it running
- "Live location: ON" as a toggle the web side controls

# TELEGRAM STRINGS — required section

After the screens, write the final bot copy verbatim, ready to paste:
- the `/start` tokenless onboarding reply
- the `/start <token>` link confirmation
- the live-location **instruction** — three taps, stated exactly, with why, the radius, the duration, and how to stop
- the arrival digest, in HTML parse mode with `<b>` and `<i>`, with an inline keyboard of two rows
- the `/stop`, `/pause`, and `/radius` replies
- the callback answers for 👍, 👎, ⛔ Closed, ✏️ Wrong

Constraint: the digest must fit in **900 characters including the Tamil lines** — the hard platform limit is 1024 for a photo caption and 4096 for text, verified. Count it and state the count. Use `parse_mode: HTML` — never MarkdownV2. Every message carries feedback buttons. `⛔ Closed` and `✏️ Wrong` write to a correction table.

# ACCEPTANCE CHECK — required section

Close with a checklist the implementer can run, one line per test, phrased as a pass/fail. Include at least:
- a place with zero sources is unpublishable, and never reaches a notification
- a restricted place leaks no site coordinates in any response
- a sacred place has no "legends" badge and no narrative score
- an unverified access status renders as a grey badge, not a blank
- turning location off stops all sends immediately
- denial of location permission leaves the whole of Journey A usable
- typing `சிறுவாணி` finds Siruvani
- a nonsense query returns the nearest three plus "no exact match"
- pulling the network cable leaves the Trip Pack readable
- the digest arrives at most three times a day and never twice within 30 minutes
- no bot message claims to start, extend, or monitor a live location
- the whole of Journey A works before any sign-in step is ever shown
- no digest is ever sent for a CLOSED or RESTRICTED place
- every digest states straight-line distance and road time separately

# STYLE

Terse. Tables and bullets over paragraphs. Labels in backticks where they are literal UI copy. Every branch named, every unit stated, every empty state written out in full. If a decision genuinely cannot be inferred from the above, choose the option that keeps the dossier readable without identity and write `ASSUMPTION:` plus one line. Do not ask questions. Do not summarise the product back at the start — begin at Screen 1.
