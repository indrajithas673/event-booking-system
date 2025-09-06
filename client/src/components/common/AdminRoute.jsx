import { useEffect, useRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import Spinner from '../ui/Spinner';

const AdminRoute = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();
  const toastShown = useRef(false);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!loading && !toastShown.current) {
      if (!isAuthenticated) {
        toastShown.current = true;
        toast.error('Please log in to access this page.');
      } else if (!isAdmin) {
        toastShown.current = true;
        toast.error('Access denied. Admin privileges required.');
      }
    }
  }, [loading, isAuthenticated, isAdmin]);

  if (loading) {
    return <Spinner fullPage size="lg" text="Loading..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
