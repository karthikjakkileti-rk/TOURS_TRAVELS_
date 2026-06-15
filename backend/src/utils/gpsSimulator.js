const db = require('../config/db');

// Helper to calculate distance in km using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
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

async function simulateActiveTrips() {
  const pool = db.getPool();
  if (!pool) return; // Pool might not be initialized yet

  try {
    // Fetch all active trips (not completed)
    const tripsResult = await pool.query(`
      SELECT t.*, 
             b.pickup_latitude, b.pickup_longitude, b.pickup_location,
             b.drop_latitude, b.drop_longitude, b.drop_location,
             b.vehicle_id, b.driver_id, b.customer_name
      FROM trips t
      JOIN bookings b ON t.booking_id = b.id
      WHERE t.status NOT IN ('trip_completed', 'booking_created')
    `);

    if (!tripsResult || !Array.isArray(tripsResult)) return;
    const [activeTrips] = tripsResult;

    for (const trip of activeTrips) {
      let nextStatus = trip.status;
      let nextProgress = trip.route_progress_percent;
      let targetLat, targetLng, targetAddr;
      let startLat, startLng;

      // Determine routing start and target coordinates based on state
      if (trip.status === 'driver_assigned' || trip.status === 'vehicle_dispatched') {
        // Driver moving towards pickup
        // Let's assume driver starts at some offset and moves to pickup
        startLat = parseFloat(trip.pickup_latitude) + 0.02; 
        startLng = parseFloat(trip.pickup_longitude) - 0.02;
        targetLat = parseFloat(trip.pickup_latitude);
        targetLng = parseFloat(trip.pickup_longitude);
        targetAddr = `Heading to Pickup: ${trip.pickup_location}`;
        
        // Progress towards pickup
        if (trip.status === 'driver_assigned') {
          nextStatus = 'vehicle_dispatched';
          nextProgress = 0;
        } else {
          nextProgress += 20; // 5 steps to reach pickup
          if (nextProgress >= 100) {
            nextProgress = 100;
            nextStatus = 'driver_reached_pickup';
          }
        }
      } else if (trip.status === 'driver_reached_pickup') {
        // Driver waiting at pickup. Move to in-progress on next tick.
        nextStatus = 'pickup_completed';
        nextProgress = 0;
        targetLat = parseFloat(trip.pickup_latitude);
        targetLng = parseFloat(trip.pickup_longitude);
        targetAddr = `At Pickup: ${trip.pickup_location}`;
      } else if (trip.status === 'pickup_completed') {
        nextStatus = 'trip_in_progress';
        nextProgress = 0;
        targetLat = parseFloat(trip.pickup_latitude);
        targetLng = parseFloat(trip.pickup_longitude);
        targetAddr = `Trip Started from ${trip.pickup_location}`;
      } else if (trip.status === 'trip_in_progress' || trip.status === 'drop_completed') {
        // Passenger on board, moving from pickup to drop
        startLat = parseFloat(trip.pickup_latitude);
        startLng = parseFloat(trip.pickup_longitude);
        targetLat = parseFloat(trip.drop_latitude);
        targetLng = parseFloat(trip.drop_longitude);
        targetAddr = `En Route to ${trip.drop_location}`;

        nextProgress += 10; // 10 steps to reach destination (100 seconds)
        if (nextProgress >= 100) {
          nextProgress = 100;
          nextStatus = 'trip_completed';
        }
      }

      // Calculate current location coordinate interpolated
      let currentLat = parseFloat(trip.current_latitude);
      let currentLng = parseFloat(trip.current_longitude);
      
      if (nextStatus === 'trip_completed') {
        currentLat = targetLat;
        currentLng = targetLng;
      } else if (nextProgress > 0 && nextProgress < 100) {
        // Linear interpolation for coordinate path
        const ratio = nextProgress / 100;
        const originLat = startLat || currentLat;
        const originLng = startLng || currentLng;
        currentLat = originLat + (targetLat - originLat) * ratio;
        currentLng = originLng + (targetLng - originLng) * ratio;
      } else if (nextProgress === 0) {
        currentLat = startLat || targetLat;
        currentLng = startLng || targetLng;
      }

      // Calculate distances
      const totalDistance = calculateDistance(
        parseFloat(trip.pickup_latitude), 
        parseFloat(trip.pickup_longitude), 
        parseFloat(trip.drop_latitude), 
        parseFloat(trip.drop_longitude)
      );
      
      let distanceCovered = 0;
      let remainingDistance = totalDistance;

      if (nextStatus === 'trip_completed') {
        distanceCovered = totalDistance;
        remainingDistance = 0;
      } else if (trip.status === 'trip_in_progress') {
        distanceCovered = parseFloat((totalDistance * (nextProgress / 100)).toFixed(2));
        remainingDistance = parseFloat((totalDistance - distanceCovered).toFixed(2));
      }

      // Calculate ETA (speed avg = 50km/h)
      const etaMinutes = nextStatus === 'trip_completed' ? 0 : Math.max(1, Math.ceil((remainingDistance / 50) * 60));

      // Calculate Delay Alert
      let delayStatus = trip.delay_status;
      const plannedEnd = new Date(trip.planned_end_time);
      const now = new Date();
      const etaArrival = new Date(now.getTime() + etaMinutes * 60 * 1000);

      if (nextStatus !== 'trip_completed' && etaArrival > plannedEnd) {
        delayStatus = 'delayed';
        
        // Log alert if not already sent in the last 2 minutes
        const alertsResult = await pool.query(
          'SELECT * FROM notifications WHERE trip_id = ? AND type = "delay" AND created_at > DATE_SUB(NOW(), INTERVAL 2 MINUTE)',
          [trip.id]
        );
        
        if (alertsResult && Array.isArray(alertsResult)) {
          const [recentAlert] = alertsResult;
          if (recentAlert && recentAlert.length === 0) {
            await pool.query(
              'INSERT INTO notifications (trip_id, type, title, message) VALUES (?, "delay", "Trip Delayed Alert", ?)',
              [trip.id, `Trip ${trip.trip_uid} for ${trip.customer_name} is delayed due to slow movement. Updated ETA: ${etaMinutes} minutes.`]
            );
          }
        }
      }

      // Update Database
      await pool.query(
        `UPDATE trips 
         SET status = ?, 
             current_latitude = ?, 
             current_longitude = ?, 
             current_address = ?, 
             route_progress_percent = ?, 
             distance_covered = ?, 
             remaining_distance = ?, 
             eta_minutes = ?, 
             delay_status = ?,
             actual_end_time = ?
         WHERE id = ?`,
        [
          nextStatus, 
          currentLat, 
          currentLng, 
          targetAddr, 
          nextProgress, 
          distanceCovered, 
          remainingDistance, 
          etaMinutes, 
          delayStatus,
          nextStatus === 'trip_completed' ? new Date() : null,
          trip.id
        ]
      );

      // Log GPS path record
      await pool.query(
        'INSERT INTO gps_logs (trip_id, latitude, longitude, address, speed) VALUES (?, ?, ?, ?, ?)',
        [trip.id, currentLat, currentLng, targetAddr, nextStatus === 'trip_completed' ? 0 : 50]
      );

      // Handle completions
      if (nextStatus === 'trip_completed') {
        // Free driver & vehicle
        if (trip.vehicle_id) await pool.query('UPDATE vehicles SET status = "available" WHERE id = ?', [trip.vehicle_id]);
        if (trip.driver_id) await pool.query('UPDATE drivers SET status = "available" WHERE id = ?', [trip.driver_id]);
        
        // Update booking status
        await pool.query('UPDATE bookings SET booking_status = "completed" WHERE id = ?', [trip.booking_id]);

        // Insert notification
        await pool.query(
          'INSERT INTO notifications (trip_id, type, title, message) VALUES (?, "completion", "Trip Arrived", ?)',
          [trip.id, `Trip ${trip.trip_uid} has arrived at destination: ${trip.drop_location}.`]
        );
        console.log(`Trip ${trip.trip_uid} completed simulation.`);
      }
    }
  } catch (error) {
    console.error('GPS Simulation error:', error.message);
  }
}

function startGpsSimulation() {
  const intervalMs = parseInt(process.env.GPS_SIMULATION_INTERVAL_MS || '10000');
  console.log(`GPS Simulation engine started. Checking active trips every ${intervalMs / 1000}s...`);
  
  // Run every intervalMs
  setInterval(simulateActiveTrips, intervalMs);
}

module.exports = { startGpsSimulation };
