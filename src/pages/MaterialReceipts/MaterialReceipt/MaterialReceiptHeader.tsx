import React from "react";
import { Row, Col, Form, Input, DatePicker } from "antd";
import type { Dayjs } from "dayjs";

export interface MaterialReceiptHeaderProps {
  code: string;
  receiverName: string;
  receiptDate: Dayjs | null;
  isReadonly: boolean;
  codeError?: string;
  onCodeChange: (value: string) => void;
  onReceiptDateChange: (date: Dayjs | null) => void;
}

const MaterialReceiptHeader: React.FC<MaterialReceiptHeaderProps> = ({
  code,
  receiverName,
  receiptDate,
  isReadonly,
  codeError,
  onCodeChange,
  onReceiptDateChange,
}) => {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={8}>
        <Form.Item
          label="Mã phiếu"
          required
          validateStatus={codeError ? "error" : undefined}
          help={codeError}
        >
          <Input
            value={code}
            onChange={(e) => onCodeChange(e.target.value)}
            placeholder="RO-DDMMYYYY-XX"
            disabled={isReadonly}
          />
        </Form.Item>
      </Col>
      <Col xs={24} sm={8}>
        <Form.Item label="Người nhận vật tư">
          <Input value={receiverName} disabled />
        </Form.Item>
      </Col>
      <Col xs={24} sm={8}>
        <Form.Item label="Ngày nhận vật tư" required>
          <DatePicker
            value={receiptDate}
            onChange={onReceiptDateChange}
            format="DD/MM/YYYY"
            style={{ width: "100%" }}
            disabled={isReadonly}
          />
        </Form.Item>
      </Col>
    </Row>
  );
};

export default MaterialReceiptHeader;
