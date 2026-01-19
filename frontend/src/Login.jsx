import { useState } from "react";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");

  const sendOtp = async () => {
    setError("");
    const res = await fetch("https://dp-ai-backend.onrender.com/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    if (data.message) setStep(2);
    else setError("Server error 😢");
  };

  const verifyOtp = async () => {
    setError("");
    const res = await fetch("https://dp-ai-backend.onrender.com/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });

    const data = await res.json();
    if (data.email) {
      localStorage.setItem("dp-ai-email", email);
      onLogin(email); // 👈 VERY IMPORTANT
    } else {
      setError("Invalid OTP ❌");
    }
  };

  return (
    <div>
      <h1>DP AI 🌙</h1>

      {step === 1 && (
        <>
          <input
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button onClick={sendOtp}>Send OTP 📩</button>
        </>
      )}

      {step === 2 && (
        <>
          <input
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <button onClick={verifyOtp}>Verify OTP ✅</button>
        </>
      )}

      {error && <p>{error}</p>}
    </div>
  );
}
