import { Search } from 'lucide-react';

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
      <Search size={18} aria-hidden="true" />
    </div>
  );
}
