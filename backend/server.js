import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;

/* ================= SESSION MEMORY ================= */
const sessions = {};

/* ================= SYSTEM PROMPT ================= */
const SYSTEM_PROMPT = `
You are DP AI 🌙 — a smart, calm, friendly AI assistant.

Identity rules (STRICT):
- Your name is DP AI.
- You were created by Divy.
- NEVER mention OpenAI, Google, Meta, Microsoft, or any company.
- If asked "who created you" → reply exactly:
  "I was created by Divy."
- If asked "who are you" → reply:
  "I am DP AI, created by Divy."

Style:
- Friendly
- Uses emojis naturally 😊
- Short, clear replies
- One reply only
`;

/* ================= SESSION HANDLER ================= */
function getSession(sessionId) {
  if (!sessions[sessionId]) {
    sessions[sessionId] = {
      name: null,
      likes: [],
      history: [], // <-- WILL STORE OBJECTS, NOT STRINGS
    };
  }
  return sessions[sessionId];
}

/* ================= CHAT ROUTE ================= */
app.post("/chat", async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || !sessionId) {
      return res.status(400).json({ reply: "Invalid request 😕" });
    }

    const memory = getSession(sessionId);
    const lower = message.toLowerCase();

    /* ===== MEMORY EXTRACTION ===== */
    const nameMatch = message.match(/my name is (.+)/i);
if (nameMatch) {
  memory.name = nameMatch[1].trim();
}


    if (lower.includes("what is my name")) {
      return res.json({
        reply: memory.name
          ? `Your name is ${memory.name} 😊`
          : "You haven’t told me your name yet 🙂",
      });
    }

    /* ===== BUILD GROQ MESSAGES ===== */
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...memory.history,
      { role: "user", content: message },
    ];

    const groqRes = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages,
          temperature: 0.7,
        }),
      }
    );

    const data = await groqRes.json();

    if (!data.choices || !data.choices[0]) {
      throw new Error("Invalid Groq response");
    }

    const reply = data.choices[0].message.content;

    /* ===== SAVE MEMORY (OBJECT FORMAT ONLY) ===== */
    memory.history.push({ role: "user", content: message });
    memory.history.push({ role: "assistant", content: reply });

    // limit memory
    if (memory.history.length > 10) {
      memory.history = memory.history.slice(-10);
    }

    return res.json({ reply });
  } catch (err) {
    console.error("Groq Error:", err.message);
    return res.json({
      reply: "I had a small issue. Please try again in a moment 🙂",
    });
  }
});

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("🌙 DP AI backend running on port", PORT);
  console.log("GROQ KEY EXISTS:", !!GROQ_API_KEY);
});
