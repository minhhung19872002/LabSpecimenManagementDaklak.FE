import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  Modal,
  Card,
  Checkbox,
  Typography,
  Input,
  InputNumber,
  Empty,
  Spin,
  Select,
  Tag,
  Tooltip,
  Button,
} from "antd";
import { SearchOutlined, CloseOutlined, EditOutlined } from "../../../components/common/Icon";
import { authService } from "../../../services/authService";
import {
  CustomIndicatorName,
  isSameIndicatorName,
  pickCustomIndicatorName,
} from "../../../utils/indicatorName";
import { Icon } from "@iconify/react";
import {
  testMethodService,
  indicatorGroupService,
  indicatorService,
  specimenTypeService,
  sampleTypeCategoryService,
  TestMethodWithIndicatorsDto,
  TestMethodIndicatorDto,
  IndicatorGroupDto,
  IndicatorDto,
  SpecimenTypeDto,
  SampleTypeCategoryDto,
} from "../../../services/masterDataService";
import { formatCurrency } from "../../../utils/formatters";
import { IndicatorName, IndicatorNameEditModal } from "../../../components/common";
import {
  isHeavyMetalComboMet,
  isHgIndicator,
  isEcoliColiformComboMet,
  isEcoliIndicator,
} from "../../TestRequest/TestRequestForm/constants";
import "./QuotationIndicatorSelectionModal.css";

const { Text } = Typography;

// Selected method info for quotation
export interface SelectedMethodInfo {
  indicatorId: string;
  indicatorName: string;
  indicatorFormattedName?: string;
  testMethodId: string;
  testMethodName: string;
  testMethodFormattedName?: string;
  unitPrice: number;
  specimenTypeId?: string;
  specimenTypeName?: string;
  /** Admin đã sửa tên trên báo giá → gửi tên lên BE khi lưu */
  isCustomName?: boolean;
}

// Existing indicator info passed from parent to pre-select
export interface ExistingMethodInfo {
  key: string; // indicatorId_testMethodId_specimenTypeId
  indicatorId: string;
  testMethodId: string;
  indicatorName: string;
  indicatorFormattedName?: string | null;
  testMethodName: string;
  testMethodFormattedName?: string | null;
  unitPrice: number;
  specimenTypeId?: string;
  specimenTypeName?: string;
  isCustomName?: boolean;
}

interface QuotationIndicatorSelectionModalProps {
  visible: boolean;
  onCancel: () => void;
  onOk: (selectedMethods: SelectedMethodInfo[]) => void;
  existingMethods?: ExistingMethodInfo[]; // pre-selected indicators from current sample
}

// Method info (from master data)
interface MethodInfo {
  testMethodId: string;
  testMethodName: string;
  testMethodFormattedName?: string;
  unitPrice: number;
  isActive: boolean;
  specimenTypeId?: string;
  specimenTypeName?: string;
  specimenTypeCode?: string;
  sampleTypeCategoryName?: string;
}

// Indicator methods map
type IndicatorMethodsMap = Record<string, MethodInfo[]>;

// Key format: indicatorId_testMethodId_specimenTypeId
type MethodKey = string;

const createMethodKey = (
  indicatorId: string,
  testMethodId: string,
  specimenTypeId?: string,
): MethodKey => `${indicatorId}_${testMethodId}_${specimenTypeId || "null"}`;

const parseMethodKey = (
  key: MethodKey,
): {
  indicatorId: string;
  testMethodId: string;
  specimenTypeId: string | null;
} => {
  const parts = key.split("_");
  if (parts.length === 2) {
    return {
      indicatorId: parts[0],
      testMethodId: parts[1],
      specimenTypeId: null,
    };
  }
  return {
    indicatorId: parts[0],
    testMethodId: parts[1],
    specimenTypeId: parts[2] === "null" ? null : parts[2],
  };
};

// Normalize for sorting
const normalizeForSort = (name: string): string => {
  return name
    .replace(/<[^>]*>/g, "")
    .normalize("NFC")
    .toLowerCase();
};

// Truncate tooltip component
const TruncateTooltip: React.FC<{
  title: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}> = ({ title, children, style, className }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  const handleMouseEnter = useCallback(() => {
    if (containerRef.current) {
      const { scrollWidth, clientWidth } = containerRef.current;
      setShowTooltip(scrollWidth > clientWidth);
    }
  }, []);

  return (
    <Tooltip title={title} open={showTooltip} placement="topLeft">
      <span
        ref={containerRef}
        className={className}
        style={style}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {children}
      </span>
    </Tooltip>
  );
};

const QuotationIndicatorSelectionModal: React.FC<
  QuotationIndicatorSelectionModalProps
