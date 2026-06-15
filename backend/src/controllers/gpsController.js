const db = require('../config/db');

// Helper to calculate distance in km using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
};

// @desc    Update GPS coordinates manually
// @route   POST /api/gps/update
// @access  Public (simulates vehicle telematics tracker hardware device updates)
const updateGpsLocation = async (req, res, next) => {
  const { tripId, latitude, longitude, address, speed } = req.body;

  try {
    if (!tripId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide tripId, latitude, and longitude' });
    }

    // Resolve trip ID (could be integer ID or string UID like 'TRIP-BLR-EC-001')
    let resolvedTripId = null;
    let trip = null;
    
    let [trips] = await db.query('SELECT * FROM trips WHERE id = ? OR trip_uid = ?', [tripId, tripId]);
    if (trips && trips.length > 0) {
      trip = trips[0];
      resolvedTripId = trip.id;
    }

    if (!resolvedTripId) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    const [bookings] = await db.query('SELECT * FROM bookings WHERE id = ?', [trip.booking_id]);
    if (bookings.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    const booking = bookings[0];

    // Calculate progress and telemetry metrics
    const totalDistance = calculateDistance(booking.pickup_latitude, booking.pickup_longitude, booking.drop_latitude, booking.drop_longitude);
    const distanceCovered = calculateDistance(booking.pickup_latitude, booking.pickup_longitude, latitude, longitude);
    let remainingDistance = calculateDistance(latitude, longitude, booking.drop_latitude, booking.drop_longitude);
    
    if (remainingDistance > totalDistance) remainingDistance = totalDistance;
    let progress = Math.round((distanceCovered / totalDistance) * 100);
    if (progress > 100) progress = 100;
    if (progress < 0) progress = 0;

    const speedKmh = speed || 45;
    const etaMinutes = Math.ceil((remainingDistance / speedKmh) * 60);

    // Check delay status
    let delayStatus = 'on_time';
    const now = new Date();
    const plannedEnd = new Date(trip.planned_end_time);
    const etaArrival = new Date(now.getTime() + etaMinutes * 60 * 1000);

    if (etaArrival > plannedEnd) {
      delayStatus = 'delayed';
      
      // Log notification if not already sent in the last 2 minutes
      const [recentAlert] = await db.query(
        'SELECT * FROM notifications WHERE trip_id = ? AND type = "delay" AND created_at > DATE_SUB(NOW(), INTERVAL 2 MINUTE)',
        [resolvedTripId]
      );
      
      if (recentAlert && recentAlert.length === 0) {
        await db.query(
          'INSERT INTO notifications (trip_id, type, title, message) VALUES (?, "delay", "GPS Delay Alert", ?)',
          [resolvedTripId, `Trip ${trip.trip_uid} is delayed. Telemetry updates: ETA is ${etaMinutes} mins, remaining distance: ${remainingDistance} km.`]
        );
      }
    }

    // Update coordinates & telemetry state in db
    await db.query(
      `UPDATE trips 
       SET current_latitude = ?, 
           current_longitude = ?, 
           current_address = ?, 
           route_progress_percent = ?, 
           distance_covered = ?, 
           remaining_distance = ?, 
           eta_minutes = ?, 
           delay_status = ? 
       WHERE id = ?`,
      [latitude, longitude, address || 'In Transit', progress, distanceCovered, remainingDistance, etaMinutes, delayStatus, resolvedTripId]
    );

    // Insert history log
    await db.query(
      'INSERT INTO gps_logs (trip_id, latitude, longitude, address, speed) VALUES (?, ?, ?, ?, ?)',
      [resolvedTripId, latitude, longitude, address || 'In Transit', speedKmh]
    );

    res.status(200).json({
      success: true,
      message: 'GPS location updated successfully',
      data: {
        tripId: resolvedTripId,
        tripUid: trip.trip_uid,
        latitude,
        longitude,
        progress,
        distanceCovered,
        remainingDistance,
        etaMinutes,
        delayStatus
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get GPS logs history
// @route   GET /api/gps/:tripId
// @access  Public
const getGpsLogs = async (req, res, next) => {
  const { tripId } = req.params;

  try {
    let resolvedTripId = null;
    let [trips] = await db.query('SELECT id FROM trips WHERE id = ? OR trip_uid = ?', [tripId, tripId]);
    if (trips && trips.length > 0) {
      resolvedTripId = trips[0].id;
    }

    if (!resolvedTripId) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    const [rows] = await db.query(
      'SELECT latitude, longitude, address, speed, recorded_at FROM gps_logs WHERE trip_id = ? ORDER BY id ASC',
      [resolvedTripId]
    );

    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  updateGpsLocation,
  getGpsLogs
};
