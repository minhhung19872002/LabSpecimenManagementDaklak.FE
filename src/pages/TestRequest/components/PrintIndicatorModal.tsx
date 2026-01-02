import React, { useState, useEffect } from 'react';
import { Modal, Table, Button, Space, Typography, message, Input, Select, Spin } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  QualityManagementIndicatorDto,
  QualityIndicatorApprovalStatus,
} from '../../../types/qualityManagement';
import { testRequestService, TemplateDto } from '../../../services/testRequestService';
import { qualityManagementService } from '../../../services/qualityManagementService';
import { API_BASE_URL } from '../../../services/api';

const { Text } = Typography;

interface PrintIndicatorModalProps {
  visible: boolean;
  mode: 'single' | 'mixed';
  testRequestId: string;
  onCancel: () => void;
  onSuccess?: () => void;
}

const PrintIndicatorModal: React.FC<PrintIndicatorModalProps> = ({
  visible,
  mode,
  testRequestId,
  onCancel,
  onSuccess,
}) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingIndicators, setLoadingIndicators] = useState(false);
  const [note, setNote] = useState<string>('');
  const [templates, setTemplates] = useState<TemplateDto[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>(undefined);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [indicators, setIndicators] = useState<QualityManagementIndicatorDto[]>([]);

  // Load indicators when modal opens
  useEffect(() => {
    if (visible && testRequestId) {
      loadIndicators();
      if (mode === 'single') {
        loadTemplates();
      }
    }
  }, [visible, testRequestId, mode]);

  const loadIndicators = async () => {
    setLoadingIndicators(true);
    try {
      const result = await testRequestService.getApprovedIndicators(testRequestId);
      setIndicators(result);
    } catch (error) {
      console.error('Error loading indicators:', error);
      message.error('Không thể tải danh sách chỉ tiêu');
    } finally {
      setLoadingIndicators(false);
    }
  };

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const result = await qualityManagementService.getTemplates();
      setTemplates(result);
      // Set default template (first one)
      if (result.length > 0) {
        setSelectedTemplate(result[0].name);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Reset selection and note when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedRowKeys([]);
      setNote('');
      if (mode !== 'single') {
        setSelectedTemplate(undefined);
      }
    }
  }, [visible, mode]);

  // Get only approved indicators
  const approvedIndicators = indicators.filter(
    (ind) => ind.approvalStatus === QualityIndicatorApprovalStatus.Approved
  );

  const handlePrint = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Vui lòng chọn ít nhất một chỉ tiêu để in');
      return;
    }

    if (mode === 'single' && selectedRowKeys.length > 1) {
      message.warning('In KQ đơn chỉ cho phép chọn 1 chỉ tiêu');
      return;
    }

    // Open new tab immediately to avoid popup blocker (must be in sync with user action)
    const newTab = window.open('about:blank', '_blank');

    // Show loading state in the new tab
    if (newTab) {
      newTab.document.write(`
        <html>
          <head>
            <title>Đang tạo phiếu...</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
              .loader { text-align: center; }
              .spinner { width: 40px; height: 40px; border: 4px solid #e0e0e0; border-top: 4px solid #1890ff; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px; }
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
              p { color: #666; font-size: 16px; }
            </style>
          </head>
          <body><div class="loader"><div class="spinner"></div><p>Đang tạo phiếu kết quả...</p></div></body>
        </html>
      `);
    }

    setLoading(true);
    try {
      let result: { fileName: string };
      if (mode === 'single') {
        result = await testRequestService.printSingleResult(
          testRequestId,
          selectedRowKeys[0],
          note || undefined,
          selectedTemplate
        );
      } else {
        result = await testRequestService.printMixedResult(
          testRequestId,
          selectedRowKeys,
          note || undefined
        );
      }

      message.success('Đã tạo phiếu kết quả');

      // Navigate new tab to PDF
      const pdfUrl = `${API_BASE_URL}/api/v1/result-forms/view/${encodeURIComponent(result.fileName)}`;
      if (newTab) {
        newTab.location.href = pdfUrl;
      } else {
        window.open(pdfUrl, '_blank');
      }

      setSelectedRowKeys([]);
      setNote('');
      onCancel();
      onSuccess?.();
    } catch (error: any) {
      console.error('Error printing:', error);
      // Close the blank tab if there was an error
      if (newTab) {
        newTab.close();
      }
      message.error(error?.response?.data?.error?.message || 'Không thể in kết quả');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedRowKeys([]);
    setNote('');
    setSelectedTemplate(undefined);
    setIndicators([]);
    onCancel();
  };

  const columns: ColumnsType<QualityManagementIndicatorDto> = [
    {
      title: 'Mã mẫu',
      dataIndex: 'sampleCode',
      key: 'sampleCode',
      width: 100,
    },
    {
      title: 'Tên mẫu',
      dataIndex: 'sampleName',
      key: 'sampleName',
      width: 150,
      ellipsis: true,
    },
    {
      title: 'Tên chỉ tiêu',
      dataIndex: 'indicatorName',
      key: 'indicatorName',
      width: 180,
      ellipsis: true,
    },
    {
      title: 'Phương pháp',
      dataIndex: 'methodName',
      key: 'methodName',
      width: 150,
      ellipsis: true,
    },
    {
      title: 'Kết quả',
      dataIndex: 'result',
      key: 'result',
      width: 100,
      render: (text: string) => <Text strong>{text || '-'}</Text>,
    },
    {
      title: 'ĐVT',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
    },
    {
      title: 'Giới hạn',
      dataIndex: 'referenceLimit',
      key: 'referenceLimit',
      width: 120,
      render: (text: string) => text || '-',
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => {
      if (mode === 'single') {
        // Only allow single selection for single print mode
        setSelectedRowKeys(keys.slice(-1) as string[]);
      } else {
        setSelectedRowKeys(keys as string[]);
      }
    },
    type: mode === 'single' ? ('radio' as const) : ('checkbox' as const),
  };

  return (
    <Modal
      title={
        <span>
          <PrinterOutlined style={{ marginRight: 8 }} />
          {mode === 'single' ? 'In kết quả đơn' : 'In kết quả hỗn hợp'}
        </span>
      }
      open={visible}
      onCancel={handleCancel}
      width={900}
      footer={
        <Space>
          <Button onClick={handleCancel}>Hủy</Button>
          <Button
            type="primary"
            icon={<PrinterOutlined />}
            onClick={handlePrint}
            loading={loading}
            disabled={selectedRowKeys.length === 0 || loadingIndicators}
          >
            In ({selectedRowKeys.length} chỉ tiêu)
          </Button>
        </Space>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary">
          {mode === 'single'
            ? 'Chọn 1 chỉ tiêu để in kết quả đơn'
            : 'Chọn nhiều chỉ tiêu để in kết quả hỗn hợp'}
        </Text>
      </div>

      {/* Template selection - only for single mode */}
      {mode === 'single' && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            Chọn biểu mẫu
          </label>
          <Select
            style={{ width: '100%' }}
            value={selectedTemplate}
            onChange={setSelectedTemplate}
            loading={loadingTemplates}
            placeholder="Chọn biểu mẫu"
          >
            {templates.map((template) => (
              <Select.Option key={template.name} value={template.name}>
                {template.displayName}
              </Select.Option>
            ))}
          </Select>
        </div>
      )}

      {loadingIndicators ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin tip="Đang tải danh sách chỉ tiêu..." />
        </div>
      ) : approvedIndicators.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Text type="secondary">Không có chỉ tiêu nào đã được duyệt</Text>
        </div>
      ) : (
        <>
          <Table
            rowSelection={rowSelection}
            columns={columns}
            dataSource={approvedIndicators}
            rowKey="id"
            pagination={false}
            size="small"
            scroll={{ y: 300 }}
          />

          {/* Note input field */}
          <div style={{ marginTop: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Ghi chú (không bắt buộc)
            </label>
            <Input.TextArea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nhập ghi chú sẽ được đưa vào phần cuối của báo cáo..."
              rows={3}
              maxLength={500}
              showCount
            />
          </div>
        </>
      )}
    </Modal>
  );
};

export default PrintIndicatorModal;
