# Base Towns & Travel Distance — Feature Spec

**Status:** Planning document.
**Decision:** Wild Atlas publishes places (not routes). The safety mitigation is that a published place is bundled with an **access point**, a **base town**, and an **access window** — never a bare pin.
**Scope:** Coimbatore district + 60 km, plus gateway towns to the Nilgiris, Anaimalai and Palakkad.
**Dependency:** `wild-atlas-v2-skeleton.md` (§5 IA, §6 data model).

---

## 1. The decision this feature answers

Not "how far is it." Travellers already know they can drive. The unanswered question is:

> **If I sleep here, what can I actually reach tomorrow — and can I get in when I arrive?**

Everything below serves that one question.

---

## 2. Why kilometres alone are wrong

Three separate failures that a single distance number hides:

| Failure | Example shape | Consequence |
|---|---|---|
| **Road vs straight line** | 9 km apart across a valley, 40 km by road | User plans a 20-minute detour that takes 2 hours |
| **Last mile** | 34 km of tarmac, then 4.2 km of jeep track | Sedan cannot proceed; user turns back or damages the car |
| **Access window** | Reserve gate 06:00–17:00, no night driving | User arrives at 17:30 and is turned away after a 2-hour drive |

**Therefore the published unit is three numbers, not one:**

```
town  → access point   road_km, drive_minutes
access point → site    last_mile_km, last_mile_minutes, surface
access window          opens, closes, closed_days, permit, night_driving
```

Any competitor can render a distance. Showing the last mile and the gate timing is the actual product.

---

## 3. Architecture — precomputed, not on-demand

### 3.1 Why precompute

The corpus is small and slow-moving: ~24 places × ~22 towns ≈ **530 pairs**, growing to maybe 5,000 at 200 places. That is a batch job, not a service.

```
PUBLISH TIME (quarterly or on re-verification)
  place × town  →  routing API (matrix endpoint)
                →  store road_km, drive_minutes, engine_version, computed_at

REQUEST TIME
  SELECT ... FROM place_town WHERE town_id = $1 AND drive_minutes <= 60
  → plain indexed read. No routing call. No latency. No vendor dependency.
```

**Consequences:**
- Zero per-request routing cost.
- UI is instant, works on a slow connection in the field.
- The routing vendor can be swapped without touching the app, because only the batch depends on it.
- Offline packs can embed the matrix directly.

### 3.2 Do not self-host OSRM (yet)

A South India extract is ~600 MB and OSRM preprocessing wants 8–16 GB RAM for a job run four times a year. That is pure ops burden.

**Use a hosted matrix API for the batch instead:** OpenRouteService or GraphHopper free tier. A few matrix calls per quarter, stored in Postgres. Essentially $0.

Self-host OSRM or Valhalla only if the product later needs **on-demand routing** (live rerouting, arbitrary origin→destination). It does not, today.

### 3.3 Day-reach, without an isochrone engine

"Places within 60 minutes of Valparai" is a `GROUP BY` over the same matrix:

```sql
SELECT p.*, pt.drive_minutes
FROM place_town pt
JOIN place p ON p.id = pt.place_id
WHERE pt.town_id = $1 AND pt.drive_minutes <= $2
ORDER BY pt.drive_minutes;
```

If a shaded reach polygon is wanted on the map, use the **convex hull of reachable places**. It is honest because it is derived from real routes, and it needs no additional engine.

---

## 4. Data model

### 4.1 `town`

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `slug` | text | |
| `name_en`, `name_ta` | text | Bilingual mandatory. |
| `location` | `geography(Point,4326)` | Town centre. The origin for all distances. |
| `population` | int | Selection criterion. |
| `elevation_m` | int | Altitude is a real planning input here. |
| `stay_count` | int | Manually maintained, quarterly. Not scraped. |
| `character_en`, `character_ta` | text | One editorial line. "Tea-estate town, most stays, fuel and hospital." |
| `services` | enum[] | FUEL, FUEL_24H, HOSPITAL, PHARMACY, ATM, BUS, EV, MECHANIC |
| `road_in` | enum | PAVED / GHAT / GRAVEL |
| `seasonal_risk` | enum | NONE / MONSOON / LANDSLIDE |
| `is_gateway` | bool | Entry point to a reserve or hill region. |
| `carrying_capacity_note` | text | Required when adjacent to an active sacred site. |
| `last_verified_at` | date | |

