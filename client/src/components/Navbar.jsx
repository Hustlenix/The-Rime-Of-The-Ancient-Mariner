import { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../authContext';
import { api } from '../api';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const [marqueeItems, setMarqueeItems] = useState([]);

  useEffect(() => {
    api
      .getUnits()
      .then((d) => {
        const items = (d.books || [])
          .flatMap((b) => b.units || [])
          .map((u) => `${u.title} · ${u.author || 'Anonymous'}`);
        setMarqueeItems(items);
      })
      .catch(() => {
        /* marquee is decorative; ignore failures */
      });
  }, []);

  return (
    <header className="navbar">
      <Link to="/" className="brand" aria-label="Class X English Study Portal — Home">
        <svg className="brand-mark" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 2C7 6 3 10 3 14a9 9 0 0 0 18 0c0-4-4-8-9-12Z"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path d="M9 14a3 3 0 0 0 6 0c0-2-3-4-3-4s-3 2-3 4Z" fill="currentColor" opacity="0.85" />
        </svg>
        <span className="brand-text">
          Class X English Study Portal
          <span className="brand-sub">Literature Reader · TALS</span>
        </span>
      </Link>

      <nav className="nav-links" aria-label="Primary">
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
        <NavLink to="/games" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          Games
        </NavLink>
        <NavLink to="/search" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          Search
        </NavLink>
      </nav>

      <ThemeToggle />

      <div className="nav-auth">
        {loading ? null : user ? (
          <>
            <NavLink to="/profile" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              {user.name}
            </NavLink>
            {user.role === 'teacher' && (
              <>
                <NavLink to="/teacher/bank" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                  Bank
                </NavLink>
                <NavLink to="/teacher/build" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                  Build
                </NavLink>
                <NavLink to="/teacher/library" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                  Papers
                </NavLink>
                <NavLink to="/admin" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                  Admin
                </NavLink>
              </>
            )}
            <button className="btn btn-ghost btn-small" onClick={logout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-outline btn-small">
              Login
            </Link>
            <Link to="/register" className="btn btn-primary btn-small">
              Register
            </Link>
          </>
        )}
      </div>

      {marqueeItems.length > 0 && (
        <div className="marquee" aria-hidden="true">
          <div className="marquee-track">
            {[...marqueeItems, ...marqueeItems].map((item, i) => (
              <span key={i} className="marquee-item">
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}