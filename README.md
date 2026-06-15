# GPS-Based Trip Tracking Dashboard
**Enterprise Fleet & Booking Operations System for Manivtha Tours & Travels**

This repository contains the complete, production-ready full-stack web application designed for **Manivtha Tours & Travels** to manage vehicle fleets, assign drivers, schedule passenger bookings, track active trips in real-time, and monitor delays.

---

## 🚀 Technology Stack

* **Frontend**: React.js (Vite compiler), React Router, Material UI (MUI), Recharts, React-Leaflet (OpenStreetMap)
* **Backend**: Node.js, Express, JWT Security, Bcrypt hashing
* **Database**: MySQL (Normalized 3NF Relational Structure)
* **Testing**: Jest, Supertest

---

## 📁 Project Structure

```
gps-tracking-dashboard/
  ├── backend/               # Express REST API
  │    ├── src/
  │    │    ├── config/      # DB connection pool & auto-migration
  │    │    ├── controllers/ # Auth, booking, vehicle, driver, trip logics
  │    │    ├── middlewares/ # Auth guards & error catchers
  │    │    ├── routes/      # Endpoint mappings
  │    │    ├── utils/       # Background GPS simulator & exports
  │    │    └── app.js       # App entrypoint
  │    ├── tests/            # API integration tests (Jest)
  │    ├── schema.sql        # MySQL table schema & seed data
  │    └── .env              # Environment configurations
  ├── frontend/              # React client
  │    ├── src/
  │    │    ├── components/  # Layouts, Leaflet OSM viewport, Timelines
  │    │    ├── context/     # Auth state context
  │    │    ├── pages/       # Login, dashboard charts, CRUD controls
  │    │    ├── App.jsx      # Navigation routing
  │    │    ├── index.css    # Custom design system
  │    │    └── main.jsx     # Root bootstrap
  │    └── package.json
  ├── docs/                  # Documentation
  │    ├── er_diagram.md     # Relational layout & Mermaid source
  │    ├── api_documentation.md # Endpoints parameters & payloads
  │    ├── project_report.md # Structural documentation content
  │    ├── ppt_slides.md     # 15 powerpoint slide details
  │    ├── demo_script.md    # Demonstration steps
  │    └── viva_qa.md        # Examiner Q&A cheatsheet
  └── setup_guide.md         # Deployment & execution steps
```

---

## 🛠️ Key Features

1. **Role-Based Workspaces**: Secure logins for **Admins** (analytics and fleet CRUD) and **Drivers** (view assigned trips and advance states).
2. **Software-Based GPS Simulator**: A background runner in Node.js that updates active ride coordinates every 10 seconds.
3. **OpenStreetMap Visualization**: Renders paths and vehicle markers dynamically without Google Maps billing keys.
4. **Delay Warning Alerts**: Compares ETA to planned schedules to generate warnings and flash badges.
5. **Report Exports**: Downloads daily, weekly, or monthly spreadsheets (CSV) or launches print-friendly templates (PDF).
6. **Self-Healing DB Setup**: The backend automatically runs table creations and inserts seed records on startup.

---

## 📖 Supporting Documentation

- 🛠️ [Setup & Installation Guide](file:///c:/Users/KARTHIK/New%20folder/INTERN-TERM-4/setup_guide.md)
- 📊 [Entity-Relationship Diagram](file:///c:/Users/KARTHIK/New%20folder/INTERN-TERM-4/docs/er_diagram.md)
- 🔌 [REST API Documentation](file:///c:/Users/KARTHIK/New%20folder/INTERN-TERM-4/docs/api_documentation.md)
- 📝 [Project Report Draft](file:///c:/Users/KARTHIK/New%20folder/INTERN-TERM-4/docs/project_report.md)
- 🖥️ [PowerPoint Presentation slides](file:///c:/Users/KARTHIK/New%20folder/INTERN-TERM-4/docs/ppt_slides.md)
- 🎭 [Demo Script walkthrough](file:///c:/Users/KARTHIK/New%20folder/INTERN-TERM-4/docs/demo_script.md)
- 🎓 [Viva Q&A Prep Sheet](file:///c:/Users/KARTHIK/New%20folder/INTERN-TERM-4/docs/viva_qa.md)
