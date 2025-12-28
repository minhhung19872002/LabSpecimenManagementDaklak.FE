import React from 'react';
import { Modal, Image, Typography, Empty, Divider, Badge, Space } from 'antd';
import {
  CameraOutlined,
  PictureOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import {
  SampleAttachmentDto,
  SampleTestingImageDto,
  TestRequestSampleDto,
} from '../../../types/testRequest';
import fileService from '../../../services/fileService';
import dayjs from 'dayjs';

const { Text } = Typography;

interface SampleImagesModalProps {
  open: boolean;
  onClose: () => void;
  sample: TestRequestSampleDto | null;
}

/**
 * Modal hiển thị tất cả hình ảnh của một mẫu:
 * - Hình mẫu (attachments): upload khi tạo/sửa phiếu
 * - Hình trước TN: upload bởi QLKT/KTV
 * - Hình sau TN: upload bởi QLKT/KTV
 */
const SampleImagesModal: React.FC<SampleImagesModalProps> = ({
  open,
  onClose,
  sample,
}) => {
  if (!sample) return null;

  const sampleAttachments = sample.attachments || [];
  const beforeTestingImages = sample.beforeTestingImages || [];
  const afterTestingImages = sample.afterTestingImages || [];

  const totalImages =
    sampleAttachments.length +
    beforeTestingImages.length +
    afterTestingImages.length;

  const getImageUrl = (fileId: string): string => {
    if (!fileId) return '';
    return fileService.getFileUrl(fileId);
  };

  const renderImageGroup = (
    images: (SampleAttachmentDto | SampleTestingImageDto)[],
    title: string,
    icon: React.ReactNode,
    emptyText: string
  ) => {
    return (
      <div style={{ marginBottom: 24 }}>
        <Space align="center" style={{ marginBottom: 12 }}>
          {icon}
          <Text strong style={{ fontSize: 14 }}>
            {title}
          </Text>
          <Badge
            count={images.length}
            showZero
            style={{
              backgroundColor: images.length > 0 ? '#1890ff' : '#d9d9d9',
            }}
          />
        </Space>

        {images.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={emptyText}
            style={{ margin: '16px 0' }}
          />
        ) : (
          <Image.PreviewGroup>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: 12,
              }}
            >
              {images.map((img, index) => {
                const isTestingImage = 'imageType' in img;
                const fileId = isTestingImage
                  ? (img as SampleTestingImageDto).fileId
                  : (img as SampleAttachmentDto).fileId;
                const fileName = isTestingImage
                  ? (img as SampleTestingImageDto).fileName
                  : (img as SampleAttachmentDto).fileName;
                const creationTime = isTestingImage
                  ? (img as SampleTestingImageDto).creationTime
                  : undefined;

                return (
                  <div
                    key={img.id}
                    className="sample-image-item"
                    style={{
                      position: 'relative',
                      borderRadius: 8,
                      overflow: 'hidden',
                      border: '1px solid #f0f0f0',
                      aspectRatio: '1 / 1',
                    }}
                  >
                    <Image
                      src={getImageUrl(fileId)}
                      alt={fileName || `Hình ${index + 1}`}
                      width="100%"
                      height="100%"
                      style={{
                        objectFit: 'cover',
                      }}
                      fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgesA"
                      preview={{
                        mask: <PictureOutlined style={{ fontSize: 20 }} />,
                      }}
                    />
                    {creationTime && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: 'rgba(0,0,0,0.6)',
                          color: '#fff',
                          fontSize: 11,
                          padding: '2px 6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <ClockCircleOutlined style={{ fontSize: 10 }} />
                        {dayjs(creationTime).format('DD/MM/YYYY HH:mm')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Image.PreviewGroup>
        )}
      </div>
    );
  };

  return (
    <Modal
      title={
        <Space>
          <CameraOutlined />
          <span>Hình ảnh mẫu: {sample.sampleCode} - {sample.sampleName}</span>
          <Badge count={totalImages} style={{ backgroundColor: '#1890ff' }} />
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width="90%"
      style={{ maxWidth: 900 }}
      centered
      styles={{
        body: {
          maxHeight: '70vh',
          overflowY: 'auto',
        },
      }}
    >
      <div style={{ padding: '8px 0' }}>
        {/* Hình mẫu (attachments) */}
        {renderImageGroup(
          sampleAttachments,
          'Hình mẫu',
          <PictureOutlined style={{ color: '#1890ff', fontSize: 16 }} />,
          'Chưa có hình mẫu'
        )}

        <Divider style={{ margin: '16px 0' }} />

        {/* Hình trước thử nghiệm */}
        {renderImageGroup(
          beforeTestingImages,
          'Hình trước thử nghiệm',
          <CameraOutlined style={{ color: '#52c41a', fontSize: 16 }} />,
          'Chưa có hình trước TN'
        )}

        <Divider style={{ margin: '16px 0' }} />

        {/* Hình sau thử nghiệm */}
        {renderImageGroup(
          afterTestingImages,
          'Hình sau thử nghiệm',
          <CameraOutlined style={{ color: '#faad14', fontSize: 16 }} />,
          'Chưa có hình sau TN'
        )}
      </div>
      {/* CSS to fix ant-image mask position */}
      <style>{`
        .sample-image-item .ant-image {
          display: block;
          width: 100%;
          height: 100%;
        }
        .sample-image-item .ant-image-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .sample-image-item .ant-image-mask {
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </Modal>
  );
};

export default SampleImagesModal;
