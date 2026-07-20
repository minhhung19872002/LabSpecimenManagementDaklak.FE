import { Tooltip, Button } from "antd";
import { EditOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { EquipmentListDto } from "../../../services/equipmentService";

export interface ColumnConfig {
  key: string;
  title: string;
  defaultVisible: boolean;
}

export const ALL_COLUMNS: ColumnConfig[] = [
  { key: "assetCode", title: "Mã tài sản", defaultVisible: true },
  { key: "name", title: "Tên thiết bị", defaultVisible: true },
  { key: "price", title: "Nguyên giá", defaultVisible: true },
  { key: "powerConsumption", title: "Công suất sử dụng (kW)", defaultVisible: false },
  { key: "operatingHoursPerYear", title: "Thời gian chạy máy (h/năm)", defaultVisible: true },
  { key: "electricityPerYear", title: "Lượng điện tiêu thụ (kW/năm)", defaultVisible: false },
  { key: "averageSamplesPerYear", title: "Số lượng mẫu TB / năm", defaultVisible: false },
  { key: "electricityPerSample", title: "Lượng điện tiêu thụ / mẫu", defaultVisible: true },
  { key: "depreciationPeriod", title: "Thời gian khấu hao (năm)", defaultVisible: false },
  { key: "depreciationPerYear", title: "Khấu hao trung bình / năm", defaultVisible: false },
  { key: "depreciationPerSample", title: "Khấu hao TS trung bình / mẫu", defaultVisible: false },
  { key: "maintenanceCostRatio", title: "Tỷ lệ CP duy tu bảo dưỡng", defaultVisible: false },
  { key: "maintenanceCost", title: "Mức chi phí duy tu bảo dưỡng", defaultVisible: false },
  { key: "calibrationCostPerYear", title: "Chi phí hiệu chuẩn TB / năm", defaultVisible: false },
  { key: "depreciationPerHour", title: "Khấu hao TB / giờ", defaultVisible: false },
  { key: "depreciationPerSampleHC", title: "Khấu hao TB / mẫu", defaultVisible: false },
];

const formatNumber = (val: number | null | undefined): string => {
  if (val == null || isNaN(val)) return "-";
  return val.toLocaleString("vi-VN", { maximumFractionDigits: 2 });
};

const formatCurrency = (val: number | null | undefined): string => {
  if (val == null || isNaN(val)) return "-";
  return val.toLocaleString("vi-VN", { maximumFractionDigits: 0 });
};

const safeDiv = (a: number | null | undefined, b: number | null | undefined): number | null => {
  if (a == null || b == null || b === 0) return null;
  return a / b;
};

export const getEquipmentColumns = (
  visibleKeys: Set<string>,
  handleView: (id: string) => void,
): ColumnsType<EquipmentListDto> => {
  const columns: ColumnsType<EquipmentListDto> = [];

  if (visibleKeys.has("assetCode")) {
    columns.push({
      title: "Mã tài sản",
      dataIndex: "assetCode",
      key: "assetCode",
      width: 140,
      fixed: "left" as const,
      render: (v: string) => v || "-",
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

  if (visibleKeys.has("price")) {
    columns.push({
      title: "Nguyên giá",
      dataIndex: "price",
      key: "price",
      width: 150,
      align: "right" as const,
      render: (v: number) => formatCurrency(v),
    });
  }

  if (visibleKeys.has("powerConsumption")) {
    columns.push({
      title: "Công suất sử dụng (kW)",
      dataIndex: "powerConsumption",
      key: "powerConsumption",
      width: 170,
      align: "right" as const,
      render: (v: number) => formatNumber(v),
    });
  }

  if (visibleKeys.has("operatingHoursPerYear")) {
    columns.push({
      title: "Thời gian chạy máy (h/năm)",
      dataIndex: "operatingHoursPerYear",
      key: "operatingHoursPerYear",
      width: 190,
      align: "right" as const,
      render: (v: number) => formatNumber(v),
    });
  }

  if (visibleKeys.has("electricityPerYear")) {
    columns.push({
      title: "Lượng điện tiêu thụ (kW/năm)",
      key: "electricityPerYear",
      width: 200,
      align: "right" as const,
      render: (_: unknown, r: EquipmentListDto) => {
        const val = r.powerConsumption != null && r.operatingHoursPerYear != null
          ? r.powerConsumption * r.operatingHoursPerYear
          : null;
        return formatNumber(val);
      },
    });
  }

  if (visibleKeys.has("averageSamplesPerYear")) {
    columns.push({
      title: "Số lượng mẫu TB / năm",
      dataIndex: "averageSamplesPerYear",
      key: "averageSamplesPerYear",
      width: 180,
      align: "right" as const,
      render: (v: number) => formatNumber(v),
    });
  }

  if (visibleKeys.has("electricityPerSample")) {
    columns.push({
      title: "Lượng điện tiêu thụ / mẫu",
      key: "electricityPerSample",
      width: 190,
      align: "right" as const,
      render: (_: unknown, r: EquipmentListDto) => {
        const elecPerYear = r.powerConsumption != null && r.operatingHoursPerYear != null
          ? r.powerConsumption * r.operatingHoursPerYear
          : null;
        return formatNumber(safeDiv(elecPerYear, r.averageSamplesPerYear));
      },
    });
  }

  if (visibleKeys.has("depreciationPeriod")) {
    columns.push({
      title: "Thời gian khấu hao (năm)",
      dataIndex: "depreciationPeriod",
      key: "depreciationPeriod",
      width: 180,
      align: "right" as const,
      render: (v: number) => formatNumber(v),
    });
  }

  if (visibleKeys.has("depreciationPerYear")) {
    columns.push({
      title: "Khấu hao trung bình / năm",
      key: "depreciationPerYear",
      width: 190,
      align: "right" as const,
      render: (_: unknown, r: EquipmentListDto) => {
        const val = safeDiv(r.price, r.depreciationPeriod);
        return val != null ? formatCurrency(Math.ceil(val)) : "-";
      },
    });
  }

  if (visibleKeys.has("depreciationPerSample")) {
    columns.push({
      title: "Khấu hao TS trung bình / mẫu",
      key: "depreciationPerSample",
      width: 210,
      align: "right" as const,
      render: (_: unknown, r: EquipmentListDto) => {
        const val = safeDiv(safeDiv(r.price, r.depreciationPeriod), r.averageSamplesPerYear);
        return val != null ? formatCurrency(Math.ceil(val)) : "-";
      },
    });
  }

  if (visibleKeys.has("maintenanceCostRatio")) {
    columns.push({
      title: "Tỷ lệ CP duy tu bảo dưỡng",
      dataIndex: "maintenanceCostRatio",
      key: "maintenanceCostRatio",
      width: 190,
      align: "right" as const,
      render: (v: number) => v != null ? `${formatNumber(v)}%` : "-",
    });
  }

  if (visibleKeys.has("maintenanceCost")) {
    columns.push({
      title: "Mức chi phí duy tu bảo dưỡng",
      key: "maintenanceCost",
      width: 200,
      align: "right" as const,
      render: (_: unknown, r: EquipmentListDto) => {
        const val = r.price != null && r.maintenanceCostRatio != null
          ? r.price * r.maintenanceCostRatio / 100
          : null;
        return formatCurrency(val);
      },
    });
  }

  if (visibleKeys.has("calibrationCostPerYear")) {
    columns.push({
      title: "Chi phí hiệu chuẩn TB / năm",
      dataIndex: "calibrationCostPerYear",
      key: "calibrationCostPerYear",
      width: 200,
      align: "right" as const,
      render: (v: number) => formatCurrency(v),
    });
  }

  if (visibleKeys.has("depreciationPerHour")) {
    columns.push({
      title: "Khấu hao TB / giờ",
      key: "depreciationPerHour",
      width: 160,
      align: "right" as const,
      render: (_: unknown, r: EquipmentListDto) => {
        const val = safeDiv(r.calibrationCostPerYear, 12 * 22 * 8);
        return val != null ? formatCurrency(Math.ceil(val)) : "-";
      },
    });
  }

  if (visibleKeys.has("depreciationPerSampleHC")) {
    columns.push({
      title: "Khấu hao TB / mẫu",
      key: "depreciationPerSampleHC",
      width: 170,
      align: "right" as const,
      render: (_: unknown, r: EquipmentListDto) => {
        const val = safeDiv(r.calibrationCostPerYear, r.averageSamplesPerYear);
        return val != null ? formatCurrency(Math.ceil(val)) : "-";
      },
    });
  }

  columns.push({
    title: "",
    key: "actions",
    width: 50,
    fixed: "right" as const,
    render: (_: unknown, record: EquipmentListDto) => (
      <Tooltip title="Chi tiết">
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
