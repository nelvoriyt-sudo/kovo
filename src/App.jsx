import React, { useState, useEffect, useMemo, useRef } from "react";
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from "recharts";
import {
  LayoutGrid, Wallet, Receipt, CalendarClock, Target, Landmark, PieChart,
  Settings as SettingsIcon, Plus, Trash2, Pencil, Check, X, TrendingUp, TrendingDown, ChevronRight
} from "lucide-react";

const STORAGE_KEY = "kovo-finance-data-v2";

const todayISO = () => new Date().toISOString().slice(0, 10);
const monthKey = (iso) => iso.slice(0, 7);
const fmt = (n, currency = "USD", opts = {}) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0, ...opts }).format(n || 0);
const fmtSigned = (n, currency = "USD") => (n < 0 ? "-" : "+") + fmt(Math.abs(n), currency);
const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

const ACCOUNT_TYPES = [
  { id: "checking", label: "Checking", group: "asset" },
  { id: "savings", label: "Savings", group: "asset" },
  { id: "property", label: "Property", group: "asset" },
  { id: "credit", label: "Credit card", group: "debt" },
  { id: "loan", label: "Loan", group: "debt" },
];

const DEFAULT_CATEGORIES = [
  "Groceries", "Dining", "Transport", "Housing", "Utilities", "Subscriptions",
  "Health", "Shopping", "Entertainment", "Travel", "Income", "Transfer", "Other",
];

const ASSET_CLASSES = ["Stocks", "Bonds", "Crypto", "Cash", "Real estate", "Other"];
const ASSET_COLORS = {
  Stocks: "#6FA2D6", Bonds: "#4FB3A9", Crypto: "#9C8CD6",
  Cash: "#8B92A0", "Real estate": "#D6A63F", Other: "#D6789B",
};

const ACCENTS = {
  blue: { label: "Dusty blue", hex: "#6FA2D6" },
  moss: { label: "Moss", hex: "#6FA97C" },
  amber: { label: "Amber", hex: "#D6A63F" },
  rose: { label: "Rose", hex: "#D6789B" },
};

function computeNetWorth(data) {
  const acc = data.accounts.reduce((s, a) => s + a.balance, 0);
  const inv = data.investments.reduce(
    (s, i) => s + i.holdings.reduce((s2, h) => s2 + h.shares * h.price, 0), 0
  );
  return acc + inv;
}

function withSnapshot(data) {
  const netWorth = computeNetWorth(data);
  const today = todayISO();
  const history = [...data.history];
  if (history.length && history[history.length - 1].date === today) {
    history[history.length - 1].value = netWorth;
  } else {
    history.push({ date: today, value: netWorth });
  }
  return { ...data, history };
}

const seedData = () => {
  const accounts = [
    { id: uid(), name: "Everyday checking", type: "checking", balance: 4210 },
    { id: uid(), name: "Emergency fund", type: "savings", balance: 12500 },
    { id: uid(), name: "Visa signature", type: "credit", balance: -1320 },
    { id: uid(), name: "Car loan", type: "loan", balance: -8900 },
  ];
  const investments = [
    {
      id: uid(), name: "Brokerage", holdings: [
        { id: uid(), ticker: "VTI", assetClass: "Stocks", shares: 120, price: 245.3 },
        { id: uid(), ticker: "BND", assetClass: "Bonds", shares: 80, price: 72.1 },
        { id: uid(), ticker: "Cash", assetClass: "Cash", shares: 1, price: 1450 },
      ],
    },
    {
      id: uid(), name: "Retirement (401k)", holdings: [
        { id: uid(), ticker: "Target 2055 fund", assetClass: "Stocks", shares: 310, price: 42.6 },
      ],
    },
  ];
  const m = todayISO().slice(0, 7);
  const day = (d) => `${m}-${String(d).padStart(2, "0")}`;
  const transactions = [
    { id: uid(), date: day(2), description: "Paycheck", category: "Income", amount: 3200 },
    { id: uid(), date: day(3), description: "Whole Foods", category: "Groceries", amount: -86.4 },
    { id: uid(), date: day(4), description: "Rent", category: "Housing", amount: -1650 },
    { id: uid(), date: day(5), description: "Con Edison", category: "Utilities", amount: -94.1 },
    { id: uid(), date: day(6), description: "Spotify", category: "Subscriptions", amount: -11.99 },
    { id: uid(), date: day(7), description: "Corner bistro", category: "Dining", amount: -42.5 },
    { id: uid(), date: day(9), description: "MTA transit", category: "Transport", amount: -33 },
    { id: uid(), date: day(11), description: "Trader Joe's", category: "Groceries", amount: -61.2 },
    { id: uid(), date: day(13), description: "Netflix", category: "Subscriptions", amount: -15.49 },
    { id: uid(), date: day(15), description: "Zara", category: "Shopping", amount: -128 },
    { id: uid(), date: day(18), description: "Gym membership", category: "Health", amount: -45 },
    { id: uid(), date: day(20), description: "Movie night", category: "Entertainment", amount: -32 },
  ];
  const budgets = [
    { category: "Groceries", limit: 500 },
    { category: "Dining", limit: 250 },
    { category: "Transport", limit: 120 },
    { category: "Housing", limit: 1650 },
    { category: "Utilities", limit: 150 },
    { category: "Subscriptions", limit: 60 },
    { category: "Shopping", limit: 200 },
    { category: "Entertainment", limit: 100 },
  ];
  const bills = [
    { id: uid(), name: "Rent", amount: 1650, dueDay: 1, category: "Housing" },
    { id: uid(), name: "Con Edison", amount: 95, dueDay: 5, category: "Utilities" },
    { id: uid(), name: "Spotify", amount: 11.99, dueDay: 6, category: "Subscriptions" },
    { id: uid(), name: "Netflix", amount: 15.49, dueDay: 13, category: "Subscriptions" },
    { id: uid(), name: "Gym", amount: 45, dueDay: 18, category: "Health" },
    { id: uid(), name: "Car payment", amount: 320, dueDay: 22, category: "Transport" },
  ];
  const goals = [
    { id: uid(), name: "Emergency fund", target: 20000, saved: 12500 },
    { id: uid(), name: "Japan trip", target: 4000, saved: 1450 },
    { id: uid(), name: "New laptop", target: 2200, saved: 2200 },
  ];
  const settings = { accentTheme: "blue", currency: "USD" };
  const base = accounts.reduce((s, a) => s + a.balance, 0) +
    investments.reduce((s, i) => s + i.holdings.reduce((s2, h) => s2 + h.shares * h.price, 0), 0);
  const history = [];
  for (let i = 8; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    history.push({ date: d.toISOString().slice(0, 10), value: Math.round(base - (i * 1800) + (Math.sin(i) * 1100)) });
  }
  history[history.length - 1].value = base;
  return { accounts, investments, transactions, budgets, bills, goals, history, settings, categories: DEFAULT_CATEGORIES };
};

