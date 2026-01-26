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
  Card,
} from "antd";
import Icon from "../../../../components/common/Icon";
import type { FormInstance } from "antd";
import {
  IndicatorDto,
  IndicatorGroupDto,
} from "../../../../services/masterDataService";
import IndicatorName from "../../../../components/common/IndicatorName";
import "./AddIndicatorsModal.css";

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

    if (!parentIndicatorId) return [];

    // Find parent indicator from all groups
    const allIndicators = Object.values(indicatorsByGroup).flat();
    const parentIndicator = allIndicators.find((ind) => ind.id === parentIndicatorId);

    if (!parentIndicator) return [];

    if (!parentIndicator.subIndicators || parentIndicator.subIndicators.length === 0) {
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

    return availableSubs.map((sub) => ({
      value: sub.id,
      label: (
        <span>
          {sub.code} -{" "}
          <IndicatorName name={sub.name} formattedName={sub.formattedName} />
        </span>
      ),
      searchText: `${sub.code} - ${sub.name}`,
    }));
  };

  // Handle parent indicator selection
  const handleParentChange = (parentId: string, parentFieldName: number) => {
    // Clear sub-indicators when parent changes
    const indicators = form.getFieldValue("indicators") || [];
    if (indicators[parentFieldName]) {
      indicators[parentFieldName].subIndicators = [];
    }

    // Set default unit price while keeping indicatorId
    form.setFieldsValue({
      indicators: {
        [parentFieldName]: {
          indicatorId: parentId,
          unitPrice: 0,
          subIndicators: [],
        },
      },
    });

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
      className="add-indicators-modal"
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
      styles={{
        body: { paddingTop: 16, maxHeight: "70vh", overflowY: "auto" },
      }}
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
              <Card size="small" style={{ marginBottom: 16 }}>
                {parentFields.map(
                  ({ key: parentKey, name: parentName, ...restField }) => (
                    <div
                      key={parentKey}
                      style={{
                        marginBottom:
                          parentName === parentFields.length - 1 ? 0 : 24,
                      }}
                    >
                      {/* Nested Form.List for sub-indicators */}
                      <Form.List name={[parentName, "subIndicators"]}>
                        {(subFields, { add: addSub, remove: removeSub }) => (
                          <>
                            {/* Parent indicator row */}
                            <Row gutter={8} align="middle" wrap={false}>
                              <Col flex="32px">
                                <Tooltip title="Thêm chỉ tiêu phụ">
                                  <Icon
                                    name="plus-lg"
                                    onClick={() =>
                                      addSub({
                                        indicatorId: undefined,
                                        unitPrice: undefined,
                                      })
                                    }
                                    style={{
                                      fontSize: 16,
                                      color: "#8C8C8C",
                                      cursor: "pointer",
                                    }}
                                  />
                                </Tooltip>
                              </Col>
                              <Col flex="auto">
                                <div
                                  className={`add-indicators-parent-wrapper ${subFields.length > 0 ? "has-children" : ""}`}
                                >
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
                                </div>
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
                                  <Tooltip title="Xóa chỉ tiêu">
                                    <Icon
                                      name="trash3"
                                      onClick={() => removeParent(parentName)}
                                      style={{
                                        fontSize: 16,
                                        color: "#CF1322",
                                        cursor: "pointer",
                                      }}
                                    />
                                  </Tooltip>
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
                                      padding: "12px 12px 12px 32px",
                                      background: "#F5F5F5",
                                      borderRadius: "12px",
                                      position: "relative",
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
                                                : 12,
                                          }}
                                        >
                                          <Col flex="auto">
                                            <div
                                              className={`add-indicators-sub-wrapper ${index === 0 ? "is-first" : ""} ${index === subFields.length - 1 ? "is-last" : ""}`}
                                            >
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
                                            </div>
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
                                            <Tooltip title="Xóa chỉ tiêu phụ">
                                              <Icon
                                                name="trash3"
                                                onClick={() => removeSub(subName)}
                                                style={{
                                                  fontSize: 16,
                                                  color: "#CF1322",
                                                  cursor: "pointer",
                                                }}
                                              />
                                            </Tooltip>
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
              </Card>

              {/* Add parent button */}
              <Form.Item style={{ margin: "12px 0px" }}>
                <Button
                  type="default"
                  onClick={() =>
                    addParent({
                      indicatorId: undefined,
                      unitPrice: 0,
                      subIndicators: [],
                    })
                  }
                  icon={<Icon name="plus-lg" />}
                >
                  Thêm dòng
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
};

export default AddIndicatorsModal;
