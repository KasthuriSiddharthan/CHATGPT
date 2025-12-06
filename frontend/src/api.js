const API_BASE = import.meta.env.VITE_API_URL;

/* ---------------- AUTH ---------------- */
export async function signup(userData) {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  return res.json();
}

export async function login(userData) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  return res.json();
}

/* ---------------- CHAT ---------------- */
export async function getThreads() {
  const res = await fetch(`${API_BASE}/chat/history`, {
    headers: { Authorization: "Bearer " + localStorage.getItem("token") },
  });
  return res.json();
}

export async function getThread(threadId) {
  const res = await fetch(`${API_BASE}/chat/thread/${threadId}`, {
    headers: { Authorization: "Bearer " + localStorage.getItem("token") },
  });
  return res.json();
}

export async function sendMessage(message, threadId = null) {
  const res = await fetch(`${API_BASE}/chat/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
    body: JSON.stringify({ message, threadId }),
  });
  return res.json();
}

/* ---------------- SINGLE FILE UPLOAD ---------------- */
export async function uploadDocument(file) {
  const token = localStorage.getItem("token");

  const formData = new FormData();
  formData.append("file", file); // MUST MATCH multer.single("file")

  const res = await fetch(`${API_BASE}/api/upload`, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
    },
    body: formData,
  });

  return res.json();
}

/* ---------------- ASK AI ---------------- */
export async function askAI(question) {
  const res = await fetch(`${API_BASE}/api/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
    body: JSON.stringify({ question }),
  });

  return res.json();
}
