import { useState, useEffect } from "react";
import {
  collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc,
  serverTimestamp, query, where, orderBy
} from "firebase/firestore";
import { auth, db } from "../firebase";
import AdminNav from "../components/AdminNav";

const ADMIN_LINKS = [
  { to: "/admin",     label: "Dashboard" },
  { to: "/analytics", label: "Analytics" },
  { to: "/expenses",  label: "Expenses" },
  { to: "/staff",     label: "Staff" },
];

function computeNextSalaryDate(lastPaid, freq) {
  const d = new Date(lastPaid);
  if (freq === "weekly") d.setDate(d.getDate() + 7);
  else d.setMonth(d.getMonth() + 1);
  return d;
}

function getColor(days) {
  if (days <= 1) return "#d22c27";
  if (days <= 7) return "#f6c344";
  return "#28a745";
}

export default function StaffManagement() {
  const [staffList, setStaffList] = useState([]);
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [dueDays, setDueDays] = useState("7");
  const [form, setForm] = useState({ id: "", name: "", role: "", salary: "", frequency: "monthly", lastPaid: "" });
  const [expandedHistory, setExpandedHistory] = useState({});
  const [staffHistories, setStaffHistories] = useState({});

  useEffect(() => {
    const unsub1 = onSnapshot(collection(db, "staff"), snap => {
      setStaffList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsub2 = onSnapshot(
      query(collection(db, "salaryHistory"), orderBy("createdAt", "desc")),
      snap => setSalaryHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return () => { unsub1(); unsub2(); };
  }, []);

  // Load per-staff history when expanded
  useEffect(() => {
    const unsubscribers = {};
    staffList.forEach(s => {
      unsubscribers[s.id] = onSnapshot(
        query(collection(db, "salaryHistory"), where("staffId", "==", s.id), orderBy("createdAt", "desc")),
        snap => setStaffHistories(h => ({ ...h, [s.id]: snap.docs.map(d => ({ id: d.id, ...d.data() })) }))
      );
    });
    return () => Object.values(unsubscribers).forEach(u => u());
  }, [staffList]);

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      name: form.name, role: form.role,
      salary: parseFloat(form.salary) || 0,
      frequency: form.frequency,
      lastPaid: form.lastPaid || null,
      nextSalaryDate: form.lastPaid ? computeNextSalaryDate(form.lastPaid, form.frequency).toISOString().split("T")[0] : null,
      updatedAt: serverTimestamp(),
    };
    if (form.id) await updateDoc(doc(db, "staff", form.id), payload);
    else await addDoc(collection(db, "staff"), payload);
    setForm({ id: "", name: "", role: "", salary: "", frequency: "monthly", lastPaid: "" });
  }

  async function markSalaryPaid(s) {
    const today = new Date();
    const next = computeNextSalaryDate(today, s.frequency);
    await updateDoc(doc(db, "staff", s.id), {
      lastPaid: today.toISOString().split("T")[0],
      nextSalaryDate: next.toISOString().split("T")[0],
      updatedAt: serverTimestamp(),
    });
    await addDoc(collection(db, "salaryHistory"), {
      staffId: s.id, staffName: s.name, amount: s.salary, type: "salary",
      datePaid: today.toISOString().split("T")[0],
      paidBy: auth.currentUser?.email || "Admin",
      createdAt: serverTimestamp(),
    });
  }

  async function recordAdvance(s) {
    const amt = parseFloat(window.prompt(`Advance amount for ${s.name}`));
    if (!amt || amt <= 0) return;
    const perDay = s.frequency === "weekly" ? s.salary / 7 : s.salary / 30;
    const extraDays = Math.round(amt / perDay);
    const next = new Date(s.nextSalaryDate || new Date());
    next.setDate(next.getDate() + extraDays);
    await updateDoc(doc(db, "staff", s.id), { nextSalaryDate: next.toISOString().split("T")[0], updatedAt: serverTimestamp() });
    await addDoc(collection(db, "salaryHistory"), {
      staffId: s.id, staffName: s.name, amount: amt, type: "advance",
      datePaid: new Date().toISOString().split("T")[0],
      paidBy: auth.currentUser?.email || "Admin",
      createdAt: serverTimestamp(),
    });
  }

  function startEdit(s) {
    setForm({ id: s.id, name: s.name, role: s.role || "", salary: s.salary || "", frequency: s.frequency || "monthly", lastPaid: s.lastPaid || "" });
  }

  const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e6e9ef", fontSize: "0.95rem", marginBottom: 4 };
  const btnStyle = (bg) => ({ padding: "6px 10px", borderRadius: 6, border: bg === "transparent" ? "1px solid #e6e9ef" : "none", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem", background: bg, color: bg === "transparent" ? "#03045e" : "white" });

  const dueCount = staffList.filter(s => s.nextSalaryDate && (new Date(s.nextSalaryDate) - new Date()) / (1000 * 60 * 60 * 24) <= parseInt(dueDays)).length;
  const earliest = staffList.filter(s => s.nextSalaryDate).sort((a, b) => new Date(a.nextSalaryDate) - new Date(b.nextSalaryDate))[0];

  return (
    <div style={{ background: "#efefef", color: "#17202a", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{ background: "#03045e", color: "#fff", padding: "16px 20px", textAlign: "center", fontWeight: 700, fontSize: "1.25rem", boxShadow: "0 4px 6px rgba(0,0,0,.1)" }}>
        Staff Management
      </header>
      <AdminNav links={ADMIN_LINKS} />

      <main style={{ maxWidth: 1100, margin: "18px auto", width: "94%", flex: 1 }}>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 14 }}>
          {/* Add/Update Form */}
          <div style={{ flex: "1 1 360px", background: "#f8f8f8", borderRadius: 12, boxShadow: "0 6px 18px rgba(15,23,42,0.06)", padding: 16 }}>
            <h3>Add / Update Staff</h3>
            <form onSubmit={handleSubmit}>
              <input type="hidden" value={form.id} />
              <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#535a67", marginBottom: 6 }}>Full name</label>
                  <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} />
                </div>
                <div style={{ width: 140 }}>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#535a67", marginBottom: 6 }}>Frequency</label>
                  <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))} style={inputStyle}>
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#535a67", marginBottom: 6 }}>Role</label>
                  <input type="text" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={inputStyle} />
                </div>
                <div style={{ width: 160 }}>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#535a67", marginBottom: 6 }}>Salary (₹)</label>
                  <input type="number" value={form.salary} onChange={e => setForm(f => ({ ...f, salary: e.target.value }))} style={inputStyle} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#535a67", marginBottom: 6 }}>Last Paid Date</label>
                  <input type="date" value={form.lastPaid} onChange={e => setForm(f => ({ ...f, lastPaid: e.target.value }))} style={inputStyle} />
                </div>
                <div style={{ width: 140, display: "flex", alignItems: "flex-end" }}>
                  <button type="submit" style={{ ...btnStyle("#03045e"), padding: "10px 16px" }}>Save</button>
                </div>
              </div>
            </form>
          </div>

          {/* Staff Overview */}
          <div style={{ flex: "2 1 560px", background: "#f8f8f8", borderRadius: 12, boxShadow: "0 6px 18px rgba(15,23,42,0.06)", padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <h3>Staff Overview</h3>
              <div>
                <label style={{ fontSize: "0.9rem", color: "#535a67" }}>Due within </label>
                <select value={dueDays} onChange={e => setDueDays(e.target.value)} style={{ padding: 6, borderRadius: 8 }}>
                  <option value="3">3 days</option>
                  <option value="7">7 days</option>
                  <option value="30">30 days</option>
                  <option value="9999">All</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
              {[
                { label: "Total Staff", val: staffList.length },
                { label: "Due Soon", val: dueCount },
                { label: "Next Salary Date", val: earliest ? `${earliest.nextSalaryDate} (${earliest.name})` : "—" },
              ].map(s => (
                <div key={s.label} style={{ padding: "10px 12px", borderRadius: 10, background: "white", boxShadow: "0 6px 18px rgba(15,23,42,0.06)", minWidth: 160, textAlign: "center" }}>
                  <strong style={{ display: "block", fontSize: "1.05rem", color: "#03045e", marginBottom: 6 }}>{s.val}</strong>
                  {s.label}
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12, marginTop: 12 }}>
              {staffList.map(s => {
                const nextDate = s.nextSalaryDate ? new Date(s.nextSalaryDate) : null;
                const daysLeft = nextDate ? Math.ceil((nextDate - new Date()) / (1000 * 60 * 60 * 24)) : null;
                const color = getColor(daysLeft ?? 999);
                const histShown = expandedHistory[s.id];
                const hist = staffHistories[s.id] || [];

                return (
                  <div key={s.id} style={{ position: "relative", padding: 12, borderRadius: 10, background: "white", boxShadow: "0 6px 18px rgba(15,23,42,0.06)", display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ width: 12, height: 12, borderRadius: "50%", position: "absolute", top: 6, right: 6, background: color }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 800, color: "#03045e" }}>{s.name}</div>
                        <div style={{ color: "#535a67", fontSize: "0.9rem" }}>{s.role}</div>
                      </div>
                      <div>{s.nextSalaryDate || "—"}</div>
                    </div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontWeight: 600 }}>
                      ₹{s.salary} | {s.frequency} | Last: {s.lastPaid || "—"} |{" "}
                      <span style={{ color, fontWeight: 700 }}>{daysLeft !== null ? `${daysLeft} days left` : "—"}</span>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <button onClick={() => markSalaryPaid(s)} style={btnStyle("#03045e")}>Mark Paid</button>
                      <button onClick={() => recordAdvance(s)} style={btnStyle("transparent")}>Advance</button>
                      <button onClick={() => setExpandedHistory(h => ({ ...h, [s.id]: !h[s.id] }))} style={btnStyle("transparent")}>History {histShown ? "⯅" : "⯆"}</button>
                      <button onClick={() => startEdit(s)} style={btnStyle("transparent")}>Edit</button>
                      <button onClick={() => deleteDoc(doc(db, "staff", s.id))} style={btnStyle("#d22c27")}>Delete</button>
                    </div>
                    {histShown && (
                      <div style={{ borderTop: "1px solid #eee", marginTop: 6, paddingTop: 6, fontSize: "0.85rem" }}>
                        {hist.map(h => (
                          <div key={h.id} style={{ borderBottom: "1px solid #eee", padding: "4px 0", display: "flex", justifyContent: "space-between" }}>
                            <div>{h.type === "advance" ? "Advance" : "Salary"} ₹{h.amount}</div>
                            <span style={{ color: "#535a67", fontSize: "0.8rem" }}>{h.datePaid} by {h.paidBy}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Global Salary History */}
        <div style={{ background: "white", borderRadius: 12, boxShadow: "0 6px 18px rgba(15,23,42,0.06)", padding: 16, marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <h3>Salary History</h3>
            <button onClick={() => setEditMode(m => !m)} style={btnStyle("transparent")}>{editMode ? "Done" : "Edit History"}</button>
          </div>
          {salaryHistory.map(h => (
            <div key={h.id} style={{ padding: "10px 12px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.9rem" }}>
              <div><strong>{h.staffName}</strong> — {h.type === "advance" ? "Advance" : "Salary"} ₹{h.amount}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "#535a67" }}>{h.datePaid} by {h.paidBy}</span>
                {editMode && (
                  <button onClick={() => deleteDoc(doc(db, "salaryHistory", h.id))} style={{ background: "none", border: "none", color: "#d22c27", cursor: "pointer", fontSize: "0.85rem" }}>🗑️</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
