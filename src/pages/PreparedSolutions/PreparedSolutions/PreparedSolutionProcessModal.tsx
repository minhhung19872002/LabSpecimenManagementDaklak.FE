import React, { useEffect, useState } from "react";
import { Button, Form, Image, Input, Modal, Space, Typography, Upload, message } from "antd";
import { PlusOutlined, CloseOutlined } from "@ant-design/icons";
import {
  PreparedSolutionBatchDto,
  preparedSolutionService,
} from "../../../services/preparedSolutionService";
import { fileService } from "../../../services/fileService";

export interface PreparedSolutionProcessModalProps {
  open: boolean;
  item?: PreparedSolutionBatchDto;
  onClose: () => void;
  onProcessed: () => void;
}

interface UploadedImage {
  fileId: string;
  url: string;
}

const PreparedSolutionProcessModal: React.FC<PreparedSolutionProcessModalProps> = ({
  open,
  item,
  onClose,
  onProcessed,
}) => {
  const [note, setNote] = useState("");
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setNote("");
      setImages([]);
    }
  }, [open]);

  const handleUpload = async (file: File, fileList: File[]) => {
    const remaining = 5 - images.length;
    const idx = fileList.indexOf(file);

    if (idx === 0 && fileList.length > remaining) {
      message.warning(
        remaining <= 0
          ? "Đã đạt tối đa 5 hình ảnh."
          : `Chỉ có thể thêm ${remaining} hình nữa.`
      );
    }
    if (idx >= remaining) return false;

    if (!file.type.startsWith("image/")) {
      message.error(`${file.name}: Chỉ chấp nhận file hình ảnh`);
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      message.error(`${file.name}: Kích thước tối đa 10MB`);
      return false;
    }

    setUploading(true);
    try {
      const result = await fileService.uploadImage(file);
      const url = fileService.getFileUrl(result.fileId);
      setImages((prev) => (prev.length >= 5 ? prev : [...prev, { fileId: result.fileId, url }]));
    } catch {
      message.error(`Upload ${file.name} thất bại`);
    } finally {
      setUploading(false);
    }
    return false;
  };

  const handleRemove = (fileId: string) => {
    setImages((prev) => prev.filter((i) => i.fileId !== fileId));
  };

  const handleSubmit = async () => {
    if (!item) return;
    if (!note.trim()) {
      message.error("Vui lòng nhập mô tả chi tiết");
      return;
    }
    setSubmitting(true);
    try {
      await preparedSolutionService.process(item.id, {
        note: note.trim(),
        imageUrls: images.map((i) => i.url),
      });
      onProcessed();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Xác nhận xử lý dung dịch pha"
      width={680}
      centered
      onCancel={onClose}
      destroyOnClose
      footer={
        <Space>
          <Button onClick={onClose}>Hủy</Button>
          <Button type="primary" loading={submitting} onClick={handleSubmit}>
            Xác nhận
          </Button>
        </Space>
      }
    >
      <Form layout="vertical" style={{ marginTop: 8 }}>
        {/* Dung dịch pha info */}
        {item && (
          <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <Typography.Text type="secondary">Dung dịch pha</Typography.Text>
            <Typography.Text strong>{item.solutionProductName}</Typography.Text>
          </div>
        )}

        {/* Mô tả chi tiết */}
        <Form.Item label="Mô tả chi tiết" required style={{ marginBottom: 16 }}>
          <Input.TextArea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            maxLength={1000}
            showCount
            placeholder="Nhập thông tin xử lý dung dịch pha"
          />
        </Form.Item>

        {/* Hình ảnh đính kèm */}
        <Form.Item
          label={
            <Typography.Text>
              Hình ảnh đính kèm{" "}
              <Typography.Text type="secondary" style={{ fontWeight: 400 }}>
                (Tùy chọn, tối đa 5 ảnh)
              </Typography.Text>
            </Typography.Text>
          }
          style={{ marginBottom: 0 }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {/* Uploaded images */}
            <Image.PreviewGroup>
              {images.map((img, index) => (
                <div key={img.fileId} style={{ position: "relative", display: "inline-block" }}>
                  <Image
                    src={img.url}
                    alt={`Hình ${index + 1}`}
                    style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 6 }}
                  />
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<CloseOutlined />}
                    onClick={() => handleRemove(img.fileId)}
                    style={{
                      position: "absolute",
                      top: -8,
                      right: -8,
                      background: "white",
                      borderRadius: "50%",
                      padding: 0,
                      width: 20,
                      height: 20,
                      minWidth: 20,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    }}
                  />
                </div>
              ))}
            </Image.PreviewGroup>

            {/* Upload button — dashed box style */}
            {images.length < 5 && (
              <Upload
                accept="image/*"
                multiple
                showUploadList={false}
                beforeUpload={handleUpload}
                disabled={uploading}
              >
                <div
                  style={{
                    width: 100,
                    height: 100,
                    border: "1px dashed #d9d9d9",
                    borderRadius: 6,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: uploading ? "not-allowed" : "pointer",
                    background: "#fafafa",
                    gap: 4,
                    opacity: uploading ? 0.5 : 1,
                  }}
                >
                  <PlusOutlined style={{ fontSize: 20, color: "#8c8c8c" }} />
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    Upload
                  </Typography.Text>
                </div>
              </Upload>
            )}
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PreparedSolutionProcessModal;
