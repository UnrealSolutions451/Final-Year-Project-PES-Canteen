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
      <div style={{
        marginTop: -30, background: "rgba(255,255,255,0.9)",
        padding: "18px 24px", borderRadius: 12,
        boxShadow: "0 4px 15px rgba(0,0,0,0.12)", marginBottom: 20,
        textAlign: "center", maxWidth: 750, fontSize: 26,
        lineHeight: 1.5, color: "#222",
        animation: "fadeIn 0.8s ease-in-out",
      }}>
        📌 Please wait while we prepare your food.
        Once it's ready, your order code will be displayed on the <strong>Pickup Screen</strong> at the counter.
      </div>

      <div style={{
        marginTop: 10, background: "white", padding: 30,
        borderRadius: 16, boxShadow: "0 6px 22px rgba(0,0,0,0.18)",
        textAlign: "center", minHeight: 250, width: "100%", maxWidth: 750,
        animation: "fadeIn 0.8s ease-in-out",
      }}>
        <h1 style={{ color: "#28a745", marginBottom: 12, fontSize: 38 }}>✅ Order Placed!</h1>
        <p style={{ fontSize: 26, margin: "8px 0" }}>Thank you for your order.</p>
        <p style={{
          fontSize: 38, fontWeight: "bold", color: "#007bff",
          margin: "14px 0", animation: "pulse 1.5s infinite",
        }}>
          Order Code: {orderCode}
        </p>

        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <p style={{ fontSize: 26, margin: "8px 0" }}>Scan this QR at Billing Counter</p>
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <QRCodeCanvas value={orderCode} size={180} />
          </div>
        </div>
      </div>

      <div style={{
        marginTop: 18, background: "rgba(255,235,238,0.95)",
        borderLeft: "6px solid #d22c27", color: "#8b0000",
        padding: "14px 18px", borderRadius: 10, maxWidth: 750,
        width: "100%", fontSize: 16, lineHeight: 1.45,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        animation: "fadeIn 1s ease-in-out",
      }}>
        ⚠️ <strong>Warning:</strong> This system actively monitors order activity and records IP addresses and device behavior.
        Any attempt to place fake, repeated, or spam orders will be traced and may lead to strict disciplinary action by the college administration. Please place orders responsibly.
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0% { transform:scale(1); } 50% { transform:scale(1.06); } 100% { transform:scale(1); } }
        @media(max-width:600px) { h1 { font-size: 28px !important; } }
      `}</style>
    </div>
  );
}
