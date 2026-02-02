// @ts-nocheck
import { useState, useEffect, useRef, useCallback } from "react";
import { Form, message } from "antd";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import { testRequestService, offlineTestRequestService } from "../../../../services/testRequestService";
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
import { LOCKED_FIELDS, isHeavyMetalComboMet, isHgIndicator } from "../constants";
import {
  SampleFormData,
  IndicatorDateInfo,
  LaboratoryAssignment,
  IndicatorMethodInfo,
  IndicatorMethodKey,
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
  const sampleTypeTask = Form.useWatch("sampleTypeTask", form);
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

  // Store TestRequestSampleIndicator.id for each indicator
  // Key format: "sampleKey_indicatorMethodKey" -> TestRequestSampleIndicator.id
  const [sampleIndicatorIdMap, setSampleIndicatorIdMap] = useState<Record<string, string>>({});

  // Snapshot của data gốc khi load form edit - dùng để so sánh thay đổi
  const [originalData, setOriginalData] = useState<any>(null);

  // Store quotationId when creating from quotation
  const [sourceQuotationId, setSourceQuotationId] = useState<string | null>(quotationId);

  // Track if quotation has been loaded (to prevent re-loading)
  const quotationLoadedRef = useRef(false);

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
  const isFieldLocked = (fieldName: string): boolean => {
    if (!isEditMode || currentStatus === null) return false;
    if (!canEditFullInfo(currentStatus)) {
      return LOCKED_FIELDS.includes(fieldName);
    }
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
  const isEditRequiresApproval = (): boolean => {
    if (!isEditMode || currentStatus === null) return false;
    return canEditWithApproval(currentStatus);
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
          // Note: specimenTypeId comes from the sample, not the indicator
          const sampleSpecimenTypeId = sample.specimenTypeId;
          const indicatorMethods: IndicatorMethodKey[] = [];
          activeIndicators.forEach((ind) => {
            if (ind.indicatorId && ind.testMethodId) {
              // Use sample's specimenTypeId for the key
              indicatorMethods.push(createIndicatorMethodKey(ind.indicatorId, ind.testMethodId, sampleSpecimenTypeId));
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

        // Parse dates helper - handle both UTC formats
        const parseDate = (dateStr: string | null | undefined): dayjs.Dayjs | undefined => {
          if (!dateStr || typeof dateStr !== 'string') return undefined;
          // If no Z suffix, append it to treat as UTC
          const utcDateStr = dateStr.endsWith('Z') ? dateStr : `${dateStr}Z`;
          // Parse as UTC, then convert to local timezone
          const parsed = dayjs(utcDateStr);
          if (!parsed.isValid()) return undefined;
          // Return date at start of day in local timezone
          return parsed.startOf('day');
        };

        activeSamples.forEach((sample, sampleIndex) => {
          const sampleKey = sample.id || `sample-${sampleIndex}`;
          // Filter out CustomerCancelled indicators
          const activeIndicators = sample.indicators?.filter(
            (ind) => ind.approvalStatus !== IndicatorApprovalStatus.CustomerCancelled
          ) || [];

          activeIndicators.forEach((ind) => {
            // Create IndicatorMethodKey for each indicator (include sample's specimenTypeId)
            const methodKey = ind.testMethodId
              ? createIndicatorMethodKey(ind.indicatorId, ind.testMethodId, sample.specimenTypeId)
              : ind.indicatorId; // Fallback for old data without testMethodId

            // Store the TestRequestSampleIndicator.id for this indicator
            if (ind.id) {
              restoredIndicatorIds[`${sampleKey}_${methodKey}`] = ind.id;
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
      }
    } catch (error) {
      message.error("Không thể tải dữ liệu yêu cầu");
      console.error("Failed to load test request:", error);
    } finally {
      setLoadingData(false);
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

      quotation.samples.forEach((quotationSample, sampleIndex) => {
        const sampleKey = `quotation-sample-${Date.now()}-${sampleIndex}`;
        const sampleCode = generateSampleCode(sampleCodePrefix, sampleIndex + 1);

        // Get indicators from quotation sample
        // Note: Quotation samples don't have specimenTypeId yet, it will be set later
        const indicatorMethodsList: IndicatorMethodKey[] = [];
        quotationSample.indicators.forEach((indicator) => {
          const testMethodId = indicator.testMethodId || "";
          const methodKey = createIndicatorMethodKey(indicator.indicatorId, testMethodId, undefined);
          indicatorMethodsList.push(methodKey);

          // Set dates for indicators (requestDate để trống theo yêu cầu KH)
          if (!generatedDates[methodKey]) {
            generatedDates[methodKey] = {
              transferDate: dayjs(),
              requestDate: undefined,
            };
          }
        });

        generatedSamples.push({
          key: sampleKey,
          sortOrder: sampleIndex + 1,
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
          indicatorMethods: indicatorMethodsList,
          attachments: [],
        });
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

  // Calculate total cost - now based on indicatorMethods with prices from TestMethodIndicator
  const calculateTotalCost = useCallback(() => {
    let total = 0;
    samples.forEach((sample) => {
      // Check combo kim loại nặng cho sample này
      const sampleIndicatorNames = (sample.indicatorMethods || []).map((methodKey) => {
        const { indicatorId } = parseIndicatorMethodKey(methodKey);
        const ind = indicators.find((i) => i.id === indicatorId);
        return ind?.name;
      });
      const isSampleComboMet = isHeavyMetalComboMet(sampleIndicatorNames);

      // New logic: use indicatorMethods if available
      if (sample.indicatorMethods && sample.indicatorMethods.length > 0) {
        sample.indicatorMethods.forEach((key) => {
          const { indicatorId, testMethodId } = parseIndicatorMethodKey(key);
          const methods = indicatorMethodsMap[indicatorId] || [];
          const method = methods.find((m) => m.testMethodId === testMethodId);
          if (method) {
            // Hg miễn phí khi đủ combo kim loại nặng
            const ind = indicators.find((i) => i.id === indicatorId);
            const isHgFree = isSampleComboMet && isHgIndicator(ind?.name);
            total += isHgFree ? 0 : method.unitPrice;
          }
        });
      } else {
        // Fallback to old logic for backward compatibility
        sample.indicatorIds.forEach((indId) => {
          const methods = indicatorMethodsMap[indId] || [];
          if (methods.length > 0) {
            const ind = indicators.find((i) => i.id === indId);
            const isHgFree = isSampleComboMet && isHgIndicator(ind?.name);
            total += isHgFree ? 0 : methods[0].unitPrice;
          }
        });
      }
    });
    setTotalSampleCost(total);
  }, [samples, indicators, indicatorMethodsMap]);

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
    const { indicatorId, testMethodId } = parseIndicatorMethodKey(key);
    let indicator = indicators.find((i) => i.id === indicatorId);
    const methods = indicatorMethodsMap[indicatorId] || [];
    const method = methods.find((m) => m.testMethodId === testMethodId);

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

  // Get filtered indicators for modal
  const getFilteredIndicators = () => {
    let filtered = indicators.filter((ind) => ind.isActive);

    if (selectedGroupFilter !== "all") {
      filtered = filtered.filter((ind) => ind.indicatorGroupId === selectedGroupFilter);
    }

    if (indicatorSearchText.trim()) {
      const searchLower = indicatorSearchText.toLowerCase().trim();
      filtered = filtered.filter(
        (ind) =>
          ind.name.toLowerCase().includes(searchLower) ||
          ind.code?.toLowerCase().includes(searchLower)
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
    };
  }, []);

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

    // Navigation
    navigate,
  };
};
