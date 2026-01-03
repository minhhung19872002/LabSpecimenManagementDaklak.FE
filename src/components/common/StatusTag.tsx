import React from "react";
import { Tag } from "antd";

// Define color mappings for status tags (border/text color -> background color)
const colorMap: Record<string, { border: string; bg: string; text: string }> = {
  // Default/Gray
  default: {
    border: "#8c8c8c",
    bg: "#fafafa",
    text: "#595959",
  },
  // Blue - Processing
  processing: {
    border: "#1890ff",
    bg: "#e6f7ff",
    text: "#1890ff",
  },
  blue: {
    border: "#1890ff",
    bg: "#e6f7ff",
    text: "#1890ff",
  },
  geekblue: {
    border: "#2f54eb",
    bg: "#f0f5ff",
    text: "#2f54eb",
  },
  // Green - Success
  success: {
    border: "#52c41a",
    bg: "#f6ffed",
    text: "#52c41a",
  },
  green: {
    border: "#52c41a",
    bg: "#f6ffed",
    text: "#52c41a",
  },
  // Orange/Gold - Warning
  warning: {
    border: "#faad14",
    bg: "#fffbe6",
    text: "#d48806",
  },
  gold: {
    border: "#faad14",
    bg: "#fffbe6",
    text: "#d48806",
  },
  orange: {
    border: "#fa8c16",
    bg: "#fff7e6",
    text: "#d46b08",
  },
  // Red - Error
  error: {
    border: "#ff4d4f",
    bg: "#fff2f0",
    text: "#ff4d4f",
  },
  red: {
    border: "#ff4d4f",
    bg: "#fff2f0",
    text: "#ff4d4f",
  },
  // Volcano - Warning/Cancel
  volcano: {
    border: "#ff7a45",
    bg: "#fff2e8",
    text: "#d4380d",
  },
  // Purple
  purple: {
    border: "#722ed1",
    bg: "#f9f0ff",
    text: "#722ed1",
  },
  // Cyan
  cyan: {
    border: "#13c2c2",
    bg: "#e6fffb",
    text: "#08979c",
  },
  // Magenta/Pink
  magenta: {
    border: "#eb2f96",
    bg: "#fff0f6",
    text: "#eb2f96",
  },
  pink: {
    border: "#eb2f96",
    bg: "#fff0f6",
    text: "#eb2f96",
  },
  // Lime
  lime: {
    border: "#a0d911",
    bg: "#fcffe6",
    text: "#7cb305",
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
        borderColor: colorConfig.border,
        borderWidth: 1,
        borderStyle: "solid",
        borderRadius: 18,
        paddingLeft: 8,
        paddingRight: 8,
        minWidth: 70,
        textAlign: "center",
        margin: 0,
        ...style,
      }}
    >
      {children}
    </Tag>
  );
};

export default StatusTag;