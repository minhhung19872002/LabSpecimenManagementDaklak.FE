// @ts-nocheck
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Form, message } from "antd";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import { testRequestService, offlineTestRequestService } from "../../../../services/testRequestService";
import type { QuickCreateIndicatorResultItem } from "../../../../services/testRequestService";
import {
  specimenTypeService,
  IndicatorDto,
  IndicatorGroupDto,
  StorageLocationDto,
  LaboratoryDto,
  TestMethodWithIndicatorsDto,
  SpecimenTypeDto,
  SpecimenTypeWithIndicatorsDto,
  SampleConditionDto,
  SampleTypeCategoryDto,
} from "../../../../services/masterDataService";
import {
  getActiveIndicatorGroupsOffline,
  getActiveIndicatorsOffline,
  getActiveStorageLocationsOffline,
  getActiveLaboratoriesOffline,
  getActiveSpecimenTypesOffline,
  getTestMethodsWithIndicatorsOffline,
  getSpecimenTypesWithIndicatorsOffline,
  getActiveSampleConditionsOffline,
  getActiveSampleTypeCategoriesOffline,
  getUserLookupOffline,
  getActiveOrganizationsOffline,
} from "../../../../services/offline/offlineServices";
import { UserLookupDto } from "../../../../services/userService";
import { OrganizationDto } from "../../../../types/organization";
import { fileService } from "../../../../services/fileService";
import {
  TestRequestStatus,
  SampleStatus,
  canEditTestRequest,
  canEditFullInfo,
  canEditWithApproval,
} from "../../../../types/testRequest";
import { IndicatorApprovalStatus } from "../../../../types/laboratoryTask";
import {
  getAllProvinces,
  getWardsByProvince,
  Province,
  Ward,
} from "../../../../utils/vietnamLocations";
import { LOCKED_FIELDS, isHeavyMetalComboMet, isHgIndicator, isEcoliColiformComboMet, isEcoliIndicator } from "../constants";
import {
  SampleFormData,
  IndicatorDateInfo,
  LaboratoryAssignment,
  IndicatorMethodInfo,
  IndicatorMethodKey,
  PENDING_TEST_METHOD_ID,
  PENDING_TEST_METHOD_NAME,
  createIndicatorMethodKey,
  parseIndicatorMethodKey,
} from "../types";
import { extractOrderNum, generateSampleCode } from "../utils";
import { PATH_ROUTES } from "../../../../constants";
import { quotationService } from "../../../../services/quotationService";
import { offlineQuotationService } from "../../../../services/offline/offlineServices";
import { checkActionPermission } from "../../../../hooks/useActionPermission";

