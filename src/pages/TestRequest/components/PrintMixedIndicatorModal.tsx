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
  testRequestService,
  TemplateDto,
  PrintResultItem,
} from "../../../services/testRequestService";
import userService, { UserLookupDto } from "../../../services/userService";
import { IndicatorName } from "../../../components/common";
import RichTextEditor from "../../../components/common/RichTextEditor";
import { evaluatePassFail, stripHtmlTags } from "../../../utils/formatters";

const { Text } = Typography;

export interface PrintMixedIndicatorModalProps {
  visible: boolean;
  testRequestId: string;
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

const PrintMixedIndicatorModal: React.FC<PrintMixedIndicatorModalProps> = ({
  visible,
  testRequestId,
  onCancel,
  onSuccess,
}) => {
  const [selectedIndicatorIds, setSelectedIndicatorIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingIndicators, setLoadingIndicators] = useState(false);
  const [note, setNote] = useState<string>("");
  const [mixedTemplates, setMixedTemplates] = useState<TemplateDto[]>([]);
  const [selectedMixedTemplate, setSelectedMixedTemplate] = useState<string>("");
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [indicators, setIndicators] = useState<QualityManagementIndicatorDto[]>([]);
  const [generatedResults, setGeneratedResults] = useState<PrintResultItem[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [vicePresidents, setVicePresidents] = useState<UserLookupDto[]>([]);
  const [selectedVicePresidentId, setSelectedVicePresidentId] = useState<string | undefined>(undefined);
  const [loadingVicePresidents, setLoadingVicePresidents] = useState(false);

  const approvedIndicators = useMemo(
    () => indicators.filter((ind) => ind.approvalStatus === QualityIndicatorApprovalStatus.Approved),
    [indicators],
  );

  const prevSelectedIdsRef = React.useRef<string[]>([]);

  useEffect(() => {
    if (visible && testRequestId) {
      loadIndicators();
      loadTemplates();
      loadVicePresidents();
    }
  }, [visible, testRequestId]);

  useEffect(() => {
    if (visible) {
      setSelectedIndicatorIds([]);
      setSelectedMixedTemplate("");
      setNote("");
      setGeneratedResults([]);
      setShowResults(false);
      setSelectedVicePresidentId(undefined);
      prevSelectedIdsRef.current = [];
    }
  }, [visible]);

  useEffect(() => {
    const prevIds = prevSelectedIdsRef.current;
    const newlySelectedIds = selectedIndicatorIds.filter((id) => !prevIds.includes(id));

    if (newlySelectedIds.length > 0) {
      const newIndicators = approvedIndicators.filter((ind) => newlySelectedIds.includes(ind.id));
      const existingPlainText = stripHtmlTags(note);
      const newHtmlParts: string[] = [];

      const addedMasterNotes = new Set<string>();
      newIndicators.forEach((ind) => {
        if (ind.masterDataNotes && ind.masterDataNotes.length > 0) {
          ind.masterDataNotes.forEach((masterNote) => {
            if (masterNote) {
              const plainNote = stripHtmlTags(masterNote);
              if (plainNote && !addedMasterNotes.has(plainNote) && !existingPlainText.includes(plainNote)) {
                addedMasterNotes.add(plainNote);
                newHtmlParts.push(masterNote);
              }
            }
          });
        }
      });

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
  }, [selectedIndicatorIds, approvedIndicators]);

  const loadIndicators = async () => {
    setLoadingIndicators(true);
    try {
      const result = await testRequestService.getApprovedIndicators(testRequestId);
      setIndicators(result);
    } catch (error) {
      console.error("Error loading indicators:", error);
      message.error("Không thể tải danh sách chỉ tiêu");
    } finally {
      setLoadingIndicators(false);
    }
  };

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const result = await testRequestService.getMixedTemplates();
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

  // Group by sample, sort indicators within each sample by lab (Vi sinh first, Hoá after)
  const sampleGroups: SampleGroupWithLabs[] = useMemo(() => {
    const groups: Record<string, { sampleCode: string; sampleName: string; indicators: QualityManagementIndicatorDto[] }> = {};

    approvedIndicators.forEach((indicator) => {
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
      return {
        sampleId,
        sampleCode: data.sampleCode,
        sampleName: data.sampleName,
        indicators: sorted,
        allIndicatorIds: sorted.map((i) => i.id),
      };
    });
  }, [approvedIndicators]);

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

    setLoading(true);
    try {
      if (isPerSampleTemplate(selectedMixedTemplate)) {
        const result = await testRequestService.printMixedPerSampleResult(
          testRequestId,
          selectedIndicatorIds,
          selectedMixedTemplate || undefined,
          note || undefined,
          selectedVicePresidentId,
        );
        message.success(`Đã tạo ${result.results.length} phiếu kết quả`);
        setGeneratedResults(result.results);
        setShowResults(true);
      } else {
        const result = await testRequestService.printMixedResult(
          testRequestId,
          selectedIndicatorIds,
          note || undefined,
          selectedMixedTemplate || undefined,
          selectedVicePresidentId,
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
    setIndicators([]);
    setGeneratedResults([]);
    setShowResults(false);
    setSelectedVicePresidentId(undefined);
    onCancel();
  };

  const columns: ColumnsType<QualityManagementIndicatorDto> = [
    {
      title: "Tên chỉ tiêu",
      dataIndex: "indicatorName",
      key: "indicatorName",
      ellipsis: true,
      render: (_: any, record: QualityManagementIndicatorDto) => (
        <IndicatorName name={record.indicatorName || ""} formattedName={record.indicatorFormattedName} />
      ),
    },
    {
      title: "Phương pháp",
      dataIndex: "methodName",
      key: "methodName",
      ellipsis: true,
      render: (_: any, record: QualityManagementIndicatorDto) => (
        <IndicatorName name={record.methodName || ""} formattedName={record.methodFormattedName} />
      ),
    },
    {
      title: "ĐVT",
      dataIndex: "unit",
      key: "unit",
      width: 70,
      render: (text: string) => (text ? <IndicatorName name={text} /> : "-"),
    },
    {
      title: "Kết quả",
      dataIndex: "result",
      key: "result",
      width: 100,
      render: (text: string) => <Text strong>{text || "-"}</Text>,
    },
    {
      title: "Giới hạn",
      key: "limit",
      width: 100,
      render: (_: any, record: QualityManagementIndicatorDto) => {
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
      render: (text: string) => text || "-",
    },
    {
      title: "Kết luận",
      key: "conclusion",
      width: 100,
      render: (_: any, record: QualityManagementIndicatorDto) => {
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
        width={600}
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
          <Text type="secondary">Click "Xem" để mở tài liệu trong trình soạn thảo.</Text>
        </div>
        <div style={{ maxHeight: "calc(100vh - 350px)", overflowY: "auto" }}>
          <List
            dataSource={generatedResults}
            renderItem={(item, index) => (
              <List.Item
                actions={[
                  <Button
                    type="primary"
                    icon={<FileWordOutlined />}
                    onClick={() => {
                      const docxFileName = item.fileName.replace(/\.pdf$/i, ".docx");
                      window.open(`/document-editor?file=${encodeURIComponent(docxFileName)}`, "_blank");
                    }}
                  >
                    Xem
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={<FileWordOutlined style={{ fontSize: 24, color: "#2b579a" }} />}
                  title={`File ${index + 1}${item.sampleCode ? `: ${item.sampleCode}` : ""}`}
                  description={`Template: ${item.templateName || "BM02"}`}
                />
              </List.Item>
            )}
          />
        </div>
      </Modal>
    );
  }

  return (
    <Modal
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
      className="testrequest-print-modal"
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
            disabled={selectedIndicatorIds.length === 0 || loadingIndicators}
          >
            In ({selectedIndicatorIds.length} chỉ tiêu)
          </Button>
        </Space>
      }
    >
      {loadingIndicators || loadingTemplates ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin tip="Đang tải dữ liệu..." />
        </div>
      ) : approvedIndicators.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Text type="secondary">Không có chỉ tiêu nào đã được duyệt</Text>
        </div>
      ) : (
        <Row gutter={24}>
          {/* Left column - Indicators grouped by Sample (all labs merged) */}
          <Col span={16} style={{ overflow: "hidden" }}>
            <div style={{ maxHeight: "calc(100vh - 280px)", overflowY: "auto", overflowX: "hidden" }}>
              <Collapse
                defaultActiveKey={sampleGroups.map((sg) => sg.sampleId)}
                expandIconPosition="end"
                className="testrequest-print-lab-collapse"
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
                    children: (
                      <Card
                        size="small"
                        style={{ borderRadius: 8, overflow: "hidden", boxShadow: "none" }}
                        styles={{ body: { padding: 0 } }}
                      >
                        <Table
                          dataSource={sampleGroup.indicators}
                          columns={columns}
                          rowKey="id"
                          size="small"
                          pagination={false}
                          scroll={{ x: "max-content" }}
                          bordered
                          style={{ maxWidth: "100%" }}
                          rowSelection={{
                            selectedRowKeys: selectedIndicatorIds,
                            onChange: (keys) => {
                              const otherIds = selectedIndicatorIds.filter(
                                (id) => !sampleGroup.allIndicatorIds.includes(id),
                              );
                              setSelectedIndicatorIds([...otherIds, ...(keys as string[])]);
                            },
                            type: "checkbox",
                          }}
                        />
                      </Card>
                    ),
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

export default PrintMixedIndicatorModal;
