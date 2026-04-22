/* ============================================================
   ai.js — AI Travel Assistant for planner.html
   Smart mode: keyword-based filtering of CITIES data (no key needed)
   AI mode: Groq API (llama-3.3-70b-versatile, free tier)
   ============================================================ */
'use strict';

/* ── State ──────────────────────────────────────────────────── */
let _aiOpen     = false;
let _aiHistory  = [];   // [{role, content}]
let _aiThinking = false;
const _AI_KEY_STORE = 'pinly_ai_key';

/* ── Bootstrap ──────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('pinly_ai_chat');
  if (saved) {
    try { _aiHistory = JSON.parse(saved).slice(-20); } catch(e) { _aiHistory = []; }
    if (_aiHistory.length) _aiRenderHistory();
  }
  _aiUpdateModeBadge();
});

const _BOLT_SVG = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`;

function _aiUpdateModeBadge() {
  const hasKey = !!localStorage.getItem(_AI_KEY_STORE);
  const badge  = document.getElementById('ai-mode-badge');
  const sub    = document.getElementById('ai-mode-text');
  if (badge) badge.innerHTML = hasKey ? `${_BOLT_SVG} AI` : `${_BOLT_SVG} Smart`;
  if (sub)   sub.textContent = hasKey ? 'AI mode · Groq LLM' : 'Smart mode · no key needed';
}

/* ── Panel open/close ───────────────────────────────────────── */
function openAI() {
  _aiOpen = true;
  document.getElementById('ai-panel').classList.add('open');
  document.getElementById('ai-fab').style.display = 'none';
  const input = document.getElementById('ai-input');
  if (input) setTimeout(() => input.focus(), 200);
  if (!_aiHistory.length) _aiGreet();
}

function closeAI() {
  _aiOpen = false;
  document.getElementById('ai-panel').classList.remove('open');
  document.getElementById('ai-fab').style.display = 'flex';
}

function toggleAI() { _aiOpen ? closeAI() : openAI(); }

/* ── Greeting ───────────────────────────────────────────────── */
function _aiGreet() {
  const city = _aiCurrentCity();
  const msg = city
    ? `Hey! 👋 I'm your AI travel assistant.\n\nYou're planning a trip to **${city.name}**. I can:\n• 🔍 Find the perfect spots for you\n• 📅 Build a day itinerary\n• 💡 Give personalized recommendations\n\nWhat are you looking for?`
    : `Hey! 👋 I'm your AI travel assistant.\n\nI can help you:\n• 🌍 Find the perfect destination\n• 🔍 Search spots by vibe or budget\n• 📅 Build a full itinerary\n\nCreate a trip first, or just ask me anything!`;
  _aiPushMessage('assistant', msg);
}

/* ── Send message ───────────────────────────────────────────── */
function aiPrompt(btn) {
  const input = document.getElementById('ai-input');
  if (input) { input.value = btn.innerText; input.focus(); }
}

async function aiSend() {
  const input = document.getElementById('ai-input');
  const text  = (input?.value || '').trim();
  if (!text || _aiThinking) return;
  input.value = '';
  const welcome = document.getElementById('ai-welcome');
  if (welcome) welcome.remove();
  _aiPushMessage('user', text);
  _aiThinking = true;
  _aiShowTyping();

  const key = localStorage.getItem(_AI_KEY_STORE);
  let reply;

  try {
    if (key) {
      reply = await _aiGroq(text, key);
    } else {
      reply = _aiSmart(text);
    }
  } catch(e) {
    console.warn('AI error:', e);
    reply = { text: `Hmm, hit a snag. ${e.message?.includes('401') ? 'Check your API key in settings.' : 'Try again in a moment.'}` };
  }

  _aiHideTyping();
  _aiThinking = false;

  if (reply.text)   _aiPushMessage('assistant', reply.text);
  if (reply.action) _aiExecute(reply.action);

  _aiSaveHistory();
}

function aiInputKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); aiSend(); }
}

