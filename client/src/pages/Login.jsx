import { useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../authContext';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card card">
        <h1 className="page-title">Login</h1>
        {error && <p className="error-text">{error}</p>}
        <form onSubmit={submit}>
          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Signing in…' : 'Login'}
          </button>
        </form>
        <p className="auth-switch">
          New to the portal? <Link to="/register">Create an account</Link>
        </p>
        <div className="demo-hint">
          <p>
            <strong>Demo accounts</strong>
          </p>
          <p>
            Teacher: <code>teacher@tals.edu</code> / <code>teacher123</code>
          </p>
          <p>
            Student: <code>student@tals.edu</code> / <code>student123</code>
          </p>
        </div>
      </div>
    </div>
  );
}
