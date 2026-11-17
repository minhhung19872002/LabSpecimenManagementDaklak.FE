import React, { useRef, useState } from "react";
import { Input } from "antd";
import { NumericFormat } from "react-number-format";
import type { ServiceCatalogItemDto } from "../../../../services/serviceCatalogService";
import {
  formatPrice,
  formatShortDate,
  hasUpcomingAfter,
  type ServiceMatrixRow,
  type SpecimenColumn,
} from "./utils";
import "./ServiceMatrixCell.css";

export interface ServiceMatrixCellProps {
  row: ServiceMatrixRow;
  column: SpecimenColumn;
  service?: ServiceCatalogItemDto;
  /** YYYY-MM-DD — ngày đang xem giá */
  viewDate: string;
  isEditing: boolean;
  canCreate: boolean;
  canEdit: boolean;
  onCellDoubleClick: (service: ServiceCatalogItemDto) => void;
  onEmptyCellDoubleClick: (row: ServiceMatrixRow, column: SpecimenColumn) => void;
  onEditCommit: (service: ServiceCatalogItemDto, value: number | null) => void;
  onEditCancel: () => void;
}

const cellBoxStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 44,
  boxSizing: "border-box",
  padding: "4px 10px",
  border: "1px solid #F0F0F0",
  borderRadius: 8,
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  justifyContent: "center",
  userSelect: "none",
};

/** Ô thao tác được → viền xanh khi hover (CSS :hover thuần, xem ServiceMatrixCell.css) */
const ACTION_CLASS = "svc-matrix-cell--action";

// Style tĩnh — tạo 1 lần, không cấp phát lại cho từng ô mỗi lần render
const emptyCreatableStyle: React.CSSProperties = { ...cellBoxStyle, background: "#FAFAFA", color: "#8c8c8c" };
const activeBoxStyle: React.CSSProperties = { ...cellBoxStyle, background: "#FFFFFF" };
const inactiveBoxStyle: React.CSSProperties = { ...cellBoxStyle, background: "#F5F5F5" };
const activePriceStyle: React.CSSProperties = { fontWeight: 500, color: "#262626" };
const inactivePriceStyle: React.CSSProperties = { fontWeight: 500, color: "#8c8c8c", textDecoration: "line-through" };
const subStyle: React.CSSProperties = { fontSize: 11, whiteSpace: "nowrap", color: "#8c8c8c" };
const subUpcomingStyle: React.CSSProperties = { ...subStyle, color: "#AD4E00" };
const editInputStyle: React.CSSProperties = {
  width: "100%",
  height: 44,
  borderRadius: 8,
  textAlign: "right",
  fontWeight: 500,
};

/**
 * Ô nhập giá tự giữ giá trị đang gõ (local state) → gõ phím chỉ re-render đúng ô này,
 * không kéo cả ma trận render lại. Chỉ báo lên cha khi Enter / blur / Esc.
 */
const PriceEditInput = React.memo<{
  service: ServiceCatalogItemDto;
  onCommit: (service: ServiceCatalogItemDto, value: number | null) => void;
  onCancel: () => void;
}>(function PriceEditInput({ service, onCommit, onCancel }) {
  const [value, setValue] = useState<number | null>(service.priceAtDate ?? service.unitPrice);
  // Enter rồi blur (hoặc Esc rồi blur khi ô bị gỡ) chỉ xử lý 1 lần
  const doneRef = useRef(false);
  const finish = (commit: boolean) => {
    if (doneRef.current) return;
    doneRef.current = true;
    if (commit) onCommit(service, value);
    else onCancel();
  };

  return (
    <NumericFormat
      autoFocus
      value={value ?? ""}
      onValueChange={(values) => setValue(values.floatValue ?? null)}
      allowNegative={false}
      decimalScale={0}
      thousandSeparator="."
      decimalSeparator=","
      customInput={Input}
      style={editInputStyle}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
          e.preventDefault();
          finish(true);
        }
        if (e.key === "Escape") {
          e.preventDefault();
          finish(false);
        }
      }}
      onBlur={() => finish(true)}
    />
  );
});

/**
 * 1 ô giá của ma trận. React.memo: chỉ render lại khi chính ô đó đổi (dịch vụ / đang sửa / quyền),
 * nên chọn dòng, mở nhóm, sửa 1 ô… không làm hàng nghìn ô khác render lại.
 * Menu chuột phải dùng chung cho cả bảng (ServiceCellContextMenu) qua `data-service-id`.
 */
const ServiceMatrixCell = React.memo<ServiceMatrixCellProps>(function ServiceMatrixCell({
  row,
  column,
  service,
  viewDate,
  isEditing,
  canCreate,
  canEdit,
  onCellDoubleClick,
  onEmptyCellDoubleClick,
  onEditCommit,
  onEditCancel,
}) {
  if (!service) {
    return (
      <div
        className={canCreate ? ACTION_CLASS : undefined}
        style={emptyCreatableStyle}
        title={canCreate ? "Chưa có dịch vụ — nhấp đúp để tạo" : "Chưa có dịch vụ"}
        onDoubleClick={canCreate ? () => onEmptyCellDoubleClick(row, column) : undefined}
      >
        —
      </div>
    );
  }

  if (isEditing) {
    return <PriceEditInput service={service} onCommit={onEditCommit} onCancel={onEditCancel} />;
  }

  const tat = service.turnaroundDaysAtDate ?? service.turnaroundDays;
  const upcoming = hasUpcomingAfter(service, viewDate);
  const sub = !service.isActive
    ? `Đã ngừng · ${service.serviceCode ?? ""}`
    : upcoming
      ? `▲ ${formatPrice(service.upcomingPrice)} từ ${formatShortDate(service.upcomingEffectiveDate)}`
      : `${service.serviceCode ?? ""}${tat != null ? ` · ${tat} ngày` : ""}`;

  return (
    <div
      data-service-id={service.id}
      className={ACTION_CLASS}
      style={service.isActive ? activeBoxStyle : inactiveBoxStyle}
      title={`${service.serviceCode ?? ""} · hiệu lực từ ${formatShortDate(service.effectiveDateAtDate)}${
        canEdit ? " · nhấp đúp để sửa, chuột phải để xem thêm" : ""
      }`}
      onDoubleClick={canEdit && service.isActive ? () => onCellDoubleClick(service) : undefined}
    >
      <span style={service.isActive ? activePriceStyle : inactivePriceStyle}>{formatPrice(service.priceAtDate)}</span>
      <span style={upcoming && service.isActive ? subUpcomingStyle : subStyle}>{sub}</span>
    </div>
  );
});

export default ServiceMatrixCell;
