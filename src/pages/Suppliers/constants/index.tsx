import { Switch, Tooltip, Button, Space } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { SupplierDto } from "../../../services/supplierService";

// All possible columns with their config
export interface ColumnConfig {
  key: string;
  title: string;
  defaultVisible: boolean;
}

export const ALL_COLUMNS: ColumnConfig[] = [
  { key: "code", title: "ID nhà cung cấp", defaultVisible: true },
  { key: "name", title: "Tên nhà cung cấp", defaultVisible: true },
  { key: "taxCode", title: "Mã số thuế", defaultVisible: true },
  { key: "phone", title: "Số điện thoại", defaultVisible: true },
  { key: "email", title: "Email", defaultVisible: true },
  { key: "address", title: "Địa chỉ", defaultVisible: true },
  { key: "supplierGroup", title: "Nhóm NCC", defaultVisible: false },
  { key: "totalPurchase", title: "Tổng mua", defaultVisible: true },
  { key: "totalPurchaseAfterReturn", title: "Tổng mua trừ hàng trả", defaultVisible: false },
  { key: "outstandingDebt", title: "Nợ cần trả hiện tại", defaultVisible: false },
  { key: "isActive", title: "Trạng thái", defaultVisible: true },
];

const formatNumber = (value?: number) => {
  if (value == null) return "-";
  return value.toLocaleString("vi-VN");
};

export const getSupplierColumns = (
  visibleKeys: Set<string>,
  handleEdit: (record: SupplierDto) => void,
  handleDelete: (record: SupplierDto) => void,
  handleToggleActive: (record: SupplierDto) => void,
  canEdit: boolean,
  canDelete: boolean,
  currentPage: number,
  pageSize: number
): ColumnsType<SupplierDto> => {
  const columns: ColumnsType<SupplierDto> = [
    {
      title: "STT",
      key: "index",
      width: 60,
      align: "center" as const,
      render: (_: any, __: SupplierDto, index: number) =>
        (currentPage - 1) * pageSize + index + 1,
    },
  ];

  if (visibleKeys.has("code")) {
    columns.push({
      title: "ID nhà cung cấp",
      dataIndex: "code",
      key: "code",
      width: 160,
      ellipsis: true,
      sorter: true,
    });
  }

  if (visibleKeys.has("name")) {
    columns.push({
      title: "Tên nhà cung cấp",
      dataIndex: "name",
      key: "name",
      width: 250,
      ellipsis: true,
      sorter: true,
    });
  }

  if (visibleKeys.has("taxCode")) {
    columns.push({
      title: "Mã số thuế",
      dataIndex: "taxCode",
      key: "taxCode",
      width: 140,
      render: (v: string) => v || "-",
    });
  }

  if (visibleKeys.has("phone")) {
    columns.push({
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
      width: 140,
      render: (v: string) => v || "-",
    });
  }

  if (visibleKeys.has("email")) {
    columns.push({
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 200,
      ellipsis: true,
      render: (v: string) => v || "-",
    });
  }

  if (visibleKeys.has("address")) {
    columns.push({
      title: "Địa chỉ",
      dataIndex: "address",
      key: "address",
      width: 250,
      ellipsis: true,
      render: (v: string) => v || "-",
    });
  }

  if (visibleKeys.has("supplierGroup")) {
    columns.push({
      title: "Nhóm NCC",
      dataIndex: "supplierGroup",
      key: "supplierGroup",
      width: 140,
      render: (v: string) => v || "-",
    });
  }

  if (visibleKeys.has("totalPurchase")) {
    columns.push({
      title: "Tổng mua",
      dataIndex: "totalPurchase",
      key: "totalPurchase",
      width: 140,
      align: "right" as const,
      render: (v: number) => formatNumber(v),
    });
  }

  if (visibleKeys.has("totalPurchaseAfterReturn")) {
    columns.push({
      title: "Tổng mua trừ hàng trả",
      dataIndex: "totalPurchaseAfterReturn",
      key: "totalPurchaseAfterReturn",
      width: 180,
      align: "right" as const,
      render: (v: number) => formatNumber(v),
    });
  }

  if (visibleKeys.has("outstandingDebt")) {
    columns.push({
      title: "Nợ cần trả hiện tại",
      dataIndex: "outstandingDebt",
      key: "outstandingDebt",
      width: 160,
      align: "right" as const,
      render: (v: number) => formatNumber(v),
    });
  }

  if (visibleKeys.has("isActive")) {
    columns.push({
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      width: 130,
      align: "center" as const,
      render: (isActive: boolean, record: SupplierDto) => (
        <Switch
          checked={isActive}
          checkedChildren="Hoạt động"
          unCheckedChildren="Ngừng"
          onChange={() => handleToggleActive(record)}
          disabled={!canEdit}
        />
      ),
    });
  }

  if (canEdit || canDelete) {
    columns.push({
      title: "Thao tác",
      key: "actions",
      width: 100,
      align: "center" as const,
      fixed: "right" as const,
      render: (_: any, record: SupplierDto) => (
        <Space size={0}>
          {canEdit && (
            <Tooltip title="Sửa">
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
          )}
          {canDelete && (
            <Tooltip title="Xóa">
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined style={{ color: "#ff4d4f" }} />}
                onClick={() => handleDelete(record)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    });
  }

  return columns;
};

// LocalStorage key for column visibility
export const COLUMN_VISIBILITY_KEY = "supplier-visible-columns";
