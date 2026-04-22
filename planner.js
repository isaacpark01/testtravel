/* ============================================================
   Dropped — planner.js
   Five-tab travel planner: Saves | Itinerary | Discover | Rewards | Lang
   Map: Leaflet.js + OpenStreetMap
   Storage: localStorage key "dropped_v2"
   i18n: 11 languages, RTL support for Arabic
   ============================================================ */

'use strict';

// ── i18n ──────────────────────────────────────────────────────
const LANGS = [
  { code: 'en', name: 'English',    native: 'English',    flag: '🇺🇸', rtl: false },
  { code: 'es', name: 'Spanish',    native: 'Español',    flag: '🇪🇸', rtl: false },
  { code: 'fr', name: 'French',     native: 'Français',   flag: '🇫🇷', rtl: false },
  { code: 'ja', name: 'Japanese',   native: '日本語',      flag: '🇯🇵', rtl: false },
  { code: 'ko', name: 'Korean',     native: '한국어',      flag: '🇰🇷', rtl: false },
  { code: 'zh', name: 'Chinese',    native: '中文',        flag: '🇨🇳', rtl: false },
  { code: 'pt', name: 'Portuguese', native: 'Português',  flag: '🇧🇷', rtl: false },
  { code: 'ar', name: 'Arabic',     native: 'العربية',    flag: '🇸🇦', rtl: true  },
  { code: 'hi', name: 'Hindi',      native: 'हिन्दी',     flag: '🇮🇳', rtl: false },
  { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt', flag: '🇻🇳', rtl: false },
  { code: 'tl', name: 'Filipino',   native: 'Filipino',   flag: '🇵🇭', rtl: false },
];

const TRANSLATIONS = {
  en: {
    tabSaves:'♡ Saves', tabItinerary:'📅 Itinerary', tabDiscover:'🔍 Discover', tabRewards:'💳 Rewards', tabGroup:'👥 Group',
    filterAll:'All', filterActivities:'🎯 Activities', filterFood:'🍽 Food', filterFree:'✨ Free',
    sortRating:'⭐ Top Rated', sortPriceLow:'💸 Price: Low', sortPriceHigh:'💎 Price: High', sortAZ:'A → Z',
    vibeAll:'All Vibes', vibeHiddenGem:'💎 Hidden Gem', vibeBudget:'💸 Budget', vibeRomantic:'❤️ Romantic',
    vibeOutdoor:'🌿 Outdoor', vibeFoodie:'🍜 Foodie', vibeInstagrammable:'📸 Instagrammable',
    vibeLocalFave:'🌟 Local Fave', vibeSplurge:'✨ Splurge',
    searchPlaceholder:'Search places, food, activities…',
    addToPlanner:'+ Add to Planner', addToDay:'Add to Day', newTrip:'+ New Trip', explore:'← Explore',
    trendingTitle:'🔥 Trending on Social', noTrip:'Create a trip to discover places',
    noResults:'Nothing found — try a different vibe or search 🌊',
    addPlacePlaceholder:'+ Add a place — search by name...',
  },
  es: {
    tabSaves:'♡ Guardados', tabItinerary:'📅 Itinerario', tabDiscover:'🔍 Descubrir', tabRewards:'💳 Recompensas', tabGroup:'👥 Grupo',
    filterAll:'Todos', filterActivities:'🎯 Actividades', filterFood:'🍽 Comida', filterFree:'✨ Gratis',
    sortRating:'⭐ Mejor Valorado', sortPriceLow:'💸 Precio: Bajo', sortPriceHigh:'💎 Precio: Alto', sortAZ:'A → Z',
    vibeAll:'Todos los Vibes', vibeHiddenGem:'💎 Joya Oculta', vibeBudget:'💸 Económico', vibeRomantic:'❤️ Romántico',
    vibeOutdoor:'🌿 Al Aire Libre', vibeFoodie:'🍜 Gastronomía', vibeInstagrammable:'📸 Instagrameable',
    vibeLocalFave:'🌟 Favorito Local', vibeSplurge:'✨ Lujo',
    searchPlaceholder:'Buscar lugares, comida, actividades…',
    addToPlanner:'+ Agregar al Planner', addToDay:'Agregar al Día', newTrip:'+ Nuevo Viaje', explore:'← Explorar',
    trendingTitle:'🔥 Tendencias en Redes', noTrip:'Crea un viaje para descubrir lugares',
    noResults:'Sin resultados — prueba otra búsqueda',
    addPlacePlaceholder:'+ Agregar un lugar — buscar por nombre...',
  },
  fr: {
    tabSaves:'♡ Sauvegardes', tabItinerary:'📅 Itinéraire', tabDiscover:'🔍 Découvrir', tabRewards:'💳 Récompenses', tabGroup:'👥 Groupe',
    filterAll:'Tout', filterActivities:'🎯 Activités', filterFood:'🍽 Nourriture', filterFree:'✨ Gratuit',
    sortRating:'⭐ Mieux Notés', sortPriceLow:'💸 Prix : Bas', sortPriceHigh:'💎 Prix : Haut', sortAZ:'A → Z',
    vibeAll:'Tous les Vibes', vibeHiddenGem:'💎 Joyau Caché', vibeBudget:'💸 Budget', vibeRomantic:'❤️ Romantique',
    vibeOutdoor:'🌿 Plein Air', vibeFoodie:'🍜 Gastronomie', vibeInstagrammable:'📸 Instagrammable',
    vibeLocalFave:'🌟 Favori Local', vibeSplurge:'✨ Luxe',
    searchPlaceholder:'Rechercher des lieux, plats, activités…',
    addToPlanner:'+ Ajouter au Planificateur', addToDay:'Ajouter au Jour', newTrip:'+ Nouveau Voyage', explore:'← Explorer',
    trendingTitle:'🔥 Tendances Sociales', noTrip:'Créez un voyage pour découvrir des lieux',
    noResults:'Aucun résultat — essayez une autre recherche',
    addPlacePlaceholder:'+ Ajouter un lieu — rechercher par nom...',
  },
  ja: {
    tabSaves:'♡ 保存済み', tabItinerary:'📅 旅程', tabDiscover:'🔍 発見', tabRewards:'💳 特典', tabGroup:'👥 グループ',
    filterAll:'すべて', filterActivities:'🎯 アクティビティ', filterFood:'🍽 グルメ', filterFree:'✨ 無料',
    sortRating:'⭐ 評価順', sortPriceLow:'💸 価格：安い順', sortPriceHigh:'💎 価格：高い順', sortAZ:'A → Z',
    vibeAll:'すべてのバイブ', vibeHiddenGem:'💎 穴場スポット', vibeBudget:'💸 リーズナブル', vibeRomantic:'❤️ ロマンチック',
    vibeOutdoor:'🌿 アウトドア', vibeFoodie:'🍜 グルメ', vibeInstagrammable:'📸 インスタ映え',
    vibeLocalFave:'🌟 地元のお気に入り', vibeSplurge:'✨ 贅沢',
    searchPlaceholder:'スポット、グルメ、アクティビティを検索…',
    addToPlanner:'+ プランナーに追加', addToDay:'日程に追加', newTrip:'+ 新しい旅', explore:'← 探索',
    trendingTitle:'🔥 SNSでトレンド', noTrip:'旅行を作成してスポットを発見しよう',
    noResults:'結果なし — 別の検索をお試しください',
    addPlacePlaceholder:'+ 場所を追加 — 名前で検索...',
  },
  ko: {
    tabSaves:'♡ 저장됨', tabItinerary:'📅 일정', tabDiscover:'🔍 탐색', tabRewards:'💳 리워드', tabGroup:'👥 그룹',
    filterAll:'전체', filterActivities:'🎯 액티비티', filterFood:'🍽 음식', filterFree:'✨ 무료',
    sortRating:'⭐ 평점순', sortPriceLow:'💸 가격: 낮은순', sortPriceHigh:'💎 가격: 높은순', sortAZ:'A → Z',
    vibeAll:'모든 바이브', vibeHiddenGem:'💎 숨겨진 보석', vibeBudget:'💸 저렴한', vibeRomantic:'❤️ 로맨틱',
    vibeOutdoor:'🌿 야외', vibeFoodie:'🍜 미식가', vibeInstagrammable:'📸 인스타그래머블',
    vibeLocalFave:'🌟 지역 인기', vibeSplurge:'✨ 럭셔리',
    searchPlaceholder:'장소, 음식, 액티비티 검색…',
    addToPlanner:'+ 플래너에 추가', addToDay:'일정에 추가', newTrip:'+ 새 여행', explore:'← 탐색',
    trendingTitle:'🔥 소셜 트렌드', noTrip:'여행을 만들어 장소를 탐색하세요',
    noResults:'결과 없음 — 다른 검색을 시도해보세요',
    addPlacePlaceholder:'+ 장소 추가 — 이름으로 검색...',
  },
  zh: {
    tabSaves:'♡ 已保存', tabItinerary:'📅 行程', tabDiscover:'🔍 发现', tabRewards:'💳 奖励', tabGroup:'👥 群组',
    filterAll:'全部', filterActivities:'🎯 活动', filterFood:'🍽 美食', filterFree:'✨ 免费',
    sortRating:'⭐ 评分最高', sortPriceLow:'💸 价格：从低到高', sortPriceHigh:'💎 价格：从高到低', sortAZ:'A → Z',
    vibeAll:'全部氛围', vibeHiddenGem:'💎 隐秘宝藏', vibeBudget:'💸 实惠', vibeRomantic:'❤️ 浪漫',
    vibeOutdoor:'🌿 户外', vibeFoodie:'🍜 美食家', vibeInstagrammable:'📸 适合拍照',
    vibeLocalFave:'🌟 本地最爱', vibeSplurge:'✨ 奢华',
    searchPlaceholder:'搜索地点、美食、活动…',
    addToPlanner:'+ 添加到计划', addToDay:'添加到当天', newTrip:'+ 新旅行', explore:'← 探索',
    trendingTitle:'🔥 社交媒体热门', noTrip:'创建旅行以发现地点',
    noResults:'无结果 — 请尝试其他搜索',
    addPlacePlaceholder:'+ 添加地点 — 按名称搜索...',
  },
  pt: {
    tabSaves:'♡ Salvos', tabItinerary:'📅 Roteiro', tabDiscover:'🔍 Descobrir', tabRewards:'💳 Recompensas', tabGroup:'👥 Grupo',
    filterAll:'Todos', filterActivities:'🎯 Atividades', filterFood:'🍽 Comida', filterFree:'✨ Grátis',
    sortRating:'⭐ Melhor Avaliados', sortPriceLow:'💸 Preço: Baixo', sortPriceHigh:'💎 Preço: Alto', sortAZ:'A → Z',
    vibeAll:'Todos os Vibes', vibeHiddenGem:'💎 Joia Escondida', vibeBudget:'💸 Econômico', vibeRomantic:'❤️ Romântico',
    vibeOutdoor:'🌿 Ao Ar Livre', vibeFoodie:'🍜 Gastronomia', vibeInstagrammable:'📸 Instagramável',
    vibeLocalFave:'🌟 Favorito Local', vibeSplurge:'✨ Luxo',
    searchPlaceholder:'Buscar lugares, comidas, atividades…',
    addToPlanner:'+ Adicionar ao Roteiro', addToDay:'Adicionar ao Dia', newTrip:'+ Nova Viagem', explore:'← Explorar',
    trendingTitle:'🔥 Tendências nas Redes', noTrip:'Crie uma viagem para descobrir lugares',
    noResults:'Sem resultados — tente outra busca',
    addPlacePlaceholder:'+ Adicionar lugar — buscar pelo nome...',
  },
  ar: {
    tabSaves:'♡ المحفوظات', tabItinerary:'📅 الجدول', tabDiscover:'🔍 استكشف', tabRewards:'💳 المكافآت', tabGroup:'👥 المجموعة',
    filterAll:'الكل', filterActivities:'🎯 الأنشطة', filterFood:'🍽 الطعام', filterFree:'✨ مجاني',
    sortRating:'⭐ الأعلى تقييمًا', sortPriceLow:'💸 السعر: الأقل', sortPriceHigh:'💎 السعر: الأعلى', sortAZ:'أ → ي',
    vibeAll:'كل الأجواء', vibeHiddenGem:'💎 جوهرة مخفية', vibeBudget:'💸 اقتصادي', vibeRomantic:'❤️ رومانسي',
    vibeOutdoor:'🌿 في الهواء الطلق', vibeFoodie:'🍜 ذواق', vibeInstagrammable:'📸 مناسب للتصوير',
    vibeLocalFave:'🌟 المفضل المحلي', vibeSplurge:'✨ فاخر',
    searchPlaceholder:'ابحث عن أماكن، طعام، أنشطة…',
    addToPlanner:'+ أضف إلى المخطط', addToDay:'أضف إلى اليوم', newTrip:'+ رحلة جديدة', explore:'استكشف →',
    trendingTitle:'🔥 الرائج على السوشيال', noTrip:'أنشئ رحلة لاستكشاف الأماكن',
    noResults:'لا نتائج — جرب بحثًا مختلفًا',
    addPlacePlaceholder:'+ أضف مكانًا — ابحث بالاسم...',
  },
  hi: {
    tabSaves:'♡ सेव किए', tabItinerary:'📅 यात्रा योजना', tabDiscover:'🔍 खोजें', tabRewards:'💳 पुरस्कार', tabGroup:'👥 ग्रुप',
    filterAll:'सभी', filterActivities:'🎯 गतिविधियाँ', filterFood:'🍽 खाना', filterFree:'✨ मुफ्त',
    sortRating:'⭐ सर्वश्रेष्ठ', sortPriceLow:'💸 कीमत: कम', sortPriceHigh:'💎 कीमत: अधिक', sortAZ:'A → Z',
    vibeAll:'सभी वाइब्स', vibeHiddenGem:'💎 छुपा रत्न', vibeBudget:'💸 बजट', vibeRomantic:'❤️ रोमांटिक',
    vibeOutdoor:'🌿 बाहरी', vibeFoodie:'🍜 फूडी', vibeInstagrammable:'📸 इंस्टाग्राम योग्य',
    vibeLocalFave:'🌟 स्थानीय पसंद', vibeSplurge:'✨ विलासिता',
    searchPlaceholder:'जगह, खाना, गतिविधियाँ खोजें…',
    addToPlanner:'+ योजना में जोड़ें', addToDay:'दिन में जोड़ें', newTrip:'+ नई यात्रा', explore:'← खोजें',
    trendingTitle:'🔥 सोशल पर ट्रेंडिंग', noTrip:'स्थान खोजने के लिए यात्रा बनाएं',
    noResults:'कोई परिणाम नहीं — अलग खोज करें',
    addPlacePlaceholder:'+ जगह जोड़ें — नाम से खोजें...',
  },
  vi: {
    tabSaves:'♡ Đã lưu', tabItinerary:'📅 Lịch trình', tabDiscover:'🔍 Khám phá', tabRewards:'💳 Phần thưởng', tabGroup:'👥 Nhóm',
    filterAll:'Tất cả', filterActivities:'🎯 Hoạt động', filterFood:'🍽 Ẩm thực', filterFree:'✨ Miễn phí',
    sortRating:'⭐ Đánh giá cao', sortPriceLow:'💸 Giá: Thấp', sortPriceHigh:'💎 Giá: Cao', sortAZ:'A → Z',
    vibeAll:'Tất cả Vibes', vibeHiddenGem:'💎 Viên ngọc ẩn', vibeBudget:'💸 Tiết kiệm', vibeRomantic:'❤️ Lãng mạn',
    vibeOutdoor:'🌿 Ngoài trời', vibeFoodie:'🍜 Ẩm thực', vibeInstagrammable:'📸 Chụp ảnh đẹp',
    vibeLocalFave:'🌟 Yêu thích địa phương', vibeSplurge:'✨ Sang trọng',
    searchPlaceholder:'Tìm kiếm địa điểm, ẩm thực, hoạt động…',
    addToPlanner:'+ Thêm vào lịch', addToDay:'Thêm vào ngày', newTrip:'+ Chuyến mới', explore:'← Khám phá',
    trendingTitle:'🔥 Xu hướng mạng xã hội', noTrip:'Tạo chuyến đi để khám phá địa điểm',
    noResults:'Không có kết quả — thử tìm kiếm khác',
    addPlacePlaceholder:'+ Thêm địa điểm — tìm theo tên...',
  },
  tl: {
    tabSaves:'♡ Naka-save', tabItinerary:'📅 Itinerary', tabDiscover:'🔍 Tuklasin', tabRewards:'💳 Rewards', tabGroup:'👥 Grupo',
    filterAll:'Lahat', filterActivities:'🎯 Aktibidad', filterFood:'🍽 Pagkain', filterFree:'✨ Libre',
    sortRating:'⭐ Pinaka-rated', sortPriceLow:'💸 Presyo: Mababa', sortPriceHigh:'💎 Presyo: Mataas', sortAZ:'A → Z',
    vibeAll:'Lahat ng Vibes', vibeHiddenGem:'💎 Nakatagong Hiyas', vibeBudget:'💸 Budget', vibeRomantic:'❤️ Romantiko',
    vibeOutdoor:'🌿 Labas ng Bahay', vibeFoodie:'🍜 Foodie', vibeInstagrammable:'📸 Pang-Instagram',
    vibeLocalFave:'🌟 Paboritong Local', vibeSplurge:'✨ Marangya',
    searchPlaceholder:'Maghanap ng lugar, pagkain, aktibidad…',
    addToPlanner:'+ Idagdag sa Planner', addToDay:'Idagdag sa Araw', newTrip:'+ Bagong Biyahe', explore:'← I-explore',
    trendingTitle:'🔥 Trending sa Social', noTrip:'Gumawa ng biyahe para tuklasin ang mga lugar',
    noResults:'Walang resulta — subukan ang ibang paghahanap',
    addPlacePlaceholder:'+ Magdagdag ng lugar — maghanap sa pangalan...',
  },
};

// ── City coordinates (hardcoded) ──────────────────────────────
const CITY_COORDS = {
  nyc:          [40.7128,  -74.0060],
  paris:        [48.8566,    2.3522],
  tokyo:        [35.6762,  139.6503],
  bali:         [-8.4095,  115.1889],
  miami:        [25.7617,  -80.1918],
  chicago:      [41.8781,  -87.6298],
  lasvegas:     [36.1699, -115.1398],
  la:           [34.0522, -118.2437],
  hawaii:       [20.7967, -156.3319],
  seattle:      [47.6062, -122.3321],
  austin:       [30.2672,  -97.7431],
  orlando:      [28.5383,  -81.3792],
  nashville:    [36.1627,  -86.7816],
  neworleans:   [29.9511,  -90.0715],
  barcelona:    [41.3851,    2.1734],
  sanfrancisco: [37.7749, -122.4194],
  london:       [51.5074,   -0.1278],
  rome:         [41.9028,   12.4964],
  amsterdam:    [52.3676,    4.9041],
  sydney:       [-33.8688, 151.2093],
  dubai:        [25.2048,   55.2708],
  bangkok:      [13.7563,  100.5018],
  singapore:    [1.3521,   103.8198],
  lisbon:       [38.7223,   -9.1393],
  seoul:        [37.5665,  126.9780],
  mexicocity:   [19.4326,  -99.1332],
  losangeles:   [34.0522, -118.2437],
  sandiego:     [32.7157, -117.1611],
  washingtondc: [38.9072,  -77.0369],
  boston:       [42.3601,  -71.0589],
  denver:       [39.7392, -104.9903],
  portland:     [45.5051, -122.6750],
  atlanta:      [33.7490,  -84.3880],
  philadelphia: [39.9526,  -75.1652],
  phoenix:      [33.4484, -112.0740],
};

// ── Jitter helper for place coords ───────────────────────────
// djb2-style hash — position-aware so "abc" and "cba" produce different offsets
function jitter(cityCoord, seed) {
  const h = [...seed].reduce((a, c, i) => ((a * 31 + c.charCodeAt(0) + i) & 0x7fffffff), 0);
  return [
    cityCoord[0] + ((h % 40) - 20) * 0.0012,
    cityCoord[1] + ((h % 37) - 18) * 0.0015,
  ];
}

// ── Photo lookup ──────────────────────────────────────────────
const PHOTO_MAP = {
  // ── NYC ──
  'central park':         'photo-1568515387631-8b650bbcdb90',
  'metropolitan museum':  'photo-1575505586569-646b2ca898fc',
  'statue of liberty':    'photo-1575651279937-1fc7f35f9be4',
  'top of the rock':      'photo-1534430480872-3498386e7856',
  'brooklyn bridge':      'photo-1546102745-75b4bdb08c2f',
  'high line':            'photo-1558369178-6556d97855d0',
  'one world':            'photo-1534430480872-3498386e7856',
  'moma':                 'photo-1555448248-2571daf6344b',
  'katz':                 'photo-1553909489-cd47e0907980',
  'chelsea market':       'photo-1533777857889-4be7c70b33f7',
  'shake shack':          'photo-1568901346375-23c9450c58cd',
  'xi\'an famous':        'photo-1569718212165-3a8278d5f624',
  'dominique ansel':      'photo-1509440159596-0249088772ff',
  'peter luger':          'photo-1534080564583-6be75777b70a',
  'smorgasburg':          'photo-1567620905732-2d1ec7ab7445',
  // ── Paris ──
  'eiffel tower':         'photo-1499856871958-5b9627545d1a',
  'louvre':               'photo-1565799557186-fbf4e10c9f34',
  'musée d\'orsay':       'photo-1499856871958-5b9627545d1a',
  'orsay':                'photo-1499856871958-5b9627545d1a',
  'notre-dame':           'photo-1467269204594-9661b134dd2b',
  'versailles':           'photo-1566073771259-6a8506099945',
  'montmartre':           'photo-1431274172761-fca41d930114',
  'sacré-coeur':          'photo-1431274172761-fca41d930114',
  'seine river':          'photo-1499856871958-5b9627545d1a',
  'centre pompidou':      'photo-1499856871958-5b9627545d1a',
  'café de flore':        'photo-1509042239860-f550ce710b93',
  'fallafel':             'photo-1551504734-5ee1c4a1479b',
  'breizh':               'photo-1509042239860-f550ce710b93',
  'marché des enfants':   'photo-1534190760961-74e8c1c5c3da',
  'berthillon':           'photo-1563805042-7684c019e1cb',
  'du pain':              'photo-1509440159596-0249088772ff',
  'frenchie':             'photo-1510812431401-41d2bd2722f3',
  // ── Tokyo ──
  'senso-ji':             'photo-1540959733332-eab4deabeeaf',
  'senso':                'photo-1540959733332-eab4deabeeaf',
  'teamlab':              'photo-1549497538-303791108f95',
  'shibuya':              'photo-1542051841857-5f90071e7989',
  'shinjuku gyoen':       'photo-1528164344705-47542687000d',
  'tsukiji':              'photo-1534190760961-74e8c1c5c3da',
  'akihabara':            'photo-1480796927426-f609979314bd',
  'meiji shrine':         'photo-1590253230532-a67f6bc61c9e',
  'mount fuji':           'photo-1490806843957-31f4c9a91c65',
  'ichiran':              'photo-1569718212165-3a8278d5f624',
  'uobei':                'photo-1617196034183-421b4040ed20',
  'gonpachi':             'photo-1569718212165-3a8278d5f624',
  'narisawa':             'photo-1534080564583-6be75777b70a',
  'kappabashi':           'photo-1534190760961-74e8c1c5c3da',
  'depachika':            'photo-1534190760961-74e8c1c5c3da',
  // ── Bali ──
  'tegallalang':          'photo-1537996194471-e657df975ab4',
  'rice terrace':         'photo-1537996194471-e657df975ab4',
  'tanah lot':            'photo-1518548419970-58e3b4079ab2',
  'ubud monkey':          'photo-1537996194471-e657df975ab4',
  'monkey forest':        'photo-1537996194471-e657df975ab4',
  'mount batur':          'photo-1537996194471-e657df975ab4',
  'tirta empul':          'photo-1528360983277-13d401cdc186',
  'nusa penida':          'photo-1537996194471-e657df975ab4',
  'babi guling':          'photo-1567620905732-2d1ec7ab7445',
  'locavore':             'photo-1534080564583-6be75777b70a',
  'sardine restaurant':   'photo-1534080564583-6be75777b70a',
  'pasar badung':         'photo-1534190760961-74e8c1c5c3da',
  'rafting':              'photo-1464822759023-fed622ff2c3b',
  'cooking class':        'photo-1567620905732-2d1ec7ab7445',
  // ── Barcelona ──
  'sagrada':              'photo-1539037116277-4db20889f2d4',
  'park güell':           'photo-1539037116277-4db20889f2d4',
  'camp nou':             'photo-1566577739112-5180d4bf9390',
  'gothic quarter':       'photo-1583422409516-2895a77efded',
  'montjuïc':             'photo-1583422409516-2895a77efded',
  'picasso museum':       'photo-1513364776144-60967b0f800f',
  'casa batlló':          'photo-1539037116277-4db20889f2d4',
  'barceloneta':          'photo-1507525428034-b723cf961d3e',
  'la boqueria':          'photo-1534190760961-74e8c1c5c3da',
  'bar cañete':           'photo-1543007630-9710e4a00a20',
  'el xampanyet':         'photo-1510812431401-41d2bd2722f3',
  'tickets':              'photo-1534080564583-6be75777b70a',
  'cervecería catalana':  'photo-1543007630-9710e4a00a20',
  // ── Miami ──
  'south beach':          'photo-1533106497176-45ae19e68ba2',
  'wynwood':              'photo-1569017388730-020b5f80a004',
  'vizcaya':              'photo-1566073771259-6a8506099945',
  'everglades':           'photo-1416879595882-3373a0480b5b',
  'little havana':        'photo-1514214246283-d427a95c5d2f',
  'pérez art':            'photo-1518998053901-5348d3961a04',
  'key west':             'photo-1507525428034-b723cf961d3e',
  'joe\'s stone crab':    'photo-1534080564583-6be75777b70a',
  'kyu miami':            'photo-1567620905732-2d1ec7ab7445',
  'zak the baker':        'photo-1509440159596-0249088772ff',
  'time out market':      'photo-1533777857889-4be7c70b33f7',
  // ── Hawaii ──
  'diamond head':         'photo-1542259009477-d625272157b7',
  'haleakalā':            'photo-1542259009477-d625272157b7',
  'haleakala':            'photo-1542259009477-d625272157b7',
  'molokini':             'photo-1507525428034-b723cf961d3e',
  'waikiki':              'photo-1507876466758-bc54f384809c',
  'waimea canyon':        'photo-1542259009477-d625272157b7',
  'napali':               'photo-1542259009477-d625272157b7',
  'na pali':              'photo-1542259009477-d625272157b7',
  'pearl harbor':         'photo-1457364559154-aa2644600ebb',
  'giovanni\'s shrimp':   'photo-1534080564583-6be75777b70a',
  'mama\'s fish house':   'photo-1534080564583-6be75777b70a',
  'leonard\'s bakery':    'photo-1509440159596-0249088772ff',
  'marukame udon':        'photo-1569718212165-3a8278d5f624',
  'rainbow drive-in':     'photo-1568901346375-23c9450c58cd',
  // ── Los Angeles ──
  'griffith':             'photo-1580655653885-65763b2597d0',
  'getty center':         'photo-1518998053901-5348d3961a04',
  'venice beach':         'photo-1507525428034-b723cf961d3e',
  'universal studios':    'photo-1416879595882-3373a0480b5b',
  'runyon canyon':        'photo-1464822759023-fed622ff2c3b',
  'santa monica':         'photo-1507525428034-b723cf961d3e',
  'lacma':                'photo-1513364776144-60967b0f800f',
  'malibu':               'photo-1507525428034-b723cf961d3e',
  'bestia':               'photo-1534080564583-6be75777b70a',
  'guerrilla tacos':      'photo-1551504734-5ee1c4a1479b',
  'in-n-out':             'photo-1568901346375-23c9450c58cd',
  'republique':           'photo-1509042239860-f550ce710b93',
  'mariscos jalisco':     'photo-1534080564583-6be75777b70a',
  'sushi gen':            'photo-1617196034183-421b4040ed20',
  'guelaguetza':          'photo-1551504734-5ee1c4a1479b',
  'grand central market': 'photo-1533777857889-4be7c70b33f7',
  // ── Chicago ──
  'art institute':        'photo-1547891654-e66ed7ebb968',
  'millennium park':      'photo-1477959858617-67f85cf4f1df',
  'the bean':             'photo-1477959858617-67f85cf4f1df',
  'navy pier':            'photo-1477959858617-67f85cf4f1df',
  'riverwalk':            'photo-1477959858617-67f85cf4f1df',
  'wrigley field':        'photo-1566577739112-5180d4bf9390',
  'skydeck':              'photo-1494522855154-9297ac14b55f',
  'willis tower':         'photo-1494522855154-9297ac14b55f',
  'the 606':              'photo-1464822759023-fed622ff2c3b',
  'lou malnati':          'photo-1565299624946-b28f40a0ae38',
  'gene & georgetti':     'photo-1534080564583-6be75777b70a',
  'au cheval':            'photo-1568901346375-23c9450c58cd',
  'rick bayless':         'photo-1551504734-5ee1c4a1479b',
  'purple pig':           'photo-1543007630-9710e4a00a20',
  'portillo':             'photo-1568901346375-23c9450c58cd',
  'girl & the goat':      'photo-1534080564583-6be75777b70a',
  // ── Las Vegas ──
  'the strip':            'photo-1605833556294-ea5c7a74f57d',
  'fremont':              'photo-1581351721010-8cf859cb14a4',
  'grand canyon':         'photo-1474044159687-1ee9f3a51722',
  'zion':                 'photo-1472396961693-142e6e269027',
  'high roller':          'photo-1605833556294-ea5c7a74f57d',
  'bellagio':             'photo-1605833556294-ea5c7a74f57d',
  'neon museum':          'photo-1581351721010-8cf859cb14a4',
  'hoover dam':           'photo-1534270804882-6b5048b1c1fc',
  'secret pizza':         'photo-1565299624946-b28f40a0ae38',
  'eggslut':              'photo-1568901346375-23c9450c58cd',
  'gordon ramsay':        'photo-1534080564583-6be75777b70a',
  'joël robuchon':        'photo-1534080564583-6be75777b70a',
  'lotus of siam':        'photo-1569718212165-3a8278d5f624',
  'wicked spoon':         'photo-1533777857889-4be7c70b33f7',
  // ── New Orleans ──
  'french quarter':       'photo-1568402102990-bc541580b59f',
  'jackson square':       'photo-1568402102990-bc541580b59f',
  'bourbon':              'photo-1568402102990-bc541580b59f',
  'steamboat natchez':    'photo-1568402102990-bc541580b59f',
  'garden district':      'photo-1416879595882-3373a0480b5b',
  'swamp tour':           'photo-1416879595882-3373a0480b5b',
  'cemetery tour':        'photo-1568402102990-bc541580b59f',
  'mardi gras':           'photo-1568402102990-bc541580b59f',
  'wwii museum':          'photo-1518998053901-5348d3961a04',
  'frenchmen':            'photo-1543007630-9710e4a00a20',
  'dooky chase':          'photo-1534080564583-6be75777b70a',
  'cafe du monde':        'photo-1509042239860-f550ce710b93',
  'domilise':             'photo-1567620905732-2d1ec7ab7445',
  'galatoire':            'photo-1534080564583-6be75777b70a',
  'willie mae':           'photo-1568901346375-23c9450c58cd',
  'parkway bakery':       'photo-1567620905732-2d1ec7ab7445',
  'commander\'s palace':  'photo-1534080564583-6be75777b70a',
  'bacchanal':            'photo-1510812431401-41d2bd2722f3',
  // ── Nashville ──
  'broadway honky':       'photo-1543007630-9710e4a00a20',
  'country music hall':   'photo-1543007630-9710e4a00a20',
  'grand ole opry':       'photo-1543007630-9710e4a00a20',
  'ryman':                'photo-1543007630-9710e4a00a20',
  'centennial':           'photo-1441974231531-c6227db76b6e',
  '12 south':             'photo-1514214246283-d427a95c5d2f',
  'cheekwood':            'photo-1416879595882-3373a0480b5b',
  'johnny cash':          'photo-1543007630-9710e4a00a20',
  'prince\'s hot chicken':'photo-1568901346375-23c9450c58cd',
  'arnold\'s country':    'photo-1534080564583-6be75777b70a',
  'catbird seat':         'photo-1534080564583-6be75777b70a',
  'pancake pantry':       'photo-1509440159596-0249088772ff',
  'husk':                 'photo-1534080564583-6be75777b70a',
  'biscuit love':         'photo-1509440159596-0249088772ff',
  // ── San Francisco ──
  'golden gate':          'photo-1501594907352-04cda38ebc29',
  'alcatraz':             'photo-1501594907352-04cda38ebc29',
  'muir woods':           'photo-1604537529428-15bcbeecfe4d',
  'ferry building':       'photo-1501594907352-04cda38ebc29',
  'lands end':            'photo-1501594907352-04cda38ebc29',
  'exploratorium':        'photo-1518998053901-5348d3961a04',
  'haight-ashbury':       'photo-1514214246283-d427a95c5d2f',
  'twin peaks':           'photo-1521464302861-ce943915d1c3',
  'swan oyster':          'photo-1534080564583-6be75777b70a',
  'tartine':              'photo-1509440159596-0249088772ff',
  'la taqueria':          'photo-1551504734-5ee1c4a1479b',
  'mission burrito':      'photo-1551504734-5ee1c4a1479b',
  'zuni':                 'photo-1534080564583-6be75777b70a',
  'ghirardelli':          'photo-1563805042-7684c019e1cb',
  'yank sing':            'photo-1567620905732-2d1ec7ab7445',
  'bi-rite':              'photo-1563805042-7684c019e1cb',
  // ── Orlando ──
  'magic kingdom':        'photo-1416879595882-3373a0480b5b',
  'wizarding world':      'photo-1416879595882-3373a0480b5b',
  'epcot':                'photo-1416879595882-3373a0480b5b',
  'kennedy space':        'photo-1457364559154-aa2644600ebb',
  'hollywood studios':    'photo-1416879595882-3373a0480b5b',
  'gatorland':            'photo-1416879595882-3373a0480b5b',
  'wekiwa springs':       'photo-1441974231531-c6227db76b6e',
  'discovery cove':       'photo-1507525428034-b723cf961d3e',
  // ── Austin ──
  '6th street':           'photo-1543007630-9710e4a00a20',
  'barton springs':       'photo-1507525428034-b723cf961d3e',
  'lbj presidential':     'photo-1518998053901-5348d3961a04',
  'texas state capitol':  'photo-1501466044931-62695aada8e9',
  'hamilton pool':         'photo-1532274402911-5a369e4c4bb5',
  'south congress':       'photo-1514214246283-d427a95c5d2f',
  'bat bridge':           'photo-1543007630-9710e4a00a20',
  'blanton museum':       'photo-1513364776144-60967b0f800f',
  'franklin barbecue':    'photo-1534080564583-6be75777b70a',
  'la barbecue':          'photo-1534080564583-6be75777b70a',
  'tacodeli':             'photo-1551504734-5ee1c4a1479b',
  'veracruz':             'photo-1551504734-5ee1c4a1479b',
  'uchi':                 'photo-1617196034183-421b4040ed20',
  'odd duck':             'photo-1534080564583-6be75777b70a',
  'juan in a million':    'photo-1551504734-5ee1c4a1479b',
  'amy\'s ice creams':    'photo-1563805042-7684c019e1cb',
  // ── Seattle ──
  'pike place':           'photo-1509099836639-18ba1795216d',
  'space needle':         'photo-1502175353174-a7a70e73b362',
  'mount rainier':        'photo-1434394354979-a235cd36269d',
  'chihuly':              'photo-1502175353174-a7a70e73b362',
  'discovery park':       'photo-1441974231531-c6227db76b6e',
  'kerry park':           'photo-1502175353174-a7a70e73b362',
  'mopop':                'photo-1518998053901-5348d3961a04',
  'pop culture':          'photo-1518998053901-5348d3961a04',
  'olympic peninsula':    'photo-1434394354979-a235cd36269d',
  'canlis':               'photo-1534080564583-6be75777b70a',
  'shiro\'s sushi':       'photo-1617196034183-421b4040ed20',
  'paseo':                'photo-1567620905732-2d1ec7ab7445',
  'salumi':               'photo-1567620905732-2d1ec7ab7445',
  'bakery nouveau':       'photo-1509440159596-0249088772ff',
  'walrus':               'photo-1534080564583-6be75777b70a',
  'pho bac':              'photo-1569718212165-3a8278d5f624',
  'dick\'s drive-in':     'photo-1568901346375-23c9450c58cd',
  // ── NEW: Local Gems & Missing Places ──
  'mamoun\'s falafel':    'photo-1593001874328-bc0afd93010e',
  'vanessa\'s dumpling':  'photo-1563245372-f21724e3856d',
  'los tacos':            'photo-1551504734-5ee1c4a1479b',
  'le bouillon chartier': 'photo-1550507992-eb63ffee0571',
  'robert et louise':     'photo-1544025162-d76694265947',
  'chez janou':           'photo-1550507992-eb63ffee0571',
  'breizh':               'photo-1519676867240-f03562e64571',
  'frenchie':             'photo-1510812431401-41d2bd2722f3',
  'fuunji':               'photo-1569718212165-3a8278d5f624',
  'omoide yokocho':       'photo-1554797589-7241bb691973',
  'tonkatsu maisen':      'photo-1554502078-ef0fc409efce',
  'warung mak beng':      'photo-1567620905732-2d1ec7ab7445',
  'nasi ayam':            'photo-1567620905732-2d1ec7ab7445',
  'can paixano':          'photo-1510812431401-41d2bd2722f3',
  'bar pinotxo':          'photo-1534190760961-74e8c1c5c3da',
  'la pepita':            'photo-1553909489-cd47e0907980',
  'gelaaati':             'photo-1563805042-7684c019e1cb',
  'enriqueta\'s':         'photo-1553909489-cd47e0907980',
  'el rey de las fritas': 'photo-1568901346375-23c9450c58cd',
  'islas canarias':       'photo-1509440159596-0249088772ff',
  'la mar':               'photo-1534080564583-6be75777b70a',
  'helena\'s hawaiian':   'photo-1567620905732-2d1ec7ab7445',
  'sam sato':             'photo-1569718212165-3a8278d5f624',
  'jitlada':              'photo-1569718212165-3a8278d5f624',
  'sonoratown':           'photo-1551504734-5ee1c4a1479b',
  'langer\'s':            'photo-1553909489-cd47e0907980',
  'birrieria zaragoza':   'photo-1551504734-5ee1c4a1479b',
  'johnnie\'s beef':      'photo-1553909489-cd47e0907980',
  'sultan\'s market':     'photo-1593001874328-bc0afd93010e',
  'raku':                 'photo-1554502078-ef0fc409efce',
  'district one':         'photo-1569718212165-3a8278d5f624',
  'li\'l dizzy':          'photo-1534080564583-6be75777b70a',
  'coop\'s place':        'photo-1534080564583-6be75777b70a',
  'boucherie':            'photo-1534080564583-6be75777b70a',
  'bolton\'s':            'photo-1568901346375-23c9450c58cd',
  'mas tacos':            'photo-1551504734-5ee1c4a1479b',
  'rotier\'s':            'photo-1568901346375-23c9450c58cd',
  'taqueria el farolito': 'photo-1551504734-5ee1c4a1479b',
  'good mong kok':        'photo-1563245372-f21724e3856d',
  'lers ros':             'photo-1569718212165-3a8278d5f624',
  'black rooster':        'photo-1551504734-5ee1c4a1479b',
  'king cajun':           'photo-1534080564583-6be75777b70a',
  'ravenous pig':         'photo-1534080564583-6be75777b70a',
  'hawkers':              'photo-1567620905732-2d1ec7ab7445',
  'maxine\'s':            'photo-1509042239860-f550ce710b93',
  'yellow dog eats':      'photo-1553909489-cd47e0907980',
  'christner\'s':         'photo-1534080564583-6be75777b70a',
  'valentina\'s':         'photo-1534080564583-6be75777b70a',
  'asia cafe':            'photo-1569718212165-3a8278d5f624',
  'cisco\'s':             'photo-1551504734-5ee1c4a1479b',
  'tacos chukis':         'photo-1551504734-5ee1c4a1479b',
  'dong thap':            'photo-1569718212165-3a8278d5f624',
  'beth\'s cafe':         'photo-1568901346375-23c9450c58cd',
  'mama\'s fish':         'photo-1534080564583-6be75777b70a',
  'ono seafood':          'photo-1617196034183-421b4040ed20',
  'leoda\'s':             'photo-1509440159596-0249088772ff',
  'jibaritos':            'photo-1553909489-cd47e0907980',
  'steamboat natchez':    'photo-1568402102990-bc541580b59f',
  'gene & georgetti':     'photo-1544025162-d76694265947',
  'five points pizza':    'photo-1565299624946-b28f40a0ae38',
  'pho bac sup':          'photo-1569718212165-3a8278d5f624',
  'napali coast':         'photo-1542259009477-d625272157b7',
  'mount batur':          'photo-1537996194471-e657df975ab4',
  'pasar badung':         'photo-1534190760961-74e8c1c5c3da',
  'gonpachi':             'photo-1554797589-7241bb691973',
};
const CATEGORY_PHOTOS = [
  ['ramen',       'photo-1569718212165-3a8278d5f624'],
  ['noodle',      'photo-1569718212165-3a8278d5f624'],
  ['sushi',       'photo-1617196034183-421b4040ed20'],
  ['pizza',       'photo-1565299624946-b28f40a0ae38'],
  ['burger',      'photo-1568901346375-23c9450c58cd'],
  ['taco',        'photo-1551504734-5ee1c4a1479b'],
  ['bakery',      'photo-1509440159596-0249088772ff'],
  ['cronut',      'photo-1509440159596-0249088772ff'],
  ['coffee',      'photo-1509042239860-f550ce710b93'],
  ['café',        'photo-1509042239860-f550ce710b93'],
  ['ice cream',   'photo-1563805042-7684c019e1cb'],
  ['creamery',    'photo-1563805042-7684c019e1cb'],
  ['bar',         'photo-1543007630-9710e4a00a20'],
  ['honky-tonk',  'photo-1543007630-9710e4a00a20'],
  ['wine',        'photo-1510812431401-41d2bd2722f3'],
  ['seafood',     'photo-1534080564583-6be75777b70a'],
  ['oyster',      'photo-1534080564583-6be75777b70a'],
  ['crab',        'photo-1534080564583-6be75777b70a'],
  ['steak',       'photo-1534080564583-6be75777b70a'],
  ['steakhouse',  'photo-1534080564583-6be75777b70a'],
  ['bbq',         'photo-1534080564583-6be75777b70a'],
  ['barbecue',    'photo-1534080564583-6be75777b70a'],
  ['food hall',   'photo-1533777857889-4be7c70b33f7'],
  ['food market', 'photo-1533777857889-4be7c70b33f7'],
  ['street food', 'photo-1567620905732-2d1ec7ab7445'],
  ['food truck',  'photo-1567620905732-2d1ec7ab7445'],
  ['shrimp',      'photo-1534080564583-6be75777b70a'],
  ['hot dog',     'photo-1568901346375-23c9450c58cd'],
  ['chicken',     'photo-1568901346375-23c9450c58cd'],
  ['dim sum',     'photo-1567620905732-2d1ec7ab7445'],
  ['deli',        'photo-1553909489-cd47e0907980'],
  ['po-boy',      'photo-1567620905732-2d1ec7ab7445'],
  ['warung',      'photo-1567620905732-2d1ec7ab7445'],
  ['restaurant',  'photo-1534080564583-6be75777b70a'],
  ['museum',      'photo-1518998053901-5348d3961a04'],
  ['art',         'photo-1513364776144-60967b0f800f'],
  ['gallery',     'photo-1513364776144-60967b0f800f'],
  ['park',        'photo-1441974231531-c6227db76b6e'],
  ['garden',      'photo-1416879595882-3373a0480b5b'],
  ['beach',       'photo-1507525428034-b723cf961d3e'],
  ['pool',        'photo-1507525428034-b723cf961d3e'],
  ['springs',     'photo-1507525428034-b723cf961d3e'],
  ['temple',      'photo-1528360983277-13d401cdc186'],
  ['shrine',      'photo-1528360983277-13d401cdc186'],
  ['church',      'photo-1467269204594-9661b134dd2b'],
  ['market',      'photo-1534190760961-74e8c1c5c3da'],
  ['bridge',      'photo-1501466044931-62695aada8e9'],
  ['tower',       'photo-1499856871958-5b9627545d1a'],
  ['waterfall',   'photo-1532274402911-5a369e4c4bb5'],
  ['hiking',      'photo-1464822759023-fed622ff2c3b'],
  ['hike',        'photo-1464822759023-fed622ff2c3b'],
  ['trail',       'photo-1464822759023-fed622ff2c3b'],
  ['canyon',      'photo-1474044159687-1ee9f3a51722'],
  ['mountain',    'photo-1434394354979-a235cd36269d'],
  ['aquarium',    'photo-1557200134-90327ee9fafa'],
  ['palace',      'photo-1566073771259-6a8506099945'],
  ['cathedral',   'photo-1467269204594-9661b134dd2b'],
  ['observatory', 'photo-1580655653885-65763b2597d0'],
  ['stadium',     'photo-1566577739112-5180d4bf9390'],
  ['pier',        'photo-1477959858617-67f85cf4f1df'],
  ['cruise',      'photo-1568402102990-bc541580b59f'],
  ['space',       'photo-1457364559154-aa2644600ebb'],
  ['zoo',         'photo-1416879595882-3373a0480b5b'],
  ['snorkel',     'photo-1507525428034-b723cf961d3e'],
  ['dive',        'photo-1507525428034-b723cf961d3e'],
  ['disco',       'photo-1543007630-9710e4a00a20'],
  ['music',       'photo-1543007630-9710e4a00a20'],
  ['live',        'photo-1543007630-9710e4a00a20'],
  ['neighborhood','photo-1514214246283-d427a95c5d2f'],
  ['walk',        'photo-1514214246283-d427a95c5d2f'],
  ['street',      'photo-1514214246283-d427a95c5d2f'],
];



function getPhoto(name, cityImage, size) {
  const w = size || 120;
  const k = (name || '').toLowerCase();

  // 1. Check item.photo from data.js (stored in _discCache)
  const cached = _discCache[name];
  if (cached?.item?.photo) {
    const p = cached.item.photo;
    // Local photos or Yelp CDN — return as-is
    if (p.startsWith('photos/') || p.includes('yelpcdn.com')) return p;
    // Unsplash — resize
    if (p.includes('unsplash.com')) return p.replace(/w=\d+/, `w=${w}`);
    return p;
  }

  // 2. PHOTO_MAP fallback
  const m = Object.keys(PHOTO_MAP).find(p => k.includes(p));
  if (m) return `https://images.unsplash.com/${PHOTO_MAP[m]}?w=${w}&q=75`;
  const c = CATEGORY_PHOTOS.find(([p]) => k.includes(p));
  if (c) return `https://images.unsplash.com/${c[1]}?w=${w}&q=75`;
  if (cityImage) return cityImage.replace(/w=\d+/, `w=${w}`);
  return `https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=${w}&q=70`;
}

// ── Multi-photo gallery for profile slideshow ────────────────
// Returns array of photo URLs for a place (Wikipedia real photos + Unsplash)
function getPlacePhotos(name, cityImage) {
  const photos = [];
  const k = (name || '').toLowerCase();

  // 1. Item photo from data.js (Yelp or curated Unsplash)
  const cached = _discCache[name];
  if (cached?.item?.photo) {
    photos.push(cached.item.photo);
  }

  // 2. Unsplash specific photo from PHOTO_MAP
  const unsplashKey = Object.keys(PHOTO_MAP).find(p => k.includes(p));
  if (unsplashKey) {
    const url = `https://images.unsplash.com/${PHOTO_MAP[unsplashKey]}?w=600&q=80`;
    if (!photos.includes(url)) photos.push(url);
  }

  // 3. Unsplash category photo
  const catMatch = CATEGORY_PHOTOS.find(([p]) => k.includes(p));
  if (catMatch) {
    const catUrl = `https://images.unsplash.com/${catMatch[1]}?w=600&q=80`;
    if (!photos.includes(catUrl)) photos.push(catUrl);
  }

  // 4. City image as fallback
  if (cityImage) {
    const cityUrl = cityImage.replace(/w=\d+/, 'w=600');
    if (!photos.includes(cityUrl)) photos.push(cityUrl);
  }

  // 5. Always have at least one photo
  if (!photos.length) {
    photos.push('https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=70');
  }

  return photos;
}

// ── Profile slideshow controller ─────────────────────────────
let _slidePhotos = [];
let _slideIdx = 0;

function renderProfileSlideshow(photos) {
  _slidePhotos = photos;
  _slideIdx = 0;

  const container = document.getElementById('profile-slideshow');
  const dotsEl = document.getElementById('profile-slide-dots');
  const counterEl = document.getElementById('profile-slide-counter');

  container.innerHTML = photos.map((url, i) =>
    `<div class="profile-slide ${i === 0 ? 'active' : ''}">
      <img src="${escHtml(url)}" alt="Photo ${i + 1}" loading="${i === 0 ? 'eager' : 'lazy'}"
        onerror="this.parentElement.style.display='none'" />
    </div>`
  ).join('');

  // Dots
  if (photos.length > 1) {
    dotsEl.innerHTML = photos.map((_, i) =>
      `<button class="slide-dot ${i === 0 ? 'active' : ''}" onclick="profileSlideTo(${i})"></button>`
    ).join('');
    dotsEl.style.display = 'flex';
    counterEl.textContent = `1 / ${photos.length}`;
    counterEl.style.display = 'block';
  } else {
    dotsEl.style.display = 'none';
    counterEl.style.display = 'none';
  }

  // Hide nav arrows if only 1 photo
  document.querySelectorAll('.slide-nav').forEach(btn => {
    btn.style.display = photos.length > 1 ? 'flex' : 'none';
  });
}

function profileSlide(dir) {
  if (_slidePhotos.length <= 1) return;
  _slideIdx = (_slideIdx + dir + _slidePhotos.length) % _slidePhotos.length;
  profileSlideTo(_slideIdx);
}

function profileSlideTo(idx) {
  _slideIdx = idx;
  document.querySelectorAll('.profile-slide').forEach((el, i) => {
    el.classList.toggle('active', i === idx);
  });
  document.querySelectorAll('.slide-dot').forEach((el, i) => {
    el.classList.toggle('active', i === idx);
  });
  const counterEl = document.getElementById('profile-slide-counter');
  if (counterEl) counterEl.textContent = `${idx + 1} / ${_slidePhotos.length}`;
}

// ── HTML helpers ──────────────────────────────────────────────
// For HTML content / double-quoted attributes
function escHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// For values placed inside single-quoted JS string literals in onclick attributes
// e.g. onclick="fn('${jsqApp(name)}')"  — names like "Joe's Pizza" or "L'As du Fallafel" would
// otherwise break out of the string and corrupt the handler.
// IMPORTANT: use \' (JS backslash-escape), NOT &#39; (HTML entity) — the HTML parser decodes
// entities before JS evaluates inline handlers, so &#39; → ' → SyntaxError.
function jsqApp(s) {
  return escHtml(s).replace(/'/g, "\\'");
}

// Turn a place name into a social-media hashtag slug
function slug(name) {
  return (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Render a star string: ★★★★½ 4.5
function renderStars(rating) {
  const r    = parseFloat(rating) || 0;
  const full = Math.floor(r);
  const half = (r - full) >= 0.3;
  const empty = 5 - full - (half ? 1 : 0);
  let html = '<span style="color:#fbbf24;letter-spacing:1px">';
  html += '&#9733;'.repeat(full);
  if (half) html += '<span style="opacity:.5">&#9733;</span>';
  html += '<span style="opacity:.2">' + '&#9733;'.repeat(empty) + '</span>';
  html += '</span>';
  return html;
}

// ── Vibe Tags ─────────────────────────────────────────────────
// The honest labels no travel site will give you (their ad model won't allow it)
const VIBE_DEFS = [
  { id: 'hidden-gem',     emoji: '💎', label: 'Hidden Gem',     color: '#34d399', bg: 'rgba(52,211,153,.13)'  },
  { id: 'tourist-trap',  emoji: '⚠️', label: 'Tourist Trap',   color: '#fb923c', bg: 'rgba(251,146,60,.13)'  },
  { id: 'budget',        emoji: '💸', label: 'Budget Find',    color: '#a78bfa', bg: 'rgba(167,139,250,.13)' },
  { id: 'splurge',       emoji: '✨', label: 'Splurge',        color: '#fbbf24', bg: 'rgba(251,191,36,.13)'  },
  { id: 'romantic',      emoji: '❤️', label: 'Romantic',       color: '#f472b6', bg: 'rgba(244,114,182,.13)' },
  { id: 'outdoor',       emoji: '🌿', label: 'Outdoor',        color: '#4ade80', bg: 'rgba(74,222,128,.13)'  },
  { id: 'foodie',        emoji: '🍜', label: 'Foodie Fave',    color: '#f97316', bg: 'rgba(249,115,22,.13)'  },
  { id: 'instagrammable',emoji: '📸', label: 'Instagrammable', color: '#c084fc', bg: 'rgba(192,132,252,.13)' },
  { id: 'local-fave',    emoji: '🌟', label: 'Local Fave',     color: '#2dd4bf', bg: 'rgba(45,212,191,.13)'  },
  { id: 'worth-hype',    emoji: '🔥', label: 'Worth the Hype', color: '#ef4444', bg: 'rgba(239,68,68,.13)'   },
];

function getVibes(place) {
  const n      = (place.name     || '').toLowerCase();
  const tip    = (place.tip      || '').toLowerCase();
  const combo  = n + ' ' + tip;
  const vibes  = new Set();
  const price  = (typeof place.price === 'number') ? place.price : null;
  const rating = parseFloat(place.rating) || 0;

  const TRAP_NAMES   = ['times square','madame tussauds','hard rock cafe','planet hollywood','rainforest cafe'];
  const FAMOUS_NAMES = ['eiffel tower','louvre museum','notre-dame','big ben','colosseum','statue of liberty','golden gate'];

  const isTrap   = TRAP_NAMES.some(t => n.includes(t));
  const isFamous = FAMOUS_NAMES.some(f => n.includes(f));

  if (isTrap)                                                                         vibes.add('tourist-trap');
  if (price !== null && price <= 15)                                                  vibes.add('budget');
  if (price !== null && price > 70)                                                   vibes.add('splurge');
  if (['rooftop','sunset','garden','wine','jazz','versailles','seine','river cruise','vineyard','romantic'].some(k => combo.includes(k)))
                                                                                      vibes.add('romantic');
  if (['park','beach','hiking','hike','garden','trail','mountain','fuji','waterfall','lake','forest','shrine','gyoen','castle'].some(k => n.includes(k)))
                                                                                      vibes.add('outdoor');
  if (place.category === 'food' && rating >= 4.6)                                    vibes.add('foodie');
  if (['crossing','light show','teamlab','observatory','skyline','tower','rooftop','panorama'].some(k => combo.includes(k)) && rating >= 4.3)
                                                                                      vibes.add('instagrammable');
  if (!isFamous && !isTrap && rating >= 4.6 && (price === null || price <= 20) && tip.length > 20)
                                                                                      vibes.add('hidden-gem');
  if (!isTrap && rating >= 4.5 && tip.length > 20)                                   vibes.add('local-fave');
  if (rating >= 4.8 && price !== null && price > 0)                                  vibes.add('worth-hype');

  return [...vibes].slice(0, 2);
}

function renderVibeTags(vibes) {
  if (!vibes || !vibes.length) return '';
  return '<div class="vibe-tags">' + vibes.map(id => {
    const d = VIBE_DEFS.find(v => v.id === id);
    if (!d) return '';
    return `<span class="vibe-tag" style="color:${d.color};background:${d.bg}">${d.emoji} ${d.label}</span>`;
  }).join('') + '</div>';
}

// ── Day Health Score ──────────────────────────────────────────
function getDayStats(day) {
  const cards = day?.cards || [];
  if (!cards.length) return null;

  let totalMins = 0;
  let totalCost = 0;

  cards.forEach(c => {
    const dur = (c.duration || '').toLowerCase();
    if (dur.includes('full day') || dur.includes('full-day')) {
      totalMins += 480;
    } else {
      const hrs  = dur.match(/(\d+\.?\d*)(?:\s*[-–]\s*\d+\.?\d*)?\s*hr/);
      const mins = dur.match(/(\d+)\s*min/);
      if (hrs)       totalMins += Math.ceil(parseFloat(hrs[1]) * 60);
      else if (mins) totalMins += parseInt(mins[1]);
      else           totalMins += 90; // default 1.5h
    }
    if (typeof c.price === 'number' && c.price > 0) totalCost += c.price;
  });

  const hours  = Math.round(totalMins / 60 * 10) / 10;
  const energy = cards.length <= 2 ? 'chill' : cards.length <= 4 ? 'moderate' : 'packed';
  return { count: cards.length, hours, totalCost, energy };
}

function renderDayHealthBar(stats) {
  const cfg = {
    chill:    { label: '😌 Chill day',  color: '#34d399' },
    moderate: { label: '⚡ Moderate',   color: '#fbbf24' },
    packed:   { label: '🔥 Packed day', color: '#f87171' },
  }[stats.energy];

  return `<div class="day-health-bar">
    <span class="dhb-energy" style="color:${cfg.color}">${cfg.label}</span>
    <span class="dhb-sep"></span>
    <span class="dhb-stat">⏱ ~${stats.hours}h</span>
    ${stats.totalCost > 0 ? `<span class="dhb-sep"></span><span class="dhb-stat">💰 ~$${stats.totalCost}</span>` : ''}
    <span class="dhb-sep"></span>
    <span class="dhb-stat">${stats.count} stop${stats.count !== 1 ? 's' : ''}</span>
  </div>`;
}

// ── Smart Day Insights ────────────────────────────────────────
// Surfaces real-time planning advice — no travel site does this
function getDayInsights(day) {
  const cards = day?.cards || [];
  if (cards.length < 2) return [];

  const insights = [];
  const foods      = cards.filter(c => c.category === 'food').length;
  const activities = cards.filter(c => c.category === 'activity').length;
  const traps      = cards.filter(c => getVibes(c).includes('tourist-trap')).length;
  const gems       = cards.filter(c => getVibes(c).includes('hidden-gem')).length;
  const freePlaces = cards.filter(c => c.price === 0).length;

  if (cards.length >= 7) {
    insights.push({ type: 'warn', text: `${cards.length} stops is ambitious — split across 2 days for a better experience` });
  } else if (cards.length >= 5 && foods === 0) {
    insights.push({ type: 'tip', text: 'Long activity day — add a food stop to refuel' });
  }

  if (foods >= 2 && activities === 0 && cards.length >= 2) {
    insights.push({ type: 'tip', text: 'All food, no activities — add an attraction or experience for variety' });
  } else if (activities >= 4 && foods === 0) {
    insights.push({ type: 'tip', text: 'No food planned — slot in a restaurant between activities' });
  }

  if (traps >= 2) {
    insights.push({ type: 'warn', text: `${traps} tourist traps on this day — check 💎 Hidden Gems in Discover for better alternatives` });
  }

  if (gems >= 2 && traps === 0 && activities >= 1 && foods >= 1) {
    insights.push({ type: 'good', text: 'Great balance — local gems, mixed variety, no tourist traps' });
  }

  if (freePlaces === cards.length && cards.length >= 2) {
    insights.push({ type: 'good', text: `Free day — ${cards.length} spots at zero cost` });
  }

  return insights.slice(0, 2);
}

function renderDayInsights(insights) {
  if (!insights.length) return '';
  const icons = { warn: '⚠️', tip: '💡', good: '✅' };
  const colors = { warn: 'rgba(251,146,60,.12)', tip: 'rgba(45,212,191,.08)', good: 'rgba(52,211,153,.1)' };
  const textColors = { warn: '#fb923c', tip: '#2dd4bf', good: '#34d399' };
  return insights.map(i => `
    <div class="day-insight" style="background:${colors[i.type]};border-color:${textColors[i.type]}22">
      <span class="insight-icon">${icons[i.type]}</span>
      <span class="insight-text" style="color:${textColors[i.type]}">${escHtml(i.text)}</span>
    </div>`).join('');
}

// ── Best Time of Day ──────────────────────────────────────────
// Derived from tip text — surfaces the right visiting time on each card
function getBestTime(place) {
  const text = ((place.name || '') + ' ' + (place.tip || '') + ' ' + (place.note || '')).toLowerCase();
  if (/\b(sunrise|early morning|6am|7am|8am|go early|before crowd|before 10|before 9)\b/.test(text))
    return { icon: '🌅', label: 'Best at sunrise', color: '#fbbf24' };
  if (/\b(sunset|evening|night|midnight|9pm|10pm|11pm|dusk|lit.up|light show)\b/.test(text))
    return { icon: '🌙', label: 'Best at night', color: '#818cf8' };
  if (/\b(afternoon|lunch|midday|noon)\b/.test(text))
    return { icon: '☀️', label: 'Best midday', color: '#f97316' };
  return null;
}

// ── Smart Packing List ────────────────────────────────────────
const PACK_BY_TYPE = {
  city_usa:              ['👟 Comfortable walking shoes', '🎒 Day backpack', '💳 Cards + small cash', '🔌 Portable charger'],
  beach:                 ['👙 Swimsuit', '🧴 Sunscreen SPF50+', '🕶️ Sunglasses', '👒 Wide-brim hat', '🩴 Sandals', '🏖️ Beach bag', '💊 Motion sickness tablets'],
  desert:                ['💧 Large reusable water bottle', '🧴 Sunscreen SPF50+', '👒 Wide-brim hat', '🥾 Closed-toe shoes', '🧣 Light scarf (sun/wind)'],
  theme_park:            ['👟 Comfortable shoes (break in first!)', '💧 Reusable water bottle', '🧢 Hat', '📦 Small backpack'],
  international_europe:  ['🛂 Passport', '🔌 EU power adapter (Type C/E/F)', '💳 No-fee travel card', '🗺️ Offline maps downloaded', '💶 Some local cash'],
  international_asia:    ['🛂 Passport', '🔌 Asia power adapter', '🚄 IC transit card (get at airport)', '📱 Translation app downloaded', '¥ Cash (many places still cash only)'],
  international_tropical:['🛂 Passport', '💉 Check vaccine requirements (4–6 weeks ahead)', '🧴 DEET bug spray', '💊 Consult doctor re: malaria prevention', '🧴 Sunscreen SPF50+'],
};
const PACK_ALWAYS = [
  '🔌 Phone charger + cable',
  '💊 Basic meds (ibuprofen, antacids, antihistamine)',
  '📸 Camera or check phone storage',
  '📋 Travel insurance info (screenshot it)',
  '🧳 Packing cubes',
  '🧴 Hand sanitiser',
  '🎧 Earbuds / headphones',
];
const PACK_BY_ACTIVITY = [
  { keywords: ['hike', 'hiking', 'trail', 'mountain', 'trekking'], items: ['🥾 Proper hiking boots', '🧴 Blister prevention', '🗺️ Offline trail maps', '🧤 Gloves (if altitude)'] },
  { keywords: ['museum', 'gallery', 'art', 'moma', 'louvre'],      items: ['🎧 Audio guide earbuds', '📓 Small notebook'] },
  { keywords: ['beach', 'snorkel', 'diving', 'swim'],              items: ['🤿 Snorkel gear (or rent)', '🏄 Waterproof phone case', '🧴 After-sun lotion'] },
  { keywords: ['temple', 'shrine', 'mosque', 'church'],            items: ['👘 Shoulder/knee cover (modesty cloth)'] },
  { keywords: ['ski', 'snow', 'winter'],                           items: ['🧤 Gloves', '🧣 Scarf', '🥾 Waterproof boots', '🕶️ UV goggles'] },
  { keywords: ['concert', 'festival', 'show', 'opera'],            items: ['👔 Smart-casual outfit', '🎟️ Print/download tickets offline'] },
];

let _packChecked = new Set(); // in-memory checkbox state

function openPackingList() {
  if (!currentTrip) { showToast('Create a trip first'); return; }
  _packChecked = new Set();
  renderPackingListContent();
  document.getElementById('pack-modal').classList.remove('hidden');
}

function closePackingList() {
  document.getElementById('pack-modal').classList.add('hidden');
}

function togglePackItem(key) {
  if (_packChecked.has(key)) _packChecked.delete(key);
  else _packChecked.add(key);
  renderPackingListContent();
}

function renderPackingListContent() {
  const city     = typeof CITIES !== 'undefined' ? CITIES.find(c => c.id === currentTrip?.cityId) : null;
  const packType = city?.packType || 'city_usa';
  const allCards = (currentTrip?.days || []).flatMap(d => d.cards || []);
  const cardText = allCards.map(c => c.name.toLowerCase() + ' ' + (c.note || '').toLowerCase()).join(' ');

  // Gather all items
  const sections = [];

  // Destination-specific
  const destItems = PACK_BY_TYPE[packType] || PACK_BY_TYPE.city_usa;
  sections.push({ title: `📍 For ${city?.name || 'Your Destination'}`, items: destItems });

  // Activity-specific
  const actItems = [];
  PACK_BY_ACTIVITY.forEach(rule => {
    if (rule.keywords.some(k => cardText.includes(k))) {
      actItems.push(...rule.items);
    }
  });
  if (actItems.length) sections.push({ title: '🎯 Based on Your Activities', items: [...new Set(actItems)] });

  // Always
  sections.push({ title: '✅ Always Bring', items: PACK_ALWAYS });

  const total   = sections.reduce((n, s) => n + s.items.length, 0);
  const checked = _packChecked.size;

  const listHTML = sections.map(sec => `
    <div class="pack-section">
      <div class="pack-section-title">${escHtml(sec.title)}</div>
      ${sec.items.map(item => {
        const key = item;
        const done = _packChecked.has(key);
        return `<label class="pack-item ${done ? 'checked' : ''}" onclick="togglePackItem(${JSON.stringify(key)})">
          <span class="pack-check">${done ? '✓' : ''}</span>
          <span class="pack-item-text">${escHtml(item)}</span>
        </label>`;
      }).join('')}
    </div>`).join('');

  document.getElementById('pack-content').innerHTML = `
    <div class="pack-progress">
      <div class="pack-prog-bar-track">
        <div class="pack-prog-bar-fill" style="width:${total ? Math.round(checked/total*100) : 0}%"></div>
      </div>
      <span class="pack-prog-label">${checked}/${total} packed</span>
    </div>
    ${listHTML}`;
}

// ── Share Trip Plan ───────────────────────────────────────────
// Generates a clean, shareable text summary of the entire trip plan
function exportItinerary() {
  if (!currentTrip) { showToast('Create a trip first'); return; }
  const city   = typeof CITIES !== 'undefined' ? CITIES.find(c => c.id === currentTrip.cityId) : null;
  const lines  = [];
  let totalSpend = 0;

  lines.push(`<h1 style="font-family:Georgia,serif;color:#0d9488">🌏 ${escHtml(currentTrip.name)}</h1>`);
  if (city) lines.push(`<p style="color:#555">📍 ${escHtml(city.name)}, ${escHtml(city.country)}</p>`);
  if (currentTrip.budget) lines.push(`<p style="color:#555">💰 Budget: $${currentTrip.budget}</p>`);
  lines.push('<hr>');

  (currentTrip.days || []).forEach(day => {
    const cards = day.cards || [];
    if (!cards.length) return;
    lines.push(`<h2 style="font-family:Georgia,serif;color:#0d9488;margin-top:20px">${escHtml(getDayLabel(day))}</h2>`);
    lines.push('<ul style="margin:0;padding-left:18px">');
    cards.forEach(c => {
      const icon    = c.category === 'food' ? '🍽' : '🎯';
      const price   = c.price === 0 ? 'Free' : c.price > 0 ? `$${c.price}` : '';
      const rating  = c.rating ? `⭐ ${c.rating}` : '';
      const meta    = [rating, price, c.duration].filter(Boolean).join(' · ');
      lines.push(`<li style="margin-bottom:6px"><strong>${icon} ${escHtml(c.name)}</strong>${meta ? ` <span style="color:#888;font-size:13px">(${meta})</span>` : ''}${c.note ? `<br><span style="color:#888;font-size:12px">📝 ${escHtml(c.note)}</span>` : ''}</li>`);
      if (typeof c.price === 'number' && c.price > 0) totalSpend += c.price;
    });
    lines.push('</ul>');
  });

  if ((currentTrip.saves || []).length) {
    lines.push('<hr><h2 style="font-family:Georgia,serif;color:#0d9488">♡ Wishlist</h2><ul style="margin:0;padding-left:18px">');
    currentTrip.saves.forEach(s => {
      const icon = s.category === 'food' ? '🍽' : '🎯';
      lines.push(`<li>${icon} ${escHtml(s.name)}${s.note ? ` — <span style="color:#888">${escHtml(s.note)}</span>` : ''}</li>`);
    });
    lines.push('</ul>');
  }

  lines.push(`<hr><p style="color:#888;font-size:12px">Planned spend: ~$${totalSpend} · Planned with Dropped</p>`);

  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${escHtml(currentTrip.name)}</title><style>body{font-family:Inter,sans-serif;max-width:720px;margin:40px auto;padding:0 24px;color:#111}@media print{body{margin:20px}}</style></head><body>${lines.join('\n')}<script>setTimeout(()=>window.print(),400)<\/script></body></html>`);
  w.document.close();
}

function shareTripPlan() {
  if (!currentTrip) { showToast('Create a trip first'); return; }

  const city  = typeof CITIES !== 'undefined' ? CITIES.find(c => c.id === currentTrip.cityId) : null;
  const lines = [];

  lines.push(`🌏 ${currentTrip.name}`);
  if (city) lines.push(`📍 ${city.name}, ${city.country}`);
  if (currentTrip.days?.length) lines.push(`📅 ${currentTrip.days.length} day${currentTrip.days.length !== 1 ? 's' : ''}`);
  lines.push('');

  let totalSpend = 0;

  (currentTrip.days || []).forEach(day => {
    const cards = day.cards || [];
    if (!cards.length) return;
    lines.push(`── ${getDayLabel(day)} ──`);
    cards.forEach((c, i) => {
      const catIcon = c.category === 'food' ? '🍽' : '🎯';
      const priceStr = c.price === 0 ? 'Free' : c.price > 0 ? `$${c.price}` : '';
      const ratingStr = c.rating ? `⭐ ${c.rating}` : '';
      const meta = [ratingStr, priceStr, c.duration].filter(Boolean).join(' · ');
      lines.push(`  ${i + 1}. ${catIcon} ${c.name}${meta ? `  (${meta})` : ''}`);
      if (c.note) lines.push(`     📝 ${c.note}`);
      if (typeof c.price === 'number' && c.price > 0) totalSpend += c.price;
    });
    const stats = getDayStats(day);
    if (stats) {
      const parts = [`~${stats.hours}h`];
      if (stats.totalCost > 0) parts.push(`~$${stats.totalCost}`);
      lines.push(`     ⏱ ${parts.join(' · ')}`);
    }
    lines.push('');
  });

  if (totalSpend > 0) lines.push(`💰 Planned spend: ~$${totalSpend}`);
  lines.push('✨ Planned with Dropped');

  const text = lines.join('\n');

  if (navigator.share) {
    navigator.share({ title: currentTrip.name, text }).catch(() => {
      // fallback if share cancelled
    });
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => showToast('Trip plan copied! Paste anywhere ✓'));
  } else {
    prompt('Copy your trip plan:', text);
  }
}

// ── Storage ───────────────────────────────────────────────────
const STORAGE_KEY = 'dropped_v2';

function getStore() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"trips":[],"active":null}');
  } catch {
    return { trips: [], active: null };
  }
}

function saveStore(d) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
}

