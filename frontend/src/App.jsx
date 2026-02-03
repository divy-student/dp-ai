import { useState, useEffect } from "react";
import Login from "./Login";
import Chat from "./Chat";

function App() {
  // ================= AUTH STATE =================
  const [name, setName] = useState(null);
  const [loading, setLoading] = useState(true);

  // ================= LOAD FROM STORAGE =================
  useEffect(() => {
    const savedName = localStorage.getItem("dpai_name");
    if (savedName) {
      setName(savedName);
    }
    setLoading(false);
  }, []);

  // ================= LOGIN HANDLER =================
  const handleLogin = (userName) => {
    localStorage.setItem("dpai_name", userName);
    setName(userName);
  };

  // ================= LOGOUT HANDLER =================
  const handleLogout = async () => {
    const currentName = localStorage.getItem("dpai_name");
    if (currentName) {
      try {
        await fetch("https://dp-ai-backend.onrender.com/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: currentName }),
        });
      } catch {
        // ignore network errors on logout
      }
    }

    localStorage.removeItem("dpai_name");
    setName(null);
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
  return name ? (
    <Chat name={name} onLogout={handleLogout} />
  ) : (
    <Login onLogin={handleLogin} />
  );
}

export default App;