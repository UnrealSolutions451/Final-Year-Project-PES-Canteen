import { Link } from "react-router-dom";

export default function About() {
  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", background: "#F7FFF7", minHeight: "100vh" }}>
      <header style={{ background: "#03045e", color: "white", padding: "16px 20px", textAlign: "center", fontWeight: 700, fontSize: "1.5rem" }}>
        About Us
      </header>
      <main style={{ maxWidth: 800, margin: "30px auto", padding: "0 20px" }}>
        <h2 style={{ color: "#03045e" }}>P.E.S. College of Engineering</h2>
        <p style={{ lineHeight: 1.7, marginBottom: 16 }}>
          P.E.S. College of Engineering, Chh. Sambhajinagar (Aurangabad), Maharashtra 431002 is a premier technical institution dedicated to providing quality education and fostering innovation.
        </p>
        <h2 style={{ color: "#03045e" }}>P.E.S. Canteen Management System</h2>
        <p style={{ lineHeight: 1.7, marginBottom: 16 }}>
          The P.E.S. Canteen Management System is a digital platform designed to streamline canteen operations including ordering, billing, staff management, and analytics.
        </p>
        <p style={{ lineHeight: 1.7, marginBottom: 16 }}>
          <strong>Developer:</strong> Mohammed Ahmed Ali<br />
          <strong>Email:</strong> ahmed451ali@gmail.com<br />
          <strong>Managed by:</strong> <a href="https://unrealsolutions.pages.dev/" style={{ color: "#03045e" }}>Unreal Solutions</a>
        </p>
        <Link to="/" style={{ color: "#03045e", fontWeight: 600 }}>← Back to Home</Link>
      </main>
    </div>
  );
}
