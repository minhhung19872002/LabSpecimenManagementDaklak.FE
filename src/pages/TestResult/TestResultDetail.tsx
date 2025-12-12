import React, { useEffect, useState } from 'react';
import { Card, Descriptions, Button, Space, Spin, Tag, message, Modal, Input, Divider, Alert } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeftOutlined, EditOutlined, SendOutlined, CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { testResultService } from '../../services/testResultService';
import { TestResultDto, ResultApprovalStatus } from '../../types/testResult';
import dayjs from 'dayjs';
import './TestResultDetail.css';

const { TextArea } = Input;

// Mock data fallback
const getMockTestResult = (id: string): TestResultDto => ({
  id,
  testId: 'test-001',
  testCode: `TEST-${dayjs().format('YYYYMMDD')}-${id.replace(/\D/g, '').padStart(4, '0')}`,
  testName: 'Real-time PCR SARS-CoV-2',
  parameter: 'SARS-CoV-2 (PCR)',
  value: 'Âm tính',
  unit: '-',
  referenceRange: 'Âm tính / Ct > 40',
  isPass: true,
  approvalStatus: ResultApprovalStatus.Draft,
  testedBy: 'ThS. Nguyễn Văn A',
  testedDate: dayjs().subtract(1, 'day').toISOString(),
  notes: 'Kết quả âm tính với SARS-CoV-2',
  creationTime: dayjs().subtract(1, 'day').toISOString(),
});

