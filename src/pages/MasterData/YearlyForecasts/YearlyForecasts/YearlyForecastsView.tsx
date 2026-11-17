import React from "react";
import ForecastHeader, { type ForecastHeaderProps } from "./ForecastHeader";
import ForecastToolbar, { type ForecastToolbarProps } from "./ForecastToolbar";
import ForecastTable, { type ForecastTableProps } from "./ForecastTable";
import ForecastCalculationModal, { type ForecastCalculationModalProps } from "./ForecastCalculationModal";

export interface YearlyForecastsViewProps {
  header: ForecastHeaderProps;
  toolbar: ForecastToolbarProps;
  table: ForecastTableProps;
  calculation: ForecastCalculationModalProps;
}

const hintStyle = (locked: boolean): React.CSSProperties => ({
  marginBottom: 10,
  padding: "6px 12px",
  borderRadius: 6,
  fontSize: 13,
  border: `1px solid ${locked ? "#d9d9d9" : "#b7eb8f"}`,
  background: locked ? "#fafafa" : "#f6ffed",
  color: locked ? "#595959" : "#389e0d",
});

/** L4 — Dự toán mẫu hàng năm */
const YearlyForecastsView: React.FC<YearlyForecastsViewProps> = ({ header, toolbar, table, calculation }) => {
  const { year, isLocked, canEdit } = toolbar;
  return (
    <div style={{ padding: "4px 16px 16px" }}>
      <ForecastHeader {...header} />
      <ForecastToolbar {...toolbar} />

      <div style={hintStyle(isLocked || !canEdit)}>
        {isLocked ? (
          <>
            <b>Đã khóa:</b> Năm {year} chỉ xem — sau 31/12, bản ghi năm cũ chuyển Read-Only (BR-07).
          </>
        ) : canEdit ? (
          <>
            <b>Đang mở:</b> Nhập số mẫu trực tiếp vào bảng rồi bấm “Lưu dự toán”. Không ảnh hưởng Định mức Level 3
            (BR-05).
          </>
        ) : (
          <>Bạn chỉ có quyền xem dự toán.</>
        )}
      </div>

      <ForecastTable {...table} />
      <ForecastCalculationModal {...calculation} />
    </div>
  );
};

export default YearlyForecastsView;
