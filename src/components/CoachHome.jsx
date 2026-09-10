import React, { useEffect, useMemo, useRef } from "react";
import { nextInsight, todayISO } from "../lib/planning.js";
import { Compass } from 'lucide-react';
export default function CoachHome({ data, setData, setPage, children }) {
  const insight = useMemo(() => nextInsight(data), [data]);
  const recorded = useRef(new Set());
  const historyId = `${todayISO(data.settings.timeZone)}-${insight.id}-${Array.from(insight.text).reduce((hash, char) => (Math.imul(hash, 31) + char.charCodeAt(0)) | 0, 0)}`;
  useEffect(() => {
    if (
      !recorded.current.has(historyId) &&
      !(data.coachHistory || []).some((item) => item.id === historyId)
    ) {
      recorded.current.add(historyId);
      setData((current) => ({
        ...current,
        coachHistory: [
          ...(current.coachHistory || []),
          {
            ...insight,
            id: historyId,
            source: "rules-v1",
            createdAt: new Date().toISOString(),
          },
        ],
      })).then((saved) => {
        if (!saved) recorded.current.delete(historyId);
      });
    }
  }, [historyId, data.coachHistory]);
  const remember = () => {
    setPage(insight.page);
  };
  const recent = [...data.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: data.settings.currency || 'USD', minimumFractionDigits: 2 }).format(value);
  return (
    <div className="page">
      <div className="page-header">
        <div><h1>Today</h1><p>Your plan and recent activity.</p></div>
      </div>
      <section className="coach-insight" aria-label="Your next step">
        <div className="insight-content"><h2>{insight.title}</h2><p>{insight.text}</p></div>
        <div className="insight-action"><Compass size={28} strokeWidth={1.4}/><p>A small step you can take today.</p><button className="btn-primary" onClick={remember}>Review {insight.page === "goals" ? "goals" : "my plan"}</button></div>
      </section>
      <p className="coach-method">Based on your entries and saved plan.</p>
      <section className="activity-section" aria-labelledby="recent-title">
        <div className="section-heading"><h2 id="recent-title">Recent activity</h2><button className="link-btn" onClick={() => setPage('ledger')}>View transactions</button></div>
        {recent.length ? recent.map(item => <div className="tx-row" key={item.id}>
          <span className="text-muted small">{new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${item.date}T12:00:00Z`))}</span>
          <div className="tx-desc">{item.description}<div className="text-muted small">{item.category}</div></div>
          <span className="mono-num" style={{ color: item.amount > 0 ? 'var(--moss)' : 'var(--text)' }}>{item.amount > 0 ? '+' : ''}{money(item.amount)}</span>
        </div>) : <div className="activity-empty"><p>Your first entry is the start of a clearer picture. Log a shift’s tips or add a transaction.</p><button className="link-btn" onClick={() => setPage('ledger')}>Open transactions</button></div>}
      </section>
      <details className="overview-details">
        <summary>Balances &amp; monthly overview</summary>
        {children}
      </details>
    </div>
  );
}
