const express = require('express');
const router = express.Router();
const { getDrivers, getDriverById, createDriver, updateDriver, deleteDriver } = require('../controllers/driverController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);
router.use(authorize('admin')); // All driver CRUD is admin only

router.get('/', getDrivers);
router.get('/:id', getDriverById);
router.post('/', createDriver);
router.put('/:id', updateDriver);
router.delete('/:id', deleteDriver);

module.exports = router;
