const express = require('express');
const router = express.Router();
const { getVehicles, getVehicleById, createVehicle, updateVehicle, deleteVehicle } = require('../controllers/vehicleController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);

// Admin only can mutate vehicles, driver or customer can only view
router.get('/', getVehicles);
router.get('/:id', getVehicleById);

router.post('/', authorize('admin'), createVehicle);
router.put('/:id', authorize('admin'), updateVehicle);
router.delete('/:id', authorize('admin'), deleteVehicle);

module.exports = router;
