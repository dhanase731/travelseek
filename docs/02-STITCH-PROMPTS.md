# Wild Atlas — Stitch AI Prompts (S1–S19)

**How to use this file**

1. Open a new project in Google Stitch. Paste **Block A** once, as the first message. It sets the palette, type, spacing, and tone for the whole project.
2. Paste **one** section from Block B as the next message. Every screen prompt is self-contained: it repeats the product context, states the screen's single job, and fixes the layout order.
3. Generate at **390 × 844 (mobile)** first. Then send: *"Now show the 1440 × 900 desktop variant of this same screen, keeping the same design system and the same content order."*
4. Keep iterating **in the same Stitch project** so the design system stays consistent. Do not start a new project per screen.
5. Screens S11–S14 are **Telegram chat mockups**, not web pages. Generate them in the same project so the palette matches, but expect Telegram's own chat chrome (header, bubbles, keyboard) rather than the app's top bar.
6. If a render drifts (wrong control order, extra sections, invented buttons), re-paste that screen block and add only the correction — do not re-paste Block A.

Every prompt names the screen's single job and fixes the top-to-bottom order, because order is a product decision: base town before facets, stat row before prose, sources at the end.

| # | Screen | Platform | One-line visual idea |
|---|---|---|---|
| S1 | Map home | Mobile web | Full-bleed warm map under a 56px bar, a three-chip control stack, and a collapsed sheet counting verified places |
| S2 | Search entry | Mobile web | A calm full-height overlay: one big input, three labelled suggestion groups, a bilingual hint at the bottom |
| S3 | Search results | Mobile web | Removable intent chips, a count line, a short map band, then two result rows sorted by drive time |
| S4 | Filter sheet | Mobile web | A tall sheet that reads top-down as base town → reach → facets, with a live count button pinned at the bottom |
| S5 | Preview card | Mobile web | A half sheet over the map: 96px thumbnail, Tamil-first name, two facet chips, one status badge, three actions |
| S6 | Dossier | Mobile web | A long editorial page: three-slot stat row, white documented card, tinted told block, sources table, sticky action bar |
| S7 | No results | Mobile web | A plain spoken message, three honest nearest cards, and two ways forward — never a blank map |
| S8 | Correction | Mobile web | A short form sheet: five radio rows, one textarea with a counter, one primary button |
| S9 | Location explainer | Mobile web | A small sheet with three short promises and two buttons, one primary and one escape hatch |
| S10 | Link Telegram (web) | Mobile web | Three numbered steps, a large four-character code in a bordered box, a countdown, a status line |
| S11 | Link confirmation | Telegram chat | A short bot thread that ends in a command list, no buttons at all |
| S12 | Live-location instruction | Telegram chat | Three plain sentences and one full-width reply-keyboard button above the message input |
| S13 | Arrival digest | Telegram chat | One dense digest bubble: bold headline, three numbered places, italic footnote, two rows of buttons |
| S14 | Feedback callbacks | Telegram chat | The digest's four feedback buttons followed by four short, calm acknowledgements |
| S15 | Alert settings | Mobile web | A stacked settings page of nine labelled rows, segmented controls, and one destructive text link |
| S16 | Saved places | Mobile web | A short list of saved rows with one badge each and a single sticky pack button |
| S17 | Trip declaration + pack | Mobile web | A pack summary line, one big download button, a progress bar, a storage line |
| S18 | Offline state | Mobile web | A thin banner, an offline badge on a dossier that still reads perfectly, no broken images |
| S19 | Method | Mobile web | A trust document: a grades table, a fact-versus-lore comparison, a 180-day callout |

---

## Block A — Global style block (paste first)

```
You are designing "Wild Atlas", a sourced bilingual Tamil/English travel dossier product for Coimbatore district and 60 km around it. Every place carries an access status, a verified date, and a source grade. The tone is a printed field guide: calm, editorial, trustworthy, never a thrill-seeking startup.

LIGHT WARM PAPER AESTHETIC. Never dark mode. Surfaces: page #FCFCFA, raised cards and sheets #FFFFFF, sunken map chrome and filter bars #F3F2EE. Ink: primary #1A1A18, secondary #5C5F5A, tertiary #8E918B. Brand deep forest #1E4E3F, pressed and active #0F2A22, tinted blocks #E4EEE9.

Access status is semantic, never decorative: OPEN #1E7A4C, SEASONAL #A06A0B, PERMIT #23558C, RESTRICTED #8C3A23, CLOSED #6B6B6B, UNKNOWN #8E918B. Each badge has a pale tint, a 1px border, 6px radius, and always prints the status WORD in 12px uppercase — never colour alone.

Facet chips use their colour only as a 1px border: nature #3C7A4A, water #2B6E8F, sacred #8A5A1E, heritage #7A4A6B, industrial #5C5A52, urban #4A5C6B, dark history #4A3A3A.

Type: Inter for Latin, Noto Sans Tamil for Tamil. Body 16px / 1.65, labels 14px, meta 12px, card titles 24px / 600, dossier title 32px / 600. Tamil blocks use line-height 1.75 and never drop below 16px. Max reading measure 68 characters.

Spacing on an 8px scale: 8 / 16 / 24 / 32 / 48. Cards 10–12px radius, 1px #E7E6E1 border, no heavy shadow. Buttons at least 44px tall. Mobile is map-first with a bottom sheet.

No gradients, no glassmorphism, no dark mode, no emoji in the web UI, no decorative icons, no stock-photo gloss. Badges always carry a word.
```

---

## Block B — Screen prompts

### S1 · Map home

**Platform:** mobile web 390×844

