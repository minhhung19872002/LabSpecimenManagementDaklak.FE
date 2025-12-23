import React from "react";
import { Row, Col, Input, Select } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { LaboratoryTaskStatus } from "../../../types/laboratoryTask";
import { STATUS_FILTER_OPTIONS } from "../constants/taskManagement.constants";

interface TaskFiltersProps {
  searchText: string;
  onSearchTextChange: (value: string) => void;
  onSearch: (value: string) => void;
  statusFilter: LaboratoryTaskStatus | undefined;
  onStatusFilterChange: (value: string) => void;
}

const TaskFilters: React.FC<TaskFiltersProps> = ({
  searchText,
  onSearchTextChange,
  onSearch,
  statusFilter,
  onStatusFilterChange,
}) => {
  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
      <Col xs={24} sm={12} md={8}>
        <Input.Search
          placeholder="Tìm theo số hợp đồng, quản lý kỹ thuật..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => onSearchTextChange(e.target.value)}
          onSearch={onSearch}
          allowClear
          enterButton
        />
      </Col>
      <Col xs={24} sm={6} md={4}>
        <Select
          style={{ width: "100%" }}
          placeholder="Trạng thái"
          value={statusFilter !== undefined ? String(statusFilter) : "all"}
          onChange={onStatusFilterChange}
        >
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <Select.Option key={opt.value} value={opt.value}>
              {opt.label}
            </Select.Option>
          ))}
        </Select>
      </Col>
    </Row>
  );
};

export default TaskFilters;
