// Маршруты городов и поликлиник: /api/cities, /api/clinics
const express = require('express');
const router = express.Router();
const { listCities, listClinics } = require('../controllers/clinicController');

router.get('/cities', listCities);    // GET /api/cities
router.get('/clinics', listClinics);  // GET /api/clinics?city_id=1

module.exports = router;
