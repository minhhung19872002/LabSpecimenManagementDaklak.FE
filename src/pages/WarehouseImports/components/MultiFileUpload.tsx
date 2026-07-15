import React, { useState } from "react";
import { Upload, Button, Typography, message } from "antd";
import { UploadOutlined, EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import { api } from "../../../services/api";
import { DeliveryDocumentFileDto } from "../../../services/warehouseImportReceiptService";
import { getFileIcon, formatFileSize } from "../../../utils/fileUtils";

const { Text } = Typography;

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export interface MultiFileUploadProps {
  value: DeliveryDocumentFileDto[];
  onChange: (files: DeliveryDocumentFileDto[]) => void;
  disabled?: boolean;
  maxFiles?: number;
  accept?: string;
}

const MultiFileUpload: React.FC<MultiFileUploadProps> = ({
  value,
  onChange,
  disabled = false,
  maxFiles = 5,
  accept = ".pdf,.jpg,.jpeg,.png,.gif,.webp,.bmp,.docx",
}) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File, allFiles: File[]) => {
    // Chỉ xử lý ở file đầu tiên, batch toàn bộ danh sách
    if (allFiles.indexOf(file) !== 0) return false;

    const remainingSlots = maxFiles - value.length;
    if (remainingSlots <= 0) {
      message.warning(`Đã đạt tối đa ${maxFiles} file`);
      return false;
    }

    const filesToUpload = allFiles.slice(0, remainingSlots);
    if (allFiles.length > remainingSlots) {
      message.warning(`Chỉ có thể thêm ${remainingSlots} file nữa, đã bỏ qua ${allFiles.length - remainingSlots} file`);
    }

    setUploading(true);
    try {
      const formData = new FormData();
      filesToUpload.forEach((f) => formData.append("files", f));
      const res = await api.upload<{ fileId: string; fileName: string; fileSize: number }[]>(
        "/api/v1/files/upload-multiple",
        formData
      );
      onChange([...value, ...res.data.map((r) => ({ fileId: r.fileId, fileName: r.fileName, fileSize: r.fileSize }))]);
    } catch (err: any) {
      message.error(err?.response?.data?.error?.message || "Tải file thất bại");
    } finally {
      setUploading(false);
    }
    return false;
  };

  const handleRemove = (fileId: string) => {
    onChange(value.filter((f) => f.fileId !== fileId));
  };

  return (
    <div>
      {!disabled && value.length < maxFiles && (
        <Upload
          multiple
          showUploadList={false}
          beforeUpload={(file, list) => { handleUpload(file, list); return false; }}
          accept={accept}
          disabled={uploading}
        >
          <Button
            icon={<UploadOutlined />}
            loading={uploading}
            style={{ marginBottom: value.length > 0 ? 8 : 0 }}
          >
            Tải lên file{" "}
            {value.length > 0 && (
              <span style={{ color: "#8c8c8c", fontWeight: 400 }}>
                ({value.length}/{maxFiles})
              </span>
            )}
          </Button>
        </Upload>
      )}
      {value.map((f) => (
        <div
          key={f.fileId}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 12px", border: "1px solid #f0f0f0", borderRadius: 8,
            marginBottom: 6, background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{
            width: 30, height: 30, borderRadius: 6, background: "#FEF2F2",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            {getFileIcon(f.fileName, 16)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text strong style={{ fontSize: 12, display: "block" }} ellipsis={{ tooltip: f.fileName }}>
              {f.fileName}
            </Text>
            {f.fileSize && (
              <Text type="secondary" style={{ fontSize: 11 }}>{formatFileSize(f.fileSize)}</Text>
            )}
          </div>
          <Button
            type="text" size="small" icon={<EyeOutlined />}
            onClick={() => window.open(`${BASE_URL}/api/v1/files/${f.fileId}`, "_blank")}
          />
          {!disabled && (
            <Button
              type="text" size="small"
              icon={<DeleteOutlined style={{ color: "#ff4d4f" }} />}
              onClick={() => handleRemove(f.fileId)}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default MultiFileUpload;
