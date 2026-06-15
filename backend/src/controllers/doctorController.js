// ============================================================
// Контроллер врачей.
// Просмотр списка (всем), добавление/удаление (только админ).
// ============================================================

const pool = require('../config/db');

// Список всех врачей.
async function listDoctors(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM doctors ORDER BY full_name');
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

// Добавить врача (только админ).
async function createDoctor(req, res) {
  try {
    const { full_name, specialty, cabinet } = req.body;
    if (!full_name || !specialty) {
      return res.status(400).json({ error: 'Укажите имя и специальность' });
    }
    const [result] = await pool.query(
      'INSERT INTO doctors (full_name, specialty, cabinet) VALUES (?, ?, ?)',
      [full_name, specialty, cabinet || null]
    );
    res.status(201).json({ message: 'Врач добавлен', doctorId: result.insertId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

// Удалить врача (только админ).
async function deleteDoctor(req, res) {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM doctors WHERE id = ?', [id]);
    res.json({ message: 'Врач удалён' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

module.exports = { listDoctors, createDoctor, deleteDoctor };
