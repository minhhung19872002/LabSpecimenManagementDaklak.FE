import React, { useState } from "react";
import { Button, Checkbox, Col, DatePicker, Input, Popconfirm, Row, Select, Space, Tag, Typography } from "antd";
import type { Dayjs } from "dayjs";
import {
  CloseOutlined,
  DeleteOutlined,
  DownloadOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  UploadOutlined,
} from "../../../../components/common/Icon";
import type { SpecimenColumn } from "./utils";

export interface ServiceCatalogToolbarProps {
  keyword: string;
  testMethodId?: string;
  methodOptions: { value: string; label: string }[];
  priceDate: Dayjs;
  showInactive: boolean;
  specimenColumns: SpecimenColumn[];
  hiddenSpecimenKeys: string[];
  selectedCount: number;
  loading: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canImport: boolean;
  onKeywordChange: (value: string) => void;
  onTestMethodChange: (value?: string) => void;
  onPriceDateChange: (value: Dayjs) => void;
  onShowInactiveChange: (value: boolean) => void;
  onToggleSpecimenColumn: (key: string) => void;
  onBulkCreate: () => void;
  onExport: () => void;
  onImport: () => void;
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
        description="Phiếu cũ vẫn giữ tên / giá đã lưu."
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
        <Button danger size="small" icon={<DeleteOutlined />} loading={loading}>
          Xóa
        </Button>
      </Popconfirm>
    );
  }
);

const ServiceCatalogToolbar: React.FC<ServiceCatalogToolbarProps> = ({
  keyword,
  testMethodId,
  methodOptions,
  priceDate,
  showInactive,
  specimenColumns,
  hiddenSpecimenKeys,
  selectedCount,
  loading,
  canCreate,
  canEdit,
  canDelete,
  canImport,
  onKeywordChange,
  onTestMethodChange,
  onPriceDateChange,
  onShowInactiveChange,
  onToggleSpecimenColumn,
  onBulkCreate,
  onExport,
  onImport,
  onBulkPrice,
  onClearSelection,
  onDeleteSelected,
  onReload,
}) => (
  <div style={{ marginBottom: 12 }}>
    <Row gutter={[12, 12]} align="middle">
      <Col xs={24} md={7}>
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Tìm mã DV, chỉ tiêu, nền mẫu, phương pháp..."
          value={keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
        />
      </Col>
      <Col xs={24} md={6}>
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Tất cả phương pháp"
          value={testMethodId}
          onChange={(v) => onTestMethodChange(v ?? undefined)}
          options={methodOptions}
          style={{ width: "100%" }}
        />
      </Col>
      <Col>
        <Space>
          <span>Giá tại ngày</span>
          <DatePicker
            value={priceDate}
            format="DD/MM/YYYY"
            allowClear={false}
            onChange={(v) => v && onPriceDateChange(v)}
          />
        </Space>
      </Col>
      <Col>
        <Checkbox checked={showInactive} onChange={(e) => onShowInactiveChange(e.target.checked)}>
          Hiện dịch vụ ngừng
        </Checkbox>
      </Col>
      <Col flex="auto" style={{ textAlign: "right" }}>
        <Space wrap>
          {canCreate && (
            <Button type="primary" icon={<PlusOutlined />} onClick={onBulkCreate}>
              Tạo dịch vụ hàng loạt
            </Button>
          )}
          <Button icon={<DownloadOutlined />} onClick={onExport}>
            Xuất Excel
          </Button>
          {canImport && (
            <Button icon={<UploadOutlined />} onClick={onImport}>
              Nhập danh sách
            </Button>
          )}
          <Button icon={<ReloadOutlined />} loading={loading} onClick={onReload} />
        </Space>
      </Col>
    </Row>

    {specimenColumns.length > 0 && (
      <div style={{ marginTop: 10 }}>
        <Typography.Text type="secondary" style={{ marginRight: 8 }}>
          Cột nền mẫu:
        </Typography.Text>
        {specimenColumns.map((c) => (
          <Tag.CheckableTag
            key={c.key}
            checked={!hiddenSpecimenKeys.includes(c.key)}
            onChange={() => onToggleSpecimenColumn(c.key)}
          >
            {c.name}
          </Tag.CheckableTag>
        ))}
      </div>
    )}

    {selectedCount > 0 && (
      <div
        style={{
          marginTop: 10,
          padding: "6px 12px",
          background: "#e6f4ff",
          border: "1px solid #91caff",
          borderRadius: 6,
        }}
      >
        <Space wrap>
          <b>Đã chọn {selectedCount} dịch vụ</b>
          {canEdit && (
            <Button type="primary" size="small" onClick={onBulkPrice}>
              Cập nhật giá hàng loạt
            </Button>
          )}
          {canDelete && <DeleteSelectedButton count={selectedCount} onDelete={onDeleteSelected} />}
          <Button size="small" icon={<CloseOutlined />} onClick={onClearSelection}>
            Bỏ chọn
          </Button>
        </Space>
      </div>
    )}
  </div>
);

export default ServiceCatalogToolbar;