// ── App State ─────────────────────────────────────────────────
let currentTrip  = null;
let currentDayId = null;
let activeTab    = 'itinerary';
let discoverFilter = 'all';

// Drag state
let _dragPlace   = null;
let _dragCardId  = null;

// Map state
let leafletMap     = null;
let mapMarkers     = [];
let mapInitialized = false;

// Discover search / suggest
let addPlaceSuggestItems = [];

// Cache of discover items for profile modal (key = item.name)
let _discCache = {};

// Quick Add social source state
let _qaSocial     = null; // 'instagram' | 'tiktok' | 'other'
let _bulkSocial   = null;

// Discover filters
let discoverVibe   = '';
let discoverSort   = 'rating';
let discoverSearch = '';
let _discSearchTimer = null;

// Active language (persisted to localStorage)
let activeLang = localStorage.getItem('dropped_lang') || 'en';

// ── i18n helpers ──────────────────────────────────────────────
function t(key) {
  const lang = TRANSLATIONS[activeLang] || TRANSLATIONS.en;
  return lang[key] ?? TRANSLATIONS.en[key] ?? key;
}

function applyTranslations() {
  // Update all [data-i18n] elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    // Only update textContent if no element children (to preserve badge spans etc.)
    if (!el.querySelector('*')) {
      el.textContent = t(key);
    } else {
      // Has child elements — update only direct text nodes
      for (const node of el.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
          node.textContent = t(key);
          break;
        }
      }
    }
  });
  // Update placeholder strings
  const discSearch = document.getElementById('disc-search');
  if (discSearch) discSearch.placeholder = t('searchPlaceholder');
  const addPlace = document.getElementById('add-place-input');
  if (addPlace) addPlace.placeholder = t('addPlacePlaceholder');
  // RTL
  const lang = LANGS.find(l => l.code === activeLang);
  document.documentElement.dir = lang?.rtl ? 'rtl' : 'ltr';
  document.documentElement.lang = activeLang;
  // Refresh lang menu active state
  document.querySelectorAll('.lang-option').forEach(el => {
    el.classList.toggle('active', el.dataset.lang === activeLang);
  });
}

