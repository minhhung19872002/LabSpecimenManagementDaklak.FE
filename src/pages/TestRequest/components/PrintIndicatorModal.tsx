import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  Table,
  Button,
  Space,
  Typography,
  message,
  Input,
  Spin,
  Checkbox,
  List,
  Select,
  Row,
  Col,
  Collapse,
} from "antd";
import {
  PrinterOutlined,
  FilePdfOutlined,
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
import { qualityManagementService } from "../../../services/qualityManagementService";
import { API_BASE_URL } from "../../../services/api";
import userService, { UserLookupDto } from "../../../services/userService";
import { IndicatorName } from "../../../components/common";

const { Text } = Typography;

interface PrintIndicatorModalProps {
  visible: boolean;
  mode: "single" | "mixed";
  testRequestId: string;
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

// Group indicators by laboratory, then by sample
interface LabGroup {
  laboratoryId: string;
  laboratoryName: string;
  sampleGroups: SampleGroup[];
  allIndicatorIds: string[];
}

const PrintIndicatorModal: React.FC<PrintIndicatorModalProps> = ({
  visible,
  mode,
  testRequestId,
  onCancel,
  onSuccess,
}) => {
  const [selectedIndicatorIds, setSelectedIndicatorIds] = useState<string[]>(
    []
  );
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingIndicators, setLoadingIndicators] = useState(false);
  const [note, setNote] = useState<string>("");
  const [templates, setTemplates] = useState<TemplateDto[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [indicators, setIndicators] = useState<QualityManagementIndicatorDto[]>(
    []
  );
  const [generatedResults, setGeneratedResults] = useState<PrintResultItem[]>(
    []
  );
  const [showResults, setShowResults] = useState(false);
  const [vicePresidents, setVicePresidents] = useState<UserLookupDto[]>([]);
  const [selectedVicePresidentId, setSelectedVicePresidentId] = useState<
    string | undefined
  >(undefined);
  const [loadingVicePresidents, setLoadingVicePresidents] = useState(false);

  // Load indicators when modal opens
  useEffect(() => {
    if (visible && testRequestId) {
      loadIndicators();
      loadTemplates();
      loadVicePresidents();
    }
  }, [visible, testRequestId]);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedIndicatorIds([]);
      setSelectedTemplates([]);
      setNote("");
      setGeneratedResults([]);
      setShowResults(false);
      setSelectedVicePresidentId(undefined);
    }
  }, [visible]);

  const loadIndicators = async () => {
    setLoadingIndicators(true);
    try {
      const result = await testRequestService.getApprovedIndicators(
        testRequestId
      );
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
      const result = await qualityManagementService.getTemplates();
      setTemplates(result);
      // Set BM01 as default selected template (first one usually)
      if (result.length > 0) {
        // Find BM01 or use first template
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

  // Get only approved indicators
  const approvedIndicators = useMemo(
    () =>
      indicators.filter(
        (ind) => ind.approvalStatus === QualityIndicatorApprovalStatus.Approved
      ),
    [indicators]
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

    approvedIndicators.forEach((indicator) => {
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
      const allIndicatorIds = sampleGroups.flatMap((s) =>
        s.indicators.map((i) => i.id)
      );
      return { ...lab, sampleGroups, allIndicatorIds };
    });
  }, [approvedIndicators]);

  // Function to open all tabs - triggered by user click
  const handleOpenAllTabs = () => {
    let blockedCount = 0;

    // Try to open all PDFs
    generatedResults.forEach((item) => {
      const pdfUrl = `${API_BASE_URL}/api/v1/result-forms/view/${encodeURIComponent(
        item.fileName
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

  const handlePrint = async () => {
    if (selectedIndicatorIds.length === 0) {
      message.warning("Vui lòng chọn ít nhất một chỉ tiêu để in");
      return;
    }

    if (mode === "single" && selectedTemplates.length === 0) {
      message.warning("Vui lòng chọn ít nhất một biểu mẫu");
      return;
    }

    setLoading(true);

    try {
      if (mode === "single") {
        // Call API to generate PDFs
        const result = await testRequestService.printMultiSingleResult(
          testRequestId,
          selectedIndicatorIds,
          selectedTemplates,
          note || undefined,
          selectedVicePresidentId
        );

        message.success(`Đã tạo ${result.results.length} phiếu kết quả`);

        // Store results and show results view
        setGeneratedResults(result.results);
        setShowResults(true);
      } else {
        // Mixed mode - single PDF, open directly
        const result = await testRequestService.printMixedResult(
          testRequestId,
          selectedIndicatorIds,
          note || undefined,
          undefined, // templateName
          selectedVicePresidentId
        );

        message.success("Đã tạo phiếu kết quả");

        const pdfUrl = `${API_BASE_URL}/api/v1/result-forms/view/${encodeURIComponent(
          result.fileName
        )}`;
        window.open(pdfUrl, "_blank");

        // Close modal for mixed mode (single PDF)
        setSelectedIndicatorIds([]);
        setNote("");
        onCancel();
        onSuccess?.();
      }
    } catch (error: any) {
      console.error("Error printing:", error);
      message.error(
        error?.response?.data?.error?.message || "Không thể in kết quả"
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
        <IndicatorName
          name={record.indicatorName || ""}
          formattedName={record.indicatorFormattedName}
        />
      ),
    },
    {
      title: "Phương pháp",
      dataIndex: "methodName",
      key: "methodName",
      ellipsis: true,
      render: (_: any, record: QualityManagementIndicatorDto) => (
        <IndicatorName
          name={record.methodName || ""}
          formattedName={record.methodFormattedName}
        />
      ),
    },
    {
      title: "Kết quả",
      dataIndex: "result",
      key: "result",
      width: 80,
      render: (text: string) => <Text strong>{text || "-"}</Text>,
    },
    {
      title: "ĐVT",
      dataIndex: "unit",
      key: "unit",
      width: 60,
    },
  ];

  // Render results view when PDFs are generated
  if (showResults) {
    return (
      <Modal
        title={
          <span>
            <FilePdfOutlined style={{ marginRight: 8 }} />
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
            {generatedResults.length > 0 && (
              <Button
                type="primary"
                icon={<FolderOpenOutlined />}
                onClick={handleOpenAllTabs}
              >
                Mở toàn bộ ({generatedResults.length} file)
              </Button>
            )}
          </Space>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">
            Click "Mở toàn bộ" để mở tất cả file PDF, hoặc click từng file bên
            dưới.
          </Text>
        </div>
        <div style={{ maxHeight: "calc(100vh - 350px)", overflowY: "auto" }}>
          <List
            dataSource={generatedResults}
            renderItem={(item, index) => (
              <List.Item
                actions={[
                  <Button
                    type="link"
                    icon={<FilePdfOutlined />}
                    onClick={() => {
                      const pdfUrl = `${API_BASE_URL}/api/v1/result-forms/view/${encodeURIComponent(
                        item.fileName
                      )}`;
                      window.open(pdfUrl, "_blank");
                    }}
                  >
                    Xem PDF
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <FilePdfOutlined style={{ fontSize: 24, color: "#f5222d" }} />
                  }
                  title={`File ${index + 1}: ${item.laboratoryName || "PDF"}${
                    item.sampleCode ? ` - ${item.sampleCode}` : ""
                  }`}
                  description={`Template: ${item.templateName || "BM01"}`}
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
          {mode === "single" ? "In kết quả đơn" : "In kết quả hỗn hợp"}
        </span>
      }
      open={visible}
      onCancel={handleCancel}
      width={1200}
      centered
      styles={{ body: { maxHeight: "calc(100vh - 200px)", overflowY: "auto" } }}
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
              loadingIndicators ||
              (mode === "single" && selectedTemplates.length === 0)
            }
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
          {/* Left column - Indicators grouped by Lab > Sample */}
          <Col span={16} style={{ overflow: "hidden" }}>
            <div style={{ maxHeight: "calc(100vh - 280px)", overflowY: "auto", overflowX: "hidden" }}>
              <Collapse
                defaultActiveKey={labGroups.map((lg) => lg.laboratoryId)}
                expandIconPosition="end"
                style={{ background: "transparent", border: "none" }}
                items={labGroups.map((labGroup, labIndex) => {
                  const selectedInLab = labGroup.allIndicatorIds.filter((id) =>
                    selectedIndicatorIds.includes(id)
                  ).length;
                  const allLabSelected =
                    selectedInLab === labGroup.allIndicatorIds.length;
                  const someLabSelected = selectedInLab > 0 && !allLabSelected;
                  const isLastLab = labIndex === labGroups.length - 1;

                  return {
                    key: labGroup.laboratoryId,
                    label: (
                      <div
                        style={{ display: "flex", alignItems: "center", gap: 8 }}
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
                                  (id) => !labGroup.allIndicatorIds.includes(id)
                                )
                              );
                            }
                          }}
                        />
                        <Text strong style={{ fontSize: 14, color: "#0958d9" }}>
                          {labGroup.laboratoryName}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          ({selectedInLab}/{labGroup.allIndicatorIds.length} chỉ tiêu)
                        </Text>
                      </div>
                    ),
                    style: {
                      marginBottom: isLastLab ? 0 : 8,
                      background: "#e6f4ff",
                      borderRadius: 8,
                      border: "1px solid var(--ant-color-border)",
                    },
                    children: (
                      <div style={{ margin: "-16px" }}>
                        <Collapse
                          defaultActiveKey={labGroup.sampleGroups.map((sg) => sg.sampleId)}
                          expandIconPosition="end"
                          style={{ background: "transparent", border: "none" }}
                          items={labGroup.sampleGroups.map((sampleGroup, sampleIndex) => {
                          const sampleIndicatorIds = sampleGroup.indicators.map(
                            (i) => i.id
                          );
                          const selectedInSample = sampleIndicatorIds.filter((id) =>
                            selectedIndicatorIds.includes(id)
                          ).length;
                          const allSampleSelected =
                            selectedInSample === sampleIndicatorIds.length;
                          const someSampleSelected =
                            selectedInSample > 0 && !allSampleSelected;
                          const isLastSample = sampleIndex === labGroup.sampleGroups.length - 1;

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
                                        ...new Set([
                                          ...selectedIndicatorIds,
                                          ...sampleIndicatorIds,
                                        ]),
                                      ]);
                                    } else {
                                      setSelectedIndicatorIds(
                                        selectedIndicatorIds.filter(
                                          (id) => !sampleIndicatorIds.includes(id)
                                        )
                                      );
                                    }
                                  }}
                                />
                                <Text style={{ fontSize: 13 }}>
                                  {sampleGroup.sampleCode}
                                </Text>
                                {sampleGroup.sampleName && (
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    - {sampleGroup.sampleName}
                                  </Text>
                                )}
                                <Text
                                  type="secondary"
                                  style={{ fontSize: 12, marginLeft: "auto", marginRight: 8 }}
                                >
                                  {selectedInSample}/{sampleIndicatorIds.length}
                                </Text>
                              </div>
                            ),
                            style: {
                              marginBottom: isLastSample ? 0 : 6,
                              background: "#fafafa",
                              borderRadius: 6,
                              border: "none",
                            },
                            children: (
                              <Table
                                dataSource={sampleGroup.indicators}
                                columns={columns}
                                rowKey="id"
                                size="small"
                                pagination={false}
                                rowSelection={{
                                  selectedRowKeys: selectedIndicatorIds,
                                  onChange: (keys) => {
                                    const otherIds = selectedIndicatorIds.filter(
                                      (id) => !sampleIndicatorIds.includes(id)
                                    );
                                    setSelectedIndicatorIds([
                                      ...otherIds,
                                      ...(keys as string[]),
                                    ]);
                                  },
                                  type: "checkbox",
                                }}
                              />
                            ),
                          };
                          })}
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
            {/* Template selection - only for single mode */}
            {mode === "single" && (
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
            )}

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
              <Input.TextArea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nhập ghi chú sẽ được đưa vào phần cuối của báo cáo..."
                rows={3}
                maxLength={500}
                showCount
              />
            </div>
          </Col>
        </Row>
      )}
    </Modal>
  );
};

export default PrintIndicatorModal;
