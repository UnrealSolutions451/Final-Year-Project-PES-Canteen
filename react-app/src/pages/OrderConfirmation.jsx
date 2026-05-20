import { useSearchParams } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";

export default function OrderConfirmation() {
  const [searchParams] = useSearchParams();
  const orderCode = searchParams.get("code") || "N/A";

  return (
    <div style={{
      fontFamily: "Arial, sans-serif",
      background: "linear-gradient(135deg, #03045e, #46a0fa)",
      display: "flex", flexDirection: "column", justifyContent: "center",
      alignItems: "center", minHeight: "100vh", margin: 0,
      padding: 20, boxSizing: "border-box",
    }}>
      <div className="oc-notice" style={{
        marginTop: -30, background: "rgba(255,255,255,0.9)",
        padding: "18px 24px", borderRadius: 12,
        boxShadow: "0 4px 15px rgba(0,0,0,0.12)", marginBottom: 20,
        textAlign: "center", maxWidth: 750, fontSize: 20,
        lineHeight: 1.5, color: "#222",
        animation: "fadeIn 0.8s ease-in-out",
      }}>
        📌 Please wait while we prepare your food.
        Once it's ready, your order code will be displayed on the <strong>Pickup Screen</strong> at the counter.
      </div>

      <div className="oc-card" style={{
        marginTop: 10, background: "white", padding: 30,
        borderRadius: 16, boxShadow: "0 6px 22px rgba(0,0,0,0.18)",
        textAlign: "center", width: "100%", maxWidth: 750,
        animation: "fadeIn 0.8s ease-in-out",
      }}>
        <h1 className="oc-title" style={{ color: "#28a745", marginBottom: 12, fontSize: 34 }}>✅ Order Placed!</h1>
        <p className="oc-thanks" style={{ fontSize: 20, margin: "8px 0" }}>Thank you for your order.</p>
        <p className="oc-code" style={{
          fontSize: 30, fontWeight: "bold", color: "#007bff",
          margin: "14px 0", animation: "pulse 1.5s infinite",
        }}>
          Order Code: {orderCode}
        </p>
        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <p className="oc-scan" style={{ fontSize: 20, margin: "8px 0" }}>Scan this QR at Billing Counter</p>
          <div style={{ marginTop: 8 }}>
            <QRCodeCanvas value={orderCode} size={160} />
          </div>
        </div>
      </div>

      <div className="oc-warn" style={{
        marginTop: 18, background: "rgba(255,235,238,0.95)",
        borderLeft: "6px solid #d22c27", color: "#8b0000",
        padding: "14px 18px", borderRadius: 10, maxWidth: 750,
        width: "100%", fontSize: 14, lineHeight: 1.45,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        animation: "fadeIn 1s ease-in-out",
      }}>
        ⚠️ <strong>Warning:</strong> This system actively monitors order activity and records IP addresses and device behavior.
        Any attempt to place fake, repeated, or spam orders will be traced and may lead to strict disciplinary action by the college administration. Please place orders responsibly.
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse  { 0% { transform:scale(1); } 50% { transform:scale(1.06); } 100% { transform:scale(1); } }
        @media(max-width:600px) {
          .oc-notice  { font-size:15px !important; padding:12px 14px !important; }
          .oc-card    { padding:18px 14px !important; }
          .oc-title   { font-size:24px !important; }
          .oc-thanks  { font-size:16px !important; }
          .oc-code    { font-size:22px !important; }
          .oc-scan    { font-size:15px !important; }
          .oc-warn    { font-size:13px !important; }
        }
      `}</style>
    </div>
  );
}
