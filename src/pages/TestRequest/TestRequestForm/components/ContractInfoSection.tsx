// @ts-nocheck
import React from "react";
import { Form, Input, DatePicker, Checkbox, Typography } from "antd";
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
  const showSentToAccounting = currentStatus === TestRequestStatus.ResultSent;
  return (
    <div className="form-section">
      <Title level={5} className="section-title">
        Thông tin hợp đồng
      </Title>
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
