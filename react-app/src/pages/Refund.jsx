import { Link } from "react-router-dom";

export default function Refund() {
  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", background: "#F7FFF7", minHeight: "100vh" }}>
      <header style={{ background: "#03045e", color: "white", padding: "16px 20px", textAlign: "center", fontWeight: 700, fontSize: "1.5rem" }}>
        Return &amp; Refund Policy
      </header>
      <main style={{ maxWidth: 800, margin: "30px auto", padding: "0 20px" }}>
        <h2 style={{ color: "#03045e" }}>Return &amp; Refund Policy</h2>
        <p style={{ lineHeight: 1.7, marginBottom: 16 }}>
          Due to the nature of food products, all sales are final. However, we are committed to customer satisfaction.
        </p>
        <h3>Quality Issues</h3>
        <p style={{ lineHeight: 1.7, marginBottom: 16 }}>
          If you receive food that does not meet quality standards, please report it immediately to the canteen staff at the counter.
        </p>
        <h3>Order Errors</h3>
        <p style={{ lineHeight: 1.7, marginBottom: 16 }}>
          If you receive an incorrect order, please contact canteen staff. We will do our best to resolve the issue promptly.
        </p>
        <h3>Payment Issues</h3>
        <p style={{ lineHeight: 1.7, marginBottom: 16 }}>
          For any payment-related issues, please contact the canteen management at the college.
        </p>
        <Link to="/" style={{ color: "#03045e", fontWeight: 600 }}>← Back to Home</Link>
      </main>
    </div>
  );
}