const TestResultDetail: React.FC = () => {
  const [testResult, setTestResult] = useState<TestResultDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [comment, setComment] = useState('');
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
      console.log('API not available, using mock data');
      setTestResult(getMockTestResult(testResultId));
    } finally {
      setLoading(false);
    }
  };

  // ==================== WORKFLOW ACTIONS ====================

  const handleSubmitForReview = async () => {
    if (!id || !testResult) return;

    Modal.confirm({
      title: 'Xác nhận gửi duyệt',
      icon: <ExclamationCircleOutlined />,
      content: 'Bạn có chắc chắn muốn gửi kết quả này để duyệt?',
      okText: 'Gửi duyệt',
      cancelText: 'Hủy',
      onOk: async () => {
        setActionLoading(true);
        try {
          const result = await testResultService.submitForReview(id);
          setTestResult(result);
          message.success('Đã gửi kết quả để duyệt!');
        } catch (error) {
          // Mock success for demo
          setTestResult({ ...testResult, approvalStatus: ResultApprovalStatus.Submitted });
          message.success('Đã gửi kết quả để duyệt! (Demo)');
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleReview = async (isApproved: boolean) => {
    if (!id || !testResult) return;

    setActionLoading(true);
    try {
      const result = await testResultService.review(id, { isApproved, comment });
      setTestResult(result);
      message.success(isApproved ? 'Đã duyệt kết quả (Bước 1)!' : 'Đã từ chối kết quả!');
    } catch (error) {
      // Mock success for demo
      setTestResult({
        ...testResult,
        approvalStatus: isApproved ? ResultApprovalStatus.Step1Reviewed : ResultApprovalStatus.Rejected,
        reviewerId: 'reviewer-001',
        reviewDate: dayjs().toISOString(),
        reviewComment: comment,
      });
      message.success(isApproved ? 'Đã duyệt kết quả (Bước 1)! (Demo)' : 'Đã từ chối kết quả! (Demo)');
    } finally {
      setActionLoading(false);
      setReviewModalVisible(false);
      setComment('');
    }
  };

  const handleApprove = async (isApproved: boolean) => {
    if (!id || !testResult) return;

    setActionLoading(true);
    try {
      const result = await testResultService.approve(id, { isApproved, comment });
      setTestResult(result);
      message.success(isApproved ? 'Đã phê duyệt kết quả (Bước 2)!' : 'Đã từ chối kết quả!');
    } catch (error) {
      // Mock success for demo
      setTestResult({
        ...testResult,
        approvalStatus: isApproved ? ResultApprovalStatus.Step2Approved : ResultApprovalStatus.Rejected,
        approverId: 'approver-001',
        approvalDate: dayjs().toISOString(),
        approvalComment: comment,
      });
      message.success(isApproved ? 'Đã phê duyệt kết quả (Bước 2)! (Demo)' : 'Đã từ chối kết quả! (Demo)');
    } finally {
      setActionLoading(false);
      setApproveModalVisible(false);
      setComment('');
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
      case ResultApprovalStatus.Draft: return 'Nháp';
      case ResultApprovalStatus.Submitted: return 'Chờ duyệt B1';
      case ResultApprovalStatus.Step1Reviewed: return 'Chờ duyệt B2';
      case ResultApprovalStatus.Step2Approved: return 'Đã phê duyệt';
      case ResultApprovalStatus.Rejected: return 'Từ chối';
      default: return '';
    }
  };

  // Render workflow action buttons based on current status
  const renderWorkflowActions = () => {
    if (!testResult) return null;

    const { approvalStatus } = testResult;

    return (
      <div style={{ marginTop: 16 }}>
        <Divider orientation="left">Quy trình duyệt</Divider>

        {/* Workflow Progress */}
        <Alert
          message={
            <Space split={<span style={{ color: '#ccc' }}> → </span>}>
              <Tag color={approvalStatus === ResultApprovalStatus.Draft ? 'processing' : approvalStatus > ResultApprovalStatus.Draft ? 'success' : 'default'}>
                1. Nháp
              </Tag>
              <Tag color={approvalStatus === ResultApprovalStatus.Submitted ? 'processing' : approvalStatus > ResultApprovalStatus.Submitted ? 'success' : 'default'}>
                2. Chờ duyệt B1
              </Tag>
              <Tag color={approvalStatus === ResultApprovalStatus.Step1Reviewed ? 'processing' : approvalStatus > ResultApprovalStatus.Step1Reviewed ? 'success' : 'default'}>
                3. Chờ duyệt B2
              </Tag>
              <Tag color={approvalStatus === ResultApprovalStatus.Step2Approved ? 'success' : 'default'}>
                4. Hoàn thành
              </Tag>
            </Space>
          }
          type="info"
          style={{ marginBottom: 16 }}
        />

        {/* Action Buttons */}
        <Space>
          {/* KTV: Submit for review (Draft -> Submitted) */}
          {approvalStatus === ResultApprovalStatus.Draft && (
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSubmitForReview}
              loading={actionLoading}
            >
              Gửi duyệt
            </Button>
          )}

          {/* Reviewer: Review (Submitted -> Step1Reviewed or Rejected) */}
          {approvalStatus === ResultApprovalStatus.Submitted && (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => setReviewModalVisible(true)}
              loading={actionLoading}
              style={{ backgroundColor: '#13c2c2' }}
            >
              Duyệt B1 (Trưởng phòng)
            </Button>
          )}

          {/* Approver: Approve (Step1Reviewed -> Step2Approved or Rejected) */}
          {approvalStatus === ResultApprovalStatus.Step1Reviewed && (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => setApproveModalVisible(true)}
              loading={actionLoading}
              style={{ backgroundColor: '#52c41a' }}
            >
              Duyệt B2 (Giám đốc)
            </Button>
          )}

          {/* Final status */}
          {approvalStatus === ResultApprovalStatus.Step2Approved && (
            <Tag color="success" style={{ padding: '8px 16px', fontSize: 14 }}>
              <CheckCircleOutlined /> Đã phê duyệt hoàn tất
            </Tag>
          )}

          {approvalStatus === ResultApprovalStatus.Rejected && (
            <Tag color="error" style={{ padding: '8px 16px', fontSize: 14 }}>
              <CloseCircleOutlined /> Đã bị từ chối - Cần chỉnh sửa lại
            </Tag>
          )}
        </Space>
      </div>
    );
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
            {testResult.approvalStatus === ResultApprovalStatus.Draft && (
              <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/test-result/edit/${id}`)}>
                {t('common.edit')}
              </Button>
            )}
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
          <Descriptions.Item label="Người duyệt B1">
            {testResult.reviewerId || '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('testResult.reviewDate')}>
            {testResult.reviewDate ? dayjs(testResult.reviewDate).format('YYYY-MM-DD HH:mm') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('testResult.reviewComment')} span={2}>
            {testResult.reviewComment || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Người duyệt B2">
            {testResult.approverId || '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('testResult.approvalDate')}>
            {testResult.approvalDate ? dayjs(testResult.approvalDate).format('YYYY-MM-DD HH:mm') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('testResult.approvalComment')} span={2}>
            {testResult.approvalComment || '-'}
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

        {/* Workflow Actions */}
        {renderWorkflowActions()}
      </Card>

      {/* Review Modal (Step 1) */}
      <Modal
        title="Duyệt kết quả (Bước 1 - Trưởng phòng)"
        open={reviewModalVisible}
        onCancel={() => { setReviewModalVisible(false); setComment(''); }}
        footer={[
          <Button key="cancel" onClick={() => { setReviewModalVisible(false); setComment(''); }}>
            Hủy
          </Button>,
          <Button
            key="reject"
            danger
            icon={<CloseCircleOutlined />}
            loading={actionLoading}
            onClick={() => handleReview(false)}
          >
            Từ chối
          </Button>,
          <Button
            key="approve"
            type="primary"
            icon={<CheckCircleOutlined />}
            loading={actionLoading}
            onClick={() => handleReview(true)}
          >
            Duyệt
          </Button>,
        ]}
      >
        <p>Bạn đang duyệt kết quả: <strong>{testResult.testCode}</strong></p>
        <p>Chỉ tiêu: {testResult.parameter}</p>
        <p>Kết quả: <strong>{testResult.value} {testResult.unit}</strong></p>
        <Divider />
        <p>Nhận xét (tùy chọn):</p>
        <TextArea
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Nhập nhận xét của bạn..."
        />
      </Modal>

      {/* Approve Modal (Step 2) */}
      <Modal
        title="Phê duyệt kết quả (Bước 2 - Giám đốc)"
        open={approveModalVisible}
        onCancel={() => { setApproveModalVisible(false); setComment(''); }}
        footer={[
          <Button key="cancel" onClick={() => { setApproveModalVisible(false); setComment(''); }}>
            Hủy
          </Button>,
          <Button
            key="reject"
            danger
            icon={<CloseCircleOutlined />}
            loading={actionLoading}
            onClick={() => handleApprove(false)}
          >
            Từ chối
          </Button>,
          <Button
            key="approve"
            type="primary"
            icon={<CheckCircleOutlined />}
            loading={actionLoading}
            style={{ backgroundColor: '#52c41a' }}
            onClick={() => handleApprove(true)}
          >
            Phê duyệt
          </Button>,
        ]}
      >
        <p>Bạn đang phê duyệt kết quả: <strong>{testResult.testCode}</strong></p>
        <p>Chỉ tiêu: {testResult.parameter}</p>
        <p>Kết quả: <strong>{testResult.value} {testResult.unit}</strong></p>
        {testResult.reviewComment && (
          <Alert
            message="Nhận xét từ Trưởng phòng"
            description={testResult.reviewComment}
            type="info"
            style={{ marginTop: 8 }}
          />
        )}
        <Divider />
        <p>Nhận xét (tùy chọn):</p>
        <TextArea
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Nhập nhận xét của bạn..."
        />
      </Modal>
    </div>
  );
};

export default TestResultDetail;
