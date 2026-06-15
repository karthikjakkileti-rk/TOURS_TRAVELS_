# Project Report: GPS-Based Trip Tracking Dashboard
**System Client: Manivtha Tours & Travels**

---

## 1. Executive Summary & Abstract
In the logistics and travel industry, real-time monitoring of vehicles and ETA tracking is crucial to ensuring customer satisfaction and maximizing fleet utilization. This project delivers a production-ready, full-stack web application designed for **Manivtha Tours & Travels** to manage, dispatch, and track vehicle bookings. 

The application implements a split user experience supporting **Admins** (fleet operations and reports), **Drivers** (trip checklists and status updates), and **Customers** (public real-time map tracking). Built using React + Material UI, Node.js + Express, and MySQL, the dashboard features a custom-engineered, background-interval GPS simulator which updates telemetry, computes distances via the Haversine formula, and triggers delay alerts when planned ETAs are exceeded.

---

## 2. Problem Statement
Logistics and travel managers often operate without visibility into in-transit fleet coordinates. This creates several issues:
- **Lack of ETA Precision**: Managers cannot provide clients with accurate arrival predictions.
- **Unmanaged Delays**: Drivers stuck in traffic cannot easily flag delays, leaving travel companies unaware of trip status.
- **Underutilized Fleet**: Vehicles sitting idle or in maintenance are not clearly flagged, causing scheduling conflicts.
- **Unsecured Client Tracking**: Standard tracking solutions require users to log in, creating friction for guest passengers.

---

## 3. Proposed Solution & Architecture
This application introduces a robust REST API backend and a responsive Web Portal:
1. **Normalized MySQL Database**: Tracks related elements of fleet management—users, vehicle capacity, driver licenses, booking fares, trip telemetry, and GPS coordinate logs.
2. **Background GPS Simulator Engine**: Emulates latitude/longitude movement at 10-second intervals from pickup coordinates to drop coordinates, ensuring interactive maps without expensive hardware connections.
3. **OpenStreetMap Integration**: Uses Leaflet JS to render paths, pickup/drop icons, and active cars without requiring Google Maps billing keys.
4. **Three-Tier Role Security**: Enforces JWT path limits. Admins see all fleet assets; drivers see only assigned trips; customers access public paths using short, secure Trip UIDs.

---

## 4. System Modular Design

### 4.1 Authentication & Security
Uses stateless JWT tokens stored in the browser's `localStorage` and sent via `Authorization: Bearer <token>` headers. Hashed passwords utilize `bcryptjs` with a salt factor of 10.

### 4.2 Fleet & Drivers Management
Includes forms to manage drivers and vehicles. Reassigning drivers updates vehicle availability. If an Admin creates a new driver, a login account is automatically generated, pre-configured with the default password `driver123`.

### 4.3 Bookings & Dispatching
Collects customer data and routing locations. Assigning a vehicle and driver automatically shifts booking status to `confirmed` and creates a corresponding record in the `trips` table, initializing coordinates at the pickup latitude and longitude.

### 4.4 GPS Simulator & Alert Systems
The Node.js backend runs a background process polling for active rides:
- Calculates distance covered and remaining distance.
- Uses average velocities (50 km/h) to predict ETA minutes.
- If arrival exceeds the planned time, it triggers a warning notification and marks the trip status as `delayed`.

---

## 5. Software Requirements Specifications (SRS)

* **Frontend Framework**: React 18, Vite, Material UI (MUI), Recharts, React-Leaflet
* **Backend Runtime**: Node.js v18+, Express v4
* **Database Engine**: MySQL v8.0+
* **Authentication Standard**: JSON Web Token (JWT)
* **Map Source**: OpenStreetMap (OSM)
* **Testing Libraries**: Jest, Supertest
