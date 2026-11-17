import React, { useEffect, useState } from "react";
import { Alert, Button, Modal, Space, Table, Tag, Upload, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  ImportServicePriceRowResult,
  serviceCatalogService,
  type ImportServicePriceRowDto,
  type ImportServicePriceRowInput,
  type ImportServicePricesResultDto,
} from "../../../services/serviceCatalogService";
import { getApiErrorMessage } from "../../../utils/errorHandler";
import { UploadOutlined } from "../../../components/common/Icon";
import { EXCEL_COLUMNS, formatPrice, formatShortDate, parseImportFile } from "./ServiceCatalog/utils";

export interface ImportPricesModalProps {
  open: boolean;
  onDone: () => void;
  onCancel: () => void;
}

const RESULT_TAG: Record<ImportServicePriceRowResult, React.ReactNode> = {
  [ImportServicePriceRowResult.Update]: <Tag color="blue">Cập nhật</Tag>,
  [ImportServicePriceRowResult.Same]: <Tag>Không đổi</Tag>,
  [ImportServicePriceRowResult.Error]: <Tag color="red">Lỗi</Tag>,
};

/** Nhập bảng giá từ Excel: đọc file → kiểm tra (dry-run) → áp dụng */
const ImportPricesModal: React.FC<ImportPricesModalProps> = ({ open, onDone, onCancel }) => {
  const [rows, setRows] = useState<ImportServicePriceRowInput[]>([]);
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<ImportServicePricesResultDto | null>(null);
  const [checking, setChecking] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (open) {
      setRows([]);
      setFileName("");
      setPreview(null);
    }
  }, [open]);

  const handleFile = async (file: File) => {
    setChecking(true);
    setPreview(null);
    try {
      const parsed = await parseImportFile(file);
      if (parsed.length === 0) {
        message.warning("File không có dòng dữ liệu");
        return;
      }
      setRows(parsed);
      setFileName(file.name);
      setPreview(await serviceCatalogService.importPrices(parsed, true));
    } catch (error) {
      message.error(getApiErrorMessage(error, "Không đọc được file"));
    } finally {
      setChecking(false);
    }
  };

  const handleApply = async () => {
    setApplying(true);
    try {
      const result = await serviceCatalogService.importPrices(rows, false);
      message.success(`Đã cập nhật ${result.updateCount} dịch vụ`);
      onDone();
    } catch (error) {
      message.error(getApiErrorMessage(error, "Không nhập được bảng giá"));
    } finally {
      setApplying(false);
    }
  };

  const columns: ColumnsType<ImportServicePriceRowDto> = [
    { title: "Dòng", dataIndex: "line", key: "line", width: 60 },
    { title: "Mã DV", dataIndex: "serviceCode", key: "code", width: 100 },
    { title: "Dịch vụ", dataIndex: "serviceName", key: "name", render: (v) => v || "—" },
    {
      title: "Giá",
      key: "price",
      width: 190,
      align: "right",
      render: (_, r) =>
        r.oldPrice != null && r.oldPrice !== r.newPrice
          ? `${formatPrice(r.oldPrice)} → ${formatPrice(r.newPrice)}`
          : formatPrice(r.newPrice),
    },
    {
      title: "TAT",
      key: "tat",
      width: 90,
      render: (_, r) =>
        r.oldTurnaroundDays != null && r.oldTurnaroundDays !== r.newTurnaroundDays
          ? `${r.oldTurnaroundDays} → ${r.newTurnaroundDays ?? "—"}`
          : (r.newTurnaroundDays ?? "—"),
    },
    { title: "Áp dụng", dataIndex: "effectiveDate", key: "date", width: 100, render: (v) => formatShortDate(v) },
    {
      title: "Kết quả",
      key: "result",
      width: 220,
      render: (_, r) => (
        <span>
          {RESULT_TAG[r.result]} {r.message}
        </span>
      ),
    },
  ];

  return (
    <Modal
      open={open}
      title="Nhập bảng giá từ Excel"
      onCancel={onCancel}
      destroyOnHidden
      width={1000}
      footer={
        <Space>
          <Button onClick={onCancel}>Hủy</Button>
          <Button
            type="primary"
            loading={applying}
            disabled={!preview || preview.updateCount === 0}
            onClick={handleApply}
          >
            Áp dụng {preview ? `${preview.updateCount} dòng` : ""}
          </Button>
        </Space>
      }
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 12 }}
        message={`Cột bắt buộc: ${EXCEL_COLUMNS.join(", ")} — dùng file “Xuất Excel” làm mẫu. Chỉ cập nhật giá / TAT theo Service_ID, không tạo dịch vụ mới. Dòng lỗi bị bỏ qua.`}
      />
      <Space style={{ marginBottom: 12 }}>
        <Upload
          accept=".xlsx,.xls"
          showUploadList={false}
          beforeUpload={(file) => {
            handleFile(file);
            return false;
          }}
        >
          <Button icon={<UploadOutlined />} loading={checking}>
            Chọn file
          </Button>
        </Upload>
        {fileName && <span>{fileName}</span>}
      </Space>
      {preview && (
        <>
          <Space style={{ marginBottom: 8 }}>
            <Tag color="blue">Cập nhật: {preview.updateCount}</Tag>
            <Tag>Không đổi: {preview.sameCount}</Tag>
            <Tag color="red">Lỗi: {preview.errorCount}</Tag>
          </Space>
          <Table
            columns={columns}
            dataSource={preview.rows}
            rowKey="line"
            size="small"
            pagination={{ pageSize: 50 }}
            scroll={{ y: 360 }}
          />
        </>
      )}
    </Modal>
  );
};

export default ImportPricesModal;
