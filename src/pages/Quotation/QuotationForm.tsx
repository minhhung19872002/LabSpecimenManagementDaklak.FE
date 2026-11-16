import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Space,
  Typography,
  AutoComplete,
  InputNumber,
  Popconfirm,
  message,
  Spin,
  Row,
  Col,
  Divider,
  Statistic,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  SaveOutlined,
  MailOutlined,
  CopyOutlined,
  DownOutlined,
  RightOutlined,
  InboxOutlined,
  FileExcelOutlined,
} from "../../components/common/Icon";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import { quotationService } from "../../services/quotationService";
import { isQueuedOffline } from "../../services/offline/createOfflineService";
import { organizationService } from "../../services/organizationService";
import { getApiErrorMessage } from "../../utils/errorHandler";
import {
  CreateUpdateQuotationDto,
  QuotationStatus,
  QuotationSampleFormData,
  QuotationSampleIndicatorFormData,
} from "../../types/quotation";
import { PATH_ROUTES } from "../../constants";
import { formatCurrency } from "../../utils/formatters";
import QuotationIndicatorSelectionModal, {
  SelectedMethodInfo,
  ExistingMethodInfo,
} from "./components/QuotationIndicatorSelectionModal";
import SendQuotationEmailModal from "./components/SendQuotationEmailModal";
import ImportQuotationSamplesModal from "./components/ImportQuotationSamplesModal";
import { getPdfIndicatorNames } from "./utils";
import { IndicatorName } from "../../components/common";
import {
  isHeavyMetalComboMet,
  isHgIndicator,
  isEcoliColiformComboMet,
  isEcoliIndicator,
  isColiformIndicator,
} from "../TestRequest/TestRequestForm/constants";
import "../../styles/ListCard.css";

const { Text } = Typography;

interface ComboGroupInfo {
  comboId: string;
  rowSpan: number;
  isFirst: boolean;
  memberKeys: string[];
}

const stripHtml = (s: string) => s.replace(/<[^>]*>/g, "");

const getComboGroups = (
  indicators: QuotationSampleIndicatorFormData[]
): Record<string, ComboGroupInfo> => {
  const result: Record<string, ComboGroupInfo> = {};
  const grouped: Record<string, QuotationSampleIndicatorFormData[]> = {};

  for (const ind of indicators) {
    const stId = ind.specimenTypeId || "_none";
    if (!grouped[stId]) grouped[stId] = [];
    grouped[stId].push(ind);
  }

  for (const [stId, inds] of Object.entries(grouped)) {
    const names = inds.map((i) => stripHtml(i.indicatorName));
    const stName = inds[0]?.specimenTypeName;

    // Heavy metal combo
    if (isHeavyMetalComboMet(names, undefined, stName)) {
      const members = inds.filter((i) => {
        const n = stripHtml(i.indicatorName);
        return isHgIndicator(n) ||
          ["hàm lượng chì (pb)", "hàm lượng asen (as)", "hàm lượng cadimi (cd)"].includes(
            n.normalize("NFC").toLowerCase()
          );
      });
      if (members.length > 1) {
        const comboId = `hm_${stId}`;
        const memberKeys = members.map((m) => m.key);
        members.forEach((m, idx) => {
          result[m.key] = {
            comboId,
            rowSpan: idx === 0 ? members.length : 0,
            isFirst: idx === 0,
            memberKeys,
          };
        });
      }
    }

    // E.coli + Coliform combo
    if (isEcoliColiformComboMet(names, undefined, stName)) {
      const members = inds.filter((i) => {
        const n = stripHtml(i.indicatorName);
        return isEcoliIndicator(n) || isColiformIndicator(n);
      });
      if (members.length > 1) {
        const comboId = `ec_${stId}`;
        const memberKeys = members.map((m) => m.key);
        members.forEach((m, idx) => {
          if (!result[m.key]) {
            result[m.key] = {
              comboId,
              rowSpan: idx === 0 ? members.length : 0,
              isFirst: idx === 0,
              memberKeys,
            };
          }
        });
      }
    }
  }

  return result;
};

interface OrganizationOption {
  value: string;
  label: string;
  id: string;
}

interface QuotationSourceData {
  quotationDate?: string;
  provinceCode?: string;
  districtCode?: string;
  wardCode?: string;
  address?: string;
  taxCode?: string;
  contactPerson?: string;
  phone?: string;
}

const QuotationForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const isDuplicateMode = location.pathname.startsWith("/quotations/duplicate/");
  const isEdit = Boolean(id) && !isDuplicateMode;

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [samples, setSamples] = useState<QuotationSampleFormData[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [currentSampleKey, setCurrentSampleKey] = useState<string | null>(null);
  const [expandedSamples, setExpandedSamples] = useState<Set<string>>(new Set());
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [organizationOptions, setOrganizationOptions] = useState<
    OrganizationOption[]
  >([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<
    string | undefined
  >();
  const [sourceQuotationData, setSourceQuotationData] = useState<QuotationSourceData>({});

  // Load organization options
  useEffect(() => {
    loadOrganizations();
  }, []);

  // Load quotation data if editing or duplicating
  useEffect(() => {
    if (id && (isEdit || isDuplicateMode)) {
      loadQuotation(id, isDuplicateMode);
    }
  }, [id, isDuplicateMode, isEdit]);

  const loadOrganizations = async () => {
    try {
      const orgs = await organizationService.getAllActive();
      setOrganizationOptions(
        orgs.map((org) => ({
          value: org.name,
          label: org.name,
          id: org.id,
        }))
      );
    } catch (error) {
      console.error("Failed to load organizations:", error);
    }
  };

  const loadQuotation = async (quotationId: string, duplicateMode = false) => {
    setLoading(true);
    try {
      const data = await quotationService.get(quotationId);
      form.setFieldsValue({
        customerName: data.customerName,
        notes: data.notes,
      });
      setSelectedOrganizationId(data.organizationId);
      setSourceQuotationData({
        quotationDate: data.quotationDate,
        provinceCode: data.provinceCode,
        districtCode: data.districtCode,
        wardCode: data.wardCode,
        address: data.address,
        taxCode: data.taxCode,
        contactPerson: data.contactPerson,
        phone: data.phone,
      });

      // Map samples
      const mappedSamples: QuotationSampleFormData[] = data.samples.map(
        (sample, sampleIndex) => ({
          key: duplicateMode
            ? `duplicate-sample-${sampleIndex}-${Date.now()}`
            : sample.id,
          id: duplicateMode ? undefined : sample.id,
          sortOrder: sample.sortOrder,
          sampleName: sample.sampleName,
          quantity: sample.quantity || 1,
          indicators: sample.indicators.map((ind, indicatorIndex) => ({
            key: duplicateMode
              ? `${ind.indicatorId}_${ind.testMethodId}_${ind.specimenTypeId || "null"}_${sampleIndex}_${indicatorIndex}`
              : `${ind.indicatorId}_${ind.testMethodId}_${ind.specimenTypeId || "null"}`,
            id: duplicateMode ? undefined : ind.id,
            indicatorId: ind.indicatorId,
            testMethodId: ind.testMethodId,
            indicatorName: ind.indicatorName,
            indicatorFormattedName: ind.indicatorFormattedName,
            testMethodName: ind.testMethodName,
            testMethodFormattedName: ind.testMethodFormattedName,
            unitPrice: ind.unitPrice,
            sortOrder: ind.sortOrder,
            specimenTypeId: ind.specimenTypeId || undefined,
            specimenTypeName: ind.specimenTypeName || undefined,
            note: ind.note || undefined,
          })),
        })
      );
      setSamples(mappedSamples);
      // Expand all samples by default
      setExpandedSamples(new Set(mappedSamples.map((s) => s.key)));
    } catch (error) {
      console.error("Failed to load quotation:", error);
      message.error("Không thể tải thông tin báo giá");
    } finally {
      setLoading(false);
    }
  };

  // Handle organization selection
  const handleOrganizationSelect = (
    value: string,
    option: OrganizationOption
  ) => {
    setSelectedOrganizationId(option.id);
    form.setFieldsValue({
      customerName: value,
    });
  };

  // Handle organization input change
  const handleOrganizationChange = (value: string) => {
    const matchedOption = organizationOptions.find(
      (opt) => opt.value === value
    );
    if (!matchedOption) {
      setSelectedOrganizationId(undefined);
    }
  };

  // Toggle sample expand/collapse
  const toggleSampleExpand = (sampleKey: string) => {
    setExpandedSamples((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sampleKey)) {
        newSet.delete(sampleKey);
      } else {
        newSet.add(sampleKey);
      }
      return newSet;
    });
  };

  // Import samples from Excel
  const handleImportSamples = (importedSamples: QuotationSampleFormData[]) => {
    setSamples((prev) => [...prev, ...importedSamples]);
    setExpandedSamples((prev) => {
      const newSet = new Set(prev);
      importedSamples.forEach((s) => newSet.add(s.key));
      return newSet;
    });
    setImportModalVisible(false);
  };

  // Add new sample
  const handleAddSample = () => {
    const nextNum = samples.length + 1;
    const newSampleKey = `sample-${Date.now()}`;
    const newSample: QuotationSampleFormData = {
      key: newSampleKey,
      sortOrder: nextNum,
      sampleName: `Mẫu ${nextNum}`,
      quantity: 1,
      indicators: [],
    };
    setSamples([...samples, newSample]);
    // Auto expand new sample
    setExpandedSamples((prev) => new Set(prev).add(newSampleKey));
  };

  // Copy sample
  const handleCopySample = (sampleKey: string) => {
    const source = samples.find((s) => s.key === sampleKey);
    if (!source) return;

    const nextNum = samples.length + 1;
    const newSampleKey = `sample-${Date.now()}`;
    const newSample: QuotationSampleFormData = {
      key: newSampleKey,
      sortOrder: nextNum,
      sampleName: `Mẫu ${nextNum}`,
      quantity: source.quantity || 1,
      indicators: source.indicators.map((ind) => ({
        ...ind,
        id: undefined,
      })),
    };
    setSamples([...samples, newSample]);
    // Auto expand new sample
    setExpandedSamples((prev) => new Set(prev).add(newSampleKey));
  };

  // Delete sample
  const handleDeleteSample = (sampleKey: string) => {
    setSamples(samples.filter((s) => s.key !== sampleKey));
    setExpandedSamples((prev) => {
      const newSet = new Set(prev);
      newSet.delete(sampleKey);
      return newSet;
    });
  };

  // Update sample name
  const handleUpdateSampleName = (sampleKey: string, newName: string) => {
    setSamples(
      samples.map((s) =>
        s.key === sampleKey ? { ...s, sampleName: newName } : s
      )
    );
  };

  const handleUpdateSampleQuantity = (sampleKey: string, quantity: number | null) => {
    setSamples(
      samples.map((s) =>
        s.key === sampleKey ? { ...s, quantity: quantity || 1 } : s
      )
    );
  };

  // Open indicator modal for a sample
  const handleOpenIndicatorModal = (sampleKey: string) => {
    setCurrentSampleKey(sampleKey);
    setModalVisible(true);
  };

  // Add/replace indicators for sample
  const handleAddIndicatorsToSample = (selectedMethods: SelectedMethodInfo[]) => {
    if (!currentSampleKey) return;

    setSamples(
      samples.map((sample) => {
        if (sample.key !== currentSampleKey) return sample;

        const newIndicators = selectedMethods.map((method, idx) => {
          const key = `${method.indicatorId}_${method.testMethodId}_${method.specimenTypeId || "null"}`;
          // Preserve existing indicator id if it was already saved
          const existing = sample.indicators.find((ind) => ind.key === key);
          return {
            key,
            id: existing?.id,
            indicatorId: method.indicatorId,
            testMethodId: method.testMethodId,
            indicatorName: method.indicatorName,
            indicatorFormattedName: method.indicatorFormattedName,
            testMethodName: method.testMethodName,
            testMethodFormattedName: method.testMethodFormattedName,
            unitPrice: method.unitPrice,
            sortOrder: idx + 1,
            specimenTypeId: method.specimenTypeId,
            specimenTypeName: method.specimenTypeName,
            note: existing?.note,
          };
        });

        return {
          ...sample,
          indicators: newIndicators,
        };
      })
    );

    setModalVisible(false);
    setCurrentSampleKey(null);
  };

  // Update indicator note (combo-aware: updates all members in same combo group)
  const handleUpdateIndicatorNote = (
    sampleKey: string,
    indicatorKey: string,
    note: string,
    comboMemberKeys?: string[]
  ) => {
    setSamples(
      samples.map((sample) => {
        if (sample.key !== sampleKey) return sample;
        const keysToUpdate = comboMemberKeys || [indicatorKey];
        return {
          ...sample,
          indicators: sample.indicators.map((ind) =>
            keysToUpdate.includes(ind.key) ? { ...ind, note } : ind
          ),
        };
      })
    );
  };

  // Remove indicator from sample
  const handleRemoveIndicator = (sampleKey: string, indicatorKey: string) => {
    setSamples(
      samples.map((sample) => {
        if (sample.key !== sampleKey) return sample;
        return {
          ...sample,
          indicators: sample.indicators.filter((ind) => ind.key !== indicatorKey),
        };
      })
    );
  };

  // Calculate sample total (đơn giá * số lượng)
  const calculateSampleTotal = (sample: QuotationSampleFormData) => {
    const indicatorSum = sample.indicators.reduce((sum, ind) => sum + ind.unitPrice, 0);
    return indicatorSum * (sample.quantity || 1);
  };

  // Calculate grand total
  const totalCost = samples.reduce(
    (sum, sample) => sum + calculateSampleTotal(sample),
    0
  );

  // Calculate total indicator count
  const totalIndicatorCount = samples.reduce(
    (sum, sample) => sum + sample.indicators.length,
    0
  );

  // Get existing methods for current sample to pre-select in modal
  const getExistingMethods = (): ExistingMethodInfo[] => {
    if (!currentSampleKey) return [];
    const currentSample = samples.find((s) => s.key === currentSampleKey);
    return currentSample?.indicators.map((ind) => ({
      key: ind.key,
      indicatorId: ind.indicatorId,
      testMethodId: ind.testMethodId,
      indicatorName: ind.indicatorName,
      indicatorFormattedName: ind.indicatorFormattedName,
      testMethodName: ind.testMethodName,
      testMethodFormattedName: ind.testMethodFormattedName,
      unitPrice: ind.unitPrice,
      specimenTypeId: ind.specimenTypeId,
      specimenTypeName: ind.specimenTypeName,
    })) || [];
  };

  // Handle save
  const handleSave = async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue();

      if (samples.length === 0) {
        message.warning("Vui lòng thêm ít nhất một mẫu");
        return;
      }

      const hasEmptySample = samples.some((s) => s.indicators.length === 0);
      if (hasEmptySample) {
        message.warning("Mỗi mẫu phải có ít nhất một chỉ tiêu");
        return;
      }

      setSaving(true);

      const data: CreateUpdateQuotationDto = {
        quotationDate: sourceQuotationData.quotationDate || dayjs().toISOString(),
        organizationId: selectedOrganizationId,
        customerName: values.customerName,
        provinceCode: sourceQuotationData.provinceCode,
        districtCode: sourceQuotationData.districtCode,
        wardCode: sourceQuotationData.wardCode,
        address: sourceQuotationData.address,
        taxCode: sourceQuotationData.taxCode,
        contactPerson: sourceQuotationData.contactPerson,
        phone: sourceQuotationData.phone,
        notes: values.notes,
        status: QuotationStatus.Draft,
        samples: samples.map((sample, sampleIdx) => ({
          id: sample.id,
          sortOrder: sampleIdx + 1,
          sampleName: sample.sampleName,
          quantity: sample.quantity || 1,
          indicators: sample.indicators.map((ind, indIdx) => ({
            id: ind.id,
            indicatorId: ind.indicatorId,
            testMethodId: ind.testMethodId,
            indicatorName: ind.indicatorName,
            testMethodName: ind.testMethodName,
            unitPrice: ind.unitPrice,
            sortOrder: indIdx + 1,
            specimenTypeId: ind.specimenTypeId || null,
            specimenTypeName: ind.specimenTypeName || null,
            note: ind.note || null,
          })),
        })),
      };

      if (isEdit && id) {
        const updated = await quotationService.update(id, data);
        message.success(
          isQueuedOffline(updated)
            ? "Đã lưu thay đổi báo giá trên máy, sẽ đồng bộ lên máy chủ khi có mạng"
            : "Cập nhật báo giá thành công"
        );
        navigate(PATH_ROUTES.quotations.view(id));
      } else {
        const created = await quotationService.create(data);
        message.success(
          isQueuedOffline(created)
            ? "Đã lưu báo giá trên máy, sẽ đồng bộ lên máy chủ khi có mạng"
            : isDuplicateMode
            ? "Nhân bản báo giá thành công"
            : "Tạo báo giá thành công"
        );
        navigate(PATH_ROUTES.quotations.view(created.id));
      }
    } catch (error: any) {
      console.error("Failed to save quotation:", error);
      message.error(getApiErrorMessage(error, "Lưu báo giá thất bại"));
    } finally {
      setSaving(false);
    }
  };

  // Render indicator row
  const renderIndicatorRow = (
    indicator: QuotationSampleIndicatorFormData,
    index: number,
    sampleKey: string,
    comboInfo?: ComboGroupInfo
  ) => (
    <tr key={indicator.key} style={{ borderBottom: "1px solid #f0f0f0" }}>
      <td style={{ padding: "8px 12px", textAlign: "center", width: 50 }}>
        {index + 1}
      </td>
      <td style={{ padding: "8px 12px" }}>
        <IndicatorName
          name={indicator.indicatorName}
          formattedName={indicator.indicatorFormattedName}
        />
        {indicator.specimenTypeName && (
          <div style={{ fontSize: 11, color: "#8c8c8c", marginTop: 2 }}>
            {indicator.specimenTypeName}
          </div>
        )}
      </td>
      <td style={{ padding: "8px 12px" }}>
        <IndicatorName
          name={indicator.testMethodName}
          formattedName={indicator.testMethodFormattedName}
        />
      </td>
      <td style={{ padding: "8px 12px", textAlign: "right", width: 130 }}>
        {formatCurrency(indicator.unitPrice)}
      </td>
      {comboInfo && comboInfo.rowSpan === 0 ? null : (
        <td
          style={{ padding: "4px 8px", width: 200, height: 1 }}
          rowSpan={comboInfo ? comboInfo.rowSpan : 1}
        >
          <Input.TextArea
            value={indicator.note || ""}
            onChange={(e) =>
              handleUpdateIndicatorNote(
                sampleKey,
                indicator.key,
                e.target.value,
                comboInfo?.memberKeys
              )
            }
            placeholder="Ghi chú..."
            maxLength={500}
            className="note-fill-cell"
            style={{ height: "100%", resize: "none" }}
          />
        </td>
      )}
      <td style={{ padding: "8px 12px", textAlign: "center", width: 50 }}>
        <Popconfirm
          title="Xóa chỉ tiêu này?"
          onConfirm={() => handleRemoveIndicator(sampleKey, indicator.key)}
          okText="Xóa"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
        >
          <Button type="text" danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      </td>
    </tr>
  );

  // Render empty indicator message
  const renderEmptyIndicators = (sampleKey: string) => (
    <tr>
      <td
        colSpan={6}
        style={{
          padding: "24px 12px",
          textAlign: "center",
          background: "#fafafa",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <InboxOutlined style={{ fontSize: 32, color: "#d9d9d9" }} />
          <div>
            <Text type="secondary">Chưa có chỉ tiêu. </Text>
            <Text
              type="secondary"
              style={{ cursor: "pointer", color: "#1890ff", fontWeight: 500 }}
              onClick={() => handleOpenIndicatorModal(sampleKey)}
            >
              Thêm chỉ tiêu
            </Text>
            <Text type="secondary"> để thêm chỉ tiêu mới</Text>
          </div>
        </div>
      </td>
    </tr>
  );

  // Render add indicator button row
  const renderAddIndicatorRow = (sampleKey: string) => (
    <tr>
      <td
        colSpan={6}
        style={{
          padding: "8px 12px",
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <Button
          type="dashed"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => handleOpenIndicatorModal(sampleKey)}
        >
          Thêm chỉ tiêu
        </Button>
      </td>
    </tr>
  );

  // Sort indicators so combo members are adjacent
  const sortIndicatorsForCombo = (indicators: QuotationSampleIndicatorFormData[]) => {
    const comboGroups = getComboGroups(indicators);
    const sorted: QuotationSampleIndicatorFormData[] = [];
    const placed = new Set<string>();

    for (const ind of indicators) {
      if (placed.has(ind.key)) continue;
      const info = comboGroups[ind.key];
      if (info && info.isFirst) {
        for (const mk of info.memberKeys) {
          const member = indicators.find((i) => i.key === mk);
          if (member && !placed.has(mk)) {
            sorted.push(member);
            placed.add(mk);
          }
        }
      } else if (!info) {
        sorted.push(ind);
        placed.add(ind.key);
      }
    }
    // Add any remaining non-first combo members that weren't placed
    for (const ind of indicators) {
      if (!placed.has(ind.key)) {
        sorted.push(ind);
        placed.add(ind.key);
      }
    }
    return sorted;
  };

  // Render sample group
  const renderSampleGroup = (sample: QuotationSampleFormData) => {
    const isExpanded = expandedSamples.has(sample.key);
    const sampleTotal = calculateSampleTotal(sample);
    const hasIndicators = sample.indicators.length > 0;
    const sortedIndicators = sortIndicatorsForCombo(sample.indicators);
    const comboGroups = getComboGroups(sortedIndicators);

    return (
      <React.Fragment key={sample.key}>
        {/* Sample header row - collapsible */}
        <tr
          style={{
            borderBottom: "1px solid #f0f0f0",
            background: "#fafafa",
          }}
        >
          <td
            colSpan={6}
            style={{ padding: "10px 12px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Space align="center">
                <span
                  onClick={() => toggleSampleExpand(sample.key)}
                  style={{ cursor: "pointer", display: "inline-flex", alignItems: "center" }}
                >
                  {isExpanded ? <DownOutlined style={{ fontSize: 12 }} /> : <RightOutlined style={{ fontSize: 12 }} />}
                </span>
                <Input
                  value={sample.sampleName}
                  onChange={(e) => handleUpdateSampleName(sample.key, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  style={{ width: 200 }}
                />
                <InputNumber
                  value={sample.quantity}
                  onChange={(val) => handleUpdateSampleQuantity(sample.key, val)}
                  onClick={(e) => e.stopPropagation()}
                  min={1}
                  precision={0}
                  style={{ width: 80 }}
                  placeholder="SL"
                />
                <Text type="secondary" className="sample-group-info">
                  ({sample.indicators.length} chỉ tiêu - {formatCurrency(sampleTotal)})
                </Text>
              </Space>
              <Space onClick={(e) => e.stopPropagation()}>
                <Button
                  type="text"
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => handleCopySample(sample.key)}
                  title="Copy mẫu"
                />
                <Popconfirm
                  title="Xóa mẫu này?"
                  onConfirm={() => handleDeleteSample(sample.key)}
                  okText="Xóa"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true }}
                >
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    title="Xóa mẫu"
                  />
                </Popconfirm>
              </Space>
            </div>
          </td>
        </tr>

        {/* Indicator rows or empty message - show only when expanded */}
        {isExpanded && (
          <>
            {hasIndicators ? (
              <>
                {sortedIndicators.map((ind, idx) =>
                  renderIndicatorRow(ind, idx, sample.key, comboGroups[ind.key])
                )}
                {renderAddIndicatorRow(sample.key)}
              </>
            ) : (
              renderEmptyIndicators(sample.key)
            )}
          </>
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="page-wrapper">
      <Spin spinning={loading}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Tooltip title="Quay lại">
              <Button
                shape="circle"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate(PATH_ROUTES.quotations.index)}
              />
            </Tooltip>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<MailOutlined />}
                onClick={() => {
                  if (samples.length === 0 || totalIndicatorCount === 0) {
                    message.warning(
                      "Vui lòng thêm ít nhất một mẫu với chỉ tiêu để gửi email"
                    );
                    return;
                  }
                  setEmailModalVisible(true);
                }}
              >
                Gửi email
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
                loading={saving}
                style={{ background: 'linear-gradient(to right, #1E63F8, #009AE3)', border: 'none' }}
              >
                Lưu
              </Button>
            </Space>
          </Col>
        </Row>
        <Card
          className="list-card"
          styles={{ body: { paddingLeft: 0, paddingRight: 0 } }}
          title={
            isEdit
              ? "Chỉnh sửa báo giá"
              : isDuplicateMode
                ? "Nhân bản báo giá"
                : "Tạo mới báo giá"
          }
          extra={
            <Space>
              <Button
                icon={<FileExcelOutlined />}
                onClick={() => setImportModalVisible(true)}
              >
                Thêm danh sách
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddSample}
              >
                Thêm mẫu
              </Button>
            </Space>
          }
        >

          {/* Customer Info Form */}
          <div className="card-content-padding">
            <Form form={form} layout="vertical">
              <Form.Item
                name="customerName"
                label="Tên CS/DN"
                rules={[{ required: true, message: "Vui lòng nhập tên CS/DN" }]}
                style={{ marginBottom: 0 }}
              >
                <AutoComplete
                  options={organizationOptions}
                  onSelect={(value, option) =>
                    handleOrganizationSelect(value, option as OrganizationOption)
                  }
                  onChange={handleOrganizationChange}
                  placeholder="Nhập hoặc chọn tên CS/DN"
                  filterOption={(inputValue, option) =>
                    option?.label
                      ?.toString()
                      .toLowerCase()
                      .includes(inputValue.toLowerCase()) || false
                  }
                  size="large"
                />
              </Form.Item>
            </Form>

            <Divider style={{ margin: "16px 0" }} />
          </div>

          {/* Table */}
          <div
            style={{
              border: "1px solid #f0f0f0",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr style={{ background: "#E6F7FF" }}>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      borderBottom: "1px solid #f0f0f0",
                      fontWeight: 500,
                      width: 50,
                    }}
                  >
                    STT
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "left",
                      borderBottom: "1px solid #f0f0f0",
                      fontWeight: 500,
                    }}
                  >
                    Chỉ tiêu
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "left",
                      borderBottom: "1px solid #f0f0f0",
                      fontWeight: 500,
                    }}
                  >
                    Phương pháp
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "right",
                      borderBottom: "1px solid #f0f0f0",
                      fontWeight: 500,
                      width: 130,
                    }}
                  >
                    Đơn giá
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "left",
                      borderBottom: "1px solid #f0f0f0",
                      fontWeight: 500,
                      width: 200,
                    }}
                  >
                    Ghi chú
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      borderBottom: "1px solid #f0f0f0",
                      fontWeight: 500,
                      width: 50,
                    }}
                  >
                  </th>
                </tr>
              </thead>
              <tbody>
                {samples.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        padding: 40,
                        textAlign: "center",
                      }}
                    >
                      <Text type="secondary">
                        Chưa có mẫu nào. Nhấn "Thêm mẫu" để bắt đầu.
                      </Text>
                    </td>
                  </tr>
                ) : (
                  samples.map((sample) => renderSampleGroup(sample))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Summary */}
          <div className="card-content-padding">
            <Card
              size="small"
              style={{
                marginTop: 16,
                background: "#fafafa",
              }}
            >
              <Row gutter={48}>
                <Col>
                  <Statistic title="Tổng số mẫu" value={samples.length} />
                </Col>
                <Col>
                  <Statistic title="Tổng số chỉ tiêu" value={totalIndicatorCount} />
                </Col>
                <Col flex="auto" style={{ textAlign: "right" }}>
                  <Statistic
                    title="Tổng cộng"
                    value={totalCost}
                    formatter={(val) => (
                      <span style={{ color: "#1890ff", fontSize: 24 }}>
                        {formatCurrency(val as number)}
                      </span>
                    )}
                  />
                </Col>
              </Row>
            </Card>

            {/* Notes */}
            <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
              <Form.Item name="notes" label="Ghi chú">
                <Input.TextArea rows={3} placeholder="Nhập ghi chú (nếu có)" />
              </Form.Item>
            </Form>
          </div>
        </Card>
      </Spin>

      {/* Indicator Selection Modal */}
      <QuotationIndicatorSelectionModal
        visible={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setCurrentSampleKey(null);
        }}
        onOk={handleAddIndicatorsToSample}
        existingMethods={getExistingMethods()}
      />

      {/* Import Samples Modal */}
      <ImportQuotationSamplesModal
        visible={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        onImport={handleImportSamples}
        existingSampleCount={samples.length}
      />

      {/* Send Email Modal */}
      <SendQuotationEmailModal
        visible={emailModalVisible}
        onCancel={() => setEmailModalVisible(false)}
        customerName={form.getFieldValue("customerName") || ""}
        samples={samples.map((sample) => {
          const sorted = sortIndicatorsForCombo(sample.indicators);
          const comboGroups = getComboGroups(sorted);
          return {
            sampleName: sample.sampleName,
            quantity: sample.quantity || 1,
            indicators: sorted.map((ind) => ({
              ...getPdfIndicatorNames(ind),
              quantity: 1,
              unitPrice: ind.unitPrice,
              note: ind.note || undefined,
              comboGroup: comboGroups[ind.key]?.comboId || undefined,
            })),
          };
        })}
        totalCost={totalCost}
      />
    </div>
  );
};

export default QuotationForm;
