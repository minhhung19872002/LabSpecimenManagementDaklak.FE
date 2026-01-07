import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Table, Button, Space, Typography, message, Input, Spin, Checkbox, Collapse, Divider, Tag } from 'antd';
import { PrinterOutlined, CaretRightOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  QualityManagementIndicatorDto,
  QualityIndicatorApprovalStatus,
} from '../../../types/qualityManagement';
import { testRequestService, TemplateDto, PrintResultItem } from '../../../services/testRequestService';
import { qualityManagementService } from '../../../services/qualityManagementService';
import { API_BASE_URL } from '../../../services/api';

const { Text, Title } = Typography;

interface PrintIndicatorModalProps {
  visible: boolean;
  mode: 'single' | 'mixed';
  testRequestId: string;
  onCancel: () => void;
  onSuccess?: () => void;
}

// Group indicators by laboratory
interface LabGroup {
  laboratoryId: string;
  laboratoryName: string;
  indicators: QualityManagementIndicatorDto[];
}

const PrintIndicatorModal: React.FC<PrintIndicatorModalProps> = ({
  visible,
  mode,
  testRequestId,
  onCancel,
  onSuccess,
}) => {
  const [selectedIndicatorIds, setSelectedIndicatorIds] = useState<string[]>([]);
  const [selectedLabIds, setSelectedLabIds] = useState<string[]>([]);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingIndicators, setLoadingIndicators] = useState(false);
  const [note, setNote] = useState<string>('');
  const [templates, setTemplates] = useState<TemplateDto[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [indicators, setIndicators] = useState<QualityManagementIndicatorDto[]>([]);

  // Load indicators when modal opens
  useEffect(() => {
    if (visible && testRequestId) {
      loadIndicators();
      loadTemplates();
    }
  }, [visible, testRequestId]);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedIndicatorIds([]);
      setSelectedLabIds([]);
      setSelectedTemplates([]);
      setNote('');
    }
  }, [visible]);

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
      // Set BM01 as default selected template (first one usually)
      if (result.length > 0) {
        // Find BM01 or use first template
        const bm01 = result.find(t => t.name.includes('BM01'));
        setSelectedTemplates([bm01?.name || result[0].name]);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Get only approved indicators
  const approvedIndicators = useMemo(() =>
    indicators.filter((ind) => ind.approvalStatus === QualityIndicatorApprovalStatus.Approved),
    [indicators]
  );

  // Group indicators by laboratory
  const labGroups: LabGroup[] = useMemo(() => {
    const groups: Record<string, LabGroup> = {};

    approvedIndicators.forEach((indicator) => {
      const labId = indicator.laboratoryId || 'unknown';
      const labName = indicator.laboratoryName || 'Không xác định';

      if (!groups[labId]) {
        groups[labId] = {
          laboratoryId: labId,
          laboratoryName: labName,
          indicators: [],
        };
      }
      groups[labId].indicators.push(indicator);
    });

    return Object.values(groups);
  }, [approvedIndicators]);

  // Auto-select labs when indicators are selected
  useEffect(() => {
    const labsWithSelectedIndicators = new Set<string>();

    selectedIndicatorIds.forEach((indicatorId) => {
      const indicator = approvedIndicators.find((i) => i.id === indicatorId);
      if (indicator?.laboratoryId) {
        labsWithSelectedIndicators.add(indicator.laboratoryId);
      }
    });

    setSelectedLabIds(Array.from(labsWithSelectedIndicators));
  }, [selectedIndicatorIds, approvedIndicators]);

  // Calculate selected indicators per lab
  const selectedIndicatorsPerLab = useMemo(() => {
    const result: Record<string, number> = {};
    selectedIndicatorIds.forEach((indicatorId) => {
      const indicator = approvedIndicators.find((i) => i.id === indicatorId);
      if (indicator?.laboratoryId) {
        result[indicator.laboratoryId] = (result[indicator.laboratoryId] || 0) + 1;
      }
    });
    return result;
  }, [selectedIndicatorIds, approvedIndicators]);

  const handlePrint = async () => {
    if (selectedIndicatorIds.length === 0) {
      message.warning('Vui lòng chọn ít nhất một chỉ tiêu để in');
      return;
    }

    if (selectedTemplates.length === 0) {
      message.warning('Vui lòng chọn ít nhất một biểu mẫu');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'single') {
        // Open single tab with loading state
        const newTab = window.open('about:blank', '_blank');
        if (newTab) {
          newTab.document.write(`
            <html>
              <head>
                <title>Đang tạo phiếu kết quả...</title>
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

        // Use new batch API for single mode with multiple templates/labs
        const result = await testRequestService.printMultiSingleResult(
          testRequestId,
          selectedIndicatorIds,
          selectedTemplates,
          note || undefined
        );

        message.success(`Đã tạo ${result.results.length} phiếu kết quả`);

        // If only 1 result, navigate directly to PDF
        if (result.results.length === 1) {
          const pdfUrl = `${API_BASE_URL}/api/v1/result-forms/view/${encodeURIComponent(result.results[0].fileName)}`;
          if (newTab) {
            newTab.location.href = pdfUrl;
          } else {
            window.open(pdfUrl, '_blank');
          }
        } else {
          // Multiple results - show list page with links
          const pdfLinks = result.results.map((item: PrintResultItem) => ({
            url: `${API_BASE_URL}/api/v1/result-forms/view/${encodeURIComponent(item.fileName)}`,
            labName: item.laboratoryName,
            templateName: item.templateName,
          }));

          // Debug log
          console.log('Generated PDF links:', pdfLinks);

          if (newTab) {
            // Build cards HTML separately to avoid template literal issues
            const cardsHtml = pdfLinks.map((link, index) =>
              '<div class="card">' +
                '<div class="info">' +
                  '<div class="lab-name">' + (index + 1) + '. ' + link.labName + '</div>' +
                  '<div class="template-name">' + link.templateName + '</div>' +
                '</div>' +
                '<a href="' + link.url + '" target="_blank" class="btn">Xem PDF</a>' +
              '</div>'
            ).join('');

            const linksJson = JSON.stringify(pdfLinks.map(l => l.url));

            newTab.document.open();
            newTab.document.write(`
              <!DOCTYPE html>
              <html>
                <head>
                  <title>Phiếu kết quả (${pdfLinks.length} file)</title>
                  <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 24px; background: #f5f5f5; }
                    .container { max-width: 800px; margin: 0 auto; }
                    h1 { color: #1890ff; font-size: 24px; margin-bottom: 24px; }
                    .card { background: white; border-radius: 8px; padding: 16px; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); display: flex; justify-content: space-between; align-items: center; }
                    .info { flex: 1; }
                    .lab-name { font-weight: 600; color: #333; margin-bottom: 4px; }
                    .template-name { color: #666; font-size: 14px; }
                    .btn { background: #1890ff; color: white; padding: 8px 16px; border-radius: 4px; text-decoration: none; font-size: 14px; display: inline-block; }
                    .btn:hover { background: #40a9ff; }
                    .download-all { margin-bottom: 16px; }
                    .download-all-btn { background: #52c41a; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none; font-size: 14px; cursor: pointer; border: none; margin-right: 8px; }
                    .download-all-btn:hover { background: #73d13d; }
                    .iframes-container { display: none; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <h1>Đã tạo ${pdfLinks.length} phiếu kết quả</h1>
                    <div class="download-all">
                      <button class="download-all-btn" onclick="downloadAll()">Tải tất cả PDF</button>
                    </div>
                    ${cardsHtml}
                  </div>
                  <div class="iframes-container" id="iframes"></div>
                  <script>
                    function downloadAll() {
                      var links = ${linksJson};
                      var container = document.getElementById('iframes');
                      links.forEach(function(url) {
                        var iframe = document.createElement('iframe');
                        iframe.style.display = 'none';
                        iframe.src = url;
                        container.appendChild(iframe);
                      });
                    }
                  </script>
                </body>
              </html>
            `);
            newTab.document.close();
          }
        }
      } else {
        // Mixed mode - use existing API
        const newTab = window.open('about:blank', '_blank');
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

        const result = await testRequestService.printMixedResult(
          testRequestId,
          selectedIndicatorIds,
          note || undefined
        );

        message.success('Đã tạo phiếu kết quả');

        const pdfUrl = `${API_BASE_URL}/api/v1/result-forms/view/${encodeURIComponent(result.fileName)}`;
        if (newTab) {
          newTab.location.href = pdfUrl;
        } else {
          window.open(pdfUrl, '_blank');
        }
      }

      setSelectedIndicatorIds([]);
      setSelectedLabIds([]);
      setNote('');
      onCancel();
      onSuccess?.();
    } catch (error: any) {
      console.error('Error printing:', error);
      message.error(error?.response?.data?.error?.message || 'Không thể in kết quả');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedIndicatorIds([]);
    setSelectedLabIds([]);
    setSelectedTemplates([]);
    setNote('');
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
      width: 140,
      ellipsis: true,
    },
    {
      title: 'Tên chỉ tiêu',
      dataIndex: 'indicatorName',
      key: 'indicatorName',
      width: 160,
      ellipsis: true,
    },
    {
      title: 'Phương pháp',
      dataIndex: 'methodName',
      key: 'methodName',
      width: 140,
      ellipsis: true,
    },
    {
      title: 'Kết quả',
      dataIndex: 'result',
      key: 'result',
      width: 90,
      render: (text: string) => <Text strong>{text || '-'}</Text>,
    },
    {
      title: 'ĐVT',
      dataIndex: 'unit',
      key: 'unit',
      width: 70,
    },
  ];

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
      width={1000}
      centered
      footer={
        <Space>
          <Button onClick={handleCancel}>Hủy</Button>
          <Button
            type="primary"
            icon={<PrinterOutlined />}
            onClick={handlePrint}
            loading={loading}
            disabled={selectedIndicatorIds.length === 0 || loadingIndicators || (mode === 'single' && selectedTemplates.length === 0)}
          >
            In ({selectedIndicatorIds.length} chỉ tiêu)
          </Button>
        </Space>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary">
          {mode === 'single'
            ? 'Chọn các chỉ tiêu và biểu mẫu để in. Hệ thống sẽ tạo 1 PDF cho mỗi lab × template.'
            : 'Chọn nhiều chỉ tiêu để in kết quả hỗn hợp'}
        </Text>
      </div>

      {loadingIndicators || loadingTemplates ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin tip="Đang tải dữ liệu..." />
        </div>
      ) : approvedIndicators.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Text type="secondary">Không có chỉ tiêu nào đã được duyệt</Text>
        </div>
      ) : (
        <>
          {/* Indicators grouped by lab with collapse */}
          <Title level={5} style={{ marginBottom: 12 }}>Chọn chỉ tiêu để in</Title>
          <div style={{ maxHeight: 400, overflowY: 'auto', marginBottom: 16 }}>
            <Collapse
              defaultActiveKey={labGroups.map((g) => g.laboratoryId)}
              expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
              items={labGroups.map((group) => ({
                key: group.laboratoryId,
                label: (
                  <Space>
                    <Text strong>{group.laboratoryName}</Text>
                    <Tag color="blue">
                      {group.indicators.length} chỉ tiêu
                    </Tag>
                    {selectedIndicatorsPerLab[group.laboratoryId] > 0 && (
                      <Tag color="green">
                        Đã chọn: {selectedIndicatorsPerLab[group.laboratoryId]}
                      </Tag>
                    )}
                  </Space>
                ),
                children: (
                  <Table
                    dataSource={group.indicators}
                    columns={columns}
                    rowKey="id"
                    size="small"
                    pagination={false}
                    rowSelection={{
                      selectedRowKeys: selectedIndicatorIds,
                      onChange: (keys) => {
                        // Update selected indicators for this lab only
                        const otherLabIndicatorIds = selectedIndicatorIds.filter(
                          (id) => !group.indicators.map((i) => i.id).includes(id)
                        );
                        setSelectedIndicatorIds([...otherLabIndicatorIds, ...keys as string[]]);
                      },
                      type: 'checkbox',
                    }}
                    scroll={{ x: 700 }}
                  />
                ),
              }))}
            />
          </div>

          {/* Template selection - only for single mode */}
          {mode === 'single' && (
            <>
              <Divider style={{ margin: '16px 0' }} />
              <Title level={5} style={{ marginBottom: 12 }}>Chọn biểu mẫu báo cáo</Title>
              <div style={{ marginBottom: 16 }}>
                <Checkbox.Group
                  value={selectedTemplates}
                  onChange={(values) => setSelectedTemplates(values as string[])}
                >
                  <Space direction="vertical">
                    {templates.map((template) => (
                      <Checkbox key={template.name} value={template.name}>
                        {template.displayName}
                      </Checkbox>
                    ))}
                  </Space>
                </Checkbox.Group>
              </div>
            </>
          )}

          {/* Note input field */}
          <Divider style={{ margin: '16px 0' }} />
          <div>
            <Title level={5} style={{ marginBottom: 8 }}>Ghi chú (không bắt buộc)</Title>
            <Input.TextArea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nhập ghi chú sẽ được đưa vào phần cuối của báo cáo..."
              rows={2}
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
