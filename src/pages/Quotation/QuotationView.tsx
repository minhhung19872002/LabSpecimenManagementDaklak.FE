import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Button,
  Table,
  Space,
  Typography,
  message,
  Spin,
  Descriptions,
  Row,
  Col,
  Statistic,
  Tooltip,
  Alert,
} from "antd";
import {
  ArrowLeftOutlined,
  FileAddOutlined,
  EditOutlined,
  MailOutlined,
  DownloadOutlined,
} from "../../components/common/Icon";
import { useNavigate, useParams } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { quotationService } from "../../services/quotationService";
import type { QuotationPdfSampleDto } from "../../services/quotationService";
import type { OfflineSyncInfo } from "../../services/offline/createOfflineService";
import { syncManager } from "../../services/offline/syncManager";
import type { SyncedItemEvent } from "../../services/offline/syncManager";
import { useReloadOnSync } from "../../hooks/useReloadOnSync";
import {
  QuotationDto,
  QuotationSampleIndicatorDto,
} from "../../types/quotation";
import { PATH_ROUTES } from "../../constants";
import { formatCurrency } from "../../utils/formatters";
import { IndicatorName } from "../../components/common";
import { authService } from "../../services/authService";
import { PERMISSIONS } from "../../constants/permissionMapping";
import SendQuotationEmailModal from "./components/SendQuotationEmailModal";
import {
  getPdfIndicatorNames,
  buildQuotationPdfFileName,
  downloadPdfFromObjectUrl,
} from "./utils";
import { getApiErrorMessage } from "../../utils/errorHandler";
import {
  isHeavyMetalComboMet,
  isHgIndicator,
  isEcoliColiformComboMet,
  isEcoliIndicator,
  isColiformIndicator,
} from "../TestRequest/TestRequestForm/constants";
import "../../styles/ListCard.css";

const { Text } = Typography;

const stripHtml = (s: string) => s.replace(/<[^>]*>/g, "");

