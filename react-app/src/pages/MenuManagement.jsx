import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const STAFF_LINKS = [
  { to: "/canteen", label: "Canteen Panel" },
  { to: "/menu-management", label: "Menu" },
  { to: "/add-menu", label: "Add/Edit Menu" },
  { to: "/staff-attendance", label: "Staff Attendance" },
  { to: "/kot", label: "KOT" },
  { to: "/ready", label: "Ready Screen" },
];

export default function MenuManagement() {
  const location = useLocation();
  const [allItems, setAllItems] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "menu"), snap => {
      setAllItems(snap.docs.map(d => ({ id: d.id, data: d.data() })));
    });
    return unsub;
  }, []);

  const filtered = allItems.filter(i =>
    (i.data.name || "").toLowerCase().includes(search.toLowerCase())
  );

  async function toggleAvailable(id, current) {
    try {
      await updateDoc(doc(db, "menu", id), { available: !current });
    } catch (err) {
      console.error("Update error:", err);
    }
  }

  return (
    <div style={{ fontFamily: "Arial, sans-serif", background: "#f7f7f7", margin: 0, padding: 0 }}>
      <header style={{
        background: "#03045e", color: "white", padding: 15,
        textAlign: "center", fontSize: "1.75rem", fontWeight: "bold",
        height: 60, position: "relative", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        Menu Availability
        <div style={{ position: "absolute", top: 15, right: 20 }}>
          <button onClick={async () => { await signOut(auth); window.location.href = "/login"; }} style={{ background: "#d22c27", color: "white", border: "none", padding: "8px 16px", borderRadius: 20, cursor: "pointer", fontSize: 14, fontWeight: "bold" }}>⏻</button>
        </div>
      </header>

      <nav style={{ background: "#03045e", color: "white", boxShadow: "0 3px 8px rgba(0,0,0,0.1)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px" }}>
          <div></div>
          <ul style={{ listStyle: "none", display: "flex", gap: 18 }}>
            {STAFF_LINKS.map(({ to, label }) => (
              <li key={to}><Link to={to} style={{ color: location.pathname === to ? "#FFD166" : "white", textDecoration: "none", fontWeight: location.pathname === to ? 700 : 500, padding: "6px 10px", borderRadius: 6 }}>{label}</Link></li>
            ))}
          </ul>
        </div>
      </nav>

      <div style={{ display: "flex", justifyContent: "right", padding: 10, background: "white", gap: 8, boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
        <input
          type="text"
          placeholder="Search for items..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: "100%", maxWidth: 500, padding: "10px 14px", borderRadius: 20, border: "1px solid #ccc", fontSize: "0.95rem", outline: "none" }}
        />
      </div>

      <main style={{ padding: 20, maxWidth: 600, margin: "auto" }}>
        {filtered.length === 0 ? (
          <p>No items found.</p>
        ) : filtered.map(({ id, data }) => (
          <div key={id} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            background: "white", padding: "12px 16px", borderRadius: 8,
            marginBottom: 12, boxShadow: "0 2px 5px rgba(0,0,0,0.08)",
          }}>
            <span style={{ fontSize: "1.1rem", fontWeight: 600 }}>{data.name || "Unnamed Item"}</span>
            <label style={{ position: "relative", display: "inline-block", width: 50, height: 24 }}>
              <input
                type="checkbox"
                checked={data.available === true}
                onChange={() => toggleAvailable(id, data.available === true)}
                style={{ display: "none" }}
              />
              <span
                onClick={() => toggleAvailable(id, data.available === true)}
                style={{
                  position: "absolute", cursor: "pointer", top: 0, left: 0, right: 0, bottom: 0,
                  background: data.available ? "#28a745" : "#ccc",
                  transition: "0.4s", borderRadius: 24,
                }}
              >
                <span style={{
                  position: "absolute", height: 18, width: 18,
                  left: data.available ? 29 : 3, bottom: 3,
                  background: "white", transition: "0.4s", borderRadius: "50%",
                }} />
              </span>
            </label>
          </div>
        ))}
      </main>
    </div>
  );
}
