// @ts-nocheck
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Form,
  Input,
  DatePicker,
  Button,
  Card,
  message,
  Select,
  Row,
  Col,
  InputNumber,
  Divider,
  Typography,
  Checkbox,
  Radio,
  Table,
  Space,
  Popconfirm,
  TimePicker,
  TreeSelect,
  Modal,
  Tooltip,
  Popover,
  Tag,
  AutoComplete,
} from "antd";
import { PlusOutlined, DeleteOutlined, CloseOutlined } from "@ant-design/icons";
import { Icon } from "@iconify/react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

// RTK Query imports
import {
  useGetTestRequestQuery,
  useCreateTestRequestMutation,
  useUpdateTestRequestMutation,
} from "../../store/api/testRequestApi";
import {
  useGetActiveIndicatorGroupsQuery,
  useGetActiveIndicatorsQuery,
  useGetActiveStorageLocationsQuery,
  useGetActiveLaboratoriesQuery,
  IndicatorDto,
  IndicatorGroupDto,
  StorageLocationDto,
  LaboratoryDto,
} from "../../store/api/masterDataApi";
import { useGetUserLookupQuery, UserLookupDto } from "../../store/api/userApi";
import { useGetActiveOrganizationsQuery, OrganizationDto } from "../../store/api/organizationApi";
import {
  TestRequestStatus,
  ResultLanguage,
  SamplingRequirement,
  SampleStorageOption,
  SampleStatus,
  CreateTestRequestSampleDto,
  CreateTestRequestSampleIndicatorDto,
  UpdateTestRequestSampleDto,
  canEditTestRequest,
  canEditFullInfo,
} from "../../types/testRequest";
import dayjs from "dayjs";
import {
  getAllProvinces,
  getDistrictsByProvince,
  getWardsByDistrict,
  Province,
  District,
  Ward,
} from "../../utils/vietnamLocations";
import "./TestRequestForm.css";

const { TextArea } = Input;
const { Title, Text } = Typography;

interface SampleFormData {
  key: string;
  id?: string;
  sortOrder: number;
  sampleCode: string;
  sampleName: string;
  samplingAddress?: string;
  sampleQuantity?: string;
  status: SampleStatus;
  statusText?: string;
  processingStatus?: string;
  notes?: string;
  storageLocation?: string;
  indicatorIds: string[];
}

