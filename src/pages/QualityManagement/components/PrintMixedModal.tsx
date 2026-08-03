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
  Radio,
} from "antd";
import {
  PrinterOutlined,
  FileWordOutlined,
  FolderOpenOutlined,
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
import { testRequestService } from "../../../services/testRequestService";
import userService, { UserLookupDto } from "../../../services/userService";
import { isServerReachable } from "../../../services/offline/connectivity";
import {
  mapIndicators,
  buildMixedHeaderExtras,
} from "../../../services/offline/offlineResultService";
import {
  generateMixedResultFormOffline,
  downloadDocument,
} from "../../../services/offline/offlinePrintService";
import { IndicatorName, PrintCopyCountAlert, EllipsisTooltip } from "../../../components/common";
import RichTextEditor from "../../../components/common/RichTextEditor";
import { evaluatePassFail, stripHtmlTags } from "../../../utils/formatters";
import { ResultLanguage } from "../../../types/testRequest";
import { noteService } from "../../../services/noteService";
import { NoteDto } from "../../../types/note";

const { Text } = Typography;

interface PrintResultItem {
  fileName: string;
  laboratoryId?: string;
  laboratoryName?: string;
  templateName: string;
  sampleCode?: string;
  sampleName?: string;
}

export interface PrintMixedModalProps {
  visible: boolean;
  taskId: string;
  /** Id TestRequest - dùng để lấy "Số bản" cho cảnh báo số bản in */
  testRequestId?: string;
  indicators: QualityManagementIndicatorDto[];
  taskContext?: {
    contractNumber?: string;
    customerName?: string;
    testRequestId?: string;
    technicalManagerNames?: string;
    labManagerNameById?: Record<string, string>;
  };
  onCancel: () => void;
  onSuccess?: () => void;
}

interface SampleGroupWithLabs {
  sampleId: string;
  sampleCode: string;
  sampleName: string;
  indicators: QualityManagementIndicatorDto[];
  allIndicatorIds: string[];
}

interface ProcessedIndicator extends QualityManagementIndicatorDto {
  _isParentWithChildren: boolean;
  _isSubIndicator: boolean;
  _isLastSubIndicator: boolean;
  _rowKey: string;
}

const makeGroupKey = (indicatorId: string, methodId: string | null | undefined) =>
  `${indicatorId}_${methodId || "no-method"}`;

const getLabSortOrder = (labName: string): number => {
  const lower = labName.toLowerCase();
  if (lower.includes("vi sinh")) return 0;
  if (lower.includes("hoá") || lower.includes("hóa")) return 1;
  return 2;
};

const isPerSampleTemplate = (templateName: string): boolean => {
  const lower = templateName.toLowerCase();
  return lower.includes("qlnn") || (lower.includes("bm05") && !lower.includes("bm05-qt07"));
};

const processIndicatorsWithHierarchy = (
  indicators: QualityManagementIndicatorDto[]
): ProcessedIndicator[] => {
  const result: ProcessedIndicator[] = [];

  const parents = indicators.filter((ind) => !ind.parentIndicatorId);
  const subs = indicators.filter((ind) => ind.parentIndicatorId);

  const parentsByKey: Record<string, QualityManagementIndicatorDto[]> = {};
  parents.forEach((p) => {
    const key = makeGroupKey(p.indicatorId, p.methodId);
    if (!parentsByKey[key]) parentsByKey[key] = [];
    parentsByKey[key].push(p);
  });

  const subsByKey: Record<string, QualityManagementIndicatorDto[]> = {};
  subs.forEach((s) => {
    const key = makeGroupKey(s.parentIndicatorId!, s.methodId);
    if (!subsByKey[key]) subsByKey[key] = [];
    subsByKey[key].push(s);
  });

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
        subToParentMapping[sub.id] = parentList[Math.min(parentIdx, parentList.length - 1)].id;
      });
    }
  });

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
        _rowKey: child.id,
      });
    });
  });

  orphans.forEach((ind) => {
    if (!result.some((r) => r.id === ind.id)) {
      result.push({
        ...ind,
        _isParentWithChildren: false,
        _isSubIndicator: true,
        _isLastSubIndicator: true,
        _rowKey: ind.id,
      });
    }
  });

  return result;
};

