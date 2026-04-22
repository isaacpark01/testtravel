# Dropped — Documentation

**Live site:** https://pintrip.netlify.app *(link intentionally removed from UI — local dev only)*
**Local dev:** `python -m http.server 9056` → http://localhost:9056

A mobile-first travel planning PWA. Two surfaces: **index.html** (explore/browse) and **planner.html** (plan your trip).

---

## File Structure

```
itinerary-app/
├── index.html         # Full explore page — hero, city browser, deals, group boards
├── app.html           # Legacy alias (same content as index.html — kept for redirects)
├── planner.html       # Trip planner — Saves / Itinerary / Discover / Rewards / Map
├── reset-password.html# Password reset page — handles Supabase PASSWORD_RECOVERY flow
├── planner.js         # All planner logic (see function index below)
├── travel-apps.js     # CITY_TRAVEL_APPS + CITY_CURRENCY — best apps & currency per city (34 cities)
├── styles.css         # Global CSS — dark teal theme
├── app.js             # index.html logic — auth, city browser, deals, boards, essentials
├── data.js            # Static city data — 34 destinations + credit card rewards
├── config.js          # Supabase credentials (URL + anon key — governed by RLS)
├── robots.txt         # Disallows all crawlers (private app — noindex)
├── admin.html         # Admin dashboard — users, boards, ideas management
├── admin.js           # Admin logic — auth gate, CRUD, event delegation
├── admin-setup.sql    # SQL to set up admin user
├── schema.sql         # Supabase DB schema + RLS policies
├── schema-fix.sql     # Schema migration patches
├── i18n.js            # Home page translations — 11 languages, renderMenu, applyTranslations
├── reveal.js          # Scroll-reveal (IntersectionObserver) + animated stat counters
├── privacy.html       # Privacy Policy (GDPR/CCPA compliant, 10 sections)
├── terms.html         # Terms of Service (12 sections)
├── 404.html           # Branded 404 page
├── manifest.json      # PWA manifest — name, icons, share_target
├── _headers           # Netlify security headers (CSP, HSTS, X-Frame-Options)
├── _redirects         # Netlify URL routing rules
├── .gitignore         # Excludes .netlify, build scripts, progress files
├── photos/            # Locally downloaded place photos (Yelp/Wikipedia/Unsplash)
└── DOCUMENTATION.md   # This file
```

**Build/helper scripts** (gitignored, not part of the deployed app):
`fetch-*.js`, `fix-photos.js`, `build-photo-db.js`, `rebuild-photos.js`, `add-descriptions.js`, `gen-wiki.js`, `wiki-photos-*.js`, `*-progress*.json`, `all-places.json`

---

## Features

### Planner (`planner.html`)

| Feature | Description |
|---|---|
| **Trips** | Create multiple trips, switch via dropdown, each with city, dates, days, and optional budget |
| **Day Itinerary** | Drag-and-drop cards per day; add from Discover, Saves, or by name search |
| **Day Health Score** | Per-day energy level (😌 Chill / ⚡ Moderate / 🔥 Packed), estimated hours, estimated spend — shown as coloured dot on date pill + summary bar above cards |
| **Trip Budget Tracker** | Set a total budget when creating a trip; live progress bar in hero shows planned spend vs. budget across all days |
| **Saves (Wishlist)** | Heart places to a per-trip wishlist; plan them to specific days later |
| **Vibe Tags** | Auto-generated labels: 💎 Hidden Gem, ⚠️ Tourist Trap, 💸 Budget Find, ❤️ Romantic, 🌿 Outdoor, 🍜 Foodie Fave, 📸 Instagrammable, 🌟 Local Fave, ✨ Splurge, 🔥 Worth the Hype |
| **Discover** | Browse all activities + food for your trip's city; filter by category and by vibe |
| **Rewards** | 💳 Credit card rewards hub — top travel cards, city-specific point strategies, step-by-step checklist, expandable blog-style guides |
| **Place Profile Modal** | Full detail view with photo slideshow, description, tip, rating, price, social links |
| **Place Descriptions** | Every place and restaurant has a short description (`desc` field) shown in Discover cards and profile modal |
| **Star Ratings** | HTML entity star ratings (★) with opacity-based styling for half and empty stars |
| **Rating Source Badges** | Small "⭐ Yelp" or "🔍 Google" badge shown next to every rating — food items show Yelp, activities show Google |
| **Local Gems** | Hole-in-the-wall spots flagged with `localGem: true` in data.js across all 16 cities; shown with "🔒 Local Gem" badge in Discover cards and profile modal |
| **Discover Search** | Debounced text search (200ms) within the discover tab filtering across name, description, cuisine, and tip fields |
| **Discover Sort** | Sort discover results by: ⭐ Top Rated (default), 💸 Price Low→High, 💎 Price High→Low, A→Z |
| **Card Badges** | "🔥 Top Pick" on highest-rated items, "💰 Budget" on items ≤$12 |
| **Trending Social Section** | Auto-generated horizontal scroll of TikTok and Instagram search deep-links for the current city and its top places |
| **Card Animations** | Staggered fadeInUp entrance animation (35ms per card) when discover tab loads |
| **Multi-Language (i18n)** | 11 languages via 🌐 globe picker in the nav bar: English, Spanish, French, Japanese, Korean, Chinese, Portuguese, Arabic, Hindi, Vietnamese, Filipino. Preference saved to localStorage. Full RTL layout for Arabic. |
| **Social Import** | Save places seen on Instagram/TikTok via Quick Add, Bulk Import, or PWA Share Target |
| **Social Badges** | Saved places show where they came from: 📸 Instagram, 🎵 TikTok, 🔖 Saved |
| **Smart Day Insights** | Warns when a day is overloaded, has no food, has no activities, has tourist traps, or celebrates a balanced day |
| **Best Time of Day** | 🌅 🌙 ☀️ badges derived from tip text keywords |
| **Share My Trip** | Formats entire itinerary as copyable text — Web Share API on mobile, clipboard on desktop |
| **Export Itinerary** | 📤 Export button opens a print-ready HTML page (auto-triggers print dialog) with full itinerary, wishlist, and spend summary — saves as PDF via browser print |
| **Smart Packing List** | Auto-generated checklist based on destination type + planned activities |
| **Map** | Leaflet + OpenStreetMap — pins for itinerary (teal), saves (pink), discover (grey). Shows "Map unavailable" if Leaflet CDN fails. |
| **Search** | Type to search all cities' places; hit Enter to add top result or a custom name |
| **Travel Guide** | ✈ Travel Guide filter in Discover tab — shows best maps app, transit card, ride-hailing, food/reservation apps, payment tips, and SIM advice per city. Powered by `travel-apps.js` CITY_TRAVEL_APPS (34 cities). |
| **Get There button** | 📍 Get there button on each itinerary card — opens the city-appropriate map app (Naver Map for Seoul, Google Maps elsewhere) pre-filled with the place name. |
| **File Import** | 📂 Import Places in the Saves tab supports drag-and-drop or file picker: Google Maps Takeout `Saved Places.json`, TikTok `Favorite Videos.json`, Instagram `saved_posts.json`, and ZIP archives. Parsed in-browser (no upload). Shows review checklist before adding to saves. |
| **Budget Recommendations** | When a trip budget is set, a scrollable row of chips appears below the budget bar showing top-rated food + activities priced within the per-day budget. Updates live as cards are added/removed. |

