import React, { useState } from 'react';
import { Modal, Table, Button, Space, Typography, message } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  QualityManagementIndicatorDto,
  QualityIndicatorApprovalStatus,
} from '../../../types/qualityManagement';

const { Text } = Typography;

interface PrintModalProps {
  visible: boolean;
  mode: 'single' | 'mixed';
  indicators: QualityManagementIndicatorDto[];
  selectedIds: string[];
  onCancel: () => void;
  onPrint: (indicatorIds: string[]) => Promise<void>;
}

const PrintModal: React.FC<PrintModalProps> = ({
  visible,
  mode,
  indicators,
  selectedIds,
  onCancel,
  onPrint,
}) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Get only approved indicators
  const approvedIndicators = indicators.filter(
    (ind) => ind.approvalStatus === QualityIndicatorApprovalStatus.Approved
  );

  // If mode is mixed, use the passed selectedIds, otherwise allow selection
  React.useEffect(() => {
    if (mode === 'mixed' && visible) {
      setSelectedRowKeys(selectedIds);
    } else if (mode === 'single' && visible) {
      setSelectedRowKeys([]);
    }
  }, [mode, selectedIds, visible]);

  const handlePrint = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Vui lòng chọn ít nhất một chỉ tiêu để in');
      return;
    }

    if (mode === 'single' && selectedRowKeys.length > 1) {
      message.warning('In KQ đơn chỉ cho phép chọn 1 chỉ tiêu');
      return;
    }

    setLoading(true);
    try {
      await onPrint(selectedRowKeys);
      setSelectedRowKeys([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedRowKeys([]);
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
            disabled={selectedRowKeys.length === 0}
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
            : `Đã chọn ${selectedRowKeys.length} chỉ tiêu để in kết quả hỗn hợp`}
        </Text>
      </div>

      {approvedIndicators.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Text type="secondary">Không có chỉ tiêu nào đã được duyệt</Text>
        </div>
      ) : (
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={approvedIndicators}
          rowKey="id"
          pagination={false}
          size="small"
          scroll={{ y: 400 }}
        />
      )}
    </Modal>
  );
};

export default PrintModal;
