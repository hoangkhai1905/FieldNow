# Football Field Booking System - Implementation Plan

## Role: Senior Fullstack Architect & Lead Developer
**Context:** University Project - Systems Architecture Course.
**Goal:** Build a scalable, layered architecture web application for booking football fields.

---

## 1. Database Schema (ERD) & Supabase Setup

### Overview
We will use Supabase (PostgreSQL) as the primary data store **and Prisma ORM for database modeling, migrations, and type-safe queries.** Redis will be used for caching and distributed locking (concurrency control).

### Table Definitions

#### `users`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, Default: uuid_generate_v4() | Unique User ID |
| `email` | TEXT | Unique, Not Null | User Email |
| `password` | TEXT | Not Null | Hashed Password |
| `full_name` | TEXT | Nullable | Display Name |
| `phone_number` | TEXT | Nullable | Contact Number |
| `role` | ENUM | 'USER', 'OWNER', 'ADMIN' | Role-Based Access Control |
| `created_at` | TIMESTAMPTZ | Default: NOW() | |

#### `fields`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Unique Field ID |
| `owner_id` | UUID | FK -> users.id | The Owner of the field |
| `name` | TEXT | Not Null | Name of the football field complex |
| `location` | TEXT | Not Null | Address/Map coordinates |
| `description` | TEXT | Nullable | Detail description |
| `images` | TEXT[] | Nullable | Array of image URLs |
| `price_per_hour` | DECIMAL | Not Null | Base price |
| `is_active` | BOOLEAN | Default: false | Admin approval status |

#### `field_slots` (Inventory)
*Note: To manage concurrency easier, we pre-generate slots or define rules. For this plan, we assume explicit slots.*

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Unique Slot ID |
| `field_id` | UUID | FK -> fields.id | Reference to Field |
| `start_time` | TIME | Not Null | e.g., 17:00 |
| `end_time` | TIME | Not Null | e.g., 18:30 |
| `date` | DATE | Not Null | Specific date for the slot |
| `price_override`| DECIMAL | Nullable | Special pricing for peak hours |
| `is_locked` | BOOLEAN | Default: false | Temporary lock during booking process |

#### `bookings`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Unique Booking ID |
| `user_id` | UUID | FK -> users.id | Who booked it |
| `slot_id` | UUID | FK -> field_slots.id | Which slot |
| `status` | ENUM | 'PENDING', 'CONFIRMED', 'CANCELLED' | Booking State |
| `created_at` | TIMESTAMPTZ | Default: NOW() | |
| `expires_at` | TIMESTAMPTZ | Not Null | Expiration time for payment (15m) |

#### `payments`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Unique Payment ID |
| `booking_id` | UUID | FK -> bookings.id | Reference to booking |
| `amount` | DECIMAL | Not Null | Total amount paid |
| `provider` | TEXT | e.g., 'Stripe', 'MoMo' | |
| `status` | ENUM | 'PENDING', 'COMPLETED', 'FAILED' | |

---

## 2. Backend Implementation (Layered Architecture)

### Folder Structure
The backend follows a strict separation of concerns.

```
BE/
├── prisma/             # Prisma Schema
│   └── schema.prisma
├── src/
│   ├── config/             # Configuration (Redis, Supabase, Env vars)
│   ├── infrastructure/     # Database connections, 3rd party clients
│   │   ├── prisma.js       # Prisma Client Instance
│   │   ├── redis.js        # Redis Client
│   │   └── queue.js        # BullMQ Setup
│   ├── controllers/        # HTTP Request Handlers (Req -> Res)
│   │   ├── auth.controller.js
│   │   └── booking.controller.js
│   ├── services/           # Business Logic (The Core)
│   │   ├── auth.service.js
│   │   ├── booking.service.js  # Locking logic lives here
│   │   └── payment.service.js
│   ├── repositories/       # Data Access Layer (Prisma queries)
│   │   ├── user.repository.js
│   │   └── booking.repository.js
│   ├── middlewares/        # Express Middlewares
│   │   ├── auth.middleware.js # JWT Verify
│   │   └── role.middleware.js # RBAC
│   ├── jobs/               # Background Jobs
│   │   ├── email.worker.js
│   │   └── cleanup.cron.js
│   ├── utils/
│   └── app.js              # Entry point
└── package.json
```

### Key Components

#### 1. Middleware Strategy
**`authMiddleware`**:
- Extract `Bearer Token` from headers.
- Verify JWT using `jsonwebtoken`.
- Attach `user` payload to `req.user`.

**`roleMiddleware`**:
- Accepting an array of allowed roles: `roleMiddleware(['ADMIN', 'OWNER'])`.
- Checks if `req.user.role` is in the allowed list.

#### 2. Advanced Booking Flow (The Race Condition Handler)

**Goal:** Prevent double booking for the same slot.

**Step-by-Step Logic in `BookingService.createBooking`**:
1.  **Input**: `userId`, `slotId`.
2.  **Redis Lock**: Attempt to acquire a distributed lock key: `lock:slot:{slotId}` using logic (SETNX with TTL 5 seconds).
    *   *If failed:* Return Error "Slot is currently being processed by another user".
