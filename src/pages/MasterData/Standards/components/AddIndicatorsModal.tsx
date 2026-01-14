import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Button, Typography, Select, Divider } from "antd";
import { PlusOutlined, MinusCircleOutlined } from "../../../../components/common/Icon";
import type { FormInstance } from "antd";
import { NumericFormat } from "react-number-format";
import {
  IndicatorDto,
  IndicatorGroupDto,
  TestMethodWithIndicatorsDto,
} from "../../../../services/masterDataService";
import IndicatorName from "../../../../components/common/IndicatorName";

const { Text } = Typography;

interface AddIndicatorsModalProps {
  open: boolean;
  loading: boolean;
  form: FormInstance;
  standardName: string;
  indicatorGroups: IndicatorGroupDto[];
  indicatorsByGroup: Record<string, IndicatorDto[]>;
  existingIndicatorIds: string[]; // Indicator IDs already in this standard
  getMethodsForIndicator: (indicatorId: string) => TestMethodWithIndicatorsDto[];
  onOk: () => void;
  onCancel: () => void;
}

const COMPARISON_OPERATORS = [
  { value: "<=", label: "<=" },
  { value: ">=", label: ">=" },
  { value: "<", label: "<" },
  { value: ">", label: ">" },
  { value: "=", label: "=" },
];

