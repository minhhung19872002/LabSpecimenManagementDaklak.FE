import React, { useState, useRef } from "react";
import { Upload, Button, Image, Space, Tooltip, message } from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  DeleteOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import type { UploadProps, RcFile } from "antd/es/upload/interface";
import { fileService } from "../../../../services/fileService";
import { AttachmentInfo } from "../types";
import SampleImagePreviewModal from "./SampleImagePreviewModal";

// Re-export AttachmentInfo for convenience
export type { AttachmentInfo } from "../types";

interface SampleImageUploadProps {
  attachments: AttachmentInfo[];
  onChange: (attachments: AttachmentInfo[]) => void;
  disabled?: boolean;
  maxThumbnails?: number; // Số thumbnail tối đa hiển thị (mặc định 2)
}

const SampleImageUpload: React.FC<SampleImageUploadProps> = ({
  attachments = [],
  onChange,
  disabled = false,
  maxThumbnails = 2,
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);

  // Use refs to batch files from multi-select
  const pendingFilesRef = useRef<RcFile[]>([]);
  const uploadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle multiple file upload
  const handleBeforeUpload = (file: RcFile): boolean => {
    // Validate each file
    const error = fileService.getValidationError(file);
    if (error) {
      message.error(`${file.name}: ${error}`);
      return false;
    }

    // Add file to pending batch
    pendingFilesRef.current.push(file);

    // Clear previous timeout and set new one
    // This ensures we wait until all files from the selection are collected
    if (uploadTimeoutRef.current) {
      clearTimeout(uploadTimeoutRef.current);
    }

    uploadTimeoutRef.current = setTimeout(() => {
      const filesToUpload = [...pendingFilesRef.current];
      pendingFilesRef.current = [];
      if (filesToUpload.length > 0) {
        uploadFiles(filesToUpload);
      }
    }, 100);

    return false; // Prevent default upload behavior
  };

  // Upload all pending files
  const uploadFiles = async (files: RcFile[]) => {
    if (files.length === 0) return;

    setUploading(true);

    try {
      // Upload all files at once
      const results = await fileService.uploadMultipleImages(files);

      const newAttachments: AttachmentInfo[] = results.map((result) => ({
        fileId: result.fileId,
        fileName: result.fileName,
        fileSize: result.fileSize,
        url: fileService.getFileUrl(result.fileId),
      }));

      onChange([...attachments, ...newAttachments]);
      message.success(`Đã tải ${results.length} hình ảnh thành công`);
    } catch (error: any) {
      console.error("Upload error:", error);
      message.error(error?.response?.data?.message || "Không thể tải hình ảnh");
    } finally {
      setUploading(false);
    }
  };

  // Handle remove attachment
  const handleRemove = (fileId: string) => {
    const newAttachments = attachments.filter((a) => a.fileId !== fileId);
    onChange(newAttachments);
  };

  // Get visible thumbnails and remaining count
  const visibleThumbnails = attachments.slice(0, maxThumbnails);
  const remainingCount = attachments.length - maxThumbnails;

  const uploadProps: UploadProps = {
    beforeUpload: handleBeforeUpload,
    showUploadList: false,
    accept: "image/jpeg,image/png,image/gif,image/bmp,image/webp",
    disabled: disabled || uploading,
    multiple: true,
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {/* Thumbnails */}
      <Image.PreviewGroup>
        <Space size={4}>
          {visibleThumbnails.map((attachment) => (
            <div
              key={attachment.fileId}
              style={{
                position: "relative",
                width: 32,
                height: 32,
                borderRadius: 4,
                overflow: "hidden",
                border: "1px solid #d9d9d9",
              }}
            >
              <Image
                src={attachment.url}
                alt={attachment.fileName}
                width={32}
                height={32}
                style={{ objectFit: "cover" }}
                preview={false}
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewVisible(true);
                }}
              />
              {!disabled && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                    background: "rgba(0,0,0,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: 0,
                    transition: "opacity 0.2s",
                    cursor: "pointer",
                  }}
                  className="thumbnail-overlay"
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.opacity = "1";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.opacity = "0";
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(attachment.fileId);
                  }}
                >
                  <DeleteOutlined style={{ color: "#fff", fontSize: 12 }} />
                </div>
              )}
            </div>
          ))}

          {/* Badge for remaining count */}
          {remainingCount > 0 && (
            <Tooltip title={`Xem tất cả ${attachments.length} hình`}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 4,
                  border: "1px solid #d9d9d9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#f5f5f5",
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 500,
                  color: "#666",
                }}
                onClick={() => setPreviewVisible(true)}
              >
                +{remainingCount}
              </div>
            </Tooltip>
          )}
        </Space>
      </Image.PreviewGroup>

      {/* Upload button */}
      {!disabled && (
        <Upload {...uploadProps}>
          <Tooltip title="Thêm hình ảnh">
            <Button
              type="text"
              size="small"
              icon={
                uploading ? (
                  <LoadingOutlined spin />
                ) : (
                  <PlusOutlined style={{ fontSize: 14 }} />
                )
              }
              style={{
                width: 28,
                height: 28,
                padding: 0,
                border: "1px dashed #d9d9d9",
                borderRadius: 4,
              }}
              disabled={uploading}
            />
          </Tooltip>
        </Upload>
      )}

      {/* View all button */}
      {attachments.length > 0 && (
        <Tooltip title="Xem tất cả hình ảnh">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined style={{ fontSize: 14 }} />}
            style={{
              width: 28,
              height: 28,
              padding: 0,
            }}
            onClick={() => setPreviewVisible(true)}
          />
        </Tooltip>
      )}

      {/* Preview Modal */}
      <SampleImagePreviewModal
        visible={previewVisible}
        attachments={attachments}
        onClose={() => setPreviewVisible(false)}
        onRemove={disabled ? undefined : handleRemove}
      />
    </div>
  );
};

export default SampleImageUpload;
