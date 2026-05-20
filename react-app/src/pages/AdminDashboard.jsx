import { useState, useEffect, useRef } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import AdminNav from "../components/AdminNav";

const ADMIN_LINKS = [
  { to: "/admin",      label: "Dashboard" },
  { to: "/analytics",  label: "Analytics" },
  { to: "/expenses",   label: "Expenses" },
  { to: "/staff",      label: "Staff" },
];

function normalizeDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().split("T")[0];
}

export default function AdminDashboard() {
  const [allOrders, setAllOrders] = useState([]);
  const [filter, setFilter]       = useState("all");
  const [activeBox, setActiveBox] = useState(null);
  const unsubRef = useRef(null);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("timestamp", "desc"));
    unsubRef.current = onSnapshot(q, snap => {
      setAllOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => console.error(err));
    return () => unsubRef.current?.();
  }, []);

  const todayDate    = new Date().toISOString().split("T")[0];
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
    if (filter === "today"     && orderDate !== todayDate)                         return false;
    if (filter === "month"     && !orderDate.startsWith(currentMonth))             return false;
    if (filter === "completed" && order.status !== "completed")                    return false;
    if (filter === "pending"   && !["pending","accepted"].includes(order.status))  return false;
    return true;
  });

  const statCards = [
    { id: "today", label: "Today's Sales",      value: `₹${todaySales}`,  f: "today" },
    { id: "month", label: "This Month's Sales", value: `₹${monthSales}`,  f: "month" },
    { id: "total", label: "Total Sales",        value: `₹${totalSales}`,  f: "all"   },
  ];

  return (
    <>
      <style>{`
        .adm-page { background:#F7FFF7; color:#2b2c2d; min-height:100dvh; display:flex; flex-direction:column; }
        .adm-header { background:#03045e; color:#fff; padding:16px 20px; text-align:center; font-size:1.8rem; font-weight:700; box-shadow:0 4px 6px rgba(0,0,0,.1); }
        .adm-main { padding:16px; width:100%; max-width:1100px; margin:0 auto; flex:1; }
        .adm-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:18px; }
        .adm-stat { border-radius:12px; box-shadow:0 4px 10px rgba(0,0,0,.08); padding:16px; font-weight:700; cursor:pointer; text-align:center; transition:all .25s; }
        .adm-stat:hover { transform:translateY(-2px); box-shadow:0 6px 16px rgba(0,0,0,.13); }
        .adm-filter { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:14px; align-items:center; }
        .adm-filter select { padding:8px 12px; border-radius:8px; border:1px solid #ddd; background:#fff; font-size:.9rem; }
        .adm-count { margin-bottom:14px; font-weight:600; text-align:center; color:#555; }
        .adm-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:16px; }
        .adm-card { background:#fff; border-radius:12px; box-shadow:0 4px 8px rgba(0,0,0,.08); padding:16px; display:flex; flex-direction:column; gap:6px; }
        .adm-card p { margin:0; font-size:.93rem; }
        .adm-badge { display:inline-block; padding:2px 10px; border-radius:20px; font-size:.8rem; font-weight:700; }
        @media (max-width:600px) {
          .adm-stats { grid-template-columns:1fr; }
          .adm-header { font-size:1.4rem; padding:14px; }
        }
      `}</style>

      <div className="adm-page">
        <header className="adm-header">Admin Dashboard</header>
        <AdminNav links={ADMIN_LINKS} />

        <main className="adm-main">
          {/* Stat cards */}
          <div className="adm-stats">
            {statCards.map(s => (
              <div
                key={s.id}
                className="adm-stat"
                onClick={() => { setActiveBox(s.id); setFilter(s.f); }}
                style={{
                  background: activeBox === s.id ? "#03045e" : "#fff",
                  color:      activeBox === s.id ? "#FFD166"  : "#03045e",
                }}
              >
                <div style={{ fontSize: "1.5rem", marginBottom: 4 }}>{s.value}</div>
                <div style={{ fontSize: ".85rem", fontWeight: 500, opacity: .85 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Filter */}
          <div className="adm-filter">
            <label style={{ fontWeight: 600 }}>Filter Orders:</label>
            <select value={filter} onChange={e => { setFilter(e.target.value); setActiveBox(null); }}>
              <option value="all">All</option>
              <option value="today">Today</option>
              <option value="month">This Month</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="adm-count">Showing {filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""}</div>

          <div className="adm-grid">
            {filteredOrders.length === 0 ? (
              <p style={{ color: "#888" }}>No orders found.</p>
            ) : filteredOrders.map(order => {
              const origTotal = (order.items || []).reduce((s, i) => s + ((i.price || 0) * (i.quantity || 1)), 0);
              const total = order.totalAmount || origTotal;
              const statusColour = {
                pending:   { bg: "#fff3cd", color: "#856404" },
                accepted:  { bg: "#cce5ff", color: "#004085" },
                ready:     { bg: "#d4edda", color: "#155724" },
                completed: { bg: "#d4edda", color: "#155724" },
              }[order.status] || { bg: "#eee", color: "#333" };

              return (
                <div key={order.id} className="adm-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ color: "#03045e", fontSize: "1rem" }}>{order.orderCode || "-"}</strong>
                    <span className="adm-badge" style={{ background: statusColour.bg, color: statusColour.color }}>
                      {order.status}
                    </span>
                  </div>
                  <p><strong style={{ color: "#03045e" }}>Table:</strong> {order.table || "-"}</p>
                  <p><strong style={{ color: "#03045e" }}>Items:</strong> {(order.items || []).map(i => `${i.name} x${i.quantity || 1}`).join(", ")}</p>
                  <p><strong style={{ color: "#03045e" }}>Total:</strong> ₹{total}</p>
                  <p style={{ color: "#888", fontSize: ".85rem" }}>{order.date || "-"} &nbsp;{order.time || ""}</p>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </>
  );
}
