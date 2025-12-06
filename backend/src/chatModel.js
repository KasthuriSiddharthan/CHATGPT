import mongoose from "mongoose";

// Each message inside a chat thread
const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["user", "assistant"],
    required: true
  },
  content: {
    type: String,
    required: true
  }
});

// Chat thread schema
const chatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,   // <-- FIXED: Must be ObjectId
      ref: "User",
      required: true
    },
    title: {
      type: String,
      default: "New Chat"
    },
    messages: [messageSchema]  // Array of messages
  },
  {
    timestamps: true           // Adds createdAt & updatedAt
  }
);

export default mongoose.model("Chat", chatSchema);
