import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

export default function AuthGuard({ children }) {
  const [status, setStatus] = useState("loading"); // loading | ok | redirect
  const location = useLocation();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setStatus("redirect");
        return;
      }
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          setStatus("ok");
        } else {
          setStatus("redirect");
        }
      } catch {
        setStatus("redirect");
      }
    });
    return unsub;
  }, []);

  if (status === "loading") return <div style={{ padding: 40, textAlign: "center" }}>Loading...</div>;
  if (status === "redirect") return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  return children;
}
