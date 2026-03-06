// @ts-nocheck
import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
import {
  Modal,
  Button,
  Checkbox,
  Typography,
  Drawer,
  Input,
  Select,
  Tag,
  Card,
  Tooltip,
  message,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  CloseOutlined,
} from "../../../../components/common/Icon";
import { Icon } from "@iconify/react";
import dayjs from "dayjs";
import {
  IndicatorGroupDto,
  IndicatorDto,
  SpecimenTypeWithIndicatorsDto,
  SpecimenTypeDto,
  SampleTypeCategoryDto,
} from "../../../../services/masterDataService";
import IndicatorName from "../../../../components/common/IndicatorName";
import {
  IndicatorDateInfo,
  LaboratoryAssignment,
  IndicatorMethodKey,
  IndicatorMethodInfo,
  parseIndicatorMethodKey,
  createIndicatorMethodKey,
  isIndicatorLocked,
} from "../types";
import IndicatorRow from "./IndicatorRow";
import { isHeavyMetalComboMet, isHgIndicator, isEcoliColiformComboMet, isEcoliIndicator } from "../constants";
import "./IndicatorSelectionModal.css";

const { Text } = Typography;

// Helper function to normalize indicator name for sorting
// Strips HTML tags and normalizes Unicode for proper alphabetical comparison
const normalizeForSort = (name: string): string => {
  // Remove HTML tags (e.g., <sub>, <sup>, <i>, etc.)
  const withoutHtml = name.replace(/<[^>]*>/g, "");
  // Normalize Unicode (NFD) and remove combining diacritical marks for base comparison
  // But keep the original for locale-aware sorting
  return withoutHtml.normalize("NFC").toLowerCase();
};

// Sort indicators alphabetically by name with proper Unicode handling
const sortIndicatorsAlphabetically = (
  indicators: IndicatorDto[]
): IndicatorDto[] => {
  return [...indicators].sort((a, b) => {
    const nameA = normalizeForSort(a.name);
    const nameB = normalizeForSort(b.name);
    return nameA.localeCompare(nameB, "vi", { sensitivity: "base" });
  });
};

