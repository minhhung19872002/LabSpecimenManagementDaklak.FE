import React from "react";
import { Input, Select, DatePicker, Row, Col } from "antd";
import type { Dayjs } from "dayjs";
import { TestRequestStatus } from "../../../types/testRequest";
import { STATUS_OPTIONS } from "../constants";

interface TestRequestFiltersProps {
  searchInput: string;
  statusFilter: TestRequestStatus | "all";
  dateRange: [Dayjs | null, Dayjs | null] | null;
  onSearchInputChange: (value: string) => void;
  onSearch: () => void;
  onClearSearch: () => void;
  onStatusChange: (value: TestRequestStatus | "all") => void;
  onDateRangeChange: (dates: [Dayjs | null, Dayjs | null] | null) => void;
}

const TestRequestFilters: React.FC<TestRequestFiltersProps> = ({
  searchInput,
  statusFilter,
  dateRange,
  onSearchInputChange,
  onSearch,
  onClearSearch,
  onStatusChange,
  onDateRangeChange,
}) => {
  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
      <Col xs={24} sm={12} md={8}>
        <Input.Search
          placeholder="Tìm kiếm theo số YC, tên CS/DN, người liên hệ, SĐT..."
          value={searchInput}
          onChange={(e) => onSearchInputChange(e.target.value)}
          onSearch={onSearch}
          onPressEnter={onSearch}
          allowClear
          onClear={onClearSearch}
          enterButton
        />
      </Col>
      <Col xs={24} sm={12} md={5}>
        <Select
          style={{ width: "100%" }}
          placeholder="Lọc theo trạng thái"
          value={statusFilter}
          onChange={onStatusChange}
        >
          {STATUS_OPTIONS.map((option) => (
            <Select.Option key={option.value} value={option.value}>
              {option.label}
            </Select.Option>
          ))}
        </Select>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ whiteSpace: "nowrap", color: "#666" }}>
            Ngày HT dự kiến:
          </span>
          <DatePicker.RangePicker
            style={{ flex: 1 }}
            placeholder={["Từ ngày", "Đến ngày"]}
            format="DD/MM/YYYY"
            value={dateRange}
            onChange={onDateRangeChange}
            allowClear
          />
        </div>
      </Col>
    </Row>
  );
};

export default TestRequestFilters;