import { useState } from "react";

export default function Login({ onLogin }) {
  const [step, setStep] = useState("email"); // email | otp
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  /* ================= SEND OTP ================= */
  const sendOtp = async () => {
    if (!email.includes("@")) {
      setMsg("Enter a valid email 😕");
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      const res = await fetch(
        "https://dp-ai-backend.onrender.com/auth/send-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        setStep("otp");
        setMsg("OTP sent to your email 📩");
      } else {
        setMsg(data.message || "Failed to send OTP");
      }
    } catch {
      setMsg("Server error 😵");
    } finally {
      setLoading(false);
    }
  };

  /* ================= VERIFY OTP ================= */
  const verifyOtp = async () => {
    if (otp.length < 4) {
      setMsg("Enter valid OTP 😕");
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      const res = await fetch(
        "https://dp-ai-backend.onrender.com/auth/verify-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        onLogin(email); // 🔥 LOGIN SUCCESS
      } else {
        setMsg(data.message || "Invalid OTP ❌");
      }
    } catch {
      setMsg("Server error 😵");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg,#020617,#0f172a)",
        flexDirection: "column",
        gap: 16,
        color: "white",
      }}
    >
      <h1 style={{ color: "#f472b6" }}>DP AI 🌙</h1>

      {step === "email" && (
        <>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            style={{
              padding: 12,
              borderRadius: 10,
              border: "none",
              width: 260,
            }}
          />

          <button
            onClick={sendOtp}
            disabled={loading}
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              border: "none",
              background: "#f472b6",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {loading ? "Sending…" : "Send OTP 🔐"}
          </button>
        </>
      )}

      {step === "otp" && (
        <>
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP"
            style={{
              padding: 12,
              borderRadius: 10,
              border: "none",
              width: 260,
              textAlign: "center",
              letterSpacing: 4,
            }}
          />

          <button
            onClick={verifyOtp}
            disabled={loading}
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              border: "none",
              background: "#22c55e",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {loading ? "Verifying…" : "Verify OTP ✅"}
          </button>
        </>
      )}

      {msg && <p style={{ opacity: 0.8 }}>{msg}</p>}
    </div>
  );
}
