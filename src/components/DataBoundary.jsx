import React from "react";
import { downloadBackup } from "../lib/backup.js";
export default class DataBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className="auth-panel">
        <div>
          <h1>Your saved data is still here</h1>
          <p>
            Kovo could not display an entry. Export your backup before trying
            again.
          </p>
          <button onClick={() => downloadBackup(this.props.data)}>
            Export saved data
          </button>
          <button onClick={() => window.location.reload()}>Try again</button>
        </div>
      </main>
    ) : (
      this.props.children
    );
  }
}
