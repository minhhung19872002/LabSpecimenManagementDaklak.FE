import React from "react";
import { Space, Typography } from "antd";
import {
  TestingSampleDto,
  SampleTestingImageType,
  SampleTestingImageDto,
  IndicatorTestingStatus,
} from "../../../../types/testing";
import SampleTestingImages from "../SampleTestingImages";
import SampleImagesDisplay from "../SampleImagesDisplay";

const { Text } = Typography;

interface SampleImagesRowProps {
  taskId: string;
  sample: TestingSampleDto;
  /** Có quyền upload hình từ Permission Matrix */
  canUpload?: boolean;
  onImagesChange: (
    sampleId: string,
    imageType: SampleTestingImageType,
    images: SampleTestingImageDto[],
  ) => void;
}

const SampleImagesRow: React.FC<SampleImagesRowProps> = ({
  taskId,
  sample,
  canUpload: canUploadProp = true,
  onImagesChange,
}) => {
  const isSampleCompleted =
    sample.indicators.length > 0 &&
    sample.indicators.every(
      (ind) => ind.testingStatus === IndicatorTestingStatus.Done,
    );

  const canUpload = canUploadProp && !isSampleCompleted;
  const hasInfo = sample.sampleQuantity || sample.statusText;

  return (
    <div style={{ padding: "8px 12px", display: "flex", gap: 32, alignItems: "flex-start", flexWrap: "wrap" }}>
      {/* Hình ảnh — bên trái */}
      <Space size={24} wrap>
        {sample.sampleImages?.length > 0 && (
          <SampleImagesDisplay images={sample.sampleImages} title="Hình mẫu" />
        )}
        <SampleTestingImages
          taskId={taskId}
          sampleId={sample.sampleId}
          imageType={SampleTestingImageType.BeforeTesting}
          images={sample.beforeTestingImages || []}
          canUpload={canUpload}
          onImagesChange={(images) =>
            onImagesChange(sample.sampleId, SampleTestingImageType.BeforeTesting, images)
          }
        />
        <SampleTestingImages
          taskId={taskId}
          sampleId={sample.sampleId}
          imageType={SampleTestingImageType.AfterTesting}
          images={sample.afterTestingImages || []}
          canUpload={canUpload}
          onImagesChange={(images) =>
            onImagesChange(sample.sampleId, SampleTestingImageType.AfterTesting, images)
          }
        />
      </Space>

      {/* Thông tin mẫu — bên phải */}
      {hasInfo && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {sample.sampleQuantity && (
            <Text>
              <Text type="secondary">Lượng mẫu gửi: </Text>
              {sample.sampleQuantity}
            </Text>
          )}
          {sample.statusText && (
            <Text>
              <Text type="secondary">Tình trạng mẫu: </Text>
              {sample.statusText}
            </Text>
          )}
        </div>
      )}
    </div>
  );
};

export default SampleImagesRow;
