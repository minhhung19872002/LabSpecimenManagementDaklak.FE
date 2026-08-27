import React from "react";
import { Spin, Button } from "antd";
import { HistoryOutlined } from "@ant-design/icons";
import DOMPurify from "dompurify";
import { ProductDetailDto } from "../../../services/productService";
import { IndicatorName } from "../../../components/common";

export interface ProductInfoPanelProps {
  detail: ProductDetailDto | null;
  loading?: boolean;
  onOpenLotHistory?: () => void;
}

const ProductInfoPanel: React.FC<ProductInfoPanelProps> = ({ detail, loading, onOpenLotHistory }) => {
  return (
    <div className="info-panel">
      <Spin spinning={!!loading}>
        {detail && (
          <>
            <div className="info-panel__name">
              {detail.formattedName ? (
                <IndicatorName name={detail.name} formattedName={detail.formattedName} />
              ) : (
                detail.name
              )}
            </div>
            <div className="info-panel__code">
              Mã: {detail.identificationCode || "—"}
            </div>

            <div className="info-panel__kv-box">
              <div className="info-panel__kv-row">
                <span className="info-panel__kv-label">CAS</span>
                <span className="info-panel__kv-value">{detail.casNumber || "—"}</span>
              </div>
              <div className="info-panel__kv-row">
                <span className="info-panel__kv-label">Mã nhận dạng</span>
                <span className="info-panel__kv-value">{detail.identificationCode || "—"}</span>
              </div>
            </div>

            <div className="info-panel__detail-box">
              <div className="info-panel__detail-item">
                <div className="info-panel__detail-label">Điều kiện bảo quản</div>
                <div className="info-panel__detail-value">
                  {detail.formattedStorageConditions ? (
                    <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(detail.formattedStorageConditions) }} />
                  ) : (
                    detail.storageConditions || "—"
                  )}
                </div>
              </div>
              <div className="info-panel__detail-item">
                <div className="info-panel__detail-label">Cấu hình kỹ thuật</div>
                <div className="info-panel__detail-value">
                  {detail.mainTechnicalSpecs || "—"}
                </div>
              </div>
            </div>

            {onOpenLotHistory && (
              <div style={{ marginTop: 12 }}>
                <Button
                  icon={<HistoryOutlined />}
                  size="small"
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
