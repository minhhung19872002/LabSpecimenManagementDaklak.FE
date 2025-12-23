import React from "react";
import { Row, Col, Input, Select, Tabs } from "antd";
import { SearchOutlined, UserOutlined, TeamOutlined } from "@ant-design/icons";
import { TestingStatus, TestingTabType } from "../../../types/testing";
import { STATUS_FILTER_OPTIONS } from "../constants/testing.constants";

interface TestingFiltersProps {
  // Tab
  activeTab: TestingTabType;
  onTabChange: (key: string) => void;
  // Search
  searchText: string;
  onSearchTextChange: (value: string) => void;
  onSearch: (value: string) => void;
  // Status filter
  statusFilter: TestingStatus | undefined;
  onStatusFilterChange: (value: TestingStatus | undefined) => void;
  // Technician filter
  technicianFilter: string[];
  onTechnicianFilterChange: (values: string[]) => void;
  technicians: Array<{ id: string; displayName?: string; userName?: string }>;
  loadingTechnicians: boolean;
}

const TestingFilters: React.FC<TestingFiltersProps> = ({
  activeTab,
  onTabChange,
  searchText,
  onSearchTextChange,
  onSearch,
  statusFilter,
  onStatusFilterChange,
  technicianFilter,
  onTechnicianFilterChange,
  technicians,
  loadingTechnicians,
}) => {
  const tabItems = [
    {
      key: String(TestingTabType.MyAssignments),
      label: (
        <span>
          <UserOutlined />
          Phân công của tôi
        </span>
      ),
    },
    {
      key: String(TestingTabType.All),
      label: (
        <span>
          <TeamOutlined />
          Hiển thị tất cả
        </span>
      ),
    },
  ];

  return (
    <>
      <Tabs
        activeKey={String(activeTab)}
        onChange={onTabChange}
        items={tabItems}
        style={{ marginBottom: 16 }}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Input.Search
            placeholder="Tìm theo số hợp đồng..."
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
            value={statusFilter}
            onChange={onStatusFilterChange}
            allowClear
          >
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <Select.Option key={opt.value} value={opt.value}>
                {opt.label}
              </Select.Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} sm={6} md={4}>
          <Select
            mode="multiple"
            style={{ width: "100%" }}
            placeholder="Kỹ thuật viên"
            value={technicianFilter}
            onChange={onTechnicianFilterChange}
            allowClear
            loading={loadingTechnicians}
            maxTagCount={1}
            optionFilterProp="children"
            showSearch
          >
            {technicians.map((tech) => (
              <Select.Option key={tech.id} value={tech.id}>
                {tech.displayName || tech.userName}
              </Select.Option>
            ))}
          </Select>
        </Col>
      </Row>
    </>
  );
};

export default TestingFilters;
