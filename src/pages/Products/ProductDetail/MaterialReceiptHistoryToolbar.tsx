import React from "react";
import { DatePicker, Space } from "antd";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

export type MaterialReceiptDateRange = [dayjs.Dayjs | null, dayjs.Dayjs | null] | null;

interface MaterialReceiptHistoryToolbarProps {
  dateRange: MaterialReceiptDateRange;
  onDateRangeChange: (dates: MaterialReceiptDateRange) => void;
}

const MaterialReceiptHistoryToolbar: React.FC<MaterialReceiptHistoryToolbarProps> = ({
  dateRange,
  onDateRangeChange,
}) => (
  <Space wrap>
    <span style={{ fontWeight: 500 }}>Ngày nhận vật tư:</span>
    <RangePicker
      format="DD/MM/YYYY"
      value={dateRange}
      placeholder={["Từ ngày", "Đến ngày"]}
      onChange={(dates) => onDateRangeChange(dates as MaterialReceiptDateRange)}
      allowClear
    />
  </Space>
);

export default MaterialReceiptHistoryToolbar;
