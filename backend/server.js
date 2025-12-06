import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";

import authRoutes from "./src/auth.js";
import chatRoutes from "./src/chat.js";
import uploadRoutes from "./src/upload.js";
import askRoutes from "./src/ask.js";
import authMiddleware from "./src/authMiddleware.js";

const app = express();

app.use(cors({
  origin: "*", 
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.use(express.json());

// ---------- ROUTES ----------
app.use("/auth", authRoutes);          // ❌ NO TOKEN CHECK
app.use("/chat", chatRoutes);
app.use("/api/upload", authMiddleware, uploadRoutes); 
app.use("/api/ask", authMiddleware, askRoutes);

// ---------- DB + Server ----------
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    app.listen(5000, () => console.log("🚀 Server running on port 5000"));
  })
  .catch(err => console.log("❌ DB Error:", err));
