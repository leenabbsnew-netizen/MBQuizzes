import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

const STATUS_COLORS: Record<string, string> = {
  run: 'bg-go/10 text-go border-go/20',
  hold: 'bg-hold/10 text-hold border-hold/20',
  do_not_run: 'bg-nogo/10 text-nogo border-nogo/20',
};

const STATUS_LABELS: Record<string, string> = {
  run: 'RUN',
  hold: 'HOLD',
  do_not_run: 'DO NOT RUN',
};

export default function Dashboard() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getEvents().then(setEvents).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  const onSale = events.filter(e => e.status === 'on_sale');
  const past = events.filter(e => e.status !== 'on_sale');

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1">Dashboard</h2>
      <p className="text-surface-300 text-sm mb-6">
        {onSale.length} events on sale · {events.length} total synced
      </p>

      {events.length === 0 && (
        <div className="bg-surface-100 rounded-xl p-10 text-center">
          <p className="text-surface-300 mb-2">No events synced yet.</p>
          <p className="text-sm text-surface-300">Click <strong>Sync Now</strong> in the sidebar to pull data from Ticket Tailor.</p>
        </div>
      )}

      {onSale.length > 0 && (
        <section className="mb-8">
          <h3 className="text-sm font-semibold text-surface-300 uppercase tracking-wider mb-3">On Sale</h3>
          <div className="space-y-2">
            {onSale.map(event => (
              <EventRow key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-surface-300 uppercase tracking-wider mb-3">Past / Other</h3>
          <div className="space-y-2">
            {past.slice(0, 20).map(event => (
              <EventRow key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function EventRow({ event }: { event: any }) {
  const decision = event.latestDecision?.decision;
  const isBingo = event.eventType === 'standalone_bingo';
  const detailPath = isBingo ? `/bingo/${event.id}` : `/events/${event.id}`;

  return (
    <Link
      to={detailPath}
      className="flex items-center gap-4 bg-white border border-surface-200 rounded-lg px-4 py-3 hover:border-brand-400 transition-colors group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{event.name}</span>
          <TypeBadge type={event.eventType} />
        </div>
        <p className="text-xs text-surface-300 mt-0.5">
          {new Date(event.startDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          {event.host && <span> · {event.host}</span>}
        </p>
      </div>

      <div className="flex items-center gap-6 text-sm">
        <div className="text-right">
          <p className="font-mono font-medium">{event.mainSold}</p>
          <p className="text-xs text-surface-300">{isBingo ? 'cards' : 'teams'}</p>
        </div>
        {event.bonusSold > 0 && (
          <div className="text-right">
            <p className="font-mono font-medium">{event.bonusSold}</p>
            <p className="text-xs text-surface-300">bonus</p>
          </div>
        )}
        <div className="text-right">
          <p className="font-mono font-medium">£{event.totalRevenue?.toFixed(0)}</p>
          <p className="text-xs text-surface-300">gross</p>
        </div>
        {decision && (
          <span className={`px-2 py-0.5 rounded text-xs font-bold border ${STATUS_COLORS[decision] || ''}`}>
            {STATUS_LABELS[decision] || decision}
          </span>
        )}
      </div>
    </Link>
  );
}

function TypeBadge({ type }: { type: string }) {
  const labels: Record<string, string> = {
    core_quiz: 'Quiz',
    themed_quiz: 'Themed',
    core_quiz_bingo: 'Quiz+Bingo',
    themed_quiz_bingo: 'Themed+Bingo',
    standalone_bingo: 'Bingo',
  };
  return (
    <span className="px-1.5 py-0.5 bg-surface-100 text-surface-300 text-[10px] font-medium rounded uppercase">
      {labels[type] || type}
    </span>
  );
}

function Loader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full" />
    </div>
  );
}
