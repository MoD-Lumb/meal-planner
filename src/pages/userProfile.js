import { profileStore, profilesStore, switchProfile, createProfile, deleteProfile, apiConfigStore } from '../store.js';
import { listChains, listStores, CijeneApiError } from '../api/cijeneApi.js';

export function renderUserProfile(container) {
  const profile = profileStore.get();
  const { profiles, activeId } = profilesStore.get();

  container.innerHTML = `
    <div class="page-header">
      <h1>User Profile</h1>
      <p class="page-subtitle">Your personal information helps personalise your meal plan.</p>
    </div>

    <div class="profile-card">
      <form id="profile-form" class="profile-form" autocomplete="off">

        <div class="form-group">
          <label for="nickname">Nickname</label>
          <input type="text" id="nickname" name="nickname"
            placeholder="How should we call you?"
            value="${escHtml(profile.nickname)}"
            maxlength="40">
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="gender">Gender</label>
            <select id="gender" name="gender">
              <option value="" ${!profile.gender ? 'selected' : ''}>— select —</option>
              <option value="male"   ${profile.gender === 'male'   ? 'selected' : ''}>Male</option>
              <option value="female" ${profile.gender === 'female' ? 'selected' : ''}>Female</option>
              <option value="other"  ${profile.gender === 'other'  ? 'selected' : ''}>Other</option>
            </select>
          </div>

          <div class="form-group">
            <label for="age">Age</label>
            <div class="input-unit-wrap">
              <input type="number" id="age" name="age"
                placeholder="0"
                min="10" max="120" step="1"
                value="${profile.age || ''}">
              <span class="input-unit">yr</span>
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="weightKg">Weight</label>
            <div class="input-unit-wrap">
              <input type="number" id="weightKg" name="weightKg"
                placeholder="0"
                min="20" max="300" step="0.1"
                value="${profile.weightKg}">
              <span class="input-unit">kg</span>
            </div>
          </div>

          <div class="form-group">
            <label for="heightCm">Height</label>
            <div class="input-unit-wrap">
              <input type="number" id="heightCm" name="heightCm"
                placeholder="0"
                min="50" max="250" step="1"
                value="${profile.heightCm}">
              <span class="input-unit">cm</span>
            </div>
          </div>
        </div>

        <div id="bmi-display" class="bmi-display">
          ${renderBMI(profile)}
        </div>

        <div class="profile-section-divider">
          <span>Nutrition Goal</span>
        </div>

        <div class="form-group">
          <label for="goal">Goal</label>
          <select id="goal" name="goal">
            <option value="" ${!profile.goal ? 'selected' : ''}>— select goal —</option>
            <option value="maintain" ${profile.goal === 'maintain' ? 'selected' : ''}>Maintaining weight</option>
            <option value="cut"      ${profile.goal === 'cut'      ? 'selected' : ''}>Losing weight &amp; adding muscle</option>
            <option value="bulk"     ${profile.goal === 'bulk'     ? 'selected' : ''}>Gaining weight &amp; adding muscle</option>
          </select>
        </div>

        <div class="form-group" id="intensity-group" ${!profile.goal ? 'hidden' : ''}>
          <label for="trainingIntensity">Training Intensity</label>
          <select id="trainingIntensity" name="trainingIntensity">
            <option value="light"    ${(profile.trainingIntensity || 'moderate') === 'light'    ? 'selected' : ''}>Light (1–2×/week)</option>
            <option value="moderate" ${(profile.trainingIntensity || 'moderate') === 'moderate' ? 'selected' : ''}>Moderate (3–4×/week)</option>
            <option value="heavy"    ${(profile.trainingIntensity || 'moderate') === 'heavy'    ? 'selected' : ''}>Heavy (5+/week)</option>
          </select>
        </div>

        <div id="nutrition-targets" class="nutrition-targets" ${!profile.goal ? 'hidden' : ''}>
          <div class="nutrition-targets-header">
            <span>Daily Targets</span>
            <button type="button" class="btn btn-ghost btn-sm" id="recalc-btn">↺ Recalculate</button>
          </div>
          <div class="nutrition-targets-grid">
            <div class="nt-field">
              <label for="targetKcal">Kcal</label>
              <input type="number" id="targetKcal" name="targetKcal" min="800" max="6000" step="1"
                value="${profile.targetKcal || ''}">
            </div>
            <div class="nt-field">
              <label for="targetProtein">Protein (g)</label>
              <input type="number" id="targetProtein" name="targetProtein" min="0" max="500" step="1"
                value="${profile.targetProtein || ''}">
            </div>
            <div class="nt-field">
              <label for="targetCarbs">Carbs / UH (g)</label>
              <input type="number" id="targetCarbs" name="targetCarbs" min="0" max="1000" step="1"
                value="${profile.targetCarbs || ''}">
            </div>
            <div class="nt-field">
              <label for="targetFat">Fat (g)</label>
              <input type="number" id="targetFat" name="targetFat" min="0" max="500" step="1"
                value="${profile.targetFat || ''}">
            </div>
          </div>
          <div id="nt-hint" class="nt-hint"></div>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary">Save Profile</button>
          <span id="save-feedback" class="save-feedback"></span>
        </div>
      </form>
    </div>

    <div class="profile-card">
      <div class="profile-section-divider"><span>Supermarkets</span></div>
      ${renderSupermarketsSection(profile)}
    </div>

    <div class="profiles-section">
      <div class="profiles-section-header">
        <h2>All Profiles</h2>
        <button class="btn btn-outline btn-sm" id="add-profile-btn">+ Add Profile</button>
      </div>
      <div class="profiles-grid" id="profiles-grid">
        ${renderProfileCards(profiles, activeId)}
      </div>
    </div>

    <div class="modal-overlay" id="add-profile-modal" hidden>
      <div class="modal-box">
        <div class="modal-header">
          <h3>Add Profile</h3>
          <button class="modal-close" id="close-add-profile-modal">✕</button>
        </div>
        <div class="add-food-form">
          <div class="form-group">
            <label for="new-profile-nickname">Nickname</label>
            <input type="text" id="new-profile-nickname"
              placeholder="Enter a name"
              maxlength="40"
              autocomplete="off">
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" id="confirm-add-profile">Create Profile</button>
            <button class="btn btn-outline" id="cancel-add-profile">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  `;

  bindEvents(container);
  bindSupermarketsEvents(container);

  // Auto-open add modal if triggered from sidebar
  if (sessionStorage.getItem('openAddProfile') === '1') {
    sessionStorage.removeItem('openAddProfile');
    openAddModal(container);
  }

  // Show hint if targets already saved
  if (profile.goal) updateHint(container, profile);
}

