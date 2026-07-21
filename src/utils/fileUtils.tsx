import { FilePdfOutlined, FileWordOutlined, FileImageOutlined, FileOutlined } from "@ant-design/icons";

export const getFileIcon = (fileName: string, fontSize = 20) => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return <FilePdfOutlined style={{ fontSize, color: "#e74c3c" }} />;
  if (ext === "docx" || ext === "doc") return <FileWordOutlined style={{ fontSize, color: "#2b579a" }} />;
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(ext || ""))
    return <FileImageOutlined style={{ fontSize, color: "#1890ff" }} />;
  return <FileOutlined style={{ fontSize, color: "#8c8c8c" }} />;
};

export const truncateMiddle = (name: string, maxLength = 26): string => {
  if (name.length <= maxLength) return name;
  const dotIdx = name.lastIndexOf(".");
  const ext = dotIdx > 0 ? name.slice(dotIdx) : "";
  const base = dotIdx > 0 ? name.slice(0, dotIdx) : name;
  const keep = maxLength - ext.length - 3;
  const front = Math.ceil(keep / 2);
  const back = Math.floor(keep / 2);
  return base.slice(0, front) + "..." + base.slice(-back) + ext;
};

export const formatFileSize = (bytes?: number): string => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