/* ── Groq API ───────────────────────────────────────────────── */
async function _aiGroq(userText, key) {
  const city    = _aiCurrentCity();
  const tripCtx = _aiTripContext();
  const cityCtx = city ? _aiCityContext(city) : 'No city selected yet.';

  const system = `You are a smart, friendly AI travel assistant built into a travel planning app called Pinly. You have real-time access to curated data for 34 cities worldwide.

CURRENT TRIP: ${tripCtx}
CITY DATA: ${cityCtx}

Your job:
1. Answer travel questions conversationally — be concise, upbeat, Gen-Z friendly
2. When the user wants spots/food/activities: return a JSON action block
3. When the user wants to build an itinerary: return a build_itinerary action
4. When recommending cities: suggest from the 34 available

ACTION FORMAT (include in your response when taking action):
<action>{"type":"show_spots","items":[{"name":"...","type":"food|activity","price":0,"rating":0,"note":"..."}]}</action>
<action>{"type":"build_itinerary","days":[{"label":"Day 1 — Arrival","places":["spot name 1","spot name 2"]}]}</action>
<action>{"type":"recommend_cities","cities":["tokyo","paris","bali"],"reason":"..."}</action>
<action>{"type":"filter_discover","filter":"food|activities|free","vibe":"foodie|romantic|hidden-gem|outdoor|budget"}</action>

Keep responses under 150 words unless building an itinerary. Be specific — use actual place names from the city data. Use markdown bold for place names.`;

  const messages = [
    { role: 'system', content: system },
    ..._aiHistory.slice(-6).map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: userText },
  ];

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages, temperature: 0.7, max_tokens: 600 }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${res.status}`);
  }

  const data    = await res.json();
  const content = data.choices?.[0]?.message?.content || 'No response.';

  // Extract action block if present
  const actionMatch = content.match(/<action>([\s\S]*?)<\/action>/);
  const cleanText   = content.replace(/<action>[\s\S]*?<\/action>/g, '').trim();

  let action = null;
  if (actionMatch) {
    try { action = JSON.parse(actionMatch[1]); } catch(e) {}
  }

  return { text: cleanText || null, action };
}

/* ── Smart mode (no API key) ────────────────────────────────── */
function _aiSmart(text) {
  const q      = text.toLowerCase();
  const city   = _aiCurrentCity();
  const intent = _aiDetectIntent(q);

  if (intent === 'build_itinerary' && city) return _aiBuildItinerary(city, q);
  if (intent === 'find_food'  && city)      return _aiFindFood(city, q);
  if (intent === 'find_spots' && city)      return _aiFindSpots(city, q);
  if (intent === 'recommend_city')          return _aiRecommendCity(q);
  if (intent === 'budget')                  return _aiBudgetHelp(q);

  if (!city) return { text: "Create a trip first and I'll help you find the perfect spots! 🗺️\n\nOr ask me **\"Where should I go?\"** and I'll recommend a destination." };

  // fallback: general
  return { text: `I'm in smart mode (no API key set). I can still help with:\n\n• **"Find ramen under $20"**\n• **"Build me a 3-day itinerary"**\n• **"What are the best free things to do?"**\n• **"Recommend a foodie destination"**\n\n💡 Add a free Groq API key in settings for full AI responses.` };
}

function _aiDetectIntent(q) {
  if (/build|create|make|plan|itinerary|schedule|days?/.test(q)) return 'build_itinerary';
  if (/eat|food|restaurant|ramen|sushi|pizza|cafe|breakfast|lunch|dinner|cuisine/.test(q)) return 'find_food';
  if (/activity|do|see|visit|museum|hike|beach|park|tour|attraction/.test(q)) return 'find_spots';
  if (/where|city|destination|go to|travel to|recommend/.test(q)) return 'recommend_city';
  if (/budget|cheap|free|affordable|price|cost/.test(q)) return 'budget';
  return 'general';
}

