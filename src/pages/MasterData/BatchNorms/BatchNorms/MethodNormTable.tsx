import React from "react";
import { Button, Popconfirm, Space, Table, Tag, Tooltip, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  StopOutlined,
  WarningOutlined,
} from "../../../../components/common/Icon";
import { IndicatorName } from "../../../../components/common";
import type { MethodBatchNormDto } from "../../../../services/serviceCatalogService";
import type { ProductDto } from "../../../../services/productService";
import { formatNormQuantity, toStockUnitText } from "./utils";

export interface MethodNormTableProps {
  norms: MethodBatchNormDto[];
  loading: boolean;
  productMap: Map<string, ProductDto>;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onAdd: () => void;
  onEdit: (norm: MethodBatchNormDto) => void;
  onToggleActive: (norm: MethodBatchNormDto) => void;
  onDelete: (norm: MethodBatchNormDto) => void;
}

/** Bảng vật tư định mức của 1 phương pháp (dòng mở rộng màn L3 + popup thiết lập) */
const MethodNormTable: React.FC<MethodNormTableProps> = ({
  norms,
  loading,
  productMap,
  canCreate,
  canEdit,
  canDelete,
  onAdd,
  onEdit,
  onToggleActive,
  onDelete,
}) => {
  const columns: ColumnsType<MethodBatchNormDto> = [
    { title: "Mã ĐM", dataIndex: "code", key: "code", width: 90 },
    {
      title: "Vật tư",
      key: "product",
      render: (_, r) =>
        r.productId ? (
          <IndicatorName name={r.productName ?? ""} formattedName={r.productFormattedName ?? undefined} />
        ) : (
          <Typography.Text type="warning">
            <WarningOutlined /> Chưa chọn vật tư
          </Typography.Text>
        ),
    },
    { title: "Mã vật tư", dataIndex: "productCode", key: "productCode", width: 120, render: (v) => v || "—" },
    {
      title: "Tiêu hao / 1 mẻ",
      key: "batchQuantity",
      width: 130,
      align: "right",
      render: (_, r) =>
        r.batchQuantity != null ? (
          formatNormQuantity(r.batchQuantity)
        ) : (
          <Typography.Text type="warning">Chưa nhập</Typography.Text>
        ),
    },
    { title: "ĐVT", dataIndex: "unitName", key: "unitName", width: 80, render: (v) => v || "—" },
    {
      title: "Quy ra ĐV kho",
      key: "stock",
      width: 130,
      align: "right",
      render: (_, r) => toStockUnitText(r.productId ? productMap.get(r.productId) : undefined, r.batchQuantity),
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 130,
      render: (_, r) =>
        !r.isActive ? (
          <Tag>Ngừng</Tag>
        ) : r.isComplete ? (
          <Tag color="green">Hoạt động</Tag>
        ) : (
          <Tag color="orange">Thiếu thông tin</Tag>
        ),
    },
  ];

  if (canEdit || canDelete) {
    columns.push({
      title: "Thao tác",
      key: "actions",
      width: 120,
      render: (_, r) => (
        <Space size={0}>
          {canEdit && (
            <Tooltip title="Sửa">
              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => onEdit(r)} />
            </Tooltip>
          )}
          {canEdit && (
            <Tooltip title={r.isActive ? "Ngừng hoạt động" : "Kích hoạt"}>
              <Button
                type="link"
                size="small"
                icon={r.isActive ? <StopOutlined /> : <CheckCircleOutlined />}
                onClick={() => onToggleActive(r)}
              />
            </Tooltip>
          )}
          {canDelete &&
            (r.isUsed ? (
              <Tooltip title="Đã phát sinh tiêu hao — chỉ được ngừng hoạt động">
                <Button type="link" size="small" danger disabled icon={<DeleteOutlined />} />
              </Tooltip>
            ) : (
              <Popconfirm
                title="Xác nhận xóa định mức này?"
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
                onConfirm={() => onDelete(r)}
              >
                <Button type="link" size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            ))}
        </Space>
      ),
    });
  }

  return (
    <div>
      <Table
        columns={columns}
        dataSource={norms}
        rowKey="id"
        size="small"
        loading={loading}
        pagination={false}
        locale={{ emptyText: "Phương pháp chưa có định mức tiêu hao" }}
        rowClassName={(r) => (r.isActive ? "" : "batch-norm-row-inactive")}
      />
      {canCreate && (
        <Button type="dashed" size="small" icon={<PlusOutlined />} style={{ marginTop: 8 }} onClick={onAdd}>
          Thêm vật tư
        </Button>
      )}
    </div>
  );
};

export default MethodNormTable;
