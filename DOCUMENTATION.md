# Dropped — Developer Documentation

**Live site:** https://dropped.app  
**Local dev:** `python -m http.server 9056` → http://localhost:9056

A mobile-first travel planning PWA. Two user-facing surfaces: **index.html** (explore/browse cities) and **planner.html** (plan your trip). No build step — vanilla HTML + CSS + JS served directly.

---

## Quick Start (New Developer)

```bash
# 1. Clone
git clone https://github.com/your-org/itinerary-app.git
cd itinerary-app

# 2. Serve locally (any static server works)
python -m http.server 9056

# 3. Open
#   Explore:  http://localhost:9056
#   Planner:  http://localhost:9056/planner.html
#   Admin:    http://localhost:9056/admin.html  (requires Supabase login)
```

**No npm, no node_modules, no build.** If you change a `.js` or `.css` file, just refresh the browser.

**Deploy:** `netlify deploy --dir . --prod`

---

## How the App Works

### Architecture at a Glance

```
Browser
  ├── index.html  ← loads app.js, data.js, i18n.js, reveal.js, config.js
  │     City browser, group boards, auth, deals, flight/car links
  │
  ├── planner.html ← loads planner.js, data.js, travel-apps.js, config.js
  │     Trip planner: itinerary, wishlist, discover, rewards, map
  │
  └── admin.html  ← loads admin.js, config.js
        Admin dashboard: users, boards, ideas (requires Supabase auth)

External services:
  ├── Supabase (Postgres + RLS) — group boards, user auth, admin data
  ├── Leaflet + OpenStreetMap  — map pins in planner
  ├── Frankfurter API          — live currency rates (no key needed)
  └── Web Speech API           — local phrase audio playback (built-in browser)
```

### Data Flow

- **Static city data** lives entirely in `data.js` — no API fetch needed to browse cities.
- **Trip state** (itinerary, saves, budget) is stored in `localStorage` under the key `dropped_v2`.
- **Group boards** are the only feature that writes to the Supabase database.
- **Auth** is used only to gate group board participation and the admin panel.

### Page Load Order (index.html)

1. `config.js` — sets `window.SUPABASE_URL` + `window.SUPABASE_KEY`
2. `data.js` — declares `CITIES`, `REWARDS_CARDS`, etc. as `const`
3. `app.js` — reads CITIES, sets up city grid, auth, boards
4. `i18n.js` — multi-language menu and translations
5. `reveal.js` — scroll-reveal animations and stat counters

---

## File Structure

```
itinerary-app/
├── index.html          # Explore page — city browser, deals, group boards, globe
├── planner.html        # Trip planner — Saves / Itinerary / Discover / Rewards / Map
├── admin.html          # Admin dashboard — users, boards, ideas management
├── globe.html          # Full-page interactive 3D globe explorer
├── reset-password.html # Password reset — handles Supabase PASSWORD_RECOVERY flow
├── 404.html            # Branded 404 page
├── privacy.html        # Privacy Policy (GDPR/CCPA, 10 sections)
├── terms.html          # Terms of Service (12 sections)
│
├── app.js              # index.html logic — auth, city browser, deals, boards, essentials
├── planner.js          # planner.html logic — trips, itinerary, discover, rewards, map
├── admin.js            # Admin logic — auth gate, CRUD, event delegation
├── data.js             # Static city data — 34 destinations + credit card rewards
├── travel-apps.js      # CITY_TRAVEL_APPS + CITY_CURRENCY — best apps & currency per city
├── i18n.js             # Home page translations — 11 languages, renderMenu, applyTranslations
├── reveal.js           # Scroll-reveal (IntersectionObserver) + animated stat counters
├── config.js           # Supabase URL + anon key (safe to commit — governed by RLS)
│
├── styles.css          # Global CSS — dark teal theme
├── manifest.json       # PWA manifest — name, icons, share_target
├── robots.txt          # Disallows all crawlers (private app — noindex)
├── _headers            # Netlify security headers (CSP, HSTS, X-Frame-Options)
├── _redirects          # Netlify URL routing rules
├── .gitignore          # Excludes .netlify, scripts/, photos/, progress files
│
├── schema.sql          # Supabase DB schema + RLS policies
├── schema-fix.sql      # Schema migration patches
├── admin-setup.sql     # SQL to set up first admin user
│
├── scripts/            # Build/maintenance scripts (gitignored — not deployed)
│   ├── apply_wiki_photos.js
│   ├── fetch_commons_photos.js
│   ├── fetch_variation_photos.js
│   ├── fetch_wiki_photos.js
│   ├── update-photos.js
│   └── wiki_photos.json
│
└── DOCUMENTATION.md    # This file
```

