// Маршруты записей на приём: /api/appointments/...
const express = require('express');
const router = express.Router();
const {
  createAppointment,
  listAppointments,
  cancelAppointment
} = require('../controllers/appointmentController');
const { authRequired } = require('../middleware/auth');

// Все операции с записями требуют авторизации.
router.post('/', authRequired, createAppointment);          // создать запись
router.get('/', authRequired, listAppointments);            // список записей
router.patch('/:id/cancel', authRequired, cancelAppointment); // отменить запись

module.exports = router;
