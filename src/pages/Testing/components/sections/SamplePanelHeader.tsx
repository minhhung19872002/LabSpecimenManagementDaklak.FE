import React from "react";
import { Button, Space, Row, Col, Typography, DatePicker, Tag } from "antd";
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
  canPerformActions?: boolean;
  onSubmitResults: (sampleId: string) => void;
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
  const hasSubmittableIndicators = selectedIndicatorIds.some((id) => {
    const indicator = sample.indicators.find((i) => i.id === id);
    return (
      indicator &&
      (indicator.testingStatus === IndicatorTestingStatus.Todo ||
        indicator.testingStatus === IndicatorTestingStatus.Testing ||
        indicator.testingStatus === IndicatorTestingStatus.Rejected ||
        indicator.testingStatus === IndicatorTestingStatus.PendingApproval)
    );
  });

  const editableSelectedIds = selectedIndicatorIds.filter((id) => {
    const indicator = sample.indicators.find((i) => i.id === id);
    return (
      indicator &&
      indicator.canEdit &&
      (indicator.testingStatus === IndicatorTestingStatus.Todo ||
        indicator.testingStatus === IndicatorTestingStatus.Testing ||
        indicator.testingStatus === IndicatorTestingStatus.Rejected ||
        indicator.testingStatus === IndicatorTestingStatus.PendingApproval)
    );
  });

  const hasRejectedIndicator = editableSelectedIds.some((id) => {
    const indicator = sample.indicators.find((i) => i.id === id);
    return indicator?.testingStatus === IndicatorTestingStatus.Rejected;
  });

  const disabledDate = hasRejectedIndicator
    ? (current: dayjs.Dayjs) => current && current < dayjs().startOf("day")
    : undefined;

  const handleBulkTestDateChange = (date: dayjs.Dayjs | null) => {
    if (date && onBulkTestDateChange && editableSelectedIds.length > 0) {
      onBulkTestDateChange(sample.sampleId, editableSelectedIds, date.format("YYYY-MM-DD"));
    }
  };

  return (
    <div style={{ width: "100%" }}>
      <Row justify="space-between" align="middle" wrap={false}>
        <Col flex="auto">
          <Space wrap size={8}>
            <Tag style={{ margin: 0, borderRadius: 100, padding: "0 10px", background: "#fff", borderColor: "#d9d9d9", color: "#1677ff" }}>
              {sample.sampleCode || "-"}
            </Tag>
            {sample.sampleName && <Text>{sample.sampleName}</Text>}
            <Text type="secondary" style={{ fontWeight: 400 }}>({sample.indicators.length} chỉ tiêu)</Text>
          </Space>
        </Col>
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

export default React.memo(SamplePanelHeader);
