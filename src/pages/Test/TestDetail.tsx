import React from 'react';
import { Card, Descriptions, Button, Space, Spin, Tag, Alert } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import { TestStatus } from '../../types/test';
import dayjs from 'dayjs';
import './TestDetail.css';

// RTK Query imports
import { useGetTestQuery } from '../../store/api/testApi';

const TestDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();

  const { data: test, isLoading: loading, error } = useGetTestQuery(id!, { skip: !id });

  const getStatusColor = (status: TestStatus): string => {
    switch (status) {
      case TestStatus.Pending: return 'default';
      case TestStatus.Assigned: return 'blue';
      case TestStatus.InProgress: return 'processing';
      case TestStatus.Completed: return 'success';
      case TestStatus.Reviewed: return 'cyan';
      case TestStatus.Approved: return 'green';
      default: return 'default';
    }
  };

  const getStatusText = (status: TestStatus): string => {
    switch (status) {
      case TestStatus.Pending: return t('test.status.pending');
      case TestStatus.Assigned: return t('test.status.assigned');
      case TestStatus.InProgress: return t('test.status.inProgress');
      case TestStatus.Completed: return t('test.status.completed');
      case TestStatus.Reviewed: return t('test.status.reviewed');
      case TestStatus.Approved: return t('test.status.approved');
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Lỗi"
        description="Không thể tải thông tin phép thử. Vui lòng thử lại!"
        type="error"
        showIcon
      />
    );
  }

  if (!test) {
    return null;
  }

  return (
    <div className="test-detail">
      <Card
        title={t('test.viewTest')}
        extra={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/tests')}>
              {t('common.back')}
            </Button>
            <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/test/edit/${id}`)}>
              {t('common.edit')}
            </Button>
          </Space>
        }
      >
        <Descriptions bordered column={2}>
          <Descriptions.Item label={t('test.code')}>{test.code}</Descriptions.Item>
          <Descriptions.Item label={t('test.status.label')}>
            <Tag color={getStatusColor(test.status)}>{getStatusText(test.status)}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('test.name')} span={2}>{test.name}</Descriptions.Item>
          <Descriptions.Item label={t('test.specimenCode')}>{test.specimenCode}</Descriptions.Item>
          <Descriptions.Item label={t('test.specimenName')}>{test.specimenName}</Descriptions.Item>
          <Descriptions.Item label={t('test.method')} span={2}>{test.method}</Descriptions.Item>
          <Descriptions.Item label={t('test.standard')} span={2}>{test.standard}</Descriptions.Item>
          <Descriptions.Item label={t('test.assignee')}>{test.assigneeName || '-'}</Descriptions.Item>
          <Descriptions.Item label={t('test.estimatedDuration')}>
            {test.estimatedDuration ? `${test.estimatedDuration} ${t('test.hours')}` : '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('test.assignmentDate')}>
            {test.assignmentDate ? dayjs(test.assignmentDate).format('YYYY-MM-DD HH:mm') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('test.startDate')}>
            {test.startDate ? dayjs(test.startDate).format('YYYY-MM-DD HH:mm') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('test.completionDate')} span={2}>
            {test.completionDate ? dayjs(test.completionDate).format('YYYY-MM-DD HH:mm') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('test.notes')} span={2}>{test.notes || '-'}</Descriptions.Item>
          <Descriptions.Item label={t('common.createdAt')}>
            {dayjs(test.creationTime).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label={t('common.lastModified')}>
            {test.lastModificationTime ? dayjs(test.lastModificationTime).format('YYYY-MM-DD HH:mm') : '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default TestDetail;
