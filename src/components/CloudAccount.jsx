import React, { useState } from "react";
import { requestPasswordReset, signIn, signUp, resendVerification } from "../lib/cloud.js";

const recoveryButtonStyle = {
  background: "transparent",
  border: 0,
  color: "#2c5c3e",
  cursor: "pointer",
  font: "700 12px Manrope, system-ui",
  marginTop: 8,
  padding: 0,
};

const localModeWrapStyle = {
  borderTop: "1px solid #dce2dc",
  marginTop: 22,
  paddingTop: 20,
};

const localModeButtonStyle = {
  background: "#eef2ed",
  border: "1px solid #cbd5cc",
  borderRadius: 6,
  color: "#274432",
  cursor: "pointer",
  font: "700 13px Manrope, system-ui",
  padding: "10px 12px",
  width: "100%",
};

const localModeCopyStyle = {
  color: "#7b887f",
  fontSize: 11.5,
  lineHeight: 1.5,
  marginTop: 10,
};

export default function CloudAccount({ session, syncStatus, onSignedIn, onSignOut, onContinueLocally }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const normalizedEmail = email.trim();

  const submit = async (event) => {
    event?.preventDefault();

    if (!normalizedEmail || password.length < 6) {
      setMessage("Enter a valid email and a password with at least 6 characters.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const result = mode === "signup"
        ? await signUp(normalizedEmail, password)
        : await signIn(normalizedEmail, password);

      if (result?.access_token) onSignedIn?.(result);
      else setMessage("Account created. Check your email to confirm it, then come back and sign in.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  const sendPasswordReset = async () => {
    if (!normalizedEmail) {
      setMessage("Enter your email first, then request a password reset.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      await requestPasswordReset(normalizedEmail);
      setMessage("Password reset email requested. If email delivery is configured, check your inbox.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  const switchMode = () => {
    setMode(mode === "signup" ? "signin" : "signup");
    setMessage("");
  };

  if (session?.user) {
    return (
      <div className="cloud-card">
        <div className="account-avatar">{session.user.email?.[0]?.toUpperCase() || "K"}</div>
        <strong>{session.user.email}</strong>
        <span>{syncStatus || "Automatic cloud sync active"}</span>
        <button onClick={onSignOut}>Sign out</button>
      </div>
    );
  }

  return (
    <div className="auth-form-wrap">
      <div className="auth-mobile-brand">K<span>↗</span>vo</div>
      <div className="cloud-login-title">{mode === "signup" ? "Create your Kovo account" : "Welcome back"}</div>
      <div className="cloud-login-copy">
        {mode === "signup"
          ? "Create one account for your financial life. Your Kovo data will follow you securely across your devices."
          : "Sign in to pick up exactly where you left off."}
      </div>
      <form className="cloud-login" onSubmit={submit}>
        <label>
          Email
          <input
            type="email"
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
          />
        </label>
        <button className="cloud-primary auth-submit" disabled={busy} type="submit">
          {busy ? "One moment…" : mode === "signup" ? "Create account" : "Sign in"}
        </button>
      </form>
      <button style={recoveryButtonStyle} disabled={busy} type="button" onClick={async()=>{if(!normalizedEmail){setMessage('Enter your email first.');return;}setBusy(true);try{await resendVerification(normalizedEmail);setMessage('Verification email requested. Check your inbox and spam folder.');}catch(error){setMessage(error.message);}finally{setBusy(false);}}}>Resend verification email</button>
      {mode === "signin" && (
        <button style={recoveryButtonStyle} disabled={busy} onClick={sendPasswordReset} type="button">
          Forgot password?
        </button>
      )}
      {message && <div className="cloud-message" role="status">{message}</div>}
      <div className="auth-switch">
        {mode === "signup" ? "Already have an account?" : "New to Kovo?"}{" "}
        <button disabled={busy} onClick={switchMode} type="button">
          {mode === "signup" ? "Sign in" : "Create an account"}
        </button>
      </div>
      {onContinueLocally && (
        <div style={localModeWrapStyle}>
          <button style={localModeButtonStyle} disabled={busy} onClick={onContinueLocally} type="button">
            Continue on this device for now
          </button>
          <p style={localModeCopyStyle}>Entries stay on this device until you sign in and import them. Keep a backup before clearing browser storage.</p>
        </div>
      )}
      <div className="auth-fineprint">Your login stays securely remembered on this device until you sign out.</div>
    </div>
  );
}