function renderLangMenu() {
  const menu = document.getElementById('lang-picker-menu');
  if (!menu) return;
  menu.innerHTML = LANGS.map(l => `
    <button class="lang-option${l.code === activeLang ? ' active' : ''}"
      data-lang="${l.code}" onclick="setLang('${l.code}')">
      <span class="lang-flag">${l.flag}</span>
      <span class="lang-name">${l.native}</span>
    </button>`).join('');
}

function setLang(code) {
  activeLang = code;
  localStorage.setItem('dropped_lang', code);
  applyTranslations();
  renderDiscoverTab();
  document.getElementById('lang-picker-menu').classList.remove('open');
}

function toggleLangPicker() {
  document.getElementById('lang-picker-menu').classList.toggle('open');
}

// ── City lookup helper ────────────────────────────────────────
function getCurrentCity() {
  if (!currentTrip) return null;
  if (typeof CITIES === 'undefined') return null;
  return CITIES.find(c => c.id === currentTrip.cityId) || null;
}

// ── Init ──────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  // ?reset clears all stored data and reloads cleanly
  if (new URLSearchParams(location.search).get('reset') !== null) {
    localStorage.removeItem('dropped_v2');
    location.replace(location.pathname);
    return;
  }
  populateNewTripCities();
  populateQuickAddCities();
  loadActiveTrip();
  initMap();
  handleIncomingShare();

  document.getElementById('trip-name-input').addEventListener('blur', e => {
    const v = e.target.value.trim();
    if (!currentTrip || !v) return;
    const d = getStore();
    const t = d.trips.find(x => x.id === currentTrip.id);
    if (!t) return;
    t.name = v;
    currentTrip = t;
    saveStore(d);
    renderHero();
    renderTripsDropdown();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closePlaceProfile();
      closeQuickAdd();
      closePackingList();
      closeNewTripModal();
      closeAddPlaceSuggestions();
    }
  });

  // Close trips dropdown on outside click
  document.addEventListener('click', e => {
    if (!document.getElementById('trips-dropdown-wrap').contains(e.target)) {
      document.getElementById('trips-dropdown-menu').classList.remove('open');
    }
  });

  // Discover search bar
  const discSearchEl = document.getElementById('disc-search');
  if (discSearchEl) {
    discSearchEl.addEventListener('input', e => onDiscSearchInput(e.target.value));
  }

  // Language picker — init and close on outside click
  renderLangMenu();
  applyTranslations();
  document.addEventListener('click', e => {
    const wrap = document.getElementById('lang-picker-wrap');
    if (wrap && !wrap.contains(e.target)) {
      document.getElementById('lang-picker-menu')?.classList.remove('open');
    }
  });
});

