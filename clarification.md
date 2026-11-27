# 1. Key decisions in the new clarifications

The two clarification documents (“Product Skeleton v2” and “Base Towns & Travel Distance”) lock in a much more focused product scope and data model. The highlights are:  

- **Region and scale:** Focus on Coimbatore district (+60 km) rather than pan-India. Launch as a “field companion” for local discovery.  
- **Technical stack (solo, end-to-end):** Next.js + TypeScript (PWA), PostgreSQL + PostGIS (Neon DB), Drizzle ORM, MapLibre GL with Protomaps/PMTiles, Airtable/Google Sheets for editorial data. (No separate Spring Boot, no native SDK initially.)  
- **Discovery model:** Emphasize *sourced local discovery*, not algorithmic popularity. Every place is a **researched dossier**:  
  - **Facets (categories):** e.g. Nature, Sacred, etc (distinct from “signals”).  
  - **Signals:** (independent axes) – *Obscurity* (how unknown), *Narrative* (presence of compelling story/folklore – but never applied to sacred/religious sites), and *Rising* (momentum/attention).  
  - **Access status:** Detailed (Open, Seasonal, Permit, Restricted, Closed). Includes “access window” (hours, seasonal closures, permit requirements, restrictions on night travel).  
  - **Content fields:** Documented history vs. local lore separated; claim-level source citations; last-verified date; bilingual (Tamil/English) content. Data must come from real sources (human research) – *no AI-generated descriptions*.  
  - **Source grading:** A/B/C/D grade for information reliability.  
- **Initial data set:** Curate ~24 candidate destinations (the “seed corpus”) and verify them during a ~4-week sprint. Content is editorially curated (Airtable/Sheets) and then stored in the database.  
- **Exclusions:** No background geofencing or continuous location tracking (see [8]), no sponsored placements or hotel inventory, no unfounded “social popularity” metrics.  
- **Travel distances:** Introduce “base town” concept for each place (nearest town or start of journey) and separate **town→access-point** vs **access-point→site** distances and travel times (with road surface/conditions). Precompute a place-town matrix for fast queries. Add UI to select base town on the map.  

These decisions **sharpen the vision**: Wild Atlas becomes a *deeply researched travel companion*, not just another map or recommender. It is oriented around factual, contextual information and field usability.

# 2. How clarifications refine the product concept

Compared to the earlier “mystery/trending discovery” pitch, these clarifications pivot the product:

- **From broad to local:** The focus narrows to the Coimbatore region at first, making the problem tractable and enabling rich local knowledge. (This avoids the overreach of covering all of India at launch.)  
- **From algorithmic trends to evidence-based signals:** The original emphasis on “trending mysterious places” has shifted. Now, “Rising” attention can still be a signal, but it’s *one of several factors* and must be supported by evidence (mentions in media, videos, etc.). The core promise is *sourced content*, not simply high social media counts.  
- **From generic discovery to “destination dossiers”:** Competitors like Google Maps or Tripadvisor list places but don’t provide comprehensive stories or access details. Wild Atlas will offer full profiles (history vs. lore, access conditions, etc.) for each place, which is unique.  
- **From passive browsing to active guidance:** By including base-town distances, access windows and safety, the product becomes a practical guide for travellers. It “knows” if a place is unreachable (e.g. seasonal closure) and can tell users “it’s not safe/accessible”. This is beyond what traditional discovery apps do.  
- **From web app only to phased implementation:** The no-background-geofencing rule means immediate notifications while the app is closed is out of scope. Instead, the product will focus on *real-time discovery when in use* and possibly later introduce notifications via saved preferences or a native app.  

**Competitor fit:** No existing product exactly matches this approach. For instance, Atlas Obscura provides unusual destination stories but not real-time map-based guides. Zafari (India) highlights “hidden gems” but (to our knowledge) does not offer source-verified dossiers with access rules and travel details. Google Maps and TripAdvisor cover common attractions and user reviews, not unexplored local mysteries. By blending an offline-friendly map (via MapLibre/PMTiles) with curated research and local context, Wild Atlas differentiates itself.

# 3. Conflicts, gaps, and assumptions

