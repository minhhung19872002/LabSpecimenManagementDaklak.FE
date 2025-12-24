// @ts-nocheck
import { useState, useEffect, useRef, useCallback } from "react";
import { Form, message } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import { testRequestService } from "../../../../services/testRequestService";
import {
  indicatorGroupService,
  indicatorService,
  storageLocationService,
  laboratoryService,
  IndicatorDto,
  IndicatorGroupDto,
  StorageLocationDto,
  LaboratoryDto,
} from "../../../../services/masterDataService";
import { userService, UserLookupDto } from "../../../../services/userService";
import { organizationService } from "../../../../services/organizationService";
import { OrganizationDto } from "../../../../types/organization";
import {
  TestRequestStatus,
  SampleStatus,
  canEditTestRequest,
  canEditFullInfo,
} from "../../../../types/testRequest";
import {
  getAllProvinces,
  getWardsByProvince,
  Province,
  Ward,
} from "../../../../utils/vietnamLocations";
import { LOCKED_FIELDS } from "../constants";
import { SampleFormData, IndicatorDateInfo, LaboratoryAssignment } from "../types";

export const useTestRequestFormData = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const isEditMode = !!id;

  // Watch form fields
  const sampleTypeTask = Form.useWatch("sampleTypeTask", form);
  const methodRequirement = Form.useWatch("methodRequirement", form);

  // Contract number for sample codes
  const [sampleCodePrefix, setSampleCodePrefix] = useState<string>("");

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
  const [laboratories, setLaboratories] = useState<LaboratoryDto[]>([]);

  // Costs
  const [totalSampleCost, setTotalSampleCost] = useState(0);

  // Indicator modal state
  const [indicatorModalVisible, setIndicatorModalVisible] = useState(false);
  const [currentSampleKey, setCurrentSampleKey] = useState<string | null>(null);
  const [tempSelectedIndicators, setTempSelectedIndicators] = useState<string[]>([]);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>("all");
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

  // Vietnam location states
  const [provinces] = useState<Province[]>(getAllProvinces());
  const [wards, setWards] = useState<Ward[]>([]);

  // Helper to check if a field should be disabled based on status
  const isFieldLocked = (fieldName: string): boolean => {
    if (!isEditMode || currentStatus === null) return false;
    if (!canEditFullInfo(currentStatus)) {
      return LOCKED_FIELDS.includes(fieldName);
    }
    return false;
  };

  // Check if samples section should be locked
  const isSamplesLocked = (): boolean => {
    if (!isEditMode || currentStatus === null) return false;
    return !canEditFullInfo(currentStatus);
  };

  // Load master data
  const loadMasterData = async () => {
    try {
      const [groupsData, indicatorsData, locationsData, usersData, orgsData, labsData] = await Promise.all([
        indicatorGroupService.getActive(),
        indicatorService.getActive(),
        storageLocationService.getActive(),
        userService.getLookup(),
        organizationService.getAllActive(),
        laboratoryService.getActive(),
      ]);
      setIndicatorGroups(groupsData);
      setIndicators(indicatorsData);
      setStorageLocations(locationsData.items || []);
      setUsers(usersData);
      setOrganizations(orgsData);
      setLaboratories(labsData || []);
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
  const handleOrganizationSelect = (value: string) => {
    const selectedOrg = organizations.find((org) => org.name === value);
    if (selectedOrg) {
      if (selectedOrg.provinceCode) {
        setWards(getWardsByProvince(selectedOrg.provinceCode));
      }
      form.setFieldsValue({
        customerName: selectedOrg.name,
        provinceCode: selectedOrg.provinceCode,
        wardCode: selectedOrg.wardCode,
        address: selectedOrg.address,
        taxCode: selectedOrg.taxCode,
        contactPerson: selectedOrg.contactPerson,
        phone: selectedOrg.phone,
      });
    }
  };

  // Handle phone blur - search organization by phone
  const handlePhoneBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const phoneValue = e.target.value?.trim();
    if (!phoneValue) return;

    const foundOrg = organizations.find((org) => org.phone === phoneValue);
    if (foundOrg) {
      if (foundOrg.provinceCode) {
        setWards(getWardsByProvince(foundOrg.provinceCode));
      }
      form.setFieldsValue({
        customerName: foundOrg.name,
        provinceCode: foundOrg.provinceCode,
        wardCode: foundOrg.wardCode,
        address: foundOrg.address,
        taxCode: foundOrg.taxCode,
        contactPerson: foundOrg.contactPerson,
        phone: foundOrg.phone,
      });
    }
  };

  // Load edit data
  const loadData = async () => {
    if (!id) return;

    setLoadingData(true);
    try {
      const data = await testRequestService.get(id);

      setCurrentStatus(data.status);

      if (!canEditTestRequest(data.status)) {
        message.warning("Không thể chỉnh sửa phiếu ở trạng thái này");
        navigate(`/test-request/${id}`);
        return;
      }

      if (data.provinceCode) {
        const loadedWards = getWardsByProvince(data.provinceCode);
        setWards(loadedWards);
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

      // Load samples
      if (data.samples && data.samples.length > 0) {
        const sampleData: SampleFormData[] = data.samples.map((sample, index) => ({
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
          indicatorIds: sample.indicators?.map((ind) => ind.indicatorId) || [],
        }));
        setSamples(sampleData);

        // Restore indicator dates, checked states, and laboratory assignments
        const restoredDates: Record<string, IndicatorDateInfo> = {};
        const restoredChecked: string[] = [];
        const restoredLabMap: Record<string, LaboratoryAssignment> = {};
        const expandedLabs: string[] = [];

        data.samples.forEach((sample, sampleIndex) => {
          const sampleKey = sample.id || `sample-${sampleIndex}`;
          sample.indicators?.forEach((ind) => {
            restoredDates[ind.indicatorId] = {
              transferDate: ind.transferDate ? dayjs(ind.transferDate) : undefined,
              requestDate: ind.requestDate ? dayjs(ind.requestDate) : undefined,
            };
            if (ind.sentToDepartment) {
              restoredChecked.push(ind.indicatorId);
            }
            if (ind.laboratoryId && ind.laboratoryName) {
              restoredLabMap[`${sampleKey}_${ind.indicatorId}`] = {
                laboratoryId: ind.laboratoryId,
                laboratoryName: ind.laboratoryName,
                requestDate: ind.requestDate ? dayjs(ind.requestDate) : dayjs(),
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
      }
    } catch (error) {
      message.error("Không thể tải dữ liệu yêu cầu");
      console.error("Failed to load test request:", error);
    } finally {
      setLoadingData(false);
    }
  };

  // Calculate total cost
  const calculateTotalCost = useCallback(() => {
    let total = 0;
    samples.forEach((sample) => {
      sample.indicatorIds.forEach((indId) => {
        const indicator = indicators.find((i) => i.id === indId);
        if (indicator) {
          total += indicator.unitPrice;
        }
      });
    });
    setTotalSampleCost(total);
  }, [samples, indicators]);

  // Get indicator info by id
  const getIndicatorInfo = (indicatorId: string) => {
    return indicators.find((ind) => ind.id === indicatorId);
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
              title: `${ind.name} (${ind.unitPrice.toLocaleString("vi-VN")}đ)`,
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

    // Status
    currentStatus,
    isFieldLocked,
    isSamplesLocked,

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

    // Organization handlers
    handleOrganizationSearch,
    handleOrganizationSelect,
    handlePhoneBlur,

    // Costs
    totalSampleCost,

    // Indicator modal
    indicatorModalVisible,
    setIndicatorModalVisible,
    currentSampleKey,
    setCurrentSampleKey,
    tempSelectedIndicators,
    setTempSelectedIndicators,
    selectedGroupFilter,
    setSelectedGroupFilter,
    indicatorSearchText,
    setIndicatorSearchText,
    groupSelectorVisible,
    setGroupSelectorVisible,
    groupSearchText,
    setGroupSearchText,

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

    // Location
    provinces,
    wards,
    setWards,

    // Helpers
    getIndicatorInfo,
    getFilteredIndicators,
    getFilteredGroupsWithIndicators,

    // Navigation
    navigate,
  };
};