// ── Supermarkets section ───────────────────────────────────────────────────

function renderSupermarketsSection(profile) {
  const apiKey = apiConfigStore.get().cijeneApiKey || '';
  const city = profile.city || '';
  const hasKey = !!apiKey.trim();

  return `
    <div class="form-group">
      <label for="cijene-api-key">Cijene API key</label>
      <input type="password" id="cijene-api-key"
        placeholder="Paste your API key (email info@dobarkod.hr to request one)"
        value="${escHtml(apiKey)}"
        autocomplete="off">
      <small class="nt-hint">Free tier: 10,000 queries/day. Stored locally in your browser only.</small>
    </div>

    <div class="form-group">
      <label for="city">City</label>
      <input type="text" id="city"
        placeholder="e.g. Zagreb"
        value="${escHtml(city)}"
        autocomplete="off">
    </div>

    <div class="form-group">
      <div class="nutrition-targets-header">
        <span>Preferred chains</span>
        <button type="button" class="btn btn-ghost btn-sm" id="load-chains-btn" ${!hasKey ? 'disabled' : ''}>
          ${hasKey ? '↺ Load chains' : 'Enter API key first'}
        </button>
      </div>
      <div id="chains-list" class="sm-chains-list">
        ${renderChainsFromProfile(profile)}
      </div>
    </div>

    <div class="form-group" id="stores-group" ${!(profile.selectedChains?.length && city) ? 'hidden' : ''}>
      <div class="nutrition-targets-header">
        <span>Stores in ${escHtml(city || 'your city')}</span>
        <button type="button" class="btn btn-ghost btn-sm" id="load-stores-btn" ${!hasKey ? 'disabled' : ''}>↺ Load stores</button>
      </div>
      <div id="stores-list" class="sm-stores-list">
        ${renderStoresFromProfile(profile)}
      </div>
    </div>

    <div class="form-actions">
      <span id="sm-feedback" class="save-feedback"></span>
    </div>
  `;
}

