import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;

/* ================= IN-MEMORY STORE ================= */
/* email -> { name, history } */
const users = {};

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

/* ================= USER HANDLER ================= */
function getUser(email) {
  if (!users[email]) {
    users[email] = {
      name: null,
      history: [],
    };
  }
  return users[email];
}

/* ================= CHAT ROUTE ================= */
app.post("/chat", async (req, res) => {
  try {
    const { message, email } = req.body;

    if (!message || !email) {
      return res.status(400).json({ reply: "Invalid request 😕" });
    }

    const user = getUser(email);
    const lower = message.toLowerCase();

    /* ===== NAME MEMORY ===== */
    const nameMatch = message.match(/my name is (.+)/i);
    if (nameMatch) {
      user.name = nameMatch[1].trim();
    }

    if (lower.includes("what is my name")) {
      return res.json({
        reply: user.name
          ? `Your name is ${user.name} 😊`
          : "You haven’t told me your name yet 🙂",
      });
    }

    /* ===== BUILD GROQ MESSAGES ===== */
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...user.history,
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

    if (!data.choices?.[0]?.message?.content) {
      throw new Error("Invalid Groq response");
    }

    const reply = data.choices[0].message.content;

    /* ===== SAVE MEMORY ===== */
    user.history.push({ role: "user", content: message });
    user.history.push({ role: "assistant", content: reply });

    // keep last 12 messages
    if (user.history.length > 12) {
      user.history = user.history.slice(-12);
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