// ── Trip management ───────────────────────────────────────────
function loadActiveTrip() {
  const d = getStore();
  if (d.active) {
    const t = d.trips.find(x => x.id === d.active);
    if (t) {
      currentTrip  = t;
      currentDayId = t.days?.[0]?.id || null;
    }
  }
  renderAll();
}

function renderAll() {
  renderTripsDropdown();
  renderHero();
  renderBudgetBar();
  renderBudgetRecs();
  renderDatePills();
  renderItinCards();
  renderSavesTab();
  renderDiscoverTab();
  renderSavesBadge();
  updateMapPins();
}

function renderTripsDropdown() {
  const d   = getStore();
  const el  = document.getElementById('trips-dropdown-menu');
  if (!d.trips.length) {
    el.innerHTML = `<div style="padding:12px 14px;font-size:12px;color:#475569">No trips yet.</div>`;
    return;
  }
  el.innerHTML = d.trips.map(t => `
    <div class="trip-dd-item ${t.id === currentTrip?.id ? 'active' : ''}" onclick="selectTrip('${jsqApp(t.id)}')">
      <span class="trip-dd-item-name">${escHtml(t.name)}</span>
      <span style="font-size:10px;color:#475569">${(t.days || []).length}d</span>
      <button class="trip-dd-item-del" onclick="event.stopPropagation();deleteTrip('${jsqApp(t.id)}')">×</button>
    </div>`).join('') +
    `<div class="trip-dd-sep"></div>
     <div class="trip-dd-item" onclick="openNewTripModal();document.getElementById('trips-dropdown-menu').classList.remove('open')">
       <span style="color:#2dd4bf;font-size:12px;font-weight:700">+ New Trip</span>
     </div>`;
}

