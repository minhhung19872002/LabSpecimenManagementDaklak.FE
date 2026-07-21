import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  Table,
  Button,
  Space,
  Typography,
  message,
  Spin,
  Checkbox,
  List,
  Select,
  Row,
  Col,
  Collapse,
  Card,
} from "antd";
import {
  PrinterOutlined,
  FileWordOutlined,
} from "../../../components/common/Icon";
import type { ColumnsType } from "antd/es/table";
import {
  QualityManagementIndicatorDto,
  QualityIndicatorApprovalStatus,
} from "../../../types/qualityManagement";
import {
  qualityManagementService,
  TemplateDto,
} from "../../../services/qualityManagementService";
import { API_BASE_URL } from "../../../services/api";
import userService, { UserLookupDto } from "../../../services/userService";
import { IndicatorName } from "../../../components/common";
import RichTextEditor from "../../../components/common/RichTextEditor";
import { evaluatePassFail, stripHtmlTags } from "../../../utils/formatters";

const { Text } = Typography;

// Print result item for batch print
interface PrintResultItem {
  fileName: string;
  laboratoryId: string;
  laboratoryName: string;
  templateName: string;
  sampleCode?: string;
  sampleName?: string;
}

export interface PrintModalProps {
  visible: boolean;
  taskId: string;
  indicators: QualityManagementIndicatorDto[];
  onCancel: () => void;
  onSuccess?: () => void;
}

// Group indicators by sample within a lab
interface SampleGroup {
  sampleId: string;
  sampleCode: string;
  sampleName: string;
  indicators: QualityManagementIndicatorDto[];
}

// Extended indicator with parent-child metadata for display
interface ProcessedIndicator extends QualityManagementIndicatorDto {
  _isParentWithChildren: boolean;
  _isSubIndicator: boolean;
  _isLastSubIndicator: boolean;
  _rowKey: string;
}

// Helper: tạo composite key từ indicatorId + methodId
const makeGroupKey = (indicatorId: string, methodId: string | null | undefined) =>
  `${indicatorId}_${methodId || "no-method"}`;

// Process indicators with parent-child hierarchy
// FIX: Xử lý trường hợp có nhiều parents cùng indicatorId+methodId
const processIndicatorsWithHierarchy = (
  indicators: QualityManagementIndicatorDto[]
): ProcessedIndicator[] => {
  const result: ProcessedIndicator[] = [];

  // Separate parents and subs
  const parents = indicators.filter((ind) => !ind.parentIndicatorId);
  const subs = indicators.filter((ind) => ind.parentIndicatorId);

  // Group parents by indicatorId+methodId -> array of parents
  const parentsByKey: Record<string, QualityManagementIndicatorDto[]> = {};
  parents.forEach((p) => {
    const key = makeGroupKey(p.indicatorId, p.methodId);
    if (!parentsByKey[key]) {
      parentsByKey[key] = [];
    }
    parentsByKey[key].push(p);
  });

  // Group subs by parentIndicatorId+methodId
  const subsByKey: Record<string, QualityManagementIndicatorDto[]> = {};
  subs.forEach((s) => {
    const key = makeGroupKey(s.parentIndicatorId!, s.methodId);
    if (!subsByKey[key]) {
      subsByKey[key] = [];
    }
    subsByKey[key].push(s);
  });

  // Create sub-to-parent mapping: distribute subs evenly among parents with same key
  const subToParentMapping: Record<string, string> = {};
  const orphans: QualityManagementIndicatorDto[] = [];

  Object.entries(subsByKey).forEach(([key, subList]) => {
    const parentList = parentsByKey[key] || [];
    if (parentList.length === 0) {
      subList.forEach((sub) => {
        subToParentMapping[sub.id] = "";
        orphans.push(sub);
      });
    } else if (parentList.length === 1) {
      subList.forEach((sub) => {
        subToParentMapping[sub.id] = parentList[0].id;
      });
    } else {
      const subsPerParent = Math.ceil(subList.length / parentList.length);
      subList.forEach((sub, idx) => {
        const parentIdx = Math.floor(idx / subsPerParent);
        const safeParentIdx = Math.min(parentIdx, parentList.length - 1);
        subToParentMapping[sub.id] = parentList[safeParentIdx].id;
      });
    }
  });

  // Build result: for each parent, add it and its assigned children
  parents.forEach((parent) => {
    const children = subs.filter((sub) => subToParentMapping[sub.id] === parent.id);
    const hasChildren = children.length > 0;

    result.push({
      ...parent,
      _isParentWithChildren: hasChildren,
      _isSubIndicator: false,
      _isLastSubIndicator: false,
      _rowKey: parent.id,
    });

    children.forEach((child, idx) => {
      result.push({
        ...child,
        _isParentWithChildren: false,
        _isSubIndicator: true,
        _isLastSubIndicator: idx === children.length - 1,
        _rowKey: child.id, // Use actual id for selection to work with API
      });
    });
  });

  // Add orphans
  orphans.forEach((ind) => {
    if (!result.some((r) => r.id === ind.id)) {
      result.push({
        ...ind,
        _isParentWithChildren: false,
        _isSubIndicator: true,
        _isLastSubIndicator: true,
        _rowKey: ind.id, // Use actual id for selection to work with API
      });
    }
  });

  return result;
};

