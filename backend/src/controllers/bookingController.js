const db = require('../config/db');

// Simple helper to mock coordinate lookups for popular locations
const geocodeMock = (locationName) => {
  const normalized = (locationName || '').toLowerCase();
  
  if (normalized.includes('airport') || normalized.includes('blr')) {
    return { lat: 13.1986, lng: 77.7066 };
  }
  if (normalized.includes('electronic city')) {
    return { lat: 12.8407, lng: 77.6753 };
  }
  if (normalized.includes('indiranagar')) {
    return { lat: 12.9719, lng: 77.6412 };
  }
  if (normalized.includes('majestic')) {
    return { lat: 12.9779, lng: 77.5724 };
  }
  if (normalized.includes('whitefield')) {
    return { lat: 12.9698, lng: 77.7499 };
  }
  if (normalized.includes('bannerghatta')) {
    return { lat: 12.8009, lng: 77.5777 };
  }
  if (normalized.includes('mg road') || normalized.includes('m.g. road')) {
    return { lat: 12.9756, lng: 77.6067 };
  }
  if (normalized.includes('koramangala')) {
    return { lat: 12.9352, lng: 77.6244 };
  }
  if (normalized.includes('jayanagar')) {
    return { lat: 12.9308, lng: 77.5838 };
  }
  if (normalized.includes('silk board')) {
    return { lat: 12.9172, lng: 77.6228 };
  }
  
  // Fallback to random coordinate around Bangalore center
  const randomOffsetLat = (Math.random() - 0.5) * 0.15;
  const randomOffsetLng = (Math.random() - 0.5) * 0.15;
  return {
    lat: 12.9716 + randomOffsetLat,
    lng: 77.5946 + randomOffsetLng
  };
};

