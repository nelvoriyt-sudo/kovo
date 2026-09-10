import React, { useEffect, useRef, useState } from 'react';
import { LayoutGrid, Wallet, Receipt, CalendarClock, Target, Landmark, PieChart, Settings, MoreHorizontal, X } from 'lucide-react';

const pages = [
  { id: 'overview', label: 'Today', icon: LayoutGrid },
  { id: 'ledger', label: 'Transactions', icon: Receipt },
  { id: 'budget', label: 'Budget', icon: Wallet },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'accounts', label: 'Accounts', icon: Landmark },
  { id: 'bills', label: 'Bills', icon: CalendarClock },
  { id: 'investments', label: 'Investments', icon: PieChart },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Navigation({ page, setPage }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const dialog = useRef(null);
  const moreButton = useRef(null);
  useEffect(() => {
    if (moreOpen) dialog.current.showModal();
    else if (dialog.current.open) { dialog.current.close(); moreButton.current?.focus(); }
  }, [moreOpen]);
  const navigate = id => { setPage(id); setMoreOpen(false); window.scrollTo({ top: 0 }); };
  const item = ({ id, label, icon: Icon }) => (
    <button key={id} className={`nav-item ${page === id ? 'active' : ''}`} aria-current={page === id ? 'page' : undefined} onClick={() => navigate(id)}>
      <Icon size={19} strokeWidth={1.7}/><span>{label}</span>
    </button>
  );
  return <>
    <aside className="sidebar">
      <button className="brand" onClick={() => navigate('overview')} aria-label="Kovo home">Kovo<span className="brand-dot">.</span></button>
      <nav aria-label="Main navigation">{pages.slice(0, 4).map(item)}<div className="nav-divider"/>{pages.slice(4, 7).map(item)}</nav>
      <div className="sidebar-foot">{item(pages[7])}</div>
    </aside>
    <nav className="mobile-nav" aria-label="Mobile navigation">
      {pages.slice(0, 4).map(item)}
      <button ref={moreButton} className={`nav-item ${pages.slice(4).some(item => item.id === page) ? 'active' : ''}`} onClick={() => setMoreOpen(true)} aria-haspopup="dialog" aria-expanded={moreOpen}><MoreHorizontal size={20}/><span>More</span></button>
    </nav>
    <dialog className="navigation-dialog" ref={dialog} onCancel={() => setMoreOpen(false)} onClick={event => { if (event.target === dialog.current) setMoreOpen(false); }}>
      <div className="dialog-heading"><h2>Your workspace</h2><button className="icon-btn" onClick={() => setMoreOpen(false)} aria-label="Close navigation"><X size={20}/></button></div>
      <nav aria-label="More pages">{pages.slice(4).map(item)}</nav>
    </dialog>
  </>;
}
