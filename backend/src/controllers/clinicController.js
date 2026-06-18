// ============================================================
// Контроллер поликлиник и городов.
// Нужен, чтобы при регистрации показать список для выбора.
// ============================================================

const pool = require('../config/db');

// Список городов.
async function listCities(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM cities ORDER BY name');
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

// Список поликлиник. Можно отфильтровать по городу через ?city_id=
async function listClinics(req, res) {
  try {
    const cityId = req.query.city_id;
    let rows;
    if (cityId) {
      [rows] = await pool.query('SELECT * FROM clinics WHERE city_id = ? ORDER BY name', [cityId]);
    } else {
      [rows] = await pool.query('SELECT * FROM clinics ORDER BY name');
    }
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

module.exports = { listCities, listClinics };
