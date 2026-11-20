import React from "react";
import { Spin } from "antd";
import AddItemModal, { type AddItemModalProps } from "./AddItemModal";
import ApplyModal, { type ApplyModalProps } from "./ApplyModal";
import CreateFooter, { type CreateFooterProps } from "./CreateFooter";
import LeftPanel, { type LeftPanelProps } from "./LeftPanel";
import MethodsPanel, { type MethodsPanelProps } from "./MethodsPanel";
import PickComboModal, { type PickComboModalProps } from "./PickComboModal";
import "../../BatchNorms/BatchNormCreate/BatchNormCreate.css";
import "./YearlyForecastCreate.css";

const ClipboardCheckIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 3h6v2H9z" />
    <path d="M9 4H6a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-3" />
    <path d="m9 13 2 2 4-4" />
  </svg>
);

const countPillStyle: React.CSSProperties = {
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
  whiteSpace: "nowrap",
};

export interface YearlyForecastCreateViewProps {
  headerHeight: number;
  loading: boolean;
  isEdit: boolean;
  headerSummary: string;
  onBack: () => void;
  left: LeftPanelProps;
  methods: MethodsPanelProps;
  footer: CreateFooterProps;
  pick: PickComboModalProps;
  add: AddItemModalProps;
  apply: ApplyModalProps;
}

/** Phiếu tạo / sửa dự toán mẫu năm: ① Nền mẫu · chỉ tiêu → ② Số mẫu & tiêu hao theo phương pháp */
const YearlyForecastCreateView: React.FC<YearlyForecastCreateViewProps> = ({
  headerHeight,
  loading,
  isEdit,
  headerSummary,
  onBack,
  left,
  methods,
  footer,
  pick,
  add,
  apply,
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
        ‹ Dự toán mẫu năm
      </button>
      <h1 style={{ margin: 0, fontSize: 24, fontWeight: 500, lineHeight: "32px" }}>
        {isEdit ? "Phiếu sửa dự toán mẫu năm" : "Phiếu tạo dự toán mẫu năm"}
      </h1>
      <div style={{ fontSize: 13, color: "#595959" }}>
        Tạo 1 hoặc nhiều dự toán cùng lúc · tích chọn từng bộ Nền mẫu × Chỉ tiêu × Phương pháp và nhập số mẫu · vật tư, thiết bị
        tự tính theo Định mức theo mẻ
      </div>
    </div>
    <Spin spinning={loading} wrapperClassName="bnc-spin">
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
          <span style={countPillStyle}>{headerSummary}</span>
        </div>
        <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
          <LeftPanel {...left} />
          <MethodsPanel {...methods} />
        </div>
        <CreateFooter {...footer} />
      </div>
    </Spin>
    <PickComboModal {...pick} />
    <AddItemModal {...add} />
    <ApplyModal {...apply} />
  </div>
);

export default YearlyForecastCreateView;
