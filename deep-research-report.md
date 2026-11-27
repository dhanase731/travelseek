# Wild Atlas — Product Strategy & Technical Blueprint

**Executive Summary:** Wild Atlas is a travel-discovery platform designed to help users **find extraordinary, lesser-known places** (“mysteries, hidden gems, unusual historic sites”) around a given location. It combines *map-first exploration*, *category filters* (Mystery, Nature, History, etc.), *trend analysis*, and *active proximity alerts* to surface places that conventional travel apps often miss. This report presents the full product vision, user journey, competitive landscape, data/API strategy, technical architecture, roadmap, and risks. It is intended as a master specification for development and an AI agent handoff.

- **Product Vision:** “Discover extraordinary places around you, and get notified when you are close to one.”  
- **Key Differentiators:** Mystery/folklore classification, hidden-gem curation, trend intelligence (rising popularity), real-time location-based suggestions, evidence-backed destination info.

All factual statements (competitors, APIs, behaviors) are supported by current references.

---

## 1. Product Positioning & Differentiators

- **Mission:** Help travelers and curious locals *serendipitously* discover unique destinations (mysterious sites, abandoned places, hidden waterfalls, etc.) around a chosen area. Wild Atlas emphasizes *exploration* and *story* rather than ordinary trip planning.

- **Primary Audience:** Young explorers, adventure travelers, curious locals (teenagers to adults). They value offbeat experiences and engaging narratives.

- **Product Experience:** A map-centric app with a prominent search bar. Users can search for any place or interest (e.g. “Ooty”, “haunted temples”, “hidden waterfalls”), grant location access if needed, and immediately see nearby results on an interactive map plus a scrollable list. Category filters (All, Trending, Mystery, Nature, etc.) let users refine results. Selecting a place reveals a detailed profile with history, legends, images, directions, and user actions (save, share). A proactive alerts feature notifies users (via push, Telegram, or email) when they enter a geofenced area near an interesting place. 

- **Core Values:** Discovery over data; context-rich content; user-centric (simple UI, no clutter); privacy-preserving (location only with consent, no tracking beyond session). 

- **Unique Selling Points:**  
  - **Mystery Engine:** Classifies and highlights destinations with “unusual histories, local legends or abandoned sites”.  
  - **Trend Intelligence:** Measures which places’ attention is rising over time (separate from raw popularity).  
  - **Location-Aware Discovery:** Finds nearby gems using actual road distance and map context, refreshing in real-time as the user moves (when app is active).  
  - **Proximity Alerts:** Optional geofenced notifications for relevant places when in range.  
  - **Verified Content:** Each place includes sources, historical facts vs folklore, and relevant media.

This contrasts with existing apps that are either general-purpose (Google Maps, TripAdvisor), itinerary-focused (Wanderlog, TripIt), or only user-curated without dynamic trends (Atlas Obscura, PinIt). Wild Atlas combines all these in a travel-focused way.

---

## 2. Competitive Landscape

Wild Atlas sits at the intersection of **hidden-gems discovery**, **travel search**, and **location-based alerts**. Key competitors and their features/limitations include:

- **Atlas Obscura** – A global database of “unusual and hidden wonders”. Strengths: rich storytelling, large user-submitted collection (30k+ places). Weaknesses: Broad/global focus, not specifically local-recommendation; no real-time location alerts; community-driven content varies in coverage. (Atlas Obscura’s map lets users find oddities near them, but it lacks trend analytics and push notifications.)

- **PinIt (pinitmap.net)** – Crowdsourced “hidden gems” map for explorers. Strengths: free, user-generated pins with precise coordinates, photos and tips; editorial categories (waterfalls, peaks, etc.). Weaknesses: No trend or context data; largely a static directory; no active location suggestions or alerts; focuses on points only, not integrated stories.

- **Zafari (India-specific)** – Indian travel app: “Hidden Gems, Trip Planner, SOS”. Strengths: GPS-driven “Nearby Discovery” shows hidden temples, waterfalls, etc., sorted by real road distance; includes travel tools (train tracker, SOS). Weaknesses: Limited to India; “mystery” is not emphasized (mostly popular temples, waterfalls); trending awareness unclear; free 10km vs paid radius. Notably, Zafari offers “hidden place alerts” as a premium feature, but it’s primarily for local gems, not category/fact-based discovery.

- **Tripflip** – Swipe-to-discover app built on TripAdvisor data. Strengths: Focus on “great places nearby” (food, drink, sights); local favorites mixed with trending spots; simple UI (swipe cards with ratings, distance, hours). Weaknesses: Geared toward known local spots (restaurants, sights) rather than mysterious or unusual places; only covers cities where active; no unique categorization (mystery, folklore); does not proactively use user location beyond session.

