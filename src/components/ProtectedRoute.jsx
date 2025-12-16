import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Skeleton from './Skeleton';

/**
 * ProtectedRoute component
 * Wraps routes that require authentication and/or specific roles
 *
 * @param {ReactNode} children - The component to render if authorized
 * @param {string[]} roles - Optional array of allowed roles (e.g., ['admin', 'staff'])
 */
const ProtectedRoute = ({ children, roles = [] }) => {
  const { isAuthenticated, loading, hasRole, user } = useAuth();
  const location = useLocation();

  // Show loading skeleton while checking auth state
  if (loading) {
    return (
      <div className="page-container">
        <div className="card p-6">
          <Skeleton variant="title" className="mb-4" />
          <Skeleton variant="text" count={3} />
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role requirements
  if (roles.length > 0 && !hasRole(roles)) {
    return (
      <div className="page-container">
        <div className="card p-8 text-center">
          <div className="text-6xl mb-4">
            <i className="fas fa-ban text-red-500"></i>
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Access Denied</h1>
          <p className="text-text-secondary mb-4">
            You don&apos;t have permission to view this page.
          </p>
          <p className="text-sm text-text-secondary">
            Your role: <span className="font-medium">{user?.role || 'Unknown'}</span>
          </p>
          <p className="text-sm text-text-secondary">
            Required: <span className="font-medium">{roles.join(' or ')}</span>
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
