import React, { useState } from "react";
import {
  Image,
  Space,
  Typography,
  Tooltip,
  Upload,
  Modal,
  message,
  Spin,
} from "antd";
import {
  PictureOutlined,
  CameraOutlined,
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined,
} from "../../../components/common/Icon";
import type { RcFile } from "antd/es/upload/interface";
import {
  SampleTestingImageDto,
  SampleAttachmentDto,
  SampleTestingImageType,
} from "../../../types/testing";
import fileService from "../../../services/fileService";
import testingService from "../../../services/testingService";

const { Text } = Typography;

/**
 * Get image URL using fileId with /api/v1/files/{fileId}
 */
const getImageUrl = (fileId: string): string => {
  if (!fileId) return "";
  return fileService.getFileUrl(fileId);
};

interface SampleImagesDisplayProps {
  taskId?: string;
  sampleId?: string;
  sampleImages?: SampleAttachmentDto[]; // Hình mẫu từ TestRequest (readonly)
  beforeTestingImages?: SampleTestingImageDto[]; // Hình trước TN
  afterTestingImages?: SampleTestingImageDto[]; // Hình sau TN
  canUpload?: boolean; // Cho phép upload hay không
  maxImages?: number; // Số hình tối đa mỗi loại
  onBeforeImagesChange?: (images: SampleTestingImageDto[]) => void;
  onAfterImagesChange?: (images: SampleTestingImageDto[]) => void;
}

// Read-only image group (for sample attachments)
const ReadOnlyImageGroup: React.FC<{
  title: string;
  icon: React.ReactNode;
  images: Array<{ fileId: string; fileName: string }>;
}> = ({ title, icon, images }) => {
  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div style={{ marginBottom: 8 }}>
      <Space size={4} align="center" style={{ marginBottom: 4 }}>
        {icon}
        <Text type="secondary" style={{ fontSize: 12 }}>
          {title} ({images.length})
        </Text>
      </Space>
      <div>
        <Image.PreviewGroup>
          <Space size={4} wrap>
            {images.slice(0, 5).map((img, index) => (
              <Tooltip key={index} title={img.fileName}>
                <Image
                  src={getImageUrl(img.fileId)}
                  alt={img.fileName}
                  width={40}
                  height={40}
                  style={{
                    objectFit: "cover",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                  fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                />
              </Tooltip>
            ))}
            {images.length > 5 && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                +{images.length - 5}
              </Text>
            )}
          </Space>
        </Image.PreviewGroup>
      </div>
    </div>
  );
};

// Uploadable image group (for before/after testing images)
const UploadableImageGroup: React.FC<{
  title: string;
  icon: React.ReactNode;
  images: SampleTestingImageDto[];
  taskId: string;
  sampleId: string;
  imageType: SampleTestingImageType;
  canUpload: boolean;
  maxImages: number;
  onImagesChange?: (images: SampleTestingImageDto[]) => void;
}> = ({
  title,
  icon,
  images,
  taskId,
  sampleId,
  imageType,
  canUpload,
  maxImages,
  onImagesChange,
}) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [uploading, setUploading] = useState(false);

  const handlePreview = (image: SampleTestingImageDto) => {
    setPreviewImage(getImageUrl(image.fileId));
    setPreviewOpen(true);
  };

  const handleUpload = async (file: RcFile, fileList: RcFile[]) => {
    // Chỉ xử lý khi là file đầu tiên trong batch
    if (file !== fileList[0]) {
      return false;
    }

    // Validate: chỉ cho phép file hình ảnh
    const imageFiles = fileList.filter((f) => f.type.startsWith("image/"));
    const nonImageCount = fileList.length - imageFiles.length;
    if (nonImageCount > 0) {
      message.warning(`Đã bỏ qua ${nonImageCount} file không phải hình ảnh`);
    }

    if (imageFiles.length === 0) {
      message.error("Vui lòng chọn file hình ảnh (jpg, png, gif, ...)");
      return false;
    }

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      message.warning(`Đã đạt tối đa ${maxImages} hình ${title.toLowerCase()}`);
      return false;
    }

    // Lấy các file có thể upload (không vượt quá số slot còn lại)
    const filesToUpload = imageFiles.slice(0, remainingSlots);

    if (imageFiles.length > remainingSlots) {
      message.warning(
        `Chỉ upload được ${remainingSlots} hình (còn lại ${remainingSlots}/${maxImages} slot)`
      );
    }

    setUploading(true);

    try {
      // Sử dụng batch upload API
      const newImages = await testingService.uploadSampleTestingImages(
        taskId,
        sampleId,
        imageType,
        filesToUpload
      );

      if (newImages.length > 0) {
        const updatedImages = [...images, ...newImages];
        onImagesChange?.(updatedImages);
        message.success(`Upload thành công ${newImages.length} hình`);
      }
    } catch (error: any) {
      console.error("Batch upload failed:", error);
      message.error(
        error?.response?.data?.error?.message || "Upload hình ảnh thất bại"
      );
    }

    setUploading(false);
    return false; // Prevent default upload
  };

  const handleDelete = async (imageId: string) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc muốn xóa hình ảnh này?",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      centered: true,
      onOk: async () => {
        try {
          await testingService.deleteSampleTestingImage(imageId);
          const updatedImages = images.filter((img) => img.id !== imageId);
          onImagesChange?.(updatedImages);
          message.success("Xóa hình ảnh thành công");
        } catch (error: any) {
          message.error(
            error?.response?.data?.error?.message || "Xóa hình ảnh thất bại"
          );
        }
      },
    });
  };

  return (
    <div style={{ marginBottom: 8 }}>
      <Space size={4} align="center" style={{ marginBottom: 4 }}>
        {icon}
        <Text type="secondary" style={{ fontSize: 12 }}>
          {title} ({images.length}/{maxImages})
        </Text>
      </Space>
      <div>
        <Space size={4} wrap>
          {images.map((image) => (
            <div
              key={image.id}
              style={{
                position: "relative",
                width: 48,
                height: 48,
                border: "1px solid #d9d9d9",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <Image
                src={getImageUrl(image.fileId)}
                alt={image.fileName}
                width={48}
                height={48}
                style={{ objectFit: "cover" }}
                preview={false}
                onClick={() => handlePreview(image)}
              />
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "rgba(0,0,0,0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0,
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
              >
                <Tooltip title="Xem">
                  <EyeOutlined
                    style={{
                      color: "#fff",
                      fontSize: 14,
                      cursor: "pointer",
                      marginRight: 4,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreview(image);
                    }}
                  />
                </Tooltip>
                {canUpload && (
                  <Tooltip title="Xóa">
                    <DeleteOutlined
                      style={{ color: "#fff", fontSize: 14, cursor: "pointer" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(image.id);
                      }}
                    />
                  </Tooltip>
                )}
              </div>
            </div>
          ))}
          {canUpload && images.length < maxImages && (
            <Upload
              accept="image/*"
              multiple
              showUploadList={false}
              beforeUpload={handleUpload}
              disabled={uploading}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  border: "1px dashed #d9d9d9",
                  borderRadius: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  background: "#fafafa",
                }}
              >
                {uploading ? (
                  <Spin size="small" />
                ) : (
                  <PlusOutlined style={{ color: "#999" }} />
                )}
              </div>
            </Upload>
          )}
        </Space>
        <Modal
          open={previewOpen}
          footer={null}
          onCancel={() => setPreviewOpen(false)}
          width={800}
          centered
        >
          <img alt="preview" style={{ width: "100%" }} src={previewImage} />
        </Modal>
      </div>
    </div>
  );
};