- **VibeAtlas** – (In Beta) Aggregates geo-tagged social media (TikTok/Instagram) to map trending places. Strengths: Uses real engagement (likes, comments) to identify popular spots; time-based “VibeScore” of places; neighborhood-level trends. Weaknesses: Focus is general popularity, not hidden gems; limited to areas with active social media users; early-stage/limited access; no story/categorization for mystery/hidden places.

- **Google Maps** – Ubiquitous map and search. Strengths: Comprehensive POI database, directions, "Explore" features. Google recently added an “Explore along your route” feature for road trips. Weaknesses: Primarily mainstream (restaurants, attractions); hidden/folklore content minimal; no dedicated mystery/trending engine; alerts only for general location-based reminders (not specialized discovery).

- **TripAdvisor** – Travel reviews and recommendations. Strengths: Large content (8M listings); annual “Travelers’ Choice” trending lists. Weaknesses: User reviews may miss niche spots; trending lists are high-level (country/city, not instant location-based); no real-time alerts; no mystery-specific focus.

- **AllTrails / AllTrails Guides** – Hike/trail discovery. Strengths: Detailed trail maps and user reviews for outdoor enthusiasts. Weaknesses: Focus is hiking paths, not general points of interest; content mainly well-known trails; UI clutter and premium paywall issues reported; not relevant for haunted sites or historical mysteries.

- **Wanderlog / Wanderlog** – Trip planning and itinerary sharing (from conversation context). Strengths: Comprehensive itinerary builder. Weaknesses: Not discovery-focused; uses standard POI data; no trend or mystery features.

- **Specialized geofencing platforms (GoodBarber, Pointr, etc.)** – GoodBarber offers native app geofencing (not PWA) for automated notifications; Pointr focuses on indoor nav and asset tracking. These are technology enablers, not consumer products. They demonstrate that *native geofencing* is possible, but also highlight complexity and policy compliance (background location permissions).

**Competitor Gaps / Opportunities:** Wild Atlas’s advantage lies in combining multiple elements: *unusual place categorization*, *location search + map integration*, *trend scoring*, and *active notifications*. No single competitor does all:

- Atlas Obscura and PinIt miss real-time location updates and alerts.  
- Tripflip/VibeAtlas focus on trending/favorites but ignore mysteries and context.  
- Google/TripAdvisor lack niche discovery and push alerts.  
- Zafari provides location proximity but is India-only and not mystery-centered.

Wild Atlas can position itself as **the first “mystery travel discovery” app with live location alerts**, leveraging best practices from each competitor category.

**References:**  
Atlas Obscura – “catalog of the world’s most unusual and hidden wonders”.  
Tripadvisor Travelers’ Choice (trending) – curated lists of up-and-coming destinations.  
Tripflip – user interface for “great places nearby” (local favourites, trending, quiet gems).  
PinIt – crowdsourced hidden-gems map, free, no tourist-trap suggestions.  
Zafari – Indian travel app finding “hidden temples, waterfalls... by real road distance”.  
VibeAtlas – trending map from geo-tagged videos, uses engagement scores (VibeScore).  

---

## 3. Real-Time Location and Proximity Awareness

A core Wild Atlas feature is *location-based suggestions*. It has two modes:

1. **Active (Foreground) Location:** When the user is actively using the app (map-screen open), Wild Atlas uses the device’s Geolocation API to update the user’s position. The browser’s `watchPosition()` can be used to get continual updates. These updates occur only while the app has focus and location permission. (Note: The Web Geolocation API requires HTTPS and explicit user consent.) Each time the user moves significantly (e.g. a few hundred meters), the app recalculates which POIs are within the chosen radius and updates the map and list. This is similar to how native location-tracking apps work when active.

2. **Background/Standby Location:** Wild Atlas will *not* continuously track in the background (the user’s browser tab or PWA can’t run arbitrary location in the background after closing). Instead, for proximity alerts, the app will rely on either:
   - **User-saved locations:** The user can manually save favorites or mark places. When they do, we can store these places as “watch-list” in the backend. A scheduled service can check (e.g. every few minutes) if the user’s recent location (if they’ve reopened the app) comes within alert distance of any saved place, then trigger a notification.
   - **Native geofencing (future):** If the team later builds native apps, use OS geofencing APIs: both Android and iOS support geofence entry/exit events, but these require explicit background-location permission. Android limits background location updates to *“only a few times each hour”* unless a foreground service with user-visible notification is running. iOS similarly requires an “Always” location permission and justification. We must carefully follow platform policies: for example, GoodBarber documentation warns that background location must truly serve the app’s core purpose, or the store will reject it. In the web/PWA context, we can’t rely on true background GPS; at best, we send *web push* notifications when users return or on a schedule (not real-time location triggers).

**Technical Implications:**  
- We will implement location updates in the frontend (React) using `navigator.geolocation.watchPosition()`. This works on HTTPS and will trigger a permission prompt.  
- On Android (native app or possibly a PWA with web push): even with permission, background updates are sparse unless we use a foreground service.  
- On iOS: geofencing can work (with Always permission), but Apple requires at least one geofence in use before app submission.  
- Therefore, **MVP approach:** only use location while app is open. Optional feature: allow the user to opt-in to receive proximity alerts by email/Telegram (with location stored and backend checks). Full native push notifications can be a later phase.

