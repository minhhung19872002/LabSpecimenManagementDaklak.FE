import React from 'react';
import { Form, Input, Button, Card } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const onFinish = (values: { username: string; password: string }) => {
    console.log('Login values:', values);
    // TODO: Implement actual authentication
    navigate('/dashboard');
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <h1>{t('common.appName')}</h1>
        <h2>{t('common.login')}</h2>
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: t('validation.required') }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder={t('auth.username')}
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: t('validation.required') }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder={t('auth.password')}
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large">
              {t('common.login')}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
