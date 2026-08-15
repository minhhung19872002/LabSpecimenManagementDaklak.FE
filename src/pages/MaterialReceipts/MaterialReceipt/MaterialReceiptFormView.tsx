import React from "react";
import { Card, Button, Space, Divider, Form, Select } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { WarehouseDto } from "../../../services/masterDataService";
import MaterialReceiptHeader, {
  type MaterialReceiptHeaderProps,
} from "./MaterialReceiptHeader";
import MaterialReceiptItemTable, {
  type MaterialReceiptItemTableProps,
} from "./MaterialReceiptItemTable";
import "../../../styles/ListCard.css";

const PRODUCT_TYPE_OPTIONS = [
  { value: "all", label: "Tất cả" },
  { value: "0", label: "Hóa chất" },
  { value: "1", label: "Vật tư tiêu hao" },
  { value: "2", label: "Chất chuẩn" },
  { value: "3", label: "Dung môi" },
];

export interface MaterialReceiptFormViewProps
  extends MaterialReceiptHeaderProps,
    Omit<MaterialReceiptItemTableProps, "warehouses"> {
  title: string;
  saving: boolean;
  confirming: boolean;
  warehouses: WarehouseDto[];
  productTypeFilter: string;
  productOptions: { value: string; label: string; lotNumber?: string }[];
  itemCount: number;
  children?: React.ReactNode;
  onProductTypeChange: (value: string) => void;
  onAddProduct: (productId: string) => void;
  onOpenProductModal: () => void;
  onSaveDraft: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const MaterialReceiptFormView: React.FC<MaterialReceiptFormViewProps> = ({
  title,
  saving,
  confirming,
  isReadonly,
  children,
  // Header props
  code,
  receiverName,
  receiptDate,
  codeError,
  onCodeChange,
  onReceiptDateChange,
  // Table props
  items,
  warehouses,
  onItemChange,
  onWarehouseChange,
  onDeleteItem,
  itemErrors,
  // Picker props
  productTypeFilter,
  productOptions,
  itemCount,
  onProductTypeChange,
  onAddProduct,
  onOpenProductModal,
  // Actions
  onSaveDraft,
  onConfirm,
  onCancel,
}) => {
  return (
    <div>
      <Card
        className="list-card"
        title={<Space>{title}</Space>}
      >
        <Form layout="vertical" style={{ padding: "0 16px" }}>
          <MaterialReceiptHeader
            code={code}
            receiverName={receiverName}
            receiptDate={receiptDate}
            isReadonly={isReadonly}
            codeError={codeError}
            onCodeChange={onCodeChange}
            onReceiptDateChange={onReceiptDateChange}
          />
        </Form>

        <Divider style={{ margin: "8px 0 16px" }} />

        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ marginBottom: 12 }}>
            <strong
              style={{ fontSize: 15, display: "block", marginBottom: 8 }}
            >
              THÔNG TIN VẬT TƯ
            </strong>
            {!isReadonly && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Select
                  value={productTypeFilter}
                  onChange={onProductTypeChange}
                  options={PRODUCT_TYPE_OPTIONS}
                  style={{ width: 200 }}
                  placeholder="Tất cả"
                />
                <Space.Compact style={{ flex: 1, maxWidth: 420 }}>
                  <Select
                    key={`product-select-${itemCount}`}
                    placeholder="Tìm hàng hóa theo mã hoặc theo tên"
                    options={productOptions}
                    onSelect={onAddProduct}
                    style={{ width: "100%" }}
                    showSearch
                    filterOption={(input, option) => {
                      const searchText = input.toLowerCase();
                      const label = (option?.label as string)?.toLowerCase() ?? "";
                      const lot = (option as any)?.lotNumber?.toLowerCase() ?? "";
                      return label.includes(searchText) || lot.includes(searchText);
                    }}
                    optionRender={(option) => (
                      <div>
                        <div>{option.label}</div>
                        {(option.data as any)?.lotNumber && (
                          <div style={{ fontSize: 12, color: "#888" }}>
                            Số lô: {(option.data as any).lotNumber}
                          </div>
                        )}
                      </div>
                    )}
                  />
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={onOpenProductModal}
                    title="Tạo hàng hóa mới"
                  />
                </Space.Compact>
              </div>
            )}
          </div>

          <MaterialReceiptItemTable
            items={items}
            warehouses={warehouses}
            isReadonly={isReadonly}
            onItemChange={onItemChange}
            onWarehouseChange={onWarehouseChange}
            onDeleteItem={onDeleteItem}
            itemErrors={itemErrors}
          />
        </div>
      </Card>

      {!isReadonly && (
        <Card
          style={{
            marginTop: 16,
            textAlign: "right",
            boxShadow: "0px 2px 8px 0px rgba(0, 0, 0, 0.08)",
          }}
        >
          <Space>
            <Button onClick={onCancel}>Hủy</Button>
            <Button onClick={onSaveDraft} loading={saving}>
              Lưu nháp
            </Button>
            <Button type="primary" onClick={onConfirm} loading={confirming}>
              Tạo phiếu nhận
            </Button>
          </Space>
        </Card>
      )}

      {children}
    </div>
  );
};

export default MaterialReceiptFormView;
