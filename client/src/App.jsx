import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
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

export default function App() {
  return (
    <>
      <Navbar />
      <main className="page">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/study" element={<Study />} />
          <Route path="/questions" element={<Questions />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/flashcards" element={<Flashcards />} />
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
        </Routes>
      </main>
      <footer className="site-footer">
        <div className="ornament" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 3v6M12 15v6M3 12h6M15 12h6" />
          </svg>
        </div>
        <p>
          &ldquo;A sadder and a wiser man, he rose the morrow morn.&rdquo;
        </p>
        <p>
          The Rime of the Ancient Mariner — Study Portal · The Ashok Leyland School · Coleridge&rsquo;s
          lines quoted from the public-domain text; illustrations by Gustave Doré (1863).
        </p>
      </footer>
    </>
  );
}
