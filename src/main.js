import { prefsStore, profileStore, profilesStore, switchProfile, createProfile, deleteProfile } from './store.js';
import { renderUserProfile } from './pages/userProfile.js';
import { renderWeeklyMenu, destroyWeeklyMenu } from './pages/weeklyMenu.js';
import { renderMealsDatabase } from './pages/mealsDatabase.js';
import { renderGroceries } from './pages/groceries.js';
import { renderIngredients } from './pages/ingredients.js';
import { renderPrices } from './pages/prices.js';
import { initDriveSync, signIn, signOut, isSignedIn, getStatus, subscribeStatus, forceSync } from './googleDriveSync.js';

// ── Route map ──────────────────────────────────────────────────────────────

const ROUTES = {
  '#/profile':     { render: renderUserProfile,   label: 'User Profile',     icon: '👤' },
  '#/weekly':      { render: renderWeeklyMenu,     label: 'Weekly Menu',      icon: '📅' },
  '#/meals':       { render: renderMealsDatabase,  label: 'Meals Database',   icon: '🍳' },
  '#/ingredients': { render: renderIngredients,    label: 'Ingredients',      icon: '🥕' },
  '#/groceries':   { render: renderGroceries,      label: 'Groceries',        icon: '🛒' },
  '#/prices':      { render: renderPrices,          label: 'Prices',           icon: '💰' },
};

const DEFAULT_ROUTE = '#/weekly';

// ── App shell ──────────────────────────────────────────────────────────────

function getActiveRoute() {
  const hash = location.hash || DEFAULT_ROUTE;
  return ROUTES[hash] ? hash : DEFAULT_ROUTE;
}

function renderSidebar() {
  const prefs = prefsStore.get();
  const profile = profileStore.get();
  const { profiles, activeId } = profilesStore.get();
  const open = prefs.sidebarOpen;
  const activeRoute = getActiveRoute();

  const sidebar = document.getElementById('sidebar');
  sidebar.className = 'sidebar' + (open ? ' open' : ' collapsed');

  sidebar.innerHTML = `
    <div class="sidebar-top">
      <button class="sidebar-toggle" id="sidebar-toggle" title="${open ? 'Collapse sidebar' : 'Expand sidebar'}">
        ${open ? '◀' : '▶'}
      </button>
      ${open ? `
        <div class="sidebar-brand">
          <span class="brand-icon">🥗</span>
          <span class="brand-name">MealPlanner</span>
        </div>
      ` : ''}
    </div>

    ${open ? `
      <div class="sidebar-profile-mini">
        <div class="profile-switcher-header" id="profile-switcher-header">
          <span class="${profile.nickname ? 'profile-nick' : 'profile-nick-empty'}">
            ${profile.nickname ? `Hi, ${escHtml(profile.nickname)}!` : 'No profile set'}
          </span>
          <button class="profile-switch-btn" id="profile-switcher-toggle" title="Manage profiles">▾</button>
        </div>
        <div class="profile-switcher-panel" id="profile-switcher-panel" hidden>
          ${profiles.map(p => `
            <div class="profile-list-entry ${p.id === activeId ? 'is-active' : ''}">
              <span class="profile-list-name">${escHtml(p.nickname || 'Unnamed')}</span>
              <div class="profile-list-actions">
                ${p.id === activeId
                  ? `<span class="profile-active-badge">active</span>`
                  : `<button class="btn btn-ghost btn-xs profile-list-switch" data-pid="${escHtml(p.id)}">Switch</button>`
                }
                ${profiles.length > 1
                  ? `<button class="profile-list-delete" data-pid="${escHtml(p.id)}" title="Delete profile">✕</button>`
                  : ''
                }
              </div>
            </div>
          `).join('')}
          <button class="profile-add-btn" id="sidebar-add-profile">+ Add Profile</button>
        </div>
      </div>
    ` : ''}

    <nav class="sidebar-nav">
      ${Object.entries(ROUTES).map(([hash, route]) => `
        <a href="${hash}" class="nav-link ${hash === activeRoute ? 'active' : ''}" title="${route.label}">
          <span class="nav-icon">${route.icon}</span>
          ${open ? `<span class="nav-label">${route.label}</span>` : ''}
        </a>
      `).join('')}
    </nav>

    ${open ? `
      <div class="sidebar-footer">
        <div class="drive-sync-row">
          ${renderDriveStatus()}
        </div>
        <span class="sidebar-footer-text">Weekly Meal Planner</span>
      </div>
    ` : ''}
  `;

  // Sidebar toggle
  sidebar.querySelector('#sidebar-toggle')?.addEventListener('click', () => {
    prefsStore.set({ sidebarOpen: !prefsStore.get().sidebarOpen });
    renderSidebar();
  });

  // Profile switcher panel toggle
  document.getElementById('profile-switcher-toggle')?.addEventListener('click', () => {
    const panel = document.getElementById('profile-switcher-panel');
    const btn = document.getElementById('profile-switcher-toggle');
    if (panel) {
      panel.hidden = !panel.hidden;
      if (btn) btn.textContent = panel.hidden ? '▾' : '▴';
    }
  });

  // Switch profile buttons in sidebar
  sidebar.querySelectorAll('.profile-list-switch').forEach(btn => {
    btn.addEventListener('click', () => switchProfile(btn.dataset.pid));
  });

  // Delete profile buttons in sidebar
  sidebar.querySelectorAll('.profile-list-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = profiles.find(p => p.id === btn.dataset.pid)?.nickname || 'this profile';
      if (confirm(`Delete "${escHtml(name)}"? This cannot be undone.`)) {
        deleteProfile(btn.dataset.pid);
      }
    });
  });

  // Add profile from sidebar — navigate to profile page with flag to open modal
  document.getElementById('sidebar-add-profile')?.addEventListener('click', () => {
    sessionStorage.setItem('openAddProfile', '1');
    if (location.hash === '#/profile') {
      document.getElementById('add-profile-btn')?.click();
      sessionStorage.removeItem('openAddProfile');
    } else {
      location.hash = '#/profile';
    }
  });

  // Drive sync buttons
  sidebar.querySelector('#drive-connect-btn')?.addEventListener('click', () => signIn());
  sidebar.querySelector('#drive-retry-btn')?.addEventListener('click', () => forceSync());
  sidebar.querySelector('#drive-signout-btn')?.addEventListener('click', () => { signOut(); renderSidebar(); });
}

