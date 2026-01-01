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
  onImagesChange: (
    sampleId: string,
    imageType: SampleTestingImageType,
    images: SampleTestingImageDto[]
  ) => void;
}

const SampleImagesRow: React.FC<SampleImagesRowProps> = ({
  taskId,
  sample,
  onImagesChange,
}) => {
  // Check if sample is completed (all indicators are Done)
  const isSampleCompleted =
    sample.indicators.length > 0 &&
    sample.indicators.every(
      (ind) => ind.testingStatus === IndicatorTestingStatus.Done
    );

  const canUpload = !isSampleCompleted;

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
