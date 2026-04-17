/* ============================================================
   PinTrip — admin.js
   Security model:
     1. auth-gate is shown by default; admin shell is display:none
     2. initAdminGate() queries the DB — localStorage can be tampered,
        only the DB result is trusted
     3. RLS policies enforce all operations server-side independently
     4. All user data is passed through escHtml() before innerHTML
   ============================================================ */

'use strict';

/* ── INIT ─────────────────────────────────────────────────── */
let db = null;
let adminUser = null;
let allUsers  = [];
let allBoards = [];
let allIdeas  = [];

if (typeof SUPABASE_URL === 'undefined' || typeof SUPABASE_KEY === 'undefined') {
  hardRedirect();
} else {
  db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  initAdminGate();
}

/* ── AUTH GATE ────────────────────────────────────────────── */
async function initAdminGate() {
  try {
    // Step 1: check for a valid session
    const { data: { session } } = await db.auth.getSession();
    if (!session) { hardRedirect(); return; }

    // Step 2: query the DB for is_admin — never trust client-side session metadata
    const { data: profile, error } = await db
      .from('profiles')
      .select('id, username, is_admin, is_banned')
      .eq('id', session.user.id)
      .single();

    if (error || !profile || !profile.is_admin) { hardRedirect(); return; }

    // Step 3: DB confirmed is_admin = true. Reveal the shell.
    adminUser = { ...session.user, ...profile };
    document.getElementById('auth-gate').style.display   = 'none';
    document.getElementById('admin-shell').style.display = 'block';
    document.getElementById('admin-user-label').textContent = `Signed in as ${profile.username}`;

    await refreshAll();
  } catch {
    hardRedirect();
  }
}

// Hard redirect — replaces history so Back button can't return to admin
function hardRedirect() {
  window.location.replace('/');
}

// Sign out mid-session should also boot the user
db && db.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') hardRedirect();
});

/* ── DATA LOADING ─────────────────────────────────────────── */
async function refreshAll() {
  await Promise.all([loadStats(), loadUsers(), loadBoards(), loadIdeas()]);
}

async function loadStats() {
  const [
    { count: userCount  },
    { count: boardCount },
    { count: ideaCount  },
    { count: voteCount  },
  ] = await Promise.all([
    db.from('profiles').select('*', { count: 'exact', head: true }),
    db.from('boards').select('*',   { count: 'exact', head: true }),
    db.from('ideas').select('*',    { count: 'exact', head: true }),
    db.from('votes').select('*',    { count: 'exact', head: true }),
  ]);
  document.getElementById('stat-users').textContent  = userCount  ?? '—';
  document.getElementById('stat-boards').textContent = boardCount ?? '—';
  document.getElementById('stat-ideas').textContent  = ideaCount  ?? '—';
  document.getElementById('stat-votes').textContent  = voteCount  ?? '—';
}

async function loadUsers() {
  const { data, error } = await db
    .from('profiles')
    .select('id, username, is_admin, is_banned, created_at')
    .order('created_at', { ascending: false });
  if (error) { showToast('Failed to load users: ' + error.message); return; }
  allUsers = data || [];
  renderUsers(allUsers);
}

async function loadBoards() {
  const { data, error } = await db
    .from('boards')
    .select('id, name, created_at, profiles!created_by(username)')
    .order('created_at', { ascending: false });
  if (error) { showToast('Failed to load boards: ' + error.message); return; }
  allBoards = data || [];
  renderBoards(allBoards);
}

async function loadIdeas() {
  const { data, error } = await db
    .from('ideas')
    .select('id, city_name, note, username, vote_score, created_at')
    .order('created_at', { ascending: false });
  if (error) { showToast('Failed to load ideas: ' + error.message); return; }
  allIdeas = data || [];
  renderIdeas(allIdeas);
}

