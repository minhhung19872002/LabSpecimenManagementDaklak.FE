import React from "react";
import { Button, Input, Space } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";

export interface PreparedSolutionListToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  canCreate: boolean;
  onCreate: () => void;
}

const PreparedSolutionListToolbar: React.FC<PreparedSolutionListToolbarProps> = ({
  search,
  onSearchChange,
  onSearch,
  canCreate,
  onCreate,
}) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
    <Space>
      <Input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        onPressEnter={onSearch}
        placeholder="Tìm theo tên dung dịch, mã lô..."
        prefix={<SearchOutlined />}
        allowClear
        style={{ width: 300 }}
      />
      <Button onClick={onSearch}>Tìm kiếm</Button>
    </Space>
    {canCreate && (
      <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
        Tạo phiếu pha
      </Button>
    )}
  </div>
);

export default PreparedSolutionListToolbar;
