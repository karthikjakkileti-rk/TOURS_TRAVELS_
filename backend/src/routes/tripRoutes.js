const express = require('express');
const router = express.Router();
const { 
  getTrips, 
  getTripById, 
  trackTripByUid, 
  updateTripStatus, 
  updateTripLocation,
  getTripDetails,
  updateTripPayment,
  addTripComplaint,
  addTripRating
} = require('../controllers/tripController');
const { protect } = require('../middlewares/authMiddleware');

// Public tracking route (no auth required for customers using a Trip UID)
router.get('/tracking/:tripUid', trackTripByUid);

// Protected routes for Admin/Drivers
router.use(protect);
router.get('/', getTrips);
router.get('/:id', getTripById);
router.get('/:id/details', getTripDetails);
router.post('/:id/status', updateTripStatus);
router.post('/:id/location', updateTripLocation);
router.post('/:id/payment', updateTripPayment);
router.post('/:id/complaint', addTripComplaint);
router.post('/:id/rating', addTripRating);

module.exports = router;
