import { useEffect, useState } from 'react';
import { api } from '../lib/api';

const FIELDS: { key: string; label: string; type: 'number' | 'percent'; group: string }[] = [
  { key: 'quizBasePrice', label: 'Quiz base price (£)', type: 'number', group: 'Pricing' },
  { key: 'themedQuizBasePrice', label: 'Themed quiz base price (£)', type: 'number', group: 'Pricing' },
  { key: 'bonusBingoBasePrice', label: 'Bonus bingo base price (£)', type: 'number', group: 'Pricing' },
  { key: 'bingoMainCardAllIn', label: 'Bingo main card all-in (£)', type: 'number', group: 'Pricing' },
  { key: 'bingoBonusAllIn', label: 'Bingo bonus all-in (£)', type: 'number', group: 'Pricing' },
  { key: 'customerVatRate', label: 'Customer VAT rate', type: 'percent', group: 'Tax & Fees' },
  { key: 'flatRateVat', label: 'Flat-rate VAT', type: 'percent', group: 'Tax & Fees' },
  { key: 'stripeFeePercent', label: 'Stripe fee %', type: 'percent', group: 'Tax & Fees' },
  { key: 'stripeFixedFee', label: 'Stripe fixed fee (£)', type: 'number', group: 'Tax & Fees' },
  { key: 'paygFeePerItem', label: 'PAYG fee per item (£)', type: 'number', group: 'Tax & Fees' },
  { key: 'coreQuizAds', label: 'Core quiz ads (£)', type: 'number', group: 'Event Costs' },
  { key: 'coreQuizActivation', label: 'Core quiz activation (£)', type: 'number', group: 'Event Costs' },
  { key: 'themedQuizAds', label: 'Themed quiz ads (£)', type: 'number', group: 'Event Costs' },
  { key: 'themedQuizActivation', label: 'Themed quiz activation (£)', type: 'number', group: 'Event Costs' },
  { key: 'themedQuizWriting', label: 'Themed quiz writing (£)', type: 'number', group: 'Event Costs' },
  { key: 'bingoAds', label: 'Bingo ads (£)', type: 'number', group: 'Event Costs' },
  { key: 'bingoSoftwareOther', label: 'Bingo software/other (£)', type: 'number', group: 'Event Costs' },
  { key: 'hostLicencePerMonth', label: 'Host licence per month (£)', type: 'number', group: 'Host & Payout' },
  { key: 'satBingoEventsPerMonth', label: 'Sat bingo events per month', type: 'number', group: 'Host & Payout' },
  { key: 'hostMinimum', label: 'Host minimum (£)', type: 'number', group: 'Host & Payout' },
  { key: 'hostSplitPercent', label: 'Host split %', type: 'percent', group: 'Host & Payout' },
  { key: 'leeMinimumAcceptable', label: 'Lee minimum acceptable (£)', type: 'number', group: 'Host & Payout' },
  { key: 'bingoTargetPool', label: 'Bingo target pool (£)', type: 'number', group: 'Bingo Thresholds' },
  { key: 'bingoSoftPool', label: 'Bingo soft pool (£)', type: 'number', group: 'Bingo Thresholds' },
  { key: 'bingoDefaultPrizeBoard', label: 'Default prize board (£)', type: 'number', group: 'Bingo Thresholds' },
  { key: 'bingoConservativeBonus', label: 'Conservative bonus conversion', type: 'percent', group: 'Bingo Thresholds' },
  { key: 'bingoPrizePerBonus', label: 'Bingo prize per bonus (£)', type: 'number', group: 'Bingo Thresholds' },
  { key: 'bingoPrizeCap', label: 'Bingo prize cap (£)', type: 'number', group: 'Bingo Thresholds' },
];

export default function Assumptions() {
  const [data, setData] = useState<any>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getAssumptions().then(d => { setData(d); }).catch(console.error);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const updates: Record<string, number> = {};
    for (const [key, val] of Object.entries(edits)) {
      const field = FIELDS.find(f => f.key === key);
      const num = parseFloat(val);
      if (!isNaN(num)) {
        updates[key] = field?.type === 'percent' ? num / 100 : num;
      }
    }
    try {
      const updated = await api.updateAssumptions(updates);
      setData(updated);
      setEdits({});
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!data) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full" /></div>;

  const groups = [...new Set(FIELDS.map(f => f.group))];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Assumptions</h2>
          <p className="text-surface-300 text-sm">Edit business rules and pricing. All calculations update live.</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-go text-sm font-medium">✓ Saved</span>}
          <button
            onClick={handleSave}
            disabled={saving || Object.keys(edits).length === 0}
            className="px-4 py-2 bg-brand-600 text-white text-sm rounded-md font-medium hover:bg-brand-500 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {groups.map(group => (
          <div key={group} className="bg-white border border-surface-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-surface-800 mb-4">{group}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {FIELDS.filter(f => f.group === group).map(field => {
                const raw = data[field.key];
                const display = field.type === 'percent' ? (raw * 100).toFixed(1) : raw?.toString() ?? '';
                const edited = edits[field.key];
                return (
                  <div key={field.key}>
                    <label className="text-xs text-surface-300 block mb-1">{field.label}</label>
                    <input
                      type="number"
                      step={field.type === 'percent' ? '0.1' : '0.01'}
                      value={edited ?? display}
                      onChange={e => setEdits({ ...edits, [field.key]: e.target.value })}
                      className={`w-full border rounded px-3 py-1.5 text-sm font-mono ${edited !== undefined ? 'border-brand-400 bg-brand-50' : 'border-surface-200'}`}
                    />
                    {field.type === 'percent' && <span className="text-[10px] text-surface-300">Enter as %, e.g. 12.5</span>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
