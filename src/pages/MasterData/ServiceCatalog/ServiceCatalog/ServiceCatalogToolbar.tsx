import React, { useState } from "react";
import { Button, Checkbox, DatePicker, Input, Popconfirm, Select, Space, Typography } from "antd";
import type { Dayjs } from "dayjs";
import { DeleteOutlined, ReloadOutlined, SearchOutlined } from "../../../../components/common/Icon";
import SpecimenCategoryChips from "./SpecimenCategoryChips";

export interface ServiceCatalogToolbarProps {
  /** grid = Ma trận giá, list = Danh sách & lịch sử version */
  mode: "grid" | "list";
  keyword: string;
  testMethodId?: string;
  methodOptions: { value: string; label: string }[];
  priceDate: Dayjs;
  showInactive: boolean;
  /** Nhóm nền mẫu cho chip "Cột nền mẫu" */
  specimenCategories: string[];
  specimenCategory: string;
  /** VD: "12 nhóm · 85 dòng chỉ tiêu" / "320 dịch vụ" */
  countText: string;
  allExpanded: boolean;
  selectedRowCount: number;
  selectedServiceCount: number;
  loading: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onKeywordChange: (value: string) => void;
  onTestMethodChange: (value?: string) => void;
  onPriceDateChange: (value: Dayjs) => void;
  onShowInactiveChange: (value: boolean) => void;
  onSpecimenCategoryChange: (value: string) => void;
  onToggleExpandAll: () => void;
  onBulkPrice: () => void;
  onClearSelection: () => void;
  onDeleteSelected: () => Promise<void>;
  onReload: () => void;
}

/** Nút xóa hàng loạt tự quản loading */
const DeleteSelectedButton = React.memo<{ count: number; onDelete: () => Promise<void> }>(
  function DeleteSelectedButton({ count, onDelete }) {
    const [loading, setLoading] = useState(false);
    return (
      <Popconfirm
        title={`Xóa ${count} dịch vụ đã chọn?`}
        description="Phiếu / báo giá cũ vẫn giữ tên và giá đã lưu."
        okText="Xóa"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
        onConfirm={async () => {
          setLoading(true);
          try {
            await onDelete();
          } finally {
            setLoading(false);
          }
        }}
      >
        <Button danger icon={<DeleteOutlined />} loading={loading}>
          Xóa
        </Button>
      </Popconfirm>
    );
  }
);

// Hàng hướng dẫn ngay trên bảng: hướng dẫn bên trái, số dòng + mở/thu gọn bên phải
const hintRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
};
const hintTextStyle: React.CSSProperties = { fontSize: 12.5 };

/** Thanh lọc của Ma trận giá / Danh sách dịch vụ */
const ServiceCatalogToolbar: React.FC<ServiceCatalogToolbarProps> = ({
  mode,
  keyword,
  testMethodId,
  methodOptions,
  priceDate,
  showInactive,
  specimenCategories,
  specimenCategory,
  countText,
  allExpanded,
  selectedRowCount,
  selectedServiceCount,
  loading,
  canEdit,
  canDelete,
  onKeywordChange,
  onTestMethodChange,
  onPriceDateChange,
  onShowInactiveChange,
  onSpecimenCategoryChange,
  onToggleExpandAll,
  onBulkPrice,
  onClearSelection,
  onDeleteSelected,
  onReload,
}) => {
  const isGrid = mode === "grid";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 10 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
        <Space wrap size={10}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder={isGrid ? "Tìm theo tên chỉ tiêu..." : "Tìm theo mã DV, chỉ tiêu, nền mẫu..."}
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            style={{ width: 260 }}
          />
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Tất cả phương pháp"
            value={testMethodId}
            onChange={onTestMethodChange}
            options={methodOptions}
            style={{ width: 260 }}
          />
          <Space size={6}>
            <Typography.Text type="secondary">Giá tại ngày</Typography.Text>
            <DatePicker
              value={priceDate}
              format="DD/MM/YYYY"
              allowClear={false}
              onChange={(v) => v && onPriceDateChange(v)}
            />
          </Space>
          <Checkbox checked={showInactive} onChange={(e) => onShowInactiveChange(e.target.checked)}>
            Hiện dịch vụ ngừng
          </Checkbox>
        </Space>
        <Space size={10}>
          {isGrid && (
            <>
              <Typography.Text type="secondary">
                {selectedRowCount > 0
                  ? `Đã chọn ${selectedRowCount} dòng · ${selectedServiceCount} dịch vụ`
                  : "Chưa chọn dòng nào"}
              </Typography.Text>
              {selectedRowCount > 0 && (
                <Button type="text" size="small" onClick={onClearSelection}>
                  Bỏ chọn
                </Button>
              )}
              {canDelete && selectedServiceCount > 0 && (
                <DeleteSelectedButton count={selectedServiceCount} onDelete={onDeleteSelected} />
              )}
              {canEdit && (
                <Button type="primary" disabled={selectedServiceCount === 0} onClick={onBulkPrice}>
                  Cập nhật giá hàng loạt
                </Button>
              )}
            </>
          )}
          <Button icon={<ReloadOutlined />} loading={loading} onClick={onReload} />
        </Space>
      </div>

      {isGrid && (
        <>
          {specimenCategories.length > 0 && (
            <SpecimenCategoryChips
              categories={specimenCategories}
              value={specimenCategory}
              onChange={onSpecimenCategoryChange}
            />
          )}
          <div style={hintRowStyle}>
            <Typography.Text type="secondary" style={hintTextStyle}>
              Nhấp đúp vào ô để sửa giá · Enter lưu · Esc hủy · Ô trống: nhấp đúp để tạo dịch vụ cho tổ hợp đó · Chuột
              phải vào ô: lịch sử giá / ngừng / xóa
            </Typography.Text>
            <Space size={10} style={{ flexShrink: 0 }}>
              <Typography.Text type="secondary">{countText}</Typography.Text>
              <Button size="small" onClick={onToggleExpandAll}>
                {allExpanded ? "Thu gọn tất cả" : "Mở tất cả"}
              </Button>
            </Space>
          </div>
        </>
      )}
      {!isGrid && (
        <div style={{ textAlign: "right" }}>
          <Typography.Text type="secondary">{countText}</Typography.Text>
        </div>
      )}
    </div>
  );
};

export default ServiceCatalogToolbar;
