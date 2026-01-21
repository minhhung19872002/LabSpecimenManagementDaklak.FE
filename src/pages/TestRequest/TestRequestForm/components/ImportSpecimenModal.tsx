import React, { useState, useMemo } from "react";
import {
  Modal,
  Upload,
  Button,
  Table,
  Alert,
  Tag,
  Typography,
  Statistic,
  Row,
  Col,
  Card,
  message,
} from "antd";
import { UploadOutlined, DownloadOutlined } from "../../../../components/common/Icon";
import type { UploadFile } from "antd/es/upload";
import {
  importService,
  type SpecimenForTestRequestImportPreviewDto,
  type SpecimenImportPreviewItem,
} from "../../../../services/importService";
import { SampleFormData, createIndicatorMethodKey } from "../types";
import { SampleStatus } from "../../../../types/testRequest";

const { Text } = Typography;

// Flattened row type for table display
interface FlattenedPreviewRow {
  key: string;
  rowNumber: number;
  sampleName: string;
  specimenTypeName?: string;
  samplingAddress?: string;
  sampleQuantity?: string;
  statusText?: string;
  indicatorName: string;
  testMethodName?: string;
  isValid: boolean;
  errorMessage?: string;
  // For row span calculation
  isFirstRowOfSample: boolean;
  sampleRowSpan: number;
}

interface ImportSpecimenModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: (newSamples: SampleFormData[]) => void;
  existingSamplesCount: number;
  sampleCodePrefix: string;
}

