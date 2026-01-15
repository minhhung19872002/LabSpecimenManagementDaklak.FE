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
import { COMPARISON_OPERATORS, LOWER_OPERATORS, UPPER_OPERATORS } from "../constants";

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
  // Track selected methods for each row (to prevent duplicate indicator+method combinations)
  const [selectedMethods, setSelectedMethods] = useState<Record<number, string>>({});
  // Track comparison mode for each row (single or range)
  const [comparisonModes, setComparisonModes] = useState<Record<number, "single" | "range">>({});

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedIndicators({});
      setSelectedMethods({});
      setComparisonModes({});
    }
  }, [open]);

  // Get used methods for a specific indicator (across all rows except current)
  const getUsedMethodsForIndicator = (indicatorId: string, excludeFieldName: number): string[] => {
    const usedMethods: string[] = [];
    Object.entries(selectedIndicators).forEach(([fn, indId]) => {
      if (indId === indicatorId && Number(fn) !== excludeFieldName) {
        const methodId = selectedMethods[Number(fn)];
        if (methodId) {
          usedMethods.push(methodId);
        }
      }
    });
    return usedMethods;
  };

  // Build grouped options for indicator Select
  // Only show indicators that have at least one available test method
  const buildIndicatorOptions = (fieldName: number) => {
    return indicatorGroups
      .filter((group) => group.isActive && indicatorsByGroup[group.id]?.length > 0)
      .map((group) => {
        const availableIndicators = (indicatorsByGroup[group.id] || []).filter(
          (ind) => {
            // Check if not already exists in standard
            if (existingIndicatorIds.includes(ind.id)) return false;

            // Get all methods for this indicator
            const allMethods = getMethodsForIndicator(ind.id);
            if (allMethods.length === 0) return false;

            // Get methods already used in other rows for this indicator
            const usedMethods = getUsedMethodsForIndicator(ind.id, fieldName);

            // Check if there are any available methods left
            const availableMethods = allMethods.filter(m => !usedMethods.includes(m.id));
            return availableMethods.length > 0;
          }
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

  // Build method options for the selected indicator (excluding already used methods)
  const buildMethodOptions = (fieldName: number) => {
    const indicatorId = selectedIndicators[fieldName];
    if (!indicatorId) return [];

    const allMethods = getMethodsForIndicator(indicatorId);

    // Get methods already used for this indicator in other rows
    const usedMethods = getUsedMethodsForIndicator(indicatorId, fieldName);

    // Filter out used methods
    const availableMethods = allMethods.filter(m => !usedMethods.includes(m.id));

    return availableMethods.map((method) => ({
      value: method.id,
      label: (
        <IndicatorName name={method.name} formattedName={method.formattedName} />
      ),
      searchText: method.name,
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

    // Clear selected method for this row
    setSelectedMethods((prev) => {
      const newState = { ...prev };
      delete newState[fieldName];
      return newState;
    });
  };

  // Handle method selection - auto-fill unit and track selected method
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

    // Track selected method
    setSelectedMethods((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  // Handle comparison operator change
  const handleComparisonChange = (value: string | undefined, fieldName: number) => {
    const isRange = value === "range";
    setComparisonModes((prev) => ({
      ...prev,
      [fieldName]: isRange ? "range" : "single",
    }));

    // Update form fields based on mode
    const indicators = form.getFieldValue("indicators") || [];
    if (!isRange) {
      // Single mode: clear range fields
      indicators[fieldName] = {
        ...indicators[fieldName],
        comparisonOperator: value,
        lowerOperator: undefined,
        lowerLimit: undefined,
        upperOperator: undefined,
        upperLimit: undefined,
      };
    } else {
      // Range mode: keep comparisonOperator as "range" for state tracking,
      // clear single limit field, set default range operators
      indicators[fieldName] = {
        ...indicators[fieldName],
        comparisonOperator: "range",
        allowedLimit: undefined,
        lowerOperator: ">",
        upperOperator: "<",
      };
    }
    form.setFieldsValue({ indicators });
  };

  // Handle cancel
  const handleCancel = () => {
    setSelectedIndicators({});
    setSelectedMethods({});
    setComparisonModes({});
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
    setSelectedMethods((prev) => {
      const newState = { ...prev };
      delete newState[fieldName];
      return newState;
    });
    setComparisonModes((prev) => {
      const newState = { ...prev };
      delete newState[fieldName];
      return newState;
    });
  };

  // Custom validation for range
  const validateRange = (_: unknown, _value: unknown, fieldName: number) => {
    const indicators = form.getFieldValue("indicators") || [];
    const indicator = indicators[fieldName];

    if (comparisonModes[fieldName] !== "range") {
      return Promise.resolve();
    }

    const lowerLimit = parseFloat(indicator?.lowerLimit || "");
    const upperLimit = parseFloat(indicator?.upperLimit || "");

    if (isNaN(lowerLimit) || isNaN(upperLimit)) {
      return Promise.resolve();
    }

    if (lowerLimit > upperLimit) {
      return Promise.reject("Cận dưới không được lớn hơn cận trên");
    }

    if (lowerLimit === upperLimit) {
      return Promise.reject("Cận dưới không được bằng cận trên");
    }

    return Promise.resolve();
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
      width={1100}
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
          <Text strong style={{ width: 250 }}>
            Chỉ tiêu <Text type="danger">*</Text>
          </Text>
          <Text strong style={{ width: 220 }}>
            Phương pháp <Text type="danger">*</Text>
          </Text>
          <Text strong style={{ width: 80 }}>
            Đơn vị <Text type="danger">*</Text>
          </Text>
          <Text strong style={{ width: 90 }}>
            So sánh
          </Text>
          <Text strong style={{ flex: 1 }}>
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
                const isRangeMode = comparisonModes[name] === "range";

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
                      style={{ marginBottom: 0, width: 250 }}
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
                            setSelectedMethods((prev) => {
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
                      style={{ marginBottom: 0, width: 220 }}
                    >
                      <Select
                        options={methodOptions}
                        placeholder="Chọn phương pháp"
                        showSearch
                        filterOption={(inputValue, option) => {
                          const searchText = (option as { searchText?: string })?.searchText;
                          if (!searchText) return false;
                          return searchText.toLowerCase().includes(inputValue.toLowerCase());
                        }}
                        onSelect={(value, option) =>
                          handleSelectMethod(value, option as { unit: string }, name)
                        }
                        onChange={(value) => {
                          if (!value) {
                            // Clear method tracking and unit when method is cleared
                            setSelectedMethods((prev) => {
                              const newState = { ...prev };
                              delete newState[name];
                              return newState;
                            });
                            const indicators = form.getFieldValue("indicators") || [];
                            indicators[name] = {
                              ...indicators[name],
                              unit: "",
                            };
                            form.setFieldsValue({ indicators });
                          }
                        }}
                        disabled={!selectedIndicators[name]}
                        allowClear
                      />
                    </Form.Item>

                    {/* Unit (auto-filled, disabled) */}
                    <Form.Item
                      {...restField}
                      name={[name, "unit"]}
                      rules={[{ required: true, message: "Chọn PP" }]}
                      style={{ marginBottom: 0, width: 80 }}
                    >
                      <Input placeholder="ĐVT" disabled />
                    </Form.Item>

                    {/* Comparison Operator Selector */}
                    <Form.Item
                      {...restField}
                      name={[name, "comparisonOperator"]}
                      style={{ marginBottom: 0, width: 90 }}
                    >
                      <Select
                        options={COMPARISON_OPERATORS}
                        placeholder="--"
                        allowClear
                        onChange={(value) => handleComparisonChange(value, name)}
                      />
                    </Form.Item>

                    {/* Limit fields - conditional rendering */}
                    {isRangeMode ? (
                      // Range mode: 4 fields
                      <div style={{ display: "flex", gap: 4, flex: 1 }}>
                        {/* Lower Operator */}
                        <Form.Item
                          {...restField}
                          name={[name, "lowerOperator"]}
                          style={{ marginBottom: 0, width: 60 }}
                          initialValue=">"
                        >
                          <Select options={LOWER_OPERATORS} />
                        </Form.Item>

                        {/* Lower Limit */}
                        <Form.Item
                          {...restField}
                          name={[name, "lowerLimit"]}
                          rules={[
                            { required: true, message: "Bắt buộc" },
                            { validator: (_, value) => validateRange(_, value, name) }
                          ]}
                          style={{ marginBottom: 0, width: 80 }}
                        >
                          <NumericFormat
                            placeholder="Cận dưới"
                            allowNegative={false}
                            decimalScale={4}
                            customInput={Input}
                            onValueChange={(values) => {
                              const indicators = form.getFieldValue("indicators") || [];
                              indicators[name] = {
                                ...indicators[name],
                                lowerLimit: values.value,
                              };
                              form.setFieldsValue({ indicators });
                            }}
                          />
                        </Form.Item>

                        {/* Upper Operator */}
                        <Form.Item
                          {...restField}
                          name={[name, "upperOperator"]}
                          style={{ marginBottom: 0, width: 60 }}
                          initialValue="<"
                        >
                          <Select options={UPPER_OPERATORS} />
                        </Form.Item>

                        {/* Upper Limit */}
                        <Form.Item
                          {...restField}
                          name={[name, "upperLimit"]}
                          rules={[
                            { required: true, message: "Bắt buộc" },
                            { validator: (_, value) => validateRange(_, value, name) }
                          ]}
                          style={{ marginBottom: 0, width: 80 }}
                        >
                          <NumericFormat
                            placeholder="Cận trên"
                            allowNegative={false}
                            decimalScale={4}
                            customInput={Input}
                            onValueChange={(values) => {
                              const indicators = form.getFieldValue("indicators") || [];
                              indicators[name] = {
                                ...indicators[name],
                                upperLimit: values.value,
                              };
                              form.setFieldsValue({ indicators });
                            }}
                          />
                        </Form.Item>
                      </div>
                    ) : (
                      // Single mode: 1 field (giới hạn)
                      <Form.Item
                        {...restField}
                        name={[name, "allowedLimit"]}
                        style={{ marginBottom: 0, flex: 1 }}
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
                    )}

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
