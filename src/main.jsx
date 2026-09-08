import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import CloudAccount from "./components/CloudAccount.jsx";
import { freshSession, getStoredSession, loadCloudData, saveCloudData, signOut } from "./lib/cloud.js";
import "./index.css";

const DATA_KEY = "kovo-finance-data-v2";

function CloudShell() {
  const [session, setSession] = useState(getStoredSession());
  const [authReady, setAuthReady] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState("Opening Kovo…");
  const lastLocal = useRef(localStorage.getItem(DATA_KEY) || "");
  const lastCloudUpdate = useRef("");
  const saving = useRef(false);

  const connect = useCallback(async (nextSession = null) => {
    setSyncStatus("Syncing…");
    const active = nextSession || await freshSession();
    setSession(active);
    if (!active?.user) {
      setAuthReady(true);
      setSyncStatus("Sign in required");
      return;
    }
    try {
      const remote = await loadCloudData(active.user.id);
      const localRaw = localStorage.getItem(DATA_KEY);
      if (remote?.data) {
        const remoteRaw = JSON.stringify(remote.data);
        localStorage.setItem(DATA_KEY, remoteRaw);
        lastLocal.current = remoteRaw;
        lastCloudUpdate.current = remote.updated_at || "";
      } else if (localRaw) {
        lastCloudUpdate.current = await saveCloudData(active.user.id, JSON.parse(localRaw)) || "";
        lastLocal.current = localRaw;
      }
      setSyncStatus("Synced");
    } catch (e) {
      setSyncStatus(`Sync paused: ${e.message}`);
    }
    setAuthReady(true);
  }, []);

  useEffect(() => { connect(); }, [connect]);

  useEffect(() => {
    const onAuth = () => connect();
    window.addEventListener("kovo-auth-changed", onAuth);
    return () => window.removeEventListener("kovo-auth-changed", onAuth);
  }, [connect]);

  useEffect(() => {
    if (!session?.user || !authReady) return;
    const push = async () => {
      const raw = localStorage.getItem(DATA_KEY) || "";
      if (!raw || raw === lastLocal.current || saving.current) return;
      saving.current = true;
      setSyncStatus("Saving…");
      try {
        lastCloudUpdate.current = await saveCloudData(session.user.id, JSON.parse(raw)) || lastCloudUpdate.current;
        lastLocal.current = raw;
        setSyncStatus("Synced");
      } catch (e) {
        setSyncStatus(`Sync paused: ${e.message}`);
      } finally {
        saving.current = false;
      }
    };
    const timer = setInterval(push, 900);
    return () => clearInterval(timer);
  }, [session, authReady]);

  useEffect(() => {
    if (!session?.user || !authReady) return;
    const pull = async () => {
      if (saving.current) return;
      try {
        const remote = await loadCloudData(session.user.id);
        if (remote?.data && remote.updated_at && remote.updated_at !== lastCloudUpdate.current) {
          const remoteRaw = JSON.stringify(remote.data);
          const localRaw = localStorage.getItem(DATA_KEY) || "";
          lastCloudUpdate.current = remote.updated_at;
          if (remoteRaw !== localRaw) {
            localStorage.setItem(DATA_KEY, remoteRaw);
            lastLocal.current = remoteRaw;
            window.location.reload();
          }
        }
      } catch (e) {
        setSyncStatus(`Sync paused: ${e.message}`);
      }
    };
    const timer = setInterval(pull, 4000);
    const onVisible = () => document.visibilityState === "visible" && pull();
    const onOnline = () => pull();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
    };
  }, [session, authReady]);

  const logout = () => {
    signOut();
    setSession(null);
    setAccountOpen(false);
    setSyncStatus("Sign in required");
  };

  if (!authReady) return <div className="kovo-boot"><div className="auth-mark">K<span>↗</span>vo</div><div>Opening your Kovo…</div></div>;

  if (!session?.user) {
    return <main className="auth-page">
      <section className="auth-story" aria-hidden="true">
        <div className="auth-brand">K<span>↗</span>vo</div>
        <div className="auth-story-copy">
          <div className="auth-eyebrow">Your money, in one calm place</div>
          <h1>See where you are.<br />Know what comes next.</h1>
          <p>Kovo brings your spending, budgets, bills, goals, and net worth together without turning your finances into noise.</p>
        </div>
        <div className="auth-trust">Private by account · Automatic cloud sync</div>
      </section>
      <section className="auth-panel">
        <CloudAccount session={session} syncStatus={syncStatus} onSignedIn={(s) => connect(s)} />
      </section>
    </main>;
  }

  return <>
    <App />
    <button className="cloud-pill connected" onClick={() => setAccountOpen(true)} aria-label="Open Kovo account">● {syncStatus === "Synced" ? "Synced" : syncStatus}</button>
    {accountOpen && <div className="cloud-overlay" onMouseDown={(e) => e.target === e.currentTarget && setAccountOpen(false)}><div className="cloud-modal"><button className="cloud-close" onClick={() => setAccountOpen(false)} aria-label="Close">×</button><CloudAccount session={session} syncStatus={syncStatus} onSignOut={logout} /></div></div>}
  </>;
}

ReactDOM.createRoot(document.getElementById("root")).render(<React.StrictMode><CloudShell /></React.StrictMode>);