**Paste this:**
```
Design a mobile web screen for "Wild Atlas", a sourced bilingual Tamil/English travel dossier app for Coimbatore district. Use the global style block above.

SCREEN: Land a first-time visitor on a real map with content visible before any permission prompt.

LAYOUT (top to bottom):
1. Top bar, 56px, #FFFFFF, 1px bottom border #E7E6E1: wordmark "Wild Atlas" 18px/600 #1E4E3F; "EN | த" toggle at right, active "EN" #1E4E3F, inactive "த" #8E918B; 44px menu button with three 18px lines.
2. Search pill, 48px, #F3F2EE, 999px radius, 18px magnifier #5C5F5A, placeholder "Search a place, a town, a waterfall…" with Tamil "இடம், நகரம், அருவி தேடுங்கள்…" beneath it at 12px #8E918B.
3. Control row A, 44px: one full-width chip, white, 1px #E7E6E1 border, label "Base town: Valparai ▾" and Tamil "அடித்தள நகரம்" at 12px.
4. Control row B, 44px, two chips with an 8px gap: "Within 60 min ▾" / "60 நிமிடங்களுக்குள்" and "Filters" / "வடிகட்டி".
5. Map canvas filling the rest of the viewport: warm #F3F2EE land, white roads, muted #DCE7DD patches, town names only, 12px #5C5F5A. Eight of the twelve ROUND 14px pins #1E4E3F = places. Three SQUARE 14px pins #8A5A1E = towns (Valparai, Pollachi, Anaikatti). Selected pin has a 2px white ring. No user-location dot.
6. Bottom sheet collapsed to 18% of screen height: 36×4px #E7E6E1 drag handle, then "12 verified places within 60 min of Valparai" 15px/600, then "Verified 12 Oct 2026" 12px #8E918B with Tamil "சரிபார்ப்பு 12 அக். 2026".

CONTENT: render the copy exactly as written, English first with Tamil beneath. Add no other place names.

COMPONENTS: chips are pill-shaped, 44px tall, white with a 1px border; the active chip is #E4EEE9 with a #1E4E3F border. Pins are flat, no drop shadow, no teardrop shape.

STATES: show the default collapsed sheet. If the tool renders variants, also show the half state at 45% with a three-card carousel and the expanded state at 85% with a vertical list of badge rows.

DO NOT: no permission prompt on load, no onboarding overlay, no modal, no "near me" button, no hotel or restaurant pins, no star ratings, no photo tiles over the map, no dark map style, no gradient scrim.

MOBILE CONSTRAINTS: 390px width, single column, no horizontal scroll, safe-area insets top and bottom, every control at least 44px.
```

**Gate:** UI 1–2

---

### S2 · Search entry

**Platform:** mobile web 390×844

**Paste this:**
```
Design a mobile web screen for "Wild Atlas", a sourced bilingual Tamil/English travel dossier app for Coimbatore district. Use the global style block above.

SCREEN: Turn a vague intent into a query, in one field, without leaving the map behind.

LAYOUT (top to bottom):
1. Full-height overlay on #FCFCFA, covering the map completely, no scrim visible.
2. Top row, 56px: 44px back arrow at left, then a borderless input that is already focused, then a 44px clear "×". A 1px #1A1A18 caret sits at the start of the input.
3. Input placeholder, two lines: Try "waterfall near Valparai" at 16px #8E918B, and Tamil "வால்பாறை அருகில் அருவி" என்று முயற்சிக்கவும் at 14px.
4. 1px divider #E7E6E1.
5. Group header "Places" / "இடங்கள்": 12px uppercase #8E918B, 16px top margin. Three rows.
6. Group header "Towns" / "நகரங்கள்": two rows.
7. Group header "Topics" / "தலைப்புகள்": two rows.
8. Footer hint pinned to the bottom of the sheet above the keyboard: "Tamil or English. Both work." with Tamil "தமிழ் அல்லது ஆங்கிலம். இரண்டும் வேலை செய்யும்." at 12px #8E918B, centred.

CONTENT (7 suggestions total, maximum 8):
- Places: "சிறுவாணி அருவி / Siruvani Falls" with meta "Valparai · 34 km"; "Chinnakallar" with meta "Valparai · 9.8 km"; "Puthuthottam" with meta "Valparai · 4.1 km".
- Towns: "வால்பாறை / Valparai" with meta "Hill station"; "Pollachi" with meta "Gateway".
- Topics: "Waterfalls" with meta "12 places"; "Tea estates" with meta "8 places".
Each row is 44px minimum: 16px name #1A1A18, 12px meta #8E918B on the right, 1px divider between rows.

COMPONENTS: no cards, no thumbnails. A single column of plain rows. The group header is the only visual break.

STATES: idle with "Recent searches" from local storage, maximum 5 rows; typing with a 200ms debounce; no suggestions showing the single line "Search for "…""; offline showing "Search needs a connection. Your saved packs still open."

DO NOT: no map visible under the overlay, no filter controls here, no permission ask, no popularity list, no "top picks" module, no keyboard shortcut hints, no close "X" that loses the typed text without warning.

MOBILE CONSTRAINTS: 390px width, input stays above the iOS keyboard, rows 44px, no horizontal scroll.
```

**Gate:** UI 4

---

### S3 · Search results

**Platform:** mobile web 390×844

**Paste this:**
```
Design a mobile web screen for "Wild Atlas", a sourced bilingual Tamil/English travel dossier app for Coimbatore district. Use the global style block above.

SCREEN: Show matches with base town, road distance, drive minutes, and an access badge, so a visitor can choose without opening anything.

LAYOUT (top to bottom):
1. Top bar, 56px, identical to the map home: wordmark, "EN | த", menu.
2. Search pill, 48px, showing the active query "waterfalls near Valparai" in #1A1A18, with a 44px clear "×" at the right.
3. Intent row, 44px, three removable chips: "Waterfalls ×", "Valparai ×", "60 min ×". Chips are #E4EEE9 with a #1E4E3F border; the "×" is a 24px tap zone inside a 44px chip.
4. Count line, 24px tall: 2 places match "waterfalls near Valparai" at 15px/600, with Tamil "வால்பாறை அருகில் அருவி"க்கு 2 இடங்கள் at 12px beneath.
5. Map band, 200px tall, same warm map style, two active pins and the rest dimmed to 30% opacity. No zoom controls.
6. Sort control, 44px: "Drive time" selected, "Recently verified" unselected, right-aligned above the list, 14px.
7. Result list: two full-width rows, 1px #E7E6E1 divider between them.

CONTENT:
Row 1 — "சிறுவாணி அருவி / Siruvani Falls", meta "Valparai · 34 km · 1 h 20 m", badge "OPEN", verified "12 Oct 2026", chips "Water" and "Nature".
Row 2 — "Chinnakallar", meta "Valparai · 9.8 km · 38 min", badge "SEASONAL", verified "02 Nov 2026", chip "Nature".

COMPONENTS: each row is a card-less block with a 96px square thumbnail on the left, 12px radius. Badge sits top-right of the text column. Tapping the row opens the dossier; the badge is not a button.

STATES: results (shown), loading with three skeleton rows, zero results handing off to the no-results screen, API error "Something went wrong. Retry." with the last good results still visible, offline.

DO NOT: no crow-flies distance shown as drive time, no hotel names, no prices, no ratings, no "sort by popularity", no infinite scroll, no map full-screen takeover.

MOBILE CONSTRAINTS: 390px width, chips wrap rather than scroll horizontally, rows at least 96px tall with 44px tap targets, no horizontal scroll.
```

**Gate:** UI 4

---

### S4 · Filter sheet

**Platform:** mobile web 390×844