function toggleTripsDropdown() {
  document.getElementById('trips-dropdown-menu').classList.toggle('open');
}

function selectTrip(id) {
  const d = getStore();
  const t = d.trips.find(x => x.id === id);
  if (!t) return;
  d.active     = id;
  currentTrip  = t;
  currentDayId = t.days?.[0]?.id || null;
  saveStore(d);
  document.getElementById('trips-dropdown-menu').classList.remove('open');
  renderAll();
}

function deleteTrip(id) {
  if (!confirm('Delete this trip?')) return;
  const d     = getStore();
  d.trips     = d.trips.filter(t => t.id !== id);
  if (d.active === id) d.active = d.trips[0]?.id || null;
  currentTrip  = d.active ? d.trips.find(t => t.id === d.active) || null : null;
  currentDayId = currentTrip?.days?.[0]?.id || null;
  saveStore(d);
  renderAll();
}

function populateNewTripCities() {
  const sel = document.getElementById('nt-city');
  if (!sel || typeof CITIES === 'undefined') return;
  CITIES.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = `${c.name}, ${c.country}`;
    sel.appendChild(opt);
  });
}

function openNewTripModal() {
  document.getElementById('new-trip-modal').classList.remove('hidden');
  document.getElementById('nt-error').textContent = '';
  const zoom = document.querySelector('.leaflet-control-zoom');
  if (zoom) zoom.style.visibility = 'hidden';
  setTimeout(() => document.getElementById('nt-name').focus(), 60);
}

function closeNewTripModal() {
  document.getElementById('new-trip-modal').classList.add('hidden');
  const zoom = document.querySelector('.leaflet-control-zoom');
  if (zoom) zoom.style.visibility = '';
  document.getElementById('nt-name').value   = '';
  document.getElementById('nt-city').value   = '';
  document.getElementById('nt-date').value   = '';
  document.getElementById('nt-days').value   = '3';
  const budgetEl = document.getElementById('nt-budget');
  if (budgetEl) budgetEl.value = '';
  document.getElementById('nt-error').textContent = '';
}

function createTrip() {
  const name   = document.getElementById('nt-name').value.trim() || 'My Trip';
  const cityId = document.getElementById('nt-city').value;
  const date   = document.getElementById('nt-date').value;
  const days   = Math.max(1, Math.min(14, parseInt(document.getElementById('nt-days').value) || 3));
  const budget = Math.max(0, parseInt(document.getElementById('nt-budget')?.value) || 0);
  const errEl  = document.getElementById('nt-error');

  if (!cityId) {
    errEl.textContent = 'Please choose a destination.';
    return;
  }

  const d    = getStore();
  const trip = {
    id:         crypto.randomUUID(),
    name,
    cityId,
    start_date: date,
    budget:     budget || null,
    days:       Array.from({ length: days }, (_, i) => ({
      id:    crypto.randomUUID(),
      num:   i + 1,
      cards: [],
    })),
    saves: [],
  };

  d.trips.push(trip);
  d.active     = trip.id;
  currentTrip  = trip;
  currentDayId = trip.days?.[0]?.id || null;
  saveStore(d);
  closeNewTripModal();
  renderAll();
  switchTab('itinerary');
}

// ── Hero ──────────────────────────────────────────────────────
function renderHero() {
  const heroEl     = document.getElementById('hero-band');
  const cityEl     = document.getElementById('hero-city');
  const tripNameEl = document.getElementById('hero-trip-name');
  const dateRangeEl = document.getElementById('nav-date-range');

  document.getElementById('trip-name-input').value = currentTrip?.name || '';

  if (!currentTrip) {
    heroEl.style.backgroundImage = '';
    cityEl.textContent     = 'Dropped';
    tripNameEl.textContent = 'Create or select a trip to begin planning';
    dateRangeEl.textContent = '';
    return;
  }

  const city = typeof CITIES !== 'undefined' ? CITIES.find(c => c.id === currentTrip.cityId) : null;
  if (city) {
    heroEl.style.backgroundImage = `url('${city.image}')`;
    cityEl.textContent = `${city.name}, ${city.country}`;
  } else {
    heroEl.style.backgroundImage = '';
    cityEl.textContent = currentTrip.name;
  }
  tripNameEl.textContent = currentTrip.name;

  // Date range
  if (currentTrip.start_date && currentTrip.days?.length) {
    const start = new Date(currentTrip.start_date + 'T00:00:00');
    const end   = new Date(start);
    end.setDate(end.getDate() + currentTrip.days.length - 1);
    const fmt = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    dateRangeEl.textContent = `${fmt(start)} – ${fmt(end)}, ${start.getFullYear()}`;
  } else if (currentTrip.days?.length) {
    dateRangeEl.textContent = `${currentTrip.days.length} day${currentTrip.days.length !== 1 ? 's' : ''}`;
  } else {
    dateRangeEl.textContent = '';
  }
}

// ── Budget bar ────────────────────────────────────────────────
function renderBudgetBar() {
  const el = document.getElementById('hero-budget-bar');
  if (!el) return;

  if (!currentTrip) { el.style.display = 'none'; return; }

  let totalSpend = 0;
  (currentTrip.days || []).forEach(day => {
    (day.cards || []).forEach(card => {
      if (typeof card.price === 'number' && card.price > 0) totalSpend += card.price;
    });
  });

  const budget = currentTrip.budget;

  if (!budget && !totalSpend) { el.style.display = 'none'; return; }

  el.style.display = 'block';

  if (budget) {
    const pct   = Math.min(100, Math.round((totalSpend / budget) * 100));
    const color = pct < 70 ? '#34d399' : pct < 90 ? '#fbbf24' : '#f87171';
    el.innerHTML = `
      <div class="budget-bar-info">
        <span class="budget-label">Trip Budget</span>
        <span class="budget-amount" style="color:${color}">$${totalSpend} <span class="budget-of">/ $${budget}</span></span>
      </div>
      <div class="budget-bar-track"><div class="budget-bar-fill" style="width:${pct}%;background:${color}"></div></div>`;
  } else {
    el.innerHTML = `
      <div class="budget-bar-info">
        <span class="budget-label">Planned Spend</span>
        <span class="budget-amount">~$${totalSpend}</span>
      </div>`;
  }
}

// ── Budget recommendations ────────────────────────────────────
function renderBudgetRecs() {
  const el = document.getElementById('budget-recs');
  if (!el) return;

  const budget = currentTrip?.budget;
  const city   = getCurrentCity();
  if (!budget || !city) { el.style.display = 'none'; return; }

  const days      = (currentTrip.days || []).length || 1;
  const perDay    = budget / days;

  const scoreItem = (item, type) => ({
    name:   item.name,
    price:  typeof item.price === 'number' ? item.price : 0,
    rating: item.rating || 0,
    type,
  });

  const affordable = [
    ...(city.food       || []).filter(Boolean).map(i => scoreItem(i, 'food')),
    ...(city.activities || []).filter(Boolean).map(i => scoreItem(i, 'activity')),
  ].filter(i => i.price <= perDay);

  if (!affordable.length) { el.style.display = 'none'; return; }

  affordable.sort((a, b) => b.rating - a.rating || a.price - b.price);
  const picks = affordable.slice(0, 8);

  const emoji = type => type === 'food' ? '🍽' : '🎯';
  const priceStr = p => p === 0 ? 'Free' : `$${p}`;

  el.style.display = 'block';
  el.innerHTML = `
    <div class="budget-recs-title">Places within your budget ($${Math.round(perDay)}/day)</div>
    <div class="budget-recs-scroll">
      ${picks.map(p => `
        <div class="budget-rec-chip">
          <div class="rec-emoji">${emoji(p.type)}</div>
          <div class="rec-name">${escHtml(p.name)}</div>
          <span class="rec-price">${priceStr(p.price)}</span><span class="rec-rating">⭐ ${p.rating}</span>
        </div>`).join('')}
    </div>`;
}

function handleHeroInvite() {
  showToast('Invite link copied! (feature coming soon)');
}

function handleHeroShare() {
  shareTripPlan();
}

// ── Tabs ──────────────────────────────────────────────────────
function switchTab(tab) {
  activeTab = tab;
  ['saves', 'itinerary', 'discover', 'rewards', 'group'].forEach(t => {
    document.getElementById(`tab-${t}`).classList.toggle('active', t === tab);
    document.getElementById(`panel-${t}`).classList.toggle('active', t === tab);
  });
  if (tab === 'itinerary') { renderDatePills(); renderItinCards(); }
  if (tab === 'saves')     renderSavesTab();
  if (tab === 'discover')  renderDiscoverTab();
  if (tab === 'rewards')   renderRewardsTab();
  updateMapPins();
}

// ── Saves badge ───────────────────────────────────────────────
function renderSavesBadge() {
  const count = (currentTrip?.saves || []).length;
  const badge = document.getElementById('saves-badge');
  if (count > 0) {
    badge.textContent = count;
    badge.style.display = 'inline';
  } else {
    badge.style.display = 'none';
  }
}

// ── Date pills (Itinerary tab) ────────────────────────────────
function renderDatePills() {
  const row  = document.getElementById('date-pills-row');
  const days = currentTrip?.days || [];

  if (!currentTrip) {
    row.innerHTML = '';
    return;
  }

  if (!days.length) {
    row.innerHTML = `<button class="add-day-pill" onclick="addDay()">+ Add Day</button>`;
    return;
  }

  if (!currentDayId || !days.find(d => d.id === currentDayId)) {
    currentDayId = days[0].id;
  }

  row.innerHTML = days.map(day => {
    const label  = getDayLabel(day);
    const act    = day.id === currentDayId;
    const stats  = getDayStats(day);
    const dot    = stats
      ? (stats.energy === 'chill' ? '<span class="pill-energy-dot chill"></span>'
       : stats.energy === 'moderate' ? '<span class="pill-energy-dot moderate"></span>'
       : '<span class="pill-energy-dot packed"></span>')
      : '';
    return `<div class="date-pill ${act ? 'active' : ''}" onclick="selectDay('${jsqApp(day.id)}')">
      ${dot}${escHtml(label)}
      <button class="date-pill-del" onclick="event.stopPropagation();removeDay('${jsqApp(day.id)}')">×</button>
    </div>`;
  }).join('') + `<button class="add-day-pill" onclick="addDay()">+ Day</button>`;
}

function getDayLabel(day) {
  if (currentTrip?.start_date) {
    const d = new Date(currentTrip.start_date + 'T00:00:00');
    d.setDate(d.getDate() + (day.num - 1));
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }
  return `Day ${day.num}`;
}

function selectDay(id) {
  currentDayId = id;
  renderDatePills();
  renderItinCards();
  updateMapPins();
}

function addDay() {
  if (!currentTrip) { openNewTripModal(); return; }
  const d    = getStore();
  const trip = d.trips.find(t => t.id === currentTrip.id);
  if (!trip) return;
  trip.days = trip.days || [];
  const newDay = { id: crypto.randomUUID(), num: trip.days.length + 1, cards: [] };
  trip.days.push(newDay);
  currentTrip  = trip;
  currentDayId = newDay.id;
  saveStore(d);
  renderDatePills();
  renderItinCards();
  requestAnimationFrame(() => {
    const r = document.getElementById('date-pills-row');
    if (r) r.scrollLeft = r.scrollWidth;
  });
}

function removeDay(dayId) {
  if (!currentTrip) return;
  const d    = getStore();
  const trip = d.trips.find(t => t.id === currentTrip.id);
  if (!trip) return;
  trip.days = trip.days.filter(day => day.id !== dayId);
  trip.days.forEach((day, i) => day.num = i + 1);
  if (currentDayId === dayId) currentDayId = trip.days[0]?.id || null;
  currentTrip = trip;
  saveStore(d);
  renderDatePills();
  renderItinCards();
  updateMapPins();
}

// ── Itinerary cards ───────────────────────────────────────────
function renderItinCards() {
  const area = document.getElementById('itin-cards-area');
  const ctr  = document.getElementById('saves-counter');

  if (!currentTrip) {
    area.innerHTML = `<div class="itin-empty">
      <div class="empty-icon">✈️</div>
      <p>Hit <strong>+ New Trip</strong> up top to start planning your next adventure 🌍</p>
    </div>`;
    ctr.textContent = '';
    return;
  }

  const days = currentTrip.days || [];
  if (!days.length) {
    area.innerHTML = `<div class="itin-empty">
      <div class="empty-icon">📅</div>
      <p>Tap <strong>+ Day</strong> to add your first day — then drop some places in ✨</p>
    </div>`;
    ctr.textContent = '';
    return;
  }

  if (!currentDayId || !days.find(d => d.id === currentDayId)) {
    currentDayId = days[0].id;
  }

  const day   = days.find(d => d.id === currentDayId);
  const cards = day?.cards || [];
  const saves = currentTrip.saves || [];
  const savesOnDay = cards.filter(c => c.fromSave).length;

  ctr.textContent = saves.length
    ? `${savesOnDay}/${saves.length} saves added to this day`
    : '';

  if (!cards.length) {
    area.innerHTML = `<div class="itin-empty">
      <div class="empty-icon">📍</div>
      <p>Drop your first spot here — search above or check out <strong style="color:var(--teal,#2dd4bf);cursor:pointer" onclick="switchTab('discover')">Discover →</strong></p>
    </div>`;
  
    return;
  }

  const stats        = getDayStats(day);
  const healthHTML   = stats ? renderDayHealthBar(stats) : '';
  const insights     = getDayInsights(day);
  const insightHTML  = renderDayInsights(insights);
  area.innerHTML     = healthHTML + insightHTML + cards.map((c, i) => renderPlacedCard(c, day.id, i + 1)).join('');

  setupCardDrag();
}

function renderPlacedCard(card, dayId, num) {
  const city      = typeof CITIES !== 'undefined' ? CITIES.find(c => c.id === card.cityId) : null;
  const photo     = card.photo || getPhoto(card.name, city?.image, 80);
  const catIcon   = card.category === 'food' ? '🍽' : card.category === 'transport' ? '🚗' : '🎯';
  const price     = card.price === 0 ? '<span style="color:#34d399;font-weight:700">FREE</span>'
                  : card.price > 0   ? `<span style="color:#fb923c;font-weight:700">$${card.price}</span>` : '';
  const bestTime  = getBestTime(card);
  const timeHTML  = bestTime
    ? `<span class="best-time-badge" style="color:${bestTime.color};border-color:${bestTime.color}33;background:${bestTime.color}11">${bestTime.icon} ${bestTime.label}</span>`
    : '';

  return `<div class="placed-card" draggable="true" data-card-id="${card.id}" data-day-id="${dayId}">
    <div class="placed-num">${num}</div>
    <img class="placed-photo" src="${escHtml(photo)}" alt="${escHtml(card.name)}" loading="lazy"
      onerror="this.src='https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=80&q=70'" />
    <div class="placed-body">
      ${card.cityName ? `<div class="placed-city-badge">${escHtml(card.cityName)}</div>` : ''}
      <div class="placed-name">${escHtml(card.name)}</div>
      <div class="placed-meta">
        <span class="placed-cat-tag">${catIcon} ${escHtml(card.category || 'Activity')}</span>
        ${card.rating ? `<span class="placed-rating">${renderStars(card.rating)} ${card.rating}</span>` : ''}
        ${price}
        ${card.duration ? `<span class="placed-duration">⏱ ${escHtml(card.duration)}</span>` : ''}
        ${timeHTML}
      </div>
      <input class="placed-note-input" placeholder="Add a note..."
        value="${escHtml(card.note || '')}"
        onchange="updateCardNote('${jsqApp(dayId)}','${jsqApp(card.id)}',this.value)"
        onclick="event.stopPropagation()" />
      <button class="placed-dir-btn" onclick="getDirectionsTo('${jsqApp(card.name)}')" title="Get directions">📍 Get there</button>
    </div>
    <button class="placed-del" title="Remove" onclick="removeCard('${jsqApp(dayId)}','${jsqApp(card.id)}')">···</button>
  </div>`;
}

// ── Card drag & drop (reorder) ────────────────────────────────
function setupCardDrag() {
  document.querySelectorAll('.placed-card').forEach(card => {
    card.addEventListener('dragstart', e => {
      _dragCardId = card.dataset.cardId;
      _dragPlace  = null;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.stopPropagation();
    });
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
    card.addEventListener('dragover', e => {
      e.preventDefault();
      if (!_dragCardId || _dragCardId === card.dataset.cardId) return;
      const after = e.clientY > card.getBoundingClientRect().top + card.getBoundingClientRect().height / 2;
      card.style.borderTopColor    = after ? '' : 'rgba(45,212,191,.6)';
      card.style.borderBottomColor = after ? 'rgba(45,212,191,.6)' : '';
    });
    card.addEventListener('dragleave', () => {
      card.style.borderTopColor    = '';
      card.style.borderBottomColor = '';
    });
    card.addEventListener('drop', e => {
      e.preventDefault();
      e.stopPropagation();
      card.style.borderTopColor    = '';
      card.style.borderBottomColor = '';
      if (!_dragCardId || _dragCardId === card.dataset.cardId) return;
      const after = e.clientY > card.getBoundingClientRect().top + card.getBoundingClientRect().height / 2;
      reorderCard(_dragCardId, card.dataset.cardId, card.dataset.dayId, after);
      _dragCardId = null;
    });
  });
}