**Real-Time Discovery:** As the user moves within the radius (e.g. 25km) of the searched location or current location, Wild Atlas will update results. Each new position triggers a query:
```http
GET /api/places/search?lat={userLat}&lon={userLon}&radius={radius}&category={filter}&sort={sortOrder}
```
Where `sortOrder` can be distance (for close-by) or trendScore (if Trending filter). This ensures **real-time, location-aware discovery**.  

**Limitation Note:** Browsers cannot track location when fully closed. We will clearly communicate to users that alerts are only sent when the app is active or if they’ve opted into notifications.

---

## 4. Data Sources and APIs

Wild Atlas needs places data (names, locations, descriptions, categories) and signals (trends, social mentions). Key sources and their constraints:

- **Google Places API (Maps Platform):** Comprehensive global POIs and metadata. *Pros:* Vast coverage, detailed place info and photos. *Cons:* Pay-as-you-go pricing (free $200 monthly credit), usage limits, cannot freely cache or show on non-Google maps. The Places API supports search by keyword and location, and detailed info calls (including Open Hours, reviews, website link). Each request is billable beyond free tier.

- **OpenTripMap API (Open Data):** A worldwide POI database built from open sources (OpenStreetMap, Wikidata, Wikipedia, etc.). It covers over 10 million attractions. *Pros:* Open Database License (ODbL), no display/caching restrictions. Flexible queries (by category, coordinates, radius). *Cons:* Data may be sparser or outdated compared to Google; requires attribution (ODbL). For MVP, we can use OpenTripMap to seed places and supplement Google. Its free tier limits calls per day, but acceptable for initial usage.  

- **OpenStreetMap (OSM) / Overpass API:** Free global map data. We can query OSM for features (tourism=waterfall, temple, etc.) via Overpass. *Pros:* Free, open, good for basic categories. *Cons:* Licensing (ODbL) requires share-alike; Overpass rate-limits (10k queries/day by default, see OpenStreetMap wiki). We should run periodic dumps or use alternative OSM providers for heavy use.

- **Social Media APIs:** For trend signals, we consider:
  - **Instagram Graph API:** Business/Creator accounts can fetch public media by hashtag. *Limitations:* Strict rate limits (only 30 unique hashtag queries per week). Requires App Review and “Instagram Public Content” permission. In practice, this is cumbersome; likely too limited for broad trending analysis.
  - **TikTok Research API:** Only available to vetted academic/non-profit researchers. Not accessible commercially. Hence we cannot rely on direct TikTok data.
  - **YouTube Data API:** Videos can be searched by location, keywords. Usage limits apply (quota costs, daily limits). Might yield geo-tags for local attractions. 
  - **Twitter API / Reddit API:** Could use free tweets and discussions for event/trend signals. 
  - **Wikipedia/Wikidata:** Many notable places have pages/structured data (e.g. geo-coordinates, categories, descriptions). We should use these as authoritative content for destination intelligence (history, facts). 

- **Other Travel APIs:**  
  - **TripAdvisor / Yelp:** Not open APIs; TripAdvisor content is scraped on Tripflip but not directly available.  
  - **Foursquare/Places:** Foursquare has a developer API (explore endpoints) but limited free tier; could use as supplement.  
  - **Airbnb Experiences, local blogs:** Potential qualitative input, but out of scope for MVP.

- **Notifications:**  
  - Use **Telegram Bot API** (free) to send messages to user’s Telegram account.  
  - **SMTP/Email** for email alerts (using a service like SendGrid or an SMTP server).  
  - In future, **Firebase Cloud Messaging** for web/mobile push or a native push via APNs/FCM.  

**API Strategy:** For MVP, combine Google Places (for core POI data) and OpenTripMap/OSM (for free coverage of hidden places). Keep design modular so data sources can be swapped. Always store attributes in our own database (caching results).

**Citations:** OpenTripMap documentation notes its open license and no usage restrictions, unlike Google Places. Instagram’s API docs highlight the 30-hashtag/week limit. Android docs note $200 free credit for Google Maps Platform (ending 2025).

---

## 5. Trend Intelligence

Wild Atlas differentiates “trend” from “popularity”. **Trend** means a place’s attention is **increasing**, not merely high. We propose a multi-factor trend scoring model:

- **Data Signals:**  
  - *Time-series volume:* Count mentions (social posts, news articles, search queries) of the place (by name or coordinate) over time. A rising slope indicates trending.  
  - *Engagement metrics:* For social media (if accessible), weight posts by likes/comments/shares. High recent engagement boosts trend score. (VibeAtlas uses “engagement-weighted popularity”.)  
  - *Event signals:* Sudden news (e.g. travel news, festivals, discovery of a phenomenon) in local media feeds (RSS/news APIs).  
  - *User interaction:* Increased app interactions (e.g. more saves or searches for that destination).  

