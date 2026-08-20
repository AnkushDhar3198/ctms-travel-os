# ✈️ TravelOS — Corporate Travel Management System

> A full-stack corporate travel management platform with **Apple-inspired glassmorphism UI**, real-time trip tracking with **scheduled timeline & mandatory verification**, and a **7-step automated workflow** from request to closure.

<div align="center">

**Angular 16+** · **Spring Boot 3.2** · **JWT Auth** · **H2 Database**

</div>

---

## ⚡ Quick Start

```bash
# Backend (localhost:8080)
cd backend && mvn spring-boot:run

# Frontend (localhost:4200)
cd frontend && npm install && ng serve
```

---

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Angular 16+ SPA                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │ Employee  │ │ Manager  │ │Travel Dsk│ │  Finance  │  │
│  │Dashboard  │ │Dashboard │ │Dashboard │ │ Dashboard │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬─────┘  │
│       └─────────────┴────────────┴─────────────┘        │
│                    HTTP + JWT Bearer                     │
├─────────────────────────────────────────────────────────┤
│               Spring Boot 3.2 REST API                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │   Auth   │ │  Trips   │ │Itinerary │ │ Expenses  │  │
│  │ Service  │ │ Service  │ │+ Timeline│ │  Service  │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬─────┘  │
│       └─────────────┴────────────┴─────────────┘        │
│              JPA / Hibernate + H2 (File)                │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 Design Language

Apple HIG-inspired glassmorphism with:

| Token | Value | Usage |
|---|---|---|
| `--bg-glass` | `rgba(255,255,255,0.72)` | Frosted glass panels |
| `--accent` | `#0071E3` | Buttons, active states |
| `--success` | `#30D158` | Checkmarks, verified |
| `--danger` | `#FF3B30` | Errors, rejections |
| `--warning` | `#FF9F0A` | Pending states |

**Typography**: Inter · **Transitions**: `cubic-bezier(0.25, 1, 0.5, 1)` · **Modals**: Centered glassmorphism, no native alerts

---

## 👥 System Roles

| Role | Access | Key Actions |
|------|--------|-------------|
| **Employee** | `/employee` | Raise requests, track trips with verification, upload expenses, close trips |
| **Manager** | `/manager` | Review & approve/reject requests, add remarks |
| **Travel Desk** | `/travel-desk` | Build itineraries, set milestone timelines, manage assets |
| **Finance** | `/finance` | Review expense bills, credit reimbursements |
| **Admin** | `/admin` | System-wide user & trip management |

---

## 🔄 Business Workflow — 7 Steps

```
  ① Employee        ② System           ③ Manager         ④ Travel Desk
  Raises Request  → Auto-Validates   → Approves       → Books Itinerary
  PENDING_AUTO_VAL  PENDING_MANAGER     APPROVED          + Sets Timeline
                    or REJECTED_SYSTEM  or REJECTED       ACTIVE

  ⑤ Employee        ⑥ Finance          ⑦ Employee
  Live Tracks     → Credits          → Closes Trip
  with Verification  Expenses          CLOSED
  ACTIVE             ACTIVE
```

### Step 1 — Raise Request *(Employee)*
Submit: project number, client ID, destination, travel dates, requirements (flight/hotel/cab/luggage), estimated cost.

### Step 2 — Auto-Validation *(System)*
5 sequential checks: employee status → project validity → client validity → budget limits → mandatory fields.
**Pass** → `PENDING_MANAGER` · **Fail** → `REJECTED_SYSTEM`

### Step 3 — Manager Approval
Review, attach remarks, approve or reject with reason.

### Step 4 — Itinerary & Timeline *(Travel Desk)*
- Book flight (PNR), cab (driver + number), hotel
- Allocate physical assets
- **Set scheduled timeline** for all 7 milestones (pre-filled from trip dates, editable)
- Activate trip → `ACTIVE`

### Step 5 — Live Tracking with Verification *(Employee)*
Interactive timeline with **mandatory verification** before each milestone:

| Milestone | Verification Prompt | Example |
|-----------|-------------------|---------|
| ✈️ Flight Boarded | Seat number | `14A` |
| 🛬 Flight Landed | Arrival terminal | `Terminal 2` |
| 🚕 Cab Pickup | Cab OTP / driver code | `4829` |
| 🏨 Hotel Check-In | Booking confirmation ID | `HBK-90234` |
| 🧳 Hotel Check-Out | Checkout receipt number | `REC-4521` |
| 🛫 Return Flight | Return seat number | `22C` |
| 🏠 Journey Ended | Arrival confirmation | `Reached safely` |

Each completed milestone shows: **scheduled vs actual time**, **on-time / delayed / early** status, and **verification proof**.

### Step 6 — Expense Settlement *(Finance)*
Employee uploads extra expense bills → Finance reviews and credits approved amounts.

### Step 7 — Trip Closure *(Employee)*
Closes only when **all 4 conditions** are met:
- ✅ Current date is after end date
- ✅ All expenses have status `CREDITED`
- ✅ Allocated assets marked `RETURNED`
- ✅ Journey ended milestone is `TRUE`

---

## 📁 Project Structure

