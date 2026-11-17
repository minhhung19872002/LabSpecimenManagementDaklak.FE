import React from "react";
import { Button, Checkbox, Col, Input, Row } from "antd";
import { ReloadOutlined, SearchOutlined } from "../../../../components/common/Icon";

export interface BatchNormsToolbarProps {
  keyword: string;
  onlyMissing: boolean;
  loading: boolean;
  onKeywordChange: (value: string) => void;
  onOnlyMissingChange: (value: boolean) => void;
  onReload: () => void;
}

const BatchNormsToolbar: React.FC<BatchNormsToolbarProps> = ({
  keyword,
  onlyMissing,
  loading,
  onKeywordChange,
  onOnlyMissingChange,
  onReload,
}) => (
  <Row gutter={[12, 12]} align="middle" style={{ marginBottom: 12 }}>
    <Col xs={24} sm={12} md={8}>
      <Input
        allowClear
        prefix={<SearchOutlined />}
        placeholder="Tìm theo mã / tên phương pháp..."
        value={keyword}
        onChange={(e) => onKeywordChange(e.target.value)}
      />
    </Col>
    <Col flex="auto">
      <Checkbox checked={onlyMissing} onChange={(e) => onOnlyMissingChange(e.target.checked)}>
        Chỉ hiện phương pháp chưa có định mức
      </Checkbox>
    </Col>
    <Col>
      <Button icon={<ReloadOutlined />} loading={loading} onClick={onReload}>
        Tải lại
      </Button>
    </Col>
  </Row>
);

export default BatchNormsToolbar;
