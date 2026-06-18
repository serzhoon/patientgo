// ============================================================
// Контроллер записей на приём.
// Пациент: создаёт запись, смотрит и отменяет свои.
// Админ: видит все записи.
// ============================================================

const pool = require('../config/db');

// Создать запись на приём (пациент).
// Стандартные слоты времени приёма (одинаковые для всех врачей).
const ALL_SLOTS = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00',
                   '13:00','13:30','14:00','14:30','15:00'];

// Вернуть свободные слоты врача на конкретную дату (занятые исключаются).
async function freeSlots(req, res) {
  try {
    const { doctor_id, appdate } = req.query;
    if (!doctor_id || !appdate) {
      return res.status(400).json({ error: 'Нужны врач и дата' });
    }

    // Занятые слоты этого врача на эту дату (активные записи).
    const [busy] = await pool.query(
      `SELECT apptime FROM appointments
       WHERE doctor_id = ? AND appdate = ? AND status = 'booked'`,
      [doctor_id, appdate]
    );
    const busyTimes = busy.map(r => (r.apptime || '').slice(0, 5));

    // Оставляем только свободные.
    const free = ALL_SLOTS.filter(s => !busyTimes.includes(s));
    res.json(free);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

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
                TRIM(CONCAT(u.last_name, ' ', u.first_name, ' ', COALESCE(u.middle_name, ''))) AS patient_name,
                u.phone AS patient_phone
         FROM appointments a
         JOIN doctors d ON a.doctor_id = d.id
         JOIN users u   ON a.patient_id = u.id
         ORDER BY a.appdate, a.apptime`
      );
    } else if (req.user.role === 'doctor') {
      // Врач видит записи к себе (активные и завершённые, без отменённых).
      [rows] = await pool.query(
        `SELECT a.*, d.full_name AS doctor_name, d.specialty,
                TRIM(CONCAT(u.last_name, ' ', u.first_name, ' ', COALESCE(u.middle_name, ''))) AS patient_name,
                u.phone AS patient_phone
         FROM appointments a
         JOIN doctors d ON a.doctor_id = d.id
         JOIN users u   ON a.patient_id = u.id
         WHERE a.doctor_id = ? AND a.status <> 'cancelled'
         ORDER BY a.appdate, a.apptime`,
        [req.user.doctor_id]
      );
    } else {
      [rows] = await pool.query(
        `SELECT a.*, d.full_name AS doctor_name, d.specialty
         FROM appointments a
         JOIN doctors d ON a.doctor_id = d.id
         WHERE a.patient_id = ? AND a.status NOT IN ('cancelled', 'no_show')
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

// Отметить приём состоявшимся (только врач, только к себе).
async function completeAppointment(req, res) {
  try {
    const { id } = req.params;

    if (req.user.role !== 'doctor') {
      return res.status(403).json({ error: 'Только врач может отметить приём' });
    }

    const [rows] = await pool.query('SELECT * FROM appointments WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Запись не найдена' });
    }

    // Врач может отмечать только записи к себе.
    if (rows[0].doctor_id !== req.user.doctor_id) {
      return res.status(403).json({ error: 'Можно отмечать только записи к себе' });
    }

    await pool.query("UPDATE appointments SET status = 'done' WHERE id = ?", [id]);
    res.json({ message: 'Приём отмечен как состоявшийся' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

// Отметить неявку пациента (только врач, только к себе).
async function noShowAppointment(req, res) {
  try {
    const { id } = req.params;

    if (req.user.role !== 'doctor') {
      return res.status(403).json({ error: 'Только врач может отметить неявку' });
    }

    const [rows] = await pool.query('SELECT * FROM appointments WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Запись не найдена' });
    }

    if (rows[0].doctor_id !== req.user.doctor_id) {
      return res.status(403).json({ error: 'Можно отмечать только записи к себе' });
    }

    await pool.query("UPDATE appointments SET status = 'no_show' WHERE id = ?", [id]);
    res.json({ message: 'Отмечена неявка пациента' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

module.exports = { createAppointment, listAppointments, cancelAppointment, completeAppointment, noShowAppointment, freeSlots };
