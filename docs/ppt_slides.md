# PowerPoint Presentation: 15-Slide Structure
**Project: GPS-Based Trip Tracking Dashboard for Manivtha Tours & Travels**

---

### Slide 1: Title & Cover Slide
* **Slide Title**: Real-time GPS-Based Fleet & Trip Tracking Dashboard
* **Subtitle**: An Enterprise Logistics Solution for Manivtha Tours & Travels
* **Content**:
  - Presented by: [Your Name]
  - Role: Senior Full Stack Developer Intern
  - Tech Stack: React, Node.js, Express, MySQL, OpenStreetMap

---

### Slide 2: Project Objectives
* **Slide Title**: Core Project Objectives
* **Content**:
  - Automate vehicle dispatch and driver assignment.
  - Track in-transit vehicle locations and ETA calculations.
  - Enable customer self-tracking using a secure, login-free Trip ID.
  - Audit operational efficiency using metrics graphs and exportable logs.

---

### Slide 3: Problem Statement
* **Slide Title**: Industrial Challenges & Current Scenario
* **Content**:
  - Fleet operators have no real-time visibility into transit routes.
  - Manual ETA updates by drivers are inaccurate and prone to human error.
  - Delays caused by traffic are detected only after deadlines have passed.
  - Commercial vehicle GPS tracking hardware is expensive and difficult to install.

---

### Slide 4: Proposed System Solution
* **Slide Title**: The Proposed Solution
* **Content**:
  - **Full-Stack Application**: Integrates backend APIs with a real-time web portal.
  - **Software-based GPS Simulator**: Updates coordinates every 10 seconds to emulate hardware GPS tracking.
  - **OpenStreetMap Visualization**: Shows route paths, vehicle locations, and pickup/drop markers.
  - **Automated Alerts**: Flags delays and triggers notifications when ETAs are exceeded.

---

### Slide 5: System Architecture
* **Slide Title**: Multi-tier Client-Server Architecture
* **Content**:
  - **Client Layer**: React + Vite + Material UI (responsive, theme-oriented).
  - **Application Service Layer**: Node.js + Express REST API.
  - **Database Layer**: Normalized relational MySQL database.
  - **Communication**: Axios queries and real-time polling updates.

---

### Slide 6: User Roles & Access Control
* **Slide Title**: Role-Based Access Control (RBAC)
* **Content**:
  - **Admin Workspace**: Full CRUD for vehicles, drivers, bookings, metrics charts, and report exports.
  - **Driver Workspace**: Mobile-optimized login to view assigned trips, update status milestones, and simulate coordinates.
  - **Customer Workspace**: Login-free tracking page to view vehicle locations and driver details.

---

### Slide 7: Database Design (ER Diagram)
* **Slide Title**: Relational Database Schema (MySQL)
* **Content**:
  - **Normalized Structure**: Prevents data duplication across tables (e.g. users, drivers, vehicles, bookings, trips, gps_logs, notifications).
  - **Integrity Constraints**: Enforces cascade deletes on trip records and locks drivers to a single vehicle.
  - **Index Placement**: Speeds up queries by indexing trip IDs and timestamps.

---

### Slide 8: Database Table Definitions
* **Slide Title**: Core Database Tables
* **Content**:
  - `users`: Credentials, email hashes, and system roles.
  - `drivers` & `vehicles`: Asset status (available, on_trip, maintenance).
  - `bookings`: Route strings, scheduled times, and fare prices.
  - `trips` & `gps_logs`: Current lat/lng coordinates, ETA counters, and historical paths.

---

### Slide 9: REST API Development
* **Slide Title**: Express REST API Design
* **Content**:
  - `POST /api/auth/login`: Verifies passwords and returns JWT keys.
  - `POST /api/bookings`: Registers bookings and initializes trips.
  - `GET /api/trips/tracking/:tripUid`: Public route for guest customer tracking.
  - `POST /api/trips/:id/status`: Updates active driver milestones.
  - `GET /api/dashboard/stats`: Aggregates metrics for the admin dashboard.

---

### Slide 10: GPS Location Simulator Engine
* **Slide Title**: Background Telemetry Simulator
* **Content**:
  - Automatically processes active rides using a background interval timer.
  - Increments coordinates from pickup points to drop-off points by 5% every 10 seconds.
  - Calculates distance covered and remaining distance via the Haversine formula.
  - Automatically frees up vehicle/driver status upon trip completion.

---

### Slide 11: Real-time Map Integration
* **Slide Title**: OpenStreetMap & Leaflet JS
* **Content**:
  - Built using React-Leaflet with custom SVG icons (Green for Pickup, Red for Drop, Blue for Cabs).
  - Draws polyline vectors to show path history.
  - Automatically pans the map view to center the vehicle's position during updates.
  - Does not require paid API keys, ensuring zero-cost deployment.

---

### Slide 12: Analytics Dashboard Visualizations
* **Slide Title**: Recharts Analytics
* **Content**:
  - **KPI Blocks**: Total Cabs, active trips, completed rides, delayed warnings, and total earnings.
  - **Volume Charts**: Line graphs showing booking history.
  - **Financial Metrics**: Area charts showing revenue trends.
  - **Fleet Breakdown**: Donut charts detailing vehicle status and delay statistics.

---

### Slide 13: Report Generation & Exports
* **Slide Title**: Operation Reports Auditing
* **Content**:
  - Toggles between daily, weekly, and monthly operational reports.
  - Generates downloadable CSV files for Excel.
  - Generates printable HTML templates that can be saved directly as PDF documents in the browser.
  - Includes user details, driver names, coordinates, and fare amounts.

---

### Slide 14: Testing & Quality Assurance
* **Slide Title**: Verification & Test Plan
* **Content**:
  - **Mock Testing**: Mocks MySQL database queries using Jest.
  - **API Integration**: Validates response codes, error responses, and JWT requirements using Supertest.
  - **User Testing**: Verifies driver workflow progression and real-time map updates.

---

### Slide 15: Conclusion & Future Scope
* **Slide Title**: Conclusion & Future Extensions
* **Content**:
  - **Conclusion**: Delivers a production-ready fleet tracking solution for Manivtha Travels.
  - **Future Extensions**:
    - Add native SMS/WhatsApp alerts.
    - Integrate real OBD-II GPS hardware.
    - Implement route optimization using Open Source Routing Machine (OSRM).