function renderChainsFromProfile(profile) {
  const selected = new Set(profile.selectedChains || []);
  const known = profile.knownChains || [];
  if (known.length === 0) {
    return `<small class="nt-hint">No chains loaded yet. Click "Load chains" above.</small>`;
  }
  return known.map(code => `
    <label class="sm-chain-chip">
      <input type="checkbox" class="sm-chain-cb" data-chain="${escHtml(code)}" ${selected.has(code) ? 'checked' : ''}>
      <span>${escHtml(code)}</span>
    </label>
  `).join('');
}

function renderStoresFromProfile(profile) {
  const selectedChains = profile.selectedChains || [];
  const stores = profile.knownStores || []; // [{chain_code, code, address, city}]
  const selectedIds = new Set(profile.selectedStoreIds || []);
  if (stores.length === 0) {
    return `<small class="nt-hint">No stores loaded yet. Click "Load stores" above.</small>`;
  }
  const byChain = {};
  for (const s of stores) {
    if (!selectedChains.includes(s.chain_code)) continue;
    (byChain[s.chain_code] ||= []).push(s);
  }
  const keys = Object.keys(byChain);
  if (keys.length === 0) {
    return `<small class="nt-hint">No stores match your selected chains. Adjust chains or city.</small>`;
  }
  return keys.map(chain => `
    <div class="sm-store-group">
      <div class="sm-store-group-title">${escHtml(chain)}</div>
      <div class="sm-store-group-list">
        ${byChain[chain].map(s => {
          const id = `${s.chain_code}:${s.code}`;
          const label = [s.address, s.city].filter(Boolean).join(', ') || s.code;
          return `
            <label class="sm-store-chip">
              <input type="checkbox" class="sm-store-cb" data-sid="${escHtml(id)}" ${selectedIds.has(id) ? 'checked' : ''}>
              <span>${escHtml(label)}</span>
            </label>
          `;
        }).join('')}
      </div>
    </div>
  `).join('');
}

