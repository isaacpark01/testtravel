/* ============================================================
   group.js — Group Board feature for planner.html
   Uses: esc() / jsq() / showToast() from planner.js
         SUPABASE_URL / SUPABASE_KEY from config.js
         CITIES from data.js
   ============================================================ */

/* ── Supabase init ─────────────────────────────────────────── */
let _grpClient = null;
let _grpUser   = null;
let _grpProfile = null;
let _grpBoard  = null;
let _grpChannel = null;

const _GRP_CONFIGURED = typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL !== 'YOUR_SUPABASE_URL';

try {
  if (_GRP_CONFIGURED && window.supabase) {
    _grpClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }
} catch (e) {
  console.warn('Group board: Supabase failed to init:', e.message);
}

/* ── Bootstrap on DOMContentLoaded ────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  _grpPopulateCitySelect();

  if (_GRP_CONFIGURED && _grpClient) {
    const { data: { session } } = await _grpClient.auth.getSession();
    if (session) await _grpHandleSession(session);
    _grpClient.auth.onAuthStateChange(async (_event, session) => {
      if (session) await _grpHandleSession(session);
      else _grpHandleSignOut();
    });
    _grpCheckURLForBoard();
  } else {
    _grpShowBoardUI('notice');
  }

  // If planner opened with ?tab=group, switch to it
  const _grpParams = new URLSearchParams(window.location.search);
  if (_grpParams.get('tab') === 'group') {
    switchTab('group');
    const cityParam = _grpParams.get('city');
    if (cityParam) {
      const sel = document.getElementById('grp-idea-city');
      if (sel) sel.value = cityParam;
    }
  }
});

/* ── Auth ──────────────────────────────────────────────────── */
function openGroupAuth(view) {
  document.getElementById('grp-auth-modal').classList.remove('hidden');
  _grpSwitchAuth(view || 'login');
}
function closeGroupAuth() { document.getElementById('grp-auth-modal').classList.add('hidden'); }
function _grpSwitchAuth(view) {
  ['login','signup','forgot','success'].forEach(v =>
    document.getElementById(`grp-auth-${v}`).classList.toggle('hidden', v !== view));
}

async function grpSignIn() {
  const email = document.getElementById('grp-login-email').value.trim();
  const pass  = document.getElementById('grp-login-pass').value;
  const err   = document.getElementById('grp-login-error');
  err.classList.add('hidden');
  if (!_grpClient) { err.textContent = 'Auth not configured.'; err.classList.remove('hidden'); return; }
  const { error } = await _grpClient.auth.signInWithPassword({ email, password: pass });
  if (error) { err.textContent = error.message; err.classList.remove('hidden'); return; }
  _grpAuthSuccess('Welcome back!');
}

async function grpSignUp() {
  const name  = document.getElementById('grp-signup-name').value.trim();
  const email = document.getElementById('grp-signup-email').value.trim();
  const pass  = document.getElementById('grp-signup-pass').value;
  const err   = document.getElementById('grp-signup-error');
  err.classList.add('hidden');
  if (!name)         { err.textContent = 'Enter a display name.'; err.classList.remove('hidden'); return; }
  if (!email)        { err.textContent = 'Enter your email.';     err.classList.remove('hidden'); return; }
  if (pass.length < 6) { err.textContent = 'Password must be 6+ characters.'; err.classList.remove('hidden'); return; }
  if (!_grpClient)   { err.textContent = 'Auth not configured.'; err.classList.remove('hidden'); return; }
  const { data, error } = await _grpClient.auth.signUp({ email, password: pass, options: { data: { username: name } } });
  if (error) { err.textContent = error.message; err.classList.remove('hidden'); return; }
  _grpAuthSuccess(data.session ? `Welcome, ${name}!` : `Check ${email} for a confirmation link.`);
}

async function grpSignOut() {
  if (_grpClient) await _grpClient.auth.signOut();
  _grpHandleSignOut();
  closeGrpProfile();
}

