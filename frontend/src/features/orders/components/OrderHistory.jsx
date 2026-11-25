import { formatDateTime } from '../../../utils/format-date.js';
import { humanizeAction } from '../../../utils/order-helpers.js';


export default function OrderHistory({ history }) {
  const entries = [...(history ?? [])].reverse();
  return (
    <section className="ag-card" aria-labelledby="order-history-title">
      <h2 id="order-history-title" className="ord-card-title">
        History
      </h2>
      {entries.length === 0 ? (
        <p className="ord-empty">No history yet.</p>
      ) : (
        <ol className="ord-timeline">
          {entries.map((entry) => (
            <li key={entry.history_id}>
              <span className="ord-timeline-action">{humanizeAction(entry.action)}</span>
              <span className="ord-timeline-meta">
                {entry.employee_name || 'System'} · {formatDateTime(entry.created_at)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
