import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { hasRoutePermission, getDefaultRouteForUser, PATH_ROUTES, STORAGE_KEYS } from '../../constants';
import { UserInfo } from '../../services/authService';

interface AuthRouteProps {
  children: React.ReactNode;
}

const AuthRoute: React.FC<AuthRouteProps> = ({ children }) => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER_INFO);

      if (!token || !storedUser) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        const userInfo: UserInfo = JSON.parse(storedUser);
        const roles = userInfo.roles || [];
        setUserRoles(roles);
        setIsAuthenticated(true);

        // Check route permission
        const permitted = hasRoutePermission(location.pathname, roles);
        setHasPermission(permitted);
      } catch {
        setIsAuthenticated(false);
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
      }}>
        <Spin size="large" />
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to={PATH_ROUTES.login} state={{ from: location }} replace />;
  }

  // Authenticated but no permission - redirect to 403 or default route
  if (!hasPermission) {
    const defaultRoute = getDefaultRouteForUser(userRoles);

    // If current path is not the default route and user has a default route, redirect there
    if (defaultRoute && location.pathname !== defaultRoute) {
      return <Navigate to={defaultRoute} replace />;
    }

    // Otherwise redirect to 403
    return <Navigate to={PATH_ROUTES.forbidden} replace />;
  }

  return <>{children}</>;
};

export default AuthRoute;
