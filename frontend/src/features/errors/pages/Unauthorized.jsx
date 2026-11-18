import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <section className="ag-card page-narrow">
      <p className="eyebrow">Abe Garage</p>
      <h1 className="page-title">Access denied</h1>
      <p>Your role does not include this page. If you think it should, ask your admin.</p>
      <Link to="/admin" className="btn btn-ink">
        Back to the workspace
      </Link>
    </section>
  );
}
