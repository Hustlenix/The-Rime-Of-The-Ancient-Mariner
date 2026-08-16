import { useNavigate } from 'react-router-dom';
import { getUnitCatalog } from '../api';

// Compact unit picker used on unit pages: jump straight to another unit's
// study page without going home.
export default function UnitSwitcher({ currentId, page = 'study' }) {
  const navigate = useNavigate();
  const catalog = getUnitCatalog();

  const go = (e) => {
    const id = e.target.value;
    if (id && id !== currentId) navigate(`/unit/${id}/${page}`);
  };

  return (
    <div className="unit-switcher">
      <label className="unit-switcher-label" htmlFor="unit-switcher">
        Unit:
      </label>
      <select id="unit-switcher" value={currentId} onChange={go} className="unit-switcher-select">
        {catalog.books.map((b) => (
          <optgroup key={b.id} label={b.name}>
            {b.unitIds.map((id) => {
              const u = catalog.units.find((x) => x.id === id);
              if (!u) return null;
              return (
                <option key={id} value={id}>
                  {u.title}
                </option>
              );
            })}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
