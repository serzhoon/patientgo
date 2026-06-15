// ============================================================
// Подключение к базе данных MySQL.
// Используем пул соединений (connection pool).
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

// При каждом новом соединении явно переключаем его на кодировку utf8mb4,
// чтобы кириллица читалась правильно (иначе русские буквы ломаются).
pool.on('connection', (connection) => {
  connection.query("SET NAMES utf8mb4");
});

module.exports = pool;
