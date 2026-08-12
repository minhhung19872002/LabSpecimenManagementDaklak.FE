import React, { useMemo } from "react";
import { Modal, Collapse, Tag, Spin, Empty, Space } from "antd";
import dayjs from "dayjs";
import {
  BarcodeLotGroupDto,
  InventoryBarcodeStatus,
} from "../../../services/productService";
import BarcodeValue from "./BarcodeValue";

export interface BarcodeLotHistoryModalProps {
  open: boolean;
  loading: boolean;
  groups: BarcodeLotGroupDto[];
  onClose: () => void;
}

const STATUS_CONFIG: Record<
  InventoryBarcodeStatus,
  { label: string; color: string }
> = {
  [InventoryBarcodeStatus.InUse]: { label: "Đang sử dụng", color: "processing" },
  [InventoryBarcodeStatus.UsedUp]: { label: "Sử dụng hết", color: "default" },
  [InventoryBarcodeStatus.NotUsed]: { label: "Chưa sử dụng", color: "warning" },
  [InventoryBarcodeStatus.Expired]: { label: "Hết hạn", color: "error" },
};

const BarcodeLotHistoryModal: React.FC<BarcodeLotHistoryModalProps> = ({
  open,
  loading,
  groups,
  onClose,
}) => {
  const autoExpandKey = useMemo(
    () => groups.length === 1 ? [groups[0].warehouseImportReceiptItemId] : [],
    [groups]
  );

  const collapseItems = groups.map((group) => {
    const lotLabel = group.lotNumber || "—";
    const expiryLabel = group.lotExpiryDate
      ? dayjs(group.lotExpiryDate).format("DD/MM/YYYY")
      : "—";

    return {
      key: group.warehouseImportReceiptItemId,
      label: (
        <Space>
          <span>{lotLabel} - {expiryLabel}</span>
          <Tag style={{ color: "#fff", borderColor: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.2)", borderRadius: 18, padding: "2px 8px" }}>{group.barcodes.length} barcode</Tag>
        </Space>
      ),
      children: (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>Mã bar code</th>
              <th style={thStyle}>Bar code</th>
              <th style={thStyle}>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {group.barcodes.map((barcode) => {
              const cfg = STATUS_CONFIG[barcode.status] ?? { label: String(barcode.status), color: "default" };
              return (
                <tr key={barcode.code}>
                  <td style={tdStyle}>{barcode.code}</td>
                  <td style={tdStyle}>
                    <BarcodeValue value={barcode.code} displayValue={false} />
                  </td>
                  <td style={tdStyle}>
                    <Tag color={cfg.color}>{cfg.label}</Tag>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ),
    };
  });

  return (
    <Modal
      title="Lịch sử Code/Lot"
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
      centered
      destroyOnClose
      styles={{ body: { minHeight: 300, maxHeight: "90vh", overflowY: "auto" } }}
    >
      <Spin spinning={loading}>
        {!loading && groups.length === 0 ? (
          <Empty description="Không có dữ liệu barcode" />
        ) : !loading ? (
          <Collapse
            className="barcode-lot-collapse"
            items={collapseItems}
            defaultActiveKey={autoExpandKey}
          />
        ) : null}
      </Spin>
    </Modal>
  );
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "8px 12px",
  borderBottom: "1px solid #f0f0f0",
  fontWeight: 500,
  fontSize: 13,
};

const tdStyle: React.CSSProperties = {
  padding: "6px 12px",
  borderBottom: "1px solid #f0f0f0",
  fontSize: 13,
};

export default BarcodeLotHistoryModal;
