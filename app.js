/* ============================================================
   PinTrip — app.js
   - Supabase auth + real-time boards
   - City browsing, food genres, pack lists, essentials
   ============================================================ */

/* ===================== SUPABASE INIT ===================== */
let supabaseClient = null;
let currentUser = null;
let currentProfile = null;
let currentBoard = null;
let realtimeChannel = null;
const IS_CONFIGURED = typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL !== 'YOUR_SUPABASE_URL';

try {
  if (IS_CONFIGURED && window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }
} catch (e) {
  console.warn('Supabase failed to initialize:', e.message);
}

/* ===================== STATE ===================== */
let currentCity = null;
let currentTab = 'activities';
const _currencyRateCache = {};

/* ===================== PACK DATA ===================== */
const PACK_DATA = {
  city_usa: {
    clothing:  ['👟 Broken-in walking shoes — miles of pavement ahead', '🧥 Packable jacket for AC & cool evenings', '👔 1 smart-casual outfit for dinners out', '🩲 Moisture-wicking underwear (3+ pairs)', '🧢 Baseball cap for sunny days'],
    documents: ['🪪 Government-issued photo ID', '✈ Flight + hotel confirmations (printed)', '💳 Credit card with no foreign transaction fees', '📋 Travel insurance details + emergency contacts'],
    gear:      ['🔋 20,000mAh portable charger', '🎒 15–20L lightweight day pack', '🔒 TSA-approved luggage lock', '💊 Personal meds + basic first aid kit'],
    apps:      ['📍 Google Maps — download offline maps', '🚗 Uber/Lyft — set up payment in advance', '⭐ Yelp — reviews and hours', '🍽 OpenTable — book restaurants on the fly', '🌤 Weather app — check before heading out'],
  },
  beach: {
    clothing:  ['👙 Swimwear — pack 2+ so one is always dry', '🩴 Sandals + 1 pair walking shoes', '👒 Wide-brim hat — non-negotiable', '🕶 Polarized sunglasses', '👕 Lightweight linen shirt or cover-up'],
    documents: ['🪪 Government ID', '✈ Flight + hotel confirmations', '💳 Waterproof card holder', '📋 Travel insurance with medical coverage'],
    gear:      ['🧴 SPF 50+ reef-safe sunscreen', '🤿 Snorkel set (or rent on arrival)', '💧 Insulated water bottle', '🎒 Waterproof dry bag', '🔋 Portable charger in a dry bag'],
    apps:      ['🌊 Surfline — ocean & surf conditions', '📍 Google Maps offline', '🚗 Lyft / local taxi app', '☀ UV Index app', '🌤 Weather for daily planning'],
  },
  desert: {
    clothing:  ['👟 Closed-toe shoes for outdoor excursions', '🕶 UV-blocking sunglasses', '👒 Wide-brim or baseball hat', '🧥 Light jacket — desert nights drop fast', '🩳 Breathable shorts + one pair of pants'],
    documents: ['🪪 Government ID', '✈ Flight + hotel confirmations', '💳 Credit card + cash for tipping', '🎰 Casino rewards cards if applicable'],
    gear:      ['💧 Insulated water bottle — stays cold all day', '🔋 Portable charger', '🧴 SPF 50+ sunscreen', '🎒 Day pack for canyon excursions'],
    apps:      ['🚗 Lyft — cheaper than Strip taxis', '📍 Google Maps for canyon day trips', '🌡 UV Index + Weather app', '🎰 MGM Rewards / Caesars app'],
  },
  theme_park: {
    clothing:  ['👟 Most broken-in walking shoes — no exceptions', '🩳 Comfortable shorts or athletic wear', '🧥 Light hoodie — rides and AC are freezing', '🩱 Swimsuit for water attractions', '🧢 Cap for shade in queues'],
    documents: ['🎟 Park tickets pre-downloaded in app', '✈ Flight + hotel confirmations', '💳 Park credit card for discounts', '📋 Travel insurance'],
    gear:      ['💧 Refillable water bottle (free refills at Disney)', '🔋 Portable charger — MUST for mobile ordering', '🎒 Small light backpack', '🌂 Compact rain poncho', '🩹 Blister pads — your feet will thank you'],
    apps:      ['🏰 My Disney Experience or Universal App — ESSENTIAL', '📍 Google Maps', '🍕 Mobile order apps inside parks', '💳 Park loyalty app for discounts'],
  },
  international_europe: {
    clothing:  ['👟 Cobblestone-ready walking shoes (not new!)', '🧥 Packable rain jacket', '👔 1–2 nicer outfits — Europeans dress up for dinner', '🩴 Sandals for summer', '🧣 Light scarf for cathedrals'],
    documents: ['🛂 Passport — check 6+ months validity', '✈ Flight + accommodation confirmations', '💳 No-foreign-fee Visa or Mastercard', '🏥 European Health Card or travel insurance', '📋 EU entry requirements'],
    gear:      ['🔌 Type C EU power adapter', '🔋 Portable charger', '🎒 Anti-theft backpack', '💊 Stomach meds + melatonin for jet lag'],
    apps:      ['🗣 Google Translate — download offline language packs', '📍 Google Maps offline', '🚇 Citymapper — best metro navigator', '💶 Revolut or Wise for fee-free spending', '🔍 Google Lens — translate menus instantly'],
  },
  international_asia: {
    clothing:  ['👟 Slip-on shoes — many temples require removal', '🧥 Layers — indoor AC in Asia is intense', '👕 Modest coverage for shrines + temples', '☔ Compact umbrella', '🩴 Comfortable sandals'],
    documents: ['🛂 Passport — 6+ months validity', '✈ Hotel address in local script for taxis', '💳 Notify bank; carry cash — many places cash-only', '📋 Travel insurance + vaccination record'],
    gear:      ['🔌 Type A/C adapter', '🔋 Portable charger', '🎒 Anti-theft crossbody bag', '💊 Motion sickness tabs for trains'],
    apps:      ['🗣 Google Translate — camera translate is magic', '📍 Google Maps offline', '🚇 Local metro app (Suica, Pasmo etc.)', '🍜 Tabelog for local food spots', '💴 XE Currency'],
  },
  international_tropical: {
    clothing:  ['👙 Multiple swimwear sets', '🩴 Sandals + water shoes', '👕 Lightweight cotton or linen only', '🕶 Polarized sunglasses', '🌂 Compact rain jacket — afternoon rain is daily'],
    documents: ['🛂 Passport', '✈ Accommodation voucher printed', '💳 USD cash widely accepted', '📋 Travel insurance with medical evacuation'],
    gear:      ['🧴 Reef-safe SPF 50 sunscreen', '🤿 Snorkel gear', '💧 Water purification bottle', '🔋 Portable charger', '🌡 DEET mosquito repellent'],
    apps:      ['🗣 Google Translate offline', '🚗 Grab/Gojek — SE Asia rideshare', '📍 Maps.me — works offline in remote areas', '💰 XE Currency', '🌧 Weather app for storm warnings'],
  },
  international_pacific: {
    clothing:  ['👟 Comfortable walking shoes', '🩴 Sandals for beach days', '🧥 Light layer — evenings cool down fast', '🕶 Polarized sunglasses', '🩱 Swimwear for beach and pools'],
    documents: ['🛂 Passport — 6+ months validity required for Australia/NZ', '✈ Flight + hotel confirmations', '💳 Visa or Mastercard — widely accepted', '📋 Travel insurance with medical cover', '🏥 ESTA or ETA visa if required'],
    gear:      ['🔌 Type I adapter (Australia) or Type A/B (Pacific islands)', '🔋 Portable charger', '🧴 SPF 50+ sunscreen — UV is intense', '🎒 Daypack for hikes and beach trips'],
    apps:      ['📍 Google Maps offline — download before landing', '🚌 Opal / Myki (local transit apps)', '🗣 Google Translate', '💱 XE Currency', '🚗 Uber — works in all major AU/NZ cities'],
  },
  international_mideast: {
    clothing:  ['👕 Lightweight long sleeves — sun + modesty requirements', '🩲 Breathable underwear — heat is intense', '👗 Women: loose-fitting clothing covering shoulders and knees', '🕶 UV-blocking sunglasses', '👟 Closed-toe shoes for mosques'],
    documents: ['🛂 Passport — check visa requirements for your nationality', '✈ Onward ticket required at most Middle East borders', '💳 Credit card widely accepted; carry some local cash for souks', '📋 Travel insurance', '🕌 Dress code checklist for mosques/sites'],
    gear:      ['💧 Large insulated water bottle — heat is extreme', '🧴 SPF 50+ sunscreen', '🔌 Type G (UAE/Jordan) or Type C adapter', '🔋 Portable charger'],
    apps:      ['🚗 Careem — Middle East rideshare app (Uber also works in UAE)', '📍 Google Maps offline', '💱 XE Currency', '🗣 Google Translate — Arabic pack', '🌡 Weather app — check UV index daily'],
  },
  international_latam: {
    clothing:  ['👕 Lightweight casual clothes — warm climate most of year', '🧥 Light jacket for altitude cities (Mexico City, Bogotá, Quito)', '👟 Comfortable walking shoes for cobblestone streets', '🕶 Sunglasses', '🩴 Sandals for beach/coastal cities'],
    documents: ['🛂 Passport', '✈ Flight + accommodation confirmations', '💳 Notify bank — Visa/MC widely accepted; carry USD or local cash', '📋 Travel insurance', '💊 Hepatitis A vaccination recommended'],
    gear:      ['🔌 Type A/B plug (same as USA) in most countries', '🔋 Portable charger', '🧴 Insect repellent (DEET for jungle areas)', '🩹 Basic first aid kit'],
    apps:      ['🚗 Uber / inDrive — both work across Latin America', '📍 Google Maps offline', '🗣 Google Translate offline — Spanish + Portuguese packs', '💱 XE Currency', '🌮 TheFork for restaurant reservations'],
  },
};

const TRANSLATE_APPS = [
  { icon: '🗣', name: 'Google Translate', desc: 'Camera mode reads menus and signs in real time. Download offline packs before you go.' },
  { icon: '🔍', name: 'Google Lens', desc: 'Point at anything — menus, signs, labels — instant translation.' },
  { icon: '🧠', name: 'DeepL', desc: 'More nuanced translations for European languages. Great for reading formal text.' },
  { icon: '📖', name: 'iTranslate', desc: 'Voice translation and offline mode. Good for real-time conversations.' },
  { icon: '🎌', name: 'Papago', desc: 'Best for Korean, Japanese and Chinese — made by Naver. Superior to Google for Asian scripts.' },
];

const GENERAL_TRAVEL_APPS = [
  { icon: '📍', name: 'Google Maps', desc: 'Download offline maps before you land. Save must-visits to lists.' },
  { icon: '💶', name: 'Revolut / Wise', desc: 'Spend abroad with no hidden fees. Real exchange rates.' },
  { icon: '💱', name: 'XE Currency', desc: 'Real-time exchange rates. Know exactly what you\'re paying.' },
  { icon: '🚇', name: 'Citymapper', desc: 'Best transit app in the world. Real-time step-by-step in 60+ cities.' },
  { icon: '🏨', name: 'Booking.com', desc: 'Last-minute hotel deals with free cancellation on most bookings.' },
  { icon: '🏠', name: 'Airbnb', desc: 'Apartments and unique stays. Better for longer trips and groups.' },
];

