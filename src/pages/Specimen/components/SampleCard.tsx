// @ts-nocheck
import React from "react";
import { Row, Col, Button, Popconfirm, Typography, Tooltip } from "antd";
import type { SampleStorageItemDto } from "../../../types/sampleStorage";
import { SampleStorageStatus } from "../../../types/sampleStorage";
import { formatDate } from "../../../utils/formatters";

const { Text } = Typography;

interface SampleCardProps {
  sample: SampleStorageItemDto;
  parentStatus: SampleStorageStatus;
  onCancel: (sampleId: string) => void;
}

const SampleCard: React.FC<SampleCardProps> = ({
  sample,
  parentStatus,
  onCancel,
}) => {
  const showCancelButton =
    parentStatus === SampleStorageStatus.PendingDisposal && !sample.isCancelled;

  const InfoItem: React.FC<{ label: string; value: React.ReactNode }> = ({
    label,
    value,
  }) => {
    const hasValue = value !== null && value !== undefined && value !== "";
    const displayValue = hasValue ? value : "-";
    const stringValue = typeof value === "string" ? value : String(value || "");

    const textElement = (
      <Text
        strong
        style={{
          fontSize: 14,
          display: "block",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {displayValue}
      </Text>
    );

    return (
      <div
        style={{
          padding: "8px 12px",
          backgroundColor: "#fafafa",
          borderRadius: 6,
          height: "100%",
          minHeight: 60,
        }}
      >
        <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
          {label}
        </Text>
        {hasValue ? (
          <Tooltip title={stringValue} placement="topLeft">
            {textElement}
          </Tooltip>
        ) : (
          textElement
        )}
      </div>
    );
  };

  return (
    <div>
      {showCancelButton && (
        <div style={{ marginBottom: 12, textAlign: "right" }}>
          <Popconfirm
            title="Xác nhận hủy mẫu?"
            description={`Bạn có chắc chắn muốn hủy mẫu "${sample.sampleName}" (${sample.sampleCode})?`}
            onConfirm={() => onCancel(sample.id)}
            okText="Xác nhận"
            cancelText="Hủy"
          >
            <Button danger size="small">
              Xác nhận hủy mẫu
            </Button>
          </Popconfirm>
        </div>
      )}
      <Row gutter={[12, 12]}>
        <Col xs={24} md={12} lg={6}>
          <InfoItem label="Mã mẫu" value={sample.sampleCode} />
        </Col>
        <Col xs={24} md={12} lg={6}>
          <InfoItem label="Tên mẫu" value={sample.sampleName} />
        </Col>
        <Col xs={24} md={12} lg={6}>
          <InfoItem label="Loại mẫu" value={sample.specimenTypeName} />
        </Col>
        <Col xs={24} md={12} lg={6}>
          <InfoItem label="Ngày lưu mẫu" value={formatDate(sample.storageDate)} />
        </Col>
        <Col xs={24} md={12} lg={6}>
          <InfoItem label="Lượng mẫu" value={sample.sampleQuantity} />
        </Col>
        <Col xs={24} md={12} lg={6}>
          <InfoItem label="Tình trạng" value={sample.statusText} />
        </Col>
        {sample.isCancelled && (
          <Col xs={24} md={12} lg={6}>
            <InfoItem label="Ngày hủy mẫu" value={formatDate(sample.cancelledDate)} />
          </Col>
        )}
      </Row>
    </div>
  );
};

export default SampleCard;
