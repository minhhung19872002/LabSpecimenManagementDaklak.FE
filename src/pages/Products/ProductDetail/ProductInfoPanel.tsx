import React from "react";
import { Row, Col, Spin } from "antd";
import DOMPurify from "dompurify";
import { ProductDetailDto } from "../../../services/productService";
import { IndicatorName } from "../../../components/common";

export interface ProductInfoPanelProps {
  detail: ProductDetailDto | null;
  loading?: boolean;
}

const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="detail-item">
    <span className="detail-item-label">{label}</span>
    <span className="detail-item-value">
      {value != null && value !== "" ? value : "-"}
    </span>
  </div>
);

const ProductInfoPanel: React.FC<ProductInfoPanelProps> = ({ detail, loading }) => {
  const qtyUnit = detail?.packagingUnitName || detail?.baseUnitName || "";

  return (
    <div className="detail-section">
      <div className="detail-section-title">Thông tin chung</div>
      <Spin spinning={!!loading}>
        {detail && (
          <>
            <DetailItem
              label="Tên vật tư/ hóa chất"
              value={
                detail.formattedName ? (
                  <IndicatorName name={detail.name} formattedName={detail.formattedName} />
                ) : (
                  detail.name
                )
              }
            />

            <Row gutter={16}>
              <Col span={12}>
                <DetailItem label="Mã nhận dạng" value={detail.identificationCode} />
              </Col>
              <Col span={12}>
                <DetailItem label="CAS" value={detail.casNumber} />
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <DetailItem
                  label="Tồn kho đầu kỳ"
                  value={(() => {
                    const qty = detail.warehouseAvailableQuantity ?? 0;
                    const intPart = Math.floor(qty);
                    const decPart = qty - intPart;
                    if (decPart === 0 || !detail.volumePerUnit || !detail.volumeUnitName) {
                      return `${qty.toLocaleString("vi-VN")} ${qtyUnit}`;
                    }
                    const consumableAmount = Math.round(decPart * detail.volumePerUnit);
                    return `${intPart} ${qtyUnit} - ${consumableAmount} ${detail.volumeUnitName}`;
                  })()}
                />
              </Col>
              {detail.consumableImportedQuantity > 0 && detail.volumeUnitName && (
                <Col span={12}>
                  <DetailItem
                    label="Tồn kho đầu kỳ (số lượng)"
                    value={`${detail.consumableImportedQuantity.toLocaleString("vi-VN")} ${detail.volumeUnitName}`}
                  />
                </Col>
              )}
            </Row>

            <DetailItem
              label="Điều kiện bảo quản"
              value={
                detail.formattedStorageConditions ? (
                  <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(detail.formattedStorageConditions) }} />
                ) : (
                  detail.storageConditions
                )
              }
            />

            <DetailItem label="Cấu hình kỹ thuật" value={detail.mainTechnicalSpecs} />
          </>
        )}
      </Spin>
    </div>
  );
};

export default ProductInfoPanel;