### 4.2 `place_town`

| Field | Type | Notes |
|---|---|---|
| `place_id`, `town_id` | uuid | Composite PK. |
| `road_km` | numeric(6,1) | Town centre → **access point**, not site. |
| `drive_minutes` | int | Rounded up. |
| `route_note_en`, `route_note_ta` | text | "Via Anaikatti road; last stretch single-lane." |
| `engine` | text | e.g. `ors-driving-car` |
| `computed_at` | timestamptz | |

### 4.3 Additions to `place`

| Field | Type | Notes |
|---|---|---|
| `last_mile_surface` | enum | PAVED / GRAVEL / JEEP / WALK / BOAT |
| `last_mile_km` | numeric(5,1) | |
| `last_mile_minutes` | int | |
| `last_mile_note_en`, `_ta` | text | "Jeep track from the estate gate; ask at the checkpost." |
| `access_opens` | time | |
| `access_closes` | time | |
| `closed_days` | text | e.g. "Tuesday", "monsoon closure Jun–Sep" |
| `permit_required` | bool | |
| `permit_note_en`, `_ta` | text | Who issues it, where, lead time. |
| `night_driving_banned` | bool | Common on ghat and reserve roads. |

### 4.4 Definition rule

**All distances are town centre → access point.** Published in the UI as a footnote. Ambiguity here generates support requests and erodes trust faster than a wrong number.

---

## 5. UI surfaces

### 5.1 Dossier block — "Where to base yourself"

```
WHERE TO BASE YOURSELF
Valparai     34 km   1h 20m   Tea town · most stays · fuel + hospital
Pollachi     58 km   1h 45m   Gateway · 24h fuel · larger hospitals
Anaikatti    22 km   0h 45m   Closest · 4 stays · no fuel after 20:00

Last mile    4.2 km jeep track, 25 min
Access       06:00–17:00 · permit at gate · no night driving
```

Rules:
- Maximum three towns. Ranked by drive time.
- Never show hotels. Towns only.
- One outbound link: "See stays in Valparai" → booking platform. No price, no availability, no inventory claim.
- Footnote: *"Distance is town centre to access point. Times are driving only."*

### 5.2 Map

- Town pins: square, muted. Place pins: round, primary.
- Selecting a place draws lines to its top three towns, with minutes labelled.
- Selecting a town dims all places beyond the chosen reach threshold and shows a hull.
- Toggle: *Base towns* on/off.

### 5.3 Search control

A single control, not a filter panel:

```
Base town: [Valparai ▾]   within [60 min ▾]
```

Changing it re-sorts by drive time and updates the map hull. This is the highest-value control on the search screen — more useful than category chips for anyone actually going somewhere.

### 5.4 Trip surface

The sentence that sells a subscription:

> **2 nights in Valparai → 7 places, 3 within 60 minutes.**

Each night's base becomes a day plan. This is Phase 2, and it is the natural home of the paid offline pack.

---

## 6. Town registry — candidates (verify before publishing)

Selection rule, published on the page:

> *Settlements with at least three registered places to stay, year-round road access, and fuel. Ranked by drive time. Never by commission.*

