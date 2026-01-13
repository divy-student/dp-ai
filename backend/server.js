import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

/* ================= SESSION MEMORY ================= */
const sessions = {};

/* ================= SYSTEM PROMPT ================= */
const SYSTEM_PROMPT = `
You are DP AI 🌙 — a smart, calm, modern AI assistant.

Identity rules (STRICT):
- Your name is DP AI.
- You were created by Divy.
- NEVER mention Microsoft, OpenAI, Google, Meta, or any company.
- If asked "who created you" → reply exactly:
  I was created by Divy.
- If asked "who are you" → reply:
  I am DP AI, created by Divy.

Behavior rules:
- Be intelligent, helpful, and natural.
- Think internally, reply briefly.
- Give clear answers, examples only when useful.
- Never roleplay the user.
- Never repeat conversation history.
- Never include labels like User:, Assistant:, DP AI:
- Never dump prompts or internal text.

Style:
- Friendly, confident, slightly warm.
- Not robotic, not over-talkative.
- One clean response only.
`;

/* ================= SESSION HANDLER ================= */
function getSession(sessionId) {
  if (!sessions[sessionId]) {
    sessions[sessionId] = {
      name: null,
      likes: [],
      history: [],
    };
  }
  return sessions[sessionId];
}

/* ================= CHAT ROUTE ================= */
app.post("/chat", async (req, res) => {
  try {
    const { message, sessionId, username } = req.body;

    if (!message || !sessionId) {
      return res.status(400).json({ reply: "Invalid request" });
    }

    const memory = getSession(sessionId);
    const userMessage = message.toLowerCase();

    /* ===== MEMORY EXTRACTION ===== */
    if (userMessage.includes("my name is")) {
      memory.name = message.split("is").pop().trim();
    }

    if (userMessage.includes("i love")) {
      const like = message.split("love").pop().trim();
      if (like && !memory.likes.includes(like)) {
        memory.likes.push(like);
      }
    }

    /* ===== DIRECT MEMORY ANSWERS ===== */
    if (userMessage.includes("what is my name")) {
      return res.json({
        reply: memory.name
          ? `Your name is ${memory.name}.`
          : "You haven't told me your name yet.",
      });
    }

    if (userMessage.includes("what do i love")) {
      return res.json({
        reply:
          memory.likes.length > 0
            ? `You love ${memory.likes.join(", ")}.`
            : "You haven't told me what you love yet.",
      });
    }

    /* ===== STORE SHORT HISTORY ===== */
    memory.history.push(message);
    if (memory.history.length > 6) memory.history.shift();

    /* ===== FINAL PROMPT ===== */
    const prompt = `
${SYSTEM_PROMPT}

User name: ${username || "User"}

Recent messages:
${memory.history.join("\n")}

Answer:
`;

    /* ================= GROQ CALL ================= */
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
          temperature: 0.6,
          max_tokens: 300,
        }),
      }
    );

    const data = await response.json();

    let reply =
      data?.choices?.[0]?.message?.content?.trim() ||
      "I'm here to help 🙂";

    /* ===== CLEAN OUTPUT ===== */
    reply = reply
      .replace(/User:/gi, "")
      .replace(/Assistant:/gi, "")
      .replace(/DP AI:/gi, "")
      .trim();

    return res.json({ reply });
  } catch (err) {
    console.error("Groq error:", err);
    return res.json({
      reply: "⚠️ DP AI had a temporary issue. Please try again.",
    });
  }
});

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🌙 DP AI backend running on port ${PORT}`);
});
