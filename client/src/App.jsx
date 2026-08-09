import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { isStatic } from './api';
import Home from './pages/Home';
import Study from './pages/Study';
import Questions from './pages/Questions';
import Quiz from './pages/Quiz';
import Flashcards from './pages/Flashcards';
import Search from './pages/Search';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Admin from './pages/Admin';

const LEGACY_UNIT = 'rime-of-the-ancient-mariner';

function StaticModeNote() {
  const [staticMode, setStaticMode] = useState(isStatic());

  useEffect(() => {
    const onChange = () => setStaticMode(isStatic());
    window.addEventListener('api:static-mode', onChange);
    return () => window.removeEventListener('api:static-mode', onChange);
  }, []);

  if (!staticMode) return null;
  return (
    <p className="guest-note" role="status">
      Preview mode — all study content is built into this page. Sign-in, saved scores and flashcard
      progress need the school server, which this hosted copy does not run.
    </p>
  );
}

function NotFound() {
  return (
    <div className="page">
      <h1 className="page-title">Page not found</h1>
      <p className="page-intro">
        That page does not exist. Head back to the book shelf and pick a unit.
      </p>
      <Link className="btn btn-primary" to="/">
        Back to Home
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Navbar />
      <StaticModeNote />
      <main className="page">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/unit/:unitId/study" element={<Study />} />
          <Route path="/unit/:unitId/questions" element={<Questions />} />
          <Route path="/unit/:unitId/quiz" element={<Quiz />} />
          <Route path="/unit/:unitId/flashcards" element={<Flashcards />} />
          <Route path="/study" element={<Navigate to={`/unit/${LEGACY_UNIT}/study`} replace />} />
          <Route path="/questions" element={<Navigate to={`/unit/${LEGACY_UNIT}/questions`} replace />} />
          <Route path="/quiz" element={<Navigate to={`/unit/${LEGACY_UNIT}/quiz`} replace />} />
          <Route path="/flashcards" element={<Navigate to={`/unit/${LEGACY_UNIT}/flashcards`} replace />} />
          <Route path="/search" element={<Search />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireTeacher>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="site-footer">
        <div className="ornament" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 3v6M12 15v6M3 12h6M15 12h6" />
          </svg>
        </div>
        <p>Class X English Study Portal — The Ashok Leyland School</p>
        <p>
          Covers the full CBSE Class X English Literature Reader: First Flight (prose &amp; poems,
          including the school&rsquo;s legacy unit The Rime of the Ancient Mariner) and Footprints
          Without Feet.
        </p>
        <p className="heritage-stamp">Est. 1798 · The Rime of the Ancient Mariner</p>
      </footer>
    </>
  );
}
