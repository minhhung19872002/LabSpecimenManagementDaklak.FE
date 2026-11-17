// @ts-nocheck
import React, { useState, useRef, useCallback } from "react";
import { Button, Checkbox, DatePicker, InputNumber, Tag, Tooltip } from "antd";
import {
  CloseOutlined,
  EditOutlined,
  LockOutlined,
} from "../../../../components/common/Icon";
import type { CustomIndicatorName } from "../../../../utils/indicatorName";
import dayjs from "dayjs";
import { IndicatorDto } from "../../../../services/masterDataService";
import {
  IndicatorApprovalStatus,
  IndicatorApprovalStatusLabels,
  IndicatorApprovalStatusColors,
} from "../../../../types/laboratoryTask";
import StatusTag from "../../../../components/common/StatusTag";
import { IndicatorName } from "../../../../components/common";

// Component hiển thị tooltip chỉ khi text bị cắt (ellipsis)
interface TruncateTooltipProps {
  title: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const TruncateTooltip: React.FC<TruncateTooltipProps> = ({
  title,
  children,
  style,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  const handleMouseEnter = useCallback(() => {
    if (containerRef.current) {
      const { scrollWidth, clientWidth } = containerRef.current;
      setShowTooltip(scrollWidth > clientWidth);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setShowTooltip(false);
  }, []);

  return (
    <Tooltip title={title} open={showTooltip} placement="topLeft">
      <span
        ref={containerRef}
        style={style}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </span>
    </Tooltip>
  );
};

interface IndicatorRowProps {
  id: string; // IndicatorMethodKey: indicatorId_testMethodId
  isInGroup?: boolean;
  indicator: IndicatorDto | undefined;
  methodName: string; // NEW: Phương pháp thử
  methodFormattedName?: string; // NEW: Phương pháp thử có định dạng HTML
  isSubcontract?: boolean;
  unitPrice: number; // NEW: Giá từ TestMethodIndicator
  isFree?: boolean; // Miễn phí do combo kim loại nặng
  isChecked: boolean;
  transferDate?: dayjs.Dayjs;
  requestDate?: dayjs.Dayjs;
  approvalStatus?: IndicatorApprovalStatus; // Trạng thái duyệt từ LaboratoryTaskIndicator
  isSentToQLKT?: boolean; // Đã gửi đến QLKT
  sentToDepartment?: boolean; // Đã gửi đến khoa phòng
  onCheckChange: (id: string) => void;
  onDateChange: (
    id: string,
    field: "transferDate" | "requestDate",
    value: dayjs.Dayjs | null,
  ) => void;
  onRemove: (id: string) => void;
  onPriceChange?: (id: string, price: number) => void;
  // Sub-indicator props
  isSubIndicator?: boolean;
  isFirstSub?: boolean;
  isLastSub?: boolean;
  hidePrice?: boolean;
  hideDates?: boolean;
  onRemoveSub?: (id: string) => void;
  isRequestCompleted?: boolean;
  /** Tên chỉ tiêu trên phiếu (thay tên danh mục khi hiển thị) */
  customName?: CustomIndicatorName;
  /** Tên trên phiếu khác tên danh mục */
  isNameEdited?: boolean;
  /** Có → hiện nút sửa tên (chỉ admin) */
  onEditName?: (id: string) => void;
}

const IndicatorRow: React.FC<IndicatorRowProps> = ({
  id,
  isInGroup = false,
  indicator,
  methodName,
  methodFormattedName,
  isSubcontract,
  unitPrice,
  isFree,
  isChecked,
  transferDate,
  requestDate,
  approvalStatus,
  isSentToQLKT,
  sentToDepartment,
  onCheckChange,
  onDateChange,
  onRemove,
  onPriceChange,
  // Sub-indicator props
  isSubIndicator = false,
  isFirstSub = false,
  isLastSub = false,
  hidePrice = false,
  hideDates = false,
  onRemoveSub,
  isRequestCompleted = false,
  customName,
  isNameEdited = false,
  onEditName,
}) => {
  if (!indicator) return null;

  const displayName = customName?.name ?? indicator.name;
  const displayFormattedName = customName?.formattedName ?? indicator.formattedName;

  // Kiểm tra xem có thể xóa/sửa indicator không
  // Lock nếu đã gửi tới khoa phòng (có approvalStatus hoặc isSentToQLKT)
  const canDelete =
    (approvalStatus === undefined || approvalStatus === null) &&
    !isSentToQLKT &&
    !sentToDepartment;
  const canReassign = approvalStatus === IndicatorApprovalStatus.Pending;
  const statusLabel =
    approvalStatus !== undefined && approvalStatus !== null
      ? IndicatorApprovalStatusLabels[approvalStatus]
      : null;
  const statusColor =
    approvalStatus !== undefined && approvalStatus !== null
      ? IndicatorApprovalStatusColors[approvalStatus]
      : null;

  // Build class names for tree-line styling
  const classNames = ["indicator-table-row"];
  if (isSubIndicator) {
    classNames.push("is-sub-indicator");
    if (isFirstSub) classNames.push("is-first-sub");
    if (isLastSub) classNames.push("is-last-sub");
  }

  return (
    <div
      className={classNames.join(" ")}
      style={{
        paddingLeft: isSubIndicator ? 48 : isInGroup ? 36 : 12,
        borderBottom: "1px solid #f5f5f5",
        background: isSubIndicator ? "#fafafa" : canDelete ? "#fff" : "#fafafa",
      }}
    >
      {/* Checkbox - hidden for sub-indicators (they follow parent) */}
      {isSubIndicator ? (
        <span />
      ) : (
        <Checkbox
          checked={isChecked}
          onChange={() => onCheckChange(id)}
          style={{ width: 24, flexShrink: 0 }}
          disabled={!canDelete && !canReassign}
        />
      )}
      <div
        style={{
          flex: 1,
          minWidth: 80,
          display: "flex",
          alignItems: "center",
          gap: 6,
          overflow: "hidden",
        }}
      >
        <TruncateTooltip
          title={displayName}
          style={{
            fontSize: 13,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: canDelete ? "inherit" : "#666",
          }}
        >
          <IndicatorName
            name={displayName}
            formattedName={displayFormattedName}
          />
        </TruncateTooltip>
        {onEditName && (
          <Tooltip
            title={
              isNameEdited
                ? `Đã sửa tên trên phiếu (danh mục: ${indicator.name})`
                : "Sửa tên chỉ tiêu trên phiếu"
            }
          >
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              style={{
                flexShrink: 0,
                width: 22,
                height: 22,
                color: isNameEdited ? "#fa8c16" : "#8c8c8c",
              }}
              onClick={() => onEditName(id)}
            />
          </Tooltip>
        )}
        {isSubcontract && (
          <Tag color="orange" style={{ fontSize: 12, lineHeight: "20px", padding: "0 6px", margin: 0, flexShrink: 0 }}>
            HĐ phụ
          </Tag>
        )}
        {statusLabel && (
          <StatusTag
            color={statusColor}
            style={{ fontSize: 11, flexShrink: 0 }}
          >
            {statusLabel}
          </StatusTag>
        )}
      </div>
      {/* Method name - hidden for sub-indicators (only show name) */}
      {!isSubIndicator && (
        <div style={{ width: 120, flexShrink: 0, overflow: "hidden" }}>
          <TruncateTooltip
            title={methodName}
            style={{
              fontSize: 12,
              color: canDelete ? "#1890ff" : "#999",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <IndicatorName name={methodName} formattedName={methodFormattedName} />
          </TruncateTooltip>
        </div>
      )}
      {/* Đơn giá - hidden for sub-indicators (only show name) */}
      {!isSubIndicator && (
        !hidePrice ? (
          <div style={{ width: 110, flexShrink: 0 }}>
            <InputNumber
              value={unitPrice}
              min={0}
              size="small"
              style={{ width: "100%", height: 32 }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => Number(value?.replace(/,/g, '') || 0)}
              onChange={(value) => onPriceChange?.(id, value ?? 0)}
            />
          </div>
        ) : (
          <span style={{ width: 110, flexShrink: 0 }} />
        )
      )}
      {/* Ngày CG/YC - hidden for sub-indicators (only show name) */}
      {!isSubIndicator && (
        !hideDates ? (
          <>
            <DatePicker
              value={transferDate}
              onChange={(date) => onDateChange(id, "transferDate", date)}
              format="DD/MM/YYYY"
              size="small"
              style={{ width: 100, flexShrink: 0 }}
              placeholder="CG"
              disabled // Ngày chuyển giao disabled, auto-set ngày hiện tại
            />
            <DatePicker
              value={requestDate}
              onChange={(date) => onDateChange(id, "requestDate", date)}
              format="DD/MM/YYYY"
              size="small"
              style={{ width: 100, flexShrink: 0 }}
              placeholder="YC"
              disabled={isRequestCompleted}
              disabledDate={(current) => {
                // Không cho chọn ngày quá khứ
                return current && current.isBefore(dayjs().startOf("day"));
              }}
            />
          </>
        ) : (
          <span style={{ width: 200, flexShrink: 0 }} />
        )
      )}
      {/* Nút xóa - hidden for sub-indicators (only parent can be removed) */}
      {!isSubIndicator && (
        canDelete ? (
          <Button
            type="text"
            size="small"
            danger
            icon={<CloseOutlined />}
            style={{ width: 32, flexShrink: 0 }}
            onClick={() => onRemove(id)}
          />
        ) : (
          <Tooltip title="Không thể xóa chỉ tiêu đã gửi tới khoa phòng">
            <Button
              type="text"
              size="small"
              icon={<LockOutlined />}
              style={{ width: 32, flexShrink: 0, color: "#999" }}
              disabled
            />
          </Tooltip>
        )
      )}
    </div>
  );
};

export default IndicatorRow;