## Conflicts with earlier ideas

- **Trending focus:** Earlier we planned to find “destinations gaining attention.” The new docs downplay that, warning against “algorithmic popularity.” We should reinterpret “Trending/Rising” carefully – as a minor signal (merely indicating increased mentions) rather than a core feature. The product’s main driver is content quality, not virality.  
- **PWA vs. native:** We had considered heavy reliance on background GPS (like GoodBarber/Pointr). The new plan explicitly forbids expecting geofencing on the PWA (supported by [8]). So we must not promise “notifications when you pass by,” at least not until a native app phase.  
- **AI content:** The clarifications forbid AI-generated descriptions. This means even if we use LLMs internally (for summarizing sources), the output must be checked. For now, plan to write or carefully curate all text.  
- **Stack choice:** The previous solution used React + Spring Boot. The new doc mandates Next.js/TypeScript (monolithic). This is a significant change. If we have code already, switching may be costly. **Clarify whether this is mandatory** or a strong recommendation. Possibly treat it as “preferred but not mandatory” since the user says “solo TS full stack.” If we stick to React + Node, that might be acceptable too, though using Next.js aligns with the plan.

## Missing elements / questions

- **Emerging, unknown destinations:** The user asked about “trending mysterious place not known by anybody.” The clarifications hint at “Obscurity” and “Rising” signals, but it’s not explicit how truly new places (with almost no online footprint) get discovered. We may need to ensure our data gathering includes *user suggestions* or ground research. For example, local guides or social media posts could be manually collected. This remains a potential gap: **How does Wild Atlas find places before they are known?** Maybe through local blog RSS or asking users to “nominate a hidden spot.”  
- **User contributions:** The clarifications focus on editorial pipeline, but do not describe if or how users can suggest edits or new places. Likely at MVP this is manual. But it should be considered: maybe allow a “Report / Suggest a Place” form, storing suggestions in Airtable for review.  
- **Local language:** Tamil content is mandatory. Are we prepared for bilingual editorial? We may need translators or Tamil-fluent collaborators. This is a significant commitment.  
- **Mapping sources:** The clarifications assume MapLibre/PMTiles (likely OpenStreetMap-based). We must verify licensing (OSM data is open, but note for content: e.g. if we quote from some blog, respect copyright) and the availability of good map data in Tamil Nadu.  
- **Data sources:** The plan calls for human verification of 24 places. But **where do we get the source data?** We might use Firecrawl or public sources as before, but those restrictions still apply. Especially since “no AI copy.” We must ensure any site we scrape allows it, or rely on open data (Wikimedia, newspapers, etc.). This is an assumption to verify.  
- **Metrics / success criteria:** The skeleton mentions “phases and metrics.” We should define clear metrics (for example, number of destinations verified, users signed up, distance calculations done, app usage time, etc.). This will guide the agent and keep the project outcome-oriented.  
- **Safety/legal:** Stating a place is “Restricted” or “Closed” can have legal consequences. We should add disclaimers and ensure sources for any sensitive advice. Also, collecting user location data is sensitive, but plan says “stateless location,” presumably meaning we only use it to query and not store it (good for privacy).  

# 4. Prioritized roadmap

Below is a practical phased plan. Locked decisions (mandatory from clarifications) are marked; other items are recommendations or dependencies.

## Phase 1 (Weeks 0–4): Core data collection and minimal app
**Locked by spec:** Assemble the initial corpus (24 places) with full dossiers, establish database. Implement basic search and map UI.

