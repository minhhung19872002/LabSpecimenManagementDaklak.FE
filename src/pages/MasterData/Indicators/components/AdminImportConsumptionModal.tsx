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
import { UploadOutlined } from "../../../../components/common/Icon";
import type { UploadFile } from "antd/es/upload/interface";
import type { ColumnsType } from "antd/es/table";
import type {
  AdminConsumptionPreviewDto,
  AdminConsumptionPreviewItem,
} from "../../../../services/importService";
import { QUANTITY_FORMAT } from "../../../../utils/formatters";

export interface AdminImportConsumptionModalProps {
  open: boolean;
  loading: boolean;
  fileList: UploadFile[];
  previewData: AdminConsumptionPreviewDto | null;
  onFileListChange: (fileList: UploadFile[]) => void;
  onPreview: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  onReset: () => void;
}

const renderHtmlOrText = (text?: string) =>
  text?.includes("<") ? (
    <span dangerouslySetInnerHTML={{ __html: text }} />
  ) : (
    <span>{text || "-"}</span>
  );

const formatNumber = (value?: number | null) =>
  value === null || value === undefined ? "-" : value.toLocaleString("vi-VN", QUANTITY_FORMAT);

const columns: ColumnsType<AdminConsumptionPreviewItem & { key: number }> = [
  { title: "Dòng", dataIndex: "rowNumber", key: "rowNumber", width: 60 },
  { title: "Nền mẫu", dataIndex: "specimenTypeName", key: "specimenTypeName", width: 160 },
  {
    title: "Chỉ tiêu",
    dataIndex: "indicatorName",
    key: "indicatorName",
    width: 180,
    render: (text: string) => renderHtmlOrText(text),
  },
  {
    title: "Phương pháp",
    dataIndex: "testMethodName",
    key: "testMethodName",
    width: 150,
    render: (text: string) => renderHtmlOrText(text),
  },
  {
    title: "Loại vật tư",
    dataIndex: "productTypeLabel",
    key: "productTypeLabel",
    width: 120,
    render: (text: string) => (text ? <Tag color="cyan">{text}</Tag> : "-"),
  },
  { title: "Tên vật tư", dataIndex: "productName", key: "productName", width: 200 },
  {
    title: "Tiêu hao / mẫu",
    dataIndex: "quantity",
    key: "quantity",
    width: 150,
    align: "right",
    render: (v: number) => formatNumber(v),
  },
  {
    title: "Số mẫu dự tính",
    dataIndex: "estimatedSamplesPerYear",
    key: "estimatedSamplesPerYear",
    width: 150,
    align: "right",
    render: (v: number) => formatNumber(v),
  },
  {
    title: "TB / mẫu",
    dataIndex: "avgConsumptionPerSample",
    key: "avgConsumptionPerSample",
    width: 100,
    align: "right",
    render: (v?: number | null) => formatNumber(v),
  },
  {
    title: "Trạng thái",
    key: "status",
    width: 100,
    fixed: "right",
    render: (_: unknown, record) =>
      record.isValid ? <Tag color="blue">Hợp lệ</Tag> : <Tag color="red">Lỗi</Tag>,
  },
];

