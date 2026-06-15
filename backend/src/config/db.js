const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT || '3306'),
};

let pool;
let isMockMode = false;

// Mock database state for offline fallback preview
const mockState = {
  users: [
    { id: 1, name: 'Manivtha Admin', email: 'admin@manivtha.com', password: '$2a$10$Wh4513z1UaGjgd3TDhQZ3Oh5J6txdeeeIa1fiHDo9dyJpru0Bz/1.', role: 'admin', created_at: new Date() },
    { id: 2, name: 'Rajesh Kumar', email: 'driver1@manivtha.com', password: '$2a$10$pVeSaqlf3WhncqLZrLm38ePeU5Tbt.CACT7d/.WzFZJVknW.ymZWq', role: 'driver', created_at: new Date() },
    { id: 3, name: 'Amit Singh', email: 'driver2@manivtha.com', password: '$2a$10$pVeSaqlf3WhncqLZrLm38ePeU5Tbt.CACT7d/.WzFZJVknW.ymZWq', role: 'driver', created_at: new Date() },
    { id: 4, name: 'Suresh Raina', email: 'driver3@manivtha.com', password: '$2a$10$pVeSaqlf3WhncqLZrLm38ePeU5Tbt.CACT7d/.WzFZJVknW.ymZWq', role: 'driver', created_at: new Date() },
    { id: 5, name: 'John Doe', email: 'customer1@gmail.com', password: '$2a$10$zJTGmk.EiZYhts56BqW8X.pZM65.NKbYj.D7OBy3v1fESZfThbxgu', role: 'customer', created_at: new Date() }
  ],
  drivers: [
    { id: 1, user_id: 2, name: 'Rajesh Kumar', mobile_number: '9876543210', license_number: 'DL-KA5320190001', experience: 8, status: 'on_trip', created_at: new Date() },
    { id: 2, user_id: 3, name: 'Amit Singh', mobile_number: '9876543211', license_number: 'DL-MH1220180002', experience: 5, status: 'available', created_at: new Date() },
    { id: 3, user_id: 4, name: 'Suresh Raina', mobile_number: '9876543212', license_number: 'DL-DL0420170003', experience: 10, status: 'on_trip', created_at: new Date() }
  ],
  vehicles: [
    { id: 1, vehicle_number: 'KA-03-ME-1234', vehicle_type: 'SUV', capacity: 7, status: 'on_trip', driver_id: 1, created_at: new Date() },
    { id: 2, vehicle_number: 'MH-12-GP-5678', vehicle_type: 'Sedan', capacity: 4, status: 'available', driver_id: 2, created_at: new Date() },
    { id: 3, vehicle_number: 'DL-01-TC-9012', vehicle_type: 'Minivan', capacity: 9, status: 'on_trip', driver_id: 3, created_at: new Date() }
  ],
  bookings: [
    { id: 1, customer_name: 'John Doe', customer_mobile: '9123456789', pickup_location: 'Bangalore Airport (BLR)', pickup_latitude: 13.1986, pickup_longitude: 77.7066, drop_location: 'Electronic City Phase 1, Bangalore', drop_latitude: 12.8407, drop_longitude: 77.6753, trip_date: new Date(), vehicle_id: 1, driver_id: 1, fare_amount: 1500.00, booking_status: 'confirmed', created_at: new Date() },
    { id: 2, customer_name: 'Sarah Smith', customer_mobile: '9123456780', pickup_location: 'Indiranagar, Bangalore', pickup_latitude: 12.9719, pickup_longitude: 77.6412, drop_location: 'Majestic Bus Stand, Bangalore', drop_latitude: 12.9779, drop_longitude: 77.5724, trip_date: new Date(Date.now() - 24*60*60*1000), vehicle_id: 2, driver_id: 2, fare_amount: 450.00, booking_status: 'completed', created_at: new Date(Date.now() - 24*60*60*1000) },
    { id: 3, customer_name: 'Vikram Malhotra', customer_mobile: '9123456781', pickup_location: 'Whitefield, Bangalore', pickup_latitude: 12.9698, pickup_longitude: 77.7499, drop_location: 'Bannerghatta National Park, Bangalore', drop_latitude: 12.8009, drop_longitude: 77.5777, trip_date: new Date(), vehicle_id: 3, driver_id: 3, fare_amount: 1200.00, booking_status: 'confirmed', created_at: new Date() }
  ],
  trips: [
    { id: 1, booking_id: 1, trip_uid: 'TRIP-BLR-EC-001', status: 'trip_in_progress', current_latitude: 13.1000, current_longitude: 77.6900, current_address: 'Hebbal Flyover, Bangalore', pickup_status: 'completed', drop_status: 'pending', route_progress_percent: 35, distance_covered: 15.20, remaining_distance: 28.50, planned_start_time: new Date(), planned_end_time: new Date(Date.now() + 60*60*1000), actual_start_time: new Date(), actual_end_time: null, eta_minutes: 45, delay_status: 'on_time', created_at: new Date() },
    { id: 2, booking_id: 2, trip_uid: 'TRIP-IND-MAJ-002', status: 'trip_completed', current_latitude: 12.9779, current_longitude: 77.5724, current_address: 'Majestic Bus Stand, Bangalore', pickup_status: 'completed', drop_status: 'completed', route_progress_percent: 100, distance_covered: 10.50, remaining_distance: 0.00, planned_start_time: new Date(Date.now() - 24*60*60*1000), planned_end_time: new Date(Date.now() - 23*60*60*1000), actual_start_time: new Date(Date.now() - 24*60*60*1000), actual_end_time: new Date(Date.now() - 23.25*60*60*1000), eta_minutes: 0, delay_status: 'on_time', created_at: new Date(Date.now() - 24*60*60*1000) },
    { id: 3, booking_id: 3, trip_uid: 'TRIP-WF-BG-003', status: 'trip_in_progress', current_latitude: 12.9100, current_longitude: 77.6200, current_address: 'Silk Board Flyover, Bangalore (Heavy Traffic)', pickup_status: 'completed', drop_status: 'pending', route_progress_percent: 40, distance_covered: 14.00, remaining_distance: 21.00, planned_start_time: new Date(Date.now() - 30*60*1000), planned_end_time: new Date(Date.now() + 15*60*1000), actual_start_time: new Date(Date.now() - 30*60*1000), actual_end_time: null, eta_minutes: 35, delay_status: 'delayed', created_at: new Date() }
  ],
  gps_logs: [
    { id: 1, trip_id: 1, latitude: 13.1986, longitude: 77.7066, address: 'Bangalore Airport Terminal 1', speed: 0.00, recorded_at: new Date() },
    { id: 2, trip_id: 1, latitude: 13.1500, longitude: 77.7000, address: 'Kempegowda Toll Plaza', speed: 60.00, recorded_at: new Date() },
    { id: 3, trip_id: 1, latitude: 13.1000, longitude: 77.6900, address: 'Hebbal Flyover, Bangalore', speed: 45.00, recorded_at: new Date() },
    { id: 4, trip_id: 3, latitude: 12.9698, longitude: 77.7499, address: 'Whitefield, Bangalore', speed: 0.00, recorded_at: new Date() },
    { id: 5, trip_id: 3, latitude: 12.9400, longitude: 77.7000, address: 'Marathahalli Bridge', speed: 40.00, recorded_at: new Date() },
    { id: 6, trip_id: 3, latitude: 12.9100, longitude: 77.6200, address: 'Silk Board Flyover, Bangalore (Heavy Traffic)', speed: 5.00, recorded_at: new Date() }
  ],
  notifications: [
    { id: 1, trip_id: 3, user_id: 1, type: 'delay', title: 'Trip Delayed: TRIP-WF-BG-003', message: 'Vehicle DL-01-TC-9012 is delayed due to heavy traffic at Silk Board. Current ETA is 35 minutes.', is_read: false, created_at: new Date() },
    { id: 2, trip_id: 1, user_id: 1, type: 'assignment', title: 'Driver Assigned: Rajesh Kumar', message: 'Driver Rajesh Kumar has been assigned to Booking #1 (Vehicle KA-03-ME-1234).', is_read: true, created_at: new Date() }
  ],
  reports: [
    { id: 1, report_type: 'daily', report_date: new Date(Date.now() - 24*60*60*1000), total_trips: 1, completed_trips: 1, delayed_trips: 0, total_revenue: 450.00, created_at: new Date() },
    { id: 2, report_type: 'weekly', report_date: new Date(), total_trips: 3, completed_trips: 1, delayed_trips: 1, total_revenue: 1650.00, created_at: new Date() }
  ],
  trip_history: [
    { id: 1, booking_id: 1, action: 'Booking Created', status: 'booking_created', remarks: 'Booking logged in system.', created_at: new Date() },
    { id: 2, booking_id: 1, action: 'Driver Assigned', status: 'driver_assigned', remarks: 'Driver Rajesh Kumar allocated to ride.', created_at: new Date() },
    { id: 3, booking_id: 1, action: 'Trip Started', status: 'trip_in_progress', remarks: 'Passenger picked up and route active.', created_at: new Date() },
    { id: 4, booking_id: 2, action: 'Booking Created', status: 'booking_created', remarks: 'Airport pickup booking.', created_at: new Date() },
    { id: 5, booking_id: 2, action: 'Trip Completed', status: 'trip_completed', remarks: 'Arrived at Majestic Bus Stand.', created_at: new Date() },
    { id: 6, booking_id: 3, action: 'Booking Created', status: 'booking_created', remarks: 'Whitefield to Bannerghatta route booked.', created_at: new Date() },
    { id: 7, booking_id: 3, action: 'Driver Assigned', status: 'driver_assigned', remarks: 'Driver Suresh Raina assigned.', created_at: new Date() }
  ],
  payments: [
    { id: 1, booking_id: 1, advance_amount: 500.00, balance_amount: 1000.00, payment_status: 'partial', created_at: new Date() },
    { id: 2, booking_id: 2, advance_amount: 450.00, balance_amount: 0.00, payment_status: 'paid', created_at: new Date() },
    { id: 3, booking_id: 3, advance_amount: 0.00, balance_amount: 1200.00, payment_status: 'pending', created_at: new Date() }
  ],
  complaints: [
    { id: 1, booking_id: 3, complaint_text: 'Heavy congestion on route causing delayed pickup.', status: 'open', created_at: new Date() }
  ],
  ratings: [
    { id: 1, booking_id: 2, rating: 5, feedback: 'Excellent route navigation and smooth driving. Driver Rajesh was very polite.', created_at: new Date() }
  ]
};

