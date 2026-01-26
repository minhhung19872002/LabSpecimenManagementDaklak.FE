import React, { useState } from "react";
import {
  Modal,
  Form,
  InputNumber,
  Button,
  Typography,
  Select,
  Row,
  Col,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  MinusCircleOutlined,
} from "../../../../components/common/Icon";
import type { FormInstance } from "antd";
import {
  IndicatorDto,
  IndicatorGroupDto,
} from "../../../../services/masterDataService";
import IndicatorName from "../../../../components/common/IndicatorName";

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
  const [selectedParentIds, setSelectedParentIds] = useState<Set<string>>(
    new Set(),
  );

  // DEBUG: Log indicatorsByGroup when modal opens
  React.useEffect(() => {
    if (open) {
      console.log('🔍 AddIndicatorsModal - indicatorsByGroup:', indicatorsByGroup);
      const allIndicators = Object.values(indicatorsByGroup).flat();
      console.log('🔍 All indicators flattened:', allIndicators);
      console.log('🔍 Indicators with subIndicators:', allIndicators.filter(ind => ind.subIndicators && ind.subIndicators.length > 0));
    }
  }, [open, indicatorsByGroup]);

  // Check if indicator is already selected
  const isIndicatorAlreadySelected = (indicatorId: string) => {
    const allIndicators = form.getFieldValue("indicators") || [];
    return allIndicators.some((item: any) => item?.indicatorId === indicatorId);
  };

  // Build parent-only options for Select
  const buildParentOptions = () => {
    return indicatorGroups
      .filter(
        (group) => group.isActive && indicatorsByGroup[group.id]?.length > 0,
      )
      .map((group) => {
        // Filter: Only PARENT indicators (no parentIndicatorId)
        const parentIndicators = (indicatorsByGroup[group.id] || []).filter(
          (ind) => !ind.parentIndicatorId && ind.isActive,
        );

        // Filter out already selected parents and existing indicators
        const availableParents = parentIndicators.filter(
          (ind) =>
            !isIndicatorAlreadySelected(ind.id) &&
            !existingIndicatorIds.includes(ind.id),
        );

        if (availableParents.length === 0) return null;

        return {
          label: <Text strong>{group.name}</Text>,
          options: availableParents.map((ind) => ({
            value: ind.id,
            label: (
              <span>
                {ind.code} -{" "}
                <IndicatorName
                  name={ind.name}
                  formattedName={ind.formattedName}
                />
              </span>
            ),
            searchText: `${ind.code} - ${ind.name}`,
          })),
        };
      })
      .filter(Boolean) as {
      label: React.ReactNode;
      options: { value: string; label: React.ReactNode; searchText: string }[];
    }[];
  };

  // Build sub-indicator options for a specific parent
  const buildSubOptions = (parentFieldName: number) => {
    // Get selected parent indicator ID
    const parentIndicatorId = form.getFieldValue([
      "indicators",
      parentFieldName,
      "indicatorId",
    ]);
    console.log('🔍 buildSubOptions - parentIndicatorId:', parentIndicatorId);

    if (!parentIndicatorId) return [];

    // Find parent indicator from all groups
    const allIndicators = Object.values(indicatorsByGroup).flat();
    console.log('🔍 buildSubOptions - searching in', allIndicators.length, 'indicators');

    const parentIndicator = allIndicators.find((ind) => ind.id === parentIndicatorId);
    console.log('🔍 buildSubOptions - found parentIndicator:', parentIndicator);

    if (!parentIndicator) {
      console.warn('❌ Parent indicator not found:', parentIndicatorId);
      return [];
    }

    console.log('🔍 buildSubOptions - parentIndicator.subIndicators:', parentIndicator.subIndicators);

    if (!parentIndicator.subIndicators || parentIndicator.subIndicators.length === 0) {
      console.log('⚠️ No sub-indicators for parent:', parentIndicator.code, parentIndicator.name);
      return [];
    }

    // Get already selected sub-indicator IDs for this parent
    const selectedSubIds = (
      form.getFieldValue(["indicators", parentFieldName, "subIndicators"]) || []
    )
      .map((sub: any) => sub?.indicatorId)
      .filter(Boolean);

    // Filter available sub-indicators
    const availableSubs = parentIndicator.subIndicators.filter(
      (sub) =>
        !selectedSubIds.includes(sub.id) &&
        sub.isActive &&
        !existingIndicatorIds.includes(sub.id),
    );

    console.log('🔍 buildSubOptions - available subs after filtering:', availableSubs);

    const options = availableSubs.map((sub) => ({
      value: sub.id,
      label: (
        <span>
          {sub.code} -{" "}
          <IndicatorName name={sub.name} formattedName={sub.formattedName} />
        </span>
      ),
      searchText: `${sub.code} - ${sub.name}`,
    }));

    console.log('✅ buildSubOptions - returning', options.length, 'options');
    return options;
  };

  // Handle parent indicator selection
  const handleParentChange = (parentId: string, parentFieldName: number) => {
    console.log('🔍 handleParentChange - parentId:', parentId, 'fieldName:', parentFieldName);

    // Clear sub-indicators when parent changes
    const indicators = form.getFieldValue("indicators") || [];
    if (indicators[parentFieldName]) {
      indicators[parentFieldName].subIndicators = [];
    }

    // Set default unit price while keeping indicatorId
    form.setFieldsValue({
      indicators: {
        [parentFieldName]: {
          indicatorId: parentId,  // MUST set this explicitly
          unitPrice: 0,
          subIndicators: [],
        },
      },
    });

    // Verify form value was set
    const updatedValue = form.getFieldValue(["indicators", parentFieldName, "indicatorId"]);
    console.log('✅ handleParentChange - updated indicatorId:', updatedValue);

    // Update selected parent IDs
    setSelectedParentIds((prev) => {
      const newSet = new Set(prev);
      newSet.add(parentId);
      return newSet;
    });
  };

  // Reset state when modal closes
  const handleCancel = () => {
    setSelectedParentIds(new Set());
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
      width={700}
      centered
      forceRender
    >
      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: 16 }}
        requiredMark
      >
        <Form.List name="indicators">
          {(parentFields, { add: addParent, remove: removeParent }) => (
            <>
              {parentFields.map(
                ({ key: parentKey, name: parentName, ...restField }) => (
                  <div key={parentKey} style={{ marginBottom: 16 }}>
                    {/* Nested Form.List for sub-indicators */}
                    <Form.List name={[parentName, "subIndicators"]}>
                      {(subFields, { add: addSub, remove: removeSub }) => (
                        <>
                          {/* Parent indicator row */}
                          <Row gutter={8} align="middle" wrap={false}>
                            <Col flex="32px">
                              <Tooltip title="Thêm chỉ tiêu phụ">
                                <span>
                                  <PlusOutlined
                                    onClick={() =>
                                      addSub({
                                        indicatorId: undefined,
                                        unitPrice: undefined,
                                      })
                                    }
                                    style={{
                                      fontSize: 16,
                                      color: "#1890ff",
                                      cursor: "pointer",
                                    }}
                                  />
                                </span>
                              </Tooltip>
                            </Col>
                            <Col flex="auto">
                              <Form.Item
                                {...restField}
                                name={[parentName, "indicatorId"]}
                                rules={[
                                  { required: true, message: "Chọn chỉ tiêu" },
                                ]}
                                style={{ marginBottom: 0 }}
                              >
                                <Select
                                  options={buildParentOptions()}
                                  placeholder="Tìm và chọn chỉ tiêu cha"
                                  showSearch
                                  popupMatchSelectWidth={400}
                                  optionLabelProp="label"
                                  filterOption={(inputValue, option) => {
                                    const searchText = (
                                      option as { searchText?: string }
                                    )?.searchText;
                                    if (!searchText) return false;
                                    return searchText
                                      .toLowerCase()
                                      .includes(inputValue.toLowerCase());
                                  }}
                                  onChange={(value) => {
                                    if (value) {
                                      handleParentChange(value, parentName);
                                    }
                                  }}
                                  allowClear
                                />
                              </Form.Item>
                            </Col>
                            <Col flex="140px">
                              <Form.Item
                                {...restField}
                                name={[parentName, "unitPrice"]}
                                rules={[
                                  { required: true, message: "Nhập giá" },
                                  {
                                    type: "number",
                                    min: 0,
                                    message: "Giá >= 0",
                                  },
                                ]}
                                style={{ marginBottom: 0 }}
                              >
                                <InputNumber<number>
                                  placeholder="Đơn giá"
                                  min={0}
                                  precision={0}
                                  controls={false}
                                  style={{ width: "100%" }}
                                  formatter={(value) =>
                                    `${value}`.replace(
                                      /\B(?=(\d{3})+(?!\d))/g,
                                      ",",
                                    )
                                  }
                                  parser={(value) => {
                                    const parsed = parseInt(
                                      value?.replace(/[^\d]/g, "") || "0",
                                      10,
                                    );
                                    return Math.max(0, parsed);
                                  }}
                                  addonAfter="đ"
                                  onKeyDown={(e) => {
                                    if (
                                      !/[\d]/.test(e.key) &&
                                      ![
                                        "Backspace",
                                        "Delete",
                                        "ArrowLeft",
                                        "ArrowRight",
                                        "Tab",
                                      ].includes(e.key)
                                    ) {
                                      e.preventDefault();
                                    }
                                  }}
                                />
                              </Form.Item>
                            </Col>
                            <Col flex="32px">
                              {parentFields.length > 1 && (
                                <MinusCircleOutlined
                                  onClick={() => removeParent(parentName)}
                                  style={{
                                    fontSize: 16,
                                    color: "#ff4d4f",
                                    cursor: "pointer",
                                  }}
                                />
                              )}
                            </Col>
                          </Row>

                          {/* Sub-indicators container */}
                          {subFields.length > 0 && (
                            <Row gutter={8} style={{ marginTop: 12 }}>
                              <Col flex="32px" />
                              <Col flex="auto">
                                <div
                                  style={{
                                    padding: "12px",
                                    background: "#fafafa",
                                    borderRadius: "8px",
                                  }}
                                >
                                  {subFields.map(
                                    ({ key: subKey, name: subName }, index) => (
                                      <Row
                                        key={subKey}
                                        gutter={8}
                                        align="middle"
                                        wrap={false}
                                        style={{
                                          marginBottom:
                                            index === subFields.length - 1
                                              ? 0
                                              : 8,
                                        }}
                                      >
                                        <Col flex="auto">
                                          <Form.Item
                                            name={[subName, "indicatorId"]}
                                            dependencies={[[parentName, "indicatorId"]]}
                                            rules={[
                                              {
                                                required: true,
                                                message: "Chọn chỉ tiêu phụ",
                                              },
                                            ]}
                                            style={{ marginBottom: 0 }}
                                          >
                                            <Select
                                              key={form.getFieldValue([
                                                "indicators",
                                                parentName,
                                                "indicatorId",
                                              ])}
                                              options={buildSubOptions(
                                                parentName,
                                              )}
                                              placeholder="Chọn chỉ tiêu phụ"
                                              showSearch
                                              popupMatchSelectWidth={400}
                                              optionLabelProp="label"
                                              filterOption={(
                                                inputValue,
                                                option,
                                              ) => {
                                                const searchText = (
                                                  option as {
                                                    searchText?: string;
                                                  }
                                                )?.searchText;
                                                if (!searchText) return false;
                                                return searchText
                                                  .toLowerCase()
                                                  .includes(
                                                    inputValue.toLowerCase(),
                                                  );
                                              }}
                                              allowClear
                                            />
                                          </Form.Item>
                                        </Col>
                                        <Col flex="140px">
                                          <Form.Item
                                            name={[subName, "unitPrice"]}
                                            rules={[
                                              {
                                                type: "number",
                                                min: 0,
                                                message: "Giá >= 0",
                                              },
                                              // No required rule for sub-indicators
                                            ]}
                                            style={{ marginBottom: 0 }}
                                          >
                                            <InputNumber<number>
                                              placeholder="Đơn giá (tùy chọn)"
                                              min={0}
                                              precision={0}
                                              controls={false}
                                              style={{ width: "100%" }}
                                              formatter={(value) =>
                                                `${value}`.replace(
                                                  /\B(?=(\d{3})+(?!\d))/g,
                                                  ",",
                                                )
                                              }
                                              parser={(value) => {
                                                const parsed = parseInt(
                                                  value?.replace(
                                                    /[^\d]/g,
                                                    "",
                                                  ) || "0",
                                                  10,
                                                );
                                                return Math.max(0, parsed);
                                              }}
                                              addonAfter="đ"
                                              onKeyDown={(e) => {
                                                if (
                                                  !/[\d]/.test(e.key) &&
                                                  ![
                                                    "Backspace",
                                                    "Delete",
                                                    "ArrowLeft",
                                                    "ArrowRight",
                                                    "Tab",
                                                  ].includes(e.key)
                                                ) {
                                                  e.preventDefault();
                                                }
                                              }}
                                            />
                                          </Form.Item>
                                        </Col>
                                        <Col flex="32px">
                                          <MinusCircleOutlined
                                            onClick={() => removeSub(subName)}
                                            style={{
                                              fontSize: 16,
                                              color: "#ff4d4f",
                                              cursor: "pointer",
                                            }}
                                          />
                                        </Col>
                                      </Row>
                                    ),
                                  )}
                                </div>
                              </Col>
                              <Col flex="32px" />
                            </Row>
                          )}
                        </>
                      )}
                    </Form.List>
                  </div>
                ),
              )}

              {/* Add parent button */}
              <Button
                type="dashed"
                onClick={() =>
                  addParent({
                    indicatorId: undefined,
                    unitPrice: 0,
                    subIndicators: [],
                  })
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