const TestRequestForm: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const isEditMode = !!id;

  // RTK Query hooks for master data
  const { data: indicatorGroupsData } = useGetActiveIndicatorGroupsQuery();
  const { data: indicatorsData } = useGetActiveIndicatorsQuery();
  const { data: storageLocationsData } = useGetActiveStorageLocationsQuery();
  const { data: laboratoriesData } = useGetActiveLaboratoriesQuery();
  const { data: usersData } = useGetUserLookupQuery();
  const { data: organizationsData } = useGetActiveOrganizationsQuery();

  // RTK Query hook for test request data (only in edit mode)
  const { data: testRequestData, isLoading: loadingData } = useGetTestRequestQuery(id!, { skip: !isEditMode });

  // Mutations
  const [createTestRequest] = useCreateTestRequestMutation();
  const [updateTestRequest] = useUpdateTestRequestMutation();

  // Memoized master data
  const indicatorGroups = useMemo(() => indicatorGroupsData || [], [indicatorGroupsData]);
  const indicators = useMemo(() => indicatorsData || [], [indicatorsData]);
  const storageLocations = useMemo(() => storageLocationsData?.items || [], [storageLocationsData]);
  const laboratories = useMemo(() => laboratoriesData || [], [laboratoriesData]);
  const users = useMemo(() => usersData || [], [usersData]);
  const organizations = useMemo(() => organizationsData || [], [organizationsData]);

  // Current status for field locking
  const [currentStatus, setCurrentStatus] = useState<TestRequestStatus | null>(null);

  // Helper to check if a field should be disabled based on status
  const isFieldLocked = (fieldName: string): boolean => {
    if (!isEditMode || currentStatus === null) return false;

    // Fields that are locked when status >= InProgress
    const lockedFields = [
      "contractNumber", "contractDate",
      "customerName", "address", "taxCode", "contactPerson", "phone",
      "provinceCode", "districtCode", "wardCode",
    ];

    if (!canEditFullInfo(currentStatus)) {
      return lockedFields.includes(fieldName);
    }
    return false;
  };

  // Check if samples section should be locked
  const isSamplesLocked = (): boolean => {
    if (!isEditMode || currentStatus === null) return false;
    return !canEditFullInfo(currentStatus);
  };

  // Sample table data
  const [samples, setSamples] = useState<SampleFormData[]>([]);

  // Local state for indicator tree and organization search
  const [indicatorTreeData, setIndicatorTreeData] = useState<any[]>([]);
  const [organizationOptions, setOrganizationOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [organizationSearching, setOrganizationSearching] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Costs
  const [totalSampleCost, setTotalSampleCost] = useState(0);

  // Method customer checkbox state
  const [methodCustomerChecked, setMethodCustomerChecked] = useState(false);

  // Indicator modal state
  const [indicatorModalVisible, setIndicatorModalVisible] = useState(false);
  const [currentSampleKey, setCurrentSampleKey] = useState<string | null>(null);
  const [tempSelectedIndicators, setTempSelectedIndicators] = useState<
    string[]
  >([]);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>("all");
  const [indicatorSearchText, setIndicatorSearchText] = useState<string>("");
  const [groupSelectorVisible, setGroupSelectorVisible] = useState(false);
  const [groupSearchText, setGroupSearchText] = useState<string>("");

  // Right panel state for dates and selection
  const [selectedIndicatorDates, setSelectedIndicatorDates] = useState<
    Record<string, { transferDate?: dayjs.Dayjs; requestDate?: dayjs.Dayjs }>
  >({});
  const [checkedIndicators, setCheckedIndicators] = useState<string[]>([]);

  // Expanded groups state for left panel - default all expanded
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  // Expanded groups state for group selector modal
  const [expandedGroupsInSelector, setExpandedGroupsInSelector] = useState<
    string[]
  >([]);

  // Laboratory (Khoa phòng) selection modal state
  const [laboratoryModalVisible, setLaboratoryModalVisible] = useState(false);
  const [selectedLaboratoryId, setSelectedLaboratoryId] = useState<
    string | null
  >(null);
  const [laboratoryRequestDate, setLaboratoryRequestDate] =
    useState<dayjs.Dayjs | null>(null);
  const [indicatorsToSend, setIndicatorsToSend] = useState<string[]>([]);
  // Store laboratory assignment for each indicator per sample: { sampleKey_indicatorId: { laboratoryId, laboratoryName, requestDate } }
  const [indicatorLaboratoryMap, setIndicatorLaboratoryMap] = useState<
    Record<string, { laboratoryId: string; laboratoryName: string; requestDate: dayjs.Dayjs }>
  >({});
  // Expanded laboratory groups in right panel
  const [expandedLabGroups, setExpandedLabGroups] = useState<string[]>([]);

  // Vietnam location states
  const [provinces] = useState<Province[]>(getAllProvinces());
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  // Set all groups expanded when indicatorGroups is loaded
  useEffect(() => {
    if (indicatorGroups.length > 0 && expandedGroups.length === 0) {
      setExpandedGroups(indicatorGroups.map((g) => g.id));
      setExpandedGroupsInSelector(indicatorGroups.map((g) => g.id));
    }
  }, [indicatorGroups]);

  // Load edit data when testRequestData is available
  useEffect(() => {
    if (isEditMode && testRequestData) {
      loadDataFromQuery(testRequestData);
    }
  }, [testRequestData, isEditMode]);

  // Build indicator tree data when indicators or groups change
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

  // Calculate total cost when samples change
  useEffect(() => {
    calculateTotalCost();
  }, [samples, indicators]);


  // Handle organization search for autocomplete with debounce
  const handleOrganizationSearch = (searchText: string) => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // If empty, clear options
    if (!searchText || searchText.trim().length < 1) {
      setOrganizationOptions([]);
      setOrganizationSearching(false);
      return;
    }

    setOrganizationSearching(true);

    // Debounce search - wait 300ms after user stops typing
    debounceTimerRef.current = setTimeout(() => {
      const filtered = organizations
        .filter((org) =>
          org.name.toLowerCase().includes(searchText.toLowerCase())
        )
        .slice(0, 20) // Limit to 20 results for performance
        .map((org) => ({ value: org.name, label: org.name }));

      setOrganizationOptions(filtered);
      setOrganizationSearching(false);
    }, 300);
  };

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const loadDataFromQuery = (data: any) => {
    // Set current status for field locking
    setCurrentStatus(data.status);

    // Check if request cannot be edited - redirect to detail page
    if (!canEditTestRequest(data.status)) {
      message.warning("Không thể chỉnh sửa phiếu ở trạng thái này");
      navigate(`/test-request/${id}`);
      return;
    }

    // Load districts and wards if province/district codes exist
    if (data.provinceCode) {
      const loadedDistricts = getDistrictsByProvince(data.provinceCode);
      setDistricts(loadedDistricts);

      if (data.districtCode) {
        const loadedWards = getWardsByDistrict(data.districtCode);
        setWards(loadedWards);
      }
    }

    form.setFieldsValue({
      ...data,
      contractDate: data.contractDate ? dayjs(data.contractDate) : null,
      requestDate: data.requestDate ? dayjs(data.requestDate) : null,
      expectedCompletionDate: data.expectedCompletionDate
        ? dayjs(data.expectedCompletionDate)
        : null,
      samplingDate: data.samplingDate ? dayjs(data.samplingDate) : null,
      samplingTime: data.samplingTime
        ? dayjs(data.samplingTime, "HH:mm")
        : null,
      sampleStorageEndDate: data.sampleStorageEndDate
        ? dayjs(data.sampleStorageEndDate)
        : null,
    });

    // Set methodCustomer checkbox state
    if (data.methodCustomer) {
      setMethodCustomerChecked(true);
    }

    // Load samples
    if (data.samples && data.samples.length > 0) {
      const sampleData: SampleFormData[] = data.samples.map(
        (sample, index) => ({
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
          indicatorIds:
            sample.indicators?.map((ind) => ind.indicatorId) || [],
        })
      );
      setSamples(sampleData);

      // Restore indicator dates, checked states, and laboratory assignments
      const restoredDates: Record<
        string,
        { transferDate?: dayjs.Dayjs; requestDate?: dayjs.Dayjs }
      > = {};
      const restoredChecked: string[] = [];
      const restoredLabMap: Record<
        string,
        { laboratoryId: string; laboratoryName: string; requestDate: dayjs.Dayjs }
      > = {};
      const expandedLabs: string[] = [];

      data.samples.forEach((sample: any, sampleIndex: number) => {
        // Use sample.id as key, or fallback to index-based key
        const sampleKey = sample.id || `sample-${sampleIndex}`;
        sample.indicators?.forEach((ind: any) => {
          restoredDates[ind.indicatorId] = {
            transferDate: ind.transferDate ? dayjs(ind.transferDate) : undefined,
            requestDate: ind.requestDate ? dayjs(ind.requestDate) : undefined,
          };
          if (ind.sentToDepartment) {
            restoredChecked.push(ind.indicatorId);
          }
          // Restore laboratory assignment - use sampleKey_indicatorId
          if (ind.laboratoryId && ind.laboratoryName) {
            restoredLabMap[`${sampleKey}_${ind.indicatorId}`] = {
              laboratoryId: ind.laboratoryId,
              laboratoryName: ind.laboratoryName,
              requestDate: ind.requestDate ? dayjs(ind.requestDate) : dayjs(),
            };
            // Auto-expand laboratory groups
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
  };

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

  const addSample = () => {
    // Block when samples are locked
    if (isSamplesLocked()) {
      message.warning("Không thể thêm mẫu khi phiếu đang thực hiện");
      return;
    }

    const newSample: SampleFormData = {
      key: `new-${Date.now()}`,
      sortOrder: samples.length + 1,
      sampleCode: "",
      sampleName: "",
      samplingAddress: "",
      sampleQuantity: "",
      status: SampleStatus.Normal,
      statusText: "",
      processingStatus: "",
      notes: "",
      storageLocation: "",
      indicatorIds: [],
    };
    setSamples([...samples, newSample]);
  };

  const removeSample = (key: string) => {
    // Block when samples are locked
    if (isSamplesLocked()) {
      message.warning("Không thể xóa mẫu khi phiếu đang thực hiện");
      return;
    }

    setSamples(samples.filter((s) => s.key !== key));
  };

  const updateSample = (
    key: string,
    field: keyof SampleFormData,
    value: any
  ) => {
    // Block when samples are locked
    if (isSamplesLocked()) {
      return; // Silently ignore updates when locked
    }

    setSamples(
      samples.map((s) => {
        if (s.key === key) {
          return { ...s, [field]: value };
        }
        return s;
      })
    );
  };

  // Indicator modal functions
  const openIndicatorModal = (sampleKey: string) => {
    // Block when samples are locked
    if (isSamplesLocked()) {
      message.warning("Không thể thay đổi chỉ tiêu khi phiếu đang thực hiện");
      return;
    }

    const sample = samples.find((s) => s.key === sampleKey);
    if (sample) {
      setCurrentSampleKey(sampleKey);
      setTempSelectedIndicators([...sample.indicatorIds]);
      setSelectedGroupFilter("all");
      setIndicatorModalVisible(true);
    }
  };

  const handleIndicatorModalOk = () => {
    // Validate: All indicators must be assigned to a laboratory
    const unsentIndicators = tempSelectedIndicators.filter(
      (id) => !indicatorLaboratoryMap[`${currentSampleKey}_${id}`]
    );
    if (unsentIndicators.length > 0) {
      message.warning(
        `Còn ${unsentIndicators.length} chỉ tiêu chưa được gửi đến khoa phòng. Vui lòng gửi tất cả chỉ tiêu trước khi lưu.`
      );
      return;
    }

    if (currentSampleKey) {
      updateSample(currentSampleKey, "indicatorIds", tempSelectedIndicators);
    }
    setIndicatorModalVisible(false);
    setCurrentSampleKey(null);
  };

  const handleIndicatorModalCancel = () => {
    setIndicatorModalVisible(false);
    setCurrentSampleKey(null);
    setTempSelectedIndicators([]);
  };

  const toggleIndicator = (indicatorId: string) => {
    setTempSelectedIndicators((prev) => {
      if (prev.includes(indicatorId)) {
        return prev.filter((id) => id !== indicatorId);
      } else {
        return [...prev, indicatorId];
      }
    });
  };

  // Remove indicator from sample directly
  const removeIndicatorFromSample = (
    sampleKey: string,
    indicatorId: string
  ) => {
    const sample = samples.find((s) => s.key === sampleKey);
    if (sample) {
      const newIndicatorIds = sample.indicatorIds.filter(
        (id) => id !== indicatorId
      );
      updateSample(sampleKey, "indicatorIds", newIndicatorIds);
    }
  };

  // Get indicator info by id
  const getIndicatorInfo = (indicatorId: string) => {
    return indicators.find((ind) => ind.id === indicatorId);
  };

  // Get filtered indicators for modal
  const getFilteredIndicators = () => {
    let filtered = indicators.filter((ind) => ind.isActive);

    if (selectedGroupFilter !== "all") {
      filtered = filtered.filter(
        (ind) => ind.indicatorGroupId === selectedGroupFilter
      );
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

  // Handle group selection from tree
  const handleGroupSelect = (groupId: string) => {
    setSelectedGroupFilter(groupId);
    setGroupSelectorVisible(false);
    setGroupSearchText("");
  };

  // Handle indicator date change
  const handleIndicatorDateChange = (
    indicatorId: string,
    field: "transferDate" | "requestDate",
    value: dayjs.Dayjs | null
  ) => {
    const currentDates = selectedIndicatorDates[indicatorId] || {};

    // Validate: transferDate không được lớn hơn requestDate
    if (field === "transferDate" && value && currentDates.requestDate) {
      if (value.isAfter(currentDates.requestDate)) {
        message.warning("Ngày chuyển giao không được lớn hơn ngày yêu cầu");
        return;
      }
    }
    if (field === "requestDate" && value && currentDates.transferDate) {
      if (value.isBefore(currentDates.transferDate)) {
        message.warning("Ngày yêu cầu không được nhỏ hơn ngày chuyển giao");
        return;
      }
    }

    setSelectedIndicatorDates((prev) => ({
      ...prev,
      [indicatorId]: {
        ...prev[indicatorId],
        [field]: value || undefined,
      },
    }));
  };

  // Handle checkbox toggle for right panel
  const toggleCheckedIndicator = (indicatorId: string) => {
    setCheckedIndicators((prev) => {
      if (prev.includes(indicatorId)) {
        return prev.filter((id) => id !== indicatorId);
      } else {
        return [...prev, indicatorId];
      }
    });
  };

  // Handle select all checkbox
  const handleSelectAllIndicators = (checked: boolean) => {
    if (checked) {
      setCheckedIndicators([...tempSelectedIndicators]);
    } else {
      setCheckedIndicators([]);
    }
  };

  // Handle send to laboratory - open laboratory selection modal
  const handleSendToLaboratory = () => {
    if (checkedIndicators.length === 0) {
      message.warning("Vui lòng chọn ít nhất một chỉ tiêu để gửi khoa phòng");
      return;
    }
    // Store selected indicators and open modal
    setIndicatorsToSend([...checkedIndicators]);
    setLaboratoryRequestDate(null);
    setSelectedLaboratoryId(null);
    setLaboratoryModalVisible(true);
  };

  // Handle confirm send to laboratory
  const handleConfirmSendToLaboratory = () => {
    if (!selectedLaboratoryId) {
      message.warning("Vui lòng chọn khoa phòng");
      return;
    }

    if (!laboratoryRequestDate) {
      message.warning("Vui lòng chọn ngày yêu cầu xong");
      return;
    }

    const selectedLab = laboratories.find((d) => d.id === selectedLaboratoryId);
    const labName = selectedLab?.name || "khoa phòng";

    // Update the requestDate for selected indicators
    setSelectedIndicatorDates((prev) => {
      const updated = { ...prev };
      indicatorsToSend.forEach((id) => {
        updated[id] = {
          ...updated[id],
          requestDate: laboratoryRequestDate,
        };
      });
      return updated;
    });

    // Store laboratory assignment for each indicator (per sample)
    setIndicatorLaboratoryMap((prev) => {
      const updated = { ...prev };
      indicatorsToSend.forEach((id) => {
        // Use sampleKey_indicatorId as key to allow different labs per sample
        const key = `${currentSampleKey}_${id}`;
        updated[key] = {
          laboratoryId: selectedLaboratoryId,
          laboratoryName: labName,
          requestDate: laboratoryRequestDate,
        };
      });
      return updated;
    });

    // Auto expand the laboratory group
    setExpandedLabGroups((prev) => {
      if (!prev.includes(selectedLaboratoryId)) {
        return [...prev, selectedLaboratoryId];
      }
      return prev;
    });

    message.success(
      `Đã gửi ${indicatorsToSend.length} chỉ tiêu đến ${labName}`
    );
    setLaboratoryModalVisible(false);
    setCheckedIndicators([]);
  };

  // Initialize dates for selected indicators
  const initializeIndicatorDates = () => {
    const today = dayjs();
    const newDates: Record<
      string,
      { transferDate?: dayjs.Dayjs; requestDate?: dayjs.Dayjs }
    > = {};
    tempSelectedIndicators.forEach((id) => {
      if (!selectedIndicatorDates[id]) {
        newDates[id] = { transferDate: today, requestDate: today };
      }
    });
    if (Object.keys(newDates).length > 0) {
      setSelectedIndicatorDates((prev) => ({ ...prev, ...newDates }));
    }
  };

  // Effect to initialize dates when modal opens
  useEffect(() => {
    if (indicatorModalVisible && tempSelectedIndicators.length > 0) {
      initializeIndicatorDates();
    }
  }, [indicatorModalVisible, tempSelectedIndicators]);

  const onFinish = async (values: any) => {
    if (samples.length === 0) {
      message.warning("Vui lòng thêm ít nhất một mẫu xét nghiệm");
      return;
    }

    // Validate samples
    const invalidSamples = samples.filter(
      (s) => !s.sampleCode || !s.sampleName
    );
    if (invalidSamples.length > 0) {
      message.warning(
        "Vui lòng điền đầy đủ mã mẫu và tên mẫu cho tất cả các mẫu"
      );
      return;
    }

    setSaving(true);
    try {
      // Build sample data
      const sampleDtos = samples.map((sample, index) => ({
        id: sample.id,
        sortOrder: index + 1,
        sampleCode: sample.sampleCode,
        sampleName: sample.sampleName,
        samplingAddress: sample.samplingAddress || undefined,
        sampleQuantity: sample.sampleQuantity || undefined,
        status: sample.status,
        statusText: sample.statusText || undefined,
        processingStatus: sample.processingStatus || undefined,
        notes: sample.notes || undefined,
        storageLocation: sample.storageLocation || undefined,
        indicators: sample.indicatorIds.map((indId) => {
          const indicatorDates = selectedIndicatorDates[indId];
          const indicator = indicators.find((i) => i.id === indId);
          // Use sampleKey_indicatorId to get lab assignment for this specific sample
          const labAssignment = indicatorLaboratoryMap[`${sample.key}_${indId}`];
          return {
            indicatorId: indId,
            laboratoryId: labAssignment?.laboratoryId || undefined,
            unitPrice: indicator?.unitPrice || 0,
            transferDate:
              indicatorDates?.transferDate?.toISOString() || undefined,
            requestDate: labAssignment?.requestDate?.toISOString() ||
              indicatorDates?.requestDate?.toISOString() || undefined,
            sentToDepartment: !!labAssignment || checkedIndicators.includes(indId),
          };
        }),
      }));

      // Get location names from codes
      const selectedProvince = provinces.find(
        (p) => p.code === values.provinceCode
      );
      const selectedDistrict = districts.find(
        (d) => d.code === values.districtCode
      );
      const selectedWard = wards.find((w) => w.code === values.wardCode);

      const payload = {
        // Contract info
        contractNumber: values.contractNumber || undefined,
        contractDate: values.contractDate
          ? values.contractDate.toISOString()
          : undefined,
        sentToAccounting: values.sentToAccounting || false,
        paymentReceived: values.paymentReceived || false,
        sentToDepartment: values.sentToDepartment || false,
        resultReturned: values.resultReturned || false,
        customerName: values.customerName,
        provinceCode: values.provinceCode || undefined,
        province: selectedProvince?.name || undefined,
        districtCode: values.districtCode || undefined,
        district: selectedDistrict?.name || undefined,
        wardCode: values.wardCode || undefined,
        ward: selectedWard?.name || undefined,
        address: values.address || undefined,
        taxCode: values.taxCode || undefined,
        contactPerson: values.contactPerson || undefined,
        phone: values.phone || undefined,

        // Sample count
        totalSampleCount: samples.length,

        // Testing method info
        methodWestHighlandInstitute:
          values.methodWestHighlandInstitute || false,
        methodCustomer: methodCustomerChecked,
        methodCustomerDetail: methodCustomerChecked
          ? values.methodCustomerDetail
          : undefined,
        resultLanguage: values.resultLanguage ?? ResultLanguage.Vietnamese,
        resultCopyCount: values.resultCopyCount || undefined,
        separatePassedResults: values.separatePassedResults || false,
        conformityDeclaration: values.conformityDeclaration || undefined,
        otherRequirements: values.otherRequirements || undefined,
        subContract: values.subContract || undefined,
        samplingRequirement:
          values.samplingRequirement ?? SamplingRequirement.CustomerSampling,
        deliveryDirectPickup: values.deliveryDirectPickup || false,
        deliveryPostal: values.deliveryPostal || false,
        returnStoredSample: values.returnStoredSample || false,
        sampleTypeService: values.sampleTypeService || false,
        sampleTypeContract: values.sampleTypeContract || false,
        sampleTypeTask: values.sampleTypeTask || false,
        sampleTypeSubContract: values.sampleTypeSubContract || false,
        resultDeliveryDate: values.expectedCompletionDate
          ? values.expectedCompletionDate.toISOString()
          : undefined,
        sampleStorage: values.sampleStorageOption ?? SampleStorageOption.No,
        totalCost: totalSampleCost,
        totalCostInWords: values.totalCostInWords || undefined,
        receiptNumber: values.receiptNumber || undefined,

        // User references
        supervisorId: values.supervisorId || undefined,
        directorId: values.directorId || undefined,
        changeRequest: values.changeRequest || undefined,
        agreeTerms: values.agreeTerms || false,

        // Legacy fields
        requestDate: values.requestDate
          ? values.requestDate.toISOString()
          : new Date().toISOString(),
        notes: values.notes || undefined,
        expectedCompletionDate: values.expectedCompletionDate
          ? values.expectedCompletionDate.toISOString()
          : undefined,
        subcontractor: values.subcontractor || undefined,

        // Samples
        samples: sampleDtos,
      };

      if (isEditMode && id) {
        await updateTestRequest({ id, data: payload }).unwrap();
        message.success("Cập nhật yêu cầu thành công!");
      } else {
        await createTestRequest(payload).unwrap();
        message.success("Tạo yêu cầu thành công!");
      }
      navigate("/requests");
    } catch (error: any) {
      console.error("Failed to save test request:", error);
      message.error(
        error.data?.error?.message ||
          "Không thể lưu yêu cầu. Vui lòng thử lại."
      );
    } finally {
      setSaving(false);
    }
  };

  // Sample table columns
  const sampleColumns = [
    {
      title: "STT",
      dataIndex: "sortOrder",
      key: "sortOrder",
      width: 60,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: "Mã mẫu *",
      dataIndex: "sampleCode",
      key: "sampleCode",
      width: 120,
      render: (value: string, record: SampleFormData) => (
        <Input
          value={value}
          onChange={(e) =>
            updateSample(record.key, "sampleCode", e.target.value)
          }
          placeholder="Mã mẫu"
          size="small"
        />
      ),
    },
    {
      title: "Tên mẫu *",
      dataIndex: "sampleName",
      key: "sampleName",
      width: 180,
      render: (value: string, record: SampleFormData) => (
        <Input
          value={value}
          onChange={(e) =>
            updateSample(record.key, "sampleName", e.target.value)
          }
          placeholder="Tên mẫu"
          size="small"
        />
      ),
    },
    {
      title: "Địa chỉ lấy mẫu",
      dataIndex: "samplingAddress",
      key: "samplingAddress",
      width: 200,
      render: (value: string, record: SampleFormData) => (
        <Input
          value={value}
          onChange={(e) =>
            updateSample(record.key, "samplingAddress", e.target.value)
          }
          placeholder="Địa chỉ"
          size="small"
        />
      ),
    },
    {
      title: <span style={{ whiteSpace: "nowrap" }}>Lượng mẫu</span>,
      dataIndex: "sampleQuantity",
      key: "sampleQuantity",
      width: 90,
      render: (value: string, record: SampleFormData) => (
        <Input
          value={value}
          onChange={(e) =>
            updateSample(record.key, "sampleQuantity", e.target.value)
          }
          placeholder="Số lượng"
          size="small"
        />
      ),
    },
    {
      title: "Tình trạng mẫu",
      dataIndex: "statusText",
      key: "statusText",
      width: 140,
      render: (value: string, record: SampleFormData) => (
        <Input
          value={value}
          onChange={(e) =>
            updateSample(record.key, "statusText", e.target.value)
          }
          placeholder="Tình trạng"
          size="small"
        />
      ),
    },
    {
      title: <span style={{ whiteSpace: "nowrap" }}>Chỉ tiêu kiểm nghiệm</span>,
      dataIndex: "indicatorIds",
      key: "indicatorIds",
      width: 280,
      render: (value: string[], record: SampleFormData) => {
        // Group indicators by laboratory - use sampleKey_indicatorId
        const unsentIndicators = value.filter((id) => !indicatorLaboratoryMap[`${record.key}_${id}`]);
        const sentIndicators = value.filter((id) => indicatorLaboratoryMap[`${record.key}_${id}`]);
        const groupedByLab: Record<string, { labName: string; indicators: string[] }> = {};
        sentIndicators.forEach((id) => {
          const labInfo = indicatorLaboratoryMap[`${record.key}_${id}`];
          if (!groupedByLab[labInfo.laboratoryId]) {
            groupedByLab[labInfo.laboratoryId] = {
              labName: labInfo.laboratoryName,
              indicators: [],
            };
          }
          groupedByLab[labInfo.laboratoryId].indicators.push(id);
        });

        const popoverContent = (
          <div style={{ maxHeight: 300, overflowY: "auto", minWidth: 280 }}>
            {value.length === 0 ? (
              <Text type="secondary">Chưa chọn chỉ tiêu nào</Text>
            ) : (
              <>
                {/* Unsent indicators */}
                {unsentIndicators.map((indId, idx) => {
                  const ind = getIndicatorInfo(indId);
                  return ind ? (
                    <div
                      key={indId}
                      style={{
                        padding: "4px 0",
                        borderBottom: "1px solid #f0f0f0",
                      }}
                    >
                      <span>- {ind.name}</span>
                    </div>
                  ) : null;
                })}
                {/* Grouped by laboratory */}
                {Object.entries(groupedByLab).map(([labId, { labName, indicators }]) => (
                  <div key={labId}>
                    <div
                      style={{
                        padding: "6px 0 4px 0",
                        fontWeight: 600,
                        fontSize: 13,
                        color: "#000",
                        borderBottom: "1px solid #f0f0f0",
                        marginTop: unsentIndicators.length > 0 ? 8 : 0,
                      }}
                    >
                      {labName} ({indicators.length})
                    </div>
                    {indicators.map((indId) => {
                      const ind = getIndicatorInfo(indId);
                      return ind ? (
                        <div
                          key={indId}
                          style={{
                            padding: "4px 0 4px 12px",
                            borderBottom: "1px solid #f0f0f0",
                          }}
                        >
                          <span>- {ind.name}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                ))}
              </>
            )}
          </div>
        );

        return (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {value.length > 0 ? (
              <Popover
                content={popoverContent}
                title={`Chỉ tiêu kiểm nghiệm (${value.length})`}
                trigger="click"
                placement="bottomLeft"
              >
                <Button
                  type="text"
                  icon={<Icon icon="mdi:clipboard-check-outline" width={20} />}
                  style={{
                    color: "#000",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: "100%",
                    padding: 0,
                  }}
                />
              </Popover>
            ) : (
              <Text
                type="secondary"
                style={{ fontSize: 12, width: "100%", textAlign: "center" }}
              >
                Chưa chọn
              </Text>
            )}
            <Tooltip title="Thêm chỉ tiêu">
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => openIndicatorModal(record.key)}
                style={{ flexShrink: 0 }}
              />
            </Tooltip>
          </div>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "processingStatus",
      key: "processingStatus",
      width: 140,
      render: (value: string, record: SampleFormData) => (
        <Select
          value={value}
          onChange={(v) => updateSample(record.key, "processingStatus", v)}
          placeholder="Chọn..."
          size="small"
          style={{ width: "100%" }}
          allowClear
        >
          <Select.Option value="Đã nhận">Đã nhận</Select.Option>
          <Select.Option value="Đang thử nghiệm">Đang thử nghiệm</Select.Option>
          <Select.Option value="Hoàn thành">Hoàn thành</Select.Option>
          <Select.Option value="Trả kết quả">Trả kết quả</Select.Option>
        </Select>
      ),
    },
    {
      title: "Ghi chú",
      dataIndex: "notes",
      key: "notes",
      width: 150,
      render: (value: string, record: SampleFormData) => (
        <Input
          value={value}
          onChange={(e) => updateSample(record.key, "notes", e.target.value)}
          placeholder="Ghi chú"
          size="small"
        />
      ),
    },
    {
      title: "",
      key: "actions",
      width: 50,
      fixed: "right" as const,
      render: (_: any, record: SampleFormData) => (
        <Popconfirm
          title="Xóa mẫu này?"
          onConfirm={() => removeSample(record.key)}
          okText="Xóa"
          cancelText="Hủy"
        >
          <Button type="link" danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Card
      className="test-request-form"
      title={
        isEditMode
          ? "Chỉnh sửa yêu cầu thử nghiệm"
          : "Tạo yêu cầu thử nghiệm mới"
      }
      loading={loadingData}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          requestDate: dayjs(),
          status: TestRequestStatus.Pending,
          resultLanguage: ResultLanguage.Vietnamese,
          samplingRequirement: SamplingRequirement.CustomerSampling,
          sampleStorageOption: SampleStorageOption.No,
        }}
      >
        {/* Thông tin hợp đồng */}
        <div className="form-section">
          <Title level={5} className="section-title">
            Thông tin hợp đồng
          </Title>
          <Row gutter={[16, 8]} align="middle">
            <Col xs={24} sm={12} md={12} lg={4}>
              <Form.Item
                name="contractNumber"
                label="Số HĐ"
                style={{ marginBottom: 0 }}
                rules={[{ required: true, message: "Vui lòng nhập số HĐ" }]}
              >
                <Input placeholder="Số hợp đồng" disabled={isFieldLocked("contractNumber")} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={12} lg={4}>
              <Form.Item
                name="contractDate"
                label="Ngày HĐ"
                style={{ marginBottom: 0 }}
                rules={[{ required: true, message: "Vui lòng chọn ngày HĐ" }]}
              >
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" disabled={isFieldLocked("contractDate")} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={16}>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "12px",
                  paddingTop: "30px",
                }}
              >
                <Form.Item
                  name="sentToAccounting"
                  valuePropName="checked"
                  style={{ marginBottom: 0 }}
                >
                  <Checkbox>Gửi kế toán</Checkbox>
                </Form.Item>
                <Form.Item
                  name="paymentReceived"
                  valuePropName="checked"
                  style={{ marginBottom: 0 }}
                >
                  <Checkbox>Đã thu tiền</Checkbox>
                </Form.Item>
                <Form.Item
                  name="sentToDepartment"
                  valuePropName="checked"
                  style={{ marginBottom: 0 }}
                >
                  <Checkbox>Gửi khoa phòng</Checkbox>
                </Form.Item>
                <Form.Item
                  name="resultReturned"
                  valuePropName="checked"
                  style={{ marginBottom: 0 }}
                >
                  <Checkbox>Trả kết quả</Checkbox>
                </Form.Item>
              </div>
            </Col>
          </Row>
        </div>

        {/* Thông tin khách hàng */}
        <div className="form-section">
          <Title level={5} className="section-title">
            Thông tin khách hàng
          </Title>
          <Row gutter={[16, 8]}>
            <Col xs={24} sm={24} lg={12}>
              <Form.Item
                name="customerName"
                label="Tên CS/DN"
                rules={[
                  { required: true, message: "Vui lòng nhập tên khách hàng" },
                ]}
              >
                <AutoComplete
                  options={organizationOptions}
                  onSearch={handleOrganizationSearch}
                  placeholder="Nhập tên cơ sở / doanh nghiệp..."
                  filterOption={false}
                  disabled={isFieldLocked("customerName")}
                  notFoundContent={
                    organizationSearching ? (
                      <span style={{ color: "#999" }}>Đang tìm kiếm...</span>
                    ) : organizationOptions.length === 0 ? null : (
                      <span style={{ color: "#999" }}>
                        Không tìm thấy kết quả
                      </span>
                    )
                  }
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8} lg={4}>
              <Form.Item
                name="provinceCode"
                label="Tỉnh thành"
                rules={[
                  { required: true, message: "Vui lòng chọn tỉnh thành" },
                ]}
              >
                <Select
                  placeholder="Chọn tỉnh thành"
                  allowClear
                  showSearch
                  optionFilterProp="children"
                  disabled={isFieldLocked("provinceCode")}
                  filterOption={(input, option) =>
                    (option?.children as unknown as string)
                      ?.toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  onChange={(value) => {
                    form.setFieldsValue({
                      districtCode: undefined,
                      wardCode: undefined,
                    });
                    setWards([]);
                    if (value) {
                      setDistricts(getDistrictsByProvince(value));
                    } else {
                      setDistricts([]);
                    }
                  }}
                >
                  {provinces.map((p) => (
                    <Select.Option key={p.code} value={p.code}>
                      {p.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={8} lg={4}>
              <Form.Item
                name="districtCode"
                label="Quận huyện"
                rules={[
                  { required: true, message: "Vui lòng chọn quận huyện" },
                ]}
              >
                <Select
                  placeholder="Chọn quận/huyện"
                  allowClear
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.children as unknown as string)
                      ?.toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  disabled={districts.length === 0 || isFieldLocked("districtCode")}
                  onChange={(value) => {
                    form.setFieldsValue({ wardCode: undefined });
                    if (value) {
                      setWards(getWardsByDistrict(value));
                    } else {
                      setWards([]);
                    }
                  }}
                >
                  {districts.map((d) => (
                    <Select.Option key={d.code} value={d.code}>
                      {d.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={8} lg={4}>
              <Form.Item
                name="wardCode"
                label="Phường xã"
                rules={[{ required: true, message: "Vui lòng chọn phường xã" }]}
              >
                <Select
                  placeholder="Chọn phường/xã"
                  allowClear
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.children as unknown as string)
                      ?.toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  disabled={wards.length === 0 || isFieldLocked("wardCode")}
                >
                  {wards.map((w) => (
                    <Select.Option key={w.code} value={w.code}>
                      {w.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 8]}>
            <Col xs={24} sm={24} lg={12}>
              <Form.Item
                name="address"
                label="Địa chỉ"
                rules={[{ required: true, message: "Vui lòng nhập địa chỉ" }]}
              >
                <Input placeholder="Địa chỉ chi tiết" disabled={isFieldLocked("address")} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8} lg={4}>
              <Form.Item
                name="taxCode"
                label="Mã số thuế"
                rules={[
                  { required: true, message: "Vui lòng nhập mã số thuế" },
                ]}
              >
                <Input placeholder="MST" disabled={isFieldLocked("taxCode")} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8} lg={4}>
              <Form.Item
                name="contactPerson"
                label="Người LH"
                rules={[
                  { required: true, message: "Vui lòng nhập người liên hệ" },
                ]}
              >
                <Input placeholder="Người liên hệ" disabled={isFieldLocked("contactPerson")} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8} lg={4}>
              <Form.Item
                name="phone"
                label="Điện thoại"
                rules={[
                  { required: true, message: "Vui lòng nhập số điện thoại" },
                  {
                    pattern: /^(0|\+84)[0-9]{9,10}$/,
                    message: "Số điện thoại không hợp lệ",
                  },
                ]}
              >
                <Input placeholder="SĐT" disabled={isFieldLocked("phone")} />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* Bảng thông tin mẫu */}
        <div className="form-section">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Title
              level={5}
              className="section-title"
              style={{
                marginBottom: 0,
                borderBottom: "none",
                paddingBottom: 0,
              }}
            >
              Thông tin mẫu ({samples.length} mẫu)
            </Title>
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={addSample}
              disabled={isSamplesLocked()}
              title={isSamplesLocked() ? "Không thể thêm mẫu khi đang thực hiện" : ""}
            >
              Thêm mẫu
            </Button>
          </div>

          {isSamplesLocked() && (
            <div style={{ marginBottom: 12, padding: "8px 16px", background: "#fff7e6", borderRadius: 4, border: "1px solid #ffd591" }}>
              <Text type="warning">
                Không thể thêm/sửa/xóa mẫu khi phiếu đang thực hiện. Chỉ có thể sửa các thông tin khác.
              </Text>
            </div>
          )}

          <Table
            dataSource={samples}
            columns={sampleColumns}
            pagination={false}
            scroll={{ x: 1500 }}
            size="small"
            bordered
            locale={{ emptyText: 'Chưa có mẫu nào. Nhấn "Thêm mẫu" để thêm.' }}
          />
        </div>

        {/* Loại hình mẫu */}
        <div className="form-section">
          <Title level={5} className="section-title">
            Loại hình mẫu
          </Title>
          <Row gutter={[16, 8]}>
            <Col xs={24}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
                <Form.Item
                  name="sampleTypeService"
                  valuePropName="checked"
                  style={{ marginBottom: 0 }}
                >
                  <Checkbox>Dịch vụ</Checkbox>
                </Form.Item>
                <Form.Item
                  name="sampleTypeContract"
                  valuePropName="checked"
                  style={{ marginBottom: 0 }}
                >
                  <Checkbox>Hợp đồng</Checkbox>
                </Form.Item>
                <Form.Item
                  name="sampleTypeTask"
                  valuePropName="checked"
                  style={{ marginBottom: 0 }}
                >
                  <Checkbox>Mẫu nhiệm vụ</Checkbox>
                </Form.Item>
                <Form.Item
                  name="sampleTypeSubContract"
                  valuePropName="checked"
                  style={{ marginBottom: 0 }}
                >
                  <Checkbox>Hợp đồng phụ</Checkbox>
                </Form.Item>
              </div>
            </Col>
          </Row>
          <Row gutter={[16, 8]} style={{ marginTop: 12 }}>
            <Col xs={24} sm={12}>
              <Row align="middle">
                <Col xs={10} sm={8}>
                  <Text>Hợp đồng phụ:</Text>
                </Col>
                <Col xs={14} sm={16}>
                  <Form.Item name="subContract" style={{ marginBottom: 0 }}>
                    <Input size="small" placeholder="Tên thầu phụ..." />
                  </Form.Item>
                </Col>
              </Row>
            </Col>
          </Row>
        </div>

        <Row gutter={[16, 0]}>
          {/* CỘT TRÁI */}
          <Col xs={24} lg={12}>
            {/* Yêu cầu về phương pháp */}
            <div className="form-section">
              <Title level={5} className="section-title">
                Yêu cầu về phương pháp
              </Title>
              <Row gutter={[16, 12]}>
                <Col xs={24}>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "16px",
                      alignItems: "center",
                    }}
                  >
                    <Form.Item
                      name="methodWestHighlandInstitute"
                      valuePropName="checked"
                      style={{ marginBottom: 0 }}
                    >
                      <Checkbox>Viện KHKT NN Tây Nguyên</Checkbox>
                    </Form.Item>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 8,
                      }}
                    >
                      <Checkbox
                        checked={methodCustomerChecked}
                        onChange={(e) =>
                          setMethodCustomerChecked(e.target.checked)
                        }
                      >
                        Theo yêu cầu KH
                      </Checkbox>
                      <Form.Item
                        name="methodCustomerDetail"
                        style={{ marginBottom: 0 }}
                      >
                        <Input
                          placeholder="Chi tiết..."
                          disabled={!methodCustomerChecked}
                          style={{ width: 150 }}
                          size="small"
                        />
                      </Form.Item>
                    </span>
                  </div>
                </Col>
              </Row>
            </div>

            {/* Yêu cầu về kết quả */}
            <div className="form-section">
              <Title level={5} className="section-title">
                Yêu cầu về kết quả
              </Title>
              <Row gutter={[16, 12]}>
                <Col xs={24} sm={12}>
                  <Row align="middle">
                    <Col xs={10}>
                      <Text>Ngôn ngữ:</Text>
                    </Col>
                    <Col xs={14}>
                      <Form.Item
                        name="resultLanguage"
                        style={{ marginBottom: 0 }}
                      >
                        <Radio.Group
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                          }}
                        >
                          <Radio value={ResultLanguage.Vietnamese}>
                            Tiếng Việt
                          </Radio>
                          <Radio value={ResultLanguage.English}>
                            Tiếng Anh
                          </Radio>
                          <Radio value={ResultLanguage.VietnameseAndEnglish}>
                            Việt/Anh
                          </Radio>
                        </Radio.Group>
                      </Form.Item>
                    </Col>
                  </Row>
                </Col>
                <Col xs={24} sm={12}>
                  <Row align="middle" style={{ marginBottom: 8 }}>
                    <Col xs={10}>
                      <Text>Số bản:</Text>
                    </Col>
                    <Col xs={14}>
                      <Form.Item
                        name="resultCopyCount"
                        style={{ marginBottom: 0 }}
                      >
                        <Input size="small" style={{ width: 80 }} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item
                    name="separatePassedResults"
                    valuePropName="checked"
                    style={{ marginBottom: 0 }}
                  >
                    <Checkbox>Tách riêng CT đạt</Checkbox>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={[16, 8]} style={{ marginTop: 12 }}>
                <Col xs={24} sm={12}>
                  <Row align="middle">
                    <Col xs={10}>
                      <Text>Công bố hợp quy:</Text>
                    </Col>
                    <Col xs={14}>
                      <Form.Item
                        name="conformityDeclaration"
                        style={{ marginBottom: 0 }}
                      >
                        <Input size="small" />
                      </Form.Item>
                    </Col>
                  </Row>
                </Col>
                <Col xs={24} sm={12}>
                  <Row align="middle">
                    <Col xs={10}>
                      <Text>Yêu cầu khác:</Text>
                    </Col>
                    <Col xs={14}>
                      <Form.Item
                        name="otherRequirements"
                        style={{ marginBottom: 0 }}
                      >
                        <Input size="small" />
                      </Form.Item>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </div>

            {/* Yêu cầu về lấy mẫu & giao trả */}
            <div className="form-section">
              <Title level={5} className="section-title">
                Yêu cầu về lấy mẫu & giao trả
              </Title>
              <Row gutter={[16, 12]}>
                <Col xs={24} sm={12}>
                  <Row align="middle">
                    <Col xs={10}>
                      <Text>Lấy mẫu:</Text>
                    </Col>
                    <Col xs={14}>
                      <Form.Item
                        name="samplingRequirement"
                        style={{ marginBottom: 0 }}
                      >
                        <Radio.Group
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                          }}
                        >
                          <Radio value={SamplingRequirement.LabSampling}>
                            TTKN lấy mẫu
                          </Radio>
                          <Radio value={SamplingRequirement.CustomerSampling}>
                            KH tự lấy mẫu
                          </Radio>
                        </Radio.Group>
                      </Form.Item>
                    </Col>
                  </Row>
                </Col>
                <Col xs={24} sm={12}>
                  <Row align="middle">
                    <Col xs={10}>
                      <Text>Lưu mẫu:</Text>
                    </Col>
                    <Col xs={14}>
                      <Form.Item
                        name="sampleStorageOption"
                        style={{ marginBottom: 0 }}
                      >
                        <Radio.Group
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                          }}
                        >
                          <Radio value={SampleStorageOption.No}>Không</Radio>
                          <Radio value={SampleStorageOption.Yes}>
                            Có (theo QĐ của TT)
                          </Radio>
                        </Radio.Group>
                      </Form.Item>
                    </Col>
                  </Row>
                </Col>
              </Row>
              <Row gutter={[16, 8]} style={{ marginTop: 12 }}>
                <Col xs={24}>
                  <div
                    style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}
                  >
                    <Form.Item
                      name="deliveryDirectPickup"
                      valuePropName="checked"
                      style={{ marginBottom: 0 }}
                    >
                      <Checkbox>Nhận trực tiếp</Checkbox>
                    </Form.Item>
                    <Form.Item
                      name="deliveryPostal"
                      valuePropName="checked"
                      style={{ marginBottom: 0 }}
                    >
                      <Checkbox>Gửi bưu điện</Checkbox>
                    </Form.Item>
                    <Form.Item
                      name="returnStoredSample"
                      valuePropName="checked"
                      style={{ marginBottom: 0 }}
                    >
                      <Checkbox>Trả lại mẫu lưu</Checkbox>
                    </Form.Item>
                  </div>
                </Col>
              </Row>
              <Row gutter={[16, 8]} style={{ marginTop: 12 }}>
                <Col xs={24} sm={12}>
                  <Row align="middle">
                    <Col xs={10}>
                      <Text>Ngày trả KQ:</Text>
                    </Col>
                    <Col xs={14}>
                      <Form.Item
                        name="expectedCompletionDate"
                        style={{ marginBottom: 0 }}
                      >
                        <DatePicker
                          format="DD/MM/YYYY"
                          style={{ width: "100%" }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </div>
          </Col>

          {/* CỘT PHẢI */}
          <Col xs={24} lg={12}>
            {/* Thông tin chi phí */}
            <div className="form-section">
              <Title level={5} className="section-title">
                Thông tin chi phí
              </Title>
              <Row gutter={[16, 12]}>
                <Col xs={24}>
                  <div
                    style={{
                      background: "#e6f7ff",
                      padding: "16px",
                      borderRadius: 8,
                      border: "1px solid #91d5ff",
                      textAlign: "center",
                    }}
                  >
                    <Text
                      type="secondary"
                      style={{ display: "block", marginBottom: 4 }}
                    >
                      Tổng chi phí:
                    </Text>
                    <Text strong style={{ fontSize: 24, color: "#1890ff" }}>
                      {totalSampleCost.toLocaleString("vi-VN")} đ
                    </Text>
                  </div>
                </Col>
                <Col xs={24}>
                  <Row align="middle">
                    <Col xs={6}>
                      <Text>Bằng chữ:</Text>
                    </Col>
                    <Col xs={18}>
                      <Form.Item
                        name="totalCostInWords"
                        style={{ marginBottom: 0 }}
                      >
                        <Input
                          size="small"
                          placeholder="Nhập số tiền bằng chữ..."
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </Col>
                <Col xs={24}>
                  <Row align="middle">
                    <Col xs={6}>
                      <Text>Số phiếu thu:</Text>
                    </Col>
                    <Col xs={18}>
                      <Form.Item
                        name="receiptNumber"
                        style={{ marginBottom: 0 }}
                      >
                        <Input
                          size="small"
                          placeholder="Số phiếu thu TTDV..."
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </div>

            {/* Người phụ trách */}
            <div className="form-section">
              <Title level={5} className="section-title">
                Người phụ trách
              </Title>
              <Row gutter={[16, 12]}>
                <Col xs={24}>
                  <Row align="middle">
                    <Col xs={6}>
                      <Text>Người giám sát: <span style={{ color: '#ff4d4f' }}>*</span></Text>
                    </Col>
                    <Col xs={18}>
                      <Form.Item
                        name="supervisorId"
                        style={{ marginBottom: 0 }}
                        rules={[
                          {
                            required: true,
                            message: "Vui lòng chọn người phụ trách",
                          },
                        ]}
                      >
                        <Select
                          placeholder="Chọn người phụ trách..."
                          allowClear
                          showSearch
                          optionFilterProp="children"
                          filterOption={(input, option) =>
                            (option?.children as unknown as string)
                              ?.toLowerCase()
                              .includes(input.toLowerCase())
                          }
                          style={{ width: "100%" }}
                        >
                          {users.map((user) => (
                            <Select.Option key={user.id} value={user.id}>
                              {user.displayName || user.userName}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                </Col>
                <Col xs={24}>
                  <Row align="middle">
                    <Col xs={6}>
                      <Text>Giám đốc: <span style={{ color: '#ff4d4f' }}>*</span></Text>
                    </Col>
                    <Col xs={18}>
                      <Form.Item
                        name="directorId"
                        style={{ marginBottom: 0 }}
                        rules={[
                          {
                            required: true,
                            message: "Vui lòng chọn GĐ Trung tâm",
                          },
                        ]}
                      >
                        <Select
                          placeholder="Chọn GĐ Trung tâm..."
                          allowClear
                          showSearch
                          optionFilterProp="children"
                          filterOption={(input, option) =>
                            (option?.children as unknown as string)
                              ?.toLowerCase()
                              .includes(input.toLowerCase())
                          }
                          style={{ width: "100%" }}
                        >
                          {users.map((user) => (
                            <Select.Option key={user.id} value={user.id}>
                              {user.displayName || user.userName}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </div>

            {/* Thông tin khác */}
            <div className="form-section">
              <Title level={5} className="section-title">
                Thông tin khác
              </Title>
              <Row gutter={[16, 12]}>
                <Col xs={24}>
                  <Row align="middle">
                    <Col xs={6}>
                      <Text>Thay đổi YC:</Text>
                    </Col>
                    <Col xs={18}>
                      <Form.Item
                        name="changeRequest"
                        style={{ marginBottom: 0 }}
                      >
                        <Input size="small" placeholder="Nếu có..." />
                      </Form.Item>
                    </Col>
                  </Row>
                </Col>
                <Col xs={24}>
                  <Form.Item
                    name="agreeTerms"
                    valuePropName="checked"
                    style={{ marginBottom: 0 }}
                  >
                    <Checkbox>
                      Đã đọc và đồng ý với quy định chung về yêu cầu dịch vụ thử
                      nghiệm
                    </Checkbox>
                  </Form.Item>
                </Col>
              </Row>
            </div>
          </Col>
        </Row>

        {/* Hidden fields for legacy support */}
        <Form.Item name="requestDate" hidden>
          <DatePicker />
        </Form.Item>
        <Form.Item name="status" hidden>
          <Select />
        </Form.Item>
        <Form.Item name="customerEmail" hidden>
          <Input />
        </Form.Item>

        <Divider />

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={saving}>
              {isEditMode ? "Cập nhật" : "Tạo yêu cầu"}
            </Button>
            <Button onClick={() => navigate("/requests")}>Hủy</Button>
          </Space>
        </Form.Item>
      </Form>

      {/* Group Selector Modal */}
      <Modal
        title={
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span style={{ fontSize: 16, fontWeight: 600 }}>Nhóm chỉ tiêu</span>
            <Input.Search
              placeholder="Tìm kiếm nhóm chỉ tiêu..."
              value={groupSearchText}
              onChange={(e) => setGroupSearchText(e.target.value)}
              onSearch={(value) => setGroupSearchText(value)}
              allowClear
              enterButton="Tìm"
              style={{ width: "100%" }}
            />
          </div>
        }
        open={groupSelectorVisible}
        onCancel={() => {
          setGroupSelectorVisible(false);
          setGroupSearchText("");
        }}
        closeIcon={null}
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={() => {
              setGroupSelectorVisible(false);
              setGroupSearchText("");
            }}
          >
            Đóng
          </Button>,
          <Button
            key="clear"
            onClick={(e) => {
              e.stopPropagation();
              setGroupSearchText("");
              setSelectedGroupFilter("all");
              setGroupSelectorVisible(false);
            }}
            style={{ marginLeft: 8, borderColor: "#faad14", color: "#faad14" }}
          >
            Bỏ lọc
          </Button>,
        ]}
        width={750}
        centered
        styles={{
          body: { padding: 0, maxHeight: 550, overflowY: "auto" },
          wrapper: { maxWidth: "100%" },
        }}
      >
        <div style={{ borderTop: "1px solid #f0f0f0" }}>
          {/* Option: Hiển thị tất cả - Checkbox to expand all */}
          <div
            style={{
              padding: "12px 16px",
              cursor: "pointer",
              background: "#fafafa",
              borderBottom: "1px solid #f0f0f0",
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontWeight: 500,
              fontSize: 14,
            }}
            onClick={() => {
              // Toggle expand all groups
              if (expandedGroupsInSelector.length === indicatorGroups.length) {
                setExpandedGroupsInSelector([]);
              } else {
                setExpandedGroupsInSelector(indicatorGroups.map((g) => g.id));
              }
            }}
          >
            <Checkbox
              checked={
                expandedGroupsInSelector.length === indicatorGroups.length
              }
              indeterminate={
                expandedGroupsInSelector.length > 0 &&
                expandedGroupsInSelector.length < indicatorGroups.length
              }
            />
            <Icon
              icon="mdi:unfold-more-horizontal"
              width={20}
              style={{ color: "#1890ff" }}
            />
            <span style={{ color: "#1890ff" }}>Hiển thị tất cả</span>
          </div>
          {/* Groups tree view */}
          {getFilteredGroupsWithIndicators().map((group, groupIndex) => {
            const isExpandedInSelector = expandedGroupsInSelector.includes(
              group.id
            );
            return (
              <div key={group.id}>
                <div
                  style={{
                    padding: "12px 16px",
                    cursor: "pointer",
                    background:
                      selectedGroupFilter === group.id ? "#e6f7ff" : "#fff",
                    borderBottom: "1px solid #f0f0f0",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontWeight: 500,
                    fontSize: 14,
                  }}
                  onMouseEnter={(e) => {
                    if (selectedGroupFilter !== group.id)
                      e.currentTarget.style.background = "#fafafa";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      selectedGroupFilter === group.id ? "#e6f7ff" : "#fff";
                  }}
                >
                  <Icon
                    icon={
                      isExpandedInSelector
                        ? "mdi:chevron-down"
                        : "mdi:chevron-right"
                    }
                    width={20}
                    style={{ color: "#595959", flexShrink: 0 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedGroupsInSelector((prev) =>
                        prev.includes(group.id)
                          ? prev.filter((id) => id !== group.id)
                          : [...prev, group.id]
                      );
                    }}
                  />
                  <span
                    style={{ flex: 1 }}
                    onClick={() => handleGroupSelect(group.id)}
                  >
                    {groupIndex + 1}. {group.name}
                  </span>
                  <span
                    style={{ fontSize: 13, color: "#888", fontWeight: 400 }}
                  >
                    ({group.indicators.length})
                  </span>
                </div>
                {isExpandedInSelector &&
                  group.indicators.map((ind, indIndex) => (
                    <div
                      key={ind.id}
                      style={{
                        padding: "10px 16px 10px 48px",
                        fontSize: 14,
                        color: "#595959",
                        background: "#fafafa",
                        borderBottom: "1px solid #f5f5f5",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span>
                        — {groupIndex + 1}.{indIndex + 1} {ind.name}
                      </span>
                    </div>
                  ))}
              </div>
            );
          })}
        </div>
      </Modal>

      {/* Indicator Selection Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon icon="mdi:clipboard-check-outline" width={24} height={24} />
            <span>Chọn chỉ tiêu</span>
          </div>
        }
        open={indicatorModalVisible}
        onOk={handleIndicatorModalOk}
        onCancel={handleIndicatorModalCancel}
        width={1200}
        okText="Chọn"
        cancelText="Thoát"
        styles={{ body: { padding: 0 } }}
      >
        <div style={{ display: "flex", height: 500 }}>
          {/* Left panel - Indicator list */}
          <div
            style={{
              width: 320,
              borderRight: "1px solid #f0f0f0",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid #f0f0f0",
                background: "#fafafa",
              }}
            >
              <div
                onClick={() => setGroupSelectorVisible(true)}
                style={{
                  padding: "6px 12px",
                  border: "1px solid #d9d9d9",
                  borderRadius: 4,
                  cursor: "pointer",
                  background: "#fff",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    color: selectedGroupFilter === "all" ? "#999" : "#000",
                  }}
                >
                  {selectedGroupFilter === "all"
                    ? "--- Tất cả nhóm chỉ tiêu ---"
                    : indicatorGroups.find((g) => g.id === selectedGroupFilter)
                        ?.name || "Chọn nhóm..."}
                </span>
                <Icon icon="mdi:chevron-down" width={16} />
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {selectedGroupFilter === "all"
                ? // Hiển thị theo nhóm khi chọn "Tất cả"
                  indicatorGroups.map((group) => {
                    const groupIndicators = indicators.filter(
                      (ind) => ind.indicatorGroupId === group.id && ind.isActive
                    );
                    if (groupIndicators.length === 0) return null;

                    // Filter by search text if any
                    const filteredIndicators = indicatorSearchText.trim()
                      ? groupIndicators.filter(
                          (ind) =>
                            ind.name
                              .toLowerCase()
                              .includes(
                                indicatorSearchText.toLowerCase().trim()
                              ) ||
                            ind.code
                              ?.toLowerCase()
                              .includes(
                                indicatorSearchText.toLowerCase().trim()
                              )
                        )
                      : groupIndicators;

                    if (filteredIndicators.length === 0) return null;

                    const isExpanded = expandedGroups.includes(group.id);

                    return (
                      <div key={group.id}>
                        {/* Group header */}
                        <div
                          onClick={() => {
                            setExpandedGroups((prev) =>
                              prev.includes(group.id)
                                ? prev.filter((id) => id !== group.id)
                                : [...prev, group.id]
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
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#e6f7ff";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#fafafa";
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
                          <span style={{ flex: 1 }}>{group.name}</span>
                          <span
                            style={{
                              fontSize: 12,
                              color: "#888",
                              fontWeight: 400,
                            }}
                          >
                            ({filteredIndicators.length})
                          </span>
                        </div>
                        {/* Group indicators - only show when expanded */}
                        {isExpanded &&
                          filteredIndicators.map((ind) => (
                            <div
                              key={ind.id}
                              onClick={() => toggleIndicator(ind.id)}
                              style={{
                                padding: "6px 12px 6px 36px",
                                borderBottom: "1px solid #f5f5f5",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                cursor: "pointer",
                                background: tempSelectedIndicators.includes(
                                  ind.id
                                )
                                  ? "#e6f7ff"
                                  : "#fff",
                              }}
                              onMouseEnter={(e) => {
                                if (!tempSelectedIndicators.includes(ind.id)) {
                                  e.currentTarget.style.background = "#f5f5f5";
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background =
                                  tempSelectedIndicators.includes(ind.id)
                                    ? "#e6f7ff"
                                    : "#fff";
                              }}
                            >
                              <Checkbox
                                checked={tempSelectedIndicators.includes(
                                  ind.id
                                )}
                                onClick={(e) => e.stopPropagation()}
                                onChange={() => toggleIndicator(ind.id)}
                              />
                              <span
                                style={{
                                  flex: 1,
                                  fontSize: 13,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {ind.name}
                              </span>
                              <span
                                style={{
                                  fontSize: 12,
                                  color: "#888",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {ind.unitPrice?.toLocaleString("vi-VN")}
                              </span>
                            </div>
                          ))}
                      </div>
                    );
                  })
                : // Hiển thị flat khi đã chọn nhóm cụ thể
                  getFilteredIndicators().map((ind) => (
                    <div
                      key={ind.id}
                      onClick={() => toggleIndicator(ind.id)}
                      style={{
                        padding: "6px 12px",
                        borderBottom: "1px solid #f5f5f5",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        cursor: "pointer",
                        background: tempSelectedIndicators.includes(ind.id)
                          ? "#e6f7ff"
                          : "#fff",
                      }}
                      onMouseEnter={(e) => {
                        if (!tempSelectedIndicators.includes(ind.id)) {
                          e.currentTarget.style.background = "#f5f5f5";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          tempSelectedIndicators.includes(ind.id)
                            ? "#e6f7ff"
                            : "#fff";
                      }}
                    >
                      <Checkbox
                        checked={tempSelectedIndicators.includes(ind.id)}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => toggleIndicator(ind.id)}
                      />
                      <span
                        style={{
                          flex: 1,
                          fontSize: 13,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {ind.name}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          color: "#888",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {ind.unitPrice?.toLocaleString("vi-VN")}
                      </span>
                    </div>
                  ))}
            </div>
          </div>

          {/* Right panel - Selected indicators grouped by laboratory */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div
              style={{
                padding: "8px 12px",
                borderBottom: "1px solid #f0f0f0",
                background: "#fafafa",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Text strong>Danh sách đã chọn</Text>
                <Checkbox
                  checked={
                    checkedIndicators.length ===
                      tempSelectedIndicators.filter((id) => !indicatorLaboratoryMap[`${currentSampleKey}_${id}`]).length &&
                    tempSelectedIndicators.filter((id) => !indicatorLaboratoryMap[`${currentSampleKey}_${id}`]).length > 0
                  }
                  indeterminate={
                    checkedIndicators.length > 0 &&
                    checkedIndicators.length < tempSelectedIndicators.filter((id) => !indicatorLaboratoryMap[`${currentSampleKey}_${id}`]).length
                  }
                  onChange={(e) => {
                    // Only select unsent indicators
                    if (e.target.checked) {
                      setCheckedIndicators(tempSelectedIndicators.filter((id) => !indicatorLaboratoryMap[`${currentSampleKey}_${id}`]));
                    } else {
                      setCheckedIndicators([]);
                    }
                  }}
                >
                  Chọn tất cả
                </Checkbox>
              </div>
              <Button
                type="primary"
                size="small"
                icon={<Icon icon="mdi:send" width={14} />}
                onClick={handleSendToLaboratory}
              >
                Gửi khoa phòng
              </Button>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {/* Table header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  background: "#fafafa",
                  borderBottom: "1px solid #f0f0f0",
                  fontWeight: 600,
                  fontSize: 13,
                  flexShrink: 0,
                }}
              >
                <span style={{ width: 24 }}>[X]</span>
                <span style={{ flex: 1 }}>Chỉ tiêu</span>
                <span style={{ width: 80, textAlign: "right" }}>Đơn giá</span>
                <span style={{ width: 110, textAlign: "center" }}>Ngày chuyển giao</span>
                <span style={{ width: 110, textAlign: "center" }}>Ngày yêu cầu</span>
                <span style={{ width: 32 }}>Xóa</span>
              </div>
              {/* Table body */}
              <div style={{ flex: 1, overflowY: "auto" }}>
              {/* Group indicators by laboratory */}
              {(() => {
                // Separate sent and unsent indicators - use sampleKey_indicatorId
                const unsentIndicators = tempSelectedIndicators.filter((id) => !indicatorLaboratoryMap[`${currentSampleKey}_${id}`]);
                const sentIndicators = tempSelectedIndicators.filter((id) => indicatorLaboratoryMap[`${currentSampleKey}_${id}`]);

                // Group sent indicators by laboratory
                const groupedByLab: Record<string, { labName: string; requestDate: dayjs.Dayjs; indicators: string[] }> = {};
                sentIndicators.forEach((id) => {
                  const labInfo = indicatorLaboratoryMap[`${currentSampleKey}_${id}`];
                  if (!groupedByLab[labInfo.laboratoryId]) {
                    groupedByLab[labInfo.laboratoryId] = {
                      labName: labInfo.laboratoryName,
                      requestDate: labInfo.requestDate,
                      indicators: [],
                    };
                  }
                  groupedByLab[labInfo.laboratoryId].indicators.push(id);
                });

                // Render indicator row (shared between unsent and sent)
                const renderIndicatorRow = (id: string, isInGroup: boolean = false) => {
                  const ind = getIndicatorInfo(id);
                  if (!ind) return null;
                  return (
                    <div
                      key={id}
                      style={{
                        padding: isInGroup ? "8px 12px 8px 36px" : "8px 12px",
                        borderBottom: "1px solid #f5f5f5",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        background: "#fff",
                      }}
                    >
                      <Checkbox
                        checked={checkedIndicators.includes(id)}
                        onChange={() => toggleCheckedIndicator(id)}
                        style={{ width: 24 }}
                      />
                      <span style={{ flex: 1, fontSize: 13 }}>{ind.name}</span>
                      <span style={{ fontSize: 12, color: "#888", width: 80, textAlign: "right" }}>
                        {ind.unitPrice?.toLocaleString("vi-VN")}đ
                      </span>
                      <DatePicker
                        value={selectedIndicatorDates[id]?.transferDate}
                        onChange={(date) => handleIndicatorDateChange(id, "transferDate", date)}
                        format="DD/MM/YYYY"
                        size="small"
                        style={{ width: 110 }}
                        placeholder="Chuyển giao"
                      />
                      <DatePicker
                        value={selectedIndicatorDates[id]?.requestDate}
                        onChange={(date) => handleIndicatorDateChange(id, "requestDate", date)}
                        format="DD/MM/YYYY"
                        size="small"
                        style={{ width: 110 }}
                        placeholder="Yêu cầu"
                      />
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<CloseOutlined />}
                        style={{ width: 32 }}
                        onClick={() => {
                          toggleIndicator(id);
                          // Also remove from laboratory map if exists - use sampleKey_indicatorId
                          const labMapKey = `${currentSampleKey}_${id}`;
                          if (indicatorLaboratoryMap[labMapKey]) {
                            setIndicatorLaboratoryMap((prev) => {
                              const updated = { ...prev };
                              delete updated[labMapKey];
                              return updated;
                            });
                          }
                        }}
                      />
                    </div>
                  );
                };

                return (
                  <>
                    {/* Unsent indicators - display normally without group header */}
                    {unsentIndicators.map((id) => renderIndicatorRow(id, false))}

                    {/* Sent indicators grouped by laboratory */}
                    {Object.entries(groupedByLab).map(([labId, { labName, requestDate, indicators: labIndicators }]) => {
                      const isExpanded = expandedLabGroups.includes(labId);
                      return (
                        <div key={labId}>
                          {/* Group header */}
                          <div
                            onClick={() => {
                              setExpandedLabGroups((prev) =>
                                prev.includes(labId)
                                  ? prev.filter((id) => id !== labId)
                                  : [...prev, labId]
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
                              icon={isExpanded ? "mdi:chevron-down" : "mdi:chevron-right"}
                              width={18}
                              style={{ color: "#595959", flexShrink: 0 }}
                            />
                            <span>{labName} ({labIndicators.length})</span>
                          </div>
                          {/* Group items - only show when expanded */}
                          {isExpanded && labIndicators.map((id) => renderIndicatorRow(id, true))}
                        </div>
                      );
                    })}

                    {/* Empty state */}
                    {tempSelectedIndicators.length === 0 && (
                      <div style={{ padding: 24, textAlign: "center" }}>
                        <Text type="secondary">Chưa chọn chỉ tiêu nào</Text>
                      </div>
                    )}
                  </>
                );
              })()}
              </div>
            </div>
            <div
              style={{
                padding: "12px 16px",
                borderTop: "1px solid #d9d9d9",
                background: "linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 14 }}>
                Số chỉ tiêu: <Text strong>{tempSelectedIndicators.length}</Text>
                {tempSelectedIndicators.filter((id) => indicatorLaboratoryMap[`${currentSampleKey}_${id}`]).length > 0 && (
                  <span style={{ color: "#52c41a", marginLeft: 8 }}>
                    (Đã gửi: {tempSelectedIndicators.filter((id) => indicatorLaboratoryMap[`${currentSampleKey}_${id}`]).length})
                  </span>
                )}
              </Text>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Text style={{ fontSize: 14 }}>Tổng tiền:</Text>
                <Text strong style={{ fontSize: 16, color: "#1890ff" }}>
                  {tempSelectedIndicators
                    .reduce((sum, id) => {
                      const ind = getIndicatorInfo(id);
                      return sum + (ind?.unitPrice || 0);
                    }, 0)
                    .toLocaleString("vi-VN")}{" "}
                  đ
                </Text>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Department Selection Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon icon="mdi:office-building" width={24} height={24} />
              <span>Chọn khoa phòng</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Button
                type="primary"
                icon={<Icon icon="mdi:check" width={16} />}
                onClick={handleConfirmSendToLaboratory}
              >
                Gửi
              </Button>
              <Button
                icon={<Icon icon="mdi:close" width={16} />}
                onClick={() => setLaboratoryModalVisible(false)}
              >
                Thoát
              </Button>
            </div>
          </div>
        }
        open={laboratoryModalVisible}
        onCancel={() => setLaboratoryModalVisible(false)}
        closable={false}
        width={800}
        centered
        footer={null}
        styles={{
          body: {
            padding: 0,
            maxHeight: "calc(100vh - 200px)",
            overflowY: "auto"
          }
        }}
      >
        <div style={{ padding: "16px" }}>
          {/* Ngày yêu cầu xong */}
          <Row align="middle" style={{ marginBottom: 16 }}>
            <Col span={8}>
              <Text>Ngày yêu cầu xong:</Text>
            </Col>
            <Col span={16}>
              <DatePicker
                value={laboratoryRequestDate}
                onChange={(date) => setLaboratoryRequestDate(date)}
                format="DD/MM/YYYY"
                style={{ width: "100%" }}
                placeholder="Chọn ngày..."
                disabledDate={(current) => {
                  // Disable dates before today
                  return current && current.isBefore(dayjs().startOf("day"));
                }}
              />
            </Col>
          </Row>

          {/* Danh sách khoa phòng - Radio */}
          <div
            style={{
              border: "1px solid #d9d9d9",
              borderRadius: 4,
              padding: 12,
              marginBottom: 16,
              background: "#fafafa",
            }}
          >
            <Radio.Group
              value={selectedLaboratoryId}
              onChange={(e) => setSelectedLaboratoryId(e.target.value)}
              style={{ width: "100%" }}
            >
              <Space direction="vertical" style={{ width: "100%" }}>
                {laboratories.map((lab) => (
                  <Radio
                    key={lab.id}
                    value={lab.id}
                    style={{ display: "block" }}
                  >
                    {lab.code ? `${lab.code} - ${lab.name}` : lab.name}
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
            {laboratories.length === 0 && (
              <Text type="secondary">Không có khoa phòng nào</Text>
            )}
          </div>

          {/* Danh sách chỉ tiêu đã chọn */}
          <div>
            <Text strong style={{ display: "block", marginBottom: 8 }}>
              Chỉ tiêu đã chọn ({indicatorsToSend.length})
            </Text>
            <div
              style={{
                border: "1px solid #d9d9d9",
                borderRadius: 4,
              }}
            >
              <Table
                dataSource={indicatorsToSend
                  .map((id) => getIndicatorInfo(id))
                  .filter(Boolean)}
                rowKey="id"
                size="small"
                pagination={false}
                columns={[
                  {
                    title: "Chỉ tiêu",
                    dataIndex: "name",
                    key: "name",
                    ellipsis: true,
                  },
                  {
                    title: "Đơn giá",
                    dataIndex: "unitPrice",
                    key: "unitPrice",
                    width: 120,
                    align: "right" as const,
                    render: (value: number) =>
                      value?.toLocaleString("vi-VN") + "đ",
                  },
                ]}
                locale={{ emptyText: "Không có chỉ tiêu nào" }}
              />
            </div>
          </div>
        </div>
      </Modal>
    </Card>
  );
};

export default TestRequestForm;
