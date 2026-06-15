/**
 * Dynamic Rule-Based AI Summary Generator for Manivtha Travels
 */

/**
 * Generates a trip progress summary.
 * Example: "Vehicle AP39AB1234 has completed 65% of the route and is expected to arrive in 25 minutes."
 * 
 * @param {string} vehiclePlate - Vehicle plate number
 * @param {number} progressPercent - Completion progress (0-100)
 * @param {number} etaMinutes - ETA in minutes
 * @returns {string} Summary string
 */
function generateTripSummary(vehiclePlate, progressPercent, etaMinutes) {
  const plate = vehiclePlate || 'assigned vehicle';
  const progress = progressPercent !== undefined ? progressPercent : 0;
  
  if (progress === 100) {
    return `Vehicle ${plate} has completed 100% of the route and has arrived at the destination.`;
  }
  
  const etaStr = etaMinutes !== undefined && etaMinutes > 0 
    ? `is expected to arrive in ${etaMinutes} minutes` 
    : 'will arrive shortly';

  return `Vehicle ${plate} has completed ${progress}% of the route and ${etaStr}.`;
}

/**
 * Generates a trip delay summary.
 * Example: "The vehicle is delayed by 20 minutes due to traffic congestion."
 * 
 * @param {string} delayStatus - 'delayed' or 'on_time'
 * @param {number} etaMinutes - Current ETA in minutes
 * @param {string} plannedEndTime - Planned arrival date string/object
 * @param {string} currentAddress - Current simulated address (may contain delay clues like "traffic")
 * @returns {string} Delay summary string
 */
function generateDelaySummary(delayStatus, etaMinutes, plannedEndTime, currentAddress) {
  if (delayStatus !== 'delayed') {
    return 'The vehicle is currently on track and running on time.';
  }

  // Calculate approximate delay in minutes
  // For mock/rule purposes, if ETA arrival exceeds planned end time, calculate the difference
  let delayMinutes = 15; // default fallback
  if (plannedEndTime) {
    const planned = new Date(plannedEndTime);
    const expectedArrival = new Date(Date.now() + (etaMinutes || 0) * 60 * 1000);
    const diffMs = expectedArrival - planned;
    if (diffMs > 0) {
      delayMinutes = Math.ceil(diffMs / (60 * 1000));
    }
  }

  // Determine reason based on address string or random choose
  let reason = 'traffic congestion';
  const addr = (currentAddress || '').toLowerCase();
  if (addr.includes('traffic') || addr.includes('flyover') || addr.includes('board')) {
    reason = 'traffic congestion';
  } else if (addr.includes('construction') || addr.includes('metro')) {
    reason = 'road construction work';
  } else if (addr.includes('rain') || addr.includes('weather')) {
    reason = 'inclement weather conditions';
  } else {
    // Random reason from a list for natural variety
    const reasons = ['traffic congestion', 'route detours', 'peak hour delays', 'slow traffic flow'];
    reason = reasons[Math.floor(Math.random() * reasons.length)];
  }

  return `The vehicle is delayed by ${delayMinutes} minutes due to ${reason}.`;
}

/**
 * Generates an update message for the customer.
 * Example: "Your vehicle has started the journey and is currently en route to the pickup location."
 * 
 * @param {string} status - Trip status string
 * @param {string} pickupLocation - Pickup address
 * @param {string} dropLocation - Drop address
 * @param {string} driverName - Driver's name
 * @param {string} vehiclePlate - Vehicle plate number
 * @returns {string} Update message
 */
function generateCustomerUpdateMessage(status, pickupLocation, dropLocation, driverName, vehiclePlate) {
  const driver = driverName || 'Your assigned driver';
  const plate = vehiclePlate || 'assigned cab';
  const pickup = pickupLocation || 'pickup location';
  const drop = dropLocation || 'drop-off location';

  switch (status) {
    case 'booking_created':
      return `Your travel booking has been received. We are currently assigning a driver and vehicle for your trip from ${pickup} to ${drop}.`;
    case 'driver_assigned':
      return `Driver ${driver} has been assigned to your booking. Your cab details are: ${plate}. The ride is scheduled on time.`;
    case 'vehicle_dispatched':
      return `Your vehicle (${plate}) has started the journey and is currently en route to the pickup location at ${pickup}.`;
    case 'driver_reached_pickup':
      return `Driver ${driver} has reached the pickup location at ${pickup}. Please meet the driver.`;
    case 'pickup_completed':
    case 'trip_in_progress':
      return `Your vehicle has departed from ${pickup} and is currently en route to ${drop}. Track your live ride coordinates here.`;
    case 'drop_completed':
    case 'trip_completed':
      return `Your trip has ended. You have safely arrived at ${drop}. Thank you for choosing Manivtha Tours & Travels!`;
    default:
      return `Your trip status is currently updated to: ${status.replace('_', ' ')}. You can monitor live progress on the portal.`;
  }
}

module.exports = {
  generateTripSummary,
  generateDelaySummary,
  generateCustomerUpdateMessage
};
