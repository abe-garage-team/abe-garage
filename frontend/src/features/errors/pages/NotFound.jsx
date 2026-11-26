import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="ag-card page-narrow">
      <p className="eyebrow">Abe Garage</p>
      <h1 className="page-title">Page not found</h1>
      <p>There is nothing at this address. Check the link, or start again from the home page.</p>
      <Link to="/" className="btn btn-ink">
        Go to the home page
      </Link>
    </section>
  );
}
