import React from "react";
import { DatePicker, Space } from "antd";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

type DateRange = [dayjs.Dayjs | null, dayjs.Dayjs | null] | null;

export interface ImportHistoryToolbarProps {
  dateRange: DateRange;
  onDateRangeChange: (dates: DateRange) => void;
}

const ImportHistoryToolbar: React.FC<ImportHistoryToolbarProps> = ({
  dateRange,
  onDateRangeChange,
}) => {
  return (
    <Space wrap>
      <span style={{ color: "#fff", fontWeight: 500 }}>Ngày nhập kho:</span>
      <RangePicker
        format="DD/MM/YYYY"
        value={dateRange}
        placeholder={["Từ ngày", "Đến ngày"]}
        onChange={(dates) => onDateRangeChange(dates as DateRange)}
        allowClear
      />
    </Space>
  );
};

export default ImportHistoryToolbar;
