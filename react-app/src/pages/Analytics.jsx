import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import AdminNav from "../components/AdminNav";

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
);

const ADMIN_LINKS = [
  { to: "/admin",     label: "Dashboard" },
  { to: "/analytics", label: "Analytics" },
  { to: "/expenses",  label: "Expenses" },
  { to: "/staff",     label: "Staff" },
];

const PALETTE = ["#03045e","#0077b6","#00b4d8","#FFD166","#ef233c","#7209b7","#3a86ff","#06d6a0"];

function last7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });
}
function last6Months() {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
}
function fmtDay(d) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}
function fmtMonth(m) {
  const [y, mo] = m.split("-");
  return new Date(y, mo - 1).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

// Shared chart options base
const BASE_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 800, easing: "easeInOutQuart" },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#03045e",
      titleColor: "#FFD166",
      bodyColor: "#e0e0e0",
      padding: 12,
      cornerRadius: 8,
      displayColors: false,
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: "#64748b", font: { size: 11 } },
    },
    y: {
      grid: { color: "rgba(0,0,0,.06)", lineWidth: 1 },
      ticks: { color: "#64748b", font: { size: 11 } },
      border: { display: false },
    },
  },
};

const DOUGHNUT_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 800 },
  plugins: {
    legend: {
      display: true,
      position: "bottom",
      labels: { color: "#334155", font: { size: 12 }, padding: 14, boxWidth: 14 },
    },
    tooltip: {
      backgroundColor: "#03045e",
      titleColor: "#FFD166",
      bodyColor: "#e0e0e0",
      padding: 12,
      cornerRadius: 8,
    },
  },
  cutout: "62%",
};

