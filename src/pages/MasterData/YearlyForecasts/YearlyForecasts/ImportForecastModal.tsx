import React, { useState } from "react";
import { Alert, Button, Modal, Table, Tag, Upload } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DownloadOutlined, UploadOutlined } from "../../../../components/common/Icon";
import { fmt } from "../YearlyForecastCreate/utils";
import type { ImportLineStatus, ImportLineView, ImportPreview } from "./utils";

export interface ImportForecastModalProps {
  open: boolean;
  year: number;
  fileName: string;
  parsing: boolean;
  preview: ImportPreview | null;
  onPickFile: (file: File) => void;
  onDownloadTemplate: () => void;
  onClose: () => void;
  /** Handler tự try/catch, không re-throw */
  onConfirm: () => Promise<void>;
}

const STATUS: Record<ImportLineStatus, { label: string; color: string }> = {
  error: { label: "Lỗi", color: "red" },
  changed: { label: "Sẽ ghi", color: "blue" },
  same: { label: "Không đổi", color: "default" },
  skip: { label: "Bỏ qua", color: "default" },
};
const ORDER: Record<ImportLineStatus, number> = { error: 0, changed: 1, same: 2, skip: 3 };

const columns: ColumnsType<ImportLineView> = [
  { title: "Dòng", dataIndex: "line", width: 64, align: "right" },
  {
    title: "Nền mẫu · Chỉ tiêu · Phương pháp",
    key: "combo",
    ellipsis: true,
    render: (_, r) => (
      <span title={`${r.specimenName} · ${r.indicatorName} · ${r.methodName}`}>
        {r.specimenName || "—"} · <strong style={{ fontWeight: 500 }}>{r.indicatorName || "—"}</strong> · {r.methodName || "—"}
      </span>
    ),
  },
  { title: "Mã DV", dataIndex: "serviceCode", width: 90, ellipsis: true },
  {
    title: "Hiện tại",
    dataIndex: "oldSamples",
    width: 90,
    align: "right",
    render: (v: number) => (v > 0 ? fmt(v) : "—"),
  },
  {
    title: "Trong file",
    dataIndex: "newSamples",
    width: 90,
    align: "right",
    render: (v: number | null) => (v != null ? <strong style={{ fontWeight: 600 }}>{fmt(v)}</strong> : "—"),
  },
  {
    title: "Kết quả",
    key: "status",
    width: 240,
    render: (_, r) => (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, minWidth: 0 }}>
        <Tag color={STATUS[r.status].color} style={{ marginInlineEnd: 0 }}>
          {STATUS[r.status].label}
        </Tag>
        <span className="bnc-ellipsis" style={{ fontSize: 12, color: r.status === "error" ? "#cf1322" : "#595959" }} title={r.note}>
          {r.note}
        </span>
      </span>
    ),
  },
];

const ConfirmImportButton = React.memo<{ count: number; onConfirm: () => Promise<void> }>(function ConfirmImportButton({
  count,
  onConfirm,
}) {
  const [loading, setLoading] = useState(false);
  return (
    <Button
      type="primary"
      loading={loading}
      disabled={loading || count === 0}
      onClick={async () => {
        setLoading(true);
        try {
          await onConfirm();
        } finally {
          setLoading(false);
        }
      }}
    >
      {count > 0 ? `Ghi ${count} dự toán` : "Ghi dự toán"}
    </Button>
  );
});

/** Nhập Excel số mẫu dự toán năm — chỉ ghi số mẫu, không đổi vật tư / thiết bị */
const ImportForecastModal: React.FC<ImportForecastModalProps> = ({
  open,
  year,
  fileName,
  parsing,
  preview,
  onPickFile,
  onDownloadTemplate,
  onClose,
  onConfirm,
}) => {
  const lines = preview ? [...preview.lines].sort((a, b) => ORDER[a.status] - ORDER[b.status] || a.line - b.line) : [];
  const counts = preview?.counts;
  const blocked = Boolean(preview?.fileError) || (counts?.error ?? 0) > 0;
  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={`Nhập Excel dự toán mẫu năm ${year}`}
      width={960}
      centered
      destroyOnHidden
      footer={[
        <Button key="close" onClick={onClose}>
          Hủy
        </Button>,
        <ConfirmImportButton key="ok" count={blocked ? 0 : counts?.changed ?? 0} onConfirm={onConfirm} />,
      ]}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 13, color: "#595959" }}>
          Dùng file <strong>Xuất Excel</strong> (hoặc file mẫu) của năm {year}, điền cột{" "}
          <strong>“Số mẫu năm {year}”</strong>. Dịch vụ khớp theo <strong>Mã dịch vụ</strong>, không có mã thì theo Nền mẫu · Chỉ
          tiêu · Phương pháp. Ô trống được bỏ qua; nhập Excel không xóa dự toán và giữ nguyên vật tư, thiết bị đã khai báo.
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Upload
            accept=".xlsx,.xls"
            showUploadList={false}
            beforeUpload={(file) => {
              onPickFile(file);
              return false;
            }}
          >
            <Button icon={<UploadOutlined />} loading={parsing}>
              Chọn file Excel
            </Button>
          </Upload>
          <span className="bnc-ellipsis" style={{ fontSize: 13, color: fileName ? "#262626" : "#8c8c8c", flex: 1 }} title={fileName}>
            {fileName || "Chưa chọn file"}
          </span>
          <Button type="link" icon={<DownloadOutlined />} onClick={onDownloadTemplate}>
            Tải file mẫu năm {year}
          </Button>
        </div>
        {preview?.fileError && <Alert type="error" showIcon message={preview.fileError} />}
        {counts && !preview?.fileError && (
          <>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", fontSize: 13 }}>
              <Tag color="blue">Sẽ ghi: {counts.changed}</Tag>
              <Tag>Không đổi: {counts.same}</Tag>
              <Tag>Bỏ qua: {counts.skip}</Tag>
              <Tag color={counts.error ? "red" : "default"}>Lỗi: {counts.error}</Tag>
            </div>
            {counts.error > 0 && (
              <Alert type="warning" showIcon message={`Còn ${counts.error} dòng lỗi — sửa file rồi chọn lại để nhập.`} />
            )}
            <Table<ImportLineView>
              rowKey="line"
              size="small"
              columns={columns}
              dataSource={lines}
              pagination={false}
              scroll={{ y: 340 }}
            />
          </>
        )}
      </div>
    </Modal>
  );
};

export default ImportForecastModal;
