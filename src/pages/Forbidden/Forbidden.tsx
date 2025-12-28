import React from 'react';
import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import { PATH_ROUTES, ROLES } from '../../constants';
import { UserInfo } from '../../services/authService';

// Get default route based on user role
const getDefaultRouteByRole = (roles: string[]): string => {
  if (roles.includes(ROLES.ADMIN)) {
    return PATH_ROUTES.dashboard;
  }
  if (roles.includes(ROLES.QUALITY_MANAGER)) {
    return PATH_ROUTES.dashboard;
  }
  if (roles.includes(ROLES.LAB_TECHNICAL_MANAGER)) {
    return PATH_ROUTES.dashboard;
  }
  if (roles.includes(ROLES.SAMPLE_RECEIVER)) {
    return PATH_ROUTES.testRequests.index;
  }
  if (roles.includes(ROLES.LAB_TECHNICIAN)) {
    return PATH_ROUTES.testing.index;
  }
  return PATH_ROUTES.dashboard;
};

const Forbidden: React.FC = () => {
  const navigate = useNavigate();

  const handleGoToHome = () => {
    // Get user roles from localStorage and navigate to appropriate page
    const storedUser = localStorage.getItem('user_info');
    if (storedUser) {
      try {
        const userInfo: UserInfo = JSON.parse(storedUser);
        if (userInfo.roles && userInfo.roles.length > 0) {
          navigate(getDefaultRouteByRole(userInfo.roles), { replace: true });
          return;
        }
      } catch {
        // Ignore parsing errors
      }
    }
    navigate(PATH_ROUTES.dashboard, { replace: true });
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f0f2f5'
    }}>
      <Result
        status="403"
        title="403"
        subTitle="Bạn không có quyền truy cập trang này."
        extra={
          <Button type="primary" onClick={handleGoToHome}>
            Về trang chủ
          </Button>
        }
      />
    </div>
  );
};

export default Forbidden;
