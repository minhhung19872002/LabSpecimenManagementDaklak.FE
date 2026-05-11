import { Tag, Tooltip, Button, Popover } from "antd";
import { EditOutlined, EyeOutlined, PaperClipOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import {
  EquipmentListDto,
  EquipmentStatus,
  EquipmentStatusLabels,
  EquipmentStatusColors,
} from "../../../services/equipmentService";

export interface ColumnConfig {
  key: string;
  title: string;
  defaultVisible: boolean;
}

export const ALL_COLUMNS: ColumnConfig[] = [
  { key: "serialNumber", title: "Serial number", defaultVisible: true },
  { key: "name", title: "Tên thiết bị", defaultVisible: true },
  { key: "warrantyExpiryDate", title: "Hạn bảo hành", defaultVisible: true },
  { key: "model", title: "Model", defaultVisible: true },
  { key: "usageCount", title: "Số lượt sử dụng", defaultVisible: true },
  { key: "manufacturer", title: "Hãng sản xuất", defaultVisible: true },
  { key: "maintenanceCount", title: "Số lượt bảo dưỡng", defaultVisible: true },
  { key: "supplierName", title: "Nhà cung cấp", defaultVisible: true },
  { key: "origin", title: "Xuất xứ", defaultVisible: true },
  { key: "attachments", title: "Tài liệu đính kèm", defaultVisible: true },
  { key: "status", title: "Trạng thái", defaultVisible: true },
];

export const getEquipmentColumns = (
  visibleKeys: Set<string>,
  handleView: (id: string) => void,
): ColumnsType<EquipmentListDto> => {
  const columns: ColumnsType<EquipmentListDto> = [];

  if (visibleKeys.has("serialNumber")) {
    columns.push({
      title: "Serial Number",
      dataIndex: "serialNumber",
      key: "serialNumber",
      width: 180,
      fixed: "left" as const,
    });
  }

  if (visibleKeys.has("name")) {
    columns.push({
      title: "Tên thiết bị",
      dataIndex: "name",
      key: "name",
      width: 200,
      ellipsis: true,
    });
  }

  if (visibleKeys.has("warrantyExpiryDate")) {
    columns.push({
      title: "Hạn bảo hành",
      dataIndex: "warrantyExpiryDate",
      key: "warrantyExpiryDate",
      width: 130,
      render: (val: string) => val ? dayjs(val).format("DD/MM/YYYY") : "-",
    });
  }

  if (visibleKeys.has("model")) {
    columns.push({
      title: "Model",
      dataIndex: "model",
      key: "model",
      width: 150,
      ellipsis: true,
      render: (v: string) => v || "-",
    });
  }

  if (visibleKeys.has("usageCount")) {
    columns.push({
      title: "Số lượt sử dụng",
      dataIndex: "usageCount",
      key: "usageCount",
      width: 145,
      align: "right" as const,
    });
  }

  if (visibleKeys.has("manufacturer")) {
    columns.push({
      title: "Hãng sản xuất",
      dataIndex: "manufacturer",
      key: "manufacturer",
      width: 160,
      ellipsis: true,
      render: (v: string) => v || "-",
    });
  }

  if (visibleKeys.has("maintenanceCount")) {
    columns.push({
      title: "Số lượt bảo dưỡng",
      dataIndex: "maintenanceCount",
      key: "maintenanceCount",
      width: 155,
      align: "right" as const,
    });
  }

  if (visibleKeys.has("supplierName")) {
    columns.push({
      title: "Nhà cung cấp",
      dataIndex: "supplierName",
      key: "supplierName",
      width: 160,
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

  if (visibleKeys.has("status")) {
    columns.push({
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 130,
      fixed: "right" as const,
      render: (status: EquipmentStatus) => (
        <Tag color={EquipmentStatusColors[status]}>
          {EquipmentStatusLabels[status]}
        </Tag>
      ),
    });
  }

  columns.push({
    title: "",
    key: "actions",
    width: 50,
    fixed: "right" as const,
    render: (_: unknown, record: EquipmentListDto) => (
      <Tooltip title="Chỉnh sửa">
        <Button
          type="text"
          size="small"
          icon={<EditOutlined />}
          onClick={(e) => { e.stopPropagation(); handleView(record.id); }}
        />
      </Tooltip>
    ),
  });

  return columns;
};

export const COLUMN_VISIBILITY_KEY = "equipment-visible-columns";