const SampleImagesDisplay: React.FC<SampleImagesDisplayProps> = ({
  taskId,
  sampleId,
  sampleImages = [],
  beforeTestingImages = [],
  afterTestingImages = [],
  canUpload = false,
  maxImages = 5,
  onBeforeImagesChange,
  onAfterImagesChange,
}) => {
  const hasAnyImages =
    sampleImages.length > 0 ||
    beforeTestingImages.length > 0 ||
    afterTestingImages.length > 0;

  // If canUpload is enabled, always show the component (to allow uploading)
  if (!hasAnyImages && !canUpload) {
    return null;
  }

  // If canUpload is enabled but missing taskId/sampleId, show read-only
  const showUploadable = canUpload && taskId && sampleId;

  return (
    <div
      style={{
        padding: "8px 12px",
        backgroundColor: "#fafafa",
        borderRadius: 4,
        marginBottom: 12,
      }}
    >
      <Space size={24} align="start" wrap>
        {/* Hình ảnh mẫu - always read-only */}
        <ReadOnlyImageGroup
          title="Hình ảnh mẫu"
          icon={<PictureOutlined style={{ color: "#1890ff" }} />}
          images={sampleImages}
        />

        {/* Hình trước TN */}
        {showUploadable ? (
          <UploadableImageGroup
            title="Hình trước TN"
            icon={<CameraOutlined style={{ color: "#52c41a" }} />}
            images={beforeTestingImages}
            taskId={taskId}
            sampleId={sampleId}
            imageType={SampleTestingImageType.BeforeTesting}
            canUpload={canUpload}
            maxImages={maxImages}
            onImagesChange={onBeforeImagesChange}
          />
        ) : (
          <ReadOnlyImageGroup
            title="Hình trước TN"
            icon={<CameraOutlined style={{ color: "#52c41a" }} />}
            images={beforeTestingImages}
          />
        )}

        {/* Hình sau TN */}
        {showUploadable ? (
          <UploadableImageGroup
            title="Hình sau TN"
            icon={<CameraOutlined style={{ color: "#fa8c16" }} />}
            images={afterTestingImages}
            taskId={taskId}
            sampleId={sampleId}
            imageType={SampleTestingImageType.AfterTesting}
            canUpload={canUpload}
            maxImages={maxImages}
            onImagesChange={onAfterImagesChange}
          />
        ) : (
          <ReadOnlyImageGroup
            title="Hình sau TN"
            icon={<CameraOutlined style={{ color: "#fa8c16" }} />}
            images={afterTestingImages}
          />
        )}
      </Space>
    </div>
  );
};

export default SampleImagesDisplay;