async function grpSendReset() {
  const email = document.getElementById('grp-forgot-email').value.trim();
  const err   = document.getElementById('grp-forgot-error');
  const ok    = document.getElementById('grp-forgot-ok');
  err.classList.add('hidden'); ok.classList.add('hidden');
  if (!email) { err.textContent = 'Enter your email.'; err.classList.remove('hidden'); return; }
  if (!_grpClient) { err.textContent = 'Auth not configured.'; err.classList.remove('hidden'); return; }
  const { error } = await _grpClient.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/reset-password.html',
  });
  if (error) { err.textContent = error.message; err.classList.remove('hidden'); return; }
  ok.classList.remove('hidden');
}

function _grpAuthSuccess(msg) {
  _grpSwitchAuth('success');
  document.getElementById('grp-auth-success-msg').textContent = msg;
  setTimeout(() => closeGroupAuth(), 2200);
}

async function _grpHandleSession(session) {
  _grpUser = session.user;
  const { data: profile } = await _grpClient.from('profiles').select('*').eq('id', _grpUser.id).single();
  _grpProfile = profile;
  _grpUpdateUserBar(true);
  _grpShowBoardUI('board');
  _grpLoadUserBoards();
}

function _grpHandleSignOut() {
  _grpUser = null; _grpProfile = null; _grpBoard = null;
  if (_grpChannel) { _grpClient.removeChannel(_grpChannel); _grpChannel = null; }
  _grpUpdateUserBar(false);
  _grpShowBoardUI('login');
}

function _grpUpdateUserBar(loggedIn) {
  const bar = document.getElementById('grp-user-bar');
  if (!bar) return;
  if (loggedIn && _grpProfile) {
    bar.innerHTML = `
      <span style="font-size:13px;color:rgba(240,250,249,.5)">Signed in as <strong style="color:#f0faf9">${esc(_grpProfile.username)}</strong></span>
      <button class="auth-btn-outline" style="font-size:11px;padding:5px 10px" onclick="openGrpProfile()">Profile</button>`;
  } else {
    bar.innerHTML = `
      <span style="font-size:13px;color:rgba(240,250,249,.4)">Sign in to create and share boards with friends</span>
      <button class="auth-btn-solid" style="font-size:12px;padding:6px 14px" onclick="openGroupAuth('login')">Sign In</button>
      <button class="auth-btn-outline" style="font-size:12px;padding:6px 14px" onclick="openGroupAuth('signup')">Sign Up</button>`;
  }
}

/* ── Profile ───────────────────────────────────────────────── */
function openGrpProfile() {
  if (!_grpUser) { openGroupAuth('login'); return; }
  const m = document.getElementById('grp-profile-modal');
  document.getElementById('grp-profile-avatar').textContent = (_grpProfile?.username || '?').slice(0,2).toUpperCase();
  document.getElementById('grp-profile-name').textContent   = _grpProfile?.username || '';
  document.getElementById('grp-profile-email').textContent  = _grpUser.email;
  m.classList.remove('hidden');
}
function closeGrpProfile() { document.getElementById('grp-profile-modal').classList.add('hidden'); }

/* ── Board UI state ────────────────────────────────────────── */
function _grpShowBoardUI(state) {
  document.getElementById('grp-notice').classList.toggle('hidden', state !== 'notice');
  document.getElementById('grp-login-prompt').classList.toggle('hidden', state !== 'login');
  document.getElementById('grp-board-ui').classList.toggle('hidden', state !== 'board');
}

/* ── Load & select boards ──────────────────────────────────── */
async function _grpLoadUserBoards() {
  if (!_grpUser) return;
  const { data: boards } = await _grpClient.from('boards').select('*').eq('created_by', _grpUser.id).order('created_at', { ascending: false });
  if (boards?.length) _grpSelectBoard(boards[0]);
}

function openNewBoardModal() {
  document.getElementById('grp-new-board-modal').classList.remove('hidden');
  document.getElementById('grp-new-board-name').focus();
}
function closeNewBoardModal() { document.getElementById('grp-new-board-modal').classList.add('hidden'); }

