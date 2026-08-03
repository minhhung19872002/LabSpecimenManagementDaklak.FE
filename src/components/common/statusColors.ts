export interface StatusColorConfig {
  bg: string;
  text: string;
}

const colorMap: Record<string, StatusColorConfig> = {
  default: { bg: "#8C8C8C", text: "#FFFFFF" },
  processing: { bg: "#1890FF", text: "#FFFFFF" },
  blue: { bg: "#1890FF", text: "#FFFFFF" },
  geekblue: { bg: "#2F54EB", text: "#FFFFFF" },
  success: { bg: "#52C41A", text: "#FFFFFF" },
  green: { bg: "#52C41A", text: "#FFFFFF" },
  warning: { bg: "#FAAD14", text: "#FFFFFF" },
  gold: { bg: "#D48806", text: "#FFFFFF" },
  orange: { bg: "#FA8C16", text: "#FFFFFF" },
  error: { bg: "#F5222D", text: "#FFFFFF" },
  red: { bg: "#F5222D", text: "#FFFFFF" },
  volcano: { bg: "#FA541C", text: "#FFFFFF" },
  purple: { bg: "#722ED1", text: "#FFFFFF" },
  cyan: { bg: "#13C2C2", text: "#FFFFFF" },
  magenta: { bg: "#EB2F96", text: "#FFFFFF" },
  pink: { bg: "#EB2F96", text: "#FFFFFF" },
  lime: { bg: "#A0D911", text: "#FFFFFF" },
};

export const getStatusColorConfig = (color: string): StatusColorConfig =>
  colorMap[color] || colorMap.default;

export const getStatusColor = (color: string): string =>
  getStatusColorConfig(color).bg;
