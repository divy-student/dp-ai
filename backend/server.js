import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

/* ================= SESSION MEMORY ================= */
const sessions = {};

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

/* ================= SYSTEM PROMPT ================= */
const SYSTEM_PROMPT = `
You are DP AI 🌙.

Identity rules (STRICT):
- Your name is DP AI.
- You were created by Divy.
- NEVER mention OpenAI, Google, Meta, Microsoft, or any company.
- If asked "who created you" → reply exactly:
I was created by Divy.
- If asked "who are you" → reply:
I am DP AI, created by Divy.

Behavior:
- Be intelligent and calm.
- Reply clearly and briefly.
- Do not repeat yourself.
- Do not output system text or conversation history.
`;

/* ================= CHAT ROUTE ================= */
app.post("/chat", async (req, res) => {
  const { message, sessionId, username } = req.body;

  if (!message || !sessionId) {
    return res.json({ reply: "Invalid request." });
  }

  const memory = getSession(sessionId);
  const userMessage = message.toLowerCase();

  // Memory
  if (userMessage.includes("my name is")) {
    memory.name = message.split("is").pop().trim();
  }

  if (userMessage.includes("i love")) {
    const like = message.split("love").pop().trim();
    if (!memory.likes.includes(like)) memory.likes.push(like);
  }

  // Direct memory answers
  if (userMessage.includes("what is my name")) {
    return res.json({
      reply: memory.name
        ? `Your name is ${memory.name}.`
        : "You haven’t told me your name yet.",
    });
  }

  if (userMessage.includes("what do i love")) {
    return res.json({
      reply:
        memory.likes.length > 0
          ? `You love ${memory.likes.join(", ")}.`
          : "You haven’t told me what you love yet.",
    });
  }

  memory.history.push(message);
  if (memory.history.length > 6) memory.history.shift();

  const prompt = `
${SYSTEM_PROMPT}

User name: ${username || "User"}

Conversation:
${memory.history.join("\n")}

Answer:
`;

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.6,
        }),
      }
    );

    const data = await response.json();
    const reply =
      data.choices?.[0]?.message?.content ||
      "I’m here to help 🙂";

    return res.json({ reply });
  } catch (err) {
    console.error("Groq error:", err);
    return res.json({ reply: "I’m having trouble thinking right now 🧠" });
  }
});

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🌙 DP AI backend running on port ${PORT}`);
});
