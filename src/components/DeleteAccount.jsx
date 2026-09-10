import React, { useState } from "react";
import { deleteAccount } from "../lib/cloud.js";
import { transact } from "../lib/storage.js";
export default function DeleteAccount({ owner, onDeleted }) {
  const [confirm, setConfirm] = useState(""),
    [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  if (!open)
    return (
      <button onClick={() => setOpen(true)}>
        Delete my account and cloud data
      </button>
    );
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (confirm !== "DELETE") return;
        setBusy(true);
        try {
          await deleteAccount();
          await transact(owner, () => ({
            records: {},
            queue: [],
            initialized: true,
          }));
          onDeleted();
        } catch (err) {
          setError(err.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <p>
        This permanently deletes your account, cloud entries, and this account’s
        current device cache. Export first if you want a copy. Downloaded
        backups, old device archives, and caches on other devices are not erased
        remotely.
      </p>
      <label>
        Type DELETE to confirm
        <input
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="off"
        />
      </label>
      <button disabled={busy || confirm !== "DELETE"}>
        Permanently delete account
      </button>
      <button type="button" onClick={() => setOpen(false)}>
        Cancel
      </button>
      <p role="status">{error}</p>
    </form>
  );
}
