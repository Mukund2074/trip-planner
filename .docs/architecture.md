# Application Architecture

## 1. System Overview

- **Runtime & Package Manager**: Bun (`bun@1.4.0`)
- **Backend Framework**: Node.js, Express.js (TypeScript)
- **Database**: MongoDB / Mongoose (with automated in-memory server fallback)
- **Frontend**: React, Vite, TypeScript, Tailwind CSS, Lucide Icons, React Router
- **Security**: JWT session tokens, role-based route middleware, environment variable separation

---

## 2. Architecture & Data Flow

```
[ Client (Vite / React) ]
       │
       ▼  (REST API with Bearer Token)
[ Express API Gateway ]
       │
       ├──► [ requireMemberAuth Middleware ]
       │
       ├──► [ requireOrganizerAuth Middleware ]
       │
       ▼
[ MongoDB Collections: trips, members, expenses, checklistitems ]
```

---

## 3. Data Models

1. **Trip**: Primary trip container (title, subtitle, dates, origin, destinations, cover image).
2. **Member**: Travel companion profile (name, phone, email, isOrganizer, password with private projection).
3. **Expense**: Shared expenditure entry with payer, category, amount, and split distribution list.
4. **ChecklistItem**: Travel checkpoints and packing tasks with categorization and completion state.

---

## 4. API Endpoints

### Trips
- `GET /api/trips`: Fetch active trip details
- `PUT /api/trips/:tripId`: Update trip metadata (Authenticated)

### Members
- `GET /api/trips/:tripId/members`: List all members (Public view)
- `POST /api/trips/:tripId/members`: Add a new member (Organizer only)
- `POST /api/members/login`: Member login with credentials
- `PUT /api/members/:memberId`: Update member details (Organizer only)
- `DELETE /api/members/:memberId`: Remove member from trip (Organizer only)

### Expenses
- `GET /api/trips/:tripId/expenses`: List all recorded expenses
- `GET /api/trips/:tripId/expenses/summary`: Calculate grand totals and per-member settlement balances
- `POST /api/trips/:tripId/expenses`: Record an expense or settlement (Member only)
- `PUT /api/expenses/:expenseId`: Update expense details (Member only)
- `DELETE /api/expenses/:expenseId`: Delete an expense (Member only)

### Checklist
- `GET /api/trips/:tripId/checklist`: Fetch checklist items and completion metrics
- `POST /api/trips/:tripId/checklist`: Add a checkpoint item (Member only)
- `PUT /api/checklist/:itemId`: Toggle completion or update text (Member only)
- `DELETE /api/checklist/:itemId`: Remove checkpoint item (Member only)