function _aiFindFood(city, q) {
  let items = (city.food || []).filter(Boolean);
  // price filter
  if (/free|no cost/.test(q)) items = items.filter(i => i.price === 0);
  else if (/cheap|budget|under \$?20/.test(q)) items = items.filter(i => i.price < 20);
  else if (/mid|moderate/.test(q)) items = items.filter(i => i.price >= 15 && i.price <= 50);
  // cuisine filter
  const cuisines = ['ramen','sushi','pizza','tacos','korean','thai','vietnamese','italian','french','indian','chinese','japanese','mexican','american','seafood','bbq','vegan','vegetarian'];
  for (const c of cuisines) if (q.includes(c)) { items = items.filter(i => (i.cuisine||'').toLowerCase().includes(c) || (i.name||'').toLowerCase().includes(c)); break; }
  // sort by rating
  items = items.sort((a,b) => (b.rating||0)-(a.rating||0)).slice(0,6);
  if (!items.length) return { text: `Couldn't find that in ${city.name}'s food list. Try browsing the **Food** tab in Discover! 🍽️` };

  const list = items.map(i => `• **${i.name}** — ${i.price === 0 ? 'Free' : `$${i.price}`} · ⭐ ${i.rating} · ${i.cuisine||''}`).join('\n');
  return {
    text: `Here are the top picks in **${city.name}**:\n\n${list}`,
    action: { type: 'show_spots', items: items.slice(0,4).map(i => ({ name: i.name, type: 'food', price: i.price, rating: i.rating, note: i.cuisine || '' })) }
  };
}

function _aiFindSpots(city, q) {
  let items = (city.activities || []).filter(Boolean);
  if (/free/.test(q)) items = items.filter(i => i.price === 0);
  else if (/cheap|budget/.test(q)) items = items.filter(i => i.price < 20);
  if (/museum|art/.test(q)) items = items.filter(i => /(museum|art|gallery)/i.test(i.name + ' ' + (i.desc||'')));
  if (/hike|outdoor|nature|park/.test(q)) items = items.filter(i => /(park|hike|nature|trail|outdoor)/i.test(i.name + ' ' + (i.desc||'')));
  if (/beach/.test(q)) items = items.filter(i => /beach/i.test(i.name + ' ' + (i.desc||'')));
  items = items.sort((a,b) => (b.rating||0)-(a.rating||0)).slice(0,6);
  if (!items.length) return { text: `No matching activities found in ${city.name}. Browse the **Activities** tab to explore everything! 🎯` };
  const list = items.map(i => `• **${i.name}** — ${i.price === 0 ? 'Free' : `$${i.price}`} · ⭐ ${i.rating}`).join('\n');
  return {
    text: `Top activities in **${city.name}**:\n\n${list}`,
    action: { type: 'show_spots', items: items.slice(0,4).map(i => ({ name: i.name, type: 'activity', price: i.price, rating: i.rating, note: i.duration ? `${i.duration}h` : '' })) }
  };
}

function _aiBuildItinerary(city, q) {
  const daysMatch = q.match(/(\d+)\s*day/);
  const days = daysMatch ? Math.min(7, parseInt(daysMatch[1])) : 3;
  const activities = [...(city.activities||[])].filter(Boolean).sort((a,b) => (b.rating||0)-(a.rating||0)).slice(0, days * 3);
  const foods      = [...(city.food||[])].filter(Boolean).sort((a,b) => (b.rating||0)-(a.rating||0)).slice(0, days * 2);
  const itinDays = Array.from({ length: days }, (_, i) => {
    const acts = activities.slice(i*2, i*2+2).map(a => a.name);
    const food = foods[i] ? [foods[i].name] : [];
    return { label: `Day ${i+1}`, places: [...acts, ...food].filter(Boolean) };
  });
  const preview = itinDays.map(d => `**${d.label}:** ${d.places.join(' → ')}`).join('\n');
  return {
    text: `Here's a **${days}-day ${city.name} itinerary** based on top-rated spots:\n\n${preview}\n\n_Tap the ✓ button to add this to your planner!_`,
    action: { type: 'build_itinerary', days: itinDays }
  };
}

