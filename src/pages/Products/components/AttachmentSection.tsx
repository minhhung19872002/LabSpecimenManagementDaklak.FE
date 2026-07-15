import React from "react";
import { Upload, Button, message, Typography } from "antd";
import { UploadOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import { productService, ProductAttachmentDto, CreateProductAttachmentDto } from "../../../services/productService";
import { getFileIcon, formatFileSize } from "../../../utils/fileUtils";

const { Text } = Typography;
const { Dragger } = Upload;

interface AttachmentSectionProps {
  existingAttachments: ProductAttachmentDto[];
  newAttachments: CreateProductAttachmentDto[];
  onAddAttachment: (att: CreateProductAttachmentDto) => void;
  onRemoveExisting: (attachmentId: string) => void;
  onRemoveNew: (fileId: string) => void;
}


const FileCard: React.FC<{
  fileName: string;
  fileSize?: number;
  fileType?: string;
  onPreview?: () => void;
  onRemove: () => void;
}> = ({ fileName, fileSize, fileType, onPreview, onRemove }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "10px 14px",
      border: "1px solid #f0f0f0",
      borderRadius: 10,
      marginBottom: 8,
      background: "#fff",
      boxShadow: "0 1px 4px rgba(0, 0, 0, 0.06)",
    }}
  >
    {/* File icon */}
    <div
      style={{
        width: 42,
        height: 42,
        borderRadius: 8,
        background: "#FEF2F2",
        border: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {getFileIcon(fileName)}
    </div>

    {/* File info */}
    <div style={{ flex: 1, minWidth: 0 }}>
      <Text strong style={{ fontSize: 13, display: "block" }} ellipsis>
        {fileName}
      </Text>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 2 }}>
        {fileType && (
          <Text type="secondary" style={{ fontSize: 11 }}>
            Loại: {fileType}
          </Text>
        )}
        {fileSize && (
          <Text type="secondary" style={{ fontSize: 11 }}>
            {formatFileSize(fileSize)}
          </Text>
        )}
      </div>
    </div>

    {/* Actions */}
    <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
      {onPreview && (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={onPreview} style={{ color: "#1677ff", fontSize: 13 }}>
          Xem trước
        </Button>
      )}
      <Button
        type="text"
        size="small"
        icon={<DeleteOutlined />}
        onClick={onRemove}
        style={{ color: "#ff4d4f" }}
      />
    </div>
  </div>
);

const AttachmentSection: React.FC<AttachmentSectionProps> = ({
  existingAttachments,
  newAttachments,
  onAddAttachment,
  onRemoveExisting,
  onRemoveNew,
}) => {
  const handleUpload = async (file: File) => {
    try {
      const result = await productService.uploadFile(file);
      onAddAttachment({
        fileId: result.fileId,
        fileName: result.fileName,
        fileSize: result.fileSize,
      });
      message.success(`Đã tải lên ${file.name}`);
    } catch (error: any) {
      console.error("Upload error:", error, error?.response?.data);
      const errMsg = error?.response?.data?.error?.message || "Không thể tải lên file. Vui lòng thử lại.";
      message.error(errMsg);
    }
    return false;
  };

  const baseUrl = import.meta.env.VITE_API_BASE_URL || "";

  return (
    <div>
      <Dragger
        multiple
        showUploadList={false}
        beforeUpload={(file) => {
          handleUpload(file);
          return false;
        }}
        accept=".pdf,.docx,.jpg,.jpeg,.png"
        style={{ marginBottom: 12, borderRadius: 8 }}
      >
        <p className="ant-upload-drag-icon">
          <UploadOutlined style={{ fontSize: 32, color: "#bbb" }} />
        </p>
        <p className="ant-upload-text" style={{ fontSize: 13, margin: 0 }}>
          Kéo thả file hoặc <strong>nhấn để tải lên</strong>
        </p>
        <p className="ant-upload-hint" style={{ fontSize: 12, margin: "4px 0 0", color: "#999" }}>
          Hỗ trợ PDF, DOCX, JPG (Tối đa 10MB)
        </p>
      </Dragger>

      {/* Existing attachments */}
      {existingAttachments.map((att) => (
        <FileCard
          key={att.id}
          fileName={att.fileName}
          fileSize={att.fileSize}
          fileType={att.fileType}
          onPreview={() => window.open(`${baseUrl}${att.url}`, "_blank")}
          onRemove={() => onRemoveExisting(att.id)}
        />
      ))}

      {/* New attachments */}
      {newAttachments.map((att) => (
        <FileCard
          key={att.fileId}
          fileName={att.fileName}
          fileSize={att.fileSize}
          fileType={att.fileType}
          onRemove={() => onRemoveNew(att.fileId)}
        />
      ))}
    </div>
  );
};

export default AttachmentSection;
