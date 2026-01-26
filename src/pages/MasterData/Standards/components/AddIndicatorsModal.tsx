import React, { useState, useCallback } from "react";
import { Modal, Form, Input, Button, Typography, Select, Divider, Tooltip, message } from "antd";
import { PlusOutlined, MinusCircleOutlined } from "../../../../components/common/Icon";
import Icon from "../../../../components/common/Icon";
import type { FormInstance } from "antd";
import { NumericFormat } from "react-number-format";
import {
  IndicatorDto,
  IndicatorGroupDto,
  TestMethodWithIndicatorsDto,
} from "../../../../services/masterDataService";
import IndicatorName from "../../../../components/common/IndicatorName";
import { COMPARISON_OPERATORS, LOWER_OPERATORS, UPPER_OPERATORS } from "../constants";
import "./AddIndicatorsModal.css";

const { Text } = Typography;

interface IndicatorFormItem {
  indicatorId?: string;
  testMethodId?: string;
  unit?: string;
  comparisonOperator?: string;
  allowedLimit?: string;
  lowerOperator?: string;
  lowerLimit?: string;
  upperOperator?: string;
  upperLimit?: string;
  subIndicators?: SubIndicatorFormItem[];
}

interface SubIndicatorFormItem {
  indicatorId?: string;
  testMethodId?: string;
  unit?: string;
  comparisonOperator?: string;
  allowedLimit?: string;
  lowerOperator?: string;
  lowerLimit?: string;
  upperOperator?: string;
  upperLimit?: string;
}

interface AddIndicatorsModalProps {
  open: boolean;
  loading: boolean;
  form: FormInstance;
  standardName: string;
  indicatorGroups: IndicatorGroupDto[];
  indicatorsByGroup: Record<string, IndicatorDto[]>;
  existingIndicatorIds: string[];
  getMethodsForIndicator: (indicatorId: string) => TestMethodWithIndicatorsDto[];
  onOk: (
    selectedIndicators: Record<number, string>,
    selectedMethods: Record<number, { id: string; unit: string }>
  ) => void;
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
  // Track selected indicators for enabling method select
  const [selectedIndicators, setSelectedIndicators] = useState<Record<number, string>>({});
  // Track selected methods (source of truth since Form.List can lose parent values)
  const [selectedMethods, setSelectedMethods] = useState<Record<number, { id: string; unit: string }>>({});
  // Track comparison modes (key: "parent-{index}" or "sub-{parentIndex}-{subIndex}")
  const [comparisonModes, setComparisonModes] = useState<Record<string, "single" | "range">>({});
  // Track which parents have sub-indicators explicitly added (by clicking + button)
  // This is the SOURCE OF TRUTH for showing sub-indicator container, NOT subFields.length
  const [subIndicatorsAddedCount, setSubIndicatorsAddedCount] = useState<Record<number, number>>({});

  // Watch form indicators for controlled updates (like TestMethods)
  const indicators: IndicatorFormItem[] = Form.useWatch("indicators", form) || [];

  // Find indicator by ID
  const findIndicatorById = useCallback((indicatorId: string): IndicatorDto | undefined => {
    const allIndicators = Object.values(indicatorsByGroup).flat();
    const parent = allIndicators.find((ind) => ind.id === indicatorId);
    if (parent) return parent;
    for (const ind of allIndicators) {
      const sub = ind.subIndicators?.find((s) => s.id === indicatorId);
      if (sub) return sub as IndicatorDto;
    }
    return undefined;
  }, [indicatorsByGroup]);

  // Check if indicator has sub-indicators defined in master data
  const hasSubIndicatorsDefined = useCallback((indicatorId: string): boolean => {
    const indicator = findIndicatorById(indicatorId);
    return !!(indicator?.subIndicators && indicator.subIndicators.length > 0);
  }, [findIndicatorById]);

  // Check if indicator is already selected in another row
  const isIndicatorAlreadySelected = useCallback((indicatorId: string, excludeIndex?: number): boolean => {
    return indicators.some((item, idx) =>
      idx !== excludeIndex && item?.indicatorId === indicatorId
    );
  }, [indicators]);

