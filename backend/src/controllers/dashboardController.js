const db = require('../config/db');

// @desc    Get dashboard metrics & chart data
// @route   GET /api/dashboard/stats
// @access  Private/Admin
const getDashboardStats = async (req, res, next) => {
  try {
    // 1. KPI Cards data
    const [vehiclesCount] = await db.query('SELECT COUNT(*) AS total FROM vehicles');
    const [driversCount] = await db.query('SELECT COUNT(*) AS total FROM drivers');
    const [activeTrips] = await db.query('SELECT COUNT(*) AS total FROM trips WHERE status != "trip_completed"');
    const [completedTrips] = await db.query('SELECT COUNT(*) AS total FROM trips WHERE status = "trip_completed"');
    const [delayedTrips] = await db.query('SELECT COUNT(*) AS total FROM trips WHERE delay_status = "delayed" AND status != "trip_completed"');
    const [revenueSum] = await db.query('SELECT SUM(fare_amount) AS total FROM bookings WHERE booking_status = "completed"');

    // 2. Trips per Day (Last 7 Days)
    const [tripsPerDay] = await db.query(`
      SELECT DATE_FORMAT(trip_date, '%Y-%m-%d') as date, 
             COUNT(*) as count 
      FROM bookings 
      WHERE trip_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE_FORMAT(trip_date, '%Y-%m-%d')
      ORDER BY date ASC
    `);

    // 3. Revenue Analysis (Last 7 Days)
    const [revenueTrend] = await db.query(`
      SELECT DATE_FORMAT(trip_date, '%Y-%m-%d') as date, 
             SUM(fare_amount) as amount 
      FROM bookings 
      WHERE booking_status = 'completed' AND trip_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE_FORMAT(trip_date, '%Y-%m-%d')
      ORDER BY date ASC
    `);

    // 4. Vehicle Utilization Breakdown
    const [vehicleUtilization] = await db.query(`
      SELECT status, COUNT(*) as count 
      FROM vehicles 
      GROUP BY status
    `);

    // 5. Delay Statistics Breakdown
    const [delayBreakdown] = await db.query(`
      SELECT delay_status, COUNT(*) as count 
      FROM trips 
      WHERE status != 'trip_completed'
      GROUP BY delay_status
    `);

    // Format results
    const cards = {
      totalVehicles: vehiclesCount[0].total || 0,
      totalDrivers: driversCount[0].total || 0,
      activeTrips: activeTrips[0].total || 0,
      completedTrips: completedTrips[0].total || 0,
      delayedTrips: delayedTrips[0].total || 0,
      totalRevenue: parseFloat(revenueSum[0].total || 0).toFixed(2),
    };

    res.status(200).json({
      success: true,
      data: {
        cards,
        charts: {
          tripsPerDay,
          revenueTrend,
          vehicleUtilization,
          delayBreakdown
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard summary count values
// @route   GET /api/dashboard
// @access  Private/Admin
const getDashboardSummary = async (req, res, next) => {
  try {
    const [activeTrips] = await db.query('SELECT COUNT(*) AS total FROM trips WHERE status != "trip_completed"');
    const [completedTrips] = await db.query('SELECT COUNT(*) AS total FROM trips WHERE status = "trip_completed"');
    const [delayedTrips] = await db.query('SELECT COUNT(*) AS total FROM trips WHERE delay_status = "delayed" AND status != "trip_completed"');

    const active = activeTrips[0].total || 0;
    const completed = completedTrips[0].total || 0;
    const delayed = delayedTrips[0].total || 0;
    const total = active + completed;

    res.status(200).json({
      success: true,
      data: {
        totalTrips: total,
        activeTrips: active,
        completedTrips: completed,
        delayedTrips: delayed
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats, getDashboardSummary };
