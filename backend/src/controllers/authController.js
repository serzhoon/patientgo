// ============================================================
// Контроллер аутентификации (упрощённый вариант).
// Регистрация пациента и вход. Пароль хранится как обычный текст
// и сравнивается напрямую — без хеширования и без токенов.
// ============================================================

const pool = require('../config/db');

// --- Регистрация нового пациента ---
async function register(req, res) {
  try {
    const { last_name, first_name, middle_name, birth_date,
            email, phone, password, clinic_id } = req.body;

    // Проверка обязательных полей (отчество необязательно).
    if (!last_name || !first_name || !birth_date || !email || !password || !clinic_id) {
      return res.status(400).json({ error: 'Заполните все обязательные поля' });
    }

    // Проверяем, нет ли уже пользователя с таким email.
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Пользователь с таким email уже существует' });
    }

    const [result] = await pool.query(
      `INSERT INTO users (last_name, first_name, middle_name, birth_date, email, phone, password, clinic_id, role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [last_name, first_name, middle_name || null, birth_date, email, phone || null, password, clinic_id, 'patient']
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

    // Имя собираем из фамилии/имени/отчества. clinic_id нужен для фильтра врачей.
    const [rows] = await pool.query(
      `SELECT id,
              TRIM(CONCAT(last_name, ' ', first_name, ' ', COALESCE(middle_name, ''))) AS full_name,
              email, role, clinic_id
       FROM users WHERE email = ? AND password = ?`,
      [email, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    res.json({ user: rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера при входе' });
  }
}

module.exports = { register, login };
