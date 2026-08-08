import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../authContext';

export default function Navbar() {
  const { user, loading, logout } = useAuth();

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        <svg className="brand-mark" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 2C7 6 3 10 3 14a9 9 0 0 0 18 0c0-4-4-8-9-12Z"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path d="M9 14a3 3 0 0 0 6 0c0-2-3-4-3-4s-3 2-3 4Z" fill="currentColor" opacity="0.85" />
        </svg>
        <span className="brand-text">
          The Rime of the Ancient Mariner
          <span className="brand-sub">Study Portal · TALS</span>
        </span>
      </Link>

      <nav className="nav-links">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          Home
        </NavLink>
        <NavLink to="/study" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          Study
        </NavLink>
        <NavLink to="/questions" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          Questions
        </NavLink>
        <NavLink to="/quiz" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          Quiz
        </NavLink>
        <NavLink to="/flashcards" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          Flashcards
        </NavLink>
        <NavLink to="/search" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          Search
        </NavLink>
      </nav>

      <div className="nav-auth">
        {loading ? null : user ? (
          <>
            <NavLink to="/profile" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              {user.name}
            </NavLink>
            {user.role === 'teacher' && (
              <NavLink to="/admin" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                Admin
              </NavLink>
            )}
            <button className="btn btn-ghost btn-small" onClick={logout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              Login
            </NavLink>
            <NavLink to="/register" className="btn btn-primary btn-small">
              Register
            </NavLink>
          </>
        )}
      </div>
    </header>
  );
}
