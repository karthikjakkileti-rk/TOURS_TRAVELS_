import axios from 'axios';

// Check if we should use mock mode
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
let useMockMode = !isLocalhost; // Default to mock mode if not on localhost

// Initial mock state matching our database seeding
const mockState = {
  users: [
    { id: 1, name: 'Manivtha Admin', email: 'admin@manivtha.com', role: 'admin' },
    { id: 2, name: 'Rajesh Kumar', email: 'driver1@manivtha.com', role: 'driver' },
  ],
  vehicles: [
    { id: 1, vehicle_number: 'KA-03-ME-1234', vehicle_type: 'SUV', capacity: 7, status: 'available', driver_id: 1, driver_name: 'Rajesh Kumar', driver_mobile: '+91 98765 43210' },
    { id: 2, vehicle_number: 'KA-51-PH-5678', vehicle_type: 'Sedan', capacity: 4, status: 'on_trip', driver_id: 2, driver_name: 'Amit Singh', driver_mobile: '+91 98765 43211' },
    { id: 3, vehicle_number: 'DL-01-TC-9012', vehicle_type: 'Minivan', capacity: 12, status: 'maintenance', driver_id: null, driver_name: null }
  ],
  drivers: [
    { id: 1, name: 'Rajesh Kumar', email: 'driver1@manivtha.com', mobile_number: '+91 98765 43210', license_number: 'DL-123456789', experience: 5, status: 'available' },
    { id: 2, name: 'Amit Singh', email: 'driver2@manivtha.com', mobile_number: '+91 98765 43211', license_number: 'DL-987654321', experience: 8, status: 'on_trip' },
    { id: 3, name: 'Suresh Raina', email: 'driver3@manivtha.com', mobile_number: '+91 98765 43212', license_number: 'DL-555555555', experience: 3, status: 'inactive' }
  ],
  bookings: [
    { id: 1, customer_name: 'Suresh Kumar', customer_mobile: '+91 99001 12233', pickup_location: 'Indiranagar', drop_location: 'Kempegowda Airport', fare_amount: 1500.00, trip_date: new Date().toISOString(), status: 'assigned', vehicle_id: 1, driver_id: 1, driver_name: 'Rajesh Kumar' },
    { id: 2, customer_name: 'Priya Sharma', customer_mobile: '+91 99001 44556', pickup_location: 'Whitefield', drop_location: 'Electronic City', fare_amount: 2500.00, trip_date: new Date().toISOString(), status: 'in_progress', vehicle_id: 2, driver_id: 2, driver_name: 'Amit Singh' }
  ],
  trips: [
    { id: 1, booking_id: 1, trip_uid: 'TRIP-BLR-EC-001', status: 'trip_started', delay_status: 'on_time', distance_covered: 12.5, current_lat: 12.9716, current_lng: 77.5946, start_time: new Date(), eta_minutes: 25, ai_summary: 'Trip started smoothly from Indiranagar. Current traffic is light. Expected arrival on time.' },
    { id: 2, booking_id: 2, trip_uid: 'TRIP-WF-BG-003', status: 'trip_started', delay_status: 'delayed', distance_covered: 8.2, current_lat: 12.9100, current_lng: 77.6200, start_time: new Date(), eta_minutes: 45, ai_summary: 'Vehicle is currently stuck in heavy traffic at Silk Board Flyover. Alert: 15 minutes delay warning generated.' }
  ],
  notifications: [
    { id: 1, title: 'Trip Delayed: TRIP-WF-BG-003', message: 'Vehicle KA-51-PH-5678 is delayed due to heavy traffic at Silk Board. Current ETA is 45 minutes.', type: 'delay', is_read: 0, created_at: new Date().toISOString() },
    { id: 2, title: 'Driver Assigned: Rajesh Kumar', message: 'Driver Rajesh Kumar has been assigned to Booking #1.', type: 'assignment', is_read: 1, created_at: new Date().toISOString() }
  ],
  reports: [
    { trip_uid: 'TRIP-BLR-EC-001', customer_name: 'Suresh Kumar', pickup_location: 'Indiranagar', drop_location: 'Kempegowda Airport', fare_amount: 1500.00, distance_covered: 12.5, delay_status: 'on_time', vehicle_number: 'KA-03-ME-1234', trip_date: new Date().toISOString() },
    { trip_uid: 'TRIP-WF-BG-003', customer_name: 'Priya Sharma', pickup_location: 'Whitefield', drop_location: 'Electronic City', fare_amount: 2500.00, distance_covered: 8.2, delay_status: 'delayed', vehicle_number: 'KA-51-PH-5678', trip_date: new Date().toISOString() }
  ],
  trip_history: [
    { id: 1, booking_id: 1, action: 'Booking Created', status: 'booking_created', remarks: 'Logged in dashboard.', created_at: new Date().toISOString() }
  ],
  payments: [
    { id: 1, booking_id: 1, advance_amount: 500, balance_amount: 1000, payment_status: 'partial', created_at: new Date().toISOString() }
  ],
  complaints: [],
  ratings: []
};

