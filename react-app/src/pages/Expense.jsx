import { useState, useEffect } from "react";
import { collection, addDoc, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import AdminNav from "../components/AdminNav";

const ADMIN_LINKS = [
  { to: "/admin",     label: "Dashboard" },
  { to: "/analytics", label: "Analytics" },
  { to: "/expenses",  label: "Expenses" },
  { to: "/staff",     label: "Staff" },
];

const todayDate = new Date().toISOString().split("T")[0];

function normalizeDate(d) { if (!d) return ""; return new Date(d).toISOString().split("T")[0]; }

export default function Expense() {
  const [date, setDate] = useState(todayDate);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState({ todayExp: 0, monthExp: 0, totalExp: 0, todaySales: 0, monthSales: 0, totalSales: 0 });

  useEffect(() => {
    const expQ = query(collection(db, "expenses"), orderBy("date", "desc"));
    const unsub1 = onSnapshot(expQ, snap => {
      const exps = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setExpenses(exps);
      const currentMonth = todayDate.slice(0, 7);
      let todayExp = 0, monthExp = 0, totalExp = 0;
      exps.forEach(exp => {
        totalExp += exp.amount;
        if (exp.date === todayDate) todayExp += exp.amount;
        if (exp.date?.startsWith(currentMonth)) monthExp += exp.amount;
      });
      setStats(s => ({ ...s, todayExp, monthExp, totalExp }));
    });

    const salesQ = query(collection(db, "orders"), orderBy("timestamp", "desc"));
    const unsub2 = onSnapshot(salesQ, snap => {
      const currentMonth = todayDate.slice(0, 7);
      let todaySales = 0, monthSales = 0, totalSales = 0;
      snap.docs.forEach(d => {
        const o = d.data();
        const orderDate = normalizeDate(o.date);
        const origTotal = (o.items || []).reduce((s, i) => s + ((i.price || 0) * (i.quantity || 1)), 0);
        const total = o.totalAmount || origTotal;
        if (o.status === "completed") {
          totalSales += total;
          if (orderDate.startsWith(currentMonth)) monthSales += total;
          if (orderDate === todayDate) todaySales += total;
        }
      });
      setStats(s => ({ ...s, todaySales, monthSales, totalSales }));
    });

    return () => { unsub1(); unsub2(); };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!description || !amount) return;
    await addDoc(collection(db, "expenses"), { description, amount: parseFloat(amount), date: date || todayDate });
    setDescription("");
    setAmount("");
    setDate(todayDate);
  }

  const inputStyle = { padding: "8px 12px", border: "1px solid #ccc", borderRadius: 8, marginBottom: 10, width: "100%", fontSize: "1rem" };
  const cardStyle = { background: "white", borderRadius: 12, boxShadow: "0 4px 6px rgba(0,0,0,0.1)", padding: 35, marginBottom: 20 };

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", background: "#f4f6f8", margin: 0, color: "#333" }}>
      <header style={{ background: "#03045e", color: "white", padding: 16, textAlign: "center", fontSize: "1.5rem", fontWeight: 700, boxShadow: "0 4px 6px rgba(0,0,0,.1)" }}>
        Expense Manager
      </header>
      <AdminNav links={ADMIN_LINKS} />

      <main style={{ padding: 20, maxWidth: 1000, margin: "auto" }}>
        {/* Form */}
        <div style={cardStyle}>
          <h2 style={{ marginBottom: 12 }}>Add Expense</h2>
          <form onSubmit={handleSubmit}>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
            <input type="text" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} required style={inputStyle} />
            <input type="number" placeholder="Amount (₹)" value={amount} onChange={e => setAmount(e.target.value)} step="0.01" required style={inputStyle} />
            <button type="submit" style={{ ...inputStyle, background: "#03045e", color: "white", border: "none", cursor: "pointer", fontWeight: 600 }}>Add Expense</button>
          </form>
        </div>

        {/* Stats */}
        <div style={cardStyle}>
          <h2 style={{ marginBottom: 12 }}>Summary</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            {[
              { label: "Today's Expense", val: `₹${stats.todayExp.toFixed(2)}`, red: true },
              { label: "Today's Sales", val: `₹${stats.todaySales}`, red: false },
              { label: "This Month's Expense", val: `₹${stats.monthExp.toFixed(2)}`, red: true },
              { label: "This Month's Sales", val: `₹${stats.monthSales}`, red: false },
              { label: "Total Expense", val: `₹${stats.totalExp.toFixed(2)}`, red: true },
              { label: "Total Sales", val: `₹${stats.totalSales}`, red: false },
            ].map(s => (
              <div key={s.label} style={{ background: "#ebebeb", borderRadius: 12, padding: 14, textAlign: "center", fontWeight: 700, color: "#03045e" }}>
                {s.label}: <span style={{ display: "block", marginTop: 6, fontSize: "1.5rem", color: s.red ? "#d22c27" : "#28a745" }}>{s.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* List */}
        <div style={cardStyle}>
          <h2 style={{ marginBottom: 12 }}>Expenses</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}>
            <thead>
              <tr>
                <th style={{ padding: 10, borderBottom: "1px solid #eee", textAlign: "left", background: "#f0f0f0" }}>Description</th>
                <th style={{ padding: 10, borderBottom: "1px solid #eee", textAlign: "left", background: "#f0f0f0" }}>Amount (₹)</th>
                <th style={{ padding: 10, borderBottom: "1px solid #eee", textAlign: "left", background: "#f0f0f0" }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(exp => (
                <tr key={exp.id}>
                  <td style={{ padding: 10, borderBottom: "1px solid #eee" }}>{exp.description}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #eee" }}>₹{exp.amount?.toFixed(2)}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #eee" }}>{exp.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
