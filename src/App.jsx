import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { redirectToCognitoLogin } from "./login";
import Callback from "./Callback.jsx";
import Upload from "./Upload.jsx";

function Home() {
  const isLoggedIn = !!localStorage.getItem("id_token");

  return (
    <div className="page">
      <h1 className="page__title">MTP File Transfer</h1>

      {isLoggedIn ? (
        <div className="card">
          <div className="btn-group">
            <a href="/upload" className="link">Go to Upload →</a>
            <button
              className="btn btn--secondary"
              onClick={() => {
                localStorage.removeItem("id_token");
                localStorage.removeItem("access_token");
                window.location.href = "/";
              }}
            >
              Log out
            </button>
          </div>
        </div>
      ) : (
        <div className="card">
          <p className="card__subtitle">
            Sign in to upload files.
          </p>
          <button className="btn btn--primary" onClick={redirectToCognitoLogin}>
            Log In
          </button>
        </div>
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