const CITY_LANGUAGES = {
  paris:        { name: 'French 🇫🇷',                bcp47: 'fr-FR', phrases: [{p:'Bonjour',m:'Hello',r:'bon-ZHOOR'},{p:'Merci',m:'Thank you',r:'mehr-SEE'},{p:"S'il vous plaît",m:'Please',r:'seel voo PLAY'},{p:'Où est...?',m:'Where is...?',r:'oo ay'},{p:"L'addition",m:'The bill',r:'lah-dee-SYON'},{p:'Parlez-vous anglais?',m:'Do you speak English?',r:'par-LAY voo on-GLAY'}] },
  barcelona:    { name: 'Spanish / Catalan 🇪🇸',     bcp47: 'es-ES', phrases: [{p:'Hola',m:'Hello',r:'OH-lah'},{p:'Gracias',m:'Thank you',r:'GRAH-see-as'},{p:'¿Dónde está?',m:'Where is...?',r:'DON-day es-TAH'},{p:'La cuenta',m:'The bill',r:'lah KWEN-tah'},{p:'¿Habla inglés?',m:'English?',r:'AH-blah een-GLAYS'},{p:'Una mesa para dos',m:'Table for two',r:'OO-nah MAY-sah'}] },
  tokyo:        { name: 'Japanese 🇯🇵',               bcp47: 'ja-JP', phrases: [{p:'こんにちは',m:'Hello',r:'kon-ni-chi-WA'},{p:'ありがとう',m:'Thank you',r:'ah-ree-GAH-toh'},{p:'すみません',m:'Excuse me',r:'soo-mee-MA-sen'},{p:'これください',m:"I'll have this",r:'ko-re ku-DA-sai'},{p:'お会計',m:'Check please',r:'o-kai-KEE'},{p:'トイレは?',m:'Bathroom?',r:'toy-RE wa'}] },
  bali:         { name: 'Bahasa Indonesian 🇮🇩',      bcp47: 'id-ID', phrases: [{p:'Selamat pagi',m:'Good morning',r:'seh-lah-MAT pah-gee'},{p:'Terima kasih',m:'Thank you',r:'teh-REE-mah kah-SEE'},{p:'Berapa?',m:'How much?',r:'beh-RAH-pah'},{p:'Tolong',m:'Please/Help',r:'TOH-long'},{p:'Di mana?',m:'Where is...?',r:'dee MAH-nah'},{p:'Tidak mau',m:'No thank you',r:'tee-DAK mow'}] },
  hawaii:       { name: 'Hawaiian 🌺',                 bcp47: 'en-US', phrases: [{p:'Aloha',m:'Hello / Goodbye / Love',r:'ah-LOH-hah'},{p:'Mahalo',m:'Thank you',r:'mah-HAH-loh'},{p:'Mauka',m:'Toward the mountain',r:'MAU-kah'},{p:'Makai',m:'Toward the ocean',r:'mah-KAI'},{p:'Pau hana',m:'After work / done!',r:'pow HAH-nah'},{p:'Shaka',m:'Hang loose / all good',r:'SHAH-kah'}] },
  neworleans:   { name: 'Louisiana French Creole 🎷', bcp47: 'fr-FR', phrases: [{p:'Laissez les bons temps rouler',m:'Let the good times roll',r:'lay-ZAY lay bohn tohn roo-LAY'},{p:'Cher',m:'Dear / Honey',r:'sheh'},{p:'Lagniappe',m:'A little something extra',r:'LAN-yap'},{p:'Merci beaucoup',m:'Thank you very much',r:'mehr-SEE boh-KOO'},{p:"S'il vous plaît",m:'Please',r:'seel voo PLAY'},{p:'Où est Bourbon Street?',m:'Where is Bourbon Street?',r:'oo ay BOOR-bon'}] },
  sanfrancisco: { name: 'Cantonese 🇨🇳',              bcp47: 'zh-HK', phrases: [{p:'你好',m:'Hello',r:'néih hóu'},{p:'唔該',m:'Thank you (for service)',r:'m̀h gōi'},{p:'多謝',m:'Thank you (for gift)',r:'dō jeh'},{p:'幾多錢?',m:'How much?',r:'gei dō chin'},{p:'好味道',m:'Very delicious',r:'hóu meih douh'},{p:'埋單',m:'Check please',r:'màaih dāan'}] },
  chicago:      { name: 'Polish 🇵🇱',                  bcp47: 'pl-PL', phrases: [{p:'Dzień dobry',m:'Good day / Hello',r:'jyen DOH-brih'},{p:'Dziękuję',m:'Thank you',r:'jen-KOO-yeh'},{p:'Proszę',m:'Please / Here you go',r:'PROH-sheh'},{p:'Ile to kosztuje?',m:'How much does it cost?',r:'EE-leh toh kosh-TOO-yeh'},{p:'Smacznego!',m:'Enjoy your meal!',r:'smach-NEH-goh'},{p:'Na zdrowie!',m:'Cheers!',r:'nah ZDROH-vyeh'}] },
  // International cities added in session 3
  london:       { name: 'English (British) 🇬🇧',         bcp47: 'en-GB', phrases: [{p:'Mind the gap',m:'Watch the gap between the train and platform — announced on the Tube'},{p:'Could I get the bill, please?',m:'Asking for the check at a restaurant'},{p:'Which way to the Tube?',m:'Finding the London Underground entrance'},{p:'Is this seat taken?',m:'Asking if a spot on the Tube or bus is free'},{p:'Cheers!',m:'Thank you / goodbye / a toast — used in all contexts'},{p:'Could you recommend a local pub?',m:'Asking for a neighborhood pub suggestion'}] },
  rome:         { name: 'Italian 🇮🇹',                   bcp47: 'it-IT', phrases: [{p:'Buongiorno',m:'Good morning / Hello',r:'bwon-JOR-no'},{p:'Grazie',m:'Thank you',r:'GRAT-syeh'},{p:'Per favore',m:'Please',r:'pehr fah-VOH-reh'},{p:'Il conto, per favore',m:'The bill, please',r:'eel KON-toh'},{p:'Dove è...?',m:'Where is...?',r:'DOH-veh ay'},{p:'Una tavola per due',m:'A table for two',r:'OO-nah TAH-voh-lah pehr DOO-eh'}] },
  amsterdam:    { name: 'Dutch 🇳🇱',                     bcp47: 'nl-NL', phrases: [{p:'Goedendag',m:'Good day / Hello',r:'KHOO-den-dakh'},{p:'Dank u wel',m:'Thank you',r:'DANK oo vel'},{p:'Alstublieft',m:'Please / Here you go',r:'ALS-too-bleeft'},{p:'Waar is...?',m:'Where is...?',r:'vaar is'},{p:'De rekening, alstublieft',m:'The bill, please',r:'deh REH-ken-ing'},{p:'Spreekt u Engels?',m:'Do you speak English?',r:'SPREYKT oo ENG-els'}] },
  sydney:       { name: 'English (Australian) 🇦🇺',      bcp47: 'en-AU', phrases: [{p:'G\'day!',m:'Hello — the classic Australian greeting'},{p:'How ya going?',m:'How are you? — standard casual greeting'},{p:'Arvo',m:'Afternoon — "I\'ll see you this arvo"'},{p:'Bottle-o',m:'Bottle shop / liquor store'},{p:'Which way to the ferry wharf?',m:'Finding a Harbour ferry terminal'},{p:'Is the water safe for swimming?',m:'Checking beach conditions — look for flags'}] },
  dubai:        { name: 'Arabic (Gulf) 🇦🇪',             bcp47: 'ar-AE', phrases: [{p:'مرحبا',m:'Hello',r:'mar-HA-ban'},{p:'شكراً',m:'Thank you',r:'SHUK-ran'},{p:'من فضلك',m:'Please',r:'min FAD-lak'},{p:'كم الثمن?',m:'How much is this?',r:'kam al-THA-man'},{p:'أين...?',m:'Where is...?',r:'AY-na'},{p:'لا شكراً',m:'No thank you',r:'laa SHUK-ran'}] },
  bangkok:      { name: 'Thai 🇹🇭',                      bcp47: 'th-TH', phrases: [{p:'สวัสดี',m:'Hello / Goodbye',r:'sa-WAT-dee'},{p:'ขอบคุณ',m:'Thank you',r:'KHOB-khun'},{p:'เท่าไหร่?',m:'How much?',r:'TAO-rai'},{p:'อร่อยมาก',m:'Very delicious',r:'a-ROY mak'},{p:'ไม่เป็นไร',m:'No problem / you\'re welcome',r:'mai-pen-RAI'},{p:'ห้องน้ำอยู่ที่ไหน?',m:'Where is the bathroom?',r:'hong-NAM yoo tee-NAI'}] },
  singapore:    { name: 'Singlish / English 🇸🇬',        bcp47: 'en-SG', phrases: [{p:'Lah',m:'Filler word that softens statements — "OK lah!" means "OK!"'},{p:'Can or not?',m:'Is this possible? — standard way to ask anything'},{p:'Shiok!',m:'Delicious / great / excellent'},{p:'Where can I tapao this?',m:'Can I get this to go? (tapao = takeaway)'},{p:'How to get to the MRT?',m:'Finding the Singapore metro'},{p:'Aiyoh!',m:'Expression of mild frustration or surprise'}] },
  lisbon:       { name: 'Portuguese 🇵🇹',                bcp47: 'pt-PT', phrases: [{p:'Olá',m:'Hello',r:'oh-LAH'},{p:'Obrigado / Obrigada',m:'Thank you (m/f)',r:'oh-bree-GAH-doo'},{p:'Por favor',m:'Please',r:'por fah-VOR'},{p:'Quanto custa?',m:'How much does it cost?',r:'KWAN-too KOOSH-tah'},{p:'Onde fica...?',m:'Where is...?',r:'ON-deh FEE-kah'},{p:'A conta, por favor',m:'The bill, please',r:'ah KON-tah'}] },
  seoul:        { name: 'Korean 🇰🇷',                    bcp47: 'ko-KR', phrases: [{p:'안녕하세요',m:'Hello',r:'an-nyong-ha-SE-yo'},{p:'감사합니다',m:'Thank you',r:'gam-sa-ham-ni-DA'},{p:'이거 주세요',m:'I\'ll have this one',r:'i-go JU-se-yo'},{p:'얼마예요?',m:'How much is this?',r:'ol-ma-YE-yo'},{p:'계산서 주세요',m:'Check, please',r:'gye-san-so JU-se-yo'},{p:'맛있어요!',m:'It\'s delicious!',r:'ma-si-SO-yo'}] },
  mexicocity:   { name: 'Spanish (Mexican) 🇲🇽',         bcp47: 'es-MX', phrases: [{p:'Hola',m:'Hello',r:'OH-lah'},{p:'Gracias',m:'Thank you',r:'GRAH-syahs'},{p:'¿Cuánto cuesta?',m:'How much does it cost?',r:'KWAN-toh KWES-tah'},{p:'¿Dónde está el metro?',m:'Where is the metro?',r:'DON-day es-TAH'},{p:'La cuenta, por favor',m:'The check, please',r:'lah KWEN-tah'},{p:'Está muy rico',m:'This is delicious',r:'es-TAH mwee REE-koh'}] },
  // US cities — practical English phrases for visitors
  nyc:          { name: 'English (New York) 🗽',       bcp47: 'en-US', phrases: [{p:'Excuse me, where is the subway?',m:'Asking for the nearest metro station'},{p:'Which train goes to Midtown?',m:'Finding the right subway line'},{p:'Can I get the check, please?',m:'Asking for the bill at a restaurant'},{p:'How far is it to walk?',m:'Estimating walking distance'},{p:'Is this seat taken?',m:'Asking if a spot is free'},{p:'What time does this close?',m:'Checking closing hours'}] },
  miami:        { name: 'English (Miami) 🌴',          bcp47: 'en-US', phrases: [{p:'Where is the nearest beach access?',m:'Finding a beach entry point'},{p:'Is the water safe for swimming?',m:'Checking beach conditions'},{p:'Can you recommend a local restaurant?',m:'Asking a local for dining tips'},{p:'What time does the sun set today?',m:'Planning for golden hour photos'},{p:'Is parking available nearby?',m:'Finding a parking spot'},{p:'How do I get to South Beach?',m:'Navigating to the main beach strip'}] },
  losangeles:   { name: 'English (Los Angeles) 🌅',   bcp47: 'en-US', phrases: [{p:'How long is the drive from here?',m:'Estimating travel time by car'},{p:'Is there parking at this location?',m:'Finding parking before you arrive'},{p:'What time does the trail open?',m:'Checking hours for hikes and parks'},{p:'Can I see the Hollywood Sign from here?',m:'Locating the best viewpoint'},{p:'Where can I catch the Metro?',m:'Finding public transit'},{p:'Do you validate parking?',m:'Asking if the venue covers parking cost'}] },
  austin:       { name: 'English (Austin) 🤠',         bcp47: 'en-US', phrases: [{p:'Where is the live music tonight?',m:'Finding a concert or venue'},{p:'Is there a wait for a table?',m:'Asking about restaurant wait times'},{p:'What is your most popular dish?',m:'Getting a food recommendation'},{p:'How far is the swimming hole?',m:'Asking about Barton Springs or Hamilton Pool'},{p:'Is this area walkable at night?',m:'Checking safety and walkability'},{p:'Where can I rent a kayak?',m:'Finding outdoor recreation rentals'}] },
  lasvegas:     { name: 'English (Las Vegas) 🎰',      bcp47: 'en-US', phrases: [{p:'Where is the box office?',m:'Finding tickets for shows'},{p:'Is the buffet still open?',m:'Checking dining hours at a casino'},{p:'What is the minimum bet at this table?',m:'Asking about table limits'},{p:'How do I get to the airport from here?',m:'Finding transport back to the airport'},{p:'Is there a shuttle to the Strip?',m:'Asking about hotel shuttles'},{p:'Can I make a reservation for tonight?',m:'Booking a show or restaurant'}] },
  nashville:    { name: 'English (Nashville) 🎸',      bcp47: 'en-US', phrases: [{p:'Where is the best live country music?',m:'Finding a honky-tonk or venue'},{p:'Is the Grand Ole Opry sold out?',m:'Checking ticket availability'},{p:'Can I take a tour of this building?',m:'Asking about historic site tours'},{p:'What time does the kitchen close?',m:'Checking last call for food'},{p:'Where is the nearest parking garage?',m:'Finding a place to park downtown'},{p:'Do you serve sweet tea?',m:'A classic Southern staple drink'}] },
  orlando:      { name: 'English (Orlando) 🎢',        bcp47: 'en-US', phrases: [{p:'What time does the park open?',m:'Checking theme park hours'},{p:'How long is the wait for this ride?',m:'Asking about current queue time'},{p:'Where can I store my bags?',m:'Finding lockers at a theme park'},{p:'Is there a shuttle to Disney?',m:'Asking about hotel transportation'},{p:'Where is the nearest urgent care?',m:'Finding medical help if needed'},{p:'Do children under three ride free?',m:'Asking about age-based ticket rules'}] },
  seattle:      { name: 'English (Seattle) 🌧',         bcp47: 'en-US', phrases: [{p:'Where is Pike Place Market?',m:'Finding the famous public market'},{p:'Do I need a reservation?',m:'Asking about booking requirements'},{p:'Is the ferry running today?',m:'Checking Washington State Ferry status'},{p:'What is the best viewpoint of the city?',m:'Finding a scenic overlook'},{p:'Is it raining tomorrow?',m:'Checking the forecast — it often is'},{p:'Where can I catch the light rail?',m:'Finding public transit downtown'}] },
  // New US cities
  sandiego:     { name: 'English (San Diego) ☀️',       bcp47: 'en-US', phrases: [{p:'How do I get to Balboa Park?',m:'Finding the city\'s cultural park'},{p:'Is the beach crowded today?',m:'Checking beach conditions before heading out'},{p:'Where is the nearest trolley stop?',m:'Finding the San Diego Trolley'},{p:'What time does the Zoo open?',m:'Checking San Diego Zoo hours'},{p:'Can I park here for free?',m:'Asking about parking rules'},{p:'Where can I watch the sunset?',m:'Finding a scenic evening spot'}] },
  washingtondc: { name: 'English (Washington DC) 🏛',    bcp47: 'en-US', phrases: [{p:'Is the Smithsonian free to enter?',m:'Confirming free museum admission (yes, it is)'},{p:'How do I get to the National Mall?',m:'Finding the main monument area'},{p:'Which Metro line goes to Capitol Hill?',m:'Navigating the DC Metro'},{p:'Where is the nearest bike share station?',m:'Finding a Capital Bikeshare dock'},{p:'Is there a reservation required?',m:'Checking if booking is needed for a museum'},{p:'What time does the monument close?',m:'Asking about attraction hours'}] },
  boston:       { name: 'English (Boston) 🦞',           bcp47: 'en-US', phrases: [{p:'Where does the Freedom Trail start?',m:'Finding the beginning of the historic walking route'},{p:'How do I get to Harvard from here?',m:'Asking for directions to Cambridge'},{p:'Is the T running on weekends?',m:'Checking MBTA subway schedule'},{p:'Where can I get a good lobster roll?',m:'Asking for a local seafood recommendation'},{p:'What time is the Red Sox game?',m:'Checking Fenway Park schedule'},{p:'Is this a good neighborhood to walk at night?',m:'Checking safety before exploring'}] },
  denver:       { name: 'English (Denver) 🏔',           bcp47: 'en-US', phrases: [{p:'How do I get to Red Rocks from here?',m:'Finding the famous amphitheater'},{p:'Is the trail open today?',m:'Checking conditions for a hike'},{p:'What elevation are we at?',m:'Denver sits at exactly 5,280 ft — the Mile High City'},{p:'Where can I rent a bike?',m:'Finding a bike share or rental shop'},{p:'Is recreational cannabis legal here?',m:'Yes — dispensaries are legal and plentiful'},{p:'How far is Rocky Mountain National Park?',m:'About 1.5 hours by car from downtown Denver'}] },
  portland:     { name: 'English (Portland) 🌲',         bcp47: 'en-US', phrases: [{p:'Where is Powell\'s Books?',m:'Finding the famous independent bookstore'},{p:'What time does the Saturday Market open?',m:'Checking hours for the open-air market'},{p:'Is Forest Park free to hike?',m:'Confirming no entry fee for Portland\'s urban forest'},{p:'How do I use the MAX light rail?',m:'Navigating TriMet public transit'},{p:'Where is the best food cart pod?',m:'Finding a cluster of Portland\'s famous food carts'},{p:'Is Voodoo Doughnut worth the wait?',m:'Asking locals about the famous doughnut shop'}] },
  atlanta:      { name: 'English (Atlanta) 🍑',          bcp47: 'en-US', phrases: [{p:'How do I get to the Georgia Aquarium?',m:'Finding the world\'s largest aquarium'},{p:'Is MARTA safe to take downtown?',m:'Asking about Atlanta\'s rail transit'},{p:'Where is the best soul food nearby?',m:'Finding authentic Southern cooking'},{p:'What time does the World of Coca-Cola open?',m:'Checking hours for the Coke museum'},{p:'How far is the Beltline from here?',m:'Finding the popular walking and biking trail'},{p:'Where is Ponce City Market?',m:'Finding the popular food and shopping hall'}] },
  philadelphia: { name: 'English (Philadelphia) 🔔',     bcp47: 'en-US', phrases: [{p:'Where is the Liberty Bell?',m:'Finding the iconic national landmark'},{p:'Is Reading Terminal Market open today?',m:'Checking the famous indoor food market'},{p:'Where can I get a real cheesesteak?',m:'Asking for Pat\'s or Geno\'s directions'},{p:'How do I get to the Philadelphia Museum of Art?',m:'Finding the Rocky steps location'},{p:'Is SEPTA running on time?',m:'Checking Philadelphia transit'},{p:'What neighborhood is the best for dinner?',m:'Fishtown and East Passyunk are the top picks'}] },
  phoenix:      { name: 'English (Phoenix/Scottsdale) 🌵', bcp47: 'en-US', phrases: [{p:'How long is the hike up Camelback?',m:'Asking about the difficulty and duration'},{p:'What temperature is it today?',m:'Checking heat levels — can exceed 115°F in summer'},{p:'Is the Desert Botanical Garden worth visiting?',m:'Asking for a recommendation'},{p:'How far is the Grand Canyon from here?',m:'About 3.5 hours by car from Phoenix'},{p:'Where is Old Town Scottsdale?',m:'Finding the shopping and nightlife district'},{p:'Is there shade on this trail?',m:'Very important question — most desert trails have little to none'}] },
  // New international cities
  prague:       { name: 'Czech 🇨🇿', bcp47: 'cs-CZ', phrases: [{p:'Dobrý den',m:'Hello / Good day',r:'DOH-bree den'},{p:'Děkuji',m:'Thank you',r:'DYEH-koo-yi'},{p:'Prosím',m:'Please / Here you go',r:'PRO-seem'},{p:'Kde je...?',m:'Where is...?',r:'kdeh yeh'},{p:'Účet, prosím',m:'The bill, please',r:'OO-chet PRO-seem'},{p:'Mluvíte anglicky?',m:'Do you speak English?',r:'mloo-VEE-teh ANG-glits-key'}] },
  budapest:     { name: 'Hungarian 🇭🇺', bcp47: 'hu-HU', phrases: [{p:'Jó napot',m:'Good day / Hello',r:'YOH nah-pot'},{p:'Köszönöm',m:'Thank you',r:'KUH-suh-nuhm'},{p:'Kérem',m:'Please',r:'KAY-rem'},{p:'Hol van...?',m:'Where is...?',r:'hol von'},{p:'A számlát kérem',m:'The bill, please',r:'ah SAM-lat KAY-rem'},{p:'Egészségére!',m:'Cheers!',r:'eh-gays-shay-geh-reh'}] },
  istanbul:     { name: 'Turkish 🇹🇷', bcp47: 'tr-TR', phrases: [{p:'Merhaba',m:'Hello',r:'mehr-HAH-bah'},{p:'Teşekkür ederim',m:'Thank you',r:'teh-shek-KYUR eh-deh-REEM'},{p:'Lütfen',m:'Please',r:'LYUT-fen'},{p:'Nerede...?',m:'Where is...?',r:'neh-reh-DEH'},{p:'Hesabı alabilir miyim?',m:'Can I have the bill?',r:'heh-SAH-buh'},{p:'Çok güzel!',m:'Very beautiful / great!',r:'chok gyu-ZEL'}] },
  kyoto:        { name: 'Japanese 🇯🇵', bcp47: 'ja-JP', phrases: [{p:'こんにちは',m:'Hello',r:'kon-ni-chi-WA'},{p:'ありがとうございます',m:'Thank you very much',r:'ah-ree-gah-TOH goh-zai-mahs'},{p:'すみません',m:'Excuse me',r:'soo-mee-MA-sen'},{p:'これをください',m:"I'll have this please",r:'ko-re-wo ku-DA-sai'},{p:'お会計をお願いします',m:'Check, please',r:'o-kai-KEE o-ne-gai-shi-mahs'},{p:'おいしい！',m:'Delicious!',r:'oh-EE-shee'}] },
  capetown:     { name: 'English / Afrikaans / Zulu 🇿🇦', bcp47: 'en-ZA', phrases: [{p:'Howzit!',m:'How are you? — standard South African greeting'},{p:'Lekker!',m:'Great / delicious / wonderful — used for everything'},{p:'Is this the queue?',m:'Asking if you\'re in the right line'},{p:'Can I get the braai going?',m:'Can we fire up the BBQ?'},{p:'Baie dankie',m:'Thank you very much (Afrikaans)',r:'BY-ee DAN-kee'},{p:'Sawubona',m:'Hello (Zulu)',r:'sah-woo-BOH-nah'}] },
  marrakech:    { name: 'Moroccan Arabic / French 🇲🇦', bcp47: 'ar-MA', phrases: [{p:'السلام عليكم',m:'Peace be upon you (Hello)',r:'as-salaam ah-LAY-kum'},{p:'شكراً',m:'Thank you',r:'SHUK-ran'},{p:'بشحال هاد الشي؟',m:'How much does this cost?',r:'b-SH-hal had sh-SHEE'},{p:'لا شكراً',m:'No thank you',r:'laa SHUK-ran'},{p:'Merci beaucoup',m:'Thank you very much (French)',r:'mehr-SEE boh-KOO'},{p:'Où est la médina?',m:'Where is the medina? (French)',r:'oo ay la may-DEE-nah'}] },
  vienna:       { name: 'German (Austrian) 🇦🇹', bcp47: 'de-AT', phrases: [{p:'Grüß Gott',m:'Hello (Austrian greeting)',r:'groos GOT'},{p:'Danke schön',m:'Thank you very much',r:'DAN-keh shurn'},{p:'Bitte',m:'Please / You\'re welcome',r:'BIT-teh'},{p:'Zahlen, bitte',m:'The bill, please',r:'TSAA-len BIT-teh'},{p:'Ein Melange, bitte',m:'A Viennese coffee, please',r:'ain meh-LONJ BIT-teh'},{p:'Servus!',m:'Hi / Goodbye (informal Austrian)',r:'SEHR-voos'}] },
  edinburgh:    { name: 'English (Scottish) 🏴󠁧󠁢󠁳󠁣󠁴󠁿', bcp47: 'en-GB', phrases: [{p:'Aye',m:'Yes — the standard Scottish affirmative'},{p:'Haud yer wheesht',m:'Be quiet / hold your tongue'},{p:'It\'s a wee bit cold',m:'Scottish understatement — it\'s probably freezing'},{p:'Where\'s the nearest chippy?',m:'Finding a fish and chip shop'},{p:'Is the castle open today?',m:'Checking Edinburgh Castle hours'},{p:'Slainte!',m:'Cheers! — the Gaelic toast',r:'SLAN-cha'}] },
  copenhagen:   { name: 'Danish 🇩🇰', bcp47: 'da-DK', phrases: [{p:'Hej',m:'Hello / Hi',r:'hi'},{p:'Tak',m:'Thank you',r:'tak'},{p:'Må jeg bede om regningen?',m:'Can I have the bill?',r:'mo yi bay om RY-nin-en'},{p:'Hvad koster det?',m:'How much does it cost?',r:'val KOS-der day'},{p:'Skål!',m:'Cheers!',r:'skawl'},{p:'Taler du engelsk?',m:'Do you speak English?',r:'TAY-ler doo ENG-elsk'}] },
  havana:       { name: 'Spanish (Cuban) 🇨🇺', bcp47: 'es-CU', phrases: [{p:'¡Asere, qué volá!',m:'Hey man, what\'s up! — the classic Cuban slang greeting'},{p:'¿Cuánto?',m:'How much?',r:'KWAN-toh'},{p:'Un mojito, por favor',m:'A mojito, please — essential'},{p:'¿Dónde está la Bodeguita?',m:'Where is La Bodeguita del Medio?'},{p:'Dame un peso',m:'Give me a peso — buying something small'},{p:'¡Qué rico!',m:'How delicious! / How great!',r:'keh REE-koh'}] },
  // Batch 3
  santorini:    { name: 'Greek 🇬🇷', bcp47: 'el-GR', phrases: [{p:'Γεια σας',m:'Hello (formal)',r:'YAH-sas'},{p:'Ευχαριστώ',m:'Thank you',r:'ef-ha-rees-TOH'},{p:'Παρακαλώ',m:'Please / You\'re welcome',r:'pa-ra-ka-LOH'},{p:'Πόσο κάνει;',m:'How much does it cost?',r:'POH-so KA-nee'},{p:'Τον λογαριασμό, παρακαλώ',m:'The bill, please',r:'ton lo-ga-ree-az-MOH'},{p:'Στην υγειά μας!',m:'Cheers! / To our health!',r:'stin ee-YEE-ah mas'}] },
  dubrovnik:    { name: 'Croatian 🇭🇷', bcp47: 'hr-HR', phrases: [{p:'Dobar dan',m:'Good day / Hello',r:'DOH-bar dan'},{p:'Hvala',m:'Thank you',r:'HVAH-lah'},{p:'Molim',m:'Please / You\'re welcome',r:'MOH-leem'},{p:'Gdje je...?',m:'Where is...?',r:'gdyeh yeh'},{p:'Račun, molim',m:'The bill, please',r:'RAH-choon MOH-leem'},{p:'Živjeli!',m:'Cheers!',r:'ZHEE-vyeh-lee'}] },
  venice:       { name: 'Italian 🇮🇹', bcp47: 'it-IT', phrases: [{p:'Buongiorno',m:'Good morning / Hello',r:'bwon-JOR-no'},{p:'Grazie mille',m:'Thank you very much',r:'GRAT-see-eh MEEL-leh'},{p:'Per favore',m:'Please',r:'pehr fah-VOH-reh'},{p:'Dov\'è...?',m:'Where is...?',r:'doh-VEH'},{p:'Il conto, per favore',m:'The bill, please',r:'eel KON-toh'},{p:'Salute!',m:'Cheers!',r:'sah-LOO-teh'}] },
  florence:     { name: 'Italian 🇮🇹', bcp47: 'it-IT', phrases: [{p:'Buongiorno',m:'Good morning / Hello',r:'bwon-JOR-no'},{p:'Grazie',m:'Thank you',r:'GRAT-see-eh'},{p:'Scusi',m:'Excuse me',r:'SKOO-zee'},{p:'Dov\'è il Duomo?',m:'Where is the Duomo?'},{p:'Un caffè, per favore',m:'A coffee, please'},{p:'Quanto costa?',m:'How much does it cost?',r:'KWAN-toh KOS-tah'}] },
  milan:        { name: 'Italian 🇮🇹', bcp47: 'it-IT', phrases: [{p:'Buongiorno',m:'Good morning / Hello',r:'bwon-JOR-no'},{p:'Grazie',m:'Thank you',r:'GRAT-see-eh'},{p:'Dov\'è la metropolitana?',m:'Where is the metro?'},{p:'Il conto, per favore',m:'The bill, please'},{p:'Quanto costa questa borsa?',m:'How much is this bag?'},{p:'Un Negroni, per favore',m:'A Negroni, please — the Milan aperitivo'}] },
  berlin:       { name: 'German 🇩🇪', bcp47: 'de-DE', phrases: [{p:'Guten Tag',m:'Good day / Hello',r:'GOO-ten tahk'},{p:'Danke schön',m:'Thank you very much',r:'DAN-keh shurn'},{p:'Bitte',m:'Please / You\'re welcome',r:'BIT-teh'},{p:'Wo ist...?',m:'Where is...?',r:'voh ist'},{p:'Die Rechnung, bitte',m:'The bill, please',r:'dee RECK-noong BIT-teh'},{p:'Prost!',m:'Cheers!',r:'prohst'}] },
  madrid:       { name: 'Spanish 🇪🇸', bcp47: 'es-ES', phrases: [{p:'Hola',m:'Hello',r:'OH-lah'},{p:'Gracias',m:'Thank you',r:'GRAH-see-ahs'},{p:'Por favor',m:'Please',r:'por fah-VOR'},{p:'¿Dónde está...?',m:'Where is...?',r:'DON-deh es-TAH'},{p:'La cuenta, por favor',m:'The bill, please',r:'lah KWEN-tah'},{p:'¡Salud!',m:'Cheers!',r:'sah-LOOD'}] },
  cairo:        { name: 'Arabic (Egyptian) 🇪🇬', bcp47: 'ar-EG', phrases: [{p:'السلام عليكم',m:'Peace be upon you (Hello)',r:'as-salaamu alaikum'},{p:'شكراً',m:'Thank you',r:'SHUK-ran'},{p:'من فضلك',m:'Please',r:'min FAD-lak'},{p:'فين...؟',m:'Where is...?',r:'FAYN'},{p:'الحساب من فضلك',m:'The bill, please',r:'al-HI-saab min FAD-lak'},{p:'بكام ده؟',m:'How much is this?',r:'bi-KAM dah'}] },
  osaka:        { name: 'Japanese 🇯🇵', bcp47: 'ja-JP', phrases: [{p:'おおきに',m:'Thank you (Osaka dialect)',r:'oh-OH-ki-ni'},{p:'まいど',m:'Welcome / Hello (Osaka shopkeeper greeting)',r:'MAI-do'},{p:'なんぼ？',m:'How much? (Osaka dialect)',r:'NAN-bo'},{p:'おいしい！',m:'Delicious!',r:'oh-EE-shee'},{p:'すみません',m:'Excuse me',r:'soo-mee-MA-sen'},{p:'たこやき、ください',m:'Takoyaki, please',r:'ta-ko-YA-ki ku-DA-sai'}] },
  hongkong:     { name: 'Cantonese / English 🇭🇰', bcp47: 'zh-HK', phrases: [{p:'你好',m:'Hello',r:'nei HOH'},{p:'唔該',m:'Thank you (for a service)',r:'mm-GOI'},{p:'多謝',m:'Thank you (for a gift)',r:'doh-JEH'},{p:'幾多錢？',m:'How much?',r:'gay-doh CHIN'},{p:'唔該，埋單',m:'Bill, please',r:'mm-GOI, mai-DAN'},{p:'好食！',m:'Delicious!',r:'hou-SHIK'}] },
  // Batch 4
  taipei:       { name: 'Mandarin (Taiwanese) 🇹🇼', bcp47: 'zh-TW', phrases: [{p:'你好',m:'Hello',r:'nee HAO'},{p:'謝謝',m:'Thank you',r:'sheh-SHEH'},{p:'請',m:'Please',r:'ching'},{p:'多少錢？',m:'How much?',r:'dwoh-shao CHEN'},{p:'買單，謝謝',m:'Check, please',r:'my-DAN sheh-sheh'},{p:'好吃！',m:'Delicious!',r:'HAO-chr'}] },
  kualalumpur:  { name: 'Malay 🇲🇾', bcp47: 'ms-MY', phrases: [{p:'Selamat datang',m:'Welcome',r:'seh-la-MAT da-TANG'},{p:'Terima kasih',m:'Thank you',r:'teh-REE-mah KAH-see'},{p:'Tolong',m:'Please / Help',r:'TOH-long'},{p:'Di mana...?',m:'Where is...?',r:'dee MA-na'},{p:'Berapa harganya?',m:'How much is it?',r:'beh-RAH-pah har-GA-nya'},{p:'Sedap!',m:'Delicious!',r:'SEH-dap'}] },
  hanoi:        { name: 'Vietnamese 🇻🇳', bcp47: 'vi-VN', phrases: [{p:'Xin chào',m:'Hello',r:'sin CHOW'},{p:'Cảm ơn',m:'Thank you',r:'gam UHN'},{p:'Làm ơn',m:'Please',r:'lam UHN'},{p:'Bao nhiêu tiền?',m:'How much?',r:'BOW nyew tyen'},{p:'Tính tiền',m:'The bill, please',r:'TING tyen'},{p:'Ngon quá!',m:'So delicious!',r:'NGON kwah'}] },
  buenosaires:  { name: 'Spanish (Rioplatense) 🇦🇷', bcp47: 'es-AR', phrases: [{p:'¿Cómo andás?',m:'How are you? (Argentine informal)',r:'KOH-mo an-DAS'},{p:'Che, boludo!',m:'Dude! (casual greeting between friends)'},{p:'¿Cuánto sale?',m:'How much is it?',r:'KWAN-toh SAH-leh'},{p:'La cuenta, por favor',m:'The bill, please'},{p:'¡Salud!',m:'Cheers!',r:'sah-LOOD'},{p:'Qué copado',m:'How cool / awesome',r:'keh co-PAH-do'}] },
  toronto:      { name: 'English (Canadian) 🇨🇦', bcp47: 'en-CA', phrases: [{p:'How\'s it going, eh?',m:'Standard Canadian greeting with the iconic \'eh\''},{p:'Where\'s the nearest subway station?',m:'Finding the TTC metro'},{p:'Is this on the Aeroplan?',m:'Asking if Air Canada points apply'},{p:'Could I get that to go?',m:'Asking for takeout'},{p:'How do I get to the CN Tower?',m:'Finding Toronto\'s landmark'},{p:'Sorry!',m:'Universal Canadian response to any situation'}] },
  vancouver:    { name: 'English (Canadian) 🇨🇦', bcp47: 'en-CA', phrases: [{p:'How\'s it going, eh?',m:'Standard Canadian greeting'},{p:'Where\'s the SkyTrain?',m:'Finding Vancouver\'s rapid transit'},{p:'Is the ferry running to Victoria?',m:'Asking about BC Ferries'},{p:'How far is Whistler?',m:'About 2 hours north by car on the Sea-to-Sky Highway'},{p:'Where can I see the mountains?',m:'They\'re visible from almost anywhere on a clear day'},{p:'Sorry!',m:'Even more Canadian than Toronto'}] },
  stockholm:    { name: 'Swedish 🇸🇪', bcp47: 'sv-SE', phrases: [{p:'Hej',m:'Hello / Hi',r:'hey'},{p:'Tack',m:'Thank you',r:'tak'},{p:'Förlåt',m:'Sorry / Excuse me',r:'fur-LOHT'},{p:'Var är...?',m:'Where is...?',r:'var air'},{p:'Kan jag få notan?',m:'Can I have the bill?',r:'kan yah foh NOO-tan'},{p:'Skål!',m:'Cheers!',r:'skohl'}] },
  dublin:       { name: 'English (Irish) 🇮🇪', bcp47: 'en-IE', phrases: [{p:'How\'s the craic?',m:'What\'s the craic? = What\'s going on? / How are things?'},{p:'Grand',m:'Everything is grand = everything is fine — Irish understatement'},{p:'Where\'s the nearest chipper?',m:'Finding a fish and chip shop'},{p:'A pint of Guinness, please',m:'Essential Dublin order — let it settle, don\'t rush it'},{p:'Is it far to walk?',m:'Irish distances are often longer than described'},{p:'Sláinte!',m:'Cheers! — the Irish toast',r:'SLAHN-cheh'}] },
  // Batch 5 — More USA
  dallas:       { name: 'English (Texan) 🤠', bcp47: 'en-US', phrases: [{p:'Howdy!',m:'Texas\'s universal greeting — more genuine than a simple hi'},{p:'Bless your heart',m:'A polite way to say many things, depending on tone'},{p:'Where\'s the nearest BBQ joint?',m:'The most important question in Texas'},{p:'How far is it? (in hours)',m:'Distances in Texas are measured in hours, not miles'},{p:'Do you validate parking?',m:'Asking about parking — Dallas is very car-dependent'},{p:'Go Cowboys!',m:'Or whichever team is playing — sports are religion here'}] },
  houston:      { name: 'English / Spanish (Houston) 🚀', bcp47: 'en-US', phrases: [{p:'Houston, we have a problem',m:'The most famous phrase ever associated with this city — but say it to a local and they\'ll groan'},{p:'Where\'s the best crawfish?',m:'For Viet-Cajun crawfish spots'},{p:'¿Habla usted inglés?',m:'Do you speak English? — Houston is 45% Hispanic'},{p:'How far is Space Center?',m:'About 30 minutes south of downtown without traffic'},{p:'Is HEB open?',m:'Texas\'s beloved grocery chain — a cultural institution'},{p:'What\'s the traffic like on 610?',m:'The loop — always bad'}] },
  tampa:        { name: 'English (Florida) 🌴', bcp47: 'en-US', phrases: [{p:'Is the water warm?',m:'Gulf of Mexico is warm year-round — usually yes'},{p:'Where\'s the best Cuban sandwich?',m:'Tampa takes this rivalry with Miami very seriously'},{p:'How far is the beach?',m:'Clearwater is 45 minutes, Siesta Key is an hour south'},{p:'Is it going to storm?',m:'Florida afternoon thunderstorms are legendary and sudden'},{p:'Where\'s Ybor City?',m:'The historic Cuban-Italian district east of downtown'},{p:'Go Bucs!',m:'The Tampa Bay Buccaneers — or Lightning, Rays, depending on season'}] },
  charlotte:    { name: 'English (Carolina) 🏎', bcp47: 'en-US', phrases: [{p:'Y\'all',m:'The essential Southern second-person plural — used constantly'},{p:'Where\'s the nearest Publix?',m:'The beloved Florida-Carolina grocery chain'},{p:'How far is the racetrack?',m:'Charlotte Motor Speedway is 30 minutes northeast'},{p:'Is the white water center open?',m:'The US National Whitewater Center is a great day trip'},{p:'Bless your heart',m:'The Southern all-purpose response'},{p:'Go Panthers!',m:'NFL\'s Carolina Panthers or Charlotte FC soccer'}] },
  memphis:      { name: 'English (Memphis) 🎸', bcp47: 'en-US', phrases: [{p:'Where\'s Beale Street?',m:'Finding Memphis\'s legendary blues strip'},{p:'Dry rub or wet?',m:'The eternal Memphis BBQ question — locals say dry rub'},{p:'Is Graceland worth it?',m:'Yes, without question — Elvis\'s estate is extraordinary'},{p:'Where\'s the best ribs?',m:'Rendezvous is legendary — order the dry rub'},{p:'Don\'t sleep on Memphis',m:'Local pride phrase — the city is often underrated'},{p:'We put it on everything',m:'BBQ sauce — Memphis cooks put it on everything'}] },
  minneapolis:  { name: 'English (Minnesotan) ☃️', bcp47: 'en-US', phrases: [{p:'Uff da!',m:'Norwegian-origin exclamation — surprise, tiredness, or exasperation'},{p:'You betcha',m:'Absolutely / Of course — the ultimate Minnesota affirmative'},{p:'Oh, for cute!',m:'How adorable / delightful!'},{p:'Where can I rent a Nice Ride?',m:'Minneapolis\'s bike share system'},{p:'Is it cold out?',m:'Minnesotans are stoic about cold — -20°F is \'a little brisk\''},{p:'Skol Vikings!',m:'Minnesota Vikings chant — raised fists and all'}] },
  kansascity:   { name: 'English (Kansas City) 🏈', bcp47: 'en-US', phrases: [{p:'Burnt ends or brisket?',m:'The eternal KC BBQ debate — get both'},{p:'Where\'s the best BBQ?',m:'Joe\'s, Arthur Bryant\'s, and Jack Stack will all be argued'},{p:'How far is Arrowhead?',m:'Chiefs stadium is 10 minutes south of downtown'},{p:'Is there jazz tonight?',m:'Checking 18th & Vine for live music'},{p:'Which side are you from?',m:'Kansas City straddles two states — KS vs MO is a thing'},{p:'Go Chiefs!',m:'Patrick Mahomes\'s city — football is everything here'}] },
  baltimore:    { name: 'English (Baltimore) 🦀', bcp47: 'en-US', phrases: [{p:'Where\'re you from, hon?',m:'\'Hon\' is Baltimore\'s signature term of endearment'},{p:'Are the crabs good today?',m:'Blue crab season (May–October) is peak Baltimore'},{p:'Old Bay on everything',m:'The crab seasoning that Marylanders put on literally everything'},{p:'How\'s the O\'s doing?',m:'The Baltimore Orioles — baseball is very much alive here'},{p:'Bawlmer, hon',m:'The local pronunciation of Baltimore — a badge of authenticity'},{p:'Natty Boh',m:'National Bohemian beer — the unofficial beer of Baltimore'}] },
  pittsburgh:   { name: 'English (Pittsburghese) 🌉', bcp47: 'en-US', phrases: [{p:'Yinz going to the game?',m:'\'Yinz\' = you all — Pittsburgh\'s version of y\'all'},{p:'Gumbands',m:'What Pittsburghers call rubber bands — completely unique'},{p:'Nebby',m:'Nosy / curious — \'don\'t be nebby\''},{p:'The \'Burgh',m:'What locals call the city — always with pride'},{p:'Primanti\'s or pierogies?',m:'The two Pittsburgh food touchstones — get both'},{p:'Go Stillers!',m:'The Pittsburgh Steelers — Black and Gold is a religion here'}] },
  saltlakecity: { name: 'English (Utah) ⛷️', bcp47: 'en-US', phrases: [{p:'Greatest Snow on Earth',m:'Utah\'s official slogan — not an exaggeration for powder skiing'},{p:'Where\'s the nearest trailhead?',m:'SLC is surrounded by world-class hiking and biking'},{p:'Is this beer 4% or 5%?',m:'Utah has unusual alcohol laws — beer was capped at 3.2% until 2019'},{p:'How far is Park City?',m:'35 minutes up I-80 — one of the best ski towns in America'},{p:'Is the temple open to visitors?',m:'The grounds are open but the temple itself requires LDS membership'},{p:'Fry sauce?',m:'Utah\'s beloved ketchup-mayo condiment served with fries everywhere'}] },
};