---

## Key Files Deep-Dive

### `data.js` — All City Data

The single source of truth for everything you can browse. Exports these globals:

| Export | Contents |
|---|---|
| `CITIES` | Array of 34 city objects — activities, food, transport |
| `REWARDS_CARDS` | 6 top travel credit cards |
| `CITY_REWARDS_TIPS` | 34 cities × 3 card-specific tips |
| `AIRLINE_REWARDS` | 14 airlines — best card, earn rate, partners |
| `REWARDS_BLOG` | 4 expandable blog articles on points strategy |
| `REWARDS_CHECKLIST` | 15-step points maximization checklist |

**City object shape:**
```js
{
  id:        "nyc",           // used as key everywhere — lowercase, no spaces, unique
  name:      "New York City",
  country:   "USA",
  tagline:   "The City That Never Sleeps",
  image:     "https://images.unsplash.com/photo-ID?w=1920&q=90&fm=webp&fit=crop",
  iata:      "JFK",
  packType:  "city_usa",      // controls packing list — see packType values below

  activities: [{ name, price, rating, duration, tip, desc, photo }],
  // "🔍 Google" badge is always shown next to activity ratings

  food: [{ name, price, rating, cuisine, tip, desc, photo, localGem? }],
  // "⭐ Yelp" badge shown next to food ratings
  // localGem: true → "🔒 Local Gem" badge in Discover cards and profile modal
  // ~10 restaurants per cuisine genre; 6,418 total across all 34 cities

  transport: [{ name, price, rating, type, tip }],
}
```

**`packType` values:**
- `city_usa` — US city (no plug adapter, domestic travel)
- `city_international` — generic international
- `international_europe` — Europe-specific packing
- `international_asia` — Asia-specific packing
- `international_pacific` — Australia/NZ
- `international_mideast` — Middle East (Dubai/UAE)
- `international_latam` — Mexico/Latin America

**Two valid food item formats** (both work identically at runtime):
```js
// Original format:
{ cuisine: "Ramen", name: "Ichiran", ... }
// JSON.stringify output (from patch scripts):
{"cuisine":"Ramen","name":"Ichiran", ...}
```

**data.js integrity check — always run after editing:**
```bash
node --check data.js
node -e "eval(require('fs').readFileSync('./data.js','utf8').replace('const CITIES','var CITIES')); CITIES.forEach(c => { const bad=(c.food||[]).filter(x=>!x).length; if(bad) console.log(c.id, bad, 'holes'); })"
```

---

### `app.js` — index.html Logic

Handles all city browsing, auth, group boards, and essentials. Loaded only on `index.html`.

**Key constants:**
- `GENRE_EMOJI` — maps cuisine strings to emoji (e.g. `"Ramen" → "🍜"`); must cover every cuisine string in `data.js`
- `PACK_DATA` — packing list templates keyed by `packType`
- `COL` — daily budget rates per city: `{ cityid: { b, m, l } }` (budget/mid/luxury)
- `CITY_LANGUAGES` — local language phrases + BCP47 tag for Web Speech API
- `PHOTO_MAP` — 292 place-name keyword → Unsplash photo ID mappings

**XSS conventions in this file:**
- `escHtml(s)` — for all HTML content and double-quoted attributes
- `jsqApp(s)` — for strings inside `onclick='...'` (single-quoted)

---

### `planner.js` — planner.html Logic

Handles all trip state, tabs, and rendering for the planner. Never loaded on `index.html`.

**Key constants:**
- `CITY_COORDS` — `{ cityid: [lat, lng] }` — needed for Leaflet map pins
- `PHOTO_MAP` — 292 entries (same map as app.js, duplicated intentionally — no shared module)
- `CATEGORY_PHOTOS` — 71 cuisine/category keyword fallbacks
- Storage key: `dropped_v2` — wiping this in DevTools resets all trips

**XSS conventions in this file:**
- `esc(s)` — same as `escHtml` in app.js
- `jsq(s)` — same as `jsqApp` in app.js

