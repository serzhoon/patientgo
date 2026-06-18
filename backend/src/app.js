// ============================================================
// Точка входа в приложение (Express-сервер).
// Здесь подключаются middleware, маршруты и запускается сервер.
// ============================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const doctorRoutes = require('./routes/doctors');
const appointmentRoutes = require('./routes/appointments');
const clinicRoutes = require('./routes/clinics');

const app = express();

// CORS — разрешаем фронтенду (на GitHub Pages) обращаться к нашему API.
// В .env можно задать конкретный адрес фронтенда через CORS_ORIGIN.
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'
}));

// Разбираем JSON-тело запросов.
app.use(express.json());

// Указываем браузеру, что все ответы — в кодировке UTF-8 (чтобы кириллица не ломалась).
app.use((req, res, next) => {
  res.header('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Проверочный маршрут — удобно убедиться, что сервер жив.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API записи пациентов работает' });
});

// Подключаем группы маршрутов.
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api', clinicRoutes);

// Запуск сервера.
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