const PrintMixedModal: React.FC<PrintMixedModalProps> = ({
  visible,
  taskId,
  testRequestId,
  indicators,
  taskContext,
  onCancel,
  onSuccess,
}) => {
  const [selectedIndicatorIds, setSelectedIndicatorIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState<string>("");
  const [mixedTemplates, setMixedTemplates] = useState<TemplateDto[]>([]);
  const [selectedMixedTemplate, setSelectedMixedTemplate] = useState<string>("");
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [generatedResults, setGeneratedResults] = useState<PrintResultItem[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [viewedFiles, setViewedFiles] = useState<Set<string>>(new Set());
  const [vicePresidents, setVicePresidents] = useState<UserLookupDto[]>([]);
  const [selectedVicePresidentId, setSelectedVicePresidentId] = useState<string | undefined>(undefined);
  const [loadingVicePresidents, setLoadingVicePresidents] = useState(false);
  const [resultRequirement, setResultRequirement] = useState<{
    resultCopyCount?: string;
    resultLanguage?: ResultLanguage;
    conformityDeclaration?: string;
    otherRequirements?: string;
    separatePassedResults?: boolean;
  }>({});
  const [masterNotes, setMasterNotes] = useState<NoteDto[]>([]);
  const [selectedMasterNoteIds, setSelectedMasterNoteIds] = useState<Set<string>>(new Set());

  const approvedIndicatorsWithParents = useMemo(() => {
    const parents = indicators.filter((ind) => !ind.parentIndicatorId);
    const subs = indicators.filter((ind) => ind.parentIndicatorId);

    const subsByParentKey: Record<string, QualityManagementIndicatorDto[]> = {};
    subs.forEach((sub) => {
      const parentKey = makeGroupKey(sub.parentIndicatorId!, sub.methodId);
      if (!subsByParentKey[parentKey]) subsByParentKey[parentKey] = [];
      subsByParentKey[parentKey].push(sub);
    });

    const fullyApprovedParentKeys = new Set<string>();
    Object.entries(subsByParentKey).forEach(([parentKey, subList]) => {
      if (subList.every((sub) => sub.approvalStatus === QualityIndicatorApprovalStatus.Approved)) {
        fullyApprovedParentKeys.add(parentKey);
      }
    });

    const result: QualityManagementIndicatorDto[] = [];

    parents.forEach((parent) => {
      const parentKey = makeGroupKey(parent.indicatorId, parent.methodId);
      const hasSubIndicators = subsByParentKey[parentKey]?.length > 0;

      if (hasSubIndicators) {
        if (fullyApprovedParentKeys.has(parentKey)) {
          result.push(parent);
          subsByParentKey[parentKey].forEach((sub) => result.push(sub));
        }
      } else {
        if (parent.approvalStatus === QualityIndicatorApprovalStatus.Approved) {
          result.push(parent);
        }
      }
    });

    subs.forEach((sub) => {
      const parentKey = makeGroupKey(sub.parentIndicatorId!, sub.methodId);
      const parentExists = parents.some(
        (p) => makeGroupKey(p.indicatorId, p.methodId) === parentKey,
      );
      if (!parentExists && sub.approvalStatus === QualityIndicatorApprovalStatus.Approved) {
        if (!result.some((r) => r.id === sub.id)) result.push(sub);
      }
    });

    return result;
  }, [indicators]);

  const approvedIndicatorIds = useMemo(
    () =>
      approvedIndicatorsWithParents
        .filter((ind) => ind.approvalStatus === QualityIndicatorApprovalStatus.Approved)
        .map((ind) => ind.id),
    [approvedIndicatorsWithParents],
  );

  // Group by sample, sort indicators within each sample by lab (Vi sinh first, Hoá after)
  const sampleGroups: SampleGroupWithLabs[] = useMemo(() => {
    const groups: Record<string, { sampleCode: string; sampleName: string; indicators: QualityManagementIndicatorDto[] }> = {};

    approvedIndicatorsWithParents.forEach((indicator) => {
      const sampleId = indicator.sampleId || "unknown";
      if (!groups[sampleId]) {
        groups[sampleId] = {
          sampleCode: indicator.sampleCode || "",
          sampleName: indicator.sampleName || "",
          indicators: [],
        };
      }
      groups[sampleId].indicators.push(indicator);
    });

    return Object.entries(groups).map(([sampleId, data]) => {
      const sorted = [...data.indicators].sort((a, b) =>
        getLabSortOrder(a.laboratoryName || "") - getLabSortOrder(b.laboratoryName || ""),
      );
      const allIndicatorIds = sorted
        .filter((i) => approvedIndicatorIds.includes(i.id))
        .map((i) => i.id);
      return {
        sampleId,
        sampleCode: data.sampleCode,
        sampleName: data.sampleName,
        indicators: sorted,
        allIndicatorIds,
      };
    }).sort((a, b) => a.sampleCode.localeCompare(b.sampleCode, undefined, { numeric: true }));
  }, [approvedIndicatorsWithParents, approvedIndicatorIds]);

  useEffect(() => {
    if (visible) {
      loadTemplates();
      loadVicePresidents();
      loadResultCopyCount();
      loadMasterNotes();
      loadLastPrintConfig();
    }
  }, [visible]);

  const prevSelectedIdsRef = React.useRef<string[]>([]);

  useEffect(() => {
    if (visible) {
      setSelectedIndicatorIds([]);
      setSelectedMixedTemplate("");
      setNote("");
      setGeneratedResults([]);
      setShowResults(false);
      setViewedFiles(new Set());
      setSelectedVicePresidentId(undefined);
      setSelectedMasterNoteIds(new Set());
      prevSelectedIdsRef.current = [];
    }
  }, [visible]);

  const handleToggleMasterNote = (noteId: string) => {
    setSelectedMasterNoteIds((prev) => {
      const next = new Set(prev);
      if (next.has(noteId)) next.delete(noteId);
      else next.add(noteId);
      return next;
    });
  };

  useEffect(() => {
    const prevIds = prevSelectedIdsRef.current;
    const newlySelectedIds = selectedIndicatorIds.filter((id) => !prevIds.includes(id));

    if (newlySelectedIds.length > 0) {
      const newIndicators = approvedIndicatorsWithParents.filter((ind) =>
        newlySelectedIds.includes(ind.id),
      );

      // Auto-tick master data notes matching the indicator's assigned notes
      const newMasterNoteIds = new Set<string>();
      newIndicators.forEach((ind) => {
        ind.masterDataNotes?.forEach((noteContent) => {
          if (noteContent) {
            const plainContent = stripHtmlTags(noteContent);
            const matched = masterNotes.find(
              (n) => stripHtmlTags(n.content) === plainContent,
            );
            if (matched) newMasterNoteIds.add(matched.id);
          }
        });
      });
      if (newMasterNoteIds.size > 0) {
        setSelectedMasterNoteIds((prev) => {
          const next = new Set(prev);
          newMasterNoteIds.forEach((id) => next.add(id));
          return next;
        });
      }

      // Collect free text notes
      const existingPlainText = stripHtmlTags(note);
      const newHtmlParts: string[] = [];

      const addedFreeTexts = new Set<string>();
      newIndicators.forEach((ind) => {
        if (ind.freeTextNote && ind.freeTextNote.trim()) {
          const plainFreeText = stripHtmlTags(ind.freeTextNote);
          if (plainFreeText && !addedFreeTexts.has(plainFreeText) && !existingPlainText.includes(plainFreeText)) {
            addedFreeTexts.add(plainFreeText);
            newHtmlParts.push(ind.freeTextNote);
          }
        }
      });

      if (newHtmlParts.length > 0) {
        setNote((prev) => {
          const trimmedPrev = stripHtmlTags(prev);
          if (trimmedPrev) return prev + newHtmlParts.join("");
          return newHtmlParts.join("");
        });
      }
    }

    prevSelectedIdsRef.current = selectedIndicatorIds;
  }, [selectedIndicatorIds, approvedIndicatorsWithParents, masterNotes]);

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const result = await qualityManagementService.getMixedTemplates();
      setMixedTemplates(result);
      if (result.length > 0) {
        const bm02 = result.find((t) => t.name.includes("BM02"));
        setSelectedMixedTemplate(bm02?.name || result[0].name);
      }
    } catch (error) {
      console.error("Error loading mixed templates:", error);
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

  const loadMasterNotes = async () => {
    try {
      const notes = await noteService.getActiveNotes();
      setMasterNotes(notes || []);
    } catch (error) {
      console.error("Error loading master notes:", error);
      setMasterNotes([]);
    }
  };

  const loadLastPrintConfig = async () => {
    try {
      const config = await qualityManagementService.getLastPrintConfig(taskId);
      if (config) {
        if (config.selectedMasterNoteIds?.length) {
          setSelectedMasterNoteIds(new Set(config.selectedMasterNoteIds));
        }
        if (config.freeTextNote) {
          setNote(config.freeTextNote);
        }
        if (config.vicePresidentId) {
          setSelectedVicePresidentId(config.vicePresidentId);
        }
      }
    } catch (error) {
      console.error("Error loading last print config:", error);
    }
  };

  // Lấy "Số bản" từ TestRequest để hiển thị cảnh báo số bản in
  const loadResultCopyCount = async () => {
    if (!testRequestId) return;
    try {
      const result = await testRequestService.get(testRequestId);
      setResultRequirement({
        resultCopyCount: result.resultCopyCount,
        resultLanguage: result.resultLanguage,
        conformityDeclaration: result.conformityDeclaration,
        otherRequirements: result.otherRequirements,
        separatePassedResults: result.separatePassedResults,
      });
    } catch (error) {
      console.error("Error loading test request:", error);
    }
  };

  const handleOpenAllTabs = () => {
    let blockedCount = 0;
    generatedResults.forEach((item) => {
      const docxFileName = item.fileName.replace(/\.pdf$/i, ".docx");
      const newWindow = window.open(`/document-editor?file=${encodeURIComponent(docxFileName)}`, "_blank");
      if (!newWindow || newWindow.closed || typeof newWindow.closed === "undefined") {
        blockedCount++;
      }
    });

    if (blockedCount > 0) {
      Modal.warning({
        title: "Trình duyệt đã chặn popup",
        content: (
          <div>
            <p>Trình duyệt đã chặn {blockedCount} cửa sổ popup.</p>
            <p>Vui lòng cho phép popup từ trang này và thử lại.</p>
          </div>
        ),
        okText: "Đã hiểu",
      });
    }
  };

  const handlePrint = async () => {
    if (selectedIndicatorIds.length === 0) {
      message.warning("Vui lòng chọn ít nhất một chỉ tiêu để in");
      return;
    }

    // Merge checked master data notes + free text note
    const checkedNoteHtmls = masterNotes
      .filter((n) => selectedMasterNoteIds.has(n.id))
      .map((n) => {
        const c = n.content?.trim();
        if (!c) return "";
        return /<[a-z]/i.test(c) ? c : `<p>${c}</p>`;
      })
      .filter(Boolean);
    const hasEditorText = stripHtmlTags(note).trim().length > 0;
    const finalNote =
      [...checkedNoteHtmls, ...(hasEditorText ? [note] : [])].join("") ||
      undefined;

    const masterNoteIdsArray = [...selectedMasterNoteIds];
    const freeTextToSave = hasEditorText ? note : undefined;

    // ---- Offline fallback ----
    if (!(await isServerReachable())) {
      if (isPerSampleTemplate(selectedMixedTemplate)) {
        message.warning("Không hỗ trợ in offline cho biểu mẫu QLNN/BM05. Vui lòng kết nối mạng.");
        return;
      }

      const selectedLeaves = approvedIndicatorsWithParents.filter((ind) =>
        selectedIndicatorIds.includes(ind.id),
      );

      setLoading(true);
      try {
        const selectedVp = vicePresidents.find((v) => v.id === selectedVicePresidentId);
        const vicePresidentName = selectedVp
          ? [selectedVp.surname, selectedVp.name].filter(Boolean).join(" ").trim() || selectedVp.userName
          : "";

        const labManagerById = taskContext?.labManagerNameById || {};
        const officerFor = (leaves: QualityManagementIndicatorDto[], fallback?: string): string => {
          const names = Array.from(
            new Set(leaves.map((l) => labManagerById[l.laboratoryId || ""]).filter((n): n is string => !!n)),
          );
          return names.join(", ") || fallback || taskContext?.technicalManagerNames || "";
        };

        const extras = await buildMixedHeaderExtras(taskContext?.testRequestId, selectedLeaves);
        const mixedParentIds = new Set(
          selectedLeaves.filter((ind) => ind.parentIndicatorId).map((ind) => ind.parentIndicatorId!),
        );
        const mixedParents = approvedIndicatorsWithParents.filter(
          (ind) => !ind.parentIndicatorId && mixedParentIds.has(ind.indicatorId),
        );
        const g = await generateMixedResultFormOffline(
          {
            ContractNumber: taskContext?.contractNumber || "",
            CustomerName: taskContext?.customerName || "",
            Note: finalNote || "",
            DateOfReceiving: extras.DateOfReceiving,
            DateOfIssue: extras.DateOfIssue,
            TimeOfTesting: extras.TimeOfTesting,
            OfficerInCharge: officerFor(selectedLeaves, extras.OfficerInCharge),
            VicePresident: vicePresidentName,
          },
          mapIndicators(selectedLeaves),
          mapIndicators(mixedParents),
        );

        if (!g.success || !g.blob || !g.fileName) {
          message.error(g.error || "Không thể tạo phiếu kết quả offline.");
          return;
        }
        downloadDocument(g.blob, g.fileName);
        message.success("Đã tạo phiếu kết quả offline. File đã được tải về.");
        setSelectedIndicatorIds([]);
        setNote("");
        onCancel();
        onSuccess?.();
      } catch (e) {
        message.error(e instanceof Error ? e.message : "Lỗi tạo phiếu kết quả offline.");
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      if (isPerSampleTemplate(selectedMixedTemplate)) {
        const result = await qualityManagementService.printMixedPerSampleResult(
          taskId,
          [...selectedIndicatorIds],
          selectedMixedTemplate || undefined,
          finalNote,
          selectedVicePresidentId,
          masterNoteIdsArray.length > 0 ? masterNoteIdsArray : undefined,
          freeTextToSave,
        );
        message.success(`Đã tạo ${result.results.length} phiếu kết quả`);
        setGeneratedResults(result.results);
        setShowResults(true);
      } else {
        const result = await qualityManagementService.printMixedResult(
          taskId,
          [...selectedIndicatorIds],
          finalNote,
          selectedMixedTemplate || undefined,
          selectedVicePresidentId,
          masterNoteIdsArray.length > 0 ? masterNoteIdsArray : undefined,
          freeTextToSave,
        );
        message.success("Đã tạo phiếu kết quả");
        window.open(`/document-editor?file=${encodeURIComponent(result.fileName)}`, "_blank");
        setSelectedIndicatorIds([]);
        setNote("");
        onCancel();
        onSuccess?.();
      }
    } catch (error: any) {
      console.error("Error printing:", error);
      message.error(error?.response?.data?.error?.message || "Không thể in kết quả");
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
    setSelectedMixedTemplate("");
    setNote("");
    setGeneratedResults([]);
    setShowResults(false);
    setSelectedVicePresidentId(undefined);
    onCancel();
  };

  const handleOpenEditor = (fileName: string) => {
    const docxFileName = fileName.replace(/\.pdf$/i, ".docx");
    window.open(`/document-editor?file=${encodeURIComponent(docxFileName)}`, "_blank");
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
          <IndicatorName name={value} formattedName={record.indicatorFormattedName} />
        ) : "-";

        const classNames = ["print-indicator-name-wrapper"];
        if (record._isSubIndicator) {
          classNames.push("has-tree-line");
          if (record._isLastSubIndicator) classNames.push("is-last-sub");
        }

        return (
          <div
            className={classNames.join(" ")}
            style={{ paddingLeft: record._isSubIndicator ? 24 : 0, position: "relative" }}
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
        <IndicatorName name={record.methodName || ""} formattedName={record.methodFormattedName} />
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
          return <Text>{record.comparisonOperator} {record.allowedLimit}</Text>;
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
        const passFailStatus = evaluatePassFail(record.result, record.comparisonOperator, record.allowedLimit);
        if (passFailStatus === "pass") return <Text strong style={{ color: "#52c41a" }}>Đạt</Text>;
        if (passFailStatus === "fail") return <Text strong style={{ color: "#ff4d4f" }}>Không đạt</Text>;
        return "-";
      },
    },
  ];

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
        footer={
          <Space>
            <Button onClick={handleCloseResults}>Đóng</Button>
            {generatedResults.length > 1 && (
              <Button type="primary" icon={<FolderOpenOutlined />} onClick={handleOpenAllTabs}>
                Mở toàn bộ ({generatedResults.length} file)
              </Button>
            )}
          </Space>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">Click "Xem" để mở tài liệu trong trình soạn thảo Word.</Text>
        </div>
        <PrintCopyCountAlert
          {...resultRequirement}
        />
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
                      style={isViewed ? { color: "#52c41a", borderColor: "#52c41a" } : undefined}
                    >
                      {isViewed ? "Đã xem" : "Xem"}
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <FileWordOutlined style={{ fontSize: 24, color: isViewed ? "#52c41a" : "#2b579a" }} />
                    }
                    title={`File ${index + 1}${item.sampleCode ? `: ${item.sampleCode}` : ""}`}
                    description={`Template: ${item.templateName || "BM02"}`}
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
          In kết quả hỗn hợp
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
            disabled={selectedIndicatorIds.length === 0 || loadingTemplates}
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
          {/* Left column - Indicators grouped by Sample (all labs merged) */}
          <Col span={16} style={{ overflow: "hidden" }}>
            <div style={{ marginBottom: 8 }}>
              <Checkbox
                checked={approvedIndicatorIds.length > 0 && approvedIndicatorIds.every((id) => selectedIndicatorIds.includes(id))}
                indeterminate={selectedIndicatorIds.length > 0 && !approvedIndicatorIds.every((id) => selectedIndicatorIds.includes(id))}
                onChange={(e) => {
                  setSelectedIndicatorIds(e.target.checked ? [...approvedIndicatorIds] : []);
                }}
              >
                Chọn tất cả ({approvedIndicatorIds.length} chỉ tiêu)
              </Checkbox>
            </div>
            <div style={{ maxHeight: "calc(100vh - 320px)", overflowY: "auto", overflowX: "hidden" }}>
              <Collapse
                className="quality-print-lab-collapse"
                defaultActiveKey={sampleGroups.map((sg) => sg.sampleId)}
                expandIconPosition="end"
                style={{ background: "transparent", border: "none" }}
                items={sampleGroups.map((sampleGroup, sampleIndex) => {
                  const selectedInSample = sampleGroup.allIndicatorIds.filter((id) =>
                    selectedIndicatorIds.includes(id),
                  ).length;
                  const allSampleSelected = selectedInSample === sampleGroup.allIndicatorIds.length;
                  const someSampleSelected = selectedInSample > 0 && !allSampleSelected;
                  const isLastSample = sampleIndex === sampleGroups.length - 1;

                  return {
                    key: sampleGroup.sampleId,
                    label: (
                      <div
                        style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={allSampleSelected}
                          indeterminate={someSampleSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (e.target.checked) {
                              setSelectedIndicatorIds([
                                ...new Set([...selectedIndicatorIds, ...sampleGroup.allIndicatorIds]),
                              ]);
                            } else {
                              setSelectedIndicatorIds(
                                selectedIndicatorIds.filter((id) => !sampleGroup.allIndicatorIds.includes(id)),
                              );
                            }
                          }}
                        />
                        <Text style={{ fontSize: 13, flexShrink: 0 }}>{sampleGroup.sampleCode}</Text>
                        {sampleGroup.sampleName && (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            - {sampleGroup.sampleName}
                          </Text>
                        )}
                        <Text type="secondary" style={{ fontSize: 12, flexShrink: 0, marginLeft: "auto", marginRight: 8 }}>
                          {selectedInSample}/{sampleGroup.allIndicatorIds.length}
                        </Text>
                      </div>
                    ),
                    style: {
                      marginBottom: isLastSample ? 0 : 8,
                      borderRadius: 8,
                      border: "1px solid var(--ant-color-border)",
                      background: "none",
                    },
                    children: (() => {
                      const processedIndicators = processIndicatorsWithHierarchy(sampleGroup.indicators);

                      return (
                        <Card
                          size="small"
                          style={{ borderRadius: 8, overflow: "hidden", boxShadow: "none" }}
                          bodyStyle={{ padding: 0 }}
                        >
                          <style>
                            {`
                              .ant-table sub, .ant-table sup,
                              .ant-table-cell sub, .ant-table-cell sup {
                                color: inherit !important;
                              }
                              .print-indicator-name-wrapper { position: relative; }
                              .print-indicator-name-wrapper.has-tree-line::before {
                                content: ''; position: absolute; left: 0;
                                top: -100%; bottom: -100%; width: 1px; background-color: #d9d9d9;
                              }
                              .print-indicator-name-wrapper.has-tree-line::after {
                                content: ''; position: absolute; left: 0;
                                top: 50%; width: 16px; height: 1px; background-color: #d9d9d9;
                              }
                              .print-indicator-name-wrapper.has-tree-line.is-last-sub::before { bottom: 50%; }
                              .print-parent-row > td { background-color: #f5f5f5 !important; font-weight: 500; }
                              .print-sub-row > td { background-color: #fafafa !important; }
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
                                const otherIds = selectedIndicatorIds.filter(
                                  (id) => !sampleGroup.allIndicatorIds.includes(id),
                                );
                                setSelectedIndicatorIds([...otherIds, ...(keys as string[])]);
                              },
                              type: "checkbox",
                              getCheckboxProps: (record: ProcessedIndicator) => ({
                                disabled: record._isParentWithChildren,
                              }),
                            }}
                          />
                        </Card>
                      );
                    })(),
                  };
                })}
              />
            </div>
          </Col>

          {/* Right column - Options */}
          <Col span={8}>
            {mixedTemplates.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <Text strong style={{ display: "block", marginBottom: 12 }}>
                  Chọn biểu mẫu báo cáo:
                </Text>
                <Radio.Group
                  value={selectedMixedTemplate}
                  onChange={(e) => setSelectedMixedTemplate(e.target.value)}
                >
                  <Space direction="vertical">
                    {mixedTemplates.map((template) => (
                      <Radio key={template.name} value={template.name}>
                        {template.displayName}
                      </Radio>
                    ))}
                  </Space>
                </Radio.Group>
              </div>
            )}

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
                options={vicePresidents.map((vp) => ({ value: vp.id, label: vp.displayName }))}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Nếu chọn, tên sẽ được thay thế v...
              </Text>
            </div>

            {/* Master data notes list */}
            {masterNotes.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <Text strong style={{ display: "block", marginBottom: 8 }}>
                  Ghi chú từ danh sách
                </Text>
                <div
                  style={{
                    maxHeight: 200,
                    overflowY: "auto",
                    border: "1px solid #d9d9d9",
                    borderRadius: 6,
                    padding: 8,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <style>{`
                    .print-master-note-item .sal-cell-ellipsis {
                      display: block;
                      overflow: hidden;
                      white-space: nowrap;
                      text-overflow: ellipsis;
                      font-size: 13px;
                    }
                    .print-master-note-item .sal-cell-ellipsis > * {
                      display: inline;
                      margin: 0;
                    }
                    .print-master-note-item.is-selected .sal-cell-ellipsis {
                      color: #1890ff;
                    }
                  `}</style>
                  {masterNotes.map((masterNote) => {
                    const isSelected = selectedMasterNoteIds.has(masterNote.id);
                    return (
                      <div
                        key={masterNote.id}
                        className={`print-master-note-item${isSelected ? " is-selected" : ""}`}
                        onClick={() => handleToggleMasterNote(masterNote.id)}
                        style={{
                          cursor: "pointer",
                          padding: "6px 10px",
                          borderRadius: 4,
                          backgroundColor: isSelected
                            ? "#e6f7ff"
                            : "transparent",
                          border: isSelected
                            ? "1px solid #91d5ff"
                            : "1px solid #f0f0f0",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          transition: "all 0.2s",
                        }}
                      >
                        <Checkbox checked={isSelected} />
                        <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                          <EllipsisTooltip
                            title={
                              <div dangerouslySetInnerHTML={{ __html: masterNote.content }} />
                            }
                            html={masterNote.content}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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

export default PrintMixedModal;
