import { useState, useRef } from "react";

export default function Chat({ email, onLogout }) {
  const [messages, setMessages] = useState([
    {
      from: "ai",
      text: `Hi👋, I am DP AI. How can I help you?`,
    },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setInput("");

    setMessages((prev) => [...prev, { from: "user", text: userMsg }]);

    try {
      const res = await fetch("https://dp-ai-backend.onrender.com/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    message: userMsg, // ✅ correct
    email: email,     // ✅ correct
  }),
});


if (!res.ok) {
  throw new Error("Server failed");
}

const data = await res.json();


      setMessages((prev) => [
        ...prev,
        { from: "ai", text: data.reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { from: "ai", text: "⚠️ DP AI had an issue" },
      ]);
    }

    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="chat-container">
      <button onClick={onLogout}>Logout</button>

      <div className="messages">
        {messages.map((m, i) => (
          <div key={i} className={m.from}>
            {m.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        placeholder="Type a message..."
      />
    </div>
  );
}
