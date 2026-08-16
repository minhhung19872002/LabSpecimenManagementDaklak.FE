import React from "react";
import { Button, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { ProductMaterialReceiptHistoryDto, StockByUnitDto } from "../../../services/productService";
import { formatStockDisplay } from "../../MaterialReceipts/MaterialReceipt/utils";

const { Link } = Typography;

interface MaterialReceiptHistoryTableProps {
  items: ProductMaterialReceiptHistoryDto[];
  total: number;
  loading: boolean;
  page: number;
  pageSize: number;
  warehouseId?: string;
  onPageChange: (page: number, pageSize: number) => void;
  onReceiptClick: (receiptId: string) => void;
  onBarcodeListClick: (barcodes: string[]) => void;
}

const displayDate = (value?: string) => value ? dayjs(value).format("DD/MM/YYYY") : "—";
const displayText = (value?: string) => value || "—";

const renderStockByUnits = (
  byUnits: StockByUnitDto[] | undefined,
  fallbackQty: number | null | undefined,
  record: ProductMaterialReceiptHistoryDto,
) => {
  if (byUnits && byUnits.length >= 2) {
    return (
      <div>
        {byUnits.map((entry, i) => {
          const unit = entry.packagingUnitName || "";
          const intPart = Math.floor(entry.quantity);
          const decPart = entry.quantity - intPart;
          if (decPart === 0 || !entry.volumePerUnit || !entry.volumeUnitName) {
            return <div key={i}>{`${entry.quantity} ${unit}`.trim()}</div>;
          }
          const vol = Math.round(decPart * entry.volumePerUnit);
          return <div key={i}>{`${intPart} ${unit} - ${vol} ${entry.volumeUnitName}`}</div>;
        })}
      </div>
    );
  }
  return formatStockDisplay(
    fallbackQty ?? undefined,
    record.storageUnitName,
    record.consumableUnitName,
    record.volumePerUnit,
  );
};

const MaterialReceiptHistoryTable: React.FC<MaterialReceiptHistoryTableProps> = ({
  items,
  total,
  loading,
  page,
  pageSize,
  warehouseId,
  onPageChange,
  onReceiptClick,
  onBarcodeListClick,
}) => {
  const columns: ColumnsType<ProductMaterialReceiptHistoryDto> = [
    {
      title: "Phiếu nhận vật tư",
      dataIndex: "receiptCode",
      width: 160,
      render: (code: string, record) => (
        <Link onClick={() => onReceiptClick(record.materialReceiptId)}>{code}</Link>
      ),
    },
    {
      title: "Ngày nhận",
      dataIndex: "receiptDate",
      width: 115,
      render: displayDate,
    },
    {
      title: "Số lượng nhận",
      width: 135,
      render: (_, record) => `${record.receivedQuantity.toLocaleString("vi-VN")} ${record.storageUnitName || record.unitName || ""}`.trim(),
    },
    {
      title: "Hạn sử dụng",
      dataIndex: "lotExpiryDate",
      width: 115,
      render: displayDate,
    },
    {
      title: "Hãng sản xuất",
      dataIndex: "manufacturerName",
      width: 150,
      ellipsis: true,
      render: displayText,
    },
    {
      title: "Barcode",
      dataIndex: "barcodes",
      width: 210,
      render: (barcodes: string[]) => {
        if (!barcodes?.length) return "—";
        if (barcodes.length === 1) return barcodes[0];
        return <Button type="link" size="small" onClick={() => onBarcodeListClick(barcodes)}>{barcodes.length} barcode</Button>;
      },
    },
    {
      title: "Kho liên quan",
      width: 150,
      ellipsis: true,
      render: (_, record) => {
        if (warehouseId && record.sourceWarehouseId && record.sourceWarehouseId !== record.receivingWarehouseId) {
          const name = warehouseId === record.receivingWarehouseId
            ? record.sourceWarehouseName
            : record.receivingWarehouseName;
          return name || "—";
        }
        return record.receivingWarehouseName || "—";
      },
    },
    {
      title: "Tồn trước nhập",
      width: 155,
      render: (_, record) => renderStockByUnits(
        record.stockBeforeByUnits,
        record.stockBeforeBaseQuantity,
        record,
      ),
    },
    {
      title: "Tồn sau nhập",
      width: 155,
      render: (_, record) => renderStockByUnits(
        record.stockAfterByUnits,
        record.stockAfterBaseQuantity,
        record,
      ),
    },
  ];

  return (
    <Table<ProductMaterialReceiptHistoryDto>
      columns={columns}
      dataSource={items}
      rowKey={(record, index) => `${record.materialReceiptId}-${record.receivingWarehouseId}-${record.manufacturerId || "none"}-${record.lotNumber || "none"}-${index}`}
      loading={loading}
      size="small"
      scroll={{ x: 1150 }}
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: true,
        pageSizeOptions: ["10", "20", "50"],
        showTotal: (count, range) => `Hiển thị ${range[0]}-${range[1]}/${count}`,
        onChange: onPageChange,
      }}
    />
  );
};

export default MaterialReceiptHistoryTable;
