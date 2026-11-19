import React from "react";
import { stepBadgeStyle } from "./utils";

export interface StepState {
  done: boolean;
  active: boolean;
}

export interface StepLabelProps {
  index: number;
  state: StepState;
  title: string;
  required?: boolean;
  /** Ghi chú xám cạnh tiêu đề */
  hint?: string;
  /** Nội dung canh phải (vd "Đã chọn 3", checkbox Mọi nền mẫu) */
  extra?: React.ReactNode;
}

/** Tiêu đề bước ①–④ của Phiếu khai báo */
const StepLabel: React.FC<StepLabelProps> = ({ index, state, title, required, hint, extra }) => (
  <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 500 }}>
    <span style={stepBadgeStyle(state.done, state.active)}>{index}</span>
    {title}
    {required && <span style={{ color: "#cf1322" }}>*</span>}
    {hint && <span style={{ fontWeight: 400, fontSize: 12, color: "#595959" }}>{hint}</span>}
    {extra && <span style={{ marginLeft: "auto", fontWeight: 400 }}>{extra}</span>}
  </span>
);

export default StepLabel;
