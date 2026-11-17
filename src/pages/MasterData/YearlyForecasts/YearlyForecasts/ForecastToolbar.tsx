import React from "react";
import { Button, Checkbox, Input, Segmented, Space, Tag, Typography } from "antd";
import { LockOutlined, ReloadOutlined, SaveOutlined, SearchOutlined } from "../../../../components/common/Icon";
import { getYearLabel } from "./utils";

export interface ForecastToolbarProps {
  years: number[];
  currentYear: number;
  year: number;
  isLocked: boolean;
  canEdit: boolean;
  keyword: string;
  onlyMissing: boolean;
  dirtyCount: number;
  loading: boolean;
  saving: boolean;
  allExpanded: boolean;
  missingCount: number;
  totalCount: number;
  /** "3 phương pháp · 10 dịch vụ" (theo bộ lọc hiện tại) */
  countText: string;
  onYearChange: (year: number) => void;
  onKeywordChange: (value: string) => void;
  onOnlyMissingChange: (value: boolean) => void;
  onToggleExpandAll: () => void;
  onSave: () => void;
  onReload: () => void;
}

const ForecastToolbar: React.FC<ForecastToolbarProps> = ({
  years,
  currentYear,
  year,
  isLocked,
  canEdit,
  keyword,
  onlyMissing,
  dirtyCount,
  loading,
  saving,
  allExpanded,
  missingCount,
  totalCount,
  countText,
  onYearChange,
  onKeywordChange,
  onOnlyMissingChange,
  onToggleExpandAll,
  onSave,
  onReload,
}) => (
  <>
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        marginBottom: 10,
      }}
    >
      <Segmented
        value={year}
        onChange={(v) => onYearChange(v as number)}
        options={years.map((y) => ({
          value: y,
          label: (
            <span>
              {y < currentYear && <LockOutlined style={{ marginRight: 4 }} />}
              {getYearLabel(y, currentYear)}
            </span>
          ),
        }))}
      />
      {totalCount > 0 &&
        (missingCount > 0 ? (
          <Tag color="red" style={{ margin: 0, fontSize: 13, padding: "2px 10px" }}>
            {missingCount}/{totalCount} dịch vụ thiếu dự toán
          </Tag>
        ) : (
          <Tag color="green" style={{ margin: 0, fontSize: 13, padding: "2px 10px" }}>
            Đủ dự toán {totalCount}/{totalCount} dịch vụ
          </Tag>
        ))}
    </div>

    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginBottom: 10 }}>
      <Input
        allowClear
        prefix={<SearchOutlined />}
        placeholder="Tìm mã DV, chỉ tiêu, nền mẫu, phương pháp..."
        value={keyword}
        onChange={(e) => onKeywordChange(e.target.value)}
        style={{ width: 340, maxWidth: "100%" }}
      />
      <Checkbox checked={onlyMissing} onChange={(e) => onOnlyMissingChange(e.target.checked)}>
        Chỉ hiện dòng thiếu dự toán
      </Checkbox>
      <Button onClick={onToggleExpandAll}>{allExpanded ? "Thu gọn" : "Mở tất cả"}</Button>
      <Typography.Text type="secondary" style={{ fontSize: 13 }}>
        {countText}
      </Typography.Text>
      <Space wrap style={{ marginLeft: "auto" }}>
        <Button icon={<ReloadOutlined />} loading={loading} onClick={onReload}>
          Tải lại
        </Button>
        {canEdit && !isLocked && (
          <Button type="primary" icon={<SaveOutlined />} loading={saving} disabled={dirtyCount === 0} onClick={onSave}>
            Lưu dự toán{dirtyCount > 0 ? ` (${dirtyCount})` : ""}
          </Button>
        )}
      </Space>
    </div>
  </>
);

export default ForecastToolbar;