### Explore (`index.html`)

| Feature | Description |
|---|---|
| **City Browser** | 34 cities with Activities, Food, Transit, Pack, Essentials tabs; live search bar filters places by name, tip, and cuisine |
| **Local Language Phrases** | All 34 cities show local language/dialect, practical phrases, romanized pronunciation, and audio playback via Web Speech API |
| **Voice Gender Picker** | ♀ Female / ♂ Male voice toggle for phrase audio — matches browser voices by known name keywords |
| **City Travel Apps** | Essentials tab shows best maps, transit card, ride-hailing, food apps, payment tips, and SIM advice per city (34 cities via `travel-apps.js`) |
| **Live Currency Rates** | Essentials tab fetches live USD exchange rate from Frankfurter API (no key required). Displays rate + date. USD cities show "no exchange needed". Rates cached per session. |
| **Currency Exchange Finder** | "📍 Find currency exchange in {city}" button deep-links to Google Maps search for currency exchange locations. |
| **Images on All Tiles** | Every activity and food tile has a photo; onerror fallback chain: item photo → city hero |
| **Flight Deals** | Deep-links to Google Flights, Kayak, Skyscanner, Expedia |
| **Rental Cars** | Kayak, Google Cars, Enterprise, Hertz |
| **Budget Estimator** | Three travel styles × configurable trip length → estimated spend |
| **Group Trip Board** | Create boards, pin cities, vote up/down (Supabase realtime) |
| **User Auth** | Email/password via Supabase — sign up, sign in, forgot password (reset email via Supabase) |
| **Cookie Consent** | GDPR banner stored in localStorage; slide-up animation; links to Privacy Policy |
| **SEO / Structured Data** | Open Graph, Twitter Card, JSON-LD WebApplication schema, canonical URL, sitemap-ready meta |
| **Scroll Animations** | `reveal.js` — IntersectionObserver fade-up on section headers and cards; animated stat counters |
| **Legal Pages** | `privacy.html` (GDPR/CCPA, 10 sections) + `terms.html` (12 sections) + `404.html` (branded) |

### Admin (`admin.html`)

| Feature | Description |
|---|---|
| **Auth Gate** | DB-verified `is_admin` check — no client-side-only bypass |
| **Users Tab** | Ban/unban, grant/revoke admin, delete all user content |
| **Boards Tab** | Delete boards (cascades to ideas and votes) |
| **Ideas Tab** | Delete individual ideas and their votes |
| **Stats Bar** | Total users, boards, ideas, votes |

---

## Security

### XSS Prevention
- `esc(s)` / `escHtml(s)` — always used for HTML content and attribute values
- `jsq(s)` — used for strings inside single-quoted `onclick='...'` handlers (including all trip/day/card UUIDs)
- Never inject `item.name`, `item.tip`, city names, user data, or imported file data raw into `innerHTML`
- Imported file data (Google Maps, TikTok, Instagram) is parsed in-browser — nothing is uploaded to a server

### Supabase
- Anon key in `config.js` is safe to commit — it has no elevated privileges
- All DB access is governed by Row-Level Security (RLS) policies in `schema.sql`
- Admin access requires DB-verified `is_admin` flag — not client-side-only

### Content Security Policy (`_headers`)
- CSP header set by Netlify via `_headers` file
- `unsafe-inline` required for inline event handlers — future refactor to `addEventListener` would allow removing it
- `HSTS` and `X-Frame-Options: DENY` set

### localStorage
- All `getStore()` / `savePlans()` calls are wrapped in `try/catch` — gracefully handles private browsing and storage quota errors
- Storage key: `dropped_v2` (unified across `app.js` and `planner.js`)

---

## Tech Stack

