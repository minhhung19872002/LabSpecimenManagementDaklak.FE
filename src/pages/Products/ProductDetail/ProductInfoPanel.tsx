import React from "react";
import { Row, Col, Spin, Button } from "antd";
import { HistoryOutlined } from "@ant-design/icons";
import DOMPurify from "dompurify";
import { ProductDetailDto } from "../../../services/productService";
import { IndicatorName } from "../../../components/common";

export interface ProductInfoPanelProps {
  detail: ProductDetailDto | null;
  loading?: boolean;
  onOpenLotHistory?: () => void;
}

const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="detail-item">
    <span className="detail-item-label">{label}</span>
    <span className="detail-item-value">
      {value != null && value !== "" ? value : "-"}
    </span>
  </div>
);

const ProductInfoPanel: React.FC<ProductInfoPanelProps> = ({ detail, loading, onOpenLotHistory }) => {
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
                    if (detail.stockByUnits && detail.stockByUnits.length >= 2) {
                      return (
                        <div>
                          {detail.stockByUnits.map((entry, i) => {
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

            <Row gutter={16}>
              <Col span={12}>
                <DetailItem
                  label="Tiêu hao trong kỳ"
                  value={(() => {
                    const vol = detail.theoreticalConsumption;
                    if (!vol || !detail.volumePerUnit || !detail.volumeUnitName) return null;
                    const baseQty = vol / detail.volumePerUnit;
                    const intPart = Math.floor(baseQty);
                    const decPart = baseQty - intPart;
                    if (decPart === 0) {
                      return `${intPart.toLocaleString("vi-VN")} ${qtyUnit}`;
                    }
                    const remainingVol = Math.round(decPart * detail.volumePerUnit);
                    return `${intPart.toLocaleString("vi-VN")} ${qtyUnit} - ${remainingVol.toLocaleString("vi-VN")} ${detail.volumeUnitName}`;
                  })()}
                />
              </Col>
              <Col span={12}>
                <DetailItem
                  label="Tồn kho cuối kỳ (Dự tính)"
                  value={(() => {
                    const expected = detail.expectedStockConsumable;

                    if (detail.stockByUnits && detail.stockByUnits.length >= 2) {
                      const totalVolume = detail.stockByUnits.reduce(
                        (s, e) => s + e.quantity * (e.volumePerUnit || 0), 0,
                      );
                      const firstVolumeUnit = detail.stockByUnits.find(e => e.volumeUnitName)?.volumeUnitName || "";

                      if (expected < 0) {
                        return <span style={{ color: "#ff4d4f" }}>{`${expected.toLocaleString("vi-VN")} ${firstVolumeUnit}`}</span>;
                      }

                      if (totalVolume > 0) {
                        return (
                          <div>
                            {detail.stockByUnits.map((entry, i) => {
                              const entryVol = entry.quantity * (entry.volumePerUnit || 0);
                              if (entryVol <= 0 || !entry.volumePerUnit) return null;
                              const unitExpectedVol = expected * (entryVol / totalVolume);
                              const unitExpectedBase = unitExpectedVol / entry.volumePerUnit;
                              const unit = entry.packagingUnitName || "";
                              const intPart = Math.floor(unitExpectedBase);
                              const decPart = unitExpectedBase - intPart;
                              if (decPart === 0) {
                                return <div key={i}>{`${unitExpectedBase.toLocaleString("vi-VN")} ${unit}`.trim()}</div>;
                              }
                              const vol = Math.round(decPart * entry.volumePerUnit);
                              return <div key={i}>{`${intPart.toLocaleString("vi-VN")} ${unit} - ${vol.toLocaleString("vi-VN")} ${entry.volumeUnitName || ""}`}</div>;
                            })}
                            {firstVolumeUnit && (
                              <div style={{ fontSize: 12, color: "#888" }}>
                                {`${expected.toLocaleString("vi-VN")} ${firstVolumeUnit}`}
                              </div>
                            )}
                          </div>
                        );
                      }
                    }

                    if (!detail.volumePerUnit || !detail.volumeUnitName) return null;
                    if (expected < 0) {
                      return <span style={{ color: "#ff4d4f" }}>{`${expected.toLocaleString("vi-VN")} ${detail.volumeUnitName}`}</span>;
                    }
                    const baseQty = expected / detail.volumePerUnit;
                    const intPart = Math.floor(baseQty);
                    const decPart = baseQty - intPart;
                    if (decPart === 0) {
                      return `${intPart.toLocaleString("vi-VN")} ${qtyUnit}`;
                    }
                    const remainingVol = Math.round(decPart * detail.volumePerUnit);
                    return `${intPart.toLocaleString("vi-VN")} ${qtyUnit} - ${remainingVol.toLocaleString("vi-VN")} ${detail.volumeUnitName}`;
                  })()}
                />
              </Col>
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

            {onOpenLotHistory && (
              <div style={{ marginTop: 16 }}>
                <Button
                  icon={<HistoryOutlined />}
                  onClick={onOpenLotHistory}
                >
                  Xem lịch sử
                </Button>
              </div>
            )}
          </>
        )}
      </Spin>
    </div>
  );
};

export default ProductInfoPanel;
