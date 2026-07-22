import React from "react";
import { Card, Row, Col, Spin } from "antd";
import DOMPurify from "dompurify";
import { ProductDetailDto } from "../../../services/productService";
import { IndicatorName } from "../../../components/common";

export interface ProductInfoPanelProps {
  detail: ProductDetailDto | null;
  loading?: boolean;
}

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontWeight: 500, fontSize: 14, color: "rgba(0,0,0,0.85)", marginBottom: 4 }}>
    {children}
  </div>
);

const SectionValue: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 14, color: "rgba(0,0,0,0.65)", marginBottom: 16 }}>
    {children}
  </div>
);

const ProductInfoPanel: React.FC<ProductInfoPanelProps> = ({ detail, loading }) => {
  const qtyUnit = detail?.packagingUnitName || detail?.baseUnitName || "";

  return (
    <Card className="list-card" title="Thông tin chung">
      <Spin spinning={!!loading}>
        <div style={{ padding: "4px 24px 16px" }}>
          {detail && (
            <>
              <SectionLabel>Tên vật tư/ hóa chất</SectionLabel>
              <SectionValue>
                {detail.formattedName ? (
                  <IndicatorName name={detail.name} formattedName={detail.formattedName} />
                ) : (
                  detail.name || "-"
                )}
              </SectionValue>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <SectionLabel>Mã nhận dạng</SectionLabel>
                  <SectionValue>{detail.identificationCode || "-"}</SectionValue>
                </Col>
                <Col xs={24} sm={12}>
                  <SectionLabel>CAS</SectionLabel>
                  <SectionValue>{detail.casNumber || "-"}</SectionValue>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <SectionLabel>Số lượng tồn kho</SectionLabel>
                  <SectionValue>
                    {(detail.warehouseAvailableQuantity ?? 0).toLocaleString("vi-VN")} {qtyUnit}
                  </SectionValue>
                </Col>
                {detail.consumableImportedQuantity > 0 && detail.volumeUnitName && (
                  <Col xs={24} sm={12}>
                    <SectionLabel>Số lượng tồn kho (Đơn vị)</SectionLabel>
                    <SectionValue>
                      {detail.consumableImportedQuantity.toLocaleString("vi-VN")} {detail.volumeUnitName}
                    </SectionValue>
                  </Col>
                )}
              </Row>

              <SectionLabel>Điều kiện bảo quản</SectionLabel>
              <SectionValue>
                {detail.formattedStorageConditions ? (
                  <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(detail.formattedStorageConditions) }} />
                ) : (
                  detail.storageConditions || "-"
                )}
              </SectionValue>

              <SectionLabel>Cấu hình kỹ thuật</SectionLabel>
              <SectionValue>
                {detail.mainTechnicalSpecs || "-"}
              </SectionValue>
            </>
          )}
        </div>
      </Spin>
    </Card>
  );
};

export default ProductInfoPanel;
