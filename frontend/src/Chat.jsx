import { useState, useEffect, useRef } from "react";
import "./chat.css";

export default function Chat({ email, onLogout }) {
  const [input, setInput] = useState("");

  const [chats, setChats] = useState([]);
  const [currentId, setCurrentId] = useState(null);

  const bottomRef = useRef(null);

  /* ================= LOAD SAVED ================= */
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("dp-ai-chats")) || [];
    setChats(saved);

    if (saved.length) setCurrentId(saved[0].id);
    else createNewChat();
  }, []);

  /* ================= SAVE ================= */
  useEffect(() => {
    localStorage.setItem("dp-ai-chats", JSON.stringify(chats));
  }, [chats]);

  /* ================= NEW CHAT ================= */
  const createNewChat = () => {
    const newChat = {
      id: Date.now(),
      title: "New Chat",
      messages: [],
    };

    setChats((prev) => [newChat, ...prev]);
    setCurrentId(newChat.id);
  };

  /* ================= GET CURRENT ================= */
  const currentChat = chats.find((c) => c.id === currentId);

  /* ================= SEND ================= */
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setInput("");

    updateMessages({ from: "user", text: userMsg });

    // set title from first message
    if (currentChat.title === "New Chat") {
      updateTitle(userMsg.slice(0, 25));
    }

    try {
      const res = await fetch("https://dp-ai-backend.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          email,
        }),
      });

      const data = await res.json();

      updateMessages({ from: "ai", text: data.reply });
    } catch {
      updateMessages({ from: "ai", text: "⚠️ DP AI had an issue" });
    }

    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  /* ================= HELPERS ================= */
  const updateMessages = (msg) => {
    setChats((prev) =>
      prev.map((c) =>
        c.id === currentId
          ? { ...c, messages: [...c.messages, msg] }
          : c
      )
    );
  };

  const deleteChat = (id) => {
  const filtered = chats.filter((c) => c.id !== id);

  setChats(filtered);

  // if current chat deleted → switch to another
  if (currentId === id && filtered.length) {
    setCurrentId(filtered[0].id);
  }
};


  const updateTitle = (title) => {
    setChats((prev) =>
      prev.map((c) =>
        c.id === currentId ? { ...c, title } : c
      )
    );
  };

  /* ================= UI ================= */
  return (
    <div className="app">

      {/* ===== Sidebar ===== */}
      <div className="sidebar">
        <h2>DP AI 🌙</h2>

        <button className="newChat" onClick={createNewChat}>
          + New Chat
        </button>

        <div className="history">
  {chats.map((c) => (
    <div
      key={c.id}
      className={`historyItem ${c.id === currentId ? "active" : ""}`}
    >
      <span onClick={() => setCurrentId(c.id)}>
        {c.title}
      </span>

      <button
        className="deleteBtn"
        onClick={() => deleteChat(c.id)}
      >
        🗑️
      </button>
    </div>
  ))}
</div>


        <button className="logout" onClick={onLogout}>Logout</button>
      </div>


      {/* ===== Chat Area ===== */}
      <div className="chatArea">
        <div className="messages">
          {currentChat?.messages.map((m, i) => (
            <div key={i} className={`bubble ${m.from}`}>
              {m.text}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="inputArea">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
}
