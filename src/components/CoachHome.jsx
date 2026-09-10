import React, { useEffect, useMemo, useRef } from "react";
import { nextInsight, todayISO } from "../lib/planning.js";
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
  return (
    <div className="page">
      <div className="page-header">
        <h1>Today</h1>
      </div>
      <section className="panel coach-insight">
        <h2>{insight.title}</h2>
        <p>{insight.text}</p>
        <button className="btn-primary" onClick={remember}>
          Review {insight.page === "goals" ? "goals" : "my plan"}
        </button>
        <p className="small text-muted">
          Based on your recorded data. No external AI is connected.
        </p>
      </section>
      <details className="overview-details">
        <summary>View financial overview</summary>
        {children}
      </details>
    </div>
  );
}