export const useTestRequestFormData = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const quotationId = searchParams.get("quotationId");
  const testRequestId = searchParams.get("testRequestId");
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const isEditMode = !!id;

  // Check permission khi edit mode - redirect nếu không có quyền
  useEffect(() => {
    if (isEditMode) {
      const { canAll } = checkActionPermission('testRequests', 'edit');
      if (!canAll) {
        message.error('Bạn không có quyền chỉnh sửa phiếu yêu cầu');
        navigate(PATH_ROUTES.testRequests.index);
      }
    } else {
      // Check permission khi create mode
      const { canAll } = checkActionPermission('testRequests', 'create');
      if (!canAll) {
        message.error('Bạn không có quyền tạo phiếu yêu cầu');
        navigate(PATH_ROUTES.testRequests.index);
      }
    }
  }, [isEditMode, navigate]);

  // Watch form fields
  const sampleType = Form.useWatch("sampleType", form);
  const sampleTypeTask = Array.isArray(sampleType)
    ? sampleType.includes("task")
    : sampleType === "task";
  const methodRequirement = Form.useWatch("methodRequirement", form);

  // Contract number for sample codes
  const [sampleCodePrefix, setSampleCodePrefix] = useState<string>("");

  // Update sample codes when contract number changes (keep same order number, update prefix)
  const updateSampleCodesPrefix = useCallback((newPrefix: string) => {
    setSampleCodePrefix(newPrefix);
    setSamples((prevSamples) =>
      prevSamples.map((sample) => {
        // Extract current order number from existing sampleCode
        const orderNum = extractOrderNum(sample.sampleCode);
        // Generate new sampleCode with new prefix but same order number
        const newSampleCode = generateSampleCode(newPrefix, orderNum || 1);
        return { ...sample, sampleCode: newSampleCode };
      })
    );
  }, []);

  const validateContractNumberDebounced = useCallback((rawContractNumber: string) => {
    const duplicateMessage = "Số hợp đồng đã tồn tại trong hệ thống";
    const normalizedContractNumber = (rawContractNumber || "").trim();

    if (contractNumberDebounceRef.current) {
      clearTimeout(contractNumberDebounceRef.current);
    }

    // Invalidate previous in-flight validation responses.
    const validationToken = ++contractNumberValidationRef.current;

    const currentErrors = form.getFieldError("contractNumber") || [];
    const errorsWithoutDuplicate = currentErrors.filter((error: string) => error !== duplicateMessage);

    if (!normalizedContractNumber) {
      if (errorsWithoutDuplicate.length !== currentErrors.length) {
        form.setFields([{ name: "contractNumber", errors: errorsWithoutDuplicate }]);
      }
      return;
    }

    if (!navigator.onLine) {
      return;
    }

    contractNumberDebounceRef.current = setTimeout(async () => {
      try {
        const exists = await testRequestService.checkContractNumberExists(
          normalizedContractNumber,
          isEditMode ? id : undefined,
        );

        if (validationToken !== contractNumberValidationRef.current) {
          return;
        }

        const latestErrors = form.getFieldError("contractNumber") || [];
        const latestErrorsWithoutDuplicate = latestErrors.filter((error: string) => error !== duplicateMessage);

        if (exists) {
          if (!latestErrors.includes(duplicateMessage)) {
            form.setFields([{ name: "contractNumber", errors: [...latestErrorsWithoutDuplicate, duplicateMessage] }]);
          }
        } else if (latestErrorsWithoutDuplicate.length !== latestErrors.length) {
          form.setFields([{ name: "contractNumber", errors: latestErrorsWithoutDuplicate }]);
        }
      } catch (error) {
        console.error("Failed to validate contract number:", error);
      }
    }, 600);
  }, [form, id, isEditMode]);

  // Current status for field locking
  const [currentStatus, setCurrentStatus] = useState<TestRequestStatus | null>(null);

  // Sample table data
  const [samples, setSamples] = useState<SampleFormData[]>([]);

  // Master data
  const [indicatorGroups, setIndicatorGroups] = useState<IndicatorGroupDto[]>([]);
  const [indicators, setIndicators] = useState<IndicatorDto[]>([]);
  const [storageLocations, setStorageLocations] = useState<StorageLocationDto[]>([]);
  const [indicatorTreeData, setIndicatorTreeData] = useState<any[]>([]);
  const [users, setUsers] = useState<UserLookupDto[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationDto[]>([]);
  const [organizationOptions, setOrganizationOptions] = useState<{ value: string; label: string }[]>([]);
  const [organizationSearching, setOrganizationSearching] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const specimenTypeDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const contractNumberDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const contractNumberValidationRef = useRef(0);
  const [laboratories, setLaboratories] = useState<LaboratoryDto[]>([]);
  const [specimenTypes, setSpecimenTypes] = useState<SpecimenTypeDto[]>([]);
  const [specimenTypesWithIndicators, setSpecimenTypesWithIndicators] = useState<SpecimenTypeWithIndicatorsDto[]>([]);
  // Map: indicatorId -> list of specimenTypes that contain this indicator
  const [indicatorToSpecimenTypesMap, setIndicatorToSpecimenTypesMap] = useState<Record<string, { id: string; name: string }[]>>({});
  const [specimenTypeOptions, setSpecimenTypeOptions] = useState<{ value: string; label: string }[]>([]);

  // Sample Conditions (Tình trạng mẫu)
  const [sampleConditions, setSampleConditions] = useState<SampleConditionDto[]>([]);
  const [sampleConditionOptions, setSampleConditionOptions] = useState<{ value: string; label: string }[]>([]);

  // Sample Type Categories (Danh mục loại mẫu)
  const [sampleTypeCategories, setSampleTypeCategories] = useState<SampleTypeCategoryDto[]>([]);

  // Test methods and indicator-method mapping
  const [testMethods, setTestMethods] = useState<TestMethodWithIndicatorsDto[]>([]);
  const [indicatorMethodsMap, setIndicatorMethodsMap] = useState<Record<string, IndicatorMethodInfo[]>>({});

  // Costs
  const [totalSampleCost, setTotalSampleCost] = useState(0);

  // Indicator modal state
  const [indicatorModalVisible, setIndicatorModalVisible] = useState(false);
  const [currentSampleKey, setCurrentSampleKey] = useState<string | null>(null);
  const [tempSelectedIndicators, setTempSelectedIndicators] = useState<string[]>([]); // deprecated
  const [tempSelectedIndicatorMethods, setTempSelectedIndicatorMethods] = useState<IndicatorMethodKey[]>([]);
  const [expandedIndicators, setExpandedIndicators] = useState<string[]>([]); // For 3-level tree in left panel
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>("all");
  // Filter theo loại mẫu
  const [currentSampleSpecimenTypeId, setCurrentSampleSpecimenTypeId] = useState<string | undefined>(undefined);
  const [currentSampleSpecimenTypeName, setCurrentSampleSpecimenTypeName] = useState<string | undefined>(undefined);
  const [specimenTypeIndicatorIds, setSpecimenTypeIndicatorIds] = useState<string[]>([]);
  const [specimenTypeFilterActive, setSpecimenTypeFilterActive] = useState(false);
  const [indicatorSearchText, setIndicatorSearchText] = useState<string>("");
  const [groupSelectorVisible, setGroupSelectorVisible] = useState(false);
  const [groupSearchText, setGroupSearchText] = useState<string>("");

  // Right panel state for dates and selection
  const [selectedIndicatorDates, setSelectedIndicatorDates] = useState<Record<string, IndicatorDateInfo>>({});
  const [checkedIndicators, setCheckedIndicators] = useState<string[]>([]);

  // Expanded groups state
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [expandedGroupsInSelector, setExpandedGroupsInSelector] = useState<string[]>([]);

  // Laboratory modal state
  const [laboratoryModalVisible, setLaboratoryModalVisible] = useState(false);
  const [selectedLaboratoryId, setSelectedLaboratoryId] = useState<string | null>(null);
  const [laboratoryRequestDate, setLaboratoryRequestDate] = useState<dayjs.Dayjs | null>(null);
  const [indicatorsToSend, setIndicatorsToSend] = useState<string[]>([]);
  const [indicatorLaboratoryMap, setIndicatorLaboratoryMap] = useState<Record<string, LaboratoryAssignment>>({});
  const [expandedLabGroups, setExpandedLabGroups] = useState<string[]>([]);

  // Custom prices per indicator method (overrides master data price, only for this test request)
  // Key format: "sampleKey_indicatorMethodKey" -> custom price
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({});

  // Store TestRequestSampleIndicator.id for each indicator
  // Key format: "sampleKey_indicatorMethodKey" -> TestRequestSampleIndicator.id
  const [sampleIndicatorIdMap, setSampleIndicatorIdMap] = useState<Record<string, string>>({});

  // Snapshot của data gốc khi load form edit - dùng để so sánh thay đổi
  const [originalData, setOriginalData] = useState<any>(null);

  // Store quotationId when creating from quotation
  const [sourceQuotationId, setSourceQuotationId] = useState<string | null>(quotationId);

  // Track if quotation/testRequest has been loaded (to prevent re-loading)
  const quotationLoadedRef = useRef(false);
  const testRequestLoadedRef = useRef(false);

  // Vietnam location states
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  // Track selected codes for cascade filtering (separate from text values for editable select)
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<string | undefined>();
  const [selectedWardCode, setSelectedWardCode] = useState<string | undefined>();

  // Load provinces on mount
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const loadedProvinces = await getAllProvinces();
        setProvinces(loadedProvinces);
      } catch (error) {
        console.error('Failed to load provinces:', error);
        message.error('Không thể tải danh sách tỉnh thành');
      }
    };
    loadProvinces();
  }, []);

  // Helper to check if a field should be disabled based on status
  // [TEMPORARY] Tạm tắt field lock - cho phép edit tất cả fields
  const isFieldLocked = (_fieldName: string): boolean => {
    // [OLD LOGIC]
    // if (!isEditMode || currentStatus === null) return false;
    // if (!canEditFullInfo(currentStatus)) {
    //   return LOCKED_FIELDS.includes(fieldName);
    // }
    return false;
  };

  // Check if samples section should be locked
  // Note: Samples can still be edited when status is SampleSent or InProgress (requires approval)
  // Only locked when status >= PendingChangeApproval
  const isSamplesLocked = (): boolean => {
    if (!isEditMode || currentStatus === null) return false;
    // Allow edit samples for New, Pending, SampleSent, InProgress
    // Lock samples for PendingChangeApproval and beyond
    return !canEditTestRequest(currentStatus);
  };

  // Check if this edit requires QLCL approval (SampleSent/InProgress status)
  // [TEMPORARY] Tạm tắt - không cần approval, edit trực tiếp
  const isEditRequiresApproval = (): boolean => {
    // [OLD LOGIC]
    // if (!isEditMode || currentStatus === null) return false;
    // return canEditWithApproval(currentStatus);

    // [TEMPORARY] Không cần approval
    return false;
  };

  // Load master data with offline support
  const loadMasterData = async () => {
    try {
      const [groupsData, indicatorsData, locationsData, usersData, orgsData, labsData, methodsData, specimenTypesData, specimenTypesWithIndsData, sampleConditionsData, sampleTypeCategoriesData] = await Promise.all([
        getActiveIndicatorGroupsOffline(),
        getActiveIndicatorsOffline(),
        getActiveStorageLocationsOffline(),
        getUserLookupOffline(),
        getActiveOrganizationsOffline(),
        getActiveLaboratoriesOffline(),
        getTestMethodsWithIndicatorsOffline(),
        getActiveSpecimenTypesOffline(),
        getSpecimenTypesWithIndicatorsOffline(),
        getActiveSampleConditionsOffline(),
        getActiveSampleTypeCategoriesOffline(),
      ]);
      setIndicatorGroups(groupsData);
      setIndicators(indicatorsData);
      setStorageLocations(locationsData.items || []);
      setUsers(usersData);
      setOrganizations(orgsData);
      setLaboratories(labsData || []);
      setTestMethods(methodsData || []);
      setSpecimenTypes(specimenTypesData.items || []);
      setSpecimenTypesWithIndicators(specimenTypesWithIndsData || []);
      setSampleConditions(sampleConditionsData || []);
      setSampleTypeCategories(sampleTypeCategoriesData || []);
      // Build sampleConditionOptions for AutoComplete
      setSampleConditionOptions((sampleConditionsData || []).map((sc) => ({
        value: sc.name,
        label: sc.name,
      })));

      // Build reverse map: indicatorId -> list of specimenTypes
      const indToSpecMap: Record<string, { id: string; name: string }[]> = {};
      (specimenTypesWithIndsData || []).forEach((st) => {
        if (st.isActive && st.indicators) {
          st.indicators.forEach((ind) => {
            if (ind.isActive) {
              if (!indToSpecMap[ind.indicatorId]) {
                indToSpecMap[ind.indicatorId] = [];
              }
              indToSpecMap[ind.indicatorId].push({ id: st.id, name: st.name });
            }
          });
        }
      });
      setIndicatorToSpecimenTypesMap(indToSpecMap);

      // Build map: indicatorId -> methods[]
      // Cùng 1 chỉ tiêu + phương pháp có thể có nhiều nền mẫu khác nhau
      const methodMap: Record<string, IndicatorMethodInfo[]> = {};
      (methodsData || []).forEach((method) => {
        method.indicators?.forEach((ind) => {
          if (ind.isActive) {
            if (!methodMap[ind.indicatorId]) {
              methodMap[ind.indicatorId] = [];
            }
            methodMap[ind.indicatorId].push({
              testMethodId: method.id,
              testMethodCode: method.code,
              testMethodName: method.name,
              testMethodFormattedName: method.formattedName || undefined,
              unitPrice: ind.unitPrice,
              isActive: ind.isActive,
              parentIndicatorId: ind.parentIndicatorId,
              // Include specimen type info for proper differentiation
              specimenTypeId: ind.specimenTypeId,
              specimenTypeCode: ind.specimenTypeCode,
              specimenTypeName: ind.specimenTypeName,
            });
          }
        });
      });

      // Indicators can exist in metadata + specimen type mapping before a test method is configured.
      // Synthesize a pseudo "null method" entry so they still appear and can be selected in TestRequestForm.
      (specimenTypesWithIndsData || []).forEach((specimenType) => {
        if (!specimenType.isActive) return;
        (specimenType.indicators || []).forEach((indicatorLink) => {
          if (!indicatorLink.isActive) return;
          const existingMethods = methodMap[indicatorLink.indicatorId] || [];
          const hasMethodForSpecimenType = existingMethods.some(
            (method) =>
              method.isActive &&
              (method.specimenTypeId || null) === specimenType.id
          );

          if (!hasMethodForSpecimenType) {
            if (!methodMap[indicatorLink.indicatorId]) {
              methodMap[indicatorLink.indicatorId] = [];
            }
            methodMap[indicatorLink.indicatorId].push({
              testMethodId: PENDING_TEST_METHOD_ID,
              testMethodCode: "",
              testMethodName: PENDING_TEST_METHOD_NAME,
              unitPrice: 0,
              isActive: true,
              specimenTypeId: specimenType.id,
              specimenTypeCode: specimenType.code,
              specimenTypeName: specimenType.name,
            });
          }
        });
      });
      setIndicatorMethodsMap(methodMap);

      // Auto-generate contract number for new test request (create mode only)
      if (!id) {
        try {
          if (navigator.onLine) {
            const contractNumber = await testRequestService.generateContractNumber();
            form.setFieldValue('contractNumber', contractNumber);
            setSampleCodePrefix(contractNumber);
          } else {
            // Offline fallback: generate temporary contract number
            // Format: OFFLINE-YYYYMMDD-XXXX (will be replaced by server on sync)
            const now = new Date();
            const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
            const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
            const offlineContractNumber = `OFFLINE-${dateStr}-${randomSuffix}`;
            form.setFieldValue('contractNumber', offlineContractNumber);
            setSampleCodePrefix(offlineContractNumber);
          }
        } catch (error) {
          console.error("Failed to generate contract number:", error);
          // Fallback on error: generate offline contract number
          const now = new Date();
          const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
          const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
          const offlineContractNumber = `OFFLINE-${dateStr}-${randomSuffix}`;
          form.setFieldValue('contractNumber', offlineContractNumber);
          setSampleCodePrefix(offlineContractNumber);
        }
      }
    } catch (error) {
      console.error("Failed to load master data:", error);
      message.error("Không thể tải dữ liệu danh mục");
    }
  };

  // Handle organization search for autocomplete with debounce
  const handleOrganizationSearch = (searchText: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!searchText || searchText.trim().length < 1) {
      setOrganizationOptions([]);
      setOrganizationSearching(false);
      return;
    }

    setOrganizationSearching(true);

    debounceTimerRef.current = setTimeout(() => {
      const filtered = organizations
        .filter((org) => org.name.toLowerCase().includes(searchText.toLowerCase()))
        .slice(0, 20)
        .map((org) => ({ value: org.name, label: org.name }));

      setOrganizationOptions(filtered);
      setOrganizationSearching(false);
    }, 300);
  };

  // Handle organization selection - auto fill customer info
  const handleOrganizationSelect = async (value: string) => {
    const selectedOrg = organizations.find((org) => org.name === value);
    if (selectedOrg) {
      let wardName: string | undefined = undefined;

      if (selectedOrg.provinceCode) {
        const loadedWards = await getWardsByProvince(selectedOrg.provinceCode);
        setWards(loadedWards);
        setSelectedProvinceCode(selectedOrg.provinceCode);

        // Find ward name if wardCode exists
        if (selectedOrg.wardCode) {
          wardName = loadedWards.find(w => w.code === selectedOrg.wardCode)?.name;
        }
      }
      if (selectedOrg.wardCode) {
        setSelectedWardCode(selectedOrg.wardCode);
      }
      // Find province name for editable fields
      const provinceName = provinces.find(p => p.code === selectedOrg.provinceCode)?.name;

      form.setFieldsValue({
        customerName: selectedOrg.name,
        province: provinceName || '',
        ward: wardName || '',
        address: selectedOrg.address,
        taxCode: selectedOrg.taxCode,
        contactPerson: selectedOrg.contactPerson,
        phone: selectedOrg.phone,
      });
    }
  };

  // Shared function to auto-fill customer info by phone number
  const autoFillByPhone = async (phoneValue: string) => {
    if (!phoneValue) return;

    const foundOrg = organizations.find((org) => org.phone === phoneValue);
    if (foundOrg) {
      let wardName: string | undefined = undefined;

      if (foundOrg.provinceCode) {
        const loadedWards = await getWardsByProvince(foundOrg.provinceCode);
        setWards(loadedWards);
        setSelectedProvinceCode(foundOrg.provinceCode);

        // Find ward name if wardCode exists
        if (foundOrg.wardCode) {
          wardName = loadedWards.find(w => w.code === foundOrg.wardCode)?.name;
        }
      }
      if (foundOrg.wardCode) {
        setSelectedWardCode(foundOrg.wardCode);
      }
      // Find province name for editable fields
      const provinceName = provinces.find(p => p.code === foundOrg.provinceCode)?.name;

      form.setFieldsValue({
        customerName: foundOrg.name,
        province: provinceName || '',
        ward: wardName || '',
        address: foundOrg.address,
        taxCode: foundOrg.taxCode,
        contactPerson: foundOrg.contactPerson,
        phone: foundOrg.phone,
      });
    }
  };

  // Handle phone blur - search organization by phone
  const handlePhoneBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const phoneValue = e.target.value?.trim();
    await autoFillByPhone(phoneValue);
  };

  // Handle phone Enter key press - search organization by phone
  const handlePhoneEnter = async () => {
    const phoneValue = form.getFieldValue('phone')?.trim();
    await autoFillByPhone(phoneValue);
  };

  // Handle specimen type search for autocomplete with debounce (case-insensitive)
  const handleSpecimenTypeSearch = (searchText: string) => {
    if (specimenTypeDebounceRef.current) {
      clearTimeout(specimenTypeDebounceRef.current);
    }

    if (!searchText || searchText.trim().length < 1) {
      setSpecimenTypeOptions([]);
      return;
    }

    specimenTypeDebounceRef.current = setTimeout(() => {
      const searchLower = searchText.toLowerCase().trim();
      const filtered = specimenTypes
        .filter((st) => st.name.toLowerCase().includes(searchLower))
        .slice(0, 20)
        .map((st) => ({ value: st.name, label: st.name }));

      setSpecimenTypeOptions(filtered);
    }, 300);
  };

  // Handle specimen type selection - find existing or keep as new name
  // Case-insensitive matching: if exists, use the existing name
  const handleSpecimenTypeSelect = (sampleKey: string, value: string) => {
    // Find existing specimen type (case-insensitive)
    const existing = specimenTypes.find(
      (st) => st.name.toLowerCase() === value.toLowerCase()
    );

    setSamples((prevSamples) =>
      prevSamples.map((sample) =>
        sample.key === sampleKey
          ? {
              ...sample,
              specimenTypeName: existing ? existing.name : value, // Use existing name if found
              specimenTypeId: existing ? existing.id : undefined,
            }
          : sample
      )
    );
  };

  // Load edit data
  const loadData = async () => {
    if (!id) return;

    setLoadingData(true);
    try {
      // Use offline-aware service for loading test request data
      const data = await offlineTestRequestService.get(id);

      if (!data) {
        message.error("Không thể tải dữ liệu yêu cầu (dữ liệu không có trong bộ nhớ đệm offline)");
        navigate(PATH_ROUTES.testRequests.index);
        return;
      }

      // Lưu snapshot data gốc để so sánh thay đổi sau này
      // IMPORTANT: Filter out cancelled samples and CustomerCancelled indicators
      // so that change history comparison doesn't include already-cancelled items
      const originalDataCopy = JSON.parse(JSON.stringify(data));
      if (originalDataCopy.samples) {
        originalDataCopy.samples = originalDataCopy.samples
          .filter((s: any) => !s.isCancelled)
          .map((s: any) => ({
            ...s,
            indicators: (s.indicators || []).filter(
              (ind: any) => ind.approvalStatus !== IndicatorApprovalStatus.CustomerCancelled
            ),
          }))
          // Remove samples with no remaining active indicators (all were CustomerCancelled)
          .filter((s: any) => (s.indicators || []).length > 0 || !s.id);
      }
      setOriginalData(originalDataCopy);

      setCurrentStatus(data.status);

      if (!canEditTestRequest(data.status)) {
        message.warning("Không thể chỉnh sửa phiếu ở trạng thái này");
        navigate(PATH_ROUTES.testRequests.detail(id));
        return;
      }

      if (data.provinceCode) {
        const loadedWards = await getWardsByProvince(data.provinceCode);
        setWards(loadedWards);
        setSelectedProvinceCode(data.provinceCode);
      }
      if (data.wardCode) {
        setSelectedWardCode(data.wardCode);
      }

      form.setFieldsValue({
        ...data,
        contractDate: data.contractDate ? dayjs(data.contractDate) : null,
        requestDate: data.requestDate ? dayjs(data.requestDate) : null,
        expectedCompletionDate: data.expectedCompletionDate ? dayjs(data.expectedCompletionDate) : null,
        samplingDate: data.samplingDate ? dayjs(data.samplingDate) : null,
        samplingTime: data.samplingTime ? dayjs(data.samplingTime, "HH:mm") : null,
        sampleStorageEndDate: data.sampleStorageEndDate ? dayjs(data.sampleStorageEndDate) : null,
      });

      if (data.contractNumber) {
        setSampleCodePrefix(data.contractNumber);
      }

      // Convert 4 boolean sampleType fields to multi-select values
      const selectedSampleTypes: string[] = [];
      if (data.sampleTypeService) selectedSampleTypes.push("service");
      if (data.sampleTypeContract) selectedSampleTypes.push("contract");
      if (data.sampleTypeTask) selectedSampleTypes.push("task");
      if (data.sampleTypeSubContract) selectedSampleTypes.push("subContract");
      form.setFieldsValue({ sampleType: selectedSampleTypes });

      if (data.methodCustomer) {
        form.setFieldsValue({ methodRequirement: "customerRequest" });
      } else {
        form.setFieldsValue({ methodRequirement: "westHighlandInstitute" });
      }

      // Load samples - filter out cancelled samples and samples with no indicators (they are kept for Sample Storage history)
      const activeSamples = (data.samples || []).filter((sample) => {
        // Filter out cancelled samples
        if (sample.isCancelled) return false;
        // Filter out samples with no active indicators (all deleted or cancelled)
        const activeIndicators = sample.indicators?.filter(
          (ind) => ind.approvalStatus !== IndicatorApprovalStatus.CustomerCancelled
        ) || [];
        return activeIndicators.length > 0 || !sample.id; // Keep new samples without id
      });
      if (activeSamples.length > 0) {
        const sampleData: SampleFormData[] = activeSamples.map((sample, index) => {
          // Filter out CustomerCancelled indicators - they should not be editable
          const activeIndicators = sample.indicators?.filter(
            (ind) => ind.approvalStatus !== IndicatorApprovalStatus.CustomerCancelled
          ) || [];

          // Build indicatorMethods from active indicators (indicatorId + testMethodId + specimenTypeId)
          // Note: specimenTypeId now comes from the indicator itself (stored when user selects from specific specimen type)
          const indicatorMethods: IndicatorMethodKey[] = [];
          activeIndicators.forEach((ind) => {
            if (ind.indicatorId) {
              const methodId = ind.testMethodId || PENDING_TEST_METHOD_ID;
              indicatorMethods.push(createIndicatorMethodKey(ind.indicatorId, methodId, ind.specimenTypeId));
            }
          });

          return {
            key: sample.id || `sample-${index}`,
            id: sample.id,
            sortOrder: sample.sortOrder,
            sampleCode: sample.sampleCode,
            sampleName: sample.sampleName,
            samplingAddress: sample.samplingAddress,
            sampleQuantity: sample.sampleQuantity,
            status: sample.status,
            statusText: sample.statusText || "",
            processingStatus: sample.processingStatus || "",
            notes: sample.notes,
            storageLocation: sample.storageLocation,
            specimenTypeId: sample.specimenTypeId,
            specimenTypeName: sample.specimenTypeName || "", // Load from API
            indicatorIds: activeIndicators.map((ind) => ind.indicatorId),
            indicatorMethods: indicatorMethods,
            // Load attachments from API response - use fileService to get full URL
            attachments: (sample.attachments || []).map((att: any) => ({
              id: att.id,
              fileId: att.fileId,
              fileName: att.fileName,
              fileSize: att.fileSize,
              url: fileService.getFileUrl(att.fileId),
            })),
            isSharedSample: sample.isSharedSample || false, // Mẫu chung (Vi Sinh + Hóa)
          };
        });
        setSamples(sampleData);

        // Restore indicator dates, checked states, laboratory assignments, and indicator IDs
        // Now using IndicatorMethodKey format
        const restoredDates: Record<string, IndicatorDateInfo> = {};
        const restoredChecked: string[] = [];
        const restoredLabMap: Record<string, LaboratoryAssignment> = {};
        const expandedLabs: string[] = [];
        const restoredIndicatorIds: Record<string, string> = {}; // Store TestRequestSampleIndicator.id
        const restoredCustomPrices: Record<string, number> = {}; // Store saved unitPrice as custom price

        // Parse dates helper - handle both UTC formats
        const parseDate = (dateStr: string | null | undefined): dayjs.Dayjs | undefined => {
          if (!dateStr || typeof dateStr !== 'string') return undefined;
          const hasTimezone = dateStr.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dateStr);
          const normalizedStr = hasTimezone ? dateStr : `${dateStr}Z`;
          const parsed = dayjs(normalizedStr);
          if (!parsed.isValid()) return undefined;
          return parsed.startOf('day');
        };

        activeSamples.forEach((sample, sampleIndex) => {
          const sampleKey = sample.id || `sample-${sampleIndex}`;
          // Filter out CustomerCancelled indicators
          const activeIndicators = sample.indicators?.filter(
            (ind) => ind.approvalStatus !== IndicatorApprovalStatus.CustomerCancelled
          ) || [];

          activeIndicators.forEach((ind) => {
            const methodId = ind.testMethodId || PENDING_TEST_METHOD_ID;
            const methodKey = createIndicatorMethodKey(ind.indicatorId, methodId, ind.specimenTypeId);

            // Store the TestRequestSampleIndicator.id for this indicator
            if (ind.id) {
              restoredIndicatorIds[`${sampleKey}_${methodKey}`] = ind.id;
            }

            // Restore saved unitPrice as custom price
            if (ind.unitPrice !== undefined && ind.unitPrice !== null) {
              restoredCustomPrices[`${sampleKey}_${methodKey}`] = ind.unitPrice;
            }

            restoredDates[methodKey] = {
              transferDate: parseDate(ind.transferDate),
              requestDate: parseDate(ind.requestDate),
            };
            if (ind.sentToDepartment) {
              restoredChecked.push(methodKey);
            }
            if (ind.laboratoryId && ind.laboratoryName) {
              restoredLabMap[`${sampleKey}_${methodKey}`] = {
                laboratoryId: ind.laboratoryId,
                laboratoryName: ind.laboratoryName,
                requestDate: parseDate(ind.requestDate) || dayjs(),
                approvalStatus: ind.approvalStatus,
                isSentToQLKT: ind.isSentToQLKT,
                sentToDepartment: ind.sentToDepartment,
              };
              if (!expandedLabs.includes(ind.laboratoryId)) {
                expandedLabs.push(ind.laboratoryId);
              }
            }
          });
        });

        setSelectedIndicatorDates(restoredDates);
        setCheckedIndicators(restoredChecked);
        setIndicatorLaboratoryMap(restoredLabMap);
        setExpandedLabGroups(expandedLabs);
        setSampleIndicatorIdMap(restoredIndicatorIds);
        setCustomPrices(restoredCustomPrices);
      }
    } catch (error) {
      message.error("Không thể tải dữ liệu yêu cầu");
      console.error("Failed to load test request:", error);
    } finally {
      setLoadingData(false);
      setEditDataLoaded(true);
    }
  };

  // Load data from quotation (when creating test request from quotation)
  const loadFromQuotation = async (quotationIdToLoad: string) => {
    setLoadingData(true);
    try {
      // Use offline-aware service for loading quotation data
      const quotation = await offlineQuotationService.get(quotationIdToLoad);

      // Find organization to get full info
      const org = organizations.find((o) => o.id === quotation.organizationId);
      const provinceCodeToUse = quotation.provinceCode || org?.provinceCode;
      const wardCodeToUse = quotation.wardCode || org?.wardCode;

      let wardName: string | undefined = undefined;
      if (provinceCodeToUse) {
        const loadedWards = await getWardsByProvince(provinceCodeToUse);
        setWards(loadedWards);
        setSelectedProvinceCode(provinceCodeToUse);

        // Find ward name if wardCode exists
        if (wardCodeToUse) {
          wardName = loadedWards.find(w => w.code === wardCodeToUse)?.name;
        }
      }
      if (wardCodeToUse) {
        setSelectedWardCode(wardCodeToUse);
      }

      // Get province name for editable fields
      const provinceName = provinces.find(p => p.code === provinceCodeToUse)?.name;

      // Fill customer info from quotation
      form.setFieldsValue({
        customerName: quotation.customerName,
        province: provinceName || '',
        ward: wardName || '',
        address: quotation.address || org?.address,
        taxCode: quotation.taxCode || org?.taxCode,
        contactPerson: quotation.contactPerson || org?.contactPerson,
        phone: quotation.phone || org?.phone,
      });

      // Generate samples from quotation samples (new structure)
      const generatedSamples: SampleFormData[] = [];
      const generatedDates: Record<string, IndicatorDateInfo> = {};

      let globalIndex = 0;
      quotation.samples.forEach((quotationSample) => {
        const qty = quotationSample.quantity || 1;

        // Build indicator methods list once per quotation sample
        const indicatorMethodsList: IndicatorMethodKey[] = [];
        quotationSample.indicators.forEach((indicator) => {
          const testMethodId = indicator.testMethodId || "";
          let resolvedSpecimenTypeId = indicator.specimenTypeId || undefined;
          if (!resolvedSpecimenTypeId) {
            const methods = indicatorMethodsMap[indicator.indicatorId] || [];
            const matchedMethod = methods.find((m) => m.testMethodId === testMethodId);
            resolvedSpecimenTypeId = matchedMethod?.specimenTypeId || undefined;
          }
          const methodKey = createIndicatorMethodKey(indicator.indicatorId, testMethodId, resolvedSpecimenTypeId);
          indicatorMethodsList.push(methodKey);

          if (!generatedDates[methodKey]) {
            generatedDates[methodKey] = {
              transferDate: dayjs(),
              requestDate: undefined,
            };
          }
        });

        for (let q = 0; q < qty; q++) {
          const sampleKey = `quotation-sample-${Date.now()}-${globalIndex}`;
          const sampleCode = generateSampleCode(sampleCodePrefix, globalIndex + 1);

          generatedSamples.push({
            key: sampleKey,
            sortOrder: globalIndex + 1,
            sampleCode,
            sampleName: quotationSample.sampleName || "",
            samplingAddress: "",
            sampleQuantity: "",
            status: SampleStatus.Normal,
            statusText: "",
            processingStatus: "",
            notes: "",
            storageLocation: "",
            specimenTypeId: undefined,
            specimenTypeName: "",
            indicatorIds: indicatorMethodsList.map((k) => parseIndicatorMethodKey(k).indicatorId),
            indicatorMethods: [...indicatorMethodsList],
            attachments: [],
          });

          globalIndex++;
        }
      });

      setSamples(generatedSamples);
      setSelectedIndicatorDates(generatedDates);
      setSourceQuotationId(quotationIdToLoad);

      message.success(`Đã tải dữ liệu từ báo giá ${quotation.quotationNumber}`);
    } catch (error) {
      console.error("Failed to load quotation:", error);
      message.error("Không thể tải dữ liệu từ báo giá");
    } finally {
      setLoadingData(false);
    }
  };

  // Load data from existing test request (when creating new from old contract)
  const loadFromTestRequest = async (sourceTestRequestId: string) => {
    setLoadingData(true);
    try {
      const data = await offlineTestRequestService.get(sourceTestRequestId);
      if (!data) {
        message.error("Không thể tải dữ liệu hợp đồng gốc");
        return;
      }

      // Fill customer info
      if (data.provinceCode) {
        const loadedWards = await getWardsByProvince(data.provinceCode);
        setWards(loadedWards);
        setSelectedProvinceCode(data.provinceCode);
        if (data.wardCode) {
          setSelectedWardCode(data.wardCode);
        }
      }

      const provinceName = provinces.find(p => p.code === data.provinceCode)?.name;
      const wardName = data.wardCode
        ? (await getWardsByProvince(data.provinceCode || "")).find(w => w.code === data.wardCode)?.name
        : undefined;

      form.setFieldsValue({
        customerName: data.customerName,
        province: provinceName || data.province || "",
        ward: wardName || data.ward || "",
        address: data.address || "",
        taxCode: data.taxCode || "",
        contactPerson: data.contactPerson || "",
        phone: data.phone || "",
      });

      // Generate samples from test request samples
      const activeSamples = (data.samples || []).filter(s => !s.isCancelled);
      const generatedSamples: SampleFormData[] = [];
      const generatedDates: Record<string, IndicatorDateInfo> = {};

      activeSamples.forEach((sample, sampleIndex) => {
        const sampleKey = `tr-sample-${Date.now()}-${sampleIndex}`;
        const sampleCode = generateSampleCode(sampleCodePrefix, sampleIndex + 1);

        const activeIndicators = (sample.indicators || []).filter(
          (ind) => ind.approvalStatus !== IndicatorApprovalStatus.CustomerCancelled
        );

        const indicatorMethodsList: IndicatorMethodKey[] = [];
        activeIndicators.forEach((ind) => {
          if (ind.indicatorId && ind.testMethodId) {
            const methodKey = createIndicatorMethodKey(ind.indicatorId, ind.testMethodId, ind.specimenTypeId);
            indicatorMethodsList.push(methodKey);

            if (!generatedDates[methodKey]) {
              generatedDates[methodKey] = {
                transferDate: dayjs(),
                requestDate: undefined,
              };
            }
          }
        });

        generatedSamples.push({
          key: sampleKey,
          sortOrder: sampleIndex + 1,
          sampleCode,
          sampleName: sample.sampleName || "",
          samplingAddress: sample.samplingAddress || "",
          sampleQuantity: sample.sampleQuantity || "",
          status: SampleStatus.Normal,
          statusText: "",
          processingStatus: "",
          notes: "",
          storageLocation: "",
          specimenTypeId: sample.specimenTypeId,
          specimenTypeName: sample.specimenTypeName || "",
          indicatorIds: indicatorMethodsList.map((k) => parseIndicatorMethodKey(k).indicatorId),
          indicatorMethods: indicatorMethodsList,
          attachments: [],
        });
      });

      setSamples(generatedSamples);
      setSelectedIndicatorDates(generatedDates);

      message.success(`Đã tải dữ liệu từ hợp đồng ${data.contractNumber || data.requestNumber}`);
    } catch (error) {
      console.error("Failed to load test request:", error);
      message.error("Không thể tải dữ liệu từ hợp đồng");
    } finally {
      setLoadingData(false);
    }
  };

  // Calculate total cost - now based on indicatorMethods with prices from TestMethodIndicator
  const calculateTotalCost = useCallback(() => {
    let total = 0;
    samples.forEach((sample) => {
      // Group indicator names by specimenTypeId để check combo riêng từng loại mẫu
      const groupedBySpecimenType: Record<string, (string | undefined)[]> = {};
      for (const mk of (sample.indicatorMethods || [])) {
        const { indicatorId, specimenTypeId: stId } = parseIndicatorMethodKey(mk);
        const ind = indicators.find((i) => i.id === indicatorId);
        const gKey = stId || '_none';
        if (!groupedBySpecimenType[gKey]) groupedBySpecimenType[gKey] = [];
        groupedBySpecimenType[gKey].push(ind?.name);
      }
      const comboMetBySpecimenType: Record<string, boolean> = {};
      const ecoliComboMetBySpecimenType: Record<string, boolean> = {};
      for (const [stId, names] of Object.entries(groupedBySpecimenType)) {
        const st = stId !== '_none' ? specimenTypes.find((s) => s.id === stId) : null;
        comboMetBySpecimenType[stId] = isHeavyMetalComboMet(names, st?.sampleTypeCategoryName, st?.name);
        ecoliComboMetBySpecimenType[stId] = isEcoliColiformComboMet(names, st?.sampleTypeCategoryName, st?.name);
      }

      // New logic: use indicatorMethods if available
      if (sample.indicatorMethods && sample.indicatorMethods.length > 0) {
        sample.indicatorMethods.forEach((key) => {
          const { indicatorId, testMethodId, specimenTypeId } = parseIndicatorMethodKey(key);
          const methods = indicatorMethodsMap[indicatorId] || [];
          // Must match both testMethodId AND specimenTypeId to get correct price
          const method = methods.find(
            (m) => m.testMethodId === testMethodId && (m.specimenTypeId || null) === specimenTypeId
          );
          if (method) {
            // Combo miễn phí: Hg (kim loại nặng, per specimen type) hoặc E.Coli (E.Coli + Coliform, per specimen type)
            const ind = indicators.find((i) => i.id === indicatorId);
            const stComboKey = specimenTypeId || '_none';
            const isComboFree = (comboMetBySpecimenType[stComboKey] && isHgIndicator(ind?.name)) ||
              (ecoliComboMetBySpecimenType[stComboKey] && isEcoliIndicator(ind?.name));
            const customPriceKey = `${sample.key}_${key}`;
            const price = customPrices[customPriceKey] !== undefined ? customPrices[customPriceKey] : method.unitPrice;
            total += isComboFree ? 0 : price;
          }
        });
      } else {
        // Fallback to old logic for backward compatibility
        sample.indicatorIds.forEach((indId) => {
          const methods = indicatorMethodsMap[indId] || [];
          if (methods.length > 0) {
            const ind = indicators.find((i) => i.id === indId);
            const isComboFree = (comboMetBySpecimenType['_none'] && isHgIndicator(ind?.name)) ||
              (ecoliComboMetBySpecimenType['_none'] && isEcoliIndicator(ind?.name));
            total += isComboFree ? 0 : methods[0].unitPrice;
          }
        });
      }
    });
    setTotalSampleCost(total);
  }, [samples, indicators, indicatorMethodsMap, customPrices, specimenTypes]);

  // Get indicator info by id
  const getIndicatorInfo = (indicatorId: string) => {
    return indicators.find((ind) => ind.id === indicatorId);
  };

  // Get methods for an indicator
  const getMethodsForIndicator = (indicatorId: string): IndicatorMethodInfo[] => {
    return indicatorMethodsMap[indicatorId]?.filter((m) => m.isActive) || [];
  };

  // Get indicator and method info from IndicatorMethodKey
  const getIndicatorMethodInfo = (key: IndicatorMethodKey) => {
    const { indicatorId, testMethodId, specimenTypeId } = parseIndicatorMethodKey(key);
    let indicator = indicators.find((i) => i.id === indicatorId);
    const methods = indicatorMethodsMap[indicatorId] || [];
    // Must match both testMethodId AND specimenTypeId to get correct price for each specimen type
    const matchedMethod = methods.find(
      (m) => m.testMethodId === testMethodId && (m.specimenTypeId || null) === specimenTypeId
    );
    const fallbackSpecimenType = specimenTypes.find((specimenType) => specimenType.id === specimenTypeId);
    const method = matchedMethod || (testMethodId === PENDING_TEST_METHOD_ID
      ? {
          testMethodId: PENDING_TEST_METHOD_ID,
          testMethodCode: "",
          testMethodName: PENDING_TEST_METHOD_NAME,
          unitPrice: 0,
          isActive: true,
          specimenTypeId: specimenTypeId || undefined,
          specimenTypeCode: fallbackSpecimenType?.code,
          specimenTypeName: fallbackSpecimenType?.name,
        }
      : undefined);

    // Fallback: If indicator not found in indicators list (e.g., sub-indicators),
    // create indicator-like object from testMethods data
    if (!indicator && testMethodId) {
      const testMethod = testMethods.find((tm) => tm.id === testMethodId);
      const tmIndicator = testMethod?.indicators?.find((ind) => ind.indicatorId === indicatorId);
      if (tmIndicator) {
        indicator = {
          id: tmIndicator.indicatorId,
          code: tmIndicator.indicatorCode,
          name: tmIndicator.indicatorName,
          formattedName: tmIndicator.indicatorFormattedName,
          isActive: tmIndicator.isActive,
          indicatorGroupId: "", // Not available in test method data
          sortOrder: tmIndicator.sortOrder,
          parentIndicatorId: tmIndicator.parentIndicatorId, // For sub-indicator detection
        } as IndicatorDto;
      }
    }

    return { indicator, method, indicatorId, testMethodId };
  };

  const registerQuickCreatedIndicator = useCallback(
    (result: QuickCreateIndicatorResultItem) => {
      const { indicator, specimenTypeId, specimenTypeName } = result;
      const methodId = result.testMethodId || PENDING_TEST_METHOD_ID;
      const methodName = result.testMethodName || PENDING_TEST_METHOD_NAME;

      setIndicators((prev) => {
        if (prev.some((item) => item.id === indicator.id)) {
          return prev;
        }
        return [...prev, indicator];
      });

      setIndicatorMethodsMap((prev) => {
        const existingMethods = prev[indicator.id] || [];
        const hasEntry = existingMethods.some(
          (method) =>
            method.testMethodId === methodId &&
            (method.specimenTypeId || null) === specimenTypeId
        );

        if (hasEntry) {
          return prev;
        }

        return {
          ...prev,
          [indicator.id]: [
            ...existingMethods,
            {
              testMethodId: methodId,
              testMethodCode: "",
              testMethodName: methodName,
              unitPrice: result.unitPrice || 0,
              isActive: true,
              parentIndicatorId: indicator.parentIndicatorId,
              specimenTypeId,
              specimenTypeName,
            },
          ],
        };
      });

      setIndicatorToSpecimenTypesMap((prev) => {
        const current = prev[indicator.id] || [];
        if (current.some((item) => item.id === specimenTypeId)) {
          return prev;
        }
        return {
          ...prev,
          [indicator.id]: [...current, { id: specimenTypeId, name: specimenTypeName }],
        };
      });

      setSpecimenTypesWithIndicators((prev) =>
        prev.map((specimenType) => {
          if (specimenType.id !== specimenTypeId) {
            return specimenType;
          }

          if ((specimenType.indicators || []).some((item) => item.indicatorId === indicator.id)) {
            return specimenType;
          }

          return {
            ...specimenType,
            indicators: [
              ...(specimenType.indicators || []),
              {
                id: `${specimenTypeId}_${indicator.id}`,
                specimenTypeId,
                indicatorId: indicator.id,
                indicatorCode: indicator.code,
                indicatorName: indicator.name,
                indicatorFormattedName: indicator.formattedName,
                indicatorGroupName: indicator.indicatorGroupName,
                isActive: true,
                sortOrder: (specimenType.indicators?.length || 0) + 1,
              },
            ],
          };
        })
      );

      if (currentSampleSpecimenTypeId === specimenTypeId) {
        setSpecimenTypeIndicatorIds((prev) =>
          prev.includes(indicator.id) ? prev : [...prev, indicator.id]
        );
      }
    },
    [currentSampleSpecimenTypeId]
  );

  // Get filtered indicators for modal
  const getFilteredIndicators = () => {
    let filtered = indicators.filter((ind) => ind.isActive);

    if (selectedGroupFilter !== "all") {
      filtered = filtered.filter((ind) => ind.indicatorGroupId === selectedGroupFilter);
    }

    if (indicatorSearchText.trim()) {
      const searchNorm = indicatorSearchText.trim().normalize("NFC").toLowerCase();
      filtered = filtered.filter(
        (ind) =>
          ind.name.normalize("NFC").toLowerCase().includes(searchNorm) ||
          ind.code?.normalize("NFC").toLowerCase().includes(searchNorm)
      );
    }

    return filtered;
  };

  // Get filtered groups for tree selector
  const getFilteredGroupsWithIndicators = () => {
    const searchLower = groupSearchText.toLowerCase().trim();

    return indicatorGroups
      .map((group) => {
        const groupIndicators = indicators.filter(
          (ind) =>
            ind.indicatorGroupId === group.id &&
            ind.isActive &&
            (!searchLower ||
              ind.name.toLowerCase().includes(searchLower) ||
              group.name.toLowerCase().includes(searchLower))
        );

        return {
          ...group,
          indicators: groupIndicators,
          matchesSearch:
            !searchLower ||
            group.name.toLowerCase().includes(searchLower) ||
            groupIndicators.length > 0,
        };
      })
      .filter((g) => g.matchesSearch);
  };

  // Effects
  useEffect(() => {
    loadMasterData();
  }, []);

  useEffect(() => {
    if (indicatorGroups.length > 0 && expandedGroups.length === 0) {
      setExpandedGroups(indicatorGroups.map((g) => g.id));
      setExpandedGroupsInSelector(indicatorGroups.map((g) => g.id));
    }
  }, [indicatorGroups]);

  useEffect(() => {
    if (isEditMode) {
      loadData();
    }
  }, [id]);

  // Load from quotation when quotationId is present (create mode)
  // Wait for indicatorMethodsMap and indicators to be loaded before loading from quotation
  useEffect(() => {
    if (
      !isEditMode &&
      quotationId &&
      organizations.length > 0 &&
      sampleCodePrefix &&
      indicators.length > 0 &&
      Object.keys(indicatorMethodsMap).length > 0 &&
      !quotationLoadedRef.current
    ) {
      quotationLoadedRef.current = true;
      loadFromQuotation(quotationId);
    }
  }, [quotationId, organizations, sampleCodePrefix, isEditMode, indicators, indicatorMethodsMap]);

  // Load from test request when testRequestId is present (create from existing contract)
  useEffect(() => {
    if (
      !isEditMode &&
      testRequestId &&
      !quotationId &&
      sampleCodePrefix &&
      indicators.length > 0 &&
      Object.keys(indicatorMethodsMap).length > 0 &&
      !testRequestLoadedRef.current
    ) {
      testRequestLoadedRef.current = true;
      loadFromTestRequest(testRequestId);
    }
  }, [testRequestId, sampleCodePrefix, isEditMode, indicators, indicatorMethodsMap]);

  useEffect(() => {
    if (indicatorGroups.length > 0 && indicators.length > 0) {
      const treeData = indicatorGroups
        .map((group) => ({
          title: group.name,
          value: `group-${group.id}`,
          key: `group-${group.id}`,
          selectable: false,
          children: indicators
            .filter((ind) => ind.indicatorGroupId === group.id && ind.isActive)
            .map((ind) => ({
              title: ind.name,
              value: ind.id,
              key: ind.id,
            })),
        }))
        .filter((group) => group.children.length > 0);
      setIndicatorTreeData(treeData);
    }
  }, [indicatorGroups, indicators]);

  useEffect(() => {
    calculateTotalCost();
  }, [samples, indicators, calculateTotalCost]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (specimenTypeDebounceRef.current) {
        clearTimeout(specimenTypeDebounceRef.current);
      }
      if (contractNumberDebounceRef.current) {
        clearTimeout(contractNumberDebounceRef.current);
      }
    };
  }, []);

  // ==================== Auto-save Draft (Create + Edit mode) ====================
  // Key format: "test_request_draft_new" for create, "test_request_draft_{id}" for edit
  const DRAFT_KEY_PREFIX = "test_request_draft";
  const draftKey = useMemo(
    () => isEditMode && id ? `${DRAFT_KEY_PREFIX}_${id}` : `${DRAFT_KEY_PREFIX}_new`,
    [isEditMode, id]
  );
  const draftSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const draftRestoredRef = useRef(false);
  const [editDataLoaded, setEditDataLoaded] = useState(false);

  // Save draft to localStorage (debounced)
  const saveDraft = useCallback(() => {
    const formValues = form.getFieldsValue();
    // Convert dayjs to ISO string for serialization
    const serializableValues: Record<string, any> = {};
    Object.entries(formValues).forEach(([key, value]) => {
      if (dayjs.isDayjs(value)) {
        serializableValues[key] = (value as dayjs.Dayjs).toISOString();
        serializableValues[`__dayjs_${key}`] = true;
      } else {
        serializableValues[key] = value;
      }
    });

    const draft = {
      formValues: serializableValues,
      samples: samples.map(s => ({ ...s, attachments: [] })), // Don't save file blobs
      selectedIndicatorDates: Object.fromEntries(
        Object.entries(selectedIndicatorDates).map(([k, v]) => [
          k,
          {
            transferDate: v.transferDate?.toISOString() || null,
            requestDate: v.requestDate?.toISOString() || null,
          },
        ])
      ),
      sampleCodePrefix,
      selectedProvinceCode,
      selectedWardCode,
      savedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(draftKey, JSON.stringify(draft));
    } catch (e) {
      // localStorage full or unavailable - silently ignore
    }
  }, [form, samples, selectedIndicatorDates, sampleCodePrefix, selectedProvinceCode, selectedWardCode, draftKey]);

  // Auto-save every 3 seconds when form data changes
  useEffect(() => {
    // Skip auto-save when loading from quotation/testRequest source (create mode only)
    if (!isEditMode && (quotationId || testRequestId)) return;

    if (draftSaveTimerRef.current) {
      clearTimeout(draftSaveTimerRef.current);
    }
    draftSaveTimerRef.current = setTimeout(() => {
      // Only save if there's meaningful data
      if (samples.length > 0 || form.getFieldValue("customerName")) {
        saveDraft();
      }
    }, 3000);

    return () => {
      if (draftSaveTimerRef.current) {
        clearTimeout(draftSaveTimerRef.current);
      }
    };
  }, [samples, selectedIndicatorDates, sampleCodePrefix, isEditMode, quotationId, testRequestId, saveDraft]);

  // Restore draft on mount
  // - Create mode: restore if no quotation/testRequest source
  // - Edit mode: restore after loadData completes
  useEffect(() => {
    if (draftRestoredRef.current) return;
    // Create mode: skip if loading from quotation/testRequest
    if (!isEditMode && (quotationId || testRequestId)) return;
    // Edit mode: wait until loadData has actually completed
    if (isEditMode && !editDataLoaded) return;

    draftRestoredRef.current = true;

    try {
      const saved = localStorage.getItem(draftKey);
      if (!saved) return;

      const draft = JSON.parse(saved);
      // Check if draft is less than 24 hours old
      const savedAt = new Date(draft.savedAt);
      const hoursDiff = (Date.now() - savedAt.getTime()) / (1000 * 60 * 60);
      if (hoursDiff > 24) {
        localStorage.removeItem(draftKey);
        return;
      }

      // Ask user if they want to restore
      const savedTime = dayjs(draft.savedAt).format("HH:mm DD/MM/YYYY");
      const label = isEditMode ? "chỉnh sửa" : "tạo mới";
      const shouldRestore = window.confirm(
        `Có bản nháp ${label} chưa lưu (lúc ${savedTime}). Bạn có muốn khôi phục không?`
      );

      if (!shouldRestore) {
        localStorage.removeItem(draftKey);
        return;
      }

      // Restore form values
      const formValues = draft.formValues || {};
      const restoredValues: Record<string, any> = {};
      Object.entries(formValues).forEach(([key, value]) => {
        if (key.startsWith("__dayjs_")) return;
        if (formValues[`__dayjs_${key}`] && value) {
          restoredValues[key] = dayjs(value as string);
        } else {
          restoredValues[key] = value;
        }
      });

      // Backward compatibility for old draft format (single radio value)
      if (
        restoredValues.sampleType &&
        !Array.isArray(restoredValues.sampleType)
      ) {
        restoredValues.sampleType = [restoredValues.sampleType];
      }

      form.setFieldsValue(restoredValues);

      // Restore sample code prefix (create mode only - edit mode keeps from API)
      if (!isEditMode && draft.sampleCodePrefix) {
        setSampleCodePrefix(draft.sampleCodePrefix);
      }

      // Restore province/ward codes
      if (draft.selectedProvinceCode) {
        setSelectedProvinceCode(draft.selectedProvinceCode);
        getWardsByProvince(draft.selectedProvinceCode).then(loadedWards => {
          setWards(loadedWards);
        });
      }
      if (draft.selectedWardCode) {
        setSelectedWardCode(draft.selectedWardCode);
      }

      // Restore samples
      if (draft.samples && draft.samples.length > 0) {
        setSamples(draft.samples);
      }

      // Restore indicator dates
      if (draft.selectedIndicatorDates) {
        const restoredDates: Record<string, IndicatorDateInfo> = {};
        Object.entries(draft.selectedIndicatorDates).forEach(([key, val]: [string, any]) => {
          restoredDates[key] = {
            transferDate: val.transferDate ? dayjs(val.transferDate) : undefined,
            requestDate: val.requestDate ? dayjs(val.requestDate) : undefined,
          };
        });
        setSelectedIndicatorDates(restoredDates);
      }

      message.success("Đã khôi phục bản nháp");
    } catch (e) {
      console.error("Failed to restore draft:", e);
      localStorage.removeItem(draftKey);
    }
  }, [isEditMode, quotationId, testRequestId, editDataLoaded, draftKey]);

  // Clear draft function (call after successful save)
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(draftKey);
    } catch (e) {
      // ignore
    }
  }, [draftKey]);

  return {
    // Form
    form,
    isEditMode,
    loading,
    setLoading,
    loadingData,
    id,

    // Form watches
    sampleTypeTask,
    methodRequirement,

    // Sample code prefix
    sampleCodePrefix,
    setSampleCodePrefix,
    updateSampleCodesPrefix,
    validateContractNumberDebounced,

    // Status
    currentStatus,
    isFieldLocked,
    isSamplesLocked,
    isEditRequiresApproval,

    // Samples
    samples,
    setSamples,

    // Master data
    indicatorGroups,
    indicators,
    storageLocations,
    indicatorTreeData,
    users,
    organizations,
    organizationOptions,
    organizationSearching,
    laboratories,
    specimenTypes,
    specimenTypesWithIndicators,
    indicatorToSpecimenTypesMap,
    testMethods,
    indicatorMethodsMap,

    // Organization handlers
    handleOrganizationSearch,

    // Specimen Type handlers
    specimenTypeOptions,
    handleSpecimenTypeSearch,
    handleSpecimenTypeSelect,
    handleOrganizationSelect,
    handlePhoneBlur,
    handlePhoneEnter,

    // Sample Condition handlers
    sampleConditions,
    sampleConditionOptions,

    // Sample Type Categories
    sampleTypeCategories,

    // Costs
    totalSampleCost,

    // Indicator modal
    indicatorModalVisible,
    setIndicatorModalVisible,
    currentSampleKey,
    setCurrentSampleKey,
    tempSelectedIndicators,
    setTempSelectedIndicators,
    tempSelectedIndicatorMethods,
    setTempSelectedIndicatorMethods,
    expandedIndicators,
    setExpandedIndicators,
    selectedGroupFilter,
    setSelectedGroupFilter,
    indicatorSearchText,
    setIndicatorSearchText,
    groupSelectorVisible,
    setGroupSelectorVisible,
    groupSearchText,
    setGroupSearchText,
    // Filter theo loại mẫu
    currentSampleSpecimenTypeId,
    setCurrentSampleSpecimenTypeId,
    currentSampleSpecimenTypeName,
    setCurrentSampleSpecimenTypeName,
    specimenTypeIndicatorIds,
    setSpecimenTypeIndicatorIds,
    specimenTypeFilterActive,
    setSpecimenTypeFilterActive,

    // Dates and checks
    selectedIndicatorDates,
    setSelectedIndicatorDates,
    checkedIndicators,
    setCheckedIndicators,

    // Expanded groups
    expandedGroups,
    setExpandedGroups,
    expandedGroupsInSelector,
    setExpandedGroupsInSelector,

    // Laboratory modal
    laboratoryModalVisible,
    setLaboratoryModalVisible,
    selectedLaboratoryId,
    setSelectedLaboratoryId,
    laboratoryRequestDate,
    setLaboratoryRequestDate,
    indicatorsToSend,
    setIndicatorsToSend,
    indicatorLaboratoryMap,
    setIndicatorLaboratoryMap,
    expandedLabGroups,
    setExpandedLabGroups,

    // Custom prices (per-indicator override, only for this test request)
    customPrices,
    setCustomPrices,

    // Sample indicator IDs for update
    sampleIndicatorIdMap,
    setSampleIndicatorIdMap,

    // Original data snapshot for change detection
    originalData,

    // Quotation source
    sourceQuotationId,

    // Location
    provinces,
    wards,
    setWards,
    selectedProvinceCode,
    setSelectedProvinceCode,
    selectedWardCode,
    setSelectedWardCode,

    // Helpers
    getIndicatorInfo,
    getMethodsForIndicator,
    getIndicatorMethodInfo,
    getFilteredIndicators,
    getFilteredGroupsWithIndicators,
    registerQuickCreatedIndicator,

    // Draft
    clearDraft,

    // Navigation
    navigate,
  };
};
