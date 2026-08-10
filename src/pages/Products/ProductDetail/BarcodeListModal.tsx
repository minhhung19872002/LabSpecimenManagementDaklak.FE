import React from "react";
import { List, Modal, Typography } from "antd";
import BarcodeValue from "./BarcodeValue";

interface BarcodeListModalProps {
  open: boolean;
  barcodes: string[];
  onClose: () => void;
}

const BarcodeListModal: React.FC<BarcodeListModalProps> = ({ open, barcodes, onClose }) => (
  <Modal title="Danh sách barcode" open={open} onCancel={onClose} footer={null} width={720} centered styles={{ body: { maxHeight: "70vh", overflowY: "auto" } }}>
    <List
      bordered
      size="small"
      dataSource={barcodes}
      locale={{ emptyText: "Không có barcode" }}
      renderItem={(barcode, index) => (
        <List.Item>
          <div style={{ width: "100%" }}>
            <Typography.Text type="secondary">Barcode {index + 1}</Typography.Text>
            <BarcodeValue value={barcode} />
          </div>
        </List.Item>
      )}
    />
  </Modal>
);

export default BarcodeListModal;
