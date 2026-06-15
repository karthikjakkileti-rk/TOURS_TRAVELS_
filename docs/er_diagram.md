# Entity Relationship (ER) Diagram

This document contains the visual representation of the **Manivtha Travels** database schema.

---

## Mermaid ER Diagram

```mermaid
erDiagram
    USERS {
        int id PK
        string name
        string email
        string password
        enum role
        timestamp created_at
    }

    DRIVERS {
        int id PK
        int user_id FK
        string name
        string mobile_number
        string license_number
        int experience
        enum status
        timestamp created_at
    }

    VEHICLES {
        int id PK
        string vehicle_number
        string vehicle_type
        int capacity
        enum status
        int driver_id FK
        timestamp created_at
    }

    CUSTOMERS {
        int id PK
        int user_id FK
        string name
        string mobile_number
        timestamp created_at
    }

    BOOKINGS {
        int id PK
        string customer_name
        string customer_mobile
        string pickup_location
        decimal pickup_latitude
        decimal pickup_longitude
        string drop_location
        decimal drop_latitude
        decimal drop_longitude
        datetime trip_date
        int vehicle_id FK
        int driver_id FK
        decimal fare_amount
        enum booking_status
        timestamp created_at
    }

    TRIPS {
        int id PK
        int booking_id FK
        string trip_uid
        enum status
        decimal current_latitude
        decimal current_longitude
        string current_address
        enum pickup_status
        enum drop_status
        int route_progress_percent
        decimal distance_covered
        decimal remaining_distance
        datetime planned_start_time
        datetime planned_end_time
        datetime actual_start_time
        datetime actual_end_time
        int eta_minutes
        enum delay_status
        timestamp created_at
    }

    GPS_LOGS {
        int id PK
        int trip_id FK
        decimal latitude
        decimal longitude
        string address
        decimal speed
        timestamp recorded_at
    }

    NOTIFICATIONS {
        int id PK
        int trip_id FK
        int user_id FK
        enum type
        string title
        string message
        boolean is_read
        timestamp created_at
    }

    REPORTS {
        int id PK
        enum report_type
        date report_date
        int total_trips
        int completed_trips
        int delayed_trips
        decimal total_revenue
        timestamp created_at
    }

    USERS ||--o| DRIVERS : "has profile"
    USERS ||--o| CUSTOMERS : "has profile"
    DRIVERS ||--o| VEHICLES : "assigned to"
    DRIVERS ||--o| BOOKINGS : "drives"
    VEHICLES ||--o| BOOKINGS : "allocated to"
    BOOKINGS ||--|| TRIPS : "generates"
    TRIPS ||--o{ GPS_LOGS : "logs location history"
    TRIPS ||--o{ NOTIFICATIONS : "triggers"
    USERS ||--o{ NOTIFICATIONS : "receives"
```

---

## Relational Constraints & Schema Details

1. **`users` ➔ `drivers`**
   - **Type**: 1-to-1 Relationship (Optional). A user record with the role `driver` is linked to a unique entry in the `drivers` table via `user_id`.
   - **Constraint**: `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL`.

2. **`drivers` ➔ `vehicles`**
   - **Type**: 1-to-1 Relationship (Optional). Represents the default vehicle assignment.
   - **Constraint**: `FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL` with a `UNIQUE` index on `driver_id`.

3. **`bookings` Relationships**
   - A booking is linked to **`vehicles`** and **`drivers`** to represent the scheduled vehicle and driver.
   - **Constraints**: 
     - `FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL`
     - `FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL`

4. **`bookings` ➔ `trips`**
   - **Type**: 1-to-1 Relationship (Strict). Every confirmed booking triggers exactly one ride trip record in the database for GPS coordinate tracking.
   - **Constraint**: `FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE` with a `UNIQUE` index on `booking_id`.

5. **`trips` ➔ `gps_logs`**
   - **Type**: 1-to-Many Relationship. As the GPS coordinate simulator increments coordinates, it appends data logs to `gps_logs` mapping the path history.
   - **Constraint**: `FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE`.
