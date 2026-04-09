import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function DecisionLog() {
  const [decisions, setDecisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDecisions().then(setDecisions).catch(console.error).finally(() => setLoading(false));
  }, []);

  const exportCsv = () => {
    const headers = ['Date', 'Event', 'Decision', 'Main Sold', 'Bonus Sold', 'Profit Pool', 'Host Take', 'Lee Take', 'Prize Board', 'Notes'];
    const rows = decisions.map(d => [
      new Date(d.createdAt).toISOString(),
      d.event?.name || '',
      d.decision,
      d.mainCardsSold ?? '',
      d.bonusSold ?? '',
      d.profitPool?.toFixed(2) ?? '',
      d.hostTake?.toFixed(2) ?? '',
      d.leeTake?.toFixed(2) ?? '',
      d.prizeBoard?.toFixed(2) ?? '',
      d.notes || '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mb-quizzes-decisions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Decision Log</h2>
          <p className="text-surface-300 text-sm">{decisions.length} decisions recorded</p>
        </div>
        <button onClick={exportCsv} className="px-4 py-2 bg-surface-800 text-white text-sm rounded-md font-medium hover:bg-surface-900">
          Export CSV
        </button>
      </div>

      {decisions.length === 0 ? (
        <div className="bg-surface-100 rounded-xl p-10 text-center text-surface-300">No decisions logged yet.</div>
      ) : (
        <div className="bg-white border border-surface-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-surface-300 border-b border-surface-200">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Decision</th>
                <th className="px-4 py-3 text-right">Main</th>
                <th className="px-4 py-3 text-right">Bonus</th>
                <th className="px-4 py-3 text-right">Pool</th>
                <th className="px-4 py-3 text-right">Lee</th>
                <th className="px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {decisions.map(d => (
                <tr key={d.id} className="border-t border-surface-100 hover:bg-surface-50">
                  <td className="px-4 py-2 text-xs text-surface-300">{new Date(d.createdAt).toLocaleDateString('en-GB')}</td>
                  <td className="px-4 py-2 font-medium truncate max-w-[200px]">{d.event?.name || '—'}</td>
                  <td className="px-4 py-2">
                    <StatusPill status={d.decision} />
                  </td>
                  <td className="px-4 py-2 text-right font-mono">{d.mainCardsSold ?? '—'}</td>
                  <td className="px-4 py-2 text-right font-mono">{d.bonusSold ?? '—'}</td>
                  <td className="px-4 py-2 text-right font-mono">{d.profitPool != null ? `£${d.profitPool.toFixed(0)}` : '—'}</td>
                  <td className="px-4 py-2 text-right font-mono font-medium">{d.leeTake != null ? `£${d.leeTake.toFixed(0)}` : '—'}</td>
                  <td className="px-4 py-2 text-xs text-surface-300 truncate max-w-[150px]">{d.notes || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const c: Record<string, string> = {
    run: 'bg-go/10 text-go',
    hold: 'bg-hold/10 text-hold',
    do_not_run: 'bg-nogo/10 text-nogo',
  };
  const l: Record<string, string> = { run: 'RUN', hold: 'HOLD', do_not_run: 'NO-GO' };
  return <span className={`px-2 py-0.5 rounded text-xs font-bold ${c[status]}`}>{l[status] || status}</span>;
}
