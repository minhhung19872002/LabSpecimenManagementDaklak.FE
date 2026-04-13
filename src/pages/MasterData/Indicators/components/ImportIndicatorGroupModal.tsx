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
import type {
  IndicatorGroupImportPreviewDto,
  IndicatorGroupImportPreviewItem,
} from "../../../../services/importService";

interface ImportIndicatorGroupModalProps {
  open: boolean;
  loading: boolean;
  fileList: UploadFile[];
  previewData: IndicatorGroupImportPreviewDto | null;
  onFileListChange: (fileList: UploadFile[]) => void;
  onPreview: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  onReset: () => void;
}

const ImportIndicatorGroupModal: React.FC<ImportIndicatorGroupModalProps> = ({
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

  const columns = [
    {
      title: "Dòng",
      dataIndex: "rowNumber",
      key: "rowNumber",
      width: 60,
    },
    {
      title: "Tên nhóm chỉ tiêu",
      dataIndex: "indicatorGroupName",
      key: "indicatorGroupName",
      width: 200,
      render: (text: string, record: IndicatorGroupImportPreviewItem) => (
        <Space>
          <span>{text}</span>
          {record.isNewIndicatorGroup ? (
            <Tag color="green">Mới</Tag>
          ) : (
            <Tag color="blue">Cập nhật</Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Khoa phòng thực hiện",
      dataIndex: "departmentName",
      key: "departmentName",
      width: 180,
      render: (text: string, record: IndicatorGroupImportPreviewItem) => (
        <Space>
          <span>{text || "-"}</span>
          {record.isDepartmentInvalid && <Tag color="red">Không tồn tại</Tag>}
        </Space>
      ),
    },
    {
      title: "Nền mẫu",
      dataIndex: "specimenTypeName",
      key: "specimenTypeName",
      width: 160,
      render: (text: string, record: IndicatorGroupImportPreviewItem) => (
        <Space>
          <span>{text || "-"}</span>
          {record.isSpecimenTypeInvalid && <Tag color="red">Không tồn tại</Tag>}
        </Space>
      ),
    },
    {
      title: "Tên chỉ tiêu",
      dataIndex: "indicatorName",
      key: "indicatorName",
      width: 180,
      render: (text: string, record: IndicatorGroupImportPreviewItem) => (
        <Space>
          {record.formattedIndicatorName ? (
            <span
              dangerouslySetInnerHTML={{
                __html: record.formattedIndicatorName,
              }}
            />
          ) : (
            <span>{text}</span>
          )}
          {record.isNewIndicator ? (
            <Tag color="green">Mới</Tag>
          ) : (
            <Tag color="orange">Cập nhật</Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Chỉ tiêu phụ",
      dataIndex: "subIndicatorName",
      key: "subIndicatorName",
      width: 180,
      render: (text: string, record: IndicatorGroupImportPreviewItem) => {
        if (!record.hasSubIndicator || !text) {
          return <span style={{ color: "#999" }}>-</span>;
        }
        return (
          <Space>
            {record.formattedSubIndicatorName ? (
              <span
                dangerouslySetInnerHTML={{
                  __html: record.formattedSubIndicatorName,
                }}
              />
            ) : (
              <span>{text}</span>
            )}
            {record.isNewSubIndicator ? (
              <Tag color="green">Mới</Tag>
            ) : (
              <Tag color="orange">Cập nhật</Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: "Tên phương pháp",
      dataIndex: "testMethodName",
      key: "testMethodName",
      width: 200,
      render: (text: string, record: IndicatorGroupImportPreviewItem) => (
        <Space>
          <span>{text || "-"}</span>
          {record.isTestMethodInvalid && <Tag color="red">Không tồn tại</Tag>}
          {!record.isTestMethodInvalid &&
            !record.isSpecimenTypeInvalid &&
            (record.isNewMethodLink ? (
              <Tag color="green">Liên kết mới</Tag>
            ) : (
              <Tag color="blue">Liên kết cập nhật</Tag>
            ))}
        </Space>
      ),
    },
    {
      title: "Đơn vị tính",
      dataIndex: "unit",
      key: "unit",
      width: 120,
      render: (text?: string) => <span>{text || "-"}</span>,
    },
    {
      title: "Đơn giá",
      dataIndex: "unitPrice",
      key: "unitPrice",
      width: 120,
      render: (value: number) => (
        <span>{Number(value || 0).toLocaleString("vi-VN")}</span>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 80,
      render: (_: unknown, record: IndicatorGroupImportPreviewItem) =>
        record.isValid ? (
          <Tag color="green">OK</Tag>
        ) : (
          <Tag color="red">Lỗi</Tag>
        ),
    },
  ];

  return (
    <Modal
      title="Import Nhóm chỉ tiêu + Chỉ tiêu từ Excel"
      open={open}
      onCancel={onCancel}
      width={1200}
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
                <li>Tải template Excel mẫu bằng nút "Tải template mẫu"</li>
                <li>Điền thông tin theo các cột: Tên nhóm chỉ tiêu, Khoa phòng thực hiện, Tên chỉ tiêu</li>
                <li>Tên nhóm chỉ tiêu và Tên chỉ tiêu là bắt buộc</li>
                <li>Khoa phòng có thể để trống, sửa sau</li>
                <li>Nếu nhóm/chỉ tiêu đã tồn tại sẽ được cập nhật</li>
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
            <Row gutter={[16, 8]}>
              <Col span={4}>
                <Statistic title="Tổng dòng" value={previewData.totalRows} />
              </Col>
              <Col span={4}>
                <Statistic
                  title="Nhóm mới"
                  value={previewData.newIndicatorGroups}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Col>
              <Col span={4}>
                <Statistic
                  title="Nhóm cập nhật"
                  value={previewData.updateIndicatorGroups}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Col>
              <Col span={4}>
                <Statistic
                  title="Chỉ tiêu mới"
                  value={previewData.newIndicators}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Col>
              <Col span={4}>
                <Statistic
                  title="Chỉ tiêu cập nhật"
                  value={previewData.updateIndicators}
                  valueStyle={{ color: "#fa8c16" }}
                />
              </Col>
              <Col span={4}>
                <Statistic
                  title="Lỗi"
                  value={previewData.invalidRows}
                  valueStyle={{
                    color: previewData.invalidRows > 0 ? "#ff4d4f" : undefined,
                  }}
                />
              </Col>
              {(previewData.newSubIndicators > 0 ||
                previewData.updateSubIndicators > 0) && (
                <>
                  <Col span={4} offset={8}>
                    <Statistic
                      title="Chỉ tiêu phụ mới"
                      value={previewData.newSubIndicators}
                      valueStyle={{ color: "#52c41a" }}
                    />
                  </Col>
                  <Col span={4}>
                    <Statistic
                      title="Chỉ tiêu phụ cập nhật"
                      value={previewData.updateSubIndicators}
                      valueStyle={{ color: "#fa8c16" }}
                    />
                  </Col>
                </>
              )}
              {(previewData.newMethodLinks > 0 ||
                previewData.updateMethodLinks > 0) && (
                <>
                  <Col span={4}>
                    <Statistic
                      title="LK phương pháp mới"
                      value={previewData.newMethodLinks}
                      valueStyle={{ color: "#52c41a" }}
                    />
                  </Col>
                  <Col span={4}>
                    <Statistic
                      title="LK phương pháp cập nhật"
                      value={previewData.updateMethodLinks}
                      valueStyle={{ color: "#1890ff" }}
                    />
                  </Col>
                </>
              )}
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

          {/* Preview Table */}
          <div style={{ maxHeight: 400, overflow: "auto" }}>
            <Table
              size="small"
              dataSource={previewData.items.map((item, i) => ({
                ...item,
                key: i,
              }))}
              columns={columns}
              pagination={false}
              scroll={{ x: 1500 }}
              rowClassName={(record) =>
                record.isValid ? "" : "ant-table-row-error"
              }
            />
          </div>

          <Button onClick={onReset}>Chọn file khác</Button>
        </Space>
      )}

      <style>{`
        .ant-table-row-error {
          background-color: #fff2f0 !important;
        }
        .ant-table-row-error:hover > td {
          background-color: #ffebe6 !important;
        }
      `}</style>
    </Modal>
  );
};

export default ImportIndicatorGroupModal;