// Mock Query Interpreter
function executeMockQuery(sql, params = []) {
  const cleanSql = sql.replace(/\s+/g, ' ').trim();
  const lowerSql = cleanSql.toLowerCase();

  // --- USERS ---
  if (lowerSql.startsWith('select * from users where email = ?')) {
    const user = mockState.users.find(u => u.email === params[0]);
    return [user ? [user] : []];
  }
  if (lowerSql.startsWith('select id, name, email, role, created_at from users where id = ?') || 
      lowerSql.startsWith('select id, name, email, role from users where id = ?')) {
    const user = mockState.users.find(u => u.id === params[0]);
    return [user ? [user] : []];
  }
  if (lowerSql.startsWith('insert into users')) {
    const nextId = mockState.users.length + 1;
    const newUser = { id: nextId, name: params[0], email: params[1], password: params[2], role: params[3], created_at: new Date() };
    mockState.users.push(newUser);
    return [{ insertId: nextId }];
  }

  // --- DRIVERS ---
  if (lowerSql.includes('from drivers d left join users u')) {
    const drivers = mockState.drivers.map(d => {
      const u = mockState.users.find(usr => usr.id === d.user_id);
      return { ...d, email: u?.email };
    });
    return [drivers];
  }
  if (lowerSql.includes('from drivers d left join users u where d.id = ?')) {
    const d = mockState.drivers.find(drv => drv.id === params[0]);
    if (!d) return [[]];
    const u = mockState.users.find(usr => usr.id === d.user_id);
    return [[{ ...d, email: u?.email }]];
  }
  if (lowerSql.startsWith('select * from drivers where user_id = ?')) {
    const d = mockState.drivers.find(drv => drv.user_id === params[0]);
    return [d ? [d] : []];
  }
  if (lowerSql.startsWith('select * from drivers where license_number = ?')) {
    const d = mockState.drivers.find(drv => drv.license_number === params[0]);
    return [d ? [d] : []];
  }
  if (lowerSql.startsWith('select * from drivers where id = ?')) {
    const d = mockState.drivers.find(drv => drv.id === params[0]);
    return [d ? [d] : []];
  }
  if (lowerSql.startsWith('insert into drivers')) {
    const nextId = mockState.drivers.length + 1;
    const newDrv = { id: nextId, user_id: params[0], name: params[1], mobile_number: params[2], license_number: params[3], experience: params[4], status: params[5], created_at: new Date() };
    mockState.drivers.push(newDrv);
    return [{ insertId: nextId }];
  }
  if (lowerSql.startsWith('update drivers set status =')) {
    // e.g. UPDATE drivers SET status = "on_trip" WHERE id = ?
    const statusVal = params[0];
    const drvId = params[1];
    const drv = mockState.drivers.find(d => d.id === drvId);
    if (drv) drv.status = statusVal;
    return [{ affectedRows: 1 }];
  }
  if (lowerSql.startsWith('update drivers set name = coalesce')) {
    // Complex coalesces
    const id = params[5];
    const drv = mockState.drivers.find(d => d.id === id);
    if (drv) {
      if (params[0]) drv.name = params[0];
      if (params[1]) drv.mobile_number = params[1];
      if (params[2]) drv.license_number = params[2];
      if (params[3]) drv.experience = params[3];
      if (params[4]) drv.status = params[4];
    }
    return [{ affectedRows: 1 }];
  }

  // --- VEHICLES ---
  if (lowerSql.includes('from vehicles v left join drivers d')) {
    if (cleanSql.includes('WHERE v.id = ?')) {
      const v = mockState.vehicles.find(veh => veh.id === params[0]);
      if (!v) return [[]];
      const d = mockState.drivers.find(drv => drv.id === v.driver_id);
      return [[{ ...v, driver_name: d?.name, driver_mobile: d?.mobile_number }]];
    }
    const vehicles = mockState.vehicles.map(v => {
      const d = mockState.drivers.find(drv => drv.id === v.driver_id);
      return { ...v, driver_name: d?.name, driver_mobile: d?.mobile_number };
    });
    return [vehicles];
  }
  if (lowerSql.startsWith('select * from vehicles where vehicle_number = ?')) {
    const v = mockState.vehicles.find(veh => veh.vehicle_number === params[0]);
    return [v ? [v] : []];
  }
  if (lowerSql.startsWith('select * from vehicles where driver_id = ?')) {
    const v = mockState.vehicles.find(veh => veh.driver_id === params[0]);
    return [v ? [v] : []];
  }
  if (lowerSql.startsWith('select * from vehicles where id = ?')) {
    const v = mockState.vehicles.find(veh => veh.id === params[0]);
    return [v ? [v] : []];
  }
  if (lowerSql.startsWith('insert into vehicles')) {
    const nextId = mockState.vehicles.length + 1;
    const newVeh = { id: nextId, vehicle_number: params[0], vehicle_type: params[1], capacity: params[2], status: params[3], driver_id: params[4], created_at: new Date() };
    mockState.vehicles.push(newVeh);
    return [{ insertId: nextId }];
  }
  if (lowerSql.startsWith('update vehicles set status =')) {
    const statusVal = params[0];
    const vehId = params[1];
    const veh = mockState.vehicles.find(v => v.id === vehId);
    if (veh) veh.status = statusVal;
    return [{ affectedRows: 1 }];
  }
  if (lowerSql.startsWith('update vehicles set vehicle_number = coalesce')) {
    const id = params[5];
    const veh = mockState.vehicles.find(v => v.id === id);
    if (veh) {
      if (params[0]) veh.vehicle_number = params[0];
      if (params[1]) veh.vehicle_type = params[1];
      if (params[2]) veh.capacity = params[2];
      if (params[3]) veh.status = params[3];
      if (params[4] !== undefined) veh.driver_id = params[4];
    }
    return [{ affectedRows: 1 }];
  }

  // --- BOOKINGS ---
  if (lowerSql.includes('from bookings b')) {
    const mapped = mockState.bookings.map(b => {
      const v = mockState.vehicles.find(veh => veh.id === b.vehicle_id);
      const d = mockState.drivers.find(drv => drv.id === b.driver_id);
      const t = mockState.trips.find(tr => tr.booking_id === b.id);
      return {
        ...b,
        vehicle_number: v?.vehicle_number,
        vehicle_type: v?.vehicle_type,
        driver_name: d?.name,
        driver_mobile: d?.mobile_number,
        trip_uid: t?.trip_uid,
        trip_status: t?.status,
        trip_id: t?.id
      };
    });
    if (cleanSql.includes('WHERE b.id = ?')) {
      const match = mapped.find(b => b.id === params[0]);
      return [match ? [match] : []];
    }
    return [mapped];
  }
  if (lowerSql.startsWith('insert into bookings')) {
    const nextId = mockState.bookings.length + 1;
    const newBook = {
      id: nextId, customer_name: params[0], customer_mobile: params[1],
      pickup_location: params[2], pickup_latitude: params[3], pickup_longitude: params[4],
      drop_location: params[5], drop_latitude: params[6], drop_longitude: params[7],
      trip_date: new Date(params[8]), vehicle_id: params[9], driver_id: params[10],
      fare_amount: params[11], booking_status: params[12], created_at: new Date()
    };
    mockState.bookings.push(newBook);
    return [{ insertId: nextId }];
  }
  if (lowerSql.startsWith('update bookings set')) {
    const bookingId = params[params.length - 1];
    const b = mockState.bookings.find(bk => bk.id === bookingId);
    if (b) {
      if (params[0]) b.customer_name = params[0];
      if (params[1]) b.customer_mobile = params[1];
      if (params[2]) b.pickup_location = params[2];
      b.pickup_latitude = params[3];
      b.pickup_longitude = params[4];
      if (params[5]) b.drop_location = params[5];
      b.drop_latitude = params[6];
      b.drop_longitude = params[7];
      if (params[8]) b.trip_date = new Date(params[8]);
      if (params[9] !== undefined) b.vehicle_id = params[9];
      if (params[10] !== undefined) b.driver_id = params[10];
      if (params[11]) b.fare_amount = params[11];
      if (params[12]) b.booking_status = params[12];
    }
    return [{ affectedRows: 1 }];
  }

  // --- TRIPS ---
  if (lowerSql.includes('from trips t')) {
    const mapped = mockState.trips.map(t => {
      const b = mockState.bookings.find(bk => bk.id === t.booking_id);
      const v = b ? mockState.vehicles.find(veh => veh.id === b.vehicle_id) : null;
      const d = b ? mockState.drivers.find(drv => drv.id === b.driver_id) : null;
      return {
        ...t,
        customer_name: b?.customer_name,
        customer_mobile: b?.customer_mobile,
        pickup_location: b?.pickup_location,
        pickup_latitude: b?.pickup_latitude,
        pickup_longitude: b?.pickup_longitude,
        drop_location: b?.drop_location,
        drop_latitude: b?.drop_latitude,
        drop_longitude: b?.drop_longitude,
        fare_amount: b?.fare_amount,
        vehicle_number: v?.vehicle_number,
        vehicle_type: v?.vehicle_type,
        driver_id: d?.id,
        driver_name: d?.name,
        driver_mobile: d?.mobile_number
      };
    });

    if (cleanSql.includes('WHERE t.trip_uid = ?')) {
      const match = mapped.find(t => t.trip_uid === params[0]);
      return [match ? [match] : []];
    }
    if (cleanSql.includes('WHERE t.id = ?')) {
      const match = mapped.find(t => t.id === params[0]);
      return [match ? [match] : []];
    }
    if (cleanSql.includes('WHERE d.user_id = ?')) {
      const match = mapped.filter(t => t.user_id === params[0] || (t.driver_id && mockState.drivers.find(drv => drv.id === t.driver_id)?.user_id === params[0]));
      return [match];
    }
    return [mapped];
  }
  if (lowerSql.startsWith('insert into trips')) {
    const nextId = mockState.trips.length + 1;
    const newTrip = {
      id: nextId, booking_id: params[0], trip_uid: params[1], status: params[2],
      current_latitude: params[3], current_longitude: params[4], current_address: params[5],
      pickup_status: 'pending', drop_status: 'pending', route_progress_percent: 0,
      distance_covered: 0.0, remaining_distance: 0.0,
      planned_start_time: new Date(params[6]), planned_end_time: new Date(params[7]),
      actual_start_time: params[8] || null, actual_end_time: null,
      eta_minutes: 0, delay_status: 'on_time', created_at: new Date()
    };
    mockState.trips.push(newTrip);
    return [{ insertId: nextId }];
  }
  if (lowerSql.startsWith('update trips set status =')) {
    // Status update
    const id = params[params.length - 1];
    const t = mockState.trips.find(tr => tr.id === parseInt(id) || tr.booking_id === parseInt(id));
    if (t) {
      t.status = params[0];
      if (params[1]) t.actual_start_time = new Date(params[1]);
      if (params[2]) t.actual_end_time = new Date(params[2]);
      if (params[0] === 'trip_completed') {
        t.route_progress_percent = 100;
        t.remaining_distance = 0;
      }
    }
    return [{ affectedRows: 1 }];
  }
  if (lowerSql.startsWith('update trips set current_latitude =')) {
    // Location update
    const id = params[params.length - 1];
    const t = mockState.trips.find(tr => tr.id === parseInt(id));
    if (t) {
      t.current_latitude = params[0];
      t.current_longitude = params[1];
      t.current_address = params[2];
      t.route_progress_percent = params[3];
      t.distance_covered = params[4];
      t.remaining_distance = params[5];
      t.eta_minutes = params[6];
      t.delay_status = params[7];
      if (params[8]) t.actual_end_time = new Date(params[8]);
    }
    return [{ affectedRows: 1 }];
  }

  // --- GPS LOGS ---
  if (lowerSql.startsWith('select latitude, longitude, address, recorded_at from gps_logs')) {
    const tripId = params[0];
    const logs = mockState.gps_logs.filter(l => l.trip_id === tripId);
    return [logs];
  }
  if (lowerSql.startsWith('insert into gps_logs')) {
    const nextId = mockState.gps_logs.length + 1;
    const newLog = { id: nextId, trip_id: params[0], latitude: params[1], longitude: params[2], address: params[3], speed: params[4], recorded_at: new Date() };
    mockState.gps_logs.push(newLog);
    return [{ insertId: nextId }];
  }

  // --- NOTIFICATIONS ---
  if (lowerSql.includes('from notifications n')) {
    const mapped = mockState.notifications.map(n => {
      const t = mockState.trips.find(tr => tr.id === n.trip_id);
      return { ...n, trip_uid: t?.trip_uid };
    });
    return [mapped];
  }
  if (lowerSql.startsWith('select * from notifications')) {
    // Delay check
    const tripId = params[0];
    const match = mockState.notifications.filter(n => n.trip_id === tripId && n.type === 'delay');
    return [match];
  }
  if (lowerSql.startsWith('insert into notifications')) {
    const nextId = mockState.notifications.length + 1;
    const newNotif = { id: nextId, trip_id: params[0], type: params[1], title: params[2], message: params[3], is_read: false, created_at: new Date() };
    mockState.notifications.push(newNotif);
    return [{ insertId: nextId }];
  }
  if (lowerSql.startsWith('update notifications set is_read = true')) {
    const notifId = params[0];
    const n = mockState.notifications.find(not => not.id === parseInt(notifId));
    if (n) n.is_read = true;
    return [{ affectedRows: 1 }];
  }

  // --- DASHBOARD METRICS ---
  if (cleanSql === 'SELECT COUNT(*) AS total FROM vehicles') {
    return [[{ total: mockState.vehicles.length }]];
  }
  if (cleanSql === 'SELECT COUNT(*) AS total FROM drivers') {
    return [[{ total: mockState.drivers.length }]];
  }
  if (cleanSql === 'SELECT COUNT(*) AS total FROM trips WHERE status != "trip_completed"') {
    return [[{ total: mockState.trips.filter(t => t.status !== 'trip_completed').length }]];
  }
  if (cleanSql === 'SELECT COUNT(*) AS total FROM trips WHERE status = "trip_completed"') {
    return [[{ total: mockState.trips.filter(t => t.status === 'trip_completed').length }]];
  }
  if (cleanSql === 'SELECT COUNT(*) AS total FROM trips WHERE delay_status = "delayed" AND status != "trip_completed"') {
    return [[{ total: mockState.trips.filter(t => t.delay_status === 'delayed' && t.status !== 'trip_completed').length }]];
  }
  if (cleanSql === 'SELECT SUM(fare_amount) AS total FROM bookings WHERE booking_status = "completed"') {
    const revenue = mockState.bookings.filter(b => b.booking_status === 'completed').reduce((sum, b) => sum + parseFloat(b.fare_amount), 0);
    return [[{ total: revenue }]];
  }
  if (lowerSql.includes("date_format(trip_date, '%y-%m-%d') as date, count(*) as count from bookings")) {
    // Dummy chart items
    return [[
      { date: new Date(Date.now() - 2*24*60*60*1000).toISOString().slice(0, 10), count: 2 },
      { date: new Date(Date.now() - 24*60*60*1000).toISOString().slice(0, 10), count: 1 },
      { date: new Date().toISOString().slice(0, 10), count: 2 }
    ]];
  }
  if (lowerSql.includes("date_format(trip_date, '%y-%m-%d') as date, sum(fare_amount) as amount from bookings")) {
    return [[
      { date: new Date(Date.now() - 2*24*60*60*1000).toISOString().slice(0, 10), amount: 1650 },
      { date: new Date(Date.now() - 24*60*60*1000).toISOString().slice(0, 10), amount: 450 },
      { date: new Date().toISOString().slice(0, 10), amount: 2700 }
    ]];
  }
  if (lowerSql.includes('select status, count(*) as count from vehicles group by status')) {
    const counts = {};
    mockState.vehicles.forEach(v => { counts[v.status] = (counts[v.status] || 0) + 1; });
    return [Object.keys(counts).map(k => ({ status: k, count: counts[k] }))];
  }
  if (lowerSql.includes('select delay_status, count(*) as count from trips where status != \'trip_completed\'')) {
    const active = mockState.trips.filter(t => t.status !== 'trip_completed');
    const counts = {};
    active.forEach(t => { counts[t.delay_status] = (counts[t.delay_status] || 0) + 1; });
    return [Object.keys(counts).map(k => ({ delay_status: k, count: counts[k] }))];
  }

  // --- REPORTS ---
  if (lowerSql.includes('from trips t join bookings b')) {
    // Generate list for daily/weekly/monthly reports
    const reports = mockState.trips.map(t => {
      const b = mockState.bookings.find(bk => bk.id === t.booking_id);
      const v = b ? mockState.vehicles.find(veh => veh.id === b.vehicle_id) : null;
      const d = b ? mockState.drivers.find(drv => drv.id === b.driver_id) : null;
      return {
        trip_uid: t.trip_uid,
        customer_name: b?.customer_name,
        customer_mobile: b?.customer_mobile,
        pickup_location: b?.pickup_location,
        drop_location: b?.drop_location,
        fare_amount: b?.fare_amount,
        status: t.status,
        delay_status: t.delay_status,
        distance_covered: t.distance_covered,
        vehicle_number: v?.vehicle_number,
        driver_name: d?.name,
        trip_date: b?.created_at,
        trip_date_formatted: new Date(b?.created_at).toISOString().slice(0, 16).replace('T', ' ')
      };
    });
    return [reports];
  }

  // --- TRIP HISTORY ---
  if (lowerSql.startsWith('select * from trip_history where booking_id = ?')) {
    const list = mockState.trip_history.filter(h => h.booking_id === params[0]);
    return [list];
  }
  if (lowerSql.startsWith('insert into trip_history')) {
    const nextId = mockState.trip_history.length + 1;
    const newHistory = { id: nextId, booking_id: params[0], action: params[1], status: params[2], remarks: params[3], created_at: new Date() };
    mockState.trip_history.push(newHistory);
    return [{ insertId: nextId }];
  }

  // --- PAYMENTS ---
  if (lowerSql.startsWith('select * from payments where booking_id = ?')) {
    const list = mockState.payments.filter(p => p.booking_id === params[0]);
    return [list];
  }
  if (lowerSql.startsWith('insert into payments')) {
    const nextId = mockState.payments.length + 1;
    const newPayment = { id: nextId, booking_id: params[0], advance_amount: parseFloat(params[1] || 0), balance_amount: parseFloat(params[2] || 0), payment_status: params[3] || 'pending', created_at: new Date() };
    const existingIdx = mockState.payments.findIndex(p => p.booking_id === params[0]);
    if (existingIdx !== -1) {
      mockState.payments[existingIdx] = { ...mockState.payments[existingIdx], advance_amount: parseFloat(params[1]), balance_amount: parseFloat(params[2]), payment_status: params[3] };
      return [{ affectedRows: 1 }];
    }
    mockState.payments.push(newPayment);
    return [{ insertId: nextId }];
  }

  // --- COMPLAINTS ---
  if (lowerSql.startsWith('select * from complaints where booking_id = ?')) {
    const list = mockState.complaints.filter(c => c.booking_id === params[0]);
    return [list];
  }
  if (lowerSql.startsWith('insert into complaints')) {
    const nextId = mockState.complaints.length + 1;
    const newComplaint = { id: nextId, booking_id: params[0], complaint_text: params[1], status: params[2] || 'open', created_at: new Date() };
    mockState.complaints.push(newComplaint);
    return [{ insertId: nextId }];
  }

  // --- RATINGS ---
  if (lowerSql.startsWith('select * from ratings where booking_id = ?')) {
    const list = mockState.ratings.filter(r => r.booking_id === params[0]);
    return [list];
  }
  if (lowerSql.startsWith('insert into ratings')) {
    const nextId = mockState.ratings.length + 1;
    const newRating = { id: nextId, booking_id: params[0], rating: parseInt(params[1]), feedback: params[2], created_at: new Date() };
    const existingIdx = mockState.ratings.findIndex(r => r.booking_id === params[0]);
    if (existingIdx !== -1) {
      mockState.ratings[existingIdx] = { ...mockState.ratings[existingIdx], rating: parseInt(params[1]), feedback: params[2] };
      return [{ affectedRows: 1 }];
    }
    mockState.ratings.push(newRating);
    return [{ insertId: nextId }];
  }

  // Fallback return empty array
  return [[]];
}

