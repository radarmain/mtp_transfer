import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export default function Callback() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const code = params.get("code");

  const [status, setStatus] = useState("Exchanging code...");
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!code) {
      setStatus("No code found in URL.");
      return;
    }

    (async () => {
      const resp = await fetch("http://localhost:3001/api/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = await resp.json();
      setData(json);
      if (resp.ok && json.id_token) {
        localStorage.setItem("id_token", json.id_token);
        localStorage.setItem("access_token", json.access_token);
        window.location.href = "/";
      }
      setStatus(resp.ok ? "Token exchange success." : "Token exchange failed.");
    })();
  }, [code]);

  return (
    <div style={{ padding: "40px" }}>
      <h1>Callback</h1>
      <p>{status}</p>
    </div>
  );
}