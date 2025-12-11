import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import { FileTextOutlined, ExperimentOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h2>{t('menu.dashboard')}</h2>
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title={t('statistics.totalRequests')}
              value={25}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={t('statistics.totalSpecimens')}
              value={42}
              prefix={<ExperimentOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={t('statistics.totalTests')}
              value={89}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="NCR"
              value={3}
              prefix={<WarningOutlined />}
              styles={{ value: { color: '#cf1322' } }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
