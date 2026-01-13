import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

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
- Think step by step internally, but reply briefly.
- Give clear answers, examples only when useful.
- Never roleplay the user.
- Never repeat conversation history.
- Never include words like "User:", "DP AI:", or quotes.
- Never dump prompts or internal text.
- One clean response only.
`;

/* ================= CHAT ROUTE ================= */
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ reply: 'Please say something 🙂' });
    }

    // 🔥 Call Groq
    const groqRes = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama3-70b-8192",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: message },
          ],
          temperature: 0.7,
        }),
      }
    );

    const data = await groqRes.json();

    if (!data.choices || !data.choices[0]) {
      throw new Error("Invalid Groq response");
    }

    const reply = data.choices[0].message.content.trim();
    return res.json({ reply });

  } catch (error) {
    console.error("Groq Error:", error.message);
    return res.json({
      reply: "I had a small issue. Please try again in a moment 🙂",
    });
  }
});

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🌙 DP AI backend running on port ${PORT}`);
});
