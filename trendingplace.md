# Trending / Emerging Places — Scout Spec

**Status:** Planning document. This file replaces the loose agent prompt that was previously here.
**Related:** `wild-atlas-v2-skeleton.md` (product + corpus), `base-towns.md` (distance + base town).
**Principle:** Scout is a **back-office research tool**. It produces *candidate leads for a human*. It never publishes.

---

## 0. Original brief (kept for reference, superseded by §2 onward)

> Identify **emerging hidden destinations** that are not widely documented. Use local sources (tourism board notices, local news, heritage records), social media (location-tagged posts, travel blogs, video platforms), and user-submitted tips to discover **unknown or obscure places**. Verify each candidate's exact coordinates and current access status (open, permit-required, seasonal, closed). Check safety and cultural sensitivity. Separate fact from folklore; cite credible sources; mark rumours clearly. Rank by evidence of rising interest and by confidence in the data. Output name, location, category, description, why it is noteworthy, references, last-verified date. Exclude unverified, fabricated, illegal, or highly sensitive locations.

**Why this brief is unsafe as written:** "Verify each candidate's exact coordinates and current access status" asks a model to produce ground truth it does not have. It will emit four-decimal coordinates and a confident access status, both fabricated. That is the exact failure mode the product exists to prevent.

The rest of this document fixes that.

---

## 1. The reframe that makes this computable

The feature is not "find unknown places." Almost everything with a name is already on Google Maps with three reviews. The feature is:

> **Detect the gap between how much attention a place is receiving and how little documentation it has.**

```
emergence = attention_velocity / (1 + documentation)
```

- A place with rising mentions and 2 reviews is **emerging**.
- A place with rising mentions and 4,000 reviews is **popular**.
- A place with flat mentions and 0 reviews is **dormant** — not a lead.

This is computable, it uses data that is legally obtainable, and it produces a defensible ranking. "Hidden gem" is not computable. This is.

### Scoring

```
attention(t)  = 3*mentions + 2*engagement + 1*wikimedia_pageviews + 1*search_impressions
velocity      = (attention_7d - attention_prev_7d) / max(attention_prev_7d, 5)
documentation = log1p(reviews) + log1p(photos) + log1p(articles)
              + log1p(osm_present) + log1p(wikidata + wikipedia)
emergence     = velocity * decay(days_since_last_signal) / (1 + documentation)
```

**Minimum evidence gate** — a candidate is discarded below this, regardless of score:

- ≥ 8 signals
- ≥ 3 distinct source types
- signals spanning ≥ 2 distinct weeks

Without the gate, "rising" from six posts is statistical noise dressed as a trend.

---

## 2. What is genuinely new

The competitor is not Atlas Obscura. It is the Instagram / Xiaohongshu algorithm, which already performs emergence detection — invisibly, unverified, and destructively.

| Capability | Google Maps | Atlas Obscura | Instagram / RED | AllTrails | **Wild Atlas** |
|---|---|---|---|---|---|
| Established POI coverage | Excellent | Good | — | Trails | Low, by design |
| Genuinely undocumented places | No | Known-obscure only | Yes, unmanaged | No | Target |
| Attention-velocity signal | Internal | No | Implicit | No | Yes |
| **Documentation-gap detection** | No | No | No | No | **Core** |
| Provenance / source grades | Weak | Strong editorial | None | Community | **Core** |
| Access status + permits | Partial | No | No | Partial | **Core** |
| Safety gating | No | No | No | Partial | **Core** |
| Cultural-sensitivity gating | No | Partial | No | No | **Core** |
| Tamil-language authority | No | No | Partial | No | **Core** |
| Longitudinal emergence record | No | No | No | No | **Core** |

The white space is one intersection: **emergence detection × verified access.** Instagram has the first and none of the second. Atlas Obscura has the second and none of the first.

**Positioning:** *Everyone else shows you places you already know, or places nobody has verified. We catch places as they begin to rise — and tell you whether you can actually go.*

### The durable asset: the discovery ledger

An append-only, time-stamped record of **when** each place entered public awareness, the signals that surfaced it, and the verification that confirmed it.

> *Entered corpus 14 Aug 2026 on 11 posts across 3 weeks; field-verified 22 Aug 2026.*

Google cannot reconstruct this. Atlas Obscura never tracked it. It is a new regional dataset, it is licensable to tourism boards and researchers, and it compounds every month. **This, not the app, is the moat.**

---

## 3. Pipeline

```
HARVEST → EXTRACT → CLUSTER → NOVELTY → SCORE → TRIAGE → VERIFY → PUBLISH
```

| Stage | Hard part | Reality |
|---|---|---|
| **Harvest** | Legal access, not code | See §4. Most sources are not automatable. |
| **Extract** | Tamil toponym NER | Off-the-shelf NER fails on Tamil place names and transliterations (குத்திரைக்கல் / Kuthiraikal / Kuthirai Kal). Needs a gazetteer + transliteration normaliser. |
| **Cluster** | Entity resolution | Are 40 posts one place or three similarly named ones? Expect 20–30% wrong merges without visual clustering. |
| **Novelty** | Defining "unknown" | Use documentation density, not presence. |
| **Score** | Noise | Apply the minimum evidence gate. |
| **Triage** | Human judgement | Queue UI: card, signals, variants, map, novelty result, three buttons. |
| **Verify** | Throughput | Half a day per field check, 60 km radius, solo → ~2/week. |
| **Publish** | Safety | Access point only; never site coordinates for restricted places. |

### Triage queue UI

One candidate per card:

- Name variants (Tamil / Latin)
- Signal list with dates and links
- Map with centroid and precision flag
- Documentation check result
- `open_questions[]` — the field checklist
- Three buttons: **Verify** · **Quarantine** · **Reject**, each with a reason code

Reason codes matter more than buttons: `NOT_A_PLACE`, `ALREADY_DOCUMENTED`, `PRIVATE_LAND`, `RESTRICTED_AREA`, `CULTURALLY_SENSITIVE`, `UNSAFE`, `INSUFFICIENT_EVIDENCE`, `DUPLICATE`.

---

## 4. Sources — what is actually obtainable

| Source | Access | Use |
|---|---|---|
| YouTube Data API | 10k quota units/day; search = 100 units → ~100 searches/day | Title/description mining, view velocity |
| Reddit API | Commercial terms, low cost | Regional subs, trip reports |
| Local news RSS (Tamil + English) | Free | Opening announcements, accidents, closures |
| Tamil blogs and vlogs | Scrape with care / manual | Highest-value signal |
| OSM notes + changesets | Free, ODbL | New paths, new names |
| Wikimedia Pageviews API | Free, no auth, per-article daily series | Cleanest legal attention proxy |
| Google Maps | No new-listing feed | Documentation check only, via licensed provider |
| Instagram Graph | 30 unique hashtags/week, business account, app review | Marginal |
| TikTok Research | Academic only | Unusable |

**Conclusion:** the honest build is a **semi-manual research workflow over a defined source list per district**, not an autonomous scraper. Automate harvesting for the three or four sources that permit it; everything else is a weekly manual sweep.

---

## 5. Data model

```
signal              source, url, captured_at, raw_text, lang, geo_hint
candidate           centroid, name_variants[], status, emergence_score,
                    novelty: NEW_TO_CORPUS | KNOWN_LOW_DOC | KNOWN
candidate_signal    join
entity_link         candidate ↔ existing POI, with dedupe evidence
documentation       reviews, photos, articles, osm, wikidata, wikipedia
verification_task   assignee, checklist, evidence_urls[], outcome, completed_at
discovery_event     append-only ledger: entered_awareness_at, evidence[], verified_at
```

`candidate.status` lifecycle:

```
NEW → TRIAGED → VERIFYING → VERIFIED → PUBLISHED
                          ↘ QUARANTINED
              ↘ REJECTED
```

---

## 6. Corrected agent prompt

Replace the original prompt with this. The inversion is the point: the agent **produces questions for a human**, not answers.

