import React from "react";
import { Space } from "antd";
import {
  TestingSampleDto,
  SampleTestingImageType,
  SampleTestingImageDto,
  IndicatorTestingStatus,
} from "../../../../types/testing";
import SampleTestingImages from "../SampleTestingImages";
import SampleImagesDisplay from "../SampleImagesDisplay";

interface SampleImagesRowProps {
  taskId: string;
  sample: TestingSampleDto;
  /** Có quyền upload hình từ Permission Matrix */
  canUpload?: boolean;
  onImagesChange: (
    sampleId: string,
    imageType: SampleTestingImageType,
    images: SampleTestingImageDto[]
  ) => void;
}

const SampleImagesRow: React.FC<SampleImagesRowProps> = ({
  taskId,
  sample,
  canUpload: canUploadProp = true,
  onImagesChange,
}) => {
  // Check if sample is completed (all indicators are Done)
  const isSampleCompleted =
    sample.indicators.length > 0 &&
    sample.indicators.every(
      (ind) => ind.testingStatus === IndicatorTestingStatus.Done
    );

  // Kết hợp cả quyền Permission Matrix và trạng thái sample
  const canUpload = canUploadProp && !isSampleCompleted;

  return (
    <div
      style={{
        marginBottom: 16,
        padding: "12px 0",
        borderBottom: "1px solid #f0f0f0",
      }}
    >
      <Space size={24} wrap>
        {/* Hình mẫu (readonly từ TestRequest) */}
        {sample.sampleImages?.length > 0 && (
          <SampleImagesDisplay images={sample.sampleImages} title="Hình mẫu" />
        )}
        {/* Hình trước TN */}
        <SampleTestingImages
          taskId={taskId}
          sampleId={sample.sampleId}
          imageType={SampleTestingImageType.BeforeTesting}
          images={sample.beforeTestingImages || []}
          canUpload={canUpload}
          onImagesChange={(images) =>
            onImagesChange(
              sample.sampleId,
              SampleTestingImageType.BeforeTesting,
              images
            )
          }
        />
        {/* Hình sau TN */}
        <SampleTestingImages
          taskId={taskId}
          sampleId={sample.sampleId}
          imageType={SampleTestingImageType.AfterTesting}
          images={sample.afterTestingImages || []}
          canUpload={canUpload}
          onImagesChange={(images) =>
            onImagesChange(
              sample.sampleId,
              SampleTestingImageType.AfterTesting,
              images
            )
          }
        />
      </Space>
    </div>
  );
};

export default SampleImagesRow;