function bindSupermarketsEvents(container) {
  const keyInput   = container.querySelector('#cijene-api-key');
  const cityInput  = container.querySelector('#city');
  const chainsList = container.querySelector('#chains-list');
  const storesGrp  = container.querySelector('#stores-group');
  const storesList = container.querySelector('#stores-list');
  const feedback   = container.querySelector('#sm-feedback');
  const loadChainsBtn = container.querySelector('#load-chains-btn');
  const loadStoresBtn = container.querySelector('#load-stores-btn');

  function setFeedback(msg, isError) {
    if (!feedback) return;
    feedback.textContent = msg;
    feedback.classList.toggle('visible', !!msg);
    feedback.style.color = isError ? 'var(--color-danger, #c0392b)' : '';
  }

  // Save API key on blur
  keyInput?.addEventListener('change', () => {
    apiConfigStore.set({ cijeneApiKey: keyInput.value.trim() });
    const hasKey = !!keyInput.value.trim();
    if (loadChainsBtn) {
      loadChainsBtn.disabled = !hasKey;
      loadChainsBtn.textContent = hasKey ? '↺ Load chains' : 'Enter API key first';
    }
    if (loadStoresBtn) loadStoresBtn.disabled = !hasKey;
  });

  // Save city on blur
  cityInput?.addEventListener('change', () => {
    profileStore.set({ city: cityInput.value.trim() });
  });

  // Load chains
  loadChainsBtn?.addEventListener('click', async () => {
    setFeedback('Loading chains…');
    loadChainsBtn.disabled = true;
    try {
      const result = await listChains();
      const codes = Array.isArray(result) ? result : (result?.chains || []);
      const flat = codes.map(c => typeof c === 'string' ? c : (c.code || c.chain_code)).filter(Boolean);
      profileStore.set(prev => ({ ...prev, knownChains: flat }));
      chainsList.innerHTML = renderChainsFromProfile(profileStore.get());
      setFeedback(`Loaded ${flat.length} chains.`);
    } catch (err) {
      setFeedback(err instanceof CijeneApiError ? err.message : 'Failed to load chains.', true);
    } finally {
      loadChainsBtn.disabled = false;
    }
  });

  // Toggle chain selection
  chainsList?.addEventListener('change', (e) => {
    if (!e.target.classList.contains('sm-chain-cb')) return;
    const code = e.target.dataset.chain;
    const current = new Set(profileStore.get().selectedChains || []);
    if (e.target.checked) current.add(code); else current.delete(code);
    profileStore.set(prev => ({ ...prev, selectedChains: Array.from(current) }));
    // Show stores section if we have chains + city
    const p = profileStore.get();
    if (storesGrp) storesGrp.hidden = !(p.selectedChains?.length && p.city);
    // Re-render stores list to hide deselected chains
    if (storesList) storesList.innerHTML = renderStoresFromProfile(profileStore.get());
  });

  // Load stores
  loadStoresBtn?.addEventListener('click', async () => {
    const p = profileStore.get();
    if (!p.city) { setFeedback('Enter a city first.', true); return; }
    if (!p.selectedChains?.length) { setFeedback('Pick at least one chain first.', true); return; }
    setFeedback('Loading stores…');
    loadStoresBtn.disabled = true;
    try {
      const result = await listStores({ chains: p.selectedChains, city: p.city });
      const rawStores = Array.isArray(result) ? result : (result?.stores || []);
      const stores = rawStores.map(s => ({
        chain_code: s.chain_code || s.chain,
        code:       s.code || s.store_code,
        address:    s.address || '',
        city:       s.city || '',
      })).filter(s => s.chain_code && s.code);
      profileStore.set(prev => ({ ...prev, knownStores: stores }));
      storesList.innerHTML = renderStoresFromProfile(profileStore.get());
      setFeedback(`Loaded ${stores.length} stores.`);
    } catch (err) {
      setFeedback(err instanceof CijeneApiError ? err.message : 'Failed to load stores.', true);
    } finally {
      loadStoresBtn.disabled = false;
    }
  });

  // Toggle store selection
  storesList?.addEventListener('change', (e) => {
    if (!e.target.classList.contains('sm-store-cb')) return;
    const sid = e.target.dataset.sid;
    const current = new Set(profileStore.get().selectedStoreIds || []);
    if (e.target.checked) current.add(sid); else current.delete(sid);
    profileStore.set(prev => ({ ...prev, selectedStoreIds: Array.from(current) }));
  });
}

function renderProfileCards(profiles, activeId) {
  return profiles.map(p => `
    <div class="profile-item-card ${p.id === activeId ? 'is-active' : ''}">
      <div class="profile-item-avatar">${escHtml((p.nickname || '?').charAt(0).toUpperCase())}</div>
      <div class="profile-item-info">
        <span class="profile-item-name">${escHtml(p.nickname || 'Unnamed')}</span>
        ${p.id === activeId ? `<span class="profile-item-badge">Active</span>` : ''}
      </div>
      <div class="profile-item-actions">
        ${p.id !== activeId
          ? `<button class="btn btn-outline btn-sm" data-pid="${escHtml(p.id)}" data-action="switch">Switch</button>`
          : ''
        }
        ${profiles.length > 1
          ? `<button class="btn btn-ghost btn-sm profile-delete-btn" data-pid="${escHtml(p.id)}" data-action="delete">Delete</button>`
          : ''
        }
      </div>
    </div>
  `).join('');
}

function openAddModal(container) {
  const modal = container.querySelector('#add-profile-modal');
  if (modal) {
    modal.hidden = false;
    container.querySelector('#new-profile-nickname')?.focus();
  }
}

