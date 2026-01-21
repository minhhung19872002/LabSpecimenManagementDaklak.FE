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
import type { TestMethodImportPreviewDto } from "../types";

// Flat item for table display
interface TestMethodImportTableItem {
  key: number;
  rowNumber: number;
  testMethodName: string;
  formattedTestMethodName?: string;
  isNewTestMethod: boolean;
  description?: string;
  unit?: string;
  indicatorName: string;
  unitPrice: number;
  isValid: boolean;
}

interface ImportTestMethodModalProps {
  open: boolean;
  loading: boolean;
  fileList: UploadFile[];
  previewData: TestMethodImportPreviewDto | null;
  onFileListChange: (fileList: UploadFile[]) => void;
  onPreview: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  onReset: () => void;
}

const ImportTestMethodModal: React.FC<ImportTestMethodModalProps> = ({
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
    const items: TestMethodImportTableItem[] = [];
    let keyIndex = 0;
    previewData.groups.forEach((group) => {
      group.indicators.forEach((indicator) => {
        items.push({
          key: keyIndex++,
          rowNumber: indicator.rowNumber,
          testMethodName: group.testMethodName,
          formattedTestMethodName: group.formattedName,
          isNewTestMethod: group.isNew,
          description: group.description,
          unit: group.unit,
          indicatorName: indicator.indicatorName,
          unitPrice: indicator.unitPrice,
          isValid: indicator.isValid,
        });
      });
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
      title: "Tên phương pháp",
      dataIndex: "testMethodName",
      key: "testMethodName",
      width: 200,
      render: (text: string, record: TestMethodImportTableItem) => (
        <Space>
          {record.formattedTestMethodName ? (
            <span dangerouslySetInnerHTML={{ __html: record.formattedTestMethodName }} />
          ) : (
            <span>{text}</span>
          )}
          {record.isNewTestMethod ? (
            <Tag color="green">Mới</Tag>
          ) : (
            <Tag color="blue">Cập nhật</Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Đơn vị",
      dataIndex: "unit",
      key: "unit",
      width: 100,
      render: (text: string) => text || "-",
    },
    {
      title: "Chỉ tiêu",
      dataIndex: "indicatorName",
      key: "indicatorName",
      width: 200,
    },
    {
      title: "Đơn giá",
      dataIndex: "unitPrice",
      key: "unitPrice",
      width: 120,
      render: (value: number) => value?.toLocaleString("vi-VN") + " đ",
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 80,
      render: (_: unknown, record: TestMethodImportTableItem) =>
        record.isValid ? (
          <Tag color="green">OK</Tag>
        ) : (
          <Tag color="red">Lỗi</Tag>
        ),
    },
  ];

  return (
    <Modal
      title="Import Phương pháp thử từ Excel"
      open={open}
      onCancel={onCancel}
      width={900}
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
                <li>Điền thông tin phương pháp và chỉ tiêu vào file Excel</li>
                <li>
                  Các cột: Tên phương pháp, Mô tả, Đơn vị tính, Chỉ tiêu, Đơn
                  giá
                </li>
                <li>
                  Cùng tên phương pháp = nhiều dòng sẽ gộp thành 1 phương pháp
                  với nhiều chỉ tiêu
                </li>
                <li>
                  Chỉ tiêu phải tồn tại trong hệ thống, không được trùng trong
                  cùng 1 phương pháp
                </li>
                <li>
                  Nếu tên phương pháp đã tồn tại → Cập nhật, ngược lại → Tạo mới
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
                  title="Tổng phương pháp"
                  value={previewData.totalTestMethods}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Mới"
                  value={previewData.newTestMethods}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Cập nhật"
                  value={previewData.updateTestMethods}
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
              scroll={{ x: 800 }}
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

export default ImportTestMethodModal;
