// Маршруты записей на приём: /api/appointments/...
const express = require('express');
const router = express.Router();
const {
  createAppointment,
  listAppointments,
  cancelAppointment,
  completeAppointment
} = require('../controllers/appointmentController');
const { authRequired } = require('../middleware/auth');

// Все операции с записями требуют авторизации.
router.post('/', authRequired, createAppointment);              // создать запись
router.get('/', authRequired, listAppointments);                // список записей
router.patch('/:id/cancel', authRequired, cancelAppointment);   // отменить запись
router.patch('/:id/complete', authRequired, completeAppointment); // отметить выполненным (врач)

module.exports = router;