```
WFTALM/
├── backend/
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/ctms/
│       │   ├── CtmsApplication.java
│       │   ├── DataSeeder.java
│       │   ├── controller/
│       │   │   ├── AuthController.java
│       │   │   ├── TripController.java
│       │   │   ├── ItineraryController.java
│       │   │   ├── ExpenseController.java
│       │   │   └── UserController.java
│       │   ├── dto/
│       │   │   ├── TripRequestDTO.java
│       │   │   ├── TripMilestoneDTO.java
│       │   │   ├── ChecklistTimelineDTO.java    ← NEW
│       │   │   ├── ItineraryDTO.java
│       │   │   ├── MilestoneUpdateRequest.java
│       │   │   └── ...
│       │   ├── entity/
│       │   │   ├── TripRequest.java
│       │   │   ├── TripMilestones.java          ← verification fields
│       │   │   ├── TripChecklistTimeline.java   ← NEW
│       │   │   ├── TripItinerary.java
│       │   │   ├── Expense.java
│       │   │   ├── User.java
│       │   │   └── enums/
│       │   ├── repository/
│       │   ├── security/
│       │   └── service/
│       │       ├── TripRequestService.java
│       │       ├── LiveTrackingService.java      ← verification logic
│       │       ├── ItineraryService.java         ← timeline management
│       │       ├── AutoValidationService.java
│       │       ├── TripClosureService.java
│       │       ├── ExpenseService.java
│       │       └── AuthService.java
│       └── resources/
│           └── application.properties
└── frontend/
    ├── package.json
    └── src/app/
        ├── core/
        │   ├── models/models.ts
        │   ├── services/
        │   │   ├── auth.service.ts
        │   │   └── trip.service.ts
        │   ├── guards/
        │   └── interceptors/
        └── features/
            ├── auth/          → Login (Employee + Elevated)
            ├── employee/      → Dashboard + Trip Timeline
            ├── manager/       → Approval Queue
            ├── travel-desk/   → Itinerary Builder + Timeline
            ├── finance/       → Expense Review
            └── admin/         → System Management
```

---

## 🔌 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/employee-login` | Employee JWT login `{empId, password}` |
| `POST` | `/api/auth/passcode-login` | Elevated role login `{role, passcode}` |

### Trip Requests
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/trips` | Create new trip request |
| `GET` | `/api/trips/my-trips` | Get current user's trips |
| `GET` | `/api/trips/{id}` | Get trip by ID |
| `GET` | `/api/trips/employee/{empId}` | Get trips by employee |
| `GET` | `/api/trips/pending` | Pending requests (Manager) |
| `GET` | `/api/trips/approved` | Approved requests (Travel Desk) |
| `GET` | `/api/trips/active` | All active trips |
| `GET` | `/api/trips/all` | All trips (Admin) |
| `PUT` | `/api/trips/{id}/approve` | Approve trip request |
| `PUT` | `/api/trips/{id}/reject` | Reject trip request |
| `PATCH` | `/api/trips/{id}/milestone` | Update milestone with verification |
| `GET` | `/api/trips/{id}/milestones` | Get milestone state + timeline |
| `GET` | `/api/trips/{id}/closure-check` | Check closure eligibility |
| `POST` | `/api/trips/{id}/close` | Close active trip |

### Itinerary & Timeline
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/itinerary/{tripId}` | Create/update itinerary |
| `GET` | `/api/itinerary/{tripId}` | Get trip itinerary |
| `PUT` | `/api/itinerary/{tripId}/activate` | Activate trip |
| `PUT` | `/api/itinerary/{tripId}/assets-returned` | Mark assets returned |
| `POST` | `/api/itinerary/{tripId}/timeline` | Set checklist timeline |
| `GET` | `/api/itinerary/{tripId}/timeline` | Get checklist timeline |

### Expenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/expenses` | Upload new expense |
| `GET` | `/api/expenses/trip/{tripId}` | Get expenses for trip |
| `GET` | `/api/expenses/pending` | All pending expenses |
| `PUT` | `/api/expenses/{id}/credit` | Credit an expense (Finance) |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/users/me` | Get current user profile |
| `GET` | `/api/users` | Get all users (Admin) |

---

## 🔐 Default Credentials

### Employee Login
| Employee ID | Password | Name |
|---|---|---|
| `EMP001` | `password123` | Arjun Sharma |
| `EMP002` | `password123` | Priya Patel |
| `EMP003` | `password123` | Rahul Verma |

### Elevated Access *(6-digit passcode, no username needed)*
| Role | Passcode |
|---|---|
| Manager | `111111` |
| Travel Desk | `222222` |
| Finance | `333333` |
| Admin | `444444` |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 16+, RxJS, SCSS (Apple-inspired glassmorphism) |
| Backend | Java 17+, Spring Boot 3.2, Spring Security |
| Auth | JWT (jjwt 0.12.x), BCrypt password hashing |
| Database | H2 (File-based, persistent across restarts) |
| ORM | Hibernate 6.4 / Spring Data JPA |

---

## ⚙️ Configuration

| Property | Value | Notes |
|---|---|---|
| `server.port` | `8080` | Backend API port |
| `spring.jpa.hibernate.ddl-auto` | `update` | Schema auto-evolves, data persists |
| `jwt.expiration` | `86400000` | 24-hour token validity |
| H2 Console | `http://localhost:8080/h2-console` | JDBC: `jdbc:h2:file:./data/ctmsdb`, User: `sa` |

---

<div align="center">

Built with ☕ Java + 🅰️ Angular

</div>