function onDayDragOver(e) {
  if (!_dragPlace) return;
  e.preventDefault();
  document.getElementById('itin-cards-area').classList.add('drag-over');
}
function onDayDragLeave(e) {
  const area = document.getElementById('itin-cards-area');
  if (!area.contains(e.relatedTarget)) area.classList.remove('drag-over');
}
function onDayDrop(e) {
  e.preventDefault();
  document.getElementById('itin-cards-area').classList.remove('drag-over');
  if (_dragPlace && currentDayId) {
    addCardToDay(currentDayId, _dragPlace);
    _dragPlace = null;
  }
}

// ── Card ops ──────────────────────────────────────────────────
function addCardToDay(dayId, place) {
  if (!currentTrip) return;
  const d    = getStore();
  const trip = d.trips.find(t => t.id === currentTrip.id);
  if (!trip) return;
  const day  = trip.days.find(dy => dy.id === dayId);
  if (!day) return;

  // Soft-warn if this place already exists on another day
  if (!place.name) return;
  const nameLower = place.name.toLowerCase();
  const dupDay = (trip.days || []).find(d =>
    d.id !== dayId && d.cards.some(c => c.name.toLowerCase() === nameLower)
  );
  if (dupDay) {
    showToast(`ℹ️ "${place.name}" is already on ${getDayLabel(dupDay)}`);
  }

  day.cards.push({
    id:       crypto.randomUUID(),
    name:     place.name,
    cityId:   place.cityId || '',
    cityName: place.cityName || '',
    category: place.category || 'activity',
    rating:   place.rating || 0,
    price:    place.price ?? null,
    duration: place.duration || '',
    tip:      place.tip || '',
    note:     '',
    fromSave: !!place.fromSave,
  });

  currentTrip = trip;
  saveStore(d);
  renderItinCards();
  renderDatePills();
  renderSavesBadge();
  renderBudgetBar();
  renderBudgetRecs();
  updateMapPins();
}

function removeCard(dayId, cardId) {
  if (!currentTrip) return;
  const d    = getStore();
  const trip = d.trips.find(t => t.id === currentTrip.id);
  if (!trip) return;
  const day  = trip.days.find(dy => dy.id === dayId);
  if (!day) return;
  day.cards  = day.cards.filter(c => c.id !== cardId);
  currentTrip = trip;
  saveStore(d);
  renderItinCards();
  renderDatePills();
  renderBudgetBar();
  renderBudgetRecs();
  updateMapPins();
}

function updateCardNote(dayId, cardId, value) {
  if (!currentTrip) return;
  const d    = getStore();
  const trip = d.trips.find(t => t.id === currentTrip.id);
  if (!trip) return;
  const day  = trip.days.find(dy => dy.id === dayId);
  if (!day) return;
  const card = day.cards.find(c => c.id === cardId);
  if (card) { card.note = value; currentTrip = trip; saveStore(d); }
}

function reorderCard(dragId, targetId, dayId, insertAfter) {
  if (!currentTrip) return;
  const d    = getStore();
  const trip = d.trips.find(t => t.id === currentTrip.id);
  if (!trip) return;
  const day  = trip.days.find(dy => dy.id === dayId);
  if (!day) return;
  const fromIdx = day.cards.findIndex(c => c.id === dragId);
  if (fromIdx === -1) return;
  const [card] = day.cards.splice(fromIdx, 1);
  let toIdx = day.cards.findIndex(c => c.id === targetId);
  if (toIdx === -1) toIdx = day.cards.length;
  if (insertAfter) toIdx++;
  day.cards.splice(toIdx, 0, card);
  currentTrip = trip;
  saveStore(d);
  renderItinCards();
  updateMapPins();
}

// ── Add place search (Itinerary tab) ──────────────────────────
function onAddPlaceInput(val) {
  const q = val.trim().toLowerCase();
  const suggestions = document.getElementById('add-place-suggestions');
  if (!q || q.length < 2) { closeAddPlaceSuggestions(); return; }

  if (typeof CITIES === 'undefined') { closeAddPlaceSuggestions(); return; }

  addPlaceSuggestItems = [];
  CITIES.forEach(city => {
    (city.activities || []).forEach(a => {
      if (a.name.toLowerCase().includes(q) || city.name.toLowerCase().includes(q)) {
        addPlaceSuggestItems.push({ ...a, cityId: city.id, cityName: city.name, category: 'activity', cityImage: city.image });
      }
    });
    (city.food || []).forEach(f => {
      if (f.name.toLowerCase().includes(q) || city.name.toLowerCase().includes(q)) {
        addPlaceSuggestItems.push({ ...f, cityId: city.id, cityName: city.name, category: 'food', cityImage: city.image });
      }
    });
  });

  if (!addPlaceSuggestItems.length) {
    // Allow custom entry
    addPlaceSuggestItems = [];
    suggestions.innerHTML = `<div class="suggest-item" onclick="addCustomPlace()">
      <div><div class="suggest-name">+ Add "${escHtml(val.trim())}"</div><div class="suggest-meta">Custom place</div></div>
    </div>`;
    suggestions.classList.add('open');
    return;
  }

  const top = addPlaceSuggestItems.slice(0, 8);
  suggestions.innerHTML = top.map((item, i) => {
    const photo = getPhoto(item.name, item.cityImage, 40);
    return `<div class="suggest-item" onclick="pickSuggestion(${i})">
      <img src="${escHtml(photo)}" style="width:36px;height:36px;border-radius:6px;object-fit:cover;flex-shrink:0;background:#1a2742"
        onerror="this.style.display='none'" />
      <div>
        <div class="suggest-name">${escHtml(item.name)}</div>
        <div class="suggest-meta">${escHtml(item.cityName)} · ${item.category === 'food' ? '🍽 Food' : '🎯 Activity'} · ⭐ ${item.rating}</div>
      </div>
    </div>`;
  }).join('');
  suggestions.classList.add('open');
}

function pickSuggestion(idx) {
  const item = addPlaceSuggestItems[idx];
  if (!item) return;
  const dayId = currentDayId || currentTrip?.days?.[0]?.id;
  if (!dayId) { showToast('Add a day first!'); return; }
  addCardToDay(dayId, item);
  document.getElementById('add-place-input').value = '';
  closeAddPlaceSuggestions();
  showToast(`Added "${item.name}" to ${getDayLabel(currentTrip.days.find(d => d.id === dayId))}`);
}

function addCustomPlace() {
  const input = document.getElementById('add-place-input');
  const name  = input.value.trim();
  if (!name) return;
  const dayId = currentDayId || currentTrip?.days?.[0]?.id;
  if (!dayId) { showToast('Add a day first!'); return; }
  addCardToDay(dayId, { name, cityId: '', cityName: '', category: 'activity', rating: 0, price: null, duration: '' });
  input.value = '';
  closeAddPlaceSuggestions();
}

function onAddPlaceKey(e) {
  if (e.key === 'Enter') {
    const suggestions = document.getElementById('add-place-suggestions');
    if (suggestions.classList.contains('open') && addPlaceSuggestItems.length) {
      pickSuggestion(0);
    } else {
      addCustomPlace();
    }
  }
}

function closeAddPlaceSuggestions() {
  const el = document.getElementById('add-place-suggestions');
  el.classList.remove('open');
  el.innerHTML = '';
  addPlaceSuggestItems = [];
}

