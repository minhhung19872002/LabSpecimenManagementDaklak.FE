import React from "react";
import { Tag } from "antd";

// Define color mappings for status tags - solid background with white text
const colorMap: Record<string, { bg: string; text: string }> = {
  // Default/Gray
  default: {
    bg: "#8C8C8C",
    text: "#FFFFFF",
  },
  // Blue - Processing
  processing: {
    bg: "#1890FF",
    text: "#FFFFFF",
  },
  blue: {
    bg: "#1890FF",
    text: "#FFFFFF",
  },
  geekblue: {
    bg: "#2F54EB",
    text: "#FFFFFF",
  },
  // Green - Success
  success: {
    bg: "#52C41A",
    text: "#FFFFFF",
  },
  green: {
    bg: "#52C41A",
    text: "#FFFFFF",
  },
  // Orange/Gold - Warning
  warning: {
    bg: "#FAAD14",
    text: "#FFFFFF",
  },
  gold: {
    bg: "#D48806",
    text: "#FFFFFF",
  },
  orange: {
    bg: "#FA8C16",
    text: "#FFFFFF",
  },
  // Red - Error
  error: {
    bg: "#F5222D",
    text: "#FFFFFF",
  },
  red: {
    bg: "#F5222D",
    text: "#FFFFFF",
  },
  // Volcano - Warning/Cancel
  volcano: {
    bg: "#FA541C",
    text: "#FFFFFF",
  },
  // Purple
  purple: {
    bg: "#722ED1",
    text: "#FFFFFF",
  },
  // Cyan
  cyan: {
    bg: "#13C2C2",
    text: "#FFFFFF",
  },
  // Magenta/Pink
  magenta: {
    bg: "#EB2F96",
    text: "#FFFFFF",
  },
  pink: {
    bg: "#EB2F96",
    text: "#FFFFFF",
  },
  // Lime
  lime: {
    bg: "#A0D911",
    text: "#FFFFFF",
  },
};

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
  const colorConfig = colorMap[color] || colorMap.default;

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
