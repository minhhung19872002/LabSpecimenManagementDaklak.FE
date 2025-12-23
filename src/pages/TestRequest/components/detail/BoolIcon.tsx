import React from "react";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";

interface BoolIconProps {
  value: boolean;
}

const BoolIcon: React.FC<BoolIconProps> = ({ value }) => {
  return value ? (
    <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 16 }} />
  ) : (
    <CloseCircleOutlined style={{ color: "#d9d9d9", fontSize: 16 }} />
  );
};

export default BoolIcon;
