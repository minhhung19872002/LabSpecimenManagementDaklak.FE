import React from 'react';
import { Button, Result, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { getDefaultRouteForUser, STORAGE_KEYS } from '../../constants';
import { UserInfo, authService } from '../../services/authService';

const Forbidden: React.FC = () => {
  const navigate = useNavigate();

  const handleGoToHome = () => {
    // Get user roles from localStorage and navigate to appropriate page
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER_INFO);
    if (storedUser) {
      try {
        const userInfo: UserInfo = JSON.parse(storedUser);
        if (userInfo.roles && userInfo.roles.length > 0) {
          const route = getDefaultRouteForUser(userInfo.roles);
          if (route) {
            navigate(route, { replace: true });
            return;
          }
        }
      } catch {
        // Ignore parsing errors
      }
    }
    // If no valid route found, logout user
    authService.logout();
  };

  const handleLogout = () => {
    authService.logout();
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
          <Space>
            <Button type="primary" onClick={handleGoToHome}>
              Về trang chủ
            </Button>
            <Button onClick={handleLogout}>
              Đăng xuất
            </Button>
          </Space>
        }
      />
    </div>
  );
};

export default Forbidden;
