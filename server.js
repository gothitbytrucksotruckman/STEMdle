const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createUser, getUser, saveResult, playedToday, getStats } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  const s = require('crypto').randomBytes(32).toString('hex');
  console.warn('⚠️  No JWT_SECRET env var — generated random secret. Set JWT_SECRET to persist sessions across restarts.');
  return s;
})();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/data', express.static(path.join(__dirname, 'data')));

// --- Auth middleware ---
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(header.replace('Bearer ', ''), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// --- Register ---
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  if (username.length < 2 || username.length > 20) return res.status(400).json({ error: 'username must be 2–20 chars' });
  if (password.length < 6) return res.status(400).json({ error: 'password must be at least 6 chars' });
  if (getUser(username)) return res.status(409).json({ error: 'Username taken' });

  const hash = await bcrypt.hash(password, 10);
  const result = createUser(username, hash);
  const token = jwt.sign({ id: result.lastInsertRowid, username }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, username });
});

// --- Login ---
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  const user = getUser(username);
  if (!user) return res.status(401).json({ error: 'Invalid username or password' });
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return res.status(401).json({ error: 'Invalid username or password' });

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, username: user.username });
});

// --- Save result ---
app.post('/api/result', authMiddleware, (req, res) => {
  const { section, termNumber, guesses, solved } = req.body;
  const date = new Date().toISOString().slice(0, 10);
  try {
    saveResult(req.user.id, section, termNumber, date, guesses, solved);
    res.json({ ok: true });
  } catch (e) {
    // UNIQUE constraint = already played today, ignore
    res.json({ ok: true, skipped: true });
  }
});

// --- Check played today ---
app.get('/api/played-today', authMiddleware, (req, res) => {
  const { section } = req.query;
  const date = new Date().toISOString().slice(0, 10);
  res.json({ played: playedToday(req.user.id, section, date) });
});

// --- Stats ---
app.get('/api/stats', authMiddleware, (req, res) => {
  res.json(getStats(req.user.id));
});

app.listen(PORT, () => console.log(`STEMdle running on http://localhost:${PORT}`));
