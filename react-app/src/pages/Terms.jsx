import { Link } from "react-router-dom";

export default function Terms() {
  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", background: "#F7FFF7", minHeight: "100vh" }}>
      <header style={{ background: "#03045e", color: "white", padding: "16px 20px", textAlign: "center", fontWeight: 700, fontSize: "1.5rem" }}>
        Terms &amp; Conditions
      </header>
      <main style={{ maxWidth: 800, margin: "30px auto", padding: "0 20px" }}>
        <h2 style={{ color: "#03045e" }}>Terms &amp; Conditions</h2>
        <p style={{ lineHeight: 1.7, marginBottom: 16 }}>
          By using the P.E.S. Canteen ordering system, you agree to the following terms and conditions.
        </p>
        <h3>1. Use of Service</h3>
        <p style={{ lineHeight: 1.7, marginBottom: 16 }}>
          This service is intended for students, faculty, and staff of P.E.S. College of Engineering. The canteen ordering system must be used responsibly and only for legitimate food orders.
        </p>
        <h3>2. Order Policy</h3>
        <p style={{ lineHeight: 1.7, marginBottom: 16 }}>
          Orders once placed cannot be cancelled. Please review your order before confirming. Fake or spam orders are strictly prohibited and may result in disciplinary action.
        </p>
        <h3>3. Payment</h3>
        <p style={{ lineHeight: 1.7, marginBottom: 16 }}>
          Payment can be made via cash or online UPI at the counter. All transactions are recorded and monitored.
        </p>
        <h3>4. Monitoring</h3>
        <p style={{ lineHeight: 1.7, marginBottom: 16 }}>
          This system actively monitors order activity. IP addresses and device behavior are recorded to prevent misuse.
        </p>
        <Link to="/" style={{ color: "#03045e", fontWeight: 600 }}>← Back to Home</Link>
      </main>
    </div>
  );
}