- **Normalization & Time Windows:**  
  - Use an exponential moving average or linear regression on the signals (e.g. 7-day vs 30-day averages).  
  - Require a minimum baseline (e.g. at least 5 posts or reviews total) to avoid spikes from noise.  
  - Score = weighted sum (e.g. 50% recent change, 30% engagement, 20% growth rate). *Example:* `trendScore = 0.5*(Δmentions) + 0.3*(avgEngagement) + 0.2*(growthRate)`. (Exact weights are hypothesis; tune with real data.)

- **Thresholds:**  
  - Mark a place as *“Trending”* if `trendScore` exceeds a threshold.  
  - Avoid labeling if evidence is insufficient (low volume).  
  - Continuously decay scores (older signals fade).

- **Mystery Score:** A separate metric evaluating “weirdness” or “legend”. Could combine:  
  - Presence in mystery-related categories or tags.  
  - Frequency of terms like “haunted,” “legend,” “mystery” in descriptions or local lore.  
  - Lower transparency (e.g. abandoned places may have fewer official reviews).  
  - Note: Mystery labeling should not imply unverified claims; it simply flags unusual story potential.

- **Implementation:**  
  - Use a backend process (Cron job or scheduled tasks) to fetch and update trends daily.  
  - Avoid LLMs inventing metrics; use deterministic calculations.  
  - Compare to baselines (e.g. local average).  
  - Keep an audit trail: store which data contributed to score (e.g. list of social posts, article references).

**Caveats:**  
Trend signals will be noisy. Bias: densely populated cities yield more posts. We mitigate by per-capita or relative changes. Clearly present that “trending” is a hint, not an absolute fact. Users can always filter to “All” or other categories.

**References:** VibeAtlas’s description highlights using “real engagement data from social media, tracked over time” to find popular places. Tripadvisor’s “Travelers’ Choice” (Trending Destinations) is based on volume of high reviews in the past year; we use similar historical signals but on shorter time scales.

---

## 6. Destination Data & Trust

Each place record must have reliable data and credible context:

- **Data Model (Place entity):**  
  ```json
  {
    "id": 123,
    "name": "Pine Forest, Ooty",
    "latitude": 11.42,
    "longitude": 76.70,
    "categories": ["NATURE","HIDDEN_GEM"],
    "mysteryScore": 35,
    "trendScore": 72,
    "trendStatus": "RISING",
    "description": "A scenic forest destination with tall pine trees and a tranquil ambiance.",
    "imageUrl": "https://.../pine_forest.jpg",
    "sources": [
        {"type":"wikipedia", "id":"Pine_Forest_Ooty", "url":"...", "description":"Official Wikipedia page"},
        {"type":"local_story", "id":"1234", "url":"...", "description":"Local folklore about hidden cave"}
    ]
  }
  ```
  Include: name, coordinates (latitude, longitude, using PostGIS geography), one or more categories (see next section), optional `mysteryScore/trendScore`, short description (max ~200 chars), an image URL, and a list of source references.

- **Coordinates and Precision:** Use a proper geolocation (PostGIS Geography, SRID 4326). Include a `coordinateAccuracy` flag (if uncertain) or `sourceConfidence`. If a place is user-added, mark as such. We will never “fabricate” coordinates; any new coordinates must come from open data or user input. 

- **Descriptions & Legends:** Clearly separate factual history from folklore. E.g.:  
  - *“Historical”:* Verified facts (construction date, official records).  
  - *“Folklore”:* Local legend or ghost story (with a note “local legend”).  
  Always cite sources (Wikipedia, heritage sites, news articles). If no source, label story as unverified.  

- **Reviews & Safety:** Don’t aggregate unmoderated user comments. We may optionally pull aggregated ratings from Google/TripAdvisor APIs (with permission), but emphasize that ratings don’t necessarily reflect “mysteriousness”. Provide practical info (access difficulty, hours, safety tips) if available from sources, but always link to official site or park service if possible.

- **User Actions:** Allow users to “save” places and add their own notes (for later possible community features). Saved places form the basis for notification geofences (see below).

- **Data Updates:** Implement an admin or data pipeline for continuous improvement. For example, pulling periodic updates from OpenTripMap/OSM/Wikipedia. Provide a way for users to report bad data (to be moderated).

**Data Privacy:** We will not collect user personal data or track them beyond app usage. Location is only used with consent. No external API should receive user info beyond what is needed for that request.

---

## 7. Functional Requirements

### User Stories & Journeys

