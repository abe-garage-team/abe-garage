// One labelled input (or select/textarea with `as`) with its error line.
export default function FormField({ id, label, error, as = 'input', children, ...inputProps }) {
  const Tag = as;
  const className = `${as === 'select' ? 'form-select' : 'form-control'}${error ? ' is-invalid' : ''}`;
  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <Tag
        id={id}
        className={className}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...inputProps}
      >
        {children}
      </Tag>
      {error && (
        <span id={`${id}-error`} className="field-error">
          {error}
        </span>
      )}
    </div>
  );
}
