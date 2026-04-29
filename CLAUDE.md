# Dropped — Claude Context

Travel itinerary PWA. Vanilla HTML/CSS/JS, no build step. Two surfaces: `index.html` (explore cities) and `planner.html` (plan a trip).

**Full docs:** `DOCUMENTATION.md`

---

## Run Locally

```bash
cd "C:/Users/MasterPark/.gemini/antigravity/scratch/itinerary-app"
python -m http.server 9056
```
- Explore: http://localhost:9056
- Planner: http://localhost:9056/planner.html
- Admin:   http://localhost:9056/admin.html (needs Supabase auth)

**Deploy:** `netlify deploy --dir . --prod`

---

## Key Files

| File | What it does |
|---|---|
| `data.js` | All city data — 34 cities, food, activities, transport, credit card rewards |
| `app.js` | index.html logic — city browser, food/activity tabs, group boards, auth |
| `planner.js` | planner.html logic — trips, itinerary, map, discover, saves, rewards |
| `config.js` | Supabase URL + anon key (safe to share — governed by RLS) |
| `_headers` | Netlify CSP/HSTS headers |

---

## Data Model (data.js)

```js
// City entry
{
  id: "nyc",           // used as key everywhere — must be unique, lowercase, no spaces
  name: "New York City",
  country: "USA",
  image: "https://images.unsplash.com/...",
  iata: "JFK",
  packType: "city_usa",  // controls packing list — see PACK_DATA in app.js
  activities: [{ name, price, rating, duration, tip, desc, photo }],
  food:       [{ name, price, rating, cuisine, tip, desc, photo }],
  // food: ~10 restaurants per cuisine genre, 6418 total across all 34 cities
  transport:  [{ name, price, rating, type, tip }],
}
```

Food items use two valid JS object formats (both work identically at runtime):
- Original: `{ cuisine: "Ramen", ... }`
- Appended:  `{"cuisine":"Ramen", ...}` (JSON.stringify output — valid JS object literal)

---

## Critical Rules

### XSS — always escape dynamic data
- `escHtml(s)` / `esc(s)` — for HTML content and double-quoted attributes
- `jsqApp(s)` / `jsq(s)` — for strings inside single-quoted `onclick='...'` handlers
- **Never** inject `item.name`, `item.tip`, city names, or user data raw into `innerHTML`

### data.js edits — watch for double commas
If you ever append items to a food/activities array in data.js using string manipulation, the last original item may already have a trailing comma. Adding another `,` before new items creates a sparse-array hole (`undefined`). Always verify with:
```bash
node --check data.js
node -e "eval(require('fs').readFileSync('./data.js','utf8').replace('const CITIES','var CITIES')); CITIES.forEach(c => { const bad=(c.food||[]).filter(x=>!x).length; if(bad) console.log(c.id, bad, 'holes'); })"
```

### app.js applyFilter — spreads city arrays
Line ~527: `let items = [...(currentCity[currentTab] || [])].filter(Boolean)`
The `.filter(Boolean)` strips any `undefined` holes before filtering. Keep it there.

---

## Adding a City

1. Add to `CITIES` in `data.js` (copy existing city as template)
2. Add `yourcityid: [lat, lng]` to `CITY_COORDS` in `planner.js`
3. Add `yourcityid: {b, m, l}` to `COL` in `app.js` (daily budget rates)
4. Add `yourcityid: { name, bcp47, phrases }` to `CITY_LANGUAGES` in `app.js`
5. Add any new cuisine strings to `GENRE_EMOJI` in `app.js`

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

## Adding Food (bulk)

Write patch files and merge:
1. Create `food_patch_CITYID.json`: `{"cityid": [{name, price, rating, cuisine, tip, desc, photo}]}`
2. Use `cuisine` strings that exactly match existing genres for that city (check data.js)
3. Run `node merge_food.js` (create it if needed — see DOCUMENTATION.md Bugs Fixed 2026-04-15)
4. Verify: `node --check data.js` + hole check above
5. Restart server

---

## Map (planner.js)

- **Leaflet + OpenStreetMap** pins on the Map tab
- `CITY_COORDS` — `{cityid: [lat, lng]}` for all 34 cities
- `jitter(cityCoord, seed)` — spreads pins ±2.5 km from center so they don't stack
- Discover tab shows top 30 rated items only (capped — city food arrays are large)

---

## Supabase

Used only for: group boards (index.html) and admin (admin.html). Credentials in `config.js`.
- `supabaseClient` — the JS client variable (renamed from `supabase` to avoid conflict with the CDN global `window.supabase`)
- All DB access is governed by RLS policies in `schema.sql`
- Anon key in config.js is safe to share — it has no elevated privileges

---

## Known Gotchas

- `planner.js` localStorage key is `dropped_v2` — wiping this resets all trips
- `supabaseClient` (not `supabase`) — the CDN declares `var supabase` globally; using that name causes a SyntaxError in strict mode
- Photo fallback chain: `item.photo` → `getSpotPhoto(name)` → city hero image
- `data.js` also contains `REWARDS_CARDS`, `CITY_REWARDS_TIPS`, `REWARDS_BLOG`, `REWARDS_CHECKLIST` after the city array
