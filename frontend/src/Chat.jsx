import { useEffect, useRef, useState } from "react";

export default function Chat({ username, onLogout }) {
  const [sessionId, setSessionId] = useState(null);
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const inputRef = useRef(null);
  const bottomRef = useRef(null);

  const currentChat = chats.find((c) => c.id === currentChatId);

  /* ================= SESSION ================= */
  useEffect(() => {
    let id = localStorage.getItem("dp-ai-session");
    if (!id) {
      id = "dp-" + Date.now() + "-" + Math.random().toString(36).slice(2);
      localStorage.setItem("dp-ai-session", id);
    }
    setSessionId(id);
  }, []);

  /* ================= FIRST CHAT ================= */
  useEffect(() => {
    if (!chats.length) {
      const id = Date.now();
      setChats([
        {
          id,
          title: "New Chat",
          messages: [
            {
              from: "ai",
              text: `Hi ${username} 🌙, I am DP AI. How can I help you?`,
            },
          ],
        },
      ]);
      setCurrentChatId(id);
    }
  }, [username, chats.length]);

  /* ================= SCROLL ================= */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentChat?.messages, isTyping]);

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
        body: JSON.stringify({
          message: msg,
          sessionId,
          username,
        }),
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

  /* ================= UI ================= */
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        color: "white",
        backgroundImage: "url('/bg.jpeg')",
        backgroundSize: "cover",
      }}
    >
      {/* SIDEBAR */}
      <div
        style={{
          width: 260,
          background: "rgba(0,0,0,0.6)",
          padding: 12,
        }}
      >
        <button
          onClick={onLogout}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 10,
            background: "#f472b6",
            fontWeight: "bold",
            border: "none",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>

      {/* CHAT */}
      <div style={{ flex: 1, padding: 20 }}>
        <div style={{ height: "90%", overflowY: "auto" }}>
          {currentChat?.messages.map((m, i) => (
            <div
              key={i}
              style={{
                marginBottom: 10,
                alignSelf: m.from === "user" ? "flex-end" : "flex-start",
                background:
                  m.from === "user"
                    ? "#f472b6"
                    : "rgba(255,255,255,0.15)",
                padding: "10px 14px",
                borderRadius: 14,
                maxWidth: "70%",
              }}
            >
              {m.text}
            </div>
          ))}

          {isTyping && <i>DP AI is typing…</i>}
          <div ref={bottomRef} />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
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
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
