import React from "react";
import "./InputBox.css";
import SendIcon from "./SendIcon";

export default function InputBox({ value, onChange, onSend, placeholder, disabled }) {
  
  // Handle Enter Key
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!disabled) onSend();   // call API instantly
    }
  };

  return (
    <div className="input-box-wrapper">
      <input
        type="text"
        className="input-box"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}  // <-- IMPORTANT FIX
        placeholder={placeholder}
      />

      <button
        className={`send-btn-icon ${disabled ? "disabled" : ""}`}
        onClick={onSend}
        disabled={disabled}
      >
        <SendIcon size={20} color={disabled ? "#b0b0b0" : "#2563eb"} />
      </button>
    </div>
  );
}
