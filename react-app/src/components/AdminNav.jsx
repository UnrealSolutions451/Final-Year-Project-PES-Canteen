import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function AdminNav({ links, logoText = "P.E.S. Canteen — Admin" }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      <style>{`
        .an { background:#03045e; color:#fff; box-shadow:0 3px 8px rgba(0,0,0,.15); position:sticky; top:0; z-index:100; }
        .an-inner { max-width:1100px; margin:0 auto; display:flex; align-items:center; justify-content:space-between; padding:10px 16px; position:relative; gap:12px; }
        .an-logo { font-weight:700; font-size:1.05rem; white-space:nowrap; }
        .an-links { list-style:none; display:flex; gap:4px; flex-wrap:wrap; }
        .an-link { color:#fff; text-decoration:none; font-weight:500; padding:6px 11px; border-radius:6px; display:block; font-size:.95rem; transition:background .15s; }
        .an-link:hover { background:rgba(255,255,255,.1); }
        .an-link.active { color:#FFD166; font-weight:700; }
        .an-burger { display:none; font-size:1.5rem; background:none; border:none; color:#fff; cursor:pointer; padding:2px 6px; line-height:1; }
        .an-logout { background:#d22c27; color:#fff; border:none; padding:7px 14px; border-radius:20px; cursor:pointer; font-weight:700; font-size:13px; white-space:nowrap; }
        .an-logout:hover { background:#b71c1c; }
        @media (max-width:768px) {
          .an-burger { display:block; }
          .an-links {
            display:none; flex-direction:column; gap:4px;
            position:absolute; top:100%; left:0; right:0;
            background:#03045e; padding:12px 16px;
            box-shadow:0 8px 20px rgba(0,0,0,.25); z-index:300;
          }
          .an-links.open { display:flex; }
          .an-link { padding:10px 12px; font-size:1rem; border-radius:8px; }
        }
      `}</style>
      <nav className="an">
        <div className="an-inner">
          <div className="an-logo">{logoText}</div>
          <button className="an-burger" onClick={() => setOpen(o => !o)} aria-label="Menu">☰</button>
          <ul className={`an-links${open ? " open" : ""}`}>
            {links.map(({ to, label }) => (
              <li key={to}>
                <Link
                  to={to}
                  className={`an-link${location.pathname === to ? " active" : ""}`}
                  onClick={() => setOpen(false)}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <button className="an-logout" onClick={async () => { await signOut(auth); window.location.href = "/login"; }}>
            Logout
          </button>
        </div>
      </nav>
    </>
  );
}