- **Content sprint (4 weeks)** – Human-research 24 candidate destinations: gather names, coordinates, facets, history vs. lore, access status, town, etc. (Metric: 24 completed dossiers.)  
- **Database schema** – Define tables: Places (with fields above), Towns, Distances, Sources, etc. (Ensure PostGIS geometry columns for location and distance queries.)  
- **Editorial pipeline** – Set up Airtable or Sheets to store data; import into Postgres. (Metric: pipeline ingests data automatically.)  
- **Search UI** – Build map-first React/Next.js interface (PWA): search by place or keyword, category filters (“All, Mystery, Hidden Gems, Nature, History, Adventure”), and show results in list+map. (Metric: user can search “Ooty” and see 5–10 places.)  
- **Mapping** – Integrate MapLibre with our PMTiles. Show custom markers (colored by facet) at places. (Metric: 50% of places display on map correctly.)  
- **Distance calculation** – Implement base-town logic: allow user to choose base town (or use a default like Coimbatore). Precompute place→town road distances (could use OpenRouteService or OSRM). Display “km and minutes from [town] to [place]”. (Metric: distances loaded for all initial places.)  
- **Content display** – Clicking a destination shows key info (name, photo, categories, distance, short description). (Metric: profiles open with correct info from DB.)  
- **Offline/field readiness** – Ensure PWA can cache map tiles (via PMTiles) and content for offline use.

## Phase 2 (Weeks 5–8): Signals and trip planning
**Locked by spec:** Compute obscurity/narrative/rising, base-town distances from user's location if permission given.

