// update-photos.js — assigns cuisine-matched and activity-matched Unsplash photos
// Run: node update-photos.js

const fs = require('fs');
let src = fs.readFileSync('./data.js', 'utf8');

// ── FOOD PHOTO POOLS ─────────────────────────────────────────────────────────
// keyword (lowercase, matched against cuisine name) → [photo-ID, ...]
// Longer keywords matched first for specificity. Multiple IDs = variety via name-hash.
const FOOD_MAP = [
  // Japanese
  [['ramen','tonkotsu','shoyu ramen','spicy ramen','miso ramen','udon'],
    ['photo-1569050467447-ce54b3bbc37d']],
  [['sushi','omakase','sashimi','nigiri','maki'],
    ['photo-1617196034183-421b4040ed20','photo-1534190760961-74e8c1c5c3da']],
  [['izakaya','yakitori','tempura','japanese','robata','kaiseki'],
    ['photo-1617196034183-421b4040ed20']],
  // Korean
  [['korean bbq','yakiniku'],
    ['photo-1590301157890-4810ed352733','photo-1544025162-d76694265947']],
  [['korean','bibimbap','galbi','bulgogi'],
    ['photo-1590301157890-4810ed352733']],
  // Chinese
  [['dim sum','yum cha','cantonese wonton'],
    ['photo-1563245372-f21724e3856d']],
  [['sichuan','chinese','cantonese','shanghainese','hong kong','peking'],
    ['photo-1563245372-f21724e3856d']],
  // Southeast Asian
  [['pad thai','northern thai','contemporary thai','thai'],
    ['photo-1569718212165-3a8278d5f624']],
  [['pho','banh mi','vietnamese','bun bo'],
    ['photo-1582878826629-29b7ad1cdc43']],
  [['laksa','hainanese','singaporean','bak kut teh','hawker','bak chor'],
    ['photo-1555126634-323283e090fa']],
  [['balinese','indonesian','nasi'],
    ['photo-1569718212165-3a8278d5f624']],
  [['cambodian','filipino','malaysian'],
    ['photo-1555126634-323283e090fa']],
  // Indian
  [['indian','curry','tandoor','masala','biryani','bombay','kerala','punjabi'],
    ['photo-1585937421612-70a008356fbe']],
  // Middle Eastern
  [['middle eastern','lebanese','israeli','persian','turkish','hummus','falafel',
    'mezze','shawarma','ottoman','levantine','moroccan'],
    ['photo-1561043433-aaf687c4cf04']],
  // Italian
  [['neapolitan pizza','roman pizza','sicilian pizza','artisan pizza','chicago deep dish',
    'caramelized deep dish','nyc pizza'],
    ['photo-1565299624946-b28f40a0ae38']],
  [['pizza'],
    ['photo-1565299624946-b28f40a0ae38']],
  [['pasta','roman trattoria','trattoria','osteria','venetian','italian fine','italian-american',
    'roman','sicilian','calabrian'],
    ['photo-1555396273-367ea4eb4db5']],
  [['italian'],
    ['photo-1555396273-367ea4eb4db5']],
  [['gelato','artisan gelato'],
    ['photo-1563805042-7684c019e1cb']],
  // French
  [['patisserie','crêpe','crepe','french bakery'],
    ['photo-1509440159596-0249088772ff']],
  [['french fine dining','traditional french','modern french','french brasserie',
    'french bistro','classic bistro','french'],
    ['photo-1414235077428-338989a2e8c0']],
  // Spanish / Mediterranean
  [['tapas','avant-garde tapas','catalan','paella','basque','cava'],
    ['photo-1543007630-9710e4a00a20']],
  [['spanish','mediterranean','greek','portuguese','levantine'],
    ['photo-1543007630-9710e4a00a20']],
  // Mexican & Latin
  [['street taco','austin taco','creative taco','birria','al pastor','baja mexican',
    'mission burrito','taco'],
    ['photo-1565299585323-38d6b0865b47']],
  [['mexican seafood','mexican fine','mexican','oaxacan','tex-mex','tex-mex diner'],
    ['photo-1551504734-5ee1c4a1479b']],
  [['peruvian','ceviche','lomo saltado'],
    ['photo-1551504734-5ee1c4a1479b']],
  // Cuban — specific overrides first
  [['cuban bakery'],
    ['photo-1509440159596-0249088772ff']],
  [['cuban breakfast','cuban cafeteria'],
    ['photo-1490645935967-10de6ba17061']],
  [['cuban fritas','cuban'],
    ['photo-1551504734-5ee1c4a1479b']],
  [['colombian','argentinian','brazilian','latin','puerto rican'],
    ['photo-1551504734-5ee1c4a1479b']],
  // American BBQ / Grill
  [['texas bbq','tennessee bbq','carolina bbq','pit bbq','bbq fusion','bbq + tex-mex',
    'bbq','brisket','smoked','ribs','smoke'],
    ['photo-1529193591184-b1d58069ecdd']],
  // Steakhouse
  [['old school steakhouse','classic steakhouse','british steakhouse','american steakhouse',
    'australian steakhouse','steakhouse','chophouse','steak'],
    ['photo-1546964124-0cce460f38ef']],
  // Seafood
  [['cajun seafood','mexican seafood','catalan seafood','fresh seafood','seafood',
    'oyster','lobster','crab','fish','shrimp','prawn','clam','chowder'],
    ['photo-1534080564583-6be75777b70a','photo-1559339352-11d035aa65de']],
  // Soul Food / Southern
  [['soul food','cajun-creole','classic creole','cajun','cajun-southern','creole',
    'southern brunch','southern','american soul','nashville hot','hot chicken'],
    ['photo-1547592180-85f173990554']],
  // Deli / Sandwiches
  [['jewish deli','deli','appetizing shop','pastrami','gourmet sandwich','sandwich'],
    ['photo-1553909489-cd47e0907980']],
  // Brunch / Breakfast
  [['asian fusion brunch','classic creole brunch','southern brunch','california brunch',
    'brunch buffet','brunch & dinner','brunch','breakfast/brunch','breakfast'],
    ['photo-1490645935967-10de6ba17061']],
  [['all-day café','california-inspired all-day'],
    ['photo-1490645935967-10de6ba17061']],
  // American / Farm-to-table
  [['american farm-to-table','farm-to-table','new american','modern american',
    'american brasserie','american fine dining','american gastropub',
    'american share plates','american sharing plates','american'],
    ['photo-1546069901-ba9599a7e63c']],
  // British
  [['british nose-to-tail','british seasonal','british gastropub','british-american','british'],
    ['photo-1547592180-85f173990554']],
  // Australian
  [['australian fine dining','australian bbq','australian steakhouse',
    'australian beach bar','australian bakery','australian burger','asian-australian'],
    ['photo-1546069901-ba9599a7e63c']],
  // Cocktail Bars
  [['craft cocktail bar','craft cocktails','cocktail bar','speakeasy','mixology'],
    ['photo-1551538827-9c037cb4f32a']],
  // Beer
  [['craft beer & charcuterie','craft beer & gastropub','craft beer','belgian beer bar',
    'beer garden','taproom','brewery'],
    ['photo-1436076863939-06870fe779c2']],
  // Wine
  [['wine bar','aperitivo & all-day','aperitivo','cava bar','natural wine'],
    ['photo-1510812431401-41d2bd2722f3']],
  // Coffee
  [['specialty coffee','third-wave coffee','single origin','pourover','espresso bar','coffee'],
    ['photo-1509042239860-f550ce710b93']],
  // Bakery / Pastry
  [['artisan bakery','cuban bakery','israeli bakery','australian bakery',
    'bakery & cafe','bakery','bread','beignets & café au lait','beignets','pastry'],
    ['photo-1509440159596-0249088772ff']],
  // Ice Cream
  [['artisan ice cream','artisan gelato','gelato','ice cream','soft serve','frozen yogurt'],
    ['photo-1563805042-7684c019e1cb']],
  // Café
  [['modern café','classic café','all-day café','café & cocktails','café','cafe'],
    ['photo-1493857671505-72967e2e2760']],
  // Food Hall / Market
  [['food hall','food market'],
    ['photo-1504674900247-0877df9cc836']],
  // Street Food
  [['global street food','asian street food','street tacos','street food'],
    ['photo-1555126634-323283e090fa']],
  // Vegetarian / Vegan
  [['vegan','vegetarian','plant-based'],
    ['photo-1512621776951-a57141f2eefd']],
  // Poke / Hawaiian
  [['poke','hawaiian'],
    ['photo-1559339352-11d035aa65de']],
  // Misc catch-alls
  [['bar & grill','beachfront bar & grill','bar & burgers','bar & games'],
    ['photo-1568901346375-23c9450c58cd']],
  [['burgers','burger'],
    ['photo-1568901346375-23c9450c58cd']],
  [['chicago dog','hot dog','sausage'],
    ['photo-1568901346375-23c9450c58cd']],
  [['italian beef','cheesesteak','sub','hoagie','philly'],
    ['photo-1553909489-cd47e0907980']],
  [['deep dish','chicago style'],
    ['photo-1565299624946-b28f40a0ae38']],
  [['charcuterie'],
    ['photo-1553909489-cd47e0907980']],
  [['grilled meats','mixed grill','asado','wood-fire','wood fire'],
    ['photo-1546964124-0cce460f38ef']],
  [['tasting menu','fine dining','chef\'s counter','modern tasting'],
    ['photo-1555396273-367ea4eb4db5']],
  [['sharing plates','small plates','share plates'],
    ['photo-1543007630-9710e4a00a20']],
  [['raw bar'],
    ['photo-1534080564583-6be75777b70a']],
  [['chicken rice','chicken noodle','chicken'],
    ['photo-1547592180-85f173990554']],
  [['cold noodles','noodle'],
    ['photo-1569050467447-ce54b3bbc37d']],
  [['convenience store'],
    ['photo-1555126634-323283e090fa']],
  [['natural wine'],
    ['photo-1510812431401-41d2bd2722f3']],
  [['provençal','provencal'],
    ['photo-1414235077428-338989a2e8c0']],
];

