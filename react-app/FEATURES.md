# P.E.S. Canteen Management System — Feature Documentation

> **Tech Stack:** React.js (Vite) + Firebase (Firestore + Auth)
> **Firebase Project:** `pes-canteen`
> **Backend:** Node.js + Express on Render.com (PhonePe payment integration)

---

## Table of Contents

1. [Customer Flow](#1-customer-flow)
2. [Staff Panel](#2-staff-panel)
3. [Kitchen Display — KOT](#3-kitchen-display--kot)
4. [Pickup / Ready Screen](#4-pickup--ready-screen)
5. [Admin Dashboard](#5-admin-dashboard)
6. [Analytics](#6-analytics)
7. [Expense Manager](#7-expense-manager)
8. [Staff Management & Salary](#8-staff-management--salary)
9. [Menu Management](#9-menu-management)
10. [Staff Attendance](#10-staff-attendance)
11. [Authentication & Security](#11-authentication--security)
12. [Pages & Routes Reference](#12-pages--routes-reference)

---

## 1. Customer Flow

### Landing Page — `/`
- Displays P.E.S. logo and welcome message
- **"Open Menu" button** creates a session with a **20-minute expiry** stored in `localStorage`
- Session includes: `sessionId`, `table` number (from URL param `?table=`), `expiry` timestamp
- Redirects to `/menu?table=&session=`

### Menu Page — `/menu`
- **Session validation** on load — expired or invalid sessions redirect back to landing
- Fetches all menu items from Firestore `menu` collection in real time
- **Search bar** — filters items by name as you type
- **Category filter tabs** — All, Drinks, Food, Snacks, Chinese, Extra
- Only shows items where `available === true`
- Each card shows: item image, name, price (₹), veg/non-veg icon, **Add** button
- Clicking item image/name goes to item detail page
- **Add to Cart** stores item in `localStorage` with key `cart_{tableId}_{sessionId}`
- **Cart count badge** on bottom navigation updates live
- Bottom navigation: Menu (active) | Cart

### Item Description — `/item/:id`
- Fetches single item from Firestore by document ID
- Shows: large image, name, price, description
- **Add to Cart** button — increments quantity if already in cart
- **← Back to Menu** — goes back in history or falls back to `/menu`
- Toast notification on add

### Cart — `/cart`
- Lists all cart items with: name, unit price, quantity, line total
- **+ / −** buttons to change quantity; removing all of an item deletes it
- **Remove** button per item
- **Clear Cart** button with confirmation dialog
- Shows running **Total (₹)**
- **Place Order** button:
  - Prompts for table number if not set in session
  - Generates order code `ORD-XXXX`
  - Writes order to Firestore `orders` collection with status `pending`
  - Clears cart from localStorage
  - Redirects to Order Confirmation

### Order Confirmation — `/order-confirmation`
- Shows: ✅ Order Placed!, order code (animated pulse), QR code of the order code
- Instruction to wait and watch the **Pickup Screen** at the counter
- **Warning box** about anti-spam monitoring
- QR code generated client-side with `qrcode.react`

---

## 2. Staff Panel

**Route:** `/canteen` *(Protected — requires login)*

### Order Search & QR Scan
- **Search input** — type an order code to highlight the matching card
- **Find button** — highlights and scrolls to the order card
- **Scan button** — opens camera QR scanner (`html5-qrcode`), auto-fills the search on scan

### Live Order Board
Two-column layout updated in real time via Firestore `onSnapshot`:

| Column | Shows |
|--------|-------|
| **Pending Orders** | `status: "pending"` |
| **Accepted / Ready Orders** | `status: "accepted"` or `status: "ready"` |

### Order Card Actions
| Current Status | Available Actions |
|---------------|------------------|
| `pending` | **Accept** → sets status to `accepted` |
| `accepted` | **Complete** → sets status to `ready` |
| `ready` | **Received** → sets status to `completed` |
| Any | **Payment** (pending column only), **Delete** |

### Payment Modal
- Opens when **Payment** is clicked on a pending order
- Shows order amount
- **Cash** — records `paymentMode: "cash"` in Firestore
- **Online** — records `paymentMode: "online"`, generates a **UPI QR code** (via `api.qrserver.com`) with:
  - UPI ID: `Q099759199@ybl`
  - Amount pre-filled
  - Order code in remarks
- Close button dismisses modal

### Staff Navigation Bar
Links: Canteen Panel | Menu | Add/Edit Menu | Staff Attendance | KOT | Ready Screen

---

## 3. Kitchen Display — KOT

**Route:** `/kot` *(Protected)*

The Kitchen Order Ticket screen is designed to stay open on a dedicated kitchen display.

### Audio Enable Overlay
- On first load, a full-screen overlay appears asking staff to click **"Enable Audio & Start"**
- This is required by browsers — audio and speech synthesis need a user gesture to activate
- Once clicked, both bell sound and voice are unlocked for the entire session

### Live Order Display
- Shows all orders with `status: "accepted"`, sorted **oldest first** (left → right)
- Each card shows: Table number, Order code, Items list (name + qty × price), Total ₹, Time, Date

### Notifications for New Orders
When a new order is accepted and appears on screen:
1. **Bell sound** (`/bell.mp3`) plays immediately
2. **700ms later** — Text-to-speech reads the order aloud:
   > *"New order received. 2 Veg Burger, 1 Masala Chai"*
- Uses `SpeechSynthesisUtterance` with `lang: "en-IN"`
- Orders already announced are tracked in a `Set` to avoid repeating
- If audio wasn't enabled yet when an order arrived, speech is **queued** and played immediately after enabling

### Status indicator
- A green **"🔊 Audio & Voice Active"** badge appears below the header once enabled

---

## 4. Pickup / Ready Screen

**Route:** `/ready` *(Protected)*

- Designed to be displayed on a large screen at the counter
- Shows all orders with `status: "ready"` in real time
- Each card shows: **Order Code** (large, bold), Table number, Time
- **Bell + voice announcement** when a new order moves to ready:
  > *"Order ORD-1234 is ready for pickup!"*
- Gradient background (navy → blue) for high visibility

---

## 5. Admin Dashboard

**Route:** `/admin` *(Protected)*

### Sales Statistics Cards
Three clickable cards (clicking a card auto-applies its filter):
- **Today's Sales (₹)** — sum of completed orders today
- **This Month's Sales (₹)** — sum of completed orders this month
- **Total Sales (₹)** — all-time completed order total

Active card turns green to indicate the active filter.

### Order Filter
Dropdown with options: All | Today | This Month | Completed | Pending

### Order List
- Grid of order cards showing: Table, Items, Total, Order Code, Status, Date & Time
- Live updates via Firestore `onSnapshot`
- Shows count: *"Showing X orders"*

### Admin Navigation Bar
Links: Dashboard | Analytics | Expenses | Staff

---

## 6. Analytics

**Route:** `/analytics` *(Protected)*

Four interactive charts powered by `chart.js` + `react-chartjs-2`:

| Chart | Type | Data |
|-------|------|------|
| Daily Orders (Last 7 Days) | Bar | Count of completed orders per day |
| Revenue Trend (Last 7 Days) | Line (filled) | Revenue (₹) per day |
| Popular Items | Doughnut | Top 6 items by quantity ordered |
| Monthly Revenue (Last 6 Months) | Bar | Total revenue per month |

All charts use only `completed` orders for accuracy.

---

## 7. Expense Manager

**Route:** `/expenses` *(Protected)*

### Add Expense Form
Fields: Date (defaults to today), Description, Amount (₹)
Saves to Firestore `expenses` collection on submit.

### Summary Statistics (live)
| Stat | Source |
|------|--------|
| Today's Expense | `expenses` where date = today |
| Today's Sales | `orders` completed today |
| This Month's Expense | `expenses` this month |
| This Month's Sales | `orders` completed this month |
| Total Expense | All `expenses` |
| Total Sales | All completed `orders` |

### Expense List
Sortable table (date descending): Description | Amount | Date

---

## 8. Staff Management & Salary

**Route:** `/staff` *(Protected)*

### Add / Update Staff Form
Fields: Full Name, Role, Salary (₹), Frequency (Monthly/Weekly), Last Paid Date
- Creates or updates record in `staff` collection
- Auto-calculates **Next Salary Date** from Last Paid + frequency

### Staff Overview
- **Due within** dropdown: 3 / 7 / 30 days / All — filters which staff to highlight
- Summary cards: Total Staff | Due Soon count | Next Salary Date (earliest)
- Grid of staff cards, each showing:
  - Name, Role
  - Salary, Frequency, Last Paid, Days Left
  - **Color-coded status dot**: 🔴 ≤1 day | 🟡 ≤7 days | 🟢 more than 7 days

### Staff Card Actions
| Button | Action |
|--------|--------|
| **Mark Paid** | Updates `lastPaid` to today, calculates new `nextSalaryDate`, logs to `salaryHistory` |
| **Advance** | Prompts for amount, extends `nextSalaryDate` by equivalent days, logs to `salaryHistory` |
| **History ⯆** | Toggles per-staff salary history inline |
| **Edit** | Fills the form with staff data for updating |
| **Delete** | Removes staff record from Firestore |

### Global Salary History
- Lists all salary/advance payments across all staff, newest first
- Shows: Staff name, type (Salary/Advance), Amount, Date, Paid by (email)
- **Edit History** toggle reveals 🗑️ delete buttons per record

---

## 9. Menu Management

### Toggle Availability — `/menu-management` *(Protected)*
- Lists all menu items with a **toggle switch**
- Toggle ON (green) = item is visible to customers
- Toggle OFF (grey) = item is hidden from the menu
- **Search bar** to filter by item name
- Live updates via Firestore `onSnapshot` — changes reflect immediately on the customer menu

### Add / Edit Menu — `/add-menu` *(Protected)*
- **➕ Add New Item** button shows the form
- Dynamic form fields auto-generated from the menu schema:
  - `name` (text), `price` (number), `category` (text), `description` (text/textarea), `image` (URL), `available` (checkbox), `ty` (veg/non-veg)
- **Save** — creates new item or updates existing
- **Cancel** — clears the form
- Current menu grid below — each card has **Edit** and **Delete** buttons
- Clicking **Edit** on a card populates the form with that item's data

---

## 10. Staff Attendance

**Route:** `/staff-attendance` *(Protected)*

### Date Picker
- Defaults to today
- Changing the date reloads attendance records for that date

### Three-Column Layout
| Column | Shows |
|--------|-------|
| **Not Marked** | Staff with no attendance record for selected date |
| **Present** | Marked present |
| **Absent** | Marked absent |

### Marking Attendance
- Not Marked cards show **Present** / **Absent** buttons
- Already-marked cards show an **✏️ Edit** button to reset to "Not Marked"
- Updates Firestore `staffAttendance` collection in real time

### Staff Profile Modal
Click any staff name to open a modal showing:
- Monthly summary: **Present count** (green) | **Absent count** (red) — current month only
- **Date picker** to check status on any historical date
- Result shown as: `Status: PRESENT` / `Status: ABSENT` / `No record`

### Export CSV Report
- Click **Export CSV Report** → select From Date and To Date
- Downloads a `.csv` file containing:
  - Individual records: Staff Name, Date, Status
  - Summary section: Total Present, Total Absent per staff member
- Filename format: `Report_YYYY-MM-DD_to_YYYY-MM-DD.csv`

---

## 11. Authentication & Security

### Login — `/login`
- **Role selector**: Staff | Admin
- Email + Password authentication via Firebase Auth
- On login, fetches user's `role` from `users/{uid}` Firestore document
- **Role rules:**
  - `admin` → always goes to `/admin` (can access all protected pages)
  - `staff` selecting **Staff** → goes to `/canteen`
  - `staff` selecting **Admin** → ❌ access denied
- Error messages shown inline

### Route Protection — `AuthGuard`
- Wraps all staff and admin routes
- Checks Firebase Auth state + verifies user exists in `users` Firestore collection
- Unauthenticated users are redirected to `/login?redirect=<original-path>`
- After login, user is redirected back to the page they tried to access

### Session Management (Customer)
- 20-minute session expiry via `localStorage`
- Session key: `canteenSession` → `{ sessionId, table, expiry }`
- Cart key: `cart_{tableId}_{sessionId}` — scoped to session
- Expired sessions on `/menu` or `/cart` → auto-redirect to landing page

### Anonymous Auth (Customer)
- Customers are automatically signed in anonymously via Firebase Auth
- Enables Firestore access without requiring an account
- Anonymous UID used for session tracking

---

## 12. Pages & Routes Reference

| Route | Page | Access | Description |
|-------|------|--------|-------------|
| `/` | Landing | Public | Welcome + session creation |
| `/menu` | Menu | Public (session) | Browse and order food |
| `/item/:id` | Description | Public (session) | Item detail + add to cart |
| `/cart` | Cart | Public (session) | Review cart + place order |
| `/order-confirmation` | Order Confirmation | Public | QR code + order code |
| `/login` | Login | Public | Staff/Admin login |
| `/canteen` | Canteen Panel | Staff + Admin | Live order management |
| `/menu-management` | Menu Availability | Staff + Admin | Toggle item availability |
| `/add-menu` | Add/Edit Menu | Staff + Admin | Create/edit menu items |
| `/kot` | KOT | Staff + Admin | Kitchen order tickets + voice |
| `/ready` | Ready Screen | Staff + Admin | Pickup display screen |
| `/staff-attendance` | Staff Attendance | Staff + Admin | Mark and track attendance |
| `/admin` | Admin Dashboard | Admin | Sales stats + order history |
| `/analytics` | Analytics | Admin | Charts and trends |
| `/expenses` | Expense Manager | Admin | Track expenses vs sales |
| `/staff` | Staff Management | Admin | Salary + staff records |
| `/about` | About | Public | College and app info |
| `/terms` | Terms & Conditions | Public | Usage terms |
| `/privacy` | Privacy Policy | Public | Data privacy info |
| `/refund` | Return & Refund | Public | Refund policy |

---

## Firestore Collections Reference

| Collection | Purpose | Key Fields |
|-----------|---------|-----------|
| `menu` | Menu items | `name`, `price`, `category`, `image`, `available`, `ty` (veg/non-veg), `description` |
| `orders` | Customer orders | `orderCode`, `table`, `sessionId`, `items[]`, `status`, `date`, `time`, `paymentMode`, `totalAmount` |
| `expenses` | Expense records | `description`, `amount`, `date` |
| `staff` | Staff records | `name`, `role`, `salary`, `frequency`, `lastPaid`, `nextSalaryDate` |
| `salaryHistory` | Payment log | `staffId`, `staffName`, `amount`, `type` (salary/advance), `datePaid`, `paidBy` |
| `staffAttendance` | Daily attendance | `staffId`, `staffName`, `date`, `status` (present/absent) |
| `users` | Auth roles | `role` (admin/staff) |

---

## Order Status Flow

```
pending  →  accepted  →  ready  →  completed
   ↑            ↑           ↑
 (Customer   (Staff:     (Staff:
  places)    Accept)    Complete)
```

| Status | Visible on | Next action by |
|--------|-----------|----------------|
| `pending` | Canteen Panel (left column) | Staff → Accept |
| `accepted` | Canteen Panel (right column) + **KOT screen** | Staff → Complete |
| `ready` | Canteen Panel (right column) + **Ready Screen** | Staff → Received |
| `completed` | Admin Dashboard, Analytics, Expenses | — (final) |

---

*Developed by Mohammed Ahmed Ali | Managed by Unreal Solutions*
*P.E.S. College of Engineering, Chh. Sambhajinagar, Maharashtra 431002*