// Group indicators by laboratory, then by sample
interface LabGroup {
  laboratoryId: string;
  laboratoryName: string;
  sampleGroups: SampleGroup[];
  allIndicatorIds: string[];
}

const PrintModal: React.FC<PrintModalProps> = ({
  visible,
  taskId,
  indicators,
  onCancel,
  onSuccess,
}) => {
  const [selectedIndicatorIds, setSelectedIndicatorIds] = useState<string[]>(
    [],
  );
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState<string>("");
  const [templates, setTemplates] = useState<TemplateDto[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [generatedResults, setGeneratedResults] = useState<PrintResultItem[]>(
    [],
  );
  const [showResults, setShowResults] = useState(false);
  const [viewedFiles, setViewedFiles] = useState<Set<string>>(new Set());
  const [vicePresidents, setVicePresidents] = useState<UserLookupDto[]>([]);
  const [selectedVicePresidentId, setSelectedVicePresidentId] = useState<
    string | undefined
  >(undefined);
  const [loadingVicePresidents, setLoadingVicePresidents] = useState(false);

  // Get approved indicators AND their parent indicators
  // Parent indicators don't have approvalStatus but need to be shown for hierarchy
  // RULE: Chỉ hiển thị parent indicator khi TẤT CẢ sub-indicators của nó đều đã được duyệt
  const approvedIndicatorsWithParents = useMemo(() => {
    // Separate parents and sub-indicators
    const parents = indicators.filter((ind) => !ind.parentIndicatorId);
    const subs = indicators.filter((ind) => ind.parentIndicatorId);

    // Group sub-indicators by parentKey (parentIndicatorId + methodId)
    const subsByParentKey: Record<string, QualityManagementIndicatorDto[]> = {};
    subs.forEach((sub) => {
      const parentKey = makeGroupKey(sub.parentIndicatorId!, sub.methodId);
      if (!subsByParentKey[parentKey]) {
        subsByParentKey[parentKey] = [];
      }
      subsByParentKey[parentKey].push(sub);
    });

    // Find parent keys where ALL sub-indicators are approved
    const fullyApprovedParentKeys = new Set<string>();
    Object.entries(subsByParentKey).forEach(([parentKey, subList]) => {
      const allSubsApproved = subList.every(
        (sub) => sub.approvalStatus === QualityIndicatorApprovalStatus.Approved,
      );
      if (allSubsApproved) {
        fullyApprovedParentKeys.add(parentKey);
      }
    });

    // Build result:
    // 1. Include parent indicators whose ALL subs are approved
    // 2. Include sub-indicators whose parent has ALL subs approved
    // 3. Include standalone approved indicators (no parent, no children)
    const result: QualityManagementIndicatorDto[] = [];

    // Add parent indicators that have ALL subs approved
    parents.forEach((parent) => {
      const parentKey = makeGroupKey(parent.indicatorId, parent.methodId);
      const hasSubIndicators = subsByParentKey[parentKey]?.length > 0;

      if (hasSubIndicators) {
        // Parent has sub-indicators -> only include if ALL subs are approved
        if (fullyApprovedParentKeys.has(parentKey)) {
          result.push(parent);
          // Also add all its sub-indicators
          subsByParentKey[parentKey].forEach((sub) => result.push(sub));
        }
        // If not all subs approved -> don't include parent or any subs
      } else {
        // Standalone parent (no sub-indicators) -> include if approved
        if (parent.approvalStatus === QualityIndicatorApprovalStatus.Approved) {
          result.push(parent);
        }
      }
    });

    // Add orphan sub-indicators (parent not in list) that are approved
    subs.forEach((sub) => {
      const parentKey = makeGroupKey(sub.parentIndicatorId!, sub.methodId);
      const parentExists = parents.some(
        (p) => makeGroupKey(p.indicatorId, p.methodId) === parentKey,
      );
      if (
        !parentExists &&
        sub.approvalStatus === QualityIndicatorApprovalStatus.Approved
      ) {
        // Check if already added
        if (!result.some((r) => r.id === sub.id)) {
          result.push(sub);
        }
      }
    });

    return result;
  }, [indicators]);

  // Get only approved indicator IDs (for selection - excludes parents with children)
  // Only includes indicators that are in approvedIndicatorsWithParents AND have approvalStatus = Approved
  const approvedIndicatorIds = useMemo(
    () =>
      approvedIndicatorsWithParents
        .filter(
          (ind) =>
            ind.approvalStatus === QualityIndicatorApprovalStatus.Approved,
        )
        .map((ind) => ind.id),
    [approvedIndicatorsWithParents],
  );

  // Group indicators by laboratory, then by sample
  const labGroups: LabGroup[] = useMemo(() => {
    const groups: Record<
      string,
      {
        lab: Omit<LabGroup, "sampleGroups" | "allIndicatorIds">;
        samples: Record<string, SampleGroup>;
      }
    > = {};

    approvedIndicatorsWithParents.forEach((indicator) => {
      const labId = indicator.laboratoryId || "unknown";
      const labName = indicator.laboratoryName || "Không xác định";
      const sampleId = indicator.sampleId || "unknown";

      if (!groups[labId]) {
        groups[labId] = {
          lab: { laboratoryId: labId, laboratoryName: labName },
          samples: {},
        };
      }

      if (!groups[labId].samples[sampleId]) {
        groups[labId].samples[sampleId] = {
          sampleId,
          sampleCode: indicator.sampleCode || "",
          sampleName: indicator.sampleName || "",
          indicators: [],
        };
      }

      groups[labId].samples[sampleId].indicators.push(indicator);
    });

    return Object.values(groups).map(({ lab, samples }) => {
      const sampleGroups = Object.values(samples);
      // allIndicatorIds only includes approved indicators (for selection)
      const allIndicatorIds = sampleGroups.flatMap((s) =>
        s.indicators
          .filter((i) => approvedIndicatorIds.includes(i.id))
          .map((i) => i.id),
      );
      return { ...lab, sampleGroups, allIndicatorIds };
    });
  }, [approvedIndicatorsWithParents, approvedIndicatorIds]);

  // Load templates when modal opens
  useEffect(() => {
    if (visible) {
      loadTemplates();
      loadVicePresidents();
    }
  }, [visible]);

  // Track previously selected IDs to detect new selections
  const prevSelectedIdsRef = React.useRef<string[]>([]);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedIndicatorIds([]);
      setSelectedTemplates([]);
      setNote("");
      setGeneratedResults([]);
      setShowResults(false);
      setViewedFiles(new Set());
      setSelectedVicePresidentId(undefined);
      prevSelectedIdsRef.current = []; // Reset ref
    }
  }, [visible]);

  // Auto-append notes when new indicators are selected
  useEffect(() => {
    const prevIds = prevSelectedIdsRef.current;
    const newlySelectedIds = selectedIndicatorIds.filter(
      (id) => !prevIds.includes(id),
    );

    if (newlySelectedIds.length > 0) {
      // Get newly selected indicators (use full list to get notes from approved indicators)
      const newIndicators = approvedIndicatorsWithParents.filter((ind) =>
        newlySelectedIds.includes(ind.id),
      );

      // Collect unique master data notes and free text notes
      // Note content is HTML (rich text) - use plain text for deduplication
      const existingPlainText = stripHtmlTags(note);
      const newHtmlParts: string[] = [];

      // First, collect all master data notes (deduplicated by plain text)
      const addedMasterNotes = new Set<string>();
      newIndicators.forEach((ind) => {
        if (ind.masterDataNotes && ind.masterDataNotes.length > 0) {
          ind.masterDataNotes.forEach((masterNote) => {
            if (masterNote) {
              const plainNote = stripHtmlTags(masterNote);
              if (
                plainNote &&
                !addedMasterNotes.has(plainNote) &&
                !existingPlainText.includes(plainNote)
              ) {
                addedMasterNotes.add(plainNote);
                newHtmlParts.push(masterNote);
              }
            }
          });
        }
      });

      // Then collect free text notes (deduplicated)
      // Keep original HTML from freeTextNote
      const addedFreeTexts = new Set<string>();
      newIndicators.forEach((ind) => {
        if (ind.freeTextNote && ind.freeTextNote.trim()) {
          const plainFreeText = stripHtmlTags(ind.freeTextNote);
          if (
            plainFreeText &&
            !addedFreeTexts.has(plainFreeText) &&
            !existingPlainText.includes(plainFreeText)
          ) {
            addedFreeTexts.add(plainFreeText);
            newHtmlParts.push(ind.freeTextNote);
          }
        }
      });

      // Append new notes as HTML
      if (newHtmlParts.length > 0) {
        setNote((prev) => {
          const trimmedPrev = stripHtmlTags(prev);
          if (trimmedPrev) {
            return prev + newHtmlParts.join("");
          }
          return newHtmlParts.join("");
        });
      }
    }

    // Update ref for next comparison
    prevSelectedIdsRef.current = selectedIndicatorIds;
  }, [selectedIndicatorIds, approvedIndicatorsWithParents]);

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const result = await qualityManagementService.getTemplates();
      setTemplates(result);
      // Set BM01 as default selected template
      if (result.length > 0) {
        const bm01 = result.find((t) => t.name.includes("BM01"));
        setSelectedTemplates([bm01?.name || result[0].name]);
      }
    } catch (error) {
      console.error("Error loading templates:", error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const loadVicePresidents = async () => {
    setLoadingVicePresidents(true);
    try {
      const result = await userService.getVicePresidents();
      setVicePresidents(result);
    } catch (error) {
      console.error("Error loading vice presidents:", error);
    } finally {
      setLoadingVicePresidents(false);
    }
  };

  // Function to open all tabs - triggered by user click (available for future use)
  const _handleOpenAllTabs = () => {
    let blockedCount = 0;

    // Try to open all PDFs
    generatedResults.forEach((item) => {
      const pdfUrl = `${API_BASE_URL}/api/v1/result-forms/view/${encodeURIComponent(
        item.fileName,
      )}`;
      const newWindow = window.open(pdfUrl, "_blank");

      // Check if popup was blocked
      if (
        !newWindow ||
        newWindow.closed ||
        typeof newWindow.closed === "undefined"
      ) {
        blockedCount++;
      }
    });

    // If some popups were blocked, show instruction
    if (blockedCount > 0) {
      Modal.warning({
        title: "Trình duyệt đã chặn popup",
        content: (
          <div>
            <p>Trình duyệt đã chặn {blockedCount} cửa sổ popup.</p>
            <p>Để mở tất cả file PDF, vui lòng:</p>
            <ol>
              <li>
                Click vào biểu tượng popup bị chặn trên thanh địa chỉ (thường ở
                góc phải)
              </li>
              <li>Chọn "Luôn cho phép popup từ trang này"</li>
              <li>Sau đó click lại nút "Mở toàn bộ"</li>
            </ol>
            <p>Hoặc bạn có thể click từng nút "Xem PDF" bên dưới.</p>
          </div>
        ),
        okText: "Đã hiểu",
      });
    }
  };

  // Suppress unused variable warning
  void _handleOpenAllTabs;

  // Get indicator IDs to send to API
  // NOTE: Only send approved indicator IDs (sub-indicators with results)
  // Parents are NOT approved (no results), backend should handle grouping using parentIndicatorId
  const getIndicatorIdsForPrint = (): string[] => {
    // Only return selected indicator IDs (which are already filtered to approved only)
    return [...selectedIndicatorIds];
  };

  const handlePrint = async () => {
    if (selectedIndicatorIds.length === 0) {
      message.warning("Vui lòng chọn ít nhất một chỉ tiêu để in");
      return;
    }

    if (selectedTemplates.length === 0) {
      message.warning("Vui lòng chọn ít nhất một biểu mẫu");
      return;
    }

    setLoading(true);

    // Get indicator IDs including parents
    const indicatorIdsForPrint = getIndicatorIdsForPrint();

    try {
      // Call API to generate PDFs (batch processing)
      const result = await qualityManagementService.printMultiSingleResult(
        taskId,
        indicatorIdsForPrint,
        selectedTemplates,
        note || undefined,
        selectedVicePresidentId,
      );

      message.success(`Đã tạo ${result.results.length} phiếu kết quả`);

      // Store results and show results view
      setGeneratedResults(result.results);
      setShowResults(true);
    } catch (error: any) {
      console.error("Error printing:", error);
      message.error(
        error?.response?.data?.error?.message || "Không thể in kết quả",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCloseResults = () => {
    setShowResults(false);
    setGeneratedResults([]);
    setSelectedIndicatorIds([]);
    setNote("");
    onCancel();
    onSuccess?.();
  };

  const handleCancel = () => {
    setSelectedIndicatorIds([]);
    setSelectedTemplates([]);
    setNote("");
    setGeneratedResults([]);
    setShowResults(false);
    setSelectedVicePresidentId(undefined);
    onCancel();
  };

  // Open Word editor in new tab
  const handleOpenEditor = (fileName: string) => {
    // Get the .docx file name (replace .pdf extension if any)
    const docxFileName = fileName.replace(/\.pdf$/i, ".docx");
    // Open in new tab with full screen editor
    window.open(
      `/document-editor?file=${encodeURIComponent(docxFileName)}`,
      "_blank",
    );
    // Mark file as viewed
    setViewedFiles((prev) => new Set(prev).add(fileName));
  };

  const columns: ColumnsType<ProcessedIndicator> = [
    {
      title: "Tên chỉ tiêu",
      dataIndex: "indicatorName",
      key: "indicatorName",
      ellipsis: true,
      render: (value: string, record: ProcessedIndicator) => {
        const content = value ? (
          <IndicatorName
            name={value}
            formattedName={record.indicatorFormattedName}
          />
        ) : (
          "-"
        );

        // Tree line for sub-indicators
        const classNames = ["print-indicator-name-wrapper"];
        if (record._isSubIndicator) {
          classNames.push("has-tree-line");
          if (record._isLastSubIndicator) classNames.push("is-last-sub");
        }

        return (
          <div
            className={classNames.join(" ")}
            style={{
              paddingLeft: record._isSubIndicator ? 24 : 0,
              position: "relative",
            }}
          >
            {content}
          </div>
        );
      },
    },
    {
      title: "Phương pháp",
      dataIndex: "methodName",
      key: "methodName",
      ellipsis: true,
      render: (_: any, record: ProcessedIndicator) => (
        <IndicatorName
          name={record.methodName || ""}
          formattedName={record.methodFormattedName}
        />
      ),
    },
    {
      title: "ĐVT",
      dataIndex: "unit",
      key: "unit",
      width: 70,
      render: (text: string, record: ProcessedIndicator) => {
        if (record._isParentWithChildren) return "-";
        return text ? <IndicatorName name={text} /> : "-";
      },
    },
    {
      title: "Kết quả",
      dataIndex: "result",
      key: "result",
      width: 100,
      render: (text: string, record: ProcessedIndicator) => {
        if (record._isParentWithChildren) return "-";
        return <Text strong>{text || "-"}</Text>;
      },
    },
    {
      title: "Giới hạn",
      key: "limit",
      width: 100,
      render: (_: any, record: ProcessedIndicator) => {
        if (record._isParentWithChildren) return "-";
        if (record.comparisonOperator && record.allowedLimit) {
          return (
            <Text>
              {record.comparisonOperator} {record.allowedLimit}
            </Text>
          );
        }
        return "-";
      },
    },
    {
      title: "Tiêu chuẩn",
      dataIndex: "standardName",
      key: "standardName",
      width: 120,
      ellipsis: true,
      render: (text: string, record: ProcessedIndicator) => {
        if (record._isParentWithChildren) return "-";
        return text || "-";
      },
    },
    {
      title: "Kết luận",
      key: "conclusion",
      width: 100,
      render: (_: any, record: ProcessedIndicator) => {
        if (record._isParentWithChildren) return "-";

        const passFailStatus = evaluatePassFail(
          record.result,
          record.comparisonOperator,
          record.allowedLimit,
        );

        if (passFailStatus === "pass") {
          return (
            <Text strong style={{ color: "#52c41a" }}>
              Đạt
            </Text>
          );
        } else if (passFailStatus === "fail") {
          return (
            <Text strong style={{ color: "#ff4d4f" }}>
              Không đạt
            </Text>
          );
        }
        return "-";
      },
    },
  ];

  // Render results view when documents are generated
  if (showResults) {
    return (
      <Modal
        title={
          <span>
            <FileWordOutlined style={{ marginRight: 8, color: "#2b579a" }} />
            Kết quả đã tạo ({generatedResults.length} file)
          </span>
        }
        open={visible}
        onCancel={handleCloseResults}
        width={700}
        centered
        footer={null}
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">
            Click "Xem" để mở tài liệu trong trình soạn thảo Word.
          </Text>
        </div>
        <div style={{ maxHeight: "calc(100vh - 350px)", overflowY: "auto" }}>
          <List
            dataSource={generatedResults}
            renderItem={(item, index) => {
              const isViewed = viewedFiles.has(item.fileName);
              return (
                <List.Item
                  actions={[
                    <Button
                      type={isViewed ? "default" : "primary"}
                      icon={<FileWordOutlined />}
                      onClick={() => handleOpenEditor(item.fileName)}
                      style={
                        isViewed
                          ? { color: "#52c41a", borderColor: "#52c41a" }
                          : undefined
                      }
                    >
                      {isViewed ? "Đã xem" : "Xem"}
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <FileWordOutlined
                        style={{
                          fontSize: 24,
                          color: isViewed ? "#52c41a" : "#2b579a",
                        }}
                      />
                    }
                    title={`File ${index + 1}: ${item.laboratoryName || "Document"}${
                      item.sampleCode ? ` - ${item.sampleCode}` : ""
                    }`}
                    description={`Template: ${item.templateName || "BM01"}`}
                  />
                </List.Item>
              );
            }}
          />
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      className="quality-print-modal"
      title={
        <span>
          <PrinterOutlined style={{ marginRight: 8 }} />
          In kết quả đơn
        </span>
      }
      open={visible}
      onCancel={handleCancel}
      width={1200}
      centered
      styles={{
        body: {
          maxHeight: "calc(100vh - 200px)",
          overflowY: "auto",
          overflowX: "hidden",
        },
      }}
      footer={
        <Space>
          <Button onClick={handleCancel}>Hủy</Button>
          <Button
            type="primary"
            icon={<PrinterOutlined />}
            onClick={handlePrint}
            loading={loading}
            disabled={
              selectedIndicatorIds.length === 0 ||
              loadingTemplates ||
              selectedTemplates.length === 0
            }
          >
            In ({selectedIndicatorIds.length} chỉ tiêu)
          </Button>
        </Space>
      }
    >
      {loadingTemplates ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin tip="Đang tải dữ liệu..." />
        </div>
      ) : approvedIndicatorIds.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Text type="secondary">Không có chỉ tiêu nào đã được duyệt</Text>
        </div>
      ) : (
        <Row gutter={24}>
          {/* Left column - Indicators grouped by Lab > Sample */}
          <Col span={16} style={{ overflow: "hidden" }}>
            <div
              style={{
                maxHeight: "calc(100vh - 280px)",
                overflowY: "auto",
                overflowX: "hidden",
              }}
            >
              <Collapse
                className="quality-print-lab-collapse"
                defaultActiveKey={labGroups.map((lg) => lg.laboratoryId)}
                expandIconPosition="end"
                style={{ background: "transparent", border: "none" }}
                items={labGroups.map((labGroup, labIndex) => {
                  const selectedInLab = labGroup.allIndicatorIds.filter((id) =>
                    selectedIndicatorIds.includes(id),
                  ).length;
                  const allLabSelected =
                    selectedInLab === labGroup.allIndicatorIds.length;
                  const someLabSelected = selectedInLab > 0 && !allLabSelected;
                  const isLastLab = labIndex === labGroups.length - 1;

                  return {
                    key: labGroup.laboratoryId,
                    label: (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={allLabSelected}
                          indeterminate={someLabSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (e.target.checked) {
                              setSelectedIndicatorIds([
                                ...new Set([
                                  ...selectedIndicatorIds,
                                  ...labGroup.allIndicatorIds,
                                ]),
                              ]);
                            } else {
                              setSelectedIndicatorIds(
                                selectedIndicatorIds.filter(
                                  (id) =>
                                    !labGroup.allIndicatorIds.includes(id),
                                ),
                              );
                            }
                          }}
                        />
                        <Text strong style={{ fontSize: 14, color: "#0958d9" }}>
                          {labGroup.laboratoryName}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          ({selectedInLab}/{labGroup.allIndicatorIds.length} chỉ
                          tiêu)
                        </Text>
                      </div>
                    ),
                    style: {
                      marginBottom: isLastLab ? 0 : 8,
                      borderRadius: 8,
                      border: "1px solid var(--ant-color-border)",
                      background: "#F0F5FF",
                    },
                    children: (
                      <div style={{ margin: "-16px" }}>
                        <Collapse
                          defaultActiveKey={labGroup.sampleGroups.map(
                            (sg) => sg.sampleId,
                          )}
                          expandIconPosition="end"
                          style={{ background: "transparent", border: "none" }}
                          items={labGroup.sampleGroups.map(
                            (sampleGroup, sampleIndex) => {
                              // Only include approved indicator IDs (exclude parents which have approvalStatus: 0)
                              const sampleIndicatorIds = sampleGroup.indicators
                                .filter((i) => approvedIndicatorIds.includes(i.id))
                                .map((i) => i.id);
                              const selectedInSample =
                                sampleIndicatorIds.filter((id) =>
                                  selectedIndicatorIds.includes(id),
                                ).length;
                              const allSampleSelected =
                                selectedInSample === sampleIndicatorIds.length;
                              const someSampleSelected =
                                selectedInSample > 0 && !allSampleSelected;
                              const isLastSample =
                                sampleIndex ===
                                labGroup.sampleGroups.length - 1;

                              return {
                                key: sampleGroup.sampleId,
                                label: (
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 8,
                                      flex: 1,
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Checkbox
                                      checked={allSampleSelected}
                                      indeterminate={someSampleSelected}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        if (e.target.checked) {
                                          setSelectedIndicatorIds([
                                            ...new Set([
                                              ...selectedIndicatorIds,
                                              ...sampleIndicatorIds,
                                            ]),
                                          ]);
                                        } else {
                                          setSelectedIndicatorIds(
                                            selectedIndicatorIds.filter(
                                              (id) =>
                                                !sampleIndicatorIds.includes(
                                                  id,
                                                ),
                                            ),
                                          );
                                        }
                                      }}
                                    />
                                    <Text style={{ fontSize: 13 }}>
                                      {sampleGroup.sampleCode}
                                    </Text>
                                    {sampleGroup.sampleName && (
                                      <Text
                                        type="secondary"
                                        style={{ fontSize: 12 }}
                                      >
                                        - {sampleGroup.sampleName}
                                      </Text>
                                    )}
                                  </div>
                                ),
                                style: {
                                  marginBottom: 0,
                                  background: "none",
                                  borderRadius: isLastSample
                                    ? "0 0 8px 8px"
                                    : 0,
                                  border: "none",
                                  borderTop:
                                    sampleIndex > 0
                                      ? "1px solid #e8e8e8"
                                      : "none",
                                },
                                children: (() => {
                                  // Process indicators with parent-child hierarchy
                                  const processedIndicators = processIndicatorsWithHierarchy(sampleGroup.indicators);

                                  return (
                                    <Card
                                      size="small"
                                      style={{
                                        borderRadius: 8,
                                        overflow: "hidden",
                                        boxShadow: "none",
                                      }}
                                      bodyStyle={{ padding: 0 }}
                                    >
                                      <style>
                                        {`
                                          /* Ensure sub/sup tags inherit text color properly */
                                          .ant-table sub,
                                          .ant-table sup,
                                          .ant-table-cell sub,
                                          .ant-table-cell sup {
                                            color: inherit !important;
                                          }
                                          /* Tree line styles for sub-indicators in print modal */
                                          .print-indicator-name-wrapper {
                                            position: relative;
                                          }
                                          .print-indicator-name-wrapper.has-tree-line::before {
                                            content: '';
                                            position: absolute;
                                            left: 0;
                                            top: -100%;
                                            bottom: -100%;
                                            width: 1px;
                                            background-color: #d9d9d9;
                                          }
                                          .print-indicator-name-wrapper.has-tree-line::after {
                                            content: '';
                                            position: absolute;
                                            left: 0;
                                            top: 50%;
                                            width: 16px;
                                            height: 1px;
                                            background-color: #d9d9d9;
                                          }
                                          .print-indicator-name-wrapper.has-tree-line.is-last-sub::before {
                                            bottom: 50%;
                                          }
                                          .print-parent-row > td {
                                            background-color: #f5f5f5 !important;
                                            font-weight: 500;
                                          }
                                          .print-sub-row > td {
                                            background-color: #fafafa !important;
                                          }
                                        `}
                                      </style>
                                      <Table
                                        dataSource={processedIndicators}
                                        columns={columns}
                                        rowKey="_rowKey"
                                        size="small"
                                        pagination={false}
                                        scroll={{ x: "max-content" }}
                                        bordered
                                        style={{ maxWidth: "100%" }}
                                        rowClassName={(record: ProcessedIndicator) => {
                                          if (record._isParentWithChildren) return "print-parent-row";
                                          if (record._isSubIndicator) return "print-sub-row";
                                          return "";
                                        }}
                                        rowSelection={{
                                          selectedRowKeys: selectedIndicatorIds,
                                          onChange: (keys) => {
                                            const otherIds =
                                              selectedIndicatorIds.filter(
                                                (id) =>
                                                  !sampleIndicatorIds.includes(
                                                    id,
                                                  ),
                                              );
                                            setSelectedIndicatorIds([
                                              ...otherIds,
                                              ...(keys as string[]),
                                            ]);
                                          },
                                          type: "checkbox",
                                          getCheckboxProps: (record: ProcessedIndicator) => ({
                                            // Disable checkbox for parent indicators with children
                                            disabled: record._isParentWithChildren,
                                          }),
                                        }}
                                      />
                                    </Card>
                                  );
                                })(),
                              };
                            },
                          )}
                        />
                      </div>
                    ),
                  };
                })}
              />
            </div>
          </Col>

          {/* Right column - Options */}
          <Col span={8}>
            <div style={{ marginBottom: 24 }}>
              <Text strong style={{ display: "block", marginBottom: 12 }}>
                Chọn biểu mẫu báo cáo:
              </Text>
              <Checkbox.Group
                value={selectedTemplates}
                onChange={(values) =>
                  setSelectedTemplates(values as string[])
                }
              >
                <Space direction="vertical">
                  {templates.map((template) => (
                    <Checkbox key={template.name} value={template.name}>
                      {template.displayName}
                    </Checkbox>
                  ))}
                </Space>
              </Checkbox.Group>
            </div>

            {/* Vice President selection */}
            <div style={{ marginBottom: 24 }}>
              <Text strong style={{ display: "block", marginBottom: 8 }}>
                Phó Giám đốc ký (không bắt buộc)
              </Text>
              <Select
                style={{ width: "100%" }}
                placeholder="Chọn"
                allowClear
                showSearch
                optionFilterProp="label"
                loading={loadingVicePresidents}
                value={selectedVicePresidentId}
                onChange={(value) => setSelectedVicePresidentId(value)}
                options={vicePresidents.map((vp) => ({
                  value: vp.id,
                  label: vp.displayName,
                }))}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Nếu chọn, tên sẽ được thay thế v...
              </Text>
            </div>

            {/* Note input field */}
            <div>
              <Text strong style={{ display: "block", marginBottom: 8 }}>
                Ghi chú (không bắt buộc)
              </Text>
              <RichTextEditor
                value={note}
                onChange={(html) => setNote(html)}
                placeholder="Nhập ghi chú sẽ được đưa vào phần cuối của báo cáo..."
                showToolbar
                minHeight={100}
              />
            </div>
          </Col>
        </Row>
      )}
    </Modal>
  );
};

export default PrintModal;
