import { useState, useEffect, useRef } from "react";
import {
  collection, onSnapshot, query, where, addDoc,
  updateDoc, serverTimestamp, getDocs, deleteDoc, doc
} from "firebase/firestore";
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

export default function StaffAttendance() {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [staffList, setStaffList] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [profileModal, setProfileModal] = useState(null); // { id, name }
  const [profileStats, setProfileStats] = useState({ p: 0, a: 0 });
  const [profileDate, setProfileDate] = useState("");
  const [profileHistory, setProfileHistory] = useState("Select a date above");
  const [exportModal, setExportModal] = useState(false);
  const [exportFrom, setExportFrom] = useState("");
  const [exportTo, setExportTo] = useState("");

  const dailyUnsubRef = useRef(null);
  const profileUnsubRef = useRef(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "staff"), snap => {
      setStaffList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (dailyUnsubRef.current) dailyUnsubRef.current();
    dailyUnsubRef.current = onSnapshot(
      query(collection(db, "staffAttendance"), where("date", "==", date)),
      snap => {
        const map = {};
        snap.docs.forEach(d => { map[d.data().staffId] = { ...d.data(), id: d.id }; });
        setAttendanceMap(map);
      }
    );
    return () => dailyUnsubRef.current?.();
  }, [date]);

  async function mark(staff, status) {
    const rec = attendanceMap[staff.id];
    try {
      if (status === "not_marked") {
        if (rec?.id) await deleteDoc(doc(db, "staffAttendance", rec.id));
        return;
      }
      if (rec?.id) {
        await updateDoc(doc(db, "staffAttendance", rec.id), { status, updatedAt: serverTimestamp() });
      } else {
        await addDoc(collection(db, "staffAttendance"), {
          staffId: staff.id, staffName: staff.name,
          date, status, updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      alert("Permission Denied.");
    }
  }

  function openProfile(s) {
    setProfileModal(s);
    setProfileDate("");
    setProfileHistory("Select a date above");

    const now = new Date();
    const startStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

    if (profileUnsubRef.current) profileUnsubRef.current();
    profileUnsubRef.current = onSnapshot(
      query(collection(db, "staffAttendance"), where("staffName", "==", s.name)),
      snap => {
        let p = 0, a = 0;
        snap.docs.forEach(d => {
          const data = d.data();
          if (data.date >= startStr) {
            if (data.status === "present") p++;
            else if (data.status === "absent") a++;
          }
        });
        setProfileStats({ p, a });
      }
    );
  }

  function closeProfile() {
    setProfileModal(null);
    if (profileUnsubRef.current) profileUnsubRef.current();
  }

  async function loadHistory(staffName, selDate) {
    setProfileDate(selDate);
    if (!selDate) return;
    const hSnap = await getDocs(query(
      collection(db, "staffAttendance"),
      where("staffName", "==", staffName),
      where("date", "==", selDate)
    ));
    setProfileHistory(hSnap.empty ? "No record" : `Status: ${hSnap.docs[0].data().status.toUpperCase()}`);
  }

  async function exportCsv() {
    if (!exportFrom || !exportTo) { alert("Select dates"); return; }
    const snap = await getDocs(query(
      collection(db, "staffAttendance"),
      where("date", ">=", exportFrom),
      where("date", "<=", exportTo)
    ));
    if (snap.empty) { alert("No records"); return; }

    let csv = `Staff Name,Date,Status\n`;
    const totals = {};
    snap.forEach(d => {
      const a = d.data();
      csv += `${a.staffName},${a.date},${a.status}\n`;
      if (!totals[a.staffName]) totals[a.staffName] = { p: 0, a: 0 };
      if (a.status === "present") totals[a.staffName].p++;
      if (a.status === "absent") totals[a.staffName].a++;
    });
    csv += "\n--- SUMMARY ---\nStaff Name,Total Present,Total Absent\n";
    for (const name in totals) csv += `${name},${totals[name].p},${totals[name].a}\n`;

    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    link.download = `Report_${exportFrom}_to_${exportTo}.csv`;
    link.click();
    setExportModal(false);
  }

  const notMarked = staffList.filter(s => !attendanceMap[s.id] || attendanceMap[s.id].status === "not_marked");
  const present = staffList.filter(s => attendanceMap[s.id]?.status === "present");
  const absent = staffList.filter(s => attendanceMap[s.id]?.status === "absent");

  const cardStyle = { background: "white", borderRadius: 10, boxShadow: "0 6px 18px rgba(0,0,0,0.08)", padding: 10, marginBottom: 8, position: "relative" };

  function StaffCard({ s, column }) {
    const rec = attendanceMap[s.id];
    const isMarked = rec && rec.status !== "not_marked";
    return (
      <div style={cardStyle}>
        <div style={{ fontWeight: 800, color: "#03045e", cursor: "pointer" }} onClick={() => openProfile(s)}>{s.name}</div>
        <div style={{ fontSize: "0.85rem", color: "#555", marginBottom: 6 }}>{s.role || ""}</div>
        {isMarked ? (
          <button onClick={() => mark(s, "not_marked")} style={{ position: "absolute", top: 6, right: 6, background: "#eee", border: "1px solid #ccc", borderRadius: 6, fontSize: 12, cursor: "pointer", padding: "4px 8px" }}>✏️ Edit</button>
        ) : (
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => mark(s, "present")} style={{ flex: 1, padding: 6, background: "#28a745", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Present</button>
            <button onClick={() => mark(s, "absent")} style={{ flex: 1, padding: 6, background: "#d22c27", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Absent</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ background: "#efefef", padding: 0, margin: 0, minHeight: "100vh" }}>
      <header style={{ background: "#03045e", color: "#fff", padding: 16, fontWeight: 800, textAlign: "center", fontSize: "1.5rem", boxShadow: "0 4px 6px rgba(0,0,0,.1)" }}>
        Staff Attendance
      </header>
      <AdminNav links={STAFF_LINKS} logoText="P.E.S. Canteen — Staff" />

      <main style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 10 }}>
          <div>
            <strong>Select Date</strong>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ padding: 8, borderRadius: 8, border: "1px solid #ccc", marginLeft: 8 }} />
          </div>
          <button onClick={() => setExportModal(true)} style={{ padding: 8, borderRadius: 8, cursor: "pointer", background: "#fff", border: "1px solid #ccc", fontWeight: "bold" }}>Export CSV Report</button>
        </div>

        <style>{`.sa-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}@media(max-width:640px){.sa-grid{grid-template-columns:1fr}}`}</style>
        <div className="sa-grid">
          {[
            { title: "Not Marked", items: notMarked },
            { title: "Present", items: present },
            { title: "Absent", items: absent },
          ].map(({ title, items }) => (
            <div key={title} style={{ background: "#f8f8f8", borderRadius: 12, padding: 10 }}>
              <h3 style={{ textAlign: "center", marginBottom: 8 }}>{title}</h3>
              {items.map(s => <StaffCard key={s.id} s={s} />)}
            </div>
          ))}
        </div>
      </main>

      {/* Profile Modal */}
      {profileModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
          <div style={{ background: "white", width: "90%", maxWidth: 400, borderRadius: 14, padding: 20, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <h2 style={{ marginTop: 0, color: "#03045e" }}>{profileModal.name}</h2>
            <p style={{ fontSize: "0.9rem", color: "#666" }}>Attendance Summary (This Month):</p>
            <div style={{ display: "flex", justifyContent: "space-between", margin: "10px 0", fontWeight: 700, padding: 8, background: "#f9f9f9", borderRadius: 6, color: "#28a745" }}>
              <span>Present</span><span>{profileStats.p}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", margin: "10px 0", fontWeight: 700, padding: 8, background: "#f9f9f9", borderRadius: 6, color: "#d22c27" }}>
              <span>Absent</span><span>{profileStats.a}</span>
            </div>
            <hr style={{ margin: "20px 0" }} />
            <label><strong>Check History (Any Date):</strong></label>
            <input type="date" value={profileDate} onChange={e => loadHistory(profileModal.name, e.target.value)} style={{ width: "100%", padding: 10, margin: "10px 0", borderRadius: 8, border: "1px solid #ccc" }} />
            <div style={{ maxHeight: 100, overflow: "auto", fontWeight: "bold", textAlign: "center", marginTop: 10, padding: 10, background: "#e9ecef", borderRadius: 8 }}>{profileHistory}</div>
            <button onClick={closeProfile} style={{ marginTop: 12, width: "100%", padding: 10, border: "none", borderRadius: 8, cursor: "pointer", background: "#6c757d", color: "white" }}>Close</button>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {exportModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
          <div style={{ background: "white", width: "90%", maxWidth: 400, borderRadius: 14, padding: 20 }}>
            <h3>Export CSV Report</h3>
            <p>Select date range for attendance summary.</p>
            <div style={{ marginTop: 10 }}>
              <label>From Date:</label>
              <input type="date" value={exportFrom} onChange={e => setExportFrom(e.target.value)} style={{ width: "100%", marginBottom: 10, padding: 8, borderRadius: 8, border: "1px solid #ccc" }} />
              <label>To Date:</label>
              <input type="date" value={exportTo} onChange={e => setExportTo(e.target.value)} style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #ccc" }} />
            </div>
            <button onClick={exportCsv} style={{ marginTop: 15, width: "100%", padding: 10, background: "#03045e", color: "white", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer" }}>Download Report</button>
            <button onClick={() => setExportModal(false)} style={{ marginTop: 12, width: "100%", padding: 10, border: "none", borderRadius: 8, cursor: "pointer", background: "#6c757d", color: "white" }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
