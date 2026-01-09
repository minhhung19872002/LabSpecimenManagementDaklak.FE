import React, { useState } from 'react';
import { Modal, DatePicker, message, Space, Typography } from 'antd';
import type { Dayjs } from 'dayjs';
import { receiptService } from '../../../services/receiptService';

const { RangePicker } = DatePicker;
const { Text } = Typography;

interface ExportReceiptModalProps {
  open: boolean;
  onClose: () => void;
}

const ExportReceiptModal: React.FC<ExportReceiptModalProps> = ({
  open,
  onClose,
}) => {
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!dateRange) {
      message.warning('Vui lòng chọn khoảng thời gian');
      return;
    }

    setExporting(true);
    try {
      const fromDate = dateRange[0].format('YYYY-MM-DD');
      const toDate = dateRange[1].format('YYYY-MM-DD');

      const blob = await receiptService.exportPaymentHistory({
        fromDate,
        toDate,
      });

      // Download file
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `danh-sach-thanh-toan_${dateRange[0].format('YYYYMMDD')}_${dateRange[1].format('YYYYMMDD')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      message.success('Xuất báo cáo thành công');
      onClose();
    } catch (error) {
      console.error('Error exporting:', error);
      message.error('Không thể xuất báo cáo. Vui lòng thử lại.');
    } finally {
      setExporting(false);
    }
  };

  const handleCancel = () => {
    setDateRange(null);
    onClose();
  };

  return (
    <Modal
      title="Xuất phiếu thu"
      open={open}
      onOk={handleExport}
      onCancel={handleCancel}
      okText="Xuất Excel"
      cancelText="Hủy"
      confirmLoading={exporting}
      centered
      destroyOnClose
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <div>
          <Text>Chọn khoảng thời gian cần xuất báo cáo:</Text>
        </div>
        <RangePicker
          value={dateRange}
          onChange={(dates) => setDateRange(dates as [Dayjs, Dayjs] | null)}
          format="DD/MM/YYYY"
          style={{ width: '100%' }}
          placeholder={['Từ ngày', 'Đến ngày']}
          allowClear
        />
        <div style={{ color: 'rgba(0, 0, 0, 0.45)', fontSize: 12 }}>
          <Text type="secondary">
            Dữ liệu xuất ra bao gồm: Số hợp đồng, Mã phiếu thu, Tổng chi phí,
            Số tiền thanh toán, Hình thức thanh toán, Ghi chú.
          </Text>
        </div>
      </Space>
    </Modal>
  );
};

export default ExportReceiptModal;