// ── ACTIVITY PHOTO POOLS ─────────────────────────────────────────────────────
const ACTIVITY_MAP = [
  [['museum','gallery','art museum','contemporary art','moma','smithsonian','louvre'],
    ['photo-1554907984-15263bfd63bd','photo-1580060839134-75a5edca2e99']],
  [['national park','state park','botanical garden','garden','park','green'],
    ['photo-1441974231531-c6227db76b6e','photo-1519046904884-53103b34b206']],
  [['beach','surf','snorkel','coastal','bay','ocean','reef','waterfall'],
    ['photo-1507525428034-b723cf961d3e','photo-1519046904884-53103b34b206']],
  [['hike','hiking','trail','trek','mountain','volcano','canyon','cliff'],
    ['photo-1551632811-561732d1e306','photo-1527489377706-5bf97e608852']],
  [['temple','shrine','pagoda','wat','mosque','cathedral','church','basilica','chapel'],
    ['photo-1528360983277-13d401cdc186','photo-1548013146-72479768bada']],
  [['market','bazaar','souq','night market','street market','grand bazaar'],
    ['photo-1488459716781-31db52582fe9','photo-1504674900247-0877df9cc836']],
  [['food tour','food market','hawker centre','food hall'],
    ['photo-1555126634-323283e090fa','photo-1504674900247-0877df9cc836']],
  [['nightlife','bar','club','speakeasy','rooftop bar','cocktail','lounge'],
    ['photo-1470225620780-dba8ba36b745','photo-1551538827-9c037cb4f32a']],
  [['theater','theatre','show','opera','concert','broadway','performance'],
    ['photo-1578944032637-f09897c5347c','photo-1507003211169-0a1dd7228f2d']],
  [['spa','wellness','massage','hot spring','onsen','hammam'],
    ['photo-1600334089648-b0d9d3028eb2','photo-1540555700478-4be289fbecef']],
  [['stadium','arena','sports','baseball','basketball','football','soccer'],
    ['photo-1540747913346-19e32dc3e97e','photo-1577223625816-7546f13df25d']],
  [['cycling','bike','kayak','paddleboard','boat','cruise','sailing','canoe'],
    ['photo-1507525428034-b723cf961d3e','photo-1519046904884-53103b34b206']],
  [['shopping','boutique','mall','fashion','district'],
    ['photo-1441986300917-64674bd600d8','photo-1567958451986-2de427a4a0be']],
  [['palace','castle','fort','citadel','historical','heritage','old town'],
    ['photo-1528360983277-13d401cdc186','photo-1548013146-72479768bada']],
  [['zoo','aquarium','safari','wildlife'],
    ['photo-1564349683136-77e08dba1ef7','photo-1558618666-fcd25c85cd64']],
  [['viewpoint','observation','tower','rooftop','scenic','overlook'],
    ['photo-1477959858617-67f85cf4f1df','photo-1480714378408-67cf0d13bc1b']],
  [['walking tour','tour','explore','discovery'],
    ['photo-1477959858617-67f85cf4f1df','photo-1480714378408-67cf0d13bc1b']],
];

