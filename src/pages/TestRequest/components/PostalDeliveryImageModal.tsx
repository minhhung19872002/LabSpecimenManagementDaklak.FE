import { useState } from "react";
import { Modal, Alert, Upload, Button, Image, message } from "antd";
import { UploadOutlined, CloseOutlined } from "../../../components/common/Icon";
import { fileService } from "../../../services/fileService";

interface PostalImage {
  fileId: string;
  url: string;
}

interface PostalDeliveryImageModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: (imageFileIds: string[]) => Promise<void>;
}

const PostalDeliveryImageModal: React.FC<PostalDeliveryImageModalProps> = ({
  open,
  onClose,
  onComplete,
}) => {
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<PostalImage[]>([]);

  const handleClose = () => {
    setImages([]);
    onClose();
  };

  const handleComplete = async () => {
    if (images.length === 0) {
      message.error("Vui lòng upload ít nhất 1 hình ảnh gửi bưu điện");
      return;
    }

    setSubmitting(true);
    try {
      const imageFileIds = images.map((img) => img.fileId);
      await onComplete(imageFileIds);
      setImages([]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpload = async (file: File, fileList: File[]) => {
    // Get current count and calculate remaining slots
    const currentCount = images.length;
    const remainingSlots = 5 - currentCount;
    const fileIndex = fileList.indexOf(file);

    // Show warning on first file if total exceeds limit
    if (fileIndex === 0 && fileList.length > remainingSlots) {
      if (remainingSlots <= 0) {
        message.warning("Đã đạt tối đa 5 hình ảnh. Không thể thêm hình mới.");
        return false;
      } else {
        message.warning(
          `Chỉ có thể thêm ${remainingSlots} hình nữa. ${
            fileList.length - remainingSlots
          } hình sẽ bị bỏ qua.`
        );
      }
    }

    // Skip files that exceed the limit
    if (fileIndex >= remainingSlots) {
      return false;
    }

    // Validate file - check if it's an image
    if (!file.type.startsWith("image/")) {
      message.error(`${file.name}: Chỉ chấp nhận file hình ảnh`);
      return false;
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      message.error(`${file.name}: Kích thước file tối đa 10MB`);
      return false;
    }

    // Validate file using fileService
    const validationError = fileService.getValidationError(file);
    if (validationError) {
      message.error(validationError);
      return false;
    }

    setUploading(true);
    try {
      const result = await fileService.uploadImage(file);
      // Use fileService.getFileUrl to get full URL
      const fullUrl = fileService.getFileUrl(result.fileId);
      setImages((prev) => {
        // Double check limit before adding
        if (prev.length >= 5) {
          return prev;
        }
        return [
          ...prev,
          {
            fileId: result.fileId,
            url: fullUrl,
          },
        ];
      });
    } catch (error) {
      message.error(`Upload ${file.name} thất bại`);
    } finally {
      setUploading(false);
    }
    return false; // Prevent default upload behavior
  };

  const handleRemove = (fileId: string) => {
    setImages((prev) => prev.filter((img) => img.fileId !== fileId));
  };

  return (
    <Modal
      title="Hoàn thành - Upload hình ảnh gửi bưu điện"
      open={open}
      onCancel={handleClose}
      onOk={handleComplete}
      okText="Hoàn thành"
      cancelText="Hủy"
      okButtonProps={{ disabled: images.length === 0, loading: submitting }}
      centered
      width={600}
    >
      <Alert
        message={`Bắt buộc upload hình ảnh minh chứng gửi bưu điện (tối đa 5 hình, đã chọn ${images.length}/5)`}
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
      <Upload
        accept="image/*"
        multiple
        showUploadList={false}
        beforeUpload={handleUpload}
        disabled={uploading || images.length >= 5}
      >
        <Button
          icon={<UploadOutlined />}
          loading={uploading}
          disabled={images.length >= 5}
        >
          Chọn hình ảnh ({images.length}/5)
        </Button>
      </Upload>
      {images.length > 0 && (
        <div
          style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 8 }}
        >
          <Image.PreviewGroup>
            {images.map((img, index) => (
              <div
                key={img.fileId}
                style={{ position: "relative", display: "inline-block" }}
              >
                <Image
                  src={img.url}
                  alt={`Hình ảnh gửi bưu điện ${index + 1}`}
                  style={{ width: 100, height: 100, objectFit: "cover" }}
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
        </div>
      )}
    </Modal>
  );
};

export default PostalDeliveryImageModal;
