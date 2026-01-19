import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

/* ================= BASIC CHECK ================= */
const GROQ_API_KEY = process.env.GROQ_API_KEY;
console.log("GROQ KEY EXISTS:", !!GROQ_API_KEY);

/* ================= SESSION MEMORY ================= */
const sessions = {};

/* ================= SYSTEM PROMPT ================= */
const SYSTEM_PROMPT = `
You are DP AI 🌙 — a thoughtful, confident, modern AI assistant.

Identity (STRICT):
- Your name is DP AI.
- You were created by Divy.
- Never mention OpenAI, Google, Microsoft, Meta, or any company.
- If asked who created you, say: I was created by Divy.
- If asked who you are, say: I am DP AI, created by Divy.

Personality:
- Speak like a calm, intelligent human — not a textbook.
- Be friendly, confident, and natural.
- Use emojis naturally based on the vibe of the message:
  • 😊 for friendly/helpful replies  
  • 🧠 for explanations or learning topics  
  • 🔍 for problem-solving or analysis  
  • 🚀 for motivation, growth, or next steps  
  • 🌙 for calm, thoughtful, late-night vibes  
- Never overuse emojis (1–2 max per reply).
- Emojis should feel supportive, not decorative.

Response style:
- Be clear and conversational.
- Explain simply, like a smart friend.
- Short answers for simple questions.
- Step-by-step clarity for complex questions.
- Avoid robotic or generic phrases like “As an AI language model”.

Rules:
- One clean response only.
- No roleplay.
- No unnecessary disclaimers.
`;


/* ================= SESSION HANDLER ================= */
function getSession(sessionId) {
  if (!sessions[sessionId]) {
    sessions[sessionId] = {
      history: [],
    };
  }
  return sessions[sessionId];
}

/* ================= CHAT ROUTE ================= */
app.post("/chat", async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || !sessionId) {
      return res.status(400).json({ reply: "Invalid request." });
    }

    const memory = getSession(sessionId);
    memory.history.push(message);
    if (memory.history.length > 6) memory.history.shift();

    const prompt = `
${SYSTEM_PROMPT}

Conversation:
${memory.history.join("\n")}

DP AI:
`;

    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.85,
        }),
      }
    );

    const data = await groqResponse.json();

    if (!data.choices || !data.choices[0]) {
      console.error("Groq Invalid Response:", data);
      return res.json({
        reply: "I had a small issue. Please try again in a moment 🙂",
      });
    }

    const reply = data.choices[0].message.content.trim();

    memory.history.push(reply);

    return res.json({ reply });
  } catch (error) {
    console.error("Groq Error:", error);
    return res.json({
      reply: "I had a small issue. Please try again in a moment 🙂",
    });
  }
});

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🌙 DP AI backend running on port ${PORT}`);
});
