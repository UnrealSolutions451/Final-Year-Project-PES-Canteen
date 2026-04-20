import { Link } from "react-router-dom";

export default function SiteFooter() {
  return (
    <footer style={{
      background: "#03045e",
      color: "#fff",
      textAlign: "center",
      padding: "15px 10px",
      fontSize: 14,
      marginTop: 30,
    }}>
      <p>
        <Link to="/terms" style={{ color: "#FFD166", margin: "0 6px", fontWeight: 500 }}>Terms &amp; Conditions</Link> |{" "}
        <Link to="/privacy" style={{ color: "#FFD166", margin: "0 6px", fontWeight: 500 }}>Privacy Policy</Link> |{" "}
        <Link to="/refund" style={{ color: "#FFD166", margin: "0 6px", fontWeight: 500 }}>Return &amp; Refund Policy</Link> |{" "}
        <Link to="/about" style={{ color: "#FFD166", margin: "0 6px", fontWeight: 500 }}>About Us</Link>
      </p>
      <p style={{ marginTop: 8, fontSize: 12, color: "#ddd" }}>&copy; 2025 P.E.S. Canteen. All rights reserved.</p>
      <p style={{ fontSize: 12, color: "#ddd", marginTop: 4 }}>
        Developed By <a href="https://unrealsolutions.pages.dev/" style={{ color: "#FFD166" }}>Unreal Solutions</a>
      </p>
    </footer>
  );
}
