import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { authService, UserInfo } from '../../services/authService';
import { hasRoutePermission, PATH_ROUTES, STORAGE_KEYS, SUPPORTER_ALLOWED_ROUTES } from '../../constants';
import { useSupporterStatus } from '../../hooks/useSupporterStatus';

interface PrivateRouteProps {
  children?: React.ReactNode;
}

/**
 * PrivateRoute component that protects routes from unauthenticated access
 * and checks route permissions based on user roles.
 * Redirects to login page if user is not authenticated.
 * Redirects to appropriate page or 403 if user doesn't have permission.
 */
const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();
  const { isSupporter, loading: supporterLoading } = useSupporterStatus();

  if (!isAuthenticated) {
    // Redirect to login page with return URL
    return <Navigate to={PATH_ROUTES.login} state={{ from: location }} replace />;
  }

  // Get user roles for permission check
  const storedUser = localStorage.getItem(STORAGE_KEYS.USER_INFO);
  let userRoles: string[] = [];

  if (storedUser) {
    try {
      const userInfo: UserInfo = JSON.parse(storedUser);
      userRoles = userInfo.roles || [];
    } catch {
      // Ignore parsing errors
    }
  }

  // Check if this is a supporter-allowed route and we're still loading supporter status
  const isSupporterRoute = SUPPORTER_ALLOWED_ROUTES.some(
    route => location.pathname === route || location.pathname.startsWith(route + '/')
  );

  // If checking supporter status for supporter-allowed routes, show loading indicator
  if (isSupporterRoute && supporterLoading) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'rgba(255,255,255,0.9)',
          zIndex: 1000,
        }}
      >
        <img
          src="/spinner.svg"
          alt="Loading..."
          style={{
            width: 120,
            height: 60,
          }}
        />
      </div>
    );
  }

  // Check route permission (including supporter status)
  const hasPermission = hasRoutePermission(location.pathname, userRoles, isSupporter);

  if (!hasPermission) {
    return <Navigate to={PATH_ROUTES.forbidden} replace />;
  }

  // If children is provided, render children, otherwise render Outlet for nested routes
  return children ? <>{children}</> : <Outlet />;
};

export default PrivateRoute;