---

### `config.js` — Supabase Credentials

```js
const SUPABASE_URL = 'https://xxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJ...';
```

Safe to commit. The anon key has no elevated privileges — all DB access is governed by RLS policies in `schema.sql`. The client is instantiated as `supabaseClient` (not `supabase`) to avoid a naming conflict with the CDN's `var supabase` global (which would cause a SyntaxError in strict mode).

---

### `_headers` — Netlify Security Headers

Sets CSP, HSTS, and other security headers for all routes. The CSP `connect-src` must include every external API the app fetches from:
- `*.supabase.co` — database
- `api.frankfurter.app` — currency rates
- `*.tile.openstreetmap.org` — map tiles

If you add a new external fetch, add it to the appropriate CSP directive here.

---

## Data Model

### Trip (localStorage, key: `dropped_v2`)
```js
{
  trips: [
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
          socialSource: "instagram",  // "instagram" | "tiktok" | null
          note:         "seen on @foodtokyo",
        }
      ]
    }
  ]
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
    bestMap: 'Citymapper',          // recommended primary map app
    maps:    [{ n, note, star }],   // star:true = top pick
    transit: { card, apps, tip },   // card = physical pass to buy
    ride:    [{ n, note, star }],
    food:    [{ n, note }],
    pay:     'string',              // cashless vs. cash advice
    sim:     'string',              // SIM/connectivity recommendation
    tip:     'string',              // single most important travel tip
  },
  // ... all 34 cities
}

CITY_CURRENCY = {
  nyc:   { code: 'USD', name: 'US Dollar',   symbol: '$' },
  paris: { code: 'EUR', name: 'Euro',         symbol: '€' },
  tokyo: { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  // ... all 34 cities
}
```

---

## Adding a City

1. Add to `CITIES` in `data.js` (copy an existing city as template). Choose the correct `packType`.
2. Add `yourcityid: [lat, lng]` to `CITY_COORDS` in `planner.js`
3. Add `yourcityid: {b, m, l}` to `COL` in `app.js` (daily budget rates)
4. Add `yourcityid: { name, bcp47, phrases }` to `CITY_LANGUAGES` in `app.js`
5. Add any new cuisine strings to `GENRE_EMOJI` in `app.js`
6. Optionally add `yourcityid` entries to `CITY_REWARDS_TIPS` in `data.js`
7. Optionally add to `CITY_TRAVEL_APPS` in `travel-apps.js`

**After editing data.js — always verify:**
```bash
node --check data.js
node -e "eval(require('fs').readFileSync('./data.js','utf8').replace('const CITIES','var CITIES')); CITIES.forEach(c => { const bad=(c.food||[]).filter(x=>!x).length; if(bad) console.log(c.id, bad, 'holes'); })"
```

**Audit for missing GENRE_EMOJI:**
```bash
node -e "
const appSrc = require('fs').readFileSync('./app.js','utf8');
const start = appSrc.indexOf('const GENRE_EMOJI = {');
const end = appSrc.indexOf('\n};', start) + 3;
eval(appSrc.slice(start,end).replace('const','var'));
const src = require('fs').readFileSync('./data.js','utf8');
const cuisines = [...new Set([...src.matchAll(/cuisine[: ]+\"([^\"]+)\"/g)].map(m=>m[1]))];
const missing = cuisines.filter(c => !GENRE_EMOJI[c]);
console.log('Missing:', missing.length, missing);
"
```

---

## Adding Food (Bulk)

1. Create `food_patch_CITYID.json`: `{"cityid": [{name, price, rating, cuisine, tip, desc, photo}]}`
2. Use `cuisine` strings that exactly match existing genres for that city (check data.js)
3. Run `node merge_food.js` (create it if needed — see Bugs Fixed 2026-04-15)
4. Verify: `node --check data.js` + hole check above
5. Restart server

**Watch for double commas:** If you append items via string manipulation, the last original item may already have a trailing comma. Adding another `,` before new items creates `undefined` holes. The hole-check script above catches these.

---

## Supabase / Database

Used for: **group boards** (index.html) and **admin** (admin.html) only. Planner state is 100% localStorage — no DB writes from planner.html.

