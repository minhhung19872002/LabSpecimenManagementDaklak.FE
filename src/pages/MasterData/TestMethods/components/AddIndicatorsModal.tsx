import React, { useState } from "react";
import { Modal, Form, InputNumber, Button, Typography, Select } from "antd";
import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";
import type { FormInstance } from "antd";
import { IndicatorDto, IndicatorGroupDto } from "../../../../services/masterDataService";

const { Text } = Typography;

interface AddIndicatorsModalProps {
  open: boolean;
  loading: boolean;
  form: FormInstance;
  indicatorGroups: IndicatorGroupDto[];
  indicatorsByGroup: Record<string, IndicatorDto[]>;
  existingIndicatorIds?: string[];
  onOk: () => void;
  onCancel: () => void;
}

const AddIndicatorsModal: React.FC<AddIndicatorsModalProps> = ({
  open,
  loading,
  form,
  indicatorGroups,
  indicatorsByGroup,
  existingIndicatorIds = [],
  onOk,
  onCancel,
}) => {
  const [selectedIndicators, setSelectedIndicators] = useState<Record<number, string>>({});

  // Build grouped options for Select
  const buildGroupedOptions = (fieldName: number) => {
    return indicatorGroups
      .filter((group) => group.isActive && indicatorsByGroup[group.id]?.length > 0)
      .map((group) => {
        const availableIndicators = (indicatorsByGroup[group.id] || []).filter(
          (ind) =>
            !existingIndicatorIds.includes(ind.id) &&
            !Object.entries(selectedIndicators).some(
              ([fn, id]) => id === ind.id && Number(fn) !== fieldName
            )
        );

        if (availableIndicators.length === 0) return null;

        return {
          label: <Text strong>{group.name}</Text>,
          options: availableIndicators.map((ind) => ({
            value: ind.id,
            label: `${ind.code} - ${ind.name}`,
            indicator: ind,
          })),
        };
      })
      .filter(Boolean) as {
      label: React.ReactNode;
      options: { value: string; label: string; indicator: IndicatorDto }[];
    }[];
  };

  // Handle indicator selection
  const handleSelectIndicator = (
    value: string,
    option: { indicator?: IndicatorDto },
    fieldName: number
  ) => {
    if (!option.indicator) return;
    const indicators = form.getFieldValue("indicators") || [];
    indicators[fieldName] = {
      ...indicators[fieldName],
      unitPrice: 0, // Default value, user can set the price
    };
    form.setFieldsValue({ indicators });
    setSelectedIndicators((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  // Reset state when modal closes
  const handleCancel = () => {
    setSelectedIndicators({});
    onCancel();
  };

  return (
    <Modal
      title="Thêm chỉ tiêu"
      open={open}
      onOk={onOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="Thêm"
      cancelText="Hủy"
      width={500}
      centered
      forceRender
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }} requiredMark>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <Text strong style={{ flex: 1 }}>
            Chỉ tiêu <Text type="danger">*</Text>
          </Text>
          <Text strong style={{ width: 140 }}>
            Đơn giá <Text type="danger">*</Text>
          </Text>
          <div style={{ width: 14 }} />
        </div>
        <Form.List name="indicators">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => {
                const groupedOptions = buildGroupedOptions(name);

                return (
                  <div key={key} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
                    <Form.Item
                      {...restField}
                      name={[name, "indicatorId"]}
                      rules={[{ required: true, message: "Chọn chỉ tiêu" }]}
                      style={{ marginBottom: 0, flex: 1, minWidth: 0 }}
                    >
                      <Select
                        options={groupedOptions}
                        placeholder="Tìm và chọn chỉ tiêu"
                        style={{ width: "100%" }}
                        showSearch
                        popupMatchSelectWidth={400}
                        optionLabelProp="label"
                        filterOption={(inputValue, option) => {
                          if (!option?.label) return false;
                          const label = String(option.label).toLowerCase();
                          return label.includes(inputValue.toLowerCase());
                        }}
                        optionRender={(option) => (
                          <div style={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis"
                          }}>
                            {option.label}
                          </div>
                        )}
                        onSelect={(value, option) =>
                          handleSelectIndicator(
                            value,
                            option as { indicator?: IndicatorDto },
                            name
                          )
                        }
                        onChange={(value) => {
                          if (!value) {
                            setSelectedIndicators((prev) => {
                              const newState = { ...prev };
                              delete newState[name];
                              return newState;
                            });
                          }
                        }}
                        allowClear
                      />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, "unitPrice"]}
                      rules={[
                        { required: true, message: "Nhập giá" },
                        { type: "number", min: 0, message: "Giá >= 0" },
                      ]}
                      style={{ marginBottom: 0, width: 140, flexShrink: 0 }}
                    >
                      <InputNumber<number>
                        placeholder="Đơn giá"
                        min={0}
                        precision={0}
                        controls={false}
                        style={{ width: "100%" }}
                        formatter={(value) =>
                          `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                        }
                        parser={(value) => {
                          const parsed = parseInt(value?.replace(/[^\d]/g, "") || "0", 10);
                          return Math.max(0, parsed);
                        }}
                        addonAfter="đ"
                        onKeyDown={(e) => {
                          if (
                            !/[\d]/.test(e.key) &&
                            !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)
                          ) {
                            e.preventDefault();
                          }
                        }}
                      />
                    </Form.Item>
                    <MinusCircleOutlined
                      onClick={() => {
                        remove(name);
                        setSelectedIndicators((prev) => {
                          const newState = { ...prev };
                          delete newState[name];
                          return newState;
                        });
                      }}
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
                onClick={() => add({ indicatorId: undefined, unitPrice: 0 })}
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
