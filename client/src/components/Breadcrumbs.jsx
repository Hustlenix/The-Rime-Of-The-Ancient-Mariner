import { Link } from 'react-router-dom';

// Trail for unit pages: Home › <Unit>. There is no intermediate genre listing
// page in the current site map, so the honest trail is two levels deep.
export default function Breadcrumbs({ unitTitle }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        <li>
          <Link to="/">Home</Link>
        </li>
        <li aria-current="page">{unitTitle}</li>
      </ol>
    </nav>
  );
}