async function initDatabase() {
  try {
    // 1. First connect without database selection to create it if it doesn't exist
    const tempConnection = await mysql.createConnection(dbConfig);
    const dbName = process.env.DB_NAME || 'manivtha_travels';
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await tempConnection.end();

    // 2. Initialize connection pool with database selected
    pool = mysql.createPool({
      ...dbConfig,
      database: dbName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    console.log(`Connected to MySQL database: ${dbName}`);

    // 3. Auto-initialize tables if empty
    const [tables] = await pool.query('SHOW TABLES');
    if (tables.length === 0) {
      console.log('Database tables not found. Executing schema.sql to initialize database...');
      const schemaPath = path.join(__dirname, '..', '..', 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        const queries = schemaSql
          .replace(/--.*$/gm, '')
          .split(';')
          .map(q => q.trim())
          .filter(q => q.length > 0);

        for (const query of queries) {
          if (query.toUpperCase().startsWith('USE ')) continue;
          await pool.query(query);
        }
        console.log('Database initialized successfully with schema and seed data!');
      } else {
        console.warn('schema.sql not found! Please initialize the database manually.');
      }
    } else {
      console.log('Database tables already exist. Checking seed records...');
      try {
        const [usersRows] = await pool.query('SELECT COUNT(*) AS count FROM users');
        if (usersRows && usersRows[0] && usersRows[0].count === 0) {
          console.log('Users table is empty. Executing seed data insert queries...');
          const schemaPath = path.join(__dirname, '..', '..', 'schema.sql');
          if (fs.existsSync(schemaPath)) {
            const schemaSql = fs.readFileSync(schemaPath, 'utf8');
            const queries = schemaSql
              .replace(/--.*$/gm, '')
              .split(';')
              .map(q => q.trim())
              .filter(q => q.length > 0);

            for (const query of queries) {
              if (query.toUpperCase().startsWith('INSERT INTO ')) {
                await pool.query(query);
              }
            }
            console.log('Seed records inserted successfully!');
          }
        } else {
          console.log('Database contains records. Skipping seed insertion.');
        }
      } catch (err) {
        console.warn('Failed to verify or seed table records:', err.message);
      }
    }

  } catch (error) {
    console.warn('\n⚠️ LOCAL MySQL CONNECTION FAILED:', error.message);
    console.warn('Falling back to Mock In-Memory Database Mode for local preview.\n');
    isMockMode = true;
    
    // Construct dummy pool wrapper mapping to the mock query runner
    pool = {
      query: async (sql, params) => executeMockQuery(sql, params),
      execute: async (sql, params) => executeMockQuery(sql, params),
    };
  }
}

// Immediately start connection
initDatabase();

module.exports = {
  query: (sql, params) => pool.query(sql, params),
  getPool: () => pool,
};