/* ── RENDERERS ────────────────────────────────────────────── */
function renderUsers(users) {
  const tbody = document.getElementById('users-tbody');
  document.getElementById('user-count').textContent = `${users.length} user${users.length !== 1 ? 's' : ''}`;
  if (!users.length) {
    tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state">No users found.</div></td></tr>`;
    return;
  }
  tbody.innerHTML = users.map(u => {
    const isYou = u.id === adminUser.id;
    return `<tr>
      <td>
        ${escHtml(u.username)}
        ${u.is_admin  ? ' <span class="badge badge-admin">Admin</span>'  : ''}
        ${u.is_banned ? ' <span class="badge badge-banned">Banned</span>' : ''}
        ${isYou       ? ' <span class="badge badge-you">You</span>'       : ''}
      </td>
      <td>${new Date(u.created_at).toLocaleDateString()}</td>
      <td>${u.is_admin ? 'Admin' : u.is_banned ? 'Banned' : 'Active'}</td>
      <td>
        <div class="action-btns">
          ${!isYou ? `
            <button class="btn-action ${u.is_banned ? 'btn-unban' : 'btn-ban'}"
                    data-action="toggle-ban" data-id="${escHtml(u.id)}" data-banned="${u.is_banned}">
              ${u.is_banned ? 'Unban' : 'Ban'}
            </button>
            <button class="btn-action ${u.is_admin ? 'btn-rvadm' : 'btn-mkadm'}"
                    data-action="toggle-admin" data-id="${escHtml(u.id)}" data-admin="${u.is_admin}">
              ${u.is_admin ? 'Revoke Admin' : 'Make Admin'}
            </button>
            <button class="btn-action btn-del-c"
                    data-action="delete-content" data-id="${escHtml(u.id)}" data-name="${escHtml(u.username)}">
              Delete Content
            </button>
          ` : '<span style="color:rgba(240,250,249,.2);font-size:11px">—</span>'}
        </div>
      </td>
    </tr>`;
  }).join('');
}

function renderBoards(boards) {
  const tbody = document.getElementById('boards-tbody');
  document.getElementById('board-count').textContent = `${boards.length} board${boards.length !== 1 ? 's' : ''}`;
  if (!boards.length) {
    tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state">No boards found.</div></td></tr>`;
    return;
  }
  tbody.innerHTML = boards.map(b => `
    <tr>
      <td>${escHtml(b.name)}</td>
      <td>${escHtml(b.profiles?.username ?? '—')}</td>
      <td>${new Date(b.created_at).toLocaleDateString()}</td>
      <td>
        <div class="action-btns">
          <button class="btn-action btn-del"
                  data-action="delete-board" data-id="${escHtml(b.id)}" data-name="${escHtml(b.name)}">
            Delete
          </button>
        </div>
      </td>
    </tr>`).join('');
}

function renderIdeas(ideas) {
  const tbody = document.getElementById('ideas-tbody');
  document.getElementById('idea-count').textContent = `${ideas.length} idea${ideas.length !== 1 ? 's' : ''}`;
  if (!ideas.length) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state">No ideas found.</div></td></tr>`;
    return;
  }
  tbody.innerHTML = ideas.map(i => `
    <tr>
      <td>${escHtml(i.city_name)}</td>
      <td>${escHtml(i.username ?? '—')}</td>
      <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis">${escHtml(i.note)}</td>
      <td style="color:${(i.vote_score||0) > 0 ? '#4ade80' : (i.vote_score||0) < 0 ? '#f87171' : 'rgba(240,250,249,.4)'}">
        ${(i.vote_score||0) > 0 ? '+' : ''}${i.vote_score ?? 0}
      </td>
      <td>
        <div class="action-btns">
          <button class="btn-action btn-del"
                  data-action="delete-idea" data-id="${escHtml(i.id)}">
            Delete
          </button>
        </div>
      </td>
    </tr>`).join('');
}

