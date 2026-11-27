# WILD ATLAS — LOCATION-AWARE TELEGRAM DISCOVERY ENGINE

## 1. Feature Objective

Build a location-aware destination discovery and notification system integrated with the Wild Atlas Telegram bot.

The main objective is:

"When a user enables location sharing in Wild Atlas, the platform should identify interesting destinations near the user's current location and notify the user through their connected Telegram bot."

The notification should not simply say that a place exists nearby.

It should explain:

- What the destination is.
- Why the destination is interesting.
- Why the user might want to visit it.
- What makes it beautiful, unusual, historically significant, mysterious, or noteworthy.
- How far away it is.
- Whether it is currently accessible.
- Whether any permits, restrictions, seasonal conditions, or safety considerations apply.

The system must recommend places based on researched destination information and reliable discovery signals.

## 2. Example User Experience

Scenario:

A user is travelling near Valparai.

The user has:

- Opened Wild Atlas.
- Enabled location sharing.
- Connected their Telegram account.
- Enabled nearby destination notifications.
- Selected a 15 km notification radius.

Wild Atlas detects a relevant destination approximately 7 km away.

The recommendation engine evaluates the destination and determines that it is suitable for recommendation.

The Telegram bot sends:

"🌿 A destination worth discovering is nearby!

Destination: [Destination Name]

Distance: Approximately 7 km from your current location.

Why visit?