/* ===================== INIT ===================== */
document.addEventListener('DOMContentLoaded', async () => {
  renderCityGrid(CITIES);
  populateEstimatorSelect();
  populateIdeaCitySelect();
  setDefaultDates();
  setupSearchInput();
  loadPlanner();

  // Open a city directly from ?city=id (e.g. linked from globe)
  const _cityParam = new URLSearchParams(window.location.search).get('city');
  if (_cityParam) {
    const _target = CITIES.find(c => c.id === _cityParam);
    if (_target) {
      document.getElementById('cities')?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => openCity(_target.id), 300);
    }
  }

  if (IS_CONFIGURED) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) await handleSession(session);
    supabaseClient.auth.onAuthStateChange(async (_event, session) => {
      if (session) await handleSession(session);
      else handleSignOut();
    });
    checkURLForBoard();
  } else {
    showBoardUI('notice');
  }
});

/* ===================== AUTH ===================== */
function openAuth(view) {
  document.getElementById('auth-modal').classList.remove('hidden');
  switchAuth(view);
}
function closeAuth() { document.getElementById('auth-modal').classList.add('hidden'); }
function switchAuth(view) {
  document.getElementById('auth-login-view').classList.toggle('hidden', view !== 'login');
  document.getElementById('auth-signup-view').classList.toggle('hidden', view !== 'signup');
  document.getElementById('auth-forgot-view').classList.toggle('hidden', view !== 'forgot');
  document.getElementById('auth-success-view').classList.add('hidden');
  // Update dialog label to match the active view
  const titles = { login:'Sign In', signup:'Create Account', forgot:'Reset Password' };
  const titleEl = document.getElementById('auth-modal-title');
  if (titleEl && titles[view]) titleEl.textContent = titles[view];
}

