// @ts-nocheck
import React from "react";
import { Form, Input, DatePicker, Checkbox, Typography, Row, Col } from "antd";
import { TestRequestStatus } from "../../../../types/testRequest";

const { Title, Text } = Typography;

interface ContractInfoSectionProps {
  isEditMode: boolean;
  isFieldLocked: (fieldName: string) => boolean;
  updateSampleCodesPrefix: (prefix: string) => void;
  currentStatus?: TestRequestStatus;
}

const ContractInfoSection: React.FC<ContractInfoSectionProps> = ({
  isEditMode,
  isFieldLocked,
  updateSampleCodesPrefix,
  currentStatus,
}) => {
  const showSentToAccounting = currentStatus === TestRequestStatus.ResultSent;
  return (
    <div className="form-section">
      <Title level={5} className="section-title">
        Thông tin hợp đồng
      </Title>
      {/* Hàng 1: Số HĐ | Ngày HĐ */}
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item
            name="contractNumber"
            label="Số HĐ"
            rules={[{ required: true, message: "Vui lòng nhập số HĐ" }]}
          >
            <Input
              placeholder="Số hợp đồng"
              disabled={isFieldLocked("contractNumber")}
              onBlur={(e) =>
                updateSampleCodesPrefix(e.target.value?.trim() || "")
              }
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="contractDate"
            label="Ngày HĐ"
            rules={[{ required: true, message: "Vui lòng chọn ngày HĐ" }]}
          >
            <DatePicker
              style={{ width: "100%" }}
              format="DD/MM/YYYY HH:mm"
              showTime={{ format: "HH:mm" }}
              disabled={isFieldLocked("contractDate")}
            />
          </Form.Item>
        </Col>
      </Row>
      {/* Loại hình mẫu */}
      <Text strong style={{ display: "block", marginBottom: 8 }}>Loại hình mẫu</Text>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 24px", marginBottom: 12 }}>
        <Form.Item
          name="sampleTypeService"
          valuePropName="checked"
          style={{ marginBottom: 0 }}
        >
          <Checkbox>Dịch vụ</Checkbox>
        </Form.Item>
        <Form.Item
          name="sampleTypeContract"
          valuePropName="checked"
          style={{ marginBottom: 0 }}
        >
          <Checkbox>Hợp đồng</Checkbox>
        </Form.Item>
        <Form.Item
          name="sampleTypeTask"
          valuePropName="checked"
          style={{ marginBottom: 0 }}
        >
          <Checkbox>Mẫu nhiệm vụ</Checkbox>
        </Form.Item>
        <Form.Item
          name="sampleTypeSubContract"
          valuePropName="checked"
          style={{ marginBottom: 0 }}
        >
          <Checkbox>Hợp đồng phụ</Checkbox>
        </Form.Item>
      </div>
      {/* Hợp đồng phụ input */}
      <Form.Item
        name="subContract"
        label="Hợp đồng phụ"
        style={{ marginBottom: 0 }}
      >
        <Input placeholder="Nhập hợp đồng phụ" />
      </Form.Item>
      {isEditMode && showSentToAccounting && (
        <Form.Item
          name="sentToAccounting"
          valuePropName="checked"
          style={{ marginBottom: 0, marginTop: 12 }}
        >
          <Checkbox>Gửi kế toán</Checkbox>
        </Form.Item>
      )}
    </div>
  );
};

export default ContractInfoSection;