1. **Discovery by Search:**  
   - **Persona:** Tourist or local, standing in Ooty. Wants to find something unusual nearby.  
   - **Flow:** Opens Wild Atlas. Sees a search bar. Types “mysterious places near Ooty”. The app suggests “Ooty, Tamil Nadu”. User selects it. (If user allowed location, radius defaults to X km; else prompt to allow or manually set radius). App shows map centered on Ooty, with category filters (“All, Trending, Mystery, Nature, History, Adventure”). By default “All” is selected. Sidebar/list shows places like Pine Forest, Pykara Falls, etc., with thumbnails. Map markers appear.  
   - **Acceptance:** The results should be relevant to Ooty (not Bali or unrelated). The user can click filters, and the list+map update accordingly.  

2. **Category Filtering:**  
   - **Persona:** Explorer looking specifically for a haunted site.  
   - **Flow:** After initial search, the user taps “Mystery”. Only mysterious/haunted places remain (according to the backend’s classification).  
   - **Acceptance:** Category chips allow quick toggling. “All” resets filters.  

3. **Selecting a Place:**  
   - **Persona:** Traveler finds “Stone House (Ooty)” interesting.  
   - **Flow:** User clicks on the card or map marker for Stone House. The map highlights it and pans to it. A detailed info popup or side panel opens, showing: large photo, name, location, categories, “Haunted Legend (Mystery)”, brief description, tabs or sections: Verified History, Local Folklore, Directions. Option to “Save” (bookmark).  
   - **Acceptance:** UI shows data clearly, with category badges (“HIDDEN GEM”, “HISTORICAL”, etc.), and sections with source attribution (e.g. “As reported by [The Hindu, 1975]”).

4. **Nearby Mode:**  
   - **Persona:** Hiker traveling, curious if anything interesting is *immediately* nearby.  
   - **Flow:** From home screen or via a “Nearby” button, user grants precise location. App shows current location pin, and automatically lists places sorted by distance within default radius (say 10 km).  
   - **Acceptance:** List and map update as user moves (if they swipe after walking). Shows distance (e.g. “3.2 km”). On mobile, this could be a bottom sheet with infinite scroll.

5. **Proximity Alerts (Optional):**  
   - **Persona:** Privacy-conscious user who occasionally wants alerts.  
   - **Flow:** User navigates to settings and opts in to alerts, selecting categories and radius (e.g. 5km, Mystery and Hidden Gems). Also provides email or Telegram handle. Later, when they physically come within 5km of a place marked Mystery, they receive a notification:  
     > **Wild Atlas:** “An unusual place is nearby! The Stone House (Ooty) is 4.7 km away. Explore its local legend and history.”  
   - **Acceptance:** Notifications contain the name, distance, category, and link/deep link to app (or website) with the destination open. Alerts respect user’s “quiet hours” preferences. (No alert spam; e.g., if one place already alerted within 24h, skip.)

### Features & Requirements

- **Search:** Accept queries like location names, interests (mystery, haunted), or free text. Should auto-complete with places (via Google or OpenTripMap Geocoding).  
  - *Acceptance:* Hitting search without input shows “Discoveries near current location”. Invalid entry shows an error message.

- **Map & Sidebar:** Desktop shows a left sidebar (250px) with results, right map. Mobile collapses to bottom sheet.  
  - *Acceptance:* Map zoom/center adjusts to encompass results; markers and cards scroll independently but highlight on interaction.

- **Filters:** Must include: All, Trending, Mystery, Hidden Gems, Nature, History, Adventure. Additional filters can be added if needed.  
  - *Acceptance:* Only one category active at a time; multiple selection not required initially (could be future). Chips are horizontally scrollable if overflow.

- **Cards:** Each result card shows a photo, place name, short description, distance (if known), category badges, and optionally “Trending” or “Local Legend” badge (if applicable). A bookmark icon toggles saved state.  
  - *Acceptance:* Cards are clickable, responsive, and show consistent info. “Trending” badge appears only if trending score above threshold.

- **Destination Details:**  
  - **Header:** Name, location, category badges.  
  - **Image carousel** (if multiple images).  
  - **Tabs/Sections:** Summary (short lead), Verified Facts, Local Legends, Why Trending, Visit Info (hours, entrance). Each section cites sources with links (example sources: Wikipedia, news articles, official heritage docs).  
  - *Acceptance:* Users can scroll this view. It must be clear what is fact vs legend (use subtitles). “Save Place” button available.

- **Save Places:** (Future feature) Logged-in users can save favorites. Saved places appear under “My Atlas” (not part of discovery UI). This enables alerts and itinerary planning.

- **Onboarding & Privacy:** The app should prompt for location permissions at first use of discovery or Nearby. It should explain why (to find local places). If denied, fallback to only manual location input. We must respect “Precise vs Approximate” location options on iOS.

- **Error/Empty States:** If no results (e.g. no mysterious places found), show a friendly message: “No extraordinary places found in this area yet. Try expanding your radius or check Nearby.” If location blocked, show instruction to enable or search manually.

- **Marketing Landing Page:** A separate responsive site (12-section editorial) as per prior design (hero, interactive map preview, problem/solution, etc.). This is not the app itself but the promotional site to attract users.