3.  **Validation**: Check DB if `slotId` is already `CONFIRMED` in `bookings` table.
    *   *If booked:* Release Lock & Return Error "Slot already taken".
4.  **Transaction**:
    *   Create `Booking` record with status `PENDING`.
    *   Calculate `expires_at` = Now + 15 minutes.
5.  **Release Redis Lock**.
6.  **Queue Job**: Add job to `booking-queue` (BullMQ) -> "Send Confirmation Email".
7.  **Return**: Booking Details + Payment Link.

---

## 3. Frontend Implementation

### Folder Structure
Organized by features/domains rather than just file types.

```
FE/
├── src/
│   ├── api/                # Axios instances & Service calls
│   │   ├── axiosClient.js  # Interceptors setup
│   │   └── endpoints.js
│   ├── assets/
│   ├── components/         # Shared UI Components
│   │   ├── common/         # Button, Input, Modal
│   │   └── layout/         # Navbar, Sidebar, Footer
│   ├── context/            # Global State (AuthContext, CartContext)
│   ├── hooks/              # Custom Hooks (useAuth, useSlots)
│   ├── layouts/            # Page Layouts
│   │   ├── MainLayout.jsx
│   │   ├── AdminLayout.jsx
│   │   └── OwnerLayout.jsx
│   ├── pages/
│   │   ├── auth/           # Login, Register
│   │   ├── public/         # Home, FieldDetail, Search
│   │   ├── user/           # MyBookings, Profile
│   │   ├── owner/          # Dashboard, FieldManagement
│   │   └── admin/          # UserManagement, Approvals
│   ├── routes/
│   │   ├── AppRoutes.jsx   # Main Router Config
│   │   └── ProtectedRoute.jsx
│   └── main.jsx
```

### Key Frontend Logic

#### 1. Protected Routes
Wrapper component to handle RBAC on client side.

```jsx
// src/routes/ProtectedRoute.jsx
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" />;

  return children;
};
```

#### 2. Axios Interceptor
Automatically inject token into every request.

```javascript
// src/api/axiosClient.js
const axiosClient = axios.create({ baseURL: import.meta.env.VITE_API_URL });

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## 4. Advanced Integration & Background Tasks

### 1. Redis & BullMQ Setup
**Infrastructure**:
- Use Docker Compose to spin up Redis.
- **BullMQ**:
    - **Producer**: In `BookingService`, push an event `{ type: 'SEND_EMAIL', email: ..., bookingId: ... }`.
    - **Consumer (Worker)**: Listens to the queue, generates HTML email, sends via Nodemailer/SendGrid.

### 2. Auto-Cancellation (Cron Job vs. Delayed Job)
*Strategy: Delayed Job is better for per-booking precision, but Cron is good for cleanup.*

**Approach: BullMQ Delayed Job**
- When Booking is created (Pending), add a job to `expiration-queue` with `delay: 15 * 60 * 1000` (15 mins).
- **Worker Logic**:
    1. Check `Booking` status in DB.
    2. If still `PENDING` (User didn't pay), update status to `CANCELLED`.
    3. Release any soft-locks on the slot.

**Alternative: Node-Cron (Backup)**
- Runs every minute: `* * * * *`.
- Query: `UPDATE bookings SET status='CANCELLED' WHERE status='PENDING' AND expires_at < NOW()`.

---

## 5. Timeline & Checklist (4 Weeks - 3 Members)

### Week 1: Foundation & Auth
*   [Backend] Initialize Project, Express Setup, Database Connection.
*   [Backend] Implement JWT Auth (Login/Register) & RBAC Middlewares.
*   [Frontend] Initialize Vite project, Tailwind Install, Router Setup.
*   [Frontend] Build Login/Register Pages & AuthContext.
*   [DB] Design & Apply Supabase Schema (Users, Fields).

### Week 2: Core Features (Fields & Slots)
*   [Backend] CRUD APIs for Field Management (Owner side).
*   [Backend] Logic to generate TimeSlots for a field.
*   [Frontend] Owner Dashboard: Create Field, Add Slots.
*   [Frontend] Public Page: Search Fields, Filter by location/type.

### Week 3: Booking System (The Hard Part)
*   [Infra] Setup Redis & BullMQ.
*   [Backend] Implement `createBooking` with Redis Distributed Lock.
*   [Backend] Setup Cron/Delayed Job for 15m expiration.
*   [Frontend] Booking UI: Select Slot -> Confirm -> Payment Mock.
*   [Frontend] User Dashboard: "My History".

### Week 4: Payments, Polish & Deploy
*   [Backend] Fake Payment Integration (Update status -> Confirmed).
*   [Frontend] Admin Dashboard (Approve Fields, View Users).
*   [Both] Integration Testing (Test double booking race conditions).
*   [Both] Deployment (Vercel for FE, Render/Fly for BE).
