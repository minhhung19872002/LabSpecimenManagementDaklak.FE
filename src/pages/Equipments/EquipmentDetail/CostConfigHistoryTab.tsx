import React, { useState, useEffect } from "react";
import { Table, Tag, Typography, Spin, Empty } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { equipmentService, EquipmentCostConfigDto } from "../../../services/equipmentService";
import { formatNumber } from "./utils";

const { Text } = Typography;

interface ChangeEntry {
  field: string;
  from: string;
  to: string;
}

const parseChangeLog = (raw?: string): ChangeEntry[] => {
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

// Format raw decimal strings (e.g. "3213235.00") → "3.213.235"; dates/text pass through unchanged
const formatChangeValue = (val: string): string => {
  if (!val) return "—";
  if (/^-?\d+(\.\d+)?$/.test(val)) {
    const num = parseFloat(val);
    return isNaN(num) ? val : formatNumber(num, 0);
  }
  return val;
};

export interface CostConfigHistoryTabProps {
  equipmentId: string;
  refreshKey?: number;
}

const CostConfigHistoryTab: React.FC<CostConfigHistoryTabProps> = ({ equipmentId, refreshKey }) => {
  const [configs, setConfigs] = useState<EquipmentCostConfigDto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    equipmentService
      .getCostConfigs(equipmentId)
      .then(setConfigs)
      .catch(() => setConfigs([]))
      .finally(() => setLoading(false));
  }, [equipmentId, refreshKey]);

  const columns: ColumnsType<EquipmentCostConfigDto> = [
    {
      title: "Ngày thiết lập",
      dataIndex: "creationTime",
      width: 160,
      render: (v) => dayjs(v).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Người thiết lập",
      dataIndex: "creatorName",
      width: 140,
      render: (v) => v || "—",
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      width: 170,
      render: (v) =>
        v === "Tạo thiết lập mới" ? (
          <Tag color="blue">{v}</Tag>
        ) : v === "Chỉnh sửa thiết lập" ? (
          <Tag color="orange">{v}</Tag>
        ) : (
          <Text type="secondary">{v || "—"}</Text>
        ),
    },
    {
      title: "Hiệu lực",
      width: 210,
      render: (_, r) =>
        `${dayjs(r.effectiveFrom).format("DD/MM/YYYY")} → ${dayjs(r.effectiveTo).format("DD/MM/YYYY")}`,
    },
    {
      title: "Thông số",
      width: 200,
      render: (_, r) => (
        <div style={{ fontSize: 12, lineHeight: "20px" }}>
          <div>Giờ chạy/năm: <Text strong>{r.operatingHoursPerYear != null ? formatNumber(r.operatingHoursPerYear, 1) : "—"}</Text></div>
          <div>Số mẫu/năm: <Text strong>{r.averageSamplesPerYear != null ? formatNumber(r.averageSamplesPerYear, 0) : "—"}</Text></div>
          <div>Tỷ lệ DTBD: <Text strong>{r.maintenanceCostRatio != null ? `${r.maintenanceCostRatio}%` : "—"}</Text></div>
          <div>HC/năm: <Text strong>{r.calibrationCostPerYear != null ? `${formatNumber(r.calibrationCostPerYear, 0)} đ` : "—"}</Text></div>
        </div>
      ),
    },
  ];

  const expandedRowRender = (record: EquipmentCostConfigDto) => {
    const changes = parseChangeLog(record.changeLog);
    if (changes.length === 0) {
      return (
        <Text type="secondary" style={{ paddingLeft: 8 }}>
          {record.description === "Tạo thiết lập mới" && !record.changeLog
            ? "Phiên bản khởi tạo"
            : "Không có thay đổi thông số"}
        </Text>
      );
    }
    return (
      <Table
        size="small"
        pagination={false}
        dataSource={changes}
        rowKey="field"
        columns={[
          { title: "Thông số", dataIndex: "field", width: 220 },
          {
            title: "Giá trị cũ",
            dataIndex: "from",
            render: (v) => <Text type="secondary">{formatChangeValue(v)}</Text>,
          },
          {
            title: "Giá trị mới",
            dataIndex: "to",
            render: (v) => <Text strong style={{ color: "#1677ff" }}>{formatChangeValue(v)}</Text>,
          },
        ]}
        style={{ marginLeft: 0 }}
      />
    );
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
        <Spin />
      </div>
    );
  }

  if (!configs.length) {
    return <Empty description="Chưa có phiên bản cấu hình nào" style={{ padding: 48 }} />;
  }

  return (
    <Table
      size="small"
      rowKey="id"
      dataSource={configs}
      columns={columns}
      pagination={{ defaultPageSize: 50, pageSizeOptions: [50, 100, 150], showSizeChanger: true }}
      expandable={{
        expandedRowRender,
        rowExpandable: () => true,
      }}
      scroll={{ x: 1000 }}
    />
  );
};

export default CostConfigHistoryTab;
