import { useState, useEffect, useRef } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

export default function Ready() {
  const [orders, setOrders] = useState([]);
  const [empty, setEmpty] = useState(false);
  const bellRef = useRef(null);
  const announcedOrders = useRef(new Set());

  useEffect(() => {
    bellRef.current = new Audio("/bell.mp3");
    bellRef.current.preload = "auto";

    document.body.addEventListener("click", () => {
      bellRef.current?.play().catch(() => {});
    }, { once: true });

    const q = query(collection(db, "orders"), where("status", "==", "ready"));
    const unsub = onSnapshot(q, snap => {
      const readyOrders = snap.docs.map(d => ({ ...d.data(), id: d.id }));

      readyOrders.forEach(order => {
        if (!announcedOrders.current.has(order.id)) {
          announcedOrders.current.add(order.id);
          bellRef.current.currentTime = 0;
          bellRef.current.play().catch(() => {});
          speak(`Order ${order.orderCode} is ready for pickup!`);
        }
      });

      setOrders(readyOrders);
      setEmpty(readyOrders.length === 0);
    });
    return unsub;
  }, []);

  function speak(text) {
    if (!("speechSynthesis" in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-IN";
    speechSynthesis.cancel();
    speechSynthesis.speak(utter);
  }

  return (
    <div style={{
      background: "linear-gradient(135deg, #03045e, #46a0fa)",
      color: "#fff", minHeight: "100vh", padding: 20,
      display: "flex", flexDirection: "column", alignItems: "center",
    }}>
      <header>
        <h1 style={{ fontSize: "2.7rem", fontWeight: 800, marginBottom: 20 }}>Orders Ready for Pickup</h1>
      </header>

      {empty && <div style={{ marginTop: 50, fontSize: "1.5rem" }}>No orders ready right now.</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px,1fr))", gap: 20, width: "100%", maxWidth: 1200 }}>
        {orders.map(order => (
          <div key={order.id} style={{
            background: "white", borderRadius: 16, boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
            padding: 24, textAlign: "center",
          }}>
            <div style={{ fontSize: "3rem", fontWeight: 900, color: "#03045e" }}>{order.orderCode}</div>
            <div style={{ fontSize: "1.2rem", color: "#444" }}>Table: {order.table || "-"}</div>
            <div style={{ fontSize: "1.2rem", color: "#444" }}>Time: {order.time || "-"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
