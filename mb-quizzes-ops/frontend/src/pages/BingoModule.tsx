import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function BingoModule() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [boardOverride, setBoardOverride] = useState<string>('');
  const [decision, setDecision] = useState('');
  const [notes, setNotes] = useState('');

  const fetchData = () => {
    if (!id) return;
    const board = boardOverride ? parseFloat(boardOverride) : undefined;
    api.getEconomics(id, board).then(setData).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(fetchData, [id]);

  const recalc = () => { setLoading(true); fetchData(); };

  const handleDecision = async () => {
    if (!id || !decision) return;
    await api.postDecision(id, {
      decision,
      notes,
      mainCardsSold: data?.sales?.mainSold,
      bonusSold: data?.sales?.bonusSold,
      profitPool: data?.economics?.profitPool,
      hostTake: data?.economics?.hostTake,
      leeTake: data?.economics?.leeTake,
      prizeBoard: data?.board?.total,
    });
    fetchData();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full" /></div>;
  if (!data) return <p>Not found</p>;

  const ec = data.economics;
  const board = data.board;

  return (
    <div>
      <Link to="/" className="text-brand-500 text-sm hover:underline">← Back</Link>
      <h2 className="text-2xl font-bold mt-2">Saturday Musiskill Bingo</h2>
      <p className="text-surface-300 text-sm mb-6">
        {data.event && new Date(data.event.startDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Sales & Forecast */}
        <div className="bg-white border border-surface-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-3">Sales & Forecast</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm">Main Cards Sold</span>
              <span className="font-mono font-bold text-lg">{data.sales?.mainSold ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Bonus Games Sold</span>
              <span className="font-mono font-bold text-lg">{data.sales?.bonusSold ?? 0}</span>
            </div>
            <div className="flex justify-between text-surface-300">
              <span className="text-sm">Main buyers without bonus</span>
              <span className="font-mono">{data.mainCardsWithoutBonus ?? 0}</span>
            </div>
            <div className="border-t border-surface-200 pt-2">
              <div className="flex justify-between">
                <span className="text-sm text-hold">Conservative bonus forecast</span>
                <span className="font-mono font-medium text-hold">{data.conservativeBonusForecast ?? 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Prize Board */}
        <div className="bg-white border border-surface-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-3">4-Game Prize Board</h3>
          {board && (
            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-surface-100">
                <span className="text-sm">Game 1</span>
                <span className="font-mono font-medium">£{board.game1?.toFixed(0)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-surface-100">
                <span className="text-sm">Game 2</span>
                <span className="font-mono font-medium">£{board.game2?.toFixed(0)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-surface-100">
                <span className="text-sm">Game 3</span>
                <span className="font-mono font-medium">£{board.game3?.toFixed(0)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-surface-100">
                <span className="text-sm font-semibold">Game 4 (Bonus)</span>
                <span className="font-mono font-bold">£{board.game4Bonus?.toFixed(0)}</span>
              </div>
              <div className="flex justify-between py-1 pt-2 text-brand-700 font-bold">
                <span>Total Board</span>
                <span className="font-mono">£{board.total?.toFixed(0)}</span>
              </div>
            </div>
          )}
          <div className="mt-4">
            <label className="text-xs text-surface-300 block mb-1">Override prize board</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={boardOverride}
                onChange={e => setBoardOverride(e.target.value)}
                placeholder="200"
                className="flex-1 border border-surface-200 rounded px-2 py-1.5 text-sm font-mono"
              />
              <button onClick={recalc} className="px-3 py-1.5 bg-surface-800 text-white text-sm rounded">Recalc</button>
            </div>
          </div>
          <div className="mt-3 text-xs text-surface-300 space-y-1">
            <p>Max board at soft pool (£75): <strong className="text-surface-800 font-mono">£{data.maxPrizeBoardAtMinPool?.toFixed(0)}</strong></p>
            <p>Max board at target pool (£100): <strong className="text-surface-800 font-mono">£{data.maxPrizeBoardAtTargetPool?.toFixed(0)}</strong></p>
          </div>
        </div>

        {/* Economics & Decision */}
        <div className="bg-white border border-surface-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-3">Economics</h3>
          {ec && (
            <div className="space-y-1 text-sm">
              <Row label="Gross" value={`£${ec.grossCharged.toFixed(2)}`} />
              <Row label="Net after fees" value={`£${ec.netAfterFees.toFixed(2)}`} />
              <Row label="Fixed costs" value={`-£${ec.totalFixedCosts.toFixed(2)}`} dim />
              <Row label="Prize board" value={`-£${ec.totalPrize.toFixed(2)}`} dim />
              <div className="border-t border-surface-200 pt-2 mt-2">
                <Row label="Actual profit pool" value={`£${data.actualPool?.toFixed(2)}`} bold />
                <Row label="Conservative forecast pool" value={`£${data.conservativeForecastPool?.toFixed(2)}`} />
                <Row label="Host take" value={`£${ec.hostTake.toFixed(2)}`} />
                <Row label="Lee/MB take" value={`£${ec.leeTake.toFixed(2)}`} bold />
              </div>

              <div className="mt-4">
                <StatusBadge status={ec.status} />
                <p className="text-xs text-surface-300 mt-1">{ec.statusReason}</p>
              </div>

              {ec.moreMainsNeeded > 0 && (
                <div className="bg-hold/5 border border-hold/20 rounded-md p-2 mt-3">
                  <p className="text-xs text-hold font-medium">Need {ec.moreMainsNeeded} more main cards</p>
                  <p className="text-xs text-hold">Or {ec.moreBonusNeeded} more bonus buyers</p>
                </div>
              )}

              <div className="mt-4 space-y-2">
                <select value={decision} onChange={e => setDecision(e.target.value)} className="w-full border border-surface-200 rounded px-2 py-1.5 text-sm">
                  <option value="">Log decision…</option>
                  <option value="run">✅ RUN</option>
                  <option value="hold">⏸ HOLD</option>
                  <option value="do_not_run">🛑 DO NOT RUN</option>
                </select>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes" className="w-full border border-surface-200 rounded px-2 py-1.5 text-sm h-16 resize-none" />
                <button onClick={handleDecision} disabled={!decision} className="w-full bg-brand-600 text-white rounded px-3 py-1.5 text-sm font-medium hover:bg-brand-500 disabled:opacity-50">
                  Save Decision
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold, dim }: { label: string; value: string; bold?: boolean; dim?: boolean }) {
  return (
    <div className="flex justify-between py-0.5">
      <span className={dim ? 'text-surface-300 text-xs' : 'text-xs'}>{label}</span>
      <span className={`font-mono ${bold ? 'font-bold' : ''} ${dim ? 'text-surface-300' : ''}`}>{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const c: Record<string, string> = { run: 'bg-go text-white', hold: 'bg-hold text-white', do_not_run: 'bg-nogo text-white' };
  const l: Record<string, string> = { run: 'RUN', hold: 'HOLD', do_not_run: 'DO NOT RUN' };
  return <span className={`inline-block px-3 py-1 rounded-md text-sm font-bold ${c[status]}`}>{l[status]}</span>;
}