/* ── ADMIN ACTIONS ────────────────────────────────────────── */
async function toggleBan(userId, currentBanned) {
  const { error } = await db
    .from('profiles')
    .update({ is_banned: !currentBanned })
    .eq('id', userId);
  if (error) { showToast('Error: ' + error.message); return; }
  showToast(currentBanned ? 'User unbanned.' : 'User banned.');
  await loadUsers();
}

async function toggleAdmin(userId, currentAdmin) {
  if (!confirm(currentAdmin
    ? 'Revoke admin access for this user?'
    : 'Grant admin access to this user? They will have full control.')) return;
  const { error } = await db
    .from('profiles')
    .update({ is_admin: !currentAdmin })
    .eq('id', userId);
  if (error) { showToast('Error: ' + error.message); return; }
  showToast(currentAdmin ? 'Admin access revoked.' : 'Admin access granted.');
  await loadUsers();
}

async function deleteUserContent(userId, username) {
  if (!confirm(`Delete ALL boards, ideas, and votes created by "${username}"?\n\nThis cannot be undone.`)) return;
  // Delete in dependency order (votes → ideas → boards)
  await db.from('votes').delete().eq('user_id', userId);
  await db.from('ideas').delete().eq('created_by', userId);
  await db.from('boards').delete().eq('created_by', userId);
  showToast(`Content for ${username} deleted.`);
  await refreshAll();
}

async function deleteBoard(boardId, boardName) {
  if (!confirm(`Delete board "${boardName}" and all its ideas?\n\nThis cannot be undone.`)) return;
  await db.from('votes').delete().in('idea_id',
    (await db.from('ideas').select('id').eq('board_id', boardId)).data?.map(i => i.id) || []
  );
  await db.from('ideas').delete().eq('board_id', boardId);
  const { error } = await db.from('boards').delete().eq('id', boardId);
  if (error) { showToast('Error: ' + error.message); return; }
  showToast('Board deleted.');
  await refreshAll();
}

async function deleteIdea(ideaId) {
  if (!confirm('Delete this idea and all its votes?\n\nThis cannot be undone.')) return;
  await db.from('votes').delete().eq('idea_id', ideaId);
  const { error } = await db.from('ideas').delete().eq('id', ideaId);
  if (error) { showToast('Error: ' + error.message); return; }
  showToast('Idea deleted.');
  await loadStats();
  await loadIdeas();
}

/* ── EVENT DELEGATION ─────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  // Tab switching
  document.querySelectorAll('.tab-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
  });

  // Sign out
  document.getElementById('btn-signout').addEventListener('click', async () => {
    await db.auth.signOut();
    hardRedirect();
  });

  // Action buttons (single listener on document body)
  document.body.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const { action, id, name, banned, admin } = btn.dataset;
    switch (action) {
      case 'toggle-ban':     await toggleBan(id, banned === 'true'); break;
      case 'toggle-admin':   await toggleAdmin(id, admin === 'true'); break;
      case 'delete-content': await deleteUserContent(id, name); break;
      case 'delete-board':   await deleteBoard(id, name); break;
      case 'delete-idea':    await deleteIdea(id); break;
    }
  });

  // Search filters
  document.getElementById('user-search').addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    renderUsers(!q ? allUsers : allUsers.filter(u => u.username.toLowerCase().includes(q)));
  });
  document.getElementById('board-search').addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    renderBoards(!q ? allBoards : allBoards.filter(b => b.name.toLowerCase().includes(q)));
  });
  document.getElementById('idea-search').addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    renderIdeas(!q ? allIdeas : allIdeas.filter(i =>
      i.city_name.toLowerCase().includes(q) || (i.note || '').toLowerCase().includes(q)
    ));
  });

});

/* ── UTILITIES ────────────────────────────────────────────── */
function showToast(msg) {
  const t = document.getElementById('admin-toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

/** Escape all user-supplied strings before inserting into innerHTML. */
function escHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
