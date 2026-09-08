import React, { useState } from "react";
import { signIn, signUp } from "../lib/cloud.js";

export default function CloudAccount({ session, syncStatus, onSignedIn, onSignOut }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async (e) => {
    e?.preventDefault();
    if (!email.trim() || password.length < 6) return setMessage("Enter a valid email and a password with at least 6 characters.");
    setBusy(true); setMessage("");
    try {
      const result = mode === "signup" ? await signUp(email.trim(), password) : await signIn(email.trim(), password);
      if (result?.access_token) onSignedIn?.(result);
      else setMessage("Account created. Check your email to confirm it, then come back and sign in.");
    } catch (e) { setMessage(e.message); }
    finally { setBusy(false); }
  };

  if (session?.user) return <div className="cloud-card"><div className="account-avatar">{session.user.email?.[0]?.toUpperCase() || "K"}</div><strong>{session.user.email}</strong><span>{syncStatus || "Automatic cloud sync active"}</span><button onClick={onSignOut}>Sign out</button></div>;

  return <div className="auth-form-wrap">
    <div className="auth-mobile-brand">K<span>↗</span>vo</div>
    <div className="cloud-login-title">{mode === "signup" ? "Create your Kovo account" : "Welcome back"}</div>
    <div className="cloud-login-copy">{mode === "signup" ? "Create one account for your financial life. Your Kovo data will follow you securely across your devices." : "Sign in to pick up exactly where you left off."}</div>
    <form className="cloud-login" onSubmit={submit}>
      <label>Email<input type="email" autoCapitalize="none" autoCorrect="off" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></label>
      <label>Password<input type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === "signup" ? "At least 6 characters" : "Your password"} /></label>
      <button className="cloud-primary auth-submit" disabled={busy} type="submit">{busy ? "One moment…" : mode === "signup" ? "Create account" : "Sign in"}</button>
    </form>
    {message && <div className="cloud-message" role="status">{message}</div>}
    <div className="auth-switch">{mode === "signup" ? "Already have an account?" : "New to Kovo?"} <button disabled={busy} onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setMessage(""); }}>{mode === "signup" ? "Sign in" : "Create an account"}</button></div>
    <div className="auth-fineprint">Your login stays securely remembered on this device until you sign out.</div>
  </div>;
}
