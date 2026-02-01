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
} from "antd";
import {
  UploadOutlined,
  DownloadOutlined,
} from "../../../../components/common/Icon";
import type { UploadFile } from "antd/es/upload/interface";
import type { SpecimenTypeImportPreviewDto } from "../types";

// Flat item for table display
interface SpecimenTypeImportTableItem {
  key: number;
  rowNumber: number;
  categoryName: string;
  specimenTypeName: string;
  isNewSpecimenType: boolean;
  indicatorName: string;
  isValid: boolean;
}

interface ImportSpecimenTypeModalProps {
  open: boolean;
  loading: boolean;
  fileList: UploadFile[];
  previewData: SpecimenTypeImportPreviewDto | null;
  onFileListChange: (fileList: UploadFile[]) => void;
  onPreview: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  onReset: () => void;
}

const ImportSpecimenTypeModal: React.FC<ImportSpecimenTypeModalProps> = ({
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

  // Flatten groups to table items
  const tableItems = React.useMemo(() => {
    if (!previewData?.groups) return [];
    const items: SpecimenTypeImportTableItem[] = [];
    let keyIndex = 0;
    previewData.groups.forEach((group) => {
      // If no indicators or all indicators have empty names, show one row for the specimen type
      if (group.indicators.length === 0) {
        items.push({
          key: keyIndex++,
          rowNumber: 0,
          categoryName: group.categoryName,
          specimenTypeName: group.specimenTypeName,
          isNewSpecimenType: group.isNew,
          indicatorName: "",
          isValid: group.isValid,
        });
      } else {
        group.indicators.forEach((indicator) => {
          items.push({
            key: keyIndex++,
            rowNumber: indicator.rowNumber,
            categoryName: group.categoryName,
            specimenTypeName: group.specimenTypeName,
            isNewSpecimenType: group.isNew,
            indicatorName: indicator.indicatorName,
            isValid: indicator.isValid && group.isValid,
          });
        });
      }
    });
    return items;
  }, [previewData?.groups]);

  const columns = [
    {
      title: "Dòng",
      dataIndex: "rowNumber",
      key: "rowNumber",
      width: 60,
    },
    {
      title: "Danh mục loại",
      dataIndex: "categoryName",
      key: "categoryName",
      width: 150,
    },
    {
      title: "Nền mẫu",
      dataIndex: "specimenTypeName",
      key: "specimenTypeName",
      width: 200,
      render: (text: string, record: SpecimenTypeImportTableItem) => (
        <Space>
          <span>{text}</span>
          {record.isNewSpecimenType ? (
            <Tag color="green">Mới</Tag>
          ) : (
            <Tag color="blue">Cập nhật</Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Chỉ tiêu",
      dataIndex: "indicatorName",
      key: "indicatorName",
      width: 200,
      render: (text: string) => text || <span style={{ color: "#999" }}>-</span>,
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 80,
      render: (_: unknown, record: SpecimenTypeImportTableItem) =>
        record.isValid ? (
          <Tag color="green">OK</Tag>
        ) : (
          <Tag color="red">Lỗi</Tag>
        ),
    },
  ];

  return (
    <Modal
      title="Import Loại mẫu từ Excel"
      open={open}
      onCancel={onCancel}
      width={950}
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
                  title="Tổng loại mẫu"
                  value={previewData.totalSpecimenTypes}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Mới"
                  value={previewData.newSpecimenTypes}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Cập nhật"
                  value={previewData.updateSpecimenTypes}
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
            <Table
              size="small"
              dataSource={tableItems}
              columns={columns}
              pagination={false}
              scroll={{ x: 850 }}
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

export default ImportSpecimenTypeModal;
