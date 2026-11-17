import React from "react";
import { Button, Space, Tag, Typography } from "antd";
import { CopyOutlined, InfoCircleOutlined } from "../../../../components/common/Icon";
import { FORECAST_RULES } from "./utils";

export interface ForecastHeaderProps {
  year: number;
  showRules: boolean;
  /** Hiện nút Clone: có quyền sửa + năm chưa khóa + năm trước có số liệu */
  showClone: boolean;
  cloning: boolean;
  onToggleRules: () => void;
  onClone: () => void;
}

/** Tiêu đề L4 + quy tắc áp dụng + nút Clone (cùng style L2) */
const ForecastHeader: React.FC<ForecastHeaderProps> = ({
  year,
  showRules,
  showClone,
  cloning,
  onToggleRules,
  onClone,
}) => (
  <>
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        padding: "8px 0 12px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <Typography.Title level={5} style={{ margin: 0 }}>
            Dự toán mẫu hàng năm
          </Typography.Title>
          <Tag style={{ margin: 0 }}>Level 4</Tag>
        </div>
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          Tổng số mẫu dự kiến trong năm cho từng dịch vụ — mẫu số để chia chi phí 1 Mẻ thành 1 Phép thử.
        </Typography.Text>
      </div>
      <Space wrap>
        <Button
          icon={<InfoCircleOutlined />}
          onClick={onToggleRules}
          style={{ borderColor: "#91D5FF", background: "#E6F7FF", color: "#0050B3" }}
        >
          {showRules ? "Ẩn quy tắc" : "Quy tắc áp dụng"} ({FORECAST_RULES.length})
        </Button>
        {showClone && (
          <Button type="primary" icon={<CopyOutlined />} loading={cloning} onClick={onClone}>
            Clone từ năm {year - 1}
          </Button>
        )}
      </Space>
    </div>

    {showRules && (
      <div
        style={{
          marginBottom: 12,
          padding: "10px 14px",
          borderRadius: 8,
          border: "1px solid #91D5FF",
          background: "#E6F7FF",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {FORECAST_RULES.map((r) => (
          <div key={r.code} style={{ display: "flex", gap: 10, alignItems: "baseline", fontSize: 13 }}>
            <Tag color="blue" style={{ margin: 0, background: "#fff", whiteSpace: "nowrap" }}>
              {r.code}
            </Tag>
            <span>{r.text}</span>
          </div>
        ))}
      </div>
    )}
  </>
);

export default ForecastHeader;
