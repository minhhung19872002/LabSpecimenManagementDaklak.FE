import React, { useState } from "react";
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
  message,
} from "antd";
import {
  UploadOutlined,
  DownloadOutlined,
} from "../../../components/common/Icon";
import type { UploadFile } from "antd/es/upload/interface";
import type { ProductImportPreviewDto } from "../../../services/importService";
import { ProductImportItemStatus } from "../../../services/importService";
import importService from "../../../services/importService";
import { downloadBlobAsFile } from "../../../services/importService";

interface ImportProductModalProps {
  open: boolean;
  loading: boolean;
  warehouseId?: string;
  fileList: UploadFile[];
  previewData: ProductImportPreviewDto | null;
  onFileListChange: (fileList: UploadFile[]) => void;
  onPreview: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  onReset: () => void;
}

const ImportProductModal: React.FC<ImportProductModalProps> = ({
  open,
  loading,
  warehouseId,
  fileList,
  previewData,
  onFileListChange,
  onPreview,
  onConfirm,
  onCancel,
  onReset,
}) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadTemplate = async () => {
    if (!warehouseId) {
      message.warning("Vui lòng chọn kho trước khi tải template");
      return;
    }
    setDownloading(true);
    try {
      const blob = await importService.downloadProductTemplate(warehouseId);
      downloadBlobAsFile(blob, "Danh_sach_vat_tu.xlsx");
    } catch {
      message.error("Không thể tải template");
    } finally {
      setDownloading(false);
    }
  };
  const hasValidationErrors =
    previewData &&
    previewData.validationResult.errors.length > 0 &&
    previewData.validRows === 0;

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

  const getStatusTag = (status: ProductImportItemStatus) => {
    switch (status) {
      case ProductImportItemStatus.New:
        return <Tag color="green">Mới</Tag>;
      case ProductImportItemStatus.Update:
        return <Tag color="blue">Cập nhật</Tag>;
      case ProductImportItemStatus.Skipped:
        return <Tag color="orange">Bỏ qua</Tag>;
      default:
        return null;
    }
  };

  const fmtQty = (qty?: number, unit?: string) => {
    if (qty == null) return "";
    return unit ? `${qty} ${unit}` : `${qty}`;
  };

  const columns = [
    {
      title: "Dòng",
      dataIndex: "rowNumber",
      key: "rowNumber",
      width: 55,
      fixed: "left" as const,
    },
    {
      title: "Mã nhận dạng",
      dataIndex: "identificationCode",
      key: "identificationCode",
      width: 120,
      fixed: "left" as const,
    },
    {
      title: "Tên vật tư",
      dataIndex: "productName",
      key: "productName",
      width: 170,
      ellipsis: true,
    },
    {
      title: "Số lô",
      dataIndex: "lotNumber",
      key: "lotNumber",
      width: 100,
    },
    {
      title: "SL đầu kỳ",
      key: "openingStorage",
      width: 100,
      align: "right" as const,
      render: (_: unknown, r: ProductImportPreviewDto["items"][0]) =>
        fmtQty(r.quantity, r.storageUnitName),
    },
    {
      title: "SL tiêu hao",
      key: "consumedStorage",
      width: 100,
      align: "right" as const,
      render: (_: unknown, r: ProductImportPreviewDto["items"][0]) =>
        fmtQty(r.consumedStorageQty, r.storageUnitName),
    },
    {
      title: "SL cuối kỳ",
      key: "endingStorage",
      width: 100,
      align: "right" as const,
      render: (_: unknown, r: ProductImportPreviewDto["items"][0]) =>
        fmtQty(r.endingStorageQty, r.storageUnitName),
    },
    {
      title: "Nhà sản xuất",
      dataIndex: "manufacturerName",
      key: "manufacturerName",
      width: 120,
      ellipsis: true,
    },
    {
      title: "Ghi chú",
      dataIndex: "notes",
      key: "notes",
      width: 120,
      ellipsis: true,
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 95,
      fixed: "right" as const,
      render: (_: unknown, record: ProductImportPreviewDto["items"][0]) => (
        <Space direction="vertical" size={0}>
          {getStatusTag(record.status)}
          {record.skipReason && (
            <span style={{ fontSize: 11, color: "#faad14" }}>
              {record.skipReason}
            </span>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Modal
      title="Import danh sách vật tư từ Excel"
      open={open}
      onCancel={onCancel}
      width={1100}
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
        previewData && !hasValidationErrors && previewData.validRows > 0 && (
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
          <Button
            icon={<DownloadOutlined />}
            loading={downloading}
            disabled={!warehouseId}
            onClick={handleDownloadTemplate}
          >
            Tải template (có dữ liệu kho hiện tại)
          </Button>
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
          {previewData.warehouseName && (
            <Alert
              type="info"
              message={`Kho: ${previewData.warehouseName}`}
              showIcon
            />
          )}

          <Card size="small">
            <Row gutter={16}>
              <Col span={5}>
                <Statistic
                  title="Tổng dòng"
                  value={previewData.totalRows}
                />
              </Col>
              <Col span={5}>
                <Statistic
                  title="Mới"
                  value={previewData.newItems}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Col>
              <Col span={5}>
                <Statistic
                  title="Cập nhật"
                  value={previewData.updateItems}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Col>
              <Col span={5}>
                <Statistic
                  title="Bỏ qua"
                  value={previewData.skippedRows}
                  valueStyle={{
                    color: previewData.skippedRows > 0 ? "#faad14" : undefined,
                  }}
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
            </Row>
          </Card>

          {previewData.skippedRows > 0 && (
            <Alert
              type="warning"
              message={`${previewData.skippedRows} dòng bị bỏ qua do Mã nhận dạng không tồn tại trong master data`}
              showIcon
            />
          )}

          {groupedErrors.length > 0 && (
            <Alert
              type="error"
              message={`Có ${groupedErrors.length} dòng lỗi validation`}
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
              scroll={{ x: 1100 }}
              rowClassName={(record) =>
                !record.isValid && record.status !== ProductImportItemStatus.Skipped
                  ? "ant-table-row-error"
                  : record.status === ProductImportItemStatus.Skipped
                    ? "ant-table-row-skipped"
                    : ""
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
            .ant-table-row-skipped {
              background-color: #fffbe6 !important;
            }
            .ant-table-row-skipped:hover > td {
              background-color: #fff7cc !important;
            }
          `}</style>

          <Button onClick={onReset}>Chọn file khác</Button>
        </Space>
      )}
    </Modal>
  );
};

export default ImportProductModal;
