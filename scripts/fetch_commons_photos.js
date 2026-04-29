// fetch_commons_photos.js
// Fetches 15 photo URLs per cuisine/activity category from Wikimedia Commons
// Then assigns one to each food/activity item that still has a generic/duplicate photo
// Output: applies directly to data.js

const https = require('https');
const fs    = require('fs');
const vm    = require('vm');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/* Fetch up to N file names from a Wikimedia Commons category */
function fetchCategoryFiles(category, limit = 20) {
  return new Promise((resolve) => {
    const qs = new URLSearchParams({
      action: 'query', list: 'categorymembers',
      cmtitle: category, cmtype: 'file',
      cmlimit: String(limit), cmnamespace: '6', format: 'json'
    });
    https.get({
      hostname: 'commons.wikimedia.org',
      path: '/w/api.php?' + qs,
      headers: { 'User-Agent': 'pintrip-travel-app/1.0' }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(d);
          resolve((j.query?.categorymembers || []).map(m => m.title));
        } catch { resolve([]); }
      });
    }).on('error', () => resolve([]));
  });
}

/* Fetch thumb URL for a Wikimedia file title */
function fetchFileUrl(title) {
  return new Promise((resolve) => {
    const qs = new URLSearchParams({
      action: 'query', titles: title,
      prop: 'imageinfo', iiprop: 'url',
      iiurlwidth: '800', format: 'json'
    });
    https.get({
      hostname: 'commons.wikimedia.org',
      path: '/w/api.php?' + qs,
      headers: { 'User-Agent': 'pintrip-travel-app/1.0' }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(d);
          const pages = Object.values(j.query?.pages || {});
          const url = pages[0]?.imageinfo?.[0]?.thumburl || null;
          // Skip SVGs and tiny files
          if (url && url.match(/\.(svg|SVG)/)) return resolve(null);
          resolve(url);
        } catch { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

/* Fetch up to `count` usable photo URLs for a category */
async function getCategoryPhotos(category, count = 15) {
  const files = await fetchCategoryFiles(category, count * 2);
  const urls = [];
  for (const file of files) {
    if (urls.length >= count) break;
    const url = await fetchFileUrl(file);
    if (url) urls.push(url);
    await sleep(60);
  }
  return urls;
}

/* ── Category maps ── */
// cuisine string → Wikimedia Commons category
const CUISINE_CATS = {
  'Ramen':              'Category:Ramen',
  'Sushi':              'Category:Sushi',
  'Tempura':            'Category:Tempura',
  'Yakitori':           'Category:Yakitori',
  'Wagyu':              'Category:Wagyu',
  'Tonkatsu':           'Category:Tonkatsu',
  'Japanese':           'Category:Japanese cuisine',
  'Korean BBQ':         'Category:Korean barbecue',
  'Korean':             'Category:Korean cuisine',
  'Bibimbap':           'Category:Bibimbap',
  'Dim Sum':            'Category:Dim sum',
  'Peking Duck':        'Category:Peking duck',
  'Chinese':            'Category:Chinese cuisine',
  'Pho':                'Category:Phở',
  'Banh Mi':            'Category:Bánh mì',
  'Vietnamese':         'Category:Vietnamese cuisine',
  'Pad Thai':           'Category:Pad thai',
  'Thai':               'Category:Thai cuisine',
  'Indian':             'Category:Indian cuisine',
  'Curry':              'Category:Curry',
  'Biryani':            'Category:Biryani',
  'Dosa':               'Category:Dosa',
  'Pizza':              'Category:Pizza',
  'Pasta':              'Category:Pasta',
  'Risotto':            'Category:Risotto',
  'Gelato':             'Category:Gelato',
  'Italian':            'Category:Italian cuisine',
  'Tapas':              'Category:Tapas',
  'Paella':             'Category:Paella',
  'Spanish':            'Category:Spanish cuisine',
  'French':             'Category:French cuisine',
  'Croissant':          'Category:Croissants',
  'Crepes':             'Category:Crêpes',
  'Mexican':            'Category:Mexican cuisine',
  'Tacos':              'Category:Tacos',
  'Burrito':            'Category:Burritos',
  'Empanadas':          'Category:Empanadas',
  'Argentinian':        'Category:Argentine cuisine',
  'Brazilian':          'Category:Brazilian cuisine',
  'BBQ':                'Category:Barbecue',
  'American BBQ':       'Category:Barbecued foods',
  'Fried Chicken':      'Category:Fried chicken',
  'Burgers':            'Category:Hamburgers',
  'American':           'Category:American cuisine',
  'Steak':              'Category:Steaks',
  'Seafood':            'Category:Seafood dishes',
  'Fish and Chips':     'Category:Fish and chips',
  'British':            'Category:British cuisine',
  'Irish':              'Category:Irish cuisine',
  'German':             'Category:German cuisine',
  'Greek':              'Category:Greek cuisine',
  'Turkish':            'Category:Turkish cuisine',
  'Kebab':              'Category:Kebabs',
  'Moroccan':           'Category:Moroccan cuisine',
  'Ethiopian':          'Category:Ethiopian cuisine',
  'Middle Eastern':     'Category:Middle Eastern cuisine',
  'Israeli':            'Category:Israeli cuisine',
  'Lebanese':           'Category:Lebanese cuisine',
  'Falafel':            'Category:Falafel',
  'Hummus':             'Category:Hummus',
  'Malaysian':          'Category:Malaysian cuisine',
  'Singaporean':        'Category:Singaporean cuisine',
  'Indonesian':         'Category:Indonesian cuisine',
  'Nasi Goreng':        'Category:Nasi goreng',
  'Balinese':           'Category:Balinese cuisine',
  'Filipino':           'Category:Filipino cuisine',
  'Ice Cream':          'Category:Ice cream',
  'Cake':               'Category:Cakes',
  'Dessert':            'Category:Desserts',
  'Bakery':             'Category:Bakeries',
  'Coffee':             'Category:Coffee',
  'Tea':                'Category:Tea',
  'Beer':               'Category:Beer',
  'Wine':               'Category:Wine',
  'Cocktails':          'Category:Cocktails',
  'Street Food':        'Category:Street food',
  'Brunch':             'Category:Brunch',
  'Seafood Boil':       'Category:Seafood boil',
  'Soul Food':          'Category:Soul food',
  'Creole':             'Category:Creole cuisine',
  'Cajun':              'Category:Cajun cuisine',
  'Caribbean':          'Category:Caribbean cuisine',
  'Peruvian':           'Category:Peruvian cuisine',
  'Colombian':          'Category:Colombian cuisine',
  'Cuban':              'Category:Cuban cuisine',
  'Sandwich':           'Category:Sandwiches',
  'Hot Dog':            'Category:Hot dogs',
  'Deli':               'Category:Delicatessen',
  'Steakhouse':         'Category:Steakhouses',
  'Izakaya':            'Category:Izakaya',
  'Omakase':            'Category:Omakase',
  'Noodles':            'Category:Noodle dishes',
  'Dumpling':           'Category:Dumplings',
  'Gyoza':              'Category:Gyoza',
  'Shabu-Shabu':        'Category:Shabu-shabu',
  'Yakiniku':           'Category:Yakiniku',
  'Teppanyaki':         'Category:Teppanyaki',
  'Udon':               'Category:Udon',
  'Okonomiyaki':        'Category:Okonomiyaki',
};

// activity keyword → Wikimedia Commons category
const ACTIVITY_CATS = {
  'museum':       'Category:Museum interiors',
  'art':          'Category:Art galleries',
  'gallery':      'Category:Art galleries',
  'history':      'Category:History museums',
  'natural history': 'Category:Natural history museums',
  'science':      'Category:Science museums',
  'park':         'Category:Urban parks',
  'garden':       'Category:Botanical gardens',
  'beach':        'Category:Beaches',
  'mountain':     'Category:Mountain landscapes',
  'hiking':       'Category:Hiking trails',
  'temple':       'Category:Buddhist temples',
  'church':       'Category:Churches',
  'mosque':       'Category:Mosques',
  'palace':       'Category:Palaces',
  'castle':       'Category:Castles',
  'cathedral':    'Category:Cathedrals',
  'market':       'Category:Markets',
  'night market': 'Category:Night markets',
  'street':       'Category:Street photography',
  'concert':      'Category:Concert venues',
  'theater':      'Category:Theaters',
  'opera':        'Category:Opera houses',
  'festival':     'Category:Festivals',
  'zoo':          'Category:Zoological gardens',
  'aquarium':     'Category:Aquariums',
  'waterfall':    'Category:Waterfalls',
  'lake':         'Category:Lakes',
  'island':       'Category:Islands',
  'tower':        'Category:Towers',
  'bridge':       'Category:Bridges',
  'canal':        'Category:Canals',
  'river':        'Category:Rivers',
  'sunset':       'Category:Sunsets',
  'sunrise':      'Category:Sunrises',
  'cooking':      'Category:Cooking',
  'wine':         'Category:Wine tasting',
  'brewery':      'Category:Breweries',
  'stadium':      'Category:Sports stadiums',
  'golf':         'Category:Golf courses',
  'surfing':      'Category:Surfing',
  'kayaking':     'Category:Kayaking',
  'cycling':      'Category:Cycling',
  'skiing':       'Category:Ski slopes',
  'spa':          'Category:Spas',
};

/* Deterministic hash → index into photo array */
function nameHash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return Math.abs(h);
}

/* Match cuisine string to our category map */
function cuisineToCategory(cuisine) {
  if (!cuisine) return null;
  const c = cuisine.trim();
  if (CUISINE_CATS[c]) return CUISINE_CATS[c];
  // Partial match
  for (const [key, cat] of Object.entries(CUISINE_CATS)) {
    if (c.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(c.toLowerCase())) return cat;
  }
  return null;
}

/* Match activity name to category map */
function activityToCategory(name) {
  const n = name.toLowerCase();
  for (const [kw, cat] of Object.entries(ACTIVITY_CATS)) {
    if (n.includes(kw)) return cat;
  }
  return null;
}

/* Apply a URL to data.js for a named item */
function applyPhoto(src, name, url) {
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(
    `(["']?name["']?\\s*:\\s*["']${esc}["'][\\s\\S]{0,700}?["']?photo["']?\\s*:\\s*["'])([^"']+)(["'])`,
    'g'
  );
  const after = src.replace(re, `$1${url}$3`);
  return { src: after, changed: after !== src };
}

/* ── Main ── */
async function main() {
  console.log('Parsing data.js…');
  const rawSrc = fs.readFileSync('./data.js', 'utf8');
  const citiesStart = rawSrc.indexOf('const CITIES');
  const citiesEnd   = rawSrc.indexOf('\nconst REWARDS_CARDS');
  let citiesCode = rawSrc.slice(citiesStart, citiesEnd > 0 ? citiesEnd : rawSrc.length);
  citiesCode = citiesCode.replace(/\bconst\b/g, 'var').replace(/\blet\b/g, 'var');
  let CITIES;
  try { const ctx = vm.createContext({}); vm.runInContext(citiesCode, ctx); CITIES = ctx.CITIES; }
  catch(e) { console.error('Parse error:', e.message); process.exit(1); }

  // Collect items that still need photos (those using generic/duplicate IDs)
  // We'll detect "generic" by checking if the photo field contains one of the top-10 most-used IDs
  const photoCount = {};
  const idRe = /photo-([A-Za-z0-9_-]+)\?/g;
  let m;
  while ((m = idRe.exec(rawSrc)) !== null) photoCount[m[1]] = (photoCount[m[1]]||0)+1;
  const GENERIC_IDS = new Set(
    Object.entries(photoCount).filter(([,n]) => n >= 20).map(([id]) => id)
  );
  console.log(`Found ${GENERIC_IDS.size} generic/duplicate photo IDs (used 20+ times)`);

  // Build set of items needing new photos (those using generic IDs or wikimedia already applied)
  const needsPhoto = new Set();
  for (const city of CITIES.filter(Boolean)) {
    for (const item of [...(city.activities||[]), ...(city.food||[])].filter(Boolean)) {
      if (!item.name || !item.photo) continue;
      const id = item.photo.match(/photo-([A-Za-z0-9_-]+)/)?.[1];
      if (id && GENERIC_IDS.has(id)) needsPhoto.add(item.name);
    }
  }
  console.log(`${needsPhoto.size} items need new photos.`);

  // Collect unique categories needed
  const catsNeeded = new Set();
  for (const city of CITIES.filter(Boolean)) {
    for (const item of [...(city.activities||[]), ...(city.food||[])].filter(Boolean)) {
      if (!item.name || !needsPhoto.has(item.name)) continue;
      const cat = item.cuisine
        ? cuisineToCategory(item.cuisine)
        : activityToCategory(item.name);
      if (cat) catsNeeded.add(cat);
    }
  }
  console.log(`Fetching photos for ${catsNeeded.size} Wikimedia Commons categories…`);

  // Fetch photos for each category
  const catPhotos = {};
  let catsDone = 0;
  for (const cat of catsNeeded) {
    const urls = await getCategoryPhotos(cat, 15);
    catPhotos[cat] = urls;
    catsDone++;
    if (urls.length > 0) {
      process.stdout.write(`\r  ${catsDone}/${catsNeeded.size} cats, ${urls.length} photos for "${cat.replace('Category:','')}"   `);
    } else {
      process.stdout.write(`\r  ${catsDone}/${catsNeeded.size} cats, EMPTY: "${cat.replace('Category:','')}"   `);
    }
    await sleep(200);
  }
  console.log('\nAll categories fetched.');

  // Apply photos to data.js
  let src = rawSrc;
  let patched = 0, nocat = 0, nophoto = 0;

  for (const city of CITIES.filter(Boolean)) {
    for (const item of [...(city.activities||[]), ...(city.food||[])].filter(Boolean)) {
      if (!item.name || !needsPhoto.has(item.name)) continue;

      const cat = item.cuisine
        ? cuisineToCategory(item.cuisine)
        : activityToCategory(item.name);

      if (!cat) { nocat++; continue; }

      const urls = catPhotos[cat];
      if (!urls || urls.length === 0) { nophoto++; continue; }

      const url = urls[nameHash(item.name) % urls.length];
      const { src: newSrc, changed } = applyPhoto(src, item.name, url);
      if (changed) { src = newSrc; patched++; }
    }
  }

  fs.writeFileSync('./data.js', src);
  console.log(`\nDone: ${patched} patched, ${nocat} no category match, ${nophoto} no photos for category`);
}

main().catch(console.error);
