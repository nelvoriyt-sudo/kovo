import React, { useState } from "react";
import { cloud } from "../lib/cloud.js";

export default function CloudAccount({ session, syncStatus, onSignOut }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async () => {
    if (!email.trim() || password.length < 6) {
      setMessage("Enter your email and a password with at least 6 characters.");
      return;
    }
    setBusy(true); setMessage("");
    const credentials = { email: email.trim(), password };
    const { data, error } = mode === "signup"
      ? await cloud.auth.signUp(credentials)
      : await cloud.auth.signInWithPassword(credentials);
    setBusy(false);
    if (error) { setMessage(error.message); return; }
    if (mode === "signup" && !data.session) setMessage("Account created. Check your email to confirm it, then sign in here.");
    else setMessage("Signed in. Kovo is syncing this device.");
  };

  if (session?.user) return (
    <div className="panel" style={{ display: "grid", gap: 10 }}>
      <div className="panel-title" style={{ marginBottom: 0 }}>Kovo account</div>
      <div className="small">Signed in as <strong>{session.user.email}</strong></div>
      <div className="text-muted small">{syncStatus || "Cloud sync is active. Changes on this device are saved to your Kovo account."}</div>
      <div><button className="btn-primary" onClick={onSignOut}>Sign out</button></div>
    </div>
  );

  return (
    <div className="panel" style={{ display: "grid", gap: 12 }}>
      <div className="panel-title" style={{ marginBottom: 0 }}>{mode === "signup" ? "Create your Kovo account" : "Sign in to Kovo"}</div>
      <div className="text-muted small">Use the same account on your phone and computer to keep your Kovo data in sync. Your existing data on this device is kept when you connect it.</div>
      <input className="field" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input className="field" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" onKeyDown={(e) => { if (e.key === "Enter") submit(); }} />
      <div className="add-form wrap">
        <button className="btn-primary" disabled={busy} onClick={submit}>{busy ? "Working…" : mode === "signup" ? "Create account" : "Sign in"}</button>
        <button className="btn-primary" disabled={busy} onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setMessage(""); }}>{mode === "signup" ? "I already have an account" : "Create an account"}</button>
      </div>
      {message && <div role="status" className="small">{message}</div>}
    </div>
  );
}
