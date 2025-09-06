# Event Booking & Seat Management System

A robust, full-stack event booking platform designed to handle real-time seat management and prevent double-booking using atomic database operations.

## Core Features

### Authentication & Authorization
* JWT authentication
* Role-based authorization (Attendee, Organizer, Admin)
* bcrypt password hashing

### UI & Frontend
* Modern responsive Slate/Violet UI with polished cards, forms, dashboards, and seat-grid states
* Plus Jakarta Sans typography
* Event browsing and interactive Seat grid
* User booking history, Organizer dashboard, and Admin dashboard

### Event Management
* Event CRUD (Organizers/Admins)
* Configure rows/seats per row

### Seat Management
* Specific seat selection
* Temporary 5-minute seat locking
* Atomic MongoDB seat locking
* Double-booking prevention

### Booking
* Booking/cancellation flow
* QR-code generation for ticket confirmation

### Real-Time Updates
* Socket.IO real-time seat updates

## Architecture

```text
React
   ↓
Express REST API
   ↓
Controllers / Middleware
   ↓
Mongoose
   ↓
MongoDB

Socket.IO
   ↕
React clients viewing the same event
```

## Main Booking Flow

1. User logs in and receives a JWT.
2. User browses published events and selects an event.
3. User opens the real-time seat grid and selects a seat.
4. The frontend requests a seat lock. The backend acquires a temporary lock on the seat.
5. User confirms the booking.
6. The backend updates the seat to BOOKED and creates a Registration.
7. User receives a confirmation code and can view the ticket in their booking history.

## Seat State Flow

```text
AVAILABLE
    ↓
LOCKED
    ├── expires → AVAILABLE
    └── confirmed → BOOKED
                         ↓
                    cancelled
                         ↓
                     AVAILABLE
```

## Concurrency & Double-Booking Prevention

The critical seat acquisition operation uses an atomic MongoDB/Mongoose operation such as `findOneAndUpdate`. 

```text
AVAILABLE
    ↓
atomic findOneAndUpdate
    ↓
LOCKED
```

The availability condition and state change happen together. If two users attempt to acquire the same seat concurrently, only one can successfully acquire it. This is **atomic MongoDB seat locking to prevent double booking.**

## Temporary Seat Locking

A seat is temporarily locked for 5 minutes using the `lockedUntil` timestamp. Seats are permanent MongoDB documents. An expired `LOCKED` seat is treated as available and can be acquired again by another user.

## Real-Time Seat Updates

* Socket.IO is used for real-time seat availability.
* Users viewing the same event join an event-specific room.
* Seat changes emit a `seatUpdated` event.
* Other clients viewing that event update their seat grid without refreshing.

## Failure Handling

If registration creation fails after the seat becomes BOOKED, compensation logic triggers:

```text
BOOKED
   ↓
Registration creation fails
   ↓
Seat restored to AVAILABLE
   ↓
lockedBy cleared
lockedUntil cleared
```

This is compensation logic, NOT a MongoDB transaction.

## User Roles

### Attendee
* Browse events
* Select seats
* Book seats
* Cancel bookings
* View booking history

### Organizer
* Create events
* Configure rows/seats per row
* Manage events
* View bookings

### Admin
* Existing basic administrative functionality

## Tech Stack

### Frontend
* React
* Vite
* Tailwind CSS
* Socket.IO Client

### Backend
* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT
* bcrypt
* Socket.IO

## Project Structure

```text
event-booking-system/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   └── services/
│   ├── package.json
│   └── index.html
├── server/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── index.js
│   └── package.json
└── README.md
```

## Setup Instructions

1. **Environment Setup:**
   - In the `server` directory, copy `.env.example` to `.env`.
   - Ensure the following variables are set:
     * `MONGO_URI` (your MongoDB connection string)
     * `JWT_SECRET` (your JWT secret)
     * `PORT=5000`
     * `CLIENT_URL=http://localhost:5173`

2. **Install Dependencies:**
   - Run `npm install` in both the `client/` and `server/` directories.

3. **Run the Application:**
   - Terminal 1 (Backend): `cd server && npm run dev` (Runs on http://localhost:5000)
   - Terminal 2 (Frontend): `cd client && npm run dev` (Runs on http://localhost:5173)

## Interview Focus

The project intentionally balances:

**70% normal MERN + 30% interesting backend logic**

Key highlights:
1. JWT authentication
2. Role-based authorization
3. MongoDB data modeling
4. Atomic seat locking
5. Race-condition prevention
6. Temporary state using `lockedUntil`
7. Socket.IO real-time updates
8. Booking failure compensation
9. Tradeoffs of avoiding Redis and MongoDB transactions

## Design Decisions / Tradeoffs

### Why a separate Seat model?
Because individual seats need their own state and locking information.

### Why atomic MongoDB locking?
To prevent concurrent users from acquiring the same available seat.

### Why no Redis?
The project intentionally avoids Redis to keep the architecture simple. MongoDB atomic operations are sufficient for the current seat-locking requirements.

### Why no MongoDB transactions?
The project is designed to run with a standard standalone local MongoDB setup. Compensation logic is used for the specific registration-creation failure case.

### Why Socket.IO?
To update users viewing the same event without polling.

## Limitations / Future Scaling

* Current Socket.IO setup is designed for a simple single-server deployment.
* Large-scale horizontal Socket.IO deployment would require shared event propagation.
* A production system with stronger multi-document consistency requirements could use MongoDB transactions.
* Larger-scale systems may introduce additional infrastructure such as Redis.

## License

MIT
