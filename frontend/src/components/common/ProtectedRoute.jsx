import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

/**
 * Protects routes from unauthenticated access.
 * Optionally restricts to specific roles.
 */
const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user?.role)) {
    // Redirect to appropriate dashboard based on role
    const roleRedirects = {
      USER: '/dashboard',
      STAFF: '/staff/dashboard',
      MANAGER: '/manager/dashboard',
      ADMIN: '/admin/dashboard',
    };
    return <Navigate to={roleRedirects[user?.role] || '/dashboard'} replace />;
  }

  return children;
};

export default ProtectedRoute;
