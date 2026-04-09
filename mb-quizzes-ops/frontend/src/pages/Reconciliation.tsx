import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function Reconciliation() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getReconciliation().then(setReport).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full" /></div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1">Reconciliation</h2>
      <p className="text-surface-300 text-sm mb-6">Stripe vs Ticket Tailor matching</p>

      {!report && <p className="text-surface-300">No data. Run a sync first.</p>}

      {report && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Metric label="Matched" value={report.matched} color="text-go" />
            <Metric label="Stripe Gross" value={`£${report.totalStripeGross.toFixed(2)}`} />
            <Metric label="TT Gross" value={`£${report.totalTTGross.toFixed(2)}`} />
            <Metric label="Variance" value={`£${report.variance.toFixed(2)}`} color={Math.abs(report.variance) > 1 ? 'text-nogo' : 'text-go'} />
          </div>

          {/* Unmatched Payments */}
          {report.unmatchedPayments?.length > 0 && (
            <Section title={`Unmatched Stripe Payments (${report.unmatchedPayments.length})`} warning>
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-surface-300"><th className="pb-1">Charge ID</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {report.unmatchedPayments.map((p: any, i: number) => (
                    <tr key={i} className="border-t border-surface-100">
                      <td className="py-1 font-mono text-xs">{p.stripeChargeId}</td>
                      <td className="font-mono">£{p.amount.toFixed(2)}</td>
                      <td>{p.status}</td>
                      <td className="text-surface-300">{new Date(p.date).toLocaleDateString('en-GB')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          {/* Unmatched Orders */}
          {report.unmatchedOrders?.length > 0 && (
            <Section title={`Unmatched TT Orders (${report.unmatchedOrders.length})`} warning>
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-surface-300"><th className="pb-1">Order ID</th><th>Amount</th><th>Reason</th></tr></thead>
                <tbody>
                  {report.unmatchedOrders.map((o: any, i: number) => (
                    <tr key={i} className="border-t border-surface-100">
                      <td className="py-1 font-mono text-xs">{o.ttOrderId}</td>
                      <td className="font-mono">£{o.totalPaid.toFixed(2)}</td>
                      <td className="text-xs text-surface-300">{o.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          {/* Refunds */}
          {report.refunds?.length > 0 && (
            <Section title={`Refunds (${report.refunds.length})`}>
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-surface-300"><th className="pb-1">Charge ID</th><th>Original</th><th>Refunded</th></tr></thead>
                <tbody>
                  {report.refunds.map((r: any, i: number) => (
                    <tr key={i} className="border-t border-surface-100">
                      <td className="py-1 font-mono text-xs">{r.stripeChargeId}</td>
                      <td className="font-mono">£{r.originalAmount.toFixed(2)}</td>
                      <td className="font-mono text-nogo">£{r.refundedAmount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          {/* Duplicates */}
          {report.duplicates?.length > 0 && (
            <Section title={`Possible Duplicates (${report.duplicates.length})`} warning>
              {report.duplicates.map((d: any, i: number) => (
                <div key={i} className="text-sm py-1">
                  <span className="font-mono text-xs">{d.stripeChargeId}</span> → {d.matchedOrderIds.join(', ')}
                </div>
              ))}
            </Section>
          )}

          {report.unmatchedPayments?.length === 0 && report.unmatchedOrders?.length === 0 && report.refunds?.length === 0 && (
            <div className="bg-go/5 border border-go/20 rounded-xl p-6 text-center">
              <p className="text-go font-medium">All clear — no exceptions found.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Metric({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-white border border-surface-200 rounded-xl p-4">
      <p className="text-xs text-surface-300">{label}</p>
      <p className={`text-xl font-mono font-bold mt-1 ${color || ''}`}>{value}</p>
    </div>
  );
}

function Section({ title, children, warning }: { title: string; children: React.ReactNode; warning?: boolean }) {
  return (
    <div className={`border rounded-xl p-5 mb-4 ${warning ? 'border-hold/30 bg-hold/5' : 'border-surface-200 bg-white'}`}>
      <h3 className="text-sm font-semibold mb-3">{title}</h3>
      {children}
    </div>
  );
}
