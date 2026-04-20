import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

const ADMIN_LINKS = [
  { to: "/admin", label: "Dashboard" },
  { to: "/analytics", label: "Analytics" },
  { to: "/expenses", label: "Expenses" },
  { to: "/staff", label: "Staff" },
];

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

function getLast6Months() {
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
function formatMonth(m) {
  const [y, mo] = m.split("-");
  return new Date(y, mo - 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default function Analytics() {
  const location = useLocation();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "orders"), snap => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  // Process data
  const last7 = getLast7Days();
  const last6 = getLast6Months();

  const dailyCounts = last7.map(date =>
    orders.filter(o => o.date === date && o.status === "completed").length
  );
  const dailyRevenue = last7.map(date =>
    orders.filter(o => o.date === date && o.status === "completed")
      .reduce((s, o) => s + ((o.items || []).reduce((a, i) => a + (i.price || 0) * (i.quantity || 1), 0)), 0)
  );

  // Popular items
  const itemCounts = {};
  orders.filter(o => o.status === "completed").forEach(o => {
    (o.items || []).forEach(i => {
      itemCounts[i.name] = (itemCounts[i.name] || 0) + (i.quantity || 1);
    });
  });
  const topItems = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const monthlyRevenue = last6.map(month =>
    orders.filter(o => o.status === "completed" && o.date?.startsWith(month))
      .reduce((s, o) => s + ((o.items || []).reduce((a, i) => a + (i.price || 0) * (i.quantity || 1), 0)), 0)
  );

  const cardStyle = { background: "white", padding: 25, borderRadius: 12, boxShadow: "0 4px 6px rgba(0,0,0,0.1)" };

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#e1e3e4", color: "#334155", minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <header style={{
        display: "flex", justifyContent: "center",
        background: "#03045e", color: "white", padding: "16px 20px",
        textAlign: "center", fontSize: "2.2rem", fontWeight: 600,
        position: "sticky", top: 0, zIndex: 101, boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      }}>
        Analytics
        <div style={{ position: "fixed", top: 10, right: 10 }}>
          <button onClick={async () => { await signOut(auth); window.location.href = "/login"; }} style={{ background: "#d22c27", color: "white", border: "none", padding: "8px 16px", borderRadius: 20, cursor: "pointer", fontSize: 14, fontWeight: "bold" }}>Logout</button>
        </div>
      </header>

      <nav style={{ background: "#03045e", color: "white", boxShadow: "0 3px 8px rgba(0,0,0,0.1)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px" }}>
          <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>P.E.S. Canteen — Admin</div>
          <ul style={{ listStyle: "none", display: "flex", gap: 18 }}>
            {ADMIN_LINKS.map(({ to, label }) => (
              <li key={to}><Link to={to} style={{ color: location.pathname === to ? "#FFD166" : "white", textDecoration: "none", fontWeight: location.pathname === to ? 700 : 500, padding: "6px 10px", borderRadius: 6 }}>{label}</Link></li>
            ))}
          </ul>
        </div>
      </nav>

      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 25, maxWidth: 1400, margin: "0 auto", flex: 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 25 }}>
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0, marginBottom: 20, color: "#212529", fontSize: "1.2rem", fontWeight: 600 }}>Daily Orders (Last 7 Days)</h3>
            <Bar
              data={{ labels: last7.map(formatDate), datasets: [{ label: "Orders", data: dailyCounts, backgroundColor: "rgba(3,4,94,0.7)", borderRadius: 6 }] }}
              options={{ responsive: true, plugins: { legend: { display: false } } }}
            />
          </div>
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0, marginBottom: 20, color: "#212529", fontSize: "1.2rem", fontWeight: 600 }}>Revenue Trend (Last 7 Days)</h3>
            <Line
              data={{ labels: last7.map(formatDate), datasets: [{ label: "Revenue ₹", data: dailyRevenue, borderColor: "#46a0fa", backgroundColor: "rgba(70,160,250,0.1)", tension: 0.4, fill: true }] }}
              options={{ responsive: true }}
            />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 25 }}>
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0, marginBottom: 20, color: "#212529", fontSize: "1.2rem", fontWeight: 600 }}>Popular Items</h3>
            <Doughnut
              data={{
                labels: topItems.map(([name]) => name),
                datasets: [{ data: topItems.map(([, count]) => count), backgroundColor: ["#03045e","#46a0fa","#FFD166","#d22c27","#28a745","#f72585"] }]
              }}
              options={{ responsive: true }}
            />
          </div>
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0, marginBottom: 20, color: "#212529", fontSize: "1.2rem", fontWeight: 600 }}>Monthly Revenue (Last 6 Months)</h3>
            <Bar
              data={{ labels: last6.map(formatMonth), datasets: [{ label: "Revenue ₹", data: monthlyRevenue, backgroundColor: "rgba(70,160,250,0.7)", borderRadius: 6 }] }}
              options={{ responsive: true }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