async function sendPasswordReset() {
  const email = document.getElementById('forgot-email').value.trim();
  const err   = document.getElementById('forgot-error');
  const ok    = document.getElementById('forgot-ok');
  const btn   = document.getElementById('forgot-submit-btn');
  err.classList.add('hidden');
  ok.classList.add('hidden');
  if (!email) { err.textContent = 'Please enter your email.'; err.classList.remove('hidden'); return; }
  if (!supabaseClient) { err.textContent = 'Auth not configured.'; err.classList.remove('hidden'); return; }
  if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/reset-password.html',
  });
  if (btn) { btn.disabled = false; btn.textContent = 'Send Reset Link'; }
  if (error) { err.textContent = error.message; err.classList.remove('hidden'); return; }
  ok.classList.remove('hidden');
}

async function signIn() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-password').value;
  const err   = document.getElementById('login-error');
  err.classList.add('hidden');
  if (!supabaseClient) { err.textContent = 'Auth not configured.'; err.classList.remove('hidden'); return; }
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password: pass });
  if (error) {
    err.textContent = error.message === 'Email not confirmed'
      ? 'Please confirm your email first — check your inbox for the PinTrip link.'
      : error.message;
    err.classList.remove('hidden');
    return;
  }
  showAuthSuccess('Welcome back!');
}

async function signUp() {
  const username = document.getElementById('signup-username').value.trim();
  const email    = document.getElementById('signup-email').value.trim();
  const pass     = document.getElementById('signup-password').value;
  const err      = document.getElementById('signup-error');
  err.classList.add('hidden');
  if (!username) { err.textContent = 'Please enter a display name.'; err.classList.remove('hidden'); return; }
  if (!email)    { err.textContent = 'Please enter your email.';     err.classList.remove('hidden'); return; }
  if (pass.length < 6) { err.textContent = 'Password must be at least 6 characters.'; err.classList.remove('hidden'); return; }
  if (!supabaseClient) { err.textContent = 'Auth not configured.'; err.classList.remove('hidden'); return; }
  const { data, error } = await supabaseClient.auth.signUp({ email, password: pass, options: { data: { username } } });
  if (error) { err.textContent = error.message; err.classList.remove('hidden'); return; }
  // Supabase requires email confirmation by default — session will be null until confirmed
  if (data.session) {
    showAuthSuccess(`Welcome to PinTrip, ${username}!`);
  } else {
    showAuthSuccess(`Check your email at ${email} and click the confirmation link, then come back to log in.`, true);
  }
}

async function signOut() {
  if (supabaseClient) await supabaseClient.auth.signOut();
  handleSignOut();
  closeProfile();
}

async function handleSession(session) {
  currentUser = session.user;
  const { data: profile } = await supabaseClient.from('profiles').select('*').eq('id', currentUser.id).single();
  currentProfile = profile;
  updateHeaderUI(true);
  showBoardUI('board');
  loadUserBoards();
}

function handleSignOut() {
  currentUser = null; currentProfile = null; currentBoard = null;
  if (realtimeChannel) { supabaseClient.removeChannel(realtimeChannel); realtimeChannel = null; }
  updateHeaderUI(false);
  showBoardUI('login');
}

function updateHeaderUI(loggedIn) {
  document.getElementById('header-auth').classList.toggle('hidden', loggedIn);
  document.getElementById('header-user').classList.toggle('hidden', !loggedIn);
  if (loggedIn && currentProfile) {
    const initials = currentProfile.username.slice(0,2).toUpperCase();
    document.getElementById('header-avatar').textContent = initials;
    document.getElementById('header-username').textContent = currentProfile.username;
  }
}

function showAuthSuccess(msg, keepOpen = false) {
  document.getElementById('auth-login-view').classList.add('hidden');
  document.getElementById('auth-signup-view').classList.add('hidden');
  document.getElementById('auth-success-view').classList.remove('hidden');
  document.getElementById('auth-success-msg').textContent = msg;
  if (!keepOpen) setTimeout(() => closeAuth(), 2200);
}

function showBoardUI(state) {
  document.getElementById('supabase-notice').classList.toggle('hidden', state !== 'notice');
  document.getElementById('board-login-prompt').classList.toggle('hidden', state !== 'login');
  document.getElementById('board-ui').classList.toggle('hidden', state !== 'board');
  if (state === 'login' && !IS_CONFIGURED) {
    document.getElementById('supabase-notice').classList.remove('hidden');
    document.getElementById('board-login-prompt').classList.add('hidden');
  }
}

/* ===================== PROFILE ===================== */
function openProfile() {
  if (!currentUser) { openAuth('login'); return; }
  const modal = document.getElementById('profile-modal');
  const initials = currentProfile?.username.slice(0,2).toUpperCase() || '?';
  document.getElementById('profile-avatar-lg').textContent = initials;
  document.getElementById('profile-username-display').textContent = currentProfile?.username || '';
  document.getElementById('profile-email-display').textContent = currentUser.email;
  modal.classList.remove('hidden');
}
function closeProfile() { document.getElementById('profile-modal').classList.add('hidden'); }
function openProfileOrAuth() { currentUser ? openProfile() : openAuth('login'); }

/* ===================== BOARDS ===================== */
async function loadUserBoards() {
  if (!currentUser) return;
  const { data: boards } = await supabaseClient.from('boards').select('*').eq('created_by', currentUser.id).order('created_at', { ascending: false });
  if (boards?.length) selectBoard(boards[0]);
}

function openNewBoardModal() { document.getElementById('new-board-modal').classList.remove('hidden'); document.getElementById('new-board-name').focus(); }
function closeNewBoardModal() { document.getElementById('new-board-modal').classList.add('hidden'); }

async function createBoard() {
  const name = document.getElementById('new-board-name').value.trim();
  const err  = document.getElementById('new-board-error');
  err.classList.add('hidden');
  if (!name) { err.textContent = 'Please enter a board name.'; err.classList.remove('hidden'); return; }
  const { data, error } = await supabaseClient.from('boards').insert({ name, created_by: currentUser.id }).select().single();
  if (error) { err.textContent = error.message; err.classList.remove('hidden'); return; }
  closeNewBoardModal();
  document.getElementById('new-board-name').value = '';
  selectBoard(data);
}

async function selectBoard(board) {
  currentBoard = board;
  document.getElementById('active-board-name').textContent = board.name;
  if (realtimeChannel) { supabaseClient.removeChannel(realtimeChannel); realtimeChannel = null; }
  await loadIdeas();
  subscribeToBoard();
}

async function loadIdeas() {
  if (!currentBoard) return;
  const { data } = await supabaseClient.from('ideas').select('*, votes(user_id,direction)').eq('board_id', currentBoard.id).order('created_at', { ascending: true });
  renderIdeas(data || []);
}

