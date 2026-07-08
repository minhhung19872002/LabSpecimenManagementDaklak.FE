// @ts-nocheck
import React from "react";
import { Form, Input, DatePicker, Checkbox, Typography, Row, Col } from "antd";
import { TestRequestStatus } from "../../../../types/testRequest";

const { Title, Text } = Typography;

interface ContractInfoSectionProps {
  isEditMode: boolean;
  isFieldLocked: (fieldName: string) => boolean;
  updateSampleCodesPrefix: (prefix: string) => void;
  validateContractNumberDebounced: (contractNumber: string) => void;
  currentStatus?: TestRequestStatus;
}

const ContractInfoSection: React.FC<ContractInfoSectionProps> = ({
  isEditMode,
  isFieldLocked,
  updateSampleCodesPrefix,
  validateContractNumberDebounced,
  currentStatus,
}) => {
  const form = Form.useFormInstance();
  const selectedSampleTypes = Form.useWatch("sampleType", form) || [];
  const isSubContractSelected = Array.isArray(selectedSampleTypes)
    ? selectedSampleTypes.includes("subContract")
    : selectedSampleTypes === "subContract";

  React.useEffect(() => {
    if (!isSubContractSelected) {
      form.setFieldValue("subContract", undefined);
    }
  }, [form, isSubContractSelected]);

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
              onChange={(e) => {
                validateContractNumberDebounced(e.target.value || "");
              }}
              onBlur={(e) => {
                const normalizedContractNumber = e.target.value?.trim() || "";
                const currentContractNumber = form.getFieldValue("contractNumber") || "";
                if (currentContractNumber !== normalizedContractNumber) {
                  form.setFieldValue("contractNumber", normalizedContractNumber);
                }
                updateSampleCodesPrefix(normalizedContractNumber);
                validateContractNumberDebounced(normalizedContractNumber);
              }}
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
      <Text strong style={{ display: "block", marginBottom: 8 }}>
        Loại hình mẫu
      </Text>
      <Form.Item
        name="sampleType"
        style={{ marginBottom: 12 }}
        rules={[
          {
            validator: (_, value) => {
              if (Array.isArray(value) && value.length > 0) {
                return Promise.resolve();
              }
              return Promise.reject(
                new Error("Vui lòng chọn ít nhất một loại hình mẫu"),
              );
            },
          },
        ]}
      >
        <Checkbox.Group disabled={isFieldLocked("sampleType")}>
          <Row gutter={[16, 8]}>
            <Col xs={24} sm={12}>
              <Checkbox value="service">Dịch vụ</Checkbox>
            </Col>
            <Col xs={24} sm={12}>
              <Checkbox value="contract">Hợp đồng</Checkbox>
            </Col>
            <Col xs={24} sm={12}>
              <Checkbox value="task">Mẫu nhiệm vụ</Checkbox>
            </Col>
            <Col xs={24} sm={12}>
              <Checkbox value="subContract">Hợp đồng phụ</Checkbox>
            </Col>
          </Row>
        </Checkbox.Group>
      </Form.Item>
      {/* Hợp đồng phụ input */}
      <Form.Item
        name="subContract"
        label="Hợp đồng phụ"
        dependencies={["sampleType"]}
        rules={[
          ({ getFieldValue }) => ({
            validator: (_, value) => {
              const selectedTypes = getFieldValue("sampleType");
              const selected = Array.isArray(selectedTypes)
                ? selectedTypes.includes("subContract")
                : selectedTypes === "subContract";

              if (!selected) {
                return Promise.resolve();
              }

              if (value && String(value).trim()) {
                return Promise.resolve();
              }

              return Promise.reject(new Error("Vui lòng nhập hợp đồng phụ"));
            },
          }),
        ]}
        style={{ marginBottom: 0 }}
      >
        <Input
          placeholder="Nhập hợp đồng phụ"
          disabled={!isSubContractSelected || isFieldLocked("subContract")}
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

// memo: chan re-render lan tu form cha khi go phim o bang mau (handlers da useCallback)
export default React.memo(ContractInfoSection);
