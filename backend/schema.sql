-- GPS-Based Trip Tracking Dashboard Database Schema
-- Database: manivtha_travels

CREATE DATABASE IF NOT EXISTS manivtha_travels;
USE manivtha_travels;

-- Disable foreign key checks to allow clean drops
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS ratings;
DROP TABLE IF EXISTS complaints;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS trip_history;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS gps_logs;
DROP TABLE IF EXISTS trips;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS drivers;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'driver', 'customer') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Drivers Table
CREATE TABLE drivers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE,
    name VARCHAR(100) NOT NULL,
    mobile_number VARCHAR(20) NOT NULL,
    license_number VARCHAR(50) NOT NULL UNIQUE,
    experience INT NOT NULL, -- in years
    status ENUM('available', 'on_trip', 'inactive') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Vehicles Table
CREATE TABLE vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_number VARCHAR(20) NOT NULL UNIQUE,
    vehicle_type VARCHAR(50) NOT NULL, -- SUV, Sedan, Minivan, Bus
    capacity INT NOT NULL,
    status ENUM('available', 'on_trip', 'maintenance', 'inactive') DEFAULT 'available',
    driver_id INT UNIQUE, -- One-to-one assignment for shift
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Customers Table
CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE,
    name VARCHAR(100) NOT NULL,
    mobile_number VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Bookings Table
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    customer_mobile VARCHAR(20) NOT NULL,
    pickup_location VARCHAR(255) NOT NULL,
    pickup_latitude DECIMAL(10, 8) NOT NULL,
    pickup_longitude DECIMAL(11, 8) NOT NULL,
    drop_location VARCHAR(255) NOT NULL,
    drop_latitude DECIMAL(10, 8) NOT NULL,
    drop_longitude DECIMAL(11, 8) NOT NULL,
    trip_date DATETIME NOT NULL,
    vehicle_id INT,
    driver_id INT,
    fare_amount DECIMAL(10, 2) NOT NULL,
    booking_status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Trips Table
CREATE TABLE trips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL UNIQUE,
    trip_uid VARCHAR(50) NOT NULL UNIQUE, -- Unique tracking ID for Customers
    status ENUM(
        'booking_created', 
        'driver_assigned', 
        'vehicle_dispatched', 
        'driver_reached_pickup', 
        'pickup_completed', 
        'trip_in_progress', 
        'drop_completed', 
        'trip_completed'
    ) DEFAULT 'booking_created',
    current_latitude DECIMAL(10, 8) NOT NULL,
    current_longitude DECIMAL(11, 8) NOT NULL,
    current_address VARCHAR(255),
    pickup_status ENUM('pending', 'completed') DEFAULT 'pending',
    drop_status ENUM('pending', 'completed') DEFAULT 'pending',
    route_progress_percent INT DEFAULT 0,
    distance_covered DECIMAL(10, 2) DEFAULT 0.00, -- in km
    remaining_distance DECIMAL(10, 2) DEFAULT 0.00, -- in km
    planned_start_time DATETIME NOT NULL,
    planned_end_time DATETIME NOT NULL,
    actual_start_time DATETIME DEFAULT NULL,
    actual_end_time DATETIME DEFAULT NULL,
    eta_minutes INT DEFAULT 0,
    delay_status ENUM('on_time', 'delayed') DEFAULT 'on_time',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. GPS Logs Table
