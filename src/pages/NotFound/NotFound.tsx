import React from 'react';
import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import { PATH_ROUTES } from '../../constants';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f0f2f5'
    }}>
      <Result
        status="404"
        title="404"
        subTitle="Trang bạn tìm kiếm không tồn tại."
        extra={
          <Button type="primary" onClick={() => navigate(PATH_ROUTES.dashboard)}>
            Về trang chủ
          </Button>
        }
      />
    </div>
  );
};

export default NotFound;
