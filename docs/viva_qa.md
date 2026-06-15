# Viva Questions & Answers

This guide compiles common viva questions about the **GPS-Based Trip Tracking Dashboard** project.

---

### Q1: What is the main objective of this project?
**A**: The objective is to build a full-stack fleet tracking dashboard that enables travel companies (like Manivtha Travels) to schedule bookings, assign drivers, monitor trips in real-time, simulate GPS telemetry, generate automated delay alerts, and export operational reports.

### Q2: Why did you use OpenStreetMap (OSM) instead of Google Maps?
**A**: Google Maps requires billing setup and private API keys. OpenStreetMap (via Leaflet JS and React-Leaflet) is open-source, completely free, and doesn't require API keys, making it ideal for cost-efficient, production-ready deployments.

### Q3: How does your GPS tracking simulation work?
**A**: If a real GPS device is unavailable, the Node.js backend runs a background simulator loop (using `setInterval` on a 10-second timer). For active trips, it interpolates the coordinates between the pickup and drop-off points, updates the database, calculates the remaining distance, estimates the ETA, and logs the path history in the `gps_logs` table.

### Q4: Explain the formula you used to calculate distances on the map.
**A**: We used the **Haversine Formula**. It calculates the shortest distance between two points on a sphere (the Earth) using their latitudes and longitudes:
$$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
Where $R$ is the Earth's radius (6371 km), $\phi$ is latitude, and $\lambda$ is longitude.

### Q5: How is user authentication secured in this application?
**A**: We use stateless **JSON Web Tokens (JWT)**. When a user logs in, the server generates a signed token containing their user ID and role. The client stores this in `localStorage` and includes it in the `Authorization: Bearer <token>` header for subsequent requests. Passwords are encrypted in the database using `bcryptjs`.

### Q6: How does the role-based access control (RBAC) work?
**A**: On the backend, we created an `authorize(...roles)` middleware that checks the role decoded from the JWT token against allowed roles. On the frontend, `ProtectedRoute` wraps components and redirects unauthorized users back to the dashboard or login page.

### Q7: How are delay alerts triggered?
**A**: During the GPS simulation, the engine calculates the vehicle's arrival time based on the remaining distance and speed. If this calculated arrival time exceeds the planned end time, the trip's delay status is set to `delayed`, and an alert is added to the `notifications` table.

### Q8: What database schema normalization practices were followed?
**A**: The database is normalized to **3rd Normal Form (3NF)**:
- Customer and Driver tables reference the base `users` table via foreign keys to avoid repeating credentials.
- Vehicle and driver tables track assignments independently to avoid redundant storage.
- Coordinate history is stored in a separate `gps_logs` table instead of inflating the main `trips` table.

### Q9: How does the application generate PDFs and CSVs for reports?
**A**:
- **CSV**: The backend converts the database records into a comma-separated text string and streams it with the headers `Content-Type: text/csv`.
- **PDF**: The backend returns a print-friendly HTML page. When rendered, the client uses `window.open` and browser printing to save the document as a PDF, maintaining CSS styling.

### Q10: How are table states synced between the bookings and trips tables?
**A**: When a booking is marked `confirmed` and has both a vehicle and driver allocated, the system automatically inserts a tracking record into the `trips` table. Similarly, completing a trip updates the booking status to `completed` and frees up the vehicle and driver.