**Paste this:**
```
Design a mobile web screen for "Wild Atlas", a sourced bilingual Tamil/English travel dossier app for Coimbatore district. Use the global style block above.

SCREEN: Let someone narrow by where they sleep first, then how far they will drive, then what kind of place — in that order, always.

LAYOUT (top to bottom):
1. Sheet at 85% height, 16px top radius, over a 40% #1A1A18 scrim, drag handle 36×4px.
2. Title row, 56px: "Filters" / "வடிகட்டி" at 24px/600, and a 44px text button "Reset" at the right in #5C5F5A.
3. BASE TOWN — must be the first control on the sheet. Label "Base town" / "அடித்தள நகரம்" at 12px uppercase #8E918B, then a 48px select field, white, 1px #E7E6E1 border, showing "Valparai" 16px and a "▾" at the right. The list is grouped "Gateway" / "Hill stations" / "Cities".
4. "Within" / "இதற்குள்" label, then a 44px segmented control with three equal segments: "30", "60", "90 min". "60" is selected: #1E4E3F background, #FCFCFA text.
5. "Facets" / "வகைகள்" label, then seven multi-select chips in a two-column grid, 44px tall, 8px gap: Nature, Water, Sacred, Heritage, Industrial, Urban, Dark History. "Nature" and "Water" are selected: #E4EEE9 fill, #1E4E3F border, a 16px check at the left.
6. 1px divider, then sticky footer, 88px plus safe area: full-width primary "Show 12 places" / "12 இடங்களைக் காட்டு", 48px, #1E4E3F, white text.

CONTENT: the seven facets are exactly Nature, Water, Sacred, Heritage, Industrial, Urban, Dark History — no icons, no counts.

COMPONENTS: the select is a native-style field, not a custom panel. The segmented control has a 1px #E7E6E1 outer border and 6px inner radius.

STATES: default (shown); a town with no drive-time matrix, where the reach control is disabled at 40% opacity and the line "Drive times for this town are not verified yet" replaces the footer count; zero results, where the primary button is disabled and reads "No places — widen the reach" / "இடங்கள் இல்லை — நேரத்தை அதிகரிக்கவும்".

DO NOT: no facets above base town, no sliders, no price filter, no rating filter, no "apply" button that closes before the count updates, no map inside the sheet, no full-screen page.

MOBILE CONSTRAINTS: 390px width, sheet scrolls internally, footer stays pinned, 44px chips, no horizontal scroll.
```

**Gate:** UI 1–2

---

### S5 · Preview card

**Platform:** mobile web 390×844

**Paste this:**
```
Design a mobile web screen for "Wild Atlas", a sourced bilingual Tamil/English travel dossier app for Coimbatore district. Use the global style block above.

SCREEN: Give just enough to decide whether to open the dossier — no more, no less.

LAYOUT (top to bottom):
1. Map background, dimmed by a 25% #1A1A18 scrim, with the selected round pin still visible above the sheet.
2. Half sheet, 45% of screen height, 16px top radius, #FFFFFF, 1px #E7E6E1 border, drag handle 36×4px.
3. Content row, 96px: 96×96 thumbnail left, 12px radius (or a neutral #F3F2EE block with a 24px landscape glyph if no licensed image); text column 16px to its right.
4. Name block: "சிறுவாணி அருவி" at 24px/600 first, then "Siruvani Falls" at 14px #5C5F5A beneath.
5. Chip row, 32px: two facet chips "Water" and "Nature" plus a "+1" chip in #F3F2EE. Access badge "OPEN" sits at the far right of this row.
6. Distance line, 16px: "34 km · 1 h 20 m from Valparai" with Tamil "வால்பாறையிலிருந்து 34 கி.மீ · 1 மணி 20 நிமிடம்" at 14px beneath.
7. Last-mile line, 14px #5C5F5A: "Last mile: 4.2 km jeep track" / "கடைசி மைல்: 4.2 கி.மீ ஜீப் சாலை".
8. Verified line, 12px #8E918B: "Last verified 12 Oct 2026 by R. Kumar".
9. Action row, 48px: primary "Open dossier" / "முழு விவரம்" (#1E4E3F, 10px radius, 140px), then "Save" / "சேமி" and "Share" / "பகிர்" as 44px outline buttons.

CONTENT: exactly the strings above. The badge word must be visible, never colour alone.

COMPONENTS: the card body is tappable and opens the dossier; the actions sit above that tap layer. Save toggles outline to filled #E4EEE9 with a check.

STATES: unsaved (shown); saved (Save filled, label unchanged); distance unknown, where the distance line is replaced by "Drive time not verified" / "பயண நேரம் சரிபார்க்கப்படவில்லை" in #8E918B and no minutes are shown; restricted place, where the badge reads "RESTRICTED" and there is no map pin, no coordinate, and no "Open in maps" affordance.

DO NOT: no booking button, no hotel names, no weather widget, no star rating, no crow-flies distance presented as drive time, no colour-only badge, no photo carousel, no second card peeking.

MOBILE CONSTRAINTS: 390px width, no horizontal scroll, all actions 44px, sheet clears the bottom safe area.
```

**Gate:** UI 1–2

---

### S6 · Dossier

**Platform:** mobile web 390×844

**Paste this:**
```
Design a mobile web screen for "Wild Atlas", a sourced bilingual Tamil/English travel dossier app for Coimbatore district. Use the global style block above.

SCREEN: The reading surface: documented, told, getting there — in that order.

LAYOUT (top to bottom) — twelve fixed sections, this exact order, none removed, none reordered:
1. Header: "சிறுவாணி அருவி" 32px/600, "Siruvani Falls" 18px #5C5F5A, chips "Water" and "Nature", "OPEN" badge, "Verified 12 Oct 2026" badge.
2. Hook, one line, 18px.
3. Hero image, 390×220, attribution line beneath.
4. Stat row, EXACTLY 3 slots between 1px rules: "34 km" over "VALPARAI → ACCESS"; "1 h 20 m" over "DRIVE"; "4.2 km" over "LAST MILE". Numbers 24px/600, labels 12px uppercase. Beneath: "Distance is town centre to access point. Times are driving only." / "தூரம் நகர மையத்திலிருந்து அணுகல் புள்ளி வரை. நேரம் ஓட்டும் நேரம் மட்டும்."
5. "The Story": two paragraphs, 16px/1.65.
6. "What is documented" / "ஆவணப்படுத்தப்பட்டவை" — WHITE card, 1px #E7E6E1 border: two claims, each with a 24px grade chip "A" then "B" at the right.
7. "What is told" / "கூறப்படுபவை" — TINTED #E4EEE9 block, 12px radius, 3px #1E4E3F left border, distinct from 6: italic lead, two lore lines, a "Source:" line.
8. "Getting there" / "அங்கு செல்வது எப்படி" — three rows: route, last mile, transport.
9. "Where to base yourself" / "எங்கு தங்கலாம்" — max three rows, each "Valparai · 34 km · 1 h 20 m" plus one character line.
10. "Practical" / "நடைமுறை தகவல்" — four rows: hours, entry, season, carry.
11. "Sensitivity note" — #FBF1DF block, #A06A0B border, two lines; only when cultural status is not secular.
12. "Sources" table, "Verification": "Last verified 12 Oct 2026 by R. Kumar" / "கடைசி சரிபார்ப்பு 12 அக். 2026 — R. குமார்", then "This is wrong" / "இது தவறு" in #8C3A23.
Sticky bar, 64px plus safe area, white: "Open in maps" primary, "Save", "Share", "This is wrong" always visible, 44px.

CONTENT: English first, Tamil beneath each heading.

COMPONENTS: headings 18px/600. Grade chips 24px square.

STATES: normal; offline "Offline copy" badge; UNKNOWN in #8E918B, never blank; retired place with 410.

DO NOT: no booking button, no hotel names, no weather widget, no permission modal, no AI summary, no review scores, no related-places carousel, no restricted coordinates.

MOBILE CONSTRAINTS: 390px width, no horizontal scroll, safe-area insets, 44px targets.
```

