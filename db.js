const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'stemdle.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (date('now'))
  );

  CREATE TABLE IF NOT EXISTS game_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    section TEXT NOT NULL,
    term_number INTEGER NOT NULL,
    date TEXT NOT NULL,
    guesses INTEGER NOT NULL,
    solved INTEGER NOT NULL,   -- 1 = solved, 0 = given up
    UNIQUE(user_id, section, date)
  );
`);

// --- User helpers ---
const stmtCreateUser = db.prepare(
  'INSERT INTO users (username, password_hash) VALUES (?, ?)'
);
function createUser(username, passwordHash) {
  return stmtCreateUser.run(username, passwordHash);
}

const stmtGetUser = db.prepare('SELECT * FROM users WHERE username = ?');
function getUser(username) {
  return stmtGetUser.get(username);
}

// --- Result helpers ---
const stmtSaveResult = db.prepare(`
  INSERT OR REPLACE INTO game_results (user_id, section, term_number, date, guesses, solved)
  VALUES (?, ?, ?, ?, ?, ?)
`);
function saveResult(userId, section, termNumber, date, guesses, solved) {
  return stmtSaveResult.run(userId, section, termNumber, date, guesses, solved ? 1 : 0);
}

const stmtPlayedToday = db.prepare(
  'SELECT id FROM game_results WHERE user_id = ? AND section = ? AND date = ?'
);
function playedToday(userId, section, date) {
  return !!stmtPlayedToday.get(userId, section, date);
}

// --- Stats helpers ---
function getStats(userId) {
  const rows = db.prepare(
    'SELECT * FROM game_results WHERE user_id = ? ORDER BY date ASC'
  ).all(userId);

  const total = rows.length;
  const solved = rows.filter((r) => r.solved).length;
  const givenUp = total - solved;
  const solvedRows = rows.filter((r) => r.solved);
  const totalGuesses = solvedRows.reduce((s, r) => s + r.guesses, 0);
  const avgGuesses = solvedRows.length ? +(totalGuesses / solvedRows.length).toFixed(2) : 0;
  const best = solvedRows.length ? Math.min(...solvedRows.map((r) => r.guesses)) : null;

  // Streak: consecutive calendar days with a solved round (up to today)
  const solvedDates = new Set(solvedRows.map((r) => r.date));
  let streak = 0, longest = 0, cur = 0;
  const today = new Date().toISOString().slice(0, 10);
  let d = new Date(today);
  while (solvedDates.has(d.toISOString().slice(0, 10))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  // Longest: scan all solved dates
  const sorted = [...solvedDates].sort();
  sorted.forEach((date, i) => {
    if (i === 0) { cur = 1; }
    else {
      const prev = new Date(sorted[i - 1]);
      prev.setDate(prev.getDate() + 1);
      cur = prev.toISOString().slice(0, 10) === date ? cur + 1 : 1;
    }
    if (cur > longest) longest = cur;
  });

  // Per-section breakdown
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

  return { total, solved, givenUp, totalGuesses, avgGuesses, best, streak, longest, perSection };
}

module.exports = { createUser, getUser, saveResult, playedToday, getStats };