const QuotationView: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(false);
  const [quotation, setQuotation] = useState<(QuotationDto & OfflineSyncInfo) | null>(null);
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const loadQuotation = useCallback(async (quotationId: string) => {
    setLoading(true);
    try {
      const data = await quotationService.get(quotationId);
      setQuotation(data);
    } catch (error) {
      console.error("Failed to load quotation:", error);
      message.error("Không thể tải thông tin báo giá");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      loadQuotation(id);
    }
  }, [id, loadQuotation]);

  // Báo giá tạo offline (id tạm) → sync xong thì chuyển sang id thật; còn lại tải lại để cập nhật trạng thái đồng bộ
  useEffect(() => {
    if (!id) return;
    const handleItemSynced = (payload: unknown) => {
      const event = payload as SyncedItemEvent;
      if (event.clientId !== id || event.operationType !== "create" || !event.serverId || event.serverId === id) return;
      navigate(PATH_ROUTES.quotations.view(event.serverId), { replace: true });
    };
    syncManager.on("itemSynced", handleItemSynced);
    return () => syncManager.off("itemSynced", handleItemSynced);
  }, [id, navigate]);

  const reloadAfterSync = useCallback(() => {
    if (id) loadQuotation(id);
  }, [id, loadQuotation]);
  useReloadOnSync(reloadAfterSync);

  const isUnsyncedCreate = Boolean(quotation?._isUnsyncedCreate);

  const handleCreateTestRequest = () => {
    if (id) {
      navigate(`${PATH_ROUTES.testRequests.create}?quotationId=${id}`);
    }
  };

  const getEmailSamples = (): QuotationPdfSampleDto[] => {
    return (
      quotation?.samples?.map((sample) => {
        const sorted = sortIndicatorsForCombo(sample.indicators);
        const grouped: Record<string, { names: string[]; stName?: string | null }> = {};
        sorted.forEach((ind) => {
          const stId = ind.specimenTypeId || "_none";
          if (!grouped[stId]) grouped[stId] = { names: [], stName: ind.specimenTypeName };
          grouped[stId].names.push(stripHtml(ind.indicatorName));
        });

        const comboMap: Record<number, string> = {};
        sorted.forEach((ind, idx) => {
          const stId = ind.specimenTypeId || "_none";
          const { names, stName } = grouped[stId];
          const n = stripHtml(ind.indicatorName);
          if (isHeavyMetalComboMet(names, undefined, stName) &&
            (isHgIndicator(n) || ["hàm lượng chì (pb)", "hàm lượng asen (as)", "hàm lượng cadimi (cd)"].includes(n.normalize("NFC").toLowerCase()))) {
            comboMap[idx] = `hm_${stId}`;
          } else if (isEcoliColiformComboMet(names, undefined, stName) &&
            (isEcoliIndicator(n) || isColiformIndicator(n))) {
            if (!comboMap[idx]) comboMap[idx] = `ec_${stId}`;
          }
        });

        return {
          sampleName: sample.sampleName,
          quantity: sample.quantity || 1,
          indicators: sorted.map((ind, idx) => ({
            ...getPdfIndicatorNames(ind),
            quantity: 1,
            unitPrice: ind.unitPrice,
            note: ind.note || undefined,
            comboGroup: comboMap[idx] || undefined,
          })),
        };
      }) || []
    );
  };

  const handleDownloadPdf = async () => {
    if (!quotation) return;
    setDownloadingPdf(true);
    try {
      const pdfUrl = await quotationService.generatePdf({
        customerName: quotation.customerName,
        samples: getEmailSamples(),
        totalPrice: quotation.totalCost,
      });
      downloadPdfFromObjectUrl(pdfUrl, buildQuotationPdfFileName(quotation.quotationNumber));
    } catch (error: any) {
      console.error("Failed to download PDF:", error);
      message.error(getApiErrorMessage(error, "Tải PDF thất bại. Vui lòng thử lại."));
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Calculate totals
  const totalSampleCount = quotation?.samples?.length || 0;
  const totalIndicatorCount =
    quotation?.samples?.reduce((sum, s) => sum + s.indicators.length, 0) || 0;

  // Flatten all sample indicators into a single list
  interface FlatIndicatorRow extends QuotationSampleIndicatorDto {
    sampleName: string;
    sampleId: string;
    sampleQuantity: number;
    rowSpan: number;
    sampleTotalPrice: number;
    noteRowSpan: number;
  }

  // Sort indicators so combo members are adjacent (required for valid rowSpan)
  const sortIndicatorsForCombo = (indicators: QuotationSampleIndicatorDto[]): QuotationSampleIndicatorDto[] => {
    const grouped: Record<string, number[]> = {};
    indicators.forEach((ind, idx) => {
      const stId = ind.specimenTypeId || "_none";
      if (!grouped[stId]) grouped[stId] = [];
      grouped[stId].push(idx);
    });

    const comboIndicesSet = new Set<number>();
    const comboBlocks: { anchor: number; members: number[] }[] = [];

    for (const [, indices] of Object.entries(grouped)) {
      const names = indices.map((i) => stripHtml(indicators[i].indicatorName));
      const stName = indicators[indices[0]]?.specimenTypeName;

      if (isHeavyMetalComboMet(names, undefined, stName)) {
        const members = indices.filter((i) => {
          const n = stripHtml(indicators[i].indicatorName);
          return isHgIndicator(n) ||
            ["hàm lượng chì (pb)", "hàm lượng asen (as)", "hàm lượng cadimi (cd)"].includes(
              n.normalize("NFC").toLowerCase()
            );
        });
        if (members.length > 1) {
          comboBlocks.push({ anchor: members[0], members });
          members.forEach((m) => comboIndicesSet.add(m));
        }
      }

      if (isEcoliColiformComboMet(names, undefined, stName)) {
        const members = indices.filter((i) => {
          const n = stripHtml(indicators[i].indicatorName);
          return isEcoliIndicator(n) || isColiformIndicator(n);
        });
        const freshMembers = members.filter((m) => !comboIndicesSet.has(m));
        if (freshMembers.length > 1) {
          comboBlocks.push({ anchor: freshMembers[0], members: freshMembers });
          freshMembers.forEach((m) => comboIndicesSet.add(m));
        }
      }
    }

    const sorted: QuotationSampleIndicatorDto[] = [];
    const placed = new Set<number>();
    for (let i = 0; i < indicators.length; i++) {
      if (placed.has(i)) continue;
      const block = comboBlocks.find((b) => b.anchor === i);
      if (block) {
        block.members.forEach((m) => { sorted.push(indicators[m]); placed.add(m); });
      } else if (!comboIndicesSet.has(i)) {
        sorted.push(indicators[i]);
        placed.add(i);
      }
    }
    for (let i = 0; i < indicators.length; i++) {
      if (!placed.has(i)) { sorted.push(indicators[i]); placed.add(i); }
    }
    return sorted;
  };

  // Compute combo note rowSpan for a sample's indicators
  const computeNoteRowSpans = (indicators: QuotationSampleIndicatorDto[]): number[] => {
    const spans = new Array(indicators.length).fill(1);
    const grouped: Record<string, { indices: number[]; names: string[] }> = {};

    indicators.forEach((ind, idx) => {
      const stId = ind.specimenTypeId || "_none";
      if (!grouped[stId]) grouped[stId] = { indices: [], names: [] };
      grouped[stId].indices.push(idx);
      grouped[stId].names.push(stripHtml(ind.indicatorName));
    });

    for (const [, { indices, names }] of Object.entries(grouped)) {
      const stName = indicators[indices[0]]?.specimenTypeName;

      // Heavy metal combo
      if (isHeavyMetalComboMet(names, undefined, stName)) {
        const comboIndices = indices.filter((i) => {
          const n = stripHtml(indicators[i].indicatorName);
          return isHgIndicator(n) ||
            ["hàm lượng chì (pb)", "hàm lượng asen (as)", "hàm lượng cadimi (cd)"].includes(
              n.normalize("NFC").toLowerCase()
            );
        });
        if (comboIndices.length > 1) {
          comboIndices.forEach((ci, j) => {
            spans[ci] = j === 0 ? comboIndices.length : 0;
          });
        }
      }

      // E.coli + Coliform combo
      if (isEcoliColiformComboMet(names, undefined, stName)) {
        const comboIndices = indices.filter((i) => {
          const n = stripHtml(indicators[i].indicatorName);
          return isEcoliIndicator(n) || isColiformIndicator(n);
        });
        if (comboIndices.length > 1) {
          comboIndices.forEach((ci, j) => {
            if (spans[ci] === 1) {
              spans[ci] = j === 0 ? comboIndices.length : 0;
            }
          });
        }
      }
    }

    return spans;
  };

  const flatDataSource: FlatIndicatorRow[] = quotation?.samples?.flatMap((sample) => {
    const sorted = sortIndicatorsForCombo(sample.indicators);
    const noteSpans = computeNoteRowSpans(sorted);
    return sorted.map((indicator, idx) => ({
      ...indicator,
      sampleName: sample.sampleName,
      sampleId: sample.id,
      sampleQuantity: sample.quantity || 1,
      rowSpan: idx === 0 ? sample.indicators.length : 0,
      sampleTotalPrice: sample.totalPrice,
      noteRowSpan: noteSpans[idx],
    }));
  }) || [];

  // Table columns with sample name rowSpan
  const columns: ColumnsType<FlatIndicatorRow> = [
    {
      title: "Tên mẫu",
      dataIndex: "sampleName",
      key: "sampleName",
      width: 160,
      onCell: (record) => ({
        rowSpan: record.rowSpan,
      }),
      render: (value) => <Text strong>{value}</Text>,
    },
    {
      title: "SL",
      dataIndex: "sampleQuantity",
      key: "sampleQuantity",
      width: 60,
      align: "center" as const,
      onCell: (record) => ({
        rowSpan: record.rowSpan,
      }),
    },
    {
      title: "Chỉ tiêu",
      dataIndex: "indicatorName",
      key: "indicatorName",
      ellipsis: true,
      render: (_, record) => (
        <>
          <IndicatorName
            name={record.indicatorName}
            formattedName={record.indicatorFormattedName}
          />
          {record.specimenTypeName && (
            <div style={{ fontSize: 11, color: "#8c8c8c", marginTop: 2 }}>
              {record.specimenTypeName}
            </div>
          )}
        </>
      ),
    },
    {
      title: "Phương pháp",
      key: "testMethodName",
      ellipsis: true,
      render: (_, record) => (
        <IndicatorName
          name={record.testMethodName}
          formattedName={record.testMethodFormattedName}
        />
      ),
    },
    {
      title: "Đơn giá",
      dataIndex: "unitPrice",
      key: "unitPrice",
      width: 130,
      align: "right",
      render: (value) => formatCurrency(value),
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
      key: "note",
      ellipsis: true,
      onCell: (record) => ({
        rowSpan: record.noteRowSpan,
      }),
      render: (value: string | null | undefined) =>
        value ? <Text>{value}</Text> : null,
    },
    {
      title: "Thành tiền",
      key: "sampleTotalPrice",
      width: 130,
      align: "right",
      onCell: (record) => ({
        rowSpan: record.rowSpan,
      }),
      render: (_, record) => (
        <Text strong>{formatCurrency(record.sampleTotalPrice)}</Text>
      ),
    },
  ];

  if (!quotation && !loading) {
    return (
      <Card>
        <Text>Không tìm thấy báo giá</Text>
      </Card>
    );
  }

  // Section title style
  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: "#262626",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottom: "1px solid #f0f0f0",
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
            <Space wrap>
              {authService.hasPermission(PERMISSIONS.Quotations.Edit) && (
                <Button
                  icon={<EditOutlined />}
                  onClick={() => navigate(PATH_ROUTES.quotations.edit(id!))}
                >
                  Chỉnh sửa
                </Button>
              )}
              <Button
                icon={<MailOutlined />}
                onClick={() => {
                  if (totalSampleCount === 0 || totalIndicatorCount === 0) {
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
                icon={<DownloadOutlined />}
                loading={downloadingPdf}
                onClick={handleDownloadPdf}
              >
                Tải báo giá
              </Button>
              {authService.hasPermission(PERMISSIONS.TestRequests.Create) && (
                <Tooltip title={isUnsyncedCreate ? "Báo giá chưa đồng bộ lên máy chủ, chưa thể tạo phiếu thử nghiệm" : undefined}>
                  <Button
                    type="primary"
                    icon={<FileAddOutlined />}
                    onClick={handleCreateTestRequest}
                    disabled={isUnsyncedCreate}
                    style={isUnsyncedCreate ? undefined : { background: 'linear-gradient(to right, #1E63F8, #009AE3)', border: 'none' }}
                  >
                    Tạo phiếu thử nghiệm
                  </Button>
                </Tooltip>
              )}
            </Space>
          </Col>
        </Row>
        {quotation?.syncStatus && (
          <Alert
            data-testid="quotation-sync-alert"
            type={quotation.syncStatus === "failed" ? "error" : "warning"}
            showIcon
            style={{ marginBottom: 16 }}
            message={
              quotation.syncStatus === "failed"
                ? `Báo giá đồng bộ lỗi: ${quotation.syncError || "không rõ nguyên nhân"}`
                : "Báo giá đang lưu trên máy, sẽ đồng bộ lên máy chủ khi có mạng"
            }
          />
        )}
        <Card
          className="list-card"
          title="Chi tiết báo giá"
          styles={{ body: { paddingLeft: 0, paddingRight: 0 } }}
        >
        {quotation && (
          <>
            <div className="card-content-padding">
              {/* Section 1: Thông tin báo giá */}
              <div style={sectionTitleStyle}>Thông tin báo giá</div>
              <Descriptions
                bordered
                size="small"
                column={1}
                labelStyle={{
                  width: 150,
                  fontWeight: 500,
                  background: "#fafafa",
                }}
                style={{ marginBottom: 24 }}
              >
                <Descriptions.Item label="Số báo giá">
                  <Text strong style={{ color: "#1890ff" }}>
                    {quotation.quotationNumber || "-"}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Ngày tạo">
                  {dayjs(quotation.quotationDate).format("DD/MM/YYYY")}
                </Descriptions.Item>
              </Descriptions>

              {/* Section 2: Thông tin khách hàng */}
              <div style={sectionTitleStyle}>Thông tin khách hàng</div>
              <Row gutter={[24, 12]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12}>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Tên CS/DN:
                  </Text>
                  <div style={{ marginTop: 4 }}>
                    {quotation.customerName || "-"}
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Người đại diện:
                  </Text>
                  <div style={{ marginTop: 4 }}>
                    {quotation.contactPerson || "-"}
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Mã số thuế:
                  </Text>
                  <div style={{ marginTop: 4 }}>{quotation.taxCode || "-"}</div>
                </Col>
                <Col xs={24} sm={12}>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Số điện thoại:
                  </Text>
                  <div style={{ marginTop: 4 }}>{quotation.phone || "-"}</div>
                </Col>
                <Col xs={24}>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Địa chỉ:
                  </Text>
                  <div style={{ marginTop: 4 }}>{quotation.address || "-"}</div>
                </Col>
              </Row>

              {/* Section 3: Danh sách mẫu */}
              <div style={sectionTitleStyle}>
                Danh sách mẫu ({totalSampleCount} mẫu, {totalIndicatorCount} chỉ
                tiêu)
              </div>
            </div>

            {quotation.samples.length === 0 ? (
              <div
                style={{
                  padding: 24,
                  textAlign: "center",
                  background: "#fafafa",
                  borderRadius: 4,
                }}
              >
                <Text type="secondary">Chưa có mẫu nào</Text>
              </div>
            ) : (
              <Table
                size="small"
                dataSource={flatDataSource}
                rowKey="id"
                pagination={false}
                columns={columns}
                bordered
              />
            )}

            <div className="card-content-padding" style={{ paddingBottom: 16 }}>
              {/* Footer Summary */}
              <Card
                size="small"
                style={{
                  marginTop: 16,
                  background: "#fafafa",
                }}
              >
                <Row gutter={48}>
                  <Col>
                    <Statistic title="Tổng số mẫu" value={totalSampleCount} />
                  </Col>
                  <Col>
                    <Statistic
                      title="Tổng số chỉ tiêu"
                      value={totalIndicatorCount}
                    />
                  </Col>
                  <Col flex="auto" style={{ textAlign: "right" }}>
                    <Statistic
                      title="Tổng cộng"
                      value={quotation.totalCost}
                      formatter={(val) => (
                        <span style={{ color: "#1890ff", fontSize: 24 }}>
                          {formatCurrency(val as number)}
                        </span>
                      )}
                    />
                  </Col>
                </Row>
              </Card>

              {/* Section 4: Ghi chú (nếu có) */}
              {quotation.notes && (
                <>
                  <div style={{ ...sectionTitleStyle, marginTop: 24 }}>
                    Ghi chú
                  </div>
                  <div
                    style={{
                      padding: 12,
                      background: "#fafafa",
                      borderRadius: 4,
                      border: "1px solid #f0f0f0",
                    }}
                  >
                    {quotation.notes}
                  </div>
                </>
              )}
            </div>
          </>
        )}
        </Card>
      </Spin>

      {quotation && (
        <SendQuotationEmailModal
          visible={emailModalVisible}
          onCancel={() => setEmailModalVisible(false)}
          customerName={quotation.customerName || ""}
          samples={getEmailSamples()}
          totalCost={quotation.totalCost}
        />
      )}
    </div>
  );
};

export default QuotationView;