- **Facets & Signals** – For each place, compute or manually tag “Obscurity” (based on # of sources or popularity), “Narrative” (boolean if story-rich), “Rising” (e.g. news mentions in last year). Display these in UI (e.g. badges: “Hidden Gem”, “Local Legend”, “Gaining Attention”). (Metric: each place has at least one signal assigned.)  
- **Detailed place page** – Build full detail page: split history (with citations) vs. folklore, show access info (hours, permit). (Metric: one sample destination fully documented on web view.)  
- **Nearby discovery** – Allow user to turn on location (on-demand). When given, refresh list ordered by distance and relevance. (Metric: mobile user sees at least 3 nearby places within 10 km.)  
- **Notifications (soft)** – Let user opt-in to reminders or Telegram/email alerts about saved places (manual trigger only). (Metric: send a test Telegram alert when user “checks in” or queries.)  
- **A/B Testing & Metrics** – Track basic events (searches performed, places viewed, saves). Confirm interest with a small user group or team. (Metric: >10 searches or views by testers.)

## Phase 3 (Weeks 9–12): Refinement and launch prep
- **Expand corpus** – Add more destinations beyond initial 24 (using same pipeline). (Target: 50–100 places by launch.)  
- **Localization** – Translate key content to Tamil. Ensure UI handles bi-directional text if needed. (Metric: All UI elements and at least 10 place descriptions in Tamil.)  
- **Access & safety checks** – Make sure “Closed/Restricted” places are clearly flagged. (Metric: all restricted places show a red warning icon.)  
- **Map & UI polish** – Improve design based on feedback (e.g. marker clustering, better legend, smoother bottom sheet on mobile). (Metric: UI flows tested on desktop and mobile.)  
- **Legal/travel disclaimers** – Add Terms of Use disclaimers about information accuracy and safety. (Metric: Terms page drafted.)  
- **Launch website** – Deploy on Vercel (frontend) + Neon (database). Ensure support site, contact, etc. Soft launch to limited users. (Metric: public site accessible, CDN live.)

## Longer-term features (post-MVP)
- **Native mobile app with background geofencing** (future phase, not in 12-week MVP).  
- **User contributions** – Allow users to suggest/edit destinations (via form or logged-in edits).  
- **Event integration** – Show local events or seasonal attractions if applicable.  
- **Trip planning** – Let users save multiple places into an itinerary (if scope expands).  

Throughout, measure usage: number of unique users, session length, saved places, etc., to gauge if the product is meeting traveler needs.

# 5. Recommended agent prompt

Below is a **master prompt** you can copy to instruct an AI assistant (coding or research) to implement the above:

```text
You are now Wild Atlas’s AI development assistant.  Use the clarified specifications to guide implementation.

**Locked requirements (must be followed exactly):**

- **Scope:** Cover only Coimbatore district and surrounding 60km radius for initial data.  
- **Tech stack:** Use Next.js + TypeScript (React) for front-end, PostgreSQL + PostGIS on Neon for the database, Drizzle ORM, and MapLibre GL with vector PMTiles for mapping.  
- **Data model:** Every destination has:
  - *Facets (categories)* and *Signals* (Obscurity, Narrative, Rising) that are independent attributes.
  - *Access status:* one of Open, Seasonal, Permit, Restricted, Closed.
  - *Access details:* including nearest base town, road distance/time to access point, last-mile distance/time to site, and any visiting restrictions (hours, closures, permits, night bans).
  - *Content fields:* name, location, categories, photograph, description of place, separated into *Verified history* vs *Local folklore* sections.
  - *Sources:* Each claim or fact must have a source citation and a quality grade (A/B/C/D). Include a “Last-verified” date for the data.
  - *Languages:* All text must be provided in English and Tamil.

- **Disallowed features:** Do NOT implement continuous background geolocation or true geofencing in the web app (browsers don’t allow it). Do NOT generate place descriptions via AI; all content must come from research/sources. Do NOT include any paid listings or hotel booking features.

- **User flow (locked):** The app is map-first. On search, request location permission *after* user inputs a query. Show matching places as markers on map and in a sidebar or bottom sheet. Let user filter by category or signal. Clicking a place shows its dossier. Let user select a base town or use current location to compute distances.

**What to build (recommendations):**

1. **Database and data pipeline:** Create tables for Places, Towns, Sources. Design one table for “Destinations” with columns for all attributes above. Set up PostGIS for location queries (e.g., ST_DWithin for radius searches). Use Airtable or Google Sheets as a staging area to enter the initial 24 places with all fields; write an ingestion script to load into Postgres.

2. **Map interface:** Integrate MapLibre GL JS. Load a PMTiles basemap (Protomaps) covering Tamil Nadu. Plot destination markers (custom icons by category) at their coordinates. On mobile, use a full-screen map with a draggable results sheet.

3. **Search and filters:** Implement a search box (e.g. “Ooty, Hidden Waterfalls”) that queries the Places table by name or keyword (also filter by selected categories/signals). After search, ask for location access to refine distances. Provide filter chips for *All, Mystery, Nature, History, Adventure, Hidden Gems* or similar facets.

4. **Distance calculation:** Pre-compute (or fetch from an API) road distance and drive time from base towns to each place. Also compute “last-mile” distance (e.g.  walking trail or offroad distance to the actual site). Store these in the DB. On the UI, allow user to pick a base town or use their location, and display e.g. “X km, Y minutes (roads) + Z km (trail)” for each place.

5. **Place dossier page:** When a place is selected, show:
   - Image, name, location, categories, and distance summary.
   - **Verified history:** A narrative description with sources (like an Atlas Obscura article).
   - **Local folklore:** A separate section clearly labeled as legend or rumor, also with sources.
   - **Why it’s notable:** Show any applicable signals (e.g. “Obscurity: Hidden gem with few visitors”, “Rising: featured in recent news”).
   - **Access info:** Show “Access: Open” or “Permit needed” etc, with details (hours, note about night travel, safety tips).
   - **Sources:** List references (books, articles, websites) that were used.

6. **Editorial data and sources:** Use the 4-week sprint to gather data. For each place, find at least 2-3 credible sources (e.g., local tourism sites, newspapers, academic works). Label each source A/B/C. Enter all data (English + Tamil text) in Airtable. Validate every fact before going live.

7. **Phased feature planning:** Deploy MVP with no background alerts. You may later add:
   - Telegram/email alerts for saved places (triggered manually).
   - Native Android app with geofencing (only after web MVP is stable).

**Open questions (for product/team to decide):**

- Which 24 initial places to prioritize (e.g. combining historical forts, waterfalls, unusual cultural sites)? 
- How to gather Tamil text: will we translate from English sources or find Tamil-language references?
- Do we allow user suggestions of new places (maybe via an online form to the editorial sheet)?
- What metrics to track first (e.g. search count, place views, saves)?

Finally, make sure the interface is mobile-first and the codebase is documented for a single developer (structure code in modules, comment key logic). Good error handling and accessibility (e.g. keyboard focus, alt text) are important. Use stable external APIs (e.g. OpenRouteService for distances or an open dataset), and ensure all map data (OSM) is properly cited/licensed.    

Begin by setting up the database schema and sample data, then build the Next.js frontend with the core search/map workflow.

```