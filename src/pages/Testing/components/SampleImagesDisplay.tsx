import React, { useState } from 'react';
import { Image, Space, Tooltip, Modal } from 'antd';
import { EyeOutlined, PictureOutlined } from '@ant-design/icons';
import { SampleAttachmentDto } from '../../../types/testing';

interface SampleImagesDisplayProps {
  images: SampleAttachmentDto[];
  title?: string;
}

const SampleImagesDisplay: React.FC<SampleImagesDisplayProps> = ({
  images,
  title = 'Hình ảnh mẫu',
}) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  if (!images || images.length === 0) {
    return null;
  }

  const getImageUrl = (image: SampleAttachmentDto) => {
    const { filePath, fileName } = image;
    // If already a full URL, return as-is
    if (filePath.startsWith('http')) return filePath;

    // Normalize path: replace backslashes with forward slashes
    const normalizedPath = filePath.replace(/\\/g, '/');

    // Build base URL - use VITE_API_BASE_URL
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    let url = `${baseUrl}/${normalizedPath}`;

    // If filePath doesn't have extension, try to get from fileName
    const hasExtension = /\.[a-zA-Z0-9]+$/.test(normalizedPath);
    if (!hasExtension && fileName) {
      const extMatch = fileName.match(/\.[a-zA-Z0-9]+$/);
      if (extMatch) {
        url += extMatch[0];
      }
    }

    return url;
  };

  const handlePreview = (image: SampleAttachmentDto) => {
    setPreviewImage(getImageUrl(image));
    setPreviewOpen(true);
  };

  return (
    <Space direction="vertical" size="small" style={{ width: '100%' }}>
      <span style={{ fontSize: 12, color: '#666' }}>
        <PictureOutlined style={{ marginRight: 4 }} />
        {title} ({images.length})
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
              overflow: 'hidden',
              cursor: 'pointer'
            }}
            onClick={() => handlePreview(image)}
          >
            <Image
              src={getImageUrl(image)}
              alt={image.fileName}
              width={48}
              height={48}
              style={{ objectFit: 'cover' }}
              preview={false}
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
                <EyeOutlined style={{ color: '#fff', fontSize: 14 }} />
              </Tooltip>
            </div>
          </div>
        ))}
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

export default SampleImagesDisplay;
