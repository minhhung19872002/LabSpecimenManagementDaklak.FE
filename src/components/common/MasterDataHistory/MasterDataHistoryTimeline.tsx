import React from "react";
import { Empty, Spin, Tag, Timeline, Typography } from "antd";
import dayjs from "dayjs";
import type {
  MasterDataChangeDto,
  MasterDataPropertyChangeDto,
} from "../../../types/masterDataHistory";

const { Text } = Typography;

export interface MasterDataHistoryTimelineProps {
  loading: boolean;
  items: MasterDataChangeDto[];
}

const ACTION_COLORS: Record<string, string> = {
  Created: "green",
  Updated: "blue",
  Deleted: "red",
};

/** Bỏ thẻ HTML (tên định dạng, ĐVT định dạng) để hiển thị dạng text */
const toPlainText = (value?: string | null): string => {
  if (value == null || value === "") return "";
  if (!/[<&]/.test(value)) return value;
  const doc = new DOMParser().parseFromString(value, "text/html");
  return doc.body.textContent ?? "";
};

const getActionColor = (change: MasterDataChangeDto): string => {
  if (change.action.toLowerCase().includes("ngừng")) return "orange";
  if (change.action.toLowerCase().includes("kích hoạt")) return "cyan";
  return ACTION_COLORS[change.changeType] ?? "default";
};

const PropertyLine: React.FC<{
  property: MasterDataPropertyChangeDto;
  isCreated: boolean;
}> = ({ property, isCreated }) => {
  const oldValue = toPlainText(property.originalValue);
  const newValue = toPlainText(property.newValue);
  return (
    <div className="master-data-history-property">
      <Text strong>{property.displayName}: </Text>
      {isCreated ? (
        <Text>{newValue}</Text>
      ) : (
        <>
          <Text delete type="secondary">
            {oldValue || "(trống)"}
          </Text>
          <Text type="secondary"> → </Text>
          <Text>{newValue || "(trống)"}</Text>
        </>
      )}
    </div>
  );
};

/**
 * Timeline lịch sử thay đổi của 1 bản ghi master data (presentational)
 */
const MasterDataHistoryTimeline: React.FC<MasterDataHistoryTimelineProps> = ({
  loading,
  items,
}) => {
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 32 }}>
        <Spin />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Empty description="Chưa có lịch sử thay đổi (lịch sử được ghi từ khi cập nhật tính năng)" />
    );
  }

  return (
    <Timeline
      items={items.map((change) => ({
        key: change.id,
        color: getActionColor(change),
        children: (
          <div>
            <div style={{ marginBottom: 4 }}>
              <Tag color={getActionColor(change)}>{change.action}</Tag>
              <Text type="secondary">
                {dayjs(change.changeTime).format("DD/MM/YYYY HH:mm:ss")}
              </Text>
              {change.userName && (
                <Text type="secondary"> · {change.userName}</Text>
              )}
            </div>
            {change.properties.map((property) => (
              <PropertyLine
                key={property.propertyName}
                property={property}
                isCreated={change.changeType === "Created"}
              />
            ))}
          </div>
        ),
      }))}
    />
  );
};

export default MasterDataHistoryTimeline;