// Helper to safely parse JSON or return original object
const getRequestData = (config) => {
  if (!config.data) return {};
  if (typeof config.data === 'object') return config.data;
  try {
    return JSON.parse(config.data);
  } catch (e) {
    return {};
  }
};

// Setup mock adapter
axios.interceptors.request.use(async (config) => {
  if (!useMockMode) {
    return config;
  }

  // Normalize URL and method safely
  let url = config.url || '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      url = new URL(url).pathname;
    } catch (e) {
      url = url.replace(/^https?:\/\/[^\/]+/, '');
    }
  }
  // Strip baseURL if it's still present in the path
  if (config.baseURL) {
    let cleanBase = config.baseURL;
    if (cleanBase.startsWith('http://') || cleanBase.startsWith('https://')) {
      try {
        cleanBase = new URL(cleanBase).pathname;
      } catch (e) {
        cleanBase = cleanBase.replace(/^https?:\/\/[^\/]+/, '');
      }
    }
    if (cleanBase && cleanBase !== '/' && url.startsWith(cleanBase)) {
      url = url.slice(cleanBase.length);
    }
  }
  // Ensure it starts with a slash
  if (url && !url.startsWith('/')) {
    url = '/' + url;
  }

  const method = (config.method || 'get').toUpperCase();

  // Helper to simulate Axios response wrapper inside a rejected promise (caught by response interceptor)
  const mockResponse = (data, status = 200) => {
    return Promise.reject({
      config,
      response: {
        data,
        status,
        statusText: 'OK',
        headers: {},
        config
      },
      isMock: true
    });
  };

  // 1. Auth Endpoint Mocks
  if (url === '/api/auth/login') {
    const { email } = getRequestData(config);
    const foundUser = mockState.users.find(u => u.email === email) || { id: 1, name: 'Manivtha Admin', email: email, role: 'admin' };
    return mockResponse({ success: true, token: 'mock-jwt-token', user: foundUser });
  }
  if (url === '/api/auth/me') {
    return mockResponse({ success: true, user: mockState.users[0] });
  }

  // 2. Dashboard Endpoints Mocks
  if (url === '/api/dashboard/stats') {
    return mockResponse({
      success: true,
      data: {
        cards: {
          totalVehicles: mockState.vehicles.length,
          activeTrips: mockState.trips.filter(t => t.status !== 'trip_completed').length,
          completedTrips: mockState.trips.filter(t => t.status === 'trip_completed').length,
          delayedTrips: mockState.trips.filter(t => t.delay_status === 'delayed').length,
          totalDrivers: mockState.drivers.length,
          totalRevenue: 4000.00
        },
        charts: {
          vehicleUtilization: [
            { status: 'available', count: mockState.vehicles.filter(v => v.status === 'available').length },
            { status: 'on_trip', count: mockState.vehicles.filter(v => v.status === 'on_trip').length },
            { status: 'maintenance', count: mockState.vehicles.filter(v => v.status === 'maintenance').length }
          ],
          delayBreakdown: [
            { delay_status: 'on_time', count: mockState.trips.filter(t => t.delay_status === 'on_time').length },
            { delay_status: 'delayed', count: mockState.trips.filter(t => t.delay_status === 'delayed').length }
          ],
          tripsPerDay: [
            { date: 'Mon', count: 3 },
            { date: 'Tue', count: 4 },
            { date: 'Wed', count: 2 },
            { date: 'Thu', count: 5 },
            { date: 'Fri', count: 6 },
            { date: 'Sat', count: 4 },
            { date: 'Sun', count: 2 }
          ],
          revenuePerDay: [
            { date: 'Mon', amount: 1500 },
            { date: 'Tue', amount: 2500 },
            { date: 'Wed', amount: 1000 },
            { date: 'Thu', amount: 3500 },
            { date: 'Fri', amount: 4500 },
            { date: 'Sat', amount: 3000 },
            { date: 'Sun', amount: 1200 }
          ]
        }
      }
    });
  }

  // 3. Vehicles
  if (url === '/api/vehicles') {
    if (method === 'GET') {
      return mockResponse({ success: true, data: mockState.vehicles });
    }
    if (method === 'POST') {
      const data = getRequestData(config);
      const newVeh = { id: mockState.vehicles.length + 1, ...data };
      mockState.vehicles.push(newVeh);
      return mockResponse({ success: true, data: newVeh });
    }
  }
  if (url.startsWith('/api/vehicles/')) {
    const id = parseInt(url.split('/').pop());
    if (method === 'PUT') {
      const data = getRequestData(config);
      const idx = mockState.vehicles.findIndex(v => v.id === id);
      if (idx !== -1) {
        mockState.vehicles[idx] = { ...mockState.vehicles[idx], ...data };
        return mockResponse({ success: true, data: mockState.vehicles[idx] });
      }
    }
    if (method === 'DELETE') {
      mockState.vehicles = mockState.vehicles.filter(v => v.id !== id);
      return mockResponse({ success: true });
    }
  }

  // 4. Drivers
  if (url === '/api/drivers') {
    if (method === 'GET') {
      return mockResponse({ success: true, data: mockState.drivers });
    }
    if (method === 'POST') {
      const data = getRequestData(config);
      const newDrv = { id: mockState.drivers.length + 1, ...data };
      mockState.drivers.push(newDrv);
      return mockResponse({ success: true, data: newDrv });
    }
  }

  // 5. Bookings
  if (url === '/api/bookings') {
    if (method === 'GET') {
      return mockResponse({ success: true, data: mockState.bookings });
    }
    if (method === 'POST') {
      const data = getRequestData(config);
      const newB = { id: mockState.bookings.length + 1, ...data, trip_date: new Date().toISOString() };
      mockState.bookings.push(newB);
      
      // Auto create a trip for the booking too
      const newT = {
        id: mockState.trips.length + 1,
        booking_id: newB.id,
        trip_uid: `TRIP-BLR-NEW-${newB.id}`,
        status: 'trip_created',
        delay_status: 'on_time',
        distance_covered: 0.0,
        current_lat: 12.9716,
        current_lng: 77.5946,
        start_time: new Date(),
        eta_minutes: 30,
        ai_summary: 'Trip created. Awaiting dispatch.'
      };
      mockState.trips.push(newT);
      mockState.reports.push({
        trip_uid: newT.trip_uid,
        customer_name: newB.customer_name,
        pickup_location: newB.pickup_location,
        drop_location: newB.drop_location,
        fare_amount: newB.fare_amount,
        distance_covered: 0,
        delay_status: 'on_time',
        vehicle_number: 'Unassigned',
        trip_date: newB.trip_date
      });

      return mockResponse({ success: true, data: newB });
    }
  }

  // 6. Trips & Telemetry
  if (url === '/api/trips') {
    return mockResponse({ success: true, data: mockState.trips });
  }
  if (url.startsWith('/api/trips/detail/')) {
    const id = parseInt(url.split('/').pop());
    const trip = mockState.trips.find(t => t.id === id) || mockState.trips[0];
    const booking = mockState.bookings.find(b => b.id === trip.booking_id) || mockState.bookings[0];
    const vehicle = mockState.vehicles.find(v => v.id === booking.vehicle_id) || mockState.vehicles[0];
    const driver = mockState.drivers.find(d => d.id === booking.driver_id) || mockState.drivers[0];
    const payments = mockState.payments.find(p => p.booking_id === booking.id) || { booking_id: booking.id, advance_amount: 0, balance_amount: booking.fare_amount, payment_status: 'pending' };
    const complaints = mockState.complaints.filter(c => c.booking_id === booking.id);
    const ratings = mockState.ratings.filter(r => r.booking_id === booking.id);
    const history = mockState.trip_history.filter(h => h.booking_id === booking.id);

    return mockResponse({
      success: true,
      data: {
        ...trip,
        customer_name: booking.customer_name,
        customer_mobile: booking.customer_mobile,
        pickup_location: booking.pickup_location,
        drop_location: booking.drop_location,
        fare_amount: booking.fare_amount,
        vehicle_number: vehicle ? vehicle.vehicle_number : 'Unassigned',
        vehicle_type: vehicle ? vehicle.vehicle_type : '',
        driver_name: driver ? driver.name : 'Unassigned',
        driver_mobile: driver ? driver.mobile_number : '',
        payments,
        complaints,
        ratings,
        history
      }
    });
  }

  // 6.5 Live Tracking Mock
  if (url.startsWith('/api/trips/tracking/')) {
    const uid = decodeURIComponent(url.split('/').pop());
    // Search for trip by trip_uid
    let trip = mockState.trips.find(t => t.trip_uid === uid);
    
    // Fallback: Search by vehicle_number
    if (!trip) {
      const vehicle = mockState.vehicles.find(v => v.vehicle_number === uid);
      if (vehicle) {
        const booking = mockState.bookings.find(b => b.vehicle_id === vehicle.id);
        if (booking) {
          trip = mockState.trips.find(t => t.booking_id === booking.id);
        }
      }
    }
    
    // Default fallback
    if (!trip) {
      trip = mockState.trips[0];
    }
    
    const booking = mockState.bookings.find(b => b.id === trip.booking_id) || mockState.bookings[0];
    const vehicle = mockState.vehicles.find(v => v.id === booking.vehicle_id) || mockState.vehicles[0];
    const driver = mockState.drivers.find(d => d.id === booking.driver_id) || mockState.drivers[0];

    const route_progress_percent = trip.status === 'trip_completed' ? 100 : Math.round((trip.distance_covered / (trip.distance_covered + 10)) * 100) || 45;
    const remaining_distance = trip.status === 'trip_completed' ? '0.00' : (10.5).toFixed(2);

    return mockResponse({
      success: true,
      data: {
        id: trip.id,
        booking_id: trip.booking_id,
        trip_uid: trip.trip_uid,
        status: trip.status,
        delay_status: trip.delay_status,
        eta_minutes: trip.eta_minutes,
        remaining_distance,
        route_progress_percent,
        driver_name: driver ? driver.name : 'Rajesh Kumar',
        driver_mobile: driver ? driver.mobile_number : '+91 98765 43210',
        vehicle_number: vehicle ? vehicle.vehicle_number : 'KA-03-ME-1234',
        current_latitude: trip.current_lat || 12.9716,
        current_longitude: trip.current_lng || 77.5946,
        pickup_latitude: 12.9716,
        pickup_longitude: 77.5946,
        drop_latitude: 13.1986,
        drop_longitude: 77.7066,
        pickup_location: booking.pickup_location || 'Indiranagar',
        drop_location: booking.drop_location || 'Kempegowda Airport',
        current_address: 'St. John\'s Road, Bangalore'
      }
    });
  }

  // Update trip payments, complaints, ratings
  if (url.includes('/payment') && method === 'POST') {
    const parts = url.split('/');
    const bookingId = parseInt(parts[3]);
    const data = getRequestData(config);
    const existing = mockState.payments.findIndex(p => p.booking_id === bookingId);
    if (existing !== -1) {
      mockState.payments[existing] = { ...mockState.payments[existing], ...data };
    } else {
      mockState.payments.push({ id: mockState.payments.length + 1, booking_id: bookingId, ...data });
    }
    return mockResponse({ success: true });
  }
  if (url.includes('/complaint') && method === 'POST') {
    const parts = url.split('/');
    const bookingId = parseInt(parts[3]);
    const data = getRequestData(config);
    mockState.complaints.push({ id: mockState.complaints.length + 1, booking_id: bookingId, ...data, created_at: new Date().toISOString() });
    return mockResponse({ success: true });
  }
  if (url.includes('/rating') && method === 'POST') {
    const parts = url.split('/');
    const bookingId = parseInt(parts[3]);
    const data = getRequestData(config);
    mockState.ratings.push({ id: mockState.ratings.length + 1, booking_id: bookingId, ...data, created_at: new Date().toISOString() });
    return mockResponse({ success: true });
  }

  // GPS Sim
  if (url.startsWith('/api/gps/')) {
    const tripId = url.split('/').pop();
    const trip = mockState.trips.find(t => t.trip_uid === tripId) || mockState.trips[0];
    return mockResponse({
      success: true,
      data: {
        trip_uid: trip.trip_uid,
        status: trip.status,
        delay_status: trip.delay_status,
        eta_minutes: trip.eta_minutes,
        current_lat: trip.current_lat,
        current_lng: trip.current_lng,
        ai_summary: trip.ai_summary,
        routeHistory: [
          { latitude: 12.9716, longitude: 77.5946, location_name: 'Start' },
          { latitude: trip.current_lat, longitude: trip.current_lng, location_name: 'Current' }
        ]
      }
    });
  }

  // 7. Notifications
  if (url === '/api/notifications') {
    return mockResponse({ success: true, data: mockState.notifications });
  }

  // 8. Reports
  if (url.startsWith('/api/reports')) {
    return mockResponse({ success: true, data: mockState.reports });
  }

  // Fallback default mock
  return mockResponse({ success: true, data: [] });
});

// Response interceptor to catch mock responses
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.isMock) {
      return Promise.resolve(error.response);
    }
    // If real request fails due to connection error, auto-switch to mock mode on fly!
    if (!useMockMode && (error.code === 'ERR_NETWORK' || !error.response)) {
      console.warn('Backend API connection failed. Switching to Client-Side Mock Mode.');
      useMockMode = true;
      // Retry request (will be intercepted and mocked)
      return axios(error.config);
    }
    return Promise.reject(error);
  }
);
