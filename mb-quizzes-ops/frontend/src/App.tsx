import { Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import EventDetail from './pages/EventDetail';
import BingoModule from './pages/BingoModule';
import Assumptions from './pages/Assumptions';
import Reconciliation from './pages/Reconciliation';
import DecisionLog from './pages/DecisionLog';

const NAV = [
  { to: '/', label: 'Dashboard' },
  { to: '/decisions', label: 'Decisions' },
  { to: '/reconciliation', label: 'Reconciliation' },
  { to: '/assumptions', label: 'Assumptions' },
];

export default function App() {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-56 bg-surface-900 text-white flex-shrink-0 flex flex-col">
        <div className="p-5 border-b border-white/10">
          <h1 className="text-lg font-bold tracking-tight">MB Quizzes</h1>
          <p className="text-xs text-white/50 mt-0.5">Operating System</p>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive ? 'bg-brand-600 text-white font-medium' : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <SyncButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/bingo/:id" element={<BingoModule />} />
            <Route path="/decisions" element={<DecisionLog />} />
            <Route path="/reconciliation" element={<Reconciliation />} />
            <Route path="/assumptions" element={<Assumptions />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function SyncButton() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setResult(null);
    try {
      const { api } = await import('./lib/api');
      const res = await api.triggerSync();
      setResult(`TT: ${res.tt.eventsProcessed}e/${res.tt.ordersProcessed}o | Stripe: ${res.stripe.paymentsProcessed}p`);
    } catch (err: any) {
      setResult(`Error: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleSync}
        disabled={syncing}
        className="w-full px-3 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-sm rounded-md font-medium transition-colors"
      >
        {syncing ? 'Syncing…' : '⟳ Sync Now'}
      </button>
      {result && <p className="text-xs text-white/50 mt-2 leading-snug">{result}</p>}
    </div>
  );
}

import { useState } from 'react';
