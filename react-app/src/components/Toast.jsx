import { useState, useEffect, useCallback } from "react";

let toastFn = null;

export function showToast(msg = "Done!") {
  if (toastFn) toastFn(msg);
}

export default function Toast() {
  const [msg, setMsg] = useState("");
  const [visible, setVisible] = useState(false);

  const show = useCallback((m) => {
    setMsg(m);
    setVisible(true);
    setTimeout(() => setVisible(false), 1800);
  }, []);

  useEffect(() => {
    toastFn = show;
    return () => { toastFn = null; };
  }, [show]);

  return (
    <div style={{
      position: "fixed",
      bottom: 80,
      left: "50%",
      transform: "translateX(-50%)",
      background: "rgba(0,0,0,0.8)",
      color: "white",
      padding: "10px 20px",
      borderRadius: 20,
      fontSize: "0.9rem",
      opacity: visible ? 1 : 0,
      transition: "opacity 0.3s",
      zIndex: 1000,
      pointerEvents: "none",
    }}>
      {msg}
    </div>
  );
}