```
ROLE: research assistant producing CANDIDATE LEADS for human verification.
You do not publish. You do not assess access, safety or cultural status yourself.

HARD RULES
1. Never output a coordinate you did not read from a cited source.
   If no source gives coordinates, output "UNKNOWN". Never estimate.
2. "UNKNOWN" is the expected value for every field except name, source_url,
   captured_at. Absence of evidence is a finding, not a gap to fill.
3. Every field carries provenance:
   {value, source_url, retrieved_at, confidence: HIGH | MEDIUM | LOW}.
4. Never merge name variants unless you can cite evidence they are the same
   place. Otherwise emit both and flag POSSIBLE_DUPLICATE.
5. Refuse and flag: private land, active litigation, restricted reserve,
   self-harm sites, active worship sites where promotion would intrude.
6. Rank by emergence = velocity / documentation. Never by raw popularity.

OUTPUT SCHEMA (per candidate)
  candidate_id
  name_variants[]        {text, script: tamil|latin}
  geo                    {lat, lon | UNKNOWN, source_url, precision: EXACT|APPROX|UNKNOWN}
  nearest_settlement, district
  signals                {count, distinct_sources, date_range, sample_urls[]}
  documentation_check    {google_present, reviews, photos, osm, wikidata, wikipedia}
  novelty                NEW_TO_CORPUS | KNOWN_LOW_DOC | KNOWN
  proposed_facets[]
  nearest_base_town      {name | UNKNOWN, source_url}
  access_status          UNKNOWN | {value, source_url}
  safety_flags[], cultural_flags[]
  open_questions[]       <- exactly what a human must check on the ground
  why_surfaced           one line
  recommended_action     VERIFY | QUARANTINE | REJECT
```

`open_questions[]` and `recommended_action` are what make the queue usable at 40 candidates a month.

---

## 7. Blind spots

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| 1 | Signal access, not the algorithm, is the binding constraint | High | Accept a semi-manual workflow; automate only YouTube/Reddit/RSS/Wikimedia |
| 2 | LLM fabricates coordinates and access status | High | §6 prompt: `UNKNOWN` required, provenance mandatory |
| 3 | Success is self-destroying — publication causes overcrowding | High | Publish place + access point + base town + access window, never a bare pin |
| 4 | "Novelty" is unmeasurable in practice | High | Redefine as documentation density |
| 5 | Yield rate is roughly 1 publishable place per 1,000 signals | High | Position Scout as a research accelerator (6h → 40min per lead), not a supply engine |
| 6 | Cold start — Scout cannot bootstrap the corpus | Medium | Phase 2+, after 24 manual dossiers |
| 7 | Tamil NER is genuinely hard | Medium | Gazetteer + transliteration graph; treat as a months-long asset |
| 8 | Verification throughput caps the feature | Medium | 3–5 local verifiers on structured forms before any automation |
| 9 | User submissions are a liability surface | Medium | Submission policy, takedown path, landowner opt-out, moderation SLA |
| 10 | "Trending" is the wrong label | Medium | Show **newly verified** (recency you control), not attention velocity (which you would be amplifying) |

### Yield arithmetic (estimate — validate in Phase 2)

```
1,000 signals/month
  →  40 candidate clusters
  →  15 genuinely new
  →   8 legally accessible
  →   4 publishable
  →   1 worth a detour
```

If this holds, Scout is not a content factory. It is a **research accelerator**. Plan for one good place a month and the feature looks excellent. Plan for fifty and the project dies.

---

## 8. Phasing

| Phase | Scope | Gate |
|---|---|---|
| 0 | None. 24 manual dossiers. | Do people read? |
| 1 | None. Field utility + base towns. | Do they reopen during the trip? |
| 2 | **Scout v0 — manual.** Defined source list, weekly hand harvest, spreadsheet triage, schema from §5. No automation. | Time per lead < 90 min; ≥ 1 publishable lead/month |
| 3 | Scout v1 — YouTube/Reddit/news ingestion, Tamil gazetteer, clustering, queue UI | Yield stable; ledger accumulating |
| 4 | Verifier network + public submission intake | Throughput > 2/week |

Scout v0 is deliberately a spreadsheet. If the manual workflow produces nothing, no pipeline will.

---

## 9. Metrics

| Metric | Target |
|---|---|
| Signals ingested per week | 200+ |
| Candidates triaged per week | 8–12 |
| Time per lead (harvest → triage decision) | < 90 min |
| Yield: publishable per 100 candidates | 5–10 |
| Field verification throughput | ≥ 2/week |
| False-positive rate (published then quarantined) | < 10% |
| Ledger completeness | 100% of published places |

---

## 10. One-line summary

Not "find unknown places" — **measure where attention is outrunning documentation, then send a human to check.**
