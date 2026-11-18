export default function PagePlaceholder({ title, module, task }) {
  return (
    <section className="page-placeholder">
      <p className="eyebrow">Abe Garage / {module}</p>
      <h1 className="page-title">{title}</h1>
      <p>This page is ready for its owner to implement.</p>
      <p className="muted">Backend reference: {task}</p>
    </section>
  );
}
