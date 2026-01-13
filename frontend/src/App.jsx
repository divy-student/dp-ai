import { useState, useEffect, useRef } from "react";

function App() {
  /* ================= LOGIN ================= */
  const [username, setUsername] = useState(
    localStorage.getItem("dp-ai-username") || ""
  );
  const [loggedIn, setLoggedIn] = useState(!!username);
  const isMobile = window.innerWidth <= 768;


  /* ================= SESSION ================= */
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    if (loggedIn && !sessionId) {
      let id = localStorage.getItem("dp-ai-session");
      if (!id) {
        id = "dp-" + Date.now() + "-" + Math.random().toString(36).slice(2);
        localStorage.setItem("dp-ai-session", id);
      }
      setSessionId(id);
    }
  }, [loggedIn, sessionId]);

  /* ================= CHATS ================= */
  const [chats, setChats] = useState(() => {
    const saved = localStorage.getItem("dp-ai-chats");
    return saved ? JSON.parse(saved) : [];
  });

  const [currentChatId, setCurrentChatId] = useState(null);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const inputRef = useRef(null);
  const bottomRef = useRef(null);

  const currentChat = chats.find((c) => c.id === currentChatId);

  /* ================= PERSIST ================= */
  useEffect(() => {
    localStorage.setItem("dp-ai-chats", JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentChat?.messages, isTyping]);

  useEffect(() => {
    if (chats.length && !currentChatId) {
      setCurrentChatId(chats[0].id);
    }
  }, [chats, currentChatId]);

  /* ================= LOGIN HANDLER ================= */
  const handleLogin = () => {
    if (!username.trim()) return;

    localStorage.setItem("dp-ai-username", username);
    setLoggedIn(true);

    const id = Date.now();
    const chat = {
      id,
      title: "New Chat",
      messages: [
        { from: "ai", text: `Hi ${username} 🌙, I am DP AI. How can I help you?` },
      ],
    };

    setChats([chat]);
    setCurrentChatId(id);
  };

  /* ================= NEW CHAT ================= */
  const newChat = () => {
    const id = Date.now();
    setChats((prev) => [
      {
        id,
        title: "New Chat",
        messages: [{ from: "ai", text: `Hi ${username}, I am DP AI 🌙` }],
      },
      ...prev,
    ]);
    setCurrentChatId(id);
  };

  /* ================= DELETE CHAT ================= */
  const deleteChat = (id) => {
    const updated = chats.filter((c) => c.id !== id);
    setChats(updated);
    if (id === currentChatId) {
      setCurrentChatId(updated.length ? updated[0].id : null);
    }
  };

  /* ================= SEND MESSAGE ================= */
  const sendMessage = async () => {
    if (!input.trim() || !currentChat) return;

    const msg = input;
    setInput("");
    setIsTyping(true);

    setChats((prev) =>
      prev.map((c) =>
        c.id === currentChatId
          ? {
              ...c,
              title: c.messages.length === 1 ? msg : c.title,
              messages: [...c.messages, { from: "user", text: msg }],
            }
          : c
      )
    );

    try {
      const res = await fetch("https://dp-ai-backend.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, sessionId, username }),
      });

      const data = await res.json();

      setChats((prev) =>
        prev.map((c) =>
          c.id === currentChatId
            ? {
                ...c,
                messages: [...c.messages, { from: "ai", text: data.reply }],
              }
            : c
        )
      );
    } catch {
      setChats((prev) =>
        prev.map((c) =>
          c.id === currentChatId
            ? {
                ...c,
                messages: [
                  ...c.messages,
                  { from: "ai", text: "⚠️ DP AI had an issue" },
                ],
              }
            : c
        )
      );
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  /* ================= LOGOUT HANDLE ================= */
  const handleLogout = () => {
  localStorage.removeItem("dp-ai-username");
  localStorage.removeItem("dp-ai-session");
  setUsername("");
  setLoggedIn(false);
  setChats([]);
  setCurrentChatId(null);
};

  /* ================= LOGIN SCREEN ================= */
  if (!loggedIn) {
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
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your name"
          style={{
            padding: 12,
            borderRadius: 10,
            border: "none",
            width: 260,
          }}
        />
        <button
          onClick={handleLogin}
          style={{
            padding: "10px 20px",
            borderRadius: 10,
            border: "none",
            background: "#f472b6",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Start Chat
        </button>
      </div>
    );
  }

  /* ================= CHAT UI ================= */
return (
  <div
    style={{
      height: "100vh",
      display: "flex",
      color: "white",
      backgroundImage: "url('/bg.jpeg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    }}
  >

    {/* SIDEBAR */}
    <div
      style={{
        width: 260,
        background: "rgba(0,0,0,0.6)",
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        borderRight: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <button
        onClick={newChat}
        style={{
          padding: 10,
          borderRadius: 10,
          border: "none",
          background: "#f472b6",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        + New Chat
      </button>

      {chats.map((c) => (
        <div
          key={c.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "8px 10px",
            borderRadius: 8,
            background:
              c.id === currentChatId
                ? "rgba(255,255,255,0.15)"
                : "transparent",
            cursor: "pointer",
          }}
          onClick={() => setCurrentChatId(c.id)}
        >
          <span
            style={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {c.title}
          </span>
          <span
            onClick={(e) => {
              e.stopPropagation();
              deleteChat(c.id);
            }}
            style={{ opacity: 0.6 }}
          >
            🗑️
          </span>
        </div>
      ))}
    </div>

    {/* CHAT AREA */}
    <div
      style={{
        flex: 1,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: "90%",
          maxWidth: 900,
          height: "85%",
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(16px)",
          borderRadius: 20,
          padding: 20,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* HEADER */}
        <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  }}
>
  <h2 style={{ color: "#f472b6" }}>DP AI 🌙</h2>
  <button
    onClick={handleLogout}
    style={{
      background: "transparent",
      color: "#f472b6",
      border: "1px solid #f472b6",
      padding: "6px 12px",
      borderRadius: "8px",
      cursor: "pointer",
    }}
  >
    Logout
  </button>
</div>


        {/* MESSAGES */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {currentChat?.messages.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.from === "user" ? "flex-end" : "flex-start",
                background:
                  m.from === "user"
                    ? "#f472b6"
                    : "rgba(255,255,255,0.15)",
                color: m.from === "user" ? "black" : "white",
                padding: "10px 14px",
                borderRadius: 14,
                maxWidth: "70%",
                lineHeight: 1.6,
              }}
            >
              {m.text}
            </div>
          ))}

          {isTyping && (
            <div style={{ opacity: 0.7, fontStyle: "italic" }}>
              DP AI is typing…
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* INPUT */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 10,
          }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message…"
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 12,
              border: "none",
              outline: "none",
              background: "rgba(0,0,0,0.6)",
              color: "white",
            }}
          />
          <button
            onClick={sendMessage}
            style={{
              padding: "12px 18px",
              borderRadius: 12,
              border: "none",
              background: "#f472b6",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  </div>
);

}

export default App;
