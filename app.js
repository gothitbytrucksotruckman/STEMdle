// STEMdle — Static Site Version
// Stats are saved to localStorage only.

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

const $ = (id) => document.getElementById(id);

// en-CA formats as YYYY-MM-DD in local time (toISOString would give UTC)
const localDate = (d = new Date()) => d.toLocaleDateString('en-CA');

// ponytail: inline SVG icon helper — uses the #i-* sprite defs in index.html
const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;

// --- URL Routing ---
function setUrlParam(key, value) {
  const url = new URL(window.location);
  if (value) {
    url.searchParams.set(key, value);
  } else {
    url.searchParams.delete(key);
  }
  if (url.href !== window.location.href) window.history.pushState({}, '', url);
}

function getUrlParam(key) {
  const url = new URL(window.location);
  return url.searchParams.get(key);
}

// --- View routing ---
function showView(id) {
  document.querySelectorAll('.view').forEach((v) => v.classList.add('hidden'));
  $(id).classList.remove('hidden');

  // Clear URL params if going back to landing
  if (id === 'view-landing') {
    if (window.location.search) window.history.pushState({}, '', window.location.pathname);
  } else if (id === 'view-stats') {
    setUrlParam('view', 'stats');
  }
}

window.addEventListener('popstate', () => {
  // Handle browser back button
  handleRoute();
});

// --- Stats (localStorage based) ---
function getLocalStats() {
  const data = localStorage.getItem('stemdle_results');
  return data ? JSON.parse(data) : [];
}

function saveLocalResult(sectionId, guesses, solved) {
  const results = getLocalStats();
  const date = localDate();

  // Replay prevention isn't strictly enforced in static mode to allow replaying,
  // but we can just save all results for stats.
  results.push({ section: sectionId, date, guesses, solved: solved ? 1 : 0 });
  localStorage.setItem('stemdle_results', JSON.stringify(results));
}

function toggleSidebar() {
  const open = $('sidebar').classList.contains('hidden');
  $('sidebar').classList.toggle('hidden', !open);
  $('sidebar-overlay').classList.toggle('hidden', !open);
  $('menu-btn').innerHTML = open ? icon('x') : icon('menu');
  $('menu-btn').setAttribute('aria-expanded', open);
  $('menu-btn').setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  (open ? $('sidebar-stats-btn') : $('menu-btn')).focus();
}

$('menu-btn').addEventListener('click', toggleSidebar);
$('sidebar-overlay').addEventListener('click', toggleSidebar);
$('sidebar-stats-btn').addEventListener('click', () => { toggleSidebar(); showStats(); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !$('sidebar').classList.contains('hidden')) toggleSidebar();
});

// --- Theme (system default, manual override persisted) ---
const isDark = () =>
  document.documentElement.dataset.theme
    ? document.documentElement.dataset.theme === 'dark'
    : matchMedia('(prefers-color-scheme: dark)').matches;

function syncThemeBtn() {
  const dark = isDark();
  $('theme-btn').innerHTML = `${icon(dark ? 'sun' : 'moon')}<span>${dark ? 'Light' : 'Dark'} mode</span>`;
}

$('theme-btn').addEventListener('click', () => {
  const next = isDark() ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem('stemdle_theme', next); } catch (e) {}
  syncThemeBtn();
});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', syncThemeBtn);
syncThemeBtn();
$('stats-back-btn').addEventListener('click', () => showView('view-landing'));