**Gate:** UI 3

---

### S7 · No results

**Platform:** mobile web 390×844

**Paste this:**
```
Design a mobile web screen for "Wild Atlas", a sourced bilingual Tamil/English travel dossier app for Coimbatore district. Use the global style block above.

SCREEN: Never silent. When a search fails, say so plainly and offer three real places plus two ways forward.

LAYOUT (top to bottom):
1. Top bar, 56px, with the wordmark, "EN | த" and menu.
2. Search pill, 48px, showing the failed query "qwertyuiop" and a clear "×".
3. Message block, 96px, left-aligned, 24px side padding: "No exact match — did you mean…" at 24px/600, with Tamil "சரியான பொருத்தம் இல்லை — இவை உங்களுக்கு உதவுமா…" at 14px #5C5F5A beneath.
4. Divider 1px #E7E6E1, then three compact rows, 88px each, no thumbnails and no section label: name at 18px/600, meta "34 km · 1 h 20 m" at 14px #5C5F5A, access badge at the right, 1px divider between rows.
5. Action block, pinned above the safe area: primary full-width button "Widen to 90 min" / "90 நிமிடங்களாக விரிவுபடுத்து" (48px, #1E4E3F), then a secondary text button "Search the whole region" / "முழு பகுதியிலும் தேடு" (44px, underline, #1E4E3F).

CONTENT:
Row 1 "சிறுவாணி அருவி / Siruvani Falls" — "34 km · 1 h 20 m" — OPEN.
Row 2 "Chinnakallar" — "9.8 km · 38 min" — SEASONAL.
Row 3 "Nallamudi viewpoint" — "12.4 km · 31 min" — OPEN.

COMPONENTS: no map on this screen. The rows are the only content; the message block is the only large type.

STATES: in-region, shown above. Out-of-region variant: replace the message with "Wild Atlas covers Coimbatore district and 60 km around it." / "வைல்ட் அட்லஸ் கோயம்புத்தூர் மாவட்டம் மற்றும் 60 கி.மீ சுற்றளவை மட்டுமே கொண்டுள்ளது." and keep the same three rows and actions. Offline variant keeps the message and disables both actions.

DO NOT: no blank map, no "be the first to add one", no generic "something went wrong", no search-engine links, no suggestion to install an app, no illustration or mascot.

MOBILE CONSTRAINTS: 390px width, rows 44px tap targets, actions clear the safe area, no horizontal scroll.
```

**Gate:** UI 4

---

### S8 · Correction

**Platform:** mobile web 390×844

**Paste this:**
```
Design a mobile web screen for "Wild Atlas", a sourced bilingual Tamil/English travel dossier app for Coimbatore district. Use the global style block above.

SCREEN: Let anyone flag a wrong field in under twenty seconds, with no account.

LAYOUT (top to bottom):
1. Sheet at 90% height, #FFFFFF, 16px top radius, over the dossier dimmed at 40%.
2. Title row, 56px: "What is wrong?" / "என்ன தவறு?" at 24px/600, and a 44px close "×" at the right.
3. Subtitle, two lines, 14px #5C5F5A: "No account needed. A reviewer checks this within 48 hours." / "கணக்கு தேவையில்லை. 48 மணி நேரத்தில் ஒரு சரிபார்ப்பாளர் பார்க்கிறார்."
4. Field picker: five radio rows, 44px each, full width, 1px divider between: "Access window", "Location", "Last mile", "Sources", "Other". "Access window" is selected: #E4EEE9 background, 1px #1E4E3F border, 16px filled radio.
5. Textarea, 120px tall, 1px #E7E6E1 border, 10px radius, no placeholder. A live counter "0 / 2000" sits at the bottom-right inside the field, 12px #8E918B.
6. Optional email field, 44px, label "Email (optional)" at 12px uppercase, no helper text.
7. Primary button, 48px, full width, #1E4E3F: "Send report". 16px gap above the safe area.

CONTENT: use the exact strings above. Do not add a subject line, a name field, or a category description.

COMPONENTS: the field picker is a vertical radio group, not chips and not a dropdown. An off-screen honeypot field named "website" exists in the form but is never visible and never focusable.

STATES: idle (shown); submitting with the button showing a 16px spinner and reduced opacity; success where the sheet closes and a toast reads "Thank you. Your report is with a reviewer." / "நன்றி. உங்கள் தகவல் சரிபார்ப்பாளரிடம் உள்ளது."; rate limited showing "Too many reports. Try again in an hour."; error that preserves everything typed.

DO NOT: no login prompt, no account creation, no file upload, no map picker, no captcha widget, no required email, no "submit another" loop, no exposing the honeypot.

MOBILE CONSTRAINTS: 390px width, no horizontal scroll, safe-area insets, 44px targets.
```

**Gate:** UI 3

---

### S9 · Location explainer

**Platform:** mobile web 390×844