const AddIndicatorsModal: React.FC<AddIndicatorsModalProps> = ({
  open,
  loading,
  form,
  standardName,
  indicatorGroups,
  indicatorsByGroup,
  existingIndicatorIds,
  getMethodsForIndicator,
  onOk,
  onCancel,
}) => {
  // Track selected indicators for each row (needed for cascading select)
  const [selectedIndicators, setSelectedIndicators] = useState<Record<number, string>>({});

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedIndicators({});
    }
  }, [open]);

  // Build grouped options for indicator Select
  // Only show indicators that have at least one test method
  const buildIndicatorOptions = (fieldName: number) => {
    return indicatorGroups
      .filter((group) => group.isActive && indicatorsByGroup[group.id]?.length > 0)
      .map((group) => {
        const availableIndicators = (indicatorsByGroup[group.id] || []).filter(
          (ind) =>
            // Check if indicator has at least one test method
            getMethodsForIndicator(ind.id).length > 0 &&
            // Check if not already exists in standard
            !existingIndicatorIds.includes(ind.id) &&
            // Check if not already selected in another row
            !Object.entries(selectedIndicators).some(
              ([fn, id]) => id === ind.id && Number(fn) !== fieldName
            )
        );

        if (availableIndicators.length === 0) return null;

        return {
          label: <Text strong>{group.name}</Text>,
          options: availableIndicators.map((ind) => ({
            value: ind.id,
            label: (
              <span>
                {ind.code} -{" "}
                <IndicatorName name={ind.name} formattedName={ind.formattedName} />
              </span>
            ),
            searchText: `${ind.code} - ${ind.name}`,
            indicator: ind,
          })),
        };
      })
      .filter(Boolean) as {
      label: React.ReactNode;
      options: { value: string; label: React.ReactNode; searchText: string; indicator: IndicatorDto }[];
    }[];
  };

  // Build method options for the selected indicator
  const buildMethodOptions = (fieldName: number) => {
    const indicatorId = selectedIndicators[fieldName];
    if (!indicatorId) return [];

    const methods = getMethodsForIndicator(indicatorId);
    return methods.map((method) => ({
      value: method.id,
      label: method.name,
      unit: method.unit,
    }));
  };

  // Handle indicator selection
  const handleSelectIndicator = (value: string, fieldName: number) => {
    // Clear the method selection when indicator changes
    const indicators = form.getFieldValue("indicators") || [];
    indicators[fieldName] = {
      ...indicators[fieldName],
      indicatorId: value,
      testMethodId: undefined,
      unit: "",
    };
    form.setFieldsValue({ indicators });

    setSelectedIndicators((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  // Handle method selection - auto-fill unit
  const handleSelectMethod = (
    value: string,
    option: { unit: string },
    fieldName: number
  ) => {
    const indicators = form.getFieldValue("indicators") || [];
    indicators[fieldName] = {
      ...indicators[fieldName],
      testMethodId: value,
      unit: option.unit,
    };
    form.setFieldsValue({ indicators });
  };

  // Handle cancel
  const handleCancel = () => {
    setSelectedIndicators({});
    onCancel();
  };

  // Handle remove row
  const handleRemoveRow = (fieldName: number, remove: (index: number) => void) => {
    remove(fieldName);
    setSelectedIndicators((prev) => {
      const newState = { ...prev };
      delete newState[fieldName];
      return newState;
    });
  };

  return (
    <Modal
      title={<span style={{ fontSize: 18, fontWeight: 600 }}>Thêm chỉ tiêu so sánh</span>}
      open={open}
      onOk={onOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="Thêm"
      cancelText="Hủy"
      width={950}
      centered
      forceRender
    >
      <Text style={{ fontSize: 14 }}>
        Tiêu chuẩn so sánh: <Text strong>{standardName}</Text>
      </Text>
      <Divider style={{ marginTop: 12, marginBottom: 16 }} />

      <Form form={form} layout="vertical" requiredMark>
        {/* Header row */}
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <Text strong style={{ width: 280 }}>
            Chỉ tiêu <Text type="danger">*</Text>
          </Text>
          <Text strong style={{ width: 250 }}>
            Phương pháp <Text type="danger">*</Text>
          </Text>
          <Text strong style={{ width: 100 }}>
            Đơn vị <Text type="danger">*</Text>
          </Text>
          <Text strong style={{ width: 80 }}>
            Ký hiệu
          </Text>
          <Text strong style={{ width: 120 }}>
            Giới hạn
          </Text>
          <div style={{ width: 14 }} />
        </div>

        <Form.List name="indicators">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => {
                const indicatorOptions = buildIndicatorOptions(name);
                const methodOptions = buildMethodOptions(name);

                return (
                  <div
                    key={key}
                    style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}
                  >
                    {/* Indicator Select */}
                    <Form.Item
                      {...restField}
                      name={[name, "indicatorId"]}
                      rules={[{ required: true, message: "Chọn" }]}
                      style={{ marginBottom: 0, width: 280 }}
                    >
                      <Select
                        options={indicatorOptions}
                        placeholder="Chọn chỉ tiêu"
                        showSearch
                        filterOption={(inputValue, option) => {
                          const searchText = (option as { searchText?: string })?.searchText;
                          if (!searchText) return false;
                          return searchText.toLowerCase().includes(inputValue.toLowerCase());
                        }}
                        onSelect={(value) => handleSelectIndicator(value, name)}
                        onChange={(value) => {
                          if (!value) {
                            setSelectedIndicators((prev) => {
                              const newState = { ...prev };
                              delete newState[name];
                              return newState;
                            });
                            // Clear method and unit
                            const indicators = form.getFieldValue("indicators") || [];
                            indicators[name] = {
                              ...indicators[name],
                              testMethodId: undefined,
                              unit: "",
                            };
                            form.setFieldsValue({ indicators });
                          }
                        }}
                        allowClear
                      />
                    </Form.Item>

                    {/* Method Select */}
                    <Form.Item
                      {...restField}
                      name={[name, "testMethodId"]}
                      rules={[{ required: true, message: "Chọn" }]}
                      style={{ marginBottom: 0, width: 250 }}
                    >
                      <Select
                        options={methodOptions}
                        placeholder="Chọn phương pháp"
                        showSearch
                        filterOption={(inputValue, option) => {
                          if (!option?.label) return false;
                          const label = String(option.label).toLowerCase();
                          return label.includes(inputValue.toLowerCase());
                        }}
                        onSelect={(value, option) =>
                          handleSelectMethod(value, option as { unit: string }, name)
                        }
                        disabled={!selectedIndicators[name]}
                        allowClear
                      />
                    </Form.Item>

                    {/* Unit (auto-filled, disabled) */}
                    <Form.Item
                      {...restField}
                      name={[name, "unit"]}
                      rules={[{ required: true, message: "Chọn PP" }]}
                      style={{ marginBottom: 0, width: 100 }}
                    >
                      <Input placeholder="Đơn vị" disabled />
                    </Form.Item>

                    {/* Comparison Operator */}
                    <Form.Item
                      {...restField}
                      name={[name, "comparisonOperator"]}
                      style={{ marginBottom: 0, width: 80 }}
                    >
                      <Select
                        options={COMPARISON_OPERATORS}
                        placeholder="--"
                        allowClear
                      />
                    </Form.Item>

                    {/* Allowed Limit */}
                    <Form.Item
                      {...restField}
                      name={[name, "allowedLimit"]}
                      style={{ marginBottom: 0, width: 120 }}
                    >
                      <NumericFormat
                        placeholder="Giới hạn"
                        allowNegative={false}
                        decimalScale={4}
                        customInput={Input}
                        onValueChange={(values) => {
                          const indicators = form.getFieldValue("indicators") || [];
                          indicators[name] = {
                            ...indicators[name],
                            allowedLimit: values.value,
                          };
                          form.setFieldsValue({ indicators });
                        }}
                      />
                    </Form.Item>

                    {/* Remove button */}
                    <MinusCircleOutlined
                      onClick={() => handleRemoveRow(name, remove)}
                      style={{
                        color: fields.length > 1 ? "#ff4d4f" : "#d9d9d9",
                        marginTop: 8,
                        cursor: fields.length > 1 ? "pointer" : "not-allowed",
                        visibility: fields.length > 1 ? "visible" : "hidden",
                      }}
                    />
                  </div>
                );
              })}
              <Button
                type="dashed"
                onClick={() =>
                  add({ indicatorId: undefined, testMethodId: undefined, unit: "" })
                }
                block
                icon={<PlusOutlined />}
                style={{ marginTop: 8 }}
              >
                Thêm dòng
              </Button>
            </>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
};

export default AddIndicatorsModal;
