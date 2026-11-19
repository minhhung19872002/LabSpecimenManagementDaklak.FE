import React, { useRef, useState } from "react";
import { Input } from "antd";
import { NumericFormat } from "react-number-format";
import { IndicatorName } from "../../../../components/common";
import type { ServiceCatalogItemDto } from "../../../../services/serviceCatalogService";
import { formatPrice, PENDING_PRICE_LABEL } from "./utils";

export interface ServiceRowProps {
  service: ServiceCatalogItemDto;
  specimenName: string;
  /** Giá đã sửa chưa lưu (undefined = chưa sửa) */
  editedPrice?: number;
  isEditing: boolean;
  canEdit: boolean;
  onStartEdit: (serviceId: string) => void;
  onEditCommit: (service: ServiceCatalogItemDto, value: number | null) => void;
  onEditCancel: () => void;
}

/**
 * Ô nhập giá tự giữ giá trị đang gõ (local state) → gõ phím chỉ render lại ô này.
 * Chỉ báo lên cha khi Enter / blur (ghi nhận) hoặc Esc (bỏ).
 */
const PriceEditInput = React.memo<{
  service: ServiceCatalogItemDto;
  initialValue: number | null;
  ariaLabel: string;
  onCommit: (service: ServiceCatalogItemDto, value: number | null) => void;
  onCancel: () => void;
}>(function PriceEditInput({ service, initialValue, ariaLabel, onCommit, onCancel }) {
  const [value, setValue] = useState<number | null>(initialValue);
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
      aria-label={ariaLabel}
      className="svc-price-input"
      value={value ?? ""}
      onValueChange={(values) => setValue(values.floatValue ?? null)}
      allowNegative={false}
      decimalScale={0}
      thousandSeparator="."
      decimalSeparator=","
      customInput={Input}
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

const SubcontractCell: React.FC<{ service: ServiceCatalogItemDto }> = ({ service }) => {
  if (!service.isSubcontract) {
    return (
      <span className="svc-sub-none" title="Không có hợp đồng phụ">
        —
      </span>
    );
  }
  const name = service.subcontractorName?.trim();
  return name ? (
    <span className="svc-sub-tag" title={`Hợp đồng phụ: ${name}`}>
      {name}
    </span>
  ) : (
    <span className="svc-sub-tag is-unnamed" title="Hợp đồng phụ – chưa ghi tên đơn vị">
      Có · chưa ghi tên đơn vị
    </span>
  );
};

/**
 * 1 dòng Chỉ tiêu + Phương pháp + giá. React.memo: sửa 1 giá chỉ render lại đúng dòng đó.
 * Menu chuột phải dùng chung (ServiceCellContextMenu) qua `data-service-id`.
 */
const ServiceRow = React.memo<ServiceRowProps>(function ServiceRow({
  service,
  specimenName,
  editedPrice,
  isEditing,
  canEdit,
  onStartEdit,
  onEditCommit,
  onEditCancel,
}) {
  const edited = editedPrice !== undefined;
  const price = edited ? editedPrice : service.priceAtDate;
  const pending = service.isActive && price == null;
  const editable = canEdit && service.isActive;
  const priceLabel = `Đơn giá ${service.indicatorName} – ${specimenName}`;

  const rowClass = `svc-grid svc-row${edited ? " is-edited" : ""}${service.isActive ? "" : " is-inactive"}`;
  const priceClass = `svc-price${pending ? " is-pending" : ""}${edited ? " is-edited" : ""}`;

  return (
    <div className={rowClass} data-service-id={service.id}>
      <span className="svc-cell svc-indicator" title={service.indicatorName}>
        <IndicatorName
          className="svc-clamp svc-indicator-name"
          name={service.indicatorName}
          formattedName={service.indicatorFormattedName ?? undefined}
        />
        {!service.isActive && <span className="svc-stop-tag">Ngừng</span>}
      </span>
      <span className="svc-cell" title={service.testMethodName}>
        <span className="svc-clamp">{service.testMethodName}</span>
      </span>
      <span className="svc-unit" title={service.unit ?? undefined}>
        {service.unit || "—"}
      </span>
      <span className="svc-price-cell">
        {isEditing ? (
          <PriceEditInput
            service={service}
            initialValue={price ?? null}
            ariaLabel={priceLabel}
            onCommit={onEditCommit}
            onCancel={onEditCancel}
          />
        ) : (
          <button
            type="button"
            className={priceClass}
            // aria-disabled thay vì disabled: nút disabled nuốt sự kiện chuột phải → menu dòng không mở
            aria-disabled={!editable}
            aria-label={`Sửa ${priceLabel}`}
            title={editable ? "Bấm để sửa giá · chuột phải để xem thêm" : undefined}
            onClick={editable ? () => onStartEdit(service.id) : undefined}
          >
            <span className="svc-price-value">{pending ? (editable ? "Nhập giá" : PENDING_PRICE_LABEL) : formatPrice(price)}</span>
            {edited && <span className="svc-price-old">{formatPrice(service.priceAtDate)}</span>}
          </button>
        )}
      </span>
      <span className="svc-cell">
        <SubcontractCell service={service} />
      </span>
    </div>
  );
});

export default ServiceRow;