**Paste this:**
```
Design a mobile web screen for "Wild Atlas", a sourced bilingual Tamil/English travel dossier app for Coimbatore district. Use the global style block above.

SCREEN: Ask for location only after the visitor asks for something, and explain the trade in three short lines.

LAYOUT (top to bottom):
1. Bottom sheet, 320px tall, #FFFFFF, 16px top radius, over the map dimmed at 40%. Drag handle 36×4px.
2. Title, 24px/600: "Use your location?" / "உங்கள் இருப்பிடத்தைப் பயன்படுத்தவா?"
3. Three bullets, 16px/1.65, each with a 6px #1E4E3F dot and 12px gap:
   - "Used once, to sort places by distance." / "ஒருமுறை மட்டும் — தூரப்படி வரிசைப்படுத்த."
   - "Not stored. Not tracked in the background." / "சேமிக்கப்படாது. பின்னணியில் கண்காணிக்கப்படாது."
   - "For background alerts, link Telegram." / "பின்னணி அறிவிப்புகளுக்கு டெலிகிராமை இணைக்கவும்."
4. Primary button, 48px, full width, #1E4E3F: "Allow once" / "ஒருமுறை அனுமதி".
5. Secondary text button, 44px, centred, #5C5F5A, underlined: "Choose a base town instead" / "அடித்தள நகரத்தைத் தேர்ந்தெடு".

CONTENT: exactly these three bullets, in this order. The Telegram line is a statement, not a button.

COMPONENTS: no illustration, no map preview, no fake permission dialog mock, no toggle. The sheet is the whole ask.

STATES: prompt (shown); granted, where the map behind recenters and a 14px label reads "Straight-line distance" / "நேர் தூரம்"; denied, where the sheet is replaced by "Location off. Pick a base town — everything still works." in #5C5F5A; timeout, same as denied with no error styling.

DO NOT: no permission prompt on page load, no "always allow" option, no blue user dot before consent, no coordinates displayed anywhere, no blocking the map, no second modal stacked on top.

MOBILE CONSTRAINTS: 390px width, sheet clears the bottom safe area, both buttons 44px minimum, no horizontal scroll.
```

**Gate:** UI 4

---

### S10 · Link Telegram (web)

**Platform:** mobile web 390×844

**Paste this:**
```
Design a mobile web screen for "Wild Atlas", a sourced bilingual Tamil/English travel dossier app for Coimbatore district. Use the global style block above.

SCREEN: Show a four-character code and a way into Telegram, then wait visibly while the page confirms the link by itself.

LAYOUT (top to bottom):
1. Top bar, 56px: 44px back arrow, page title "Link Telegram" / "டெலிகிராமை இணை" at 18px/600, no menu.
2. Three numbered steps, each 64px tall: a 24px circle with "1", "2", "3" in #E4EEE9 and #1E4E3F, then the step text at 16px, 12px gap. Steps read exactly:
   Step 1 — "Open Telegram and press Start." / "டெலிகிராமைத் திறந்து Start அழுத்துங்கள்."
   Step 2 — "Enter this code in the chat." / "இந்தக் குறியீட்டை அரட்டையில் உள்ளிடுங்கள்."
   Step 3 — "Come back here. This page updates itself." / "இங்கே திரும்பி வாருங்கள். இந்தப் பக்கம் தானாக புதுப்பிக்கும்."
3. Code block, 96px tall, #F3F2EE, 12px radius, centred: "K7QP" at 40px/600, letter-spaced 8px, #1A1A18. A 44px "Copy" text button sits at the right edge.
4. Primary button, 48px, full width, #1E4E3F: "Open Telegram".
5. Countdown, 14px #8E918B, centred: "Expires in 4:58" / "4:58 இல் காலாவதியாகும்".
6. Status line, 44px, centred with a 12px pulsing dot #1E4E3F: "Waiting for Telegram…" / "டெலிகிராமிற்காக காத்திருக்கிறது…".
7. Unlink block at the bottom, only when linked: 1px top divider, "Unlink" / "இணைப்பை நீக்கு" as a 44px text button in #8C3A23.

CONTENT: the code is four characters from a 32-character set that excludes I, O, 0 and 1. Show "K7QP".

COMPONENTS: the code block is the only large element on the page. No QR code, no phone mock.

STATES: code shown (default); creating, where the code block holds four grey skeleton bars; expired, where the code turns #8E918B and the line reads "Code expired. Get a new one."; linked, where the code block and countdown are replaced by "Linked. At most 3 digests a day." / "இணைக்கப்பட்டது. நாளொன்றுக்கு அதிகபட்சம் 3 அறிவிப்புகள்." and the unlink block appears; error.

DO NOT: no QR code, no chat ID anywhere, no token in a URL, no auto-opening Telegram without a tap, no "scan to link", no countdown under 60 seconds, no dark panel.

MOBILE CONSTRAINTS: 390px width, no horizontal scroll, safe-area insets, 44px targets.
```

**Gate:** UI 5

---

### S11 · Telegram — link confirmation

**Platform:** Telegram chat (mobile)

**Paste this:**
```
Design a Telegram chat screen for "Wild Atlas", a sourced bilingual Tamil/English travel dossier product for Coimbatore district. Use the global style block above for colour, type and tone, but keep Telegram's own chat chrome: a 56px header with back arrow, a 40px circular avatar in #1E4E3F with "WA" in white, the name "Wild Atlas", and the subtitle "bot".

SCREEN: Bind this chat to a device only after the four-character code matches.

LAYOUT (top to bottom):
1. Telegram header, 56px, #FFFFFF, 1px bottom border.
2. Chat thread on #F3F2EE, 12px side padding, bubbles max 85% width, 12px radius, 8px vertical gap, timestamps 11px #8E918B at the bottom-right inside each bubble.
3. Bot bubbles left-aligned, #FFFFFF. User bubbles right-aligned, #E4EEE9.
4. Message input bar at the bottom, 48px, with a paperclip icon at the left and "Message" placeholder.
5. No inline keyboard on this screen. The reply is text only.

CONTENT — show this thread in order:
- Bot: "Open Wild Atlas → Settings → Telegram and press "Open Telegram" there. A bare link cannot be linked." with Tamil "வைல்ட் அட்லஸ் → Settings → Telegram திறந்து "Open Telegram" அழுத்துங்கள்." on a second line at 14px.
- User: "/start K7QP"
- Bot: "Enter the 4-character code shown in Wild Atlas." / "வைல்ட் அட்லஸில் காட்டப்படும் 4 எழுத்துக் குறியீட்டை உள்ளிடுங்கள்."
- User: "K7QP"
- Bot: "Linked. You will get at most 3 verified place digests a day." then a blank line, then a monospace line "/nearby /radius /pause /stop".

COMPONENTS: the four commands render on one line in 14px monospace, not as buttons and not as a list. No bold headline, no emoji, no card.

STATES: this success thread (shown); wrong code variant, where the last bot bubble reads "That code does not match. 2 attempts left." / "குறியீடு பொருந்தவில்லை. 2 முயற்சிகள் மீதம்."; expired token variant with the same bare-link message.

DO NOT: no inline keyboard, no "Connect" button, no QR code, no chat ID, no phone number request, no welcome image, no typing indicator animation in the mock, no second bot.

MOBILE CONSTRAINTS: 390px chat width, no horizontal scroll, safe-area insets, 44px buttons.
```

**Gate:** UI 5

---

### S12 · Telegram — live-location instruction

**Platform:** Telegram chat (mobile)

