import { Component, Suspense, lazy, useEffect, useState } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import BackToTop from './components/BackToTop';
import { isStatic, getLastUnit, rememberLastUnit } from './api';

// Pages are code-split so the initial bundle stays small; each route chunk
// loads only when first visited.
const Home = lazy(() => import('./pages/Home'));
const Study = lazy(() => import('./pages/Study'));
const Questions = lazy(() => import('./pages/Questions'));
const Quiz = lazy(() => import('./pages/Quiz'));
const Flashcards = lazy(() => import('./pages/Flashcards'));
const Search = lazy(() => import('./pages/Search'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Profile = lazy(() => import('./pages/Profile'));
const Admin = lazy(() => import('./pages/Admin'));

const PREVIEW_DISMISS_KEY = 'tals-preview-dismissed';
const SITE_NAME = 'Class X English Study Portal';

// ---- Helpers used by the shell ----

const pageTitleFor = (pathname) => {
  if (pathname === '/' || pathname === '') return 'Home';
  if (pathname.startsWith('/unit/') && pathname.endsWith('/study')) return 'Study';
  if (pathname.startsWith('/unit/') && pathname.endsWith('/questions')) return 'Questions';
  if (pathname.startsWith('/unit/') && pathname.endsWith('/quiz')) return 'Quiz';
  if (pathname.startsWith('/unit/') && pathname.endsWith('/flashcards')) return 'Flashcards';
  if (pathname.startsWith('/search')) return 'Search';
  if (pathname.startsWith('/login')) return 'Login';
  if (pathname.startsWith('/register')) return 'Register';
  if (pathname.startsWith('/profile')) return 'Profile';
  if (pathname.startsWith('/admin')) return 'Admin';
  return 'Page not found';
};

// An unexpected render error should never blank the page.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="page">
          <h1 className="page-title">Something went wrong</h1>
          <p className="page-intro">
            An unexpected error stopped this page from drawing. Your progress is safe — reload to
            keep studying.
          </p>
          <Link className="btn btn-primary" to="/" onClick={() => this.setState({ error: null })}>
            Back to Home
          </Link>
        </div>
      );
    }
    return this.props.children;
  }
}

// Hash routing does not move the window on its own; reset scroll on every
// navigation so back/forward land at the top of the new page.
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Visiting any unit page makes that lesson the app's "current" one, so the
// top-nav Study/Questions/Quiz/Flashcards links and the Home resume card
// always point at the lesson the student is actually working on.
function RememberLastUnit() {
  const { pathname } = useLocation();
  useEffect(() => {
    const match = pathname.match(/^\/unit\/([^/]+)\//);
    if (match) rememberLastUnit(match[1]);
  }, [pathname]);
  return null;
}

// Hash routes never fire a fresh gtag page_view by themselves, so report each
// navigation explicitly and keep the document title meaningful.
function usePageTracking() {
  const location = useLocation();
  useEffect(() => {
    const label = pageTitleFor(location.pathname);
    document.title = `${label} — ${SITE_NAME}`;
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_title: label,
        page_path: window.location.hash || location.pathname,
        page_location: window.location.href
      });
    }
  }, [location]);
}

function StaticModeNote() {
  const [staticMode, setStaticMode] = useState(isStatic());
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(PREVIEW_DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const onChange = () => setStaticMode(isStatic());
    window.addEventListener('api:static-mode', onChange);
    return () => window.removeEventListener('api:static-mode', onChange);
  }, []);

  if (!staticMode || dismissed) return null;
  return (
    <div className="preview-banner" role="status">
      <p className="preview-banner-text">
        <strong>Preview mode.</strong> All study content is built into this page. Sign-in, saved
        scores and flashcard progress need the school server, which this hosted copy does not run.
      </p>
      <button
        type="button"
        className="preview-banner-close"
        onClick={() => {
          try {
            localStorage.setItem(PREVIEW_DISMISS_KEY, '1');
          } catch {
            /* ignore storage errors */
          }
          setDismissed(true);
        }}
      >
        Dismiss
      </button>
    </div>
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

const loading = (
  <div className="page-loader" role="status">
    Loading…
  </div>
);

export default function App() {
  usePageTracking();
  const lastUnit = getLastUnit();
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Navbar />
      <StaticModeNote />
      <main className="page" id="main-content">
        <ScrollToTop />
        <RememberLastUnit />
        <ErrorBoundary>
          <Suspense fallback={loading}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/unit/:unitId/study" element={<Study />} />
              <Route path="/unit/:unitId/questions" element={<Questions />} />
              <Route path="/unit/:unitId/quiz" element={<Quiz />} />
              <Route path="/unit/:unitId/flashcards" element={<Flashcards />} />
              <Route path="/study" element={<Navigate to={`/unit/${lastUnit.id}/study`} replace />} />
              <Route path="/questions" element={<Navigate to={`/unit/${lastUnit.id}/questions`} replace />} />
              <Route path="/quiz" element={<Navigate to={`/unit/${lastUnit.id}/quiz`} replace />} />
              <Route path="/flashcards" element={<Navigate to={`/unit/${lastUnit.id}/flashcards`} replace />} />
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
          </Suspense>
        </ErrorBoundary>
      </main>
      <BackToTop />
      <footer className="site-footer">
        <div className="ornament" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 3v6M12 15v6M3 12h6M15 12h6" />
          </svg>
        </div>
        <p>Class X English Study Portal — The Ashok Leyland School</p>
        <p>
          Covers every lesson of the CBSE Class X English Literature Reader (Interact in English):
          prose, poems &amp; plays — with summaries, themes, character sketches, poetic devices,
          model answers, quizzes and flashcards for each unit.
        </p>
      </footer>
    </>
  );
}