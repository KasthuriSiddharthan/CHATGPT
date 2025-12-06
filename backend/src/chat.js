import dotenv from "dotenv";
dotenv.config();

import express from "express";
import Chat from "./chatModel.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// -------------------- AUTH MIDDLEWARE --------------------
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.sendStatus(403);

  try {
    const data = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = data.id;
    next();
  } catch (err) {
    return res.sendStatus(403);
  }
}

// -------------------- SEND MESSAGE --------------------
router.post("/send", auth, async (req, res) => {
  try {
    const { message, threadId } = req.body;

    console.log("📩 User message:", message);

    // OpenRouter request
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5000",
        "X-Title": "ThinkBot",
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat",
        messages: [{ role: "user", content: message }],
      }),
    });

    const text = await response.text();
    console.log("📡 RAW OpenRouter response:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.json({
        success: true,
        chat: {
          _id: threadId || "new",
          messages: [
            { role: "assistant", content: "⚠ AI could not generate a response." }
          ]
        }
      });
    }

    const aiReply =
      data.choices?.[0]?.message?.content || "No reply from AI.";

    let chat;

    // -------------------- EXISTING THREAD --------------------
    if (threadId) {
      chat = await Chat.findOne({
        _id: threadId,
        userId: req.userId,
      });

      if (!chat) {
        return res.status(404).json({ msg: "Thread not found" });
      }

      chat.messages.push({ role: "user", content: message });
      chat.messages.push({ role: "assistant", content: aiReply });
      chat.updatedAt = new Date();
      await chat.save();

      console.log("💾 Updated chat:", chat._id);
    }

    // -------------------- NEW THREAD --------------------
    else {
      chat = await Chat.create({
        userId: req.userId,
        title: message.substring(0, 40),
        messages: [
          { role: "user", content: message },
          { role: "assistant", content: aiReply },
        ],
      });

      console.log("💾 New chat created:", chat._id);
    }

    res.json({ success: true, chat });

  } catch (err) {
    console.error("🔥 AI ERROR:", err);
    res.status(500).json({ msg: "AI request failed", error: err.message });
  }
});

// -------------------- CHAT HISTORY --------------------
router.get("/history", auth, async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.userId }).sort({
      updatedAt: -1,
    });

    const threads = chats.map((c) => ({
      _id: c._id,
      title: c.title || c.messages[0]?.content || "Untitled",
      lastMessage: c.messages[c.messages.length - 1]?.content || "",
      updatedAt: c.updatedAt,
    }));

    res.json({ success: true, data: threads });
  } catch (err) {
    res.status(500).json({ success: false, msg: "Cannot fetch history" });
  }
});

// -------------------- GET ONE THREAD --------------------
router.get("/thread/:id", auth, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!chat) return res.json({ success: false, msg: "Thread not found" });

    res.json({ success: true, chat });
  } catch (err) {
    res.status(500).json({ success: false, msg: "Cannot fetch thread" });
  }
});

export default router;
