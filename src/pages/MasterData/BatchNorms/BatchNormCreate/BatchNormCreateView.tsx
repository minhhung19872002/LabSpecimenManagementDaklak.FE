import React from "react";
import { Spin } from "antd";
import AddProductModal, { type AddProductModalProps } from "./AddProductModal";
import ApplyPanel, { type ApplyPanelProps } from "./ApplyPanel";
import CopyNormModal, { type CopyNormModalProps } from "./CopyNormModal";
import CreateFooter, { type CreateFooterProps } from "./CreateFooter";
import ItemsPanel, { type ItemsPanelProps } from "./ItemsPanel";
import PickComboModal, { type PickComboModalProps } from "./PickComboModal";
import type { NormFormMode } from "./utils";
import "./BatchNormCreate.css";

const ClipboardCheckIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 3h6v2H9z" />
    <path d="M9 4H6a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-3" />
    <path d="m9 13 2 2 4-4" />
  </svg>
);

const PAGE_TEXT: Record<NormFormMode, { title: string; sub: string }> = {
  create: {
    title: "Phiếu khai báo định mức theo mẻ",
    sub: "Tạo 1 hoặc nhiều định mức cùng lúc · tích chọn từng bộ Nền mẫu × Chỉ tiêu × Phương pháp · vật tư, thiết bị và lượng tiêu hao / mẫu dùng chung",
  },
  edit: {
    title: "Sửa định mức",
    sub: "Sửa vật tư, thiết bị và lượng tiêu hao / mẫu của 1 bộ · có thể áp dụng thay đổi cho bộ khác",
  },
};

export interface BatchNormCreateViewProps {
  mode: NormFormMode;
  headerHeight: number;
  loading: boolean;
  onBack: () => void;
  apply: ApplyPanelProps;
  items: ItemsPanelProps;
  footer: CreateFooterProps;
  pick: PickComboModalProps;
  add: AddProductModalProps;
  copy: CopyNormModalProps;
}

/** Phiếu khai báo / sửa định mức theo mẻ: ① Áp dụng cho → ② Vật tư & thiết bị */
const BatchNormCreateView: React.FC<BatchNormCreateViewProps> = ({
  mode,
  headerHeight,
  loading,
  onBack,
  apply,
  items,
  footer,
  pick,
  add,
  copy,
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
        ‹ Định mức theo mẻ
      </button>
      <h1 style={{ margin: 0, fontSize: 24, fontWeight: 500, lineHeight: "32px" }}>{PAGE_TEXT[mode].title}</h1>
      <div style={{ fontSize: 13, color: "#595959" }}>{PAGE_TEXT[mode].sub}</div>
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
        </div>
        <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
          <ApplyPanel {...apply} />
          <ItemsPanel {...items} />
        </div>
        <CreateFooter {...footer} />
      </div>
    </Spin>
    <PickComboModal {...pick} />
    <AddProductModal {...add} />
    <CopyNormModal {...copy} />
  </div>
);

export default BatchNormCreateView;
