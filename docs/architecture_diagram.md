# Standalone System Architecture Diagram

This document illustrates the three-tier system architecture designed for the **Manivtha Travels GPS-Based Trip Tracking Dashboard**.

---

## Architecture Diagram (Mermaid)

```mermaid
graph TD
    %% Define User Roles
    subgraph Users ["User Client Interfaces"]
        AdminRole["Admin / Fleet Manager<br/>(Dashboard, Fleet CRUD, Details, Exports)"]
        DriverRole["Vehicle Driver<br/>(Trips Schedule, Milestone Workflow, Telemetry)"]
        CustomerRole["Guest Traveller<br/>(Public Map View, AI Status Alerts)"]
    end

    %% Frontend Layers
    subgraph FrontendApp ["Frontend Web Application (React + Vite)"]
        ReactApp["React Router & Auth Context"]
        MuiUI["Material UI Components & Styling"]
        OsmMap["OpenStreetMap (Leaflet Map Tracker)"]
        Charts["Analytics Panels (Recharts)"]
    end

    %% API Gateway & Security
    subgraph APIGateway ["API Layer & Routing (Node.js + Express)"]
        JWTSecurity["JWT Authentication middleware"]
        RouterAuth["Auth Router (/api/auth)"]
        RouterBook["Bookings Router (/api/bookings)"]
        RouterTrip["Trips Router (/api/trips)"]
        RouterGps["GPS Telemetry Router (/api/gps)"]
        RouterReport["Reports Router (/api/reports)"]
    end

    %% Backend Controllers & Business Logic
    subgraph Services ["Backend Controllers & Telemetry Engine"]
        BookingCtrl["Booking Controller<br/>(Confirmations, Trip Initializer)"]
        TripCtrl["Trip Controller<br/>(Workflow steps, Payment details)"]
        GpsCtrl["GPS Controller<br/>(Telemetry logs, Distance formulas)"]
        GpsSim["GPS Simulator background worker<br/>(Auto Linear Interpolation)"]
        AISummary["AI Summary Engine<br/>(summaryGenerator.js)"]
    end

    %% Database Layer
    subgraph DataTier ["Persistence Layer"]
        MySQL["MySQL Database Server<br/>(Self-healing table creator & seeds)"]
        InMemoryMock["In-Memory Mock Database<br/>(Offline Fallback Mode)"]
    end

    %% Wiring connections
    AdminRole -->|Login & JWT| ReactApp
    DriverRole -->|Login & JWT| ReactApp
    CustomerRole -->|Guest URL Access| ReactApp

    ReactApp --> MuiUI
    MuiUI --> OsmMap
    MuiUI --> Charts

    ReactApp -->|HTTP Axios request| APIGateway
    APIGateway -->|Protect guard check| JWTSecurity

    JWTSecurity --> RouterAuth
    JWTSecurity --> RouterBook
    JWTSecurity --> RouterTrip
    JWTSecurity --> RouterGps
    JWTSecurity --> RouterReport

    RouterBook --> BookingCtrl
    RouterTrip --> TripCtrl
    RouterGps --> GpsCtrl
    RouterGps --> GpsSim

    BookingCtrl --> AISummary
    TripCtrl --> AISummary
    GpsCtrl --> AISummary

    BookingCtrl -->|Query| MySQL
    TripCtrl -->|Query| MySQL
    GpsCtrl -->|Query| MySQL
    GpsSim -->|Query| MySQL

    MySQL -.->|Fallback if offline| InMemoryMock
```

---

## Structural Workflow Sequence

1. **Booking Confirmation**: Admin confirms booking $\rightarrow$ Booking Controller allocates vehicle and driver $\rightarrow$ inserts trip record and logs milestone `Booking Created` inside `trip_history`.
2. **Ride Dispatch**: Driver marks trip status `Dispatched` $\rightarrow$ Trip Controller triggers notification $\rightarrow$ activates background GPS Coordinate Simulator.
3. **Telemetry Logs**: Background GPS Simulator ticks every 10 seconds $\rightarrow$ moves coordinates linearly $\rightarrow$ inserts logs in `gps_logs` $\rightarrow$ evaluates ETA delays $\rightarrow$ logs alerts.
4. **Detail Analytics**: Admin opens Detailed Statistics Page $\rightarrow$ Trip controller pulls customer, driver, vehicle, payments ledger, complaints, star ratings, workflow steps, coordinates timeline $\rightarrow$ passes summaries through `summaryGenerator.js` $\rightarrow$ outputs dynamic JSON payload to client dashboard.
