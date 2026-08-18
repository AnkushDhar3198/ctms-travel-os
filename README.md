# Corporate Travel Management System (CTMS)

A full-stack Corporate Travel Management System featuring an **Apple-inspired glassmorphism UI** built with Angular 16+ and a **JWT-secured Spring Boot 3.x backend** with H2 database.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [UI/UX Design Language](#uiux-design-language)
3. [Authentication Flow](#authentication-flow)
4. [System Roles](#system-roles)
5. [Business Workflow (7 Steps)](#business-workflow)
6. [Project Structure](#project-structure)
7. [Getting Started](#getting-started)
8. [API Reference](#api-reference)
9. [Default Credentials](#default-credentials)

---

## Tech Stack

| Layer     | Technology                                      |
|-----------|------------------------------------------------|
| Frontend  | Angular 16+, RxJS, SCSS (Apple-inspired)       |
| Backend   | Java 17+, Spring Boot 3.2, Spring Security     |
| Auth      | JWT (jjwt 0.12.x), BCrypt password hashing     |
| Database  | H2 (File-based for development persistence)    |
| ORM       | Hibernate / Spring Data JPA                     |

---

## UI/UX Design Language

### Apple-Inspired Constraints

The frontend follows a strict **Apple HIG-inspired** design language:

#### Color Palette
| Token               | Value       | Usage                      |
|---------------------|-------------|----------------------------|
| `--bg-primary`      | `#FBFBFD`   | Page background            |
| `--bg-glass`        | `rgba(255,255,255,0.72)` | Glassmorphism panels |
| `--text-primary`    | `#1D1D1F`   | Headings, body text        |
| `--text-secondary`  | `#6E6E73`   | Labels, placeholders       |
| `--accent`          | `#0071E3`   | Buttons, links, active     |
| `--accent-hover`    | `#0077ED`   | Button hover states        |
| `--success`         | `#30D158`   | Checkmarks, success states |
| `--danger`          | `#FF3B30`   | Errors, rejections         |
| `--warning`         | `#FF9F0A`   | Pending states             |
| `--border-glass`    | `rgba(255,255,255,0.18)` | Glass panel borders  |

#### Typography
- **Font Family**: `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`
- **Font Weight**: 400 (body), 500 (labels), 600 (headings), 700 (titles)
- **Letter Spacing**: `-0.022em` for headings

#### Glassmorphism Specification
```css
.glass-panel {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
}
```

#### Animations
- **All transitions**: `transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1)`
- **Modal entrance**: Scale from 0.95 → 1.0 with opacity 0 → 1
- **Checkbox completion**: Animated stroke-dasharray SVG checkmark

#### Modals & Overlays
- **No native browser alerts** — all dialogs are custom centered modals
- **Overlay**: `rgba(0, 0, 0, 0.4)` background with `backdrop-filter: blur(5px)`
- **Modal position**: Absolute center using CSS grid `place-items: center`

---

## Authentication Flow

### Dual Authentication System

The system supports two distinct login mechanisms:

#### 1. Employee Login (`/auth/employee-login`)
- Standard form-based authentication
- Fields: **Employee ID** (string) + **Password**
- Returns: JWT with role `EMPLOYEE`

#### 2. Elevated Access Login (`/auth/elevated-login`)
- Role-based card selection UI
- 4 frosted-glass cards: **Manager**, **Travel Desk**, **Finance**, **Admin**
- Click a card → centered modal asks for **6-digit passcode**
- No username/password required — role + passcode validates the JWT
- Returns: JWT with the selected role claim

### JWT Structure
```json
{
  "sub": "EMP001",
  "userId": 1,
  "name": "John Doe",
  "role": "EMPLOYEE",
  "iat": 1700000000,
  "exp": 1700086400
}
```

---

## System Roles

| Role          | Capabilities                                                     |
|---------------|------------------------------------------------------------------|
| **Employee**  | Raise travel requests, track trips, upload expenses, close trips |
| **Manager**   | Review & approve/reject requests, allocate assets, add remarks   |
| **Travel Desk** | Book flights/cabs/hotels, build itineraries, manage assets    |
| **Finance**   | Review expense bills, credit reimbursements                      |
| **Admin**     | System data management, future SOS Risk feature                  |

---

## Business Workflow

The travel lifecycle follows a strict **7-step state machine**:

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  Step 1           Step 2            Step 3           Step 4         │
│  ┌──────────┐    ┌──────────────┐   ┌──────────┐   ┌────────────┐  │
│  │ Employee  │───>│ Auto-Validate│──>│ Manager  │──>│ Travel Desk│  │
│  │ Raises    │    │ (System)     │   │ Approves │   │ Books      │  │
│  │ Request   │    │              │   │          │   │ Itinerary  │  │
│  └──────────┘    └──────────────┘   └──────────┘   └────────────┘  │
│       │               │                  │               │          │
│  PENDING_AUTO_VAL  PENDING_MANAGER    APPROVED        ACTIVE       │
│                    or REJECTED_SYSTEM  or REJECTED                  │
│                                                                     │
│  Step 5            Step 6           Step 7                          │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────┐                   │
│  │ Employee     │  │ Finance     │  │ Employee  │                   │
│  │ Live Tracks  │  │ Credits     │  │ Closes    │                   │
│  │ Milestones   │  │ Expenses    │  │ Trip      │                   │
│  └──────────────┘  └─────────────┘  └──────────┘                   │
│       │                  │               │                          │
│     ACTIVE            ACTIVE          CLOSED                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Step 1: Raise Travel Request (Employee)
- Submits: Project Number, Client ID, Destination, Travel Dates, Requirements (Flight/Hotel/Cab/Luggage), Estimated Cost
- Initial status: `PENDING_AUTO_VAL`

### Step 2: Automatic Validation (System)
Runs 5 sequential checks:
1. `checkEmployeeStatus()` — Is the employee active?
2. `validateProject()` — Does the project exist?
3. `validateClient()` — Is the client valid?
4. `checkBudgetLimit()` — Is budget within limits?
5. `verifyMandatoryFields()` — All required fields present?
- **Pass**: Status → `PENDING_MANAGER`
- **Fail**: Status → `REJECTED_SYSTEM` with reason

### Step 3: Manager Approval
- Manager reviews request in pending queue
- **Approve**: Attaches remarks + allocates assets → Status → `APPROVED`
- **Reject**: Attaches rejection reason → Status → `REJECTED`

### Step 4: Booking & Itinerary (Travel Desk)
- Books Flight/Train (PNR), Cab (driver + number), Hotel
- Allocates physical assets
- Forwards complete itinerary → Status → `ACTIVE`

### Step 5: Live Tracking (Employee)
- Interactive timeline: Flight → Cab → Hotel → Journey End
- Employee checks milestones as they complete
- System tracks progression in real-time

### Step 6: Expense Settlement (Finance)
- Employee uploads extra expense bills (PDF/JPEG)
- Finance reviews and credits approved amounts

### Step 7: Trip Closure (Employee)
Trip can only close when ALL conditions are met:
1. ✅ `LocalDateTime.now()` is after `endDate`
2. ✅ ALL linked expenses have status `CREDITED`
3. ✅ Allocated assets are marked `RETURNED`
4. ✅ `journeyEnded` milestone is `TRUE`

---

## Project Structure

```
WFTALM/
├── README.md
├── backend/
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/ctms/
│       │   ├── CtmsApplication.java
│       │   ├── controller/
│       │   ├── dto/
│       │   ├── entity/
│       │   ├── exception/
│       │   ├── repository/
│       │   ├── security/
│       │   └── service/
│       └── resources/
│           ├── application.properties
│           └── data.sql
└── frontend/
    ├── angular.json
    ├── package.json
    └── src/
        ├── app/
        │   ├── core/       (guards, interceptors, services)
        │   ├── shared/     (modal, toast, spinner, data-table)
        │   └── features/   (auth, employee, manager, travel-desk, finance)
        ├── styles.scss
        └── index.html
```

---

## Getting Started

### Prerequisites
- **Java 17+** and **Maven 3.8+**
- **Node.js 18+** and **npm 9+**
- **Angular CLI 16+** (`npm install -g @angular/cli@16`)

### Backend Setup
```bash
cd backend
mvn clean install
mvn spring-boot:run
```
- API runs on `http://localhost:8080`
- H2 Console: `http://localhost:8080/h2-console`
  - JDBC URL: `jdbc:h2:file:./data/ctmsdb`
  - Username: `sa` / Password: *(empty)*

### Frontend Setup
```bash
cd frontend
npm install
ng serve
```
- App runs on `http://localhost:4200`

---

## API Reference

### Authentication
| Method | Endpoint                      | Body                          | Description          |
|--------|-------------------------------|-------------------------------|----------------------|
| POST   | `/api/auth/employee-login`    | `{empId, password}`           | Employee JWT login   |
| POST   | `/api/auth/passcode-login`    | `{role, passcode}`            | Elevated access login|

### Trip Requests
| Method | Endpoint                          | Description                    |
|--------|-----------------------------------|--------------------------------|
| POST   | `/api/trips`                      | Create new trip request        |
| GET    | `/api/trips/employee/{empId}`     | Get trips by employee          |
| GET    | `/api/trips/pending`              | Get pending requests (Manager) |
| PUT    | `/api/trips/{id}/approve`         | Approve trip request           |
| PUT    | `/api/trips/{id}/reject`          | Reject trip request            |
| PATCH  | `/api/trips/{id}/milestone`       | Update trip milestone          |
| POST   | `/api/trips/{id}/close`           | Close active trip              |

### Itinerary
| Method | Endpoint                          | Description                    |
|--------|-----------------------------------|--------------------------------|
| POST   | `/api/itinerary/{tripId}`         | Create/update itinerary        |
| GET    | `/api/itinerary/{tripId}`         | Get trip itinerary             |
| PUT    | `/api/itinerary/{tripId}/activate`| Activate trip with itinerary   |

### Expenses
| Method | Endpoint                          | Description                    |
|--------|-----------------------------------|--------------------------------|
| POST   | `/api/expenses`                   | Upload new expense             |
| GET    | `/api/expenses/trip/{tripId}`     | Get expenses for a trip        |
| GET    | `/api/expenses/pending`           | Get all pending expenses       |
| PUT    | `/api/expenses/{id}/credit`       | Credit an expense (Finance)    |

---

## Default Credentials

### Employee Login
| Employee ID | Password     | Name           |
|-------------|-------------|----------------|
| EMP001      | password123 | Arjun Sharma   |
| EMP002      | password123 | Priya Patel    |
| EMP003      | password123 | Rahul Verma    |

### Elevated Access (6-digit Passcode)
| Role        | Passcode |
|-------------|----------|
| Manager     | 111111   |
| Travel Desk | 222222   |
| Finance     | 333333   |
| Admin       | 444444   |
