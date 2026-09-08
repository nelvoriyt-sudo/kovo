import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import CloudAccount from "./components/CloudAccount.jsx";
import { freshSession, getStoredSession, loadCloudData, saveCloudData, signOut } from "./lib/cloud.js";
import "./index.css";

const DATA_KEY = "kovo-finance-data-v2";

function CloudShell() {
  const [session, setSession] = useState(getStoredSession());
  const [ready, setReady] = useState(!getStoredSession());
  const [open, setOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState(getStoredSession() ? "Connecting…" : "Sign in to sync devices");
  const lastLocal = useRef(localStorage.getItem(DATA_KEY) || "");
  const lastCloudUpdate = useRef("");
  const saving = useRef(false);

  const connect = useCallback(async (nextSession = null) => {
    const active = nextSession || await freshSession();
    setSession(active);
    if (!active?.user) { setReady(true); setSyncStatus("Sign in to sync devices"); return; }
    setSyncStatus("Syncing…");
    try {
      const remote = await loadCloudData(active.user.id);
      const localRaw = localStorage.getItem(DATA_KEY);
      if (remote?.data) {
        localStorage.setItem(DATA_KEY, JSON.stringify(remote.data));
        lastLocal.current = JSON.stringify(remote.data);
        lastCloudUpdate.current = remote.updated_at || "";
      } else if (localRaw) {
        lastCloudUpdate.current = await saveCloudData(active.user.id, JSON.parse(localRaw)) || "";
        lastLocal.current = localRaw;
      }
      setSyncStatus("Synced across devices");
    } catch (e) { setSyncStatus(`Sync paused: ${e.message}`); }
    setReady(true);
  }, []);

  useEffect(() => { connect(); }, [connect]);
  useEffect(() => {
    const onAuth = () => connect();
    window.addEventListener("kovo-auth-changed", onAuth);
    return () => window.removeEventListener("kovo-auth-changed", onAuth);
  }, [connect]);

  useEffect(() => {
    if (!session?.user || !ready) return;
    const timer = setInterval(async () => {
      const raw = localStorage.getItem(DATA_KEY) || "";
      if (!raw || raw === lastLocal.current || saving.current) return;
      saving.current = true; setSyncStatus("Saving…");
      try {
        lastCloudUpdate.current = await saveCloudData(session.user.id, JSON.parse(raw)) || lastCloudUpdate.current;
        lastLocal.current = raw; setSyncStatus("Synced across devices");
      } catch (e) { setSyncStatus(`Sync paused: ${e.message}`); }
      finally { saving.current = false; }
    }, 1200);
    return () => clearInterval(timer);
  }, [session, ready]);

  useEffect(() => {
    if (!session?.user || !ready) return;
    const check = async () => {
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
      } catch (e) { setSyncStatus(`Sync paused: ${e.message}`); }
    };
    const timer = setInterval(check, 5000);
    const onVisible = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); };
  }, [session, ready]);

  const logout = () => { signOut(); setSession(null); setOpen(false); setSyncStatus("Sign in to sync devices"); };

  if (!ready) return <div className="cloud-loading">Opening Kovo…</div>;
  return <>
    <App />
    <button className={`cloud-pill ${session?.user ? "connected" : ""}`} onClick={() => setOpen(true)}>{session?.user ? "● Synced" : "Sync devices"}</button>
    {open && <div className="cloud-overlay" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}><div className="cloud-modal"><button className="cloud-close" onClick={() => setOpen(false)} aria-label="Close">×</button><CloudAccount session={session} syncStatus={syncStatus} onSignedIn={(s) => connect(s)} onSignOut={logout} /></div></div>}
  </>;
}

ReactDOM.createRoot(document.getElementById("root")).render(<React.StrictMode><CloudShell /></React.StrictMode>);
