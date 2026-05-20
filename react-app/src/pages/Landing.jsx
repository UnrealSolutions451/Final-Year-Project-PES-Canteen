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
      <style>{`
        .landing-hero { flex:1; display:flex; flex-direction:column; justify-content:flex-start; align-items:center; padding:80px 20px 20px; }
        .landing-logo { max-width:380px; height:auto; margin-bottom:20px; width:80%; }
        .landing-h1   { font-size:3.2rem; font-weight:700; margin-bottom:20px; line-height:1.3; }
        .landing-p    { font-size:1.8rem; line-height:1.7; max-width:600px; margin:0 auto 30px; }
        .landing-btn  { background:#FFD166; color:#03045e; font-size:2rem; font-weight:bold;
                        padding:16px 30px; border:none; border-radius:14px; cursor:pointer;
                        width:100%; max-width:480px; height:90px; transition:all 0.3s ease; }
        @media(max-width:600px){
          .landing-hero { padding:40px 16px 16px; }
          .landing-h1   { font-size:2rem; }
          .landing-p    { font-size:1.15rem; }
          .landing-btn  { font-size:1.3rem; height:66px; }
        }
      `}</style>
      <div className="landing-hero">
        <img src="/Pes_logo.png" alt="P.E.S. Canteen Logo" className="landing-logo" />
        <h1 className="landing-h1">Welcome to<br />P.E.S. Canteen!</h1>
        <p className="landing-p">Tap the button below to open the menu and start ordering!</p>
        <button
          onClick={handleOpen}
          className="landing-btn"
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
