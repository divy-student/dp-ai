import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

const sessions = {};

const SYSTEM_PROMPT = `
You are DP AI 🌙.

Rules:
- Your name is DP AI.
- You were created by Divy.
- NEVER mention OpenAI, Google, Meta, Microsoft.
- Be calm, helpful, concise.
`;

function getSession(id) {
  if (!sessions[id]) {
    sessions[id] = { history: [] };
  }
  return sessions[id];
}

app.post("/chat", async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    if (!message || !sessionId) {
      return res.json({ reply: "Invalid request." });
    }

    const text = message.toLowerCase();

    // ✅ HARD RULES (NO AI CALL)
    if (text.includes("who are you")) {
      return res.json({ reply: "I am DP AI, created by Divy." });
    }

    if (text.includes("who created you")) {
      return res.json({ reply: "I was created by Divy." });
    }

    const session = getSession(sessionId);
    session.history.push(message);
    if (session.history.length > 6) session.history.shift();

    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...session.history.map((m) => ({
              role: "user",
              content: m,
            })),
          ],
          temperature: 0.6,
        }),
      }
    );

    const data = await groqResponse.json();

    let reply = "I’m here with you 🙂";

if (
  data &&
  data.choices &&
  data.choices.length > 0 &&
  data.choices[0].message &&
  data.choices[0].message.content
) {
  reply = data.choices[0].message.content.trim();
} else {
  console.error("Groq Invalid Response:", JSON.stringify(data));
}


    return res.json({ reply });
  } catch (err) {
    console.error("CHAT ERROR:", err);
    return res.json({
      reply: "I had a small issue. Please try again in a moment 🙂",
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("🌙 DP AI backend running on port", PORT);
});
