// @ts-nocheck
import React from "react";
import { Button, Checkbox, DatePicker, Tooltip } from "antd";
import { CloseOutlined, LockOutlined } from "../../../../components/common/Icon";
import dayjs from "dayjs";
import { IndicatorDto } from "../../../../services/masterDataService";
import { IndicatorApprovalStatus, IndicatorApprovalStatusLabels, IndicatorApprovalStatusColors } from "../../../../types/laboratoryTask";
import StatusTag from "../../../../components/common/StatusTag";
import { IndicatorName } from "../../../../components/common";

interface IndicatorRowProps {
  id: string; // IndicatorMethodKey: indicatorId_testMethodId
  isInGroup?: boolean;
  indicator: IndicatorDto | undefined;
  methodName: string; // NEW: Phương pháp thử
  methodFormattedName?: string; // NEW: Phương pháp thử có định dạng HTML
  unitPrice: number; // NEW: Giá từ TestMethodIndicator
  isChecked: boolean;
  transferDate?: dayjs.Dayjs;
  requestDate?: dayjs.Dayjs;
  approvalStatus?: IndicatorApprovalStatus; // Trạng thái duyệt từ LaboratoryTaskIndicator
  onCheckChange: (id: string) => void;
  onDateChange: (id: string, field: "transferDate" | "requestDate", value: dayjs.Dayjs | null) => void;
  onRemove: (id: string) => void;
}

const IndicatorRow: React.FC<IndicatorRowProps> = ({
  id,
  isInGroup = false,
  indicator,
  methodName,
  methodFormattedName,
  unitPrice,
  isChecked,
  transferDate,
  requestDate,
  approvalStatus,
  onCheckChange,
  onDateChange,
  onRemove,
}) => {
  if (!indicator) return null;

  // Kiểm tra xem có thể xóa indicator không
  // Không thể xóa nếu đang thử nghiệm hoặc đã có kết quả (Entered, Approved, Rejected)
  const canDelete = approvalStatus === undefined || approvalStatus === null || approvalStatus === IndicatorApprovalStatus.Pending;
  const statusLabel = approvalStatus !== undefined && approvalStatus !== null
    ? IndicatorApprovalStatusLabels[approvalStatus]
    : null;
  const statusColor = approvalStatus !== undefined && approvalStatus !== null
    ? IndicatorApprovalStatusColors[approvalStatus]
    : null;

  return (
    <div
      className="indicator-table-row"
      style={{
        paddingLeft: isInGroup ? 36 : 12,
        borderBottom: "1px solid #f5f5f5",
        background: canDelete ? "#fff" : "#fafafa",
      }}
    >
      <Checkbox
        checked={isChecked}
        onChange={() => onCheckChange(id)}
        style={{ width: 24, flexShrink: 0 }}
        disabled={!canDelete}
      />
      <Tooltip title={indicator.name}>
        <IndicatorName
          name={indicator.name}
          formattedName={indicator.formattedName}
          style={{
            flex: 1,
            minWidth: 80,
            fontSize: 13,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: canDelete ? "inherit" : "#666",
          }}
        />
      </Tooltip>
      <Tooltip title={methodName}>
        <IndicatorName
          name={methodName}
          formattedName={methodFormattedName}
          style={{
            width: 120,
            flexShrink: 0,
            fontSize: 12,
            color: canDelete ? "#1890ff" : "#999",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        />
      </Tooltip>
      <span
        style={{
          fontSize: 12,
          color: "#888",
          width: 70,
          flexShrink: 0,
          textAlign: "right",
        }}
      >
        {unitPrice?.toLocaleString("vi-VN")}đ
      </span>
      {statusLabel && (
        <StatusTag color={statusColor} style={{ fontSize: 11, flexShrink: 0, minWidth: 60 }}>
          {statusLabel}
        </StatusTag>
      )}
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
        disabled={!canDelete}
        disabledDate={(current) => {
          // Không cho chọn ngày quá khứ
          return current && current.isBefore(dayjs().startOf("day"));
        }}
      />
      {canDelete ? (
        <Button
          type="text"
          size="small"
          danger
          icon={<CloseOutlined />}
          style={{ width: 32, flexShrink: 0 }}
          onClick={() => onRemove(id)}
        />
      ) : (
        <Tooltip title="Không thể xóa chỉ tiêu đang thử nghiệm hoặc đã có kết quả">
          <Button
            type="text"
            size="small"
            icon={<LockOutlined />}
            style={{ width: 32, flexShrink: 0, color: "#999" }}
            disabled
          />
        </Tooltip>
      )}
    </div>
  );
};

export default IndicatorRow;
