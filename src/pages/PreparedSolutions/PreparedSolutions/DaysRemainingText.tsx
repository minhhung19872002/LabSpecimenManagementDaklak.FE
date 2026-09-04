import React from "react";
import { Typography } from "antd";

export interface DaysRemainingTextProps {
  expiryDate?: string;
  daysRemaining: number;
}

/** Dòng phụ dưới hạn dùng: "còn X ngày" / "hôm nay" / "quá X ngày" */
const DaysRemainingText: React.FC<DaysRemainingTextProps> = ({ expiryDate, daysRemaining }) => {
  if (!expiryDate) return null;
  if (daysRemaining < 0) {
    return (
      <Typography.Text type="danger" style={{ fontSize: 11 }}>
        quá {Math.abs(daysRemaining)} ngày
      </Typography.Text>
    );
  }
  if (daysRemaining === 0) {
    return (
      <Typography.Text type="warning" style={{ fontSize: 11 }}>
        hôm nay
      </Typography.Text>
    );
  }
  const textType = daysRemaining < 30 ? "warning" : "secondary";
  return (
    <Typography.Text type={textType} style={{ fontSize: 11 }}>
      còn {daysRemaining} ngày
    </Typography.Text>
  );
};

export default DaysRemainingText;