function subscribeToBoard() {
  if (!currentBoard || !supabaseClient) return;
  realtimeChannel = supabaseClient.channel(`board-${currentBoard.id}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'ideas', filter: `board_id=eq.${currentBoard.id}` }, () => loadIdeas())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, () => loadIdeas())
    .on('presence', { event: 'sync' }, () => updateOnlineUsers())
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED' && currentProfile) {
        await realtimeChannel.track({ user_id: currentUser.id, username: currentProfile.username });
      }
    });
}

function updateOnlineUsers() {
  if (!realtimeChannel) return;
  const state = realtimeChannel.presenceState();
  const users = Object.values(state).flat();
  const container = document.getElementById('online-users');
  if (!users.length) { container.innerHTML = ''; return; }
  container.innerHTML = `
    <div class="online-badge"><div class="online-dot"></div>${users.length} online now</div>
    ${users.map(u => `<div class="online-badge">${escHtml(u.username)}</div>`).join('')}
  `;
}

/* ===================== IDEAS ===================== */
async function addIdea() {
  if (!currentUser) { openAuth('login'); return; }
  if (!currentBoard) { openNewBoardModal(); return; }
  const cityId   = document.getElementById('idea-city').value;
  const note     = document.getElementById('idea-note').value.trim().slice(0, 500);
  if (!cityId || !note) { showToast('Pick a city and describe your idea!'); return; }
  if (!currentProfile) { showToast('Profile not loaded yet — try again.'); return; }
  const btn = document.getElementById('add-idea-btn');
  if (btn) btn.disabled = true;
  const city = CITIES.find(c => c.id === cityId);
  await supabaseClient.from('ideas').insert({
    board_id: currentBoard.id, city_id: cityId, city_name: city?.name || cityId,
    note, created_by: currentUser.id, username: currentProfile.username, vote_score: 0,
  });
  document.getElementById('idea-note').value = '';
  if (btn) btn.disabled = false;
}

async function voteIdea(ideaId, direction) {
  if (!currentUser) { openAuth('login'); return; }
  const { data: existing } = await supabaseClient.from('votes').select('*').eq('idea_id', ideaId).eq('user_id', currentUser.id).single();
  if (existing) {
    await supabaseClient.from('votes').delete().eq('idea_id', ideaId).eq('user_id', currentUser.id);
    await recalcScore(ideaId);
    if (existing.direction === direction) return; // toggled off — done
  }
  await supabaseClient.from('votes').insert({ idea_id: ideaId, user_id: currentUser.id, direction });
  await recalcScore(ideaId);
}

async function recalcScore(ideaId) {
  const { data: votes } = await supabaseClient.from('votes').select('direction').eq('idea_id', ideaId);
  const score = (votes || []).reduce((s, v) => s + (v.direction === 'up' ? 1 : -1), 0);
  await supabaseClient.from('ideas').update({ vote_score: score }).eq('id', ideaId);
}

async function deleteIdea(ideaId) {
  await supabaseClient.from('ideas').delete().eq('id', ideaId).eq('created_by', currentUser.id);
}

function renderIdeas(ideas) {
  const container = document.getElementById('ideas-list');
  if (!ideas.length) {
    container.innerHTML = `<div class="board-empty"><div>📍</div><p>No ideas yet — be the first to pin one!</p></div>`;
    return;
  }
  const sorted = [...ideas].sort((a,b) => b.vote_score - a.vote_score);
  container.innerHTML = sorted.map(idea => {
    const userVote = idea.votes?.find(v => v.user_id === currentUser?.id)?.direction || null;
    const score = idea.vote_score || 0;
    const isOwn = currentUser && idea.created_by === currentUser.id;
    return `
      <div class="idea-card">
        <div class="idea-city-badge">📍 ${escHtml(idea.city_name)}</div>
        <div class="idea-content">
          <div class="idea-note">${escHtml(idea.note)}</div>
          <div class="idea-meta">by ${escHtml(idea.username)}</div>
        </div>
        <div class="idea-votes">
          <button class="vote-btn up ${userVote==='up'?'voted-up':''}" onclick="voteIdea('${jsqApp(idea.id)}','up')">👍</button>
          <span class="vote-count" style="color:${score>0?'#6aaf82':score<0?'#c05050':'#9e9085'}">${score>0?'+':''}${score}</span>
          <button class="vote-btn down ${userVote==='down'?'voted-down':''}" onclick="voteIdea('${jsqApp(idea.id)}','down')">👎</button>
        </div>
        ${isOwn ? `<button class="idea-delete" onclick="deleteIdea('${jsqApp(idea.id)}')">✕</button>` : ''}
      </div>`;
  }).join('');
}

/* ===================== BOARD PICKER ===================== */
async function openBoardPicker() {
  if (!currentUser) return;
  const { data: boards } = await supabaseClient.from('boards').select('*').eq('created_by', currentUser.id).order('created_at', { ascending: false });
  const list = document.getElementById('board-picker-list');
  if (!boards?.length) {
    list.innerHTML = '<p style="color:rgba(240,250,249,.35);text-align:center;padding:20px">No boards yet.</p>';
  } else {
    list.innerHTML = boards.map(b => `
      <div class="board-picker-item ${currentBoard?.id === b.id ? 'active' : ''}" data-board-id="${escHtml(b.id)}">
        <div>
          <div class="board-picker-item-name">${escHtml(b.name)}</div>
          <div class="board-picker-item-meta">${new Date(b.created_at).toLocaleDateString()}</div>
        </div>
        ${currentBoard?.id === b.id ? '<span style="color:#2dd4bf">●</span>' : ''}
      </div>`).join('');
    // Attach click handlers safely — avoids inline JSON / XSS
    list.querySelectorAll('.board-picker-item').forEach(el => {
      el.addEventListener('click', () => {
        const board = boards.find(b => b.id === el.dataset.boardId);
        if (board) { selectBoard(board); closeBoardPicker(); }
      });
    });
  }
  document.getElementById('board-picker-modal').classList.remove('hidden');
}
function closeBoardPicker() { document.getElementById('board-picker-modal').classList.add('hidden'); }

async function shareBoard() {
  if (!currentBoard) return;
  const url = `${window.location.origin}${window.location.pathname}?board=${currentBoard.id}`;
  try { await navigator.clipboard.writeText(url); } catch(e) { prompt('Copy link:', url); return; }
  showToast('🔗 Board link copied!');
}

async function checkURLForBoard() {
  const params = new URLSearchParams(window.location.search);
  const boardId = params.get('board');
  if (!boardId || !IS_CONFIGURED) return;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(boardId)) return;
  const { data: board } = await supabaseClient.from('boards').select('*').eq('id', boardId).single();
  if (board && currentUser) { selectBoard(board); document.getElementById('group').scrollIntoView({ behavior: 'smooth' }); }
}

/* ===================== CITY MODAL ===================== */
function openCity(id) {
  currentCity = CITIES.find(c => c.id === id);
  if (!currentCity) return;
  document.getElementById('modal-city-name').textContent = currentCity.name;
  document.getElementById('modal-country').textContent  = currentCity.country;
  document.getElementById('modal-tagline').textContent  = currentCity.tagline;
  const hero = document.getElementById('modal-hero-img');
  hero.style.backgroundImage = `url(${currentCity.image})`;
  hero.style.backgroundSize = 'cover'; hero.style.backgroundPosition = 'center';
  document.getElementById('price-filter').value = 'all';
  document.getElementById('sort-filter').value  = 'default';
  document.getElementById('tab-search').value   = '';
  document.querySelectorAll('.tab-btn').forEach((b,i) => b.classList.toggle('active', i===0));
  switchTab('activities', document.querySelector('.tab-btn'));
  document.getElementById('city-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() { document.getElementById('city-modal').classList.add('hidden'); document.body.style.overflow = ''; }
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
document.getElementById('city-modal').addEventListener('click', function(e) { if (e.target === this) closeModal(); });

function pinCityToBoard() {
  if (!currentCity) return;
  closeModal();
  window.location.href = `planner.html?tab=group${currentCity ? '&city=' + encodeURIComponent(currentCity.id) : ''}`;
}

/* ===================== TABS ===================== */
function switchTab(tab, btn) {
  currentTab = tab;
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');
  if (btn) btn.classList.add('active');
  if (tab === 'deals') renderDealsTab();
  else if (tab === 'pack') renderPackTab();
  else if (tab === 'essentials') renderEssentialsTab();
  else applyFilter();
}

/* ===================== FILTER ===================== */
function applyFilter() {
  if (!currentCity || ['deals','pack','essentials'].includes(currentTab)) return;
  const priceKey = document.getElementById('price-filter').value;
  const sort     = document.getElementById('sort-filter').value;
  const q        = (document.getElementById('tab-search').value || '').trim().toLowerCase();
  let items = [...(currentCity[currentTab] || [])].filter(Boolean);
  // Price filter
  items = items.filter(item => {
    if (priceKey === 'free')    return item.price === 0;
    if (priceKey === 'budget')  return item.price < 15;
    if (priceKey === 'mid')     return item.price >= 15 && item.price <= 50;
    if (priceKey === 'premium') return item.price > 50;
    return true;
  });
  // Text search
  if (q) {
    items = items.filter(item =>
      (item.name    || '').toLowerCase().includes(q) ||
      (item.tip     || '').toLowerCase().includes(q) ||
      (item.desc    || '').toLowerCase().includes(q) ||
      (item.cuisine || '').toLowerCase().includes(q)
    );
  }
  if (sort === 'price-asc')  items.sort((a,b) => a.price - b.price);
  if (sort === 'price-desc') items.sort((a,b) => b.price - a.price);
  if (sort === 'rating')     items.sort((a,b) => b.rating - a.rating);
  if (currentTab === 'food') renderFoodByGenre(items);
  else renderCards(items, `${currentTab}-list`, currentTab);
}

/* ===================== CARDS ===================== */
function renderCards(items, containerId, type) {
  const container = document.getElementById(containerId);
  if (!items.length) { container.innerHTML = `<div class="no-results"><div>🔍</div>No spots match this filter.</div>`; return; }
  container.innerHTML = items.map(item => {
    const priceStr = item.price === 0 ? `<span class="spot-price free">FREE</span>` : `<span class="spot-price">$${item.price}</span>`;
    const photoSrc   = item.photo || getSpotPhoto(item.name, currentCity.name);
    const cityImgSrc = jsqApp(currentCity.image.replace('w=800','w=400'));
    const photo = type !== 'transport'
      ? `<img class="spot-photo" src="${escHtml(photoSrc)}" alt="${escHtml(item.name)}" loading="lazy"
           onerror="if(!this._fb){this._fb=true;this.src='${cityImgSrc}'}else{this.onerror=null}" />`
      : '';
    let meta = `<span class="spot-tag tag-rating">⭐ ${item.rating}</span>`;
    if (item.duration) meta += `<span class="spot-tag tag-duration">🕐 ${item.duration}</span>`;
    if (item.type)     meta += `<span class="spot-tag tag-type">🚌 ${item.type}</span>`;
    const addBtn = type !== 'transport' ? `<button class="spot-add-day-btn" onclick="addToDay('${jsqApp(currentCity.id)}','${jsqApp(currentCity.name)}','${jsqApp(item.name)}')">+ Plan</button>` : '';
    return `
      <div class="spot-card">
        ${photo}
        <div class="spot-body">
          <div class="spot-header"><div class="spot-name">${escHtml(item.name)}</div>${priceStr}${addBtn}</div>
          <div class="spot-meta">${meta}</div>
          <div class="spot-tip">💡 ${escHtml(item.tip)}</div>
          ${type === 'activities' ? buildSearchLinks(item.name, currentCity) : ''}
        </div>
      </div>`;
  }).join('');
}

/* ===================== FOOD BY GENRE ===================== */
const GENRE_EMOJI = {
  // Basics
  'Pizza':'🍕','Sushi':'🍣','Ramen':'🍜','Burgers':'🍔','Tacos':'🌮','Seafood':'🦞',
  'Steakhouse':'🥩','Bakery':'🥐','Ice Cream':'🍦','Food Hall':'🏪','Food Market':'🛒',
  'Market':'🛒','Brunch':'🍳','Breakfast':'🍳','BBQ':'🔥','Italian':'🍝','Chinese':'🥢',
  'Vietnamese':'🍜','Mexican':'🌮','Street Food':'🛵','Healthy/Vegan':'🥗','Fine Dining':'🍷',
  // American regional
  'Texas BBQ':'🤠','Deep Dish Pizza':'🍕','Chicago Dog':'🌭','Nashville Hot Chicken':'🌶',
  'Southern Fine Dining':'🌿','Oyster Bar':'🦪','Creole Soul Food':'🫕','Classic Creole':'🫕',
  'Louisiana Creole':'🫕','Po-Boys':'🥖','Po-Boy Sandwiches':'🥖','Beignets & Café au Lait':'☕',
  'Meat & Three':'🍗','Diner Burger':'🍔','Southern Brunch':'🧇','Old School Steakhouse':'🥩',
  'American Share Plates':'🍽','American Fine Dining':'🍴','American Gastropub':'🍺',
  'Breakfast/Burgers':'🍳','Breakfast/Brunch':'🍳','Brunch Buffet':'🍳','Fried Chicken':'🍗',
  'Pies & Comfort':'🥧','Nacho Bar':'🧀','Farm-to-Table Texas':'🌿','Greasy Spoon Diner':'🍳',
  // NYC & East Coast
  'NYC Pizza':'🍕','NY-Style Pizza':'🍕','Jewish Deli':'🥪','Puerto Rican':'🇵🇷',
  'Middle Eastern':'🧆','Chinese Dumplings':'🥟','Mexican Street Tacos':'🌮',
  // Latin & Cuban
  'Cuban':'🇨🇺','Cuban Sandwiches':'🥪','Cuban Breakfast':'🍳','Cuban Fritas':'🍔',
  'Cuban Bakery':'🥐','Tex-Mex Breakfast':'🌮','Austin Tacos':'🌮','Mexican Tacos':'🌮',
  'Oaxacan Mexican':'🇲🇽','Mission Burrito':'🌯','Sonoran Mexican':'🌮','Birria':'🥩',
  'Street Tacos':'🌮','Creative Tacos':'🌮','Caribbean Sandwiches':'🥪',
  // Chicago
  'Italian Beef':'🥖','Italian Sandwiches':'🥖','Eclectic Sandwiches':'🥪',
  // Japanese
  'Japanese Fusion':'🇯🇵','Izakaya':'🍶','Conveyor Sushi':'🍣','Omakase Sushi':'🍣',
  'Omakase':'🍣','Innovative Japanese':'🍱','Tsukemen Ramen':'🍜','Tonkatsu':'🥩',
  "Chef's Counter Fine Dining":'🍽','Japanese Charcoal Grill':'🔥',
  'Yakitori Alley':'🍢','Convenience Store':'🏪',
  // East & Southeast Asian
  'Dim Sum':'🥟','Dim Sum To-Go':'🥟','Asian Street Food':'🥡','Asian BBQ':'🔥',
  'Poke':'🐟','Udon':'🍜','Local Plate Lunch':'🍱','Plate Lunch':'🍱',
  'Sichuan Chinese':'🌶','Northern Thai':'🌶','Southern Thai':'🌶',
  'Thai':'🇹🇭','Vietnamese Pho':'🍜',
  // Hawaiian
  'Traditional Hawaiian':'🌺','Saimin & Dry Mein':'🍜','Shrimp Plate':'🍤','Fresh Seafood':'🦐',
  // French & European
  'Modern French':'🇫🇷','French Fine Dining':'🥂','French Bakery':'🥐',
  'French Bakery/Brunch':'🥐','Classic Café':'☕','Crêperie':'🥞',
  'Traditional French':'🇫🇷','Grilled Meats':'🔥','Provençal Bistro':'🍷',
  // Spanish
  'Tapas':'🫒','Catalan':'🇪🇸','Avant-garde Tapas':'✨','Wine Bar':'🍷',
  'Cava Bar':'🥂','Cava & Tapas':'🥂','Wine & Small Plates':'🍷',
  'Gelato':'🍦','Gourmet Sandwiches':'🥖','Market Bar':'🛒',
  // Balinese & Indonesian
  'Balinese':'🌺','Warung':'🍚','Fried Fish':'🐟','Chicken Rice':'🍱',
  // Other
  'Falafel':'🧆','Mediterranean':'🫒','Peruvian':'🇵🇪',
  'Cal-Med':'🍋','California Cuisine':'🌿',
  'Pacific Northwest Fine Dining':'🌲',
  'Cajun Dive Bar':'🦞','Cajun-Southern':'🫕','Creole Breakfast':'🍳',
  'Cajun Seafood':'🦞','BBQ + Tex-Mex':'🔥','Mexican Seafood':'🌊',
  // LA-specific
  'Creative Tacos':'🌮','French Dip Sandwiches':'🥖','Nashville Hot Chicken':'🌶',
  'Korean BBQ':'🔥','Northern Thai':'🌶','Street Tacos':'🌮',
  // British & Irish
  'British':'🇬🇧','British Gastropub':'🍺','British Nose-to-Tail':'🥩','British Seasonal':'🌿',
  'British Steakhouse':'🥩','British-American':'🍔','Traditional Pub':'🍺',
  // Italian (additional)
  'Modern Italian':'🍝','Italian Fine Dining':'🍷','Italian Caff':'☕','Italian Deli':'🥖',
  'Fresh Pasta':'🍝','Hand-Made Pasta':'🍝','Modern Roman':'🍝','Roman':'🍝',
  'Roman Trattoria':'🍝','Roman Pasta':'🍝','Roman Offal':'🥩','Roman Deli & Wine Bar':'🍷',
  'Roman Bakery':'🥐','Roman Bar':'☕','Roman Street Food':'🛵','Roman Pastry':'🥐',
  'Tuscan':'🍷','Neapolitan Pizza':'🍕','Artisan Pizza':'🍕','Old-School Pizza':'🍕',
  'Pizza Romana':'🍕','Pizza al Taglio':'🍕','Sicilian Slice':'🍕',
  // French (additional)
  'French Bistro':'🥂','French Brasserie':'🇫🇷','French Pastries':'🥐','French-Belgian':'🧇',
  'French Creole Brunch':'🍳','Épicerie Brunch':'🥐',
  // Dutch
  'Dutch Grand Café':'☕','Dutch Home Cooking':'🍽','Dutch Brown Café':'🍺',
  'Dutch Craft Beer':'🍺','Dutch Street Food':'🥘','Dutch Bar':'🍺',
  'Dutch Rotisserie':'🍗','Dutch Apple Pie':'🥧','Dutch Garden Produce':'🥗',
  'Dutch Garden-to-Table':'🌿','Modern Dutch':'🍽','Surinamese':'🌍',
  // Portuguese
  'Portuguese Petiscos':'🫒','Portuguese Tasca':'🍷','Portuguese Seafood':'🦞',
  'Portuguese Fine Dining':'🍷','Portuguese Home Cooking':'🍽','Portuguese Pastry':'🥐',
  'Portuguese Deli':'🥖','Portuguese Liqueur':'🥃','Traditional Portuguese':'🇵🇹',
  'Modern Portuguese':'🇵🇹','Modern Portuguese Fine Dining':'🍷',
  'Modern Portuguese Wine Bar':'🍷','Modern Portuguese-Peruvian':'🇵🇪',
  'Pastel de Nata':'🥐','Grilled Sardines':'🐟','Fado & Portuguese':'🎸',
  'Natural Wine Bar':'🍷','Natural Wine & Charcuterie':'🧀',
  // Spanish (additional)
  'Spanish Tapas':'🫒','Catalan Seafood':'🦞','Catalan Dairy Café':'☕',
  'Basque Wood-Fire':'🔥','Tapas & Montaditos':'🫒','Seafood Tapas':'🦞',
  // Australian
  'Modern Australian':'🦘','Modern Australian Fine Dining':'🍷','Australian Fine Dining':'🍷',
  'Australian BBQ':'🔥','Australian Bakery':'🥐','Australian Beach Bar':'🌊',
  'Australian Burger':'🍔','Australian Steakhouse':'🥩','Wood-Fired Australian':'🔥',
  'Asian-Australian':'🥢','Global Comfort Food':'🍽',
  // Middle Eastern & Emirati
  'Emirati':'🇦🇪','Emirati Café':'☕','Emirati Seafood':'🦞','Emirati & Seafood':'🦞',
  'Traditional Emirati':'🇦🇪','Iranian Kabab':'🔥','Kurdish-Middle Eastern':'🧆',
  'Modern Middle Eastern':'🧆','Turkish Ocakbaşı':'🔥','Modern Turkish':'🇹🇷',
  'Pakistani':'🍛','Progressive Indian':'🍛','Indian Fine Dining':'🍛','Indian BBQ':'🔥',
  'Bombay Café':'☕','Indian Prata':'🫓',
  // Thai (additional)
  'Thai Street Food':'🛵','Thai Boat Noodles':'🍜','Contemporary Thai':'🇹🇭',
  'Royal Thai':'🇹🇭','Rustic Thai Bar Food':'🍶','Thai Seafood':'🦞',
  'Nose-to-Tail Thai':'🥩','Sustainable Thai':'🌿','Thai Riverfront':'🚤',
  'Thai Produce Market':'🛒','Pad Thai':'🍜','Thai Dessert':'🍡','Thai Ice Cream':'🍦',
  'Thai Specialty Coffee':'☕',
  // Korean (comprehensive)
  'Korean BBQ Galbi':'🔥','Korean Fine BBQ':'🔥','Korean Hanwoo Beef':'🥩',
  'Korean Street Food':'🌶','Korean Seafood':'🦞','Korean Seafood Stew':'🍲',
  'Korean Fine Dining':'🍽','Korean Traditional':'🇰🇷','Modern Korean':'🇰🇷',
  'Modern Korean Grill':'🔥','Korean Court Cuisine':'🏛','Korean Braised Chicken':'🍗',
  'Korean Braised Pork':'🥩','Korean Gimbap':'🍱','Korean Porridge':'🍚',
  'Korean Raw Seafood':'🦑','Korean Rice Wine':'🍶','Korean Bakery Café':'☕',
  'Korean Dessert':'🍡','Korean Dessert Café':'🍡','Korean Bar':'🍺','Korean-NW Fusion':'🌲',
  // Japanese (additional)
  'Modern Japanese':'🇯🇵','Japanese Fine Dining':'🍽','Japanese Izakaya':'🍶',
  'Japanese Ramen':'🍜','Japanese Robata':'🔥','Yuzu Ramen':'🍜',
  'Shabu-Shabu':'🍲','Wagyu Shabu-Shabu':'🥩','Tempura Kaiseki':'🍤',
  'Beef Katsu':'🥩',
  // Singaporean & Malaysian
  'Peranakan':'🌺','Peranakan Fine Dining':'🌺','Peranakan Satay':'🍢',
  'Hawker':'🍱','Hawker Centre':'🍱','Malaysian Hawker':'🍱','Malaysian':'🇲🇾',
  'Hainanese Chicken Rice':'🍱','Bak Chor Mee':'🍜','Bak Kut Teh':'🥣',
  'Laksa':'🍜','Murtabak':'🫓','Nasi Padang':'🍱','Singapore Chilli Crab':'🦀',
  'Singaporean Breakfast':'🍳','Progressive Singaporean':'🇸🇬','Oyster Omelette':'🦪',
  'Sri Lankan':'🍛','Indonesian Rijsttafel':'🍱','Indonesian Fine Dining':'🍽',
  // Chinese (additional)
  'Cantonese':'🥢','Cantonese Wonton':'🥟','Dim Sum To-Go':'🥟',
  'Pan-Asian Dumplings':'🥟','Cold Noodles':'🍜','Chinese-Thai Seafood':'🦞',
  'Chinese-California':'🥢','Taiwanese':'🥡','Macanese':'🇲🇴',
  // Mexican (additional)
  'Modern Mexican':'🌮','Regional Mexican':'🌮','Traditional Mexican':'🌮',
  'Mexican Breakfast':'🌮','Mexican Cantina':'🌮','Mexican Churros':'🍩',
  'Mexican Comida Corrida':'🍽','Mexican Deli':'🥪','Mexican Fine Dining':'🍷',
  'Mexican-Italian':'🍝','Oaxacan':'🇲🇽','Interior Mexican':'🌮',
  'Tacos al Pastor':'🌮','Tijuana Street Tacos':'🌮','Fish Tacos':'🌮',
  'Wood-Fired Tacos':'🌮','Baja Mexican':'🌊','Sunday Barbacoa':'🥩',
  'Modern Mexican-French':'🇲🇽',
  // American (additional)
  'Modern American':'🇺🇸','American Sharing Plates':'🍽','American Steakhouse':'🥩',
  'Farm-to-Table American':'🌿','Grain-Forward American':'🌾',
  'Hill Country Tasting Menu':'🍷','Modern Tasting Menu':'🍷',
  'Soul Food':'🍗','Southern Bakery':'🥐','Southern Coastal':'🦞',
  'Southern Country Cooking':'🍗','Southern Oyster Bar':'🦪',
  'Nashville BBQ':'🔥','Tennessee BBQ Whole Hog':'🐷','Texas-Style BBQ':'🔥',
  'BBQ Fusion':'🔥','Bar & Grill':'🍺','Beachfront Bar & Grill':'🌊',
  'Tex-Mex Diner':'🌮','Bodega Lunch':'🥪','Gourmet Slider':'🍔',
  'Gourmet Street Food':'🛵','Local Diner':'🍳','Historic Bar':'🍺',
  'Historic Café':'☕','Craft Beer':'🍺','Craft Beer & Charcuterie':'🧀',
  'Beer Garden':'🌿','Rooftop Bar':'🌃','Cocktail Bar':'🍸',
  'Craft Cocktail Bar':'🍸','Café & Cocktails':'☕',
  // Café / Coffee / Bakery
  'Café':'☕','All-Day Café':'☕','Modern Café':'☕','Specialty Coffee':'☕',
  'Coffee':'☕','Espresso':'☕','Nordic Coffee':'☕','Organic Café':'🌿',
  'South African Café':'☕','Sustainable Café':'🌿','European Café':'☕',
  'California Brunch':'🥑','California-Inspired All-Day':'☀️',
  'International Brunch':'🍳','Asian Fusion Brunch':'🥢',
  // Global / fusion
  'Modern Asian':'🥢','Southeast Asian Fusion':'🌏','Modern European':'🍷',
  'Modern Greek':'🫒','Modern Lebanese':'🧆','Modern Jerusalem':'🧆',
  'Modern Bar Food':'🍺','Modern Balinese':'🌺','Organic Indonesian':'🌿',
  'Modern Café':'☕','Sharing Plates':'🍽','Creative Bistro':'🍷',
  'Crossroads Cuisine':'🌍','Global Comfort Food':'🍽',
  'European':'🇪🇺','Classic Bistro':'🍷','Aperitivo & All-Day':'🍸',
  'Appetizing Shop':'🥢','Gourmet Market':'🛒','Street Market':'🛒',
  'Street Food Market':'🛵','Street Snacks':'🛵',
  // Seafood
  'Oysters & Seafood':'🦪','Pacific Northwest Oyster Bar':'🦪',
  'Raw Bar & Seafood':'🦞','Seafood Fine Dining':'🍷','Seafood Café':'🦞',
  'Seafood Rice':'🍚','Modern Australian Fine Dining':'🍷',
  // Argentine / South American
  'Argentine Asado':'🥩','Modern Greek':'🫒',
  // Dessert / Sweets
  'Artisan Gelato':'🍦','Chocolate Cake':'🎂','Beignets':'🍩',
  'Israeli Bakery':'🥐','Belgian Fries':'🍟','Dutch Apple Pie':'🥧',
  // Vegan / Vegetarian
  'Vegan/Vegetarian':'🥗','Vegetarian Burgers':'🍔','Vegetarian Café':'🥗',
  // Remaining
  'Crispy Duck':'🦆','Chicken Noodle Soup':'🍲','Cuban Cafeteria':'🇨🇺','German Fine Dining':'🥨',
  'Caramelized Deep Dish':'🍕','Classic Creole Brunch':'🍳','Cajun Butchery':'🦞',
  'Chef':'🍽','Greek Fast Casual':'🫒','Cajun-Creole':'🫕',
  'Underwater Fine Dining':'🐠',
  // Miscellaneous
  'Aperitivo & All-Day':'🍸','Vietnamese Bánh Mì':'🥖','Vietnamese Cajun':'🦞',
  'Hawaiian Fusion':'🌺','Hawaiian Plate Lunch':'🍱','Hawaiian-SF Fusion':'🌺',
  'Modern Café':'☕','Seafood Tapas':'🦞','Wine & Cheese':'🧀',
  'Craft Cocktail Bar':'🍸','Ramen & Buns':'🍜','Italian-Mexican':'🌮',
  'Italian-Southern':'🍗','BBQ + Tex-Mex':'🔥',
  // American & Regional
  'American':'🍔','New American':'🍽️','American Soul':'🍗','American Farm-to-Table':'🌾',
  'American Brasserie':'🍷','New American Fine Dining':'🍽️','Southern New American':'🍗',
  'Modern Southern':'🍗','Southern':'🍗','Southern Biscuits':'🧁','French New American':'🥐',
  'Creative Diner':'🍳','Brunch & Dinner':'🍳','Bar & Burgers':'🍔','Burgers & Sandwiches':'🍔',
  'Sandwiches':'🥪','Cheesesteak':'🥩','Classic Steakhouse':'🥩',
  // Mid-Atlantic & New England
  'Mid-Atlantic':'🦀','New England Seafood':'🦞','New Haven-Style Pizza':'🍕',
  'New York-Style Pizza':'🍕','Italian-American':'🍝','Italian Market':'🛒',
  // Southwest & Native
  'New Mexican':'🌶️','Southwestern':'🌵','Native American Fine Dining':'🌽',
  // Asian
  'Japanese':'🍱','Japanese Omakase':'🍣','Spanish-Japanese':'🍣',
  'Chinese-American':'🥢','Cambodian-Taiwanese':'🍜','Modern Indian':'🍛',
  // Mediterranean & Middle Eastern
  'Eastern Mediterranean':'🥙','Eastern Mediterranean Mezze':'🫒',
  'Israeli':'🫒','Israeli Hummus':'🫒','Israeli Grill':'🔥','Lebanese':'🫒',
  // European
  'German Gasthaus':'🥨','Scandinavian Brunch':'🧇','European Charcuterie':'🧀',
  'European Cafe':'☕','Belgian Beer Bar':'🍺','Italian Bakery':'🥖',
  // Pub & Beer
  'New Zealand Pub':'🍺','Craft Beer & Gastropub':'🍺','Gastropub':'🍺',
  'Bar & Games':'🎮','Charcuterie & Craft Beer':'🧀','Oysters & Craft Beer':'🦪',
  // Bakery & Cafe
  'Artisan Bakery':'🥐','Bakery & Cafe':'☕','Market & Cafe':'☕',
  // Plant-Based & Health
  'Vegetarian Fast Casual':'🥗','Vegetable-Focused':'🥦','Vegan Burgers':'🌱',
  'Vegan Fine Dining':'🌱','Healthy Fast Casual':'🥗','Farm-to-Table Brunch':'🌾',
  'Mediterranean Fast Casual':'🥙',
  // Global & Fusion
  'Global Street Food':'🌍','Global Comfort':'🌍','Avant-Garde Tasting Menu':'🔬',
  "Chef's Counter Fine Dining":'👨‍🍳','Argentinian Wood-Fired':'🔥',
  // Sweets & Drinks
  'Artisan Ice Cream':'🍦','Old-Fashioned Ice Cream':'🍦','Doughnuts':'🍩',
  'Donuts & Fried Chicken':'🍩','Craft Cocktails':'🍸','New American Wine Bar':'🍷',
  // Other
  'Chicken':'🍗','Pasta':'🍝',
  // Batch 3-5 new cuisines
  'Czech':'🇨🇿','Modern Czech':'🇨🇿','Hungarian':'🇭🇺','Turkish':'🇹🇷',
  'Kaiseki':'🍽','Cape Malay':'🌶','South African BBQ':'🔥','Deli':'🥪',
  'Moroccan':'🇲🇦','Austrian':'🇦🇹','Scottish':'🏴󠁧󠁢󠁳󠁣󠁴󠁿','Danish':'🇩🇰',
  'Greek':'🇬🇷','Croatian':'🇭🇷','Venetian':'🍤','Florentine':'🌸',
  'German':'🥨','French-German':'🍷','Spanish':'🇪🇸','Egyptian':'🇪🇬',
  'International':'🌍','Hong Kong':'🥢','Hot Pot':'🍲','Malaysian Chinese':'🥢',
  'Fruit':'🍓','Argentine':'🥩','Canadian':'🍁','French-Canadian':'🇨🇦',
  'Asian':'🥢','Swedish':'🇸🇪','Irish':'🇮🇪',
  'Italian Trattoria':'🍝','Italian Fine Dining':'🍷',
  'Tex-Mex':'🌮','Vietnamese-Cajun':'🦞','Café Bakery':'☕',
  'Cuban-Spanish':'🇨🇺','Cuban Sandwich':'🥪',
  'Native American-Inspired':'🌽','Healthy American':'🥗',
  'Mexican Street Food':'🌮','Korean-BBQ':'🔥','Southern Seafood':'🦞',
  'American Diner':'🍳','Brewery-Restaurant':'🍺',
  'Eastern European Deli':'🥪','Asian Fusion':'🥢',
  'Pittsburgh Sandwich':'🥪','Polish-American':'🥟',
  'Eastern European Vegan':'🌱','Belgian Street Food':'🍟',
  'Japanese Sushi':'🍣','Vegetarian':'🥗','Indian':'🍛','French':'🥐','Pub':'🍺',
};

function renderFoodByGenre(items) {
  const container = document.getElementById('food-list');
  if (!items.length) { container.innerHTML = `<div class="no-results"><div>🍽</div>No food spots match this filter.</div>`; return; }
  const genres = {};
  items.forEach(item => { const g = item.cuisine || 'Other'; if (!genres[g]) genres[g] = []; genres[g].push(item); });
  container.innerHTML = Object.entries(genres).map(([genre, list]) => `
    <div class="food-genre-group">
      <div class="food-genre-header">
        <span class="food-genre-icon">${GENRE_EMOJI[genre] || '🍴'}</span>
        <span class="food-genre-name">${escHtml(genre)}</span>
        <span class="food-genre-count">${list.length} spot${list.length>1?'s':''}</span>
      </div>
      <div class="cards-grid">
        ${list.map(item => `
          <div class="spot-card">
            <img class="spot-photo" src="${escHtml(item.photo || getSpotPhoto(item.name, currentCity.name))}" alt="${escHtml(item.name)}" loading="lazy"
              onerror="if(!this._fb){this._fb=true;this.src='${jsqApp(currentCity.image.replace('w=800','w=400'))}'}else{this.onerror=null}" />
            <div class="spot-body">
              <div class="spot-header"><div class="spot-name">${escHtml(item.name)}</div><span class="spot-price${item.price===0?' free':''}">${item.price===0?'FREE':'$'+item.price}</span><button class="spot-add-day-btn" onclick="addToDay('${jsqApp(currentCity.id)}','${jsqApp(currentCity.name)}','${jsqApp(item.name)}')">+ Plan</button></div>
              <div class="spot-meta"><span class="spot-tag tag-rating">⭐ ${item.rating}</span></div>
              <div class="spot-tip">💡 ${escHtml(item.tip)}</div>
              ${buildSearchLinks(item.name, currentCity)}
            </div>
          </div>`).join('')}
      </div>
    </div>`).join('');
}

/* ===================== SPOT PHOTOS ===================== */
const PHOTO_MAP = {
  'central park':             'photo-1568515387631-8b650bbcdb90',
  'eiffel tower':             'photo-1499856871958-5b9627545d1a',
  'golden gate bridge':       'photo-1501594907352-04cda38ebc29',
  'statue of liberty':        'photo-1607853202273-797f1c22a38e',
  'brooklyn bridge':          'photo-1526481280693-3bfa7568e0f3',
  'space needle':             'photo-1502175353174-a7a70e73b362',
  'waikiki beach':            'photo-1507525428034-b723cf961d3e',
  'road to hana':             'photo-1542259009477-d625272157b7',
  'griffith observatory':     'photo-1580655653885-65763b2597d0',
  'millennium park':          'photo-1477959858617-67f85cf4f1df',
  'bellagio fountains':       'photo-1605833556294-ea5c7a74f57d',
  'senso-ji':                 'photo-1540959733332-eab4deabeeaf',
  'sagrada família':          'photo-1539037116277-4db20889f2d4',
  'louvre':                   'photo-1565799557186-fbf4e10c9f34',
  'pike place':               'photo-1509099836639-18ba1795216d',
  'barton springs':           'photo-1531218150217-54595bc2b934',
  'magic kingdom':            'photo-1575430577598-65cee96d0a31',
  'venice beach':             'photo-1449034446853-66c86144b0ad',
  'alcatraz':                 'photo-1501594907352-04cda38ebc29',
  'wynwood':                  'photo-1533929736458-ca588d08c8be',
  'mount rainier':            'photo-1464822759023-fed622ff2c3b',
  'haleakalā':                'photo-1542259009477-d625272157b7',
  'pearl harbor':             'photo-1507525428034-b723cf961d3e',
  'art institute':            'photo-1573078468413-8b3c31a1cbea',
  'franklin barbecue':        'photo-1544025162-d76538b670bc',
  'wrigley field':            'photo-1566577134770-3d85bb3a9cc4',
  'french quarter':           'photo-1568515387631-8b650bbcdb90',
  'chihuly':                  'photo-1464822759023-fed622ff2c3b',
  'grand ole opry':           'photo-1544985361-b420d7a77043',
  'park güell':               'photo-1539037116277-4db20889f2d4',
  'notre-dame':               'photo-1499856871958-5b9627545d1a',
  'teamlab':                  'photo-1540959733332-eab4deabeeaf',
  'versailles':               'photo-1566073771259-6a8506099945',
  'mont-saint-michel':        'photo-1499856871958-5b9627545d1a',
  'south beach':              'photo-1506905925346-21bda4d32df4',
  'everglades':               'photo-1548783300-8678e3a0f4ac',
  'discovery cove':           'photo-1559827291-72ee739d0d9a',
  'hamilton pool':            'photo-1531218150217-54595bc2b934',
  'muir woods':               'photo-1464822759023-fed622ff2c3b',
};

const CATEGORY_PHOTO_FALLBACK = [
  ['ramen',       'photo-1569718212165-3a8278d5f624'],
  ['sushi',       'photo-1617196034183-421b4040ed20'],
  ['pizza',       'photo-1565299624946-b28f40a0ae38'],
  ['burger',      'photo-1568901346375-23c9450c58cd'],
  ['taco',        'photo-1551504734-5ee1c4a1479b'],
  ['bakery',      'photo-1509440159596-0249088772ff'],
  ['coffee',      'photo-1509042239860-f550ce710b93'],
  ['café',        'photo-1509042239860-f550ce710b93'],
  ['ice cream',   'photo-1563805042-7684c019e1cb'],
  ['gelato',      'photo-1563805042-7684c019e1cb'],
  ['bar',         'photo-1543007630-9710e4a00a20'],
  ['wine',        'photo-1510812431401-41d2bd2722f3'],
  ['seafood',     'photo-1534080564583-6be75777b70a'],
  ['steak',       'photo-1544025162-d76538b670bc'],
  ['bbq',         'photo-1544025162-d76538b670bc'],
  ['barbecue',    'photo-1544025162-d76538b670bc'],
  ['food hall',   'photo-1533777857889-4be7c70b33f7'],
  ['food market', 'photo-1533777857889-4be7c70b33f7'],
  ['street food', 'photo-1567620905732-2d1ec7ab7445'],
  ['deli',        'photo-1579584425555-c3ce17fd4351'],
  ['museum',      'photo-1518998053901-5348d3961a04'],
  ['art',         'photo-1513364776144-60967b0f800f'],
  ['park',        'photo-1441974231531-c6227db76b6e'],
  ['garden',      'photo-1416879595882-3373a0480b5b'],
  ['beach',       'photo-1507525428034-b723cf961d3e'],
  ['temple',      'photo-1528360983277-13d401cdc186'],
  ['shrine',      'photo-1528360983277-13d401cdc186'],
  ['market',      'photo-1534190760961-74e8c1c5c3da'],
  ['bridge',      'photo-1501466044931-62695aada8e9'],
  ['tower',       'photo-1499856871958-5b9627545d1a'],
  ['observatory', 'photo-1501854140801-50d01698950b'],
  ['waterfall',   'photo-1532274402911-5a369e4c4bb5'],
  ['hiking',      'photo-1464822759023-fed622ff2c3b'],
  ['trail',       'photo-1464822759023-fed622ff2c3b'],
  ['aquarium',    'photo-1557200134-90327ee9fafa'],
  ['zoo',         'photo-1534567153574-2b12153a87f0'],
  ['stadium',     'photo-1564419320461-6870880221ad'],
  ['island',      'photo-1559128010-7c1ad6e1b6a5'],
  ['cathedral',   'photo-1467269204594-9661b134dd2b'],
  ['church',      'photo-1467269204594-9661b134dd2b'],
  ['palace',      'photo-1566073771259-6a8506099945'],
  ['castle',      'photo-1566073771259-6a8506099945'],
  ['cruise',      'photo-1548438294-1ad5d5f4f063'],
  ['boat',        'photo-1548438294-1ad5d5f4f063'],
];

function getSpotPhoto(name, cityName) {
  const key = name.toLowerCase();
  const match = Object.keys(PHOTO_MAP).find(k => key.includes(k) || k.includes(key.split('(')[0].trim()));
  if (match) return `https://images.unsplash.com/${PHOTO_MAP[match]}?w=400&q=75`;
  const cat = CATEGORY_PHOTO_FALLBACK.find(([k]) => key.includes(k));
  if (cat) return `https://images.unsplash.com/${cat[1]}?w=400&q=75`;
  const city = CITIES.find(c => c.name === cityName);
  return city ? city.image.replace('w=800', 'w=400') : `https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=75`;
}

/* ===================== SEARCH LINKS ===================== */
function buildSearchLinks(name, city) {
  const q   = encodeURIComponent(`${name} ${city.name}`);
  const tag = name.replace(/[^a-z0-9]/gi, '').toLowerCase();
  const rel = 'noopener noreferrer';
  return `
    <div class="spot-search-links">
      <a class="slink slink-yelp"   href="https://www.yelp.com/search?find_desc=${encodeURIComponent(name)}&find_loc=${encodeURIComponent(city.name)}" target="_blank" rel="${rel}">⭐ Yelp</a>
      <a class="slink slink-maps"   href="https://www.google.com/maps/search/${q}" target="_blank" rel="${rel}">📍 Maps</a>
      <a class="slink slink-tiktok" href="https://www.tiktok.com/search?q=${q}" target="_blank" rel="${rel}">🎵 TikTok</a>
      <a class="slink slink-ig"     href="https://www.instagram.com/explore/tags/${tag}/" target="_blank" rel="${rel}">📸 IG</a>
    </div>`;
}

/* ===================== PACK TAB ===================== */
function renderPackTab() {
  if (!currentCity) return;
  const data = PACK_DATA[currentCity.packType || 'city_usa'];
  document.getElementById('pack-content').innerHTML = [
    { key:'clothing', icon:'👕', title:'Clothing & Footwear' },
    { key:'documents', icon:'📄', title:'Documents & Money' },
    { key:'gear', icon:'🎒', title:'Gear & Gadgets' },
    { key:'apps', icon:'📱', title:'Must-Have Apps' },
  ].map(s => `
    <div class="pack-category">
      <div class="pack-cat-title">${s.icon} ${s.title}</div>
      <div class="pack-items">${data[s.key].map(i => `<div class="pack-item">${i}</div>`).join('')}</div>
    </div>`).join('');
}

/* ===================== SPEECH ===================== */
let _voiceGender = 'female'; // 'female' | 'male'

// Keywords used to identify voice gender from the voice name string
const _femaleVoiceKeys = ['female','zira','samantha','fiona','moira','tessa','veena','victoria','karen','serena','nicky','susan','linda','google uk english female','microsoft eva','microsoft zira','kyoko','o-ren'];
const _maleVoiceKeys   = ['male','david','alex','daniel','fred','james','george','mark','paul','richard','lee','rishi','jorge','luca','google uk english male','microsoft david','microsoft mark','otoya'];

function setVoiceGender(gender, btn) {
  _voiceGender = gender;
  document.querySelectorAll('.voice-gender-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function speakPhrase(text, bcp47) {
  if (!('speechSynthesis' in window)) { showToast('Audio not supported in this browser.'); return; }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = bcp47 || 'en-US';
  u.rate = 0.85;

  const voices    = window.speechSynthesis.getVoices();
  const langBase  = (bcp47 || 'en').split('-')[0].toLowerCase();
  // Prefer exact lang match, fall back to same language family
  const langVoices = voices.filter(v => v.lang.toLowerCase().startsWith(bcp47?.toLowerCase() || 'en'))
                  .concat(voices.filter(v => v.lang.toLowerCase().startsWith(langBase)));
  const unique    = [...new Map(langVoices.map(v => [v.voiceURI, v])).values()];

  if (unique.length) {
    const keys    = _voiceGender === 'female' ? _femaleVoiceKeys : _maleVoiceKeys;
    const matched = unique.find(v => keys.some(k => v.name.toLowerCase().includes(k)));
    // If no keyword match, female = last voice, male = first (browsers typically order M then F)
    u.voice = matched || (_voiceGender === 'female' ? unique[unique.length - 1] : unique[0]);
  }

  window.speechSynthesis.speak(u);
}

/* ===================== CURRENCY RATE ===================== */
// Inline fallback so currency section works even if travel-apps.js is cached without CITY_CURRENCY
const _CURRENCY_FALLBACK = {
  nyc:'USD',miami:'USD',losangeles:'USD',lasvegas:'USD',hawaii:'USD',austin:'USD',
  nashville:'USD',orlando:'USD',seattle:'USD',sandiego:'USD',washingtondc:'USD',
  boston:'USD',denver:'USD',portland:'USD',atlanta:'USD',philadelphia:'USD',phoenix:'USD',
  chicago:'USD',neworleans:'USD',sanfrancisco:'USD',
  paris:'EUR',rome:'EUR',amsterdam:'EUR',lisbon:'EUR',barcelona:'EUR',
  tokyo:'JPY',seoul:'KRW',bangkok:'THB',singapore:'SGD',bali:'IDR',
  london:'GBP',sydney:'AUD',dubai:'AED',mexicocity:'MXN',
};
const _CURRENCY_NAMES = {
  USD:{name:'US Dollar',symbol:'$'}, EUR:{name:'Euro',symbol:'€'},
  JPY:{name:'Japanese Yen',symbol:'¥'}, KRW:{name:'South Korean Won',symbol:'₩'},
  THB:{name:'Thai Baht',symbol:'฿'}, SGD:{name:'Singapore Dollar',symbol:'S$'},
  IDR:{name:'Indonesian Rupiah',symbol:'Rp'}, GBP:{name:'British Pound',symbol:'£'},
  AUD:{name:'Australian Dollar',symbol:'A$'}, AED:{name:'UAE Dirham',symbol:'د.إ'},
  MXN:{name:'Mexican Peso',symbol:'$'}, HKD:{name:'Hong Kong Dollar',symbol:'HK$'},
};

function _getCurrencyData(cityId) {
  if (typeof CITY_CURRENCY !== 'undefined' && CITY_CURRENCY[cityId]) return CITY_CURRENCY[cityId];
  const code = _CURRENCY_FALLBACK[cityId];
  if (!code) return null;
  const meta = _CURRENCY_NAMES[code] || { name: code, symbol: code };
  return { code, ...meta };
}

async function fetchCurrencyRate(cityId) {
  if (_currencyRateCache[cityId]) return _currencyRateCache[cityId];
  const cur = _getCurrencyData(cityId);
  if (!cur) return null;
  if (cur.code === 'USD') { _currencyRateCache[cityId] = { usd: true, code: 'USD' }; return _currencyRateCache[cityId]; }
  try {
    const r = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json');
    if (!r.ok) throw new Error('fetch failed');
    const data = await r.json();
    const rate = data.usd[cur.code.toLowerCase()];
    if (!rate) throw new Error('no rate');
    const result = { ...cur, rate, date: data.date };
    _currencyRateCache[cityId] = result;
    return result;
  } catch { return { ...cur, rate: null }; }
}

function renderCurrencySection(cityId) {
  const cur = _getCurrencyData(cityId);
  if (!cur) return '';
  const cn = encodeURIComponent((currentCity || {}).name || cityId);
  const exchangeUrl = `https://www.google.com/maps/search/currency+exchange+in+${cn}`;
  const elId = `currency-rate-val-${cityId}`;
  if (cur.code === 'USD') {
    return `
    <div class="essentials-section" id="currency-section-${cityId}">
      <div class="essentials-title">💱 Currency</div>
      <div class="essentials-tip-box">💵 Local currency is <strong>US Dollar (USD)</strong> — no exchange needed.</div>
    </div>`;
  }
  fetchCurrencyRate(cityId).then(res => {
    const el = document.getElementById(elId);
    if (!el) return;
    if (res && res.rate != null) {
      el.innerHTML = `<strong>1 USD = ${res.rate.toLocaleString(undefined,{maximumFractionDigits:2})} ${escHtml(cur.symbol)} ${escHtml(cur.code)}</strong><span class="currency-date"> · as of ${escHtml(res.date)}</span>`;
    } else {
      el.textContent = 'Rate unavailable — check back later.';
    }
  });
  return `
    <div class="essentials-section" id="currency-section-${cityId}">
      <div class="essentials-title">💱 Currency — ${escHtml(cur.name)} (${escHtml(cur.code)})</div>
      <div class="essentials-tip-box currency-rate-box">
        <span id="${elId}"><span class="currency-loading">Loading live rate…</span></span>
      </div>
      <a class="currency-exchange-btn" href="${exchangeUrl}" target="_blank" rel="noopener noreferrer">
        📍 Find currency exchange in ${escHtml((currentCity || {}).name || cityId)}
      </a>
    </div>`;
}

/* ===================== ESSENTIALS TAB ===================== */
function renderEssentialsTab() {
  if (!currentCity) return;
  const lang = CITY_LANGUAGES[currentCity.id];
  let html = renderCurrencySection(currentCity.id);
  if (lang) html += `
    <div class="essentials-section">
      <div class="essentials-lang-header">
        <div class="essentials-title">🗣 Local Language — ${lang.name}</div>
        <div class="voice-gender-wrap">
          <span class="voice-gender-label">Voice:</span>
          <button class="voice-gender-btn ${_voiceGender==='female'?'active':''}" onclick="setVoiceGender('female',this)">♀ Female</button>
          <button class="voice-gender-btn ${_voiceGender==='male'  ?'active':''}" onclick="setVoiceGender('male',this)"  >♂ Male</button>
        </div>
      </div>
      <div class="phrase-grid">${lang.phrases.map(p=>`
        <div class="phrase-card">
          <div class="phrase-card-top">
            <div class="phrase-text">${p.p}</div>
            <button class="phrase-audio-btn" onclick="speakPhrase('${jsqApp(p.p)}','${lang.bcp47||'en-US'}')" title="Hear pronunciation">🔊</button>
          </div>
          <div class="phrase-meaning">${p.m}</div>
          ${p.r?`<div class="phrase-pronoun">Say: "${p.r}"</div>`:''}
        </div>`).join('')}
      </div>
    </div>`;
  // City-specific travel apps from travel-apps.js
  const tg = typeof CITY_TRAVEL_APPS !== 'undefined' ? CITY_TRAVEL_APPS[currentCity.id] : null;
  if (tg) {
    const appRow = (arr) => (arr || []).map(a =>
      `<div class="app-card">
        <div class="app-icon">${a.star ? '⭐' : '📱'}</div>
        <div><div class="app-name">${escHtml(a.n)}</div><div class="app-desc">${escHtml(a.note || (a.star ? 'Recommended for this city' : ''))}</div></div>
      </div>`
    ).join('');

    html += `
    <div class="essentials-section">
      <div class="essentials-title">🗺 Best Maps for ${escHtml(currentCity.name)}</div>
      <div class="app-grid">${appRow(tg.maps)}</div>
      ${tg.transit ? `<div class="essentials-tip-box">🚇 <strong>Transit card:</strong> ${escHtml(tg.transit.card)} &nbsp;·&nbsp; ${escHtml(tg.transit.tip)}</div>` : ''}
    </div>
    <div class="essentials-section">
      <div class="essentials-title">🚕 Ride-Hailing</div>
      <div class="app-grid">${appRow(tg.ride)}</div>
    </div>
    <div class="essentials-section">
      <div class="essentials-title">🍽 Food & Reservations</div>
      <div class="app-grid">${appRow(tg.food)}</div>
    </div>
    <div class="essentials-section">
      <div class="essentials-title">💳 Payments & SIM</div>
      <div class="essentials-tip-box">💳 ${escHtml(tg.pay)}</div>
      <div class="essentials-tip-box" style="margin-top:8px">📱 ${escHtml(tg.sim)}</div>
    </div>
    <div class="essentials-section">
      <div class="essentials-title">💡 Top Travel Tip</div>
      <div class="essentials-tip-box">${escHtml(tg.tip)}</div>
    </div>`;
  }

  html += `
    <div class="essentials-section">
      <div class="essentials-title">📲 Translation Apps</div>
      <div class="app-grid">${TRANSLATE_APPS.map(a=>`<div class="app-card"><div class="app-icon">${a.icon}</div><div><div class="app-name">${a.name}</div><div class="app-desc">${a.desc}</div></div></div>`).join('')}</div>
    </div>
    <div class="essentials-section">
      <div class="essentials-title">🌍 General Travel Apps</div>
      <div class="app-grid">${GENERAL_TRAVEL_APPS.map(a=>`<div class="app-card"><div class="app-icon">${a.icon}</div><div><div class="app-name">${a.name}</div><div class="app-desc">${a.desc}</div></div></div>`).join('')}</div>
    </div>`;
  document.getElementById('essentials-content').innerHTML = html;
}

/* ===================== DEALS TAB ===================== */
function renderDealsTab() {
  if (!currentCity) return;
  const city = currentCity;
  const rel = 'noopener noreferrer';
  const cn  = encodeURIComponent(city.name);
  document.getElementById('deals-content').innerHTML = `
    <div>
      <div class="deal-section-title">✈ Flights to ${escHtml(city.name)} (${escHtml(city.iata)})</div>
      <div class="deals-grid-mini">
        <a class="inline-deal-btn" href="https://www.google.com/travel/flights?q=flights+to+${cn}" target="_blank" rel="${rel}">Google Flights</a>
        <a class="inline-deal-btn" href="https://www.kayak.com/flights/anywhere-${escHtml(city.iata)}" target="_blank" rel="${rel}">Kayak</a>
        <a class="inline-deal-btn" href="https://www.skyscanner.com/transport/flights/anywhere/${city.iata.toLowerCase()}/" target="_blank" rel="${rel}">Skyscanner</a>
        <a class="inline-deal-btn" href="https://www.expedia.com/Flights-Search?leg1=to:${escHtml(city.iata)}" target="_blank" rel="${rel}">Expedia</a>
      </div>
    </div>
    <div>
      <div class="deal-section-title">🚗 Rental Cars in ${escHtml(city.name)}</div>
      <div class="deals-grid-mini">
        <a class="inline-deal-btn" href="https://www.kayak.com/cars/${cn}" target="_blank" rel="${rel}">Kayak Cars</a>
        <a class="inline-deal-btn" href="https://www.costcotravel.com/Rental-Cars" target="_blank" rel="${rel}">Costco Travel</a>
        <a class="inline-deal-btn" href="https://www.enterprise.com" target="_blank" rel="${rel}">Enterprise</a>
        <a class="inline-deal-btn" href="https://www.hertz.com" target="_blank" rel="${rel}">Hertz</a>
      </div>
    </div>
    <div>
      <div class="deal-section-title">🏨 Where to Stay</div>
      <div class="deals-grid-mini">
        <a class="inline-deal-btn" href="https://www.booking.com/search.html?ss=${cn}" target="_blank" rel="${rel}">🏨 Booking.com</a>
        <a class="inline-deal-btn" href="https://www.airbnb.com/s/${cn}/homes" target="_blank" rel="${rel}">🏠 Airbnb</a>
        <a class="inline-deal-btn" href="https://www.hotels.com/search.do?q-destination=${cn}" target="_blank" rel="${rel}">🛎 Hotels.com</a>
      </div>
    </div>`;
}

/* ===================== REGION FILTER ===================== */
function filterRegion(region, btn) {
  document.querySelectorAll('.region-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if (region === 'all') renderCityGrid(CITIES);
  else if (region === 'International') renderCityGrid(CITIES.filter(c => c.country !== 'USA'));
  else renderCityGrid(CITIES.filter(c => c.country === region));
}

/* ===================== CITY GRID ===================== */
function renderCityGrid(cities) {
  const grid = document.getElementById('city-grid');
  if (!cities.length) {
    grid.innerHTML = '<div style="color:rgba(240,250,249,.35);text-align:center;padding:40px">No destinations found.</div>';
    return;
  }
  grid.innerHTML = cities.map((city, i) => {
    // Compute average rating across all activities + food
    const allPlaces = [...(city.activities || []), ...(city.food || [])];
    const avgRating = allPlaces.length
      ? (allPlaces.reduce((s, p) => s + (p.rating || 0), 0) / allPlaces.length).toFixed(1)
      : '—';
    const placeCount = allPlaces.length;
    // Count hole-in-the-wall / locals-only spots
    const localGems = allPlaces.filter(p => p.localGem).length;
    return `
    <div class="city-card" onclick="openCity('${city.id}')" draggable="true"
      ondragstart="startCityDrag(event,'${city.id}','${escHtml(city.name)}')"
      style="animation-delay:${i * 0.04}s">
      <div class="city-card-img" style="background-image:url('${city.image}')"></div>
      <div class="city-card-overlay"></div>
      <div class="city-card-footer">
        <div class="city-card-meta-row">
          <span class="city-row-iata">${escHtml(city.iata)}</span>
          <span class="city-card-country">${escHtml(city.country)}</span>
        </div>
        <div class="city-card-name">${escHtml(city.name)}</div>
      </div>
    </div>`;
  }).join('');
}

function scrollToCities() {
  document.getElementById('cities').scrollIntoView({ behavior: 'smooth' });
}

/* ===================== SEARCH ===================== */
function setupSearchInput() {
  const input = document.getElementById('city-search');
  const sug   = document.getElementById('search-suggestions');
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { sug.classList.add('hidden'); return; }
    const matches = CITIES.filter(c => c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q));
    if (!matches.length) { sug.classList.add('hidden'); return; }
    sug.innerHTML = matches.map(c => `<div class="suggestion-item" onclick="openCity('${escHtml(c.id)}');document.getElementById('city-search').value='';document.getElementById('search-suggestions').classList.add('hidden')">📍 <strong>${escHtml(c.name)}</strong> <span style="color:#6b5f55;font-size:12px">${escHtml(c.country)}</span></div>`).join('');
    sug.classList.remove('hidden');
  });
  document.addEventListener('click', e => { if (!e.target.closest('.hero-search,.search-suggestions')) sug.classList.add('hidden'); });
}
function searchCity() {
  const q = document.getElementById('city-search').value.trim().toLowerCase();
  const m = CITIES.find(c => c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q));
  if (m) openCity(m.id);
}