  // Render indicator label for Select
  const renderIndicatorLabel = (indicatorId: string) => {
    const indicator = findIndicatorById(indicatorId);
    if (!indicator) return indicatorId;
    return (
      <span>
        {indicator.code} - <IndicatorName name={indicator.name} formattedName={indicator.formattedName} />
      </span>
    );
  };

  // Build parent indicator options
  const buildParentOptions = useCallback((currentIndicatorId?: string) => {
    return indicatorGroups
      .filter((group) => group.isActive && indicatorsByGroup[group.id]?.length > 0)
      .map((group) => {
        const parentIndicators = (indicatorsByGroup[group.id] || []).filter(
          (ind) => !ind.parentIndicatorId && ind.isActive
        );

        const availableParents = parentIndicators.filter((ind) => {
          if (ind.id === currentIndicatorId) return true;
          if (existingIndicatorIds.includes(ind.id)) return false;
          if (isIndicatorAlreadySelected(ind.id)) return false;
          const methods = getMethodsForIndicator(ind.id);
          return methods.length > 0;
        });

        if (availableParents.length === 0) return null;

        return {
          label: <Text strong>{group.name}</Text>,
          options: availableParents.map((ind) => ({
            value: ind.id,
            label: (
              <span>
                {ind.code} - <IndicatorName name={ind.name} formattedName={ind.formattedName} />
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
  }, [indicatorGroups, indicatorsByGroup, existingIndicatorIds, getMethodsForIndicator, isIndicatorAlreadySelected]);

  // Build method options for parent
  const buildMethodOptions = useCallback((parentIndex: number) => {
    const indicatorId = selectedIndicators[parentIndex] || indicators[parentIndex]?.indicatorId;
    if (!indicatorId) return [];

    const methods = getMethodsForIndicator(indicatorId);
    return methods.map((method) => ({
      value: method.id,
      label: <IndicatorName name={method.name} formattedName={method.formattedName} />,
      searchText: method.name,
      unit: method.unit,
    }));
  }, [selectedIndicators, indicators, getMethodsForIndicator]);

  // Build sub-indicator options
  const buildSubOptions = useCallback((parentIndex: number, subIndex?: number) => {
    // Use selectedIndicators as primary source, fallback to form data
    const parentIndicatorId = selectedIndicators[parentIndex] || indicators[parentIndex]?.indicatorId;
    if (!parentIndicatorId) return [];

    const parentIndicator = findIndicatorById(parentIndicatorId);
    if (!parentIndicator?.subIndicators?.length) return [];

    const currentSubId = subIndex !== undefined
      ? indicators[parentIndex]?.subIndicators?.[subIndex]?.indicatorId
      : undefined;

    const selectedSubIds = (indicators[parentIndex]?.subIndicators || [])
      .map((sub) => sub?.indicatorId)
      .filter(Boolean);

    const availableSubs = parentIndicator.subIndicators.filter(
      (sub) =>
        sub.id === currentSubId ||
        (!selectedSubIds.includes(sub.id) &&
          sub.isActive &&
          !existingIndicatorIds.includes(sub.id))
    );

    return availableSubs.map((sub) => ({
      value: sub.id,
      label: (
        <span>
          {sub.code} - <IndicatorName name={sub.name} formattedName={sub.formattedName} />
        </span>
      ),
      searchText: `${sub.code} - ${sub.name}`,
    }));
  }, [selectedIndicators, indicators, findIndicatorById, existingIndicatorIds]);

  // Handle parent indicator change
  const handleParentChange = (parentId: string | undefined, parentIndex: number) => {
    const currentIndicators = form.getFieldValue("indicators") || [];

    if (parentId) {
      // Reset all fields when indicator changes
      // IMPORTANT: Always include subIndicators: [] to prevent Form.List auto-initialization issues
      currentIndicators[parentIndex] = {
        indicatorId: parentId,
        testMethodId: undefined,
        unit: "",
        comparisonOperator: undefined,
        allowedLimit: undefined,
        subIndicators: [], // Explicit empty array
      };
      // Track selected indicator for enabling method select
      setSelectedIndicators((prev) => ({ ...prev, [parentIndex]: parentId }));
    } else {
      currentIndicators[parentIndex] = {
        indicatorId: undefined,
        testMethodId: undefined,
        unit: "",
        subIndicators: [], // Explicit empty array
      };
      // Clear selected indicator
      setSelectedIndicators((prev) => {
        const newState = { ...prev };
        delete newState[parentIndex];
        return newState;
      });
    }

    form.setFieldsValue({ indicators: currentIndicators });

    // Clear comparison mode
    setComparisonModes((prev) => {
      const newState = { ...prev };
      delete newState[`parent-${parentIndex}`];
      return newState;
    });

    // Clear sub-indicator count when parent changes
    setSubIndicatorsAddedCount((prev) => {
      const newState = { ...prev };
      delete newState[parentIndex];
      return newState;
    });

    // Clear selected method when indicator changes
    setSelectedMethods((prev) => {
      const newState = { ...prev };
      delete newState[parentIndex];
      return newState;
    });
  };

  // Handle method change
  const handleMethodChange = (
    methodId: string | undefined,
    option: { unit?: string } | undefined,
    parentIndex: number
  ) => {
    const currentIndicators = form.getFieldValue("indicators") || [];
    const current = currentIndicators[parentIndex] || {};
    // Use selectedIndicators as source of truth for indicatorId
    const indicatorId = selectedIndicators[parentIndex] || current.indicatorId;

    // Preserve existing subIndicators array (only if it has actual items)
    const existingSubs = Array.isArray(current.subIndicators) ? current.subIndicators : [];

    if (methodId && option?.unit) {
      const unit = option.unit; // Capture for type safety
      // Track method in state (source of truth)
      setSelectedMethods((prev) => ({
        ...prev,
        [parentIndex]: { id: methodId, unit },
      }));

      // Build new indicator object explicitly (no blind spread)
      currentIndicators[parentIndex] = {
        indicatorId: indicatorId, // Use state as source of truth
        testMethodId: methodId,
        unit: option.unit,
        comparisonOperator: current.comparisonOperator,
        allowedLimit: current.allowedLimit,
        lowerOperator: current.lowerOperator,
        lowerLimit: current.lowerLimit,
        upperOperator: current.upperOperator,
        upperLimit: current.upperLimit,
        // Keep existing sub-indicators and update their testMethodId AND unit
        subIndicators: existingSubs.map((sub: any) => ({
          ...sub,
          testMethodId: methodId,
          unit: option.unit, // Inherit unit from parent's method
        })),
      };
    } else {
      // Clear method from state
      setSelectedMethods((prev) => {
        const newState = { ...prev };
        delete newState[parentIndex];
        return newState;
      });

      currentIndicators[parentIndex] = {
        indicatorId: indicatorId, // Use state as source of truth
        testMethodId: undefined,
        unit: "",
        comparisonOperator: current.comparisonOperator,
        allowedLimit: current.allowedLimit,
        lowerOperator: current.lowerOperator,
        lowerLimit: current.lowerLimit,
        upperOperator: current.upperOperator,
        upperLimit: current.upperLimit,
        // Clear sub-indicators' testMethodId and unit when parent method is cleared
        subIndicators: existingSubs.map((sub: any) => ({
          ...sub,
          testMethodId: undefined,
          unit: "",
        })),
      };
    }

    form.setFieldsValue({ indicators: currentIndicators });
  };

  // Handle comparison change for parent
  const handleComparisonChange = (value: string | undefined, parentIndex: number) => {
    const isRange = value === "range";
    const modeKey = `parent-${parentIndex}`;

    setComparisonModes((prev) => ({
      ...prev,
      [modeKey]: isRange ? "range" : "single",
    }));

    const currentIndicators = form.getFieldValue("indicators") || [];
    const current = currentIndicators[parentIndex] || {};
    const existingSubs = Array.isArray(current.subIndicators) ? current.subIndicators : [];

    if (isRange) {
      currentIndicators[parentIndex] = {
        indicatorId: current.indicatorId,
        testMethodId: current.testMethodId,
        unit: current.unit,
        comparisonOperator: "range",
        allowedLimit: undefined,
        lowerOperator: ">",
        lowerLimit: current.lowerLimit,
        upperOperator: "<",
        upperLimit: current.upperLimit,
        subIndicators: existingSubs,
      };
    } else {
      currentIndicators[parentIndex] = {
        indicatorId: current.indicatorId,
        testMethodId: current.testMethodId,
        unit: current.unit,
        comparisonOperator: value,
        allowedLimit: current.allowedLimit,
        lowerOperator: undefined,
        lowerLimit: undefined,
        upperOperator: undefined,
        upperLimit: undefined,
        subIndicators: existingSubs,
      };
    }
    form.setFieldsValue({ indicators: currentIndicators });
  };

  // Handle comparison change for sub-indicator
  const handleSubComparisonChange = (value: string | undefined, parentIndex: number, subIndex: number) => {
    const isRange = value === "range";
    const modeKey = `sub-${parentIndex}-${subIndex}`;

    setComparisonModes((prev) => ({
      ...prev,
      [modeKey]: isRange ? "range" : "single",
    }));

    const currentIndicators = form.getFieldValue("indicators") || [];
    const subs = currentIndicators[parentIndex]?.subIndicators || [];

    if (isRange) {
      subs[subIndex] = {
        ...subs[subIndex],
        comparisonOperator: "range",
        allowedLimit: undefined,
        lowerOperator: ">",
        upperOperator: "<",
      };
    } else {
      subs[subIndex] = {
        ...subs[subIndex],
        comparisonOperator: value,
        lowerOperator: undefined,
        lowerLimit: undefined,
        upperOperator: undefined,
        upperLimit: undefined,
      };
    }

    currentIndicators[parentIndex].subIndicators = subs;
    form.setFieldsValue({ indicators: currentIndicators });
  };

  // Handle adding sub-indicator - ONLY when clicking + button
  // IMPORTANT: Don't use addSub() from Form.List as it can reset parent fields!
  // Instead, manually set form values to preserve all parent data.
  const handleAddSubIndicator = (parentIndex: number) => {
    const parentIndicatorId = selectedIndicators[parentIndex] || indicators[parentIndex]?.indicatorId;
    const parentMethodId = form.getFieldValue(["indicators", parentIndex, "testMethodId"]);
    const parentUnit = form.getFieldValue(["indicators", parentIndex, "unit"]);

    if (!parentIndicatorId) {
      message.warning("Vui lòng chọn chỉ tiêu trước");
      return;
    }

    if (!parentMethodId) {
      message.warning("Vui lòng chọn phương pháp trước");
      return;
    }

    if (!hasSubIndicatorsDefined(parentIndicatorId)) {
      message.warning("Chỉ tiêu này không có chỉ tiêu phụ");
      return;
    }

    // Get current indicators from form
    const currentIndicators = form.getFieldValue("indicators") || [];
    const currentParent = currentIndicators[parentIndex] || {};

    // Get existing sub-indicators
    const existingSubs = Array.isArray(currentParent.subIndicators) ? currentParent.subIndicators : [];

    // Create new sub-indicator
    const newSub = {
      indicatorId: undefined,
      testMethodId: parentMethodId,
      unit: parentUnit || "",
      comparisonOperator: undefined,
      allowedLimit: undefined,
    };

    // IMPORTANT: Preserve ALL parent fields when adding sub-indicator
    currentIndicators[parentIndex] = {
      indicatorId: parentIndicatorId, // Use selectedIndicators as source of truth
      testMethodId: parentMethodId,
      unit: parentUnit || "",
      comparisonOperator: currentParent.comparisonOperator,
      allowedLimit: currentParent.allowedLimit,
      lowerOperator: currentParent.lowerOperator,
      lowerLimit: currentParent.lowerLimit,
      upperOperator: currentParent.upperOperator,
      upperLimit: currentParent.upperLimit,
      subIndicators: [...existingSubs, newSub],
    };

    // Set form values - this preserves all parent fields
    form.setFieldsValue({ indicators: currentIndicators });

    // Track that we explicitly added a sub-indicator
    const currentCount = subIndicatorsAddedCount[parentIndex] || 0;
    setSubIndicatorsAddedCount((prev) => ({
      ...prev,
      [parentIndex]: currentCount + 1,
    }));
  };

  // Handle removing sub-indicator
  // IMPORTANT: Don't use removeSub() from Form.List as it can reset parent fields!
  // Instead, manually set form values to preserve all parent data.
  const handleRemoveSubIndicator = (parentIndex: number, subIndex: number) => {
    const parentIndicatorId = selectedIndicators[parentIndex] || indicators[parentIndex]?.indicatorId;

    // Get current indicators from form
    const currentIndicators = form.getFieldValue("indicators") || [];
    const currentParent = currentIndicators[parentIndex] || {};

    // Get existing sub-indicators and remove the one at subIndex
    const existingSubs = Array.isArray(currentParent.subIndicators) ? [...currentParent.subIndicators] : [];
    existingSubs.splice(subIndex, 1);

    // IMPORTANT: Preserve ALL parent fields when removing sub-indicator
    currentIndicators[parentIndex] = {
      indicatorId: parentIndicatorId,
      testMethodId: currentParent.testMethodId,
      unit: currentParent.unit || "",
      comparisonOperator: currentParent.comparisonOperator,
      allowedLimit: currentParent.allowedLimit,
      lowerOperator: currentParent.lowerOperator,
      lowerLimit: currentParent.lowerLimit,
      upperOperator: currentParent.upperOperator,
      upperLimit: currentParent.upperLimit,
      subIndicators: existingSubs,
    };

    // Set form values - this preserves all parent fields
    form.setFieldsValue({ indicators: currentIndicators });

    // Decrement count
    setSubIndicatorsAddedCount((prev) => ({
      ...prev,
      [parentIndex]: Math.max(0, (prev[parentIndex] || 0) - 1),
    }));
  };

  // Handle cancel
  const handleCancel = () => {
    setSelectedIndicators({});
    setSelectedMethods({});
    setComparisonModes({});
    setSubIndicatorsAddedCount({});
    onCancel();
  };

  // Handle OK - pass state values directly to onOk
  // This bypasses Form.List issues by using state as source of truth
  const handleOk = () => {
    // Pass state values directly - the hook will use these as source of truth
    onOk(selectedIndicators, selectedMethods);
  };

  // Render limit fields
  const renderLimitFields = (isRangeMode: boolean, pathPrefix: (string | number)[]) => {
    if (isRangeMode) {
      return (
        <div style={{ display: "flex", gap: 4, flex: 1 }}>
          <Form.Item name={[...pathPrefix, "lowerOperator"]} style={{ marginBottom: 0, width: 60 }}>
            <Select options={LOWER_OPERATORS} defaultValue=">" />
          </Form.Item>
          <Form.Item
            name={[...pathPrefix, "lowerLimit"]}
            rules={[{ required: true, message: "Bắt buộc" }]}
            style={{ marginBottom: 0, width: 80 }}
          >
            <NumericFormat
              placeholder="Cận dưới"
              allowNegative={false}
              decimalScale={4}
              customInput={Input}
            />
          </Form.Item>
          <Form.Item name={[...pathPrefix, "upperOperator"]} style={{ marginBottom: 0, width: 60 }}>
            <Select options={UPPER_OPERATORS} defaultValue="<" />
          </Form.Item>
          <Form.Item
            name={[...pathPrefix, "upperLimit"]}
            rules={[{ required: true, message: "Bắt buộc" }]}
            style={{ marginBottom: 0, width: 80 }}
          >
            <NumericFormat
              placeholder="Cận trên"
              allowNegative={false}
              decimalScale={4}
              customInput={Input}
            />
          </Form.Item>
        </div>
      );
    }

    return (
      <Form.Item name={[...pathPrefix, "allowedLimit"]} style={{ marginBottom: 0, flex: 1 }}>
        <NumericFormat
          placeholder="Giới hạn"
          allowNegative={false}
          decimalScale={4}
          customInput={Input}
        />
      </Form.Item>
    );
  };

  return (
    <Modal
      className="standards-add-indicators-modal"
      title={<span style={{ fontSize: 18, fontWeight: 600 }}>Thêm chỉ tiêu so sánh</span>}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="Thêm"
      cancelText="Hủy"
      width={1100}
      centered
      destroyOnClose
    >
      <Text style={{ fontSize: 14 }}>
        Tiêu chuẩn so sánh: <Text strong>{standardName}</Text>
      </Text>
      <Divider style={{ marginTop: 12, marginBottom: 16 }} />

      <Form form={form} layout="vertical" requiredMark>
        {/* Header */}
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <div style={{ width: 32 }} />
          <Text strong style={{ width: 220 }}>Chỉ tiêu <Text type="danger">*</Text></Text>
          <Text strong style={{ width: 200 }}>Phương pháp <Text type="danger">*</Text></Text>
          <Text strong style={{ width: 80 }}>Đơn vị <Text type="danger">*</Text></Text>
          <Text strong style={{ width: 90 }}>So sánh <Text type="danger">*</Text></Text>
          <Text strong style={{ flex: 1 }}>Giới hạn</Text>
          <div style={{ width: 14 }} />
        </div>

        <Form.List name="indicators">
          {(parentFields, { add: addParent, remove: removeParent }) => (
            <>
              {parentFields.map(({ key: parentKey, name: parentName }) => {
                const parentIndicatorId = selectedIndicators[parentName] || indicators[parentName]?.indicatorId;
                const parentHasSubs = parentIndicatorId && hasSubIndicatorsDefined(parentIndicatorId);
                const parentModeKey = `parent-${parentName}`;
                const isParentRangeMode = comparisonModes[parentModeKey] === "range";

                // CRITICAL: Use our state-based count, NOT subFields.length
                // This is because Form.List can have internal state that doesn't match our explicit adds
                const hasSubsAdded = (subIndicatorsAddedCount[parentName] || 0) > 0;

                return (
                  <div key={parentKey} style={{ marginBottom: 16 }}>
                    {/* Parent row - MUST be OUTSIDE nested Form.List to preserve form field paths */}
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      {/* Add sub button - only show if indicator has subs defined in master data */}
                      <div style={{ width: 32, paddingTop: 4 }}>
                        {parentHasSubs && (
                          <Tooltip title="Thêm chỉ tiêu phụ">
                            <Icon
                              name="plus-lg"
                              onClick={() => handleAddSubIndicator(parentName)}
                              style={{ fontSize: 16, color: "#1890ff", cursor: "pointer" }}
                            />
                          </Tooltip>
                        )}
                      </div>

                      {/* Indicator Select */}
                      <Form.Item
                        name={[parentName, "indicatorId"]}
                        rules={[{ required: true, message: "Chọn" }]}
                        style={{ marginBottom: 0, width: 220 }}
                      >
                        <Select
                          options={buildParentOptions(parentIndicatorId)}
                          placeholder="Chọn chỉ tiêu"
                          showSearch
                          allowClear
                          popupMatchSelectWidth={400}
                          labelRender={() => {
                            if (!parentIndicatorId) return null;
                            return renderIndicatorLabel(parentIndicatorId);
                          }}
                          filterOption={(input, option) => {
                            const searchText = (option as { searchText?: string })?.searchText;
                            return searchText?.toLowerCase().includes(input.toLowerCase()) || false;
                          }}
                          onChange={(value) => handleParentChange(value, parentName)}
                        />
                      </Form.Item>

                      {/* Method Select */}
                      <Form.Item
                        name={[parentName, "testMethodId"]}
                        rules={[{ required: true, message: "Chọn" }]}
                        style={{ marginBottom: 0, width: 200 }}
                      >
                        <Select
                          options={buildMethodOptions(parentName)}
                          placeholder="Chọn phương pháp"
                          showSearch
                          allowClear
                          disabled={!selectedIndicators[parentName]}
                          filterOption={(input, option) => {
                            const searchText = (option as { searchText?: string })?.searchText;
                            return searchText?.toLowerCase().includes(input.toLowerCase()) || false;
                          }}
                          onChange={(value, option) =>
                            handleMethodChange(value, option as { unit?: string }, parentName)
                          }
                        />
                      </Form.Item>

                      {/* Unit/Comparison/Limit - hide when has sub-indicators added */}
                      {!hasSubsAdded ? (
                        <>
                          <Form.Item
                            name={[parentName, "unit"]}
                            rules={[{ required: true, message: "Chọn PP" }]}
                            style={{ marginBottom: 0, width: 80 }}
                          >
                            <Input placeholder="ĐVT" disabled />
                          </Form.Item>

                          <Form.Item
                            name={[parentName, "comparisonOperator"]}
                            rules={[{ required: true, message: "Chọn" }]}
                            style={{ marginBottom: 0, width: 90 }}
                          >
                            <Select
                              options={COMPARISON_OPERATORS}
                              placeholder="--"
                              allowClear
                              onChange={(value) => handleComparisonChange(value, parentName)}
                            />
                          </Form.Item>

                          {renderLimitFields(isParentRangeMode, [parentName])}
                        </>
                      ) : (
                        <div style={{ flex: 1 }} />
                      )}

                      {/* Remove button */}
                      <MinusCircleOutlined
                        onClick={() => removeParent(parentName)}
                        style={{
                          color: parentFields.length > 1 ? "#ff4d4f" : "#d9d9d9",
                          marginTop: 8,
                          cursor: parentFields.length > 1 ? "pointer" : "not-allowed",
                          visibility: parentFields.length > 1 ? "visible" : "hidden",
                        }}
                      />
                    </div>

                    {/* Sub-indicators container - ONLY render when explicitly added via + button */}
                    {hasSubsAdded && (
                      <div style={{ marginTop: 8, marginLeft: 32 }}>
                        <div className="standards-sub-container">
                          <Form.List name={[parentName, "subIndicators"]}>
                            {(subFields) => (
                              <>
                                {subFields.map(({ key: subKey, name: subName }, index) => {
                                  const subModeKey = `sub-${parentName}-${subName}`;
                                  const isSubRangeMode = comparisonModes[subModeKey] === "range";

                                  return (
                                    <div
                                      key={subKey}
                                      className={`standards-sub-row ${index === 0 ? "is-first" : ""} ${index === subFields.length - 1 ? "is-last" : ""}`}
                                      style={{
                                        display: "flex",
                                        gap: 8,
                                        marginBottom: index === subFields.length - 1 ? 0 : 12,
                                        alignItems: "flex-start",
                                      }}
                                    >
                                      {/* Sub-indicator Select */}
                                      <Form.Item
                                        name={[subName, "indicatorId"]}
                                        rules={[{ required: true, message: "Chọn" }]}
                                        style={{ marginBottom: 0, width: 160 }}
                                      >
                                        <Select
                                          options={buildSubOptions(parentName, subName)}
                                          placeholder="Chỉ tiêu phụ"
                                          showSearch
                                          allowClear
                                          filterOption={(input, option) => {
                                            const searchText = (option as { searchText?: string })?.searchText;
                                            return searchText?.toLowerCase().includes(input.toLowerCase()) || false;
                                          }}
                                        />
                                      </Form.Item>

                                      {/* Method - disabled */}
                                      <Form.Item
                                        name={[subName, "testMethodId"]}
                                        style={{ marginBottom: 0, width: 160 }}
                                      >
                                        <Select placeholder="(Theo cha)" disabled options={buildMethodOptions(parentName)} />
                                      </Form.Item>

                                      {/* Unit - auto-filled from parent, disabled */}
                                      <Form.Item
                                        name={[subName, "unit"]}
                                        rules={[{ required: true, message: "Chọn PP" }]}
                                        style={{ marginBottom: 0, width: 80 }}
                                      >
                                        <Input placeholder="ĐVT" disabled />
                                      </Form.Item>

                                      {/* Comparison */}
                                      <Form.Item
                                        name={[subName, "comparisonOperator"]}
                                        rules={[{ required: true, message: "Chọn" }]}
                                        style={{ marginBottom: 0, width: 90 }}
                                      >
                                        <Select
                                          options={COMPARISON_OPERATORS}
                                          placeholder="--"
                                          allowClear
                                          onChange={(value) => handleSubComparisonChange(value, parentName, subName)}
                                        />
                                      </Form.Item>

                                      {/* Limit fields */}
                                      {renderLimitFields(isSubRangeMode, [subName])}

                                      {/* Remove sub button */}
                                      <MinusCircleOutlined
                                        onClick={() => handleRemoveSubIndicator(parentName, subName)}
                                        style={{ color: "#ff4d4f", marginTop: 8, cursor: "pointer" }}
                                      />
                                    </div>
                                  );
                                })}
                              </>
                            )}
                          </Form.List>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              <Button
                type="dashed"
                onClick={() => addParent({ indicatorId: undefined, testMethodId: undefined, unit: "", subIndicators: [] })}
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
