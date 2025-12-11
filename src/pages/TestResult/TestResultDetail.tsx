import React, { useEffect, useState } from 'react';
import { Card, Descriptions, Button, Space, Spin, Tag, message } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import { testResultService } from '../../services/testResultService';
import { TestResultDto, ResultApprovalStatus } from '../../types/testResult';
import dayjs from 'dayjs';
import './TestResultDetail.css';

const TestResultDetail: React.FC = () => {
  const [testResult, setTestResult] = useState<TestResultDto | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();

  useEffect(() => {
    if (id) {
      fetchTestResult(id);
    }
  }, [id]);

  const fetchTestResult = async (testResultId: string) => {
    setLoading(true);
    try {
      const data = await testResultService.get(testResultId);
      setTestResult(data);
    } catch (error) {
      message.error(t('messages.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const getApprovalStatusColor = (status: ResultApprovalStatus): string => {
    switch (status) {
      case ResultApprovalStatus.Draft: return 'default';
      case ResultApprovalStatus.Submitted: return 'blue';
      case ResultApprovalStatus.Step1Reviewed: return 'cyan';
      case ResultApprovalStatus.Step2Approved: return 'green';
      case ResultApprovalStatus.Rejected: return 'red';
      default: return 'default';
    }
  };

  const getApprovalStatusText = (status: ResultApprovalStatus): string => {
    switch (status) {
      case ResultApprovalStatus.Draft: return t('testResult.approvalStatus.draft');
      case ResultApprovalStatus.Submitted: return t('testResult.approvalStatus.submitted');
      case ResultApprovalStatus.Step1Reviewed: return t('testResult.approvalStatus.step1Reviewed');
      case ResultApprovalStatus.Step2Approved: return t('testResult.approvalStatus.step2Approved');
      case ResultApprovalStatus.Rejected: return t('testResult.approvalStatus.rejected');
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

  if (!testResult) {
    return null;
  }

  return (
    <div className="test-result-detail">
      <Card
        title={t('testResult.viewTestResult')}
        extra={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/test-results')}>
              {t('common.back')}
            </Button>
            <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/test-result/edit/${id}`)}>
              {t('common.edit')}
            </Button>
          </Space>
        }
      >
        <Descriptions bordered column={2}>
          <Descriptions.Item label={t('testResult.testCode')}>{testResult.testCode}</Descriptions.Item>
          <Descriptions.Item label={t('testResult.testName')}>{testResult.testName}</Descriptions.Item>
          <Descriptions.Item label={t('testResult.parameter')}>{testResult.parameter}</Descriptions.Item>
          <Descriptions.Item label={t('testResult.value')}>{testResult.value}</Descriptions.Item>
          <Descriptions.Item label={t('testResult.unit')}>{testResult.unit}</Descriptions.Item>
          <Descriptions.Item label={t('testResult.isPass')}>
            {testResult.isPass !== undefined && testResult.isPass !== null ? (
              testResult.isPass ? (
                <Tag color="green">{t('testResult.pass')}</Tag>
              ) : (
                <Tag color="red">{t('testResult.fail')}</Tag>
              )
            ) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('testResult.lowerLimit')}>
            {testResult.lowerLimit !== undefined && testResult.lowerLimit !== null ? testResult.lowerLimit : '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('testResult.upperLimit')}>
            {testResult.upperLimit !== undefined && testResult.upperLimit !== null ? testResult.upperLimit : '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('testResult.approvalStatus.label')}>
            <Tag color={getApprovalStatusColor(testResult.approvalStatus)}>
              {getApprovalStatusText(testResult.approvalStatus)}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('testResult.entryDate')}>
            {testResult.entryDate ? dayjs(testResult.entryDate).format('YYYY-MM-DD HH:mm') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('testResult.reviewDate')} span={2}>
            {testResult.reviewDate ? dayjs(testResult.reviewDate).format('YYYY-MM-DD HH:mm') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('testResult.reviewComment')} span={2}>
            {testResult.reviewComment || '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('testResult.approvalDate')} span={2}>
            {testResult.approvalDate ? dayjs(testResult.approvalDate).format('YYYY-MM-DD HH:mm') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('testResult.approvalComment')} span={2}>
            {testResult.approvalComment || '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('testResult.chartData')} span={2}>
            {testResult.chartData || '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('testResult.notes')} span={2}>
            {testResult.notes || '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('common.createdAt')}>
            {dayjs(testResult.creationTime).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label={t('common.lastModified')}>
            {testResult.lastModificationTime ? dayjs(testResult.lastModificationTime).format('YYYY-MM-DD HH:mm') : '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default TestResultDetail;
