import React, { useState, useEffect } from "react";
import { Modal, Form, InputNumber, Select, Checkbox } from "antd";
import {
  IndicatorMethodDto,
  SpecimenTypeDto,
  TestMethodDto,
} from "../../../../services/masterDataService";
import { IndicatorName, RichTextEditor } from "../../../../components/common";

interface EditMethodModalProps {
  open: boolean;
  loading: boolean;
  indicatorName: string;
  indicatorFormattedName?: string;
  record: IndicatorMethodDto | null;
  specimenTypes: SpecimenTypeDto[];
  testMethods: TestMethodDto[];
  existingMethodKeys: { testMethodId: string; specimenTypeId?: string }[];
  onOk: (data: {
    unitPrice: number;
    unit: string;
    formattedUnit: string;
    newTestMethodId?: string;
    newSpecimenTypeId?: string;
    isSubcontract: boolean;
  }) => void;
  onCancel: () => void;
}

const EditMethodModal: React.FC<EditMethodModalProps> = ({
  open,
  loading,
  indicatorName,
  indicatorFormattedName,
  record,
  specimenTypes,
  testMethods,
  existingMethodKeys,
  onOk,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const [formattedUnit, setFormattedUnit] = useState("");
  const [unit, setUnit] = useState("");
  const [selectedTestMethodId, setSelectedTestMethodId] = useState<string | undefined>();
  const [selectedSpecimenTypeId, setSelectedSpecimenTypeId] = useState<string | undefined>();
  const [isSubcontract, setIsSubcontract] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  useEffect(() => {
    if (open && record) {
      form.setFieldsValue({ unitPrice: record.unitPrice });
      setFormattedUnit(record.formattedUnit || record.unit || "");
      setUnit(record.unit || "");
      setSelectedTestMethodId(record.testMethodId);
      setSelectedSpecimenTypeId(record.specimenTypeId);
      setIsSubcontract(record.isSubcontract ?? false);
      setDuplicateError(null);
    }
  }, [open, record, form]);

  // Check duplicate when testMethod or specimenType changes
  useEffect(() => {
    if (!record || !selectedTestMethodId) return;

    const isChanged =
      selectedTestMethodId !== record.testMethodId ||
      selectedSpecimenTypeId !== record.specimenTypeId;

    if (!isChanged) {
      setDuplicateError(null);
      return;
    }

    const isDuplicate = existingMethodKeys.some(
      (k) =>
        k.testMethodId === selectedTestMethodId &&
        (k.specimenTypeId || undefined) === (selectedSpecimenTypeId || undefined)
    );

    if (isDuplicate) {
      const stName = specimenTypes.find((st) => st.id === selectedSpecimenTypeId)?.name || "nền mẫu";
      setDuplicateError(`Đã tồn tại phương pháp cho ${indicatorName} của ${stName}`);
    } else {
      setDuplicateError(null);
    }
  }, [selectedTestMethodId, selectedSpecimenTypeId, record, existingMethodKeys, specimenTypes, indicatorName]);

  const specimenTypeOptions = specimenTypes
    .filter((st) => st.isActive)
    .map((st) => ({
      value: st.id,
      label: `${st.code} - ${st.name}`,
    }));

  const testMethodOptions = testMethods
    .filter((tm) => tm.isActive)
    .map((tm) => ({
      value: tm.id,
      label: tm.formattedName ? (
        <IndicatorName name={tm.name} formattedName={tm.formattedName} />
      ) : (
        `${tm.code} - ${tm.name}`
      ),
      searchText: `${tm.code} ${tm.name}`,
    }));

  const handleOk = async () => {
    if (duplicateError) return;

    try {
      const values = await form.validateFields();

      const data: {
        unitPrice: number;
        unit: string;
        formattedUnit: string;
        newTestMethodId?: string;
        newSpecimenTypeId?: string;
        isSubcontract: boolean;
      } = {
        unitPrice: values.unitPrice,
        unit,
        formattedUnit,
        isSubcontract,
      };

      // Only send new IDs if changed
      if (record && selectedTestMethodId !== record.testMethodId) {
        data.newTestMethodId = selectedTestMethodId;
      }
      if (record && selectedSpecimenTypeId !== record.specimenTypeId) {
        data.newSpecimenTypeId = selectedSpecimenTypeId || "00000000-0000-0000-0000-000000000000";
      }

      onOk(data);
    } catch {
      // validation failed
    }
  };

  return (
    <Modal
      title="Sửa phương pháp"
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      okText="Cập nhật"
      cancelText="Hủy"
      okButtonProps={{ disabled: !!duplicateError }}
      width={500}
      centered
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item label="Chỉ tiêu">
          <IndicatorName
            name={indicatorName}
            formattedName={indicatorFormattedName}
            style={{ fontWeight: 600 }}
          />
        </Form.Item>

        <Form.Item
          label="Nền mẫu"
          validateStatus={duplicateError ? "error" : undefined}
          help={duplicateError}
        >
          <Select
            value={selectedSpecimenTypeId}
            onChange={(v) => setSelectedSpecimenTypeId(v)}
            options={specimenTypeOptions}
            placeholder="Chọn nền mẫu"
            showSearch
            filterOption={(input, option) =>
              (option?.label as string ?? "")
                .toLowerCase()
                .includes(input.toLowerCase())
            }
            allowClear
          />
        </Form.Item>

        <Form.Item label="Phương pháp">
          <Select
            value={selectedTestMethodId}
            onChange={(v) => setSelectedTestMethodId(v)}
            options={testMethodOptions}
            placeholder="Chọn phương pháp"
            showSearch
            filterOption={(input, option) => {
              const searchText = (option as { searchText?: string })?.searchText;
              if (!searchText) return false;
              return searchText.toLowerCase().includes(input.toLowerCase());
            }}
          />
        </Form.Item>

        <Form.Item label="Đơn vị tính">
          <RichTextEditor
            value={formattedUnit}
            onChange={(html, plainText) => {
              setFormattedUnit(html);
              setUnit(plainText);
            }}
            placeholder="Nhập đơn vị tính"
          />
        </Form.Item>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <span>Hợp đồng phụ</span>
          <Checkbox
            checked={isSubcontract}
            onChange={(e) => setIsSubcontract(e.target.checked)}
          />
        </div>

        <Form.Item
          name="unitPrice"
          label="Đơn giá (VNĐ)"
          rules={[
            { required: true, message: "Vui lòng nhập đơn giá" },
            { type: "number", min: 0, message: "Đơn giá phải >= 0" },
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

export default EditMethodModal;
