// backend/src/ask.js

import express from "express";
import Document from "./documentModel.js";
import auth from "./authMiddleware.js";
import mongoose from "mongoose";

const router = express.Router();


// ----------- COSINE SIMILARITY -----------
function cosineSim(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}


// ----------- ASK ROUTE -----------
router.post("/", auth, async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || question.trim().length === 0) {
      return res.status(400).json({ error: "Question is required" });
    }

    console.log("USER:", req.user);
    const userId = req.user._id;
    console.log("USER ID USED =", userId);

    // Get latest uploaded document
    const doc = await Document.findOne({ userId })
      .sort({ updatedAt: -1 })
      .lean();

    if (!doc) {
      return res.json({ answer: "No uploaded document found. Please upload a document first." });
    }

    if (!doc.chunks || doc.chunks.length === 0) {
      return res.json({ answer: "Your document has no readable content. Try another file." });
    }

    // -------- Create embedding for question --------
    const embedResponse = await fetch("https://openrouter.ai/api/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: question
      })
    });

    const embedData = await embedResponse.json();
    const questionEmbedding = embedData?.data?.[0]?.embedding;

    if (!questionEmbedding) {
      return res.json({ answer: "Failed to process question embedding." });
    }

    // -------- Find best matching chunk --------
    let bestChunk = null;
    let bestScore = -1;

    for (const chunk of doc.chunks) {
      const score = cosineSim(questionEmbedding, chunk.embedding);
      if (score > bestScore) {
        bestScore = score;
        bestChunk = chunk.text;
      }
    }

    if (!bestChunk) {
      return res.json({ answer: "No relevant content found in document." });
    }

    // -------- Ask OpenRouter with context --------
    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a helpful AI assistant. Use the provided document context to answer." },
          { role: "user", content: `Context from document:\n${bestChunk}\n\nUser question: ${question}` }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const answer = aiData?.choices?.[0]?.message?.content || "No answer found.";

    return res.json({ answer });

  } catch (err) {
    console.error("ASK ROUTE ERROR:", err);
    return res.status(500).json({ answer: "Error processing request." });
  }
});


export default router;