**Paste this:**
```
Design a Telegram chat screen for "Wild Atlas", a sourced bilingual Tamil/English travel dossier product for Coimbatore district. Use the global style block above for colour and type, but keep Telegram's own chat chrome: 56px header with back arrow, 40px circular avatar #1E4E3F with "WA", name "Wild Atlas", subtitle "bot".

SCREEN: Explain how the person starts live location themselves, and never imply the bot can start it.

LAYOUT (top to bottom):
1. Telegram header, 56px, white.
2. Chat thread on #F3F2EE: one user bubble at the right ("/nearby"), then one bot bubble at the left, #FFFFFF, 12px radius, max 85% width.
3. Bot bubble body, three paragraphs with 8px gaps:
   - "The bot cannot start live location for you — Telegram only lets you start it." at 16px, with Tamil "பாட் உங்கள் நேரடி இருப்பிடத்தைத் தொடங்க முடியாது — டெலிகிராம் மட்டுமே அதைத் தொடங்க அனுமதிக்கும்." at 14px beneath.
   - "Attach → Location → Share Live Location → 1 hour." at 16px, with Tamil "இணைப்பு → இருப்பிடம் → நேரடி இருப்பிடத்தைப் பகிர் → 1 மணி." at 14px beneath.
   - "Or tap below to send one location now." at 16px, with Tamil "அல்லது இப்போது ஒரு இருப்பிடத்தை அனுப்ப கீழே அழுத்துங்கள்." at 14px beneath.
4. Below the thread, a custom REPLY KEYBOARD docked above the message input: one full-width button, 48px, #FFFFFF, 1px #E7E6E1 border, 10px radius, label "Send current location" / "தற்போதைய இருப்பிடத்தை அனுப்பு", with a 16px location pin at the left.
5. Message input bar, 48px, with "Message" placeholder, no attachment tray open.

CONTENT: the three paragraphs are statements, not steps with numbers. Do not add a fourth line.

COMPONENTS: this is a reply keyboard, not an inline keyboard — it sits above the input field, spans the chat width, and replaces the phone keyboard. No inline buttons under the bubble.

STATES: instruction shown (default); an expired session re-sends the same message and never shows stale places.

DO NOT: no claim that the bot starts, extends, or monitors location, no "Enable location" toggle, no map thumbnail, no coordinates, no inline keyboard, no permission dialog mock, no countdown.

MOBILE CONSTRAINTS: 390px chat width, no horizontal scroll, safe-area insets, 44px buttons.
```

**Gate:** UI 5

---

### S13 · Telegram — arrival digest

**Platform:** Telegram chat (mobile)

**Paste this:**
```
Design a Telegram chat screen for "Wild Atlas", a sourced bilingual Tamil/English travel dossier product for Coimbatore district. Use the global style block above for colour and type, but keep Telegram's own chat chrome: 56px header with back arrow, 40px circular avatar #1E4E3F with "WA", name "Wild Atlas", subtitle "bot".

SCREEN: One digest with up to three verified places near the person, then two button rows.

LAYOUT (top to bottom):
1. Header, 56px, white.
2. One bot bubble, left, #FFFFFF, 12px radius, max 92% width, 16px padding, on #F3F2EE.
3. Inside the bubble: bold headline 16px; italic meta 14px #5C5F5A; 1px divider; three place blocks with 12px between; 1px divider; italic footnote 13px.
4. Each block: bold numbered name 15px, em dash, short descriptor on the same line; then distance, bold status word and verified date at 14px #8E918B.
5. Below the bubble, an inline keyboard: two rows, 44px buttons, 6px gap, white, 1px #E7E6E1 border, labels #1E4E3F at 14px.
6. Message input bar at the bottom, 48px.

CONTENT — render this text exactly:
"🌿 3 verified places near you" in bold
"Valparai · within 15 km" in italic

"1. Puthuthottam — tea-estate ecology"
"4.1 km · OPEN · verified 12 Oct 2026"

"2. Chinnakallar — among the wettest places in India"
"9.8 km · SEASONAL · verified 02 Nov 2026"

"3. Nallamudi viewpoint — least-documented view"
"12.4 km · OPEN · verified 02 Nov 2026"

"Distances are road distance to access point." in italic

Keyboard row 1: [ Explore ] [ Directions ]
Keyboard row 2: [ 👍 Useful ] [ 👎 Not now ] [ ⛔ Closed ] [ ✏️ Wrong ]

COMPONENTS: the leaf in the headline is the only emoji. Status words are bold text, not coloured chips. No photos, no link preview, no map.

STATES: the digest; a two-place variant headed "2 verified places near you"; a one-place variant.

BUDGET: under 900 characters, hard cap 1 024. Keep the body exactly as written; add no greeting, sign-off or second paragraph.

DO NOT: no coordinates, no map, no live-location pin, no photos, no link preview, no more than three places, no more than two keyboard rows, no coloured status chips, no "unsubscribe" footer.

MOBILE CONSTRAINTS: 390px chat width, no horizontal scroll, safe-area insets, 44px buttons.
```

**Gate:** UI 5

---

### S14 · Telegram — feedback callbacks

**Platform:** Telegram chat (mobile)

**Paste this:**
```
Design a Telegram chat screen for "Wild Atlas", a sourced bilingual Tamil/English travel dossier product for Coimbatore district. Use the global style block above for colour and type, but keep Telegram's own chat chrome: 56px header with back arrow, 40px circular avatar #1E4E3F with "WA", name "Wild Atlas", subtitle "bot".

SCREEN: Show what happens after each of the four feedback buttons is tapped — short, calm acknowledgements, nothing that changes a place by itself.

LAYOUT (top to bottom):
1. Telegram header, 56px, white.
2. Chat thread on #F3F2EE. First, a compact copy of the digest bubble: bold headline and one italic meta line, 96px tall, no place blocks.
3. Under that bubble, the inline keyboard row of four buttons, 44px tall, white, 1px #E7E6E1 border: [ 👍 Useful ] [ 👎 Not now ] [ ⛔ Closed ] [ ✏️ Wrong ].
4. Then four bot bubbles stacked in the thread, #FFFFFF, 12px radius, max 85% width, each 44–56px tall, in this order:
   - "Thanks — noted." / "நன்றி — பதிவு செய்யப்பட்டது."
   - "Noted. This place is hidden for 7 days." / "பதிவு செய்யப்பட்டது. இந்த இடம் 7 நாட்களுக்கு மறைக்கப்படும்."
   - "Thanks. We will check whether it is closed." / "நன்றி. மூடப்பட்டுள்ளதா என்பதைச் சரிபார்ப்போம்."
   - "Thanks. A reviewer will look at this place." / "நன்றி. ஒரு சரிபார்ப்பாளர் இதைப் பார்ப்பார்."
5. Message input bar, 48px, "Message" placeholder.

CONTENT: each Tamil line sits on a second line at 14px inside the same bubble. No bold, no emoji in the replies.

COMPONENTS: the four replies are separate bubbles, not one message with four lines. The buttons are the only coloured element on the screen.

STATES: the four acknowledgements shown as a reference thread; a variant where only one reply follows the digest, for a realistic single tap.

DO NOT: no "place updated" claim, no "removed" claim, no rating stars, no follow-up question, no correction form link, no coordinates, no undo button.

MOBILE CONSTRAINTS: 390px chat width, no horizontal scroll, safe-area insets, 44px buttons.
```

