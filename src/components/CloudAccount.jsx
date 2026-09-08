import React, { useState } from "react";
import { signIn, signUp } from "../lib/cloud.js";

export default function CloudAccount({ session, syncStatus, onSignedIn, onSignOut }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async () => {
    if (!email.trim() || password.length < 6) return setMessage("Enter your email and a password with at least 6 characters.");
    setBusy(true); setMessage("");
    try {
      const result = mode === "signup" ? await signUp(email.trim(), password) : await signIn(email.trim(), password);
      if (result?.access_token) { setMessage("Connected. Kovo is syncing this device."); onSignedIn?.(result); }
      else setMessage("Account created. Check your email to confirm it, then sign in here.");
    } catch (e) { setMessage(e.message); }
    finally { setBusy(false); }
  };

  if (session?.user) return <div className="cloud-card"><strong>{session.user.email}</strong><span>{syncStatus || "Cloud sync active"}</span><button onClick={onSignOut}>Sign out</button></div>;

  return <div className="cloud-login">
    <div className="cloud-login-title">{mode === "signup" ? "Create your Kovo account" : "Sign in to sync Kovo"}</div>
    <div className="cloud-login-copy">Use the same Kovo account on your phone and computer. The first device you connect keeps its existing Kovo data and saves it securely to your account.</div>
    <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
    <input type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" onKeyDown={(e) => e.key === "Enter" && submit()} />
    <div className="cloud-login-actions"><button className="cloud-primary" disabled={busy} onClick={submit}>{busy ? "Working…" : mode === "signup" ? "Create account" : "Sign in"}</button><button disabled={busy} onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setMessage(""); }}>{mode === "signup" ? "I have an account" : "Create account"}</button></div>
    {message && <div className="cloud-message" role="status">{message}</div>}
  </div>;
}
