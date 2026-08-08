import { Navigate } from 'react-router-dom';
import { useAuth } from '../authContext';

export default function ProtectedRoute({ children, requireTeacher = false }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="page-loader">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requireTeacher && user.role !== 'teacher') return <Navigate to="/" replace />;
  return children;
}
