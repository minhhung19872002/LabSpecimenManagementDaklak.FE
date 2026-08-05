import React from "react";
import { Alert, Typography } from "antd";
import { WarningOutlined } from "@ant-design/icons";
import { PreparedSolutionBatchDto, PreparedSolutionStatus } from "../../../services/preparedSolutionService";
import { formatVolume } from "./utils";

export interface PreparedSolutionWarningBannerProps {
  items: PreparedSolutionBatchDto[];
}

interface ReasonDisplay {
  text: string;
  color: string;
}

const getReason = (item: PreparedSolutionBatchDto): ReasonDisplay => {
  switch (item.computedStatus) {
    case PreparedSolutionStatus.Expired:
      return {
        text: `hết hạn ${Math.abs(item.daysRemaining)} ngày trước`,
        color: "#f5222d",
      };
    case PreparedSolutionStatus.Empty:
      return { text: "đã dùng hết", color: "#8c8c8c" };
    case PreparedSolutionStatus.NearingExpiry:
      return { text: `còn ${item.daysRemaining} ngày`, color: "#fa8c16" };
    case PreparedSolutionStatus.NearlyEmpty: {
      const pct =
        item.totalVolume > 0
          ? Math.round((item.remainingVolume / item.totalVolume) * 100)
          : 0;
      const vol = formatVolume(item.remainingVolume, item.volumeUnitName ?? undefined);
      return { text: `còn ${vol} (${pct}%)`, color: "#fa8c16" };
    }
    default:
      return { text: "", color: "#595959" };
  }
};

const PreparedSolutionWarningBanner: React.FC<PreparedSolutionWarningBannerProps> = ({ items }) => {
  if (items.length === 0) return null;

  const description = (
    <div style={{ maxHeight: 120, overflowY: "auto", marginTop: 4, display: "flex", flexDirection: "column", gap: 4 }}>
      {items.map((item) => {
        const reason = getReason(item);
        return (
          <div key={item.id} style={{ lineHeight: "20px" }}>
            <Typography.Text style={{ fontSize: 12, color: "#595959" }}>
              {item.lotCode}
            </Typography.Text>
            <Typography.Text style={{ fontSize: 13, marginLeft: 8 }}>
              {item.solutionProductName}
            </Typography.Text>
            {reason.text && (
              <Typography.Text style={{ color: reason.color, fontSize: 13, marginLeft: 8 }}>
                · {reason.text}
              </Typography.Text>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <Alert
      type="warning"
      icon={<WarningOutlined />}
      showIcon
      message={
        <Typography.Text strong style={{ fontSize: 13 }}>
          {items.length} dung dịch cần chú ý
        </Typography.Text>
      }
      description={description}
      style={{ marginBottom: 16 }}
    />
  );
};

export default PreparedSolutionWarningBanner;
