import React from "react";
import { Button, Space, Row, Col, Typography, Tag, Tooltip } from "antd";
import { PlayCircleOutlined, SendOutlined, CheckCircleOutlined } from "@ant-design/icons";
import {
  TestingSampleDto,
  IndicatorTestingStatus,
} from "../../../../types/testing";
import dayjs from "dayjs";

const { Text } = Typography;

interface SamplePanelHeaderProps {
  sample: TestingSampleDto;
  selectedIndicatorIds: string[];
  submitting: boolean;
  /** Có quyền thực hiện thao tác (nhập/sửa/gửi kết quả) theo Permission Matrix */
  canPerformActions?: boolean;
  onCheckIn: (sampleId: string) => void;
  onSubmitResults: (sampleId: string) => void;
  onReceiveSample: (sampleId: string) => void;
}

const SamplePanelHeader: React.FC<SamplePanelHeaderProps> = ({
  sample,
  selectedIndicatorIds,
  submitting,
  canPerformActions = true,
  onCheckIn,
  onSubmitResults,
  onReceiveSample,
}) => {
  // Kiểm tra có chỉ tiêu nào được chọn ở trạng thái Todo hoặc Rejected không
  const hasCheckInableIndicators = selectedIndicatorIds.some((indicatorId) => {
    const indicator = sample.indicators.find((i) => i.id === indicatorId);
    return (
      indicator &&
      (indicator.testingStatus === IndicatorTestingStatus.Todo ||
        indicator.testingStatus === IndicatorTestingStatus.Rejected)
    );
  });

  // Kiểm tra có chỉ tiêu nào được chọn ở trạng thái Testing không
  const hasSubmittableIndicators = selectedIndicatorIds.some((indicatorId) => {
    const indicator = sample.indicators.find((i) => i.id === indicatorId);
    return (
      indicator && indicator.testingStatus === IndicatorTestingStatus.Testing
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
            {sample.isReceived && (
              <Tooltip
                title={`Nhận bởi ${sample.receivedByUserName} lúc ${
                  sample.receivedDate
                    ? dayjs(sample.receivedDate).format("DD/MM/YYYY HH:mm")
                    : ""
                }`}
              >
                <Tag color="success" icon={<CheckCircleOutlined />}>
                  Đã nhận mẫu
                </Tag>
              </Tooltip>
            )}
          </Space>
        </Col>
        {/* Chỉ hiển thị buttons khi có quyền thao tác */}
        {canPerformActions && (
          <Col flex="none" onClick={(e) => e.stopPropagation()}>
            <Space size={8}>
              {/* Button nhận mẫu - chỉ hiển thị khi chưa nhận */}
              {!sample.isReceived && (
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckCircleOutlined />}
                  onClick={() => onReceiveSample(sample.sampleId)}
                  disabled={submitting}
                >
                  Đã nhận mẫu
                </Button>
              )}
              {/* Button Thực hiện và Gửi kết quả - chỉ hiển thị khi đã nhận mẫu */}
              {sample.isReceived && (
                <>
                  <Button
                    type="default"
                    size="small"
                    icon={<PlayCircleOutlined />}
                    onClick={() => onCheckIn(sample.sampleId)}
                    disabled={
                      submitting ||
                      selectedIndicatorIds.length === 0 ||
                      !hasCheckInableIndicators
                    }
                  >
                    Thực hiện
                  </Button>
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
                </>
              )}
            </Space>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default SamplePanelHeader;
