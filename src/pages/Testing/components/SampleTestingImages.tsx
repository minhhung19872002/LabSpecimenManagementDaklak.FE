import React, { useState } from 'react';
import { Upload, Image, Space, Tooltip, Modal, message, Spin } from 'antd';
import { PlusOutlined, DeleteOutlined, EyeOutlined } from '../../../components/common/Icon';
import type { RcFile } from 'antd/es/upload/interface';
import { SampleTestingImageDto, SampleTestingImageType } from '../../../types/testing';
import testingService from '../../../services/testingService';

interface SampleTestingImagesProps {
  taskId: string;
  sampleId: string;
  imageType: SampleTestingImageType;
  images: SampleTestingImageDto[];
  maxImages?: number;
  canUpload: boolean;
  onImagesChange?: (images: SampleTestingImageDto[]) => void;
}

const SampleTestingImages: React.FC<SampleTestingImagesProps> = ({
  taskId,
  sampleId,
  imageType,
  images,
  maxImages = 5,
  canUpload,
  onImagesChange,
}) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [uploading, setUploading] = useState(false);

  const title = imageType === SampleTestingImageType.BeforeTesting
    ? 'Hình trước TN'
    : 'Hình sau TN';

  const getImageUrl = (fileId: string): string => {
    if (!fileId) return '';
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    return `${baseUrl}/api/v1/files/${fileId}`;
  };

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
      message.warning(`Đã đạt tối đa ${maxImages} hình ${title.toLowerCase()}`);
      return false;
    }

    // Lấy các file có thể upload (không vượt quá số slot còn lại)
    const filesToUpload = imageFiles.slice(0, remainingSlots);

    if (imageFiles.length > remainingSlots) {
      message.warning(`Chỉ upload được ${remainingSlots} hình (còn lại ${remainingSlots}/${maxImages} slot)`);
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
      console.error('Batch upload failed:', error);
      message.error(error?.response?.data?.error?.message || 'Upload hình ảnh thất bại');
    }

    setUploading(false);
    return false; // Prevent default upload
  };

  const handleDelete = async (imageId: string) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc muốn xóa hình ảnh này?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await testingService.deleteSampleTestingImage(imageId);
          const updatedImages = images.filter(img => img.id !== imageId);
          onImagesChange?.(updatedImages);
          message.success('Xóa hình ảnh thành công');
        } catch (error: any) {
          message.error(error?.response?.data?.error?.message || 'Xóa hình ảnh thất bại');
        }
      }
    });
  };

  return (
    <Space direction="vertical" size="small" style={{ width: '100%' }}>
      <span style={{ fontSize: 12, color: '#666' }}>
        {title} ({images.length}/{maxImages})
      </span>
      <Space wrap size={4}>
        {images.map((image) => (
          <div
            key={image.id}
            style={{
              position: 'relative',
              width: 48,
              height: 48,
              border: '1px solid #d9d9d9',
              borderRadius: 4,
              overflow: 'hidden'
            }}
          >
            <Image
              src={getImageUrl(image.fileId)}
              alt={image.fileName}
              width={48}
              height={48}
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
                  style={{ color: '#fff', fontSize: 14, cursor: 'pointer', marginRight: 4 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreview(image);
                  }}
                />
              </Tooltip>
              {canUpload && (
                <Tooltip title="Xóa">
                  <DeleteOutlined
                    style={{ color: '#fff', fontSize: 14, cursor: 'pointer' }}
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
                border: '1px dashed #d9d9d9',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                background: '#fafafa'
              }}
            >
              {uploading ? <Spin size="small" /> : <PlusOutlined style={{ color: '#999' }} />}
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
        <img alt="preview" style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </Space>
  );
};

export default SampleTestingImages;
