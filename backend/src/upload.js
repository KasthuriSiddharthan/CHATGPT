import express from "express";
import multer from "multer";
import { createRequire } from "module";
import auth from "./authMiddleware.js";
import Document from "./documentModel.js";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse-fixed");
const mammoth = require("mammoth");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });


// CLEAN TEXT
function cleanText(text) {
  return text.replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
}


// CHUNK TEXT
function chunkText(text, size = 500) {
  const chunks = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}


// CREATE EMBEDDING
async function createEmbedding(text) {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text,
      }),
    });

    const data = await response.json();
    return data?.data?.[0]?.embedding || null;

  } catch (err) {
    console.error("🔥 EMBEDDING ERROR:", err);
    return null;
  }
}



// ----------------- MAIN UPLOAD ROUTE -----------------
router.post("/", auth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    const file = req.file;
    const buffer = file.buffer;

    console.log("\n=================================");
    console.log("📄 File received:", file.originalname);
    console.log("=================================\n");

    let text = "";

    // PDF
    if (file.mimetype === "application/pdf") {
      const data = await pdfParse(buffer, {
        max: 0,
        normalizeWhitespace: true,
        replaceInvalid: true,
      });

      text = cleanText(data.text || "");

      console.log("📄 Extracted PDF text preview:", text.slice(0, 200));

      if (!text || text.length < 20) {
        console.log("❌ PDF extraction failed — EMPTY TEXT.");
        return res.status(400).json({
          success: false,
          error: "PDF text could not be extracted. Upload a clearer PDF.",
        });
      }
    }

    // DOCX
    else if (
      file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result = await mammoth.extractRawText({ buffer });
      text = cleanText(result.value);
    }

    else {
      return res.status(400).json({
        success: false,
        error: "Upload PDF or DOCX only.",
      });
    }


    // DELETE OLD DOCS
    await Document.deleteMany({ userId: req.user._id });


    // CHUNKING
    const rawChunks = chunkText(text, 500);
    console.log("📦 Total Chunks:", rawChunks.length);

    const finalChunks = [];

    // CREATE EMBEDDINGS
    for (let chunk of rawChunks) {
      const embedding = await createEmbedding(chunk);

      if (!embedding) {
        console.log("⚠️ Skipping chunk (embedding failed).");
        continue;
      }

      console.log("✨ Embedding created, length:", embedding.length);

      finalChunks.push({
        text: chunk,
        embedding,
      });
    }

    console.log("🧩 Total chunks with embeddings:", finalChunks.length);


    // SAVE DOCUMENT
    await Document.create({
      userId: req.user._id,
      filename: file.originalname,
      text,
      chunks: finalChunks,
    });

    console.log("🎉 FINAL DOCUMENT SAVED with chunks:", finalChunks.length);

    return res.json({
      success: true,
      message: "Document uploaded successfully!",
    });

  } catch (err) {
    console.error("🚨 UPLOAD ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to process document",
      details: err.toString(),
    });
  }
});

export default router;
