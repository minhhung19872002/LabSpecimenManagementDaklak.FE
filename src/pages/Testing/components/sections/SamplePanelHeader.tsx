import React from "react";
import { Button, Space, Row, Col, Typography, DatePicker } from "antd";
import { SendOutlined } from "../../../../components/common/Icon";
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
  onSubmitResults: (sampleId: string) => void;
  /** Callback khi chọn ngày thử nghiệm cho các chỉ tiêu được select */
  onBulkTestDateChange?: (
    sampleId: string,
    indicatorIds: string[],
    date: string,
  ) => void;
}

const SamplePanelHeader: React.FC<SamplePanelHeaderProps> = ({
  sample,
  selectedIndicatorIds,
  submitting,
  canPerformActions = false,
  onSubmitResults,
  onBulkTestDateChange,
}) => {
  // Kiểm tra có chỉ tiêu nào được chọn có thể gửi duyệt không
  // Có thể gửi khi: trạng thái Todo, Testing, Rejected hoặc PendingApproval (gửi lại)
  const hasSubmittableIndicators = selectedIndicatorIds.some((indicatorId) => {
    const indicator = sample.indicators.find((i) => i.id === indicatorId);
    return (
      indicator &&
      (indicator.testingStatus === IndicatorTestingStatus.Todo ||
        indicator.testingStatus === IndicatorTestingStatus.Testing ||
        indicator.testingStatus === IndicatorTestingStatus.Rejected ||
        indicator.testingStatus === IndicatorTestingStatus.PendingApproval)
    );
  });

  // Lọc các chỉ tiêu được select có thể thay đổi ngày thử nghiệm
  // (trạng thái Todo, Testing, Rejected hoặc PendingApproval)
  const editableSelectedIds = selectedIndicatorIds.filter((indicatorId) => {
    const indicator = sample.indicators.find((i) => i.id === indicatorId);
    return (
      indicator &&
      indicator.canEdit &&
      (indicator.testingStatus === IndicatorTestingStatus.Todo ||
        indicator.testingStatus === IndicatorTestingStatus.Testing ||
        indicator.testingStatus === IndicatorTestingStatus.Rejected ||
        indicator.testingStatus === IndicatorTestingStatus.PendingApproval)
    );
  });

  // Kiểm tra nếu có chỉ tiêu bị từ chối trong danh sách được select
  const hasRejectedIndicator = editableSelectedIds.some((indicatorId) => {
    const indicator = sample.indicators.find((i) => i.id === indicatorId);
    return indicator?.testingStatus === IndicatorTestingStatus.Rejected;
  });

  // Nếu có chỉ tiêu bị từ chối, không cho chọn ngày trước hôm nay
  const disabledDate = hasRejectedIndicator
    ? (current: dayjs.Dayjs) => current && current < dayjs().startOf("day")
    : undefined;

  const handleBulkTestDateChange = (date: dayjs.Dayjs | null) => {
    if (date && onBulkTestDateChange && editableSelectedIds.length > 0) {
      onBulkTestDateChange(
        sample.sampleId,
        editableSelectedIds,
        date.format("YYYY-MM-DD"),
      );
    }
  };

  const sampleCodeText = sample.sampleCode || "-";
  const sampleConditionText = sample.statusText?.trim();
  const sampleTitle = sampleConditionText
    ? `${sampleCodeText} - ${sampleConditionText}`
    : sampleCodeText;

  return (
    <div style={{ width: "100%" }}>
      <Row justify="space-between" align="middle" wrap={false}>
        <Col flex="auto">
          <Space wrap size={8}>
            <Text strong>{sampleTitle}</Text>
            <Text type="secondary">({sample.indicators.length} chỉ tiêu)</Text>
          </Space>
        </Col>
        {/* Chỉ hiển thị DatePicker và button Gửi kết quả khi có quyền thao tác */}
        {canPerformActions && (
          <Col flex="none" onClick={(e) => e.stopPropagation()}>
            <Space size={8} align="center">
              <Text type="secondary" style={{ fontSize: 13 }}>
                Ngày thử nghiệm:
              </Text>
              <DatePicker
                size="small"
                format="DD/MM/YYYY"
                placeholder="Chọn ngày"
                disabled={editableSelectedIds.length === 0}
                disabledDate={disabledDate}
                onChange={handleBulkTestDateChange}
                style={{ width: 130 }}
              />
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
