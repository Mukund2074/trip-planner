# Trip Management Web App Overview

## Summary of Features

A lightweight, mobile-first group travel management application designed for group trips, route tracking, expense splitting, and trip checkpoints.

---

### 1. Application Structure
The application provides 4 core views:
1. **Dashboard (`/`)**:
   - Trip overview, dates, and route summary.
   - Live metrics: Total Members, Total Spend, Checklist Progress.
   - Cloud storage integration for full-resolution group media uploads (accessible to members).
   - Quick action shortcuts for trip management.
2. **Members (`/members`)**:
   - Group travel companion management (Name, phone, email, and Organizer role).
   - **Edit Profile**: Logged-in members can edit their own profile (name, phone, email, password) from their member card or the top header.
   - **Organizer Password View**: When logged in as an Organizer, each companion card displays a password badge with a **"Show / Hide"** toggle to view their stored password.
   - **Organizer Controls**: Trip organizers can edit any member's details, view their password in the edit modal, or remove them from the trip.
   - Clean card-based interface with dynamic avatars.
3. **Expenses & Settlements (`/expenses`)**:
   - Total trip spend calculation, fully settled expenses total, and pending collections totals.
   - Multi-category expense tracking (*Food, Travel, Stay, Tickets, Activities, Shopping, Other*).
   - **Person-Wise Split & Repayment Confirmation**:
     - Calculates individual share per person (`₹Amount / splitCount`).
     - Shows each participant's payment status for that specific expense:
       - Payer is marked as `Paid (Payer)`
       - Other participants are marked as `Paid ✓` or `Unpaid`
     - Status badges: `All Settled ✓` or `X / Y Paid`.
   - **Strict Confirmation Permission (Creator + Organizer Only)**:
     - Only the **member who paid for the expense** OR a **Trip Organizer** can click **"Mark Paid"** to confirm that a member has repaid their share.
     - Members who owe money **cannot** settle themselves on someone else's expense.
   - Click-to-edit expense details with dynamic split participants.
4. **Checklist & Checkpoints (`/checklist`)**:
   - Categorized checkpoint tracking:
     - Places & Viewpoints
     - Adventure & Activities
     - Hotels & Stays
     - Food & Dining stops
     - Essentials & Travel gear
   - Real-time progress bar and completion counter.
   - Category filtering chips to filter checkpoint items.

---

### 2. Access Control & Privacy
- **Public View-Only Access**:
  - Non-members can view trip milestones, active members, expenses, and checklists in read-only mode.
  - Write operations (adding/modifying records) are locked to members.
- **Member Access**:
  - Member authentication allows participating in expense splitting, editing details, and checking off items.
  - Cloud drive links are restricted to logged-in members.
- **Organizer Role**:
  - Only organizers have permissions to add, edit, or remove members from the trip roster.
  - Initial trip setup automatically assigns the first user as the Organizer.

---

### 3. Configuration & Environment
All sensitive values and credentials are kept strictly in `.env` files and are never hardcoded or exposed in client bundles:
- `MONGODB_URI`: Database connection string.
- `JWT_SECRET`: Secret key for member session tokens.
- `DEFAULT_MEMBER_PASSWORD`: Default password applied to new member accounts.
- `GOOGLE_DRIVE_URL`: External media folder link.
- `VITE_GOOGLE_DRIVE_URL`: Client-side drive link for authenticated members.

---

### 4. Running the Project
```bash
# Install dependencies
bun run install:all

# Start both backend and frontend development servers
bun run dev
```
- Backend runs on `http://localhost:5001`
- Frontend runs on `http://localhost:5173`
