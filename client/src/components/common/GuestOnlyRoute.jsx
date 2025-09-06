import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Spinner from '../ui/Spinner';

const GuestOnlyRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Spinner fullPage size="lg" text="Loading..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default GuestOnlyRoute;
