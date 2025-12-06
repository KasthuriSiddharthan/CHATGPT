import React, { useState } from "react";
import "./Auth.css";
import { useNavigate } from "react-router-dom";
import { login } from "../api.js";   // ✅ CORRECT IMPORT

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const validateForm = () => {
    if (!form.email || !form.password) {
      return "Please fill all the fields!";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      return "Enter a valid email!";
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
      const res = await login(form);   // ⭐ USE API FUNCTION

      if (!res.success) {
        setError(res.msg || "Invalid email or password");
        return;
      }

      localStorage.setItem("token", res.token);
      navigate("/chat");
    } catch (err) {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>ThinkBot</h2>
        <p className="subtitle">Login to your account</p>

        {error && <div className="error-box">{error}</div>}

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
          Login
        </button>

        <p className="switch-text">
          Don’t have an account?{" "}
          <span onClick={() => navigate("/signup")}>Sign up</span>
        </p>
      </div>
    </div>
  );
}
