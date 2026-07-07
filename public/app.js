// STEMdle — Phase 2 client logic
// ponytail: no persistence for guests. Stats only for logged-in users.

const EPOCH = Date.UTC(2025, 0, 1);

const TIERS = [
  { max: 1, label: 'Genius' },
  { max: 2, label: 'Expert' },
  { max: 3, label: 'Solid' },
  { max: 5, label: 'Steady' },
  { max: Infinity, label: 'Marathon' },
];

let sections = [];
let currentSection = null;
let currentTerm = null;
let currentBank = [];
let state = null;

// --- Auth state ---
let authToken = localStorage.getItem('stemdle_token') || null;
let authUsername = localStorage.getItem('stemdle_username') || null;

const $ = (id) => document.getElementById(id);

// --- View routing ---
function showView(id) {
  document.querySelectorAll('.view').forEach((v) => v.classList.add('hidden'));
  $(id).classList.remove('hidden');
}

// --- Auth UI ---
function updateHeaderAuth() {
  if (authToken) {
    $('header-username').textContent = `👤 ${authUsername}`;
    $('header-username').classList.remove('hidden');
    $('header-stats-btn').classList.remove('hidden');
    $('header-logout-btn').classList.remove('hidden');
    $('header-login-btn').classList.add('hidden');
  } else {
    $('header-username').classList.add('hidden');
    $('header-stats-btn').classList.add('hidden');
    $('header-logout-btn').classList.add('hidden');
    $('header-login-btn').classList.remove('hidden');
  }
}

$('header-login-btn').addEventListener('click', () => {
  $('auth-modal').classList.remove('hidden');
  $('auth-error').classList.add('hidden');
  $('auth-form').reset();
});

$('auth-close-btn').addEventListener('click', () => $('auth-modal').classList.add('hidden'));

$('auth-modal').addEventListener('click', (e) => {
  if (e.target === $('auth-modal')) $('auth-modal').classList.add('hidden');
});

// Tab switching
let authMode = 'login';
document.querySelectorAll('.auth-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    authMode = tab.dataset.tab;
    document.querySelectorAll('.auth-tab').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    $('auth-submit-btn').textContent = authMode === 'login' ? 'Sign in' : 'Register';
    $('auth-error').classList.add('hidden');
  });
});

