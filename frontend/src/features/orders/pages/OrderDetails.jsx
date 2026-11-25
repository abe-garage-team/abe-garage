import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Plus, Printer } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext.jsx';
import { OFFICE } from '../../../constants/roles.js';
import LoadingState from '../../../components/common/LoadingState.jsx';
import StatusBadge from '../../../components/common/StatusBadge.jsx';
import ApprovalPanel from '../components/ApprovalPanel.jsx';
import EditOrderForm from '../components/EditOrderForm.jsx';
import ExtraWorkForm from '../components/ExtraWorkForm.jsx';
import OrderHistory from '../components/OrderHistory.jsx';
import OrderLines from '../components/OrderLines.jsx';
import OrderSummary from '../components/OrderSummary.jsx';
import { ORDER_STATUS } from '../../../constants/orders.js';
import { useOrder } from '../../../hooks/useOrder.js';
import { canAddExtraWork, canEditOrder } from '../../../utils/order-helpers.js';
import '../../../styles/orders.css';

const APPROVAL_MESSAGES = {
  approved: 'Estimate approved. Work on this order can now start.',
  declined: 'Estimate declined. This order is now read-only.',
};


export default function OrderDetails() {
  const { order_id: orderId } = useParams();
  const { employee } = useAuth();
  const canManage = OFFICE.includes(employee.role_id);
  const { order, setOrder, loading, error, reload } = useOrder(orderId);

  const location = useLocation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  
  const [flash, setFlash] = useState(location.state?.flash ?? '');
  const [showExtraWork, setShowExtraWork] = useState(false);

  
  useEffect(() => {
    if (location.state?.flash) {
      navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
    }
    
  }, []);

  const editing =
    Boolean(order) && canManage && canEditOrder(order) && params.get('mode') === 'edit';

  function showMessage(message) {
    setFlash(message);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDecision(decision) {
    await reload(); 
    showMessage(APPROVAL_MESSAGES[decision]);
  }

  async function handleExtraWork(serviceName) {
    await reload();
    setShowExtraWork(false);
    showMessage(`${serviceName} was added. The order is awaiting the customer’s approval again.`);
  }

  function handleSaved(updated) {
    setOrder(updated); 
    setParams({});
    showMessage('Order updated.');
  }

  if (loading) return <LoadingState message="Loading order…" />;

  if (!order) {
    return (
      <div>
        <h1 className="page-title">Order</h1>
        <p className="alert alert-danger" role="alert">
          {error?.status === 404
            ? 'This order does not exist.'
            : error?.message || 'Could not load the order. Please try again.'}
        </p>
        <Link to="/admin/orders" className="btn btn-outline-secondary">
          <ArrowLeft size={16} aria-hidden="true" />
          Back to orders
        </Link>
      </div>
    );
  }

  const awaiting = order.status === ORDER_STATUS.AWAITING_APPROVAL;

  return (
    <div>
      <div className="ord-heading">
        <div>
          <h1 className="page-title">Order #{order.order_id}</h1>
          <div className="ord-badges">
            <StatusBadge status={order.status} />
            {order.status !== ORDER_STATUS.DECLINED && (
              <span className={`status-badge ${order.paid ? 'on' : 'off'}`}>
                {order.paid ? 'Paid' : 'Unpaid'}
              </span>
            )}
          </div>
        </div>
        <div className="ord-actions">
          <Link to="/admin/orders" className="btn btn-outline-secondary">
            <ArrowLeft size={16} aria-hidden="true" />
            Orders
          </Link>
          {canManage && (
            <Link
              to={`/admin/order/${order.order_id}/estimate`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-secondary"
            >
              <Printer size={16} aria-hidden="true" />
              Print estimate
            </Link>
          )}
          {canManage && canEditOrder(order) && !editing && (
            <button
              type="button"
              className="btn btn-ink"
              onClick={() => setParams({ mode: 'edit' })}
            >
              <Pencil size={16} aria-hidden="true" />
              Edit order
            </button>
          )}
        </div>
      </div>

      {flash && (
        <div className="alert alert-success" role="status">
          {flash}
        </div>
      )}
      {error && (
        <p className="alert alert-danger" role="alert">
          {error.message}
        </p>
      )}

      <OrderSummary order={order} canManage={canManage} />

      {canManage && awaiting && <ApprovalPanel order={order} onRecorded={handleDecision} />}

      {editing && (
        <EditOrderForm order={order} onSaved={handleSaved} onCancel={() => setParams({})} />
      )}

      <OrderLines order={order}>
        {canManage && canAddExtraWork(order) && !showExtraWork && (
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setShowExtraWork(true)}
          >
            <Plus size={16} aria-hidden="true" />
            Add extra work
          </button>
        )}
      </OrderLines>
      {showExtraWork && (
        <ExtraWorkForm
          order={order}
          onAdded={handleExtraWork}
          onCancel={() => setShowExtraWork(false)}
        />
      )}

      <OrderHistory history={order.history} />
    </div>
  );
}
