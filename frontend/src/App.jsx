import { useState } from "react";
import Login from "./Login";
import Chat from "./Chat";

function App() {
  const [email, setEmail] = useState(
    localStorage.getItem("dp-ai-email")
  );

  const handleLogin = (email) => {
    localStorage.setItem("dp-ai-email", email);
    setEmail(email);
  };

  const handleLogout = () => {
    localStorage.removeItem("dp-ai-email");
    localStorage.removeItem("dp-ai-session");
    setEmail(null);
  };

  return email ? (
    <Chat username={email} onLogout={handleLogout} />
  ) : (
    <Login onLogin={handleLogin} />
  );
}

export default App;
