import { useState, useEffect, useRef } from "react";
import "./chat.css";

export default function Chat({ name, onLogout }) {
  const [input, setInput] = useState("");
  const [chats, setChats] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [showAbout, setShowAbout] = useState(false);
  const [open, setOpen] = useState(false);

  const bottomRef = useRef(null);

  const storageKey = `chats_${(name || "").trim().toLowerCase()}`;

  /* ================= LOAD ================= */
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(storageKey)) || [];

    if (saved.length) {
      setChats(saved);
      setCurrentId(saved[0].id);
    } else {
      const first = {
        id: Date.now(),
        title: "New Chat",
        messages: [],
      };
      setChats([first]);
      setCurrentId(first.id);
    }
  }, []);

  /* ================= SAVE ================= */
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(chats));
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

  const currentChat = chats.find((c) => c.id === currentId) || chats[0];

  /* ================= SEND ================= */
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setInput("");

    updateMessages({ from: "user", text: userMsg });

    if (currentChat.title === "New Chat") {
      updateTitle(userMsg.slice(0, 25));
    }

    try {
      const res = await fetch("https://dp-ai-backend.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, name }),
      });

      const data = await res.json();
      updateMessages({ from: "ai", text: data.reply });
    } catch {
      updateMessages({ from: "ai", text: "⚠ DP AI had an issue" });
    }

    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  /* ================= HELPERS ================= */
  const updateMessages = (msg) => {
    setChats((prev) =>
      prev.map((c) =>
        c.id === currentId ? { ...c, messages: [...c.messages, msg] } : c
      )
    );
  };

  const deleteChat = (id) => {
    const filtered = chats.filter((c) => c.id !== id);
    setChats(filtered);

    if (currentId === id && filtered.length) {
      setCurrentId(filtered[0].id);
    }
  };

  const updateTitle = (title) => {
    setChats((prev) =>
      prev.map((c) => (c.id === currentId ? { ...c, title } : c))
    );
  };

  const handleLogout = () => {
    localStorage.removeItem(storageKey);
    setChats([]);
    setCurrentId(null);
    onLogout();
  };

  /* ================= UI ================= */
  return (
    <div className="app">

      {/* ===== Mobile Header ===== */}
      <div className="mobileHeader">
        <button className="hamburger" onClick={() => setOpen(!open)}>
          ☰
        </button>

        <div className="title">DP AI</div>

        <button className="logout" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div
        className={`sidebarOverlay ${open ? "show" : ""}`}
        onClick={() => setOpen(false)}
      />

      {/* ===== Sidebar ===== */}
      <div className={`sidebar ${open ? "open" : ""}`}>
        <button className="newChat" onClick={() => { createNewChat(); setOpen(false); }}>
          + New Chat
        </button>

        <div className="history">
          {chats.map((c) => (
            <div
              key={c.id}
              className={`historyItem ${c.id === currentId ? "active" : ""}`}
              onClick={() => { setCurrentId(c.id); setOpen(false); }}
            >
              {c.title}
            </div>
          ))}
        </div>
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