// Generate a random unique trip tracking ID
const generateTripUid = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'TRIP-';
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private
const getBookings = async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT b.*, 
             v.vehicle_number, v.vehicle_type,
             d.name AS driver_name, d.mobile_number AS driver_mobile,
             t.trip_uid, t.status AS trip_status, t.id AS trip_id
      FROM bookings b 
      LEFT JOIN vehicles v ON b.vehicle_id = v.id 
      LEFT JOIN drivers d ON b.driver_id = d.id 
      LEFT JOIN trips t ON t.booking_id = b.id
      ORDER BY b.id DESC
    `);
    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT b.*, 
             v.vehicle_number, v.vehicle_type,
             d.name AS driver_name, d.mobile_number AS driver_mobile,
             t.trip_uid, t.status AS trip_status, t.id AS trip_id
      FROM bookings b 
      LEFT JOIN vehicles v ON b.vehicle_id = v.id 
      LEFT JOIN drivers d ON b.driver_id = d.id 
      LEFT JOIN trips t ON t.booking_id = b.id
      WHERE b.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    next(error);
  }
};

// @desc    Create booking
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res, next) => {
  const {
    customer_name,
    customer_mobile,
    pickup_location,
    drop_location,
    trip_date,
    vehicle_id,
    driver_id,
    fare_amount,
    booking_status
  } = req.body;

  try {
    if (!customer_name || !customer_mobile || !pickup_location || !drop_location || !trip_date || !fare_amount) {
      return res.status(400).json({ success: false, message: 'Please provide all booking details' });
    }

    // Geocode locations
    const pickupCoords = geocodeMock(pickup_location);
    const dropCoords = geocodeMock(drop_location);

    // Insert booking
    const [result] = await db.query(
      `INSERT INTO bookings 
       (customer_name, customer_mobile, pickup_location, pickup_latitude, pickup_longitude, 
        drop_location, drop_latitude, drop_longitude, trip_date, vehicle_id, driver_id, fare_amount, booking_status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customer_name,
        customer_mobile,
        pickup_location,
        pickupCoords.lat,
        pickupCoords.lng,
        drop_location,
        dropCoords.lat,
        dropCoords.lng,
        trip_date,
        vehicle_id || null,
        driver_id || null,
        fare_amount,
        booking_status || 'pending'
      ]
    );

    const bookingId = result.insertId;

    // If booking is created with 'confirmed' status and has vehicle & driver, auto-initialize trip
    let tripCreated = false;
    let tripUid = null;
    if ((booking_status === 'confirmed' || booking_status === 'completed') && vehicle_id && driver_id) {
      tripUid = generateTripUid();
      const tripStatus = booking_status === 'completed' ? 'trip_completed' : 'driver_assigned';
      const plannedStart = new Date(trip_date);
      const plannedEnd = new Date(plannedStart.getTime() + 60 * 60 * 1000); // Default 1 hour duration

      await db.query(
        `INSERT INTO trips 
         (booking_id, trip_uid, status, current_latitude, current_longitude, current_address, 
          planned_start_time, planned_end_time, actual_start_time) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          bookingId,
          tripUid,
          tripStatus,
          pickupCoords.lat,
          pickupCoords.lng,
          pickup_location,
          plannedStart,
          plannedEnd,
          booking_status === 'completed' ? plannedStart : null
        ]
      );
      
      // Update vehicle & driver status to reflect trip assignment
      if (booking_status !== 'completed') {
        await db.query('UPDATE vehicles SET status = "on_trip" WHERE id = ?', [vehicle_id]);
        await db.query('UPDATE drivers SET status = "on_trip" WHERE id = ?', [driver_id]);
      }
      
      tripCreated = true;
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully' + (tripCreated ? ' and Trip initialized' : ''),
      bookingId,
      tripUid,
      data: {
        id: bookingId,
        customer_name,
        pickup_location,
        drop_location,
        trip_date,
        fare_amount,
        booking_status: booking_status || 'pending',
        vehicle_id,
        driver_id,
        trip_uid: tripUid
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update booking
// @route   PUT /api/bookings/:id
// @access  Private
const updateBooking = async (req, res, next) => {
  const { id } = req.params;
  const {
    customer_name,
    customer_mobile,
    pickup_location,
    drop_location,
    trip_date,
    vehicle_id,
    driver_id,
    fare_amount,
    booking_status
  } = req.body;

  try {
    const [bookings] = await db.query('SELECT * FROM bookings WHERE id = ?', [id]);
    if (bookings.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const originalBooking = bookings[0];

    // Determine coords if location changes
    const pickupCoords = pickup_location ? geocodeMock(pickup_location) : { lat: originalBooking.pickup_latitude, lng: originalBooking.pickup_longitude };
    const dropCoords = drop_location ? geocodeMock(drop_location) : { lat: originalBooking.drop_latitude, lng: originalBooking.drop_longitude };

    // Update fields
    await db.query(
      `UPDATE bookings 
       SET customer_name = COALESCE(?, customer_name),
           customer_mobile = COALESCE(?, customer_mobile),
           pickup_location = COALESCE(?, pickup_location),
           pickup_latitude = ?,
           pickup_longitude = ?,
           drop_location = COALESCE(?, drop_location),
           drop_latitude = ?,
           drop_longitude = ?,
           trip_date = COALESCE(?, trip_date),
           vehicle_id = ?,
           driver_id = ?,
           fare_amount = COALESCE(?, fare_amount),
           booking_status = COALESCE(?, booking_status)
       WHERE id = ?`,
      [
        customer_name,
        customer_mobile,
        pickup_location,
        pickupCoords.lat,
        pickupCoords.lng,
        drop_location,
        dropCoords.lat,
        dropCoords.lng,
        trip_date,
        vehicle_id !== undefined ? vehicle_id : originalBooking.vehicle_id,
        driver_id !== undefined ? driver_id : originalBooking.driver_id,
        fare_amount,
        booking_status,
        id
      ]
    );

    // Sync booking status with active trip state
    const newStatus = booking_status || originalBooking.booking_status;
    const finalVehicleId = vehicle_id !== undefined ? vehicle_id : originalBooking.vehicle_id;
    const finalDriverId = driver_id !== undefined ? driver_id : originalBooking.driver_id;

    const [trips] = await db.query('SELECT * FROM trips WHERE booking_id = ?', [id]);

    if (newStatus === 'confirmed' && finalVehicleId && finalDriverId) {
      if (trips.length === 0) {
        // Create trip record
        const tripUid = generateTripUid();
        const plannedStart = new Date(trip_date || originalBooking.trip_date);
        const plannedEnd = new Date(plannedStart.getTime() + 60 * 60 * 1000); // 1 hour

        await db.query(
          `INSERT INTO trips 
           (booking_id, trip_uid, status, current_latitude, current_longitude, current_address, 
            planned_start_time, planned_end_time) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            tripUid,
            'driver_assigned',
            pickupCoords.lat,
            pickupCoords.lng,
            pickup_location || originalBooking.pickup_location,
            plannedStart,
            plannedEnd
          ]
        );

        // Update driver & vehicle to on_trip
        await db.query('UPDATE vehicles SET status = "on_trip" WHERE id = ?', [finalVehicleId]);
        await db.query('UPDATE drivers SET status = "on_trip" WHERE id = ?', [finalDriverId]);
      } else {
        // Trip already exists, check if vehicle or driver was changed
        const existingTrip = trips[0];
        
        // If vehicle was changed, release old vehicle and lock new one
        if (originalBooking.vehicle_id && originalBooking.vehicle_id !== finalVehicleId) {
          await db.query('UPDATE vehicles SET status = "available" WHERE id = ?', [originalBooking.vehicle_id]);
          await db.query('UPDATE vehicles SET status = "on_trip" WHERE id = ?', [finalVehicleId]);
        }
        
        // If driver was changed, release old driver and lock new one
        if (originalBooking.driver_id && originalBooking.driver_id !== finalDriverId) {
          await db.query('UPDATE drivers SET status = "available" WHERE id = ?', [originalBooking.driver_id]);
          await db.query('UPDATE drivers SET status = "on_trip" WHERE id = ?', [finalDriverId]);
        }
      }
    } else if (newStatus === 'completed') {
      if (trips.length > 0) {
        await db.query(
          'UPDATE trips SET status = "trip_completed", actual_end_time = NOW(), route_progress_percent = 100, remaining_distance = 0 WHERE booking_id = ?',
          [id]
        );
      }
      
      // Free up driver and vehicle
      if (finalVehicleId) await db.query('UPDATE vehicles SET status = "available" WHERE id = ?', [finalVehicleId]);
      if (finalDriverId) await db.query('UPDATE drivers SET status = "available" WHERE id = ?', [finalDriverId]);
      
    } else if (newStatus === 'cancelled') {
      if (trips.length > 0) {
        await db.query('DELETE FROM trips WHERE booking_id = ?', [id]);
      }
      // Free up driver and vehicle
      if (finalVehicleId) await db.query('UPDATE vehicles SET status = "available" WHERE id = ?', [finalVehicleId]);
      if (finalDriverId) await db.query('UPDATE drivers SET status = "available" WHERE id = ?', [finalDriverId]);
    }

    const [updatedBooking] = await db.query('SELECT * FROM bookings WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Booking updated successfully',
      data: updatedBooking[0]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Private
const deleteBooking = async (req, res, next) => {
  const { id } = req.params;

  try {
    const [bookings] = await db.query('SELECT * FROM bookings WHERE id = ?', [id]);
    if (bookings.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const booking = bookings[0];

    // Release driver and vehicle
    if (booking.vehicle_id) await db.query('UPDATE vehicles SET status = "available" WHERE id = ?', [booking.vehicle_id]);
    if (booking.driver_id) await db.query('UPDATE drivers SET status = "available" WHERE id = ?', [booking.driver_id]);

    await db.query('DELETE FROM bookings WHERE id = ?', [id]);

    res.status(200).json({ success: true, message: 'Booking deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update booking status only
// @route   PUT /api/bookings/update-status
// @access  Private
const updateBookingStatus = async (req, res, next) => {
  const { id, status } = req.body;

  try {
    if (!id || !status) {
      return res.status(400).json({ success: false, message: 'Please provide booking id and status' });
    }

    const [bookings] = await db.query('SELECT * FROM bookings WHERE id = ?', [id]);
    if (bookings.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const booking = bookings[0];

    // Update the booking status in database
    await db.query('UPDATE bookings SET booking_status = ? WHERE id = ?', [status, id]);

    // Replicate sync logic
    const [trips] = await db.query('SELECT * FROM trips WHERE booking_id = ?', [id]);
    const vehicleId = booking.vehicle_id;
    const driverId = booking.driver_id;

    if (status === 'confirmed' && vehicleId && driverId) {
      if (trips.length === 0) {
        // Create trip
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let tripUid = 'TRIP-';
        for (let i = 0; i < 8; i++) {
          tripUid += characters.charAt(Math.floor(Math.random() * characters.length));
        }

        const plannedStart = new Date(booking.trip_date);
        const plannedEnd = new Date(plannedStart.getTime() + 60 * 60 * 1000);

        await db.query(
          `INSERT INTO trips 
           (booking_id, trip_uid, status, current_latitude, current_longitude, current_address, 
            planned_start_time, planned_end_time) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            tripUid,
            'driver_assigned',
            booking.pickup_latitude,
            booking.pickup_longitude,
            booking.pickup_location,
            plannedStart,
            plannedEnd
          ]
        );

        await db.query('UPDATE vehicles SET status = "on_trip" WHERE id = ?', [vehicleId]);
        await db.query('UPDATE drivers SET status = "on_trip" WHERE id = ?', [driverId]);

        // Log trip history
        await db.query(
          'INSERT INTO trip_history (booking_id, action, status, remarks) VALUES (?, "Driver Assigned", "driver_assigned", "Driver assigned and trip initialized.")',
          [id]
        );
      }
    } else if (status === 'completed') {
      if (trips.length > 0) {
        await db.query(
          'UPDATE trips SET status = "trip_completed", actual_end_time = NOW(), route_progress_percent = 100, remaining_distance = 0 WHERE booking_id = ?',
          [id]
        );
        // Log trip history
        await db.query(
          'INSERT INTO trip_history (booking_id, action, status, remarks) VALUES (?, "Trip Completed", "trip_completed", "Trip successfully completed.")',
          [id]
        );
      }
      if (vehicleId) await db.query('UPDATE vehicles SET status = "available" WHERE id = ?', [vehicleId]);
      if (driverId) await db.query('UPDATE drivers SET status = "available" WHERE id = ?', [driverId]);
    } else if (status === 'cancelled') {
      if (trips.length > 0) {
        await db.query('DELETE FROM trips WHERE booking_id = ?', [id]);
      }
      if (vehicleId) await db.query('UPDATE vehicles SET status = "available" WHERE id = ?', [vehicleId]);
      if (driverId) await db.query('UPDATE drivers SET status = "available" WHERE id = ?', [driverId]);
      // Log trip history
      await db.query(
        'INSERT INTO trip_history (booking_id, action, status, remarks) VALUES (?, "Booking Cancelled", "cancelled", "Booking marked as cancelled.")',
        [id]
      );
    }

    res.status(200).json({ success: true, message: 'Booking status updated successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getBookings, getBookingById, createBooking, updateBooking, deleteBooking, updateBookingStatus };
