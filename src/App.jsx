import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { redirectToCognitoLogin } from "./login";
import Callback from "./Callback.jsx";
import Upload from "./Upload.jsx";

function Home() {
  const isLoggedIn = !!localStorage.getItem("id_token");

  return (
    <div style={{ padding: "40px" }}>
      <h1>MTP File Transfer</h1>

      {isLoggedIn ? (
        <div>
          <a href="/upload">Go to Upload</a>
          <button
            onClick={() => {
              localStorage.removeItem("id_token");
              localStorage.removeItem("access_token");
              window.location.href = "/";
            }}
          >
            Log out
          </button>
        </div>
      ) : (
        <button onClick={redirectToCognitoLogin}>Log In</button>
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/callback" element={<Callback />} />
        <Route path="/upload" element={<Upload />} />
      </Routes>
    </BrowserRouter>
  );
}