function _aiRecommendCity(q) {
  if (typeof CITIES === 'undefined') return { text: 'Data loading — try again in a moment.' };
  const vibeMap = {
    foodie:    ['tokyo','bangkok','rome','barcelona','neworleans','mexicocity'],
    romantic:  ['paris','amsterdam','lisbon','bali','rome','barcelona'],
    adventure: ['bali','sydney','denver','portland','seattle','hawaii'],
    budget:    ['bangkok','bali','lisbon','mexicocity','seoul','austin'],
    luxury:    ['dubai','paris','singapore','nyc','miami','losangeles'],
    culture:   ['tokyo','rome','paris','athens','istanbul','kyoto'],
    beach:     ['miami','bali','hawaii','singapore','barcelona','dubai'],
    nature:    ['hawaii','denver','portland','seattle','bali','sydney'],
  };
  let ids = [];
  for (const [vibe, cities] of Object.entries(vibeMap)) {
    if (q.includes(vibe)) { ids = cities; break; }
  }
  if (!ids.length) {
    const cheap = /cheap|budget/.test(q);
    const warm  = /warm|beach|sun/.test(q);
    ids = cheap && warm ? ['bali','bangkok','mexicocity'] : cheap ? ['lisbon','seoul','austin'] : warm ? ['miami','barcelona','dubai'] : ['tokyo','paris','bali'];
  }
  const matches = CITIES.filter(c => ids.includes(c.id)).slice(0,3);
  const list = matches.map(c => `• **${c.name}** — ${c.country}`).join('\n');
  return {
    text: `Based on what you're after, I'd recommend:\n\n${list}\n\nCreate a trip to any of these and I'll help you plan it!`,
    action: { type: 'recommend_cities', cities: matches.map(c => c.id) }
  };
}

function _aiBudgetHelp(q) {
  const city = _aiCurrentCity();
  if (!city) return { text: 'Create a trip first and I can give you budget tips for your specific destination! 💰' };
  const freeItems = [...(city.activities||[]), ...(city.food||[])].filter(i => i && i.price === 0);
  const cheapItems = [...(city.activities||[]), ...(city.food||[])].filter(i => i && i.price > 0 && i.price < 15).sort((a,b) => (b.rating||0)-(a.rating||0));
  const tips = [];
  if (freeItems.length) tips.push(`✨ **${freeItems.length} free things** to do in ${city.name}`);
  if (cheapItems.length) tips.push(`💸 **Top cheap picks:** ${cheapItems.slice(0,3).map(i => i.name).join(', ')}`);
  return { text: `Budget tips for **${city.name}**:\n\n${tips.join('\n')}\n\nFilter Discover by **"Free"** or **"Budget"** to see all options!`, action: { type: 'filter_discover', filter: 'free' } };
}

/* ── Execute actions ────────────────────────────────────────── */
function _aiExecute(action) {
  if (!action?.type) return;

  if (action.type === 'show_spots') {
    _aiShowSpotCards(action.items || []);
  }

  if (action.type === 'build_itinerary' && action.days?.length) {
    _aiShowItineraryPreview(action.days);
  }

  if (action.type === 'filter_discover') {
    if (action.filter) setDiscoverFilter(action.filter);
    if (action.vibe)   setDiscoverVibe(action.vibe);
    switchTab('discover');
    _aiPushMessage('assistant', '↗️ Switched to Discover with your filter applied!');
  }

  if (action.type === 'recommend_cities' && action.cities?.length) {
    _aiShowCityChips(action.cities);
  }
}

function _aiShowSpotCards(items) {
  if (!items.length) return;
  const html = `<div class="ai-spot-cards">${items.map(item => `
    <div class="ai-spot-card" onclick="aiAddSpot('${jsq(item.name)}','${jsq(item.type||'activity')}')">
      <div class="ai-spot-name">${esc(item.name)}</div>
      <div class="ai-spot-meta">${item.price === 0 ? '✨ Free' : item.price ? `$${item.price}` : ''} ${item.rating ? `· ⭐${item.rating}` : ''} ${item.note ? `· ${esc(item.note)}` : ''}</div>
      <div class="ai-spot-add">+ Add to planner</div>
    </div>`).join('')}
  </div>`;
  _aiAppendRaw(html);
}

