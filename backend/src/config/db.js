// ============================================================
// Подключение к базе данных MySQL.
// Используем пул соединений (connection pool) — это эффективнее,
// чем открывать новое соединение на каждый запрос.
// ============================================================

const mysql = require('mysql2/promise');
require('dotenv').config();

// Создаём пул. Параметры берутся из переменных окружения (.env),
// чтобы не хранить пароли прямо в коде.
const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 3306,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'clinic',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
