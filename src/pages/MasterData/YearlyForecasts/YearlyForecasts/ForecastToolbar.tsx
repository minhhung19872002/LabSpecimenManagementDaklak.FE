import React from "react";
import { Button, Checkbox, Col, Input, Row, Segmented, Space } from "antd";
import {
  CopyOutlined,
  LockOutlined,
  ReloadOutlined,
  SaveOutlined,
  SearchOutlined,
} from "../../../../components/common/Icon";

export interface ForecastToolbarProps {
  years: number[];
  year: number;
  isLocked: boolean;
  canClone: boolean;
  canEdit: boolean;
  keyword: string;
  onlyMissing: boolean;
  dirtyCount: number;
  loading: boolean;
  saving: boolean;
  cloning: boolean;
  allExpanded: boolean;
  onYearChange: (year: number) => void;
  onKeywordChange: (value: string) => void;
  onOnlyMissingChange: (value: boolean) => void;
  onToggleExpandAll: () => void;
  onClone: () => void;
  onSave: () => void;
  onReload: () => void;
}

const ForecastToolbar: React.FC<ForecastToolbarProps> = ({
  years,
  year,
  isLocked,
  canClone,
  canEdit,
  keyword,
  onlyMissing,
  dirtyCount,
  loading,
  saving,
  cloning,
  allExpanded,
  onYearChange,
  onKeywordChange,
  onOnlyMissingChange,
  onToggleExpandAll,
  onClone,
  onSave,
  onReload,
}) => (
  <>
    <Row gutter={[12, 12]} align="middle" justify="space-between" style={{ marginBottom: 12 }}>
      <Col>
        <Segmented
          value={year}
          onChange={(v) => onYearChange(v as number)}
          options={years.map((y, idx) => ({
            value: y,
            label: idx === 0 ? (
              <span>
                <LockOutlined /> Năm {y}
              </span>
            ) : (
              `Năm ${y}`
            ),
          }))}
        />
      </Col>
      <Col>
        <Space wrap>
          {canEdit && !isLocked && canClone && (
            <Button icon={<CopyOutlined />} loading={cloning} onClick={onClone}>
              Clone từ năm {year - 1}
            </Button>
          )}
          {canEdit && !isLocked && (
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={saving}
              disabled={dirtyCount === 0}
              onClick={onSave}
            >
              Lưu dự toán{dirtyCount > 0 ? ` (${dirtyCount})` : ""}
            </Button>
          )}
        </Space>
      </Col>
    </Row>
    <Row gutter={[12, 12]} align="middle" style={{ marginBottom: 12 }}>
      <Col xs={24} sm={12} md={8}>
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Tìm mã DV, chỉ tiêu, nền mẫu, phương pháp..."
          value={keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
        />
      </Col>
      <Col flex="auto">
        <Checkbox checked={onlyMissing} onChange={(e) => onOnlyMissingChange(e.target.checked)}>
          Chỉ hiện dòng thiếu dự toán
        </Checkbox>
      </Col>
      <Col>
        <Space>
          <Button onClick={onToggleExpandAll}>{allExpanded ? "Thu gọn" : "Mở tất cả"}</Button>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={onReload}>
            Tải lại
          </Button>
        </Space>
      </Col>
    </Row>
  </>
);

export default ForecastToolbar;
