import React from "react";
import { Input, Select, Row, Col } from "antd";
import { SpecimenStatus } from "../../../types/specimen";
import { SPECIMEN_STATUS_CONFIG } from "../constants";

interface SpecimenFiltersProps {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearch: () => void;
  onClearSearch: () => void;
  statusFilter: SpecimenStatus | "all";
  onStatusChange: (value: SpecimenStatus | "all") => void;
  typeFilter: string;
  onTypeChange: (value: string) => void;
  specimenTypes: string[];
}

const SpecimenFilters: React.FC<SpecimenFiltersProps> = ({
  searchInput,
  onSearchInputChange,
  onSearch,
  onClearSearch,
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
  specimenTypes,
}) => {
  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
      <Col xs={24} sm={12} md={8}>
        <Input.Search
          placeholder="Tìm kiếm theo mã, tên, loại mẫu..."
          value={searchInput}
          onChange={(e) => onSearchInputChange(e.target.value)}
          onSearch={onSearch}
          onPressEnter={onSearch}
          allowClear
          onClear={onClearSearch}
          enterButton
        />
      </Col>
      <Col xs={24} sm={6} md={4}>
        <Select
          style={{ width: "100%" }}
          placeholder="Loại mẫu"
          value={typeFilter}
          onChange={onTypeChange}
        >
          <Select.Option value="all">Tất cả loại</Select.Option>
          {specimenTypes.map((t) => (
            <Select.Option key={t} value={t}>
              {t}
            </Select.Option>
          ))}
        </Select>
      </Col>
      <Col xs={24} sm={6} md={4}>
        <Select
          style={{ width: "100%" }}
          placeholder="Trạng thái"
          value={statusFilter}
          onChange={onStatusChange}
        >
          <Select.Option value="all">Tất cả trạng thái</Select.Option>
          {Object.entries(SPECIMEN_STATUS_CONFIG).map(([status, config]) => (
            <Select.Option key={status} value={Number(status)}>
              {config.text}
            </Select.Option>
          ))}
        </Select>
      </Col>
    </Row>
  );
};

export default SpecimenFilters;
