import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect");

  const [selectedRole, setSelectedRole] = useState("staff");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin() {
    setError("");
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const snap = await getDoc(doc(db, "users", cred.user.uid));
      if (!snap.exists()) {
        setError("❌ User role not found. Contact admin.");
        return;
      }
      const role = snap.data().role;

      if (role === "admin") {
        navigate(redirect || "/admin");
        return;
      }
      if (role === "staff" && selectedRole === "admin") {
        setError("❌ Access denied. You are staff and cannot login as admin.");
        return;
      }
      if (role === "staff" && selectedRole === "staff") {
        navigate(redirect || "/canteen");
        return;
      }
    } catch (err) {
      setError("❌ " + err.message);
    }
  }

  return (
    <div style={{
      fontFamily: "'Segoe UI', sans-serif",
      background: "linear-gradient(135deg, #03045e, #46a0fa)",
      display: "flex", justifyContent: "center", alignItems: "center",
      height: "100vh", margin: 0,
    }}>
      <div style={{
        background: "#fff", padding: 30, borderRadius: 12,
        boxShadow: "0 6px 20px rgba(0,0,0,0.2)", width: "100%",
        maxWidth: 380, textAlign: "center",
        animation: "fadeIn 0.4s ease-in-out",
      }}>
        <h2 style={{ marginBottom: 20, color: "#03045e" }}>🔐 Login</h2>

        {/* Role Selector */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, background: "#f0f4f8", borderRadius: 8, overflow: "hidden" }}>
          {["staff", "admin"].map(role => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              style={{
                flex: 1, padding: 10, border: "none",
                background: selectedRole === role ? "#46a0fa" : "transparent",
                color: selectedRole === role ? "white" : "#03045e",
                fontSize: "1rem", fontWeight: 600, cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </button>
          ))}
        </div>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ width: "100%", padding: 12, margin: "10px 0", border: "1px solid #ccc", borderRadius: 8, fontSize: "1rem" }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ width: "100%", padding: 12, margin: "10px 0", border: "1px solid #ccc", borderRadius: 8, fontSize: "1rem" }}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
        />
        <button
          onClick={handleLogin}
          style={{
            width: "100%", padding: 12, background: "#46a0fa", border: "none",
            borderRadius: 8, color: "white", fontSize: "1.1rem", fontWeight: "bold", cursor: "pointer",
          }}
        >
          Login
        </button>
        {error && <p style={{ color: "red", fontSize: "0.9rem", marginTop: 8 }}>{error}</p>}
      </div>
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
