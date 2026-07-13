import React from "react";
import { Col, Input, Row, Select } from "antd";
import { SupplementaryTaskPriority } from "../../../services/supplementaryTaskService";
import { PRIORITY_OPTIONS, TAB_STATUS_OPTIONS } from "./utils";

export interface SupplementaryTaskToolbarProps {
  searchInput: string;
  activeTab: string;
  priority?: SupplementaryTaskPriority;
  assignedToId?: string;
  isDirector: boolean;
  employeeOptions: { label: string; value: string }[];
  onSearchInputChange: (val: string) => void;
  onSearch: (val: string) => void;
  onTabChange: (tab: string) => void;
  onPriorityChange: (val?: SupplementaryTaskPriority) => void;
  onAssignedToChange: (val?: string) => void;
}

const STATUS_OPTIONS = TAB_STATUS_OPTIONS.map((t) => ({
  label: t.label,
  value: t.key,
}));

const SupplementaryTaskToolbar: React.FC<SupplementaryTaskToolbarProps> = ({
  searchInput, activeTab, priority, assignedToId,
  isDirector, employeeOptions,
  onSearchInputChange, onSearch, onTabChange, onPriorityChange, onAssignedToChange,
}) => (
  <Row gutter={[16, 16]} style={{ padding: "16px 16px 0" }}>
    <Col xs={24} sm={12} md={8}>
      <Input.Search
        placeholder="Tìm kiếm công việc..."
        value={searchInput}
        onChange={(e) => onSearchInputChange(e.target.value)}
        onSearch={onSearch}
        onPressEnter={(e) => onSearch((e.target as HTMLInputElement).value)}
        allowClear
        onClear={() => { onSearchInputChange(""); onSearch(""); }}
        enterButton
      />
    </Col>

    <Col xs={24} sm={12} md={4}>
      <Select
        style={{ width: "100%" }}
        value={activeTab}
        onChange={(val) => onTabChange(val ?? "all")}
        options={STATUS_OPTIONS}
      />
    </Col>

    <Col xs={24} sm={12} md={4}>
      <Select
        placeholder="Ưu tiên"
        value={priority ?? null}
        onChange={(val) => onPriorityChange(val ?? undefined)}
        allowClear
        options={PRIORITY_OPTIONS}
        style={{ width: "100%" }}
      />
    </Col>

    {isDirector && (
      <Col xs={24} sm={12} md={5}>
        <Select
          placeholder="Tất cả nhân viên"
          value={assignedToId ?? null}
          onChange={(val) => onAssignedToChange(val ?? undefined)}
          allowClear
          showSearch
          optionFilterProp="label"
          options={employeeOptions}
          style={{ width: "100%" }}
        />
      </Col>
    )}
  </Row>
);

export default SupplementaryTaskToolbar;
