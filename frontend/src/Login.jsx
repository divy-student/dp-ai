import { useState } from "react";

export default function Login({ onLogin }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter your name 🙂");
      return;
    }
    setError("");
    localStorage.setItem("dpai_name", trimmed);
    onLogin(trimmed);
  };

  return (
    <div className="login-container">
      <h1>DP AI 🌙</h1>

      <input
        placeholder="Enter your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button onClick={handleLogin}>Login</button>

      {error && <p style={{ color: "pink" }}>{error}</p>}
    </div>
  );
}
