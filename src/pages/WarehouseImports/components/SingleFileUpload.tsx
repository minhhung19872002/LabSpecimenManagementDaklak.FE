import React, { useState } from "react";
import { Upload, Button, message, Typography, Space } from "antd";
import { UploadOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import { api } from "../../../services/api";
import { getFileIcon, formatFileSize } from "../../../utils/fileUtils";

const { Text } = Typography;

export interface SingleFileValue {
  fileId: string;
  fileName: string;
  fileSize?: number;
}

interface SingleFileUploadProps {
  value?: SingleFileValue;
  onChange: (value: SingleFileValue | undefined) => void;
  disabled?: boolean;
  compact?: boolean;
}


const SingleFileUpload: React.FC<SingleFileUploadProps> = ({ value, onChange, disabled, compact }) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await api.upload<{ fileId: string; fileName: string; fileSize: number; url: string }>(
        "/api/v1/files/upload",
        formData
      );
      onChange({
        fileId: response.data.fileId,
        fileName: response.data.fileName,
        fileSize: response.data.fileSize,
      });
    } catch (error: any) {
      const errMsg = error?.response?.data?.error?.message || "Không thể tải lên file. Vui lòng thử lại.";
      message.error(errMsg);
    } finally {
      setUploading(false);
    }
    return false;
  };

  const baseUrl = import.meta.env.VITE_API_BASE_URL || "";

  if (value) {
    return (
      <Space size={4} style={{ width: "100%" }}>
        {getFileIcon(value.fileName)}
        <Text
          style={{ fontSize: compact ? 12 : 13, maxWidth: compact ? 90 : 200 }}
          ellipsis={{ tooltip: value.fileName }}
        >
          {value.fileName}
        </Text>
        {!compact && value.fileSize && (
          <Text type="secondary" style={{ fontSize: 11 }}>
            {formatFileSize(value.fileSize)}
          </Text>
        )}
        <Button
          type="text"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => window.open(`${baseUrl}/api/v1/files/${value.fileId}`, "_blank")}
        />
        {!disabled && (
          <Button
            type="text"
            size="small"
            icon={<DeleteOutlined style={{ color: "#ff4d4f" }} />}
            onClick={() => onChange(undefined)}
          />
        )}
      </Space>
    );
  }

  if (disabled) return <Text type="secondary">-</Text>;

  return (
    <Upload
      showUploadList={false}
      beforeUpload={handleUpload}
      accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.gif,.webp,.bmp"
    >
      <Button size="small" icon={<UploadOutlined />} loading={uploading}>
        {compact ? "Tải lên" : "Tải lên file"}
      </Button>
    </Upload>
  );
};

export default SingleFileUpload;
