import { Link } from "react-router-dom";

export default function Privacy() {
  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", background: "#F7FFF7", minHeight: "100vh" }}>
      <header style={{ background: "#03045e", color: "white", padding: "16px 20px", textAlign: "center", fontWeight: 700, fontSize: "1.5rem" }}>
        Privacy Policy
      </header>
      <main style={{ maxWidth: 800, margin: "30px auto", padding: "0 20px" }}>
        <h2 style={{ color: "#03045e" }}>Privacy Policy</h2>
        <p style={{ lineHeight: 1.7, marginBottom: 16 }}>
          This privacy policy explains how P.E.S. Canteen collects, uses, and protects your information when you use our digital ordering service.
        </p>
        <h3>Information We Collect</h3>
        <p style={{ lineHeight: 1.7, marginBottom: 16 }}>
          We collect order information including items ordered, table number, and session data. For staff and admin accounts, we collect login credentials and role information.
        </p>
        <h3>How We Use Information</h3>
        <p style={{ lineHeight: 1.7, marginBottom: 16 }}>
          Order information is used solely to process and fulfill your food order. Staff data is used for attendance tracking and salary management.
        </p>
        <h3>Data Security</h3>
        <p style={{ lineHeight: 1.7, marginBottom: 16 }}>
          All data is stored securely in Google Firebase with appropriate security rules. We do not share your personal data with third parties.
        </p>
        <Link to="/" style={{ color: "#03045e", fontWeight: 600 }}>← Back to Home</Link>
      </main>
    </div>
  );
}