const AdminImportConsumptionModal: React.FC<AdminImportConsumptionModalProps> = ({
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
  const hasErrors = !!previewData && previewData.errorRows > 0;
  const errorItems = previewData?.items.filter((i) => !i.isValid) ?? [];
  const canImport = !!previewData && !hasErrors && previewData.validRows > 0;

  return (
    <Modal
      title="[Admin] Nhập tiêu hao theo chỉ tiêu"
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
        canImport && (
          <Button key="import" type="primary" loading={loading} onClick={onConfirm}>
            Xác nhận nhập tiêu hao
          </Button>
        ),
      ]}
    >
      {!previewData && (
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <Alert
            message="Hướng dẫn"
            description={
              <div>
                <div>
                  Tải "Template tiêu hao": file đã có sẵn toàn bộ combination <b>Nền mẫu</b> +{" "}
                  <b>Chỉ tiêu</b> + <b>Tên phương pháp</b> cùng tiêu hao vật tư hiện có. Điền / sửa
                  các cột <b>Loại vật tư</b>, <b>Tên vật tư</b>, <b>Tiêu hao / mẫu</b>,{" "}
                  <b>Số mẫu dự tính</b> rồi upload lại. Dòng nào 4 cột này để trống sẽ được bỏ qua,
                  đã điền thì bắt buộc đủ (cột "Khoa phòng thực hiện" hiện chưa xử lý).
                </div>
                <div>
                  Các dòng có cùng Nền mẫu + Chỉ tiêu + Phương pháp được gom thành danh sách vật tư
                  tiêu hao của chỉ tiêu đó. Tên vật tư phải khớp chính xác (phân biệt hoa/thường) và
                  đúng loại vật tư đã khai báo. Tiêu hao / mẫu nhận số thập phân, Số mẫu dự tính phải
                  là số nguyên. Hệ thống tự tính "Tiêu hao trung bình / mẫu".
                </div>
                <div style={{ color: "#fa8c16" }}>
                  Lưu ý: tiêu hao vật tư hiện có của các combination xuất hiện trong file sẽ bị{" "}
                  <b>ghi đè</b> (dòng thiết bị giữ nguyên). Các combination không có trong file giữ
                  nguyên.
                </div>
              </div>
            }
            type="info"
            showIcon
          />
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
            <p className="ant-upload-text">Kéo thả file Excel hoặc click để chọn file</p>
            <p className="ant-upload-hint">Chỉ hỗ trợ file .xlsx, .xls</p>
          </Upload.Dragger>
        </Space>
      )}

      {previewData && (
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <Card size="small">
            <Row gutter={[16, 8]}>
              <Col span={5}>
                <Statistic title="Tổng dòng" value={previewData.totalRows} />
              </Col>
              <Col span={5}>
                <Statistic
                  title="Hợp lệ"
                  value={previewData.validRows}
                  valueStyle={{ color: previewData.validRows > 0 ? "#1677ff" : undefined }}
                />
              </Col>
              <Col span={4}>
                <Statistic
                  title="Lỗi"
                  value={previewData.errorRows}
                  valueStyle={{ color: previewData.errorRows > 0 ? "#ff4d4f" : undefined }}
                />
              </Col>
              <Col span={5}>
                <Statistic
                  title="Bỏ qua (chưa điền)"
                  value={previewData.skippedRows ?? 0}
                  valueStyle={{ color: "#8c8c8c" }}
                />
              </Col>
              <Col span={5}>
                <Statistic
                  title="Combination bị ghi đè"
                  value={previewData.affectedIndicators}
                  valueStyle={{
                    color: previewData.affectedIndicators > 0 ? "#fa8c16" : undefined,
                  }}
                />
              </Col>
            </Row>
          </Card>

          {hasErrors && (
            <Alert
              type="error"
              message={`Có ${previewData.errorRows} dòng lỗi — không thể import`}
              description={
                <div style={{ maxHeight: 150, overflow: "auto" }}>
                  {errorItems.map((item) => (
                    <div key={item.rowNumber} style={{ marginBottom: 4 }}>
                      <span style={{ color: "#ff4d4f", fontWeight: 500 }}>
                        Dòng {item.rowNumber}:
                      </span>{" "}
                      {item.errors.join("; ")}
                    </div>
                  ))}
                </div>
              }
              showIcon
            />
          )}

          {!hasErrors && previewData.validRows === 0 && (
            <Alert
              type="info"
              message="File không có dòng tiêu hao nào để nhập (các dòng chưa điền vật tư đều bị bỏ qua)"
              showIcon
            />
          )}

          <div style={{ maxHeight: 400, overflow: "auto" }}>
            <Table
              size="small"
              dataSource={previewData.items.map((item, i) => ({ ...item, key: i }))}
              columns={columns}
              pagination={false}
              scroll={{ x: 1370 }}
              rowClassName={(record) => (record.isValid ? "" : "ant-table-row-error")}
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

export default AdminImportConsumptionModal;