**Tables (schema.sql):**
- `profiles` — one row per user; `is_admin` flag
- `boards` — group trip boards
- `ideas` — city suggestions pinned to a board
- `votes` — up/down votes on ideas

**Client instantiation:**
```js
// config.js
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// Note: named supabaseClient (not supabase) to avoid conflict with CDN's var supabase
```

**Admin setup (first time):**
```sql
-- Run admin-setup.sql in Supabase SQL editor
-- This grants is_admin = true to a specific email address
```

**RLS:** All DB access is governed by Row Level Security. The anon key has no elevated privileges — it can only read/write what the RLS policies allow. No service-role key ever appears in client-side code.

---

## Security Rules

### XSS Prevention

There are two escape functions per file — use the right one:

| Context | Function (app.js) | Function (planner.js) |
|---|---|---|
| HTML content / double-quoted attributes | `escHtml(s)` | `esc(s)` |
| Single-quoted `onclick='...'` strings | `jsqApp(s)` | `jsq(s)` |

**Why two functions?** `escHtml()` converts `'` → `&#39;`. Browsers decode `&#39;` back to `'` before evaluating inline JS — this breaks `onclick='fn("it&#39;s")'`. The `jsqApp()`/`jsq()` functions use `\'` (backslash escape) instead, which stays intact in JS evaluation.

```js
// WRONG — apostrophe in name will break onclick:
onclick="openPlace('${escHtml(item.name)}')"

// CORRECT:
onclick="openPlace('${jsqApp(item.name)}')"
```

**Never** inject `item.name`, `item.tip`, city names, user data, or imported file data raw into `innerHTML`.

### Content Security Policy (`_headers`)

Enforced via Netlify. Key directives:
- **Scripts:** `cdn.jsdelivr.net` (Supabase), `unpkg.com` (Leaflet), `globe.gl` CDN
- **Styles:** `fonts.googleapis.com`, `unpkg.com`
- **Images:** `images.unsplash.com`, `*.tile.openstreetmap.org`, `*.fl.yelpcdn.com`
- **Connections:** `*.supabase.co`, `wss://*.supabase.co`, `*.tile.openstreetmap.org`, `api.frankfurter.app`
- **Frames:** `frame-ancestors 'none'` (prevents clickjacking)

`unsafe-inline` is required for inline event handlers. A future refactor to `addEventListener` would allow removing it.

### Transport Security

- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`

### localStorage Safety

All `getStore()` / `savePlans()` calls are wrapped in `try/catch` — gracefully handles private browsing and storage quota errors. Storage key: `dropped_v2`.

---

## Deployment

```bash
# Deploy to Netlify production
netlify deploy --dir . --prod

