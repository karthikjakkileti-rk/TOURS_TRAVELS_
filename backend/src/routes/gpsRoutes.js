const express = require('express');
const router = express.Router();
const { updateGpsLocation, getGpsLogs } = require('../controllers/gpsController');

// GPS API routes
router.post('/update', updateGpsLocation);
router.get('/:tripId', getGpsLogs);

module.exports = router;
