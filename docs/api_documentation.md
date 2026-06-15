# API Documentation

The backend service runs at `http://localhost:5000` by default.

---

## Authentication Endpoints

### 1. Register User
Creates a new login account. If the role is `driver`, it also inserts a blank driver profile.
* **URL**: `/api/auth/register`
* **Method**: `POST`
* **Auth Required**: No
* **Request Body**:
```json
{
  "name": "Amit Kumar",
  "email": "amit@manivtha.com",
  "password": "driver123",
  "role": "driver",
  "mobile_number": "9876543209",
  "license_number": "DL-KA5320261111",
  "experience": 4
}
```
* **Success Response (201 Created)**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5c...",
  "user": {
    "id": 6,
    "name": "Amit Kumar",
    "email": "amit@manivtha.com",
    "role": "driver"
  }
}
```

### 2. Login User
Verifies credentials and returns a JWT session token.
* **URL**: `/api/auth/login`
* **Method**: `POST`
* **Auth Required**: No
* **Request Body**:
```json
{
  "email": "admin@manivtha.com",
  "password": "admin123"
}
```
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5c...",
  "user": {
    "id": 1,
    "name": "Manivtha Admin",
    "email": "admin@manivtha.com",
    "role": "admin",
    "driverId": null
  }
}
```

### 3. Get Current Profile
Fetches details of the logged-in session.
* **URL**: `/api/auth/me`
* **Method**: `GET`
* **Headers**: `Authorization: Bearer <token>`
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "Manivtha Admin",
    "email": "admin@manivtha.com",
    "role": "admin",
    "created_at": "2026-06-07T09:00:00.000Z",
    "driverProfile": null
  }
}
```

---

## Fleet & Booking Management (Admin)

### 1. Get Vehicles List
* **URL**: `/api/vehicles`
* **Method**: `GET`
* **Headers**: `Authorization: Bearer <token>`
* **Response (200 OK)**:
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": 1,
      "vehicle_number": "KA-03-ME-1234",
      "vehicle_type": "SUV",
      "capacity": 7,
      "status": "available",
      "driver_id": 1,
      "driver_name": "Rajesh Kumar",
      "driver_mobile": "9876543210"
    }
  ]
}
```

### 2. Create Booking
* **URL**: `/api/bookings`
* **Method**: `POST`
* **Headers**: `Authorization: Bearer <token>`
* **Request Body**:
```json
{
  "customer_name": "Sarah Connor",
  "customer_mobile": "9988776655",
  "pickup_location": "Airport",
  "drop_location": "Electronic City",
  "trip_date": "2026-06-08T10:00:00",
  "fare_amount": 1200,
  "booking_status": "confirmed",
  "vehicle_id": 1,
  "driver_id": 1
}
```
* **Response (201 Created)**:
```json
{
  "success": true,
  "message": "Booking created successfully and Trip initialized",
  "bookingId": 4,
  "tripUid": "TRIP-X8Y7Z2A1",
  "data": {
    "id": 4,
    "customer_name": "Sarah Connor",
    "pickup_location": "Airport",
    "drop_location": "Electronic City",
    "trip_date": "2026-06-08T10:00:00",
    "fare_amount": 1200,
    "booking_status": "confirmed",
    "vehicle_id": 1,
    "driver_id": 1,
    "trip_uid": "TRIP-X8Y7Z2A1"
  }
}
```

---

## Trip Tracking Endpoints

### 1. Get Active Trips (Admin / Drivers)
* **URL**: `/api/trips`
* **Method**: `GET`
* **Headers**: `Authorization: Bearer <token>`
* **Response**: Returns list of trips (filtered to assigned driver if user role is `driver`).

