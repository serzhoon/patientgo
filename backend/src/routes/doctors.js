// Маршруты врачей: /api/doctors/...
const express = require('express');
const router = express.Router();
const { listDoctors, createDoctor, deleteDoctor } = require('../controllers/doctorController');
const { authRequired, adminRequired } = require('../middleware/auth');

router.get('/', listDoctors);                                   // список — всем
router.post('/', authRequired, adminRequired, createDoctor);    // добавить — только админ
router.delete('/:id', authRequired, adminRequired, deleteDoctor); // удалить — только админ

module.exports = router;
