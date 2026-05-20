import { useState, useEffect } from "react";
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import AdminNav from "../components/AdminNav";

const STAFF_LINKS = [
  { to: "/canteen",          label: "Canteen Panel" },
  { to: "/menu-management",  label: "Menu" },
  { to: "/add-menu",         label: "Add/Edit Menu" },
  { to: "/staff-attendance", label: "Staff Attendance" },
  { to: "/kot",              label: "KOT" },
  { to: "/ready",            label: "Ready Screen" },
];

const MENU_TEMPLATE = { available: true, category: "Food", description: "", image: "", name: "", price: 0, ty: "veg" };

export default function AddMenu() {
  const [menuItems, setMenuItems] = useState([]);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({});
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "menu"), snap => {
      setMenuItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  function startAdd() {
    setEditId(null);
    setFormData({ ...MENU_TEMPLATE });
    setShowForm(true);
    setTimeout(() => document.getElementById("menu-form")?.scrollIntoView({ behavior: "smooth" }), 100);
  }

  function startEdit(item) {
    setEditId(item.id);
    setFormData({ ...item });
    setShowForm(true);
    setTimeout(() => document.getElementById("menu-form")?.scrollIntoView({ behavior: "smooth" }), 100);
  }

  function clearForm() {
    setEditId(null);
    setFormData({});
    setShowForm(false);
  }

  async function handleSave() {
    if (Object.keys(formData).length === 0) { alert("No data"); return; }
    try {
      const saveData = { ...formData };
      delete saveData.id;
      if (editId) {
        await updateDoc(doc(db, "menu", editId), saveData);
      } else {
        await addDoc(collection(db, "menu"), saveData);
      }
      clearForm();
    } catch (err) {
      console.error("Error saving:", err);
      alert("Failed to save. Check console.");
    }
  }

  async function handleDelete(id) {
    if (window.confirm("Delete?")) await deleteDoc(doc(db, "menu", id));
  }

  function updateField(key, value) {
    setFormData(d => ({ ...d, [key]: value }));
  }

  const inputStyle = { width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 8, marginBottom: 4, fontSize: "0.95rem" };

  return (
    <div style={{ background: "#F7FFF7", margin: 0 }}>
      <header style={{ background: "#03045e", color: "#fff", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
        <img src="/Pes_logo.png" style={{ position: "absolute", left: 20, maxHeight: 50 }} alt="Logo" />
        <h1 style={{ fontSize: "1.4rem", margin: 0 }}>Add / Edit Menu Items</h1>
      </header>
      <AdminNav links={STAFF_LINKS} logoText="P.E.S. Canteen — Staff" />

      <main style={{ maxWidth: 1200, margin: "auto", padding: 16 }}>
        <h2 style={{ textAlign: "center", margin: "12px 0" }}>{editId ? "✏️ Edit Menu Item" : "➕ Add / Edit Menu Item"}</h2>

        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <button onClick={startAdd} style={{ padding: "10px 16px", background: "#03045e", color: "white", border: "none", borderRadius: 10, fontWeight: 600 }}>➕ Add New Item</button>
        </div>

        {showForm && (
          <div id="menu-form" style={{ background: "white", borderRadius: 14, padding: 16, boxShadow: "0 4px 6px rgba(0,0,0,0.1)", maxWidth: 700, margin: "auto", marginBottom: 20 }}>
            {Object.entries(MENU_TEMPLATE).map(([key, defVal]) => {
              const val = formData[key] ?? defVal;
              return (
                <div key={key} style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: 4 }}>{key}</label>
                  {typeof defVal === "boolean" ? (
                    <input type="checkbox" checked={!!val} onChange={e => updateField(key, e.target.checked)} />
                  ) : typeof defVal === "number" ? (
                    <input type="number" value={val} onChange={e => updateField(key, Number(e.target.value))} style={inputStyle} />
                  ) : typeof val === "string" && val.length > 60 ? (
                    <textarea value={val} onChange={e => updateField(key, e.target.value)} style={{ ...inputStyle, resize: "vertical" }} />
                  ) : (
                    <input type="text" value={val} onChange={e => updateField(key, e.target.value)} style={inputStyle} />
                  )}
                </div>
              );
            })}
            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <button onClick={handleSave} style={{ padding: "10px 16px", background: "#1a8f3d", color: "white", border: "none", borderRadius: 10, fontWeight: 600 }}>Save</button>
              {editId && <button onClick={clearForm} style={{ padding: "10px 16px", background: "#d22c27", color: "white", border: "none", borderRadius: 10, fontWeight: 600 }}>Cancel</button>}
            </div>
          </div>
        )}

        <h2 style={{ textAlign: "center", margin: "12px 0" }}>📋 Current Menu</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
          {menuItems.map(m => (
            <div key={m.id} style={{ background: "white", borderRadius: 14, padding: 12, boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
              <b>{m.name || "No name"}</b>
              <p>₹{m.price ?? "-"}</p>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button onClick={() => startEdit(m)} style={{ flex: 1, padding: "10px 16px", background: "#03045e", color: "white", border: "none", borderRadius: 10, fontWeight: 600 }}>Edit</button>
                <button onClick={() => handleDelete(m.id)} style={{ flex: 1, padding: "10px 16px", background: "#d22c27", color: "white", border: "none", borderRadius: 10, fontWeight: 600 }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
