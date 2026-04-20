import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import {
  collection, query, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp
} from "firebase/firestore";
import { Html5QrcodeScanner } from "html5-qrcode";
import { auth, db } from "../firebase";

const ADMIN_LINKS = [
  { to: "/canteen", label: "Canteen Panel" },
  { to: "/menu-management", label: "Menu" },
  { to: "/add-menu", label: "Add/Edit Menu" },
  { to: "/staff-attendance", label: "Staff Attendance" },
  { to: "/kot", label: "KOT" },
  { to: "/ready", label: "Ready Screen" },
];

export default function CanteenPanel() {
  const location = useLocation();
  const [pending, setPending] = useState([]);
  const [accepted, setAccepted] = useState([]);
  const [searchCode, setSearchCode] = useState("");
  const [highlighted, setHighlighted] = useState(null);
  const [payModal, setPayModal] = useState(false);
  const [currentPayOrder, setCurrentPayOrder] = useState(null);
  const [qrUrl, setQrUrl] = useState("");
  const [showPayOptions, setShowPayOptions] = useState(true);
  const [navOpen, setNavOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const scannerRef = useRef(null);
  const html5ScannerRef = useRef(null);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, "orders")), snap => {
      const p = [], a = [];
      snap.forEach(d => {
        const o = { id: d.id, ...d.data() };
        if (o.status === "pending") p.push(o);
        else if (o.status === "accepted" || o.status === "ready") a.push(o);
      });
      setPending(p);
      setAccepted(a);
    });
    return unsub;
  }, []);

  const setStat = (id, status) => updateDoc(doc(db, "orders", id), { status, timestamp: serverTimestamp() });
  const delOrder = (id) => { if (window.confirm("Delete?")) deleteDoc(doc(db, "orders", id)); };

  function highlightOrder(code) {
    setHighlighted(code);
    const el = document.getElementById("order-" + code);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => setHighlighted(null), 3000);
  }

  function openPayment(order, total) {
    setCurrentPayOrder({ ...order, computedTotal: total });
    setQrUrl("");
    setShowPayOptions(true);
    setPayModal(true);
  }

  async function handleCash() {
    if (!currentPayOrder) return;
    await updateDoc(doc(db, "orders", currentPayOrder.id), { paymentMode: "cash", paymentAt: serverTimestamp() });
    setPayModal(false);
  }

  async function handleOnline() {
    if (!currentPayOrder) return;
    await updateDoc(doc(db, "orders", currentPayOrder.id), { paymentMode: "online", paymentAt: serverTimestamp() });
    const upi = "Q099759199@ybl";
    const link = `upi://pay?pa=${upi}&pn=Canteen&am=${currentPayOrder.totalAmount || ""}&cu=INR&tn=${currentPayOrder.orderCode}`;
    setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(link)}`);
    setShowPayOptions(false);
  }

  async function openScanner() {
    setScannerOpen(true);
    setTimeout(() => {
      html5ScannerRef.current = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: 250 }, false);
      html5ScannerRef.current.render(
        (text) => {
          setSearchCode(text);
          closeScanner();
          highlightOrder(text);
        },
        () => {}
      );
    }, 300);
  }

  function closeScanner() {
    try { html5ScannerRef.current?.clear(); } catch {}
    setScannerOpen(false);
  }

  function renderOrderList(orders, showPay) {
    return orders.map(o => {
      const items = o.items || [];
      let total = 0;
      const txt = items.map(i => { const q = i.quantity || 1; total += q * (i.price || 0); return `${i.name} x ${q}`; });
      const tableLabel = o.table || o.tableNumber || o.tableName || null;
      const isHighlighted = highlighted === o.orderCode;

      return (
        <div key={o.id} id={"order-" + o.orderCode} style={{
          background: "white", borderRadius: 12, padding: 14,
          outline: isHighlighted ? "4px solid #46a0fa" : "none",
          boxShadow: isHighlighted ? "0 0 0 6px rgba(70,160,250,0.25)" : "0 4px 6px rgba(0,0,0,0.1)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
            <div>
              <strong>{o.orderCode}</strong>
              {tableLabel && <div style={{ fontSize: "0.85rem", color: "#555", marginTop: 2 }}>Table: {tableLabel}</div>}
            </div>
            <span style={{
              padding: "5px 10px", borderRadius: 20, fontSize: "0.8rem", fontWeight: 700,
              background: o.status === "pending" ? "#ffe3e3" : o.status === "accepted" ? "#fff8c5" : "#d3ffd3",
            }}>
              {o.status}
            </span>
          </div>
          <p><b>Items:</b> {txt.join(", ")}</p>
          <p><b>Total:</b> ₹{total}</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            {o.status === "pending" && (
              <button onClick={() => setStat(o.id, "accepted")} style={{ flex: 1, padding: "10px 16px", background: "#03045e", color: "white", border: "none", borderRadius: 10, fontWeight: 600 }}>Accept</button>
            )}
            {o.status === "accepted" && (
              <button onClick={() => setStat(o.id, "ready")} style={{ flex: 1, padding: "10px 16px", background: "#03045e", color: "white", border: "none", borderRadius: 10, fontWeight: 600 }}>Complete</button>
            )}
            {o.status === "ready" && (
              <button onClick={() => setStat(o.id, "completed")} style={{ flex: 1, padding: "10px 16px", background: "#03045e", color: "white", border: "none", borderRadius: 10, fontWeight: 600 }}>Received</button>
            )}
            {showPay && (
              <button onClick={() => openPayment(o, total)} style={{ flex: 1, padding: "10px 16px", background: "#1a8f3d", color: "white", border: "none", borderRadius: 10, fontWeight: 600 }}>Payment</button>
            )}
            <button onClick={() => delOrder(o.id)} style={{ flex: 1, padding: "10px 16px", background: "#ff6a00", color: "white", border: "none", borderRadius: 10, fontWeight: 600 }}>Delete</button>
          </div>
        </div>
      );
    });
  }

  return (
    <div style={{ background: "#F7FFF7", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{
        background: "#03045e", color: "#fff", height: 90, display: "flex",
        alignItems: "center", justifyContent: "center", position: "sticky", top: 0, zIndex: 10,
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      }}>
        <img src="/Pes_logo.png" style={{ position: "absolute", left: 20, maxHeight: 70 }} alt="Logo" />
        <h1>P.E.S. Canteen Panel</h1>
        <div style={{ position: "absolute", right: 20, top: 25 }}>
          <button onClick={async () => { await signOut(auth); window.location.href = "/login"; }} style={{ background: "#d22c27", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 20 }}>Logout</button>
        </div>
      </header>

      {/* Nav */}
      <style>{`
        .canteen-nav-links { list-style:none; display:flex; gap:18px; }
        .canteen-hamburger { display:none; font-size:1.4rem; background:none; border:none; color:white; cursor:pointer; }
        @media (max-width: 700px) {
          .canteen-hamburger { display:block; }
          .canteen-nav-links { display:none; flex-direction:column; position:absolute; top:100%; left:0; right:0; background:#03045e; padding:10px 16px; gap:8px; z-index:200; }
          .canteen-nav-links.open { display:flex; }
        }
      `}</style>
      <nav style={{ background: "#03045e", color: "white", boxShadow: "0 3px 8px rgba(0,0,0,0.1)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", position: "relative" }}>
          <div style={{ fontWeight: 700, fontSize: "1.1rem" }}></div>
          <button onClick={() => setNavOpen(o => !o)} className="canteen-hamburger">☰</button>
          <ul className={`canteen-nav-links${navOpen ? " open" : ""}`}>
            {ADMIN_LINKS.map(({ to, label }) => (
              <li key={to}>
                <Link to={to} onClick={() => setNavOpen(false)} style={{ color: location.pathname === to ? "#FFD166" : "white", textDecoration: "none", fontWeight: location.pathname === to ? 700 : 500, padding: "6px 10px", borderRadius: 6, display: "block" }}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <main style={{ padding: 16, maxWidth: 1300, margin: "auto", width: "100%" }}>
        {/* Search */}
        <div style={{ display: "flex", gap: 10, margin: "10px 0 18px", flexWrap: "wrap" }}>
          <input
            value={searchCode}
            onChange={e => setSearchCode(e.target.value)}
            placeholder="Search / Scan Order Code"
            style={{ flex: 1, padding: 12, border: "1px solid #ddd", borderRadius: 10 }}
          />
          <button onClick={() => highlightOrder(searchCode.trim())} style={{ padding: "10px 16px", background: "#03045e", color: "white", border: "none", borderRadius: 10, fontWeight: 600 }}>Find</button>
          <button onClick={openScanner} style={{ padding: "10px 16px", background: "#1f7ae0", color: "white", border: "none", borderRadius: 10, fontWeight: 600 }}>Scan</button>
        </div>

        {/* Two columns */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1px 1fr", gap: 16 }}>
          <div>
            <h2 style={{ textAlign: "center", marginBottom: 10 }}>Pending Orders</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
              {renderOrderList(pending, true)}
            </div>
          </div>
          <div style={{ background: "#d0d7e2", width: 1 }} />
          <div>
            <h2 style={{ textAlign: "center", marginBottom: 10 }}>Accepted / Ready Orders</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
              {renderOrderList(accepted, false)}
            </div>
          </div>
        </div>
      </main>

      {/* Payment Modal */}
      {payModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "white", padding: 20, borderRadius: 14, width: "95%", maxWidth: 400, textAlign: "center" }}>
            <h3>Select Payment Mode</h3>
            <p>Amount: ₹{currentPayOrder?.computedTotal}</p>
            {showPayOptions && (
              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button onClick={handleCash} style={{ flex: 1, padding: "10px 16px", background: "#03045e", color: "white", border: "none", borderRadius: 10, fontWeight: 600 }}>Cash</button>
                <button onClick={handleOnline} style={{ flex: 1, padding: "10px 16px", background: "#1a8f3d", color: "white", border: "none", borderRadius: 10, fontWeight: 600 }}>Online</button>
              </div>
            )}
            {qrUrl && <img src={qrUrl} style={{ width: 230, height: 230, marginTop: 10 }} alt="UPI QR" />}
            <button onClick={() => setPayModal(false)} style={{ marginTop: 12, padding: "8px 14px", border: "none", borderRadius: 8, background: "#d22c27", color: "white" }}>Close</button>
          </div>
        </div>
      )}

      {/* Scanner Modal */}
      {scannerOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "white", padding: 20, borderRadius: 14, width: "95%", maxWidth: 400, textAlign: "center" }}>
            <h3>Scan Order QR</h3>
            <div id="qr-reader" style={{ width: "100%" }}></div>
            <button onClick={closeScanner} style={{ marginTop: 12, padding: "8px 14px", border: "none", borderRadius: 8, background: "#d22c27", color: "white" }}>Close</button>
          </div>
        </div>
      )}

    </div>
  );
}
