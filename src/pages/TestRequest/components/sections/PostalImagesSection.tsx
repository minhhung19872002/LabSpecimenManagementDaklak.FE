// @ts-nocheck
import React from "react";
import { Divider, Image } from "antd";
import { PictureOutlined } from "../../../../components/common/Icon";
import { TestRequestDto } from "../../../../types/testRequest";
import { fileService } from "../../../../services/fileService";

interface PostalImagesSectionProps {
  data: TestRequestDto;
}

const PostalImagesSection: React.FC<PostalImagesSectionProps> = ({ data }) => {
  if (
    !data.deliveryPostal ||
    !data.postalDeliveryImages ||
    data.postalDeliveryImages.length === 0
  ) {
    return null;
  }

  return (
    <>
      <Divider orientation="left" style={{ marginTop: 24 }}>
        <span style={{ fontWeight: 600 }}>
          Hình ảnh gửi bưu điện ({data.postalDeliveryImages.length} hình)
        </span>
      </Divider>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          padding: "16px 0",
          justifyContent: "center",
        }}
      >
        <Image.PreviewGroup>
          {data.postalDeliveryImages.map((img, index) => {
            const imageUrl = fileService.getFileUrl(img.fileId);
            return (
              <div
                key={img.fileId}
                style={{
                  width: 200,
                  height: 200,
                  border: "1px solid #d9d9d9",
                  borderRadius: 8,
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <Image
                  src={imageUrl}
                  alt={`Hình ảnh gửi bưu điện ${index + 1}`}
                  width={200}
                  height={200}
                  style={{
                    objectFit: "cover",
                  }}
                  fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                  placeholder={
                    <div
                      style={{
                        width: 200,
                        height: 200,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#f5f5f5",
                      }}
                    >
                      <PictureOutlined style={{ fontSize: 40, color: "#999" }} />
                    </div>
                  }
                />
              </div>
            );
          })}
        </Image.PreviewGroup>
      </div>
    </>
  );
};

export default PostalImagesSection;
