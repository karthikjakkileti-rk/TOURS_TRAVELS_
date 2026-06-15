# Installation & Setup Guide

This guide helps you set up and run the **GPS-Based Trip Tracking Dashboard** on your local machine.

---

## Prerequisites
Before starting, make sure you have the following installed:
1. **Node.js** (v18.0.0 or higher)
2. **npm** (v9.0.0 or higher)
3. **MySQL Server** (v8.0 or higher)

---

## Step 1: Database Setup
The backend contains a self-healing configuration. When the backend starts up, it automatically creates the database and initializes tables if they do not exist!

However, you can also manually load the schema in MySQL:
1. Open your MySQL client (CLI, Workbench, or phpMyAdmin).
2. Execute the script in: [schema.sql](file:///c:/Users/KARTHIK/New%20folder/INTERN-TERM-4/backend/schema.sql)
   This will:
   - Create the `manivtha_travels` database.
   - Set up tables for users, drivers, vehicles, bookings, trips, logs, notifications, and reports.
   - Insert default credentials and dummy records (Airport bookings, and delayed Whitefield routes).

---

## Step 2: Configure Environment Variables
1. Open [backend/.env](file:///c:/Users/KARTHIK/New%20folder/INTERN-TERM-4/backend/.env).
2. Customize the database settings to match your local credentials:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=manivtha_travels
   DB_PORT=3306
   JWT_SECRET=supersecretkeyforgpstracking123!
   GPS_SIMULATION_INTERVAL_MS=10000
   ```

---

## Step 3: Run the Backend API Server
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Start the API server in development mode:
   ```bash
   npm run dev
   ```
   *(This starts `nodemon`. The console will display `Server running on port 5000` and `Connected to MySQL database: manivtha_travels`)*.

---

## Step 4: Run API Tests (Optional)
To verify database connectivity and route controllers:
1. In the `backend` terminal, execute:
   ```bash
   npm test
   ```
   This runs the Jest integration and unit tests, mocking database queries to ensure all endpoints respond correctly.

---

## Step 5: Start the React Web Portal
1. Open a second terminal window and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open your browser to the local URL displayed (typically `http://localhost:5173`).

---

## Step 6: Log In & Verify Features
You can now log in using the seeded test accounts:

* **Admin Access**:
  - **Email**: `admin@manivtha.com`
  - **Password**: `admin123`
* **Driver Access**:
  - **Email**: `driver1@manivtha.com`
  - **Password**: `driver123`
* **Customer Access**:
  - On the login page, click the **Track Guest Trip** tab.
  - Input the Trip ID: `TRIP-BLR-EC-001` or `TRIP-WF-BG-003` to view the live OpenStreetMap tracking interface.
