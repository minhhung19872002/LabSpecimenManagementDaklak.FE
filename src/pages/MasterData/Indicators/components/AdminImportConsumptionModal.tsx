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
  value === null || value === undefined ? "-" : value.toLocaleString("vi-VN");

const columns: ColumnsType<AdminConsumptionPreviewItem & { key: number }> = [
  { title: "Dòng", dataIndex: "rowNumber", key: "rowNumber", width: 60 },
  { title: "Nhóm chỉ tiêu", dataIndex: "groupName", key: "groupName", width: 150 },
  {
    title: "Chỉ tiêu",
    dataIndex: "indicatorFormattedName",
    key: "indicatorFormattedName",
    width: 200,
    render: (text: string) => renderHtmlOrText(text),
  },
  {
    title: "Phương pháp",
    dataIndex: "testMethodName",
    key: "testMethodName",
    width: 160,
    render: (text: string) => renderHtmlOrText(text),
  },
  {
    title: "Loại",
    dataIndex: "isEquipment",
    key: "isEquipment",
    width: 90,
    render: (isEquipment: boolean) =>
      isEquipment ? <Tag color="purple">Thiết bị</Tag> : <Tag color="cyan">Vật tư</Tag>,
  },
  { title: "Mã", dataIndex: "itemCode", key: "itemCode", width: 120 },
  { title: "Tên vật tư / thiết bị", dataIndex: "itemName", key: "itemName", width: 200 },
  { title: "Đơn vị", dataIndex: "unitName", key: "unitName", width: 90 },
  {
    title: "Số lượng",
    dataIndex: "quantity",
    key: "quantity",
    width: 100,
    align: "right",
    render: (v: number) => formatNumber(v),
  },
  {
    title: "Mẫu/năm",
    dataIndex: "estimatedSamplesPerYear",
    key: "estimatedSamplesPerYear",
    width: 100,
    align: "right",
    render: (v?: number | null) => formatNumber(v),
  },
  {
    title: "TB/mẫu",
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
                  Tải "Template tiêu hao", điền các cột <b>Mã vật tư / Serial thiết bị</b>,{" "}
                  <b>Đơn vị</b>, <b>Số lượng</b> (tuỳ chọn: Số mẫu dự kiến/năm, Tiêu hao TB/mẫu)
                  cho từng dòng chỉ tiêu + phương pháp, rồi upload lại.
                </div>
                <div>
                  Một chỉ tiêu + phương pháp cần nhiều vật tư thì copy thành nhiều dòng, giữ nguyên
                  cột ID màu xám.
                </div>
                <div style={{ color: "#fa8c16" }}>
                  Lưu ý: tiêu hao hiện có của các cặp chỉ tiêu + phương pháp xuất hiện trong file sẽ
                  bị <b>ghi đè toàn bộ</b>. Các cặp không có trong file giữ nguyên.
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
              <Col span={6}>
                <Statistic title="Tổng dòng" value={previewData.totalRows} />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Hợp lệ"
                  value={previewData.validRows}
                  valueStyle={{ color: previewData.validRows > 0 ? "#1677ff" : undefined }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Lỗi"
                  value={previewData.errorRows}
                  valueStyle={{ color: previewData.errorRows > 0 ? "#ff4d4f" : undefined }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Chỉ tiêu + PP bị ghi đè"
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
            <Alert type="info" message="File không có dòng tiêu hao nào để nhập" showIcon />
          )}

          <div style={{ maxHeight: 400, overflow: "auto" }}>
            <Table
              size="small"
              dataSource={previewData.items.map((item, i) => ({ ...item, key: i }))}
              columns={columns}
              pagination={false}
              scroll={{ x: 1400 }}
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
