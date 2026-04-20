import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import Toast, { showToast } from "../components/Toast";

export default function Description() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tableId = searchParams.get("table");
  const sessionId = searchParams.get("session");

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) { setLoading(false); return; }
      try {
        const snap = await getDoc(doc(db, "menu", id));
        if (snap.exists()) setItem({ id: snap.id, ...snap.data() });
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  function addToCart() {
    if (!item) return;
    const cartKey = `cart_${tableId}_${sessionId}`;
    const cart = JSON.parse(localStorage.getItem(cartKey)) || [];
    const idx = cart.findIndex(ci => ci.id === item.id);
    if (idx >= 0) cart[idx].quantity = (cart[idx].quantity || 1) + 1;
    else cart.push({ id: item.id, name: item.name, price: item.price, quantity: 1 });
    localStorage.setItem(cartKey, JSON.stringify(cart));
    showToast("Added to cart!");
  }

  const handleBack = () => {
    if (document.referrer && !document.referrer.includes("description")) {
      navigate(-1);
    } else {
      navigate(`/menu?table=${tableId || ""}&session=${sessionId || ""}`);
    }
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#F7FFF7", color: "#292F36", margin: 0, padding: 0, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <header style={{
        background: "#03045e", color: "white", padding: "15px 20px",
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "sticky", top: 0, zIndex: 100, boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      }}>
        <h1 style={{ fontSize: "1.4rem", margin: 0 }}>Item Details</h1>
      </header>

      <main style={{
        flex: 1, maxWidth: 600, margin: "20px auto", background: "white",
        borderRadius: 12, boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        padding: 16, textAlign: "center",
        animation: "fadeIn 0.3s ease-in",
      }}>
        {loading ? (
          <p>Loading...</p>
        ) : !item ? (
          <p>Item not found.</p>
        ) : (
          <>
            <div style={{ width: "100%", height: 300, borderRadius: 12, overflow: "hidden", marginBottom: 15, boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
              <img
                src={item.image || "/placeholder-food.jpg"}
                alt={item.name}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </div>
            <h2 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: 8, color: "#03045e" }}>{item.name || "Unnamed Item"}</h2>
            <p style={{ fontSize: "1.3rem", color: "#d22c27", marginBottom: 10, fontWeight: 600 }}>₹{item.price || 0}</p>
            <p style={{ color: "#555", fontSize: "1rem", marginBottom: 20, lineHeight: 1.5 }}>{item.description || "No description available."}</p>
            <button
              onClick={addToCart}
              style={{
                padding: "12px 20px", background: "#03045e", color: "#fff",
                border: "none", borderRadius: 10, fontSize: "1rem", fontWeight: 600,
                cursor: "pointer", width: "100%", maxWidth: 300,
              }}
            >
              Add to Cart
            </button>
            <br />
            <span
              onClick={handleBack}
              style={{ display: "inline-block", marginTop: 16, color: "#03045e", fontWeight: 600, fontSize: "0.95rem", cursor: "pointer" }}
            >
              ← Back to Menu
            </span>
          </>
        )}
      </main>

      <footer style={{
        background: "#03045e", color: "white", textAlign: "center",
        padding: 15, fontSize: "0.9rem", borderTopLeftRadius: 12, borderTopRightRadius: 12,
      }}>
        <p>&copy; 2025 P.E.S. Canteen. All rights reserved.</p>
      </footer>

      <Toast />
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