**Gate:** UI 5

---

### S15 · Alert settings

**Platform:** mobile web 390×844

**Paste this:**
```
Design a mobile web screen for "Wild Atlas", a sourced bilingual Tamil/English travel dossier app for Coimbatore district. Use the global style block above.

SCREEN: Set radius, quiet hours, pause and budget for Telegram digests — and be honest about what is stored.

LAYOUT (top to bottom):
1. Top bar, 56px: 44px back arrow, title "Alerts" / "அறிவிப்புகள்" at 18px/600.
2. Link status card, 72px, #E4EEE9, 12px radius: "Linked as @kumar_v" 15px/600 with a 8px #1E7A4C dot, and a 44px "Link Telegram" text button at the right.
3. "Notifications" row, 56px, with a 48×28px toggle in the on position, #1E4E3F.
4. "Radius" / "சுற்றளவு" label, then a 44px segmented control: "5", "10", "15", "25 km", with "15" selected.
5. "Quiet hours" / "அமைதி நேரம்" label, then two 44px time fields side by side reading "22:00" and "07:00" with a dash between, then the hint "Overnight" at 12px #8E918B.
6. "Pause" row, 56px: label "Pause" at 16px, and a 44px outline button "Pause for 24 hours" / "24 மணி நேரம் இடைநிறுத்து".
7. "Today's budget" block, 64px: "1 of 3 digests sent" / "3 இல் 1 அறிவிப்பு அனுப்பப்பட்டது" at 14px, and three 32px segments beneath, one filled #1E4E3F and two #E7E6E1.
8. "Digest only" block, 64px, #F3F2EE, 10px radius: "One message with up to 3 places. Never three messages." at 14px #5C5F5A.
9. "Privacy" block: "No coordinates stored. Distance is saved as a band only." at 14px, with Tamil "இருப்பிட ஒருங்கிணைப்புகள் சேமிக்கப்படுவதில்லை." beneath at 12px.
10. "Unlink Telegram" as a 44px text button in #8C3A23 at the bottom, left-aligned.

CONTENT: exactly the strings. The budget is a count, not a progress ring.

COMPONENTS: rows are separated by 1px #E7E6E1 dividers, no cards except the link status and the digest note. Segmented controls share one border.

STATES: linked (shown); not linked, where the radius and quiet-hours blocks drop to 40% opacity and a line reads "Link Telegram to set alerts"; paused, with a #FBF1DF banner and the button changing to "Resume now"; saving, with an optimistic toggle and a 12px "Saving…" line.

DO NOT: no map, no coordinate display, no location history list, no per-place alert toggles, no email or SMS channel, no "test notification" button, no destructive action at the top.

MOBILE CONSTRAINTS: 390px width, no horizontal scroll, safe-area insets, 44px targets.
```

**Gate:** UI 5

---

### S16 · Saved places

**Platform:** mobile web 390×844

**Paste this:**
```
Design a mobile web screen for "Wild Atlas", a sourced bilingual Tamil/English travel dossier app for Coimbatore district. Use the global style block above.

SCREEN: Show what this device has saved, and offer one way to turn it into something that works without signal.

LAYOUT (top to bottom):
1. Top bar, 56px: 44px back arrow, title "Saved" / "சேமிக்கப்பட்டவை" at 24px/600, count "4" at 14px #8E918B beside it.
2. Subtitle line, 14px #5C5F5A: "Saved on this device only." / "இந்தச் சாதனத்தில் மட்டும் சேமிக்கப்படுகிறது."
3. List of four rows, 88px each, 1px #E7E6E1 divider: 64px square thumbnail at the left with 10px radius, name at 18px/600, meta "Valparai · 34 km" at 14px #5C5F5A, access badge at the right, and a 44px "Remove" text button at the far right in #5C5F5A.
4. One row carries an extra badge under the name: "In your offline pack" in #E4EEE9 with #1E4E3F text.
5. Sticky footer, 88px with safe area: full-width primary button "Build a trip pack" / "பயணத் தொகுப்பை உருவாக்கு", 48px, #1E4E3F.

CONTENT:
- "சிறுவாணி அருவி / Siruvani Falls" — "Valparai · 34 km" — OPEN.
- "Chinnakallar" — "Valparai · 9.8 km" — SEASONAL — "In your offline pack".
- "Puthuthottam" — "Valparai · 4.1 km" — OPEN.
- "Nallamudi viewpoint" — "Valparai · 12.4 km" — OPEN.

COMPONENTS: rows are not cards; dividers do the work. "Remove" is a text button, never a red filled button. No checkboxes, no multi-select mode, no drag handles.

STATES: populated (shown); empty, where the list is replaced by a centred block reading "Nothing saved yet. Tap Save on any dossier." / "இன்னும் எதுவும் சேமிக்கப்படவில்லை. ஏதேனும் ஒரு விவரத்தில் Save அழுத்துங்கள்."; a row whose slug is in a downloaded pack, carrying the "In your offline pack" badge.

DO NOT: no account prompt, no cloud sync, no share-all, no coordinates, no map, no sort control, no search within saved, no "sign in to keep your saves".

MOBILE CONSTRAINTS: 390px width, no horizontal scroll, safe-area insets, 44px targets.
```

**Gate:** UI 6

---

### S17 · Trip declaration + pack

**Platform:** mobile web 390×844

