const db = require('../config/db');
const summaryGenerator = require('../utils/summaryGenerator');

// Helper to calculate distance in km using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return parseFloat(d.toFixed(2));
};

// @desc    Get all trips
// @route   GET /api/trips
// @access  Private
const getTrips = async (req, res, next) => {
  try {
    let query = `
      SELECT t.*, 
             b.customer_name, b.customer_mobile, b.pickup_location, b.pickup_latitude, b.pickup_longitude,
             b.drop_location, b.drop_latitude, b.drop_longitude, b.fare_amount,
             v.vehicle_number, v.vehicle_type,
             d.id AS driver_id, d.name AS driver_name, d.mobile_number AS driver_mobile
      FROM trips t
      JOIN bookings b ON t.booking_id = b.id
      LEFT JOIN vehicles v ON b.vehicle_id = v.id
      LEFT JOIN drivers d ON b.driver_id = d.id
    `;
    
    const params = [];
    
    // If user is a driver, filter trips assigned to them
    if (req.user.role === 'driver') {
      query += ` WHERE d.user_id = ?`;
      params.push(req.user.id);
    }
    
    query += ` ORDER BY t.id DESC`;
    
    const [rows] = await db.query(query, params);
    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single trip details
// @route   GET /api/trips/:id
// @access  Private
const getTripById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT t.*, 
              b.customer_name, b.customer_mobile, b.pickup_location, b.pickup_latitude, b.pickup_longitude,
              b.drop_location, b.drop_latitude, b.drop_longitude, b.fare_amount,
              v.vehicle_number, v.vehicle_type,
              d.name AS driver_name, d.mobile_number AS driver_mobile
       FROM trips t
       JOIN bookings b ON t.booking_id = b.id
       LEFT JOIN vehicles v ON b.vehicle_id = v.id
       LEFT JOIN drivers d ON b.driver_id = d.id
       WHERE t.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    const trip = rows[0];

    // Fetch GPS logs for path tracking
    const [gpsLogs] = await db.query(
      'SELECT latitude, longitude, address, recorded_at FROM gps_logs WHERE trip_id = ? ORDER BY id ASC',
      [id]
    );

    const tripSummary = summaryGenerator.generateTripSummary(trip.vehicle_number, trip.route_progress_percent, trip.eta_minutes);
    const delaySummary = summaryGenerator.generateDelaySummary(trip.delay_status, trip.eta_minutes, trip.planned_end_time, trip.current_address);
    const customerUpdateMessage = summaryGenerator.generateCustomerUpdateMessage(trip.status, trip.pickup_location, trip.drop_location, trip.driver_name, trip.vehicle_number);

    res.status(200).json({ 
      success: true, 
      data: { 
        ...trip, 
        gps_path: gpsLogs,
        trip_summary: tripSummary,
        delay_summary: delaySummary,
        customer_update_message: customerUpdateMessage
      } 
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get live trip details by UID (Public tracking for customers)
// @route   GET /api/trips/tracking/:tripUid
// @access  Public
const trackTripByUid = async (req, res, next) => {
  const { tripUid } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT t.*, 
              b.customer_name, b.pickup_location, b.pickup_latitude, b.pickup_longitude,
              b.drop_location, b.drop_latitude, b.drop_longitude,
              v.vehicle_number, v.vehicle_type,
              d.name AS driver_name, d.mobile_number AS driver_mobile
       FROM trips t
       JOIN bookings b ON t.booking_id = b.id
       LEFT JOIN vehicles v ON b.vehicle_id = v.id
       LEFT JOIN drivers d ON b.driver_id = d.id
       WHERE t.trip_uid = ?`,
      [tripUid]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Trip ID not found' });
    }

    const trip = rows[0];

    // Fetch coordinates history for drawing path on map
    const [gpsLogs] = await db.query(
      'SELECT latitude, longitude, address, recorded_at FROM gps_logs WHERE trip_id = ? ORDER BY id ASC',
      [trip.id]
    );

    const tripSummary = summaryGenerator.generateTripSummary(trip.vehicle_number, trip.route_progress_percent, trip.eta_minutes);
    const delaySummary = summaryGenerator.generateDelaySummary(trip.delay_status, trip.eta_minutes, trip.planned_end_time, trip.current_address);
    const customerUpdateMessage = summaryGenerator.generateCustomerUpdateMessage(trip.status, trip.pickup_location, trip.drop_location, trip.driver_name, trip.vehicle_number);

    res.status(200).json({ 
      success: true, 
      data: { 
        ...trip, 
        gps_path: gpsLogs,
        trip_summary: tripSummary,
        delay_summary: delaySummary,
        customer_update_message: customerUpdateMessage
      } 
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update trip status (workflow progress)
// @route   POST /api/trips/:id/status
// @access  Private (Admin & Drivers)
const updateTripStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = [
    'booking_created',
    'driver_assigned',
    'vehicle_dispatched',
    'driver_reached_pickup',
    'pickup_completed',
    'trip_in_progress',
    'drop_completed',
    'trip_completed'
  ];

  try {
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid trip status' });
    }

    const [trips] = await db.query('SELECT * FROM trips WHERE id = ?', [id]);
    if (trips.length === 0) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    const trip = trips[0];
    const [bookings] = await db.query('SELECT * FROM bookings WHERE id = ?', [trip.booking_id]);
    const booking = bookings[0];

    let updateFields = { status };
    
    // Set timing indicators
    if (status === 'trip_in_progress' || status === 'pickup_completed') {
      updateFields.actual_start_time = new Date();
      updateFields.pickup_status = 'completed';
    } else if (status === 'trip_completed') {
      updateFields.actual_end_time = new Date();
      updateFields.drop_status = 'completed';
      updateFields.route_progress_percent = 100;
      updateFields.remaining_distance = 0.00;
    }

    // Apply updates to trip
    const keys = Object.keys(updateFields);
    const values = Object.values(updateFields);
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    
    await db.query(
      `UPDATE trips SET ${setClause} WHERE id = ?`,
      [...values, id]
    );

    // Sync booking status
    let newBookingStatus = 'confirmed';
    if (status === 'trip_completed') {
      newBookingStatus = 'completed';
    }
    
    await db.query(
      'UPDATE bookings SET booking_status = ? WHERE id = ?',
      [newBookingStatus, trip.booking_id]
    );

    // Free vehicle and driver on completion
    if (status === 'trip_completed') {
      if (booking.vehicle_id) await db.query('UPDATE vehicles SET status = "available" WHERE id = ?', [booking.vehicle_id]);
      if (booking.driver_id) await db.query('UPDATE drivers SET status = "available" WHERE id = ?', [booking.driver_id]);
      
      // Dispatch Trip Completion Notification
      await db.query(
        'INSERT INTO notifications (trip_id, type, title, message) VALUES (?, "completion", "Trip Completed", ?)',
        [id, `Trip ${trip.trip_uid} from ${booking.pickup_location} to ${booking.drop_location} has successfully completed.`]
      );
    } else if (status === 'vehicle_dispatched') {
      // Dispatch assignment alert
      await db.query(
        'INSERT INTO notifications (trip_id, type, title, message) VALUES (?, "assignment", "Vehicle Dispatched", ?)',
        [id, `Vehicle assigned for trip ${trip.trip_uid} is dispatched and heading to pickup location.`]
      );
    }

    res.status(200).json({
      success: true,
      message: `Trip status updated to: ${status}`,
      data: { id, status, ...updateFields }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update trip location manually
// @route   POST /api/trips/:id/location
// @access  Private (Drivers & Admin)
const updateTripLocation = async (req, res, next) => {
  const { id } = req.params;
  const { latitude, longitude, address, speed } = req.body;

  try {
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide latitude and longitude' });
    }

    const [trips] = await db.query('SELECT * FROM trips WHERE id = ?', [id]);
    if (trips.length === 0) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    const trip = trips[0];
    const [bookings] = await db.query('SELECT * FROM bookings WHERE id = ?', [trip.booking_id]);
    const booking = bookings[0];

    // Calculate details
    const totalDistance = calculateDistance(booking.pickup_latitude, booking.pickup_longitude, booking.drop_latitude, booking.drop_longitude);
    const distanceCovered = calculateDistance(booking.pickup_latitude, booking.pickup_longitude, latitude, longitude);
    let remainingDistance = calculateDistance(latitude, longitude, booking.drop_latitude, booking.drop_longitude);
    
    // Safeguard
    if (remainingDistance > totalDistance) remainingDistance = totalDistance;
    let progress = Math.round((distanceCovered / totalDistance) * 100);
    if (progress > 100) progress = 100;
    if (progress < 0) progress = 0;

    // ETA calculation: remaining distance / avg speed (50 km/h) * 60 minutes
    const speedKmh = speed || 45;
    const etaMinutes = Math.ceil((remainingDistance / speedKmh) * 60);

    // Check if delayed
    let delayStatus = 'on_time';
    const now = new Date();
    const plannedEnd = new Date(trip.planned_end_time);
    const etaArrival = new Date(now.getTime() + etaMinutes * 60 * 1000);

    if (etaArrival > plannedEnd) {
      delayStatus = 'delayed';
      
      // Check if alert notification already sent in last 5 minutes to avoid flood
      const [recentAlert] = await db.query(
        'SELECT * FROM notifications WHERE trip_id = ? AND type = "delay" AND created_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)',
        [id]
      );
      
      if (recentAlert.length === 0) {
        await db.query(
          'INSERT INTO notifications (trip_id, type, title, message) VALUES (?, "delay", "Delay Alert: Trip is Delayed", ?)',
          [id, `Vehicle associated with trip ${trip.trip_uid} is delayed due to traffic. Current ETA: ${etaMinutes} mins. Remaining: ${remainingDistance} km.`]
        );
      }
    }

    // Update trip coordinates
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
      [latitude, longitude, address || 'In Transit', progress, distanceCovered, remainingDistance, etaMinutes, delayStatus, id]
    );

    // Add GPS Log record
    await db.query(
      'INSERT INTO gps_logs (trip_id, latitude, longitude, address, speed) VALUES (?, ?, ?, ?, ?)',
      [id, latitude, longitude, address || 'In Transit', speedKmh]
    );

    res.status(200).json({
      success: true,
      message: 'Location and metrics updated successfully',
      data: {
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

// @desc    Get complete trip details (admin details view)
// @route   GET /api/trips/:id/details
// @access  Private
const getTripDetails = async (req, res, next) => {
  const { id } = req.params;

  try {
    const [trips] = await db.query(
      `SELECT t.*, 
              b.customer_name, b.customer_mobile, b.pickup_location, b.pickup_latitude, b.pickup_longitude,
              b.drop_location, b.drop_latitude, b.drop_longitude, b.fare_amount,
              v.vehicle_number, v.vehicle_type, v.capacity AS vehicle_capacity,
              d.name AS driver_name, d.mobile_number AS driver_mobile, d.license_number AS driver_license
       FROM trips t
       JOIN bookings b ON t.booking_id = b.id
       LEFT JOIN vehicles v ON b.vehicle_id = v.id
       LEFT JOIN drivers d ON b.driver_id = d.id
       WHERE t.id = ?`,
      [id]
    );

    if (trips.length === 0) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    const trip = trips[0];
    const bookingId = trip.booking_id;

    // Fetch payments
    const [payments] = await db.query('SELECT * FROM payments WHERE booking_id = ?', [bookingId]);
    
    // Fetch complaints
    const [complaints] = await db.query('SELECT * FROM complaints WHERE booking_id = ? ORDER BY id DESC', [bookingId]);

    // Fetch ratings
    const [ratings] = await db.query('SELECT * FROM ratings WHERE booking_id = ?', [bookingId]);

    // Fetch trip history
    const [history] = await db.query('SELECT * FROM trip_history WHERE booking_id = ? ORDER BY id DESC', [bookingId]);

    // Fetch GPS logs
    const [gpsLogs] = await db.query('SELECT * FROM gps_logs WHERE trip_id = ? ORDER BY id DESC', [id]);

    // Generate AI summaries
    const tripSummary = summaryGenerator.generateTripSummary(
      trip.vehicle_number, 
      trip.route_progress_percent, 
      trip.eta_minutes
    );
    const delaySummary = summaryGenerator.generateDelaySummary(
      trip.delay_status, 
      trip.eta_minutes, 
      trip.planned_end_time, 
      trip.current_address
    );
    const customerUpdateMessage = summaryGenerator.generateCustomerUpdateMessage(
      trip.status, 
      trip.pickup_location, 
      trip.drop_location, 
      trip.driver_name, 
      trip.vehicle_number
    );

    res.status(200).json({
      success: true,
      data: {
        trip,
        payment: payments.length > 0 ? payments[0] : { advance_amount: 0.00, balance_amount: trip.fare_amount, payment_status: 'pending' },
        complaints,
        rating: ratings.length > 0 ? ratings[0] : null,
        history,
        gps_path: gpsLogs,
        ai_summaries: {
          trip_summary: tripSummary,
          delay_summary: delaySummary,
          customer_update_message: customerUpdateMessage
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update trip payment information
// @route   POST /api/trips/:id/payment
// @access  Private (Admin only)
const updateTripPayment = async (req, res, next) => {
  const { id } = req.params;
  const { advance_amount, balance_amount, payment_status } = req.body;

  try {
    const [trips] = await db.query('SELECT booking_id FROM trips WHERE id = ?', [id]);
    if (trips.length === 0) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    const bookingId = trips[0].booking_id;

    await db.query(
      `INSERT INTO payments (booking_id, advance_amount, balance_amount, payment_status) 
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       advance_amount = VALUES(advance_amount),
       balance_amount = VALUES(balance_amount),
       payment_status = VALUES(payment_status)`,
      [bookingId, advance_amount || 0.00, balance_amount || 0.00, payment_status || 'pending']
    );

    // Insert action in trip history
    await db.query(
      'INSERT INTO trip_history (booking_id, action, status, remarks) VALUES (?, "Payment Update", "payment_updated", ?)',
      [bookingId, `Payment status set to ${payment_status}. Advance: ₹${advance_amount}, Balance: ₹${balance_amount}.`]
    );

    res.status(200).json({ success: true, message: 'Payment information updated successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit a complaint for a trip
// @route   POST /api/trips/:id/complaint
// @access  Private
const addTripComplaint = async (req, res, next) => {
  const { id } = req.params;
  const { complaint_text } = req.body;

  try {
    if (!complaint_text) {
      return res.status(400).json({ success: false, message: 'Complaint text is required' });
    }

    const [trips] = await db.query('SELECT booking_id, status FROM trips WHERE id = ?', [id]);
    if (trips.length === 0) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    const { booking_id: bookingId, status } = trips[0];

    await db.query(
      'INSERT INTO complaints (booking_id, complaint_text, status) VALUES (?, ?, "open")',
      [bookingId, complaint_text]
    );

    // Insert history action
    await db.query(
      'INSERT INTO trip_history (booking_id, action, status, remarks) VALUES (?, "Complaint Registered", ?, ?)',
      [bookingId, status, `New complaint registered: "${complaint_text.substring(0, 50)}..."`]
    );

    res.status(201).json({ success: true, message: 'Complaint registered successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit a rating and feedback for a completed trip
// @route   POST /api/trips/:id/rating
// @access  Private
const addTripRating = async (req, res, next) => {
  const { id } = req.params;
  const { rating, feedback } = req.body;

  try {
    if (rating === undefined || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const [trips] = await db.query('SELECT booking_id, status FROM trips WHERE id = ?', [id]);
    if (trips.length === 0) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    const { booking_id: bookingId, status } = trips[0];

    await db.query(
      `INSERT INTO ratings (booking_id, rating, feedback) 
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
       rating = VALUES(rating),
       feedback = VALUES(feedback)`,
      [bookingId, rating, feedback || null]
    );

    // Insert history action
    await db.query(
      'INSERT INTO trip_history (booking_id, action, status, remarks) VALUES (?, "Feedback Submitted", ?, ?)',
      [bookingId, status, `Customer rated the trip ${rating}/5 stars.`]
    );

    res.status(201).json({ success: true, message: 'Rating and feedback submitted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { 
  getTrips, 
  getTripById, 
  trackTripByUid, 
  updateTripStatus, 
  updateTripLocation,
  getTripDetails,
  updateTripPayment,
  addTripComplaint,
  addTripRating
};