| Town | Role | Notes to verify |
|---|---|---|
| Coimbatore | Gateway / city base | Hospitals, airport, 24h fuel; 0 km reference |
| Mettupalayam | North gateway | Nilgiri Mountain Railway; base for northern Siruvani |
| Karamadai | West | Temple town, road to Anaikatti |
| Perur | Southwest edge | Temple; city-adjacent |
| Thadagam | Anaikatti road | Small, few stays |
| Anaikatti | Closest to Siruvani corridor | Very limited stays; no fuel after 20:00 |
| Alandurai | Foothills | Budget base, Siruvani road |
| Madukkarai | South | Palakkad road |
| Pollachi | Gateway to Anaimalai | Markets, hospitals, best supply for Topslip |
| Anaimalai | Masani Amman | Small; carrying-capacity note required |
| Sethumadai | Topslip gate | Forest checkpost; timings critical |
| Topslip | In-reserve | Restricted entry, forest accommodation, no private stays |
| Valparai | Hill base | Most stays in the hills; ghat road, seasonal landslide risk |
| Aliyar | Mid-hill | Dam; stopover rather than base |
| Palakkad (KL) | Cross-border gateway | 1h from Coimbatore |
| Mannarkkad (KL) | North Kerala approach | Alternate to Anaimalai |
| Sathyamangalam | East | Dhimbam ghat; wildlife corridor |
| Bhavani | East | Kooduthurai confluence |
| Avinashi | East | Temple; highway |
| Sulur | East | Airport-adjacent |
| Annur | North | Highway |
| Coonoor / Kotagiri / Ooty | Nilgiris | 60–90 min from Mettupalayam; expands reach |

Every row needs `stay_count`, `services` and `last_verified_at` confirmed before it appears.

---

## 7. Blind spots

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| 1 | Distance shown without last mile is actively misleading in this terrain | High | Two-number model is mandatory, not optional |
| 2 | Gate timings and seasonal closures go stale | High | Same `lastVerified` discipline as dossiers; recompute at season boundary |
| 3 | "Where to stay" implies inventory and price | High | Towns only. No hotel names. Outbound link only |
| 4 | Routing matrix drifts from reality (new roads, missing ghat links) | Medium | Quarterly rebuild + 10-pair manual spot check |
| 5 | Naming three towns funnels demand and creates DMO friction | Medium | Publish the selection rule; never rank by commission |
| 6 | Four different meanings of "distance" | Medium | One definition, stated in UI: town centre → access point |
| 7 | Footfall pressure on villages near active sacred sites | Medium | `carrying_capacity_note`; no base-town promotion for SENSITIVE sites |
| 8 | Cross-border (Kerala) routing and permit assumptions differ | Low | Flag state boundary; verify permit rules per state |
| 9 | Convex hull misleads where reach is non-contiguous | Low | Label it "approximate reach"; treat numbers as authoritative, hull as decoration |

---

## 8. Phasing

| Phase | Work | Gate |
|---|---|---|
| 1 | `town` + `place_town` tables; 22 towns verified; matrix batch for 24 places; dossier block; map pins; base-town search control | Users pick a base town and then open a place — measure the transition |
| 2 | Reach hull; trip surface ("2 nights in X"); offline pack embeds matrix; last-mile and access-window badges | ≥20% of savers reopen during the trip |
| 3 | Expand to Nilgiris and Palakkad; recompute pipeline automated; route notes editorialised | Recompute is a one-command job |

---

## 9. Metrics

| Metric | Target |
|---|---|
| Dossiers with complete distance + last mile + access window | 100% |
| Base-town control used per session | > 25% |
| Place opened *after* selecting a base town | > 30% |
| "Wrong distance / closed" corrections per 100 dossiers per month | < 3 |
| Matrix staleness (`computed_at` > 120 days) | 0 dossiers |

---

## 10. Cost

| Item | Cost |
|---|---|
| Routing matrix batch (ORS / GraphHopper free tier) | $0 |
| Storage for 5,000 pairs | negligible |
| Recompute cadence | 4× per year, ~1 hour each |

The feature is effectively free to operate. Its cost is editorial: verifying stay counts, services and gate timings for 22 towns.

---

## 11. One-line summary

Publish the place, but publish it as **access point + base town + drive time + last mile + gate window** — because in these hills the distance was never the problem.
