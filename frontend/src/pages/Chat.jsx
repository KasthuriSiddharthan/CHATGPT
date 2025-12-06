import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./Chat.css";

import InputBox from "../components/InputBox";
import PlusIcon from "../components/PlusIcon";

const API_BASE = import.meta.env.VITE_API_URL;
console.log("🔥 API BASE =", API_BASE);


export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [input, setInput] = useState("");

  const [file, setFile] = useState(null); // ⭐ SINGLE FILE
  const [fileUploaded, setFileUploaded] = useState(false);

  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const chatEndRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Load chat history
  useEffect(() => {
    fetchHistory();
  }, []);

  // -------------------------------
  // FETCH CHAT HISTORY
  // -------------------------------
  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_BASE}/chat/history`, {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      });

      if (res.data.success) setThreads(res.data.data);
    } catch (err) {
      console.log("History error:", err);
    }
  };

  // -------------------------------
  // LOAD THREAD
  // -------------------------------
  const loadThread = async (id) => {
    try {
      const res = await axios.get(`${API_BASE}/chat/thread/${id}`, {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      });

      if (res.data.success) {
        setActiveThread(id);
        setMessages(res.data.chat.messages);
      }
    } catch (err) {
      console.log("Thread load error:", err);
    }
  };

  // -------------------------------
  // TYPING EFFECT
  // -------------------------------
  const typeWriterEffect = (fullText, cb) => {
    let i = 0;
    const speed = 20;

    const interval = setInterval(() => {
      if (i < fullText.length) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1].content = fullText.substring(0, i + 1);
          return updated;
        });
        i++;
      } else {
        clearInterval(interval);
        cb && cb();
      }
    }, speed);
  };

  // -------------------------------
  // SEND MESSAGE (NORMAL CHAT / DOC ASK)
  // -------------------------------
  const handleUnifiedSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setInput("");
    setIsTyping(true);

    try {
      let res;

      // ⭐ NORMAL CHAT
      if (!fileUploaded) {
        res = await axios.post(
          `${API_BASE}/chat/send`,
          { message: userMsg, threadId: activeThread },
          {
            headers: { Authorization: "Bearer " + localStorage.getItem("token") },
          }
        );

        const aiResponse = res.data.chat.messages.at(-1).content;

        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
        setIsTyping(false);

        typeWriterEffect(aiResponse, () => {
          setActiveThread(res.data.chat._id);
          fetchHistory();
        });
      }

      // ⭐ DOCUMENT QUESTION MODE
      else {
        res = await axios.post(
          `${API_BASE}/api/ask`,
          { question: userMsg },
          {
            headers: { Authorization: "Bearer " + localStorage.getItem("token") },
          }
        );

        const answer = res.data.answer;

        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
        setIsTyping(false);

        typeWriterEffect(answer);
      }
    } catch (err) {
      console.log("Send error:", err);

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠ Error processing request." },
      ]);

      setIsTyping(false);
    }
  };

  // -------------------------------
  // FILE UPLOAD (SINGLE FILE)
  // -------------------------------
  const handleFileUpload = (e) => {
    setFile(e.target.files[0]); // ⭐ SINGLE FILE
  };

  const uploadFile = async () => {
    try {
      const formData = new FormData();
      formData.append("file", file); // MUST MATCH multer.single("file")

      const res = await axios.post(`${API_BASE}/api/upload`, formData, {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
      });

      if (res.data.success) {
        setFileUploaded(true);
        setShowUploadMenu(false);
        setFile(null);

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "📄 Document uploaded successfully!" },
        ]);
      }
    } catch (err) {
      console.log("UPLOAD ERROR:", err);

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠ Failed to upload document." },
      ]);
    }
  };

  // NEW CHAT
  const startNewChat = () => {
    setActiveThread(null);
    setMessages([]);
    setFileUploaded(false);
  };

  // GROUPING THREADS
  const groupedThreads = (() => {
    const groups = {};
    threads.forEach((t) => {
      const date = new Date(t.updatedAt).toDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(t);
    });
    return groups;
  })();

  // -------------------------------
  // UI
  // -------------------------------
  return (
    <div className="chat-wrapper">
      {/* SIDEBAR */}
      <div className="sidebar">
        <h2 className="logo">ThinkBot</h2>

        <button className="new-chat-btn" onClick={startNewChat}>
          <PlusIcon size={18} /> New Chat
        </button>

        <div className="thread-list">
          {Object.keys(groupedThreads).map((label) => (
            <div key={label}>
              <div className="thread-group-label">{label}</div>

              {groupedThreads[label].map((t) => (
                <div
                  key={t._id}
                  className={`thread-item ${activeThread === t._id ? "active" : ""}`}
                  onClick={() => loadThread(t._id)}
                >
                  <div className="thread-title">{t.title}</div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <button
          className="logout-btn"
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/login";
          }}
        >
          Logout
        </button>
      </div>

      {/* MAIN CHAT */}
      <div className="main">
        <div className="chat-box">
          {messages.map((msg, i) => (
            <div key={i} className={`msg-row ${msg.role}`}>
              <div className="msg-card">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="msg-row assistant">
              <div className="typing-card">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          )}

          <div ref={chatEndRef}></div>
        </div>

        {/* INPUT BAR */}
        <div className="input-bar-new">

          {/* + BUTTON */}
          <button
            className="plus-btn"
            onClick={() => setShowUploadMenu(!showUploadMenu)}
          >
            +
          </button>

          {/* UPLOAD MENU */}
          {showUploadMenu && (
            <div className="upload-menu">
              <label className="upload-option">
                📄 Upload document
                <input
                  type="file"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />
              </label>

              {file && (
                <button className="upload-btn" onClick={uploadFile}>
                  Upload 1 file
                </button>
              )}
            </div>
          )}

          <InputBox
            value={input}
            onChange={setInput}
            onSend={handleUnifiedSend}
            placeholder={
              fileUploaded
                ? "Ask something from the document..."
                : "Message AI..."
            }
          />
        </div>
      </div>
    </div>
  );
}
