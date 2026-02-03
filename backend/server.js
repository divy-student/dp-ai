import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;

/* ================= IN-MEMORY STORE ================= */
/* nameKey -> { name, history } */
const users = {};

function normalizeName(name) {
  return name.trim().toLowerCase();
}

/* ================= USER HANDLER ================= */
function getUser(nameKey, displayName) {
  if (!users[nameKey]) {
    users[nameKey] = {
      name: displayName,
      history: [],
    };
  }
  return users[nameKey];
}

/* ================= AUTH ROUTES ================= */
app.post("/auth/login", (req, res) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Name required" });
  }

  const key = normalizeName(name);
  const user = getUser(key, name.trim());

  return res.json({
    message: "Logged in",
    name: user.name,
  });
});

app.post("/auth/logout", (req, res) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Name required" });
  }

  const key = normalizeName(name);
  delete users[key];

  return res.json({ message: "Logged out" });
});

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

/* ================= CREATOR RESPONSE ================= */
const CREATOR_REPLY =
  "DPAI was created by Divy Pandey, a Bachelor of Computer Applications student and full-stack developer. It’s a personal AI assistant project built using React, Node.js. This project is made for learning, experimenting, and helping students with coding. GitHub: github.com/divyypandey. Version: 1.0.";

function isCreatorQuestion(text) {
  const lower = text.toLowerCase();
  return (
    lower.includes("who created you") ||
    lower.includes("who is your creator") ||
    lower.includes("who made you") ||
    lower.includes("who is divy") ||
    lower.includes("about developer") ||
    lower.includes("about creator")
  );
}

/* ================= CHAT ROUTE ================= */
app.post("/chat", async (req, res) => {
  try {
    const { message, name } = req.body;

    if (!message || !name || !name.trim()) {
      return res.status(400).json({ reply: "Invalid request 😕" });
    }

    const key = normalizeName(name);
    const user = getUser(key, name.trim());
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

    if (isCreatorQuestion(message)) {
      return res.json({ reply: CREATOR_REPLY });
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