function closeAddModal(container) {
  const modal = container.querySelector('#add-profile-modal');
  if (modal) {
    modal.hidden = true;
    const input = container.querySelector('#new-profile-nickname');
    if (input) input.value = '';
  }
}

function calculateTargets(weightKg, heightCm, age, gender, goal, intensity) {
  if (!weightKg || !heightCm || !age || !gender || !goal) return null;

  const w = parseFloat(weightKg);
  const h = parseFloat(heightCm);
  const a = parseFloat(age);
  if (!w || !h || !a) return null;

  // Mifflin-St Jeor BMR
  let bmr;
  if (gender === 'male')        bmr = 10*w + 6.25*h - 5*a + 5;
  else if (gender === 'female') bmr = 10*w + 6.25*h - 5*a - 161;
  else                           bmr = 10*w + 6.25*h - 5*a - 78; // midpoint

  const activityMult = { light: 1.375, moderate: 1.55, heavy: 1.725 }[intensity] || 1.55;
  const tdee = bmr * activityMult;

  const goalAdj = { maintain: 0, cut: -400, bulk: +400 }[goal] || 0;
  const targetKcal = Math.round(tdee + goalAdj);

  const protein = Math.round(2 * w);
  const fat     = Math.round((goal === 'cut' ? 0.8 : 1.0) * w);

  // Carbs fill remaining kcal, clamped to [2×kg, 5×kg]
  const carbsRaw = (targetKcal - protein * 4 - fat * 9) / 4;
  const carbs = Math.round(Math.max(2 * w, Math.min(5 * w, carbsRaw)));

  const actualKcal = Math.round(protein * 4 + carbs * 4 + fat * 9);

  return { targetKcal: actualKcal, targetProtein: protein, targetCarbs: carbs, targetFat: fat };
}

function applyTargets(container, targets) {
  if (!targets) return;
  container.querySelector('#targetKcal').value    = targets.targetKcal;
  container.querySelector('#targetProtein').value = targets.targetProtein;
  container.querySelector('#targetCarbs').value   = targets.targetCarbs;
  container.querySelector('#targetFat').value     = targets.targetFat;
}

function updateHint(container, { targetKcal, targetProtein, targetCarbs, targetFat }) {
  const hint = container.querySelector('#nt-hint');
  if (!hint) return;
  if (!targetKcal) { hint.textContent = ''; return; }
  const fromMacros = (targetProtein * 4) + (targetCarbs * 4) + (targetFat * 9);
  hint.textContent = `Macro breakdown: ${targetProtein}g protein · ${targetCarbs}g carbs · ${targetFat}g fat = ${fromMacros} kcal`;
}

function getFormNutritionInputs(form) {
  return {
    weightKg:         form.querySelector('#weightKg')?.value,
    heightCm:         form.querySelector('#heightCm')?.value,
    age:              form.querySelector('#age')?.value,
    gender:           form.querySelector('#gender')?.value,
    goal:             form.querySelector('#goal')?.value,
    trainingIntensity: form.querySelector('#trainingIntensity')?.value || 'moderate',
  };
}

