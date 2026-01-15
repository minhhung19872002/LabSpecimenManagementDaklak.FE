import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Select, Typography, Row, Col } from "antd";
import type { FormInstance } from "antd";
import { NumericFormat } from "react-number-format";
import { StandardIndicatorDto } from "../types";
import { IndicatorName } from "../../../../components/common";
import {
  COMPARISON_OPERATORS,
  LOWER_OPERATORS,
  UPPER_OPERATORS,
  convertOperatorSymbol,
} from "../constants";

const { Text } = Typography;

interface EditIndicatorModalProps {
  open: boolean;
  loading: boolean;
  indicator: StandardIndicatorDto | null;
  form: FormInstance;
  onOk: () => void;
  onCancel: () => void;
}

const EditIndicatorModal: React.FC<EditIndicatorModalProps> = ({
  open,
  loading,
  indicator,
  form,
  onOk,
  onCancel,
}) => {
  // Track if current mode is range or single
  const [isRangeMode, setIsRangeMode] = useState(false);

  // Detect mode from indicator data when modal opens
  useEffect(() => {
    if (open && indicator) {
      // If lowerLimit and upperLimit exist, it's range mode
      const hasRange = indicator.lowerLimit && indicator.upperLimit;
      setIsRangeMode(!!hasRange);

      // Set form values
      if (hasRange) {
        form.setFieldsValue({
          comparisonOperator: "range",
          lowerOperator: convertOperatorSymbol(indicator.lowerOperator) || ">",
          lowerLimit: indicator.lowerLimit,
          upperOperator: convertOperatorSymbol(indicator.upperOperator) || "<",
          upperLimit: indicator.upperLimit,
          isActive: indicator.isActive,
        });
      } else {
        form.setFieldsValue({
          comparisonOperator: convertOperatorSymbol(indicator.comparisonOperator),
          allowedLimit: indicator.allowedLimit,
          isActive: indicator.isActive,
        });
      }
    }
  }, [open, indicator, form]);

  // Handle comparison operator change
  const handleComparisonChange = (value: string) => {
    const newIsRange = value === "range";
    setIsRangeMode(newIsRange);

    if (newIsRange) {
      // Clear single limit field, set default range operators
      form.setFieldsValue({
        allowedLimit: undefined,
        lowerOperator: ">",
        upperOperator: "<",
      });
    } else {
      // Clear range fields
      form.setFieldsValue({
        lowerOperator: undefined,
        lowerLimit: undefined,
        upperOperator: undefined,
        upperLimit: undefined,
      });
    }
  };

  // Validate range: lowerLimit must be less than upperLimit
  const validateRange = () => {
    if (!isRangeMode) return Promise.resolve();

    const lowerLimit = form.getFieldValue("lowerLimit");
    const upperLimit = form.getFieldValue("upperLimit");

    if (!lowerLimit || !upperLimit) return Promise.resolve();

    const lower = parseFloat(lowerLimit);
    const upper = parseFloat(upperLimit);

    if (isNaN(lower) || isNaN(upper)) return Promise.resolve();

    if (lower > upper) {
      return Promise.reject("Cận dưới không được lớn hơn cận trên");
    }
    if (lower === upper) {
      return Promise.reject("Cận dưới không được bằng cận trên");
    }

    return Promise.resolve();
  };

  // Reset state when modal closes
  const handleCancel = () => {
    setIsRangeMode(false);
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="Sửa chỉ tiêu trong tiêu chuẩn"
      open={open}
      onOk={onOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="Cập nhật"
      cancelText="Hủy"
      width={isRangeMode ? 550 : 400}
      centered
      styles={{ body: { paddingTop: 16 } }}
    >
      <Form form={form} layout="vertical">
        {indicator && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", marginBottom: 8 }}>
              <Text type="secondary" style={{ width: 100, flexShrink: 0 }}>Chỉ tiêu:</Text>
              <IndicatorName
                name={indicator.indicatorName}
                formattedName={indicator.indicatorFormattedName}
                style={{ fontWeight: 600 }}
              />
            </div>
            <div style={{ display: "flex", marginBottom: 8 }}>
              <Text type="secondary" style={{ width: 100, flexShrink: 0 }}>Phương pháp:</Text>
              <IndicatorName
                name={indicator.testMethodName}
                formattedName={indicator.testMethodFormattedName}
              />
            </div>
            <div style={{ display: "flex" }}>
              <Text type="secondary" style={{ width: 100, flexShrink: 0 }}>Đơn vị:</Text>
              <Text>{indicator.unit}</Text>
            </div>
          </div>
        )}

        <Form.Item name="comparisonOperator" label="So sánh">
          <Select
            options={COMPARISON_OPERATORS}
            placeholder="Chọn so sánh"
            allowClear
            onChange={handleComparisonChange}
          />
        </Form.Item>

        {isRangeMode ? (
          // Range mode: show 4 fields
          <>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  name="lowerOperator"
                  label="Ký hiệu cận dưới"
                  rules={[{ required: true, message: "Chọn ký hiệu" }]}
                >
                  <Select options={LOWER_OPERATORS} placeholder=">" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="lowerLimit"
                  label="Cận dưới"
                  rules={[
                    { required: true, message: "Nhập cận dưới" },
                    { validator: validateRange },
                  ]}
                >
                  <NumericFormat
                    placeholder="VD: 5"
                    allowNegative={false}
                    decimalScale={4}
                    customInput={Input}
                    onValueChange={(values) => {
                      form.setFieldValue("lowerLimit", values.value);
                      // Trigger validation on upperLimit
                      form.validateFields(["upperLimit"]);
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  name="upperOperator"
                  label="Ký hiệu cận trên"
                  rules={[{ required: true, message: "Chọn ký hiệu" }]}
                >
                  <Select options={UPPER_OPERATORS} placeholder="<" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="upperLimit"
                  label="Cận trên"
                  rules={[
                    { required: true, message: "Nhập cận trên" },
                    { validator: validateRange },
                  ]}
                >
                  <NumericFormat
                    placeholder="VD: 10"
                    allowNegative={false}
                    decimalScale={4}
                    customInput={Input}
                    onValueChange={(values) => {
                      form.setFieldValue("upperLimit", values.value);
                      // Trigger validation on lowerLimit
                      form.validateFields(["lowerLimit"]);
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </>
        ) : (
          // Single limit mode
          <Form.Item name="allowedLimit" label="Giới hạn cho phép">
            <NumericFormat
              placeholder="Nhập giới hạn (VD: 0.0001)"
              allowNegative={false}
              decimalScale={4}
              customInput={Input}
              onValueChange={(values) => {
                form.setFieldValue("allowedLimit", values.value);
              }}
            />
          </Form.Item>
        )}

        <Form.Item name="isActive" label="Trạng thái" initialValue={true}>
          <Select>
            <Select.Option value={true}>Hoạt động</Select.Option>
            <Select.Option value={false}>Ngừng</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditIndicatorModal;
