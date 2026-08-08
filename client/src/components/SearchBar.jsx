import { useState } from 'react';

export default function SearchBar({ onSearch }) {
  const [value, setValue] = useState('');

  const submit = (e) => {
    e.preventDefault();
    onSearch(value);
  };

  return (
    <form className="search-bar" onSubmit={submit}>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search summaries, themes, devices and questions…"
        aria-label="Search content"
      />
      <button type="submit" className="btn btn-primary">
        Search
      </button>
    </form>
  );
}
