const express = require('express');
const router = express.Router();
const { getReportsList, exportReport } = require('../controllers/reportController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);
router.use(authorize('admin')); // Reports are restricted to Admin

router.get('/', getReportsList);
router.get('/export', exportReport);

module.exports = router;
