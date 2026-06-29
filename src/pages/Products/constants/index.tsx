import { Tag, Switch, Space, Tooltip, Button, Popover } from "antd";
import { EditOutlined, DeleteOutlined, PaperClipOutlined, EyeOutlined, ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { ProductDto, ProductType, ProductTypeLabels } from "../../../services/productService";
import { IndicatorName } from "../../../components/common";

// All possible columns with their config
export interface ColumnConfig {
  key: string;
  title: string;
  defaultVisible: boolean;
}

export const ALL_COLUMNS: ColumnConfig[] = [
  { key: "code", title: "ID", defaultVisible: true },
  { key: "identificationCode", title: "Mã nhận dạng", defaultVisible: true },
  { key: "name", title: "Tên vật phẩm", defaultVisible: true },
  { key: "productType", title: "Phân loại", defaultVisible: true },
  { key: "packagingUnitName", title: "Đơn vị lưu kho", defaultVisible: true },
  { key: "warehouseName", title: "Lưu kho", defaultVisible: true },
  { key: "storageAvailableQuantity", title: "Số lượng khả dụng", defaultVisible: true },
  { key: "casNumber", title: "Số CAS", defaultVisible: false },
  { key: "manufacturer", title: "Nhà sản xuất/thương hiệu", defaultVisible: false },
  { key: "origin", title: "Xuất xứ", defaultVisible: false },
  { key: "concentration", title: "Nồng độ/Hàm lượng", defaultVisible: false },
  { key: "storageConditions", title: "Điều kiện bảo quản", defaultVisible: false },
  { key: "categories", title: "Nhóm/phân loại", defaultVisible: false },
  { key: "minStockLevel", title: "Mức độ tồn tối thiểu", defaultVisible: false },
  { key: "maxStockLevel", title: "Mức độ tồn tối đa", defaultVisible: false },
  { key: "attachments", title: "Tài liệu đính kèm", defaultVisible: false },
  { key: "isActive", title: "Trạng thái", defaultVisible: true },
];

const PRODUCT_TYPE_COLORS: Record<ProductType, string> = {
  [ProductType.Chemical]: "blue",
  [ProductType.Biological]: "green",
  [ProductType.Supply]: "orange",
  [ProductType.Standard]: "purple",
  [ProductType.Solvent]: "cyan",
};

// Parse JSON array tags for display
const renderTags = (jsonStr?: string) => {
  if (!jsonStr) return "-";
  try {
    const tags: string[] = JSON.parse(jsonStr);
    return tags.map((tag) => <Tag key={tag}>{tag}</Tag>);
  } catch {
    return jsonStr;
  }
};

export const getProductColumns = (
  visibleKeys: Set<string>,
  handleEdit: (record: ProductDto) => void,
  handleDelete: (record: ProductDto) => void,
  handleToggleActive: (record: ProductDto) => void,
  canEdit: boolean,
  canDelete: boolean,
  currentPage: number,
  pageSize: number
): ColumnsType<ProductDto> => {
  const columns: ColumnsType<ProductDto> = [
    {
      title: "STT",
      key: "index",
      width: 60,
      align: "center" as const,
      render: (_: any, __: ProductDto, index: number) =>
        (currentPage - 1) * pageSize + index + 1,
    },
  ];

  if (visibleKeys.has("code")) {
    columns.push({
      title: "ID",
      dataIndex: "code",
      key: "code",
      width: 160,
      ellipsis: true,
      sorter: true,
    });
  }

  if (visibleKeys.has("identificationCode")) {
    columns.push({
      title: "Mã nhận dạng",
      dataIndex: "identificationCode",
      key: "identificationCode",
      width: 160,
      ellipsis: true,
      render: (v: string) => v || "-",
    });
  }

  if (visibleKeys.has("name")) {
    columns.push({
      title: "Tên vật phẩm",
      dataIndex: "name",
      key: "name",
      width: 250,
      ellipsis: true,
      sorter: true,
      render: (_: string, record: ProductDto) => (
        <Space size={4}>
          <IndicatorName name={record.name} formattedName={record.formattedName} />
          {record.isDraft && <Tag color="warning" style={{ fontSize: 11, lineHeight: "18px", padding: "0 4px" }}>Nháp</Tag>}
        </Space>
      ),
    });
  }

  if (visibleKeys.has("productType")) {
    columns.push({
      title: "Phân loại",
      dataIndex: "productType",
      key: "productType",
      width: 120,
      sorter: true,
      render: (type: ProductType) => (
        <Tag color={PRODUCT_TYPE_COLORS[type]}>{ProductTypeLabels[type]}</Tag>
      ),
    });
  }

  if (visibleKeys.has("packagingUnitName")) {
    columns.push({
      title: "Đơn vị lưu kho",
      dataIndex: "packagingUnitName",
      key: "packagingUnitName",
      width: 120,
    });
  }

  if (visibleKeys.has("warehouseName")) {
    columns.push({
      title: "Lưu kho",
      dataIndex: "warehouseName",
      key: "warehouseName",
      width: 150,
      sorter: true,
      render: (v: string) => v || "-",
    });
  }

  if (visibleKeys.has("storageAvailableQuantity")) {
    columns.push({
      title: "SL khả dụng",
      dataIndex: "storageAvailableQuantity",
      key: "storageAvailableQuantity",
      width: 150,
      align: "right" as const,
      sorter: true,
      render: (qty: number, record: ProductDto) => {
        const min = record.minStockLevel;
        const max = record.maxStockLevel;
        const isBelowMin = min != null && min > 0 && qty <= min;
        const isAboveMax = max != null && max > 0 && qty >= max;

        if (isBelowMin) {
          return (
            <Tooltip title={`Dưới mức tồn tối thiểu (${min})`}>
              <span style={{ color: "#ff4d4f", fontWeight: 600 }}>
                <ArrowDownOutlined style={{ marginRight: 4 }} />
                {qty}
              </span>
            </Tooltip>
          );
        }
        if (isAboveMax) {
          return (
            <Tooltip title={`Vượt mức tồn tối đa (${max})`}>
              <span style={{ color: "#faad14", fontWeight: 600 }}>
                <ArrowUpOutlined style={{ marginRight: 4 }} />
                {qty}
              </span>
            </Tooltip>
          );
        }
        return qty;
      },
    });
  }

  if (visibleKeys.has("casNumber")) {
    columns.push({
      title: "Số CAS",
      dataIndex: "casNumber",
      key: "casNumber",
      width: 120,
      render: (v: string) => v || "-",
    });
  }

  if (visibleKeys.has("manufacturer")) {
    columns.push({
      title: "Nhà SX/Thương hiệu",
      dataIndex: "manufacturer",
      key: "manufacturer",
      width: 180,
      ellipsis: true,
      render: (v: string) => v || "-",
    });
  }

  if (visibleKeys.has("origin")) {
    columns.push({
      title: "Xuất xứ",
      dataIndex: "origin",
      key: "origin",
      width: 130,
      render: (v: string) => v || "-",
    });
  }

  if (visibleKeys.has("concentration")) {
    columns.push({
      title: "Nồng độ/Hàm lượng",
      dataIndex: "concentration",
      key: "concentration",
      width: 150,
      render: (v: string) => v || "-",
    });
  }

  if (visibleKeys.has("storageConditions")) {
    columns.push({
      title: "Điều kiện bảo quản",
      dataIndex: "storageConditions",
      key: "storageConditions",
      width: 200,
      render: (_: string, record: ProductDto) => {
        if (record.formattedStorageConditions) {
          return <IndicatorName name={record.storageConditions || ""} formattedName={record.formattedStorageConditions} />;
        }
        return renderTags(record.storageConditions);
      },
    });
  }

  if (visibleKeys.has("categories")) {
    columns.push({
      title: "Nhóm/phân loại",
      dataIndex: "categories",
      key: "categories",
      width: 200,
      render: renderTags,
    });
  }

  if (visibleKeys.has("minStockLevel")) {
    columns.push({
      title: "Tồn tối thiểu",
      dataIndex: "minStockLevel",
      key: "minStockLevel",
      width: 120,
      align: "right" as const,
      render: (v: number) => v ?? "-",
    });
  }

  if (visibleKeys.has("maxStockLevel")) {
    columns.push({
      title: "Tồn tối đa",
      dataIndex: "maxStockLevel",
      key: "maxStockLevel",
      width: 120,
      align: "right" as const,
      render: (v: number) => v ?? "-",
    });
  }

  if (visibleKeys.has("attachments")) {
    const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || "";
    columns.push({
      title: "Tài liệu",
      dataIndex: "attachments",
      key: "attachments",
      width: 140,
      render: (attachments: any[]) => {
        if (!attachments?.length) return "-";
        const content = (
          <div style={{ maxWidth: 300 }}>
            {attachments.map((att: any) => (
              <div
                key={att.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "4px 0",
                  borderBottom: "1px solid #f5f5f5",
                }}
              >
                <span style={{ fontSize: 13, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {att.fileName}
                </span>
                <Button
                  type="link"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => window.open(`${baseUrl}${att.url}`, "_blank")}
                  style={{ flexShrink: 0, marginLeft: 8 }}
                >
                  Xem
                </Button>
              </div>
            ))}
          </div>
        );
        return (
          <Popover content={content} title="Tài liệu đính kèm" trigger="click">
            <Button type="link" size="small" icon={<PaperClipOutlined />}>
              {attachments.length} file
            </Button>
          </Popover>
        );
      },
    });
  }

  if (visibleKeys.has("isActive")) {
    columns.push({
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      width: 130,
      align: "center" as const,
      render: (isActive: boolean, record: ProductDto) => (
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
      render: (_: any, record: ProductDto) => (
        <Space size="small">
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
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
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

export const PRODUCT_TYPE_OPTIONS = [
  { value: ProductType.Chemical, label: "Hóa chất" },
  { value: ProductType.Biological, label: "Sinh phẩm" },
  { value: ProductType.Supply, label: "Vật tư tiêu hao" },
  { value: ProductType.Standard, label: "Chất chuẩn" },
  { value: ProductType.Solvent, label: "Dung môi" },
];

// LocalStorage key for column visibility
export const COLUMN_VISIBILITY_KEY = "product-visible-columns";
