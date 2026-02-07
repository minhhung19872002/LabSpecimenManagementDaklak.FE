import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { hasRoutePermission, PATH_ROUTES, STORAGE_KEYS, SUPPORTER_ALLOWED_ROUTES } from '../../constants';
import { UserInfo } from '../../services/authService';
import { laboratoryTaskService } from '../../services/laboratoryTaskService';

interface AuthRouteProps {
  children: React.ReactNode;
}

const AuthRoute: React.FC<AuthRouteProps> = ({ children }) => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
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
        setIsAuthenticated(true);

        // Check if this is a supporter-allowed route
        const isSupporterRoute = SUPPORTER_ALLOWED_ROUTES.some(
          route => location.pathname === route || location.pathname.startsWith(route + '/')
        );

        // Check supporter status if needed
        let isSupporter = false;
        if (isSupporterRoute) {
          // Check cache first
          const cached = sessionStorage.getItem('user_is_supporter');
          if (cached !== null) {
            isSupporter = cached === 'true';
          } else {
            // Fetch from API
            try {
              isSupporter = await laboratoryTaskService.isCurrentUserSupporter();
              sessionStorage.setItem('user_is_supporter', isSupporter.toString());
            } catch {
              isSupporter = false;
            }
          }
        }

        // Check route permission (including supporter status)
        const permitted = hasRoutePermission(location.pathname, roles, isSupporter);
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

  // Authenticated but no permission - redirect to 403
  if (!hasPermission) {
    return <Navigate to={PATH_ROUTES.forbidden} replace />;
  }

  return <>{children}</>;
};

export default AuthRoute;
