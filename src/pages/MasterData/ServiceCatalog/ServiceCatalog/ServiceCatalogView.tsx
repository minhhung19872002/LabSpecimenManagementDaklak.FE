import React from "react";
import { Button, Tabs, Tag, Typography } from "antd";
import { InfoCircleOutlined } from "../../../../components/common/Icon";
import ServiceCatalogToolbar, { type ServiceCatalogToolbarProps } from "./ServiceCatalogToolbar";
import ServiceMatrixTable, { type ServiceMatrixTableProps } from "./ServiceMatrixTable";
import ServiceListTable, { type ServiceListTableProps } from "./ServiceListTable";
import { SERVICE_RULES, type ServiceCatalogTab } from "./utils";

export interface ServiceCatalogViewProps {
  activeTab: ServiceCatalogTab;
  showRules: boolean;
  toolbar: Omit<ServiceCatalogToolbarProps, "mode" | "countText">;
  gridCountText: string;
  listCountText: string;
  matrix: ServiceMatrixTableProps;
  list: ServiceListTableProps;
  onTabChange: (tab: ServiceCatalogTab) => void;
  onToggleRules: () => void;
}

/** L2 — Dịch vụ & Bảng giá */
const ServiceCatalogView: React.FC<ServiceCatalogViewProps> = ({
  activeTab,
  showRules,
  toolbar,
  gridCountText,
  listCountText,
  matrix,
  list,
  onTabChange,
  onToggleRules,
}) => (
  <div style={{ padding: "4px 16px 16px" }}>
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
            Dịch vụ &amp; Bảng giá
          </Typography.Title>
          <Tag style={{ margin: 0 }}>Level 2</Tag>
        </div>
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          Ghép Chỉ tiêu + Nền mẫu + Phương pháp thành dịch vụ bán cho khách hàng, quy định Giá và TAT.
        </Typography.Text>
      </div>
      <Button
        icon={<InfoCircleOutlined />}
        onClick={onToggleRules}
        style={{ borderColor: "#91D5FF", background: "#E6F7FF", color: "#0050B3" }}
      >
        {showRules ? "Ẩn quy tắc" : "Quy tắc áp dụng"} ({SERVICE_RULES.length})
      </Button>
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
        {SERVICE_RULES.map((r) => (
          <div key={r.code} style={{ display: "flex", gap: 10, alignItems: "baseline", fontSize: 13 }}>
            <Tag color="blue" style={{ margin: 0, background: "#fff", whiteSpace: "nowrap" }}>
              {r.code}
            </Tag>
            <span>{r.text}</span>
          </div>
        ))}
      </div>
    )}

    <Tabs
      activeKey={activeTab}
      onChange={(key) => onTabChange(key as ServiceCatalogTab)}
      items={[
        {
          key: "grid",
          label: "Ma trận giá",
          children: (
            <>
              <ServiceCatalogToolbar mode="grid" countText={gridCountText} {...toolbar} />
              <ServiceMatrixTable {...matrix} />
            </>
          ),
        },
        {
          key: "list",
          label: "Danh sách & lịch sử version",
          children: (
            <>
              <ServiceCatalogToolbar mode="list" countText={listCountText} {...toolbar} />
              <ServiceListTable {...list} />
            </>
          ),
        },
      ]}
    />
  </div>
);

export default ServiceCatalogView;
