import { Tag, Space, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { ProductDto, ProductType, ProductTypeLabels } from "../../../services/productService";
import { IndicatorName } from "../../../components/common";
import dayjs from "dayjs";

export interface ColumnConfig {
  key: string;
  title: string;
  defaultVisible: boolean;
}

export const ALL_COLUMNS: ColumnConfig[] = [
  { key: "identificationCode", title: "Mã nhận dạng", defaultVisible: true },
  { key: "name", title: "Tên vật tư", defaultVisible: true },
  { key: "productType", title: "Phân loại", defaultVisible: true },
  { key: "earliestReceivedDate", title: "Ngày nhận", defaultVisible: true },
  { key: "availableQuantity", title: "Tồn kho", defaultVisible: true },
  { key: "storageAvailableQuantity", title: "Số lượng (đơn vị)", defaultVisible: true },
  { key: "usage", title: "Sử dụng", defaultVisible: true },
  { key: "earliestLotExpiryDate", title: "Hạn sử dụng", defaultVisible: true },
  { key: "storageConditions", title: "Điều kiện bảo quản", defaultVisible: true },
  { key: "earliestLotNumber", title: "Code/Lot", defaultVisible: true },
  { key: "manufacturer", title: "Nhà sản xuất", defaultVisible: true },
  { key: "warehouseName", title: "Lưu kho", defaultVisible: true },
  { key: "earliestLotNotes", title: "Ghi chú", defaultVisible: true },
  { key: "casNumber", title: "Số CAS", defaultVisible: false },
  { key: "concentration", title: "Nồng độ / Hàm lượng", defaultVisible: false },
  { key: "packagingUnitName", title: "Đơn vị lưu kho", defaultVisible: false },
  { key: "categories", title: "Nhóm / Phân loại", defaultVisible: false },
  { key: "origin", title: "Xuất xứ", defaultVisible: false },
];

const PRODUCT_TYPE_COLORS: Record<ProductType, string> = {
  [ProductType.Chemical]: "blue",
  [ProductType.Biological]: "green",
  [ProductType.Supply]: "orange",
  [ProductType.Standard]: "purple",
  [ProductType.Solvent]: "cyan",
  [ProductType.Equipment]: "magenta",
  [ProductType.PreparedSolution]: "geekblue",
};

const renderTags = (jsonStr?: string) => {
  if (!jsonStr) return "-";
  try {
    const tags: string[] = JSON.parse(jsonStr);
    return tags.map((tag) => <Tag key={tag}>{tag}</Tag>);
  } catch {
    return jsonStr;
  }
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "-";
  return dayjs(dateStr).format("DD/MM/YYYY");
};

export const getProductColumns = (
  visibleKeys: Set<string>,
): ColumnsType<ProductDto> => {
  const columns: ColumnsType<ProductDto> = [];

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
      title: "Tên vật tư",
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

  if (visibleKeys.has("earliestReceivedDate")) {
    columns.push({
      title: "Ngày nhận",
      dataIndex: "earliestReceivedDate",
      key: "earliestReceivedDate",
      width: 120,
      render: formatDate,
    });
  }

  if (visibleKeys.has("availableQuantity")) {
    columns.push({
      title: "Tồn kho",
      dataIndex: "availableQuantity",
      key: "availableQuantity",
      width: 160,
      align: "right" as const,
      sorter: true,
      render: (qty: number, record: ProductDto) => {
        // Logic cũ:
        // const unitName = record.packagingUnitName || "";
        // return `${qty} ${unitName}`.trim();

        const storageUnit = record.packagingUnitName || "";
        const intPart = Math.floor(qty);
        const decPart = qty - intPart;

        if (decPart === 0 || !record.volumePerUnit || !record.volumeUnitName) {
          return `${qty} ${storageUnit}`.trim();
        }

        const consumableAmount = Math.round(decPart * record.volumePerUnit);
        return `${intPart} ${storageUnit} - ${consumableAmount} ${record.volumeUnitName}`;
      },
    });
  }

  if (visibleKeys.has("storageAvailableQuantity")) {
    columns.push({
      title: "Số lượng (đơn vị)",
      dataIndex: "storageAvailableQuantity",
      key: "storageAvailableQuantity",
      width: 180,
      align: "right" as const,
      sorter: true,
      render: (_qty: number, record: ProductDto) => {
        if (record.consumableImportedQuantity > 0 && record.volumeUnitName) {
          return `${record.consumableImportedQuantity.toLocaleString("vi-VN")} ${record.volumeUnitName}`;
        }
        const unitName = record.baseUnitName || "";
        return `${record.storageAvailableQuantity} ${unitName}`.trim();
      },
    });
  }

  if (visibleKeys.has("usage")) {
    columns.push({
      title: "Sử dụng",
      key: "usage",
      width: 130,
      align: "right" as const,
      render: (_: any, record: ProductDto) => {
        const qty = record.storageTotalConsumedQuantity || 0;
        const unitName = record.baseUnitName || "";
        return qty > 0 ? `${qty} ${unitName}`.trim() : "-";
      },
    });
  }

  if (visibleKeys.has("earliestLotExpiryDate")) {
    columns.push({
      title: "Hạn sử dụng",
      dataIndex: "earliestLotExpiryDate",
      key: "earliestLotExpiryDate",
      width: 120,
      render: (dateStr: string) => {
        if (!dateStr) return "-";
        const date = dayjs(dateStr);
        const isExpired = date.isBefore(dayjs());
        const isNearExpiry = date.isBefore(dayjs().add(30, "day"));
        const color = isExpired ? "#ff4d4f" : isNearExpiry ? "#faad14" : undefined;
        return (
          <Tooltip title={isExpired ? "Đã hết hạn" : isNearExpiry ? "Sắp hết hạn" : undefined}>
            <span style={color ? { color, fontWeight: 600 } : undefined}>
              {date.format("DD/MM/YYYY")}
            </span>
          </Tooltip>
        );
      },
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

  if (visibleKeys.has("earliestLotNumber")) {
    columns.push({
      title: "Code/Lot",
      dataIndex: "earliestLotNumber",
      key: "earliestLotNumber",
      width: 140,
      ellipsis: true,
      render: (v: string) => v || "-",
    });
  }

  if (visibleKeys.has("manufacturer")) {
    columns.push({
      title: "Nhà sản xuất",
      dataIndex: "manufacturer",
      key: "manufacturer",
      width: 180,
      ellipsis: true,
      render: (v: string) => v || "-",
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

  if (visibleKeys.has("earliestLotNotes")) {
    columns.push({
      title: "Ghi chú",
      dataIndex: "earliestLotNotes",
      key: "earliestLotNotes",
      width: 200,
      ellipsis: true,
      render: (v: string) => v || "-",
    });
  }

  // Hidden columns
  if (visibleKeys.has("casNumber")) {
    columns.push({
      title: "Số CAS",
      dataIndex: "casNumber",
      key: "casNumber",
      width: 120,
      render: (v: string) => v || "-",
    });
  }

  if (visibleKeys.has("concentration")) {
    columns.push({
      title: "Nồng độ / Hàm lượng",
      dataIndex: "concentration",
      key: "concentration",
      width: 150,
      render: (v: string) => v || "-",
    });
  }

  if (visibleKeys.has("packagingUnitName")) {
    columns.push({
      title: "Đơn vị lưu kho",
      dataIndex: "packagingUnitName",
      key: "packagingUnitName",
      width: 120,
      render: (v: string) => v || "-",
    });
  }

  if (visibleKeys.has("categories")) {
    columns.push({
      title: "Nhóm / Phân loại",
      dataIndex: "categories",
      key: "categories",
      width: 200,
      render: renderTags,
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

  return columns;
};

export const PRODUCT_TYPE_OPTIONS = [
  { value: ProductType.Chemical, label: "Hóa chất" },
  { value: ProductType.Biological, label: "Sinh phẩm" },
  { value: ProductType.Supply, label: "Vật tư tiêu hao" },
  { value: ProductType.Standard, label: "Chất chuẩn" },
  { value: ProductType.Solvent, label: "Dung môi" },
  { value: ProductType.Equipment, label: "Thiết bị phòng Lab" },
  { value: ProductType.PreparedSolution, label: "Dung dịch pha" },
];

export const COLUMN_VISIBILITY_KEY = "product-visible-columns-v2";
