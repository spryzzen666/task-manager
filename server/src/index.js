import express from 'express';
import cors from 'cors';
import { resolve } from 'node:path';
import db from './db.js';
import { hashPassword, verifyPassword, generateToken } from './auth.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// ---------- СТАТИКА (собранный React-клиент) ----------
app.use(express.static('public'));

// Регистрация
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Заполните имя, email и пароль' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: 'Пароль должен быть не короче 6 символов' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  let insert;
  try {
    insert = db.prepare('INSERT INTO users (name, email, pass_hash) VALUES (?, ?, ?)')
      .run(normalizedEmail.split('@')[0] === '' ? '' : name.trim(), normalizedEmail, hashPassword(password));
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'Пользователь с таким email уже существует' });
    }
    throw err;
  }

  const token = createSession(insert.lastInsertRowid);
  res.status(201).json({
    token,
    user: { id: insert.lastInsertRowid, name: name.trim(), email: normalizedEmail },
  });
});

// Вход
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Введите email и пароль' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?')
    .get(String(email).trim().toLowerCase());
  if (!user || !verifyPassword(password, user.pass_hash)) {
    return res.status(401).json({ error: 'Неверный email или пароль' });
  }

  const token = createSession(user.id);
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email },
  });
});

// Проверка сессии (для восстановления при обновлении страницы)
app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: { id: req.user.id, name: req.user.name, email: req.user.email } });
});

// Выход
app.post('/api/auth/logout', (req, res) => {
  const token = extractToken(req);
  if (token) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  }
  res.json({ ok: true });
});

// ---------- ЗАДАЧИ ----------
app.get('/api/tasks', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY done ASC, id DESC')
    .all(req.user.id);
  res.json(rows.map(rowToTask));
});

app.post('/api/tasks', requireAuth, (req, res) => {
  const title = (req.body?.title || '').trim();
  if (!title) {
    return res.status(400).json({ error: 'Заголовок задачи не может быть пустым' });
  }
  const insert = db.prepare('INSERT INTO tasks (user_id, title) VALUES (?, ?)')
    .run(req.user.id, title);
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(insert.lastInsertRowid);
  res.status(201).json(rowToTask(row));
});

app.put('/api/tasks/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const task = findOwnedTask(id, req.user.id, res);
  if (!task) return;

  const done = req.body?.done !== undefined ? (req.body.done ? 1 : 0) : task.done;
  const title = req.body?.title !== undefined ? String(req.body.title).trim() : task.title;
  if (!title) {
    return res.status(400).json({ error: 'Заголовок задачи не может быть пустым' });
  }

  db.prepare('UPDATE tasks SET title = ?, done = ? WHERE id = ?').run(title, done, id);
  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  res.json(rowToTask(updated));
});

app.delete('/api/tasks/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const task = findOwnedTask(id, req.user.id, res);
  if (!task) return;

  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  res.json({ ok: true });
});

// ---------- ХЕЛПЕРЫ ----------

function findOwnedTask(id, userId, res) {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(id, userId);
  if (!task) {
    res.status(404).json({ error: 'Задача не найдена' });
    return null;
  }
  return task;
}

function rowToTask(row) {
  return { id: row.id, title: row.title, done: !!row.done, createdAt: row.created_at };
}

function createSession(userId) {
  const token = generateToken();
  db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, userId);
  return token;
}

function extractToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }
  const session = db.prepare(
    'SELECT u.id, u.name, u.email FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?'
  ).get(token);
  if (!session) {
    return res.status(401).json({ error: 'Сессия истекла, войдите снова' });
  }
  req.user = session;
  req.token = token;
  next();
}

// SPA-фоллбэк: любой не-API маршрут отдаёт index.html (refresh / прямой ввод URL)
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(resolve('public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`API on http://localhost:${PORT}`);
});