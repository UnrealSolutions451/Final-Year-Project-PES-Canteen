import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import Toast, { showToast } from "../components/Toast";
import SiteFooter from "../components/SiteFooter";
import ChatBot from "../components/ChatBot";

const CATEGORIES = ["All", "Drinks", "Food", "Snacks", "Chinese", "Extra"];
const VEG_ICON = "https://i.ibb.co/Q4tdkcG/Screenshot-2025-08-23-124910.png";
const NON_VEG_ICON = "https://i.ibb.co/7JvW7cWz/Screenshot-2025-08-23-124938.png";

function normalize(v) { return (v ?? '').toString().trim().toLowerCase(); }

export default function Menu() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tableId = searchParams.get("table") || "default";
  const sessionId = searchParams.get("session");

  const [allItems, setAllItems] = useState([]);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const cartKey = `cart_${tableId}_${sessionId}`;

  // Session validation
  useEffect(() => {
    const sessionData = JSON.parse(localStorage.getItem("canteenSession") || "{}");
    const now = Date.now();
    if (!sessionId || !sessionData.sessionId || sessionId !== sessionData.sessionId || now > sessionData.expiry) {
      navigate(`/?table=${tableId}`, { replace: true });
    }
  }, [sessionId, tableId, navigate]);

  useEffect(() => {
    async function fetchMenu() {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, "menu"));
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAllItems(items);
        if (items.length === 0) {
          await new Promise(r => setTimeout(r, 500));
          const snap2 = await getDocs(collection(db, "menu"));
          setAllItems(snap2.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      } catch (err) {
        console.error("Menu fetch error:", err);
      }
      setLoading(false);
    }
    fetchMenu();
  }, []);

  const filteredItems = allItems
    .filter(item => item.available === true)
    .filter(item => !search || normalize(item.name).includes(normalize(search)))
    .filter(item => category === "All" || normalize(item.category) === normalize(category) || normalize(item.ty) === normalize(category));

  function getCartCount() {
    const cart = JSON.parse(localStorage.getItem(cartKey)) || [];
    return cart.length;
  }

  function addToCart(item) {
    const cart = JSON.parse(localStorage.getItem(cartKey)) || [];
    const idx = cart.findIndex(ci => ci.id === item.id);
    if (idx >= 0) {
      cart[idx].quantity = (cart[idx].quantity || 1) + 1;
    } else {
      cart.push({ id: item.id, name: item.name || 'Item', price: item.price || 0, quantity: 1 });
    }
    localStorage.setItem(cartKey, JSON.stringify(cart));
    showToast("Added to cart!");
    setCartCount(cart.length);
  }

  const [cartCount, setCartCount] = useState(getCartCount);

  return (
    <div style={{ background: "#F7FFF7", color: "#292F36", paddingBottom: 120 }}>
      <style>{`
        .menu-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:15px; padding:15px; }
        @media(max-width:400px){ .menu-grid { grid-template-columns:repeat(2,1fr); gap:10px; padding:10px; } }
        .menu-header { background:#03045e; color:white; position:sticky; top:0; z-index:100;
          box-shadow:0 4px 6px rgba(0,0,0,0.1); display:flex; align-items:center;
          justify-content:center; padding:0 20px; height:70px; }
        .menu-logo { height:54px; width:auto; position:absolute; left:14px; object-fit:contain; }
        .menu-header-title { font-size:1.4rem; text-align:center; margin:0; padding:0 70px; }
        .menu-cat-bar { display:flex; overflow-x:auto; padding:10px; gap:8px; background:white;
          position:sticky; top:70px; z-index:90; box-shadow:0 2px 4px rgba(0,0,0,0.05);
          scrollbar-width:none; }
        .menu-cat-bar::-webkit-scrollbar { display:none; }
        @media(max-width:480px){
          .menu-logo  { height:38px; left:10px; }
          .menu-header-title { font-size:1rem; padding:0 54px; }
          .menu-header { height:58px; }
          .menu-cat-bar { top:58px; }
        }
        @media(max-width:320px){
          .menu-logo { display:none; }
          .menu-header-title { padding:0; }
        }
      `}</style>
      {/* Header */}
      <header className="menu-header">
        <img src="/Pes_logo.png" alt="Logo" className="menu-logo" />
        <h1 className="menu-header-title">P.E.S. Canteen Menu</h1>
      </header>

      {/* Banner */}
      <div style={{ background: "#FFD166", color: "#292F36", padding: 8, textAlign: "center", fontWeight: "bold", fontSize: "0.9rem" }}>
        📌Canteen Timing 10:30am - 5:30pm
      </div>

      {/* Search */}
      <div style={{ display: "flex", justifyContent: "right", padding: 10, background: "white", gap: 8, boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
        <input
          type="text"
          placeholder="Search for items..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: "100%", maxWidth: 500, padding: "10px 14px", borderRadius: 20,
            border: "1px solid #ccc", fontSize: "0.95rem", outline: "none",
          }}
        />
      </div>

      {/* Category filters */}
      <div className="menu-cat-bar">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            style={{
              padding: "8px 16px", border: "none", borderRadius: 20,
              background: category === cat ? "#03045e" : "#f0f0f0",
              color: category === cat ? "white" : "#292F36",
              fontWeight: 500, whiteSpace: "nowrap", cursor: "pointer",
              transition: "all 0.3s ease",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Menu grid */}
      <div className="menu-grid">
        {loading ? (
          <p>Loading menu…</p>
        ) : filteredItems.length === 0 ? (
          <p>No items found.</p>
        ) : filteredItems.map(item => {
          const img = item.image && item.image.trim() !== '' ? item.image : '/placeholder-food.jpg';
          return (
            <div key={item.id} style={{
              background: "white", borderRadius: 12, overflow: "hidden",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)", transition: "all 0.3s ease",
            }}
              onMouseOver={e => e.currentTarget.style.transform = "translateY(-5px)"}
              onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}
            >
              <Link to={`/item/${item.id}?table=${tableId}&session=${sessionId}`}>
                <img src={img} alt={item.name} style={{ width: "100%", height: 150, objectFit: "cover", borderRadius: "8px 8px 0 0", display: "block" }} />
              </Link>
              <div style={{ padding: 12 }}>
                <h3 style={{ fontWeight: 600, marginBottom: 4, fontSize: "0.95rem" }}>{item.name || 'Item'}</h3>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <p style={{ fontWeight: 700, color: "#d22c27", marginBottom: 8 }}>₹{item.price ?? 0}</p>
                  {normalize(item.ty) === "veg" && <img src={VEG_ICON} alt="Veg" style={{ width: 20, height: 20, objectFit: "contain", margin: 10 }} />}
                  {normalize(item.ty) === "non-veg" && <img src={NON_VEG_ICON} alt="Non-Veg" style={{ width: 20, height: 20, objectFit: "contain", margin: 10 }} />}
                </div>
                <button
                  onClick={() => addToCart(item)}
                  style={{
                    width: "100%", padding: 8, background: "#03045e", color: "white",
                    border: "none", borderRadius: 6, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <footer style={{
        background: "#03045e", color: "white", textAlign: "center",
        padding: "20px 15px", marginTop: 30, fontSize: "0.9rem",
        borderTopLeftRadius: 12, borderTopRightRadius: 12,
      }}>
        <p>P.E.S. College, Nagsenvana, Chh.Sambhajinagar, Maharashtra(431002)</p>
        <p>📞 Contact: +91 9876543210</p>
        <SiteFooter />
      </footer>

      {/* Bottom Nav */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, background: "white",
        display: "flex", justifyContent: "space-around", padding: "12px 0",
        boxShadow: "0 -2px 10px rgba(0,0,0,0.1)", zIndex: 100,
      }}>
        <span style={{
          display: "flex", flexDirection: "column", alignItems: "center", color: "white",
          fontSize: "0.8rem", flex: 1, padding: "6px 12px",
          background: "#03045e", borderRadius: 12, margin: "0 4px",
        }}>
          <span style={{ fontSize: "1.2rem", marginBottom: 4 }}>🍔</span>
          <span>Menu</span>
        </span>
        <Link to={`/cart?table=${tableId}&session=${sessionId}`} style={{
          display: "flex", flexDirection: "column", alignItems: "center", color: "#666",
          fontSize: "0.8rem", flex: 1, padding: "6px 12px", textDecoration: "none",
          position: "relative",
        }}>
          <span style={{ fontSize: "1.2rem", marginBottom: 4 }}>🛒</span>
          <span>Cart</span>
          {cartCount > 0 && (
            <span style={{
              position: "absolute", top: -5, right: -5, background: "#03045e",
              color: "white", borderRadius: "50%", width: 18, height: 18,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem",
            }}>{cartCount}</span>
          )}
        </Link>
      </div>

      <ChatBot tableId={tableId} sessionId={sessionId} />
      <Toast />
    </div>
  );
}
