import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [econ, setEcon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([api.getEvent(id), api.getEconomics(id)])
      .then(([d, e]) => { setData(d); setEcon(e); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleDecision = async () => {
    if (!id || !decision) return;
    setSaving(true);
    try {
      await api.postDecision(id, {
        decision,
        notes,
        mainCardsSold: econ?.sales?.mainSold,
        bonusSold: econ?.sales?.bonusSold,
        profitPool: econ?.economics?.profitPool,
        hostTake: econ?.economics?.hostTake,
        leeTake: econ?.economics?.leeTake,
      });
      // Refresh
      const e = await api.getEconomics(id);
      setEcon(e);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full" /></div>;
  if (!data) return <p>Event not found</p>;

  const ec = econ?.economics;
  const sales = econ?.sales;

  return (
    <div>
      <Link to="/" className="text-brand-500 text-sm hover:underline">← Back</Link>
      <h2 className="text-2xl font-bold mt-2">{data.name}</h2>
      <p className="text-surface-300 text-sm mb-6">
        {new Date(data.startDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        {data.host && <span> · Host: {data.host}</span>}
        <span> · Type: {data.eventType}</span>
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales */}
        <Card title="Sales">
          <Stat label={data.eventType === 'standalone_bingo' ? 'Main Cards' : 'Teams'} value={sales?.mainSold ?? 0} />
          <Stat label="Bonus Bingo" value={sales?.bonusSold ?? 0} />
          <Stat label="Total Orders" value={sales?.totalOrders ?? 0} />
          <div className="border-t border-surface-200 pt-2 mt-2">
            <h4 className="text-xs font-semibold text-surface-300 mb-1">Ticket Types</h4>
            {data.ticketTypes?.map((tt: any) => (
              <div key={tt.id} className="flex justify-between text-xs py-0.5">
                <span className="text-surface-800 truncate mr-2">{tt.name}</span>
                <span className="font-mono">{tt.sold}/{tt.quantity || '∞'}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Economics */}
        {ec && (
          <Card title="Economics">
            <Stat label="Gross Charged" value={`£${ec.grossCharged.toFixed(2)}`} />
            <Stat label="Flat-Rate VAT" value={`-£${ec.flatRateVatAmount.toFixed(2)}`} subtle />
            <Stat label="Stripe Fees" value={`-£${ec.stripeFees.toFixed(2)}`} subtle />
            <Stat label="PAYG Fees" value={`-£${ec.paygFees.toFixed(2)}`} subtle />
            <Stat label="Net After Fees" value={`£${ec.netAfterFees.toFixed(2)}`} bold />
            <div className="border-t border-surface-200 mt-2 pt-2">
              <Stat label="Ads" value={`-£${ec.ads.toFixed(2)}`} subtle />
              <Stat label="Activation" value={`-£${ec.activation.toFixed(2)}`} subtle />
              {ec.writing > 0 && <Stat label="Writing" value={`-£${ec.writing.toFixed(2)}`} subtle />}
              {ec.licence > 0 && <Stat label="Licence" value={`-£${ec.licence.toFixed(2)}`} subtle />}
              <Stat label="Total Prize" value={`-£${ec.totalPrize.toFixed(2)}`} subtle />
            </div>
            <div className="border-t border-surface-200 mt-2 pt-2">
              <Stat label="Profit Pool" value={`£${ec.profitPool.toFixed(2)}`} bold />
              <Stat label="Host Take" value={`£${ec.hostTake.toFixed(2)}`} />
              <Stat label="Lee/MB Take" value={`£${ec.leeTake.toFixed(2)}`} bold />
            </div>
          </Card>
        )}

        {/* Decision */}
        {ec && (
          <Card title="Decision">
            <StatusBadge status={ec.status} reason={ec.statusReason} />

            {ec.moreMainsNeeded > 0 && (
              <p className="text-xs text-hold mt-2">
                Need {ec.moreMainsNeeded} more {data.eventType === 'standalone_bingo' ? 'main cards' : 'teams'} to clear minimum
              </p>
            )}
            {ec.moreBonusNeeded > 0 && (
              <p className="text-xs text-hold">
                Or {ec.moreBonusNeeded} more bonus buyers
              </p>
            )}

            <div className="mt-4 space-y-2">
              <select
                value={decision}
                onChange={e => setDecision(e.target.value)}
                className="w-full border border-surface-200 rounded-md px-3 py-2 text-sm"
              >
                <option value="">Log a decision…</option>
                <option value="run">✅ RUN</option>
                <option value="hold">⏸ HOLD</option>
                <option value="do_not_run">🛑 DO NOT RUN</option>
              </select>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Notes (optional)"
                className="w-full border border-surface-200 rounded-md px-3 py-2 text-sm h-20 resize-none"
              />
              <button
                onClick={handleDecision}
                disabled={!decision || saving}
                className="w-full bg-brand-600 text-white rounded-md px-3 py-2 text-sm font-medium hover:bg-brand-500 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Decision'}
              </button>
            </div>

            {data.decisions?.length > 0 && (
              <div className="mt-4 border-t border-surface-200 pt-2">
                <h4 className="text-xs font-semibold text-surface-300 mb-1">History</h4>
                {data.decisions.map((d: any) => (
                  <div key={d.id} className="text-xs py-1 flex justify-between">
                    <span className="font-medium">{d.decision.toUpperCase()}</span>
                    <span className="text-surface-300">{new Date(d.createdAt).toLocaleDateString('en-GB')}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-surface-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-surface-800 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Stat({ label, value, bold, subtle }: { label: string; value: string | number; bold?: boolean; subtle?: boolean }) {
  return (
    <div className="flex justify-between items-baseline py-0.5">
      <span className={`text-xs ${subtle ? 'text-surface-300' : 'text-surface-800'}`}>{label}</span>
      <span className={`font-mono text-sm ${bold ? 'font-bold' : ''} ${subtle ? 'text-surface-300' : ''}`}>{value}</span>
    </div>
  );
}

function StatusBadge({ status, reason }: { status: string; reason: string }) {
  const colors: Record<string, string> = {
    run: 'bg-go/10 text-go border-go/30',
    hold: 'bg-hold/10 text-hold border-hold/30',
    do_not_run: 'bg-nogo/10 text-nogo border-nogo/30',
  };
  const labels: Record<string, string> = { run: 'RUN', hold: 'HOLD', do_not_run: 'DO NOT RUN' };
  return (
    <div>
      <span className={`inline-block px-3 py-1 rounded-md text-sm font-bold border ${colors[status] || ''}`}>
        {labels[status] || status}
      </span>
      <p className="text-xs text-surface-300 mt-1">{reason}</p>
    </div>
  );
}
