import React from "react";
import {
  Modal,
  Space,
  Alert,
  Upload,
  Card,
  Statistic,
  Collapse,
  Table,
  Tag,
  Button,
  Row,
  Col,
} from "antd";
import {
  UploadOutlined,
  DownloadOutlined,
} from "../../../../components/common/Icon";
import type { UploadFile } from "antd/es/upload/interface";
import type {
  StandardImportPreviewDto,
  StandardIndicatorImportItem,
} from "../types";
import { convertOperatorSymbol } from "../constants";

// Helper to strip <p> tags but keep inner HTML (for rendering in table)
const stripPTags = (html: string | undefined | null): string => {
  if (!html) return "";
  return html.replace(/^<p>|<\/p>$/gi, "").trim();
};

interface ImportStandardModalProps {
  open: boolean;
  loading: boolean;
  fileList: UploadFile[];
  previewData: StandardImportPreviewDto | null;
  onFileListChange: (fileList: UploadFile[]) => void;
  onPreview: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  onReset: () => void;
}

const ImportStandardModal: React.FC<ImportStandardModalProps> = ({
  open,
  loading,
  fileList,
  previewData,
  onFileListChange,
  onPreview,
  onConfirm,
  onCancel,
  onReset,
}) => {
  const hasErrors =
    previewData && previewData.validationResult.errors.length > 0;

  // Group errors by row number
  const groupedErrors = React.useMemo(() => {
    if (!previewData?.validationResult.errors.length) return [];

    const errorMap = new Map<number, string[]>();
    previewData.validationResult.errors.forEach((err) => {
      const messages = errorMap.get(err.rowNumber) || [];
      const message = err.value
        ? `${err.errorMessage} (${err.value})`
        : err.errorMessage;
      messages.push(message);
      errorMap.set(err.rowNumber, messages);
    });

    return Array.from(errorMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([rowNumber, messages]) => ({ rowNumber, messages }));
  }, [previewData?.validationResult.errors]);

  // Download error file from base64
  const handleDownloadErrorFile = () => {
    if (previewData?.errorFileBase64 && previewData?.errorFileName) {
      try {
        const byteCharacters = atob(previewData.errorFileBase64);
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
        a.download = previewData.errorFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Error downloading file:", error);
      }
    }
  };

  const indicatorColumns = [
    {
      title: "Dòng",
      dataIndex: "rowNumber",
      key: "rowNumber",
      width: 60,
    },
    {
      title: "Nền mẫu",
      dataIndex: "specimenTypeName",
      key: "specimenTypeName",
      width: 120,
    },
    {
      title: "Chỉ tiêu",
      dataIndex: "indicatorName",
      key: "indicatorName",
      width: 150,
    },
    {
      title: "Chỉ tiêu phụ",
      dataIndex: "subIndicatorName",
      key: "subIndicatorName",
      width: 120,
      render: (value: string) => value || "-",
    },
    {
      title: "Phương pháp",
      dataIndex: "testMethodName",
      key: "testMethodName",
      width: 150,
    },
    {
      title: "Đơn vị",
      dataIndex: "unit",
      key: "unit",
      width: 80,
    },
    {
      title: "So sánh",
      dataIndex: "comparisonOperator",
      key: "comparisonOperator",
      width: 80,
    },
    {
      title: "Giới hạn",
      key: "limit",
      width: 150,
      render: (_: unknown, record: StandardIndicatorImportItem) => {
        // Range case: comparison operator is "Khoảng"
        if (record.comparisonOperator?.toLowerCase() === "khoảng") {
          const lower = convertOperatorSymbol(record.lowerOperator) || ">";
          const upper = convertOperatorSymbol(record.upperOperator) || "<";
          const lowerHtml = stripPTags(record.lowerLimit);
          const upperHtml = stripPTags(record.upperLimit);
          return (
            <span>
              {lower} <span dangerouslySetInnerHTML={{ __html: lowerHtml }} />
              {" và "}
              {upper} <span dangerouslySetInnerHTML={{ __html: upperHtml }} />
            </span>
          );
        }
        // Single limit case
        if (record.allowedLimit) {
          const op = convertOperatorSymbol(record.comparisonOperator);
          const limitHtml = stripPTags(record.allowedLimit);
          return (
            <span>
              {op} <span dangerouslySetInnerHTML={{ __html: limitHtml }} />
            </span>
          );
        }
        return "";
      },
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 80,
      render: (_: unknown, record: StandardIndicatorImportItem) =>
        record.isValid ? (
          <Tag color="green">OK</Tag>
        ) : (
          <Tag color="red">Lỗi</Tag>
        ),
    },
  ];

  return (
    <Modal
      title="Import Tiêu chuẩn từ Excel"
      open={open}
      onCancel={onCancel}
      width={1000}
      centered
      styles={{ body: { maxHeight: "calc(100vh - 200px)", overflowY: "auto" } }}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Đóng
        </Button>,
        !previewData && (
          <Button
            key="preview"
            type="primary"
            loading={loading}
            onClick={onPreview}
            disabled={!fileList.length}
          >
            Xem trước
          </Button>
        ),
        previewData && !hasErrors && (
          <Button
            key="import"
            type="primary"
            loading={loading}
            onClick={onConfirm}
          >
            Xác nhận Import
          </Button>
        ),
      ]}
    >
      {/* Step 1: Upload file */}
      {!previewData && (
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          {/* <Alert
            message="Hướng dẫn"
            description={
              <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                <li>
                  Tải template Excel mẫu bằng nút "Tải template mẫu" ở trang
                  trước
                </li>
                <li>
                  Điền thông tin tiêu chuẩn và các chỉ tiêu vào file Excel
                </li>
                <li>
                  Các cột: Tên tiêu chuẩn, Chỉ tiêu, Phương pháp, Đơn vị, So
                  sánh, Giới hạn,...
                </li>
                <li>
                  Cùng tên tiêu chuẩn = nhiều dòng sẽ gộp thành 1 tiêu chuẩn với
                  nhiều chỉ tiêu
                </li>
                <li>Chỉ tiêu và Phương pháp phải tồn tại trong hệ thống</li>
                <li>
                  Nếu So sánh = "Khoảng" → Cần nhập giới hạn dưới và giới hạn
                  trên
                </li>
                <li>
                  Nếu tên tiêu chuẩn đã tồn tại → Cập nhật, ngược lại → Tạo mới
                </li>
              </ul>
            }
            type="info"
            showIcon
          /> */}

          <Upload.Dragger
            fileList={fileList}
            onChange={({ fileList }) => onFileListChange(fileList)}
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
        </Space>
      )}

      {/* Step 2: Preview data */}
      {previewData && (
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          {/* Summary */}
          <Card size="small">
            <Row gutter={16}>
              <Col span={6}>
                <Statistic
                  title="Tổng tiêu chuẩn"
                  value={previewData.totalStandards}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Mới"
                  value={previewData.newStandards}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Cập nhật"
                  value={previewData.updateStandards}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Tổng chỉ tiêu"
                  value={previewData.totalIndicators}
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
                <Space direction="vertical" style={{ width: "100%" }}>
                  <div style={{ maxHeight: 150, overflow: "auto" }}>
                    {groupedErrors.map((group, idx) => (
                      <div key={idx} style={{ marginBottom: 8 }}>
                        <div style={{ color: "#ff4d4f", fontWeight: 500 }}>
                          Dòng {group.rowNumber}:
                        </div>
                        <ul style={{ marginBottom: 0, paddingLeft: 20, marginTop: 4 }}>
                          {group.messages.map((msg, msgIdx) => (
                            <li key={msgIdx} style={{ color: "#ff4d4f" }}>
                              {msg}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  {previewData.errorFileBase64 && (
                    <Button
                      type="primary"
                      danger
                      icon={<DownloadOutlined />}
                      onClick={handleDownloadErrorFile}
                    >
                      Tải file lỗi để sửa
                    </Button>
                  )}
                </Space>
              }
              showIcon
            />
          )}

          {/* Preview Table */}
          <div style={{ maxHeight: 400, overflow: "auto" }}>
            <Collapse
              defaultActiveKey={previewData.groups.map((_, idx) =>
                idx.toString()
              )}
            >
              {previewData.groups.map((group, idx) => (
                <Collapse.Panel
                  key={idx.toString()}
                  header={
                    <Space>
                      {group.isNew ? (
                        <Tag color="green">Mới</Tag>
                      ) : (
                        <Tag color="blue">Cập nhật</Tag>
                      )}
                      <span style={{ fontWeight: 500 }}>
                        {group.standardName}
                      </span>
                      <span style={{ color: "#888" }}>
                        ({group.indicators.length} chỉ tiêu)
                      </span>
                    </Space>
                  }
                >
                  <Table
                    size="small"
                    dataSource={group.indicators.map((item, i) => ({
                      ...item,
                      key: i,
                    }))}
                    columns={indicatorColumns}
                    pagination={false}
                    scroll={{ x: 1000 }}
                  />
                </Collapse.Panel>
              ))}
            </Collapse>
          </div>

          <Button onClick={onReset}>Chọn file khác</Button>
        </Space>
      )}
    </Modal>
  );
};

export default ImportStandardModal;
