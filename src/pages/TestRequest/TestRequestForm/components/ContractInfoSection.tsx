// @ts-nocheck
import React from "react";
import { Form, Input, DatePicker, Checkbox, Row, Col, Typography } from "antd";
import { TestRequestStatus } from "../../../../types/testRequest";

const { Title } = Typography;

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
  // Checkbox "Gửi kế toán" chỉ hiển thị khi trạng thái = ResultSent (Gửi khách hàng)
  const showSentToAccounting = currentStatus === TestRequestStatus.ResultSent;
  return (
    <div className="form-section">
      <Title level={5} className="section-title">
        Thông tin hợp đồng
      </Title>
      <Row gutter={[16, 8]} align="middle">
        <Col xs={24} sm={12} md={12} lg={4}>
          <Form.Item
            name="contractNumber"
            label="Số HĐ"
            style={{ marginBottom: 0 }}
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
        <Col xs={24} sm={12} md={12} lg={4}>
          <Form.Item
            name="contractDate"
            label="Ngày HĐ"
            style={{ marginBottom: 0 }}
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
        {/* Checkbox "Gửi kế toán" chỉ hiển thị khi trạng thái = ResultSent */}
        {isEditMode && showSentToAccounting && (
          <Col xs={24} sm={24} md={16}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                paddingTop: "30px",
              }}
            >
              <Form.Item
                name="sentToAccounting"
                valuePropName="checked"
                style={{ marginBottom: 0 }}
              >
                <Checkbox>Gửi kế toán</Checkbox>
              </Form.Item>
              {/* <Form.Item
                name="paymentReceived"
                valuePropName="checked"
                style={{ marginBottom: 0 }}
              >
                <Checkbox>Đã thu tiền</Checkbox>
              </Form.Item>
              <Form.Item
                name="sentToDepartment"
                valuePropName="checked"
                style={{ marginBottom: 0 }}
              >
                <Checkbox>Gửi khoa phòng</Checkbox>
              </Form.Item>
              <Form.Item
                name="resultReturned"
                valuePropName="checked"
                style={{ marginBottom: 0 }}
              >
                <Checkbox>Trả kết quả</Checkbox>
              </Form.Item> */}
            </div>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default ContractInfoSection;