---

## 8. Technical Architecture

### Overview

- **Frontend:** 
  - *Tech:* React (via Vite or Next.js), Tailwind CSS (or shadcn/ui), Framer Motion for animation, React Router (or Next.js pages).  
  - *Responsive:* Desktop (2-column), Tablet, Mobile (collapsible bottom sheets).  
  - *Map:* Leaflet with OpenStreetMap tiles (or Mapbox if needed; Leaflet avoids heavy Google JS). Use custom marker styling (forest-green pins) and overlay radius circles.

- **Backend:** 
  - *Language:* Java Spring Boot (monolithic service) with Spring Security (JWT for user auth) and Spring Data JPA.  
  - *Database:* PostgreSQL with PostGIS extension. Key tables: `Place`, `User`, `SavedPlace`, `TrendSignal`, etc. `Place.location` uses `geography(Point,4326)`. Index on location for fast radius queries.  
  - *Services:* 
    - **Search Service:** Handles `/places/search` queries with filtering, ranking (distance or trend). Uses SQL with PostGIS: e.g. `WHERE ST_DWithin(location, ST_MakePoint(lon,lat), radius)` and orders by ST_Distance if sorting by distance.  
    - **Place Details Service:** `/places/{id}` returns full info.  
    - **Trend Computation Job:** Scheduled job (could use Spring’s `@Scheduled`) that updates `trendScore` for places daily based on aggregator data (see Trend Intelligence).  
    - **Notification Worker:** Periodically checks user-saved locations or enables push sending for geofences.  
    - **APIs:** Expose REST endpoints (or GraphQL) for all needed actions (search, get details, user login/save). Include endpoints for sign-in (OAuth or email) and for opting into notifications.

- **Data Ingestion & Maintenance:**  
  - *Batch Import:* Scripts to ingest data from OpenTripMap/OSM/Wikipedia. Could use Python/Java ETL or scheduled tasks. For example, an initial seed of 50-100 places in Ooty with curated data. Use the OpenTripMap Places API (e.g. `radius` query) and Wikipedia queries.  
  - *Caching:* Respect API usage limits. For heavy use (e.g. OpenTripMap), use their allowances or self-host Overpass if needed.  
  - *Image Storage:* Either store URLs or fetch selected images to a CDN. Comply with usage rights. Possibly use unsplash etc for placeholders.

- **Security & Privacy:**  
  - All API endpoints require HTTPS.  
  - JWT for user sessions.  
  - User location data (on device) is not stored unless the user explicitly saves a place or opts into alerts.  
  - GDPR/COPPA: under 13? If teenagers are target, ensure parental consent or age gating if required.

- **Infrastructure:**  
  - Likely a cloud deployment (AWS/GCP).  
  - Spring Boot can run as a container or VM.  
  - Postgres cluster with PostGIS (AWS RDS or similar).  
  - If using Overpass, consider self-host (private.coffee or overpass.ch) to avoid public rate limits.  
  - Redis can be used for caching geocode results or session data if needed.  
  - Logging/Monitoring: Use standard (ELK stack or cloud logs, error alerts).

**Components Diagram (simplified):**  
```
[Browser/SPA] <--HTTPS--> [API Gateway / Spring Boot App]  
                                  |         |        \  
                    [Place Search API] [Trend API] [User API]  
                                  |  
                           [PostgreSQL + PostGIS]  
                                  |  
                          [Data Ingest Scripts]  
```

### Geospatial Queries

- Use `ST_DWithin(geog, userGeog, radiusMeters)` for radius filtering. Index column on geography type with GiST.  
- Use `ST_Distance(geog, userGeog)` for sorting by distance (or better, combine ST_DWithin to filter then distance on result).  
- Store coordinates as (lon,lat) in WGS84. Note PostGIS expects (lon, lat) in input.

---

## 9. Notifications & Proximity Alerts

- **Opt-In Mechanism:** Users must explicitly enable alerts and choose channels. Provide a settings page to configure: categories of interest, radius (1km-50km), quiet hours (e.g. 10pm–7am), and contact (Telegram username, email).  
- **Backend Flow:** When a user opts-in and saves preferences, their “watchlist” is either specific places or general criteria. We use a scheduled job (every few minutes) to:
  1. Check if any user’s current or last-known location (from active session) falls within radius of an interesting place (matching their filters).  
  2. Ensure we haven’t recently alerted about that place for that user (cooldown period, e.g. 24h).  
  3. If conditions met, send a notification (deep-linked to place in the app).  

- **Channel Implementation:**  
  - **Telegram Bot:** The user adds our bot; we store their chat ID. Backend uses Bot API to send messages. (Easy to implement, no sign-up needed beyond link.)  
  - **Email:** Use a transactional email API (SendGrid, SES). The notification email contains brief info and a link to app.  
  - (**Future Native Push:** For iOS/Android, integrate Firebase Messaging or APNs for rich notifications, after launching native apps.)

