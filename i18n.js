/* ── Home page i18n ── */
(function() {
  const LANGS = [
    { code:'en', native:'English',    flag:'🇺🇸', rtl:false },
    { code:'es', native:'Español',    flag:'🇪🇸', rtl:false },
    { code:'fr', native:'Français',   flag:'🇫🇷', rtl:false },
    { code:'ja', native:'日本語',      flag:'🇯🇵', rtl:false },
    { code:'ko', native:'한국어',      flag:'🇰🇷', rtl:false },
    { code:'zh', native:'中文',        flag:'🇨🇳', rtl:false },
    { code:'pt', native:'Português',  flag:'🇧🇷', rtl:false },
    { code:'ar', native:'العربية',    flag:'🇸🇦', rtl:true  },
    { code:'hi', native:'हिन्दी',     flag:'🇮🇳', rtl:false },
    { code:'vi', native:'Tiếng Việt', flag:'🇻🇳', rtl:false },
    { code:'tl', native:'Filipino',   flag:'🇵🇭', rtl:false },
  ];

  const TR = {
    en: {
      navExplore:'Explore', navPlanner:'Planner', navDeals:'Deals',
      navLogin:'Log In', navSignup:'Sign Up',
      heroEyebrow:'Your World. Your Rules. Your Trip.',
      heroTitle1:'Stop dreaming.', heroTitle2:'Start going.',
      heroSub:'Handpicked destinations. Effortless itineraries. Your crew, in sync — all in one place.',
      heroCTA1:'Explore Destinations →', heroCTA2:'Open Planner',
      heroSearch:'Search a destination…', heroSearchBtn:'Search',
      citiesTitle:'Explore Destinations', citiesSub:'50+ cities. Infinite memories. Your next chapter starts here.',
      regionAll:'🌍 All', regionUSA:'USA', regionIntl:'✈ International',
      groupTitle:'Group Trip Board', groupSub:'Vote on ideas with your travel crew in real time',
      modeSolo:'🗓 Solo Planner', modeGroup:'👥 Group Board',
      emptyTrip:'Create a trip to start planning your days', btnNewTrip:'+ New Trip',
      dealsTitle:'Find Deals', dealsSub:'Search flights, cars, and hotels — compare across platforms',
      dealsFlights:'✈ Flights', dealsCars:'🚗 Rental Cars', dealsBudget:'💰 Trip Budget Estimator',
    },
    es: {
      navExplore:'Explorar', navPlanner:'Planificador', navDeals:'Ofertas',
      navLogin:'Iniciar sesión', navSignup:'Registrarse',
      heroEyebrow:'Planifica mejor. Viaja mejor.',
      heroTitle1:'¿A dónde irás', heroTitle2:'después?',
      heroSub:'Descubre destinos, crea itinerarios día a día y planifica viajes con amigos — todo en un solo lugar.',
      heroCTA1:'Explorar destinos →', heroCTA2:'Abrir Planificador',
      heroSearch:'Busca un destino…', heroSearchBtn:'Buscar',
      citiesTitle:'Explorar Destinos', citiesSub:'Toca una ciudad para ver actividades, comida, transporte y ofertas',
      regionAll:'🌍 Todos', regionUSA:'🇺🇸 EE.UU.', regionIntl:'✈ Internacional',
      groupTitle:'Tablero de Viaje Grupal', groupSub:'Vota ideas con tu grupo de viaje en tiempo real',
      modeSolo:'🗓 Planificador Solo', modeGroup:'👥 Tablero Grupal',
      emptyTrip:'Crea un viaje para empezar a planificar', btnNewTrip:'+ Nuevo Viaje',
      dealsTitle:'Buscar Ofertas', dealsSub:'Busca vuelos, autos y hoteles — compara plataformas',
      dealsFlights:'✈ Vuelos', dealsCars:'🚗 Autos de Alquiler', dealsBudget:'💰 Estimador de Presupuesto',
    },
    fr: {
      navExplore:'Explorer', navPlanner:'Planificateur', navDeals:'Offres',
      navLogin:'Se connecter', navSignup:"S'inscrire",
      heroEyebrow:'Planifiez mieux. Voyagez mieux.',
      heroTitle1:'Où irez-vous', heroTitle2:'ensuite ?',
      heroSub:"Découvrez des destinations, créez des itinéraires jour par jour et planifiez des voyages avec des amis — tout en un.",
      heroCTA1:'Explorer les destinations →', heroCTA2:'Ouvrir le Planificateur',
      heroSearch:'Chercher une destination…', heroSearchBtn:'Rechercher',
      citiesTitle:'Explorer les Destinations', citiesSub:'Appuyez sur une ville pour voir activités, nourriture et transports',
      regionAll:'🌍 Tout', regionUSA:'🇺🇸 États-Unis', regionIntl:'✈ International',
      groupTitle:'Tableau de Voyage Groupe', groupSub:'Votez pour des idées avec votre groupe en temps réel',
      modeSolo:'🗓 Planificateur Solo', modeGroup:'👥 Tableau Groupe',
      emptyTrip:'Créez un voyage pour commencer à planifier', btnNewTrip:'+ Nouveau Voyage',
      dealsTitle:'Trouver des Offres', dealsSub:'Recherchez vols, voitures et hôtels — comparez les plateformes',
      dealsFlights:'✈ Vols', dealsCars:'🚗 Location de Voitures', dealsBudget:'💰 Estimateur de Budget',
    },
    ja: {
      navExplore:'探索', navPlanner:'プランナー', navDeals:'お得情報',
      navLogin:'ログイン', navSignup:'新規登録',
      heroEyebrow:'賢く計画。よりよく旅する。',
      heroTitle1:'次の旅先は', heroTitle2:'どこですか？',
      heroSub:'目的地を発見し、日程を組み、友達と一緒に旅行を計画 — すべてひとつの場所で。',
      heroCTA1:'目的地を探す →', heroCTA2:'プランナーを開く',
      heroSearch:'目的地を検索…', heroSearchBtn:'検索',
      citiesTitle:'目的地を探す', citiesSub:'都市をタップしてアクティビティ、グルメ、交通情報を確認',
      regionAll:'🌍 すべて', regionUSA:'🇺🇸 アメリカ', regionIntl:'✈ 海外',
      groupTitle:'グループ旅行ボード', groupSub:'リアルタイムでグループとアイデアを共有',
      modeSolo:'🗓 ソロプランナー', modeGroup:'👥 グループボード',
      emptyTrip:'旅行を作成して計画を始めよう', btnNewTrip:'+ 新しい旅',
      dealsTitle:'お得情報を探す', dealsSub:'フライト、車、ホテルを検索 — プラットフォームを比較',
      dealsFlights:'✈ フライト', dealsCars:'🚗 レンタカー', dealsBudget:'💰 旅行費用見積もり',
    },
    ko: {
      navExplore:'탐색', navPlanner:'플래너', navDeals:'할인',
      navLogin:'로그인', navSignup:'회원가입',
      heroEyebrow:'더 스마트하게 계획. 더 멋지게 여행.',
      heroTitle1:'다음 여행지는', heroTitle2:'어디인가요?',
      heroSub:'목적지를 발견하고, 일별 일정을 만들고, 친구들과 여행을 계획하세요 — 모두 한 곳에서.',
      heroCTA1:'목적지 탐색 →', heroCTA2:'플래너 열기',
      heroSearch:'목적지 검색…', heroSearchBtn:'검색',
      citiesTitle:'목적지 탐색', citiesSub:'도시를 탭하여 액티비티, 음식, 교통 정보 확인',
      regionAll:'🌍 전체', regionUSA:'🇺🇸 미국', regionIntl:'✈ 해외',
      groupTitle:'그룹 여행 보드', groupSub:'실시간으로 여행 그룹과 아이디어를 투표',
      modeSolo:'🗓 솔로 플래너', modeGroup:'👥 그룹 보드',
      emptyTrip:'여행을 만들어 계획을 시작하세요', btnNewTrip:'+ 새 여행',
      dealsTitle:'할인 찾기', dealsSub:'항공, 차량, 호텔 검색 — 플랫폼 비교',
      dealsFlights:'✈ 항공편', dealsCars:'🚗 렌터카', dealsBudget:'💰 여행 예산 계산기',
    },
    zh: {
      navExplore:'探索', navPlanner:'行程规划', navDeals:'优惠',
      navLogin:'登录', navSignup:'注册',
      heroEyebrow:'更智慧地计划。更美好地旅行。',
      heroTitle1:'你的下一站', heroTitle2:'是哪里？',
      heroSub:'发现目的地，制定每日行程，与朋友一起规划旅行 — 一切尽在此处。',
      heroCTA1:'探索目的地 →', heroCTA2:'打开行程规划',
      heroSearch:'搜索目的地…', heroSearchBtn:'搜索',
      citiesTitle:'探索目的地', citiesSub:'点击城市查看活动、美食、交通和优惠',
      regionAll:'🌍 全部', regionUSA:'🇺🇸 美国', regionIntl:'✈ 国际',
      groupTitle:'团队旅行看板', groupSub:'与旅行团队实时投票分享想法',
      modeSolo:'🗓 个人规划', modeGroup:'👥 团队看板',
      emptyTrip:'创建旅行以开始规划', btnNewTrip:'+ 新旅行',
      dealsTitle:'查找优惠', dealsSub:'搜索机票、租车和酒店 — 跨平台比较',
      dealsFlights:'✈ 机票', dealsCars:'🚗 租车', dealsBudget:'💰 旅行预算估算',
    },
    pt: {
      navExplore:'Explorar', navPlanner:'Planejador', navDeals:'Ofertas',
      navLogin:'Entrar', navSignup:'Cadastrar',
      heroEyebrow:'Planeje melhor. Viaje melhor.',
      heroTitle1:'Para onde você vai', heroTitle2:'a seguir?',
      heroSub:'Descubra destinos, crie roteiros dia a dia e planeje viagens com amigos — tudo em um só lugar.',
      heroCTA1:'Explorar Destinos →', heroCTA2:'Abrir Planejador',
      heroSearch:'Buscar um destino…', heroSearchBtn:'Buscar',
      citiesTitle:'Explorar Destinos', citiesSub:'Toque em uma cidade para ver atividades, comida, transporte e ofertas',
      regionAll:'🌍 Todos', regionUSA:'🇺🇸 EUA', regionIntl:'✈ Internacional',
      groupTitle:'Quadro de Viagem em Grupo', groupSub:'Vote em ideias com seu grupo em tempo real',
      modeSolo:'🗓 Planejador Solo', modeGroup:'👥 Quadro em Grupo',
      emptyTrip:'Crie uma viagem para começar a planejar', btnNewTrip:'+ Nova Viagem',
      dealsTitle:'Encontrar Ofertas', dealsSub:'Busque voos, carros e hotéis — compare plataformas',
      dealsFlights:'✈ Voos', dealsCars:'🚗 Aluguel de Carros', dealsBudget:'💰 Estimador de Orçamento',
    },
    ar: {
      navExplore:'استكشف', navPlanner:'المخطط', navDeals:'العروض',
      navLogin:'تسجيل الدخول', navSignup:'إنشاء حساب',
      heroEyebrow:'خطط بذكاء. سافر بشكل أفضل.',
      heroTitle1:'إلى أين ستذهب', heroTitle2:'في رحلتك القادمة؟',
      heroSub:'اكتشف الوجهات، وأنشئ جداول يومية، وخطط للرحلات مع الأصدقاء — كل ذلك في مكان واحد.',
      heroCTA1:'استكشف الوجهات ←', heroCTA2:'فتح المخطط',
      heroSearch:'ابحث عن وجهة…', heroSearchBtn:'بحث',
      citiesTitle:'استكشف الوجهات', citiesSub:'اضغط على مدينة لاستعراض الأنشطة والطعام والنقل والعروض',
      regionAll:'🌍 الكل', regionUSA:'🇺🇸 أمريكا', regionIntl:'✈ دولي',
      groupTitle:'لوحة الرحلة الجماعية', groupSub:'صوّت على الأفكار مع مجموعتك في الوقت الفعلي',
      modeSolo:'🗓 مخطط فردي', modeGroup:'👥 لوحة جماعية',
      emptyTrip:'أنشئ رحلة لبدء التخطيط', btnNewTrip:'+ رحلة جديدة',
      dealsTitle:'ابحث عن العروض', dealsSub:'ابحث عن رحلات وسيارات وفنادق — قارن عبر المنصات',
      dealsFlights:'✈ الرحلات الجوية', dealsCars:'🚗 تأجير السيارات', dealsBudget:'💰 تقدير ميزانية الرحلة',
    },
    hi: {
      navExplore:'खोजें', navPlanner:'योजनाकार', navDeals:'डील्स',
      navLogin:'लॉग इन', navSignup:'साइन अप',
      heroEyebrow:'समझदारी से योजना बनाएं। बेहतर यात्रा करें।',
      heroTitle1:'आपकी अगली यात्रा', heroTitle2:'कहाँ होगी?',
      heroSub:'गंतव्य खोजें, दिन-दर-दिन यात्रा कार्यक्रम बनाएं, और दोस्तों के साथ यात्राएं योजना बनाएं — सब एक जगह।',
      heroCTA1:'गंतव्य खोजें →', heroCTA2:'योजनाकार खोलें',
      heroSearch:'गंतव्य खोजें…', heroSearchBtn:'खोजें',
      citiesTitle:'गंतव्य खोजें', citiesSub:'गतिविधियाँ, खाना, परिवहन और डील्स देखने के लिए किसी शहर पर टैप करें',
      regionAll:'🌍 सभी', regionUSA:'🇺🇸 अमेरिका', regionIntl:'✈ अंतर्राष्ट्रीय',
      groupTitle:'ग्रुप ट्रिप बोर्ड', groupSub:'अपने यात्रा समूह के साथ रीयल टाइम में विचारों पर वोट करें',
      modeSolo:'🗓 सोलो प्लानर', modeGroup:'👥 ग्रुप बोर्ड',
      emptyTrip:'योजना शुरू करने के लिए एक यात्रा बनाएं', btnNewTrip:'+ नई यात्रा',
      dealsTitle:'डील्स खोजें', dealsSub:'फ्लाइट, कार और होटल खोजें — प्लेटफार्मों की तुलना करें',
      dealsFlights:'✈ उड़ानें', dealsCars:'🚗 किराए की कार', dealsBudget:'💰 यात्रा बजट अनुमानक',
    },
    vi: {
      navExplore:'Khám phá', navPlanner:'Lập kế hoạch', navDeals:'Ưu đãi',
      navLogin:'Đăng nhập', navSignup:'Đăng ký',
      heroEyebrow:'Lập kế hoạch thông minh hơn. Du lịch tốt hơn.',
      heroTitle1:'Bạn sẽ đến', heroTitle2:'nơi nào tiếp theo?',
      heroSub:'Khám phá điểm đến, xây dựng lịch trình từng ngày, và lên kế hoạch du lịch cùng bạn bè — tất cả trong một nơi.',
      heroCTA1:'Khám phá điểm đến →', heroCTA2:'Mở Lịch trình',
      heroSearch:'Tìm kiếm điểm đến…', heroSearchBtn:'Tìm kiếm',
      citiesTitle:'Khám phá Điểm đến', citiesSub:'Nhấn vào thành phố để xem hoạt động, ẩm thực, giao thông và ưu đãi',
      regionAll:'🌍 Tất cả', regionUSA:'🇺🇸 Mỹ', regionIntl:'✈ Quốc tế',
      groupTitle:'Bảng Kế hoạch Nhóm', groupSub:'Bình chọn ý tưởng với nhóm du lịch của bạn theo thời gian thực',
      modeSolo:'🗓 Kế hoạch Cá nhân', modeGroup:'👥 Bảng Nhóm',
      emptyTrip:'Tạo chuyến đi để bắt đầu lập kế hoạch', btnNewTrip:'+ Chuyến mới',
      dealsTitle:'Tìm Ưu đãi', dealsSub:'Tìm kiếm chuyến bay, xe hơi và khách sạn — so sánh các nền tảng',
      dealsFlights:'✈ Chuyến bay', dealsCars:'🚗 Thuê xe', dealsBudget:'💰 Ước tính Ngân sách',
    },
    tl: {
      navExplore:'I-explore', navPlanner:'Planner', navDeals:'Mga Deal',
      navLogin:'Mag-log in', navSignup:'Mag-sign up',
      heroEyebrow:'Mag-plano nang mas matalino. Maglakbay nang mas mabuti.',
      heroTitle1:'Saan ka pupunta', heroTitle2:'sa susunod?',
      heroSub:'Tuklasin ang mga destinasyon, bumuo ng day-by-day na itinerary, at mag-plano ng mga biyahe kasama ang mga kaibigan — lahat sa isang lugar.',
      heroCTA1:'I-explore ang mga Destinasyon →', heroCTA2:'Buksan ang Planner',
      heroSearch:'Maghanap ng destinasyon…', heroSearchBtn:'Hanapin',
      citiesTitle:'I-explore ang mga Destinasyon', citiesSub:'I-tap ang lungsod para makita ang mga aktibidad, pagkain, transportasyon at deal',
      regionAll:'🌍 Lahat', regionUSA:'🇺🇸 USA', regionIntl:'✈ International',
      groupTitle:'Group Trip Board', groupSub:'Bumoto para sa mga ideya kasama ang iyong grupo sa real time',
      modeSolo:'🗓 Solo Planner', modeGroup:'👥 Group Board',
      emptyTrip:'Gumawa ng biyahe para magsimulang mag-plano', btnNewTrip:'+ Bagong Biyahe',
      dealsTitle:'Maghanap ng mga Deal', dealsSub:'Maghanap ng mga flight, sasakyan, at hotel — ikumpara sa mga platform',
      dealsFlights:'✈ Mga Flight', dealsCars:'🚗 Rental na Sasakyan', dealsBudget:'💰 Tagaestima ng Badyet',
    },
  };

  function cur() { return localStorage.getItem('dropped_lang') || 'en'; }
  function t(key) { const d = TR[cur()] || TR.en; return d[key] ?? TR.en[key] ?? key; }

  function applyTranslations() {
    const code = cur();
    const lang = LANGS.find(l => l.code === code);
    document.documentElement.dir  = lang?.rtl ? 'rtl' : 'ltr';
    document.documentElement.lang = code;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = t(el.dataset.i18nPlaceholder);
    });
  }

  function renderMenu() {
    const menu = document.getElementById('home-lang-menu');
    if (!menu) return;
    const code = cur();
    menu.innerHTML = LANGS.map(l =>
      `<button class="lang-opt${l.code === code ? ' active' : ''}" onclick="homeLangSet('${l.code}')">
        <span class="lang-opt-flag">${l.flag}</span>
        <span class="lang-opt-name">${l.native}</span>
      </button>`
    ).join('');
  }

  window.toggleHomeLang = function() {
    document.getElementById('home-lang-menu').classList.toggle('open');
  };

  window.homeLangSet = function(code) {
    localStorage.setItem('dropped_lang', code);
    document.getElementById('home-lang-menu').classList.remove('open');
    renderMenu();
    applyTranslations();
  };

  document.addEventListener('click', function(e) {
    const wrap = document.getElementById('home-lang-wrap');
    if (wrap && !wrap.contains(e.target)) {
      document.getElementById('home-lang-menu')?.classList.remove('open');
    }
  });

  document.addEventListener('DOMContentLoaded', function() {
    renderMenu();
    applyTranslations();
  });
})();
