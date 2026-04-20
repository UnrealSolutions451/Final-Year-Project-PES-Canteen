import { useNavigate, useSearchParams, Link } from "react-router-dom";

function generateSessionId() {
  return 'xxxx-4xxx-yxxx-xxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function Landing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleOpen = () => {
    const table = searchParams.get("table") || "unknown";
    const sessionId = generateSessionId();
    const expiry = Date.now() + 20 * 60 * 1000;
    localStorage.setItem("canteenSession", JSON.stringify({ sessionId, table, expiry }));
    navigate(`/menu?table=${table}&session=${sessionId}`);
  };

  return (
    <div style={{
      fontFamily: "'Segoe UI', Arial, sans-serif",
      background: "linear-gradient(135deg, #03045e, #46a0fa)",
      color: "white",
      margin: 0,
      padding: 0,
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
      textAlign: "center",
    }}>
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "center",
        padding: "100px 15px 15px",
      }}>
        <img src="/Pes_logo.png" alt="P.E.S. Canteen Logo" style={{ maxWidth: 450, height: "auto", marginBottom: 20 }} />
        <h1 style={{ fontSize: "4rem", fontWeight: 700, marginBottom: 20, lineHeight: 1.3 }}>
          Welcome to<br />P.E.S. Canteen!
        </h1>
        <p style={{ fontSize: "2.5rem", lineHeight: 1.7, maxWidth: 600, margin: "0 auto 30px" }}>
          Tap the button below to open the menu and start ordering!
        </p>
        <button
          onClick={handleOpen}
          style={{
            background: "#FFD166",
            color: "#03045e",
            fontSize: "3rem",
            fontWeight: "bold",
            padding: "18px 30px",
            border: "none",
            borderRadius: 14,
            cursor: "pointer",
            width: "100%",
            maxWidth: 500,
            height: 120,
            transition: "all 0.3s ease",
          }}
          onMouseOver={e => { e.currentTarget.style.background = "#ffb703"; e.currentTarget.style.transform = "scale(1.05)"; }}
          onMouseOut={e => { e.currentTarget.style.background = "#FFD166"; e.currentTarget.style.transform = "scale(1)"; }}
        >
          Open Menu
        </button>
      </div>

      <footer style={{ background: "#d6d6d6", textAlign: "center", padding: "15px 10px", fontSize: 14, marginTop: 30 }}>
        <p>
          <Link to="/terms" style={{ color: "#333", margin: "0 6px", fontWeight: 500 }}>Terms &amp; Conditions</Link> |{" "}
          <Link to="/privacy" style={{ color: "#333", margin: "0 6px", fontWeight: 500 }}>Privacy Policy</Link> |{" "}
          <Link to="/refund" style={{ color: "#333", margin: "0 6px", fontWeight: 500 }}>Return &amp; Refund Policy</Link> |{" "}
          <Link to="/about" style={{ color: "#333", margin: "0 6px", fontWeight: 500 }}>About Us</Link>
        </p>
        <p style={{ marginTop: 8, fontSize: 12, color: "#555" }}>&copy; 2025 P.E.S. Canteen. All rights reserved.</p>
      </footer>
    </div>
  );
}