export default function Analytics() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "orders"), snap => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const completed = orders.filter(o => o.status === "completed");
  const days   = last7Days();
  const months = last6Months();

  const orderTotal = o =>
    o.totalAmount || (o.items || []).reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0);

  const dailyRevenue = days.map(d =>
    completed.filter(o => o.date === d).reduce((s, o) => s + orderTotal(o), 0)
  );
  const dailyOrders = days.map(d =>
    completed.filter(o => o.date === d).length
  );
  const monthlyRevenue = months.map(m =>
    completed.filter(o => o.date?.startsWith(m)).reduce((s, o) => s + orderTotal(o), 0)
  );

  // Popular items
  const itemMap = {};
  completed.forEach(o =>
    (o.items || []).forEach(i => { itemMap[i.name] = (itemMap[i.name] || 0) + (i.quantity || 1); })
  );
  const topItems = Object.entries(itemMap).sort((a, b) => b[1] - a[1]).slice(0, 7);

  // KPI summary
  const totalRevenue  = completed.reduce((s, o) => s + orderTotal(o), 0);
  const todayDate     = new Date().toISOString().split("T")[0];
  const todayRevenue  = completed.filter(o => o.date === todayDate).reduce((s, o) => s + orderTotal(o), 0);
  const avgOrderVal   = completed.length ? Math.round(totalRevenue / completed.length) : 0;
  const bestDayIdx    = dailyRevenue.indexOf(Math.max(...dailyRevenue));

  const kpis = [
    { label: "Total Revenue",    value: `₹${totalRevenue.toLocaleString("en-IN")}`, icon: "💰" },
    { label: "Today's Revenue",  value: `₹${todayRevenue.toLocaleString("en-IN")}`, icon: "📅" },
    { label: "Total Orders",     value: completed.length,                              icon: "🧾" },
    { label: "Avg Order Value",  value: `₹${avgOrderVal}`,                            icon: "📊" },
    { label: "Best Day (7d)",    value: dailyRevenue[bestDayIdx] > 0 ? fmtDay(days[bestDayIdx]) : "—", icon: "🏆" },
  ];

  // Chart datasets
  const barRevData = {
    labels: days.map(fmtDay),
    datasets: [{
      label: "Revenue ₹",
      data: dailyRevenue,
      backgroundColor: days.map((_, i) => i === bestDayIdx ? "#FFD166" : "#0077b6"),
      borderRadius: 8,
      borderSkipped: false,
    }],
  };

  const lineData = {
    labels: days.map(fmtDay),
    datasets: [{
      label: "Orders",
      data: dailyOrders,
      borderColor: "#0077b6",
      backgroundColor: "rgba(0,119,182,.12)",
      pointBackgroundColor: "#0077b6",
      pointBorderColor: "#fff",
      pointBorderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 7,
      tension: 0.45,
      fill: true,
      borderWidth: 2.5,
    }],
  };

  const doughnutData = {
    labels: topItems.map(([n]) => n),
    datasets: [{
      data: topItems.map(([, c]) => c),
      backgroundColor: PALETTE.slice(0, topItems.length),
      borderWidth: 2,
      borderColor: "#fff",
      hoverOffset: 10,
    }],
  };

  const barMonthData = {
    labels: months.map(fmtMonth),
    datasets: [{
      label: "Revenue ₹",
      data: monthlyRevenue,
      backgroundColor: monthlyRevenue.map((v, i) =>
        v === Math.max(...monthlyRevenue) ? "#FFD166" : `rgba(0,180,216,${0.55 + i * 0.07})`
      ),
      borderRadius: 8,
      borderSkipped: false,
    }],
  };

  const barOpts = {
    ...BASE_OPTS,
    plugins: {
      ...BASE_OPTS.plugins,
      tooltip: {
        ...BASE_OPTS.plugins.tooltip,
        callbacks: { label: ctx => ` ₹${ctx.parsed.y.toLocaleString("en-IN")}` },
      },
    },
  };
  const lineOpts = { ...BASE_OPTS, plugins: { ...BASE_OPTS.plugins, legend: { display: false } } };

  return (
    <>
      <style>{`
        .an-page { background:#f1f5f9; color:#334155; min-height:100dvh; display:flex; flex-direction:column; }
        .an-header { background:#03045e; color:#fff; padding:16px 20px; text-align:center; font-size:1.8rem; font-weight:700; box-shadow:0 4px 6px rgba(0,0,0,.1); }
        .an-body { padding:20px 16px; max-width:1300px; margin:0 auto; width:100%; flex:1; display:flex; flex-direction:column; gap:20px; }
        .an-kpis { display:grid; grid-template-columns:repeat(5,1fr); gap:12px; }
        .an-kpi { background:#fff; border-radius:14px; padding:16px 12px; text-align:center; box-shadow:0 2px 8px rgba(0,0,0,.07); }
        .an-kpi-icon { font-size:1.6rem; margin-bottom:6px; }
        .an-kpi-val { font-size:1.25rem; font-weight:800; color:#03045e; margin-bottom:2px; }
        .an-kpi-label { font-size:1rem; color:#64748b; font-weight:500; }
        .an-charts { display:grid; grid-template-columns:repeat(2,1fr); gap:20px; }
        .an-card { background:#fff; border-radius:16px; padding:22px 20px; box-shadow:0 2px 10px rgba(0,0,0,.07); display:flex; flex-direction:column; }
        .an-card-title { font-size:1rem; font-weight:700; color:#1e293b; margin-bottom:4px; }
        .an-card-sub { font-size:.8rem; color:#94a3b8; margin-bottom:16px; }
        .an-chart-wrap { flex:1; min-height:220px; }
        @media (max-width:900px) {
          .an-kpis { grid-template-columns:repeat(3,1fr); }
          .an-charts { grid-template-columns:1fr; }
        }
        @media (max-width:560px) {
          .an-kpis { grid-template-columns:repeat(2,1fr); }
          .an-header { font-size:1.3rem; }
          .an-card { padding:16px 14px; }
        }
      `}</style>

      <div className="an-page">
        <header className="an-header">Analytics</header>
        <AdminNav links={ADMIN_LINKS} />

        <div className="an-body">
          {/* KPI row */}
          <div className="an-kpis">
            {kpis.map(k => (
              <div key={k.label} className="an-kpi">
                <div className="an-kpi-icon"></div>
                <div className="an-kpi-val">{k.value}</div>
                <div className="an-kpi-label">{k.label}</div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="an-charts">
            <div className="an-card">
              <div className="an-card-title">Daily Revenue</div>
              <div className="an-card-sub">Last 7 days — gold bar = best day</div>
              <div className="an-chart-wrap">
                <Bar data={barRevData} options={barOpts} />
              </div>
            </div>

            <div className="an-card">
              <div className="an-card-title">Order Volume</div>
              <div className="an-card-sub">Completed orders per day (last 7 days)</div>
              <div className="an-chart-wrap">
                <Line data={lineData} options={lineOpts} />
              </div>
            </div>

            <div className="an-card">
              <div className="an-card-title">Popular Items</div>
              <div className="an-card-sub">Top 7 by quantity sold</div>
              <div className="an-chart-wrap" style={{ minHeight: 260 }}>
                {topItems.length > 0
                  ? <Doughnut data={doughnutData} options={DOUGHNUT_OPTS} />
                  : <p style={{ color: "#94a3b8", textAlign: "center", paddingTop: 80 }}>No data yet</p>
                }
              </div>
            </div>

            <div className="an-card">
              <div className="an-card-title">Monthly Revenue</div>
              <div className="an-card-sub">Last 6 months — gold bar = best month</div>
              <div className="an-chart-wrap">
                <Bar data={barMonthData} options={barOpts} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