// ── MATCHING LOGIC ────────────────────────────────────────────────────────────
function nameHash(str) {
  return [...(str || '')].reduce((a, c) => a + c.charCodeAt(0), 0);
}

function pickPhoto(text, map) {
  const t = (text || '').toLowerCase();
  for (const [keywords, pool] of map) {
    if (keywords.some(k => t.includes(k))) {
      const idx = nameHash(text) % pool.length;
      return `https://images.unsplash.com/${pool[idx]}?w=600&q=80`;
    }
  }
  return null;
}

// ── BUILD ORDERED UPDATE LIST ─────────────────────────────────────────────────
eval(src.replace('const CITIES', 'var CITIES').replace(/const \w+ = /g, 'var _z = '));

const updates = [];
CITIES.forEach(city => {
  // Activities come before food in data.js city objects
  (city.activities || []).filter(Boolean).forEach(item => {
    if (!item.photo || !item.photo.includes('images.unsplash.com')) return;
    const newPhoto = pickPhoto(item.name, ACTIVITY_MAP)
      || `https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&q=80`;
    updates.push({ old: item.photo, new: newPhoto });
  });
  (city.food || []).filter(Boolean).forEach(item => {
    if (!item.photo || !item.photo.includes('images.unsplash.com')) return;
    const newPhoto = pickPhoto(item.cuisine, FOOD_MAP)
      || `https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80`;
    updates.push({ old: item.photo, new: newPhoto });
  });
});

console.log('Total items to process:', updates.length);
const changes = updates.filter(u => u.old !== u.new).length;
console.log('Items that will change:', changes);

// ── APPLY UPDATES IN SEQUENCE ─────────────────────────────────────────────────
// Matches both: photo: "https://..." (unquoted JS key)
//           and "photo": "https://..." (JSON format)
let idx = 0;
const result = src.replace(
  /((?:["']photo["']|photo)\s*:\s*["'])https:\/\/images\.unsplash\.com\/photo-[^"']+\?w=600[^"']*(["'])/g,
  (_match, prefix, suffix) => {
    if (idx >= updates.length) return _match;
    const u = updates[idx++];
    return prefix + u.new + suffix;
  }
);

if (idx !== updates.length) {
  console.warn(`WARNING: processed ${idx} but expected ${updates.length}`);
}

fs.writeFileSync('./data.js', result, 'utf8');
console.log('Done. Wrote data.js');