- **Geofence vs Polling:** Initially, we likely use polling (as above). True geofencing (trigger OS to launch app on region entry) can come later with native apps.

---

## 10. Implementation Roadmap

We recommend a **phased approach**:

**Phase 1 (MVP – 10–15 days, realistic)**: 
- Core map search UI: location search, map + sidebar, category filters, destination cards. 
- **Data:** Seed ~30-50 curated places in one region (e.g. Ooty/Nilgiris and surroundings) covering all categories. Hardcode or insert into DB. Each with name, coords, image, short description. No backend crawling yet.  
- **Category tags:** Mystery, History, Nature, HiddenGem manually assigned for seeds. No complex backend category detection.  
- **Search:** Basic place search using hardcoded DB or simple geocoder (e.g. Place Autocomplete or manual input). 
- **Map interactions:** Clicking card opens details with multi-section content (placeholder text from open sources).  
- **User auth:** Not required initially (guest mode).
- **Proximity:** Show distance on cards (approx by haversine). No alerts yet. 
- **Landing page:** Build marketing page (HTML/CSS per design spec) with placeholder map preview images (no backend yet). 

**Phase 2 (weeks 3–6):**  
- **Data Expansion:** Integrate OpenTripMap / OSM API to fetch more places by category around Ooty. Write backend ingestion script.  
- **Backend:** Implement REST API endpoints, PostGIS queries for search & filters. Connect front-end to API.  
- **Trending:** Develop simple trend calculation using, e.g., Google Trends or hard-coded sample (for seed places). Show “Trending” badge if flagged.  
- **Category management:** Allow multi-category per place. Implement Mystery tag logic (maybe manual for MVP).  
- **Alerts (beta):** Allow email sign-up for one-time proximity check (e.g. “notify me about nearby mystery places”).  
- **Responsive UI polish:** Ensure mobile view with bottom sheet (React component).  
- **Sign-in (optional):** Basic login (email/password or social).

**Phase 3 (months 2–4):**  
- **Location permission:** Request location at search/nearby. Enable dynamic refresh of list as user moves.  
- **Expanded content:** Pull actual images (Unsplash API or Wikimedia Commons), moderate.  
- **Trend model:** Build out actual trend engine (social signals, search volume via Google Trends API). Score places and refine trending badge logic.  
- **Proximity alerts:** Implement Telegram bot notifications. Add cooldown, user preferences, category filtering.  
- **Full India coverage:** Gradually expand place database to more cities/states using automated scripts (e.g. north-south expansion).  
- **Saved Places / Account:** Save places, persistent preferences.  
- **Performance and caching:** Introduce Redis or in-memory caching for frequent queries (e.g. map tiles, repeated place data).  
- **Testing & QA:** Unit tests for queries, UI snapshots, analytics integration.

**Phase 4 (beyond 6 months):**  
- **Native App (iOS/Android):** If traction, develop native clients for better background location alerts (with geofencing APIs) and app store presence.  
- **Community features:** Allow user contributions of places and stories (with moderation).  
- **Monetization:** Consider premium (ad-free, extra filters) or partnerships (travel guides).  
- **Performance scaling:** Microservices if traffic grows, or heavier caching layers.

Each phase has milestones (functional screens, number of places indexed, user feedback sessions).

---

## 11. Risks and Mitigations

- **Data Licensing:** Using Google/TripAdvisor data improperly can violate TOS. Mitigation: Rely on open data (OpenTripMap, OSM) and user submissions; if using Google Places, comply fully (no storing outside allowed usage).  
- **Privacy & Permissions:** Accidental overuse of location (background tracking) can violate privacy. Mitigation: Ask permission only when needed, offer approximate location, and make alerts opt-in. Never run hidden background geolocation in PWA. For native, follow Apple/Google guidelines.  
- **Accuracy of Mystery/Trend:** Mislabeling a place as “haunted” or “trending” can mislead. Mitigation: Clearly cite sources and use mild language (“called a haunted site by locals”). Apply thresholds to avoid spammy alerts.  
- **Safety:** Some “hidden gems” could be unsafe (remote, restricted). Mitigation: If there’s any risk (cliffs, remote jungle), include a note or forbid advertising (e.g. *“Remote area – prepare accordingly”*). Possibly use data like elevation/climb if available.  
- **API Costs & Limits:** Google Places and other APIs cost money. Mitigation: Monitor usage, use caching, prioritize open APIs. OpenTripMap’s policy explicitly allows caching and broad use.  
- **Competition Moves:** Google or others could add similar features. Mitigation: Focus on quality of niche (mystery storytelling, trust, local lore). Maintain brand uniqueness.  
- **Technical Debt:** Overengineering early (microservices, heavy ML) could delay MVP. Mitigation: Follow recommended stack (Spring monolith, React SPA) and postpone complexities.

