import { useState } from "react";
import { askQuestion } from "./api";
import InputBox from "../components/InputBox";

export default function Ask() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const handleAsk = async () => {
    if (!question.trim()) return;

    const res = await askQuestion(question);
    setAnswer(res.answer);
    setQuestion(""); // Clear input after asking
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Ask Questions</h1>

      <InputBox
        value={question}
        onChange={setQuestion}
        onSend={handleAsk}
        placeholder="Ask a question..."
        disabled={!question.trim()}
      />

      <h3 style={{ marginTop: "20px" }}>Answer:</h3>
      <pre>{answer}</pre>
    </div>
  );
}