// ── Saves tab ─────────────────────────────────────────────────
function renderSavesTab(filterVal) {
  const grid  = document.getElementById('saves-grid');
  const saves = currentTrip?.saves || [];
  const q     = (filterVal || '').toLowerCase();

  const filtered = q
    ? saves.filter(s => s.name.toLowerCase().includes(q) || (s.cityName || '').toLowerCase().includes(q))
    : saves;

  if (!currentTrip) {
    grid.innerHTML = `<div class="itin-empty"><div class="empty-icon">✈️</div><p>Create a trip first — then heart the places you want to visit 💫</p></div>`;
    return;
  }

  if (!filtered.length) {
    grid.innerHTML = `<div class="itin-empty"><div class="empty-icon">♡</div><p>Nothing saved yet — explore <strong style="color:var(--teal,#2dd4bf);cursor:pointer" onclick="switchTab('discover')">Discover →</strong> and heart the spots you're feeling 🔥</p></div>`;
    return;
  }

  const city = typeof CITIES !== 'undefined' ? CITIES.find(c => c.id === currentTrip.cityId) : null;
  grid.innerHTML = filtered.map(s => {
    const photo    = s.photo || getPhoto(s.name, city?.image, 400);
    const catIcon  = s.category === 'food' ? '🍽' : '🎯';
    const tag      = slug(s.name);
    const igUrl    = `https://www.instagram.com/explore/tags/${tag}/`;
    const ttUrl    = `https://www.tiktok.com/tag/${tag}`;
    const vibes    = getVibes(s);
    const vibeHTML = renderVibeTags(vibes);
    return `<div class="save-card">
      <div class="save-photo-wrap">
        <img class="save-photo" src="${escHtml(photo)}" alt="${escHtml(s.name)}" loading="lazy"
          onerror="this.src='https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=70'" />
        <div class="save-heart-overlay">♥</div>
        ${s.cityName ? `<div class="save-city-badge">${escHtml(s.cityName)}</div>` : ''}
      </div>
      <div class="save-body">
        <div class="save-name">${escHtml(s.name)}</div>
        ${s.socialSource === 'instagram' ? '<span class="social-badge badge-ig">📸 Instagram</span>' :
          s.socialSource === 'tiktok'    ? '<span class="social-badge badge-tt">🎵 TikTok</span>'    :
          s.socialSource === 'other'     ? '<span class="social-badge badge-oth">🔖 Saved</span>'    : ''}
        ${vibeHTML}
        <div class="save-meta">
          ${s.rating ? `<span class="save-rating">${renderStars(s.rating)} ${s.rating}</span>` : ''}
          <span class="save-cat">${catIcon} ${escHtml(s.category || 'Activity')}</span>
        </div>
        <div class="save-footer">
          <a class="save-social-btn save-ig" href="${igUrl}" target="_blank" rel="noopener">📸 IG</a>
          <a class="save-social-btn save-tt" href="${ttUrl}" target="_blank" rel="noopener">🎵 TikTok</a>
          <button class="save-add-btn" onclick="addSaveToDay('${s.id}')">+ Plan It</button>
          <button class="save-del-btn" onclick="removeSave('${s.id}')" title="Remove">×</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function addSaveToDay(saveId) {
  if (!currentTrip) return;
  const save  = currentTrip.saves.find(s => s.id === saveId);
  if (!save)  return;
  const dayId = currentDayId || currentTrip.days?.[0]?.id;
  if (!dayId) { showToast('Add a day first!'); return; }
  addCardToDay(dayId, { ...save, fromSave: true });
  showToast(`Added "${save.name}" to ${getDayLabel(currentTrip.days.find(d => d.id === dayId))}`);
}

function savePlace(place) {
  if (!currentTrip) { showToast('Create a trip first to save places!'); return; }
  const d    = getStore();
  const trip = d.trips.find(t => t.id === currentTrip.id);
  if (!trip) return;
  trip.saves = trip.saves || [];
  if (trip.saves.find(s => s.name === place.name && s.cityId === place.cityId)) {
    showToast(`"${place.name}" is already saved`);
    return;
  }
  trip.saves.push({ id: crypto.randomUUID(), ...place });
  currentTrip = trip;
  saveStore(d);
  renderSavesBadge();
  renderDiscoverTab();
  showToast(`Saved "${place.name}" ♡`);
}

function removeSave(saveId) {
  if (!currentTrip) return;
  const d    = getStore();
  const trip = d.trips.find(t => t.id === currentTrip.id);
  if (!trip) return;
  trip.saves = (trip.saves || []).filter(s => s.id !== saveId);
  currentTrip = trip;
  saveStore(d);
  renderSavesBadge();
  renderSavesTab();
  renderDiscoverTab();
}

// ── Discover tab ──────────────────────────────────────────────
function setDiscoverFilter(filter) {
  discoverFilter = filter;
  document.querySelectorAll('.filter-pill').forEach(p => {
    p.classList.toggle('active', p.dataset.filter === filter);
  });
  renderDiscoverTab();
}

function setDiscoverVibe(vibe) {
  discoverVibe = vibe;
  document.querySelectorAll('.vibe-filter-pill').forEach(p => {
    p.classList.toggle('active', p.dataset.vibe === vibe);
  });
  renderDiscoverTab();
}

function setDiscoverSort(sort) {
  discoverSort = sort;
  document.querySelectorAll('.disc-sort-pill').forEach(p => {
    p.classList.toggle('active', p.dataset.sort === sort);
  });
  renderDiscoverTab();
}

function onDiscSearchInput(val) {
  clearTimeout(_discSearchTimer);
  discoverSearch = val.trim().toLowerCase();
  const clearBtn = document.getElementById('disc-search-clear');
  if (clearBtn) clearBtn.style.display = discoverSearch ? 'block' : 'none';
  _discSearchTimer = setTimeout(renderDiscoverTab, 200);
}

function clearDiscSearch() {
  discoverSearch = '';
  const inp = document.getElementById('disc-search');
  if (inp) inp.value = '';
  const clearBtn = document.getElementById('disc-search-clear');
  if (clearBtn) clearBtn.style.display = 'none';
  renderDiscoverTab();
}

// ── Travel Guide (Discover → Travel Guide filter) ─────────────────────────
function renderTravelGuide(container, city) {
  const guide = typeof CITY_TRAVEL_APPS !== 'undefined' ? CITY_TRAVEL_APPS[city.id] : null;

  if (!guide) {
    container.innerHTML = `<div class="itin-empty" style="grid-column:1/-1"><div class="empty-icon">✈</div><p>No travel guide yet for ${escHtml(city.name)}.</p></div>`;
    return;
  }

  const appRows = (arr) => (arr || []).map(a =>
    `<div class="tg-row">
      <span class="tg-star">${a.star ? '★' : '·'}</span>
      <div><div class="tg-app-name">${escHtml(a.n)}</div>${a.note ? `<div class="tg-app-note">${escHtml(a.note)}</div>` : ''}</div>
    </div>`
  ).join('');

  const section = (icon, title, sub, rows, extra) => `
    <div class="tg-section">
      <div class="tg-section-head">
        <span class="tg-section-icon">${icon}</span>
        <span class="tg-section-title">${title}</span>
        ${sub ? `<span class="tg-section-sub">${escHtml(sub)}</span>` : ''}
      </div>
      ${rows}
      ${extra || ''}
    </div>`;

  const html = `<div class="travel-guide">
    <div class="tg-tip-box"><strong>💡 Main tip:</strong> ${escHtml(guide.tip)}</div>

    ${section('🗺', 'Maps & Navigation', `Best: ${escHtml(guide.bestMap)}`, appRows(guide.maps), '')}

    ${section('🚇', 'Getting Around', guide.transit?.card || '', appRows((guide.transit?.apps || []).map(a => ({ n: a }))),
      `<div class="tg-tip-box">${escHtml(guide.transit?.tip || '')}</div>`)}

    ${section('🚕', 'Ride-Hailing', '', appRows(guide.ride), '')}

    ${section('🍽', 'Food & Reservations', '', appRows(guide.food), '')}

    <div class="tg-section">
      <div class="tg-section-head"><span class="tg-section-icon">💳</span><span class="tg-section-title">Payments</span></div>
      <div class="tg-pay-box">${escHtml(guide.pay)}</div>
    </div>

    <div class="tg-section">
      <div class="tg-section-head"><span class="tg-section-icon">📱</span><span class="tg-section-title">SIM / Connectivity</span></div>
      <div class="tg-sim-box">${escHtml(guide.sim)}</div>
    </div>
  </div>`;

  container.style.display = 'block';
  container.innerHTML = html;
}

// ── Get Directions (city-aware map deep link) ─────────────────────────────
function getDirectionsTo(placeName) {
  const city     = getCurrentCity();
  const guide    = city && typeof CITY_TRAVEL_APPS !== 'undefined' ? CITY_TRAVEL_APPS[city.id] : null;
  const cityName = city?.name || '';
  const query    = encodeURIComponent(`${placeName} ${cityName}`);

  // Seoul → Naver Map (Google Maps is unreliable in Korea)
  if (city?.id === 'seoul') {
    window.open(`https://map.naver.com/v5/search/${encodeURIComponent(placeName)}`, '_blank', 'noopener');
    return;
  }

  // Default: Google Maps search
  window.open(`https://maps.google.com/maps?q=${query}`, '_blank', 'noopener');
}

function renderTrendingSection(city) {
  const cityQ   = encodeURIComponent(city.name);
  const topFood = (city.food || []).slice(0, 3);
  const topActs = (city.activities || []).slice(0, 2);
  const cards   = [
    { platform: 'tt', label: `${city.name} food`,       sub: 'TikTok',    href: `https://www.tiktok.com/search?q=${cityQ}+food` },
    { platform: 'ig', label: `${city.name} travel`,     sub: 'Instagram', href: `https://www.instagram.com/explore/tags/${city.name.replace(/\s+/g,'').toLowerCase()}travel/` },
    { platform: 'tt', label: `${city.name} hidden gems`, sub: 'TikTok',   href: `https://www.tiktok.com/search?q=${cityQ}+hidden+gems` },
    { platform: 'ig', label: `${city.name} restaurants`, sub: 'Instagram', href: `https://www.instagram.com/explore/tags/${city.name.replace(/\s+/g,'').toLowerCase()}food/` },
    ...topFood.map(f => ({ platform: 'tt', label: f.name, sub: 'TikTok', href: `https://www.tiktok.com/search?q=${encodeURIComponent(f.name)}` })),
    ...topActs.map(a => ({ platform: 'ig', label: a.name, sub: 'Instagram', href: `https://www.instagram.com/explore/tags/${encodeURIComponent(a.name.replace(/\s+/g,'').toLowerCase())}/` })),
  ];
  return `<div class="trending-section">
    <div class="trending-title">${escHtml(t('trendingTitle'))}</div>
    <div class="trending-scroll">
      ${cards.map(c => `<a class="trending-card" href="${c.href}" target="_blank" rel="noopener">
        <span class="trending-platform ${c.platform}">${c.platform === 'tt' ? '▶ TikTok' : '◈ Instagram'}</span>
        <span class="trending-label">${escHtml(c.label)}</span>
        <span class="trending-sub">${c.sub}</span>
      </a>`).join('')}
    </div>
  </div>`;
}

function renderDiscoverTab() {
  const grid = document.getElementById('discover-grid');
  if (!currentTrip) {
    grid.innerHTML = `<div class="itin-empty" style="grid-column:1/-1"><div class="empty-icon">🔍</div><p>${escHtml(t('noTrip'))}</p></div>`;
    return;
  }

  const city = typeof CITIES !== 'undefined' ? CITIES.find(c => c.id === currentTrip.cityId) : null;
  if (!city) {
    grid.innerHTML = `<div class="itin-empty" style="grid-column:1/-1"><div class="empty-icon">🌍</div><p>No city data found for this trip</p></div>`;
    return;
  }

  const saves   = currentTrip.saves || [];
  const isSaved = name => saves.some(s => s.name === name);

  // Travel Guide tab — render separately and return early
  if (discoverFilter === 'travel') {
    renderTravelGuide(grid, city);
    return;
  }

  let items = [];
  if (discoverFilter === 'all' || discoverFilter === 'activities') {
    (city.activities || []).forEach(a => items.push({ ...a, category: 'activity' }));
  }
  if (discoverFilter === 'all' || discoverFilter === 'food') {
    (city.food || []).forEach(f => items.push({ ...f, category: 'food' }));
  }
  if (discoverFilter === 'free') {
    (city.activities || []).filter(a => a.price === 0).forEach(a => items.push({ ...a, category: 'activity' }));
    (city.food || []).filter(f => f.price === 0).forEach(f => items.push({ ...f, category: 'food' }));
  }

  // Vibe filter
  if (discoverVibe) {
    items = items.filter(item => getVibes(item).includes(discoverVibe));
  }

  // Search filter — match name, desc, cuisine, tip
  if (discoverSearch) {
    const q = discoverSearch;
    items = items.filter(item =>
      (item.name    || '').toLowerCase().includes(q) ||
      (item.desc    || '').toLowerCase().includes(q) ||
      (item.cuisine || '').toLowerCase().includes(q) ||
      (item.tip     || '').toLowerCase().includes(q)
    );
  }

  // Sort
  if (discoverSort === 'rating') {
    items.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (discoverSort === 'price-low') {
    items.sort((a, b) => (a.price ?? 9999) - (b.price ?? 9999));
  } else if (discoverSort === 'price-high') {
    items.sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
  } else if (discoverSort === 'az') {
    items.sort((a, b) => a.name.localeCompare(b.name));
  }

  if (!items.length) {
    const label = escHtml(discoverSearch || (discoverVibe ? VIBE_DEFS.find(v => v.id === discoverVibe)?.label || discoverVibe : ''));
    grid.innerHTML = `<div class="itin-empty" style="grid-column:1/-1"><div class="empty-icon">😔</div><p>${escHtml(t('noResults'))}${label ? ` — "${label}"` : ''}</p></div>`;
    return;
  }

  // Build cache for profile modal (include all city places regardless of current filter)
  _discCache = {};
  [...(city.activities || []), ...(city.food || [])].forEach(item => {
    _discCache[item.name] = { item: { ...item, category: city.activities?.includes(item) ? 'activity' : 'food' }, city };
  });
  items.forEach(item => { _discCache[item.name] = { item, city }; });

  const topRatingThreshold = Math.max(...items.map(i => i.rating || 0)) - 0.05;

  const cardsHTML = items.map((item, idx) => {
    const photo    = getPhoto(item.name, city.image, 600);
    const catIcon  = item.category === 'food' ? '🍽' : '🎯';
    const catLabel = item.category === 'food' ? 'Food' : 'Activity';
    const saved    = isSaved(item.name);
    const stars    = renderStars(item.rating);
    const priceEl  = item.price === 0
      ? '<span class="disc-free">FREE</span>'
      : item.price > 0 ? `<span class="disc-price">$${item.price}</span>` : '';
    const vibes    = getVibes(item);
    const vibeHTML = renderVibeTags(vibes);
    const isFood   = item.category === 'food';
    const srcCls   = isFood ? 'src-yelp' : 'src-google';
    const srcLabel = isFood ? '⭐ Yelp' : '🔍 Google';
    const gemBadge = item.localGem ? '<span class="local-gem-pill">🔒 Local Gem</span>' : '';

    // Budget / Top Pick overlay badges
    const isBudget  = item.price > 0 && item.price <= 12;
    const isTopPick = (item.rating || 0) >= topRatingThreshold && topRatingThreshold >= 4.8;
    const overlayBadges = (isBudget || isTopPick) ? `
      <div class="card-badge-wrap">
        ${isTopPick ? '<span class="badge-toppick">🔥 Top Pick</span>' : ''}
        ${isBudget  ? '<span class="badge-budget">💰 Budget</span>'   : ''}
      </div>` : '';

    return `<div class="discover-card" style="animation-delay:${idx * 35}ms" onclick="openPlaceProfile('${jsqApp(item.name)}')">
      <div class="disc-photo-wrap">
        <img class="disc-photo" src="${escHtml(photo)}" alt="${escHtml(item.name)}" loading="lazy"
          onerror="this.src='https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=70'" />
        <div class="disc-cat-pill">${catIcon} ${catLabel}</div>
        ${overlayBadges}
        <button class="disc-heart-btn ${saved ? 'saved' : ''}"
          onclick="event.stopPropagation();discSaveByName('${jsqApp(item.name)}')"
          title="${saved ? 'Saved!' : 'Save'}">
          ${saved ? '♥' : '♡'}
        </button>
        <div class="disc-name-overlay">
          <div class="disc-name">${escHtml(item.name)}</div>
        </div>
      </div>
      <div class="disc-body">
        ${item.desc ? `<div class="disc-desc">${escHtml(item.desc)}</div>` : ''}
        <div class="disc-meta-row">
          <span class="disc-stars">${stars} <span>${item.rating}</span></span>
          <span class="rating-source ${srcCls}">${srcLabel}</span>
          ${gemBadge}
          ${priceEl}
          ${vibeHTML}
        </div>
        <button class="disc-add-btn" onclick="event.stopPropagation();discAddByName('${jsqApp(item.name)}')">
          ${escHtml(t('addToPlanner'))}
        </button>
      </div>
    </div>`;
  }).join('');

  // Prepend trending social section only when not searching
  grid.innerHTML = (discoverSearch ? '' : renderTrendingSection(city)) + cardsHTML;
}

// Save/add by name using _discCache
function discSaveByName(name) {
  const entry = _discCache[name];
  if (!entry) return;
  const { item, city } = entry;
  savePlace({ name: item.name, cityId: city.id, cityName: city.name, category: item.category, rating: item.rating, price: item.price, tip: item.tip || '', photo: item.photo || '' });
}

function discAddByName(name) {
  const entry = _discCache[name];
  if (!entry) return;
  const { item, city } = entry;
  const dayId = currentDayId || currentTrip?.days?.[0]?.id;
  if (!dayId) { showToast('Add a day first!'); return; }
  addCardToDay(dayId, { name: item.name, cityId: city.id, cityName: city.name, category: item.category, rating: item.rating, price: item.price, duration: item.duration || '', tip: item.tip || '', photo: item.photo || '' });
  showToast(`Added "${item.name}" to itinerary`);
  switchTab('itinerary');
}

// ── Place Profile Modal ────────────────────────────────────────
let _profileCurrent = null; // { item, city }

function openPlaceProfile(name) {
  const entry = _discCache[name];
  if (!entry) return;
  const { item, city } = entry;
  _profileCurrent = entry;

  const tag     = slug(item.name);
  const photos  = getPlacePhotos(item.name, city.image);
  const saves   = currentTrip?.saves || [];
  const isSaved = saves.some(s => s.name === item.name);

  renderProfileSlideshow(photos);
  document.getElementById('profile-city-tag').textContent = `${city.name}, ${city.country}`;
  document.getElementById('profile-name').textContent = item.name;
  document.getElementById('profile-stars').innerHTML = renderStars(item.rating);
  document.getElementById('profile-stars-num').textContent = `${item.rating} / 5`;

  const priceEl  = document.getElementById('profile-price');
  const freeEl   = document.getElementById('profile-free');
  if (item.price === 0) {
    freeEl.style.display = 'inline';
    priceEl.style.display = 'none';
  } else if (item.price > 0) {
    priceEl.textContent = `$${item.price}`;
    priceEl.style.display = 'inline';
    freeEl.style.display = 'none';
  } else {
    priceEl.style.display = 'none';
    freeEl.style.display = 'none';
  }

  document.getElementById('profile-cat').textContent =
    item.category === 'food' ? '🍽 Food' : '🎯 Activity';

  const isFood = item.category === 'food';
  const srcEl  = document.getElementById('profile-source-badge');
  if (srcEl) {
    srcEl.textContent = isFood ? '⭐ Yelp' : '🔍 Google';
    srcEl.className   = `rating-source ${isFood ? 'src-yelp' : 'src-google'}`;
  }
  const gemEl = document.getElementById('profile-gem-badge');
  if (gemEl) gemEl.style.display = item.localGem ? '' : 'none';

  const descEl = document.getElementById('profile-desc');
  if (item.desc) {
    descEl.textContent = item.desc;
    descEl.style.display = 'block';
  } else {
    descEl.style.display = 'none';
  }

  const tipEl = document.getElementById('profile-tip');
  if (item.tip) {
    tipEl.textContent = `💡 ${item.tip}`;
    tipEl.style.display = 'block';
  } else {
    tipEl.style.display = 'none';
  }

  // Social links
  document.getElementById('profile-ig').href     = `https://www.instagram.com/explore/tags/${tag}/`;
  document.getElementById('profile-tt').href     = `https://www.tiktok.com/tag/${tag}`;
  document.getElementById('profile-yelp').href   = `https://www.yelp.com/search?find_desc=${encodeURIComponent(item.name)}&find_loc=${encodeURIComponent(city.name)}`;
  document.getElementById('profile-google').href = `https://www.google.com/search?q=${encodeURIComponent(item.name + ' ' + city.name + ' reviews')}`;

  // Save button state
  const saveBtn = document.getElementById('profile-save-btn');
  const savedBadge = document.getElementById('profile-saved-badge');
  if (isSaved) {
    saveBtn.textContent = '♥ Saved';
    saveBtn.classList.add('saved');
    savedBadge.style.display = 'block';
  } else {
    saveBtn.textContent = '♡ Save';
    saveBtn.classList.remove('saved');
    savedBadge.style.display = 'none';
  }

  document.getElementById('place-profile-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closePlaceProfile() {
  document.getElementById('place-profile-modal').classList.add('hidden');
  document.body.style.overflow = '';
  _profileCurrent = null;
}

function profileToggleSave() {
  if (!_profileCurrent) return;
  const { item, city } = _profileCurrent;
  const saves  = currentTrip?.saves || [];
  const isSaved = saves.some(s => s.name === item.name);
  if (isSaved) {
    removeSave(saves.find(s => s.name === item.name)?.id);
  } else {
    savePlace({ name: item.name, cityId: city.id, cityName: city.name, category: item.category, rating: item.rating, price: item.price, tip: item.tip || '', photo: item.photo || '' });
  }
  // Refresh button state
  openPlaceProfile(item.name);
}

function profileAddToPlanner() {
  if (!_profileCurrent) return;
  discAddByName(_profileCurrent.item.name);
  closePlaceProfile();
}


// ── Map ───────────────────────────────────────────────────────
function initMap() {
  try {
    leafletMap = L.map('map', {
      center:  [20, 0],
      zoom:    2,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(leafletMap);

    mapInitialized = true;
    // Ensure map fills container — call multiple times to catch slow layout
    [100, 400, 900].forEach(ms => setTimeout(() => leafletMap && leafletMap.invalidateSize(), ms));
    window.addEventListener('resize', () => leafletMap && leafletMap.invalidateSize());
    updateMapPins();
  } catch (e) {
    console.warn('Leaflet init failed:', e);
    const mapEl = document.getElementById('map');
    if (mapEl) mapEl.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#94a3b8;font-size:14px;">Map unavailable — check your connection and reload.</div>';
  }
}

function clearMapMarkers() {
  mapMarkers.forEach(m => {
    try { leafletMap.removeLayer(m); } catch {}
  });
  mapMarkers = [];
}

function makeCircleIcon(color, opacity) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" fill="${color}" opacity="${opacity || 1}" stroke="white" stroke-width="2"/>
    <circle cx="12" cy="12" r="4" fill="white" opacity="0.8"/>
  </svg>`;
  return L.divIcon({
    html:      `<div style="width:24px;height:24px">${svg}</div>`,
    iconSize:  [24, 24],
    iconAnchor:[12, 12],
    className: '',
  });
}

function updateMapPins() {
  if (!mapInitialized || !leafletMap) return;
  clearMapMarkers();

  if (!currentTrip) {
    leafletMap.setView([20, 0], 2);
    return;
  }

  const cityCoord = CITY_COORDS[currentTrip.cityId];
  if (!cityCoord) {
    leafletMap.setView([20, 0], 2);
    return;
  }

  const bounds = [];

  // City center marker
  const cityIcon = makeCircleIcon('#2dd4bf', 0.7);
  const cityMarker = L.marker(cityCoord, { icon: cityIcon })
    .addTo(leafletMap)
    .bindPopup(`<div class="pin-popup-name">${escHtml(currentTrip?.name || 'Trip')}</div><div class="pin-popup-city">${escHtml(getCityName())}</div>`);
  mapMarkers.push(cityMarker);
  bounds.push(cityCoord);

  // Itinerary day pins (teal)
  const allDays = currentTrip.days || [];

  allDays.forEach(day => {
    (day.cards || []).forEach(card => {
      if (!card.cityId && !currentTrip.cityId) return;
      const base   = CITY_COORDS[card.cityId || currentTrip.cityId];
      if (!base) return;
      const coord  = jitter(base, card.name);
      const isCurrentDay = day.id === currentDayId;
      const icon   = isCurrentDay ? makeCircleIcon('#2dd4bf', 1) : makeCircleIcon('#2dd4bf', 0.45);
      const m      = L.marker(coord, { icon })
        .addTo(leafletMap)
        .bindPopup(`<div class="pin-popup-name">${escHtml(card.name)}</div><div class="pin-popup-day">${escHtml(getDayLabel(day))}</div>${card.cityName ? `<div class="pin-popup-city">${escHtml(card.cityName)}</div>` : ''}`);
      mapMarkers.push(m);
      bounds.push(coord);
    });
  });

  // Saves pins (pink)
  (currentTrip.saves || []).forEach(save => {
    const base = CITY_COORDS[save.cityId || currentTrip.cityId];
    if (!base) return;
    const coord = jitter(base, 'save_' + save.name);
    const icon  = makeCircleIcon('#f472b6', 1);
    const m     = L.marker(coord, { icon })
      .addTo(leafletMap)
      .bindPopup(`<div class="pin-popup-name">${escHtml(save.name)}</div><div class="pin-popup-day" style="color:#f472b6">Saved</div>${save.cityName ? `<div class="pin-popup-city">${escHtml(save.cityName)}</div>` : ''}`);
    mapMarkers.push(m);
    bounds.push(coord);
  });

  // Discover pins (grey) — only for current city, active only in discover tab
  // Capped at top 30 by rating to keep the map readable
  if (activeTab === 'discover') {
    const city = typeof CITIES !== 'undefined' ? CITIES.find(c => c.id === currentTrip.cityId) : null;
    if (city) {
      const allItems = [...(city.activities || []), ...(city.food || [])]
        .filter(Boolean)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 30);
      allItems.forEach(item => {
        const coord = jitter(cityCoord, item.name);
        const icon  = makeCircleIcon('#64748b', 0.8);
        const m     = L.marker(coord, { icon })
          .addTo(leafletMap)
          .bindPopup(`<div class="pin-popup-name">${escHtml(item.name)}</div><div class="pin-popup-city">${escHtml(city.name)}</div>`);
        mapMarkers.push(m);
        bounds.push(coord);
      });
    }
  }

  if (bounds.length > 1) {
    try {
      leafletMap.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    } catch {}
  } else if (cityCoord) {
    leafletMap.setView(cityCoord, 11);
  }
}

function getCityName() {
  if (!currentTrip) return '';
  const city = typeof CITIES !== 'undefined' ? CITIES.find(c => c.id === currentTrip.cityId) : null;
  return city ? `${city.name}, ${city.country}` : '';
}

// ── PWA Share Handler ─────────────────────────────────────────
function handleIncomingShare() {
  const params = new URLSearchParams(window.location.search);
  const title  = params.get('title') || '';
  const text   = params.get('text')  || '';
  const url    = params.get('url')   || '';

  if (!title && !text && !url) return;

  // Extract the best candidate for a place name
  const raw    = title || text || url;
  const name   = extractPlaceName(raw);

  // Detect source from shared URL
  let social = 'other';
  if (url.includes('instagram.com') || text.includes('instagram.com')) social = 'instagram';
  if (url.includes('tiktok.com')    || text.includes('tiktok.com'))    social = 'tiktok';

  // Clean the URL so it doesn't re-trigger on refresh
  window.history.replaceState({}, '', window.location.pathname);

  // Switch to Saves tab and open Quick Add pre-filled
  switchTab('saves');
  setTimeout(() => openQuickAdd({ name, social, fromShare: true }), 300);
}

function extractPlaceName(raw) {
  // Strip URLs
  let s = raw.replace(/https?:\/\/\S+/g, '').trim();
  // Strip hashtags and @mentions
  s = s.replace(/#\S+/g, '').replace(/@\S+/g, '').trim();
  // Take first sentence / up to first emoji or pipe
  s = s.split(/[|\n🍜🍣🍕🍔🌮☕🍷🥩🍦🎯📍]/)[0].trim();
  // Cap at 60 chars
  return s.slice(0, 60).trim();
}

// ── Quick Add ─────────────────────────────────────────────────
function populateQuickAddCities() {
  if (typeof CITIES === 'undefined') return;
  ['qa-city', 'qa-bulk-city'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    CITIES.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${c.name}, ${c.country}`;
      sel.appendChild(opt);
    });
  });
}

function openQuickAdd(prefill) {
  // Reset state
  _qaSocial = null;
  document.getElementById('qa-name').value  = prefill?.name  || '';
  document.getElementById('qa-note').value  = '';
  document.getElementById('qa-city').value  = '';
  document.getElementById('qa-category').value = 'food';
  ['spb-ig','spb-tt','spb-oth'].forEach(id =>
    document.getElementById(id)?.classList.remove('active-ig','active-tt','active-oth')
  );

  // Show share banner if opened via share
  document.getElementById('qa-share-banner').style.display = prefill?.fromShare ? 'flex' : 'none';

  // Pre-select social source
  if (prefill?.social) pickSocial(prefill.social);

  // Set title
  document.getElementById('qa-modal-title').textContent = prefill?.fromShare ? '📲 Shared Place' : 'Add a Place';

  switchQaTab('single');
  document.getElementById('quick-add-modal').classList.remove('hidden');
  setTimeout(() => document.getElementById('qa-name').focus(), 60);
}

// ── File Import ───────────────────────────────────────────────
let _importCandidates = [];

async function handleFileImport(file) {
  if (!file) return;
  showToast('Reading file…');
  try {
    let places = [];
    if (file.name.toLowerCase().endsWith('.zip')) {
      places = await parseZipExport(file);
    } else if (file.name.toLowerCase().endsWith('.json')) {
      const text = await file.text();
      places = parseAnyJson(JSON.parse(text), file.name);
    } else {
      showToast('Unsupported file type — try .json or .zip'); return;
    }
    if (!places.length) { showToast('No places found in this file'); return; }
    showImportReview(places);
  } catch (e) {
    console.error('File import error:', e);
    showToast('Could not read file — check the format and try again');
  }
}