/* ===================== DEALS SECTION ===================== */
function buildFlightLink(platform, anchor) {
  const from = document.getElementById('flight-from').value.trim();
  const to   = document.getElementById('flight-to').value.trim();
  const dep  = document.getElementById('flight-depart').value;
  const ret  = document.getElementById('flight-return').value;
  const pax  = document.getElementById('flight-pax').value || '1';
  if (!from || !to) { showToast('Enter origin and destination first.'); return false; }
  const depFmt = dep.replace(/-/g,'');
  const retFmt = ret.replace(/-/g,'');
  const f = encodeURIComponent(from), t = encodeURIComponent(to);
  const urls = {
    google:     `https://www.google.com/travel/flights?q=Flights+from+${f}+to+${t}`,
    kayak:      `https://www.kayak.com/flights/${f}-${t}/${dep}/${ret}/${pax}adults`,
    skyscanner: `https://www.skyscanner.com/transport/flights/${f}/${t}/${depFmt}/${retFmt}/?adults=${pax}&currency=USD`,
    expedia:    `https://www.expedia.com/Flights-Search?trip=roundtrip&leg1=from:${f},to:${t},departure:${dep}TANYT&leg2=from:${t},to:${f},departure:${ret}TANYT&passengers=adults:${pax}&mode=search`,
    priceline:  `https://www.priceline.com/flights/search?originAirportCode=${f}&destinationAirportCode=${t}&departDate=${dep}&returnDate=${ret}&numberOfAdults=${pax}`,
  };
  anchor.href = urls[platform] || '#';
  return true;
}
function buildCarLink(platform, anchor) {
  const loc    = document.getElementById('car-location').value.trim();
  const pickup = document.getElementById('car-pickup').value;
  const drop   = document.getElementById('car-dropoff').value;
  const l = encodeURIComponent(loc || 'airport');
  const urls = {
    kayak:      `https://www.kayak.com/cars/${l}/${pickup}/${drop}`,
    google:     `https://www.google.com/travel/search?q=rental+cars+${l}`,
    enterprise: `https://www.enterprise.com/en/car-rental/dexter.html?icid=ENUS.HOME.GLOBAL.RENTALCAR`,
    hertz:      `https://www.hertz.com/rentacar/reservation/`,
    turo:       `https://turo.com/search?location=${l}&startDate=${pickup}&endDate=${drop}`,
    costco:     `https://www.costcotravel.com/Rental-Cars`,
  };
  anchor.href = urls[platform] || '#';
  return true;
}