- **Frontend:** Vanilla HTML + CSS + JS — no build step, no framework
- **Audio:** Web Speech API (`window.speechSynthesis`) — built into all modern browsers
- **Map:** [Leaflet.js](https://leafletjs.com) + OpenStreetMap
- **Storage:** `localStorage` key `dropped_v2` (planner state persists across sessions)
- **Auth + Database:** [Supabase](https://supabase.com) (Postgres + RLS) — used by index.html group boards and admin.html
- **Hosting:** [Netlify](https://netlify.com) (static deploy)
- **Photos:** Local downloads in `/photos/` + Unsplash CDN (curated `PHOTO_MAP` 292 entries + keyword `CATEGORY_PHOTOS` 71 entries)
- **Fonts:** Google Fonts — Inter

---

## Data Model

### Trip (localStorage)
```js
{
  id:         "uuid",
  name:       "Tokyo Summer 2026",
  cityId:     "tokyo",
  start_date: "2026-07-10",   // optional
  budget:     800,             // optional, USD
  days: [
    {
      id:    "uuid",
      num:   1,
      cards: [
        {
          id:         "uuid",
          name:       "Senso-ji Temple",
          cityId:     "tokyo",
          cityName:   "Tokyo",
          category:   "activity",
          rating:     4.8,
          price:      0,
          duration:   "1-2 hrs",
          tip:        "Go at 6am",
          photo:      "photos/senso-ji.jpg",
          note:       "",
        }
      ]
    }
  ],
  saves: [
    {
      id:           "uuid",
      name:         "Ichiran Ramen",
      cityId:       "tokyo",
      cityName:     "Tokyo",
      category:     "food",
      rating:       4.8,
      price:        12,
      photo:        "https://images.unsplash.com/photo-...",
      socialSource: "instagram",
      note:         "seen on @foodtokyo",
    }
  ]
}
```

### City (`data.js`)
```js
{
  id:        "nyc",
  name:      "New York City",
  country:   "USA",
  tagline:   "The City That Never Sleeps",
  image:     "https://images.unsplash.com/...",
  iata:      "JFK",
  packType:  "city_usa",
  activities: [{ name, price, rating, duration, tip, desc, photo }],
  // activities always render "🔍 Google" source badge
  food:       [{ name, price, rating, cuisine, tip, desc, photo, localGem? }],
  // food always renders "⭐ Yelp" source badge; localGem: true adds "🔒 Local Gem" badge
  // Each city has ~10 restaurants per cuisine genre (6,418 total across 34 cities)
  // New items appended via JSON.stringify — both `cuisine: "..."` and `"cuisine":"..."` formats are valid JS and work identically
  transport:  [{ name, price, rating, type, tip }],
}
```

### Credit Card Rewards (`data.js`)
```js
REWARDS_CARDS       // 6 top travel credit cards with earn rates, bonuses, perks
CITY_REWARDS_TIPS   // 34 cities × 3 card-specific tips per city
AIRLINE_REWARDS     // 14 airlines — best card, earn rate, hub cities, partner airlines
REWARDS_BLOG        // 4 expandable blog articles on points strategy
REWARDS_CHECKLIST   // 15-step points maximization checklist
```

### City Travel Apps (`travel-apps.js`)
```js
CITY_TRAVEL_APPS = {
  nyc: {
    bestMap: 'Citymapper',          // best single map app for this city
    maps:    [{ n, note, star }],   // star:true = recommended default
    transit: { card, apps, tip },   // card = physical pass to buy; tip = key transit advice
    ride:    [{ n, note, star }],   // star:true = use app, not street hailing
    food:    [{ n, note }],         // ordering & reservation apps
    pay:     'string',              // payment advice (cashless vs cash)
    sim:     'string',              // SIM/connectivity recommendation
    tip:     'string',              // single most important travel tip
  },
  // ... all 34 cities
}

CITY_CURRENCY = {
  nyc:   { code: 'USD', name: 'US Dollar',       symbol: '$'  },
  paris: { code: 'EUR', name: 'Euro',             symbol: '€' },
  tokyo: { code: 'JPY', name: 'Japanese Yen',     symbol: '¥' },
  // ... all 34 cities
}
```

### Live Currency Rate (`app.js`)

`fetchCurrencyRate(cityId)` — fetches `https://api.frankfurter.app/latest?from=USD&to={CODE}` and caches the result in `_currencyRateCache`. USD cities return immediately with `{ usd: true }` — no fetch needed.

`renderCurrencySection(cityId)` — renders the currency section HTML with a loading placeholder, then calls `fetchCurrencyRate()` async and patches the DOM with the live rate. Also renders a Google Maps link for finding currency exchange locations in the city.

---

## Photo System

Photos use a cascading lookup in `renderCards()` (app.js) and `getPhoto()` (planner.js):

**app.js (index.html tiles):**
1. `item.photo` — explicit photo field on the place object in `data.js`
2. `getSpotPhoto(name, cityName)` — PHOTO_MAP keyword lookup
3. City hero image (`currentCity.image`) — always a valid Unsplash URL

`onerror` handler chains two levels: first failure loads city hero; second failure sets `onerror=null` to stop the loop.

```js
onerror="if(!this._fb){this._fb=true;this.src='${cityImgSrc}'}else{this.onerror=null}"
```

**planner.js (planner.html cards):**
1. `item.photo` (via `_discCache`)
2. `PHOTO_MAP` — 292 place-name keyword → Unsplash photo ID entries
3. `CATEGORY_PHOTOS` — 71 cuisine/type keyword fallbacks
4. City hero image
5. Generic travel fallback

---

## Local Language / Audio System (`app.js`)

### `CITY_LANGUAGES`

Object keyed by city ID. Supports 34 cities across 16 languages/dialects.

```js
CITY_LANGUAGES = {
  // International — native language phrases with romanized pronunciation
  paris:        { name: 'French 🇫🇷',                bcp47: 'fr-FR', phrases: [...] },
  barcelona:    { name: 'Spanish / Catalan 🇪🇸',     bcp47: 'es-ES', phrases: [...] },
  tokyo:        { name: 'Japanese 🇯🇵',               bcp47: 'ja-JP', phrases: [...] },
  bali:         { name: 'Bahasa Indonesian 🇮🇩',      bcp47: 'id-ID', phrases: [...] },
  neworleans:   { name: 'Louisiana French Creole 🎷', bcp47: 'fr-FR', phrases: [...] },
  sanfrancisco: { name: 'Cantonese 🇨🇳',              bcp47: 'zh-HK', phrases: [...] },
  chicago:      { name: 'Polish 🇵🇱',                  bcp47: 'pl-PL', phrases: [...] },
  london:       { name: 'English (British) 🇬🇧',      bcp47: 'en-GB', phrases: [...] },
  rome:         { name: 'Italian 🇮🇹',                bcp47: 'it-IT', phrases: [...] },
  amsterdam:    { name: 'Dutch 🇳🇱',                  bcp47: 'nl-NL', phrases: [...] },
  sydney:       { name: 'English (Australian) 🇦🇺',   bcp47: 'en-AU', phrases: [...] },
  dubai:        { name: 'Arabic (Gulf) 🇦🇪',           bcp47: 'ar-AE', phrases: [...] },
  bangkok:      { name: 'Thai 🇹🇭',                   bcp47: 'th-TH', phrases: [...] },
  singapore:    { name: 'Singlish / English 🇸🇬',     bcp47: 'en-SG', phrases: [...] },
  lisbon:       { name: 'Portuguese 🇵🇹',              bcp47: 'pt-PT', phrases: [...] },
  seoul:        { name: 'Korean 🇰🇷',                  bcp47: 'ko-KR', phrases: [...] },
  mexicocity:   { name: 'Spanish (Mexican) 🇲🇽',      bcp47: 'es-MX', phrases: [...] },
  // US cities — practical English phrases for visitors (no slang)
  nyc:          { name: 'English (New York) 🗽',       bcp47: 'en-US', phrases: [...] },
  miami:        { name: 'English (Miami) 🌴',          bcp47: 'en-US', phrases: [...] },
  losangeles:   { name: 'English (Los Angeles) 🌅',   bcp47: 'en-US', phrases: [...] },
  austin:       { name: 'English (Austin) 🤠',         bcp47: 'en-US', phrases: [...] },
  lasvegas:     { name: 'English (Las Vegas) 🎰',      bcp47: 'en-US', phrases: [...] },
  nashville:    { name: 'English (Nashville) 🎸',      bcp47: 'en-US', phrases: [...] },
  orlando:      { name: 'English (Orlando) 🎢',         bcp47: 'en-US', phrases: [...] },
  seattle:      { name: 'English (Seattle) 🌧',         bcp47: 'en-US', phrases: [...] },
  hawaii:       { name: 'Hawaiian 🌺',                 bcp47: 'en-US', phrases: [...] },
  sandiego:     { name: 'English (San Diego) 🌊',      bcp47: 'en-US', phrases: [...] },
  washingtondc: { name: 'English (Washington DC) 🏛',  bcp47: 'en-US', phrases: [...] },
  boston:       { name: 'English (Boston) 🦞',         bcp47: 'en-US', phrases: [...] },
  denver:       { name: 'English (Denver) 🏔',         bcp47: 'en-US', phrases: [...] },
  portland:     { name: 'English (Portland) 🌲',       bcp47: 'en-US', phrases: [...] },
  atlanta:      { name: 'English (Atlanta) 🍑',        bcp47: 'en-US', phrases: [...] },
  philadelphia: { name: 'English (Philadelphia) 🔔',   bcp47: 'en-US', phrases: [...] },
  phoenix:      { name: 'English (Phoenix) 🌵',        bcp47: 'en-US', phrases: [...] },
}
```

Each `phrases` entry: `{ p: "phrase text", m: "meaning", r: "pronunciation hint (optional)" }`

### `speakPhrase(text, bcp47)`

Plays a phrase using the Web Speech API.

1. Cancels any in-progress speech
2. Creates a `SpeechSynthesisUtterance` with the phrase text and BCP47 language tag
3. Sets rate to 0.85 (slightly slower for clarity)
4. Filters available browser voices by language, then picks by gender using keyword matching
5. Falls back to the last voice (female) or first voice (male) when no keyword match

### Voice Gender Selection

```js
let _voiceGender = 'female';  // default

// Voice name keyword lists for gender matching:
_femaleVoiceKeys = ['female','zira','samantha','fiona','moira','tessa','veena','victoria',
                    'karen','serena','nicky','susan','linda','google uk english female',
                    'microsoft eva','microsoft zira','kyoko','o-ren'];
_maleVoiceKeys   = ['male','david','alex','daniel','fred','james','george','mark','paul',
                    'richard','lee','rishi','jorge','luca','google uk english male',
                    'microsoft david','microsoft mark','otoya'];
```

`setVoiceGender(gender, btn)` — updates `_voiceGender` state and toggles the `.active` class on the picker buttons. Called from inline `onclick` on the voice gender buttons in `renderEssentialsTab()`.

---

## `app.js` Function Index

### Utility
| Function | Purpose |
|---|---|
| `escHtml(s)` | HTML-escape for content / double-quoted attributes — converts `&`, `<`, `>`, `"`. Does **not** escape `'` (intentional — see comment in source). Use `jsqApp` for single-quoted JS strings. |
| `jsqApp(s)` | Backslash-escape for single-quoted inline JS strings in `onclick` — converts `'` → `\'` and `\` → `\\`. Use instead of `escHtml` when a string appears inside `onclick='...'` |
| `showToast(msg, dur)` | Shows a transient toast notification |
| `slugify(s)` | Lowercases and strips non-alphanumeric characters |

### Auth
| Function | Purpose |
|---|---|
| `signIn()` | Email/password sign in via Supabase |
| `signUp()` | Email/password sign up via Supabase |
| `signOut()` | Sign out and reset UI (`supabaseClient`, not `supabase`) |
| `renderAuthState(session)` | Updates nav auth buttons based on session |

### City Browser
| Function | Purpose |
|---|---|
| `renderCityGrid(cities)` | Renders city cards grid with avg rating, place count, local gem badge |
| `filterCities(region)` | Filters city grid by region (`all` / `International` / `USA`) |
| `openCity(cityId)` | Opens city modal and renders all tabs |
| `renderCards(items, type)` | Renders activity/food/transport tile grid for a city tab |
| `renderFoodByGenre(food)` | Groups food items by cuisine and renders genre sections with emoji headers |
| `getSpotPhoto(name, cityName)` | PHOTO_MAP keyword lookup for tile images |
| `renderEssentialsTab()` | Renders local language phrase grid with voice picker |
| `speakPhrase(text, bcp47)` | Web Speech API playback with gender voice selection |
| `setVoiceGender(gender, btn)` | Updates `_voiceGender` and active button state |
| `renderPackTab()` | Renders packing list for the city's `packType` |
| `scrollToCities()` | Smooth scrolls to city grid section |

### Deals
| Function | Purpose |
|---|---|
| `buildFlightLink(provider, el)` | Constructs deep-link URL to flight search provider |
| `buildCarLink(provider, el)` | Constructs deep-link URL to car rental provider |
| `buildBudgetEstimate()` | Calculates estimated trip cost from style + days inputs |

### Group Boards (Supabase realtime)
| Function | Purpose |
|---|---|
| `loadBoards()` | Fetches boards from Supabase and renders the board list |
| `createBoard()` | Creates a new board in Supabase |
| `openBoard(boardId)` | Opens a board and loads its ideas with vote counts |
| `addIdea(cityId)` | Adds a city idea to the current board (requires auth + profile) |
| `voteIdea(ideaId, dir)` | Up/down vote on an idea |
| `deleteIdea(ideaId)` | Removes an idea from a board |

### Helpers
| Function | Purpose |
|---|---|
| `getPlans()` | Reads `dropped_v2` from localStorage (returns `{trips:[]}` default) |
| `savePlans(data)` | Writes `dropped_v2` to localStorage |
| `addCard(dayId, place)` | Adds a place card to a trip day (null-guarded) |
| `removeCard(dayId, cardId)` | Removes a card from a trip day (null-guarded) |
| `moveCard(cardId, fromDayId, toDayId)` | Moves a card between days (null-guarded) |
| `updateTripStartDate(val)` | Updates the active trip's start date (null-guarded) |

---

## `planner.js` Function Index

### Data helpers
| Function | Purpose |
|---|---|
| `getPhoto(name, cityImage, size)` | Cascading photo lookup: item.photo → PHOTO_MAP → CATEGORY_PHOTOS → city → generic |
| `getPlacePhotos(name, cityImage)` | Multi-photo array for profile slideshow |
| `esc(s)` | HTML-escape for content / double-quoted attributes |
| `jsq(s)` | HTML-escape + apostrophe escape for single-quoted onclick JS strings |
| `slug(name)` | Slugify for hashtag URLs |
| `renderStars(rating)` | HTML entity stars with opacity (★★★½☆) |
| `getVibes(place)` | Derives up to 2 vibe tags from place price/rating/name/tip |
| `renderVibeTags(vibes)` | Renders coloured vibe tag pills HTML |
| `getDayStats(day)` | Returns `{ count, hours, totalCost, energy }` for a day |
| `renderDayHealthBar(stats)` | Renders the day health summary bar HTML |

### Storage
| Function | Purpose |
|---|---|
| `getStore()` | Read `dropped_v2` from localStorage |
| `saveStore(d)` | Write `dropped_v2` to localStorage |

### Trip management
| Function | Purpose |
|---|---|
| `loadActiveTrip()` | Boot — load last active trip |
| `renderAll()` | Re-render everything |
| `createTrip()` | Reads new-trip modal fields incl. optional budget |
| `deleteTrip(id)` | Remove trip and switch to next |
| `selectTrip(id)` | Switch active trip |

### Hero + Budget
| Function | Purpose |
|---|---|
| `renderHero()` | City image + trip name + date range |
| `renderBudgetBar()` | Planned spend vs. budget bar in hero; hides itself when no data |

### Tabs
| Function | Purpose |
|---|---|
| `switchTab(tab)` | Switches between saves / itinerary / discover / rewards tabs |
| `renderRewardsTab()` | Renders credit card hub: cards, city tips, checklist, blog articles |
| `toggleBlogCard(index)` | Expands/collapses a blog article in the rewards tab |

### Itinerary
| Function | Purpose |
|---|---|
| `renderDatePills()` | Date pills with energy dot (🟢/🟡/🔴) |
| `getDayLabel(day)` | "Mon Jun 5" or "Day 1" |
| `renderItinCards()` | Day health bar + placed card list |
| `renderPlacedCard(card, dayId, num)` | Single card HTML (draggable) |
| `addCardToDay(dayId, place)` | Add place to a day |
| `removeCard(dayId, cardId)` | Remove card from a day |
| `reorderCard(...)` | Drag-drop reorder |
| `updateCardNote(dayId, cardId, value)` | Edit note on card |

### Saves
| Function | Purpose |
|---|---|
| `renderSavesTab(filterVal)` | Save cards with social badges + vibe tags |
| `savePlace(place)` | Add to `trip.saves` (dedupes by name+city) |
| `removeSave(saveId)` | Remove from saves |
| `addSaveToDay(saveId)` | Move save → itinerary day card |

### Discover
| Function | Purpose |
|---|---|
| `setDiscoverFilter(filter)` | Category filter: all / activities / food / free |
| `setDiscoverVibe(vibe)` | Vibe filter: hidden-gem / budget / romantic / etc. |
| `renderDiscoverTab()` | 2-col grid with vibe tags; both filters applied |
| `discSaveByName(name)` | Save item from `_discCache` |
| `discAddByName(name)` | Add item from `_discCache` to active day |

### Place Profile Modal
| Function | Purpose |
|---|---|
| `openPlaceProfile(name)` | Full detail modal from `_discCache` |
| `closePlaceProfile()` | Close + restore scroll |
| `profileToggleSave()` | Save/unsave from modal |
| `profileAddToPlanner()` | Add to day from modal |

### Social Import
| Function | Purpose |
|---|---|
| `handleIncomingShare()` | Reads `?title=&text=&url=` on load (PWA Share Target) |
| `extractPlaceName(raw)` | Strips URLs/hashtags/mentions from shared text |
| `openQuickAdd(prefill)` | Single-place add modal |
| `openBulkImport()` | Bulk import modal (paste list) |
| `saveQuickAdd()` | Save single place with socialSource |
| `saveBulkImport()` | Save each line as a place |

### Map
| Function | Purpose |
|---|---|
| `initMap()` | Leaflet init + invalidateSize at 100/400/900ms |
| `updateMapPins()` | Redraws all pins: itinerary (teal), saves (pink), discover (grey) |

---

## Vibe Tag Logic (`getVibes`)

Vibes are derived automatically from place data — no manual tagging needed.

| Vibe | Trigger conditions |
|---|---|
| 💎 Hidden Gem | Not famous, not a trap, rating ≥ 4.6, price ≤ $20, has a local tip |
| ⚠️ Tourist Trap | Name matches known trap list (Times Square, Madame Tussauds, etc.) |
| 💸 Budget Find | Price ≤ $15 |
| ✨ Splurge | Price > $70 |
| ❤️ Romantic | Name/tip contains: rooftop, sunset, garden, wine, jazz, versailles, seine… |
| 🌿 Outdoor | Name contains: park, beach, hiking, garden, trail, mountain, shrine… |
| 🍜 Foodie Fave | Category = food AND rating ≥ 4.6 |
| 📸 Instagrammable | Name/tip contains: crossing, light show, teamlab, observatory, skyline… AND rating ≥ 4.3 |
| 🌟 Local Fave | Not a trap, rating ≥ 4.5, has a local tip |
| 🔥 Worth the Hype | Rating ≥ 4.8 AND price > $0 |

Max 2 vibes shown per place.

---

## Day Health Score Logic (`getDayStats`)

| Places | Energy level | Dot color |
|---|---|---|
| 1–2 | 😌 Chill day | 🟢 Green |
| 3–4 | ⚡ Moderate | 🟡 Yellow |
| 5+  | 🔥 Packed day | 🔴 Red |

Duration is estimated from the `duration` string (e.g. `"1-2 hrs"` → 1h, `"Full day"` → 8h, no data → 1.5h default). Cost is summed from `card.price` values.

---

## Security

### XSS Prevention

**Critical distinction — `escHtml` vs `jsqApp`:**

- `escHtml(s)` converts `'` → `&#39;`. Safe for HTML content and double-quoted attributes. **Do not use inside `onclick='...'`** — browsers decode `&#39;` back to `'` before JS evaluation, breaking the string.
- `jsqApp(s)` converts `'` → `\'` (backslash escape). Use for strings that appear inside single-quoted JS event handler attributes.

```js
// WRONG — apostrophe in name breaks onclick JS:
onclick="openPlace('${escHtml(item.name)}')"

// CORRECT:
onclick="openPlace('${jsqApp(item.name)}')"
```

The same distinction applies in planner.js: `esc()` vs `jsq()`.

**Coverage:**
- **planner.js:** All user-supplied strings go through `esc()` for HTML content; `jsq()` for single-quoted onclick strings.
- **app.js:** All dynamic data in `innerHTML` uses `escHtml()` — including `item.name`, `item.tip`, `genre`, city names in search suggestions, kanban cards. Names in single-quoted onclick strings use `jsqApp()`.
- **admin.js:** All Supabase-returned data goes through `escHtml()` before rendering in admin tables.

### Content Security Policy
Enforced via `_headers` (Netlify). Allows only required external domains:
- **Scripts:** `cdn.jsdelivr.net` (Supabase), `unpkg.com` (Leaflet)
- **Styles:** `fonts.googleapis.com`, `unpkg.com`
- **Images:** `images.unsplash.com`, `*.tile.openstreetmap.org`, `*.fl.yelpcdn.com`
- **Connections:** `*.supabase.co`, `wss://*.supabase.co`, `*.tile.openstreetmap.org`
- **Frames:** `frame-ancestors 'none'` (prevents clickjacking)

### Transport Security
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` on all routes
- `X-Frame-Options: DENY` prevents framing
- `X-Content-Type-Options: nosniff` prevents MIME sniffing

### Admin Panel
- `X-Robots-Tag: noindex` prevents search engine indexing
- `Cache-Control: no-store` prevents caching of admin data
- Auth gate queries the DB for `is_admin` — never trusts client-side session metadata
- `Referrer-Policy: no-referrer` prevents leaking admin URLs

### Supabase Keys
- The **anon key** in `config.js` is intentionally public — it carries no elevated privileges
- All data access is governed by Row Level Security (RLS) policies defined in `schema.sql`
- No secrets, service-role keys, or session tokens are stored in client-side code

---

## PWA Share Target (mobile)

`manifest.json` registers the app as a share target:

```json
"share_target": {
  "action": "/planner.html",
  "method": "GET",
  "params": { "title": "title", "text": "text", "url": "url" }
}
```

When a user shares an Instagram or TikTok post to Dropped, the app opens at `planner.html?title=...&text=...&url=...`. `handleIncomingShare()` reads these params, detects the source, extracts the place name, and opens the Quick Add modal pre-filled.

**Note:** Share Target only works when installed as a PWA on a real device.

---

## Bugs Fixed

### 2026-04-19 (Session 7)
- **CSP blocked Frankfurter API (currency feature silently failing):** `api.frankfurter.app` was not in the `connect-src` directive of `_headers`. Fetch requests to the currency rate API were blocked by the browser on the Netlify deployment. Added `https://api.frankfurter.app` to `connect-src`.
- **`reset-password.html` didn't exist:** `sendPasswordReset()` sent users to `/reset-password.html` for the Supabase PASSWORD_RECOVERY redirect but the file was missing — anyone who clicked the reset email got a 404. Created `reset-password.html` that uses `supabaseClient.auth.onAuthStateChange` to detect the `PASSWORD_RECOVERY` event and shows a new-password form.
- **`addIdea()` double-click created duplicate pins:** "Pin It" button had no ID and no disabled state during the async Supabase insert. Rapid double-clicks would fire two inserts. Added `id="add-idea-btn"` to the button and added `btn.disabled = true/false` around the insert. Also capped idea text at 500 characters.
- **`sendPasswordReset()` button could be spam-clicked:** No loading state during the async email send. Added disable + "Sending…" label during the request; re-enables on completion or error. Added `id="forgot-submit-btn"` to the button.
- **`renderIdeas()` used `escHtml()` for onclick ID strings:** `voteIdea('${escHtml(idea.id)}',...)` and `deleteIdea('${escHtml(idea.id)}')` used the wrong escape function for single-quoted onclick attributes. UUIDs are alphanumeric+dashes so this was safe in practice, but inconsistent with the rest of the codebase. Changed to `jsqApp()`.

### 2026-04-16 (Session 6)
- **Null crash in `renderKanban()` (app.js):** Accessed `currentTrip.days` before checking `currentTrip !== null`. Added `if (!currentTrip) return` guard at function start.
- **Null crash in `updateTripStartDate()` (app.js):** Accessed `currentTrip.id` without null guard. Fixed.
- **Null crash in `moveCard()` (app.js):** Accessed `currentTrip.id` without null guard. Fixed.
- **Null crash in `addDay()` (app.js):** Accessed `currentTrip.id` without null guard; also missing `if (!trip) return` guard after the find. Both fixed.
- **Null crash in `removeDay()` (app.js):** Accessed `currentTrip.id` then directly called `trip.days.filter` with no null check on `trip`. Both fixed.
- **Null crash in `addCard()` (app.js):** Accessed `currentTrip.id` without null guard. Fixed.
- **Null crash in `removeCard()` (app.js):** Accessed `currentTrip.id` without null guard. Fixed.

Pattern: all planner mutation functions now start with `if (!currentTrip) return` before any `currentTrip.xxx` access.

### 2026-04-15 (Session 5)
- **Food expansion — 10 restaurants per genre:** All 34 cities expanded from 1 restaurant per cuisine genre to ~10. 6,418 total restaurants across all cities. New entries were appended via a patch-and-merge script (`merge_food.js`, now deleted).
- **Double-comma corruption in food arrays (data.js):** The merge script inserted `,\n` before new items, but the last original item in each food array already had a trailing comma — creating `},\n,\n{` (a JavaScript sparse-array elision). This produced `undefined` holes in all 34 food arrays. Fixed by replacing all 34 occurrences of the `\n    ,\n` double-comma pattern with a single `\n`.
- **Defensive null guard in `applyFilter` (app.js):** The spread `[...array]` includes sparse-array holes as `undefined`. Added `.filter(Boolean)` after the spread so that any future undefined items are stripped before filtering, preventing `TypeError: Cannot read property 'price' of undefined` from crashing the entire tab render — which was silently breaking both food and activities display.
- **Local dev port corrected in docs:** DOCUMENTATION.md listed port `8080`; actual server runs on `9056`. Updated all references.

### 2026-04-14 (Session 4)
- **18 new cities added:** 10 international (London, Rome, Amsterdam, Sydney, Dubai, Bangkok, Singapore, Lisbon, Seoul, Mexico City) and 8 US (San Diego, Washington DC, Boston, Denver, Portland, Atlanta, Philadelphia, Phoenix) — each with 10–21 activities, 10–20 food entries, transport, and transport data. Total now 34 cities.
- **Search bar added to city modal:** Live `<input id="tab-search">` filters activities, food, and transport by name, tip, description, and cuisine — wired to `applyFilter()` in app.js.
- **GENRE_EMOJI expanded to 300+ entries:** 10 new international cities introduced ~294 new cuisine strings with no emoji mapping (defaulting to generic `🍴`). Rebuilt GENRE_EMOJI to cover all cuisines across all 34 cities; verified with Node script — 0 missing after fix.
- **3 missing PACK_DATA entries:** `international_pacific` (Australia/NZ), `international_mideast` (Dubai/UAE), and `international_latam` (Mexico/Latin America) were referenced as `packType` in data.js but had no matching key in `PACK_DATA` — Pack tab silently fell back to `city_usa` packing list. Added full packing lists for all three pack types (clothing, documents, gear, apps sections).
- **PHOTO_MAP stale Unsplash IDs fixed:** `photo-1607853202273-797f1c22a38e` (Statue of Liberty) and `photo-1526481280693-3bfa7568e0f3` (Brooklyn Bridge) replaced broken entries that returned Unsplash 404 errors.
- **COL budget table expanded:** `buildBudgetEstimate()` in app.js now covers all 34 cities (was 16). Added entries for 10 international and 8 new US cities with budget/mid/luxury daily rates.
- **CITY_LANGUAGES added for all new cities:** 10 international entries (Italian, Dutch, Arabic Gulf, Thai, Korean, Portuguese, Australian/British/Singaporean English, Mexican Spanish) and 8 US English entries (San Diego, DC, Boston, Denver, Portland, Atlanta, Philadelphia, Phoenix) — all with practical visitor phrases and romanized pronunciation where applicable.
- **XSS — idea.id in onclick (app.js):** `idea.id` was injected raw into `voteIdea()` and `deleteIdea()` onclick strings. Fixed by wrapping with `escHtml()`.
- **XSS — trending section (planner.js):** `city.name` was injected unescaped into `innerHTML`; food/activity names were double-escaped (escaped at build time AND at render). Fixed: removed premature `esc()` at build time, apply single `esc(c.label)` at render site.
- **XSS — rewards tab earn rates (planner.js):** Object keys (`k`) and values (`v`) from earn-rate map were injected unescaped into `innerHTML`. Fixed by wrapping both with `esc()`.
- **CITY_COORDS key mismatch fixed (planner.js):** Map pins for Los Angeles used key `la` but data.js uses `losangeles`. Added `losangeles` entry (alongside `la` for backwards compatibility) to `CITY_COORDS`.

### 2026-04-10 (Session 3)
- **SyntaxError on apostrophes in place names (e.g. "Dick's Last Resort"):** `escHtml()` converts `'` to `&#39;`; browsers decode `&#39;` back to `'` before evaluating inline JS — breaking any `onclick='fn("...")'` that contained an escaped apostrophe. Fixed by adding `jsqApp()` which uses backslash-escape (`\'`) instead, and replacing all apostrophe-unsafe onclick uses.
- **Statue of Liberty + Brooklyn Bridge Walk images 404:** Unsplash photo IDs `photo-1575651279937-1fc7f35f9be4` and `photo-1546102745-75b4bdb08c2f` were deleted from Unsplash. Fixed by downloading replacement photos locally to `photos/statue_of_liberty.jpg` and `photos/brooklyn_bridge_walk.jpg`.
- **Spanish phrases shown on US cities:** US cities (NYC, Miami, LA, etc.) incorrectly showed Spanish language phrases. Fixed by adding `CITY_LANGUAGES` entries for all US cities with practical English visitor phrases (no slang).
- **GENRE_EMOJI missing entries:** ~37 cuisine strings in data.js had no matching emoji in `GENRE_EMOJI`, defaulting to generic `🍴`. Rewrote `GENRE_EMOJI` with 60+ entries covering all cuisines in data.js.
- **`moveCard` crash when trip/day not found in localStorage:** No null-guards — would throw `Cannot read properties of undefined`. Added early returns for missing `trip`, `fromDay`, `toDay`, `card`.
- **`addCard` / `removeCard` crashes:** Same pattern — added null-guards for missing `trip` and `day`.
- **`updateTripStartDate` crash:** No null-guard on `trip` lookup. Added early return.
- **`addIdea` crash when `currentProfile` is null:** Would throw attempting to read `.id`. Added early return with a toast if profile hasn't loaded.
- **`secret Pizza` incorrect casing in data.js:** Name was `"secret Pizza (Cosmopolitan)"` — corrected to `"Secret Pizza (Cosmopolitan)"`.
- **Duplicate `.deal-form` and `.ideas-list` CSS rules:** Two conflicting definitions in styles.css (one at each location). Removed duplicates from the MISSING CLASSES block, keeping canonical definitions.
- **Misleading CSS comment:** Renamed "MISSING CLASSES (index.html rebuild)" comment to "UI Component Classes".

### 2026-04-08 (Session 2)
- **XSS in app.js `renderCards()`:** `item.name` and `item.tip` were injected raw into `innerHTML` without escaping. Fixed by wrapping both with `escHtml()`.
- **XSS in app.js `renderFoodByGenre()`:** Same unescaped `item.name`, `item.tip`, and `genre` — all now escaped with `escHtml()`.
- **XSS in app.js search suggestions:** City name and country were unescaped in search suggestion `innerHTML`. Fixed with `escHtml()`.
- **Bug: search suggestion onclick used closure variables:** `input.value=''` and `sug.classList.add('hidden')` referenced local variables (`input`, `sug`) inside `setupSearchInput()`, but `onclick` attribute strings execute in global scope. Fixed to use `document.getElementById()` calls instead.
- **Missing HSTS header:** Added `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` to all routes in `_headers`.

### 2026-04-08 (Session 1)
- **`signOut()` used wrong variable:** `app.js` called `if (supabase)` instead of `if (supabaseClient)` — sign-out could silently fail
- **CSP blocked planner resources:** `_headers` was missing `unpkg.com` (Leaflet), `*.tile.openstreetmap.org` (map tiles), and `*.fl.yelpcdn.com` (Yelp photos)
- **Mobile map had no close button:** Added `✕ Close Map` button for mobile overlay
- **Hero actions hidden on small phones:** Now wrap to a second row on <500px screens
- **Unicode star rendering:** `★½☆` characters rendered as garbled boxes on Windows — switched to HTML entities `&#9733;` with opacity
- **`textContent` vs `innerHTML`:** Profile modal stars used `textContent` but `renderStars()` returns HTML — fixed to `innerHTML`
- **Photo not propagating:** Placed cards and saved cards didn't carry the `photo` field — fixed by passing it through save/add flows

---

## Local Development

```bash
cd itinerary-app
python -m http.server 9056
# Open http://localhost:9056/planner.html  (planner)
# Open http://localhost:9056              (explore page)
# Open http://localhost:9056/admin.html   (admin — requires Supabase auth)
```

---

## Adding a New City

1. Add an entry to `CITIES` in `data.js` (copy an existing city as template). Set `packType` to one of: `city_usa`, `city_international`, `international_europe`, `international_asia`, `international_pacific`, `international_mideast`, `international_latam`.
2. Add coordinates to `CITY_COORDS` in `planner.js`: `yourcityid: [lat, lng]`
3. Add an entry to `COL` in `app.js` with `{b, m, l}` daily budget rates: `yourcityid: {b:50, m:130, l:350}`
4. Add an entry to `CITY_LANGUAGES` in `app.js` with local language phrases
5. If any food items use new cuisine strings, add matching entries to `GENRE_EMOJI` in `app.js` (run `node -e "..."` audit script to check for missing entries)
6. Optionally add entries to `CITY_REWARDS_TIPS` in `data.js` for credit card tips
7. The city will appear automatically in destination selects and the Discover tab

**GENRE_EMOJI audit script:**
```bash
node -e "
const {CITIES} = require('./data.js');
// paste GENRE_EMOJI keys from app.js into emojiKeys Set
const cuisines = new Set(CITIES.flatMap(c => (c.food||[]).map(f => f.cuisine).filter(Boolean)));
const missing = [...cuisines].filter(c => !emojiKeys.has(c));
console.log('Missing:', missing.length, missing);
"
```

## Adding a New Credit Card

1. Add an entry to `REWARDS_CARDS` in `data.js` with `id`, `name`, `issuer`, `icon`, `annualFee`, `bonus`, `bonusSpend`, `earn`, `perks`, `bestFor`
2. Add a corresponding `.cc-card-icon.{icon}` CSS class in `planner.html` for the card's brand color
3. The card appears automatically in the Rewards tab