async function createBoard() {
  const name = document.getElementById('grp-new-board-name').value.trim();
  const err  = document.getElementById('grp-new-board-error');
  err.classList.add('hidden');
  if (!name) { err.textContent = 'Enter a board name.'; err.classList.remove('hidden'); return; }
  const { data, error } = await _grpClient.from('boards').insert({ name, created_by: _grpUser.id }).select().single();
  if (error) { err.textContent = error.message; err.classList.remove('hidden'); return; }
  closeNewBoardModal();
  document.getElementById('grp-new-board-name').value = '';
  _grpSelectBoard(data);
}

async function _grpSelectBoard(board) {
  _grpBoard = board;
  document.getElementById('grp-active-board-name').textContent = board.name;
  if (_grpChannel) { _grpClient.removeChannel(_grpChannel); _grpChannel = null; }
  await _grpLoadIdeas();
  _grpSubscribe();
}

/* ── Ideas ─────────────────────────────────────────────────── */
async function _grpLoadIdeas() {
  if (!_grpBoard) return;
  const { data } = await _grpClient.from('ideas')
    .select('*, votes(user_id,direction)')
    .eq('board_id', _grpBoard.id)
    .order('created_at', { ascending: true });
  _grpRenderIdeas(data || []);
}

function _grpSubscribe() {
  if (!_grpBoard || !_grpClient) return;
  _grpChannel = _grpClient.channel(`board-${_grpBoard.id}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'ideas', filter: `board_id=eq.${_grpBoard.id}` }, () => _grpLoadIdeas())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, () => _grpLoadIdeas())
    .on('presence', { event: 'sync' }, () => _grpUpdateOnlineUsers())
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED' && _grpProfile) {
        await _grpChannel.track({ user_id: _grpUser.id, username: _grpProfile.username });
      }
    });
}

function _grpUpdateOnlineUsers() {
  if (!_grpChannel) return;
  const users = Object.values(_grpChannel.presenceState()).flat();
  const el = document.getElementById('grp-online-users');
  el.innerHTML = users.length
    ? `<div class="online-badge"><div class="online-dot"></div>${users.length} online</div>` +
      users.map(u => `<div class="online-badge">${esc(u.username)}</div>`).join('')
    : '';
}

async function addIdea() {
  if (!_grpUser)  { openGroupAuth('login'); return; }
  if (!_grpBoard) { openNewBoardModal(); return; }
  const cityId = document.getElementById('grp-idea-city').value;
  const note   = document.getElementById('grp-idea-note').value.trim().slice(0, 500);
  if (!cityId || !note) { showToast('Pick a city and describe your idea!'); return; }
  const btn = document.getElementById('grp-add-idea-btn');
  if (btn) btn.disabled = true;
  const city = typeof CITIES !== 'undefined' ? CITIES.find(c => c.id === cityId) : null;
  await _grpClient.from('ideas').insert({
    board_id: _grpBoard.id, city_id: cityId,
    city_name: city?.name || cityId, note,
    created_by: _grpUser.id, username: _grpProfile.username, vote_score: 0,
  });
  document.getElementById('grp-idea-note').value = '';
  if (btn) btn.disabled = false;
}

async function voteIdea(ideaId, direction) {
  if (!_grpUser) { openGroupAuth('login'); return; }
  const { data: existing } = await _grpClient.from('votes').select('*').eq('idea_id', ideaId).eq('user_id', _grpUser.id).single();
  if (existing) {
    await _grpClient.from('votes').delete().eq('idea_id', ideaId).eq('user_id', _grpUser.id);
    await _grpRecalcScore(ideaId);
    if (existing.direction === direction) return;
  }
  await _grpClient.from('votes').insert({ idea_id: ideaId, user_id: _grpUser.id, direction });
  await _grpRecalcScore(ideaId);
}

async function _grpRecalcScore(ideaId) {
  const { data: votes } = await _grpClient.from('votes').select('direction').eq('idea_id', ideaId);
  const score = (votes || []).reduce((s, v) => s + (v.direction === 'up' ? 1 : -1), 0);
  await _grpClient.from('ideas').update({ vote_score: score }).eq('id', ideaId);
}

async function deleteIdea(ideaId) {
  await _grpClient.from('ideas').delete().eq('id', ideaId).eq('created_by', _grpUser.id);
}

function _grpRenderIdeas(ideas) {
  const el = document.getElementById('grp-ideas-list');
  if (!ideas.length) {
    el.innerHTML = `<div class="board-empty"><div>📍</div><p>No ideas yet — be the first to pin one!</p></div>`;
    return;
  }
  el.innerHTML = [...ideas].sort((a,b) => b.vote_score - a.vote_score).map(idea => {
    const userVote = idea.votes?.find(v => v.user_id === _grpUser?.id)?.direction || null;
    const score = idea.vote_score || 0;
    const isOwn = _grpUser && idea.created_by === _grpUser.id;
    return `
      <div class="idea-card">
        <div class="idea-city-badge">📍 ${esc(idea.city_name)}</div>
        <div class="idea-content">
          <div class="idea-note">${esc(idea.note)}</div>
          <div class="idea-meta">by ${esc(idea.username)}</div>
        </div>
        <div class="idea-votes">
          <button class="vote-btn up ${userVote==='up'?'voted-up':''}" onclick="voteIdea('${jsq(idea.id)}','up')">👍</button>
          <span class="vote-count" style="color:${score>0?'#6aaf82':score<0?'#c05050':'#9e9085'}">${score>0?'+':''}${score}</span>
          <button class="vote-btn down ${userVote==='down'?'voted-down':''}" onclick="voteIdea('${jsq(idea.id)}','down')">👎</button>
        </div>
        ${isOwn ? `<button class="idea-delete" onclick="deleteIdea('${jsq(idea.id)}')">✕</button>` : ''}
      </div>`;
  }).join('');
}

/* ── Board picker ──────────────────────────────────────────── */
async function openBoardPicker() {
  if (!_grpUser) return;
  const { data: boards } = await _grpClient.from('boards').select('*').eq('created_by', _grpUser.id).order('created_at', { ascending: false });
  const list = document.getElementById('grp-board-picker-list');
  if (!boards?.length) {
    list.innerHTML = '<p style="color:rgba(240,250,249,.35);text-align:center;padding:20px">No boards yet.</p>';
  } else {
    list.innerHTML = boards.map(b => `
      <div class="board-picker-item ${_grpBoard?.id === b.id ? 'active' : ''}" data-board-id="${esc(b.id)}">
        <div>
          <div class="board-picker-item-name">${esc(b.name)}</div>
          <div class="board-picker-item-meta">${new Date(b.created_at).toLocaleDateString()}</div>
        </div>
        ${_grpBoard?.id === b.id ? '<span style="color:#2dd4bf">●</span>' : ''}
      </div>`).join('');
    list.querySelectorAll('.board-picker-item').forEach(el => {
      el.addEventListener('click', () => {
        const board = boards.find(b => b.id === el.dataset.boardId);
        if (board) { _grpSelectBoard(board); closeBoardPicker(); }
      });
    });
  }
  document.getElementById('grp-board-picker-modal').classList.remove('hidden');
}
function closeBoardPicker() { document.getElementById('grp-board-picker-modal').classList.add('hidden'); }

async function shareBoard() {
  if (!_grpBoard) return;
  const url = `${window.location.origin}/planner.html?tab=group&board=${_grpBoard.id}`;
  try { await navigator.clipboard.writeText(url); } catch(e) { prompt('Copy link:', url); return; }
  showToast('🔗 Board link copied!');
}

async function _grpCheckURLForBoard() {
  const params = new URLSearchParams(window.location.search);
  const boardId = params.get('board');
  if (!boardId || !_GRP_CONFIGURED) return;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(boardId)) return;
  const { data: board } = await _grpClient.from('boards').select('*').eq('id', boardId).single();
  if (board && _grpUser) _grpSelectBoard(board);
}

/* ── City select ───────────────────────────────────────────── */
function _grpPopulateCitySelect() {
  const s = document.getElementById('grp-idea-city');
  if (!s || typeof CITIES === 'undefined') return;
  CITIES.forEach(c => {
    const o = document.createElement('option');
    o.value = c.id;
    o.textContent = c.name;
    s.appendChild(o);
  });
}
