import React, { useMemo } from "react";
import { Table, Select, Input, Button, Spin, Popconfirm } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { NumericFormat } from "react-number-format";
import type { ColumnsType } from "antd/es/table";
import type { WarehouseDto } from "../../../services/masterDataService";
import {
  formatExpiryDate,
  formatStockDisplay,
  isQuantityExceedingCentralStock,
  type MaterialReceiptLineItem,
} from "./utils";
import "./MaterialReceiptItemTable.css";

export interface MaterialReceiptItemTableProps {
  items: MaterialReceiptLineItem[];
  warehouses: WarehouseDto[];
  isReadonly: boolean;
  onItemChange: (key: string, field: string, value: any) => void;
  onWarehouseChange: (
    key: string,
    warehouseId: string,
    warehouseName: string,
  ) => void;
  onDeleteItem: (key: string) => void;
  itemErrors: Record<
    string,
    { quantity?: string; receivingWarehouseId?: string }
  >;
}

const isExceeded = (record: MaterialReceiptLineItem): boolean => {
  if (record.quantity == null || record.quantity <= 0) return false;
  return isQuantityExceedingCentralStock(record, record.quantity);
};

const MaterialReceiptItemTable: React.FC<MaterialReceiptItemTableProps> = ({
  items,
  warehouses,
  isReadonly,
  onItemChange,
  onWarehouseChange,
  onDeleteItem,
  itemErrors,
}) => {
  const exceededKeys = useMemo(
    () => new Set(items.filter(isExceeded).map((item) => item.key)),
    [items],
  );

  const columns: ColumnsType<MaterialReceiptLineItem> = [
    {
      title: "STT",
      width: 50,
      align: "center",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Mã nhận dạng",
      dataIndex: "identificationCode",
      width: 130,
      render: (val) => val || "—",
    },
    {
      title: "Số lô",
      dataIndex: "lotNumber",
      width: 110,
      render: (val) => val || "—",
    },
    {
      title: "Tên vật tư / hóa chất",
      dataIndex: "productName",
      width: 220,
      ellipsis: true,
    },
    {
      title: "Cấu hình kỹ thuật",
      dataIndex: "technicalSpec",
      width: 140,
      ellipsis: true,
      render: (val) => val || "—",
    },
    {
      title: "Hạn sử dụng",
      dataIndex: "nearestExpiryDate",
      width: 110,
      render: (val) => formatExpiryDate(val),
    },
    {
      title: "CAS",
      dataIndex: "casNumber",
      width: 100,
      render: (val) => val || "—",
    },
    {
      title: "Hãng sản xuất",
      dataIndex: "manufacturerName",
      width: 140,
      ellipsis: true,
      render: (val) => val || "—",
    },
    {
      title: "Đơn vị",
      dataIndex: "unitId",
      width: 170,
      render: (_, record) => {
        if (isReadonly) return record.unitName || "—";
        return (
          <Select
            value={record.unitId || undefined}
            onChange={(val) => {
              const unit = record.availableUnits.find((u) => u.unitId === val);
              const sku = record.skus.find(
                (item) =>
                  item.storageUnitId === val || item.consumableUnitId === val,
              );
              onItemChange(record.key, "unitId", val);
              onItemChange(record.key, "unitName", unit?.unitName || "");
              onItemChange(record.key, "skuId", sku?.skuId);
            }}
            style={{ width: "100%" }}
            placeholder="Chọn đơn vị"
            options={record.availableUnits
              .filter((u) => !u.isConsumable)
              .map((u) => ({
                value: u.unitId,
                label: u.unitName,
              }))}
          />
        );
      },
    },
    {
      title: (
        <span>
          Số lượng <span style={{ color: "#ff4d4f" }}>*</span>
        </span>
      ),
      dataIndex: "quantity",
      width: 130,
      render: (_, record) => {
        if (isReadonly) return record.quantity ?? "—";
        const exceeded = exceededKeys.has(record.key);
        const error = itemErrors[record.key]?.quantity;
        const hasError = !!error || exceeded;
        return (
          <>
            <NumericFormat
              value={record.quantity ?? ""}
              onValueChange={(values) =>
                onItemChange(record.key, "quantity", values.floatValue ?? null)
              }
              allowNegative={false}
              decimalScale={0}
              thousandSeparator="."
              decimalSeparator=","
              customInput={Input}
              status={hasError ? "error" : undefined}
              style={{
                width: "100%",
                backgroundColor: hasError ? "#fff1f0" : undefined,
                borderColor: hasError ? "#ff4d4f" : undefined,
              }}
              placeholder="Nhập SL"
            />
            {hasError && (
              <div style={{ color: "#ff4d4f", fontSize: 11, marginTop: 2 }}>
                {error ||
                  `Vượt tồn kho Trung tâm kiểm soát (${formatStockDisplay(
                    record.centralStockBaseQty,
                    record.storageUnitName,
                    record.consumableUnitName,
                    record.volumePerUnit,
                  )})`}
              </div>
            )}
          </>
        );
      },
    },
    {
      title: (
        <span>
          Kho nhận <span style={{ color: "#ff4d4f" }}>*</span>
        </span>
      ),
      dataIndex: "receivingWarehouseId",
      width: 180,
      render: (_, record) => {
        if (isReadonly) return record.receivingWarehouseName || "—";
        const error = itemErrors[record.key]?.receivingWarehouseId;
        return (
          <>
            <Select
              value={record.receivingWarehouseId || undefined}
              onChange={(val) => {
                const wh = warehouses.find((w) => w.id === val);
                onWarehouseChange(record.key, val, wh?.name || "");
              }}
              status={error ? "error" : undefined}
              style={{ width: "100%" }}
              placeholder="Chọn kho"
              options={warehouses.map((w) => ({
                value: w.id,
                label: w.name,
              }))}
            />
            {error && (
              <div style={{ color: "#ff4d4f", fontSize: 11 }}>{error}</div>
            )}
          </>
        );
      },
    },
    {
      title: "Tồn kho hiện tại",
      width: 160,
      render: (_, record) =>
        record.currentStockLoading ? (
          <Spin size="small" />
        ) : (
          formatStockDisplay(
            record.currentStockBaseQty,
            record.currentStockStorageUnitName,
            record.currentStockConsumableUnitName,
            record.currentStockVolumePerUnit,
          )
        ),
    },
  ];

  if (!isReadonly) {
    columns.push({
      title: "",
      width: 50,
      align: "center",
      render: (_, record) => (
        <Popconfirm
          title="Xóa vật tư"
          description={`Bạn có chắc muốn xóa "${record.productName}" khỏi phiếu?`}
          okText="Xóa"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
          onConfirm={() => onDeleteItem(record.key)}
        >
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
          />
        </Popconfirm>
      ),
    });
  }

  return (
    <Table
      columns={columns}
      dataSource={items}
      rowKey="key"
      rowClassName={(record) =>
        exceededKeys.has(record.key) ? "material-receipt-row-exceeded" : ""
      }
      pagination={false}
      scroll={{ x: 1650 }}
      size="small"
      bordered
      locale={{
        emptyText: "Chưa có vật tư. Chọn vật tư từ danh sách ở trên.",
      }}
    />
  );
};

export default MaterialReceiptItemTable;