**Paste this:**
```
Design a mobile web screen for "Wild Atlas", a sourced bilingual Tamil/English travel dossier app for Coimbatore district. Use the global style block above.

SCREEN: Download the dossiers and map tiles before the drive, while the connection is still good.

LAYOUT (top to bottom):
1. Top bar, 56px: 44px back arrow, title "Trip pack" / "பயணத் தொகுப்பு" at 18px/600.
2. Corridor block, 72px: "Coimbatore → Valparai" at 24px/600, and "Download before you drive." / "புறப்படும் முன் பதிவிறக்குங்கள்." at 14px #5C5F5A beneath.
3. Dates row, 44px: label "Dates" at 12px uppercase, then a 44px field reading "12 Oct 2026 → 14 Oct 2026", and a 12px hint "Optional but recommended." in #8E918B.
4. Pack summary card, 88px, #F3F2EE, 12px radius, centred: "6 dossiers · 38 MB map · 22 towns" at 16px/600, with Tamil "6 விவரங்கள் · 38 எம்பி வரைபடம் · 22 நகரங்கள்" at 13px beneath.
5. Primary button, 48px, full width, #1E4E3F: "Download pack" / "தொகுப்பைப் பதிவிறக்கு".
6. Progress block, 64px, hidden until download starts: a 6px track #E7E6E1 with a #1E4E3F fill at 42%, a 14px progress line, and a 44px "Cancel" text button at the right.
7. Storage line, 14px #5C5F5A: "Uses about 40 MB. 2.1 GB free."
8. "Delete pack" as a 44px text button in #8C3A23, disabled at 40% opacity when nothing is downloaded.
9. Note, 14px #5C5F5A: "Works in airplane mode. Distances are precomputed." with Tamil "விமானப் பயன்முறையிலும் வேலை செய்யும்." beneath at 13px.

CONTENT: use the exact strings. The summary uses middle dots, not commas.

COMPONENTS: one primary action on the page. The progress bar is a thin line, not a circle. No map preview of the corridor, no stop list.

STATES: not downloaded (shown, progress block hidden); downloading at 42% with cancel; downloaded, showing a version and date line with the download button removed; quota warning "Not enough space. Free 50 MB and retry." in a #FBF1DF note; metered connection warning with a confirm action.

DO NOT: no prompt on first session, no automatic download, no background sync claim, no account requirement, no hotel or fuel stop list, no map, no second primary button.

MOBILE CONSTRAINTS: 390px width, no horizontal scroll, safe-area insets, 44px targets.
```

**Gate:** UI 6

---

### S18 · Offline state

**Platform:** mobile web 390×844

**Paste this:**
```
Design a mobile web screen for "Wild Atlas", a sourced bilingual Tamil/English travel dossier app for Coimbatore district. Use the global style block above.

SCREEN: Prove the product still works with no signal — text, Tamil, badge, stat row and sources all readable.

LAYOUT (top to bottom):
1. Thin banner, 32px, #F3F2EE, 1px bottom border, centred 12px #5C5F5A: "Offline — showing your saved trip pack." / "இணையமில்லை — சேமித்த பயணத் தொகுப்பு காட்டப்படுகிறது."
2. Dossier header, as on the dossier screen: "சிறுவாணி அருவி" 32px/600, "Siruvani Falls" 18px, chips "Water" and "Nature", badge "OPEN", plus an "Offline copy" badge in #F3F2EE with #5C5F5A text.
3. Hero image replaced by a neutral #F3F2EE block, 390×180, with a 24px landscape glyph and a 12px neutral caption beneath — never a broken image icon.
4. Stat row, exactly 3 slots: "34 km" / "VALPARAI → ACCESS", "1 h 20 m" / "DRIVE", "4.2 km" / "LAST MILE", all still legible.
5. "The Story" heading and two paragraphs of body text, fully rendered.
6. "Sources" table, three rows, fully rendered, with the 12px line "Last verified 12 Oct 2026 by R. Kumar".
7. Map area, 200px, showing cached tiles at reduced contrast with a 12px neutral note. If tiles are absent, hide the map and keep the note.
8. Bottom block for an uncached place: "This place is not in your pack." / "இந்த இடம் உங்கள் தொகுப்பில் இல்லை." at 16px, with a 44px text link to Saved places.

CONTENT: no spinner anywhere. Nothing on the page suggests a retry is required to read.

COMPONENTS: the banner is the only chrome added. The "Offline copy" badge uses the same shape as the access badge but a neutral colour.

STATES: cached dossier (shown); uncached dossier, where sections 2–7 are replaced by the message in section 8; back online, where a toast reads "Back online." / "மீண்டும் இணைப்பில்." and no reload happens.

DO NOT: no browser error page, no broken image icon, no endless spinner, no blocking retry modal, no stat row removed, no "check your connection" full-screen state, no greyed-out body text.

MOBILE CONSTRAINTS: 390px width, no horizontal scroll, safe-area insets, 44px targets.
```

**Gate:** UI 6

---

### S19 · Method

**Platform:** mobile web 390×844

**Paste this:**
```
Design a mobile web screen for "Wild Atlas", a sourced bilingual Tamil/English travel dossier app for Coimbatore district. Use the global style block above.

SCREEN: Explain how verification works. This is a trust surface, not a paragraph.

LAYOUT (top to bottom) — nine sections in this order:
1. Title block: "How Wild Atlas is verified" / "வைல்ட் அட்லஸ் எப்படி சரிபார்க்கப்படுகிறது" at 32px/600, then the lede "Every fact has a source. Every source has a grade." / "ஒவ்வொரு தகவலுக்கும் ஆதாரம். ஒவ்வொரு ஆதாரத்துக்கும் தரம்." at 18px #5C5F5A.
2. Heading: What "verified" means, then two short paragraphs at 16px: a human checked access, not just existence.
3. "Source grades" heading, then a table with four rows A, B, C, D: a 24px square grade chip at the left and one 14px description line per row. No zebra striping, 1px dividers only.
4. "Fact vs lore" heading, then a two-part comparison: a WHITE block labelled "What is documented" and a TINTED #E4EEE9 block labelled "What is told", side by side on desktop and stacked on mobile, each with two lines of sample text.
5. "The 180-day rule" heading, then a #FBF1DF callout with a 1px #A06A0B border: "A place disappears after 180 days without re-verification." / "180 நாட்களுக்கு மறுசரிபார்ப்பு இல்லாவிட்டால் இடம் நீங்கும்."
6. "Corrections" heading, then one paragraph: anyone can report a wrong field, a reviewer checks within 48 hours.
7. "What we refuse to publish" heading, then three short lines, each with a 16px dash: restricted locations, sacred-site promotion, unsafe access.
8. "Privacy" heading, then one paragraph: no coordinates stored, distance saved as a band.
9. Closing block: "No AI-written descriptions." / "AI எழுதிய விவரங்கள் இல்லை." at 20px/600, then a 14px contact line.

CONTENT: one column, max 68 characters per line. No byline, no dates.

COMPONENTS: headings 20px/600 with 32px top margin. The grades table is the only table. The fact-versus-lore pair must reuse the exact treatment from the dossier: white documented, tinted told.

STATES: English default; Tamil variant, same order; reduced-motion variant.

DO NOT: no marketing headline, no team photos, no testimonials, no statistics counters, no "learn more" cards, no newsletter signup, no dark section, no accordion that hides the grades.

MOBILE CONSTRAINTS: 390px width, no horizontal scroll, safe-area insets, 44px targets.
```

**Gate:** UI 3