function buildHotelLink(platform, anchor) {
  const dest    = document.getElementById('hotel-dest').value.trim();
  const checkin = document.getElementById('hotel-checkin').value;
  const checkout= document.getElementById('hotel-checkout').value;
  const guests  = document.getElementById('hotel-guests').value || '2';
  if (!dest) { showToast('Enter a destination first.'); return false; }
  const d = encodeURIComponent(dest);
  const urls = {
    booking:  `https://www.booking.com/search.html?ss=${d}&checkin=${checkin}&checkout=${checkout}&group_adults=${guests}&no_rooms=1`,
    hotels:   `https://www.hotels.com/search.do?q-destination=${d}&q-check-in-date=${checkin}&q-check-out-date=${checkout}&q-rooms=1&q-room-0-adults=${guests}`,
    expedia:  `https://www.expedia.com/Hotel-Search?destination=${d}&startDate=${checkin}&endDate=${checkout}&adults=${guests}`,
    google:   `https://www.google.com/travel/hotels?q=${d}+hotels&dates=${checkin},${checkout}`,
    airbnb:   `https://www.airbnb.com/s/${d}/homes?checkin=${checkin}&checkout=${checkout}&adults=${guests}`,
  };
  anchor.href = urls[platform] || '#';
  return true;
}

/* ===================== BUDGET ESTIMATOR ===================== */
let _estDropdownOpen = false;

function populateEstimatorSelect() {
  // Populate dropdown options once
  const dd = document.getElementById('est-city-dropdown');
  if (!dd) return;
  dd.innerHTML = CITIES.map(c =>
    `<div class="est-city-option" onclick="selectEstCity('${escHtml(c.name)}, ${escHtml(c.country)}')">${escHtml(c.name)}, ${escHtml(c.country)}</div>`
  ).join('');
  // Close dropdown when clicking outside
  document.addEventListener('click', e => {
    if (!e.target.closest('.est-city-wrap')) closeEstDropdown();
  });
}

function showEstDropdown() {
  const dd = document.getElementById('est-city-dropdown');
  if (!dd) return;
  dd.style.display = 'block';
  _estDropdownOpen = true;
  filterEstCities(document.getElementById('est-city-input').value);
}

function closeEstDropdown() {
  const dd = document.getElementById('est-city-dropdown');
  if (dd) dd.style.display = 'none';
  _estDropdownOpen = false;
}

function toggleEstDropdown() {
  _estDropdownOpen ? closeEstDropdown() : showEstDropdown();
}

function filterEstCities(val) {
  const dd = document.getElementById('est-city-dropdown');
  if (!dd) return;
  const q = val.trim().toLowerCase();
  const opts = dd.querySelectorAll('.est-city-option');
  let any = false;
  opts.forEach(o => {
    const show = !q || o.textContent.toLowerCase().includes(q);
    o.style.display = show ? 'block' : 'none';
    if (show) any = true;
  });
  dd.style.display = any ? 'block' : 'none';
  _estDropdownOpen = any;
}

function selectEstCity(val) {
  const inp = document.getElementById('est-city-input');
  if (inp) inp.value = val;
  closeEstDropdown();
}

function estCityKeydown(e) {
  const dd = document.getElementById('est-city-dropdown');
  if (!dd || dd.style.display === 'none') return;
  const visible = [...dd.querySelectorAll('.est-city-option')].filter(o => o.style.display !== 'none');
  const active  = dd.querySelector('.est-city-option.active');
  let idx = visible.indexOf(active);
  if (e.key === 'ArrowDown') { e.preventDefault(); idx = Math.min(idx + 1, visible.length - 1); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); idx = Math.max(idx - 1, 0); }
  else if (e.key === 'Enter' && active) { e.preventDefault(); selectEstCity(active.textContent); return; }
  else if (e.key === 'Escape') { closeEstDropdown(); return; }
  else return;
  visible.forEach(o => o.classList.remove('active'));
  if (visible[idx]) { visible[idx].classList.add('active'); visible[idx].scrollIntoView({ block: 'nearest' }); }
}

