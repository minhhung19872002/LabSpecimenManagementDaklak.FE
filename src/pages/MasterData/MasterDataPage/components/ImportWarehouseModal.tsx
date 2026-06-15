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

export interface ImportRowError {
  rowNumber: number;
  columnName: string;
  errorMessage: string;
  value?: string;
}

export interface ImportValidationResult {
  isValid: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: ImportRowError[];
}

export interface WarehouseImportPreviewItem {
  rowNumber: number;
  name: string;
  physicalLocation?: string;
  isNew: boolean;
  existingId?: string;
  isValid: boolean;
  errors: string[];
}

export interface WarehouseImportPreviewDto {
  validationResult: ImportValidationResult;
  items: WarehouseImportPreviewItem[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  newWarehouses: number;
  updateWarehouses: number;
  errorFileBase64?: string;
  errorFileName?: string;
}

interface ImportWarehouseModalProps {
  open: boolean;
  loading: boolean;
  fileList: UploadFile[];
  previewData: WarehouseImportPreviewDto | null;
  onFileListChange: (fileList: UploadFile[]) => void;
  onPreview: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  onReset: () => void;
}

const ImportWarehouseModal: React.FC<ImportWarehouseModalProps> = ({
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

  const groupedErrors = React.useMemo(() => {
    if (!previewData?.validationResult.errors.length) return [];

    const errorMap = new Map<number, string[]>();
    previewData.validationResult.errors.forEach((err) => {
      const messages = errorMap.get(err.rowNumber) || [];
      const msg = err.value
        ? `${err.errorMessage} (${err.value})`
        : err.errorMessage;
      messages.push(msg);
      errorMap.set(err.rowNumber, messages);
    });

    return Array.from(errorMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([rowNumber, messages]) => ({ rowNumber, messages }));
  }, [previewData?.validationResult.errors]);

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

  const columns = [
    {
      title: "Dòng",
      dataIndex: "rowNumber",
      key: "rowNumber",
      width: 60,
    },
    {
      title: "Tên kho",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: WarehouseImportPreviewItem) => (
        <Space>
          <span>{text}</span>
          {record.isNew ? (
            <Tag color="green">Mới</Tag>
          ) : (
            <Tag color="blue">Cập nhật</Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Vị trí vật lý",
      dataIndex: "physicalLocation",
      key: "physicalLocation",
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 80,
      render: (_: unknown, record: WarehouseImportPreviewItem) =>
        record.isValid ? (
          <Tag color="green">OK</Tag>
        ) : (
          <Tag color="red">Lỗi</Tag>
        ),
    },
  ];

  return (
    <Modal
      title="Import Danh mục kho từ Excel"
      open={open}
      onCancel={onCancel}
      width={700}
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

      {previewData && (
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <Card size="small">
            <Row gutter={16}>
              <Col span={6}>
                <Statistic
                  title="Tổng số dòng"
                  value={previewData.totalRows}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Mới"
                  value={previewData.newWarehouses}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Cập nhật"
                  value={previewData.updateWarehouses}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Lỗi"
                  value={previewData.invalidRows}
                  valueStyle={{
                    color: previewData.invalidRows > 0 ? "#ff4d4f" : undefined,
                  }}
                />
              </Col>
            </Row>
          </Card>

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

          <div style={{ maxHeight: 400, overflow: "auto" }}>
            <Table
              size="small"
              dataSource={previewData.items}
              columns={columns}
              pagination={false}
              rowKey="rowNumber"
              scroll={{ x: 500 }}
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

export default ImportWarehouseModal;
