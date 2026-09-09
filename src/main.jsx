import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import CloudAccount from "./components/CloudAccount.jsx";
import QuickTipLogger from "./components/QuickTipLogger.jsx";
import { freshSession, getStoredSession, loadCloudData, saveCloudData, signOut } from "./lib/cloud.js";
import "./index.css";

const DATA_KEY = "kovo-finance-data-v2";
const REVISION_KEY = "kovo-cloud-revision-v1";
const PENDING_SYNC_KEY = "kovo-pending-sync-v1";
const SAVE_CHECK_INTERVAL_MS = 900;
const CLOUD_PULL_INTERVAL_MS = 4000;

function parseJson(value, fallback = null) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function readRevision() {
  return Number(localStorage.getItem(REVISION_KEY) || 0);
}

function writeRevision(revision) {
  localStorage.setItem(REVISION_KEY, String(Number(revision || 0)));
}

function persistPendingSync(raw, reason = "local-change") {
  if (!raw) return;

  localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify({
    raw,
    reason,
    savedAt: new Date().toISOString(),
  }));
}

function clearPendingSync() {
  localStorage.removeItem(PENDING_SYNC_KEY);
}

function readPendingSync() {
  return parseJson(localStorage.getItem(PENDING_SYNC_KEY));
}

function mergeById(localItems = [], cloudItems = []) {
  const merged = new Map();

  cloudItems.forEach((item) => merged.set(item.id, item));
  localItems.forEach((item) => merged.set(item.id, item));

  return Array.from(merged.values());
}

function mergeCategories(localCategories = [], cloudCategories = []) {
  return Array.from(new Set([...cloudCategories, ...localCategories]));
}

