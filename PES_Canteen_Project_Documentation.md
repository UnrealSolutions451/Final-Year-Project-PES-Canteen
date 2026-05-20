# P.E.S. Canteen — Project Documentation

**Project Title:** P.E.S. Canteen — Smart Digital Canteen Management System  
**Tech Stack:** React.js (Vite) · Firebase Firestore · Firebase Authentication · React Router v6 · Chart.js

---

## 1. Project Overview

P.E.S. Canteen is a full-stack web application that digitizes and automates the entire canteen workflow — from a customer placing an order by scanning a QR code at their table, to the kitchen receiving it in real time, to the admin tracking revenue and managing staff. It eliminates manual order-taking, reduces billing errors, and gives the canteen owner live business insights.

---

## 2. System Architecture

```
Customer (Browser / Phone)
        ↓  scans table QR code
    Landing Page → Menu → Cart → Order Placed
                                      ↓
                              Firebase Firestore
                                      ↓
    Staff Panel ←──── real-time listener ────→ KOT (Kitchen)
         ↓                                         ↓
    Payment / Billing                     Ready Screen (Pickup Display)
         ↓
    Admin Dashboard → Analytics / Expenses / Staff Management
```

**Database (Firebase Firestore) Collections:**

| Collection | Purpose |
|---|---|
| `orders` | All customer orders with status lifecycle |
| `menu` | Menu items (name, price, category, availability) |
| `users` | Staff/admin accounts with role field |
| `staff` | Staff profiles, salary, frequency |
| `staffAttendance` | Daily attendance records |
| `salaryHistory` | Salary and advance payment logs |
| `expenses` | Expense entries logged by admin |

---

## 3. User Roles

| Role | Access |
|---|---|
| **Customer** | Landing, Menu, Item Description, Cart, Order Confirmation |
| **Staff** | Canteen Panel, Menu Management, Add/Edit Menu, Staff Attendance, KOT, Ready Screen |
| **Admin** | All staff pages + Admin Dashboard, Analytics, Expenses, Staff Management |

Authentication is handled via **Firebase Auth**. Protected routes use an `AuthGuard` component that checks the user's role in Firestore before granting access. Customers are automatically signed in **anonymously** (no login required).

---

## 4. Modules & Functionality

---

### Module 1 — Customer Ordering Flow

#### 4.1 Landing Page (`/`)
- Displays the P.E.S. Canteen logo and a prominent "Open Menu" button.
- When a customer scans the **table QR code**, the URL carries a `?table=T1` parameter.
- On click, a **unique session ID** is generated with a **20-minute expiry** and stored in `localStorage`.
- Prevents direct URL access to the menu without a valid session (redirects back to landing if session is expired or missing).

#### 4.2 Menu Page (`/menu`)
- Fetches all menu items from Firestore `menu` collection in real time.
- Displays only **available** items (`available === true`).
- **Category filter tabs:** All, Drinks, Food, Snacks, Chinese, Extra.
- **Live search bar** filters items by name as you type.
- **Veg / Non-Veg icons** shown on each item card.
- "Add to Cart" button stores item in `localStorage` with a cart key tied to the table and session ID.
- Cart badge in the header updates instantly showing item count.

#### 4.3 Item Description Page (`/item/:id`)
- Shows full details of a selected item — name, price, category, description, image.
- "Add to Cart" button with quantity selector.
- Back button returns to the menu, preserving table and session parameters.

#### 4.4 Cart Page (`/cart`)
- Lists all items in the cart with quantity controls (`+` / `−` / Remove).
- Calculates and displays the running total.
- Session validation — expired sessions are redirected to landing.
- **Place Order** creates a document in Firestore `orders` collection with:
  - Table number, session ID, item list, total amount, order code (e.g. `ORD-4827`), date, time, status `"pending"`.
- Cart is cleared from `localStorage` after successful order placement.

#### 4.5 Order Confirmation Page (`/order-confirmation`)
- Confirms order placement with a success animation.
- Displays the unique **Order Code** prominently.
- Generates a **QR code** (using `qrcode.react`) of the order code for scanning at the billing counter.
- Instructs customer to watch the **Pickup Screen** for their code.

---

### Module 2 — Staff Operations

All staff pages are protected by `AuthGuard` (login required, role verified against Firestore).