function useKovoData() {
  const [data, setData] = useState(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          investments: [], settings: { accentTheme: "blue", currency: "USD" }, categories: DEFAULT_CATEGORIES,
          ...parsed,
        };
      }
    } catch (e) { /* fall through to seed data */ }
    return seedData();
  });
  const saveTimer = useRef(null);

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) { /* storage unavailable — data stays in memory for this session */ }
    }, 300);
    return () => clearTimeout(saveTimer.current);
  }, [data]);

  // Pick up transactions logged from outside this component (e.g. the
  // Quick Tip Logger) so they land in this component's live state exactly
  // once, instead of only existing in localStorage until a full reload.
  useEffect(() => {
    const onTipAdded = (event) => {
      const { transaction, tipEntry } = event.detail || {};
      if (!transaction) return;

      setData((current) => {
        if (current.transactions.some((t) => t.id === transaction.id)) return current;

        const tipEntries = current.tipEntries || [];
        return {
          ...current,
          transactions: [transaction, ...current.transactions],
          tipEntries: tipEntry ? [tipEntry, ...tipEntries] : tipEntries,
        };
      });
    };

    window.addEventListener("kovo-tip-added", onTipAdded);
    return () => window.removeEventListener("kovo-tip-added", onTipAdded);
  }, [setData]);

  return [data, setData, "ready"];
}

/* ---------- shared bits ---------- */