---

## 12. Validation Plan

- **User Interviews:** Show prototype (or wireframes) to target users. Ask: “Would you find this useful?” Observe confusion points. Validate the “mystery” concept.  
- **Early Adopters:** Release to a small audience in one region (e.g. Nilgiris hiking groups) and collect feedback on place relevance and app usability.  
- **Metrics:** Track “places clicked vs dismissed”, “alert open rate”, “average session duration”. High dismissals on a category suggest misclassification.  
- **Content Audit:** Periodically review a sample of “mystery” and “trending” labels for accuracy. Adjust algorithms/thresholds accordingly.  
- **A/B Tests:** (Later) Experiment with different notification rates or content (e.g. text-only vs image).  
- **Privacy Compliance:** Verify we adhere to regulations (cookie banners, location permission dialogues with clear text).

---

## 13. Agent Handoff Summary

**Mission Statement:** Wild Atlas is a map-first explorer app that uncovers *mysterious, hidden, and trending places* near the user. It prioritizes discovery, context, and trust. Do **not** turn it into a booking platform, general social network, or purely itinerary app.

**Invariants & Rules:** 
- Map+sidebar design (as per earlier specification) must remain. No additional columns or dashboard clutter.  
- Never generate or hard-code POIs unrelated to the user’s location/query. E.g. searching “Ooty” must not show Bali places.  
- Do not fabricate data: if a place has no sources, mark unknown.  
- Do not spam location: only request permission when needed and clearly explain why.

**System Modules:**  
- **Search/Discovery Engine:** Handles queries like `location+keywords+radius+category`. Returns paginated list of places.  
- **Trend Engine:** Periodic job that updates `trendScore` and `trendStatus` fields in place records, based on data feeds.  
- **Alerts Engine:** Scans user preferences and triggers notifications. Must throttle per-user/per-place (e.g. max 1 alert/place/day).  
- **Destination Info Renderer:** Formats place details with categorized content. Ensures consistency.

**Data Contracts (examples):**  
- `GET /api/search?lat=...&lon=...&radius=...&query=...&category=...` → list of simplified Place summaries (id, name, lat, lon, categories, brief description, distance, trendStatus, imageUrl).  
- `GET /api/place/{id}` → full Place record (as JSON above).  
- `POST /api/user/signup`, `/api/user/login` → auth tokens.  
- `POST /api/user/alerts` → subscribe preferences.  

**UI/UX Invariants:**  
- Always show map and result list together on desktop.  
- Category chips horizontally scrollable.  
- Cards must show photo, name, categories, distance.  
- Highlight selected place on both map and list simultaneously.  
- No “unlocked after login” gating for discovery; optional account only for saves/alerts.  

**Privacy Rules:**  
- Ask location once per session. Always allow “deny” fallback.  
- No tracking beyond explicit actions.  
- Secure data storage (DB, APIs) with encryption in transit.  

**Prohibitions (“Do Not”):**  
- Do not preload or store entire global POI databases locally without caching strategy (use APIs responsibly).  
- Do not allow automated refresh of location when user is inactive.  
- Do not exhibit dark patterns (e.g. sneaky subscriptions or required signup).  
- Do not misrepresent content (e.g. calling something “mystery” when no evidence).  
- Do not push notifications outside user-set preferences (cooldown, quiet hours).  

**Open Decisions (for agent/team to handle explicitly):**  
- Exact formula weights for trending and mystery scores (prototype then tune).  
- Thresholds for showing “Trending” or “Mystery” labels.  
- Which backend geocoding/search API to use initially (OpenTripMap vs Google).  
- Full scope of “Nearby Radar” UI (circle overlay on map, approximate distances labels).  
- User authentication method (e.g. email/password vs OAuth).  

These must not be auto-changed; consult PM/developer if uncertain.

**Acceptance Criteria (sample):**  
- **Search works:** typing “haunted temple near Ooty” shows relevant places in Ooty region.  
- **Map-sync:** Clicking a card highlights marker and vice versa.  
- **Filters:** Tapping “Hidden Gems” shows only places tagged hidden.  
- **Detail page:** Each place shows a clear title, description, categories, and at least two content sections (e.g. History, Legends) with sources.  
- **Mobile UI:** On small screens, the left panel becomes an expandable bottom sheet; map remains visible or as background.  
- **Notifications:** When opted-in, an alert arrives (via Telegram/email) when user location enters a geofenced radius of a relevant place.

---

**Sources:** For competitor features and technical guidelines, we consulted official product documentation and developer resources. Examples: Atlas Obscura’s description of hidden wonders; TripAdvisor trending definitions; VibeAtlas trend methodology; GoodBarber geofence docs; Android background location limits; Instagram Graph API limits; TikTok Research API policy; OpenTripMap API policy; Google Places API billing; Geolocation API usage (MDN). All product claims are supported by these sources or by explicit statements in the Wild Atlas design conversation. 

