// @ts-nocheck
import React from "react";
import { Button, Checkbox, DatePicker, Tooltip, Tag } from "antd";
import { CloseOutlined, LockOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { IndicatorDto } from "../../../../services/masterDataService";
import { IndicatorApprovalStatus, IndicatorApprovalStatusLabels, IndicatorApprovalStatusColors } from "../../../../types/laboratoryTask";

interface IndicatorRowProps {
  id: string; // IndicatorMethodKey: indicatorId_testMethodId
  isInGroup?: boolean;
  indicator: IndicatorDto | undefined;
  methodName: string; // NEW: Phương pháp thử
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
      style={{
        padding: isInGroup ? "8px 12px 8px 36px" : "8px 12px",
        borderBottom: "1px solid #f5f5f5",
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: canDelete ? "#fff" : "#fafafa",
      }}
    >
      <Checkbox
        checked={isChecked}
        onChange={() => onCheckChange(id)}
        style={{ width: 24 }}
        disabled={!canDelete}
      />
      <Tooltip title={indicator.name}>
        <span
          style={{
            flex: 1,
            fontSize: 13,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: canDelete ? "inherit" : "#666",
          }}
        >
          {indicator.name}
        </span>
      </Tooltip>
      <Tooltip title={methodName}>
        <span
          style={{
            width: 150,
            fontSize: 12,
            color: canDelete ? "#1890ff" : "#999",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {methodName}
        </span>
      </Tooltip>
      <span
        style={{
          fontSize: 12,
          color: "#888",
          width: 80,
          textAlign: "right",
        }}
      >
        {unitPrice?.toLocaleString("vi-VN")}đ
      </span>
      {statusLabel && (
        <Tag color={statusColor} style={{ margin: 0, fontSize: 11 }}>
          {statusLabel}
        </Tag>
      )}
      <DatePicker
        value={transferDate}
        onChange={(date) => onDateChange(id, "transferDate", date)}
        format="DD/MM/YYYY"
        size="small"
        style={{ width: 110 }}
        placeholder="Chuyển giao"
        disabled // Ngày chuyển giao disabled, auto-set ngày hiện tại
      />
      <DatePicker
        value={requestDate}
        onChange={(date) => onDateChange(id, "requestDate", date)}
        format="DD/MM/YYYY"
        size="small"
        style={{ width: 110 }}
        placeholder="Yêu cầu"
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
          style={{ width: 32 }}
          onClick={() => onRemove(id)}
        />
      ) : (
        <Tooltip title="Không thể xóa chỉ tiêu đang thử nghiệm hoặc đã có kết quả">
          <Button
            type="text"
            size="small"
            icon={<LockOutlined />}
            style={{ width: 32, color: "#999" }}
            disabled
          />
        </Tooltip>
      )}
    </div>
  );
};

export default IndicatorRow;
