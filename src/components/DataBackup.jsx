import React, { useRef, useState } from "react";
import { downloadBackup, parseBackup } from "../lib/backup.js";

export default function DataBackup({ data, onRestore }) {
  const fileRef = useRef(null);
  const [candidate, setCandidate] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [confirm, setConfirm] = useState(false);
  const readFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(""); setMessage(""); setCandidate(null); setConfirm(false);
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error("This backup is too large. Choose a file under 10 MB.");
      const payload = parseBackup(await file.text());
      setCandidate(payload);
    } catch (e) { setError(e.message || "Could not read the backup."); }
  };
  const restore = () => {
    if (!candidate || !confirm) return;
    try {
      downloadBackup(data);
      onRestore(candidate);
      setCandidate(null); setConfirm(false);
      setMessage("Backup restored. Your previous data was downloaded as a safety copy.");
    } catch (e) { setError(e.message || "Restore failed. Your current data was not changed."); }
  };
  return <div className="panel" style={{ display: "grid", gap: 14 }}>
    <div className="panel-title" style={{ marginBottom: 0 }}>Back up your data</div>
    <p className="text-muted small">Save a copy of your accounts, transactions, budgets, bills, investments, goals and settings. The file stays on your device unless you choose to share it.</p>
    <div className="add-form wrap">
      <button className="btn-primary" onClick={() => { try { downloadBackup(data); setMessage("Backup downloaded."); setError(""); } catch { setError("Could not download your backup."); } }}>Download backup</button>
      <button className="btn-primary" onClick={() => fileRef.current?.click()}>Restore from file</button>
      <input ref={fileRef} type="file" accept=".json,application/json" onChange={readFile} style={{ display: "none" }} aria-label="Choose Kovo backup" />
    </div>
    {candidate && <div style={{ border: "1px solid var(--hairline)", borderRadius: 8, padding: 14, display: "grid", gap: 10 }}>
      <strong>Ready to restore</strong>
      <p className="small">This file contains {candidate.accounts.length} accounts and {candidate.transactions.length} transactions. Restoring replaces all current Kovo data, including your budgets and goals. A copy of your current data will be downloaded first.</p>
      <label className="small" style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} /> I understand this replaces my current data.</label>
      <div className="add-form wrap"><button className="btn-primary" disabled={!confirm} onClick={restore}>Restore backup</button><button className="btn-primary" onClick={() => { setCandidate(null); setConfirm(false); }}>Cancel</button></div>
    </div>}
    {error && <p role="alert" className="small" style={{ color: "var(--clay)" }}>{error}</p>}
    {message && <p role="status" className="small" style={{ color: "var(--moss)" }}>{message}</p>}
  </div>;
}