function _aiShowItineraryPreview(days) {
  const id = `ai-itin-${Date.now()}`;
  const html = `<div class="ai-itin-preview" id="${id}">
    ${days.map((d,i) => `<div class="ai-itin-day"><span class="ai-itin-day-label">${esc(d.label||`Day ${i+1}`)}</span><span class="ai-itin-places">${d.places.map(p => esc(p)).join(' · ')}</span></div>`).join('')}
    <button class="ai-itin-apply" onclick="aiApplyItinerary('${id}')">✓ Add to my itinerary</button>
  </div>`;
  _aiAppendRaw(html);
  // store data for apply
  document.getElementById(id)._days = days;
}

function _aiShowCityChips(cityIds) {
  if (typeof CITIES === 'undefined') return;
  const cities = CITIES.filter(c => cityIds.includes(c.id));
  if (!cities.length) return;
  const html = `<div class="ai-city-chips">${cities.map(c => `<button class="ai-city-chip" onclick="aiPickCity('${jsq(c.id)}')">${esc(c.name)}</button>`).join('')}</div>`;
  _aiAppendRaw(html);
}

/* ── Action handlers called from AI cards ───────────────────── */
function aiAddSpot(name, type) {
  if (!currentTrip) { openNewTripModal(); return; }
  const city   = _aiCurrentCity();
  const source = type === 'food' ? (city?.food||[]) : (city?.activities||[]);
  const item   = source.find(i => i && i.name === name);
  if (!item) { showToast(`Couldn't find "${name}" in your trip data`); return; }
  const save = {
    id: crypto.randomUUID(), name: item.name, type,
    price: item.price, rating: item.rating,
    photo: item.photo || null, desc: item.desc || '',
    cityId: currentTrip.cityId, cityName: city?.name || '',
    tip: item.tip || '', cuisine: item.cuisine || '',
    duration: item.duration || null,
  };
  const d = getStore();
  const t = d.trips.find(x => x.id === currentTrip.id);
  if (!t) return;
  if (!t.saves) t.saves = [];
  if (t.saves.find(s => s.name === name)) { showToast(`${name} already saved!`); return; }
  t.saves.push(save);
  currentTrip = t;
  saveStore(d);
  renderAll();
  showToast(`✓ ${name} saved!`);
}

function aiApplyItinerary(previewId) {
  const el = document.getElementById(previewId);
  if (!el || !el._days) return;
  if (!currentTrip) { openNewTripModal(); return; }
  const days  = el._days;
  const city  = _aiCurrentCity();
  const allItems = [...(city?.activities||[]), ...(city?.food||[])].filter(Boolean);
  const d     = getStore();
  const t     = d.trips.find(x => x.id === currentTrip.id);
  if (!t) return;
  // Ensure enough days
  while (t.days.length < days.length) {
    t.days.push({ id: crypto.randomUUID(), num: t.days.length + 1, cards: [] });
  }
  days.forEach((day, i) => {
    const tripDay = t.days[i];
    if (!tripDay) return;
    (day.places || []).forEach(placeName => {
      const item = allItems.find(it => it.name === placeName);
      if (!item) return;
      const type = city?.activities?.includes(item) ? 'activity' : 'food';
      if (tripDay.cards.find(c => c.name === placeName)) return;
      tripDay.cards.push({
        id: crypto.randomUUID(), name: item.name, type,
        price: item.price, rating: item.rating,
        photo: item.photo || null, cityId: t.cityId,
        cityName: city?.name || '', fromSave: false,
      });
    });
  });
  currentTrip = t;
  saveStore(d);
  renderAll();
  switchTab('itinerary');
  closeAI();
  showToast('🗓 Itinerary added!');
}

function aiPickCity(cityId) {
  if (typeof CITIES === 'undefined') return;
  const city = CITIES.find(c => c.id === cityId);
  if (!city) return;
  _aiPushMessage('assistant', `Great choice! **${city.name}** is amazing. Create a trip there and I'll help you plan every detail. 🌍`);
  openNewTripModal();
  const sel = document.getElementById('nt-city');
  if (sel) sel.value = cityId;
}

