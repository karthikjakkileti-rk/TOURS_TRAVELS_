# Project Demo Script

Follow this step-by-step script to demonstrate all the features of the **GPS-Based Trip Tracking Dashboard** to examiners, evaluators, or stakeholders.

---

## Part 1: Initial Database Setup & API Health
1. Open your terminal in the `backend/` folder and run `npm start`.
2. Point out that the backend console prints:
   `Connected to MySQL database: manivtha_travels`
   `Database initialized successfully with schema and seed data!`
   *(Explain that the backend automatically reads `schema.sql` and populates tables if the database is empty, showcasing self-healing database architecture)*.
3. Open a browser window to `http://localhost:5000/health`. Show the JSON output:
   `{"status": "UP", "timestamp": "..."}`
   *(Confirms the REST API server is online and running)*.

---

## Part 2: Admin Dashboard & Fleet Allocation
1. Navigate to the frontend page at `http://localhost:5173` (or the local Vite port) in a browser.
2. Log in using the **Admin** credentials:
   - **Email**: `admin@manivtha.com`
   - **Password**: `admin123`
3. **Showcase the Dashboard**:
   - Point out the KPI Cards (Total Cabs, Active Rides, Revenue, Delays).
   - Scroll down to show the Recharts graphs (Daily booking counts, Revenue trends, Fleet status breakdown).
4. **Create a Vehicle**:
   - Click **Vehicles** in the sidebar.
   - Click **Add Vehicle**.
   - Input: `KA-51-MM-9999`, Type: `SUV`, Capacity: `7`, Status: `Available`. Assign no driver yet. Click **Save Details**.
5. **Create a Driver**:
   - Click **Drivers** in the sidebar.
   - Click **Add Driver**.
   - Input Name: `Vijay Singh`, Email: `vijay@manivtha.com`, Mobile: `9876543222`, License: `DL-KA51-00099`, Experience: `6`.
   - Click **Confirm Registration**. Explain to the examiners that creating a driver profile automatically registers a secure login account with the password `driver123`.
6. **Assign the Driver to the Vehicle**:
   - Go back to **Vehicles**, click **Edit** on `KA-51-MM-9999`.
   - Set "Assign Driver" to `Vijay Singh`. Click **Save Details**. Show that the driver's details now display in the table.

---

## Part 3: Booking Creation & GPS Workflow
1. Click **Bookings** in the sidebar.
2. Click **New Booking**.
3. Input Details:
   - **Customer Name**: `Alice Walker`, Mobile: `9900887766`
   - **Pickup**: `Bangalore Airport`
   - **Drop-off**: `Electronic City`
   - **Trip Date**: (Leave as default tomorrow, or change to today)
   - **Fare**: Click **Estimate** to calculate based on locations.
   - **Allocate Vehicle**: Select `KA-51-MM-9999`.
   - **Assign Driver**: Select `Vijay Singh`.
   - **Booking Status**: Set to `Confirmed`.
   - Click **Confirm Dispatch**.
4. Show the new row in the Bookings table. Highlight the generated **Trip ID** (e.g. `TRIP-A1B2C3D4`). Explain that because we selected "Confirmed", the system initialized the active trip record automatically.

---

## Part 4: Driver Interface & Milestone Updates
1. Open a new Incognito browser window (or logout) and go to the login page.
2. Log in as the newly created **Driver**:
   - **Email**: `driver1@manivtha.com` (or the one you just created)
   - **Password**: `driver123`
3. Point out that the Driver is redirected to their **My Trips** dashboard.
4. Locate the active trip card and explain the workflow:
   - Click **Dispatch Vehicle**. The status changes to `vehicle_dispatched`.
   - Wait 10 seconds. Show that the simulator updates the progress and moves coordinates.
   - Click **Mark Reached Pickup**. The status changes to `driver_reached_pickup`.
   - Click **Mark Pickup Completed**. The status changes to `pickup_completed`.
   - Click **Start Trip Route**. The status changes to `trip_in_progress`.
5. Point out that once the trip starts, coordinates begin incrementing by 10% every 10 seconds. Show the changing distance covered, remaining distance, and ETA calculations.

---

## Part 5: Customer Live Map Tracking
1. Copy the **Trip ID** from the card.
2. Go to the login page and click the **Track Guest Trip** tab.
3. Paste the Trip ID and click **Track Live Location**.
4. **Demonstrate Live Tracking**:
   - Show the OpenStreetMap rendering.
   - Show the Green circle marker (Pickup), Red marker (Drop-off), and Blue car icon (Current vehicle coordinates).
   - Point out that the vehicle icon moves along the route every few seconds, and the map pans automatically.
   - Point out the floating current address box.

---

## Part 6: Delay Alert System
1. Go back to the Admin workspace.
2. Show that one of the active trips is delayed (e.g. `TRIP-WF-BG-003`).
3. Show the **Red glowing delay badge** and the notification count in the top toolbar.
4. Click the Notification Bell icon. Show the alert detail:
   `Vehicle associated with trip TRIP-WF-BG-003 is delayed. Current ETA: 35 minutes.`

---

## Part 7: Operational Reports & PDF/CSV Export
1. Click **Reports** in the sidebar.
2. Toggle between **Daily**, **Weekly**, and **Monthly** filters. Point out the dynamic metrics cards.
3. Click **Export to CSV**. Show the generated `.csv` file opening in Excel.
4. Click **Print / Save to PDF**. Show the print-friendly preview window. Explain that users can print the document or save it as a PDF directly.
