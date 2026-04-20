# P.E.S. Canteen Management System

A full-stack **Canteen Management Web Application** built for **P.E.S. College of Engineering**, designed to simplify day-to-day canteen operations — from order handling to staff salary management.

This project is **actively used** by the college’s canteen for real-time order tracking, billing, and staff management.

---

#  Features

#  For Staff
- Place and manage table-wise orders
- Real-time menu with availability control
- Update order status (Pending → Accepted → Completed)
- Generate and mark bills as Paid (Online / Cash)
- Automatic inventory deduction after completion

# For Admin
- Manage menu and availability
- View live analytics and expense summaries
- Add, update, and manage staff details
- Track staff salary payments and history
- Record salary advances (auto-adjusts next due date)
- Role-based login access (Admin / Staff)
- Firebase-secured authentication and access control

#  General
- Beautiful, responsive, and consistent UI across pages
- Firebase Firestore integration with real-time sync
- Protected routes with `auth-guard.js`
- Toast notifications and error handling for user feedback

---

#Tech Stack

| Category | Technologies Used |
|-----------|-------------------|
| Frontend | HTML5, CSS3, JavaScript (ES6), Responsive Design |
| Backend / Database | Firebase Firestore |
| Authentication | Firebase Authentication |
| Hosting | Firebase Hosting |
| Other | Firestore Security Rules, Real-time Updates, Role-based Access Control |

---

#  Roles

- **Admin**
  - Full access to analytics, menu, expense, and staff modules.
  - Can also log in as staff.

- **Staff**
  - Restricted access to order placement and management pages only.

Roles are assigned in the Firestore **`users`**

[Mohammed Ahmed Ali]
📧 [ahmed451ali@gmail.com]
🔗 [[LinkedIn Profile](https://www.linkedin.com/in/ahmed-ali-458a32193/)]
🌐 [[GitHub Profile](https://github.com/Ahmed-451)]


