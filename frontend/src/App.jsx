import { useState, useEffect } from "react";
import Login from "./Login";
import Chat from "./Chat";

function App() {
  // ================= AUTH STATE =================
  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(true);

  // ================= LOAD FROM STORAGE =================
  useEffect(() => {
    const savedEmail = localStorage.getItem("dp-ai-email");
    if (savedEmail) {
      setEmail(savedEmail);
    }
    setLoading(false);
  }, []);

  // ================= LOGIN HANDLER =================
  const handleLogin = (userEmail) => {
    localStorage.setItem("dp-ai-email", userEmail);

    /**
     * 🔥 IMPORTANT
     * sessionId === email
     * backend memory works on this
     */
    localStorage.setItem("dp-ai-session", userEmail);

    setEmail(userEmail);
  };

  // ================= LOGOUT HANDLER =================
  const handleLogout = () => {
    localStorage.removeItem("dp-ai-email");
    localStorage.removeItem("dp-ai-session");

    /**
     * ⚠️ Chats UI clear
     * Backend memory stays (Option 2)
     */
    setEmail(null);
  };

  // ================= LOADING STATE =================
  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#020617",
          color: "#f472b6",
          fontSize: 18,
        }}
      >
        Loading DP AI 🌙
      </div>
    );
  }

  // ================= RENDER =================
  return email ? (
    <Chat
      username={email}        // email used everywhere
      sessionId={email}       // 🔥 SAME AS EMAIL
      onLogout={handleLogout}
    />
  ) : (
    <Login onLogin={handleLogin} />
  );
}

export default App;
