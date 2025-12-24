// @ts-nocheck
import React from "react";
import { Button, Checkbox, DatePicker, Tooltip } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { IndicatorDto } from "../../../../services/masterDataService";

interface IndicatorRowProps {
  id: string; // IndicatorMethodKey: indicatorId_testMethodId
  isInGroup?: boolean;
  indicator: IndicatorDto | undefined;
  methodName: string; // NEW: Phương pháp thử
  unitPrice: number; // NEW: Giá từ TestMethodIndicator
  isChecked: boolean;
  transferDate?: dayjs.Dayjs;
  requestDate?: dayjs.Dayjs;
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
  onCheckChange,
  onDateChange,
  onRemove,
}) => {
  if (!indicator) return null;

  return (
    <div
      style={{
        padding: isInGroup ? "8px 12px 8px 36px" : "8px 12px",
        borderBottom: "1px solid #f5f5f5",
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "#fff",
      }}
    >
      <Checkbox
        checked={isChecked}
        onChange={() => onCheckChange(id)}
        style={{ width: 24 }}
      />
      <Tooltip title={indicator.name}>
        <span
          style={{
            flex: 1,
            fontSize: 13,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
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
            color: "#1890ff",
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
        disabledDate={(current) => {
          // Không cho chọn ngày quá khứ
          return current && current.isBefore(dayjs().startOf("day"));
        }}
      />
      <Button
        type="text"
        size="small"
        danger
        icon={<CloseOutlined />}
        style={{ width: 32 }}
        onClick={() => onRemove(id)}
      />
    </div>
  );
};

export default IndicatorRow;
