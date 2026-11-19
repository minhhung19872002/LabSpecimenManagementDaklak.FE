import React from "react";
import { Select } from "antd";
import { SearchOutlined } from "../../../../components/common/Icon";
import type { BatchNormProductOptionDto } from "../../../../services/serviceCatalogService";
import { foldText } from "../../ServiceCatalog/ServiceCatalog/utils";
import { productNameOf } from "./utils";

export interface ProductAddSelectProps {
  ariaLabel: string;
  placeholder: string;
  /** Đã lọc bỏ mục đã thêm + theo loại */
  products: BatchNormProductOptionDto[];
  typeNameOf: (p: BatchNormProductOptionDto) => string;
  typeStyleOf: (p: BatchNormProductOptionDto) => React.CSSProperties;
  /** Cột phụ bên phải (vd ĐV mặc định) */
  extraOf?: (p: BatchNormProductOptionDto) => string;
  emptyText: string;
  onAdd: (productId: string) => void;
}

interface AddOption {
  value: string;
  label: string;
  search: string;
  product: BatchNormProductOptionDto;
}

/** Ô "Thêm vật tư/thiết bị…": chọn 1 mục → thêm dòng, ô tự trống lại */
const ProductAddSelect: React.FC<ProductAddSelectProps> = ({
  ariaLabel,
  placeholder,
  products,
  typeNameOf,
  typeStyleOf,
  extraOf,
  emptyText,
  onAdd,
}) => {
  const options: AddOption[] = products.map((p) => ({
    value: p.id,
    label: productNameOf(p),
    search: `${p.code} ${p.name ?? ""} ${typeNameOf(p)}`,
    product: p,
  }));
  return (
    <div className="bnc-addbox" onClick={(e) => e.stopPropagation()}>
      <Select<string, AddOption>
        aria-label={ariaLabel}
        value={null}
        options={options}
        placeholder={placeholder}
        prefix={<SearchOutlined style={{ color: "#8c8c8c" }} />}
        showSearch={{
          filterOption: (input, option) => foldText(option?.search).includes(foldText(input.trim())),
        }}
        popupMatchSelectWidth={460}
        placement="bottomRight"
        listHeight={320}
        style={{ width: "100%" }}
        notFoundContent={<span style={{ fontSize: 13, color: "#595959" }}>{emptyText}</span>}
        onChange={(id) => id && onAdd(id)}
        optionRender={(o) => {
          const p = o.data.product;
          return (
            <span style={{ display: "grid", gridTemplateColumns: "116px minmax(0, 1fr) auto", gap: 8, alignItems: "center", fontSize: 13 }}>
              <span style={{ minWidth: 0 }}>
                <span style={typeStyleOf(p)}>{typeNameOf(p)}</span>
              </span>
              <span style={{ minWidth: 0 }}>
                <span className="bnc-ellipsis" style={{ display: "block", color: "#141414" }} title={productNameOf(p)}>
                  {productNameOf(p)}
                </span>
                <span className="bnc-code">{p.code}</span>
              </span>
              <span style={{ fontSize: 12, color: "#8c8c8c" }}>{extraOf?.(p) ?? ""}</span>
            </span>
          );
        }}
      />
    </div>
  );
};

export default ProductAddSelect;
