import React from "react";
import { List, Modal, Typography } from "antd";
import BarcodeValue from "./BarcodeValue";

interface BarcodeListModalProps {
  open: boolean;
  barcodes: string[];
  onClose: () => void;
}

const printStyle = `
@media print {
  .barcode-list-modal .barcode-value-wrapper svg {
    max-width: 280px !important;
  }
}
`;

const BarcodeListModal: React.FC<BarcodeListModalProps> = ({ open, barcodes, onClose }) => (
  <Modal
    title="Danh sách barcode"
    open={open}
    onCancel={onClose}
    footer={null}
    width={900}
    centered
    className="barcode-list-modal"
    styles={{ body: { maxHeight: "70vh", overflowY: "auto" } }}
  >
    <style>{printStyle}</style>
    <List
      bordered
      size="small"
      dataSource={barcodes}
      locale={{ emptyText: "Không có barcode" }}
      renderItem={(barcode, index) => (
        <List.Item>
          <div style={{ width: "100%" }}>
            <Typography.Text type="secondary" style={{ fontSize: 14, marginBottom: 4, display: "block" }}>
              Barcode {index + 1}
            </Typography.Text>
            <div style={{ textAlign: "center" }}>
              <BarcodeValue value={barcode} />
            </div>
          </div>
        </List.Item>
      )}
    />
  </Modal>
);

export default BarcodeListModal;
