import React from "react";
import { Modal, Space, Alert, Upload } from "antd";
import { UploadOutlined } from "../../../../components/common/Icon";
import type { UploadFile } from "antd/es/upload/interface";
import {
  ImportIndicatorsResultDto,
  ImportIndicatorGroupsResultDto,
} from "../types";

interface ImportIndicatorModalProps {
  open: boolean;
  loading: boolean;
  fileList: UploadFile[];
  importResult: ImportIndicatorsResultDto | null;
  onFileListChange: (fileList: UploadFile[]) => void;
  onOk: () => void;
  onCancel: () => void;
}

export const ImportIndicatorModal: React.FC<ImportIndicatorModalProps> = ({
  open,
  loading,
  fileList,
  importResult,
  onFileListChange,
  onOk,
  onCancel,
}) => {
  return (
    <Modal
      title="Import chỉ tiêu từ Excel"
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      confirmLoading={loading}
      okText="Import"
      cancelText="Đóng"
      width={600}
      centered
      styles={{ body: { paddingTop: 16 } }}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        {/* <Alert
          message="Hướng dẫn"
          description={
            <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
              <li>Tải template Excel mẫu bằng nút "Template chỉ tiêu"</li>
              <li>Điền thông tin chỉ tiêu vào file Excel</li>
              <li>
                Các cột bắt buộc: Tên chỉ tiêu, Đơn giá, Tên nhóm chỉ tiêu
              </li>
              <li>Tên nhóm chỉ tiêu phải khớp chính xác với nhóm đã tạo</li>
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

        {importResult && (
          <Alert
            message={`Kết quả import: ${importResult.successCount}/${importResult.totalRows} thành công`}
            description={
              importResult.errors.length > 0 ? (
                <div style={{ maxHeight: 200, overflow: "auto" }}>
                  <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                    {importResult.errors.map((err, idx) => (
                      <li key={idx} style={{ color: "#ff4d4f" }}>
                        Dòng {err.rowNumber}: {err.indicatorName} -{" "}
                        {err.errorMessage}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null
            }
            type={importResult.errorCount > 0 ? "warning" : "success"}
            showIcon
          />
        )}
      </Space>
    </Modal>
  );
};

interface ImportGroupModalProps {
  open: boolean;
  loading: boolean;
  fileList: UploadFile[];
  importResult: ImportIndicatorGroupsResultDto | null;
  onFileListChange: (fileList: UploadFile[]) => void;
  onOk: () => void;
  onCancel: () => void;
}

export const ImportGroupModal: React.FC<ImportGroupModalProps> = ({
  open,
  loading,
  fileList,
  importResult,
  onFileListChange,
  onOk,
  onCancel,
}) => {
  return (
    <Modal
      title="Import nhóm chỉ tiêu từ Excel"
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      confirmLoading={loading}
      okText="Import"
      cancelText="Đóng"
      width={600}
      centered
      styles={{ body: { paddingTop: 16 } }}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        {/* <Alert
          message="Hướng dẫn"
          description={
            <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
              <li>Tải template Excel mẫu bằng nút "Template nhóm"</li>
              <li>Điền tên nhóm chỉ tiêu vào file Excel</li>
              <li>Mỗi dòng là một nhóm chỉ tiêu</li>
              <li>Tên nhóm chỉ tiêu không được trùng</li>
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

        {importResult && (
          <Alert
            message={`Kết quả import: ${importResult.successCount}/${importResult.totalRows} thành công`}
            description={
              importResult.errors.length > 0 ? (
                <div style={{ maxHeight: 200, overflow: "auto" }}>
                  <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                    {importResult.errors.map((err, idx) => (
                      <li key={idx} style={{ color: "#ff4d4f" }}>
                        Dòng {err.rowNumber}: {err.groupName} -{" "}
                        {err.errorMessage}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null
            }
            type={importResult.errorCount > 0 ? "warning" : "success"}
            showIcon
          />
        )}
      </Space>
    </Modal>
  );
};