const COL = {
  // USA
  nyc:          {b:70,m:180,l:450}, miami:        {b:65,m:160,l:420}, hawaii:       {b:75,m:190,l:500},
  losangeles:   {b:65,m:165,l:430}, chicago:      {b:60,m:150,l:380}, lasvegas:     {b:55,m:140,l:400},
  neworleans:   {b:50,m:120,l:300}, nashville:    {b:55,m:130,l:320}, sanfrancisco: {b:75,m:190,l:480},
  orlando:      {b:80,m:200,l:450}, austin:       {b:55,m:130,l:320}, seattle:      {b:65,m:160,l:400},
  sandiego:     {b:60,m:155,l:400}, washingtondc: {b:65,m:155,l:390}, boston:       {b:65,m:160,l:420},
  denver:       {b:55,m:135,l:350}, portland:     {b:55,m:135,l:340}, atlanta:      {b:55,m:135,l:340},
  philadelphia: {b:60,m:145,l:380}, phoenix:      {b:50,m:125,l:320},
  // International
  paris:        {b:60,m:150,l:400}, tokyo:        {b:50,m:120,l:350}, bali:         {b:30,m:70,l:200},
  barcelona:    {b:55,m:130,l:350}, london:       {b:70,m:175,l:450}, rome:         {b:55,m:135,l:360},
  amsterdam:    {b:60,m:150,l:390}, sydney:       {b:65,m:160,l:430}, dubai:        {b:65,m:170,l:500},
  bangkok:      {b:30,m:75,l:220},  singapore:    {b:55,m:140,l:380}, lisbon:       {b:45,m:110,l:300},
  seoul:        {b:45,m:110,l:300}, mexicocity:   {b:35,m:85,l:240},
  // New international cities
  prague:       {b:40,m:100,l:280}, budapest:     {b:35,m:90,l:260},
  istanbul:     {b:35,m:90,l:260}, kyoto:         {b:55,m:140,l:380},
  capetown:     {b:45,m:115,l:320}, marrakech:    {b:30,m:75,l:200},
  vienna:       {b:55,m:140,l:380}, edinburgh:    {b:55,m:135,l:360},
  copenhagen:   {b:65,m:165,l:450}, havana:       {b:25,m:60,l:150},
  // Batch 3 — Europe & Asia
  santorini:    {b:70,m:175,l:480}, dubrovnik:    {b:60,m:150,l:400},
  venice:       {b:65,m:160,l:440}, florence:     {b:55,m:135,l:370},
  milan:        {b:60,m:155,l:420}, berlin:       {b:55,m:135,l:360},
  madrid:       {b:55,m:135,l:360}, cairo:        {b:25,m:60,l:160},
  osaka:        {b:50,m:120,l:330}, hongkong:     {b:60,m:155,l:430},
  // Batch 4 — Asia & Americas
  taipei:       {b:35,m:85,l:240}, kualalumpur:  {b:30,m:75,l:210},
  hanoi:        {b:25,m:60,l:170}, buenosaires:  {b:35,m:85,l:240},
  toronto:      {b:65,m:160,l:430}, vancouver:    {b:70,m:175,l:460},
  stockholm:    {b:70,m:180,l:490}, dublin:       {b:65,m:160,l:440},
  // Batch 5 — More USA
  dallas:       {b:55,m:140,l:380}, houston:      {b:55,m:135,l:360},
  tampa:        {b:60,m:145,l:380}, charlotte:    {b:55,m:130,l:340},
  memphis:      {b:50,m:120,l:310}, minneapolis:  {b:60,m:145,l:380},
  kansascity:   {b:50,m:120,l:310}, baltimore:    {b:55,m:130,l:340},
  pittsburgh:   {b:50,m:120,l:310}, saltlakecity: {b:55,m:135,l:360},
};
function estimateBudget() {
  const inputVal = (document.getElementById('est-city-input').value || '').trim().toLowerCase();
  const city = CITIES.find(c =>
    `${c.name}, ${c.country}`.toLowerCase() === inputVal ||
    c.name.toLowerCase() === inputVal
  );
  if (!city) { showToast('Type a destination from the list then estimate.'); return; }
  const style = document.getElementById('est-style').value;
  const days  = parseInt(document.getElementById('est-days').value, 10);
  if (!days || days < 1 || days > 365) { showToast('Enter a number of days between 1 and 365.'); return; }
  const k = style[0]; // 'b', 'm', or 'l'
  const BUDGET_TIERS = {
    b: { flights: 350,  hotel: 20,  food: 15,  acts: 8,  transit: 5  },
    m: { flights: 600,  hotel: 80,  food: 45,  acts: 25, transit: 12 },
    l: { flights: 1200, hotel: 200, food: 120, acts: 70, transit: 30 },
  };
  const c = COL[city.id] || { b:55, m:130, l:360 };
  const t       = BUDGET_TIERS[k];
  const daily   = c[k];
  const flights = t.flights;
  const hotel   = t.hotel   * days;
  const food    = t.food    * days;
  const acts    = t.acts    * days;
  const transit = t.transit * days;
  const total   = flights + hotel + food + acts + transit;
  const el = document.getElementById('estimate-result');
  el.classList.remove('hidden');
  el.innerHTML = [
    ['Total Estimate', `$${total.toLocaleString()}`, true],
    ['✈ Flights',   `$${flights.toLocaleString()}`, false],
    ['🏨 Hotel',     `$${hotel.toLocaleString()}`,   false],
    ['🍽 Food',      `$${food.toLocaleString()}`,    false],
    ['🎯 Activities',`$${acts.toLocaleString()}`,    false],
    ['🚇 Transit',   `$${transit.toLocaleString()}`, false],
    ['📅 Per Day',   `$${daily.toLocaleString()}`,   false],
  ].map(([l, v, big]) =>
    `<div class="estimate-item${big?' estimate-total':''}"><div class="est-label">${l}</div><div class="est-value">${v}</div></div>`
  ).join('');
}

/* ===================== DATE DEFAULTS ===================== */
function setDefaultDates() {
  const fmt   = d => d.toISOString().split('T')[0];
  const today = new Date();
  const n30   = new Date(today); n30.setDate(today.getDate() + 30);
  const n37   = new Date(today); n37.setDate(today.getDate() + 37);
  document.getElementById('flight-depart').value = fmt(n30);
  document.getElementById('flight-return').value = fmt(n37);
  document.getElementById('car-pickup').value    = fmt(n30);
  document.getElementById('car-dropoff').value   = fmt(n37);
}

/* ===================== MISC ===================== */
function populateIdeaCitySelect() {
  const s = document.getElementById('idea-city');
  CITIES.forEach(c => {
    const o = document.createElement('option');
    o.value = c.id;
    o.textContent = c.name;
    s.appendChild(o);
  });
}

function scrollToSection(id, btn) {
  const el = document.getElementById(id === 'home' ? 'cities' : id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
  if (btn) {
    document.querySelectorAll('.bnav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
}

function showToast(msg) {
  const t = document.getElementById('share-toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

/* ===================== PLANNER MODE ===================== */
let currentTrip = null;
let _dragCardId = null;
let _dragFromDayId = null;
let _dragCityId = null;
let _dragCityName = null;
let _pendingSpot = null;

/* ── Drag from city grid ── */
function startCityDrag(e, cityId, cityName) {
  _dragCityId   = cityId;
  _dragCityName = cityName;
  e.dataTransfer.setData('text/plain', 'city');
  e.dataTransfer.effectAllowed = 'copy';
}

/* ── Add spot to a planner day (from modal "+ Plan" button) ── */
function addToDay(cityId, cityName, spotName) {
  // Make sure solo planner is active
  const soloBtn = document.querySelector('.mode-btn[onclick*="solo"]');
  if (soloBtn) switchPlannerMode('solo', soloBtn);
  if (!currentTrip) {
    closeModal();
    document.getElementById('group').scrollIntoView({ behavior: 'smooth' });
    return;
  }
  if (!currentTrip.days || !currentTrip.days.length) {
    showToast('Add a day to your planner first, then tap "+ Plan" again.');
    return;
  }
  _pendingSpot = { cityId, cityName, spotName };
  renderDayPickerPopup();
}

function renderDayPickerPopup() {
  const popup = document.getElementById('day-picker-popup');
  if (!popup || !_pendingSpot || !currentTrip) return;
  popup.innerHTML = `
    <div class="day-picker-inner">
      <div class="day-picker-title">Add <strong>${escHtml(_pendingSpot.spotName)}</strong> to:</div>
      <div class="day-picker-days">
        ${currentTrip.days.map(d => `
          <button class="day-picker-btn" onclick="confirmAddToDay('${d.id}')">
            Day ${d.num}
          </button>`).join('')}
      </div>
      <button class="day-picker-cancel" onclick="closeDayPicker()">Cancel</button>
    </div>`;
  popup.classList.remove('hidden');
}

function confirmAddToDay(dayId) {
  if (!_pendingSpot) return;
  const { cityId, cityName, spotName } = _pendingSpot;
  _pendingSpot = null;
  closeDayPicker();
  addSpotCard(dayId, cityId, cityName, spotName);
}

function closeDayPicker() {
  const popup = document.getElementById('day-picker-popup');
  if (popup) popup.classList.add('hidden');
  _pendingSpot = null;
}

function addSpotCard(dayId, cityId, cityName, spotName) {
  const data = getPlans();
  const trip = data.trips.find(t => t.id === currentTrip.id);
  if (!trip) return;
  const day = trip.days.find(d => d.id === dayId);
  if (!day) return;
  day.cards.push({ id: crypto.randomUUID(), city_id: cityId, city_name: cityName, note: spotName });
  currentTrip = trip;
  savePlans(data);
  renderKanban();
  // Scroll planner into view
  document.getElementById('group').scrollIntoView({ behavior: 'smooth' });
}

function switchPlannerMode(mode, btn) {
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('solo-planner').classList.toggle('hidden', mode !== 'solo');
  document.getElementById('group-planner').classList.toggle('hidden', mode !== 'group');
  if (mode === 'solo') loadPlanner();
}

function getPlans() {
  try { return JSON.parse(localStorage.getItem('dropped_v2') || '{"trips":[],"active":null}'); }
  catch { return { trips: [], active: null }; }
}
function savePlans(data) { localStorage.setItem('dropped_v2', JSON.stringify(data)); }

function loadPlanner() {
  const data = getPlans();
  if (data.active) {
    const trip = data.trips.find(t => t.id === data.active);
    if (trip) { currentTrip = trip; showPlannerUI(); return; }
  }
  showPlannerEmpty();
}

function showPlannerEmpty() {
  document.getElementById('planner-empty').classList.remove('hidden');
  document.getElementById('planner-ui').classList.add('hidden');
}

function showPlannerUI() {
  document.getElementById('planner-empty').classList.add('hidden');
  document.getElementById('planner-ui').classList.remove('hidden');
  document.getElementById('active-trip-name').textContent = currentTrip.name;
  const startEl = document.getElementById('planner-start-date');
  if (startEl) startEl.value = currentTrip.start_date || '';
  renderKanban();
}

function openNewTripModal() {
  document.getElementById('new-trip-modal').classList.remove('hidden');
  document.getElementById('new-trip-name').focus();
}
function closeNewTripModal() { document.getElementById('new-trip-modal').classList.add('hidden'); }

function createTrip() {
  const name = document.getElementById('new-trip-name').value.trim();
  if (!name) return;
  const data = getPlans();
  const trip = { id: crypto.randomUUID(), name, created_at: new Date().toISOString(), start_date: '', days: [] };
  data.trips.push(trip);
  data.active = trip.id;
  savePlans(data);
  currentTrip = trip;
  closeNewTripModal();
  document.getElementById('new-trip-name').value = '';
  showPlannerUI();
}

function openTripPicker() {
  const data = getPlans();
  const list = document.getElementById('trip-picker-list');
  if (!data.trips.length) {
    list.innerHTML = '<p style="color:rgba(240,250,249,.35);text-align:center;padding:20px">No trips yet.</p>';
  } else {
    list.innerHTML = data.trips.map(t => `
      <div class="board-picker-item ${currentTrip?.id === t.id ? 'active' : ''}" data-trip-id="${escHtml(t.id)}">
        <div>
          <div class="board-picker-item-name">${escHtml(t.name)}</div>
          <div class="board-picker-item-meta">${(t.days||[]).length} day${(t.days||[]).length !== 1 ? 's' : ''} · ${new Date(t.created_at).toLocaleDateString()}</div>
        </div>
        ${currentTrip?.id === t.id ? '<span style="color:#2dd4bf">●</span>' : ''}
      </div>`).join('');
    list.querySelectorAll('.board-picker-item').forEach(el => {
      el.addEventListener('click', () => {
        const trip = data.trips.find(t => t.id === el.dataset.tripId);
        if (!trip) return;
        const d = getPlans(); d.active = trip.id; savePlans(d);
        currentTrip = trip; closeTripPicker(); showPlannerUI();
      });
    });
  }
  document.getElementById('trip-picker-modal').classList.remove('hidden');
}
function closeTripPicker() { document.getElementById('trip-picker-modal').classList.add('hidden'); }

function updateTripStartDate(val) {
  if (!currentTrip) return;
  const data = getPlans();
  const trip = data.trips.find(t => t.id === currentTrip.id);
  if (!trip) return;
  trip.start_date = val;
  currentTrip = trip;
  savePlans(data);
  renderKanban();
}

/* ── Kanban ─────────────────────────────────────────────── */
function renderKanban() {
  if (!currentTrip) return;
  const board = document.getElementById('kanban-board');
  if (!currentTrip.days || !currentTrip.days.length) {
    board.innerHTML = `
      <div class="board-empty" style="width:100%;margin:0">
        <div>🗓</div>
        <p>Click <strong>+ Day</strong> to start building your itinerary</p>
      </div>`;
    return;
  }
  board.innerHTML = currentTrip.days.map(day => renderKanbanCol(day)).join('') +
    `<div class="kanban-add-col">
       <button class="kanban-add-col-btn" onclick="addDay()" title="Add day">+</button>
     </div>`;
  setupDragEvents();
}

function dayDateLabel(day) {
  if (!currentTrip.start_date || !day.num) return '';
  const d = new Date(currentTrip.start_date + 'T12:00:00');
  d.setDate(d.getDate() + day.num - 1);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function renderKanbanCol(day) {
  const dateStr = dayDateLabel(day);
  const cityOptions = CITIES.map(c => `<option value="${c.id}">${escHtml(c.name)}</option>`).join('');
  const cards = (day.cards || []).map(card => `
    <div class="kanban-card" draggable="true" data-card-id="${card.id}" data-day-id="${day.id}">
      <button class="kanban-card-del" onclick="removeCard('${day.id}','${card.id}')">✕</button>
      ${card.city_name ? `<div class="kanban-card-city">📍 ${escHtml(card.city_name)}</div>` : ''}
      ${card.note ? `<div class="kanban-card-note">${escHtml(card.note)}</div>` : ''}
    </div>`).join('') || `<div class="kanban-empty-col">Drop cards here</div>`;

  return `
    <div class="kanban-col" data-day-id="${day.id}">
      <div class="kanban-col-header">
        <div>
          <div class="day-label">Day ${day.num}</div>
          ${dateStr ? `<div class="day-date">${dateStr}</div>` : ''}
        </div>
        <button class="idea-delete" onclick="removeDay('${day.id}')">✕</button>
      </div>
      <div class="kanban-cards" data-day-id="${day.id}">${cards}</div>
      <div class="kanban-add">
        <select id="k-city-${day.id}">
          <option value="">City (optional)</option>
          ${cityOptions}
        </select>
        <input id="k-note-${day.id}" type="text" placeholder="Add an activity..." />
        <button class="kanban-add-btn" onclick="addCard('${day.id}')">+ Add</button>
      </div>
    </div>`;
}

function setupDragEvents() {
  document.querySelectorAll('.kanban-card').forEach(card => {
    card.addEventListener('dragstart', e => {
      _dragCardId  = card.dataset.cardId;
      _dragFromDayId = card.dataset.dayId;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
  });

  document.querySelectorAll('.kanban-cards').forEach(zone => {
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      const toDayId = zone.dataset.dayId;
      if (_dragCityId) {
        // Dropped a city card from the grid
        addSpotCard(toDayId, _dragCityId, _dragCityName, '');
        _dragCityId = null; _dragCityName = null;
      } else if (_dragCardId && toDayId !== _dragFromDayId) {
        moveCard(_dragCardId, _dragFromDayId, toDayId);
        _dragCardId = null; _dragFromDayId = null;
      }
    });
  });
}

function moveCard(cardId, fromDayId, toDayId) {
  if (!currentTrip) return;
  const data = getPlans();
  const trip = data.trips.find(t => t.id === currentTrip.id);
  if (!trip) return;
  const fromDay = trip.days.find(d => d.id === fromDayId);
  const toDay   = trip.days.find(d => d.id === toDayId);
  if (!fromDay || !toDay) return;
  const card = fromDay.cards.find(c => c.id === cardId);
  if (!card) return;
  fromDay.cards = fromDay.cards.filter(c => c.id !== cardId);
  toDay.cards.push(card);
  currentTrip = trip;
  savePlans(data);
  renderKanban();
}

function addDay() {
  if (!currentTrip) return;
  const data = getPlans();
  const trip = data.trips.find(t => t.id === currentTrip.id);
  if (!trip) return;
  if (!trip.days) trip.days = [];
  const num = trip.days.length + 1;
  trip.days.push({ id: crypto.randomUUID(), num, cards: [] });
  currentTrip = trip;
  savePlans(data);
  renderKanban();
  // scroll kanban board to the right
  setTimeout(() => {
    const board = document.getElementById('kanban-board');
    if (board) board.scrollLeft = board.scrollWidth;
  }, 50);
}

function removeDay(dayId) {
  if (!currentTrip) return;
  const data = getPlans();
  const trip = data.trips.find(t => t.id === currentTrip.id);
  if (!trip) return;
  trip.days = trip.days.filter(d => d.id !== dayId);
  trip.days.forEach((d, i) => d.num = i + 1);
  currentTrip = trip;
  savePlans(data);
  renderKanban();
}

function addCard(dayId) {
  if (!currentTrip) return;
  const citySelect = document.getElementById(`k-city-${dayId}`);
  const noteInput  = document.getElementById(`k-note-${dayId}`);
  const cityId = citySelect?.value || '';
  const note   = noteInput?.value.trim() || '';
  if (!cityId && !note) { showToast('Add a city or activity first'); return; }
  const city = CITIES.find(c => c.id === cityId);
  const card = { id: crypto.randomUUID(), city_id: cityId, city_name: city ? city.name : '', note };
  const data = getPlans();
  const trip = data.trips.find(t => t.id === currentTrip.id);
  const day  = trip?.days.find(d => d.id === dayId);
  if (!trip || !day) return;
  day.cards.push(card);
  currentTrip = trip;
  savePlans(data);
  if (noteInput) noteInput.value = '';
  renderKanban();
}

function removeCard(dayId, cardId) {
  if (!currentTrip) return;
  const data = getPlans();
  const trip = data.trips.find(t => t.id === currentTrip.id);
  const day  = trip?.days.find(d => d.id === dayId);
  if (!trip || !day) return;
  day.cards  = day.cards.filter(c => c.id !== cardId);
  currentTrip = trip;
  savePlans(data);
  renderKanban();
}

/** Escape user-supplied strings before inserting into innerHTML.
 *  Note: apostrophes are intentionally NOT replaced with &#39; here —
 *  the HTML parser decodes entities before JS evaluates inline onclick
 *  handlers, so &#39; → ' → SyntaxError in single-quoted strings.
 *  Apostrophes in onclick values are handled separately with \\' escaping. */
function escHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// For values placed inside single-quoted JS strings in inline onclick attributes.
// escHtml converts ' → &#39;, which the browser decodes back to ' before JS evaluates
// the handler — causing SyntaxErrors for names like "Katz's Delicatessen".
// This function escapes only what matters for a JS string literal.
function jsqApp(s) {
  return String(s ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function scrollCityCarousel(dir) {
  const grid = document.getElementById('city-grid');
  grid.scrollBy({ left: dir * 660, behavior: 'smooth' });
}

// Hero background slideshow — cycles through all city images
(function initHeroSlideshow() {
  const INTERVAL = 5000;
  let current = 0;
  let isA = true;

  function getImages() {
    return CITIES.map(c => c.image).filter(Boolean)
      .map(url => url.replace(/[?&]w=\d+/, '?w=1920').replace(/[?&]q=\d+/, '&q=95'));
  }

  function crossfade() {
    const images = getImages();
    if (!images.length) return;
    current = (current + 1) % images.length;
    const next = images[current];
    const bgA = document.getElementById('hero-bg-a');
    const bgB = document.getElementById('hero-bg-b');
    if (!bgA || !bgB) return;

    if (isA) {
      bgB.style.backgroundImage = `url('${next}')`;
      bgA.style.opacity = '0';
      bgB.style.opacity = '1';
    } else {
      bgA.style.backgroundImage = `url('${next}')`;
      bgB.style.opacity = '0';
      bgA.style.opacity = '1';
    }
    isA = !isA;
  }

  // seed first image from CITIES once data is ready
  function start() {
    const images = getImages();
    if (!images.length) { setTimeout(start, 300); return; }
    const bgA = document.getElementById('hero-bg-a');
    if (bgA) bgA.style.backgroundImage = `url('${images[0]}')`;
    setInterval(crossfade, INTERVAL);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