function showStats() {
  const rows = getLocalStats().sort((a, b) => a.date.localeCompare(b.date));

  const total = rows.length;
  const solvedRows = rows.filter((r) => r.solved);
  const solved = solvedRows.length;
  const givenUp = total - solved;
  const totalGuesses = solvedRows.reduce((s, r) => s + r.guesses, 0);
  const avgGuesses = solved ? +(totalGuesses / solved).toFixed(2) : 0;
  const best = solved ? Math.min(...solvedRows.map((r) => r.guesses)) : null;

  // Streak logic
  const solvedDates = new Set(solvedRows.map((r) => r.date));
  let streak = 0, longest = 0, cur = 0;
  let d = new Date();
  while (solvedDates.has(localDate(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }

  const sorted = [...solvedDates].sort();
  sorted.forEach((date, i) => {
    if (i === 0) { cur = 1; }
    else {
      cur = Date.parse(date) - Date.parse(sorted[i - 1]) === 86400000 ? cur + 1 : 1;
    }
    if (cur > longest) longest = cur;
  });

  // Per section
  const perSection = {};
  rows.forEach((r) => {
    if (!perSection[r.section]) perSection[r.section] = { played: 0, solved: 0, totalGuesses: 0 };
    perSection[r.section].played++;
    if (r.solved) { perSection[r.section].solved++; perSection[r.section].totalGuesses += r.guesses; }
  });
  Object.values(perSection).forEach((s) => {
    s.avgGuesses = s.solved ? +(s.totalGuesses / s.solved).toFixed(2) : 0;
    delete s.totalGuesses;
  });

  const content = $('stats-content');
  content.innerHTML = `
    <div class="stats-grid">
      <div class="stat-box"><div class="stat-val">${total}</div><div class="stat-label">Played</div></div>
      <div class="stat-box"><div class="stat-val">${solved}</div><div class="stat-label">Solved</div></div>
      <div class="stat-box"><div class="stat-val">${givenUp}</div><div class="stat-label">Given up</div></div>
      <div class="stat-box"><div class="stat-val">${avgGuesses || '—'}</div><div class="stat-label">Avg guesses</div></div>
      <div class="stat-box"><div class="stat-val">${best ?? '—'}</div><div class="stat-label">Best</div></div>
      <div class="stat-box"><div class="stat-val">${streak}</div><div class="stat-label">Streak ${icon('flame')}</div></div>
      <div class="stat-box"><div class="stat-val">${longest}</div><div class="stat-label">Longest streak</div></div>
    </div>
    ${Object.keys(perSection).length ? `
      <div class="card stats-section">
        <h2 class="card-title">Per section</h2>
        <table class="stats-table">
          <thead><tr><th>Section</th><th>Played</th><th>Solved</th><th>Avg</th></tr></thead>
          <tbody>${Object.entries(perSection).map(([k, v]) =>
            `<tr><td>${sections.find((s) => s.id === k)?.label ?? k}</td><td>${v.played}</td><td>${v.solved}</td><td>${v.avgGuesses || '—'}</td></tr>`
          ).join('')}</tbody>
        </table>
      </div>` : ''}
  `;
  showView('view-stats');
}

// --- Section registry ---
async function loadSections() {
  const res = await fetch('data/sections.json');
  sections = (await res.json()).sections;
  const container = $('section-buttons');
  container.innerHTML = '';
  sections.forEach((s) => {
    const btn = document.createElement('button');
    btn.className = 'section-card';
    btn.textContent = s.label;
    btn.insertAdjacentHTML('beforeend', icon('arrow-right'));
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
      allSections.map((s) => fetch(`data/${s.file}`).then((r) => r.json()))
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
  const res = await fetch(`data/${section.file}`);
  return (await res.json()).terms;
}

// --- Level select ---
async function showLevels(section) {
  currentSection = section;
  currentBank = await loadBank(section);

  $('levels-section-label').textContent = section.label;

  const list = $('levels-list');
  list.innerHTML = `
    <div class="level-hero"></div>
    <h2 class="card-title level-grid-title">All levels</h2>
    <div class="level-grid"></div>`;
  const hero = list.querySelector('.level-hero');
  const grid = list.querySelector('.level-grid');

  const dailyBtn = document.createElement('button');
  dailyBtn.className = 'level-random-btn';
  dailyBtn.innerHTML = icon('flame') + " Today's puzzle";
  dailyBtn.onclick = () => startGame(section, currentBank[dayIndex(currentBank.length)]);
  hero.appendChild(dailyBtn);

  const randomBtn = document.createElement('button');
  randomBtn.className = 'level-random-btn';
  randomBtn.innerHTML = icon('dice') + ' Random level';
  randomBtn.onclick = () => {
    const pick = currentBank[Math.floor(Math.random() * currentBank.length)];
    startGame(section, pick);
  };
  hero.appendChild(randomBtn);

  [...currentBank].reverse().forEach((term) => {
    const btn = document.createElement('button');
    btn.className = 'level-btn';
    btn.textContent = `#${term.number}`;
    if (term._section) {
      const small = document.createElement('small');
      small.textContent = term._section;
      btn.appendChild(small);
    }
    btn.setAttribute('aria-label', `Level ${term.number}${term._section ? `, ${term._section}` : ''}`);
    btn.onclick = () => startGame(section, term);
    grid.appendChild(btn);
  });

  setUrlParam('section', section.id);
  setUrlParam('level', null); // clear level if we are just viewing the list
  showView('view-levels');
}

// --- Daily puzzle selection ---
function dayIndex(termCount) {
  const n = new Date();
  const days = Math.floor((Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()) - EPOCH) / 86400000);
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

  setUrlParam('section', section.id);
  setUrlParam('level', term.number);

  // Show source section name for True Engineer mode, else just number
  const numLabel = term._section ? `(${term._section}) #${term.number}` : `#${term.number}`;
  $('puzzle-label').textContent = `${section.label} ${numLabel}`;
  $('hints-list').innerHTML = '';
  $('guess-list').innerHTML = '';
  $('guess-count').textContent = '0';
  $('search-input').value = '';
  $('search-results').innerHTML = '';
  $('guess-error').textContent = '';
  $('search-input').disabled = false;

  renderHints();
  showView('view-game');
  $('search-input').focus();
}

function renderHints() {
  const list = $('hints-list');
  list.innerHTML = '';
  // Always render exactly 5 hints
  for (let i = 0; i < 5; i++) {
    const li = document.createElement('li');
    if (i < state.hintsShown) {
      li.textContent = currentTerm.hints[i];
      if (i === state.hintsShown - 1) li.classList.add('new-hint');
    } else {
      li.innerHTML = icon('lock') + ' Locked — Guess to reveal';
      li.classList.add('locked-hint');
    }
    list.appendChild(li);
  }
}

// --- Search ---
$('search-input').addEventListener('input', (e) => {
  if (state?.solved || state?.givenUp) return;
  $('guess-error').textContent = '';
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
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = t.answer;
    btn.disabled = state.guesses.includes(t.answer);
    btn.onclick = () => {
      $('search-input').value = t.answer;
      results.innerHTML = ''; // hide dropdown after selecting
      $('search-input').focus();
    };
    results.appendChild(btn);
  });
});

// Arrow keys move between input and results; Esc returns to the input
$('search-input').addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') {
    const first = $('search-results').querySelector('button:not(:disabled)');
    if (first) { e.preventDefault(); first.focus(); }
  }
});
$('search-results').addEventListener('keydown', (e) => {
  const items = [...$('search-results').querySelectorAll('button:not(:disabled)')];
  const i = items.indexOf(document.activeElement);
  if (e.key === 'ArrowDown' && i < items.length - 1) { e.preventDefault(); items[i + 1].focus(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); (i > 0 ? items[i - 1] : $('search-input')).focus(); }
  else if (e.key === 'Escape') { $('search-input').focus(); }
});

