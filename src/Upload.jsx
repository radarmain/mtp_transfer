import React, { useState } from "react";

export default function Upload() {
  if (!localStorage.getItem("id_token")) {
    window.location.href = "/";
    return null;
  }
  
  const [status, setStatus] = useState("");

  async function onUpload(e) {
    e.preventDefault();
    const file = e.target.file.files[0];
    if (!file) return;

    setStatus("Requesting upload URL...");

    const presignResp = await fetch("/api/presign-upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("id_token") || ""}`,
      },
      body: JSON.stringify({ filename: file.name, contentType: file.type }),
    });

    const presignJson = await presignResp.json();
    if (!presignResp.ok) {
      setStatus(`Presign failed: ${presignJson.error || "unknown error"}`);
      return;
    }

    setStatus("Uploading to S3...");

    const putResp = await fetch(presignJson.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });

    if (!putResp.ok) {
      const errText = await putResp.text();
      setStatus(`Upload failed: ${putResp.status}\n${errText}`);
      return;
    }

    setStatus(`Uploaded ✅ Key: ${presignJson.key}`);
  }

  return (
    <div className="page">
      <h1 className="page__title">Upload</h1>

      <form onSubmit={onUpload} className="upload-form">
        <div className="form-group">
          <label className="form-label" htmlFor="file">Choose a file</label>
          <input
            id="file"
            name="file"
            type="file"
            className="file-input"
          />
        </div>
        <button type="submit" className="btn btn--primary">
          Upload
        </button>
      </form>

      {status && (
        <p className={`status ${status.includes("Uploaded") ? "status--success" : status.includes("failed") ? "status--error" : ""}`}>
          {status}
        </p>
      )}
    </div>
  );
}