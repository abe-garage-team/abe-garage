import { Link } from 'react-router-dom';

// The red swoosh and the ABE GARAGE word mark. `light` is for the navy footer.
export default function Brand({ light = false }) {
  const navy = light ? '#ffffff' : 'var(--ag-navy)';
  return (
    <Link to="/" className={`brand${light ? ' light' : ''}`} aria-label="Abe Garage home">
      <svg className="swoosh" viewBox="0 0 96 44" aria-hidden="true">
        <path
          d="M3 34c9-9 19-18 34-21 13-3 26-1 38 4 6 3 11 6 15 10"
          fill="none"
          stroke="var(--ag-red)"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M12 30c8-6 18-11 30-12 11-1 21 2 29 6"
          fill="none"
          stroke="var(--ag-red)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M2 40c22-5 52-6 86-3"
          fill="none"
          stroke={navy}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M76 22l10 9-12 4"
          fill="none"
          stroke={navy}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="word">
        <b>ABE</b>
        <span>GARAGE</span>
      </span>
    </Link>
  );
}