// Component hiển thị tooltip chỉ khi text bị cắt (ellipsis)
interface TruncateTooltipProps {
  title: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

const TruncateTooltip: React.FC<TruncateTooltipProps> = ({
  title,
  children,
  style,
  className,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  const handleMouseEnter = useCallback(() => {
    if (containerRef.current) {
      const { scrollWidth, clientWidth } = containerRef.current;
      setShowTooltip(scrollWidth > clientWidth);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setShowTooltip(false);
  }, []);

  return (
    <Tooltip title={title} open={showTooltip} placement="topLeft">
      <span
        ref={containerRef}
        className={className}
        style={style}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </span>
    </Tooltip>
  );
};

interface IndicatorSelectionModalProps {
  visible: boolean;
  onOk: () => void;
  onCancel: () => void;
  currentSampleKey: string | null;
  // Old props (deprecated)
  tempSelectedIndicators: string[];
  setTempSelectedIndicators: React.Dispatch<React.SetStateAction<string[]>>;
  // New props
  tempSelectedIndicatorMethods: IndicatorMethodKey[];
  setTempSelectedIndicatorMethods: React.Dispatch<
    React.SetStateAction<IndicatorMethodKey[]>
  >;
  indicatorMethodsMap: Record<string, IndicatorMethodInfo[]>;
  expandedIndicators: string[];
  setExpandedIndicators: React.Dispatch<React.SetStateAction<string[]>>;
  toggleIndicatorMethod: (
    indicatorId: string,
    testMethodId: string,
    specimenTypeId?: string,
  ) => void;
  // Existing props
  indicatorGroups: IndicatorGroupDto[];
  indicators: IndicatorDto[];
  expandedGroups: string[];
  setExpandedGroups: React.Dispatch<React.SetStateAction<string[]>>;
  selectedGroupFilter: string;
  setGroupSelectorVisible: (visible: boolean) => void;
  getFilteredIndicators: () => IndicatorDto[];
  getIndicatorInfo: (indicatorId: string) => IndicatorDto | undefined;
  getIndicatorMethodInfo: (key: IndicatorMethodKey) => {
    indicator: IndicatorDto | undefined;
    method: IndicatorMethodInfo | undefined;
    indicatorId: string;
    testMethodId: string;
  };
  toggleIndicator: (indicatorId: string) => void;
  selectedIndicatorDates: Record<string, IndicatorDateInfo>;
  setSelectedIndicatorDates: React.Dispatch<
    React.SetStateAction<Record<string, IndicatorDateInfo>>
  >;
  checkedIndicators: string[];
  setCheckedIndicators: React.Dispatch<React.SetStateAction<string[]>>;
  handleIndicatorDateChange: (
    id: string,
    field: "transferDate" | "requestDate",
    value: dayjs.Dayjs | null,
  ) => void;
  toggleCheckedIndicator: (id: string) => void;
  handleSendToLaboratory: () => void;
  indicatorLaboratoryMap: Record<string, LaboratoryAssignment>;
  setIndicatorLaboratoryMap: React.Dispatch<
    React.SetStateAction<Record<string, LaboratoryAssignment>>
  >;
  expandedLabGroups: string[];
  setExpandedLabGroups: React.Dispatch<React.SetStateAction<string[]>>;
  // Filter theo loại mẫu
  currentSampleSpecimenTypeId?: string;
  currentSampleSpecimenTypeName?: string;
  specimenTypeIndicatorIds: string[];
  specimenTypeFilterActive: boolean;
  setSpecimenTypeFilterActive: React.Dispatch<React.SetStateAction<boolean>>;
  // Group theo loại mẫu (2 cấp)
  specimenTypesWithIndicators: SpecimenTypeWithIndicatorsDto[];
  indicatorToSpecimenTypesMap: Record<string, { id: string; name: string }[]>;
  // Filter mới
  specimenTypes: SpecimenTypeDto[];
  sampleTypeCategories: SampleTypeCategoryDto[];
  indicatorSearchText: string;
  setIndicatorSearchText: React.Dispatch<React.SetStateAction<string>>;
  // Custom prices
  customPrices: Record<string, number>;
  onPriceChange: (key: string, price: number) => void;
}

const IndicatorSelectionModal: React.FC<IndicatorSelectionModalProps> = ({
  visible,
  onOk,
  onCancel,
  currentSampleKey,
  tempSelectedIndicatorMethods,
  setTempSelectedIndicatorMethods,
  indicatorMethodsMap,
  expandedIndicators,
  setExpandedIndicators,
  toggleIndicatorMethod,
  indicatorGroups,
  indicators,
  expandedGroups,
  setExpandedGroups,
  selectedGroupFilter,
  setGroupSelectorVisible,
  getFilteredIndicators,
  getIndicatorInfo,
  getIndicatorMethodInfo,
  selectedIndicatorDates,
  setSelectedIndicatorDates,
  checkedIndicators,
  setCheckedIndicators,
  handleIndicatorDateChange,
  toggleCheckedIndicator,
  handleSendToLaboratory,
  indicatorLaboratoryMap,
  setIndicatorLaboratoryMap,
  expandedLabGroups,
  setExpandedLabGroups,
  currentSampleSpecimenTypeId,
  currentSampleSpecimenTypeName,
  specimenTypeIndicatorIds,
  specimenTypeFilterActive,
  setSpecimenTypeFilterActive,
  specimenTypesWithIndicators,
  indicatorToSpecimenTypesMap,
  specimenTypes,
  sampleTypeCategories,
  indicatorSearchText,
  setIndicatorSearchText,
  customPrices,
  onPriceChange,
}) => {
  // Get effective price for a method key (custom price or master data price)
  const getEffectivePrice = (key: IndicatorMethodKey, masterPrice: number): number => {
    const customKey = `${currentSampleKey}_${key}`;
    return customPrices[customKey] !== undefined ? customPrices[customKey] : masterPrice;
  };

  // Handle remove indicator method
  const handleRemoveIndicatorMethod = (key: IndicatorMethodKey) => {
    // Không cho xóa chỉ tiêu đã gửi tới khoa phòng
    const labMapKey = `${currentSampleKey}_${key}`;
    const labInfo = indicatorLaboratoryMap[labMapKey];
    if (isIndicatorLocked(labInfo)) {
      return;
    }

    const { indicatorId, testMethodId, specimenTypeId } =
      parseIndicatorMethodKey(key);
    toggleIndicatorMethod(
      indicatorId,
      testMethodId,
      specimenTypeId || undefined,
    );
    if (indicatorLaboratoryMap[labMapKey]) {
      setIndicatorLaboratoryMap((prev) => {
        const updated = { ...prev };
        delete updated[labMapKey];
        return updated;
      });
    }
  };

  // Check if a method is selected (now includes specimenTypeId)
  const isMethodSelected = (
    indicatorId: string,
    testMethodId: string,
    specimenTypeId?: string,
  ): boolean => {
    const key = createIndicatorMethodKey(
      indicatorId,
      testMethodId,
      specimenTypeId,
    );
    return tempSelectedIndicatorMethods.includes(key);
  };

  // ==================== Sub-indicator Helper Functions ====================

  // Check if a key is a sub-indicator (has parentIndicatorId)
  const isSubIndicator = useCallback(
    (key: IndicatorMethodKey): boolean => {
      const { indicatorId, testMethodId, specimenTypeId } =
        parseIndicatorMethodKey(key);
      const methods = indicatorMethodsMap[indicatorId];
      if (!methods) return false;
      const methodInfo = methods.find(
        (m) =>
          m.testMethodId === testMethodId &&
          (m.specimenTypeId || null) === (specimenTypeId || null),
      );
      return !!methodInfo?.parentIndicatorId;
    },
    [indicatorMethodsMap],
  );

  // Get parent key of a sub-indicator
  const getParentKey = useCallback(
    (subKey: IndicatorMethodKey): IndicatorMethodKey | null => {
      const { indicatorId, testMethodId, specimenTypeId } =
        parseIndicatorMethodKey(subKey);
      const methods = indicatorMethodsMap[indicatorId];
      if (!methods) return null;
      const methodInfo = methods.find(
        (m) =>
          m.testMethodId === testMethodId &&
          (m.specimenTypeId || null) === (specimenTypeId || null),
      );
      if (!methodInfo?.parentIndicatorId) return null;
      return createIndicatorMethodKey(
        methodInfo.parentIndicatorId,
        testMethodId,
        methodInfo.specimenTypeId,
      );
    },
    [indicatorMethodsMap],
  );

  // Get all sub-indicator keys for a parent indicator + method + specimenType
  const getSubIndicatorKeys = useCallback(
    (
      parentIndicatorId: string,
      testMethodId: string,
      specimenTypeId?: string | null,
    ): IndicatorMethodKey[] => {
      const subKeys: IndicatorMethodKey[] = [];
      // Normalize specimenTypeId: treat null, undefined, and empty string as equivalent
      const normalizedSpecimenTypeId = specimenTypeId || null;
      // Find all indicators that have this parentIndicatorId, testMethodId, and specimenTypeId
      Object.entries(indicatorMethodsMap).forEach(([indId, methods]) => {
        methods.forEach((method) => {
          // Normalize method's specimenTypeId the same way
          const methodSpecimenTypeId = method.specimenTypeId || null;
          if (
            method.testMethodId === testMethodId &&
            method.parentIndicatorId === parentIndicatorId &&
            method.isActive &&
            methodSpecimenTypeId === normalizedSpecimenTypeId
          ) {
            subKeys.push(
              createIndicatorMethodKey(
                indId,
                testMethodId,
                method.specimenTypeId,
              ),
            );
          }
        });
      });
      return subKeys;
    },
    [indicatorMethodsMap],
  );

  // Group selected methods by parent-child relationship
  const groupedSelectedMethods = useMemo(() => {
    const parentMethods: IndicatorMethodKey[] = [];
    const subMethodsMap: Record<string, IndicatorMethodKey[]> = {};
    const independentMethods: IndicatorMethodKey[] = [];

    tempSelectedIndicatorMethods.forEach((key) => {
      if (isSubIndicator(key)) {
        const parentKey = getParentKey(key);
        if (parentKey) {
          if (!subMethodsMap[parentKey]) {
            subMethodsMap[parentKey] = [];
          }
          subMethodsMap[parentKey].push(key);
        }
      } else {
        // Check if this indicator has any sub-indicators in the same method + specimenType
        const { indicatorId, testMethodId, specimenTypeId } =
          parseIndicatorMethodKey(key);
        const subKeys = getSubIndicatorKeys(
          indicatorId,
          testMethodId,
          specimenTypeId,
        );
        if (subKeys.length > 0) {
          // This is a parent indicator
          parentMethods.push(key);
        } else {
          // This is an independent indicator (no subs)
          independentMethods.push(key);
        }
      }
    });

    return { parentMethods, subMethodsMap, independentMethods };
  }, [
    tempSelectedIndicatorMethods,
    isSubIndicator,
    getParentKey,
    getSubIndicatorKeys,
  ]);

  // Get pricing mode for a parent indicator
  // 'parent' = all subs have price 0, show price on parent
  // 'subs' = at least one sub has price > 0, show price on each sub
  const getPricingMode = useCallback(
    (parentKey: IndicatorMethodKey): "parent" | "subs" => {
      const subs = groupedSelectedMethods.subMethodsMap[parentKey] || [];
      if (subs.length === 0) return "parent";

      // Check if any sub has price > 0
      const hasSubWithPrice = subs.some((subKey) => {
        const { method } = getIndicatorMethodInfo(subKey);
        return (method?.unitPrice || 0) > 0;
      });

      return hasSubWithPrice ? "subs" : "parent";
    },
    [groupedSelectedMethods.subMethodsMap, getIndicatorMethodInfo],
  );

  // Handle remove sub-indicator with validation
  const handleRemoveSubIndicator = useCallback(
    (subKey: IndicatorMethodKey) => {
      const parentKey = getParentKey(subKey);
      if (!parentKey) return;

      const currentSubs = groupedSelectedMethods.subMethodsMap[parentKey] || [];

      // Don't allow removing if only 1 sub remains
      if (currentSubs.length <= 1) {
        message.error("Cần ít nhất 1 chỉ tiêu để tiến hành thử nghiệm");
        return;
      }

      // Remove the sub-indicator
      const { indicatorId, testMethodId, specimenTypeId } =
        parseIndicatorMethodKey(subKey);
      toggleIndicatorMethod(
        indicatorId,
        testMethodId,
        specimenTypeId || undefined,
      );
    },
    [getParentKey, groupedSelectedMethods.subMethodsMap, toggleIndicatorMethod],
  );

  // Handle remove parent indicator (removes all subs too)
  const handleRemoveParentIndicator = useCallback(
    (parentKey: IndicatorMethodKey) => {
      // Không cho xóa chỉ tiêu đã gửi tới khoa phòng
      const parentLabMapKey = `${currentSampleKey}_${parentKey}`;
      const labInfo = indicatorLaboratoryMap[parentLabMapKey];
      if (isIndicatorLocked(labInfo)) {
        return;
      }

      const { indicatorId, testMethodId, specimenTypeId } =
        parseIndicatorMethodKey(parentKey);

      // Get all sub-indicator keys for this parent
      const subKeys = groupedSelectedMethods.subMethodsMap[parentKey] || [];

      // Remove all subs first
      subKeys.forEach((subKey) => {
        const {
          indicatorId: subIndId,
          testMethodId: subMethodId,
          specimenTypeId: subSpecimenTypeId,
        } = parseIndicatorMethodKey(subKey);
        if (tempSelectedIndicatorMethods.includes(subKey)) {
          toggleIndicatorMethod(
            subIndId,
            subMethodId,
            subSpecimenTypeId || undefined,
          );
        }
      });

      // Remove the parent
      toggleIndicatorMethod(
        indicatorId,
        testMethodId,
        specimenTypeId || undefined,
      );

      // Clean up laboratory map for parent
      const labMapKey = `${currentSampleKey}_${parentKey}`;
      if (indicatorLaboratoryMap[labMapKey]) {
        setIndicatorLaboratoryMap((prev) => {
          const updated = { ...prev };
          delete updated[labMapKey];
          return updated;
        });
      }
    },
    [
      groupedSelectedMethods.subMethodsMap,
      tempSelectedIndicatorMethods,
      toggleIndicatorMethod,
      currentSampleKey,
      indicatorLaboratoryMap,
      setIndicatorLaboratoryMap,
    ],
  );

  // Separate sent and unsent indicator methods
  const unsentMethods = tempSelectedIndicatorMethods.filter(
    (key) => !indicatorLaboratoryMap[`${currentSampleKey}_${key}`],
  );
  const sentMethods = tempSelectedIndicatorMethods.filter(
    (key) => indicatorLaboratoryMap[`${currentSampleKey}_${key}`],
  );

  // Unsent methods excluding sub-indicators (for "Chọn tất cả" checkbox)
  // Sub-indicators follow their parent automatically, so we don't count them separately
  const unsentParentMethods = useMemo(() => {
    return unsentMethods.filter((key) => !isSubIndicator(key));
  }, [unsentMethods, isSubIndicator]);

  // Group sent methods by laboratory
  const groupedByLab: Record<
    string,
    { labName: string; requestDate: dayjs.Dayjs; methods: IndicatorMethodKey[] }
  > = {};
  sentMethods.forEach((key) => {
    const labInfo = indicatorLaboratoryMap[`${currentSampleKey}_${key}`];
    if (!groupedByLab[labInfo.laboratoryId]) {
      groupedByLab[labInfo.laboratoryId] = {
        labName: labInfo.laboratoryName,
        requestDate: labInfo.requestDate,
        methods: [],
      };
    }
    groupedByLab[labInfo.laboratoryId].methods.push(key);
  });

  // Lấy tên nền mẫu (sample type category) từ specimen type hiện tại
  const currentSampleTypeCategoryName = useMemo(() => {
    if (!currentSampleSpecimenTypeId) return null;
    const st = specimenTypes.find((s) => s.id === currentSampleSpecimenTypeId);
    return st?.sampleTypeCategoryName || null;
  }, [currentSampleSpecimenTypeId, specimenTypes]);

  // Check combo kim loại nặng: nếu đủ 4 chỉ tiêu Pb, As, Cd, Hg thì Hg miễn phí
  // Mẫu nước không áp dụng combo
  const isComboMet = useMemo(() => {
    const selectedNames = tempSelectedIndicatorMethods.map((key) => {
      const { indicator } = getIndicatorMethodInfo(key);
      return indicator?.name;
    });
    return isHeavyMetalComboMet(selectedNames, currentSampleTypeCategoryName);
  }, [tempSelectedIndicatorMethods, getIndicatorMethodInfo, currentSampleTypeCategoryName]);

  const checkIsHgIndicator = (indicator: IndicatorDto | undefined) => {
    return isHgIndicator(indicator?.name);
  };

  // Check combo E.Coli + Coliform: nếu cả 2 cùng có thì E.Coli miễn phí
  const isEcoliCombo = useMemo(() => {
    const selectedNames = tempSelectedIndicatorMethods.map((key) => {
      const { indicator } = getIndicatorMethodInfo(key);
      return indicator?.name;
    });
    return isEcoliColiformComboMet(selectedNames);
  }, [tempSelectedIndicatorMethods, getIndicatorMethodInfo]);

  const checkIsEcoliIndicator = (indicator: IndicatorDto | undefined) => {
    return isEcoliIndicator(indicator?.name);
  };

  // Helper: check if indicator is free by any combo
  const isIndicatorFree = (indicator: IndicatorDto | undefined) => {
    return (isComboMet && checkIsHgIndicator(indicator)) ||
      (isEcoliCombo && checkIsEcoliIndicator(indicator));
  };

  // Calculate total cost from selected methods with sub-indicator pricing logic
  const totalCost = useMemo(() => {
    let total = 0;

    // 1. Parent indicators with subs
    groupedSelectedMethods.parentMethods.forEach((parentKey) => {
      const { indicator, method } = getIndicatorMethodInfo(parentKey);
      const subs = groupedSelectedMethods.subMethodsMap[parentKey] || [];
      const pricingMode = getPricingMode(parentKey);

      if (pricingMode === "parent") {
        const masterPrice = method?.unitPrice || 0;
        const price = isIndicatorFree(indicator)
          ? 0
          : getEffectivePrice(parentKey, masterPrice);
        total += price;
      } else {
        subs.forEach((subKey) => {
          const { indicator: subInd, method: subMethod } =
            getIndicatorMethodInfo(subKey);
          const masterPrice = subMethod?.unitPrice || 0;
          const price = isIndicatorFree(subInd)
            ? 0
            : getEffectivePrice(subKey, masterPrice);
          total += price;
        });
      }
    });

    // 2. Independent indicators (no subs)
    groupedSelectedMethods.independentMethods.forEach((key) => {
      const { indicator, method } = getIndicatorMethodInfo(key);
      const masterPrice = method?.unitPrice || 0;
      const price = isIndicatorFree(indicator)
        ? 0
        : getEffectivePrice(key, masterPrice);
      total += price;
    });

    return total;
  }, [
    groupedSelectedMethods,
    getIndicatorMethodInfo,
    getPricingMode,
    isComboMet,
    isEcoliCombo,
    customPrices,
    currentSampleKey,
  ]);

  // Get indicators that have active methods, filtered by specimen type if active
  const indicatorsWithMethods = useMemo(() => {
    let filtered = indicators.filter(
      (ind) =>
        ind.isActive && indicatorMethodsMap[ind.id]?.some((m) => m.isActive),
    );
    // Apply specimen type filter if active
    // Nếu filter active mà specimenTypeIndicatorIds rỗng -> hiện danh sách rỗng
    if (specimenTypeFilterActive) {
      filtered = filtered.filter((ind) =>
        specimenTypeIndicatorIds.includes(ind.id),
      );
    }
    return filtered;
  }, [
    indicators,
    indicatorMethodsMap,
    specimenTypeFilterActive,
    specimenTypeIndicatorIds,
  ]);

  // Level 3 (Chỉ tiêu) - default collapsed, không auto-expand

  // State for mobile indicator picker drawer
  const [indicatorPickerOpen, setIndicatorPickerOpen] = useState(false);

  // State for expanded specimen types (now used as level 2 within indicator groups)
  const [expandedSpecimenTypes, setExpandedSpecimenTypes] = useState<string[]>(
    [],
  );

  // State for new filter fields
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedSpecimenTypeIds, setSelectedSpecimenTypeIds] = useState<
    string[]
  >([]);

  // Filtered specimen types based on selected categories
  const filteredSpecimenTypeOptions = useMemo(() => {
    if (selectedCategoryIds.length === 0) {
      return specimenTypes.filter((st) => st.isActive);
    }
    return specimenTypes.filter(
      (st) =>
        st.isActive &&
        st.sampleTypeCategoryId &&
        selectedCategoryIds.includes(st.sampleTypeCategoryId),
    );
  }, [specimenTypes, selectedCategoryIds]);

  // Clear selected specimen types when categories change (if they're no longer valid)
  useEffect(() => {
    if (selectedCategoryIds.length > 0) {
      const validSpecimenTypeIds = filteredSpecimenTypeOptions.map(
        (st) => st.id,
      );
      setSelectedSpecimenTypeIds((prev) =>
        prev.filter((id) => validSpecimenTypeIds.includes(id)),
      );
    }
  }, [selectedCategoryIds, filteredSpecimenTypeOptions]);

  // Auto-expand all indicator groups when modal opens
  useEffect(() => {
    if (visible && expandedGroups.length === 0) {
      const activeGroupIds = indicatorGroups.map((g) => g.id);
      setExpandedGroups(activeGroupIds);
    }
  }, [visible, indicatorGroups]);

  // Helper: Toggle all methods of an indicator
  // filterSpecimenTypeId: nếu có, chỉ toggle methods có specimenTypeId matching
  const toggleAllMethodsOfIndicator = (
    indicatorId: string,
    select: boolean,
    filterSpecimenTypeId?: string,
  ) => {
    let methods =
      indicatorMethodsMap[indicatorId]?.filter((m) => m.isActive) || [];
    // Filter theo specimenTypeId nếu có (loại bỏ methods không có nền mẫu)
    if (filterSpecimenTypeId) {
      methods = methods.filter(
        (m) =>
          m.specimenTypeId &&
          m.specimenTypeName &&
          m.specimenTypeId === filterSpecimenTypeId,
      );
    }
    methods.forEach((method) => {
      const isCurrentlySelected = isMethodSelected(
        indicatorId,
        method.testMethodId,
        method.specimenTypeId,
      );
      if (select && !isCurrentlySelected) {
        toggleIndicatorMethod(
          indicatorId,
          method.testMethodId,
          method.specimenTypeId,
        );
      } else if (!select && isCurrentlySelected) {
        toggleIndicatorMethod(
          indicatorId,
          method.testMethodId,
          method.specimenTypeId,
        );
      }
    });
  };

  // Helper: Toggle all indicators in a group (within specimen type context)
  const toggleAllIndicatorsInGroup = (
    indicatorIds: string[],
    select: boolean,
    filterSpecimenTypeId?: string,
  ) => {
    indicatorIds.forEach((indId) => {
      toggleAllMethodsOfIndicator(indId, select, filterSpecimenTypeId);
    });
  };

  // Helper: Check if all methods of an indicator are selected
  // filterSpecimenTypeId: nếu có, chỉ check methods có specimenTypeId matching (loại bỏ methods không có nền mẫu)
  const areAllMethodsSelected = (
    indicatorId: string,
    filterSpecimenTypeId?: string,
  ): boolean => {
    let methods =
      indicatorMethodsMap[indicatorId]?.filter((m) => m.isActive) || [];
    if (filterSpecimenTypeId) {
      methods = methods.filter(
        (m) =>
          m.specimenTypeId &&
          m.specimenTypeName &&
          m.specimenTypeId === filterSpecimenTypeId,
      );
    }
    if (methods.length === 0) return false;
    return methods.every((m) =>
      isMethodSelected(indicatorId, m.testMethodId, m.specimenTypeId),
    );
  };

  // Helper: Check if some (but not all) methods of an indicator are selected
  // filterSpecimenTypeId: nếu có, chỉ check methods có specimenTypeId matching (loại bỏ methods không có nền mẫu)
  const areSomeMethodsSelected = (
    indicatorId: string,
    filterSpecimenTypeId?: string,
  ): boolean => {
    let methods =
      indicatorMethodsMap[indicatorId]?.filter((m) => m.isActive) || [];
    if (filterSpecimenTypeId) {
      methods = methods.filter(
        (m) =>
          m.specimenTypeId &&
          m.specimenTypeName &&
          m.specimenTypeId === filterSpecimenTypeId,
      );
    }
    if (methods.length === 0) return false;
    const selectedCount = methods.filter((m) =>
      isMethodSelected(indicatorId, m.testMethodId, m.specimenTypeId),
    ).length;
    return selectedCount > 0 && selectedCount < methods.length;
  };

  // Helper: Check if all indicators in a list are fully selected
  // filterSpecimenTypeId: nếu có, chỉ check methods có specimenTypeId matching
  const areAllIndicatorsSelected = (
    indicatorIds: string[],
    filterSpecimenTypeId?: string,
  ): boolean => {
    if (indicatorIds.length === 0) return false;
    return indicatorIds.every((indId) =>
      areAllMethodsSelected(indId, filterSpecimenTypeId),
    );
  };

  // Helper: Check if some indicators in a list are selected (partial)
  // filterSpecimenTypeId: nếu có, chỉ check methods có specimenTypeId matching (loại bỏ methods không có nền mẫu)
  const areSomeIndicatorsSelected = (
    indicatorIds: string[],
    filterSpecimenTypeId?: string,
  ): boolean => {
    if (indicatorIds.length === 0) return false;
    let methods: IndicatorMethodInfo[];
    const hasAnySelected = indicatorIds.some((indId) => {
      methods = indicatorMethodsMap[indId]?.filter((m) => m.isActive) || [];
      if (filterSpecimenTypeId) {
        methods = methods.filter(
          (m) =>
            m.specimenTypeId &&
            m.specimenTypeName &&
            m.specimenTypeId === filterSpecimenTypeId,
        );
      }
      return methods.some((m) =>
        isMethodSelected(indId, m.testMethodId, m.specimenTypeId),
      );
    });
    return (
      hasAnySelected &&
      !areAllIndicatorsSelected(indicatorIds, filterSpecimenTypeId)
    );
  };

  // Helper: Render indicator with methods (reusable)
  // filterSpecimenTypeId: khi render trong context của một group nền mẫu cụ thể,
  // chỉ hiển thị methods có specimenTypeId matching với group đó
  // isLastIndicator: true nếu đây là indicator cuối cùng trong group (để vẽ tree line)
  const renderIndicatorWithMethods = (
    ind: IndicatorDto,
    indentLevel: number = 1,
    filterSpecimenTypeId?: string,
    isLastIndicator: boolean = false,
  ) => {
    // Filter methods
    const allMethods =
      indicatorMethodsMap[ind.id]?.filter((m) => m.isActive) || [];
    let methods = allMethods;

    // 1. Nếu có filterSpecimenTypeId (từ group nền mẫu), chỉ hiển thị methods có specimenTypeId matching
    // Loại bỏ hoàn toàn các methods không có nền mẫu (check cả specimenTypeName để đảm bảo)
    if (filterSpecimenTypeId) {
      methods = allMethods.filter(
        (m) =>
          m.specimenTypeId &&
          m.specimenTypeName &&
          m.specimenTypeId === filterSpecimenTypeId,
      );
    }
    // 2. Nếu specimenTypeFilterActive và sample có specimenTypeId, filter theo sample
    else if (specimenTypeFilterActive && currentSampleSpecimenTypeId) {
      methods = allMethods.filter(
        (m) =>
          m.specimenTypeId &&
          m.specimenTypeName &&
          m.specimenTypeId === currentSampleSpecimenTypeId,
      );
    }

    // Nếu không có method nào sau khi filter, không render indicator này
    if (methods.length === 0) return null;

    const isIndicatorExpanded = expandedIndicators.includes(ind.id);
    const selectedMethodsCount = methods.filter((m) =>
      isMethodSelected(ind.id, m.testMethodId, m.specimenTypeId),
    ).length;
    const paddingLeft = indentLevel === 1 ? 0 : indentLevel === 2 ? 36 : 0;
    // Method padding must align checkbox with indicator checkbox
    // Indicator has: paddingLeft + Arrow (18px) + gap (8px) before checkbox
    // So method needs: paddingLeft + 18 + 8 = paddingLeft + 26
    const methodPaddingLeft =
      indentLevel === 1 ? 26 : indentLevel === 2 ? 62 : 26;
    // Pass filterSpecimenTypeId to helper functions
    const isAllSelected = areAllMethodsSelected(ind.id, filterSpecimenTypeId);
    const isSomeSelected = areSomeMethodsSelected(ind.id, filterSpecimenTypeId);

    // Tree classes for Level 3 (Indicator)
    const level3ClassName =
      indentLevel === 2
        ? `tree-item tree-level-3${isLastIndicator ? " is-last" : ""}`
        : "";

    return (
      <div key={ind.id} className={level3ClassName}>
        {/* Indicator header */}
        <div
          style={{
            padding: `6px 12px 6px ${paddingLeft}px`,
            display: "flex",
            alignItems: "center",
            gap: 8,
            background:
              selectedMethodsCount > 0 ? "#e6f7ff" : "rgb(250, 250, 250)",
          }}
        >
          <Icon
            icon={
              isIndicatorExpanded ? "mdi:chevron-down" : "mdi:chevron-right"
            }
            width={18}
            style={{ color: "#595959", flexShrink: 0, cursor: "pointer" }}
            onClick={() => {
              setExpandedIndicators((prev) =>
                prev.includes(ind.id)
                  ? prev.filter((id) => id !== ind.id)
                  : [...prev, ind.id],
              );
            }}
          />
          <Checkbox
            checked={isAllSelected}
            indeterminate={isSomeSelected}
            onClick={(e) => e.stopPropagation()}
            onChange={() =>
              toggleAllMethodsOfIndicator(
                ind.id,
                !isAllSelected,
                filterSpecimenTypeId,
              )
            }
          />
          <TruncateTooltip
            title={ind.name}
            className={
              isIndicatorExpanded ? "indicator-name-gradient" : undefined
            }
            style={{
              flex: 1,
              fontSize: 14,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <IndicatorName name={ind.name} formattedName={ind.formattedName} />
          </TruncateTooltip>
        </div>

        {/* Methods under indicator */}
        {isIndicatorExpanded && (
          <div>
            {methods.map((method, methodIndex) => {
              // Use specimenTypeId for unique key and selection
              const methodUniqueKey = `${method.testMethodId}_${method.specimenTypeId || "null"}`;
              const isSelected = isMethodSelected(
                ind.id,
                method.testMethodId,
                method.specimenTypeId,
              );
              // Check if this method is sent to department (locked)
              const methodKey = createIndicatorMethodKey(ind.id, method.testMethodId, method.specimenTypeId);
              const methodLabInfo = indicatorLaboratoryMap[`${currentSampleKey}_${methodKey}`];
              const isMethodLocked = isIndicatorLocked(methodLabInfo);

              const isLastMethod = methodIndex === methods.length - 1;
              const methodClassName = `tree-item tree-level-4${isLastMethod ? " is-last" : ""}${indentLevel === 2 ? " indent-level-2" : ""}`;
              return (
                <div
                  key={methodUniqueKey}
                  className={methodClassName}
                  onClick={() =>
                    !isMethodLocked && toggleIndicatorMethod(
                      ind.id,
                      method.testMethodId,
                      method.specimenTypeId,
                    )
                  }
                  style={{
                    padding: `5px 12px 5px ${methodPaddingLeft}px`,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: isMethodLocked ? "not-allowed" : "pointer",
                    background: isSelected ? (isMethodLocked ? "#e6f7e6" : "#bae7ff") : "rgb(250, 250, 250)",
                    opacity: isMethodLocked ? 0.7 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected && !isMethodLocked) {
                      e.currentTarget.style.background = "#f0f0f0";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isSelected
                      ? (isMethodLocked ? "#e6f7e6" : "#bae7ff")
                      : "rgb(250, 250, 250)";
                  }}
                >
                  <Checkbox
                    checked={isSelected}
                    disabled={isMethodLocked}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => {
                      if (!isMethodLocked) {
                        toggleIndicatorMethod(
                          ind.id,
                          method.testMethodId,
                          method.specimenTypeId,
                        );
                      }
                    }}
                  />
                  <TruncateTooltip
                    title={method.testMethodName}
                    style={{
                      flex: 1,
                      fontSize: 14,
                      fontWeight: 500,
                      color: "#1F1F1F",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <IndicatorName
                      name={method.testMethodName}
                      formattedName={method.testMethodFormattedName}
                    />
                  </TruncateTooltip>
                  <span
                    style={{
                      fontSize: 14,
                      color: "#1F1F1F",
                      fontWeight: 400,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {method.unitPrice?.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Render content grouped by: Nhóm CT → Loại mẫu → Chỉ tiêu → Phương pháp
  const renderBySpecimenType = () => {
    // Get all indicators with active methods
    let activeIndicators = indicators.filter(
      (ind) =>
        ind.isActive && indicatorMethodsMap[ind.id]?.some((m) => m.isActive),
    );

    // Apply specimen type filter if active (from current sample)
    if (specimenTypeFilterActive) {
      activeIndicators = activeIndicators.filter((ind) =>
        specimenTypeIndicatorIds.includes(ind.id),
      );
    }

    // Apply indicator group filter if selected
    if (selectedGroupFilter !== "all") {
      activeIndicators = activeIndicators.filter(
        (ind) => ind.indicatorGroupId === selectedGroupFilter,
      );
    }

    // Apply search filter (normalize Unicode to handle different compositions of Vietnamese diacritics)
    if (indicatorSearchText.trim()) {
      const searchNorm = indicatorSearchText.trim().normalize("NFC").toLowerCase();
      activeIndicators = activeIndicators.filter((ind) => {
        const nameNorm = ind.name.normalize("NFC").toLowerCase();
        const codeNorm = ind.code?.normalize("NFC").toLowerCase();
        if (nameNorm.includes(searchNorm) || codeNorm?.includes(searchNorm)) {
          return true;
        }
        // Search theo tên phương pháp
        const methods = indicatorMethodsMap[ind.id]?.filter((m) => m.isActive) || [];
        return methods.some((m) =>
          m.testMethodName?.normalize("NFC").toLowerCase().includes(searchNorm),
        );
      });
    }

    // Build map: indicatorId -> specimenTypeIds (từ indicatorMethodsMap thay vì specimenTypesWithIndicators)
    // Điều này đảm bảo chỉ group dựa trên methods thực sự có specimenTypeId
    const indicatorSpecimenTypesMap = new Map<
      string,
      { id: string; name: string }[]
    >();
    Object.entries(indicatorMethodsMap).forEach(([indicatorId, methods]) => {
      const specimenTypesForIndicator: { id: string; name: string }[] = [];
      const seenIds = new Set<string>();

      methods.forEach((method) => {
        // Chỉ lấy methods có specimenTypeId và specimenTypeName (có nền mẫu thực sự)
        if (
          method.isActive &&
          method.specimenTypeId &&
          method.specimenTypeName &&
          !seenIds.has(method.specimenTypeId)
        ) {
          seenIds.add(method.specimenTypeId);
          specimenTypesForIndicator.push({
            id: method.specimenTypeId,
            name: method.specimenTypeName,
          });
        }
      });

      if (specimenTypesForIndicator.length > 0) {
        indicatorSpecimenTypesMap.set(indicatorId, specimenTypesForIndicator);
      }
    });

    // Get specimen type IDs to filter by (from selected categories and/or specimen types)
    let specimenTypeIdsToFilter: string[] = [];
    if (selectedSpecimenTypeIds.length > 0) {
      // If specific specimen types selected, use them
      specimenTypeIdsToFilter = selectedSpecimenTypeIds;
    } else if (selectedCategoryIds.length > 0) {
      // If only categories selected, get all specimen types in those categories
      specimenTypeIdsToFilter = specimenTypes
        .filter(
          (st) =>
            st.isActive &&
            st.sampleTypeCategoryId &&
            selectedCategoryIds.includes(st.sampleTypeCategoryId),
        )
        .map((st) => st.id);
    }

    // Apply specimen type filter from new filter fields
    if (specimenTypeIdsToFilter.length > 0) {
      activeIndicators = activeIndicators.filter((ind) => {
        const indStList = indicatorSpecimenTypesMap.get(ind.id) || [];
        // Indicator must belong to at least one of the selected specimen types
        return indStList.some((st) => specimenTypeIdsToFilter.includes(st.id));
      });
    }

    // Group structure: Nhóm CT → Loại mẫu → Chỉ tiêu[]
    type IndicatorGroupData = {
      id: string;
      name: string;
      specimenTypes: Map<
        string,
        { id: string; name: string; indicators: IndicatorDto[] }
      >;
    };

    const groupedData: IndicatorGroupData[] = [];

    // Process each indicator group
    indicatorGroups.forEach((group) => {
      const groupIndicators = activeIndicators.filter(
        (ind) => ind.indicatorGroupId === group.id,
      );
      if (groupIndicators.length === 0) return;

      // Group indicators by specimen type within this indicator group
      const specimenTypesMap = new Map<
        string,
        { id: string; name: string; indicators: IndicatorDto[] }
      >();

      groupIndicators.forEach((ind) => {
        const stList = indicatorSpecimenTypesMap.get(ind.id) || [];
        if (stList.length === 0) {
          // Indicator không có method nào với nền mẫu -> nhóm "Khác"
          // Chỉ hiển thị group "Khác" khi không có filter loại mẫu
          if (specimenTypeIdsToFilter.length === 0) {
            if (!specimenTypesMap.has("others")) {
              specimenTypesMap.set("others", {
                id: "others",
                name: "Khác",
                indicators: [],
              });
            }
            specimenTypesMap.get("others")!.indicators.push(ind);
          }
        } else {
          // Indicator có methods với nền mẫu - group theo từng nền mẫu
          // Chỉ group vào các specimen type đang được filter (nếu có filter)
          stList.forEach((st) => {
            // Nếu có filter và specimen type này không nằm trong filter -> bỏ qua
            if (
              specimenTypeIdsToFilter.length > 0 &&
              !specimenTypeIdsToFilter.includes(st.id)
            ) {
              return;
            }
            if (!specimenTypesMap.has(st.id)) {
              specimenTypesMap.set(st.id, {
                id: st.id,
                name: st.name,
                indicators: [],
              });
            }
            specimenTypesMap.get(st.id)!.indicators.push(ind);
          });
        }
      });

      groupedData.push({
        id: group.id,
        name: group.name,
        specimenTypes: specimenTypesMap,
      });
    });

    // Debug: If no grouped data, show detailed message
    if (groupedData.length === 0) {
      const totalIndicators = indicators.length;
      const activeCount = indicators.filter((i) => i.isActive).length;
      const methodMapKeys = Object.keys(indicatorMethodsMap).length;
      const withMethods = indicators.filter(
        (i) => i.isActive && indicatorMethodsMap[i.id]?.some((m) => m.isActive),
      ).length;

      return (
        <div style={{ padding: 24, textAlign: "center", color: "#999" }}>
          <Text type="secondary">Không có chỉ tiêu nào phù hợp với bộ lọc</Text>
        </div>
      );
    }

    return (
      <>
        {groupedData.map((groupData, groupIndex) => {
          const isGroupExpanded = expandedGroups.includes(groupData.id);
          const isLastGroup = groupIndex === groupedData.length - 1;
          // Get all indicator IDs in this group
          const allIndicatorIdsInGroup: string[] = [];
          groupData.specimenTypes.forEach((stData) => {
            stData.indicators.forEach((ind) => {
              if (!allIndicatorIdsInGroup.includes(ind.id)) {
                allIndicatorIdsInGroup.push(ind.id);
              }
            });
          });
          const isAllGroupSelected = areAllIndicatorsSelected(
            allIndicatorIdsInGroup,
          );
          const isSomeGroupSelected = areSomeIndicatorsSelected(
            allIndicatorIdsInGroup,
          );

          return (
            <div
              key={groupData.id}
              style={{
                borderBottom: isLastGroup ? "none" : "1px solid #e8e8e8",
                paddingBottom: isLastGroup ? 0 : 8,
                marginBottom: isLastGroup ? 0 : 8,
              }}
            >
              {/* Nhóm CT header (Level 1) */}
              <div
                style={{
                  padding: "8px 0",
                  background: "#fafafa",
                  fontWeight: 400,
                  fontSize: 14,
                  color: "#000",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  userSelect: "none",
                }}
              >
                <Icon
                  icon={
                    isGroupExpanded ? "mdi:chevron-down" : "mdi:chevron-right"
                  }
                  width={18}
                  style={{ color: "#595959", flexShrink: 0, cursor: "pointer" }}
                  onClick={() => {
                    setExpandedGroups((prev) =>
                      prev.includes(groupData.id)
                        ? prev.filter((id) => id !== groupData.id)
                        : [...prev, groupData.id],
                    );
                  }}
                />
                <Checkbox
                  checked={isAllGroupSelected}
                  indeterminate={isSomeGroupSelected}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() =>
                    toggleAllIndicatorsInGroup(
                      allIndicatorIdsInGroup,
                      !isAllGroupSelected,
                    )
                  }
                />
                <span
                  style={{
                    flex: 1,
                    ...(isGroupExpanded && {
                      background:
                        "linear-gradient(135deg, rgb(24, 144, 255) 0%, rgb(9, 109, 217) 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }),
                  }}
                >
                  {groupData.name}
                </span>
              </div>

              {/* Loại mẫu within Nhóm CT (Level 2) - sorted alphabetically */}
              {isGroupExpanded &&
                (() => {
                  const specimenTypesArray = Array.from(
                    groupData.specimenTypes.values(),
                  ).sort((a, b) => {
                    // "Khác" (others) always goes last
                    if (a.id === "others") return 1;
                    if (b.id === "others") return -1;
                    // Sort alphabetically by name
                    return normalizeForSort(a.name).localeCompare(
                      normalizeForSort(b.name),
                      "vi",
                      { sensitivity: "base" }
                    );
                  });
                  return specimenTypesArray.map((stData, stIndex) => {
                    const isSpecimenTypeExpanded =
                      expandedSpecimenTypes.includes(
                        `${groupData.id}_${stData.id}`,
                      );
                    const stIndicatorIds = stData.indicators.map(
                      (ind) => ind.id,
                    );
                    // Filter theo specimenTypeId của group (trừ group "others")
                    const filterStId =
                      stData.id === "others" ? undefined : stData.id;
                    const isAllStSelected = areAllIndicatorsSelected(
                      stIndicatorIds,
                      filterStId,
                    );
                    const isSomeStSelected = areSomeIndicatorsSelected(
                      stIndicatorIds,
                      filterStId,
                    );
                    const isLastLevel2 =
                      stIndex === specimenTypesArray.length - 1;

                    return (
                      <div
                        key={`${groupData.id}_${stData.id}`}
                        className={`tree-item tree-level-2${isLastLevel2 ? " is-last" : ""}`}
                      >
                        {/* Loại mẫu header */}
                        <div
                          style={{
                            padding: "6px 0 6px 20px",
                            background: "#fafafa",
                            fontWeight: 400,
                            fontSize: 14,
                            color: "#000",
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 8,
                            userSelect: "none",
                          }}
                        >
                          <Icon
                            icon={
                              isSpecimenTypeExpanded
                                ? "mdi:chevron-down"
                                : "mdi:chevron-right"
                            }
                            width={16}
                            style={{
                              color: "#595959",
                              flexShrink: 0,
                              cursor: "pointer",
                            }}
                            onClick={() => {
                              const key = `${groupData.id}_${stData.id}`;
                              setExpandedSpecimenTypes((prev) =>
                                prev.includes(key)
                                  ? prev.filter((id) => id !== key)
                                  : [...prev, key],
                              );
                            }}
                          />
                          <Checkbox
                            checked={isAllStSelected}
                            indeterminate={isSomeStSelected}
                            onClick={(e) => e.stopPropagation()}
                            onChange={() =>
                              toggleAllIndicatorsInGroup(
                                stIndicatorIds,
                                !isAllStSelected,
                                filterStId,
                              )
                            }
                          />
                          <span
                            style={{
                              flex: 1,
                              ...(isSpecimenTypeExpanded && {
                                background:
                                  "linear-gradient(135deg, rgb(24, 144, 255) 0%, rgb(9, 109, 217) 100%)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                backgroundClip: "text",
                              }),
                            }}
                          >
                            {stData.name}
                          </span>
                        </div>

                        {/* Chỉ tiêu within Loại mẫu (Level 3) - sorted alphabetically */}
                        {isSpecimenTypeExpanded &&
                          (() => {
                            const sortedIndicators = sortIndicatorsAlphabetically(stData.indicators);
                            return sortedIndicators.map((ind, indIndex) =>
                              // Truyền specimenTypeId của group để chỉ hiển thị methods matching
                              // "others" group không filter theo specimenType
                              renderIndicatorWithMethods(
                                ind,
                                2,
                                stData.id === "others" ? undefined : stData.id,
                                indIndex === sortedIndicators.length - 1,
                              ),
                            );
                          })()}
                      </div>
                    );
                  });
                })()}
            </div>
          );
        })}
      </>
    );
  };

  // Left panel content - extracted for reuse in drawer
  const leftPanelContent = (
    <>
      <div
        style={{
          padding: "12px 16px",
          background: "#fafafa",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {/* Từ khóa search */}
        <Input
          placeholder="Từ khóa..."
          prefix={<SearchOutlined style={{ color: "#999" }} />}
          value={indicatorSearchText}
          onChange={(e) => setIndicatorSearchText(e.target.value)}
          allowClear
          size="small"
        />
        {/* Danh mục loại mẫu + Loại mẫu - nằm ngang trên desktop */}
        <div className="indicator-filter-selects">
          <Select
            mode="multiple"
            placeholder="Danh mục loại mẫu"
            value={selectedCategoryIds}
            onChange={setSelectedCategoryIds}
            style={{ width: "100%" }}
            size="small"
            maxTagCount="responsive"
            allowClear
            options={sampleTypeCategories
              .filter((cat) => cat.isActive)
              .map((cat) => ({
                value: cat.id,
                label: cat.name,
              }))}
            tagRender={(props) => {
              const { label, closable, onClose } = props;
              return (
                <Tag
                  closable={closable}
                  onClose={onClose}
                  style={{
                    marginRight: 4,
                    borderRadius: 6,
                    border: "1px solid #d9d9d9",
                    background: "#fff",
                    color: "#262626",
                    padding: "0 8px",
                    lineHeight: "22px",
                    maxWidth: 150,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={label as string}
                >
                  {label}
                </Tag>
              );
            }}
          />
          <Select
            mode="multiple"
            placeholder="Loại mẫu"
            value={selectedSpecimenTypeIds}
            onChange={setSelectedSpecimenTypeIds}
            style={{ width: "100%" }}
            size="small"
            maxTagCount="responsive"
            allowClear
            options={filteredSpecimenTypeOptions.map((st) => ({
              value: st.id,
              label: st.name,
            }))}
            tagRender={(props) => {
              const { label, closable, onClose } = props;
              return (
                <Tag
                  closable={closable}
                  onClose={onClose}
                  style={{
                    marginRight: 4,
                    borderRadius: 6,
                    border: "1px solid #d9d9d9",
                    background: "#fff",
                    color: "#262626",
                    padding: "0 8px",
                    lineHeight: "22px",
                    maxWidth: 150,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={label as string}
                >
                  {label}
                </Tag>
              );
            }}
          />
        </div>
        {/* Filter theo loại mẫu của sample hiện tại */}
        {currentSampleSpecimenTypeName && (
          <Checkbox
            checked={specimenTypeFilterActive}
            onChange={(e) => setSpecimenTypeFilterActive(e.target.checked)}
            style={{ fontSize: 13 }}
          >
            Chỉ hiện chỉ tiêu của: {currentSampleSpecimenTypeName}
          </Checkbox>
        )}
      </div>
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0 6px 12px 12px",
          background: "rgb(250, 250, 250)",
        }}
      >
        {/* Empty state khi filter theo loại mẫu nhưng không có chỉ tiêu */}
        {specimenTypeFilterActive && indicatorsWithMethods.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "48px 24px",
              color: "#999",
            }}
          >
            <Icon
              icon="mdi:flask-empty-outline"
              width={48}
              style={{ marginBottom: 12, color: "#d9d9d9" }}
            />
            <Text
              type="secondary"
              style={{ fontSize: 14, textAlign: "center" }}
            >
              Loại mẫu "{currentSampleSpecimenTypeName}" chưa được cấu hình chỉ
              tiêu
            </Text>
            <Text type="secondary" style={{ fontSize: 12, marginTop: 4 }}>
              Bỏ chọn filter để xem tất cả chỉ tiêu
            </Text>
          </div>
        ) : (
          // Always render grouped by Specimen Type
          renderBySpecimenType()
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Drawer for mobile indicator picker */}
      <Drawer
        title="Chọn chỉ tiêu"
        placement="left"
        open={indicatorPickerOpen}
        onClose={() => setIndicatorPickerOpen(false)}
        width={320}
        styles={{
          body: { padding: 0, display: "flex", flexDirection: "column" },
        }}
        className="indicator-picker-drawer"
      >
        {leftPanelContent}
      </Drawer>

      <Modal
        title={
          <div
            style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}
          >
            <Icon icon="mdi:clipboard-check-outline" width={24} height={24} />
            <span>Chọn chỉ tiêu</span>
            {/* Button to open indicator picker - shown only on mobile/tablet via CSS */}
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => setIndicatorPickerOpen(true)}
              className="indicator-add-button-mobile"
              style={{ marginLeft: "auto" }}
            >
              Thêm
            </Button>
            {/* Close button - shown on desktop */}
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={onCancel}
              className="indicator-close-button-desktop"
              style={{ marginLeft: "auto" }}
            />
          </div>
        }
        open={visible}
        onOk={onOk}
        onCancel={onCancel}
        width={1500}
        centered
        closable={false}
        okText="Chọn"
        cancelText="Hủy"
        okButtonProps={{
          style: {
            minWidth: 100,
            background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
            borderColor: "transparent",
          },
        }}
        cancelButtonProps={{
          style: { minWidth: 100 },
        }}
        styles={{ body: { padding: 0 } }}
        className="indicator-selection-modal"
      >
        <div className="indicator-modal-body">
          {/* Left panel - 3-level tree: Group > Indicator > Methods (desktop only) */}
          <div className="indicator-modal-left">{leftPanelContent}</div>

          {/* Right panel - Selected indicator methods */}
          <div className="indicator-modal-right">
            <Card
              styles={{
                body: {
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                  minHeight: 0,
                },
              }}
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                minHeight: 0,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "8px 12px",
                  borderBottom: "1px solid #d9d9d9",
                  background:
                    "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <Text strong style={{ color: "#fff" }}>
                  Danh sách đã chọn
                </Text>
                <Button
                  size="small"
                  icon={<Icon icon="bi:send" width={14} />}
                  onClick={handleSendToLaboratory}
                  style={{
                    background: "#fff",
                    color: "#1890ff",
                    borderColor: "#fff",
                  }}
                >
                  Gửi khoa phòng
                </Button>
              </div>
              <div className="indicator-table-container">
                <div className="indicator-table-scroll">
                  <div className="indicator-table-inner">
                    {/* Table header */}
                    <div
                      className="indicator-table-header"
                      style={{
                        fontWeight: 600,
                        fontSize: 13,
                      }}
                    >
                      <Checkbox
                        checked={
                          checkedIndicators.length ===
                            unsentParentMethods.length &&
                          unsentParentMethods.length > 0
                        }
                        indeterminate={
                          checkedIndicators.length > 0 &&
                          checkedIndicators.length < unsentParentMethods.length
                        }
                        disabled={unsentParentMethods.length === 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCheckedIndicators([...unsentParentMethods]);
                          } else {
                            setCheckedIndicators([]);
                          }
                        }}
                        style={{
                          width: 24,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          flex: 1,
                          minWidth: 80,
                        }}
                      >
                        Chỉ tiêu
                      </span>
                      <span
                        style={{
                          width: 120,
                          flexShrink: 0,
                        }}
                      >
                        Phương pháp
                      </span>
                      <span
                        style={{
                          width: 110,
                          flexShrink: 0,
                        }}
                      >
                        Đơn giá
                      </span>
                      <span
                        style={{
                          width: 100,
                          flexShrink: 0,
                          textAlign: "center",
                        }}
                      >
                        Ngày CG
                      </span>
                      <span
                        style={{
                          width: 100,
                          flexShrink: 0,
                          textAlign: "center",
                        }}
                      >
                        Ngày YC
                      </span>
                      <span
                        style={{ width: 32, flexShrink: 0 }}
                      >
                        Xóa
                      </span>
                    </div>
                    {/* Table body */}
                    <div className="indicator-table-body">
                      {/* 1. Parent indicators with their sub-indicators (unsent only) */}
                      {groupedSelectedMethods.parentMethods
                        .filter((key) => unsentMethods.includes(key))
                        .map((parentKey) => {
                          const { indicator, method } =
                            getIndicatorMethodInfo(parentKey);
                          const subs =
                            groupedSelectedMethods.subMethodsMap[parentKey] ||
                            [];
                          const unsentSubs = subs.filter((s) =>
                            unsentMethods.includes(s),
                          );
                          const pricingMode = getPricingMode(parentKey);

                          return (
                            <React.Fragment key={parentKey}>
                              {/* Parent row */}
                              <IndicatorRow
                                id={parentKey}
                                isInGroup={false}
                                indicator={indicator}
                                methodName={method?.testMethodName || ""}
                                methodFormattedName={
                                  method?.testMethodFormattedName
                                }
                                unitPrice={getEffectivePrice(parentKey, method?.unitPrice || 0)}
                                hidePrice={pricingMode === "subs"}
                                isFree={isIndicatorFree(indicator)}
                                isChecked={checkedIndicators.includes(
                                  parentKey,
                                )}
                                transferDate={
                                  selectedIndicatorDates[parentKey]
                                    ?.transferDate
                                }
                                requestDate={
                                  selectedIndicatorDates[parentKey]?.requestDate
                                }
                                onCheckChange={toggleCheckedIndicator}
                                onDateChange={handleIndicatorDateChange}
                                onRemove={handleRemoveParentIndicator}
                                onPriceChange={(id, price) => onPriceChange(`${currentSampleKey}_${id}`, price)}
                              />

                              {/* Sub-indicator rows - only show name (no method, price, dates, remove button) */}
                              {unsentSubs.map((subKey, index) => {
                                const { indicator: subInd, method: subMethod } =
                                  getIndicatorMethodInfo(subKey);
                                return (
                                  <IndicatorRow
                                    key={subKey}
                                    id={subKey}
                                    isInGroup={false}
                                    indicator={subInd}
                                    methodName={subMethod?.testMethodName || ""}
                                    unitPrice={getEffectivePrice(subKey, subMethod?.unitPrice || 0)}
                                    isSubIndicator={true}
                                    isFirstSub={index === 0}
                                    isLastSub={index === unsentSubs.length - 1}
                                    isChecked={false}
                                    onCheckChange={() => {}}
                                    onDateChange={() => {}}
                                    onRemove={() => {}}
                                  />
                                );
                              })}
                            </React.Fragment>
                          );
                        })}

                      {/* 2. Independent indicators (no subs, unsent only) */}
                      {groupedSelectedMethods.independentMethods
                        .filter((key) => unsentMethods.includes(key))
                        .map((key) => {
                          const { indicator, method } =
                            getIndicatorMethodInfo(key);
                          return (
                            <IndicatorRow
                              key={key}
                              id={key}
                              isInGroup={false}
                              indicator={indicator}
                              methodName={method?.testMethodName || ""}
                              methodFormattedName={
                                method?.testMethodFormattedName
                              }
                              unitPrice={getEffectivePrice(key, method?.unitPrice || 0)}
                              isFree={isIndicatorFree(indicator)}
                              isChecked={checkedIndicators.includes(key)}
                              transferDate={
                                selectedIndicatorDates[key]?.transferDate
                              }
                              requestDate={
                                selectedIndicatorDates[key]?.requestDate
                              }
                              onCheckChange={toggleCheckedIndicator}
                              onDateChange={handleIndicatorDateChange}
                              onRemove={handleRemoveIndicatorMethod}
                              onPriceChange={(id, price) => onPriceChange(`${currentSampleKey}_${id}`, price)}
                            />
                          );
                        })}

                      {/* Sent indicator methods grouped by laboratory */}
                      {Object.entries(groupedByLab).map(
                        ([labId, { labName, methods: labMethods }]) => {
                          const isExpanded = expandedLabGroups.includes(labId);
                          return (
                            <div key={labId}>
                              <div
                                onClick={() => {
                                  setExpandedLabGroups((prev) =>
                                    prev.includes(labId)
                                      ? prev.filter((id) => id !== labId)
                                      : [...prev, labId],
                                  );
                                }}
                                style={{
                                  padding: "8px 12px",
                                  background: "#fafafa",
                                  borderBottom: "1px solid #f0f0f0",
                                  fontWeight: 600,
                                  fontSize: 13,
                                  color: "#000",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  cursor: "pointer",
                                  userSelect: "none",
                                }}
                              >
                                <Icon
                                  icon={
                                    isExpanded
                                      ? "mdi:chevron-down"
                                      : "mdi:chevron-right"
                                  }
                                  width={18}
                                  style={{ color: "#595959", flexShrink: 0 }}
                                />
                                <span>
                                  {labName} ({labMethods.length})
                                </span>
                              </div>
                              {isExpanded &&
                                labMethods.map((key) => {
                                  const { indicator, method } =
                                    getIndicatorMethodInfo(key);
                                  const labInfo =
                                    indicatorLaboratoryMap[
                                      `${currentSampleKey}_${key}`
                                    ];
                                  return (
                                    <IndicatorRow
                                      key={key}
                                      id={key}
                                      isInGroup={true}
                                      indicator={indicator}
                                      methodName={method?.testMethodName || ""}
                                      methodFormattedName={
                                        method?.testMethodFormattedName
                                      }
                                      unitPrice={getEffectivePrice(key, method?.unitPrice || 0)}
                                      isFree={isIndicatorFree(indicator)}
                                      isChecked={checkedIndicators.includes(
                                        key,
                                      )}
                                      transferDate={
                                        selectedIndicatorDates[key]
                                          ?.transferDate
                                      }
                                      requestDate={
                                        selectedIndicatorDates[key]?.requestDate
                                      }
                                      approvalStatus={labInfo?.approvalStatus}
                                      isSentToQLKT={labInfo?.isSentToQLKT}
                                      sentToDepartment={labInfo?.sentToDepartment}
                                      onCheckChange={toggleCheckedIndicator}
                                      onDateChange={handleIndicatorDateChange}
                                      onRemove={handleRemoveIndicatorMethod}
                                      onPriceChange={(id, price) => onPriceChange(`${currentSampleKey}_${id}`, price)}
                                    />
                                  );
                                })}
                            </div>
                          );
                        },
                      )}

                      {/* Empty state */}
                      {tempSelectedIndicatorMethods.length === 0 && (
                        <div style={{ padding: 24, textAlign: "center" }}>
                          <Text type="secondary">Chưa chọn chỉ tiêu nào</Text>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div
                style={{
                  padding: "12px 16px",
                  borderTop: "1px solid #d9d9d9",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 14 }}>
                  Số chỉ tiêu:{" "}
                  <Text strong>{tempSelectedIndicatorMethods.length}</Text>
                  {sentMethods.length > 0 && (
                    <span style={{ color: "#52c41a", marginLeft: 8 }}>
                      (Đã gửi: {sentMethods.length})
                    </span>
                  )}
                </Text>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Text style={{ fontSize: 14 }}>Tổng tiền:</Text>
                  <Text strong style={{ fontSize: 16, color: "#FF0000" }}>
                    {totalCost.toLocaleString("vi-VN")} đ
                  </Text>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default IndicatorSelectionModal;
