import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { authService, UserInfo } from '../../services/authService';
import { hasRoutePermission, getDefaultRouteForUser, PATH_ROUTES, STORAGE_KEYS } from '../../constants';

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

  // Check route permission
  const hasPermission = hasRoutePermission(location.pathname, userRoles);

  if (!hasPermission) {
    // Get default route for user
    const defaultRoute = getDefaultRouteForUser(userRoles);

    // If user has a default route and it's different from current path, redirect there
    if (defaultRoute && location.pathname !== defaultRoute) {
      return <Navigate to={defaultRoute} replace />;
    }

    // Otherwise redirect to 403
    return <Navigate to={PATH_ROUTES.forbidden} replace />;
  }

  // If children is provided, render children, otherwise render Outlet for nested routes
  return children ? <>{children}</> : <Outlet />;
};

export default PrivateRoute;