$('auth-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = $('auth-username').value.trim();
  const password = $('auth-password').value;
  $('auth-error').classList.add('hidden');

  const res = await fetch(`/api/${authMode}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();

  if (!res.ok) {
    $('auth-error').textContent = data.error;
    $('auth-error').classList.remove('hidden');
    return;
  }

  authToken = data.token;
  authUsername = data.username;
  localStorage.setItem('stemdle_token', authToken);
  localStorage.setItem('stemdle_username', authUsername);
  $('auth-modal').classList.add('hidden');
  updateHeaderAuth();
});

$('header-logout-btn').addEventListener('click', () => {
  authToken = null;
  authUsername = null;
  localStorage.removeItem('stemdle_token');
  localStorage.removeItem('stemdle_username');
  updateHeaderAuth();
  showView('view-landing');
});

// --- Stats ---
$('header-stats-btn').addEventListener('click', () => showStats());
$('stats-back-btn').addEventListener('click', () => showView('view-landing'));

async function showStats() {
  const res = await fetch('/api/stats', {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  if (!res.ok) return;
  const s = await res.json();

  const content = $('stats-content');
  content.innerHTML = `
    <div class="stats-grid">
      <div class="stat-box"><div class="stat-val">${s.total}</div><div class="stat-label">Played</div></div>
      <div class="stat-box"><div class="stat-val">${s.solved}</div><div class="stat-label">Solved</div></div>
      <div class="stat-box"><div class="stat-val">${s.givenUp}</div><div class="stat-label">Given up</div></div>
      <div class="stat-box"><div class="stat-val">${s.avgGuesses || '—'}</div><div class="stat-label">Avg guesses</div></div>
      <div class="stat-box"><div class="stat-val">${s.best ?? '—'}</div><div class="stat-label">Best</div></div>
      <div class="stat-box"><div class="stat-val">${s.streak}</div><div class="stat-label">Streak 🔥</div></div>
      <div class="stat-box"><div class="stat-val">${s.longest}</div><div class="stat-label">Longest streak</div></div>
    </div>
    ${Object.keys(s.perSection).length ? `
      <h3 style="margin:1.5rem 0 0.75rem">Per section</h3>
      <table class="stats-table">
        <thead><tr><th>Section</th><th>Played</th><th>Solved</th><th>Avg</th></tr></thead>
        <tbody>${Object.entries(s.perSection).map(([k, v]) =>
          `<tr><td>${k}</td><td>${v.played}</td><td>${v.solved}</td><td>${v.avgGuesses || '—'}</td></tr>`
        ).join('')}</tbody>
      </table>` : ''}
  `;
  showView('view-stats');
}

// --- Section registry ---
async function loadSections() {
  const res = await fetch('/data/sections.json');
  sections = (await res.json()).sections;
  const container = $('section-buttons');
  container.innerHTML = '';
  sections.forEach((s) => {
    const btn = document.createElement('button');
    btn.textContent = s.label;
    btn.onclick = () => showLevels(s);
    container.appendChild(btn);
  });
}

// --- Load term bank (handles merge for True Engineer) ---
async function loadBank(section) {
  if (section.merge) {
    // Fetch all non-merge sections and combine, prefixing each term's number for uniqueness
    const allSections = sections.filter((s) => !s.merge);
    const banks = await Promise.all(
      allSections.map((s) => fetch(`/data/${s.file}`).then((r) => r.json()))
    );
    // Assign global sequential numbers across the merged pool
    let counter = 1;
    return banks.flatMap((b, i) =>
      b.terms.map((t) => ({
        ...t,
        number: counter++,
        _section: allSections[i].label, // for display in puzzle label
      }))
    );
  }
  const res = await fetch(`/data/${section.file}`);
  return (await res.json()).terms;
}

// --- Level select ---
async function showLevels(section) {
  currentSection = section;
  currentBank = await loadBank(section);

  $('levels-section-label').textContent = section.label;

  const list = $('levels-list');
  list.innerHTML = '';

  const randomBtn = document.createElement('button');
  randomBtn.className = 'level-random-btn';
  randomBtn.textContent = '🎲 Random level';
  randomBtn.onclick = () => {
    const pick = currentBank[Math.floor(Math.random() * currentBank.length)];
    startGame(section, pick);
  };
  list.appendChild(randomBtn);

  [...currentBank].reverse().forEach((term) => {
    const btn = document.createElement('button');
    btn.className = 'level-btn';
    btn.textContent = term._section ? `#${term.number} (${term._section})` : `#${term.number}`;
    btn.onclick = () => startGame(section, term);
    list.appendChild(btn);
  });

  showView('view-levels');
}

// --- Daily puzzle selection ---
function dayIndex(termCount) {
  const days = Math.floor((Date.now() - EPOCH) / 86400000);
  return ((days % termCount) + termCount) % termCount;
}

async function startGame(section, term) {
  currentSection = section;
  if (!term) {
    currentBank = await loadBank(section);
    term = currentBank[dayIndex(currentBank.length)];
  }
  currentTerm = term;
  state = { guesses: [], hintsShown: 1, solved: false, givenUp: false };

  // Show source section name for True Engineer mode, else just number
  const numLabel = term._section ? `(${term._section}) #${term.number}` : `#${term.number}`;
  $('puzzle-label').textContent = `${section.label} ${numLabel}`;
  $('hints-list').innerHTML = '';
  $('guess-list').innerHTML = '';
  $('guess-count').textContent = '0';
  $('search-input').value = '';
  $('search-results').innerHTML = '';
  $('search-input').disabled = false;

  renderHints();
  showView('view-game');
  $('search-input').focus();
}

function renderHints() {
  const list = $('hints-list');
  list.innerHTML = '';
  for (let i = 0; i < state.hintsShown; i++) {
    const li = document.createElement('li');
    li.textContent = currentTerm.hints[i];
    list.appendChild(li);
  }
}