CREATE TABLE gps_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trip_id INT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    address VARCHAR(255),
    speed DECIMAL(5, 2) DEFAULT 0.00, -- in km/h
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    INDEX (trip_id),
    INDEX (recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Notifications Table
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trip_id INT,
    user_id INT,
    type ENUM('delay', 'completion', 'assignment', 'alert', 'info') NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Reports Table
CREATE TABLE reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    report_type ENUM('daily', 'weekly', 'monthly') NOT NULL,
    report_date DATE NOT NULL,
    total_trips INT DEFAULT 0,
    completed_trips INT DEFAULT 0,
    delayed_trips INT DEFAULT 0,
    total_revenue DECIMAL(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Trip History Table
CREATE TABLE trip_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. Payments Table
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL UNIQUE,
    advance_amount DECIMAL(10, 2) DEFAULT 0.00,
    balance_amount DECIMAL(10, 2) DEFAULT 0.00,
    payment_status ENUM('pending', 'partial', 'paid') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. Complaints Table
CREATE TABLE complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    complaint_text TEXT NOT NULL,
    status ENUM('open', 'resolved', 'closed') DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 13. Ratings Table
CREATE TABLE ratings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL UNIQUE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ==========================================
-- SEED DATA
-- ==========================================

-- Seed Users (Passwords are bcrypt hashes of: 'admin123', 'driver123', 'customer123')
-- Admin: admin@manivtha.com
-- Driver 1: driver1@manivtha.com
-- Driver 2: driver2@manivtha.com
-- Customer 1: customer1@gmail.com
INSERT INTO users (id, name, email, password, role) VALUES
(1, 'Manivtha Admin', 'admin@manivtha.com', '$2a$10$Wh4513z1UaGjgd3TDhQZ3Oh5J6txdeeeIa1fiHDo9dyJpru0Bz/1.', 'admin'),
(2, 'Rajesh Kumar', 'driver1@manivtha.com', '$2a$10$pVeSaqlf3WhncqLZrLm38ePeU5Tbt.CACT7d/.WzFZJVknW.ymZWq', 'driver'),
(3, 'Amit Singh', 'driver2@manivtha.com', '$2a$10$pVeSaqlf3WhncqLZrLm38ePeU5Tbt.CACT7d/.WzFZJVknW.ymZWq', 'driver'),
(4, 'Suresh Raina', 'driver3@manivtha.com', '$2a$10$pVeSaqlf3WhncqLZrLm38ePeU5Tbt.CACT7d/.WzFZJVknW.ymZWq', 'driver'),
(5, 'John Doe', 'customer1@gmail.com', '$2a$10$zJTGmk.EiZYhts56BqW8X.pZM65.NKbYj.D7OBy3v1fESZfThbxgu', 'customer');

-- Seed Drivers
INSERT INTO drivers (id, user_id, name, mobile_number, license_number, experience, status) VALUES
(1, 2, 'Rajesh Kumar', '9876543210', 'DL-KA5320190001', 8, 'available'),
(2, 3, 'Amit Singh', '9876543211', 'DL-MH1220180002', 5, 'available'),
(3, 4, 'Suresh Raina', '9876543212', 'DL-DL0420170003', 10, 'available');

-- Seed Vehicles
INSERT INTO vehicles (id, vehicle_number, vehicle_type, capacity, status, driver_id) VALUES
(1, 'KA-03-ME-1234', 'SUV', 7, 'available', 1),
(2, 'MH-12-GP-5678', 'Sedan', 4, 'available', 2),
(3, 'DL-01-TC-9012', 'Minivan', 9, 'available', 3);

-- Seed Bookings
-- Active Booking
INSERT INTO bookings (id, customer_name, customer_mobile, pickup_location, pickup_latitude, pickup_longitude, drop_location, drop_latitude, drop_longitude, trip_date, vehicle_id, driver_id, fare_amount, booking_status) VALUES
(1, 'John Doe', '9123456789', 'Bangalore Airport (BLR)', 13.1986, 77.7066, 'Electronic City Phase 1, Bangalore', 12.8407, 77.6753, NOW(), 1, 1, 1500.00, 'confirmed'),
-- Completed Booking
(2, 'Sarah Smith', '9123456780', 'Indiranagar, Bangalore', 12.9719, 77.6412, 'Majestic Bus Stand, Bangalore', 12.9779, 77.5724, DATE_SUB(NOW(), INTERVAL 1 DAY), 2, 2, 450.00, 'completed'),
-- Delayed/Running Booking
(3, 'Vikram Malhotra', '9123456781', 'Whitefield, Bangalore', 12.9698, 77.7499, 'Bannerghatta National Park, Bangalore', 12.8009, 77.5777, NOW(), 3, 3, 1200.00, 'confirmed');

-- Seed Trips
-- Trip 1: In Progress, simulates Airport to Electronic City
INSERT INTO trips (id, booking_id, trip_uid, status, current_latitude, current_longitude, current_address, pickup_status, drop_status, route_progress_percent, distance_covered, remaining_distance, planned_start_time, planned_end_time, actual_start_time, eta_minutes, delay_status) VALUES
(1, 1, 'TRIP-BLR-EC-001', 'trip_in_progress', 13.1000, 77.6900, 'Hebbal Flyover, Bangalore', 'completed', 'pending', 35, 15.20, 28.50, NOW(), DATE_ADD(NOW(), INTERVAL 1 HOUR), NOW(), 45, 'on_time');

-- Trip 2: Completed yesterday
INSERT INTO trips (id, booking_id, trip_uid, status, current_latitude, current_longitude, current_address, pickup_status, drop_status, route_progress_percent, distance_covered, remaining_distance, planned_start_time, planned_end_time, actual_start_time, actual_end_time, eta_minutes, delay_status) VALUES
(2, 2, 'TRIP-IND-MAJ-002', 'trip_completed', 12.9779, 77.5724, 'Majestic Bus Stand, Bangalore', 'completed', 'completed', 100, 10.50, 0.00, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(DATE_ADD(NOW(), INTERVAL 1 HOUR), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(DATE_ADD(NOW(), INTERVAL 45 MINUTE), INTERVAL 1 DAY), 0, 'on_time');

-- Trip 3: Active and Delayed (ETA is greater than planned end time)
INSERT INTO trips (id, booking_id, trip_uid, status, current_latitude, current_longitude, current_address, pickup_status, drop_status, route_progress_percent, distance_covered, remaining_distance, planned_start_time, planned_end_time, actual_start_time, eta_minutes, delay_status) VALUES
(3, 3, 'TRIP-WF-BG-003', 'trip_in_progress', 12.9100, 77.6200, 'Silk Board Flyover, Bangalore (Heavy Traffic)', 'completed', 'pending', 40, 14.00, 21.00, DATE_SUB(NOW(), INTERVAL 30 MINUTE), DATE_ADD(NOW(), INTERVAL 15 MINUTE), DATE_SUB(NOW(), INTERVAL 30 MINUTE), 35, 'delayed');

-- Seed GPS Logs for Trip 1
INSERT INTO gps_logs (trip_id, latitude, longitude, address, speed) VALUES
(1, 13.1986, 77.7066, 'Bangalore Airport Terminal 1', 0.00),
(1, 13.1500, 77.7000, 'Kempegowda Toll Plaza', 60.00),
(1, 13.1000, 77.6900, 'Hebbal Flyover, Bangalore', 45.00);

-- Seed GPS Logs for Trip 3
INSERT INTO gps_logs (trip_id, latitude, longitude, address, speed) VALUES
(3, 12.9698, 77.7499, 'Whitefield, Bangalore', 0.00),
(3, 12.9400, 77.7000, 'Marathahalli Bridge', 40.00),
(3, 12.9100, 77.6200, 'Silk Board Flyover, Bangalore (Heavy Traffic)', 5.00);

-- Seed Notifications
INSERT INTO notifications (trip_id, user_id, type, title, message, is_read) VALUES
(3, 1, 'delay', 'Trip Delayed: TRIP-WF-BG-003', 'Vehicle DL-01-TC-9012 is delayed due to heavy traffic at Silk Board. Current ETA is 35 minutes.', FALSE),
(1, 1, 'assignment', 'Driver Assigned: Rajesh Kumar', 'Driver Rajesh Kumar has been assigned to Booking #1 (Vehicle KA-03-ME-1234).', TRUE);

-- Seed Reports
INSERT INTO reports (report_type, report_date, total_trips, completed_trips, delayed_trips, total_revenue) VALUES
('daily', DATE_SUB(CURDATE(), INTERVAL 1 DAY), 1, 1, 0, 450.00),
('daily', DATE_SUB(CURDATE(), INTERVAL 2 DAY), 3, 2, 1, 2100.00),
('weekly', CURDATE(), 4, 3, 1, 2550.00);

-- Seed Trip History
INSERT INTO trip_history (booking_id, action, status, remarks) VALUES
(1, 'Booking Created', 'booking_created', 'Booking logged in system.'),
(1, 'Driver Assigned', 'driver_assigned', 'Driver Rajesh Kumar allocated to ride.'),
(1, 'Trip Started', 'trip_in_progress', 'Passenger picked up and route active.'),
(2, 'Booking Created', 'booking_created', 'Airport pickup booking.'),
(2, 'Trip Completed', 'trip_completed', 'Arrived at Majestic Bus Stand.'),
(3, 'Booking Created', 'booking_created', 'Whitefield to Bannerghatta route booked.'),
(3, 'Driver Assigned', 'driver_assigned', 'Driver Suresh Raina assigned.');

-- Seed Payments
INSERT INTO payments (booking_id, advance_amount, balance_amount, payment_status) VALUES
(1, 500.00, 1000.00, 'partial'),
(2, 450.00, 0.00, 'paid'),
(3, 0.00, 1200.00, 'pending');

-- Seed Complaints
INSERT INTO complaints (booking_id, complaint_text, status) VALUES
(3, 'Heavy congestion on route causing delayed pickup.', 'open');

-- Seed Ratings
INSERT INTO ratings (booking_id, rating, feedback) VALUES
(2, 5, 'Excellent route navigation and smooth driving. Driver Rajesh was very polite.');

-- Update Vehicle Statuses based on seed data
UPDATE vehicles SET status = 'on_trip' WHERE id IN (1, 3);
UPDATE drivers SET status = 'on_trip' WHERE id IN (1, 3);