### 2. Public Tracking Info (Guest Customers)
Returns live tracking telemetry for maps without requiring JWT credentials.
* **URL**: `/api/trips/tracking/:tripUid`
* **Method**: `GET`
* **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "booking_id": 1,
    "trip_uid": "TRIP-BLR-EC-001",
    "status": "trip_in_progress",
    "current_latitude": "13.10000000",
    "current_longitude": "77.69000000",
    "current_address": "Hebbal Flyover, Bangalore",
    "route_progress_percent": 35,
    "distance_covered": "15.20",
    "remaining_distance": "28.50",
    "planned_start_time": "2026-06-07T14:00:00.000Z",
    "planned_end_time": "2026-06-07T15:00:00.000Z",
    "eta_minutes": 45,
    "delay_status": "on_time",
    "customer_name": "John Doe",
    "pickup_location": "Bangalore Airport (BLR)",
    "drop_location": "Electronic City Phase 1, Bangalore",
    "vehicle_number": "KA-03-ME-1234",
    "vehicle_type": "SUV",
    "driver_name": "Rajesh Kumar",
    "driver_mobile": "9876543210",
    "gps_path": [
      {
        "latitude": "13.19860000",
        "longitude": "77.70660000",
        "address": "Bangalore Airport Terminal 1",
        "recorded_at": "2026-06-07T14:00:05.000Z"
      }
    ]
  }
}
```

### 3. Update Trip Status (Driver)
* **URL**: `/api/trips/:id/status`
* **Method**: `POST`
* **Headers**: `Authorization: Bearer <token>`
* **Request Body**:
```json
{
  "status": "trip_in_progress"
}
```

### 4. Update GPS Location manually (Driver)
* **URL**: `/api/trips/:id/location`
* **Method**: `POST`
* **Headers**: `Authorization: Bearer <token>`
* **Request Body**:
```json
{
  "latitude": 13.0500,
  "longitude": 77.6800,
  "address": "Hebbal Outer Ring Road",
  "speed": 55
}
```

---

## Analytics & Reports

### 1. Get Dashboard Metrics (Admin only)
* **URL**: `/api/dashboard/stats`
* **Method**: `GET`
* **Headers**: `Authorization: Bearer <token>`

### 2. Export Report (Admin only)
* **URL**: `/api/reports/export?format=csv&range=weekly` (Format: `csv` or `pdf`; Range: `daily`, `weekly`, `monthly`)
* **Method**: `GET`
* **Headers**: `Authorization: Bearer <token>`

---

## New Application APIs (Aligned to Specification)

### 1. Booking APIs (Aliases & Direct Updates)
* **URL**: `/api/bookings/create`
  * **Method**: `POST`
  * **Description**: Create booking (alias for `/api/bookings`).
* **URL**: `/api/bookings/update-status`
  * **Method**: `PUT`
  * **Description**: Updates booking status only. Syncs active trip lifecycle.
  * **Request Body**:
    ```json
    {
      "id": 1,
      "status": "confirmed"
    }
    ```

### 2. GPS API Service
* **URL**: `/api/gps/update`
  * **Method**: `POST`
  * **Description**: Public endpoint for telematics tracker hardware device updates.
  * **Request Body**:
    ```json
    {
      "tripId": "TRIP-BLR-EC-001",
      "latitude": 13.0800,
      "longitude": 77.6500,
      "address": "Hebbal Outer Ring Road",
      "speed": 55
    }
    ```
* **URL**: `/api/gps/:tripId`
  * **Method**: `GET`
  * **Description**: Get GPS coordinates logs history for trip.

### 3. Dashboard API (Root counts)
* **URL**: `/api/dashboard`
  * **Method**: `GET`
  * **Description**: Returns 4 key KPI counts.
  * **Response (200 OK)**:
    ```json
    {
      "success": true,
      "data": {
        "totalTrips": 3,
        "activeTrips": 2,
        "completedTrips": 1,
        "delayedTrips": 1
      }
    }
    ```

### 4. Trip Details, Payments, Ratings & Complaints
* **URL**: `/api/trips/:id/details`
  * **Method**: `GET`
  * **Description**: Returns all detailed items including payments, complaints, ratings, history, coordinates log, and rule-based AI summaries.
* **URL**: `/api/trips/:id/payment`
  * **Method**: `POST`
  * **Description**: Update advance, balance, and payment status for trip.
* **URL**: `/api/trips/:id/complaint`
  * **Method**: `POST`
  * **Description**: Submit a complaint.
* **URL**: `/api/trips/:id/rating`
  * **Method**: `POST`
  * **Description**: Submit star rating and feedback.

