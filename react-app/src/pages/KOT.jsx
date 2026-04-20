import { useState, useEffect, useRef } from "react";
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export default function KOT() {
  const [orders, setOrders] = useState([]);
  const [empty, setEmpty] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const announcedOrders = useRef(new Set());
  const bellRef = useRef(null);
  const audioEnabledRef = useRef(false); // sync ref for use inside snapshot callback

  // Queue of speech texts waiting for audio to be enabled
  const pendingSpeech = useRef([]);

  function speak(text) {
    if (!("speechSynthesis" in window)) return;
    if (!audioEnabledRef.current) {
      // Queue it — will be spoken once user enables audio
      pendingSpeech.current.push(text);
      return;
    }
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-IN";
    utter.rate = 0.95;
    speechSynthesis.cancel();
    speechSynthesis.speak(utter);
  }

  function buildSpeech(items) {
    if (!items.length) return "New order received.";
    return "New order received. " + items.map(i => `${i.quantity} ${i.name}`).join(", ");
  }

  function enableAudio() {
    bellRef.current = bellRef.current || new Audio("/bell.mp3");
    bellRef.current.preload = "auto";

    // Play bell silently to unlock AudioContext
    bellRef.current.volume = 1;
    bellRef.current.play().catch(() => {});

    // Speak a silent utterance to unlock SpeechSynthesis
    if ("speechSynthesis" in window) {
      const unlock = new SpeechSynthesisUtterance(" ");
      unlock.volume = 0;
      speechSynthesis.speak(unlock);
    }

    audioEnabledRef.current = true;
    setAudioEnabled(true);

    // Flush any queued speech
    if (pendingSpeech.current.length > 0) {
      const toSpeak = pendingSpeech.current.join(". ");
      pendingSpeech.current = [];
      setTimeout(() => {
        const utter = new SpeechSynthesisUtterance(toSpeak);
        utter.lang = "en-IN";
        utter.rate = 0.95;
        speechSynthesis.cancel();
        speechSynthesis.speak(utter);
      }, 500);
    }
  }

  useEffect(() => {
    bellRef.current = new Audio("/bell.mp3");
    bellRef.current.preload = "auto";

    const q = query(collection(db, "orders"), where("status", "==", "accepted"));
    const unsub = onSnapshot(q, async snap => {
      const rawOrders = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      rawOrders.sort((a, b) => {
        const ta = a.timestamp?.toMillis?.() ?? 0;
        const tb = b.timestamp?.toMillis?.() ?? 0;
        return ta - tb;
      });

      const enriched = [];
      for (const order of rawOrders) {
        let items = Array.isArray(order.items) ? order.items : [];
        try {
          const itemsSnap = await getDocs(collection(db, "orders", order.id, "items"));
          if (!itemsSnap.empty) {
            items = itemsSnap.docs.map(d => {
              const data = d.data();
              return { name: data.name || d.id, quantity: Number(data.quantity ?? 1), price: Number(data.price ?? 0) };
            });
          }
        } catch {}
        enriched.push({ ...order, resolvedItems: items });

        if (!announcedOrders.current.has(order.id)) {
          announcedOrders.current.add(order.id);
          // Play bell
          if (audioEnabledRef.current) {
            bellRef.current.currentTime = 0;
            bellRef.current.play().catch(() => {});
          }
          // Speak after bell finishes (~700ms)
          setTimeout(() => speak(buildSpeech(items)), 700);
        }
      }

      setOrders(enriched);
      setEmpty(enriched.length === 0);
    });

    return () => { unsub(); };
  }, []);

  return (
    <div style={{
      background: "linear-gradient(180deg,#eaf2ff 0%, #f8fbff 100%)",
      color: "#222", minHeight: "100vh", padding: 20,
    }}>
      {/* Enable Audio Overlay — shown until user clicks */}
      {!audioEnabled && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(3,4,94,0.85)",
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", zIndex: 9999,
        }}>
          <div style={{
            background: "white", borderRadius: 20, padding: "40px 50px",
            textAlign: "center", maxWidth: 420, boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
          }}>
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>🔔</div>
            <h2 style={{ color: "#03045e", marginBottom: 12, fontSize: "1.5rem" }}>KOT — Kitchen Display</h2>
            <p style={{ color: "#555", marginBottom: 24, lineHeight: 1.6 }}>
              Click below to enable <strong>bell sound</strong> and <strong>voice announcements</strong> for new orders.
            </p>
            <button
              onClick={enableAudio}
              style={{
                background: "#03045e", color: "white", border: "none",
                padding: "14px 36px", borderRadius: 12, fontSize: "1.1rem",
                fontWeight: 700, cursor: "pointer", width: "100%",
              }}
            >
              🔊 Enable Audio &amp; Start
            </button>
          </div>
        </div>
      )}

      <header style={{ textAlign: "center", marginBottom: 18 }}>
        <h1 style={{ color: "#03045e", fontSize: "1.8rem", letterSpacing: "0.4px" }}>KOT — Accepted Orders (Kitchen)</h1>
        {audioEnabled && (
          <span style={{ fontSize: "0.85rem", color: "#28a745", fontWeight: 600 }}>🔊 Audio &amp; Voice Active</span>
        )}
      </header>

      {empty && <div style={{ textAlign: "center", color: "#666", marginTop: 40, fontWeight: 600 }}>No accepted orders at the moment.</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px,1fr))", gap: 18, maxWidth: 1200, margin: "0 auto" }}>
        {orders.map(order => {
          const items = order.resolvedItems || [];
          const total = order.totalAmount ?? items.reduce((s, i) => s + i.price * i.quantity, 0);
          return (
            <div key={order.id} style={{
              background: "white", borderRadius: 12, boxShadow: "0 6px 18px rgba(2,6,23,0.12)",
              padding: 18, display: "flex", flexDirection: "column", gap: 12,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 800, color: "#03045e", fontSize: "1.05rem" }}>Table {order.table || "-"}</div>
                  <div style={{ fontSize: "0.95rem", color: "#444", fontWeight: 600 }}>Code: {order.orderCode || order.id}</div>
                </div>
                <div style={{ fontWeight: 800 }}>₹{total}</div>
              </div>
              <div style={{ marginTop: 4, fontSize: "0.98rem", color: "#333" }}>
                {items.map((item, i) => (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", gap: 8,
                    padding: "6px 8px", borderRadius: 8, background: "#fbfdff",
                  }}>
                    <div>{item.name}</div>
                    <div>{item.quantity} × {item.price}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10, color: "#666", fontSize: "0.88rem", marginTop: 8 }}>
                <div>Time: {order.time || "-"}</div>
                <div>Date: {order.date || "-"}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
