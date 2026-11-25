/* global URLSearchParams */
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Eye, Pencil, Plus } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext.jsx';
import { OFFICE } from '../../../constants/roles.js';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue.js';
import { fetchOrders } from '../../../services/order.service.js';
import ErrorMessage from '../../../components/common/ErrorMessage.jsx';
import SearchBox from '../../../components/common/SearchBox.jsx';
import StatusBadge from '../../../components/common/StatusBadge.jsx';
import { ORDER_STATUS, ORDER_STATUS_OPTIONS } from '../../../constants/orders.js';
import {
  formatAmount,
  formatShortDate,
  isAbortError,
  parsePage,
  parsePaid,
  parseStatus,
} from '../../../utils/order-helpers.js';
import '../../../styles/orders.css';

const PAGE_SIZE = 10;

// BE-030: every repair order, newest first, with search and filters.
// The filters live in the URL (?search=sara&status=1&page=2), so a refresh, the Back button
// or a copied link all show the same list.
export default function OrderList() {
  const { employee } = useAuth();
  const canManage = OFFICE.includes(employee.role_id);

  const [params, setParams] = useSearchParams();
  const search = params.get('search') ?? '';
  const status = parseStatus(params.get('status'));
  const paid = parsePaid(params.get('paid'));
  const page = parsePage(params.get('page'));

  // What is typed in the box right now. It is copied into the URL 350 ms after typing stops,
  // so the server is not asked on every key press.
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebouncedValue(searchInput, 350).trim();

  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Change some URL parameters at once. An empty value removes the parameter.
  function updateParams(changes, { replace = false } = {}) {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined) next.delete(key);
      else next.set(key, String(value));
    });
    setParams(next, { replace });
  }

  // Typing finished: put the search into the URL and go back to page 1.
  // The dependency list holds only the settled text on purpose: this must run when the typing
  // stops, not every time some other part of the URL changes.
  useEffect(() => {
    if (debouncedSearch !== search) {
      updateParams({ search: debouncedSearch, page: '' }, { replace: true });
    }
  }, [debouncedSearch]);

  // Load the list whenever a filter or the page changes.
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    fetchOrders({
      search,
      status,
      paid,
      page,
      limit: PAGE_SIZE,
      signal: controller.signal,
    })
      .then((data) => {
        setOrders(data?.orders ?? []);
        setPagination(data?.pagination ?? null);
      })
      .catch((err) => {
        if (isAbortError(err)) return;
        setOrders([]);
        setPagination(null);
        setError(err.message || 'Could not load the orders. Please try again.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [search, status, paid, page]);

  const hasFilters = Boolean(search || status || paid);
  const totalPages = pagination?.total_pages || 1;

  // The page number lives in the URL (?page=2); page 1 needs no parameter.
  function goToPage(target) {
    const next = Math.min(Math.max(1, target), totalPages);
    updateParams({ page: next === 1 ? '' : next });
  }

  function clearFilters() {
    setSearchInput('');
    setParams(new URLSearchParams());
  }

  return (
    <div>
      <div className="ord-heading">
        <h1 className="page-title">Orders</h1>
        {canManage && (
          <Link to="/admin/order/new" className="btn btn-brand">
            <Plus size={18} aria-hidden="true" />
            New order
          </Link>
        )}
      </div>

      <div className="ord-filters">
        <div className="ord-filter-search">
          <SearchBox
            value={searchInput}
            onChange={setSearchInput}
            label="Search orders"
            placeholder="Search by customer name or vehicle plate"
          />
        </div>
        <div>
          <label className="visually-hidden" htmlFor="order-status-filter">
            Filter by status
          </label>
          <select
            id="order-status-filter"
            className="form-select"
            value={status}
            onChange={(event) => updateParams({ status: event.target.value, page: '' })}
          >
            <option value="">All statuses</option>
            {ORDER_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="visually-hidden" htmlFor="order-paid-filter">
            Filter by payment
          </label>
          <select
            id="order-paid-filter"
            className="form-select"
            value={paid}
            onChange={(event) => updateParams({ paid: event.target.value, page: '' })}
          >
            <option value="">Paid and unpaid</option>
            <option value="false">Unpaid</option>
            <option value="true">Paid</option>
          </select>
        </div>
      </div>

      <ErrorMessage message={error} />

      <div className="table-responsive ord-table-wrap">
        <table className="table align-middle ord-table">
          <caption className="visually-hidden">Repair orders, newest first</caption>
          <thead>
            <tr>
              <th scope="col">Order</th>
              <th scope="col">Customer</th>
              <th scope="col">Vehicle</th>
              <th scope="col">Order date</th>
              <th scope="col" className="text-end">
                Total
              </th>
              <th scope="col">Status</th>
              <th scope="col" className="text-end">
                {canManage ? 'View/Edit' : 'View'}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="ord-empty" role="status">
                  Loading orders…
                </td>
              </tr>
            )}
            {!loading && orders.length === 0 && !error && (
              <tr>
                <td colSpan={7} className="ord-empty">
                  {hasFilters ? (
                    <>
                      No orders match these filters.{' '}
                      <button type="button" className="btn btn-link p-0" onClick={clearFilters}>
                        Clear filters
                      </button>
                    </>
                  ) : (
                    'No orders yet.'
                  )}
                </td>
              </tr>
            )}
            {!loading &&
              orders.map((order) => (
                <tr key={order.order_id}>
                  <td className="fw-bold">#{order.order_id}</td>
                  <td>
                    <Link to={`/admin/customer/${order.customer_id}`} className="ord-link">
                      {order.customer_name}
                    </Link>
                  </td>
                  <td>
                    <Link to={`/admin/vehicle/${order.vehicle_id}`} className="ord-link mono">
                      {order.plate}
                    </Link>
                  </td>
                  <td className="ord-date">
                    {formatShortDate(order.created_at)}
                    <span className="ord-sub">
                      Ready by {formatShortDate(order.estimated_ready_date)}
                    </span>
                  </td>
                  <td className="text-end ord-num">
                    {formatAmount(order.total, order.currency)}
                    {order.status !== ORDER_STATUS.DECLINED && (
                      <span className={`status-badge ord-paid ${order.paid ? 'on' : 'off'}`}>
                        {order.paid ? 'Paid' : 'Unpaid'}
                      </span>
                    )}
                  </td>
                  <td>
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="text-end">
                    <div className="ord-row-actions">
                      {canManage && order.status !== ORDER_STATUS.DECLINED && (
                        <Link
                          to={`/admin/order/${order.order_id}?mode=edit`}
                          className="btn btn-sm btn-outline-secondary"
                          aria-label={`Edit order ${order.order_id}`}
                          title="Edit order"
                        >
                          <Pencil size={16} aria-hidden="true" />
                        </Link>
                      )}
                      <Link
                        to={`/admin/order/${order.order_id}`}
                        className="btn btn-sm btn-outline-secondary"
                        aria-label={`View order ${order.order_id}`}
                        title="View order"
                      >
                        <Eye size={16} aria-hidden="true" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="ord-list-footer">
        <p className="muted mb-0" aria-live="polite">
          {!loading && pagination
            ? `${pagination.total} ${pagination.total === 1 ? 'order' : 'orders'} · page ${page} of ${totalPages}`
            : ''}
        </p>

        {/* Pagination controls, same as the Customers list: « First, ‹ Previous, › Next, » Last */}
        <div className="btn-group shadow-sm" role="group" aria-label="Pagination">
          <button
            type="button"
            className="btn btn-outline-secondary"
            disabled={page <= 1 || loading}
            onClick={() => goToPage(1)}
            style={{ minHeight: '38px', minWidth: '80px' }}
          >
            « First
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary"
            disabled={page <= 1 || loading}
            onClick={() => goToPage(page - 1)}
            style={{ minHeight: '38px', minWidth: '95px' }}
          >
            ‹ Previous
          </button>
          <button
            type="button"
            className="btn text-white"
            disabled={page >= totalPages || loading}
            onClick={() => goToPage(page + 1)}
            style={{
              backgroundColor: page >= totalPages ? '#6c757d' : '#17213d',
              borderColor: '#17213d',
              minHeight: '38px',
              minWidth: '85px',
            }}
          >
            › Next
          </button>
          <button
            type="button"
            className="btn text-white"
            disabled={page >= totalPages || loading}
            onClick={() => goToPage(totalPages)}
            style={{
              backgroundColor: page >= totalPages ? '#6c757d' : '#0d1b42',
              borderColor: '#0d1b42',
              minHeight: '38px',
              minWidth: '80px',
            }}
          >
            » Last
          </button>
        </div>
      </div>
    </div>
  );
}