async function parseZipExport(file) {
  if (!window.JSZip) { showToast('ZIP support unavailable — extract the file and upload the .json directly'); return []; }
  const zip = await window.JSZip.loadAsync(file);
  const tryFile = async (regex) => {
    const f = zip.file(regex)[0];
    return f ? f.async('text') : null;
  };

  let text = await tryFile(/Saved Places\.json$/i);
  if (text) return parseGoogleMapsJson(JSON.parse(text));

  text = await tryFile(/Favorite Videos\.json$/i);
  if (text) return parseTikTokJson(JSON.parse(text));

  text = await tryFile(/user_data\.json$/i);
  if (text) { const r = parseTikTokJson(JSON.parse(text)); if (r.length) return r; }

  text = await tryFile(/saved_posts\.json$/i);
  if (text) return parseInstagramJson(JSON.parse(text));

  // Fallback: scan all JSON files
  const all = zip.file(/\.json$/i);
  const places = [];
  for (const f of all) {
    try {
      const t = await f.async('text');
      places.push(...parseAnyJson(JSON.parse(t), f.name));
    } catch {}
  }
  return dedupeImports(places);
}

function parseAnyJson(json, filename) {
  const fn = (filename || '').toLowerCase();
  if (fn.includes('saved places') || fn.includes('savedplaces') || json?.type === 'FeatureCollection') return parseGoogleMapsJson(json);
  if (fn.includes('favorite') || fn.includes('tiktok') || json?.Activity?.['Favorite Videos'] || json?.FavoriteVideoList) return parseTikTokJson(json);
  if (fn.includes('saved_posts') || fn.includes('instagram') || json?.saved_saved_media) return parseInstagramJson(json);
  return [];
}

function parseGoogleMapsJson(json) {
  return (json?.features || []).map(f => {
    const name = f?.properties?.Title || f?.properties?.Location?.['Business Name'] || '';
    const addr = f?.properties?.Location?.Address || '';
    return name ? { name: name.trim(), note: addr.trim(), source: 'google_maps' } : null;
  }).filter(Boolean);
}

function parseTikTokJson(json) {
  const list = json?.Activity?.['Favorite Videos']?.FavoriteVideoList
    || json?.FavoriteVideoList
    || json?.['Favorite Videos']?.FavoriteVideoList || [];
  const places = [];
  list.forEach(item => {
    extractPlacesFromText(item?.VideoDesc || item?.Description || '')
      .forEach(name => places.push({ name, note: '', source: 'tiktok' }));
  });
  return dedupeImports(places);
}

function parseInstagramJson(json) {
  const items = json?.saved_saved_media || json?.saved_posts || [];
  const places = [];
  items.forEach(item => {
    [item?.title || '', item?.media?.[0]?.title || ''].forEach(text => {
      if (text) extractPlacesFromText(text).forEach(name => places.push({ name, note: '', source: 'instagram' }));
    });
  });
  return dedupeImports(places);
}

function extractPlacesFromText(text) {
  if (!text) return [];
  const places = [];
  // 📍 Place Name — strongest signal
  (text.match(/📍\s*([^\n📍#@]{3,60})/g) || []).forEach(m => {
    const name = m.replace(/^📍\s*/, '').split(/[|,\n]/)[0].trim();
    if (name.length > 2) places.push(name);
  });
  // "at Place Name" pattern
  (text.match(/\bat\s+([A-Z][^\n,!?.]{2,40})/g) || []).forEach(m => {
    const name = m.replace(/^\bat\s+/, '').trim();
    if (name.length > 2) places.push(name);
  });
  // Quoted names
  (text.match(/["""']([^"""']{3,50})["""']/g) || []).forEach(m =>
    places.push(m.replace(/^["""']|["""']$/g, '').trim())
  );
  return places.filter(p => p.length > 2 && p.length < 60);
}

function dedupeImports(places) {
  const seen = new Map();
  places.forEach(p => { const k = p.name.toLowerCase().trim(); if (!seen.has(k)) seen.set(k, p); });
  return [...seen.values()];
}

const _importSourceLabel = { google_maps: '🗺 Google Maps', tiktok: '🎵 TikTok', instagram: '📸 Instagram' };

function showImportReview(places) {
  _importCandidates = places;
  const sources = [...new Set(places.map(p => p.source || ''))];
  document.getElementById('import-review-title').textContent =
    `Found ${places.length} place${places.length !== 1 ? 's' : ''} — ${sources.map(s => _importSourceLabel[s] || 'File').join(', ')}`;
  document.getElementById('import-review-list').innerHTML = places.map((p, i) => `
    <label class="import-review-item">
      <input type="checkbox" data-idx="${i}" checked>
      <div>
        <div class="import-review-name">${escHtml(p.name)}</div>
        ${p.note ? `<div class="import-review-note">${escHtml(p.note)}</div>` : ''}
        ${p.source ? `<div class="import-review-source">${escHtml(_importSourceLabel[p.source] || p.source)}</div>` : ''}
      </div>
    </label>`).join('');
  closeQuickAdd();
  document.getElementById('import-review-modal').classList.remove('hidden');
}

function importToggleAll() {
  const boxes = [...document.querySelectorAll('#import-review-list input[type=checkbox]')];
  const allChecked = boxes.every(b => b.checked);
  boxes.forEach(b => b.checked = !allChecked);
}

function closeImportReview() {
  document.getElementById('import-review-modal').classList.add('hidden');
  _importCandidates = [];
}

function confirmImportReview() {
  if (!currentTrip) { showToast('Create a trip first'); return; }
  const cityId   = currentTrip.cityId;
  const city     = typeof CITIES !== 'undefined' ? CITIES.find(c => c.id === cityId) : null;
  const checked  = [...document.querySelectorAll('#import-review-list input[type=checkbox]:checked')];
  if (!checked.length) { showToast('Select at least one place'); return; }
  let added = 0;
  checked.forEach(cb => {
    const p = _importCandidates[parseInt(cb.dataset.idx)];
    if (!p) return;
    if ((currentTrip.saves || []).some(s => s.name.toLowerCase() === p.name.toLowerCase())) return;
    savePlace({ name: p.name, cityId, cityName: city?.name || '', category: 'food', rating: 0, price: null, socialSource: p.source || 'file', note: p.note || '' });
    added++;
  });
  closeImportReview();
  switchTab('saves');
  showToast(`Added ${added} place${added !== 1 ? 's' : ''} to saves ♡`);
}

function openBulkImport() {
  _bulkSocial = null;
  document.getElementById('qa-bulk-text').value = '';
  document.getElementById('qa-bulk-city').value = '';
  document.getElementById('qa-bulk-category').value = 'food';
  const fi = document.getElementById('qa-file-input');
  if (fi) fi.value = '';
  ['bspb-ig','bspb-tt','bspb-oth'].forEach(id =>
    document.getElementById(id)?.classList.remove('active-ig','active-tt','active-oth')
  );
  document.getElementById('qa-modal-title').textContent = 'Import Places';
  switchQaTab('bulk');
  document.getElementById('quick-add-modal').classList.remove('hidden');
  setTimeout(() => document.getElementById('qa-bulk-text').focus(), 60);
}

function closeQuickAdd() {
  document.getElementById('quick-add-modal').classList.add('hidden');
}

function switchQaTab(tab) {
  document.getElementById('qa-pane-single').style.display = tab === 'single' ? 'flex' : 'none';
  document.getElementById('qa-pane-bulk').style.display   = tab === 'bulk'   ? 'flex' : 'none';
  document.getElementById('qa-tab-single').classList.toggle('active', tab === 'single');
  document.getElementById('qa-tab-bulk').classList.toggle('active',   tab === 'bulk');
}

function pickSocial(source) {
  _qaSocial = source;
  document.getElementById('spb-ig').className  = 'social-pick-btn' + (source === 'instagram' ? ' active-ig'  : '');
  document.getElementById('spb-tt').className  = 'social-pick-btn' + (source === 'tiktok'    ? ' active-tt'  : '');
  document.getElementById('spb-oth').className = 'social-pick-btn' + (source === 'other'     ? ' active-oth' : '');
}

function pickBulkSocial(source) {
  _bulkSocial = source;
  document.getElementById('bspb-ig').className  = 'social-pick-btn' + (source === 'instagram' ? ' active-ig'  : '');
  document.getElementById('bspb-tt').className  = 'social-pick-btn' + (source === 'tiktok'    ? ' active-tt'  : '');
  document.getElementById('bspb-oth').className = 'social-pick-btn' + (source === 'other'     ? ' active-oth' : '');
}

function saveQuickAdd() {
  const name     = document.getElementById('qa-name').value.trim();
  const cityId   = document.getElementById('qa-city').value;
  const category = document.getElementById('qa-category').value;
  const note     = document.getElementById('qa-note').value.trim();

  if (!name)   { showToast('Enter a place name first'); return; }
  if (!cityId) { showToast('Pick a city'); return; }
  if (!currentTrip) { showToast('Create a trip first'); return; }

  const city = typeof CITIES !== 'undefined' ? CITIES.find(c => c.id === cityId) : null;

  savePlace({
    name,
    cityId,
    cityName:     city?.name || '',
    category,
    rating:       0,
    price:        null,
    socialSource: _qaSocial,
    note,
  });

  closeQuickAdd();
  switchTab('saves');
  showToast(`"${name}" saved to your wishlist ♡`);
}

function saveBulkImport() {
  const raw    = document.getElementById('qa-bulk-text').value;
  const cityId = document.getElementById('qa-bulk-city').value;
  const cat    = document.getElementById('qa-bulk-category').value;

  if (!raw.trim())  { showToast('Paste at least one place name'); return; }
  if (!cityId)      { showToast('Pick a city for these places'); return; }
  if (!currentTrip) { showToast('Create a trip first'); return; }

  const city   = typeof CITIES !== 'undefined' ? CITIES.find(c => c.id === cityId) : null;
  const names  = raw.split('\n').map(l => l.trim()).filter(Boolean);

  names.forEach(name => {
    // Skip if already saved
    if ((currentTrip.saves || []).some(s => s.name.toLowerCase() === name.toLowerCase())) return;
    savePlace({
      name,
      cityId,
      cityName:     city?.name || '',
      category:     cat,
      rating:       0,
      price:        null,
      socialSource: _bulkSocial,
      note:         '',
    });
  });

  closeQuickAdd();
  switchTab('saves');
  showToast(`Imported ${names.length} place${names.length !== 1 ? 's' : ''} ✓`);
}

// ── Mobile map toggle ─────────────────────────────────────────
function toggleMobileMap() {
  const panel = document.getElementById('map-panel');
  panel.classList.toggle('mob-visible');
  if (panel.classList.contains('mob-visible') && leafletMap) {
    setTimeout(() => leafletMap.invalidateSize(), 100);
  }
}

// ── Toast ─────────────────────────────────────────────────────
let _toastTimer = null;
function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  if (_toastTimer) clearTimeout(_toastTimer);

  const el = document.createElement('div');
  el.className   = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  _toastTimer = setTimeout(() => el.remove(), 3000);
}

// ── Rewards Tab ───────────────────────────────────────────────
function renderRewardsTab() {
  const container = document.getElementById('rewards-scroll');
  if (!container) return;

  const cityId   = currentTrip?.cityId || '';
  const cards    = typeof REWARDS_CARDS    !== 'undefined' ? REWARDS_CARDS    : [];
  const cityTips = typeof CITY_REWARDS_TIPS !== 'undefined' ? CITY_REWARDS_TIPS : {};
  const airlines = typeof AIRLINE_REWARDS  !== 'undefined' ? AIRLINE_REWARDS  : [];
  const blogs    = typeof REWARDS_BLOG     !== 'undefined' ? REWARDS_BLOG     : [];
  const checklist= typeof REWARDS_CHECKLIST!== 'undefined' ? REWARDS_CHECKLIST: [];

  const tripCity = cityTips[cityId];
  let html = '';

  // ── Hero ─────────────────────────────────────────────────────────────────
  html += `<div class="rewards-hero">
    <div class="rewards-hero-icon">💳</div>
    <div class="rewards-hero-title">Travel Rewards Hub</div>
    <div class="rewards-hero-sub">Best cards for every city, airline, and situation — maximize every point.</div>
  </div>`;

  // ── Best cards for THIS trip ──────────────────────────────────────────────
  if (tripCity) {
    html += `<div class="rewards-section-title">📍 Best Cards for ${escHtml(tripCity.name)}</div>`;
    html += `<div class="rewards-section-sub">Tailored to maximize points on your specific trip</div>`;
    html += `<div class="trip-card-grid">`;
    tripCity.tips.forEach((t, i) => {
      const rank = ['#1 Pick', '#2 Pick', '#3 Pick'][i] || '';
      const rankColor = i === 0 ? '#2dd4bf' : i === 1 ? '#94a3b8' : '#64748b';
      html += `<div class="trip-card-box">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
          <span style="font-size:11px;font-weight:700;color:${rankColor};letter-spacing:.5px;text-transform:uppercase">${rank}</span>
          <span style="font-size:14px;font-weight:700;color:#e2e8f0">${escHtml(t.card)}</span>
        </div>
        <div style="font-size:13px;color:#94a3b8;line-height:1.6">${escHtml(t.tip)}</div>
      </div>`;
    });
    html += `</div>`;

    // relevant airlines for this city
    const cityAirlines = airlines.filter(a => a.hubs.includes(cityId));
    if (cityAirlines.length) {
      html += `<div style="margin-top:8px;padding:14px 16px;background:rgba(45,212,191,.06);border:1px solid rgba(45,212,191,.15);border-radius:10px">`;
      html += `<div style="font-size:12px;font-weight:600;color:#2dd4bf;margin-bottom:8px;letter-spacing:.5px">✈ AIRLINES FLYING TO ${escHtml(tripCity.name.toUpperCase())}</div>`;
      cityAirlines.forEach(a => {
        html += `<div style="margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,.05)">
          <div style="font-size:13px;font-weight:600;color:#e2e8f0;margin-bottom:3px">${escHtml(a.airline)} (${escHtml(a.code)}) — Best: <span style="color:#2dd4bf">${escHtml(a.bestCard)}</span></div>
          <div style="font-size:12px;color:#94a3b8">${escHtml(a.tip)}</div>
        </div>`;
      });
      html += `</div>`;
    }
  }

  // ── All credit cards ──────────────────────────────────────────────────────
  html += `<div class="rewards-section-title">🏆 Top Travel Credit Cards</div>`;
  html += `<div class="rewards-section-sub">Ranked by signup bonus value and travel perks</div>`;
  html += `<div class="cc-city-cards">`;
  for (const c of cards) {
    const earnHtml = Object.entries(c.earn).map(([k,v]) => `<strong>${escHtml(v)}</strong> ${escHtml(k)}`).join(' · ');
    const perksHtml = c.perks.map(p => `<span style="display:block;margin-bottom:2px">• ${escHtml(p)}</span>`).join('');
    html += `<div class="cc-card">
      <div class="cc-card-header">
        <div class="cc-card-icon ${c.icon}">${c.issuer.charAt(0)}</div>
        <div class="cc-card-info">
          <div class="cc-card-name">${escHtml(c.name)}</div>
          <div class="cc-card-issuer">${escHtml(c.issuer)} · $${c.annualFee}/yr</div>
        </div>
        <div class="cc-card-bonus">${escHtml(c.bonus)}</div>
      </div>
      <div class="cc-card-body">
        <div class="cc-card-row"><div class="cc-card-label">Earn</div><div class="cc-card-val">${earnHtml}</div></div>
        <div class="cc-card-row"><div class="cc-card-label">Bonus</div><div class="cc-card-val">${escHtml(c.bonusSpend)}</div></div>
        <div class="cc-card-row"><div class="cc-card-label">Perks</div><div class="cc-card-val">${perksHtml}</div></div>
      </div>
    </div>`;
  }
  html += `</div>`;

  // ── Airline Rewards ───────────────────────────────────────────────────────
  html += `<div class="rewards-section-title">✈️ Airline Rewards Guide</div>`;
  html += `<div class="rewards-section-sub">Which card to use for every major airline — and how to transfer points for maximum value</div>`;
  html += `<div class="airline-grid">`;
  for (const a of airlines) {
    html += `<div class="airline-card">
      <div class="airline-card-header">
        <div class="airline-badge">${escHtml(a.code)}</div>
        <div>
          <div style="font-size:14px;font-weight:700;color:#e2e8f0">${escHtml(a.airline)}</div>
          <div style="font-size:11px;color:#64748b">${escHtml(a.region)}</div>
        </div>
      </div>
      <div class="airline-best">Best card: <strong style="color:#2dd4bf">${escHtml(a.bestCard)}</strong></div>
      <div class="airline-earn">📊 ${escHtml(a.earn)}</div>
      <div class="airline-tip">${escHtml(a.tip)}</div>
      <div class="airline-partners">${a.partners.map(p => `<span class="partner-tag">${escHtml(p)}</span>`).join('')}</div>
    </div>`;
  }
  html += `</div>`;

  // ── City-by-city tips ─────────────────────────────────────────────────────
  const tipCities = cityId && cityTips[cityId]
    ? [cityId, ...Object.keys(cityTips).filter(k => k !== cityId)]
    : Object.keys(cityTips);

  html += `<div class="rewards-section-title">🗺 All Cities — Point Strategies</div>`;
  html += `<div class="rewards-section-sub">${tripCity ? 'Your trip city shown first' : 'Maximize earnings at every destination'}</div>`;

  for (const cid of tipCities) {
    const ct = cityTips[cid];
    if (!ct) continue;
    const isTrip = cid === cityId;
    const highlight = isTrip ? ' style="border:1px solid rgba(45,212,191,.25);background:rgba(13,148,136,.05);border-radius:12px;padding:10px;margin-bottom:4px"' : '';
    html += `<div class="cc-city-block"${highlight}>`;
    html += `<div class="cc-city-name">${isTrip ? '📍 ' : ''}${escHtml(ct.name)}</div>`;
    html += `<div class="cc-city-tips">`;
    ct.tips.forEach((t, i) => {
      const label = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
      html += `<div class="cc-city-tip"><span style="margin-right:4px">${label}</span><strong>${escHtml(t.card)}:</strong> ${escHtml(t.tip)}</div>`;
    });
    html += `</div></div>`;
  }

  // ── Checklist ─────────────────────────────────────────────────────────────
  html += `<div class="rewards-section-title">✅ Points Maximizer Checklist</div>`;
  html += `<div class="rewards-section-sub">Follow these steps to go from 0 to 100K+ points</div>`;
  html += `<div class="checklist-wrap">`;
  checklist.forEach((item, i) => {
    html += `<div class="checklist-item">
      <div class="checklist-num">${i + 1}</div>
      <div>${escHtml(item)}</div>
    </div>`;
  });
  html += `</div>`;

  // ── Blog articles ─────────────────────────────────────────────────────────
  html += `<div class="rewards-section-title">📖 Rewards Guides</div>`;
  html += `<div class="rewards-section-sub">Deep dives on strategy, hacks, and city-specific tips</div>`;
  for (let i = 0; i < blogs.length; i++) {
    const b = blogs[i];
    html += `<div class="blog-card" onclick="toggleBlogCard(${i})">
      <div class="blog-card-tag">${escHtml(b.tag)}</div>
      <div class="blog-card-title">${escHtml(b.title)}</div>
      <div class="blog-card-excerpt">${escHtml(b.excerpt)}</div>
      <div class="blog-card-expanded" id="blog-expanded-${i}">${b.body}</div>
    </div>`;
  }

  container.innerHTML = html;
}

function toggleBlogCard(index) {
  const el = document.getElementById(`blog-expanded-${index}`);
  if (el) el.classList.toggle('open');
}