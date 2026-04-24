// fetch_wiki_photos.js
// Fetches specific Wikipedia photos for every food/activity item in data.js
// Output: wiki_photos.json  { "item name": "https://upload.wikimedia.org/..." }

const https = require('https');
const fs    = require('fs');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/* Wikipedia REST API — returns thumbnail URL (resized to 800px) or null */
function wikiPhoto(title) {
  return new Promise((resolve) => {
    const path = '/api/rest_v1/page/summary/' + encodeURIComponent(title.trim().replace(/\s+/g, '_'));
    const req = https.get(
      { hostname: 'en.wikipedia.org', path, headers: { 'User-Agent': 'pintrip-travel-app/1.0 (https://pintrip.netlify.app)' } },
      (res) => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
          try {
            const j = JSON.parse(d);
            if (j.type === 'disambiguation' || j.type === 'https://mediawiki.org/wiki/HyperSwitch/errors/not_found') {
              return resolve(null);
            }
            let url = j.thumbnail?.source || j.originalimage?.source || null;
            if (url) {
              // Resize thumb to 800px
              if (url.includes('/thumb/')) {
                url = url.replace(/\/\d+px-([^/]+)$/, '/800px-$1');
              }
              // Block SVG logos — they look bad as photo cards
              if (url.match(/\.(svg|SVG)/)) url = null;
            }
            resolve(url);
          } catch { resolve(null); }
        });
      }
    );
    req.on('error', () => resolve(null));
    req.setTimeout(7000, () => { req.destroy(); resolve(null); });
  });
}

/* Build ordered list of Wikipedia search candidates for a food item */
function foodQueries(item) {
  const name    = (item.name || '').trim();
  const cuisine = (item.cuisine || '').trim();
  const q = [];

  // 1. Exact name
  q.push(name);

  // "X at Y" → try dish first, then restaurant
  if (name.includes(' at ')) {
    const [dish, place] = name.split(' at ');
    q.push(dish.trim(), place.trim());
  }

  // "X (Y)" → try both parts
  const paren = name.match(/^(.+?)\s*\(([^)]+)\)/);
  if (paren) { q.push(paren[1].trim(), paren[2].trim()); }

  // Cuisine-based fallbacks
  if (cuisine) {
    q.push(cuisine + ' cuisine', cuisine + ' food', cuisine);
  }

  // First two words of name (cuts "(Maui)" style suffixes)
  const short = name.replace(/\s*\([^)]*\)/g,'').replace(/,.*$/,'').trim();
  if (short !== name) q.push(short);

  return [...new Set(q)].filter(Boolean);
}

/* Build ordered list of Wikipedia search candidates for an activity item */
function activityQueries(item, cityName) {
  const name = (item.name || '').trim();
  const q = [];

  q.push(name);

  // Remove leading prefixes that confuse Wikipedia
  const cleaned = name
    .replace(/^Day Trip to /i, '')
    .replace(/^Visit /i, '')
    .replace(/^Walking Tour of /i, '')
    .replace(/^Cooking Class/i, 'Cuisine')
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/,.*$/, '')
    .trim();

  if (cleaned !== name) q.push(cleaned);
  if (cityName) q.push(`${cleaned} ${cityName}`);

  // Short form (first 3 words)
  const words = cleaned.split(' ');
  if (words.length > 3) q.push(words.slice(0,3).join(' '));

  return [...new Set(q)].filter(Boolean);
}

/* Try each query in order, return first hit */
async function findPhoto(queries) {
  for (const q of queries) {
    if (!q || q.length < 3) continue;
    const url = await wikiPhoto(q);
    if (url) return { url, query: q };
    await sleep(80);
  }
  return null;
}

/* Concurrency limiter */
async function pooled(tasks, concurrency) {
  const results = new Array(tasks.length);
  let idx = 0;
  async function worker() {
    while (idx < tasks.length) {
      const i = idx++;
      results[i] = await tasks[i]();
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

async function main() {
  console.log('Parsing data.js…');
  const src = fs.readFileSync('./data.js', 'utf8');

  // Safe eval — extract just the CITIES array
  const citiesStart = src.indexOf('const CITIES');
  const citiesEnd   = src.indexOf('\nconst REWARDS_CARDS');
  let citiesCode = src.slice(citiesStart, citiesEnd > 0 ? citiesEnd : src.length);
  citiesCode = citiesCode.replace('const CITIES', 'var CITIES');

  let CITIES;
  try {
    const vm = require('vm');
    const ctx = vm.createContext({});
    vm.runInContext(citiesCode.replace(/\bconst\b/g, 'var').replace(/\blet\b/g, 'var'), ctx);
    CITIES = ctx.CITIES;
  } catch(e) { console.error('Parse error:', e.message); process.exit(1); }
  if (!CITIES) { console.error('CITIES not found'); process.exit(1); }

  console.log(`Found ${CITIES.length} cities. Building task list…`);

  // Collect all items
  const items = [];
  for (const city of CITIES.filter(Boolean)) {
    for (const item of (city.activities || []).filter(Boolean)) {
      items.push({ item, tab: 'activities', city });
    }
    for (const item of (city.food || []).filter(Boolean)) {
      items.push({ item, tab: 'food', city });
    }
  }
  console.log(`${items.length} food/activity items to process.`);

  const results = {}; // name → url
  const queryLog = {}; // name → winning query
  let found = 0, skipped = 0;

  const tasks = items.map(({ item, tab, city }) => async () => {
    const queries = tab === 'food'
      ? foodQueries(item)
      : activityQueries(item, city.name);

    const hit = await findPhoto(queries);
    if (hit) {
      results[item.name] = hit.url;
      queryLog[item.name] = hit.query;
      found++;
    } else {
      skipped++;
    }
    const total = found + skipped;
    if (total % 100 === 0) {
      process.stdout.write(`\r  ${total}/${items.length}  found=${found}  skipped=${skipped}   `);
    }
  });

  console.log('Fetching from Wikipedia (concurrency=8)…');
  await pooled(tasks, 8);

  console.log(`\nDone: ${found} photos found, ${skipped} not found.`);

  fs.writeFileSync('./wiki_photos.json',   JSON.stringify(results, null, 2));
  fs.writeFileSync('./wiki_query_log.json', JSON.stringify(queryLog, null, 2));
  console.log('Saved wiki_photos.json and wiki_query_log.json');
  console.log(`Coverage: ${((found/(found+skipped))*100).toFixed(1)}%`);
}

main().catch(console.error);
