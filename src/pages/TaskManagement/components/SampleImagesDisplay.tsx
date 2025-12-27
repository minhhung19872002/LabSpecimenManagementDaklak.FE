import React from "react";
import { Image, Space, Typography, Tooltip } from "antd";
import { PictureOutlined, CameraOutlined } from "@ant-design/icons";
import { SampleTestingImageDto, SampleAttachmentDto } from "../../../types/testing";

const { Text } = Typography;

interface SampleImagesDisplayProps {
  sampleImages?: SampleAttachmentDto[];        // Hình mẫu từ TestRequest (readonly)
  beforeTestingImages?: SampleTestingImageDto[]; // Hình trước TN
  afterTestingImages?: SampleTestingImageDto[];  // Hình sau TN
}

const ImageGroup: React.FC<{
  title: string;
  icon: React.ReactNode;
  images: Array<{ filePath: string; fileName: string }>;
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
                  src={img.filePath}
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

const SampleImagesDisplay: React.FC<SampleImagesDisplayProps> = ({
  sampleImages = [],
  beforeTestingImages = [],
  afterTestingImages = [],
}) => {
  const hasAnyImages =
    sampleImages.length > 0 ||
    beforeTestingImages.length > 0 ||
    afterTestingImages.length > 0;

  if (!hasAnyImages) {
    return null;
  }

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
        <ImageGroup
          title="Hình ảnh mẫu"
          icon={<PictureOutlined style={{ color: "#1890ff" }} />}
          images={sampleImages}
        />
        <ImageGroup
          title="Hình trước TN"
          icon={<CameraOutlined style={{ color: "#52c41a" }} />}
          images={beforeTestingImages}
        />
        <ImageGroup
          title="Hình sau TN"
          icon={<CameraOutlined style={{ color: "#fa8c16" }} />}
          images={afterTestingImages}
        />
      </Space>
    </div>
  );
};

export default SampleImagesDisplay;