#### 4.6 Canteen Panel (`/canteen`)
- **Real-time order feed** via Firestore `onSnapshot` listener — no refresh needed.
- Two columns: **Pending Orders** (left) | **Accepted / Ready Orders** (right).
- Each order card shows: order code, table number, items, total, status badge (colour-coded).
- **Order status workflow:**
  - `pending` → Accept → `accepted`
  - `accepted` → Complete → `ready`
  - `ready` → Received → `completed`
- **Payment modal** on each order:
  - **Cash** — logs `paymentMode: "cash"` to Firestore.
  - **Online (UPI)** — generates a UPI deep-link QR code on screen for the customer to scan and pay.
- **Search by order code** — highlights the matching order card and scrolls to it.
- **QR Scanner** — opens camera to scan the customer's order QR code and auto-highlight the order.
- **Delete order** with confirmation dialog.
- **Responsive navigation** — collapses to a hamburger menu on mobile.

#### 4.7 Menu Management (`/menu-management`)
- Lists all menu items fetched from Firestore.
- **Search bar** to filter items by name.
- **Toggle availability** — one click switches an item between available/unavailable. Updates Firestore instantly.
- Unavailable items are greyed out and excluded from the customer menu automatically.

#### 4.8 Add / Edit Menu (`/add-menu`)
- Full CRUD interface for menu items.
- **Add new item** — form with name, price, category, description, image URL, veg/non-veg flag.
- **Edit existing item** — pre-fills the form with current data, updates Firestore on save.
- **Delete item** — removes the document from Firestore permanently.

#### 4.9 KOT — Kitchen Order Ticket (`/kot`)
- **Kitchen-facing real-time display** showing all orders with status `"accepted"`.
- Sorted chronologically (oldest first) so kitchen processes in FIFO order.
- Each card shows: table number, order code, item list with quantities and prices, total, time.
- **Bell sound** (`bell.mp3`) plays on every new order (requires one-click audio unlock per browser security rules).
- **Voice announcements** (Web Speech API) read out new orders aloud — e.g. *"New order received. 2 Samosa, 1 Chai"*.
- Audio enable overlay on page load with a single unlock button — once clicked, all queued announcements play automatically.
- Audio status indicator shown in header.

#### 4.10 Ready Screen (`/ready`)
- **Customer-facing pickup display** (meant to be shown on a TV or counter screen).
- Shows all orders with status `"ready"` in large, bold text.
- Plays bell sound and announces *"Order ORD-4827 is ready for pickup!"* for each new entry.
- Auto-updates in real time as kitchen marks orders ready.

#### 4.11 Staff Attendance (`/staff-attendance`)
- Lists all staff from Firestore `staff` collection.
- Staff supervisor can select any date and mark each staff member as **Present**, **Absent**, or **Leave**.
- Attendance records are stored per-staff per-date in `staffAttendance` collection.
- **Staff profile modal** — click any staff member to view their attendance stats (total present, absent, leave counts).
- **Date-specific history** — view attendance for any specific date from the profile modal.
- **Export modal** — set a date range to export attendance data.

---

### Module 3 — Admin Panel

All admin pages require admin role verified through Firebase Auth + Firestore.

#### 4.12 Admin Dashboard (`/admin`)
- **Sales statistics cards** (clickable):
  - Today's Sales (₹)
  - This Month's Sales (₹)
  - Total Sales (₹) — counts only `completed` orders
- Clicking a stat card filters the order list below to that time range.
- **Filter dropdown** — All / Today / This Month / Completed / Pending.
- Full paginated order list showing: table, items, total, order code, status, date, time.
- Real-time updates via Firestore `onSnapshot`.

#### 4.13 Analytics (`/analytics`)
- Visual business intelligence powered by **Chart.js**.
- **Bar Chart** — Revenue for the last 7 days.
- **Line Chart** — Revenue trend over the last 6 months.
- **Doughnut Chart** — Top selling items by quantity.
- All charts are computed from live Firestore `orders` data on page load.
- Helps the owner identify peak days, slow periods, and popular items.

#### 4.14 Expense Manager (`/expenses`)
- Log business expenses (name, amount, category, date, notes).
- **Stats panel:**
  - Total expenses today / this month / all time.
  - Revenue for same periods (from completed orders).
  - Net profit = Revenue − Expenses.
- Chronological list of all expense entries.
- Add and view all expenses directly from Firestore `expenses` collection.