function renderDriveStatus() {
  const s = getStatus();
  if (s === 'disconnected') {
    return `<button class="drive-connect" id="drive-connect-btn" title="Sync your meal plan across devices">
      <span class="drive-icon">☁</span> Connect Google Drive
    </button>`;
  }
  if (s === 'connecting') return `<span class="drive-status connecting">Connecting…</span>`;
  if (s === 'loading')    return `<span class="drive-status loading">Loading from Drive…</span>`;
  if (s === 'saving')     return `<span class="drive-status syncing">Syncing…</span>`;
  if (s === 'error') {
    return `<span class="drive-status err">⚠ Sync error
      <button class="drive-linkbtn" id="drive-retry-btn">Retry</button>
    </span>`;
  }
  if (s === 'conflict') {
    return `<span class="drive-status conflict">⚠ Conflict
      <button class="drive-linkbtn" id="drive-retry-btn">Resolve</button>
    </span>`;
  }
  // idle
  return `<span class="drive-status ok" title="Signed in to Google Drive">
    <span class="drive-icon">✓</span> Synced
    <button class="drive-linkbtn" id="drive-signout-btn">Disconnect</button>
  </span>`;
}

function navigate() {
  const activeRoute = getActiveRoute();
  if (location.hash !== activeRoute) {
    location.hash = activeRoute;
    return; // hashchange will re-fire navigate
  }

  destroyWeeklyMenu();

  renderSidebar();

  const main = document.getElementById('main-content');
  main.innerHTML = '';
  const route = ROUTES[activeRoute];
  if (route) route.render(main);
}

// ── Init ───────────────────────────────────────────────────────────────────

function showSplash() {
  const el = document.getElementById('app-splash');
  if (el) el.style.display = 'flex';
}

function hideSplash() {
  const el = document.getElementById('app-splash');
  if (el) el.remove();
}

async function init() {
  if (!location.hash || !ROUTES[location.hash]) {
    location.hash = DEFAULT_ROUTE;
  }

  showSplash();
  try {
    await initDriveSync();
  } catch (e) {
    console.warn('Drive init threw, proceeding offline', e);
  }
  hideSplash();

  navigate();
  window.addEventListener('hashchange', navigate);

  // Update sidebar when profile data, profiles list, or sync status changes
  profilesStore.subscribe(() => renderSidebar());
  subscribeStatus(() => renderSidebar());
}

function escHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

init();
