const express = require('express');
const router = express.Router();
const { getDashboardStats, getDashboardSummary } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);
router.use(authorize('admin')); // Dashboard is restricted to Admin

router.get('/', getDashboardSummary);
router.get('/stats', getDashboardStats);

module.exports = router;