// --- Guess handling ---
$('submit-guess-btn').addEventListener('click', () => {
  const val = $('search-input').value.trim();
  if (!val) return;
  // Ensure it's a valid term from the bank
  const isValid = currentBank.some(t => t.answer.toLowerCase() === val.toLowerCase());
  if (!isValid) {
    $('guess-error').textContent = 'Not in the word list. Pick a term from the suggestions.';
    return;
  }
  // Find the canonical casing
  const canonicalAnswer = currentBank.find(t => t.answer.toLowerCase() === val.toLowerCase()).answer;
  submitGuess(canonicalAnswer);
});

// Allow hitting Enter in the input to submit
$('search-input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    $('submit-guess-btn').click();
  }
});

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
    li.innerHTML = `<span class="correct">${answer} ${icon('check')}</span>`;
  } else {
    li.innerHTML = `<span class="wrong">${answer} ${icon('xmark')}</span>${
      revealedHint ? `<span class="hint-tag">+ Hint ${state.hintsShown}</span>` : ''
    }`;
  }
  $('guess-list').appendChild(li);
}

// --- Give up ---
$('give-up-btn').addEventListener('click', () => {
  if (state.solved || state.givenUp) return;
  $('giveup-dialog').returnValue = ''; // Esc keeps the previous value, so clear it
  $('giveup-dialog').showModal();
});
$('giveup-dialog').addEventListener('close', () => {
  if ($('giveup-dialog').returnValue !== 'confirm') return;
  if (state.solved || state.givenUp) return;
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
    $('share-btn').classList.remove('hidden');
    $('share-btn').onclick = () => {
      const g = state.guesses.length;
      let grid = '';
      for (let i = 1; i <= 5; i++) {
        if (i < g) grid += `Hint ${i}: X\n`;
        else if (i === g) grid += `Hint ${i}: ✓ (${g} guesses)\n`;
      }
      if (g > 5) grid += `...and ${g - 5} more guesses\n`;
      const numLabel = currentTerm._section ? `(${currentTerm._section}) #${currentTerm.number}` : `#${currentTerm.number}`;
      const text = `STEMdle — ${currentSection.label} ${numLabel}\n${grid}★ ${tierObj.label}\nstemdle.app`;
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
    $('share-btn').classList.add('hidden'); // don't share give-ups
  }

  $('result-answer').textContent = currentTerm.answer;
  showView('view-result');

  // Save result locally
  saveLocalResult(currentSection.id, state.guesses.length, state.solved);
}

// --- Nav ---
$('back-btn').addEventListener('click', () => showLevels(currentSection));
$('levels-back-btn').addEventListener('click', () => showView('view-landing'));
$('play-again-btn').addEventListener('click', () => showLevels(currentSection));

async function handleRoute() {
  const view = getUrlParam('view');
  if (view === 'stats') {
    return showStats();
  }

  const sectionId = getUrlParam('section');
  const levelNum = getUrlParam('level');

  if (sectionId && sections.length > 0) {
    const section = sections.find(s => s.id === sectionId);
    if (section) {
      if (levelNum) {
        currentBank = await loadBank(section);
        const term = currentBank.find(t => t.number == levelNum);
        if (term) {
          return startGame(section, term);
        }
      }
      return showLevels(section);
    }
  }
  showView('view-landing');
}

// --- Init ---
async function init() {
  await loadSections();
  handleRoute();
}

init();
