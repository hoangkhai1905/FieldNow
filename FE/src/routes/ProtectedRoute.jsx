import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();

  console.log('[Auth Check]', { 
    isAuthenticated, 
    userRole: user?.role, 
    allowedRoles, 
    path: window.location.pathname 
  });

  if (!isAuthenticated) return <Navigate to="/login" />;
  
  if (allowedRoles && (!user || !allowedRoles.includes(user.role))) {
    console.warn('[Auth Check] Access Denied: Role mismatch or missing');
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

export default ProtectedRoute;