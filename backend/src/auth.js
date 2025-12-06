import express from "express";
import User from "./userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const router = express.Router();

// ---------------- SIGNUP ----------------
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.json({ success: false, msg: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hashed });

    res.json({ success: true, msg: "Signup success" });
  } catch (error) {
    res.json({ success: false, msg: "Signup failed" });
  }
});

// ---------------- LOGIN ----------------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ success: false, msg: "User not found" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.json({ success: false, msg: "Invalid password" });
    }

    if (!process.env.JWT_SECRET) {
      return res.json({ success: false, msg: "JWT_SECRET missing" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      msg: "Login successful",
      token,
      user: { _id: user._id, name: user.name, email: user.email },
    });

  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({
      success: false,
      msg: "Server error during login",
      error: error.message,
    });
  }
});
export default router;