#### 4.15 Staff Management (`/staff`)
- **Add / Update Staff** form — name, role, salary (₹), pay frequency (monthly/weekly), last paid date.
- **Staff Overview cards** — each card shows salary, frequency, last paid, days until next salary due (colour-coded: red ≤1 day, yellow ≤7 days, green otherwise).
- **Due Soon filter** — show staff due within 3 / 7 / 30 days.
- **Mark Salary Paid** — updates `lastPaid` and `nextSalaryDate` in Firestore, logs entry to `salaryHistory`.
- **Record Advance** — enter advance amount, automatically extends next salary date by equivalent days, logs to `salaryHistory`.
- **Per-staff salary history** — expandable history panel per card showing all salary and advance payments.
- **Global Salary History** table with edit mode to delete individual records.
- **Delete Staff** — removes staff document from Firestore.

---

### Module 4 — Static / Legal Pages

| Route | Content |
|---|---|
| `/about` | About the canteen and development team |
| `/terms` | Terms & Conditions |
| `/privacy` | Privacy Policy |
| `/refund` | Return & Refund Policy |

All accessible from the footer on the landing, menu, and cart pages.

---

## 5. Key Technical Features

| Feature | How It Works |
|---|---|
| **Real-time updates** | Firestore `onSnapshot` listeners — all panels update live without refresh |
| **Session-based ordering** | UUID session stored in `localStorage` with 20-min expiry prevents order fraud |
| **Role-based auth** | Firebase Auth UID mapped to Firestore `users` doc with `role` field; `AuthGuard` enforces it |
| **Anonymous sign-in** | Customers get Firebase anonymous auth automatically — no sign-up needed |
| **QR code generation** | `qrcode.react` generates scannable QR for every order code |
| **QR code scanning** | `html5-qrcode` npm library accesses camera to scan order QRs at canteen panel |
| **UPI payment QR** | Dynamic UPI deep-link (`upi://pay?pa=...`) encoded as QR image for instant payments |
| **Voice announcements** | Web Speech API (`SpeechSynthesisUtterance`) reads orders in Indian English |.
| **Bell notifications** | HTML5 `Audio` API plays bell on new KOT/Ready screen entries |
| **Analytics charts** | `react-chartjs-2` wrapping Chart.js — Bar, Line, Doughnut charts from Firestore data |
| **Responsive design** | Inline styles + CSS media queries; staff nav collapses to hamburger on mobile |

---

## 6. Technology Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 18 (Vite build tool) |
| Routing | React Router DOM v6 |
| Backend / Database | Firebase Firestore (NoSQL, real-time) |
| Authentication | Firebase Auth (email/password + anonymous) |
| Charts | Chart.js 4 + react-chartjs-2 |
| QR Code Generator | qrcode.react |
| QR Code Scanner | html5-qrcode |
| Hosting (optional) | Firebase Hosting |
| Language | JavaScript (JSX) — no TypeScript |

---

## 7. Order Lifecycle Summary

```
Customer places order
        ↓
    status: "pending"   ← visible in Canteen Panel (left column)
        ↓ Staff clicks Accept
    status: "accepted"  ← visible in KOT (kitchen), Canteen Panel (right column)
        ↓ Staff clicks Complete
    status: "ready"     ← visible in Ready Screen (pickup display)
        ↓ Staff clicks Received (after payment)
    status: "completed" ← counted in Admin Dashboard sales figures
```

---

## 8. Security & Access Control

- All Firestore write operations from the staff/admin panels require the user to be authenticated.
- The `AuthGuard` component fetches the user's document from Firestore on every protected route access — if the document doesn't exist, the user is redirected to `/login`.
- Customer-facing pages (Menu, Cart, Order Confirmation) are public but use session validation to prevent order injection without a valid table scan.
- Anonymous Firebase users can only write to the `orders` collection (enforced by Firestore Security Rules on the Firebase side).

---

## 9. Project Folder Structure

```
react-app/
├── public/
│   ├── Pes_logo.png        ← favicon and header logo
│   └── bell.mp3            ← notification sound
├── src/
│   ├── firebase.js         ← Firebase init (Firestore + Auth)
│   ├── App.jsx             ← All routes defined here
│   ├── components/
│   │   ├── AuthGuard.jsx   ← Role-based route protection
│   │   ├── AdminNav.jsx    ← Shared admin navigation bar
│   │   ├── SiteFooter.jsx  ← Shared footer component
│   │   └── Toast.jsx       ← Toast notification utility
│   ├── contexts/
│   │   └── AuthContext.jsx ← Auth state provider
│   └── pages/              ← One file per route (20 pages total)
```

---

*Documentation prepared for P.E.S. Canteen Final Year Project — 2025*