function Sparkline({ history }) {
  const positive = history.length > 1 && history[history.length - 1].value >= history[0].value;
  return (
    <div style={{ width: "100%", height: 90 }}>
      <ResponsiveContainer>
        <LineChart data={history} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
          <YAxis hide domain={["dataMin - 500", "dataMax + 500"]} />
          <Tooltip
            contentStyle={{ background: "#1A2029", border: "1px solid rgba(242,240,234,0.12)", borderRadius: 6, fontFamily: "Manrope" }}
            labelStyle={{ display: "none" }}
            formatter={(v) => [fmt(v), "Net worth"]}
          />
          <Line type="monotone" dataKey="value" stroke={positive ? "#6FA97C" : "#D2704F"} strokeWidth={2.5} dot={false}
            activeDot={{ r: 4, fill: positive ? "#6FA97C" : "#D2704F" }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function Meter({ pct, tone }) {
  const color = tone === "over" ? "#D2704F" : tone === "close" ? "#D6A63F" : "#6FA97C";
  return <div className="meter-track"><div className="meter-fill" style={{ width: `${Math.min(100, pct)}%`, background: color }} /></div>;
}

function IconBtn({ onClick, title, children }) {
  return <button className="icon-btn" onClick={onClick} title={title} aria-label={title}>{children}</button>;
}

function TextField({ value, onChange, placeholder, type = "text", style }) {
  return <input className="field" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} type={type} style={style} />;
}

function SelectField({ value, onChange, options, style, labels }) {
  return (
    <select className="field" value={value} onChange={(e) => onChange(e.target.value)} style={style}>
      {options.map((o) => <option key={o} value={o}>{labels ? labels[o] : o}</option>)}
    </select>
  );
}

/* ---------- Pages ---------- */

function Overview({ data, netWorth, monthTx, spentByCategory, setPage, cur }) {
  const income = monthTx.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expenses = monthTx.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const maxFlow = Math.max(income, expenses, 1);
  const delta = data.history.length > 1 ? netWorth - data.history[data.history.length - 2].value : 0;
  const upcoming = [...data.bills].sort((a, b) => a.dueDay - b.dueDay).slice(0, 4);
  const tightBudgets = data.budgets
    .map((b) => ({ ...b, spent: spentByCategory[b.category] || 0 }))
    .sort((a, b) => (b.spent / b.limit) - (a.spent / a.limit))
    .slice(0, 4);

  return (
    <div className="page">
      <div className="hero-panel">
        <div className="hero-label">Net worth</div>
        <div className="hero-value">{fmt(netWorth, cur, { maximumFractionDigits: 0 })}</div>
        <div className="hero-delta" style={{ color: delta >= 0 ? "#6FA97C" : "#D2704F" }}>
          {delta >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {fmtSigned(delta, cur)} since last update
        </div>
        <Sparkline history={data.history} />
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-title">Cash flow this month</div>
          <div className="flow-row">
            <span className="flow-label">Income</span>
            <div className="flow-track"><div className="flow-fill" style={{ width: `${(income / maxFlow) * 100}%`, background: "#6FA97C" }} /></div>
            <span className="flow-value">{fmt(income, cur)}</span>
          </div>
          <div className="flow-row">
            <span className="flow-label">Spending</span>
            <div className="flow-track"><div className="flow-fill" style={{ width: `${(expenses / maxFlow) * 100}%`, background: "#D2704F" }} /></div>
            <span className="flow-value">{fmt(expenses, cur)}</span>
          </div>
          <div className="flow-net">
            <span>Left over</span>
            <span style={{ color: income - expenses >= 0 ? "#6FA97C" : "#D2704F" }}>{fmtSigned(income - expenses, cur)}</span>
          </div>
        </div>

        <div className="panel">
          <div className="panel-title-row">
            <div className="panel-title">Budget watch</div>
            <button className="link-btn" onClick={() => setPage("budget")}>All <ChevronRight size={13} /></button>
          </div>
          {tightBudgets.length === 0 && <div className="empty-note">No budgets set yet.</div>}
          {tightBudgets.map((b) => {
            const pct = (b.spent / b.limit) * 100;
            const tone = pct >= 100 ? "over" : pct >= 80 ? "close" : "ok";
            return (
              <div key={b.category} className="budget-mini">
                <div className="budget-mini-top"><span>{b.category}</span><span className="mono-num">{fmt(b.spent, cur, { maximumFractionDigits: 0 })} / {fmt(b.limit, cur, { maximumFractionDigits: 0 })}</span></div>
                <Meter pct={pct} tone={tone} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-title-row">
            <div className="panel-title">Upcoming bills</div>
            <button className="link-btn" onClick={() => setPage("bills")}>All <ChevronRight size={13} /></button>
          </div>
          {upcoming.length === 0 && <div className="empty-note">No bills tracked yet.</div>}
          {upcoming.map((b) => (
            <div key={b.id} className="bill-mini">
              <div className="bill-day">{String(b.dueDay).padStart(2, "0")}</div>
              <div className="bill-mini-info"><div>{b.name}</div><div className="text-muted small">{b.category}</div></div>
              <div className="mono-num">{fmt(b.amount, cur)}</div>
            </div>
          ))}
        </div>

        <div className="panel">
          <div className="panel-title-row">
            <div className="panel-title">Goals</div>
            <button className="link-btn" onClick={() => setPage("goals")}>All <ChevronRight size={13} /></button>
          </div>
          {data.goals.length === 0 && <div className="empty-note">No goals yet.</div>}
          {data.goals.slice(0, 3).map((g) => {
            const pct = (g.saved / g.target) * 100;
            return (
              <div key={g.id} className="budget-mini">
                <div className="budget-mini-top"><span>{g.name}</span><span className="mono-num">{Math.round(pct)}%</span></div>
                <Meter pct={pct} tone={pct >= 100 ? "ok" : "close"} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Accounts({ data, setData, cur }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: "", type: "checking", balance: "" });
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState(null);

  const groups = {
    asset: data.accounts.filter((a) => ACCOUNT_TYPES.find((t) => t.id === a.type)?.group === "asset"),
    debt: data.accounts.filter((a) => ACCOUNT_TYPES.find((t) => t.id === a.type)?.group === "debt"),
  };
  const totalAssets = groups.asset.reduce((s, a) => s + a.balance, 0);
  const totalDebt = groups.debt.reduce((s, a) => s + Math.abs(a.balance), 0);

  const addAccount = () => {
    if (!draft.name.trim() || draft.balance === "") return;
    const group = ACCOUNT_TYPES.find((t) => t.id === draft.type)?.group;
    const signed = group === "debt" ? -Math.abs(Number(draft.balance)) : Math.abs(Number(draft.balance));
    const accounts = [...data.accounts, { id: uid(), name: draft.name.trim(), type: draft.type, balance: signed }];
    setData(withSnapshot({ ...data, accounts }));
    setDraft({ name: "", type: "checking", balance: "" });
    setAdding(false);
  };

  const removeAccount = (id) => setData(withSnapshot({ ...data, accounts: data.accounts.filter((a) => a.id !== id) }));

  const startEdit = (a) => { setEditingId(a.id); setEditDraft({ ...a, balance: Math.abs(a.balance) }); };

  const saveEdit = () => {
    const group = ACCOUNT_TYPES.find((t) => t.id === editDraft.type)?.group;
    const signed = group === "debt" ? -Math.abs(Number(editDraft.balance)) : Math.abs(Number(editDraft.balance));
    const accounts = data.accounts.map((a) => (a.id === editingId ? { ...a, name: editDraft.name, type: editDraft.type, balance: signed } : a));
    setData(withSnapshot({ ...data, accounts }));
    setEditingId(null);
  };

  const typeLabels = Object.fromEntries(ACCOUNT_TYPES.map((t) => [t.id, t.label]));

  const renderGroup = (title, list, group) => (
    <div className="panel">
      <div className="panel-title-row">
        <div className="panel-title">{title}</div>
        <span className="mono-num text-muted">{fmt(group === "debt" ? -totalDebt : totalAssets, cur, { maximumFractionDigits: 0 })}</span>
      </div>
      {list.length === 0 && <div className="empty-note">No {title.toLowerCase()} yet.</div>}
      {list.map((a) => (
        <div key={a.id} className="account-row">
          {editingId === a.id ? (
            <>
              <TextField value={editDraft.name} onChange={(v) => setEditDraft({ ...editDraft, name: v })} style={{ flex: 1 }} />
              <SelectField value={editDraft.type} onChange={(v) => setEditDraft({ ...editDraft, type: v })}
                options={ACCOUNT_TYPES.filter((t) => t.group === group).map((t) => t.id)} labels={typeLabels} style={{ width: 118 }} />
              <TextField value={editDraft.balance} onChange={(v) => setEditDraft({ ...editDraft, balance: v })} type="number" style={{ width: 100 }} />
              <IconBtn title="Save" onClick={saveEdit}><Check size={14} /></IconBtn>
              <IconBtn title="Cancel" onClick={() => setEditingId(null)}><X size={14} /></IconBtn>
            </>
          ) : (
            <>
              <div className="account-name"><div>{a.name}</div><div className="text-muted small">{typeLabels[a.type]}</div></div>
              <span className="mono-num" style={{ color: a.balance < 0 ? "#D2704F" : undefined }}>{fmt(a.balance, cur)}</span>
              <IconBtn title="Edit" onClick={() => startEdit(a)}><Pencil size={13} /></IconBtn>
              <IconBtn title="Remove" onClick={() => removeAccount(a.id)}><Trash2 size={13} /></IconBtn>
            </>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="page">
      <div className="page-header"><h1>Accounts</h1><button className="btn-primary" onClick={() => setAdding((v) => !v)}><Plus size={14} /> Add account</button></div>
      {adding && (
        <div className="panel add-form">
          <TextField value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} placeholder="Account name" style={{ flex: 1 }} />
          <SelectField value={draft.type} onChange={(v) => setDraft({ ...draft, type: v })} options={ACCOUNT_TYPES.map((t) => t.id)} labels={typeLabels} style={{ width: 130 }} />
          <TextField value={draft.balance} onChange={(v) => setDraft({ ...draft, balance: v })} placeholder="Balance" type="number" style={{ width: 120 }} />
          <button className="btn-primary" onClick={addAccount}>Add</button>
        </div>
      )}
      {renderGroup("Assets", groups.asset, "asset")}
      {renderGroup("Debts", groups.debt, "debt")}
    </div>
  );
}

function Investments({ data, setData, cur }) {
  const [addingAccount, setAddingAccount] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [holdingDrafts, setHoldingDrafts] = useState({});

  const total = data.investments.reduce((s, i) => s + i.holdings.reduce((s2, h) => s2 + h.shares * h.price, 0), 0);
  const byClass = {};
  data.investments.forEach((i) => i.holdings.forEach((h) => {
    byClass[h.assetClass] = (byClass[h.assetClass] || 0) + h.shares * h.price;
  }));

  const addAccount = () => {
    if (!accountName.trim()) return;
    const investments = [...data.investments, { id: uid(), name: accountName.trim(), holdings: [] }];
    setData(withSnapshot({ ...data, investments }));
    setAccountName("");
    setAddingAccount(false);
  };

  const removeAccount = (id) => setData(withSnapshot({ ...data, investments: data.investments.filter((i) => i.id !== id) }));

  const draftFor = (accId) => holdingDrafts[accId] || { ticker: "", assetClass: "Stocks", shares: "", price: "" };
  const setDraftFor = (accId, patch) => setHoldingDrafts({ ...holdingDrafts, [accId]: { ...draftFor(accId), ...patch } });

  const addHolding = (accId) => {
    const d = draftFor(accId);
    if (!d.ticker.trim() || d.shares === "" || d.price === "") return;
    const investments = data.investments.map((i) => i.id === accId
      ? { ...i, holdings: [...i.holdings, { id: uid(), ticker: d.ticker.trim(), assetClass: d.assetClass, shares: Number(d.shares), price: Number(d.price) }] }
      : i);
    setData(withSnapshot({ ...data, investments }));
    setHoldingDrafts({ ...holdingDrafts, [accId]: { ticker: "", assetClass: d.assetClass, shares: "", price: "" } });
  };

  const removeHolding = (accId, holdingId) => {
    const investments = data.investments.map((i) => i.id === accId ? { ...i, holdings: i.holdings.filter((h) => h.id !== holdingId) } : i);
    setData(withSnapshot({ ...data, investments }));
  };

  return (
    <div className="page">
      <div className="page-header"><h1>Investments</h1><button className="btn-primary" onClick={() => setAddingAccount((v) => !v)}><Plus size={14} /> Add account</button></div>

      {addingAccount && (
        <div className="panel add-form">
          <TextField value={accountName} onChange={setAccountName} placeholder="Account name, e.g. Brokerage" style={{ flex: 1 }} />
          <button className="btn-primary" onClick={addAccount}>Add</button>
        </div>
      )}

      <div className="panel">
        <div className="panel-title-row"><div className="panel-title">Total invested</div><span className="mono-num text-muted">{fmt(total, cur, { maximumFractionDigits: 0 })}</span></div>
        {Object.keys(byClass).length === 0 ? (
          <div className="empty-note">Add holdings below to see your asset allocation.</div>
        ) : (
          <>
            <div className="alloc-bar">
              {Object.entries(byClass).map(([cls, val]) => (
                <div key={cls} style={{ width: `${(val / total) * 100}%`, background: ASSET_COLORS[cls] }} title={cls} />
              ))}
            </div>
            <div className="alloc-legend">
              {Object.entries(byClass).map(([cls, val]) => (
                <span key={cls} className="alloc-legend-item">
                  <span className="alloc-dot" style={{ background: ASSET_COLORS[cls] }} />
                  {cls} <span className="text-muted">{Math.round((val / total) * 100)}%</span>
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {data.investments.length === 0 && <div className="empty-note">No investment accounts yet — add one above.</div>}
      {data.investments.map((inv) => {
        const accTotal = inv.holdings.reduce((s, h) => s + h.shares * h.price, 0);
        const d = draftFor(inv.id);
        return (
          <div key={inv.id} className="panel">
            <div className="panel-title-row">
              <div className="panel-title">{inv.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="mono-num">{fmt(accTotal, cur, { maximumFractionDigits: 0 })}</span>
                <IconBtn title="Remove account" onClick={() => removeAccount(inv.id)}><Trash2 size={13} /></IconBtn>
              </div>
            </div>
            {inv.holdings.length === 0 && <div className="empty-note">No holdings yet.</div>}
            {inv.holdings.map((h) => (
              <div key={h.id} className="account-row">
                <div className="account-name">
                  <div>{h.ticker}</div>
                  <div className="text-muted small">{h.assetClass} · {h.shares} sh @ {fmt(h.price, cur)}</div>
                </div>
                <span className="mono-num">{fmt(h.shares * h.price, cur, { maximumFractionDigits: 0 })}</span>
                <IconBtn title="Remove holding" onClick={() => removeHolding(inv.id, h.id)}><Trash2 size={13} /></IconBtn>
              </div>
            ))}
            <div className="add-form wrap" style={{ marginTop: 10 }}>
              <TextField value={d.ticker} onChange={(v) => setDraftFor(inv.id, { ticker: v })} placeholder="Ticker / name" style={{ width: 130 }} />
              <SelectField value={d.assetClass} onChange={(v) => setDraftFor(inv.id, { assetClass: v })} options={ASSET_CLASSES} style={{ width: 128 }} />
              <TextField value={d.shares} onChange={(v) => setDraftFor(inv.id, { shares: v })} placeholder="Shares" type="number" style={{ width: 90 }} />
              <TextField value={d.price} onChange={(v) => setDraftFor(inv.id, { price: v })} placeholder="Price" type="number" style={{ width: 90 }} />
              <button className="btn-primary" onClick={() => addHolding(inv.id)}>Add</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Budget({ data, setData, spentByCategory, cur }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ category: data.categories[0], limit: "" });

  const updateLimit = (category, limit) => setData({ ...data, budgets: data.budgets.map((b) => (b.category === category ? { ...b, limit: Number(limit) || 0 } : b)) });
  const removeBudget = (category) => setData({ ...data, budgets: data.budgets.filter((b) => b.category !== category) });
  const addBudget = () => {
    if (data.budgets.find((b) => b.category === draft.category) || !draft.limit) return;
    setData({ ...data, budgets: [...data.budgets, { category: draft.category, limit: Number(draft.limit) }] });
    setDraft({ category: data.categories[0], limit: "" });
    setAdding(false);
  };

  const totalLimit = data.budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = data.budgets.reduce((s, b) => s + (spentByCategory[b.category] || 0), 0);
  const available = data.categories.filter((c) => !data.budgets.find((b) => b.category === c));

  return (
    <div className="page">
      <div className="page-header"><h1>Budget</h1><button className="btn-primary" onClick={() => setAdding((v) => !v)}><Plus size={14} /> Add category</button></div>
      {adding && (
        <div className="panel add-form">
          <SelectField value={draft.category} onChange={(v) => setDraft({ ...draft, category: v })} options={available.length ? available : data.categories} style={{ flex: 1 }} />
          <TextField value={draft.limit} onChange={(v) => setDraft({ ...draft, limit: v })} placeholder="Monthly limit" type="number" style={{ width: 140 }} />
          <button className="btn-primary" onClick={addBudget}>Add</button>
        </div>
      )}
      <div className="panel">
        <div className="panel-title-row"><div className="panel-title">This month</div><span className="mono-num text-muted">{fmt(totalSpent, cur, { maximumFractionDigits: 0 })} of {fmt(totalLimit, cur, { maximumFractionDigits: 0 })}</span></div>
        {data.budgets.length === 0 && <div className="empty-note">No budget categories yet — add one above to start tracking.</div>}
        {data.budgets.map((b) => {
          const spent = spentByCategory[b.category] || 0;
          const pct = b.limit ? (spent / b.limit) * 100 : 0;
          const tone = pct >= 100 ? "over" : pct >= 80 ? "close" : "ok";
          return (
            <div key={b.category} className="budget-row">
              <div className="budget-row-top">
                <span>{b.category}</span>
                <div className="budget-row-right">
                  <span className="mono-num">{fmt(spent, cur, { maximumFractionDigits: 0 })}</span>
                  <span className="text-muted"> / </span>
                  <input className="inline-num" type="number" value={b.limit} onChange={(e) => updateLimit(b.category, e.target.value)} />
                  <IconBtn title="Remove" onClick={() => removeBudget(b.category)}><Trash2 size={13} /></IconBtn>
                </div>
              </div>
              <Meter pct={pct} tone={tone} />
              {pct >= 100 && <div className="over-note">{fmt(spent - b.limit, cur, { maximumFractionDigits: 0 })} over limit</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Ledger({ data, setData, cur }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ date: todayISO(), description: "", category: data.categories[0], amount: "" });
  const [query, setQuery] = useState("");

  const addTx = () => {
    if (!draft.description.trim() || draft.amount === "") return;
    const tx = { id: uid(), date: draft.date, description: draft.description.trim(), category: draft.category, amount: Number(draft.amount) };
    setData({ ...data, transactions: [tx, ...data.transactions] });
    setDraft({ date: todayISO(), description: "", category: draft.category, amount: "" });
    setAdding(false);
  };

  const removeTx = (id) => setData({ ...data, transactions: data.transactions.filter((t) => t.id !== id) });

  const filtered = useMemo(() => {
    const list = [...data.transactions].sort((a, b) => (a.date < b.date ? 1 : -1));
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter((t) => t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
  }, [data.transactions, query]);

  return (
    <div className="page">
      <div className="page-header"><h1>Ledger</h1><button className="btn-primary" onClick={() => setAdding((v) => !v)}><Plus size={14} /> Add transaction</button></div>
      {adding && (
        <div className="panel add-form wrap">
          <TextField value={draft.date} onChange={(v) => setDraft({ ...draft, date: v })} type="date" style={{ width: 150 }} />
          <TextField value={draft.description} onChange={(v) => setDraft({ ...draft, description: v })} placeholder="Description" style={{ flex: 1, minWidth: 140 }} />
          <SelectField value={draft.category} onChange={(v) => setDraft({ ...draft, category: v })} options={data.categories} style={{ width: 140 }} />
          <TextField value={draft.amount} onChange={(v) => setDraft({ ...draft, amount: v })} placeholder="-42.50" type="number" style={{ width: 110 }} />
          <button className="btn-primary" onClick={addTx}>Add</button>
        </div>
      )}
      <TextField value={query} onChange={setQuery} placeholder="Search transactions" style={{ marginBottom: 14, maxWidth: 320 }} />
      <div className="panel">
        {filtered.length === 0 && <div className="empty-note">No transactions match — try a different search, or add your first entry above.</div>}
        {filtered.map((t) => (
          <div key={t.id} className="tx-row">
            <span className="text-muted mono-num small">{t.date.slice(5)}</span>
            <div className="tx-desc"><div>{t.description}</div><div className="text-muted small">{t.category}</div></div>
            <span className="mono-num" style={{ color: t.amount < 0 ? undefined : "#6FA97C" }}>{fmtSigned(t.amount, cur)}</span>
            <IconBtn title="Remove" onClick={() => removeTx(t.id)}><Trash2 size={13} /></IconBtn>
          </div>
        ))}
      </div>
    </div>
  );
}

function Bills({ data, setData, cur }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: "", amount: "", dueDay: "1", category: data.categories[0] });

  const addBill = () => {
    if (!draft.name.trim() || !draft.amount) return;
    setData({ ...data, bills: [...data.bills, { id: uid(), name: draft.name.trim(), amount: Number(draft.amount), dueDay: Number(draft.dueDay), category: draft.category }] });
    setDraft({ name: "", amount: "", dueDay: "1", category: draft.category });
    setAdding(false);
  };
  const removeBill = (id) => setData({ ...data, bills: data.bills.filter((b) => b.id !== id) });

  const sorted = [...data.bills].sort((a, b) => a.dueDay - b.dueDay);
  const total = data.bills.reduce((s, b) => s + b.amount, 0);

  return (
    <div className="page">
      <div className="page-header"><h1>Bills</h1><button className="btn-primary" onClick={() => setAdding((v) => !v)}><Plus size={14} /> Add bill</button></div>
      {adding && (
        <div className="panel add-form wrap">
          <TextField value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} placeholder="Bill name" style={{ flex: 1, minWidth: 140 }} />
          <TextField value={draft.amount} onChange={(v) => setDraft({ ...draft, amount: v })} placeholder="Amount" type="number" style={{ width: 110 }} />
          <TextField value={draft.dueDay} onChange={(v) => setDraft({ ...draft, dueDay: v })} placeholder="Due day" type="number" style={{ width: 100 }} />
          <SelectField value={draft.category} onChange={(v) => setDraft({ ...draft, category: v })} options={data.categories} style={{ width: 140 }} />
          <button className="btn-primary" onClick={addBill}>Add</button>
        </div>
      )}
      <div className="panel">
        <div className="panel-title-row"><div className="panel-title">Monthly recurring</div><span className="mono-num text-muted">{fmt(total, cur, { maximumFractionDigits: 0 })} / mo</span></div>
        {sorted.length === 0 && <div className="empty-note">No bills tracked yet — add your recurring charges above.</div>}
        {sorted.map((b) => (
          <div key={b.id} className="bill-mini">
            <div className="bill-day">{String(b.dueDay).padStart(2, "0")}</div>
            <div className="bill-mini-info"><div>{b.name}</div><div className="text-muted small">{b.category}</div></div>
            <span className="mono-num">{fmt(b.amount, cur)}</span>
            <IconBtn title="Remove" onClick={() => removeBill(b.id)}><Trash2 size={13} /></IconBtn>
          </div>
        ))}
      </div>
    </div>
  );
}

function Goals({ data, setData, cur }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: "", target: "", saved: "" });

  const addGoal = () => {
    if (!draft.name.trim() || !draft.target) return;
    setData({ ...data, goals: [...data.goals, { id: uid(), name: draft.name.trim(), target: Number(draft.target), saved: Number(draft.saved) || 0 }] });
    setDraft({ name: "", target: "", saved: "" });
    setAdding(false);
  };
  const removeGoal = (id) => setData({ ...data, goals: data.goals.filter((g) => g.id !== id) });
  const contribute = (id, amt) => setData({ ...data, goals: data.goals.map((g) => (g.id === id ? { ...g, saved: Math.max(0, g.saved + amt) } : g)) });

  return (
    <div className="page">
      <div className="page-header"><h1>Goals</h1><button className="btn-primary" onClick={() => setAdding((v) => !v)}><Plus size={14} /> Add goal</button></div>
      {adding && (
        <div className="panel add-form wrap">
          <TextField value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} placeholder="Goal name" style={{ flex: 1, minWidth: 140 }} />
          <TextField value={draft.target} onChange={(v) => setDraft({ ...draft, target: v })} placeholder="Target" type="number" style={{ width: 110 }} />
          <TextField value={draft.saved} onChange={(v) => setDraft({ ...draft, saved: v })} placeholder="Already saved" type="number" style={{ width: 130 }} />
          <button className="btn-primary" onClick={addGoal}>Add</button>
        </div>
      )}
      <div className="goal-grid">
        {data.goals.length === 0 && <div className="empty-note">No goals yet — name what you're saving for above.</div>}
        {data.goals.map((g) => {
          const pct = (g.saved / g.target) * 100;
          const done = pct >= 100;
          return (
            <div key={g.id} className="panel goal-card">
              <div className="panel-title-row"><div className="panel-title">{g.name}</div><IconBtn title="Remove" onClick={() => removeGoal(g.id)}><Trash2 size={13} /></IconBtn></div>
              <div className="goal-amount">{fmt(g.saved, cur, { maximumFractionDigits: 0 })} <span className="text-muted">of {fmt(g.target, cur, { maximumFractionDigits: 0 })}</span></div>
              <Meter pct={pct} tone={done ? "ok" : "close"} />
              <div className="goal-actions">
                <button className="chip-btn" onClick={() => contribute(g.id, 50)}>+ $50</button>
                <button className="chip-btn" onClick={() => contribute(g.id, 200)}>+ $200</button>
                <button className="chip-btn" onClick={() => contribute(g.id, -50)}>- $50</button>
                {done && <span className="goal-done">Reached</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Settings({ data, setData }) {
  const [newCategory, setNewCategory] = useState("");
  const [confirmingReset, setConfirmingReset] = useState(false);

  const setAccent = (key) => setData({ ...data, settings: { ...data.settings, accentTheme: key } });
  const setCurrency = (v) => setData({ ...data, settings: { ...data.settings, currency: v } });
  const addCategory = () => {
    if (!newCategory.trim() || data.categories.includes(newCategory.trim())) return;
    setData({ ...data, categories: [...data.categories, newCategory.trim()] });
    setNewCategory("");
  };
  const removeCategory = (c) => setData({ ...data, categories: data.categories.filter((x) => x !== c) });

  const doReset = () => { setData(seedData()); setConfirmingReset(false); };

  return (
    <div className="page">
      <div className="page-header"><h1>Settings</h1></div>

      <div className="panel">
        <div className="panel-title">Accent color</div>
        <div className="text-muted small" style={{ marginBottom: 12 }}>Used for navigation, links and buttons. Growth, debt and goal colors stay fixed everywhere.</div>
        <div className="accent-grid">
          {Object.entries(ACCENTS).map(([key, a]) => (
            <button key={key} className={`accent-swatch ${data.settings.accentTheme === key ? "active" : ""}`} onClick={() => setAccent(key)}>
              <span className="accent-dot" style={{ background: a.hex }} />
              {a.label}
              {data.settings.accentTheme === key && <Check size={13} />}
            </button>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">Currency</div>
        <SelectField value={data.settings.currency} onChange={setCurrency} options={["USD", "EUR", "GBP", "JPY", "CAD"]} style={{ width: 140 }} />
      </div>

      <div className="panel">
        <div className="panel-title">Categories</div>
        <div className="category-chips">
          {data.categories.map((c) => (
            <span key={c} className="cat-chip">{c}<button onClick={() => removeCategory(c)} aria-label={`Remove ${c}`}><X size={11} /></button></span>
          ))}
        </div>
        <div className="add-form" style={{ marginTop: 12 }}>
          <TextField value={newCategory} onChange={setNewCategory} placeholder="New category" style={{ flex: 1, maxWidth: 220 }} />
          <button className="btn-primary" onClick={addCategory}>Add</button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">Data</div>
        <div className="text-muted small" style={{ marginBottom: 12 }}>Kovo saves everything automatically to your private storage — nothing leaves this chat.</div>
        {!confirmingReset ? (
          <button className="btn-primary" onClick={() => setConfirmingReset(true)}>Reset to sample data</button>
        ) : (
          <div className="add-form">
            <span className="small" style={{ color: "#D2704F" }}>This clears everything you've entered. Are you sure?</span>
            <button className="btn-primary" onClick={doReset}>Yes, reset</button>
            <button className="btn-primary" onClick={() => setConfirmingReset(false)}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- App ---------- */

const NAV = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "accounts", label: "Accounts", icon: Landmark },
  { id: "investments", label: "Invest", icon: PieChart },
  { id: "budget", label: "Budget", icon: Wallet },
  { id: "ledger", label: "Ledger", icon: Receipt },
  { id: "bills", label: "Bills", icon: CalendarClock },
  { id: "goals", label: "Goals", icon: Target },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

export default function App() {
  const [data, setData, status] = useKovoData();
  const [page, setPage] = useState("overview");

  const netWorth = useMemo(() => (data ? computeNetWorth(data) : 0), [data]);
  const monthTx = useMemo(() => {
    if (!data) return [];
    const m = monthKey(todayISO());
    return data.transactions.filter((t) => monthKey(t.date) === m);
  }, [data]);
  const spentByCategory = useMemo(() => {
    const out = {};
    monthTx.forEach((t) => { if (t.amount < 0) out[t.category] = (out[t.category] || 0) + Math.abs(t.amount); });
    return out;
  }, [monthTx]);

  const cur = data?.settings?.currency || "USD";
  const accentHex = ACCENTS[data?.settings?.accentTheme || "blue"].hex;

  return (
    <div className="kovo-app" style={{ "--accent": accentHex }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Manrope:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');

        .kovo-app {
          --ink: #12151B;
          --surface: #1A2029;
          --surface-raised: #212836;
          --text: #F2F0EA;
          --text-secondary: #B7BCC7;
          --text-muted: #7C8391;
          --hairline: rgba(242,240,234,0.08);
          --moss: #6FA97C;
          --clay: #D2704F;
          --gold: #D6A63F;

          background: var(--ink);
          color: var(--text);
          font-family: 'Manrope', sans-serif;
          display: flex;
          width: 100%;
          min-height: 100vh;
        }
        .kovo-app * { box-sizing: border-box; }
        .kovo-app ::selection { background: rgba(111,169,124,0.3); }

        .sidebar {
          width: 208px;
          flex-shrink: 0;
          background: #0F1218;
          border-right: 1px solid var(--hairline);
          padding: 24px 14px;
          display: flex;
          flex-direction: column;
        }
        .brand {
          font-family: 'Fraunces', serif;
          font-size: 21px;
          font-weight: 600;
          padding: 0 10px 22px;
          border-bottom: 1px solid var(--hairline);
          margin-bottom: 18px;
          display: flex;
          align-items: baseline;
          gap: 5px;
        }
        .brand-dot { color: var(--accent); }
        .nav-item {
          display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px;
          cursor: pointer; font-size: 13.5px; color: var(--text-secondary); margin-bottom: 2px;
          border: none; background: none; width: 100%; text-align: left; font-family: 'Manrope', sans-serif; font-weight: 500;
        }
        .nav-item:hover { background: rgba(242,240,234,0.04); color: var(--text); }
        .nav-item.active { background: var(--surface); color: var(--text); }
        .nav-item.active svg { color: var(--accent); }
        .sidebar-foot { margin-top: auto; font-size: 11.5px; color: var(--text-muted); padding: 10px; border-top: 1px solid var(--hairline); line-height: 1.5; }

        .main { flex: 1; padding: 28px 32px 48px; min-width: 0; }
        .page { display: flex; flex-direction: column; gap: 18px; max-width: 880px; }
        .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; flex-wrap: wrap; gap: 10px; }
        .page-header h1 { font-family: 'Fraunces', serif; font-weight: 500; font-size: 23px; margin: 0; }

        .hero-panel { background: var(--surface); border: 1px solid var(--hairline); border-radius: 14px; padding: 22px 26px 14px; }
        .hero-label { font-size: 13px; color: var(--text-muted); margin-bottom: 6px; font-weight: 500; }
        .hero-value { font-family: 'Fraunces', serif; font-weight: 500; font-size: 40px; font-variant-numeric: tabular-nums; }
        .hero-delta { display: flex; align-items: center; gap: 5px; font-size: 12.5px; margin: 6px 0 4px; font-weight: 500; }

        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .panel { background: var(--surface); border: 1px solid var(--hairline); border-radius: 12px; padding: 18px 20px; }
        .panel-title { font-size: 13.5px; color: var(--text); font-weight: 600; margin-bottom: 12px; }
        .panel-title-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; gap: 8px; flex-wrap: wrap; }
        .panel-title-row .panel-title { margin-bottom: 0; }
        .link-btn { background: none; border: none; color: var(--text-muted); font-size: 12px; display: flex; align-items: center; gap: 2px; cursor: pointer; font-family: inherit; font-weight: 500; padding: 0; }
        .link-btn:hover { color: var(--accent); }

        .flow-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .flow-label { width: 66px; font-size: 12.5px; color: var(--text-secondary); }
        .flow-track { flex: 1; height: 7px; background: rgba(242,240,234,0.06); border-radius: 4px; overflow: hidden; }
        .flow-fill { height: 100%; border-radius: 4px; }
        .flow-value { width: 78px; text-align: right; font-size: 12.5px; font-family: 'IBM Plex Mono', monospace; }
        .flow-net { display: flex; justify-content: space-between; font-size: 13px; font-weight: 500; padding-top: 10px; margin-top: 4px; border-top: 1px solid var(--hairline); }

        .budget-mini { margin-bottom: 12px; } .budget-mini:last-child { margin-bottom: 0; }
        .budget-mini-top { display: flex; justify-content: space-between; font-size: 12.5px; margin-bottom: 5px; }
        .meter-track { height: 6px; background: rgba(242,240,234,0.07); border-radius: 4px; overflow: hidden; }
        .meter-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }

        .bill-mini { display: flex; align-items: center; gap: 12px; padding: 9px 0; border-bottom: 1px solid var(--hairline); }
        .bill-mini:last-child { border-bottom: none; }
        .bill-day { width: 32px; height: 32px; border-radius: 8px; background: var(--surface-raised); display: flex; align-items: center; justify-content: center; font-size: 11px; color: var(--gold); flex-shrink: 0; font-family: 'IBM Plex Mono', monospace; }
        .bill-mini-info { flex: 1; font-size: 13.5px; }
        .small { font-size: 11.5px; }
        .text-muted { color: var(--text-muted); }
        .mono-num { font-variant-numeric: tabular-nums; font-size: 13.5px; font-family: 'IBM Plex Mono', monospace; }

        .btn-primary { background: var(--surface-raised); border: 1px solid var(--hairline); color: var(--text); padding: 9px 15px; border-radius: 8px; font-size: 12.5px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-family: 'Manrope', sans-serif; font-weight: 600; white-space: nowrap; }
        .btn-primary:hover { border-color: var(--accent); color: var(--accent); }

        .icon-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 5px; display: flex; align-items: center; border-radius: 6px; }
        .icon-btn:hover { color: var(--text); background: rgba(242,240,234,0.06); }

        .field { background: var(--surface-raised); border: 1px solid var(--hairline); color: var(--text); padding: 8px 11px; border-radius: 7px; font-size: 13px; font-family: 'Manrope', sans-serif; outline: none; }
        .field:focus { border-color: var(--accent); }

        .add-form { display: flex; gap: 10px; align-items: center; }
        .add-form.wrap { flex-wrap: wrap; }

        .account-row, .tx-row { display: flex; align-items: center; gap: 12px; padding: 11px 0; border-bottom: 1px solid var(--hairline); }
        .account-row:last-child, .tx-row:last-child { border-bottom: none; }
        .account-name, .tx-desc { flex: 1; font-size: 13.5px; min-width: 0; }

        .budget-row { padding: 11px 0; border-bottom: 1px solid var(--hairline); } .budget-row:last-child { border-bottom: none; }
        .budget-row-top { display: flex; justify-content: space-between; align-items: center; font-size: 13.5px; margin-bottom: 6px; }
        .budget-row-right { display: flex; align-items: center; gap: 6px; }
        .inline-num { width: 64px; background: none; border: none; border-bottom: 1px dashed var(--hairline); color: var(--text); font-family: 'IBM Plex Mono', monospace; font-size: 12.5px; text-align: right; outline: none; }
        .over-note { font-size: 11.5px; color: var(--clay); margin-top: 5px; }

        .empty-note { color: var(--text-muted); font-size: 13px; padding: 10px 0; }

        .goal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .goal-card { display: flex; flex-direction: column; gap: 10px; }
        .goal-amount { font-family: 'Fraunces', serif; font-size: 21px; }
        .goal-actions { display: flex; gap: 8px; align-items: center; margin-top: 2px; flex-wrap: wrap; }
        .chip-btn { background: var(--surface-raised); border: 1px solid var(--hairline); color: var(--text-secondary); padding: 5px 10px; border-radius: 14px; font-size: 11.5px; cursor: pointer; font-family: 'Manrope', sans-serif; font-weight: 500; }
        .chip-btn:hover { border-color: var(--accent); color: var(--accent); }
        .goal-done { font-size: 11.5px; color: var(--moss); margin-left: auto; font-weight: 600; }

        .alloc-bar { display: flex; height: 12px; border-radius: 6px; overflow: hidden; margin-bottom: 12px; }
        .alloc-legend { display: flex; flex-wrap: wrap; gap: 12px; }
        .alloc-legend-item { display: flex; align-items: center; gap: 6px; font-size: 12.5px; }
        .alloc-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

        .accent-grid { display: flex; gap: 10px; flex-wrap: wrap; }
        .accent-swatch { display: flex; align-items: center; gap: 8px; background: var(--surface-raised); border: 1px solid var(--hairline); padding: 8px 14px; border-radius: 20px; cursor: pointer; color: var(--text-secondary); font-size: 12.5px; font-family: 'Manrope', sans-serif; font-weight: 500; }
        .accent-swatch.active { border-color: var(--accent); color: var(--text); }
        .accent-dot { width: 10px; height: 10px; border-radius: 50%; }

        .category-chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .cat-chip { display: flex; align-items: center; gap: 6px; background: var(--surface-raised); border: 1px solid var(--hairline); padding: 6px 6px 6px 12px; border-radius: 14px; font-size: 12.5px; }
        .cat-chip button { background: none; border: none; color: var(--text-muted); cursor: pointer; display: flex; padding: 2px; border-radius: 50%; }
        .cat-chip button:hover { color: var(--clay); background: rgba(210,112,79,0.12); }

        @media (max-width: 780px) {
          .kovo-app { flex-direction: column; }
          .sidebar {
            width: 100%; flex-direction: row; overflow-x: auto; padding: 8px 6px;
            border-right: none; border-top: 1px solid var(--hairline);
            position: fixed; bottom: 0; left: 0; right: 0; z-index: 10;
            background: #0F1218; padding-bottom: max(8px, env(safe-area-inset-bottom));
          }
          .brand, .sidebar-foot { display: none; }
          .nav-item { flex-direction: column; gap: 4px; font-size: 10px; padding: 8px 12px; flex-shrink: 0; min-width: 60px; border-radius: 10px; }
          .nav-item.active { background: rgba(242,240,234,0.06); }
          .main { padding: 20px 16px 100px; }
          .grid-2, .goal-grid { grid-template-columns: 1fr; }
          .hero-value { font-size: 32px; }
        }
      `}</style>

      <div className="sidebar">
        <div className="brand">Kovo<span className="brand-dot">.</span></div>
        {NAV.map((n) => (
          <button key={n.id} className={`nav-item ${page === n.id ? "active" : ""}`} onClick={() => setPage(n.id)}>
            <n.icon size={16} />
            {n.label}
          </button>
        ))}
        <div className="sidebar-foot">Your data is saved automatically and only visible to you.</div>
      </div>

      <div className="main">
        {page === "overview" ? (
          <Overview data={data} netWorth={netWorth} monthTx={monthTx} spentByCategory={spentByCategory} setPage={setPage} cur={cur} />
        ) : page === "accounts" ? (
          <Accounts data={data} setData={setData} cur={cur} />
        ) : page === "investments" ? (
          <Investments data={data} setData={setData} cur={cur} />
        ) : page === "budget" ? (
          <Budget data={data} setData={setData} spentByCategory={spentByCategory} cur={cur} />
        ) : page === "ledger" ? (
          <Ledger data={data} setData={setData} cur={cur} />
        ) : page === "bills" ? (
          <Bills data={data} setData={setData} cur={cur} />
        ) : page === "goals" ? (
          <Goals data={data} setData={setData} cur={cur} />
        ) : (
          <Settings data={data} setData={setData} />
        )}
      </div>
    </div>
  );
}
