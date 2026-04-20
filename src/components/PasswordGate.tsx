import { useState } from "react";
import logoImg from "../assets/logo.png";
import "./PasswordGate.css";

const SESSION_KEY = "saikawa_unlocked";
const VERIFY_URL = "https://api1-dot-saikawalab-427516.uc.r.appspot.com/api/v1/verify-admin-password";

export default function PasswordGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_KEY) === "1");
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  if (unlocked) return <>{children}</>;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(VERIFY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: input }),
      });
      const data = await res.json();
      if (data.authenticated) {
        sessionStorage.setItem(SESSION_KEY, "1");
        setUnlocked(true);
      } else {
        setError(true);
        setInput("");
      }
    } catch {
      setError(true);
      setInput("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pg-backdrop">
      <div className="pg-card">
        <img src={logoImg} alt="Saikawa Lab" className="pg-logo" />
        <h1 className="pg-title">Saikawa Lab Admin</h1>
        <p className="pg-subtitle">Enter the passcode to continue</p>
        <form onSubmit={handleSubmit} className="pg-form">
          <input
            className={`input pg-input${error ? " pg-input-error" : ""}`}
            type="password"
            placeholder="Passcode"
            value={input}
            autoFocus
            disabled={loading}
            onChange={(e) => { setInput(e.target.value); setError(false); }}
          />
          {error && <p className="pg-error">Incorrect passcode. Try again.</p>}
          <button className="btn-primary pg-btn" type="submit" disabled={loading || !input}>
            {loading ? "Verifying…" : "Unlock"}
          </button>
        </form>
      </div>
    </div>
  );
}
