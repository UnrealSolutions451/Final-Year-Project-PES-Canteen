import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

export default function Cart() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tableId = searchParams.get("table") || "default";
  const sessionId = searchParams.get("session");
  const cartKey = `cart_${tableId}_${sessionId}`;

  const [cart, setCart] = useState([]);

  useEffect(() => {
    const sessionData = JSON.parse(localStorage.getItem("canteenSession") || "{}");
    const now = Date.now();
    if (!sessionId || !sessionData.sessionId || sessionId !== sessionData.sessionId || now > sessionData.expiry) {
      navigate(`/?table=${tableId}`, { replace: true });
      return;
    }
    setCart(JSON.parse(localStorage.getItem(cartKey)) || []);
  }, [cartKey, sessionId, tableId, navigate]);

  function saveCart(newCart) {
    setCart(newCart);
    localStorage.setItem(cartKey, JSON.stringify(newCart));
  }

  function updateQty(index, change) {
    const newCart = [...cart];
    newCart[index].quantity = (newCart[index].quantity || 1) + change;
    if (newCart[index].quantity <= 0) newCart.splice(index, 1);
    saveCart(newCart);
  }

  function removeItem(index) {
    const newCart = [...cart];
    newCart.splice(index, 1);
    saveCart(newCart);
  }

  function clearCart() {
    if (window.confirm("Are you sure you want to clear the cart?")) {
      localStorage.removeItem(cartKey);
      setCart([]);
    }
  }

  async function placeOrder() {
    if (cart.length === 0) { alert("Your cart is empty!"); return; }

    let tId = tableId;
    if (!tId || tId.trim() === "" || tId === "default") {
      tId = window.prompt("Enter your table number:");
      if (!tId || tId.trim() === "") { alert("Table number is required."); return; }
    }

    const orderCode = "ORD-" + Math.floor(1000 + Math.random() * 9000);
    const now = new Date();
    const orderDate = now.toISOString().split("T")[0];
    const orderTime = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    try {
      await addDoc(collection(db, "orders"), {
        table: tId, sessionId,
        items: cart, status: "pending",
        orderCode, date: orderDate, time: orderTime,
        createdAt: serverTimestamp(), timestamp: serverTimestamp(),
      });
      localStorage.removeItem(cartKey);
      navigate(`/order-confirmation?code=${orderCode}`);
    } catch (err) {
      console.error("Error placing order:", err);
      alert("Error placing order. Please try again.");
    }
  }

  const total = cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
  const cartCount = cart.length;

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#F7FFF7", color: "#292F36", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <header style={{
        background: "#03045e", color: "white", padding: "15px 20px",
        textAlign: "center", position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      }}>
        <h1>Your Cart</h1>
      </header>

      <main style={{ flex: 1, paddingBottom: 160 }}>
        <div style={{ padding: 15 }}>
          {cart.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            <>
              {cart.map((item, index) => (
                <div key={index} style={{
                  background: "white", borderRadius: 12, padding: 12,
                  marginBottom: 12, display: "flex", justifyContent: "space-between",
                  alignItems: "center", boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                }}>
                  <div style={{ fontWeight: 500 }}>
                    {item.name} - ₹{item.price} x {item.quantity || 1} = ₹{item.price * (item.quantity || 1)}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button onClick={() => updateQty(index, -1)} style={{ padding: "6px 10px", background: "#FB8D22", color: "white", border: "none", borderRadius: 6, fontWeight: 600 }}>-</button>
                    <span>{item.quantity || 1}</span>
                    <button onClick={() => updateQty(index, 1)} style={{ padding: "6px 10px", background: "#FB8D22", color: "white", border: "none", borderRadius: 6, fontWeight: 600 }}>+</button>
                    <button onClick={() => removeItem(index)} style={{ padding: "6px 10px", background: "#dc3545", color: "white", border: "none", borderRadius: 6, fontWeight: 600 }}>Remove</button>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 15, fontWeight: "bold", fontSize: "1.1rem", textAlign: "right" }}>
                Total: ₹{total}
              </div>
              <div style={{ marginTop: 30, display: "flex", justifyContent: "center", gap: 10 }}>
                <button onClick={clearCart} style={{
                  padding: "10px 16px", background: "#FB8D22", color: "white",
                  border: "none", borderRadius: 12, fontWeight: 600, boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                }}>Clear Cart</button>
                <button onClick={placeOrder} style={{
                  padding: "10px 16px", background: "#008000", color: "white",
                  border: "none", borderRadius: 12, fontWeight: 600, boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                }}>Place Order</button>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer above nav */}
      <div style={{
        position: "fixed", bottom: 64, left: 0, right: 0,
        background: "#03045e", color: "#fff", textAlign: "center",
        padding: "8px 10px", fontSize: 13, zIndex: 99,
      }}>
        <p>
          <Link to="/terms" style={{ color: "#FFD166", margin: "0 6px" }}>Terms &amp; Conditions</Link> |{" "}
          <Link to="/privacy" style={{ color: "#FFD166", margin: "0 6px" }}>Privacy Policy</Link> |{" "}
          <Link to="/refund" style={{ color: "#FFD166", margin: "0 6px" }}>Return &amp; Refund Policy</Link>
        </p>
        <p style={{ marginTop: 2, fontSize: 11, color: "#ddd" }}>&copy; 2025 P.E.S. Canteen. All rights reserved.</p>
      </div>

      {/* Bottom Nav */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, background: "white",
        display: "flex", justifyContent: "space-around", padding: "12px 0",
        boxShadow: "0 -2px 10px rgba(0,0,0,0.1)", zIndex: 100,
      }}>
        <Link to={`/menu?table=${tableId}&session=${sessionId}`} style={{
          display: "flex", flexDirection: "column", alignItems: "center", color: "#666",
          fontSize: "0.8rem", flex: 1, padding: "6px 14px", textDecoration: "none",
        }}>
          <span style={{ fontSize: "1.2rem", marginBottom: 4 }}>🍔</span>
          <span>Menu</span>
        </Link>
        <span style={{
          display: "flex", flexDirection: "column", alignItems: "center", color: "white",
          fontSize: "0.8rem", flex: 1, padding: "6px 14px",
          background: "#03045e", borderRadius: 8, position: "relative",
        }}>
          <span style={{ fontSize: "1.2rem", marginBottom: 4 }}>🛒</span>
          <span>Cart</span>
          {cartCount > 0 && (
            <span style={{
              position: "absolute", top: -5, right: -5, background: "#FB8D22",
              color: "white", borderRadius: "50%", width: 18, height: 18,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem",
            }}>{cartCount}</span>
          )}
        </span>
      </div>
    </div>
  );
}
