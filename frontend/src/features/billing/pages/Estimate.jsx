import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import ErrorMessage from '../../../components/common/ErrorMessage.jsx';
import LoadingState from '../../../components/common/LoadingState.jsx';
import StatusBadge from '../../../components/common/StatusBadge.jsx';
import { fetchEstimate } from '../../../services/order.service.js';
import { formatDateTime } from '../../../utils/format-date.js';
import { formatAmount, fullName, isAbortError } from '../../../utils/order-helpers.js';
import '../../../styles/estimate.css';

export default function Estimate() {
  const { order_id: orderId } = useParams();
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    fetchEstimate(orderId, { signal: controller.signal })
      .then(setEstimate)
      .catch((err) => {
        if (isAbortError(err)) return;
        setError(
          err.status === 404 ? 'This order does not exist.' : err.message || 'Could not load.',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [orderId]);

  if (loading) return <LoadingState message="Loading estimate…" />;

  const toolbar = (
    <div className="estimate-toolbar no-print">
      <Link to={`/admin/order/${orderId}`} className="btn btn-outline-secondary">
        <ArrowLeft size={16} aria-hidden="true" />
        Back to order
      </Link>
      {estimate && (
        <button type="button" className="btn btn-ink" onClick={() => window.print()}>
          <Printer size={16} aria-hidden="true" />
          Print / Save as PDF
        </button>
      )}
    </div>
  );

  if (!estimate) {
    return (
      <div>
        {toolbar}
        <ErrorMessage message={error || 'The estimate is not available.'} />
      </div>
    );
  }

  const { garage, customer, vehicle, lines } = estimate;

  return (
    <article className="estimate">
      {toolbar}

      <header className="estimate-head">
        <div>
          <h1>{garage?.name}</h1>
          <p>
            {garage?.address}
            <br />
            {[garage?.phone, garage?.email].filter(Boolean).join(' · ')}
          </p>
        </div>
        <div className="estimate-meta">
          <p className="estimate-kind">Estimate</p>
          <p className="estimate-number">{estimate.estimate_number}</p>
          <p>Issued {formatDateTime(estimate.issued_at)}</p>
          <StatusBadge status={estimate.status} />
        </div>
      </header>

      <section className="estimate-parties">
        <div>
          <h2>Customer</h2>
          <p>
            <strong>{fullName(customer)}</strong>
            <br />
            {customer?.email}
            <br />
            {customer?.phone}
          </p>
        </div>
        <div>
          <h2>Vehicle</h2>
          <p>
            <strong>
              {vehicle?.year} {vehicle?.make} {vehicle?.model}
            </strong>
            <br />
            Tag {vehicle?.plate}
            {vehicle?.vin && (
              <>
                <br />
                Serial {vehicle.vin}
              </>
            )}
          </p>
        </div>
      </section>

      <table className="estimate-table">
        <thead>
          <tr>
            <th scope="col">Service</th>
            <th scope="col" className="num">
              Price
            </th>
          </tr>
        </thead>
        <tbody>
          {(lines ?? []).map((line) => (
            <tr key={line.line_id}>
              <td>
                <strong>{line.service_name}</strong>
                {line.description && <span className="estimate-desc">{line.description}</span>}
              </td>
              <td className="num">{formatAmount(line.line_price, estimate.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="estimate-totals">
        <div>
          <dt>Subtotal</dt>
          <dd>{formatAmount(estimate.subtotal, estimate.currency)}</dd>
        </div>
        <div>
          <dt>VAT ({Number(estimate.vat_rate)}%)</dt>
          <dd>{formatAmount(estimate.vat_amount, estimate.currency)}</dd>
        </div>
        <div className="grand">
          <dt>Total</dt>
          <dd>{formatAmount(estimate.total, estimate.currency)}</dd>
        </div>
      </dl>

      <p className="estimate-foot">
        This is an estimate, not an invoice. Work starts once you approve it.
      </p>
    </article>
  );
}
