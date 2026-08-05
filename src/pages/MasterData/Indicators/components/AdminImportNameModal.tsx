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
import type {
  AdminIndicatorNamePreviewDto,
  AdminIndicatorNamePreviewItem,
} from "../../../../services/importService";

interface AdminImportNameModalProps {
  open: boolean;
  loading: boolean;
  fileList: UploadFile[];
  previewData: AdminIndicatorNamePreviewDto | null;
  onFileListChange: (fileList: UploadFile[]) => void;
  onPreview: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  onReset: () => void;
}

const AdminImportNameModal: React.FC<AdminImportNameModalProps> = ({
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
  const hasErrors = previewData && previewData.errorRows > 0;

  const columns = [
    {
      title: "Dòng",
      dataIndex: "rowNumber",
      key: "rowNumber",
      width: 60,
    },
    {
      title: "Nhóm chỉ tiêu",
      dataIndex: "groupName",
      key: "groupName",
      width: 200,
    },
    {
      title: "Tên hiện tại",
      dataIndex: "currentFormattedName",
      key: "currentFormattedName",
      width: 250,
      render: (text: string) =>
        text?.includes("<") ? (
          <span dangerouslySetInnerHTML={{ __html: text }} />
        ) : (
          <span>{text || "-"}</span>
        ),
    },
    {
      title: "Tên mới",
      dataIndex: "newFormattedName",
      key: "newFormattedName",
      width: 250,
      render: (text: string, record: AdminIndicatorNamePreviewItem) => {
        const content = text?.includes("<") ? (
          <span dangerouslySetInnerHTML={{ __html: text }} />
        ) : (
          <span>{text || "-"}</span>
        );
        return (
          <Space>
            {content}
            {record.isChanged && <Tag color="orange">Thay đổi</Tag>}
          </Space>
        );
      },
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 100,
      render: (_: unknown, record: AdminIndicatorNamePreviewItem) => {
        if (!record.isValid) return <Tag color="red">Lỗi</Tag>;
        if (record.isChanged) return <Tag color="blue">Cập nhật</Tag>;
        return <Tag>Không đổi</Tag>;
      },
    },
  ];

  const changedItems = previewData?.items.filter(
    (i) => i.isValid && i.isChanged
  );
  const errorItems = previewData?.items.filter((i) => !i.isValid);

  return (
    <Modal
      title="[Admin] Cập nhật tên chỉ tiêu"
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
        previewData && !hasErrors && (changedItems?.length ?? 0) > 0 && (
          <Button
            key="import"
            type="primary"
            loading={loading}
            onClick={onConfirm}
          >
            Xác nhận cập nhật
          </Button>
        ),
      ]}
    >
      {!previewData && (
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <Alert
            message="Hướng dẫn"
            description="Tải template Excel, chỉnh sửa cột Tên chỉ tiêu (hỗ trợ bold/italic/subscript/superscript), rồi upload lại. Chỉ những dòng có thay đổi tên mới được cập nhật."
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
            <Row gutter={[16, 8]}>
              <Col span={6}>
                <Statistic title="Tổng dòng" value={previewData.totalRows} />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Thay đổi"
                  value={previewData.changedRows}
                  valueStyle={{ color: previewData.changedRows > 0 ? "#fa8c16" : undefined }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Không đổi"
                  value={previewData.unchangedRows}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Lỗi"
                  value={previewData.errorRows}
                  valueStyle={{ color: previewData.errorRows > 0 ? "#ff4d4f" : undefined }}
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
                  {errorItems?.map((item, idx) => (
                    <div key={idx} style={{ marginBottom: 4 }}>
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

          {!hasErrors && previewData.changedRows === 0 && (
            <Alert
              type="info"
              message="Không có chỉ tiêu nào thay đổi tên"
              showIcon
            />
          )}

          <div style={{ maxHeight: 400, overflow: "auto" }}>
            <Table
              size="small"
              dataSource={(changedItems?.length ? changedItems : previewData.items).map(
                (item, i) => ({ ...item, key: i })
              )}
              columns={columns}
              pagination={false}
              scroll={{ x: 900 }}
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

export default AdminImportNameModal;
