import React from "react";
import { Tag } from "antd";
import { getStatusColorConfig } from "./statusColors";

interface StatusTagProps {
  color?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * StatusTag - A styled tag component with bordered style
 * Background is light, border and text are darker/same color
 */
const StatusTag: React.FC<StatusTagProps> = ({
  color = "default",
  children,
  icon,
  style,
}) => {
  const colorConfig = getStatusColorConfig(color);

  return (
    <Tag
      icon={icon}
      style={{
        color: colorConfig.text,
        backgroundColor: colorConfig.bg,
        border: "none",
        borderRadius: 18,
        padding: "2px 8px",
        minWidth: 70,
        textAlign: "center",
        margin: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        ...style,
      }}
    >
      {children}
    </Tag>
  );
};

export default StatusTag;