export const ImportSpecimenModal: React.FC<ImportSpecimenModalProps> = ({
  open,
  onCancel,
  onConfirm,
  existingSamplesCount,
  sampleCodePrefix,
}) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewResult, setPreviewResult] =
    useState<SpecimenForTestRequestImportPreviewDto | null>(null);

  const handleFileChange = (info: { fileList: UploadFile[] }) => {
    setFileList(info.fileList.slice(-1)); // Only keep last file
    setPreviewResult(null); // Reset preview when file changes
  };

  const handlePreview = async () => {
    if (!fileList.length || !fileList[0].originFileObj) return;

    setLoading(true);
    try {
      const result = await importService.previewSpecimensForTestRequest(
        fileList[0].originFileObj as File
      );
      setPreviewResult(result);
    } catch (error: any) {
      message.error(error?.message || "Lỗi khi đọc file Excel");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = () => {
    if (!previewResult || !previewResult.validationResult.isValid) return;

    const newSamples = convertToSampleFormData(
      previewResult.specimens,
      existingSamplesCount,
      sampleCodePrefix
    );

    onConfirm(newSamples);
    handleClose();
    message.success(`Đã thêm ${newSamples.length} mẫu vào danh sách`);
  };

  const handleClose = () => {
    setFileList([]);
    setPreviewResult(null);
    onCancel();
  };

  const hasErrors = previewResult && !previewResult.validationResult.isValid;

  // Handle download error file
  const handleDownloadErrorFile = () => {
    if (previewResult?.errorFileBase64 && previewResult?.errorFileName) {
      try {
        const byteCharacters = atob(previewResult.errorFileBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = previewResult.errorFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Error downloading file:", error);
        message.error("Lỗi khi tải file");
      }
    }
  };

  // Group errors by row number
  const groupedErrors = React.useMemo(() => {
    if (!previewResult?.validationResult.errors.length) return [];

    const errorMap = new Map<number, string[]>();
    previewResult.validationResult.errors.forEach((err) => {
      const messages = errorMap.get(err.rowNumber) || [];
      const msg = err.value
        ? `${err.columnName}: ${err.errorMessage} (${err.value})`
        : `${err.columnName}: ${err.errorMessage}`;
      messages.push(msg);
      errorMap.set(err.rowNumber, messages);
    });

    return Array.from(errorMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([rowNumber, messages]) => ({ rowNumber, messages }));
  }, [previewResult?.validationResult.errors]);

  // Flatten specimens and indicators into table rows
  const flattenedRows = useMemo((): FlattenedPreviewRow[] => {
    if (!previewResult?.specimens.length) return [];

    const rows: FlattenedPreviewRow[] = [];
    previewResult.specimens.forEach((specimen) => {
      const indicatorCount = specimen.indicators.length;
      specimen.indicators.forEach((indicator, idx) => {
        rows.push({
          key: `${specimen.sampleName}_${indicator.rowNumber}_${idx}`,
          rowNumber: indicator.rowNumber,
          sampleName: specimen.sampleName,
          specimenTypeName: specimen.specimenTypeName,
          samplingAddress: specimen.samplingAddress,
          sampleQuantity: specimen.sampleQuantity,
          statusText: specimen.statusText,
          indicatorName: indicator.indicatorName,
          testMethodName: indicator.testMethodName,
          isValid: indicator.isValid,
          errorMessage: indicator.errorMessage,
          isFirstRowOfSample: idx === 0,
          sampleRowSpan: indicatorCount,
        });
      });
    });
    return rows;
  }, [previewResult?.specimens]);

  return (
    <Modal
      title="Nhập danh sách mẫu từ Excel"
      open={open}
      onCancel={handleClose}
      width={900}
      centered
      styles={{ body: { maxHeight: "calc(100vh - 200px)", overflowY: "auto" } }}
      footer={[
        <Button key="cancel" onClick={handleClose}>
          Đóng
        </Button>,
        !previewResult && (
          <Button
            key="preview"
            type="primary"
            loading={loading}
            onClick={handlePreview}
            disabled={!fileList.length}
          >
            Xem trước
          </Button>
        ),
        previewResult && !hasErrors && (
          <Button key="import" type="primary" onClick={handleConfirmImport}>
            Xác nhận thêm {previewResult.validSpecimens} mẫu
          </Button>
        ),
      ].filter(Boolean)}
    >
      {/* Step 1: Upload file */}
      {!previewResult && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Upload.Dragger
            fileList={fileList}
            onChange={handleFileChange}
            beforeUpload={() => false}
            accept=".xlsx,.xls"
            maxCount={1}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined style={{ fontSize: 48, color: "#1890ff" }} />
            </p>
            <p className="ant-upload-text">
              Kéo thả file Excel hoặc click để chọn file
            </p>
            <p className="ant-upload-hint">Chỉ hỗ trợ file .xlsx, .xls</p>
          </Upload.Dragger>
        </div>
      )}

      {/* Step 2: Preview */}
      {previewResult && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Summary Statistics */}
          <Card size="small">
            <Row gutter={16}>
              <Col span={6}>
                <Statistic title="Tổng dòng" value={previewResult.totalRows} />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Số mẫu"
                  value={previewResult.totalSpecimens}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Mẫu hợp lệ"
                  value={previewResult.validSpecimens}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Tổng chỉ tiêu"
                  value={previewResult.totalIndicators}
                />
              </Col>
            </Row>
          </Card>

          {/* Errors */}
          {hasErrors && (
            <Alert
              type="error"
              message={`Có ${groupedErrors.length} dòng lỗi - Không thể import`}
              description={
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  <div style={{ maxHeight: 150, overflow: "auto" }}>
                    {groupedErrors.map((group, idx) => (
                      <div key={idx} style={{ marginBottom: 8 }}>
                        <div style={{ color: "#ff4d4f", fontWeight: 500 }}>
                          Dòng {group.rowNumber}:
                        </div>
                        <ul
                          style={{
                            marginBottom: 0,
                            paddingLeft: 20,
                            marginTop: 4,
                          }}
                        >
                          {group.messages.map((msg, msgIdx) => (
                            <li key={msgIdx} style={{ color: "#ff4d4f" }}>
                              {msg}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  {previewResult.errorFileBase64 && (
                    <Button
                      type="primary"
                      danger
                      icon={<DownloadOutlined />}
                      onClick={handleDownloadErrorFile}
                      style={{ marginTop: 8, alignSelf: "flex-start" }}
                    >
                      Tải file lỗi để sửa
                    </Button>
                  )}
                </div>
              }
              showIcon
            />
          )}

          {/* Preview Table - Flat view */}
          <Table
            size="small"
            dataSource={flattenedRows}
            rowKey="key"
            pagination={false}
            scroll={{ y: 400 }}
            columns={[
              {
                title: "Dòng",
                dataIndex: "rowNumber",
                width: 60,
                fixed: "left",
              },
              {
                title: "Tên mẫu",
                dataIndex: "sampleName",
                width: 150,
                onCell: (record) => ({
                  rowSpan: record.isFirstRowOfSample ? record.sampleRowSpan : 0,
                }),
              },
              {
                title: "Loại mẫu",
                dataIndex: "specimenTypeName",
                width: 120,
                onCell: (record) => ({
                  rowSpan: record.isFirstRowOfSample ? record.sampleRowSpan : 0,
                }),
                render: (val) => val || <Text type="secondary">-</Text>,
              },
              {
                title: "Địa chỉ lấy mẫu",
                dataIndex: "samplingAddress",
                width: 150,
                onCell: (record) => ({
                  rowSpan: record.isFirstRowOfSample ? record.sampleRowSpan : 0,
                }),
                render: (val) => val || <Text type="secondary">-</Text>,
              },
              {
                title: "Lượng mẫu",
                dataIndex: "sampleQuantity",
                width: 100,
                onCell: (record) => ({
                  rowSpan: record.isFirstRowOfSample ? record.sampleRowSpan : 0,
                }),
                render: (val) => val || <Text type="secondary">-</Text>,
              },
              {
                title: "Tình trạng",
                dataIndex: "statusText",
                width: 100,
                onCell: (record) => ({
                  rowSpan: record.isFirstRowOfSample ? record.sampleRowSpan : 0,
                }),
                render: (val) => val || <Text type="secondary">-</Text>,
              },
              {
                title: "Chỉ tiêu",
                dataIndex: "indicatorName",
                width: 180,
              },
              {
                title: "Phương pháp",
                dataIndex: "testMethodName",
                width: 150,
                render: (val) => val || <Text type="secondary">-</Text>,
              },
              {
                title: "Trạng thái",
                width: 150,
                fixed: "right",
                render: (_, record) =>
                  record.isValid ? (
                    <Tag color="green">OK</Tag>
                  ) : (
                    <Tag color="red">{record.errorMessage}</Tag>
                  ),
              },
            ]}
          />

          <Button
            onClick={() => setPreviewResult(null)}
            style={{ alignSelf: "flex-start" }}
          >
            Chọn file khác
          </Button>
        </div>
      )}
    </Modal>
  );
};

/**
 * Convert preview items to SampleFormData for merging into form state
 */
function convertToSampleFormData(
  previewItems: SpecimenImportPreviewItem[],
  existingSamplesCount: number,
  sampleCodePrefix: string
): SampleFormData[] {
  return previewItems
    .filter((item) => item.isValid)
    .map((item, idx) => {
      const sortOrder = existingSamplesCount + idx + 1;
      // Format: prefix + 2-digit order number (e.g., "2024-001-01")
      const sampleCode = `${sampleCodePrefix}${String(sortOrder).padStart(2, "0")}`;

      // Convert indicators to IndicatorMethodKey format
      const indicatorMethods = item.indicators
        .filter((ind) => ind.indicatorId && ind.testMethodId)
        .map((ind) =>
          createIndicatorMethodKey(ind.indicatorId!, ind.testMethodId!)
        );

      return {
        key: `import_${Date.now()}_${idx}`,
        sortOrder,
        sampleCode,
        sampleName: item.sampleName,
        specimenTypeName: item.specimenTypeName,
        samplingAddress: item.samplingAddress,
        sampleQuantity: item.sampleQuantity,
        status: SampleStatus.Normal,
        statusText: item.statusText,
        indicatorIds: [], // deprecated
        indicatorMethods,
        attachments: [],
        isSharedSample: false,
      } as SampleFormData;
    });
}

export default ImportSpecimenModal;
