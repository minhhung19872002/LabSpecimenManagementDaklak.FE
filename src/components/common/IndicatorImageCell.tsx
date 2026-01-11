import React, { useState } from 'react';
import { Upload, Image, Space, Tooltip, Modal, message, Spin, Badge } from 'antd';
import { PlusOutlined, DeleteOutlined, EyeOutlined, PictureOutlined } from './Icon';
import type { RcFile } from 'antd/es/upload/interface';

export interface IndicatorImageDto {
  id: string;
  laboratoryTaskIndicatorId: string;
  fileId: string;
  fileName: string;
  fileSize: number;
  url: string;
  creationTime: string;
  creatorId?: string;
}

interface IndicatorImageCellProps {
  images: IndicatorImageDto[];
  canUpload: boolean;
  maxImages?: number;
  onUpload?: (files: File[]) => Promise<IndicatorImageDto[]>;
  onDelete?: (imageId: string) => Promise<void>;
  loading?: boolean;
}

const IndicatorImageCell: React.FC<IndicatorImageCellProps> = ({
  images = [],
  canUpload,
  maxImages = 5,
  onUpload,
  onDelete,
  loading = false,
}) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [uploading, setUploading] = useState(false);

  const getImageUrl = (image: IndicatorImageDto): string => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';

    if (image.url) {
      // If url starts with /, it's a relative path - prepend baseUrl
      if (image.url.startsWith('/')) {
        return `${baseUrl}${image.url}`;
      }
      // If url starts with uploads/, it's a relative path - prepend baseUrl with /
      if (image.url.startsWith('uploads/')) {
        return `${baseUrl}/${image.url}`;
      }
      return image.url;
    }
    if (image.fileId) {
      return `${baseUrl}/api/v1/files/${image.fileId}`;
    }
    return '';
  };

  const handlePreview = (image: IndicatorImageDto) => {
    setPreviewImage(getImageUrl(image));
    setPreviewOpen(true);
  };

  const handleUpload = async (file: RcFile, fileList: RcFile[]) => {
    // Only process when this is the first file in batch
    if (file !== fileList[0]) {
      return false;
    }

    // Validate: only allow image files
    const imageFiles = fileList.filter(f => f.type.startsWith('image/'));
    const nonImageCount = fileList.length - imageFiles.length;
    if (nonImageCount > 0) {
      message.warning(`Đã bỏ qua ${nonImageCount} file không phải hình ảnh`);
    }

    if (imageFiles.length === 0) {
      message.error('Vui lòng chọn file hình ảnh (jpg, png, gif, ...)');
      return false;
    }

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      message.warning(`Đã đạt tối đa ${maxImages} hình ảnh`);
      return false;
    }

    // Get files that can be uploaded (not exceeding remaining slots)
    const filesToUpload = imageFiles.slice(0, remainingSlots);

    if (imageFiles.length > remainingSlots) {
      message.warning(`Chỉ upload được ${remainingSlots} hình (còn lại ${remainingSlots}/${maxImages} slot)`);
    }

    if (!onUpload) return false;

    setUploading(true);

    try {
      const newImages = await onUpload(filesToUpload);
      if (newImages.length > 0) {
        message.success(`Upload thành công ${newImages.length} hình`);
      }
    } catch (error: any) {
      console.error('Upload failed:', error);
      message.error(error?.response?.data?.error?.message || 'Upload hình ảnh thất bại');
    }

    setUploading(false);
    return false; // Prevent default upload
  };

  const handleDelete = async (imageId: string) => {
    if (!onDelete) return;

    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc muốn xóa hình ảnh này?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await onDelete(imageId);
          message.success('Xóa hình ảnh thành công');
        } catch (error: any) {
          message.error(error?.response?.data?.error?.message || 'Xóa hình ảnh thất bại');
        }
      }
    });
  };

  // If no images and cannot upload, show empty state
  if (images.length === 0 && !canUpload) {
    return <span style={{ color: '#999' }}>-</span>;
  }

  // Compact display: show 1 thumbnail + badge for remaining
  const visibleImages = images.slice(0, 1);
  const remainingCount = images.length - 1;

  return (
    <>
      <Space size={4} wrap={false}>
        {visibleImages.map((image) => (
          <div
            key={image.id}
            style={{
              position: 'relative',
              width: 32,
              height: 32,
              border: '1px solid #d9d9d9',
              borderRadius: 4,
              overflow: 'hidden',
              cursor: 'pointer',
            }}
          >
            <Image
              src={getImageUrl(image)}
              alt={image.fileName}
              width={32}
              height={32}
              style={{ objectFit: 'cover' }}
              preview={false}
              onClick={() => handlePreview(image)}
            />
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
            >
              <Tooltip title="Xem">
                <EyeOutlined
                  style={{ color: '#fff', fontSize: 12, cursor: 'pointer', marginRight: canUpload ? 2 : 0 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreview(image);
                  }}
                />
              </Tooltip>
              {canUpload && (
                <Tooltip title="Xóa">
                  <DeleteOutlined
                    style={{ color: '#fff', fontSize: 12, cursor: 'pointer' }}
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

        {/* Badge for remaining images */}
        {remainingCount > 0 && (
          <Tooltip title={`Còn ${remainingCount} hình nữa. Click để xem tất cả.`}>
            <div
              style={{
                width: 32,
                height: 32,
                border: '1px solid #d9d9d9',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f5f5f5',
                cursor: 'pointer',
                fontSize: 11,
                color: '#666',
              }}
              onClick={() => images[1] && handlePreview(images[1])}
            >
              +{remainingCount}
            </div>
          </Tooltip>
        )}

        {/* Upload button */}
        {canUpload && images.length < maxImages && (
          <Upload
            accept="image/*"
            multiple
            showUploadList={false}
            beforeUpload={handleUpload}
            disabled={uploading || loading}
          >
            <Tooltip title={`Upload hình (${images.length}/${maxImages})`}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  border: '1px dashed #1890ff',
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  background: '#f0f5ff',
                }}
              >
                {uploading || loading ? (
                  <Spin size="small" />
                ) : (
                  <PlusOutlined style={{ color: '#1890ff', fontSize: 12 }} />
                )}
              </div>
            </Tooltip>
          </Upload>
        )}

        {/* Show count badge if has images but compact view */}
        {images.length > 0 && !canUpload && visibleImages.length === 0 && (
          <Badge count={images.length} size="small">
            <PictureOutlined style={{ fontSize: 16, color: '#1890ff' }} />
          </Badge>
        )}
      </Space>

      {/* Preview Modal */}
      <Modal
        open={previewOpen}
        footer={null}
        onCancel={() => setPreviewOpen(false)}
        width={800}
        centered
        title={`Hình ảnh (${images.length}/${maxImages})`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Main preview image */}
          <div style={{ textAlign: 'center' }}>
            <img
              alt="preview"
              style={{ maxWidth: '100%', maxHeight: 500, objectFit: 'contain' }}
              src={previewImage}
            />
          </div>

          {/* Thumbnail list */}
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {images.map((image) => (
                <div
                  key={image.id}
                  style={{
                    position: 'relative',
                    width: 64,
                    height: 64,
                    border: previewImage === getImageUrl(image) ? '2px solid #1890ff' : '1px solid #d9d9d9',
                    borderRadius: 4,
                    overflow: 'hidden',
                    cursor: 'pointer',
                  }}
                  onClick={() => setPreviewImage(getImageUrl(image))}
                >
                  <img
                    src={getImageUrl(image)}
                    alt={image.fileName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {canUpload && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                      }}
                    >
                      <Tooltip title="Xóa">
                        <DeleteOutlined
                          style={{
                            color: '#fff',
                            fontSize: 12,
                            background: 'rgba(255,0,0,0.7)',
                            padding: 2,
                            borderRadius: 2,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(image.id);
                          }}
                        />
                      </Tooltip>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default IndicatorImageCell;
