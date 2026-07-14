import React, { useEffect, useState } from "react";
import { Button, Image, Input, Modal, Space, Upload, message } from "antd";
import { PlusOutlined, CloseOutlined } from "@ant-design/icons";
import { CompleteSupplementaryTaskDto, SupplementaryTaskDto } from "../../../services/supplementaryTaskService";
import { fileService } from "../../../services/fileService";

interface UploadedImage {
  fileId: string;
  url: string;
}

export interface SupplementaryTaskCompleteModalProps {
  open: boolean;
  item?: SupplementaryTaskDto;
  completing: boolean;
  onConfirm: (id: string, input: CompleteSupplementaryTaskDto) => Promise<void>;
  onClose: () => void;
}

const SupplementaryTaskCompleteModal: React.FC<SupplementaryTaskCompleteModalProps> = ({
  open, item, completing, onConfirm, onClose,
}) => {
  const [note, setNote] = useState("");
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) {
      setNote("");
      setImages([]);
    }
  }, [open]);

  const handleUpload = async (file: File, fileList: File[]) => {
    const remaining = 5 - images.length;
    const idx = fileList.indexOf(file);
    if (idx === 0 && fileList.length > remaining) {
      message.warning(remaining <= 0 ? "Đã đạt tối đa 5 hình ảnh." : `Chỉ có thể thêm ${remaining} hình nữa.`);
    }
    if (idx >= remaining) return false;
    if (!file.type.startsWith("image/")) { message.error(`${file.name}: Chỉ chấp nhận file hình ảnh`); return false; }
    if (file.size > 10 * 1024 * 1024) { message.error(`${file.name}: Kích thước tối đa 10MB`); return false; }

    setUploading(true);
    try {
      const result = await fileService.uploadImage(file);
      const url = fileService.getFileUrl(result.fileId);
      setImages((prev) => prev.length >= 5 ? prev : [...prev, { fileId: result.fileId, url }]);
    } catch {
      message.error(`Upload ${file.name} thất bại`);
    } finally {
      setUploading(false);
    }
    return false;
  };

  const handleConfirm = async () => {
    if (!item) return;
    await onConfirm(item.id, {
      note: note.trim() || undefined,
      imageUrls: images.length > 0 ? images.map((i) => i.url) : undefined,
    });
  };

  return (
    <Modal
      open={open}
      title="Xác nhận hoàn thành"
      width={520}
      centered
      onCancel={onClose}
      destroyOnClose
      footer={
        <Space>
          <Button onClick={onClose}>Hủy</Button>
          <Button type="primary" loading={completing} onClick={handleConfirm}>
            Xác nhận
          </Button>
        </Space>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 8 }}>
        <div>
          <div style={{ marginBottom: 6, fontWeight: 500 }}>Ghi chú</div>
          <Input.TextArea
            rows={4}
            maxLength={2000}
            showCount
            placeholder="Nhập ghi chú"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div>
          <div style={{ marginBottom: 6, fontWeight: 500 }}>
            Hình ảnh đính kèm{" "}
            <span style={{ color: "#8c8c8c", fontWeight: 400, fontSize: 13 }}>(Tùy chọn, tối đa 5 ảnh)</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <Image.PreviewGroup>
              {images.map((img, index) => (
                <div key={img.fileId} style={{ position: "relative", display: "inline-block" }}>
                  <Image
                    src={img.url}
                    alt={`Hình ${index + 1}`}
                    style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 6 }}
                  />
                  <Button
                    type="text" danger size="small" icon={<CloseOutlined />}
                    onClick={() => setImages((prev) => prev.filter((i) => i.fileId !== img.fileId))}
                    style={{
                      position: "absolute", top: -8, right: -8, background: "white",
                      borderRadius: "50%", padding: 0, width: 20, height: 20, minWidth: 20,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    }}
                  />
                </div>
              ))}
            </Image.PreviewGroup>
            {images.length < 5 && (
              <Upload accept="image/*" multiple showUploadList={false} beforeUpload={handleUpload} disabled={uploading}>
                <div
                  style={{
                    width: 80, height: 80, border: "1px dashed #d9d9d9", borderRadius: 6,
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    cursor: uploading ? "not-allowed" : "pointer", background: "#fafafa", gap: 4,
                    opacity: uploading ? 0.5 : 1,
                  }}
                >
                  <PlusOutlined style={{ fontSize: 18, color: "#8c8c8c" }} />
                  <span style={{ fontSize: 12, color: "#8c8c8c" }}>Upload</span>
                </div>
              </Upload>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SupplementaryTaskCompleteModal;
