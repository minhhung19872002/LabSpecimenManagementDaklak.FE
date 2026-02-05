import React from "react";
import {
  Modal,
  Space,
  Alert,
  Upload,
  Card,
  Statistic,
  Table,
  Tag,
  Button,
  Row,
  Col,
  Typography,
} from "antd";
import {
  UploadOutlined,
  DownloadOutlined,
} from "../../../../components/common/Icon";
import type { UploadFile } from "antd/es/upload/interface";
import type {
  TestResultValueImportPreviewDto,
  TestResultValueImportPreviewGroup,
} from "../types";

const { Text } = Typography;

interface ImportTestResultValueModalProps {
  open: boolean;
  loading: boolean;
  fileList: UploadFile[];
  previewData: TestResultValueImportPreviewDto | null;
  onFileListChange: (fileList: UploadFile[]) => void;
  onPreview: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  onReset: () => void;
}

const ImportTestResultValueModal: React.FC<ImportTestResultValueModalProps> = ({
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

  // Flatten groups to rows for table display
  const tableData = React.useMemo(() => {
    if (!previewData?.groups) return [];

    const rows: Array<{
      key: string;
      resultName: string;
      description?: string;
      specimenTypeName?: string;
      indicatorName?: string;
      isNew: boolean;
      isValid: boolean;
      rowSpan?: number;
      isFirstRow?: boolean;
    }> = [];

    previewData.groups.forEach((group, groupIdx) => {
      if (group.indicators.length === 0) {
        // Group without indicators
        rows.push({
          key: `${groupIdx}-0`,
          resultName: group.resultName,
          description: group.description,
          specimenTypeName: undefined,
          indicatorName: undefined,
          isNew: group.isNew,
          isValid: true,
          rowSpan: 1,
          isFirstRow: true,
        });
      } else {
        // Group with indicators
        group.indicators.forEach((ind, indIdx) => {
          rows.push({
            key: `${groupIdx}-${indIdx}`,
            resultName: group.resultName,
            description: group.description,
            specimenTypeName: ind.specimenTypeName,
            indicatorName: ind.indicatorName,
            isNew: group.isNew,
            isValid: ind.isValid,
            rowSpan: indIdx === 0 ? group.indicators.length : 0,
            isFirstRow: indIdx === 0,
          });
        });
      }
    });

    return rows;
  }, [previewData?.groups]);

  const columns = [
    {
      title: "Tên kết quả",
      dataIndex: "resultName",
      key: "resultName",
      width: 150,
      onCell: (record: any) => ({
        rowSpan: record.rowSpan,
      }),
      render: (text: string, record: any) =>
        record.isFirstRow ? (
          <Space>
            <span>{text}</span>
            {record.isNew ? (
              <Tag color="green">Mới</Tag>
            ) : (
              <Tag color="blue">Cập nhật</Tag>
            )}
          </Space>
        ) : null,
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      width: 120,
      onCell: (record: any) => ({
        rowSpan: record.rowSpan,
      }),
      render: (text: string, record: any) =>
        record.isFirstRow ? <Text ellipsis={{ tooltip: text }}>{text}</Text> : null,
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
      title: "Trạng thái",
      key: "status",
      width: 80,
      render: (_: unknown, record: any) =>
        record.isValid ? (
          <Tag color="green">OK</Tag>
        ) : (
          <Tag color="red">Lỗi</Tag>
        ),
    },
  ];

  return (
    <Modal
      title="Import Kết quả từ Excel"
      open={open}
      onCancel={onCancel}
      width={800}
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
                  title="Tổng số kết quả"
                  value={previewData.totalResults}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Mới"
                  value={previewData.newResults}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Cập nhật"
                  value={previewData.updateResults}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Liên kết chỉ tiêu"
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
            <Table
              size="small"
              dataSource={tableData}
              columns={columns}
              pagination={false}
              rowKey="key"
              scroll={{ x: 700 }}
              rowClassName={(record) =>
                record.isValid ? "" : "ant-table-row-error"
              }
            />
          </div>

          <style>{`
            .ant-table-row-error {
              background-color: #fff2f0 !important;
            }
            .ant-table-row-error:hover > td {
              background-color: #ffebe6 !important;
            }
          `}</style>

          <Button onClick={onReset}>Chọn file khác</Button>
        </Space>
      )}
    </Modal>
  );
};

export default ImportTestResultValueModal;
