import mongoose from "mongoose";

const chunkSchema = new mongoose.Schema({
  text: String,
  embedding: [Number],
});

const documentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    filename: String,
    text: String,          // ✅ MAIN DOCUMENT TEXT
    chunks: [chunkSchema], // ✅ ALL CHUNKS + EMBEDDINGS
  },
  { timestamps: true }
);

export default mongoose.model("Document", documentSchema);
