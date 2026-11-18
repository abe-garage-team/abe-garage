import Icon from './Icon.jsx';

// A search input with the magnifier icon. Debounce the value in the page (useDebouncedValue).
export default function SearchBox({ value, onChange, label = 'Search', placeholder = 'Search…' }) {
  return (
    <div className="search-box">
      <label className="visually-hidden" htmlFor="search-box">
        {label}
      </label>
      <input
        id="search-box"
        className="form-control"
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      <Icon name="search" size={18} />
    </div>
  );
}