function mergeHistory(localHistory = [], cloudHistory = []) {
  const byDate = new Map();

  cloudHistory.forEach((entry) => byDate.set(entry.date, entry));
  localHistory.forEach((entry) => byDate.set(entry.date, entry));

  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function mergeKovoData(localData, cloudData) {
  if (!localData) return cloudData;
  if (!cloudData) return localData;

  return {
    ...cloudData,
    ...localData,
    settings: {
      ...(cloudData.settings || {}),
      ...(localData.settings || {}),
    },
    accounts: mergeById(localData.accounts, cloudData.accounts),
    investments: mergeById(localData.investments, cloudData.investments),
    transactions: mergeById(localData.transactions, cloudData.transactions),
    budgets: mergeById(localData.budgets, cloudData.budgets),
    bills: mergeById(localData.bills, cloudData.bills),
    goals: mergeById(localData.goals, cloudData.goals),
    tipEntries: mergeById(localData.tipEntries, cloudData.tipEntries),
    categories: mergeCategories(localData.categories, cloudData.categories),
    history: mergeHistory(localData.history, cloudData.history),
  };
}

function normalizeSaveResult(result) {
  return {
    saved: Boolean(result?.saved),
    currentRevision: Number(result?.currentRevision || 0),
  };
}

function CloudShell() {
  const [session, setSession] = useState(getStoredSession());
  const [authReady, setAuthReady] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState("Opening Kovo…");
  const lastLocal = useRef(localStorage.getItem(DATA_KEY) || "");
  const currentRevision = useRef(readRevision());
  const saving = useRef(false);

  const saveLocalData = useCallback(async (userId, raw, expectedRevision = currentRevision.current) => {
    const data = parseJson(raw);
    if (!data) return { saved: false, currentRevision: expectedRevision };

    const saveResult = normalizeSaveResult(await saveCloudData(userId, data, expectedRevision));

    if (saveResult.saved) {
      currentRevision.current = saveResult.currentRevision;
      writeRevision(saveResult.currentRevision);
      lastLocal.current = raw;
      clearPendingSync();
    }

    return saveResult;
  }, []);

  const saveWithConflictRecovery = useCallback(async (userId, raw) => {
    const saveResult = await saveLocalData(userId, raw);
    if (saveResult.saved) return saveResult;

    const latestCloud = await loadCloudData(userId);
    const localData = parseJson(raw);
    const mergedData = mergeKovoData(localData, latestCloud?.data);
    const mergedRaw = JSON.stringify(mergedData);

    localStorage.setItem(DATA_KEY, mergedRaw);
    currentRevision.current = Number(latestCloud?.revision || saveResult.currentRevision || 0);
    writeRevision(currentRevision.current);

    return saveLocalData(userId, mergedRaw, currentRevision.current);
  }, [saveLocalData]);

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
      const pendingSync = readPendingSync();

      if (remote?.data) {
        const remoteRaw = JSON.stringify(remote.data);
        currentRevision.current = Number(remote.revision || 0);
        writeRevision(currentRevision.current);

        if (pendingSync?.raw) {
          await saveWithConflictRecovery(active.user.id, pendingSync.raw);
        } else if (localRaw && localRaw !== remoteRaw) {
          const mergedData = mergeKovoData(parseJson(localRaw), remote.data);
          const mergedRaw = JSON.stringify(mergedData);
          localStorage.setItem(DATA_KEY, mergedRaw);
          await saveWithConflictRecovery(active.user.id, mergedRaw);
        } else {
          localStorage.setItem(DATA_KEY, remoteRaw);
          lastLocal.current = remoteRaw;
        }
      } else if (localRaw) {
        await saveWithConflictRecovery(active.user.id, localRaw);
      }

      setSyncStatus(navigator.onLine ? "Synced" : "Offline — changes will sync");
    } catch (error) {
      const raw = localStorage.getItem(DATA_KEY);
      persistPendingSync(raw, "startup-sync-failed");
      setSyncStatus(`Sync paused: ${error.message}`);
    }

    setAuthReady(true);
  }, [saveWithConflictRecovery]);

  useEffect(() => { connect(); }, [connect]);

  useEffect(() => {
    const onAuth = () => connect();
    window.addEventListener("kovo-auth-changed", onAuth);
    return () => window.removeEventListener("kovo-auth-changed", onAuth);
  }, [connect]);

  useEffect(() => {
    if (!session?.user || !authReady) return;

    const pushLocalChanges = async () => {
      const raw = localStorage.getItem(DATA_KEY) || "";
      const pendingSync = readPendingSync();
      const rawToSave = pendingSync?.raw || raw;

      if (!rawToSave || (raw === lastLocal.current && !pendingSync) || saving.current) return;

      if (!navigator.onLine) {
        persistPendingSync(rawToSave, "offline");
        setSyncStatus("Offline — changes will sync");
        return;
      }

      saving.current = true;
      setSyncStatus("Saving…");

      try {
        await saveWithConflictRecovery(session.user.id, rawToSave);
        setSyncStatus("Synced");
      } catch (error) {
        persistPendingSync(rawToSave, "save-failed");
        setSyncStatus(`Sync paused: ${error.message}`);
      } finally {
        saving.current = false;
      }
    };

    const timer = setInterval(pushLocalChanges, SAVE_CHECK_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [session, authReady, saveWithConflictRecovery]);

  useEffect(() => {
    if (!session?.user || !authReady) return;

    const pullCloudChanges = async () => {
      if (saving.current || !navigator.onLine) return;

      try {
        const remote = await loadCloudData(session.user.id);
        const remoteRevision = Number(remote?.revision || 0);

        if (remote?.data && remoteRevision > currentRevision.current && !readPendingSync()) {
          const remoteRaw = JSON.stringify(remote.data);
          const localRaw = localStorage.getItem(DATA_KEY) || "";

          currentRevision.current = remoteRevision;
          writeRevision(remoteRevision);

          if (remoteRaw !== localRaw) {
            localStorage.setItem(DATA_KEY, remoteRaw);
            lastLocal.current = remoteRaw;
            window.location.reload();
          }
        }
      } catch (error) {
        setSyncStatus(`Sync paused: ${error.message}`);
      }
    };

    const timer = setInterval(pullCloudChanges, CLOUD_PULL_INTERVAL_MS);
    const onVisible = () => document.visibilityState === "visible" && pullCloudChanges();
    const onOnline = () => {
      setSyncStatus("Back online — syncing…");
      pullCloudChanges();
    };

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
    <QuickTipLogger />
    <button className="cloud-pill connected" onClick={() => setAccountOpen(true)} aria-label="Open Kovo account">● {syncStatus === "Synced" ? "Synced" : syncStatus}</button>
    {accountOpen && <div className="cloud-overlay" onMouseDown={(e) => e.target === e.currentTarget && setAccountOpen(false)}><div className="cloud-modal"><button className="cloud-close" onClick={() => setAccountOpen(false)} aria-label="Close">×</button><CloudAccount session={session} syncStatus={syncStatus} onSignOut={logout} /></div></div>}
  </>;
}

ReactDOM.createRoot(document.getElementById("root")).render(<React.StrictMode><CloudShell /></React.StrictMode>);
