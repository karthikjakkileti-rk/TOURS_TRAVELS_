const express = require('express');
const router = express.Router();
const { getBookings, getBookingById, createBooking, updateBooking, deleteBooking, updateBookingStatus } = require('../controllers/bookingController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);

// Admin & customer can create/read. Deletes are admin only
router.get('/', getBookings);
router.get('/:id', getBookingById);
router.post('/', createBooking);
router.post('/create', createBooking); // Alias endpoint
router.put('/update-status', updateBookingStatus);
router.put('/:id', updateBooking);
router.delete('/:id', authorize('admin'), deleteBooking);

module.exports = router;