function bindEvents(container) {
  const form = container.querySelector('#profile-form');
  if (!form) return;

  // Live BMI update
  const weightInput = form.querySelector('#weightKg');
  const heightInput = form.querySelector('#heightCm');
  const bmiDisplay  = container.querySelector('#bmi-display');

  function updateBMI() {
    bmiDisplay.innerHTML = renderBMI({ weightKg: weightInput.value, heightCm: heightInput.value });
  }

  weightInput.addEventListener('input', updateBMI);
  heightInput.addEventListener('input', updateBMI);

  // Show/hide nutrition section on goal change; auto-calculate
  form.querySelector('#goal')?.addEventListener('change', (e) => {
    const hasGoal = !!e.target.value;
    container.querySelector('#intensity-group').hidden    = !hasGoal;
    container.querySelector('#nutrition-targets').hidden = !hasGoal;
    if (hasGoal) triggerCalculate(container, form);
  });

  // Recalculate when intensity changes
  form.querySelector('#trainingIntensity')?.addEventListener('change', () => {
    triggerCalculate(container, form);
  });

  // Manual recalculate button
  container.querySelector('#recalc-btn')?.addEventListener('click', () => {
    triggerCalculate(container, form);
  });

  // Save active profile
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    profileStore.set({
      nickname:          data.get('nickname') || '',
      gender:            data.get('gender') || '',
      weightKg:          data.get('weightKg') ? parseFloat(data.get('weightKg')) : '',
      heightCm:          data.get('heightCm') ? parseFloat(data.get('heightCm')) : '',
      age:               data.get('age') ? parseInt(data.get('age'), 10) : '',
      goal:              data.get('goal') || '',
      trainingIntensity: data.get('trainingIntensity') || '',
      targetKcal:        data.get('targetKcal')    ? parseFloat(data.get('targetKcal'))    : '',
      targetProtein:     data.get('targetProtein') ? parseFloat(data.get('targetProtein')) : '',
      targetCarbs:       data.get('targetCarbs')   ? parseFloat(data.get('targetCarbs'))   : '',
      targetFat:         data.get('targetFat')     ? parseFloat(data.get('targetFat'))     : '',
    });

    const feedback = container.querySelector('#save-feedback');
    feedback.textContent = 'Saved!';
    feedback.classList.add('visible');
    setTimeout(() => feedback.classList.remove('visible'), 2000);
  });

  // Open add profile modal
  container.querySelector('#add-profile-btn')?.addEventListener('click', () => openAddModal(container));

  // Close add profile modal
  container.querySelector('#close-add-profile-modal')?.addEventListener('click', () => closeAddModal(container));
  container.querySelector('#cancel-add-profile')?.addEventListener('click', () => closeAddModal(container));
  container.querySelector('#add-profile-modal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeAddModal(container);
  });

  // Confirm add profile
  container.querySelector('#confirm-add-profile')?.addEventListener('click', () => {
    const input = container.querySelector('#new-profile-nickname');
    const nickname = (input?.value || '').trim();
    if (!nickname) {
      input?.focus();
      return;
    }
    createProfile(nickname); // triggers reload
  });

  // Enter key in nickname input
  container.querySelector('#new-profile-nickname')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') container.querySelector('#confirm-add-profile')?.click();
    if (e.key === 'Escape') closeAddModal(container);
  });

  // Profile grid: switch / delete
  container.querySelector('#profiles-grid')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const pid = btn.dataset.pid;
    const action = btn.dataset.action;

    if (action === 'switch') {
      switchProfile(pid); // triggers reload
    } else if (action === 'delete') {
      const { profiles } = profilesStore.get();
      const name = profiles.find(p => p.id === pid)?.nickname || 'this profile';
      if (confirm(`Delete "${name}"? This cannot be undone.`)) {
        deleteProfile(pid); // triggers reload
      }
    }
  });
}

function triggerCalculate(container, form) {
  const { weightKg, heightCm, age, gender, goal, trainingIntensity } = getFormNutritionInputs(form);
  const targets = calculateTargets(weightKg, heightCm, age, gender, goal, trainingIntensity);
  if (targets) {
    applyTargets(container, targets);
    updateHint(container, targets);
  }
}

function renderBMI(profile) {
  const w = parseFloat(profile.weightKg);
  const h = parseFloat(profile.heightCm);
  if (!w || !h) return '';

  const hm = h / 100;
  const bmi = w / (hm * hm);
  const rounded = Math.round(bmi * 10) / 10;

  let category = '';
  let cls = '';
  if (bmi < 18.5)      { category = 'Underweight'; cls = 'bmi-under'; }
  else if (bmi < 25)   { category = 'Normal weight'; cls = 'bmi-normal'; }
  else if (bmi < 30)   { category = 'Overweight'; cls = 'bmi-over'; }
  else                  { category = 'Obese'; cls = 'bmi-obese'; }

  return `
    <div class="bmi-card ${cls}">
      <div class="bmi-value">${rounded}</div>
      <div class="bmi-label">BMI · ${category}</div>
    </div>
  `;
}

function escHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
