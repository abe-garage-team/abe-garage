const ORDER_STATUS = {
  1: 'Awaiting approval',
  2: 'Approved',
  3: 'In progress',
  4: 'Completed',
  5: 'Declined',
};

// Order status pill, coloured per status.
export default function StatusBadge({ status }) {
  return <span className={`status-badge s${status}`}>{ORDER_STATUS[status] || 'Unknown'}</span>;
}

// Active / Inactive pill for employees, customers and services.
export function ActiveBadge({ active }) {
  return (
    <span className={`status-badge ${active ? 'on' : 'off'}`}>
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}
