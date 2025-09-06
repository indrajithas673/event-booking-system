import { useEffect, useRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import Spinner from '../ui/Spinner';

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const toastShown = useRef(false);

  useEffect(() => {
    if (!loading && !isAuthenticated && !toastShown.current) {
      toastShown.current = true;
      toast.error('Please log in to access this page.');
    }
  }, [loading, isAuthenticated]);

  if (loading) {
    return <Spinner fullPage size="lg" text="Loading..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
