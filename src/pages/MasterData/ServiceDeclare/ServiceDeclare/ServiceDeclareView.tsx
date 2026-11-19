import React from "react";
import { Spin } from "antd";
import DeclareSetupBar, { type DeclareSetupBarProps } from "./DeclareSetupBar";
import IndicatorTreePanel, { type IndicatorTreePanelProps } from "./IndicatorTreePanel";
import PriceDeclarePanel, { type PriceDeclarePanelProps } from "./PriceDeclarePanel";
import DeclareFooter, { type DeclareFooterProps } from "./DeclareFooter";
import "./ServiceDeclare.css";

const newCountPillStyle: React.CSSProperties = {
  marginLeft: "auto",
  height: 28,
  padding: "0 12px",
  borderRadius: 14,
  background: "#fff",
  color: "#0958d9",
  display: "inline-flex",
  alignItems: "center",
  fontSize: 13,
  fontWeight: 500,
};

/** Icon bảng kê có dấu tích (giống mock) */
const ClipboardCheckIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 3h6v2H9z" />
    <path d="M9 4H6a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-3" />
    <path d="m9 13 2 2 4-4" />
  </svg>
);

export interface ServiceDeclareViewProps {
  headerHeight: number;
  loading: boolean;
  newCount: number;
  onBack: () => void;
  setup: DeclareSetupBarProps;
  tree: IndicatorTreePanelProps;
  prices: PriceDeclarePanelProps;
  footer: DeclareFooterProps;
}

/** Phiếu khai báo dịch vụ: ① Phương pháp → ② Nền mẫu → ③ Chỉ tiêu → ④ Giá */
const ServiceDeclareView: React.FC<ServiceDeclareViewProps> = ({
  headerHeight,
  loading,
  newCount,
  onBack,
  setup,
  tree,
  prices,
  footer,
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 12, height: `calc(100vh - ${headerHeight}px - 32px)`, minHeight: 560 }}>
    <div>
      <button
        type="button"
        onClick={onBack}
        style={{
          border: 0,
          background: "transparent",
          padding: 0,
          color: "#595959",
          cursor: "pointer",
          font: "inherit",
          fontSize: 13,
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        ‹ Dịch vụ &amp; Bảng giá
      </button>
      <h1 style={{ margin: 0, fontSize: 24, fontWeight: 500, lineHeight: "32px" }}>Phiếu khai báo dịch vụ</h1>
      <div style={{ fontSize: 13, color: "#595959" }}>
        Tạo 1 hoặc nhiều dịch vụ cùng lúc · mỗi chỉ tiêu × mỗi nền mẫu = 1 dịch vụ · giá để trống → “Chờ định giá”
      </div>
    </div>
    <Spin spinning={loading} wrapperClassName="svc-declare-spin">
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#fff",
          boxShadow: "0 2px 8px rgba(0,0,0,.08)",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: 54,
            flex: "none",
            padding: "0 20px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "linear-gradient(90deg,#1e63f8 0%,#009ae3 100%)",
            color: "#fff",
          }}
        >
          <ClipboardCheckIcon />
          <span style={{ fontSize: 16, lineHeight: "24px", fontWeight: 500 }}>Thông tin khai báo</span>
          <span style={newCountPillStyle}>
            {newCount} dịch vụ mới
          </span>
        </div>
        <DeclareSetupBar {...setup} />
        <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
          <IndicatorTreePanel {...tree} />
          <PriceDeclarePanel {...prices} />
        </div>
        <DeclareFooter {...footer} />
      </div>
    </Spin>
  </div>
);

export default ServiceDeclareView;
