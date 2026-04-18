import React, { useEffect } from "react";
import { Modal, Form, InputNumber, Input, Typography } from "antd";
import { TestMethodIndicatorDto } from "../types";
import { IndicatorName } from "../../../../components/common";

const { Text } = Typography;

interface EditIndicatorModalProps {
  open: boolean;
  loading: boolean;
  indicator: TestMethodIndicatorDto | null;
  onOk: (data: { unitPrice: number; unit?: string; formattedUnit?: string }) => void;
  onCancel: () => void;
}

const EditIndicatorModal: React.FC<EditIndicatorModalProps> = ({
  open,
  loading,
  indicator,
  onOk,
  onCancel,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open && indicator) {
      form.setFieldsValue({
        unitPrice: indicator.unitPrice,
        unit: indicator.unit || "",
        formattedUnit: indicator.formattedUnit || "",
      });
    }
  }, [open, indicator, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onOk({
        unitPrice: values.unitPrice,
        unit: values.unit || undefined,
        formattedUnit: values.formattedUnit || undefined,
      });
    } catch {
      // validation failed
    }
  };

  return (
    <Modal
      title="Sửa chỉ tiêu trong phương pháp"
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      okText="Cập nhật"
      cancelText="Hủy"
      width={450}
      centered
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item label="Chỉ tiêu">
          <IndicatorName
            name={indicator?.indicatorName || ""}
            formattedName={indicator?.indicatorFormattedName}
            style={{ fontWeight: 600 }}
          />
        </Form.Item>

        {indicator?.specimenTypeName && (
          <Form.Item label="Nền mẫu">
            <Text>
              {indicator.specimenTypeCode} - {indicator.specimenTypeName}
            </Text>
          </Form.Item>
        )}

        <Form.Item
          name="unit"
          label="Đơn vị tính"
          rules={[
            { max: 100, message: "Đơn vị tính không được vượt quá 100 ký tự" },
          ]}
        >
          <Input placeholder="Nhập đơn vị tính (VD: mg/L, CFU/mL)" />
        </Form.Item>

        <Form.Item
          name="unitPrice"
          label="Đơn giá (VNĐ)"
          rules={[
            { required: true, message: "Vui lòng nhập đơn giá" },
            {
              type: "number",
              min: 0,
              message: "Đơn giá phải >= 0",
            },
          ]}
        >
          <InputNumber
            style={{ width: "100%" }}
            formatter={(value) =>
              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            }
            parser={(value) => value?.replace(/\$\s?|(,*)/g, "") as any}
            placeholder="Nhập đơn giá"
            min={0}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditIndicatorModal;
