import React, { useState } from "react";
import "./Auth.css";
import { useNavigate } from "react-router-dom";
import { signup } from "../api.js";   // ✅ CORRECT IMPORT


export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  const validateForm = () => {
    if (!form.name || !form.email || !form.password) {
      return "Please fill all the fields!";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      return "Enter a valid email!";
    }

    if (form.password.length < 6) {
      return "Password must be at least 6 characters!";
    }

    return "";
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const res = await signup(form);  // ✅ Use API.JS signup

      if (res.success) {
        alert("Signup successful!");
        navigate("/login");
      } else {
        setError(res.msg || "Signup failed. Try again.");
      }
    } catch (err) {
      setError("Server error. Try again.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>ThinkBot</h2>
        <p className="subtitle">Sign up to get started</p>

        {error && <div className="error-box">{error}</div>}

        <input
          className="auth-input"
          placeholder="Name"
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          className="auth-input"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <input
          className="auth-input"
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <button className="auth-btn" onClick={handleSubmit}>
          Sign Up
        </button>

        <p className="switch-text">
          Already have an account?{" "}
          <span onClick={() => navigate("/login")}>Login</span>
        </p>
      </div>
    </div>
  );
}