// --- Search ---
$('search-input').addEventListener('input', (e) => {
  if (state?.solved || state?.givenUp) return;
  const q = e.target.value.trim().toLowerCase();
  const results = $('search-results');
  results.innerHTML = '';
  if (!q) return;

  const matches = currentBank
    .filter((t) =>
      t.searchTags.some((tag) => tag.toLowerCase().includes(q)) ||
      t.answer.toLowerCase().includes(q)
    )
    .slice(0, 10);

  matches.forEach((t) => {
    const div = document.createElement('div');
    div.textContent = t.answer;
    const already = state.guesses.includes(t.answer);
    if (already) div.classList.add('guessed');
    if (!already) div.onclick = () => submitGuess(t.answer);
    results.appendChild(div);
  });
});

// --- Guess handling ---
function submitGuess(answer) {
  if (state.solved || state.givenUp) return;
  if (state.guesses.includes(answer)) return;

  state.guesses.push(answer);
  $('guess-count').textContent = state.guesses.length;

  if (answer === currentTerm.answer) {
    state.solved = true;
    addGuessLog(answer, true);
    endRound();
    return;
  }

  let revealedHint = null;
  if (state.hintsShown < 5) {
    state.hintsShown++;
    revealedHint = currentTerm.hints[state.hintsShown - 1];
    renderHints();
  }
  addGuessLog(answer, false, revealedHint);

  $('search-input').value = '';
  $('search-results').innerHTML = '';
  $('search-input').focus();
}

function addGuessLog(answer, correct, revealedHint) {
  const li = document.createElement('li');
  if (correct) {
    li.innerHTML = `<span style="color:var(--accent)">${answer} ✓</span>`;
  } else {
    li.innerHTML = `<span class="wrong">${answer} ✗</span>${
      revealedHint ? `<span class="hint-tag">+ Hint ${state.hintsShown}</span>` : ''
    }`;
  }
  $('guess-list').appendChild(li);
}

// --- Give up ---
$('give-up-btn').addEventListener('click', () => {
  if (state.solved || state.givenUp) return;
  if (!confirm('Give up and reveal the answer?')) return;
  state.givenUp = true;
  endRound();
});

// --- End round & Share ---
async function endRound() {
  $('search-input').disabled = true;
  $('search-results').innerHTML = '';

  const title = $('result-title');
  const tier = $('result-tier');
  const detail = $('result-detail');

  if (state.solved) {
    title.textContent = 'Solved!';
    const tierObj = TIERS.find((t) => state.guesses.length <= t.max);
    tier.textContent = tierObj.label;
    tier.classList.remove('revealed');
    detail.textContent = `${state.guesses.length} guess${state.guesses.length === 1 ? '' : 'es'}`;

    // Set up share payload
    $('share-btn').style.display = 'inline-block';
    $('share-btn').onclick = () => {
      const g = state.guesses.length;
      let grid = '';
      for (let i = 1; i <= 5; i++) {
        if (i < g) grid += `Hint ${i}: ❌\n`;
        else if (i === g) grid += `Hint ${i}: ✅ (${g} guesses)\n`;
      }
      if (g > 5) grid += `...and ${g - 5} more guesses\n`;
      const numLabel = currentTerm._section ? `(${currentTerm._section}) #${currentTerm.number}` : `#${currentTerm.number}`;
      const text = `STEMdle — ${currentSection.label} ${numLabel}\n${grid}⭐ ${tierObj.label}\nstemdle.app`;
      navigator.clipboard.writeText(text);

      const toast = $('toast');
      toast.classList.remove('hidden');
      setTimeout(() => toast.classList.add('hidden'), 2000);
    };
  } else {
    title.textContent = 'Revealed';
    tier.textContent = 'Answer shown';
    tier.classList.add('revealed');
    detail.textContent = `${state.guesses.length} guess${state.guesses.length === 1 ? '' : 'es'} before giving up`;
    $('share-btn').style.display = 'none'; // don't share give-ups
  }

  $('result-answer').textContent = currentTerm.answer;
  showView('view-result');

  // Save result for logged-in users
  if (authToken) {
    await fetch('/api/result', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        section: currentSection.id,
        termNumber: currentTerm.number,
        guesses: state.guesses.length,
        solved: state.solved,
      }),
    }).catch(() => {}); // non-blocking, best-effort
  }
}

// --- Nav ---
$('back-btn').addEventListener('click', () => showView('view-levels'));
$('levels-back-btn').addEventListener('click', () => showView('view-landing'));
$('play-again-btn').addEventListener('click', () => showView('view-levels'));

// --- Init ---
updateHeaderAuth();
loadSections();
