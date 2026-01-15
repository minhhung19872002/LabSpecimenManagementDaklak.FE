import React, { useState } from "react";
import { Modal, Image, Button, Space, Typography, Tooltip, Empty } from "antd";
import {
  LeftOutlined,
  RightOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from "../../../../components/common/Icon";
import { AttachmentInfo } from "../types";
import { fileService } from "../../../../services/fileService";

const { Text } = Typography;

interface SampleImagePreviewModalProps {
  visible: boolean;
  attachments: AttachmentInfo[];
  onClose: () => void;
  onRemove?: (fileId: string) => void;
}

const SampleImagePreviewModal: React.FC<SampleImagePreviewModalProps> = ({
  visible,
  attachments,
  onClose,
  onRemove,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scale, setScale] = useState(1);

  // Reset when modal opens
  React.useEffect(() => {
    if (visible) {
      setCurrentIndex(0);
      setScale(1);
    }
  }, [visible]);

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!visible) return;

      switch (e.key) {
        case "ArrowLeft":
          handlePrev();
          break;
        case "ArrowRight":
          handleNext();
          break;
        case "Escape":
          onClose();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [visible, currentIndex, attachments.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : attachments.length - 1));
    setScale(1);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < attachments.length - 1 ? prev + 1 : 0));
    setScale(1);
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleDownload = async () => {
    if (attachments[currentIndex]) {
      const attachment = attachments[currentIndex];
      try {
        const blob = await fileService.downloadFile(attachment.fileId);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = attachment.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Download error:", error);
      }
    }
  };

  const handleRemove = () => {
    if (onRemove && attachments[currentIndex]) {
      const fileId = attachments[currentIndex].fileId;
      onRemove(fileId);

      // Adjust index if needed
      if (attachments.length <= 1) {
        onClose();
      } else if (currentIndex >= attachments.length - 1) {
        setCurrentIndex(attachments.length - 2);
      }
    }
  };

  const currentAttachment = attachments[currentIndex];

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={900}
      centered
      title={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingRight: 40 }}>
          <span>Xem hình ảnh mẫu</span>
          {attachments.length > 0 && (
            <Text type="secondary" style={{ fontWeight: "normal", fontSize: 14 }}>
              {currentIndex + 1} / {attachments.length}
            </Text>
          )}
        </div>
      }
      bodyStyle={{ padding: 0 }}
    >
      {attachments.length === 0 ? (
        <div style={{ padding: 40 }}>
          <Empty description="Chưa có hình ảnh nào" />
        </div>
      ) : (
        <div>
          {/* Main Image Area */}
          <div
            style={{
              position: "relative",
              background: "#f5f5f5",
              minHeight: 400,
              maxHeight: 500,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {/* Previous Button */}
            {attachments.length > 1 && (
              <Button
                type="text"
                icon={<LeftOutlined />}
                onClick={handlePrev}
                style={{
                  position: "absolute",
                  left: 16,
                  zIndex: 10,
                  background: "rgba(255,255,255,0.8)",
                  borderRadius: "50%",
                  width: 40,
                  height: 40,
                }}
              />
            )}

            {/* Image */}
            <div
              style={{
                transition: "transform 0.2s",
                transform: `scale(${scale})`,
              }}
            >
              <Image
                src={currentAttachment?.url}
                alt={currentAttachment?.fileName}
                style={{
                  maxWidth: "100%",
                  maxHeight: 500,
                  objectFit: "contain",
                }}
                preview={false}
              />
            </div>

            {/* Next Button */}
            {attachments.length > 1 && (
              <Button
                type="text"
                icon={<RightOutlined />}
                onClick={handleNext}
                style={{
                  position: "absolute",
                  right: 16,
                  zIndex: 10,
                  background: "rgba(255,255,255,0.8)",
                  borderRadius: "50%",
                  width: 40,
                  height: 40,
                }}
              />
            )}
          </div>

          {/* Toolbar */}
          <div
            style={{
              padding: "12px 16px",
              borderTop: "1px solid #f0f0f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* File Info */}
            <div style={{ flex: 1, overflow: "hidden" }}>
              <Text
                ellipsis
                style={{ display: "block", maxWidth: 300 }}
                title={currentAttachment?.fileName}
              >
                {currentAttachment?.fileName}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {currentAttachment && fileService.formatFileSize(currentAttachment.fileSize)}
              </Text>
            </div>

            {/* Actions */}
            <Space>
              <Tooltip title="Thu nhỏ">
                <Button
                  type="text"
                  icon={<ZoomOutOutlined />}
                  onClick={handleZoomOut}
                  disabled={scale <= 0.5}
                />
              </Tooltip>
              <Text style={{ minWidth: 50, textAlign: "center" }}>
                {Math.round(scale * 100)}%
              </Text>
              <Tooltip title="Phóng to">
                <Button
                  type="text"
                  icon={<ZoomInOutlined />}
                  onClick={handleZoomIn}
                  disabled={scale >= 3}
                />
              </Tooltip>
              <Tooltip title="Tải xuống">
                <Button
                  type="text"
                  icon={<DownloadOutlined />}
                  onClick={handleDownload}
                />
              </Tooltip>
              {onRemove && (
                <Tooltip title="Xóa hình ảnh">
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={handleRemove}
                  />
                </Tooltip>
              )}
            </Space>
          </div>

          {/* Thumbnails */}
          {attachments.length > 1 && (
            <div
              style={{
                padding: "12px 16px",
                borderTop: "1px solid #f0f0f0",
                background: "#fafafa",
                overflowX: "auto",
              }}
            >
              <Space size={8}>
                {attachments.map((attachment, index) => (
                  <div
                    key={attachment.fileId}
                    onClick={() => {
                      setCurrentIndex(index);
                      setScale(1);
                    }}
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 4,
                      overflow: "hidden",
                      border:
                        index === currentIndex
                          ? "2px solid #1890ff"
                          : "2px solid transparent",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={attachment.url}
                      alt={attachment.fileName}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                ))}
              </Space>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default SampleImagePreviewModal;
