import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";

const ADMIN_LINKS = [
  { to: "/admin", label: "Dashboard" },
  { to: "/analytics", label: "Analytics" },
  { to: "/expenses", label: "Expenses" },
  { to: "/staff", label: "Staff" },
];

function normalizeDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().split("T")[0];
}

export default function AdminDashboard() {
  const location = useLocation();
  const [allOrders, setAllOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  const [activeBox, setActiveBox] = useState(null);
  const [navOpen, setNavOpen] = useState(false);
  const unsubRef = useRef(null);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("timestamp", "desc"));
    unsubRef.current = onSnapshot(q, snap => {
      setAllOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => console.error(err));
    return () => unsubRef.current?.();
  }, []);

  const todayDate = new Date().toISOString().split("T")[0];
  const currentMonth = todayDate.slice(0, 7);

  let todaySales = 0, monthSales = 0, totalSales = 0;
  allOrders.forEach(order => {
    const orderDate = normalizeDate(order.date);
    const origTotal = (order.items || []).reduce((s, i) => s + ((i.price || 0) * (i.quantity || 1)), 0);
    const total = order.totalAmount || origTotal;
    if (order.status === "completed") {
      totalSales += total;
      if (orderDate.startsWith(currentMonth)) monthSales += total;
      if (orderDate === todayDate) todaySales += total;
    }
  });

  const filteredOrders = allOrders.filter(order => {
    const orderDate = normalizeDate(order.date);
    if (filter === "today" && orderDate !== todayDate) return false;
    if (filter === "month" && !orderDate.startsWith(currentMonth)) return false;
    if (filter === "completed" && order.status !== "completed") return false;
    if (filter === "pending" && !["pending", "accepted"].includes(order.status)) return false;
    return true;
  });

  const handleStatClick = (box, f) => {
    setActiveBox(box);
    setFilter(f);
  };

  return (
    <div style={{ background: "#F7FFF7", color: "#2b2c2d", minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <header style={{
        display: "flex", justifyContent: "center",
        background: "#03045e", color: "white", padding: "16px 20px",
        textAlign: "center", fontSize: "2.2rem", fontWeight: 600,
        position: "sticky", top: 0, zIndex: 100, boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      }}>
        Admin Dashboard
        <div style={{ position: "fixed", top: 10, right: 10 }}>
          <button
            onClick={async () => { await signOut(auth); window.location.href = "/login"; }}
            style={{ background: "#d22c27", color: "white", border: "none", padding: "8px 16px", borderRadius: 20, cursor: "pointer", fontSize: 14, fontWeight: "bold" }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Nav */}
      <nav style={{ background: "#03045e", color: "white", boxShadow: "0 3px 8px rgba(0,0,0,0.1)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px" }}>
          <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>P.E.S. Canteen — Admin</div>
          <button onClick={() => setNavOpen(o => !o)} style={{ fontSize: "1.4rem", background: "none", border: "none", color: "white", cursor: "pointer" }}>☰</button>
          <ul style={{ listStyle: "none", display: "flex", gap: 18 }}>
            {ADMIN_LINKS.map(({ to, label }) => (
              <li key={to}>
                <Link to={to} style={{ color: location.pathname === to ? "#FFD166" : "white", textDecoration: "none", fontWeight: location.pathname === to ? 700 : 500, padding: "6px 10px", borderRadius: 6 }}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <main style={{ padding: 16, width: "100%", maxWidth: 1100, margin: "0 auto", flex: 1 }}>
        {/* Stats */}
        <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
          {[
            { id: "today", label: `Today's Sales: ₹${todaySales}`, filter: "today" },
            { id: "month", label: `This Month's Sales: ₹${monthSales}`, filter: "month" },
            { id: "total", label: `Total Sales: ₹${totalSales}`, filter: "all" },
          ].map(box => (
            <div
              key={box.id}
              onClick={() => handleStatClick(box.id, box.filter)}
              style={{
                flex: "1 1 200px", background: activeBox === box.id ? "#28a745" : "white",
                borderRadius: 12, boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                padding: "14px 16px", fontWeight: 700,
                color: activeBox === box.id ? "white" : "#03045e",
                cursor: "pointer", textAlign: "center", fontSize: "1rem", minWidth: 180,
                transition: "all 0.3s ease",
              }}
            >
              {box.label}
            </div>
          ))}
        </div>

        {/* Filter */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12, alignItems: "center" }}>
          <label style={{ fontWeight: 600, fontSize: "0.95rem", marginRight: 6 }}>Filter Orders:</label>
          <select
            value={filter}
            onChange={e => { setFilter(e.target.value); setActiveBox(null); }}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", background: "white", fontSize: "0.9rem" }}
          >
            <option value="all">All</option>
            <option value="today">Today</option>
            <option value="month">This Month</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        <div style={{ marginBottom: 16, fontWeight: 600, textAlign: "center" }}>
          Showing {filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {filteredOrders.length === 0 ? (
            <p>No orders found.</p>
          ) : filteredOrders.map(order => {
            const origTotal = (order.items || []).reduce((s, i) => s + ((i.price || 0) * (i.quantity || 1)), 0);
            const total = order.totalAmount || origTotal;
            return (
              <div key={order.id} style={{
                background: "white", borderRadius: 12,
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)", padding: 16,
                display: "flex", flexDirection: "column", gap: 8,
              }}>
                <p><strong style={{ color: "#03045e" }}>Table:</strong> {order.table || "-"}</p>
                <p><strong style={{ color: "#03045e" }}>Items:</strong> {(order.items || []).map(i => `${i.name} x ${i.quantity || 1}`).join(", ")}</p>
                <p><strong style={{ color: "#03045e" }}>Total:</strong> ₹{total}</p>
                <p><strong style={{ color: "#03045e" }}>Order Code:</strong> {order.orderCode}</p>
                <p><strong style={{ color: "#03045e" }}>Status:</strong> {order.status}</p>
                <p><strong style={{ color: "#03045e" }}>Date:</strong> {order.date || "-"} <strong style={{ color: "#03045e" }}>Time:</strong> {order.time || "-"}</p>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
