import React, { useEffect, useRef, useState } from "react";
import App from "../App.jsx";
import DataBoundary from "./DataBoundary.jsx";
import DeleteAccount from "./DeleteAccount.jsx";
import OfflineStatus from './OfflineStatus.jsx';
import CloudAccount from "./CloudAccount.jsx";
import QuickTipLogger from "./QuickTipLogger.jsx";
import {
  completeAuthRedirect,
  getStoredSession,
  signOut,
  updatePassword,
} from "../lib/cloud.js";
import { commitData, initializeLocal, transact } from "../lib/storage.js";
import {
  emptyData,
  visibleData,
  flatten,
  inflate,
  recordKey,
  equal,
} from "../lib/records.js";
import { synchronize, resolveConflict } from "../lib/sync.js";
import { downloadBackup, parseBackup } from "../lib/backup.js";
import { validateChanges } from "../lib/validation.js";

import { useAppearance } from '../lib/appearance.js';

let authInitialization;
function describeEntry(value) {
  if (value == null) return "Entry removed";
  if (typeof value !== "object") return String(value);
  const details = Object.entries(value)
    .filter(([key, item]) => key !== "id" && item != null && typeof item !== "object")
    .map(([key, item]) => `${key.replace(/([A-Z])/g, " $1")}: ${item}`);
  return details.join(" · ") || "Saved preferences";
}
export default function CloudShell() {
  const [session, setSession] = useState(getStoredSession);
  const [local, setLocal] = useState(
    localStorage.getItem("kovo-local-mode-v1") === "true",
  );
  const [ready, setReady] = useState(false),
    [envelope, setEnvelope] = useState(null);
  const [loadedOwner, setLoadedOwner] = useState(null);
  const [status, setStatus] = useState("Opening Kovo…"),
    [accountOpen, setAccountOpen] = useState(false);
  const [error, setError] = useState(""),
    [recovery, setRecovery] = useState(false),
    [password, setPassword] = useState("");
  const owner = session?.user?.id || "local";
  const ownerRef = useRef(owner);
  ownerRef.current = owner;
  const channel = useRef(null);
  const [legacy, setLegacy] = useState(
    Boolean(localStorage.getItem("kovo-finance-data-v2")),
  );

  useEffect(() => {
    const changed = () => setSession(getStoredSession());
    window.addEventListener("kovo-auth-changed", changed);
    const storage = (event) => {
      if (event.key === "kovo-cloud-session-v1") changed();
    };
    window.addEventListener("storage", storage);
    if (!authInitialization) authInitialization = completeAuthRedirect();
    authInitialization
      .catch((e) => setError(e.message))
      .finally(() => {
        changed();
        setRecovery(sessionStorage.getItem("kovo-recovery") === "true");
        setReady(true);
      });
    return () => {
      window.removeEventListener("kovo-auth-changed", changed);
      window.removeEventListener("storage", storage);
    };
  }, []);
  useEffect(() => {
    let active = true;
    setEnvelope(null);
    (owner === "local" ? initializeLocal(owner) : transact(owner))
      .then((value) => {
        if (active) {
          setEnvelope(value);
          setLoadedOwner(owner);
        }
      })
      .catch((e) => setError(e.message));
    const bus = new BroadcastChannel("kovo-record-changes");
    channel.current = bus;
    bus.onmessage = () =>
      transact(owner).then((value) => {
        if (active) setEnvelope(value);
      });
    return () => {
      active = false;
      bus.close();
    };
  }, [owner]);
  useEffect(() => {
    if (!session?.user || !ready || recovery) return;
    let stopped = false,
      busy = false,
      timer;
    const tick = async () => {
      if (busy || stopped) return;
      if (!navigator.onLine) {
        setStatus("Offline — entries saved on this device");
        return;
      }
      busy = true;
      try {
        const run = () => synchronize(owner);
        const result = navigator.locks
          ? await navigator.locks.request(`kovo-sync-${owner}`, run)
          : await run();
        if (!stopped) {
          setEnvelope(result);
          setStatus(
            result.conflict
              ? "An entry needs your review"
              : result.queue.length
                ? `${result.queue.length} changes waiting to sync`
                : "Synced",
          );
          channel.current?.postMessage("updated");
        }
      } catch (e) {
        if (!stopped) setStatus(`Sync paused: ${e.message}`);
      } finally {
        busy = false;
      }
    };
    tick();
    timer = setInterval(() => {
      if (document.visibilityState === "visible") tick();
    }, 60000);
    const visible = () => {
      if (document.visibilityState === "visible") tick();
    };
    window.addEventListener("online", tick);
    window.addEventListener("kovo-data-committed", tick);
    document.addEventListener("visibilitychange", visible);
    return () => {
      stopped = true;
      clearInterval(timer);
      window.removeEventListener("online", tick);
      window.removeEventListener("kovo-data-committed", tick);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [owner, ready, recovery, session?.user?.id]);
  const data = envelope ? visibleData(envelope) : emptyData();
  useAppearance(envelope ? data.settings : undefined);
  const setData = async (update) => {
    try {
      const next = typeof update === "function" ? update(data) : update;
      validateChanges(data, next);
      const result = await commitData(owner, data, next);
      if (ownerRef.current === owner) {
        setEnvelope(result);
        setError("");
        setStatus(session ? "Saved on this device — syncing" : "Local only");
        channel.current?.postMessage("updated");
        window.dispatchEvent(new Event("kovo-data-committed"));
      }
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  };
  const importLegacy = async (deviceOnly = false) => {
    try {
      const old = deviceOnly
        ? visibleData(await transact("local"))
        : parseBackup(localStorage.getItem("kovo-finance-data-v2"));
      const pending = JSON.parse(
        localStorage.getItem("kovo-pending-sync-v1") || "null",
      );
      const sources = [
        old,
        ...(!deviceOnly && pending?.raw ? [parseBackup(pending.raw)] : []),
      ];
      // Merge only absent entries. Conflicting old values are retained in a recoverable archive.
      const records = flatten(data);
      const conflicts = [];
      for (const source of sources)
        for (const [key, record] of Object.entries(flatten(source))) {
          if (!(key in records) && !envelope.records[key])
            records[key] = record;
          else if (!equal(records[key]?.value, record.value))
            conflicts.push(record);
        }
      const next = {
        ...inflate(records),
        legacyImportArchive: {
          ...data.legacyImportArchive,
          runs: [
            ...(data.legacyImportArchive?.runs || []),
            { sources, conflicts, importedAt: new Date().toISOString() },
          ],
        },
      };
      if (await setData(next)) {
        setLegacy(false);
        setError(
          conflicts.length
            ? "Previous device data imported. Different versions were preserved in your backup archive; current entries were kept."
            : "Previous device data imported.",
        );
      }
    } catch (e) {
      setError(e.message);
    }
  };
  const logout = () => {
    signOut();
    setLocal(false);
    localStorage.removeItem("kovo-local-mode-v1");
    setAccountOpen(false);
  };
  const continueLocally = () => {
    setLocal(true);
    localStorage.setItem("kovo-local-mode-v1", "true");
  };
  if (!ready || !envelope || loadedOwner !== owner)
    return (
      <div className="kovo-boot">
        <div className="auth-mark">
          Kovo<span>.</span>
        </div>
        <p>{error || "Opening your Kovo…"}</p>
      </div>
    );
  if (recovery)
    return (
      <main className="auth-panel">
        <form
          className="cloud-login"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await updatePassword(password);
              setRecovery(false);
              setError("Password updated.");
            } catch (err) {
              setError(err.message);
            }
          }}
        >
          <h1>Choose a new password</h1>
          <label>
            New password
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button className="auth-submit">Save password</button>
          <p role="status">{error}</p>
        </form>
      </main>
    );
  if (!session?.user && !local)
    return (
      <main className="auth-page">
        <section className="auth-story" aria-hidden="true">
          <div className="auth-brand">
            Kovo<span>.</span>
          </div>
          <div className="auth-story-copy">
            <div className="auth-eyebrow">Your money, in one calm place</div>
            <h1>
              See where you are.
              <br />
              Know what comes next.
            </h1>
            <p>
              Kovo brings your spending, budgets, bills, goals, and net worth
              together without turning your finances into noise.
            </p>
          </div>
          <div className="auth-trust">
            Private by account · Automatic cloud sync
          </div>
        </section>
        <section className="auth-panel">
          <div>
            <CloudAccount
              onSignedIn={setSession}
              onContinueLocally={continueLocally}
            />
            {error && <p role="status">{error}</p>}
          </div>
        </section>
      </main>
    );
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <DataBoundary key={owner} data={data}>
        <App data={data} setData={setData} />
      </DataBoundary>
      <QuickTipLogger data={data} setData={setData} />
      <button
        className="cloud-pill"
        onClick={() => setAccountOpen(true)}
        aria-label="Open Kovo account"
      >
        <span className="status-dot" aria-hidden="true"/> {session ? status : "Local only"}
      </button>
      {error && (
        <div className="save-notice" role="status">
          {error}
          <button onClick={() => setError("")} aria-label="Dismiss message">
            ×
          </button>
        </div>
      )}
      {envelope.conflict && (
        <div className="cloud-overlay">
          <div className="cloud-modal">
            <h2>Review a changed entry</h2>
            <p>
              Another device changed the same entry. Both versions are preserved
              until you choose.
            </p>
            {envelope.conflict.changes.map((c) => (
              <div key={recordKey(c.collection, c.id)}>
                <strong>{c.collection}</strong>
                <p>This device: {describeEntry(c.value)}</p>
                <p>
                  Cloud:{" "}
                  {describeEntry(
                    envelope.records[recordKey(c.collection, c.id)]?.value,
                  )}
                </p>
              </div>
            ))}
            <button
              onClick={async () =>
                setEnvelope(await resolveConflict(owner, false))
              }
            >
              Keep cloud version
            </button>
            <button
              onClick={async () =>
                setEnvelope(await resolveConflict(owner, true))
              }
            >
              Use this device’s edit
            </button>
            <button
              onClick={() =>
                downloadBackup({ ...data, syncRecovery: envelope })
              }
            >
              Export both versions
            </button>
          </div>
        </div>
      )}
      {accountOpen && (
        <div className="cloud-overlay">
          <div className="cloud-modal">
            <button
              className="cloud-close"
              onClick={() => setAccountOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
            <CloudAccount
              session={session}
              syncStatus={status}
              onSignedIn={setSession}
              onSignOut={logout}
            />
            <div className="account-tools">
              <OfflineStatus/>
              {session && <DeleteAccount owner={owner} onDeleted={logout} />}
              <button
                onClick={() =>
                  downloadBackup({ ...data, syncRecovery: envelope })
                }
              >
                Export data and recovery archive
              </button>
              {session && (
                <button onClick={() => importLegacy(true)}>
                  Import entries from local-only mode
                </button>
              )}
              {legacy && (
                <>
                  <p>
                    Previous device data is available. Import only if it belongs
                    to this account. Existing cloud entries will be kept;
                    different versions are archived.
                  </p>
                  <button onClick={() => importLegacy(false)}>
                    Import my previous device data
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
