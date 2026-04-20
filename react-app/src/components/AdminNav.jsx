import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

const style = {
  nav: {
    background: "#03045e",
    color: "white",
    boxShadow: "0 3px 8px rgba(0,0,0,0.1)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  container: {
    maxWidth: 1100,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 16px",
    position: "relative",
  },
  logo: { fontWeight: 700, fontSize: "1.1rem" },
  ul: { listStyle: "none", display: "flex", gap: 18 },
  a: { color: "white", textDecoration: "none", fontWeight: 500, padding: "6px 10px", borderRadius: 6 },
  activeA: { color: "#FFD166", fontWeight: 700 },
  toggleBtn: {
    display: "none",
    fontSize: "1.4rem",
    background: "none",
    border: "none",
    color: "white",
    cursor: "pointer",
  },
  logoutBtn: {
    background: "#d22c27",
    color: "white",
    border: "none",
    padding: "8px 16px",
    borderRadius: 20,
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: 14,
  },
};

export default function AdminNav({ links, logoText = "P.E.S. Canteen — Admin" }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/login";
  };

  return (
    <nav style={style.nav}>
      <div style={style.container}>
        <div style={style.logo}>{logoText}</div>
        <button style={style.toggleBtn} onClick={() => setOpen(o => !o)}>☰</button>
        <ul style={{ ...style.ul, ...(open ? {} : {}) }}>
          {links.map(({ to, label }) => (
            <li key={to}>
              <Link
                to={to}
                style={location.pathname === to ? { ...style.a, ...style.activeA } : style.a}
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
        <button style={style.logoutBtn} onClick={handleLogout}>Logout</button>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .admin-nav-toggle { display: block !important; }
          .admin-nav-links { display: none; flex-direction: column; position: absolute; top: 56px; right: 0; background: #03045e; width: 200px; padding: 10px; z-index: 200; }
          .admin-nav-links.open { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}
