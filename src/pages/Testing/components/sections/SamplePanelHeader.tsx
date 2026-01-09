import React from "react";
import { Button, Space, Row, Col, Typography } from "antd";
import { SendOutlined } from "@ant-design/icons";
import {
  TestingSampleDto,
  IndicatorTestingStatus,
} from "../../../../types/testing";

const { Text } = Typography;

interface SamplePanelHeaderProps {
  sample: TestingSampleDto;
  selectedIndicatorIds: string[];
  submitting: boolean;
  /** Có quyền thực hiện thao tác (nhập/sửa/gửi kết quả) theo Permission Matrix */
  canPerformActions?: boolean;
  onSubmitResults: (sampleId: string) => void;
}

const SamplePanelHeader: React.FC<SamplePanelHeaderProps> = ({
  sample,
  selectedIndicatorIds,
  submitting,
  canPerformActions = true,
  onSubmitResults,
}) => {
  // Kiểm tra có chỉ tiêu nào được chọn có thể gửi duyệt không
  // Có thể gửi khi: trạng thái Todo, Testing hoặc Rejected
  const hasSubmittableIndicators = selectedIndicatorIds.some((indicatorId) => {
    const indicator = sample.indicators.find((i) => i.id === indicatorId);
    return (
      indicator &&
      (indicator.testingStatus === IndicatorTestingStatus.Todo ||
        indicator.testingStatus === IndicatorTestingStatus.Testing ||
        indicator.testingStatus === IndicatorTestingStatus.Rejected)
    );
  });

  return (
    <div style={{ width: "100%" }}>
      <Row justify="space-between" align="middle" wrap={false}>
        <Col flex="auto">
          <Space wrap size={8}>
            <Text strong>
              {sample.sampleCode} - {sample.sampleName}
            </Text>
            <Text type="secondary">({sample.indicators.length} chỉ tiêu)</Text>
          </Space>
        </Col>
        {/* Chỉ hiển thị button Gửi kết quả khi có quyền thao tác */}
        {canPerformActions && (
          <Col flex="none" onClick={(e) => e.stopPropagation()}>
            <Space size={8}>
              <Button
                type="primary"
                size="small"
                icon={<SendOutlined />}
                onClick={() => onSubmitResults(sample.sampleId)}
                disabled={
                  submitting ||
                  selectedIndicatorIds.length === 0 ||
                  !hasSubmittableIndicators
                }
              >
                Gửi kết quả
              </Button>
            </Space>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default SamplePanelHeader;
