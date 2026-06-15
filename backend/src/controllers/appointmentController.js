// ============================================================
// Контроллер записей на приём.
// Пациент: создаёт запись, смотрит и отменяет свои.
// Админ: видит все записи.
// ============================================================

const pool = require('../config/db');

// Создать запись на приём (пациент).
async function createAppointment(req, res) {
  try {
    const { doctor_id, appdate, apptime, comment } = req.body;
    const patient_id = req.user.id; // берём из токена, а не из тела запроса

    if (!doctor_id || !appdate || !apptime) {
      return res.status(400).json({ error: 'Выберите врача, дату и время' });
    }

    // Проверяем, что слот у этого врача ещё свободен.
    const [busy] = await pool.query(
      `SELECT id FROM appointments
       WHERE doctor_id = ? AND appdate = ? AND apptime = ? AND status = 'booked'`,
      [doctor_id, appdate, apptime]
    );
    if (busy.length > 0) {
      return res.status(409).json({ error: 'Это время уже занято, выберите другое' });
    }

    const [result] = await pool.query(
      `INSERT INTO appointments (patient_id, doctor_id, appdate, apptime, comment)
       VALUES (?, ?, ?, ?, ?)`,
      [patient_id, doctor_id, appdate, apptime, comment || null]
    );

    res.status(201).json({ message: 'Вы записаны на приём', appointmentId: result.insertId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера при создании записи' });
  }
}

// Список записей.
// Пациент видит только свои; админ — все.
async function listAppointments(req, res) {
  try {
    let rows;
    if (req.user.role === 'admin') {
      [rows] = await pool.query(
        `SELECT a.*, d.full_name AS doctor_name, d.specialty,
                u.full_name AS patient_name, u.phone AS patient_phone
         FROM appointments a
         JOIN doctors d ON a.doctor_id = d.id
         JOIN users u   ON a.patient_id = u.id
         ORDER BY a.appdate, a.apptime`
      );
    } else {
      [rows] = await pool.query(
        `SELECT a.*, d.full_name AS doctor_name, d.specialty
         FROM appointments a
         JOIN doctors d ON a.doctor_id = d.id
         WHERE a.patient_id = ?
         ORDER BY a.appdate, a.apptime`,
        [req.user.id]
      );
    }
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

// Отменить запись.
// Пациент может отменить только свою; админ — любую.
async function cancelAppointment(req, res) {
  try {
    const { id } = req.params;

    // Сначала проверяем, чья это запись.
    const [rows] = await pool.query('SELECT * FROM appointments WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Запись не найдена' });
    }

    const appt = rows[0];
    if (req.user.role !== 'admin' && appt.patient_id !== req.user.id) {
      return res.status(403).json({ error: 'Можно отменять только свои записи' });
    }

    await pool.query("UPDATE appointments SET status = 'cancelled' WHERE id = ?", [id]);
    res.json({ message: 'Запись отменена' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

module.exports = { createAppointment, listAppointments, cancelAppointment };