# Preview deploy (generates a temporary URL)
netlify deploy --dir .
```

The `_headers` and `_redirects` files are picked up automatically by Netlify. No build command needed.

**What's gitignored (not deployed):**
- `scripts/` — build and data-fetch utilities
- `photos/` — locally downloaded place photos (too large for git)
- `*.json` progress files — generated by scripts
- `.netlify/` — Netlify CLI state

---

## Photo System

Photos use a cascading lookup. If one level fails, the next is tried.

**app.js (index.html tiles):**
1. `item.photo` — explicit photo on the place object in data.js
2. `getSpotPhoto(name, cityName)` — PHOTO_MAP keyword lookup (292 entries)
3. City hero image (`currentCity.image`) — always a valid Unsplash URL

```js
// onerror fallback chain in rendered img tags:
onerror="if(!this._fb){this._fb=true;this.src='${cityImgSrc}'}else{this.onerror=null}"
```

**planner.js (planner.html cards):**
1. `item.photo` (via `_discCache`)
2. `PHOTO_MAP` — 292 place-name keyword → Unsplash photo ID
3. `CATEGORY_PHOTOS` — 71 cuisine/type keyword fallbacks
4. City hero image
5. Generic travel fallback

**Unsplash URL format:**
```
https://images.unsplash.com/photo-PHOTO_ID?w=800&q=80&fm=webp&fit=crop
```
Avoid `plus.unsplash.com` — those are premium/paid images that require authentication.

---

## Common Tasks

### Restart Local Server
```bash
cd "C:/Users/MasterPark/.gemini/antigravity/scratch/itinerary-app"
python -m http.server 9056
```

### Check data.js for syntax errors and holes
```bash
node --check data.js
node -e "eval(require('fs').readFileSync('./data.js','utf8').replace('const CITIES','var CITIES')); CITIES.forEach(c => { const bad=(c.food||[]).filter(x=>!x).length; if(bad) console.log(c.id, bad, 'holes'); })"
```

### Reset planner state (dev only)
In browser DevTools console:
```js
localStorage.removeItem('dropped_v2');
location.reload();
```

### Change the globe on the homepage
The interactive 3D globe is in `index.html` inside a self-contained IIFE (Immediately Invoked Function Expression) — scroll to the comment block that reads `HOME GLOBE` or search for `home-globe-div`. All globe variables are scoped inside the IIFE and don't leak to `window`. The globe uses [globe.gl v2.32.0](https://globe.gl/). `openCity(id)` (from app.js) is called from inside the IIFE using `if (typeof openCity === 'function') openCity(id)`.

---

## Features Reference

### Planner (`planner.html`)

| Feature | Description |
|---|---|
| **Trips** | Create multiple trips, switch via dropdown, each with city, dates, days, and optional budget |
| **Day Itinerary** | Drag-and-drop cards per day; add from Discover, Saves, or by name search |
| **Day Health Score** | Per-day energy level (😌 Chill / ⚡ Moderate / 🔥 Packed), estimated hours, estimated spend |
| **Trip Budget Tracker** | Set a total budget; live progress bar shows planned spend vs. budget |
| **Saves (Wishlist)** | Heart places to a per-trip wishlist; plan them to specific days later |
| **Vibe Tags** | Auto-generated: 💎 Hidden Gem, ⚠️ Tourist Trap, 💸 Budget Find, ❤️ Romantic, 🌿 Outdoor, 🍜 Foodie Fave, 📸 Instagrammable, 🌟 Local Fave, ✨ Splurge, 🔥 Worth the Hype |
| **Discover** | Browse all activities + food for your trip's city; filter by category and by vibe |
| **Rewards** | Credit card hub — top travel cards, city-specific tips, checklist, blog guides |
| **Place Profile Modal** | Full detail view with photo slideshow, description, tip, rating, price, social links |
| **Rating Source Badges** | "⭐ Yelp" or "🔍 Google" shown next to every rating |
| **Local Gems** | `localGem: true` in data.js → "🔒 Local Gem" badge |
| **Discover Search** | Debounced 200ms search across name, description, cuisine, and tip fields |
| **Discover Sort** | ⭐ Top Rated, 💸 Price Low→High, 💎 Price High→Low, A→Z |
| **Trending Social Section** | TikTok and Instagram search deep-links for the current city |
| **Multi-Language (i18n)** | 11 languages via 🌐 globe picker; full RTL for Arabic |
| **Social Import** | Save places from Instagram/TikTok via Quick Add, Bulk Import, or PWA Share Target |
| **Smart Day Insights** | Warns when a day is overloaded, has no food, has no activities, or has tourist traps |
| **Share My Trip** | Web Share API on mobile, clipboard on desktop |
| **Export Itinerary** | Print-ready HTML with full itinerary, wishlist, and spend summary |
| **Smart Packing List** | Auto-generated checklist based on destination type + activities |
| **Map** | Leaflet + OpenStreetMap — pins for itinerary (teal), saves (pink), discover (grey) |
| **Travel Guide** | ✈ Filter in Discover tab — best maps, transit card, ride-hailing, payment tips per city |
| **Get There button** | Opens city-appropriate map app (Naver Maps for Seoul, Google Maps elsewhere) |
| **File Import** | Google Maps Takeout, TikTok, Instagram, ZIP — parsed in-browser (no upload) |
| **Budget Recommendations** | Top-rated items within per-day budget shown as chip row |

### Explore (`index.html`)

| Feature | Description |
|---|---|
| **City Browser** | 34 cities with Activities, Food, Transit, Pack, Essentials tabs; live search |
| **3D Globe** | Interactive globe.gl globe with continent click-zoom and city search |
| **Local Language Phrases** | All 34 cities: phrases, romanized pronunciation, Web Speech API audio |
| **Voice Gender Picker** | ♀ Female / ♂ Male voice toggle for phrase audio |
| **Live Currency Rates** | Frankfurter API — live USD exchange rate, cached per session |
| **Flight Deals** | Deep-links to Google Flights, Kayak, Skyscanner, Expedia |
| **Budget Estimator** | Three travel styles × configurable trip length → estimated spend |
| **Group Trip Board** | Create boards, pin cities, vote up/down (Supabase realtime) |
| **User Auth** | Email/password via Supabase |
| **Cookie Consent** | GDPR banner stored in localStorage |
| **SEO / Structured Data** | Open Graph, Twitter Card, JSON-LD, canonical URL |

### Admin (`admin.html`)

| Feature | Description |
|---|---|
| **Auth Gate** | DB-verified `is_admin` check — no client-side-only bypass |
| **Users Tab** | Ban/unban, grant/revoke admin, delete all user content |
| **Boards Tab** | Delete boards (cascades to ideas and votes) |
| **Ideas Tab** | Delete individual ideas and their votes |
| **Stats Bar** | Total users, boards, ideas, votes |

---

## `app.js` Function Index

### Utility
| Function | Purpose |
|---|---|
| `escHtml(s)` | HTML-escape for content / double-quoted attributes — converts `&`, `<`, `>`, `"`. Does **not** escape `'` via `&#39;` — use `jsqApp` for single-quoted JS strings |
| `jsqApp(s)` | Backslash-escape for single-quoted inline JS strings in `onclick` — converts `'` → `\'` and `\` → `\\` |
| `showToast(msg, dur)` | Transient toast notification |
| `slugify(s)` | Lowercases and strips non-alphanumeric characters |

### Auth
| Function | Purpose |
|---|---|
| `signIn()` | Email/password sign in via Supabase |
| `signUp()` | Email/password sign up via Supabase |
| `signOut()` | Sign out and reset UI |
| `renderAuthState(session)` | Updates nav auth buttons based on session |

### City Browser
| Function | Purpose |
|---|---|
| `renderCityGrid(cities)` | Renders city cards grid with avg rating, place count, local gem badge |
| `filterCities(region)` | Filters city grid by region (`all` / `International` / `USA`) |
| `openCity(cityId)` | Opens city modal and renders all tabs — also called from globe click |
| `renderCards(items, type)` | Renders activity/food/transport tile grid for a city tab |
| `renderFoodByGenre(food)` | Groups food items by cuisine and renders genre sections with emoji headers |
| `getSpotPhoto(name, cityName)` | PHOTO_MAP keyword lookup for tile images |
| `renderEssentialsTab()` | Renders local language phrase grid with voice picker |
| `speakPhrase(text, bcp47)` | Web Speech API playback with gender voice selection |
| `setVoiceGender(gender, btn)` | Updates `_voiceGender` and active button state |
| `renderPackTab()` | Renders packing list for the city's `packType` |
| `applyFilter()` | Live search/filter — spreads city array then `.filter(Boolean)` to strip holes |

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

### Currency
| Function | Purpose |
|---|---|
| `fetchCurrencyRate(cityId)` | Fetches live USD rate from Frankfurter API; caches per session |
| `renderCurrencySection(cityId)` | Renders currency section with loading placeholder, then patches with live rate |

---

## `planner.js` Function Index

### Data helpers
| Function | Purpose |
|---|---|
| `getPhoto(name, cityImage, size)` | Cascading photo lookup: item.photo → PHOTO_MAP → CATEGORY_PHOTOS → city → generic |
| `getPlacePhotos(name, cityImage)` | Multi-photo array for profile slideshow |
| `esc(s)` | HTML-escape for content / double-quoted attributes |
| `jsq(s)` | HTML-escape + apostrophe escape for single-quoted onclick JS strings |
| `renderStars(rating)` | HTML entity stars with opacity (★★★½☆) |
| `getVibes(place)` | Derives up to 2 vibe tags from place price/rating/name/tip |
| `getDayStats(day)` | Returns `{ count, hours, totalCost, energy }` for a day |

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
| `renderBudgetBar()` | Planned spend vs. budget bar in hero |

### Tabs
| Function | Purpose |
|---|---|
| `switchTab(tab)` | Switches between saves / itinerary / discover / rewards |
| `renderRewardsTab()` | Renders credit card hub: cards, city tips, checklist, blog articles |
| `toggleBlogCard(index)` | Expands/collapses a blog article |

### Itinerary
| Function | Purpose |
|---|---|
| `renderDatePills()` | Date pills with energy dot (🟢/🟡/🔴) |
| `renderItinCards()` | Day health bar + placed card list |
| `renderPlacedCard(card, dayId, num)` | Single card HTML (draggable) |
| `addCardToDay(dayId, place)` | Add place to a day |
| `removeCard(dayId, cardId)` | Remove card from a day |
| `reorderCard(...)` | Drag-drop reorder |

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

### Map
| Function | Purpose |
|---|---|
| `initMap()` | Leaflet init + invalidateSize at 100/400/900ms |
| `updateMapPins()` | Redraws all pins: itinerary (teal), saves (pink), discover (grey) |

---

## Vibe Tag Logic

Vibes are derived automatically — no manual tagging needed.

| Vibe | Trigger conditions |
|---|---|
| 💎 Hidden Gem | Not famous, rating ≥ 4.6, price ≤ $20, has a local tip |
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

## Day Health Score Logic

| Places | Energy level | Dot color |
|---|---|---|
| 1–2 | 😌 Chill day | 🟢 Green |
| 3–4 | ⚡ Moderate | 🟡 Yellow |
| 5+  | 🔥 Packed day | 🔴 Red |

Duration estimated from `duration` string (`"1-2 hrs"` → 1h, `"Full day"` → 8h, no data → 1.5h default). Cost summed from `card.price` values.

---

## Local Language / Audio System

### `CITY_LANGUAGES` (app.js)

Object keyed by city ID. 34 cities, 16+ languages/dialects.

Each `phrases` entry: `{ p: "phrase text", m: "meaning", r: "pronunciation hint (optional)" }`

`speakPhrase(text, bcp47)` — plays a phrase using the Web Speech API:
1. Cancels any in-progress speech
2. Creates a `SpeechSynthesisUtterance` with the phrase and BCP47 language tag
3. Sets rate to 0.85 (slightly slower for clarity)
4. Filters available browser voices by language, then picks by gender using keyword matching
5. Falls back to last voice (female) or first voice (male) when no keyword match

---

## PWA Share Target

`manifest.json` registers the app as a share target. When a user shares an Instagram or TikTok post to Dropped, the app opens at `planner.html?title=...&text=...&url=...`. `handleIncomingShare()` reads these params, detects the source, extracts the place name, and opens the Quick Add modal pre-filled.

**Note:** Share Target only works when installed as a PWA on a real device.

---

## Known Gotchas

| Gotcha | Fix |
|---|---|
| `supabaseClient` vs `supabase` | Always use `supabaseClient` — the CDN declares `var supabase` globally; using that name causes a SyntaxError in strict mode |
| data.js double commas | If you append via string manipulation, the last original item may already have a trailing comma → creates `undefined` holes. Always run the hole-check script after edits |
| `applyFilter` in app.js (~line 527) | `let items = [...(currentCity[currentTab] || [])].filter(Boolean)` — the `.filter(Boolean)` strips sparse-array holes. Don't remove it |
| photo fallback loop | `onerror` is chained via `this._fb` flag — without it, a broken city hero image would trigger infinite retry loops |
| localStorage key | `dropped_v2` — wiping this resets all trips. Both `app.js` and `planner.js` read/write the same key |
| Globe IIFE scope | Homepage globe JS is wrapped in `(function(){})()` — vars don't leak to window. Call `openCity()` with a `typeof` guard: `if (typeof openCity === 'function') openCity(id)` |
| Port 9056 | Local server runs on 9056 (not 8080 or 3000) |
| `plus.unsplash.com` | Premium/paid Unsplash images — will return 403 in production. Always use `images.unsplash.com` |

---

## Bugs Fixed

### 2026-04-28 (Session 8)
- **Globe images fixed:** Toronto, Marrakech, Charlotte, Memphis, Salt Lake City had wrong or blank hero images (Toronto showed a portrait of a girl, Salt Lake City showed a man's face). Replaced all five with correct city skyline photos from `images.unsplash.com`.
- **Globe search opens city modal:** Clicking a search result in the homepage globe previously linked to `globe.html`. Now calls `openCity(id)` directly to open the city detail modal on the current page.
- **Homepage globe layout:** Made globe full-width (edge-to-edge), lowered camera altitude from 2.2 → 1.8, added explicit `width()`/`height()` on init so the Earth fills the canvas instead of appearing in a corner.
- **Collaborator merge conflicts:** Resolved 38 conflicts in `data.js` (kept our Unsplash/Wikipedia photo URLs over collaborator's broken local `/photos/*.jpg` paths) and 14 conflicts in `globe.html` (took collaborator's CSS, then restored our JS continent-click and ring-animation features).
- **Developer onboarding:** Added comprehensive comment blocks to `data.js`, `app.js`, and `planner.js` headers. Fixed "PinTrip" → "Dropped" in `app.js`, `admin.js`, `admin-setup.sql`, `config.js`, and `planner.html` canonical URLs. Moved all build scripts to `scripts/` directory. Rewrote DOCUMENTATION.md.

### 2026-04-19 (Session 7)
- **CSP blocked Frankfurter API:** `api.frankfurter.app` was not in `connect-src`. Added it to `_headers`.
- **`reset-password.html` missing:** Users who clicked a Supabase password reset email got a 404. Created the page with `onAuthStateChange` handling for the `PASSWORD_RECOVERY` event.
- **`addIdea()` double-click duplicates:** No disabled state during async insert. Added `btn.disabled = true/false` around the insert; capped idea text at 500 chars.

### 2026-04-16 (Session 6)
- **Null crashes in app.js planner helpers:** `renderKanban`, `updateTripStartDate`, `moveCard`, `addDay`, `removeDay`, `addCard`, `removeCard` all accessed `currentTrip.xxx` without null-guarding. All now start with `if (!currentTrip) return`.

### 2026-04-15 (Session 5)
- **Food expansion:** All 34 cities expanded to ~10 restaurants per cuisine genre (6,418 total). Patch-and-merge script used.
- **Double-comma corruption:** Merge script created `},,,{` sparse-array elisions in all 34 food arrays. Fixed by removing the extra commas. Added `.filter(Boolean)` defensive guard to `applyFilter`.
- **Local dev port corrected in docs:** Was listed as 8080, actual is 9056.

### 2026-04-14 (Session 4)
- **18 new cities added:** 10 international + 8 US. Total now 34 cities.
- **Search bar in city modal:** Live filter wired to `applyFilter()`.
- **GENRE_EMOJI expanded to 300+ entries:** New cities introduced ~294 unmapped cuisine strings.
- **3 missing PACK_DATA entries:** `international_pacific`, `international_mideast`, `international_latam` were undefined — silently fell back to `city_usa`. Added all three.
- **COL budget table expanded:** Now covers all 34 cities.
- **CITY_LANGUAGES added for all new cities.**
- **XSS fixes:** `idea.id` in onclick (app.js), trending section city names (planner.js), rewards tab earn rates (planner.js).
- **CITY_COORDS key mismatch:** Map used key `la` but data.js uses `losangeles`. Added `losangeles` entry.

### 2026-04-10 (Session 3)
- **SyntaxError on apostrophes:** `escHtml()` converts `'` → `&#39;`; browsers decode it before JS evaluation, breaking `onclick` handlers. Added `jsqApp()` and replaced all unsafe onclick uses.
- **Statue of Liberty + Brooklyn Bridge images 404:** Unsplash IDs deleted. Replaced with local downloads.
- **Spanish phrases on US cities:** US cities incorrectly showed Spanish. Added English `CITY_LANGUAGES` entries for all US cities.

### 2026-04-08 (Session 2)
- **XSS in `renderCards()` and `renderFoodByGenre()`:** `item.name`, `item.tip`, `genre` injected raw. Fixed with `escHtml()`.
- **XSS in search suggestions:** City name and country unescaped. Fixed.
- **Search suggestion onclick:** Used closure variables that don't exist in global scope. Fixed to use `document.getElementById()`.
- **Missing HSTS header:** Added to `_headers`.

### 2026-04-08 (Session 1)
- **`signOut()` used wrong variable:** Called `if (supabase)` instead of `if (supabaseClient)` — sign-out silently failed.
- **CSP blocked planner resources:** Missing `unpkg.com`, `*.tile.openstreetmap.org`, `*.fl.yelpcdn.com`.
- **Mobile map had no close button:** Added `✕ Close Map` button.
- **Unicode star rendering:** `★½☆` garbled on Windows — switched to HTML entities with opacity.
- **Photo not propagating to placed/saved cards:** Added `photo` field through save/add flows.
