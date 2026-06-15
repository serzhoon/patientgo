// ============================================================
// Контроллер аутентификации (упрощённый вариант).
// Регистрация пациента и вход. Пароль хранится как обычный текст
// и сравнивается напрямую — без хеширования и без токенов.
// ============================================================

const pool = require('../config/db');

// --- Регистрация нового пациента ---
async function register(req, res) {
  try {
    const { full_name, email, phone, password } = req.body;

    // Простая проверка, что обязательные поля заполнены.
    if (!full_name || !email || !password) {
      return res.status(400).json({ error: 'Заполните имя, email и пароль' });
    }

    // Проверяем, нет ли уже пользователя с таким email.
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Пользователь с таким email уже существует' });
    }

    // Новые пользователи через регистрацию всегда получают роль 'patient'.
    const [result] = await pool.query(
      'INSERT INTO users (full_name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)',
      [full_name, email, phone || null, password, 'patient']
    );

    res.status(201).json({ message: 'Регистрация успешна', userId: result.insertId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера при регистрации' });
  }
}

// --- Вход (логин) ---
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Введите email и пароль' });
    }

    // Ищем пользователя с таким email и паролем.
    const [rows] = await pool.query(
      'SELECT id, full_name, email, role FROM users WHERE email = ? AND password = ?',
      [email, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    // Возвращаем данные пользователя. Фронт их запомнит и будет
    // присылать id и роль в заголовках следующих запросов.
    res.json({ user: rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера при входе' });
  }
}

module.exports = { register, login };
