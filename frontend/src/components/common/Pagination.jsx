// Previous / numbered pages / Next. Hidden when there is a single page.
export default function Pagination({ page, totalPages, onPageChange }) {
  if (!totalPages || totalPages < 2) return null;
  const pages = [];
  for (let n = Math.max(1, page - 2); n <= Math.min(totalPages, page + 2); n += 1) pages.push(n);
  const item = (label, target, { disabled = false, active = false, key = label } = {}) => (
    <li key={key} className={`page-item${disabled ? ' disabled' : ''}${active ? ' active' : ''}`}>
      <button
        type="button"
        className="page-link"
        disabled={disabled}
        aria-current={active ? 'page' : undefined}
        onClick={() => onPageChange(target)}
      >
        {label}
      </button>
    </li>
  );
  return (
    <nav aria-label="Pagination">
      <ul className="pagination">
        {item('Previous', page - 1, { disabled: page <= 1 })}
        {pages.map((n) => item(n, n, { active: n === page, key: `p${n}` }))}
        {item('Next', page + 1, { disabled: page >= totalPages })}
      </ul>
    </nav>
  );
}
