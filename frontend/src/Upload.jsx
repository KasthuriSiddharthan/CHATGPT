import { useState } from "react";
import { uploadDocument } from "../api";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [response, setResponse] = useState("");

  const handleUpload = async () => {
    if (!file) {
      alert("Select a file first!");
      return;
    }
    const res = await uploadDocument(file);
    setResponse(JSON.stringify(res, null, 2));
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Upload Document</h2>

      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleUpload}>Upload</button>

      <pre>{response}</pre>
    </div>
  );
}