> = ({ visible, onCancel, onOk, existingMethods = [] }) => {
  // Data loading state
  const [loading, setLoading] = useState(false);
  const [indicatorGroups, setIndicatorGroups] = useState<IndicatorGroupDto[]>(
    [],
  );
  const [indicators, setIndicators] = useState<IndicatorDto[]>([]);
  const [indicatorMethodsMap, setIndicatorMethodsMap] =
    useState<IndicatorMethodsMap>({});
  const [specimenTypes, setSpecimenTypes] = useState<SpecimenTypeDto[]>([]);
  const [sampleTypeCategories, setSampleTypeCategories] = useState<
    SampleTypeCategoryDto[]
  >([]);

  // UI state
  const [searchText, setSearchText] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedSpecimenTypeIds, setSelectedSpecimenTypeIds] = useState<
    string[]
  >([]);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [expandedSpecimenTypes, setExpandedSpecimenTypes] = useState<string[]>(
    [],
  );
  const [expandedIndicators, setExpandedIndicators] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<MethodKey[]>([]);
  // Custom prices for selected methods (overrides from combo or user edit)
  const [customPrices, setCustomPrices] = useState<Record<MethodKey, number>>(
    {},
  );
  // Tên chỉ tiêu trên báo giá khác tên danh mục (admin sửa / đã lưu trước đó)
  const [customNames, setCustomNames] = useState<
    Record<MethodKey, CustomIndicatorName>
  >({});
  // Dòng admin đã sửa tên (kể cả khôi phục tên danh mục) → gửi tên lên BE
  const [nameEditedKeys, setNameEditedKeys] = useState<Record<MethodKey, true>>(
    {},
  );
  const [editingNameKey, setEditingNameKey] = useState<MethodKey | null>(null);
  const canEditIndicatorName = useMemo(() => authService.isAdmin(), []);

  // Load data when modal opens, pre-populate from existingMethods after data loads
  useEffect(() => {
    setCustomNames({});
    setNameEditedKeys({});
    setEditingNameKey(null);
    if (visible) {
      setSelectedKeys([]);
      setCustomPrices({});
      loadData();
    } else {
      setSelectedKeys([]);
      setCustomPrices({});
      setSearchText("");
      setSelectedCategoryIds([]);
      setSelectedSpecimenTypeIds([]);
    }
  }, [visible]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        groups,
        allIndicators,
        testMethodsWithIndicators,
        stResult,
        categories,
      ] = await Promise.all([
        indicatorGroupService.getActive(),
        indicatorService.getActive(true),
        testMethodService.getWithIndicators(),
        specimenTypeService.getActive(),
        sampleTypeCategoryService.getActive(),
      ]);

      setIndicatorGroups(groups);
      setIndicators(allIndicators);
      setSpecimenTypes(stResult.items || stResult);
      setSampleTypeCategories(categories);

      // Build indicator methods map with specimen type info
      const methodsMap: IndicatorMethodsMap = {};

      testMethodsWithIndicators.forEach(
        (method: TestMethodWithIndicatorsDto) => {
          method.indicators?.forEach((ind: TestMethodIndicatorDto) => {

            if (!methodsMap[ind.indicatorId]) {
              methodsMap[ind.indicatorId] = [];
            }

            // Each indicator-method-specimenType combination is unique
            const specimenTypeId = (ind as any).specimenTypeId;
            const specimenTypeName = (ind as any).specimenTypeName;
            const existingKey = `${method.id}_${specimenTypeId || "null"}`;
            if (
              !methodsMap[ind.indicatorId].find(
                (m) =>
                  `${m.testMethodId}_${m.specimenTypeId || "null"}` ===
                  existingKey,
              )
            ) {
              // Find specimen type info for category name
              const stItems = (stResult.items || stResult) as SpecimenTypeDto[];
              const st = specimenTypeId
                ? stItems.find((s: SpecimenTypeDto) => s.id === specimenTypeId)
                : null;

              methodsMap[ind.indicatorId].push({
                testMethodId: method.id,
                testMethodName: method.name,
                testMethodFormattedName: method.formattedName || undefined,
                unitPrice: ind.unitPrice,
                isActive: ind.isActive,
                specimenTypeId: specimenTypeId || undefined,
                specimenTypeName: specimenTypeName || undefined,
                specimenTypeCode: (ind as any).specimenTypeCode || undefined,
                sampleTypeCategoryName: st?.sampleTypeCategoryName || undefined,
              });
            }
          });
        },
      );

      setIndicatorMethodsMap(methodsMap);

      // Pre-populate from existingMethods: resolve keys against loaded master data
      if (existingMethods.length > 0) {
        const resolvedKeys: MethodKey[] = [];
        const resolvedPrices: Record<MethodKey, number> = {};
        const resolvedNames: Record<MethodKey, CustomIndicatorName> = {};
        const resolvedEditedKeys: Record<MethodKey, true> = {};
        // Giữ tên đã lưu trên báo giá nếu khác tên danh mục
        const keepSavedName = (key: MethodKey, em: ExistingMethodInfo) => {
          const master = allIndicators.find((i) => i.id === em.indicatorId);
          const custom = pickCustomIndicatorName(
            { name: em.indicatorName, formattedName: em.indicatorFormattedName },
            master,
          );
          if (custom) resolvedNames[key] = custom;
          if (em.isCustomName) resolvedEditedKeys[key] = true;
        };

        existingMethods.forEach((em) => {
          const methods = methodsMap[em.indicatorId] || [];
          // Use specimenTypeId from ExistingMethodInfo if available, otherwise parse from key
          const existingStId = em.specimenTypeId || parseMethodKey(em.key).specimenTypeId;

          // Try exact match first (indicatorId + testMethodId + specimenTypeId)
          let matchedMethod = methods.find(
            (m) =>
              m.testMethodId === em.testMethodId &&
              (m.specimenTypeId || null) === (existingStId || null),
          );
          // If no exact match (e.g. key had _null but method has real specimenTypeId),
          // find by testMethodId only
          if (!matchedMethod) {
            matchedMethod = methods.find(
              (m) => m.testMethodId === em.testMethodId,
            );
          }

          if (matchedMethod) {
            const resolvedKey = createMethodKey(
              em.indicatorId,
              em.testMethodId,
              matchedMethod.specimenTypeId,
            );
            resolvedKeys.push(resolvedKey);
            resolvedPrices[resolvedKey] = em.unitPrice;
            keepSavedName(resolvedKey, em);
          } else {
            // Fallback: use the key as-is (with _null suffix if 2-part)
            const fallbackKey = em.key.split("_").length === 2
              ? `${em.key}_null`
              : em.key;
            resolvedKeys.push(fallbackKey);
            resolvedPrices[fallbackKey] = em.unitPrice;
            keepSavedName(fallbackKey, em);
          }
        });

        setCustomNames(resolvedNames);
        setNameEditedKeys(resolvedEditedKeys);
        setSelectedKeys(resolvedKeys);
        setCustomPrices(resolvedPrices);
      }

      // Auto-expand all groups
      setExpandedGroups(groups.map((g) => g.id));
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  // ========== Combo Pricing ==========

  // Check combos per specimen type for selected indicators
  const comboMetBySpecimenType = useMemo(() => {
    const grouped: Record<string, (string | undefined)[]> = {};
    for (const key of selectedKeys) {
      const { indicatorId, specimenTypeId } = parseMethodKey(key);
      const indicator = indicators.find((i) => i.id === indicatorId);
      const stId = specimenTypeId || "_none";
      if (!grouped[stId]) grouped[stId] = [];
      grouped[stId].push(indicator?.name);
    }
    const result: Record<string, boolean> = {};
    for (const [stId, names] of Object.entries(grouped)) {
      if (stId === "_none") {
        result[stId] = isHeavyMetalComboMet(names);
      } else {
        const st = specimenTypes.find((s) => s.id === stId);
        result[stId] = isHeavyMetalComboMet(
          names,
          st?.sampleTypeCategoryName,
          st?.name,
        );
      }
    }
    return result;
  }, [selectedKeys, indicators, specimenTypes]);

  // Check E.Coli + Coliform combo per specimen type (same as TestRequest)
  const ecoliComboMetBySpecimenType = useMemo(() => {
    const grouped: Record<string, (string | undefined)[]> = {};
    for (const key of selectedKeys) {
      const { indicatorId, specimenTypeId } = parseMethodKey(key);
      const indicator = indicators.find((i) => i.id === indicatorId);
      const stId = specimenTypeId || "_none";
      if (!grouped[stId]) grouped[stId] = [];
      grouped[stId].push(indicator?.name);
    }
    const result: Record<string, boolean> = {};
    for (const [stId, names] of Object.entries(grouped)) {
      if (stId === "_none") {
        result[stId] = isEcoliColiformComboMet(names);
      } else {
        const st = specimenTypes.find((s) => s.id === stId);
        result[stId] = isEcoliColiformComboMet(
          names,
          st?.sampleTypeCategoryName,
          st?.name,
        );
      }
    }
    return result;
  }, [selectedKeys, indicators, specimenTypes]);

  // Check if an indicator is free due to combo
  const isIndicatorFree = useCallback(
    (indicatorId: string, methodKey: MethodKey): boolean => {
      const indicator = indicators.find((i) => i.id === indicatorId);
      const { specimenTypeId } = parseMethodKey(methodKey);
      const stId = specimenTypeId || "_none";
      const isHgFree =
        comboMetBySpecimenType[stId] && isHgIndicator(indicator?.name);
      const isEcoliFree =
        ecoliComboMetBySpecimenType[stId] && isEcoliIndicator(indicator?.name);
      return isHgFree || isEcoliFree;
    },
    [indicators, comboMetBySpecimenType, ecoliComboMetBySpecimenType],
  );

  // Track previous combo-free keys to detect combo changes
  const prevComboFreeKeysRef = useRef<Set<string>>(new Set());

  // Auto-set/revert custom price textbox when combo state changes
  useEffect(() => {
    const currentFreeKeys = new Set<string>();
    for (const key of selectedKeys) {
      const { indicatorId } = parseMethodKey(key);
      if (isIndicatorFree(indicatorId, key)) {
        currentFreeKeys.add(key);
      }
    }

    const prevFreeKeys = prevComboFreeKeysRef.current;

    // Newly free indicators: set custom price = 0
    for (const key of currentFreeKeys) {
      if (!prevFreeKeys.has(key)) {
        setCustomPrices((prev) => ({ ...prev, [key]: 0 }));
      }
    }

    // No longer free indicators: revert to master price
    for (const key of prevFreeKeys) {
      if (!currentFreeKeys.has(key) && selectedKeys.includes(key)) {
        const { indicatorId, testMethodId, specimenTypeId } = parseMethodKey(key);
        const methods = indicatorMethodsMap[indicatorId] || [];
        const method = methods.find(
          (m) =>
            m.testMethodId === testMethodId &&
            (m.specimenTypeId || null) === (specimenTypeId || null),
        );
        setCustomPrices((prev) => ({ ...prev, [key]: method?.unitPrice || 0 }));
      }
    }

    prevComboFreeKeysRef.current = currentFreeKeys;
  }, [comboMetBySpecimenType, ecoliComboMetBySpecimenType, selectedKeys, isIndicatorFree]);

  // ========== Selection Helpers ==========

  const isMethodSelected = (
    indicatorId: string,
    testMethodId: string,
    specimenTypeId?: string,
  ): boolean => {
    return selectedKeys.includes(
      createMethodKey(indicatorId, testMethodId, specimenTypeId),
    );
  };

  const toggleMethod = (
    indicatorId: string,
    testMethodId: string,
    specimenTypeId?: string,
  ) => {
    const key = createMethodKey(indicatorId, testMethodId, specimenTypeId);
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const toggleAllMethodsOfIndicator = (
    indicatorId: string,
    select: boolean,
    filterSpecimenTypeId?: string,
  ) => {
    let methods =
      indicatorMethodsMap[indicatorId]?.filter((m) => m.isActive) || [];
    if (filterSpecimenTypeId) {
      methods = methods.filter(
        (m) => m.specimenTypeId === filterSpecimenTypeId,
      );
    }
    methods.forEach((method) => {
      const isCurrentlySelected = isMethodSelected(
        indicatorId,
        method.testMethodId,
        method.specimenTypeId,
      );
      if (select && !isCurrentlySelected) {
        toggleMethod(indicatorId, method.testMethodId, method.specimenTypeId);
      } else if (!select && isCurrentlySelected) {
        toggleMethod(indicatorId, method.testMethodId, method.specimenTypeId);
      }
    });
  };

  const toggleAllIndicatorsInGroup = (
    indicatorIds: string[],
    select: boolean,
    filterSpecimenTypeId?: string,
  ) => {
    indicatorIds.forEach((indId) =>
      toggleAllMethodsOfIndicator(indId, select, filterSpecimenTypeId),
    );
  };

  const areAllMethodsSelected = (
    indicatorId: string,
    filterSpecimenTypeId?: string,
  ): boolean => {
    let methods =
      indicatorMethodsMap[indicatorId]?.filter((m) => m.isActive) || [];
    if (filterSpecimenTypeId) {
      methods = methods.filter(
        (m) => m.specimenTypeId === filterSpecimenTypeId,
      );
    }
    if (methods.length === 0) return false;
    return methods.every((m) =>
      isMethodSelected(indicatorId, m.testMethodId, m.specimenTypeId),
    );
  };

  const areSomeMethodsSelected = (
    indicatorId: string,
    filterSpecimenTypeId?: string,
  ): boolean => {
    let methods =
      indicatorMethodsMap[indicatorId]?.filter((m) => m.isActive) || [];
    if (filterSpecimenTypeId) {
      methods = methods.filter(
        (m) => m.specimenTypeId === filterSpecimenTypeId,
      );
    }
    if (methods.length === 0) return false;
    const count = methods.filter((m) =>
      isMethodSelected(indicatorId, m.testMethodId, m.specimenTypeId),
    ).length;
    return count > 0 && count < methods.length;
  };

  const areAllIndicatorsSelected = (
    indicatorIds: string[],
    filterSpecimenTypeId?: string,
  ): boolean => {
    if (indicatorIds.length === 0) return false;
    return indicatorIds.every((id) =>
      areAllMethodsSelected(id, filterSpecimenTypeId),
    );
  };

  const areSomeIndicatorsSelected = (
    indicatorIds: string[],
    filterSpecimenTypeId?: string,
  ): boolean => {
    if (indicatorIds.length === 0) return false;
    const hasAny = indicatorIds.some((id) => {
      let methods = indicatorMethodsMap[id]?.filter((m) => m.isActive) || [];
      if (filterSpecimenTypeId)
        methods = methods.filter(
          (m) => m.specimenTypeId === filterSpecimenTypeId,
        );
      return methods.some((m) =>
        isMethodSelected(id, m.testMethodId, m.specimenTypeId),
      );
    });
    return (
      hasAny && !areAllIndicatorsSelected(indicatorIds, filterSpecimenTypeId)
    );
  };

  // ========== Price handling ==========

  // Effective price = custom price if set, else master price
  // Combo logic is handled by useEffect auto-set/revert customPrices
  const getEffectivePrice = (key: MethodKey, masterPrice: number): number => {
    if (customPrices[key] !== undefined) return customPrices[key];
    return masterPrice;
  };

  const handlePriceChange = (key: MethodKey, price: number) => {
    setCustomPrices((prev) => ({ ...prev, [key]: price }));
  };

  // ========== Handle OK ==========

  const handleOk = () => {
    const selectedMethods: SelectedMethodInfo[] = selectedKeys.map((key) => {
      const { indicatorId, testMethodId, specimenTypeId } = parseMethodKey(key);
      const indicator = indicators.find((i) => i.id === indicatorId);
      const methods = indicatorMethodsMap[indicatorId] || [];
      const method = methods.find(
        (m) =>
          m.testMethodId === testMethodId &&
          (m.specimenTypeId || null) === (specimenTypeId || null),
      );
      const existing = !method && existingMethods?.length
        ? existingMethods.find(
            (em) => em.indicatorId === indicatorId && em.testMethodId === testMethodId,
          )
        : undefined;
      const masterPrice = method?.unitPrice || existing?.unitPrice || 0;
      const effectivePrice = getEffectivePrice(key, masterPrice);
      const customName = customNames[key];
      return {
        indicatorId,
        indicatorName: customName?.name || indicator?.name || existing?.indicatorName || "",
        indicatorFormattedName:
          customName?.formattedName || indicator?.formattedName || existing?.indicatorFormattedName || undefined,
        isCustomName: !!nameEditedKeys[key],
        testMethodId,
        testMethodName: method?.testMethodName || existing?.testMethodName || "",
        testMethodFormattedName: method?.testMethodFormattedName || existing?.testMethodFormattedName || undefined,
        unitPrice: effectivePrice,
        specimenTypeId: specimenTypeId || undefined,
        specimenTypeName: method?.specimenTypeName || existing?.specimenTypeName || undefined,
      };
    });
    onOk(selectedMethods);
  };

  // ========== Total cost ==========

  const totalCost = useMemo(() => {
    return selectedKeys.reduce((sum, key) => {
      const { indicatorId, testMethodId, specimenTypeId } = parseMethodKey(key);
      const methods = indicatorMethodsMap[indicatorId] || [];
      const method = methods.find(
        (m) =>
          m.testMethodId === testMethodId &&
          (m.specimenTypeId || null) === (specimenTypeId || null),
      );
      return sum + getEffectivePrice(key, method?.unitPrice || 0);
    }, 0);
  }, [
    selectedKeys,
    indicatorMethodsMap,
    customPrices,
  ]);

  // ========== Left Panel: Tree Rendering ==========

  // Build grouped data: Nhóm CT → Loại mẫu → Chỉ tiêu → Phương pháp
  const groupedData = useMemo(() => {
    let activeIndicators = indicators.filter(
      (ind) =>
        ind.isActive && indicatorMethodsMap[ind.id]?.some((m) => m.isActive),
    );

    // Apply search filter
    if (searchText.trim()) {
      const searchNorm = searchText.trim().normalize("NFC").toLowerCase();
      activeIndicators = activeIndicators.filter((ind) => {
        const nameNorm = ind.name.normalize("NFC").toLowerCase();
        const codeNorm = ind.code?.normalize("NFC").toLowerCase();
        if (nameNorm.includes(searchNorm) || codeNorm?.includes(searchNorm))
          return true;
        const methods =
          indicatorMethodsMap[ind.id]?.filter((m) => m.isActive) || [];
        return methods.some((m) =>
          m.testMethodName?.normalize("NFC").toLowerCase().includes(searchNorm),
        );
      });
    }

    // Build indicatorId -> specimenTypes map
    const indicatorSpecimenTypesMap = new Map<
      string,
      { id: string; name: string }[]
    >();
    Object.entries(indicatorMethodsMap).forEach(([indicatorId, methods]) => {
      const stList: { id: string; name: string }[] = [];
      const seenIds = new Set<string>();
      methods.forEach((m) => {
        if (
          m.isActive &&
          m.specimenTypeId &&
          m.specimenTypeName &&
          !seenIds.has(m.specimenTypeId)
        ) {
          seenIds.add(m.specimenTypeId);
          stList.push({ id: m.specimenTypeId, name: m.specimenTypeName });
        }
      });
      if (stList.length > 0) indicatorSpecimenTypesMap.set(indicatorId, stList);
    });

    // Get specimen type IDs to filter by
    let specimenTypeIdsToFilter: string[] = [];
    if (selectedSpecimenTypeIds.length > 0) {
      specimenTypeIdsToFilter = selectedSpecimenTypeIds;
    } else if (selectedCategoryIds.length > 0) {
      specimenTypeIdsToFilter = specimenTypes
        .filter(
          (st) =>
            st.isActive &&
            st.sampleTypeCategoryId &&
            selectedCategoryIds.includes(st.sampleTypeCategoryId),
        )
        .map((st) => st.id);
    }

    if (specimenTypeIdsToFilter.length > 0) {
      activeIndicators = activeIndicators.filter((ind) => {
        const indStList = indicatorSpecimenTypesMap.get(ind.id) || [];
        return indStList.some((st) => specimenTypeIdsToFilter.includes(st.id));
      });
    }

    // Group: Nhóm CT → Loại mẫu → Chỉ tiêu[]
    type GroupData = {
      id: string;
      name: string;
      specimenTypes: Map<
        string,
        { id: string; name: string; indicators: IndicatorDto[] }
      >;
    };

    const result: GroupData[] = [];

    indicatorGroups.forEach((group) => {
      const groupIndicators = activeIndicators.filter(
        (ind) => ind.indicatorGroupId === group.id,
      );
      if (groupIndicators.length === 0) return;

      const stMap = new Map<
        string,
        { id: string; name: string; indicators: IndicatorDto[] }
      >();

      groupIndicators.forEach((ind) => {
        const stList = indicatorSpecimenTypesMap.get(ind.id) || [];
        if (stList.length === 0) {
          if (specimenTypeIdsToFilter.length === 0) {
            if (!stMap.has("others"))
              stMap.set("others", {
                id: "others",
                name: "Khác",
                indicators: [],
              });
            stMap.get("others")!.indicators.push(ind);
          }
        } else {
          stList.forEach((st) => {
            if (
              specimenTypeIdsToFilter.length > 0 &&
              !specimenTypeIdsToFilter.includes(st.id)
            )
              return;
            if (!stMap.has(st.id))
              stMap.set(st.id, { id: st.id, name: st.name, indicators: [] });
            stMap.get(st.id)!.indicators.push(ind);
          });
        }
      });

      result.push({ id: group.id, name: group.name, specimenTypes: stMap });
    });

    return result;
  }, [
    indicators,
    indicatorMethodsMap,
    indicatorGroups,
    searchText,
    selectedCategoryIds,
    selectedSpecimenTypeIds,
    specimenTypes,
  ]);

  // Render indicator with methods
  const renderIndicatorWithMethods = (
    ind: IndicatorDto,
    indentLevel: number = 1,
    filterSpecimenTypeId?: string,
    isLastIndicator: boolean = false,
  ) => {
    let methods = indicatorMethodsMap[ind.id]?.filter((m) => m.isActive) || [];
    if (filterSpecimenTypeId) {
      methods = methods.filter(
        (m) => m.specimenTypeId && m.specimenTypeId === filterSpecimenTypeId,
      );
    }
    if (methods.length === 0) return null;

    const isIndicatorExpanded = expandedIndicators.includes(ind.id);
    const selectedMethodsCount = methods.filter((m) =>
      isMethodSelected(ind.id, m.testMethodId, m.specimenTypeId),
    ).length;
    const paddingLeft = indentLevel === 1 ? 0 : indentLevel === 2 ? 36 : 0;
    const methodPaddingLeft =
      indentLevel === 1 ? 26 : indentLevel === 2 ? 62 : 26;
    const isAllSelected = areAllMethodsSelected(ind.id, filterSpecimenTypeId);
    const isSomeSelected = areSomeMethodsSelected(ind.id, filterSpecimenTypeId);

    const level3ClassName =
      indentLevel === 2
        ? `q-tree-item q-tree-level-3${isLastIndicator ? " is-last" : ""}`
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
              isIndicatorExpanded ? "quotation-name-gradient" : undefined
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

        {/* Methods */}
        {isIndicatorExpanded && (
          <div>
            {methods.map((method, methodIndex) => {
              const isSelected = isMethodSelected(
                ind.id,
                method.testMethodId,
                method.specimenTypeId,
              );
              const isLastMethod = methodIndex === methods.length - 1;
              const methodClassName = `q-tree-item q-tree-level-4${isLastMethod ? " is-last" : ""}${indentLevel === 2 ? " indent-level-2" : ""}`;

              return (
                <div
                  key={`${method.testMethodId}_${method.specimenTypeId || "null"}`}
                  className={methodClassName}
                  onClick={() =>
                    toggleMethod(
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
                    cursor: "pointer",
                    background: isSelected
                      ? "#bae7ff"
                      : "rgb(250, 250, 250)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected)
                      e.currentTarget.style.background = "#f0f0f0";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isSelected
                      ? "#bae7ff"
                      : "rgb(250, 250, 250)";
                  }}
                >
                  <Checkbox
                    checked={isSelected}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() =>
                      toggleMethod(
                        ind.id,
                        method.testMethodId,
                        method.specimenTypeId,
                      )
                    }
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

  // Render the full tree
  const renderTree = () => {
    if (groupedData.length === 0) {
      return (
        <div style={{ padding: 24, textAlign: "center" }}>
          <Text type="secondary">Không có chỉ tiêu nào phù hợp với bộ lọc</Text>
        </div>
      );
    }

    return groupedData.map((groupData, groupIndex) => {
      const isGroupExpanded = expandedGroups.includes(groupData.id);
      const isLastGroup = groupIndex === groupedData.length - 1;
      const allIndicatorIdsInGroup: string[] = [];
      groupData.specimenTypes.forEach((stData) => {
        stData.indicators.forEach((ind) => {
          if (!allIndicatorIdsInGroup.includes(ind.id))
            allIndicatorIdsInGroup.push(ind.id);
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
          {/* Group header (Level 1) */}
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
              icon={isGroupExpanded ? "mdi:chevron-down" : "mdi:chevron-right"}
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

          {/* Specimen types within group (Level 2) */}
          {isGroupExpanded &&
            (() => {
              const specimenTypesArray = Array.from(
                groupData.specimenTypes.values(),
              ).sort((a, b) => {
                if (a.id === "others") return 1;
                if (b.id === "others") return -1;
                return normalizeForSort(a.name).localeCompare(
                  normalizeForSort(b.name),
                  "vi",
                  { sensitivity: "base" },
                );
              });

              return specimenTypesArray.map((stData, stIndex) => {
                const stKey = `${groupData.id}_${stData.id}`;
                const isStExpanded = expandedSpecimenTypes.includes(stKey);
                const stIndicatorIds = stData.indicators.map((ind) => ind.id);
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
                const isLastLevel2 = stIndex === specimenTypesArray.length - 1;

                return (
                  <div
                    key={stKey}
                    className={`q-tree-item q-tree-level-2${isLastLevel2 ? " is-last" : ""}`}
                  >
                    {/* Specimen type header */}
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
                          isStExpanded
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
                          setExpandedSpecimenTypes((prev) =>
                            prev.includes(stKey)
                              ? prev.filter((id) => id !== stKey)
                              : [...prev, stKey],
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
                          ...(isStExpanded && {
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

                    {/* Indicators within specimen type (Level 3) */}
                    {isStExpanded &&
                      (() => {
                        const sorted = [...stData.indicators].sort((a, b) =>
                          normalizeForSort(a.name).localeCompare(
                            normalizeForSort(b.name),
                            "vi",
                            { sensitivity: "base" },
                          ),
                        );
                        return sorted.map((ind, indIndex) =>
                          renderIndicatorWithMethods(
                            ind,
                            2,
                            stData.id === "others" ? undefined : stData.id,
                            indIndex === sorted.length - 1,
                          ),
                        );
                      })()}
                  </div>
                );
              });
            })()}
        </div>
      );
    });
  };

  // ========== Right Panel: Selected Indicators Table ==========

  const renderRightPanel = () => {
    if (selectedKeys.length === 0) {
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            padding: 24,
          }}
        >
          <Empty description="Chọn chỉ tiêu từ bảng bên trái" />
        </div>
      );
    }

    return (
      <div
        className="quotation-table-container"
        style={{ margin: 0, border: "none", borderRadius: 0 }}
      >
        <div className="quotation-table-scroll">
          <div className="quotation-table-inner">
            {/* Header */}
            <div
              className="quotation-table-header"
              style={{ fontWeight: 600, fontSize: 13 }}
            >
              <span style={{ flex: 1, minWidth: 80 }}>Chỉ tiêu</span>
              <span style={{ width: 120, flexShrink: 0 }}>Phương pháp</span>
              <span style={{ width: 110, flexShrink: 0 }}>Đơn giá</span>
              <span style={{ width: 32, flexShrink: 0 }}>Xóa</span>
            </div>

            {/* Body */}
            <div className="quotation-table-body">
              {selectedKeys.map((key) => {
                const { indicatorId, testMethodId, specimenTypeId } =
                  parseMethodKey(key);
                const indicator = indicators.find((i) => i.id === indicatorId);
                const methods = indicatorMethodsMap[indicatorId] || [];
                const method = methods.find(
                  (m) =>
                    m.testMethodId === testMethodId &&
                    (m.specimenTypeId || null) === (specimenTypeId || null),
                );
                const masterPrice = method?.unitPrice || 0;
                const effectivePrice = getEffectivePrice(key, masterPrice);
                const customName = customNames[key];
                const isNameEdited =
                  !!customName &&
                  !!indicator &&
                  !isSameIndicatorName(customName, indicator);
                const displayName = customName?.name ?? indicator?.name ?? "";

                return (
                  <div
                    key={key}
                    className="quotation-table-row"
                    style={{ borderBottom: "1px solid #f5f5f5" }}
                  >
                    <div style={{ flex: 1, minWidth: 80, overflow: "hidden" }}>
                      <div
                        style={{ display: "flex", alignItems: "center", gap: 4 }}
                      >
                        <TruncateTooltip
                          title={displayName}
                          style={{
                            fontSize: 13,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            display: "block",
                            minWidth: 0,
                          }}
                        >
                          <IndicatorName
                            name={displayName}
                            formattedName={
                              customName?.formattedName ?? indicator?.formattedName
                            }
                          />
                        </TruncateTooltip>
                        {canEditIndicatorName && (
                          <Tooltip
                            title={
                              isNameEdited
                                ? `Đã sửa tên trên báo giá (danh mục: ${indicator?.name || ""})`
                                : "Sửa tên chỉ tiêu trên báo giá"
                            }
                          >
                            <Button
                              type="text"
                              size="small"
                              icon={<EditOutlined />}
                              style={{
                                flexShrink: 0,
                                width: 22,
                                height: 22,
                                color: isNameEdited ? "#fa8c16" : "#8c8c8c",
                              }}
                              onClick={() => setEditingNameKey(key)}
                            />
                          </Tooltip>
                        )}
                      </div>
                      {method?.specimenTypeName && (
                        <div
                          style={{
                            fontSize: 11,
                            color: "#8c8c8c",
                            marginTop: 2,
                          }}
                        >
                          {method.specimenTypeName}
                        </div>
                      )}
                    </div>
                    <div
                      style={{ width: 120, flexShrink: 0, overflow: "hidden" }}
                    >
                      <TruncateTooltip
                        title={method?.testMethodName || ""}
                        style={{
                          fontSize: 13,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          display: "block",
                        }}
                      >
                        <IndicatorName
                          name={method?.testMethodName || ""}
                          formattedName={method?.testMethodFormattedName}
                        />
                      </TruncateTooltip>
                    </div>
                    <div style={{ width: 110, flexShrink: 0 }}>
                      <InputNumber
                        value={effectivePrice}
                        min={0}
                        size="small"
                        style={{ width: "100%", height: 32 }}
                        formatter={(value) =>
                          `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                        }
                        parser={(value) =>
                          Number(value?.replace(/,/g, "") || 0)
                        }
                        onChange={(value) => handlePriceChange(key, value ?? 0)}
                      />
                      {/* {isFree && customPrices[key] === undefined && (
                        <div style={{ fontSize: 10, color: "#52c41a", marginTop: 1 }}>Combo KM</div>
                      )} */}
                    </div>
                    <div
                      style={{ width: 32, flexShrink: 0, textAlign: "center" }}
                    >
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<CloseOutlined />}
                        onClick={() => {
                          setSelectedKeys((prev) =>
                            prev.filter((k) => k !== key),
                          );
                          setCustomPrices((prev) => {
                            const next = { ...prev };
                            delete next[key];
                            return next;
                          });
                          setCustomNames((prev) => {
                            const next = { ...prev };
                            delete next[key];
                            return next;
                          });
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ========== Specimen type options filtered by selected categories ==========

  const filteredSpecimenTypeOptions = useMemo(() => {
    let sts = specimenTypes.filter((st) => st.isActive);
    if (selectedCategoryIds.length > 0) {
      sts = sts.filter(
        (st) =>
          st.sampleTypeCategoryId &&
          selectedCategoryIds.includes(st.sampleTypeCategoryId),
      );
    }
    return sts.map((st) => ({ value: st.id, label: st.name }));
  }, [specimenTypes, selectedCategoryIds]);

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
          <Icon icon="mdi:clipboard-check-outline" width={24} height={24} />
          <span>Chọn chỉ tiêu / Phương pháp</span>
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={onCancel}
            style={{ marginLeft: "auto" }}
          />
        </div>
      }
      open={visible}
      onCancel={onCancel}
      onOk={handleOk}
      closable={false}
      okText={`Thêm (${selectedKeys.length} chỉ tiêu)`}
      cancelText="Hủy"
      width={1500}
      centered
      okButtonProps={{
        disabled: selectedKeys.length === 0,
        style: {
          minWidth: 100,
          ...(selectedKeys.length > 0
            ? {
                background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
                borderColor: "transparent",
              }
            : {}),
        },
      }}
      cancelButtonProps={{
        style: { minWidth: 100 },
      }}
      className="quotation-indicator-modal"
      styles={{ body: { padding: 0 } }}
    >
      <Spin spinning={loading}>
        <div className="quotation-modal-body">
          {/* Left Panel - Indicator Tree */}
          <div className="quotation-modal-left">
            {/* Search & Filters */}
            <div
              style={{
                padding: "12px 16px",
                background: "#fafafa",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <Input
                placeholder="Từ khóa..."
                prefix={<SearchOutlined style={{ color: "#999" }} />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
                size="small"
              />
              <div className="quotation-filter-selects">
                <Select
                  mode="multiple"
                  placeholder="Danh mục loại mẫu"
                  value={selectedCategoryIds}
                  onChange={(val) => {
                    setSelectedCategoryIds(val);
                    setSelectedSpecimenTypeIds([]);
                  }}
                  style={{ width: "100%" }}
                  size="small"
                  maxTagCount="responsive"
                  allowClear
                  options={sampleTypeCategories
                    .filter((cat) => cat.isActive)
                    .map((cat) => ({ value: cat.id, label: cat.name }))}
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
                        }}
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
                  options={filteredSpecimenTypeOptions}
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
                        }}
                      >
                        {label}
                      </Tag>
                    );
                  }}
                />
              </div>
            </div>

            {/* Tree */}
            <div style={{ flex: 1, overflowY: "auto", padding: "0 12px" }}>
              {renderTree()}
            </div>
          </div>

          {/* Right Panel - Selected Indicators */}
          <div className="quotation-modal-right">
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
              {/* Blue gradient header - matches TestRequest */}
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
              </div>
              {renderRightPanel()}
              {/* Footer: count + total */}
              <div
                style={{
                  padding: "8px 16px",
                  borderTop: "1px solid #f0f0f0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text type="secondary">
                  Số chỉ tiêu: <strong>{selectedKeys.length}</strong>
                </Text>
                <Text>
                  Tổng tiền:{" "}
                  <strong style={{ color: "#ff4d4f", fontSize: 16 }}>
                    {formatCurrency(totalCost)}
                  </strong>
                </Text>
              </div>
            </Card>
          </div>
        </div>
      </Spin>
      <IndicatorNameEditModal
        open={!!editingNameKey}
        value={editingNameKey ? customNames[editingNameKey] : undefined}
        masterName={
          editingNameKey
            ? indicators.find(
                (i) => i.id === parseMethodKey(editingNameKey).indicatorId,
              )
            : undefined
        }
        onOk={(value) => {
          if (editingNameKey) {
            const key = editingNameKey;
            setCustomNames((prev) => ({ ...prev, [key]: value }));
            setNameEditedKeys((prev) => ({ ...prev, [key]: true }));
          }
          setEditingNameKey(null);
        }}
        onCancel={() => setEditingNameKey(null)}
      />
    </Modal>
  );
};

export default QuotationIndicatorSelectionModal;