[Research-backed explanation of the destination's natural beauty, historical significance, unusual features, or local story.]

Why Wild Atlas recommends it:

[Explain the relevant discovery signal, such as an obscure destination, rising attention, or a match with the user's selected interests.]

Access Information:

- Access status: OPEN / SEASONAL / PERMIT / RESTRICTED / CLOSED
- Best visiting period: [Verified information]
- Travel information: [Verified information]
- Safety note: [Relevant information]

Explore this destination:
[Explore in Wild Atlas]

Get directions:
[Open directions]"

All example descriptions must be replaced with actual researched destination information.

## 3. Location Permission and Tracking

Location sharing must be explicitly enabled by the user.

Implement:

- Enable location button.
- Disable location button.
- Current location status.
- Notification radius selection.
- Location permission error handling.
- Last location update timestamp.

Use the browser Geolocation API.

Use navigator.geolocation.watchPosition() while the Wild Atlas application is actively running and the user has enabled location monitoring.

Send location updates to the backend using a controlled update interval and movement threshold.

Do not send every GPS update to the backend.

Recommended initial configuration:

- Minimum movement threshold: 100 metres.
- Minimum update interval: 60 seconds.
- Maximum acceptable location age: configurable.
- Default recommendation radius: 10 km.
- User-selectable radius: 5 km, 10 km, 15 km, 25 km.

These values are initial engineering defaults and must be configurable.

IMPORTANT:
A PWA cannot be assumed to provide continuous background geolocation when closed or suspended.

Do not implement fake background tracking.

When the user stops sharing location, immediately stop watching the device position and stop sending coordinates.

## 4. Telegram Account Integration

Create an official Wild Atlas Telegram bot.

Implement the following connection flow:

1. User opens Telegram connection settings in Wild Atlas.
2. User clicks Connect Telegram.
3. Wild Atlas generates a secure, short-lived, single-use linking token.
4. User opens the Telegram bot using a deep link containing that token.
5. User presses Start.
6. Telegram sends an update to the backend.
7. Backend validates the linking token.
8. Backend associates the Telegram chat ID with the corresponding Wild Atlas account.
9. User receives a confirmation message.

Do not trust a user-supplied chat ID without validating the Telegram update.

Use a Telegram webhook for production.

Never expose the Telegram bot token in frontend code.

Store secrets in environment variables.

Required environment variables:

TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
TELEGRAM_BOT_USERNAME=

## 5. Nearby Destination Detection

Use PostgreSQL with PostGIS for nearby destination searches.

The backend receives:

- Latitude.
- Longitude.
- Location accuracy.
- Timestamp.
- User notification preferences.

Find destinations within the user's selected radius.

Only consider destinations that are eligible for recommendations.

Evaluate:

- Geographic distance.
- Destination access status.
- Seasonal availability.
- Safety classification.
- Cultural sensitivity.
- Destination confidence.
- Obscurity signal.
- Narrative signal, where appropriate.
- Rising signal.
- User-selected interests.

Do not recommend a destination solely because it is geographically close.

## 6. Recommendation Engine

Create a deterministic recommendation engine.

Evaluate each destination using:

A. Distance

- How close is the destination?
- Is it within the user's configured radius?

B. Destination quality

- Is the destination properly researched?
- Does it have sufficient credible sources?
- Is its last verification date acceptable?

C. Discovery signals

- Obscurity: Is it relatively under-discovered?
- Rising: Is there evidence of increasing attention?
- Narrative: Does it have a documented or attributed story?

D. User preferences

- Nature.
- Waterfalls.
- Heritage.
- Sacred places.
- Industrial heritage.
- Urban exploration.
- Dark history.
- Other supported facets.

E. Access and safety

- Open.
- Seasonal.
- Permit required.
- Restricted.
- Closed.

Never recommend closed or restricted destinations as ordinary visit suggestions.

Do not expose sensitive coordinates or encourage trespassing.

Narrative scores must not be applied to sacred or living devotional sites.

The recommendation engine should be deterministic and explainable. Do not introduce machine-learning recommendations at MVP.

## 7. Telegram Notification Rules

Create notification rules to prevent spam.

Initial suggested rules:

- Notify only when a suitable destination enters the user's configured radius.
- Do not repeatedly notify the user about the same destination.
- Apply a configurable cooldown for each destination.
- Avoid sending multiple notifications for the same destination during one nearby session.
- Provide a global pause option.
- Provide a disable notifications option.
- Respect user-selected quiet hours.
- Do not notify about inaccessible destinations as visit recommendations.

Store notification history.

Use notification deduplication to prevent duplicate Telegram messages caused by repeated location updates.

## 8. Telegram Bot Commands

Implement:

/start
Connect the user and explain the Wild Atlas service.

/nearby
Find destinations near the most recently shared location, if an active location is available.

/discover
Recommend interesting destinations based on the user's preferences.

/trending
Show destinations with evidence of rising attention in the selected region.

/preferences
Show notification and destination preferences.

/radius
Change the nearby notification radius.

/pause
Pause nearby notifications.

/resume
Resume notifications.

/stop
Disable the notification service and explain how to disconnect the integration.

/help
Show available commands.

Do not assume the Telegram bot independently knows the user's live device location.

The bot can use the most recent location explicitly supplied through the connected Wild Atlas application or a location message voluntarily shared by the user.

## 9. Destination Recommendation Message

Create reusable Telegram message templates.

Each recommendation should contain:

- Destination name.
- Destination image when available and appropriately licensed.
- Approximate distance.
- Destination facet.
- Why it is worth visiting.
- Why Wild Atlas selected it.
- Rising or obscurity signal when supported by evidence.
- Access status.
- Last verification date.
- Safety or cultural sensitivity note when applicable.
- Explore destination button.
- Get directions button.

Use concise, readable messages.

Support English and Tamil.

Never invent historical claims, folklore, access information, or reasons for recommending a destination.

## 10. Database Requirements

Extend the existing database design with the following tables.

telegram_connections:

- id
- user_id
- telegram_chat_id
- telegram_username
- connected_at
- is_active

telegram_link_tokens:

- id
- user_id
- token_hash
- expires_at
- used_at

user_location_preferences:

- id
- user_id
- location_enabled
- notification_enabled
- notification_radius_meters
- preferred_facets
- language
- quiet_hours_start
- quiet_hours_end
- updated_at

location_sessions:

- id
- user_id
- started_at
- ended_at
- last_location_at
- is_active

notification_history:

- id
- user_id
- destination_id
- notification_type
- sent_at
- telegram_message_id
- delivery_status

destination_recommendation_events:

- id
- user_id
- destination_id
- distance_meters
- recommendation_score
- recommendation_reason
- evaluated_at

Do not store a continuous location history by default.

Use the latest location only for the active discovery session.

If location-session storage is needed for operational reasons, retain the minimum necessary data and define a short retention period.

## 11. Backend API Requirements

Create endpoints following the existing Next.js App Router architecture.

Suggested endpoints:

POST /api/location/start
Start an explicitly enabled location session.

POST /api/location/update
Receive the latest user coordinates and evaluate nearby destinations.

POST /api/location/stop
Stop the active location session.

POST /api/telegram/link
Generate a secure Telegram linking token.

POST /api/telegram/webhook
Receive and validate Telegram updates.

POST /api/telegram/disconnect
Disconnect the Telegram integration.

GET /api/nearby
Return eligible destinations around the supplied coordinates.

GET /api/notifications/preferences
Retrieve notification preferences.

PATCH /api/notifications/preferences
Update notification preferences.

All endpoints must validate inputs, authenticate users where necessary, apply rate limits, and avoid logging precise coordinates unnecessarily.

## 12. Privacy and Security

Location is sensitive information.

Requirements:

- Obtain explicit permission.
- Explain why location is required.
- Provide an immediate stop option.
- Never sell or share precise location information.
- Do not expose location coordinates to Telegram unless the user explicitly requests that.
- Do not store continuous location history by default.
- Use HTTPS.
- Validate Telegram webhook requests.
- Protect linking tokens.
- Keep bot tokens on the server.
- Apply authentication and authorization.
- Define retention and deletion policies.
- Make notification preferences independently controllable.

The user must be able to disconnect Telegram and disable location sharing separately.

## 13. Product Architecture

Use the existing Wild Atlas stack:

Frontend:
Next.js + TypeScript + PWA.

Database:
Neon PostgreSQL + PostGIS.

ORM:
Drizzle ORM.

Map:
MapLibre GL.

Location:
Browser Geolocation API while the application is active.

Nearby search:
PostGIS spatial queries.

Notifications:
Telegram Bot API.

Analytics:
PostHog.

Hosting:
Vercel + Neon, subject to webhook and deployment requirements.

Keep the implementation modular within the existing application.

Do not introduce microservices for this feature.

## 14. Implementation Phases

Phase A — Telegram integration:

- Create bot.
- Implement account linking.
- Implement webhook.
- Send test messages.
- Add disconnect functionality.

Phase B — Nearby discovery:

- Implement location permission flow.
- Implement active-session location updates.
- Implement PostGIS nearby search.
- Display nearby destinations in Wild Atlas.

Phase C — Recommendation engine:

- Evaluate distance.
- Evaluate destination quality.
- Evaluate access and safety.
- Evaluate discovery signals.
- Generate explainable recommendation reasons.

Phase D — Telegram notifications:

- Implement notification templates.
- Implement cooldown.
- Implement deduplication.
- Implement preferences.
- Implement English and Tamil support.

Phase E — Testing:

- Test different location radii.
- Test location permission denial.
- Test stopped location sessions.
- Test repeated GPS updates.
- Test duplicate notifications.
- Test closed and restricted destinations.
- Test Telegram disconnection.
- Test inaccurate GPS readings.
- Test mobile browser suspension.

## 15. Acceptance Criteria

The feature is complete when:

1. A user can connect Telegram successfully.
2. A user can enable and disable location sharing.
3. Wild Atlas can identify eligible nearby destinations.
4. The recommendation engine can explain why a destination was selected.
5. The Telegram bot can send a nearby destination recommendation.
6. Notifications include distance and sourced destination information.
7. Duplicate notifications are prevented.
8. Users can control their notification radius.
9. Users can pause or disconnect notifications.
10. Closed and restricted destinations are not recommended as ordinary visits.
11. Location sharing stops when the user disables it.
12. The system does not falsely claim to track users in the background.

## 16. Future Enhancement

A native Android application may eventually provide background geofencing and more reliable proximity notifications.

Do not implement this in the initial PWA.

The immediate objective is to deliver a working location-aware Telegram discovery experience while Wild Atlas is actively receiving the user's location.

The core product principle:

"Wild Atlas should not simply tell people where places are. It should help them discover why a nearby place is worth exploring, when they can visit it, and what makes it special."