/* ── Settings: API key ──────────────────────────────────────── */
function openAISettings() {
  document.getElementById('ai-settings').classList.toggle('open');
  const inp = document.getElementById('ai-key-input');
  if (inp) inp.value = localStorage.getItem(_AI_KEY_STORE) || '';
}

function saveAIKey() {
  const key = document.getElementById('ai-key-input').value.trim();
  if (key) localStorage.setItem(_AI_KEY_STORE, key);
  else localStorage.removeItem(_AI_KEY_STORE);
  _aiUpdateModeBadge();
  document.getElementById('ai-settings').classList.remove('open');
  showToast(key ? '🔑 API key saved — AI mode enabled!' : '🔓 API key removed — smart mode active');
  _aiHistory = [];
  _aiRenderHistory();
  _aiGreet();
  _aiSaveHistory();
}

function clearAIChat() {
  _aiHistory = [];
  localStorage.removeItem('pinly_ai_chat');
  _aiRenderHistory();
  _aiGreet();
}

/* ── Helpers ────────────────────────────────────────────────── */
function _aiCurrentCity() {
  if (typeof CITIES === 'undefined' || !currentTrip?.cityId) return null;
  return CITIES.find(c => c.id === currentTrip.cityId) || null;
}

function _aiTripContext() {
  if (!currentTrip) return 'No active trip.';
  return `Trip: "${currentTrip.name}", City: ${currentTrip.cityId}, Days: ${currentTrip.days?.length || 0}, Saves: ${currentTrip.saves?.length || 0}`;
}

function _aiCityContext(city) {
  const topFood  = [...(city.food||[])].filter(Boolean).sort((a,b) => (b.rating||0)-(a.rating||0)).slice(0,12);
  const topActs  = [...(city.activities||[])].filter(Boolean).sort((a,b) => (b.rating||0)-(a.rating||0)).slice(0,12);
  const fmtFood  = topFood.map(i  => `${i.name}($${i.price},⭐${i.rating},${i.cuisine||''})`).join('; ');
  const fmtActs  = topActs.map(i  => `${i.name}($${i.price},⭐${i.rating})`).join('; ');
  return `City: ${city.name}, ${city.country}. Top food: ${fmtFood}. Top activities: ${fmtActs}.`;
}

function _aiPushMessage(role, content) {
  _aiHistory.push({ role, content });
  _aiRenderMessage(role, content);
}

function _aiRenderMessage(role, content) {
  const feed = document.getElementById('ai-feed');
  if (!feed) return;
  const div  = document.createElement('div');
  div.className = `ai-msg ai-msg-${role}`;
  div.innerHTML = `<div class="ai-bubble">${_aiMarkdown(esc(content))}</div>`;
  feed.appendChild(div);
  feed.scrollTop = feed.scrollHeight;
}

function _aiAppendRaw(html) {
  const feed = document.getElementById('ai-feed');
  if (!feed) return;
  const div  = document.createElement('div');
  div.className = 'ai-msg ai-msg-cards';
  div.innerHTML  = html;
  feed.appendChild(div);
  feed.scrollTop = feed.scrollHeight;
}

function _aiRenderHistory() {
  const feed = document.getElementById('ai-feed');
  if (!feed) return;
  feed.innerHTML = '';
  _aiHistory.forEach(m => _aiRenderMessage(m.role, m.content));
}

function _aiShowTyping() {
  const feed = document.getElementById('ai-feed');
  if (!feed) return;
  const div = document.createElement('div');
  div.id = 'ai-typing'; div.className = 'ai-msg ai-msg-assistant';
  div.innerHTML = '<div class="ai-bubble ai-typing-bubble"><span></span><span></span><span></span></div>';
  feed.appendChild(div);
  feed.scrollTop = feed.scrollHeight;
}

function _aiHideTyping() {
  document.getElementById('ai-typing')?.remove();
}

function _aiMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

function _aiSaveHistory() {
  try { localStorage.setItem('pinly_ai_chat', JSON.stringify(_aiHistory.slice(-20))); } catch(e) {}
}
