import React, { useState, useCallback } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  Typography,
  Select,
  Divider,
  Card,
} from "antd";
import {
  PlusOutlined,
  MinusCircleOutlined,
} from "../../../../components/common/Icon";
import type { FormInstance } from "antd";
import {
  IndicatorDto,
  IndicatorGroupDto,
  TestMethodWithIndicatorsDto,
  SpecimenTypeDto,
} from "../../../../services/masterDataService";
import { IndicatorName, LimitInput, extractPlainTextFromLimit } from "../../../../components/common";
import { parseResultToNumber } from "../../../../utils/formatters";
import {
  COMPARISON_OPERATORS,
  LOWER_OPERATORS,
  UPPER_OPERATORS,
} from "../constants";
import "./AddIndicatorsModal.css";

const { Text } = Typography;

interface IndicatorFormItem {
  specimenTypeId?: string; // Nền mẫu - bắt buộc
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

interface ExistingIndicatorKey {
  indicatorId: string;
  specimenTypeId?: string;
}

interface AddIndicatorsModalProps {
  open: boolean;
  loading: boolean;
  form: FormInstance;
  standardName: string;
  indicatorGroups: IndicatorGroupDto[];
  indicatorsByGroup: Record<string, IndicatorDto[]>;
  specimenTypes: SpecimenTypeDto[];
  existingIndicatorKeys: ExistingIndicatorKey[];
  getMethodsForIndicator: (
    indicatorId: string,
  ) => TestMethodWithIndicatorsDto[];
  getIndicatorsBySpecimenType: (specimenTypeId: string) => IndicatorDto[];
  onOk: (
    selectedIndicators: Record<number, string>,
    selectedMethods: Record<number, { id: string; unit: string }>,
    selectedSpecimenTypes: Record<number, string>,
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
  specimenTypes,
  existingIndicatorKeys,
  getMethodsForIndicator,
  getIndicatorsBySpecimenType,
  onOk,
  onCancel,
}) => {
  // Track selected specimen types for filtering indicators
  const [selectedSpecimenTypes, setSelectedSpecimenTypes] = useState<
    Record<number, string>
  >({});
  // Track selected indicators for enabling method select
  const [selectedIndicators, setSelectedIndicators] = useState<
    Record<number, string>
  >({});
  // Track selected methods (source of truth since Form.List can lose parent values)
  const [selectedMethods, setSelectedMethods] = useState<
    Record<number, { id: string; unit: string }>
  >({});
  // Track comparison modes (key: "parent-{index}" or "sub-{parentIndex}-{subIndex}")
  const [comparisonModes, setComparisonModes] = useState<
    Record<string, "single" | "range">
  >({});
  // Track which parents have sub-indicators explicitly added (by clicking + button)
  // This is the SOURCE OF TRUTH for showing sub-indicator container, NOT subFields.length
  const [subIndicatorsAddedCount, setSubIndicatorsAddedCount] = useState<
    Record<number, number>
  >({});

  // Watch form indicators for controlled updates (like TestMethods)
  const indicators: IndicatorFormItem[] =
    Form.useWatch("indicators", form) || [];

  // Build specimen type options
  const specimenTypeOptions = React.useMemo(() => {
    return specimenTypes
      .filter((st) => st.isActive)
      .map((st) => ({
        value: st.id,
        label: `${st.code} - ${st.name}`,
      }));
  }, [specimenTypes]);

  // Find indicator by ID
  const findIndicatorById = useCallback(
    (indicatorId: string): IndicatorDto | undefined => {
      const allIndicators = Object.values(indicatorsByGroup).flat();
      const parent = allIndicators.find((ind) => ind.id === indicatorId);
      if (parent) return parent;
      for (const ind of allIndicators) {
        const sub = ind.subIndicators?.find((s) => s.id === indicatorId);
        if (sub) return sub as IndicatorDto;
      }
      return undefined;
    },
    [indicatorsByGroup],
  );

  // Check if indicator + specimenType combination is already selected in another row
  const isIndicatorAlreadySelected = useCallback(
    (
      indicatorId: string,
      specimenTypeId: string | undefined,
      excludeIndex?: number,
    ): boolean => {
      return indicators.some(
        (item, idx) =>
          idx !== excludeIndex &&
          item?.indicatorId === indicatorId &&
          (item?.specimenTypeId || null) === (specimenTypeId || null),
      );
    },
    [indicators],
  );

  // Check if indicator + specimenType combination already exists in the standard
  const isKeyExisting = useCallback(
    (indicatorId: string, specimenTypeId: string | undefined): boolean => {
      return existingIndicatorKeys.some(
        (key) =>
          key.indicatorId === indicatorId &&
          (key.specimenTypeId || null) === (specimenTypeId || null),
      );
    },
    [existingIndicatorKeys],
  );

  // Render indicator label for Select
  const renderIndicatorLabel = (indicatorId: string) => {
    const indicator = findIndicatorById(indicatorId);
    if (!indicator) return indicatorId;
    return (
      <span>
        {indicator.code} -{" "}
        <IndicatorName
          name={indicator.name}
          formattedName={indicator.formattedName}
        />
      </span>
    );
  };

  // Build parent indicator options - filtered by specimenType
  const buildParentOptions = useCallback(
    (specimenTypeId?: string, currentIndicatorId?: string) => {
      // If no specimen type selected, return empty
      if (!specimenTypeId) return [];

      // Get indicators that belong to this specimen type
      const indicatorsForSpecimenType =
        getIndicatorsBySpecimenType(specimenTypeId);
      const indicatorIdsForSpecimenType = new Set(
        indicatorsForSpecimenType.map((ind) => ind.id),
      );

      return indicatorGroups
        .filter(
          (group) => group.isActive && indicatorsByGroup[group.id]?.length > 0,
        )
        .map((group) => {
          const parentIndicators = (indicatorsByGroup[group.id] || []).filter(
            (ind) =>
              !ind.parentIndicatorId &&
              ind.isActive &&
              indicatorIdsForSpecimenType.has(ind.id),
          );

          const availableParents = parentIndicators.filter((ind) => {
            if (ind.id === currentIndicatorId) return true;
            // Check if this indicator + specimenType combo already exists in standard
            if (isKeyExisting(ind.id, specimenTypeId)) return false;
            // Check if already selected in another row with same specimenType
            if (isIndicatorAlreadySelected(ind.id, specimenTypeId))
              return false;
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
        options: {
          value: string;
          label: React.ReactNode;
          searchText: string;
        }[];
      }[];
    },
    [
      indicatorGroups,
      indicatorsByGroup,
      getIndicatorsBySpecimenType,
      isKeyExisting,
      isIndicatorAlreadySelected,
      getMethodsForIndicator,
    ],
  );

  // Build method options for parent
  const buildMethodOptions = useCallback(
    (parentIndex: number) => {
      const indicatorId =
        selectedIndicators[parentIndex] || indicators[parentIndex]?.indicatorId;
      if (!indicatorId) return [];

      const methods = getMethodsForIndicator(indicatorId);
      return methods.map((method) => ({
        value: method.id,
        label: (
          <IndicatorName
            name={method.name}
            formattedName={method.formattedName}
          />
        ),
        searchText: method.name,
        unit: method.unit,
      }));
    },
    [selectedIndicators, indicators, getMethodsForIndicator],
  );

  // Build sub-indicator options
  const buildSubOptions = useCallback(
    (parentIndex: number, subIndex?: number) => {
      // Use selectedIndicators as primary source, fallback to form data
      const parentIndicatorId =
        selectedIndicators[parentIndex] || indicators[parentIndex]?.indicatorId;
      if (!parentIndicatorId) return [];

      const specimenTypeId =
        selectedSpecimenTypes[parentIndex] ||
        indicators[parentIndex]?.specimenTypeId;

      const parentIndicator = findIndicatorById(parentIndicatorId);
      if (!parentIndicator?.subIndicators?.length) return [];

      const currentSubId =
        subIndex !== undefined
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
            // Only check existing if specimenType is selected
            (!specimenTypeId || !isKeyExisting(sub.id, specimenTypeId))),
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
    },
    [
      selectedIndicators,
      selectedSpecimenTypes,
      indicators,
      findIndicatorById,
      isKeyExisting,
    ],
  );

  // Handle specimen type change
  const handleSpecimenTypeChange = (
    specimenTypeId: string | undefined,
    parentIndex: number,
  ) => {
    const currentIndicators = form.getFieldValue("indicators") || [];

    // Update specimen type and reset indicator/method fields
    currentIndicators[parentIndex] = {
      specimenTypeId: specimenTypeId,
      indicatorId: undefined,
      testMethodId: undefined,
      unit: "",
      comparisonOperator: undefined,
      allowedLimit: undefined,
      subIndicators: [],
    };

    form.setFieldsValue({ indicators: currentIndicators });

    // Track selected specimen type
    if (specimenTypeId) {
      setSelectedSpecimenTypes((prev) => ({
        ...prev,
        [parentIndex]: specimenTypeId,
      }));
    } else {
      setSelectedSpecimenTypes((prev) => {
        const newState = { ...prev };
        delete newState[parentIndex];
        return newState;
      });
    }

    // Clear selected indicator and method when specimen type changes
    setSelectedIndicators((prev) => {
      const newState = { ...prev };
      delete newState[parentIndex];
      return newState;
    });
    setSelectedMethods((prev) => {
      const newState = { ...prev };
      delete newState[parentIndex];
      return newState;
    });
    setSubIndicatorsAddedCount((prev) => {
      const newState = { ...prev };
      delete newState[parentIndex];
      return newState;
    });
    setComparisonModes((prev) => {
      const newState = { ...prev };
      delete newState[`parent-${parentIndex}`];
      return newState;
    });
  };

  // Handle parent indicator change
  // When parent has sub-indicators, automatically add ALL sub-indicators
  const handleParentChange = (
    parentId: string | undefined,
    parentIndex: number,
  ) => {
    const currentIndicators = form.getFieldValue("indicators") || [];
    const specimenTypeId =
      selectedSpecimenTypes[parentIndex] ||
      currentIndicators[parentIndex]?.specimenTypeId;

    if (parentId) {
      // Check if this parent has sub-indicators defined
      const parentIndicator = findIndicatorById(parentId);
      const subIndicators = parentIndicator?.subIndicators || [];

      // Filter out sub-indicators that are already in existing standards (with same specimenType)
      const availableSubs = subIndicators.filter(
        (sub) => sub.isActive && !isKeyExisting(sub.id, specimenTypeId),
      );

      // Auto-add all available sub-indicators
      const autoAddedSubs = availableSubs.map((sub) => ({
        indicatorId: sub.id,
        testMethodId: undefined, // Will be set when parent method is selected
        unit: "",
        comparisonOperator: undefined,
        allowedLimit: undefined,
      }));

      // Reset all fields when indicator changes, preserve specimenTypeId
      currentIndicators[parentIndex] = {
        specimenTypeId: specimenTypeId,
        indicatorId: parentId,
        testMethodId: undefined,
        unit: "",
        comparisonOperator: undefined,
        allowedLimit: undefined,
        subIndicators: autoAddedSubs, // Auto-add sub-indicators
      };

      // Track selected indicator for enabling method select
      setSelectedIndicators((prev) => ({ ...prev, [parentIndex]: parentId }));

      // Track sub-indicator count (for showing sub-indicator container)
      if (autoAddedSubs.length > 0) {
        setSubIndicatorsAddedCount((prev) => ({
          ...prev,
          [parentIndex]: autoAddedSubs.length,
        }));
      } else {
        setSubIndicatorsAddedCount((prev) => {
          const newState = { ...prev };
          delete newState[parentIndex];
          return newState;
        });
      }
    } else {
      currentIndicators[parentIndex] = {
        specimenTypeId: specimenTypeId,
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
      // Clear sub-indicator count
      setSubIndicatorsAddedCount((prev) => {
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
    parentIndex: number,
  ) => {
    const currentIndicators = form.getFieldValue("indicators") || [];
    const current = currentIndicators[parentIndex] || {};
    // Use selectedIndicators as source of truth for indicatorId
    const indicatorId = selectedIndicators[parentIndex] || current.indicatorId;
    // Use selectedSpecimenTypes as source of truth for specimenTypeId
    const specimenTypeId =
      selectedSpecimenTypes[parentIndex] || current.specimenTypeId;

    // Preserve existing subIndicators array (only if it has actual items)
    const existingSubs = Array.isArray(current.subIndicators)
      ? current.subIndicators
      : [];

    if (methodId && option?.unit) {
      const unit = option.unit; // Capture for type safety
      // Track method in state (source of truth)
      setSelectedMethods((prev) => ({
        ...prev,
        [parentIndex]: { id: methodId, unit },
      }));

      // Build new indicator object explicitly (no blind spread)
      currentIndicators[parentIndex] = {
        specimenTypeId: specimenTypeId, // Preserve specimenTypeId
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
        specimenTypeId: specimenTypeId, // Preserve specimenTypeId
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
  const handleComparisonChange = (
    value: string | undefined,
    parentIndex: number,
  ) => {
    const isRange = value === "range";
    const modeKey = `parent-${parentIndex}`;

    setComparisonModes((prev) => ({
      ...prev,
      [modeKey]: isRange ? "range" : "single",
    }));

    const currentIndicators = form.getFieldValue("indicators") || [];
    const current = currentIndicators[parentIndex] || {};
    const existingSubs = Array.isArray(current.subIndicators)
      ? current.subIndicators
      : [];
    // Preserve specimenTypeId from state or form
    const specimenTypeId =
      selectedSpecimenTypes[parentIndex] || current.specimenTypeId;

    if (isRange) {
      currentIndicators[parentIndex] = {
        specimenTypeId: specimenTypeId,
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
        specimenTypeId: specimenTypeId,
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
  const handleSubComparisonChange = (
    value: string | undefined,
    parentIndex: number,
    subIndex: number,
  ) => {
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

  // Handle removing sub-indicator
  // IMPORTANT: Don't use removeSub() from Form.List as it can reset parent fields!
  // Instead, manually set form values to preserve all parent data.
  const handleRemoveSubIndicator = (parentIndex: number, subIndex: number) => {
    const parentIndicatorId =
      selectedIndicators[parentIndex] || indicators[parentIndex]?.indicatorId;

    // Get current indicators from form
    const currentIndicators = form.getFieldValue("indicators") || [];
    const currentParent = currentIndicators[parentIndex] || {};

    // Get existing sub-indicators and remove the one at subIndex
    const existingSubs = Array.isArray(currentParent.subIndicators)
      ? [...currentParent.subIndicators]
      : [];
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
    setSelectedSpecimenTypes({});
    setSelectedIndicators({});
    setSelectedMethods({});
    setComparisonModes({});
    setSubIndicatorsAddedCount({});
    onCancel();
  };

  // Handle OK - validate form first, then pass state values to onOk
  const handleOk = async () => {
    try {
      // Validate all form fields including range validation
      await form.validateFields();
      // Pass state values directly - the hook will use these as source of truth
      onOk(selectedIndicators, selectedMethods, selectedSpecimenTypes);
    } catch (error) {
      // Form validation failed - errors will be shown on fields
      console.log("Form validation failed:", error);
    }
  };

  // Render limit fields
  // fieldNamePrefix: relative path for Form.Item name (inside Form.List context)
  // fullPathPrefix: absolute path for getFieldValue (from form root)
  const renderLimitFields = (
    isRangeMode: boolean,
    fieldNamePrefix: (string | number)[],
    fullPathPrefix: (string | number)[],
  ) => {
    if (isRangeMode) {
      return (
        <div style={{ display: "flex", gap: 4, flex: 1 }}>
          <Form.Item
            name={[...fieldNamePrefix, "lowerOperator"]}
            style={{ marginBottom: 0, width: 60 }}
          >
            <Select options={LOWER_OPERATORS} defaultValue=">" />
          </Form.Item>
          <Form.Item
            name={[...fieldNamePrefix, "lowerLimit"]}
            dependencies={[[...fullPathPrefix, "upperLimit"]]}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const upperLimit = getFieldValue([
                    ...fullPathPrefix,
                    "upperLimit",
                  ]);
                  if (!value || !upperLimit) return Promise.resolve();
                  // Extract plain text from HTML and parse mathematical expressions
                  const lowerText = extractPlainTextFromLimit(value);
                  const upperText = extractPlainTextFromLimit(upperLimit);
                  const lower = parseResultToNumber(lowerText, 4, false);
                  const upper = parseResultToNumber(upperText, 4, false);
                  if (lower === null || upper === null) return Promise.resolve();
                  if (lower >= upper) {
                    return Promise.reject(
                      new Error("Cận dưới phải < cận trên"),
                    );
                  }
                  return Promise.resolve();
                },
              }),
            ]}
            style={{ marginBottom: 0, width: 100 }}
          >
            <LimitInput placeholder="Cận dưới" />
          </Form.Item>
          <Form.Item
            name={[...fieldNamePrefix, "upperOperator"]}
            style={{ marginBottom: 0, width: 60 }}
          >
            <Select options={UPPER_OPERATORS} defaultValue="<" />
          </Form.Item>
          <Form.Item
            name={[...fieldNamePrefix, "upperLimit"]}
            dependencies={[[...fullPathPrefix, "lowerLimit"]]}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const lowerLimit = getFieldValue([
                    ...fullPathPrefix,
                    "lowerLimit",
                  ]);
                  if (!value || !lowerLimit) return Promise.resolve();
                  // Extract plain text from HTML and parse mathematical expressions
                  const upperText = extractPlainTextFromLimit(value);
                  const lowerText = extractPlainTextFromLimit(lowerLimit);
                  const upper = parseResultToNumber(upperText, 4, false);
                  const lower = parseResultToNumber(lowerText, 4, false);
                  if (lower === null || upper === null) return Promise.resolve();
                  if (upper <= lower) {
                    return Promise.reject(
                      new Error("Cận trên phải > cận dưới"),
                    );
                  }
                  return Promise.resolve();
                },
              }),
            ]}
            style={{ marginBottom: 0, width: 100 }}
          >
            <LimitInput placeholder="Cận trên" />
          </Form.Item>
        </div>
      );
    }

    return (
      <Form.Item
        name={[...fieldNamePrefix, "allowedLimit"]}
        style={{ marginBottom: 0, flex: 1 }}
      >
        <LimitInput placeholder="Giới hạn" />
      </Form.Item>
    );
  };

  return (
    <Modal
      className="standards-add-indicators-modal"
      title={
        <span style={{ fontSize: 18, fontWeight: 600 }}>
          Thêm chỉ tiêu so sánh
        </span>
      }
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
        <Form.List name="indicators">
          {(parentFields, { add: addParent, remove: removeParent }) => (
            <>
              <Card>
                {/* Header */}
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 32 }} />
                  <Text strong style={{ width: 160 }}>
                    Nền mẫu <Text type="danger">*</Text>
                  </Text>
                  <Text strong style={{ width: 200 }}>
                    Chỉ tiêu <Text type="danger">*</Text>
                  </Text>
                  <Text strong style={{ width: 180 }}>
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

                {parentFields.map(({ key: parentKey, name: parentName }) => {
                  const parentSpecimenTypeId =
                    selectedSpecimenTypes[parentName] ||
                    indicators[parentName]?.specimenTypeId;
                  const parentIndicatorId =
                    selectedIndicators[parentName] ||
                    indicators[parentName]?.indicatorId;
                  const parentModeKey = `parent-${parentName}`;
                  const isParentRangeMode =
                    comparisonModes[parentModeKey] === "range";

                  // CRITICAL: Use our state-based count, NOT subFields.length
                  // This is because Form.List can have internal state that doesn't match our explicit adds
                  const hasSubsAdded =
                    (subIndicatorsAddedCount[parentName] || 0) > 0;

                  return (
                    <div key={parentKey} style={{ marginBottom: 16 }}>
                      {/* Parent row - MUST be OUTSIDE nested Form.List to preserve form field paths */}
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "flex-start",
                        }}
                      >
                        {/* Spacer - sub-indicators are auto-added when parent is selected */}
                        <div style={{ width: 32 }} />

                        {/* Specimen Type Select */}
                        <Form.Item
                          name={[parentName, "specimenTypeId"]}
                          rules={[{ required: true, message: "Chọn" }]}
                          style={{ marginBottom: 0, width: 160 }}
                        >
                          <Select
                            options={specimenTypeOptions}
                            placeholder="Chọn nền mẫu"
                            showSearch
                            allowClear
                            filterOption={(input, option) =>
                              (option?.label ?? "")
                                .toLowerCase()
                                .includes(input.toLowerCase())
                            }
                            onChange={(value) =>
                              handleSpecimenTypeChange(value, parentName)
                            }
                          />
                        </Form.Item>

                        {/* Indicator Select */}
                        <Form.Item
                          name={[parentName, "indicatorId"]}
                          rules={[{ required: true, message: "Chọn" }]}
                          style={{ marginBottom: 0, width: 200 }}
                        >
                          <Select
                            options={buildParentOptions(
                              parentSpecimenTypeId,
                              parentIndicatorId,
                            )}
                            placeholder="Chọn chỉ tiêu"
                            showSearch
                            allowClear
                            disabled={!parentSpecimenTypeId}
                            popupMatchSelectWidth={400}
                            labelRender={() => {
                              if (!parentIndicatorId) return null;
                              return renderIndicatorLabel(parentIndicatorId);
                            }}
                            filterOption={(input, option) => {
                              const searchText = (
                                option as { searchText?: string }
                              )?.searchText;
                              return (
                                searchText
                                  ?.toLowerCase()
                                  .includes(input.toLowerCase()) || false
                              );
                            }}
                            onChange={(value) =>
                              handleParentChange(value, parentName)
                            }
                          />
                        </Form.Item>

                        {/* Method Select */}
                        <Form.Item
                          name={[parentName, "testMethodId"]}
                          rules={[{ required: true, message: "Chọn" }]}
                          style={{ marginBottom: 0, width: 180 }}
                        >
                          <Select
                            options={buildMethodOptions(parentName)}
                            placeholder="Chọn phương pháp"
                            showSearch
                            allowClear
                            disabled={!selectedIndicators[parentName]}
                            filterOption={(input, option) => {
                              const searchText = (
                                option as { searchText?: string }
                              )?.searchText;
                              return (
                                searchText
                                  ?.toLowerCase()
                                  .includes(input.toLowerCase()) || false
                              );
                            }}
                            onChange={(value, option) =>
                              handleMethodChange(
                                value,
                                option as { unit?: string },
                                parentName,
                              )
                            }
                          />
                        </Form.Item>

                        <Form.Item
                          name={[parentName, "unit"]}
                          rules={[{ required: true, message: "Chọn PP" }]}
                          style={{ marginBottom: 0, width: 80 }}
                        >
                          <Input placeholder="ĐVT" disabled />
                        </Form.Item>

                        {/* Comparison/Limit - hide when has sub-indicators added */}
                        {!hasSubsAdded ? (
                          <>
                            <Form.Item
                              name={[parentName, "comparisonOperator"]}
                              style={{ marginBottom: 0, width: 90 }}
                            >
                              <Select
                                options={COMPARISON_OPERATORS}
                                placeholder="--"
                                allowClear
                                onChange={(value) =>
                                  handleComparisonChange(value, parentName)
                                }
                              />
                            </Form.Item>

                            {renderLimitFields(
                              isParentRangeMode,
                              [parentName],
                              ["indicators", parentName],
                            )}
                          </>
                        ) : (
                          <div style={{ flex: 1 }} />
                        )}

                        {/* Remove button */}
                        <MinusCircleOutlined
                          onClick={() => removeParent(parentName)}
                          style={{
                            color:
                              parentFields.length > 1 ? "#ff4d4f" : "#d9d9d9",
                            marginTop: 8,
                            cursor:
                              parentFields.length > 1
                                ? "pointer"
                                : "not-allowed",
                            visibility:
                              parentFields.length > 1 ? "visible" : "hidden",
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
                                  {subFields.map(
                                    ({ key: subKey, name: subName }, index) => {
                                      const subModeKey = `sub-${parentName}-${subName}`;
                                      const isSubRangeMode =
                                        comparisonModes[subModeKey] === "range";

                                      return (
                                        <div
                                          key={subKey}
                                          className={`standards-sub-row ${index === 0 ? "is-first" : ""} ${index === subFields.length - 1 ? "is-last" : ""}`}
                                          style={{
                                            display: "flex",
                                            gap: 8,
                                            marginBottom:
                                              index === subFields.length - 1
                                                ? 0
                                                : 12,
                                            alignItems: "flex-start",
                                          }}
                                        >
                                          {/* Sub-indicator Select - wider since method/unit follow parent */}
                                          <Form.Item
                                            name={[subName, "indicatorId"]}
                                            rules={[
                                              {
                                                required: true,
                                                message: "Chọn",
                                              },
                                            ]}
                                            style={{
                                              marginBottom: 0,
                                              width: 480,
                                            }}
                                          >
                                            <Select
                                              options={buildSubOptions(
                                                parentName,
                                                subName,
                                              )}
                                              placeholder="Chỉ tiêu phụ"
                                              showSearch
                                              allowClear
                                              filterOption={(input, option) => {
                                                const searchText = (
                                                  option as {
                                                    searchText?: string;
                                                  }
                                                )?.searchText;
                                                return (
                                                  searchText
                                                    ?.toLowerCase()
                                                    .includes(
                                                      input.toLowerCase(),
                                                    ) || false
                                                );
                                              }}
                                            />
                                          </Form.Item>

                                          {/* Comparison */}
                                          <Form.Item
                                            name={[
                                              subName,
                                              "comparisonOperator",
                                            ]}
                                            style={{
                                              marginBottom: 0,
                                              width: 90,
                                            }}
                                          >
                                            <Select
                                              options={COMPARISON_OPERATORS}
                                              placeholder="--"
                                              allowClear
                                              onChange={(value) =>
                                                handleSubComparisonChange(
                                                  value,
                                                  parentName,
                                                  subName,
                                                )
                                              }
                                            />
                                          </Form.Item>

                                          {/* Limit fields */}
                                          {renderLimitFields(
                                            isSubRangeMode,
                                            [subName],
                                            [
                                              "indicators",
                                              parentName,
                                              "subIndicators",
                                              subName,
                                            ],
                                          )}
                                        </div>
                                      );
                                    },
                                  )}
                                </>
                              )}
                            </Form.List>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </Card>

              <Button
                type="dashed"
                onClick={() =>
                  addParent({
                    specimenTypeId: undefined,
                    indicatorId: undefined,
                    testMethodId: undefined,
                    unit: "",
                    subIndicators: [],
                  })
                }
                block
                icon={<PlusOutlined />}
                style={{ marginTop: 12 }}
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
