import React, { useState } from 'react';
import { Card, Descriptions, Button, Space, Spin, Tag, message, Modal, Input, Divider, Alert } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeftOutlined, EditOutlined, SendOutlined, CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { ResultApprovalStatus } from '../../types/testResult';
import dayjs from 'dayjs';
import './TestResultDetail.css';

// RTK Query imports
import {
  useGetTestResultQuery,
  useSubmitForReviewMutation,
  useReviewResultMutation,
  useApproveResultMutation,
} from '../../store/api/testResultApi';

const { TextArea } = Input;

const TestResultDetail: React.FC = () => {
  const [actionLoading, setActionLoading] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [comment, setComment] = useState('');
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();

  // RTK Query hooks
  const { data: testResult, isLoading: loading, error, refetch } = useGetTestResultQuery(id!, { skip: !id });

  // Mutations
  const [submitForReview] = useSubmitForReviewMutation();
  const [reviewResult] = useReviewResultMutation();
  const [approveResult] = useApproveResultMutation();

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
          await submitForReview({ id }).unwrap();
          await refetch();
          message.success('Đã gửi kết quả để duyệt!');
        } catch (error) {
          message.error('Không thể gửi kết quả để duyệt. Vui lòng thử lại.');
          console.error('Failed to submit for review:', error);
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
      await reviewResult({ id, data: { isApproved, comment } }).unwrap();
      await refetch();
      message.success(isApproved ? 'Đã duyệt kết quả (Bước 1)!' : 'Đã từ chối kết quả!');
      setReviewModalVisible(false);
      setComment('');
    } catch (error) {
      message.error('Không thể thực hiện duyệt. Vui lòng thử lại.');
      console.error('Failed to review:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (isApproved: boolean) => {
    if (!id || !testResult) return;

    setActionLoading(true);
    try {
      await approveResult({ id, data: { isApproved, comment } }).unwrap();
      await refetch();
      message.success(isApproved ? 'Đã phê duyệt kết quả (Bước 2)!' : 'Đã từ chối kết quả!');
      setApproveModalVisible(false);
      setComment('');
    } catch (error) {
      message.error('Không thể thực hiện phê duyệt. Vui lòng thử lại.');
      console.error('Failed to approve:', error);
    } finally {
      setActionLoading(false);
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
        <Divider>Quy trình duyệt</Divider>

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

  if (error) {
    return (
      <Alert
        message="Lỗi"
        description="Không thể tải thông tin kết quả. Vui lòng kiểm tra kết nối API."
        type="error"
        showIcon
      />
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
        {/* Thông tin kết quả thử nghiệm */}
        <Descriptions bordered column={2} title="Thông tin kết quả">
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
          <Descriptions.Item label="Người nhập">
            {testResult.enteredByName || '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('testResult.entryDate')}>
            {testResult.entryDate ? dayjs(testResult.entryDate).format('DD/MM/YYYY HH:mm') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('testResult.notes')} span={2}>
            {testResult.notes || '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('common.createdAt')}>
            {dayjs(testResult.creationTime).format('DD/MM/YYYY HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label={t('common.lastModified')}>
            {testResult.lastModificationTime ? dayjs(testResult.lastModificationTime).format('DD/MM/YYYY HH:mm') : '-'}
          </Descriptions.Item>
        </Descriptions>

        {/* Thông tin duyệt Bước 1 */}
        <Card
          size="small"
          title={
            <Space>
              <CheckCircleOutlined style={{ color: testResult.reviewerName ? '#13c2c2' : '#d9d9d9' }} />
              Duyệt Bước 1 - Trưởng phòng
            </Space>
          }
          style={{ marginTop: 16 }}
          styles={{ header: { backgroundColor: testResult.reviewerName ? '#e6fffb' : '#fafafa' } }}
        >
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Người duyệt">
              {testResult.reviewerName || <span style={{ color: '#999' }}>Chưa duyệt</span>}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày duyệt">
              {testResult.reviewDate ? dayjs(testResult.reviewDate).format('DD/MM/YYYY HH:mm') : <span style={{ color: '#999' }}>-</span>}
            </Descriptions.Item>
            <Descriptions.Item label="Nhận xét" span={2}>
              {testResult.reviewComment || <span style={{ color: '#999' }}>Không có nhận xét</span>}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Thông tin duyệt Bước 2 */}
        <Card
          size="small"
          title={
            <Space>
              <CheckCircleOutlined style={{ color: testResult.approverName ? '#52c41a' : '#d9d9d9' }} />
              Duyệt Bước 2 - Giám đốc
            </Space>
          }
          style={{ marginTop: 16 }}
          styles={{ header: { backgroundColor: testResult.approverName ? '#f6ffed' : '#fafafa' } }}
        >
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Người phê duyệt">
              {testResult.approverName || <span style={{ color: '#999' }}>Chưa phê duyệt</span>}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày phê duyệt">
              {testResult.approvalDate ? dayjs(testResult.approvalDate).format('DD/MM/YYYY HH:mm') : <span style={{ color: '#999' }}>-</span>}
            </Descriptions.Item>
            <Descriptions.Item label="Nhận xét" span={2}>
              {testResult.approvalComment || <span style={{ color: '#999' }}>Không có nhận xét</span>}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Workflow Actions */}
        {renderWorkflowActions()}
      </Card>

      {/* Review Modal (Step 1) */}
      <Modal
        title="Duyệt kết quả (Bước 1 - Trưởng phòng)"
        open={reviewModalVisible}
        onCancel={() => { setReviewModalVisible(false); setComment(''); }}
        centered
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
        centered
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
