import React, { useEffect, useState } from 'react';
import { Card, Descriptions, Button, Space, Spin, Tag, message } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import { testService } from '../../services/testService';
import { TestDto, TestStatus } from '../../types/test';
import dayjs from 'dayjs';
import './TestDetail.css';

// Mock data fallback
const getMockTest = (id: string): TestDto => ({
  id,
  code: `TEST-${dayjs().format('YYYYMMDD')}-${id.replace(/\D/g, '').padStart(4, '0')}`,
  name: 'Real-time PCR SARS-CoV-2',
  specimenId: 'spe-001',
  specimenCode: 'SPE-20251210-0001',
  specimenName: 'Mẫu dịch ngoáy họng',
  method: 'RT-PCR theo CDC Hoa Kỳ',
  standard: 'CDC Protocol',
  status: TestStatus.InProgress,
  assignedTo: 'ThS. Nguyễn Văn A',
  startDate: dayjs().subtract(1, 'day').toISOString(),
  notes: 'Mẫu ưu tiên - BV Đa khoa tỉnh',
  creationTime: dayjs().subtract(2, 'day').toISOString(),
});

const TestDetail: React.FC = () => {
  const [test, setTest] = useState<TestDto | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();

  useEffect(() => {
    if (id) {
      fetchTest(id);
    }
  }, [id]);

  const fetchTest = async (testId: string) => {
    setLoading(true);
    try {
      const data = await testService.get(testId);
      setTest(data);
    } catch (error) {
      console.log('API not available, using mock data');
      setTest(getMockTest(testId));
    } finally {
      setLoading(false);
    }
  };

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
          <Descriptions.Item label={t('test.assigneeId')}>{test.assigneeId || '-'}</Descriptions.Item>
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
