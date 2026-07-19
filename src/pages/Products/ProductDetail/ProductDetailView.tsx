import React from "react";
import { Button, Row, Col, Card } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  ProductDetailDto,
  ProductImportHistoryDto,
  ProductTypeLabels,
} from "../../../services/productService";
import ProductInfoPanel from "./ProductInfoPanel";
import ImportHistoryToolbar from "./ImportHistoryToolbar";
import ImportHistoryTable from "./ImportHistoryTable";
import "../../../styles/ListCard.css";

type DateRange = [dayjs.Dayjs | null, dayjs.Dayjs | null] | null;

export interface ProductDetailViewProps {
  detail: ProductDetailDto | null;
  detailLoading: boolean;
  warehouseName?: string;
  historyItems: ProductImportHistoryDto[];
  historyTotal: number;
  historyLoading: boolean;
  historyPage: number;
  historyPageSize: number;
  dateRange: DateRange;
  onDateRangeChange: (dates: DateRange) => void;
  onHistoryPageChange: (page: number, pageSize: number) => void;
  onReceiptClick: (receiptId: string) => void;
  onBack: () => void;
}

const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  detail,
  detailLoading,
  warehouseName,
  historyItems,
  historyTotal,
  historyLoading,
  historyPage,
  historyPageSize,
  dateRange,
  onDateRangeChange,
  onHistoryPageChange,
  onReceiptClick,
  onBack,
}) => {
  const typeLabel = detail ? ProductTypeLabels[detail.productType] || "" : "";
  const pageTitle = warehouseName
    ? `${warehouseName} - Chi tiết ${typeLabel.toLowerCase()}`
    : `Chi tiết ${typeLabel.toLowerCase()}`;

  return (
    <div style={{ padding: "0 12px" }}>
      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <Button icon={<ArrowLeftOutlined />} shape="circle" onClick={onBack} />
        <span style={{ fontWeight: 500, fontSize: 16 }}>{pageTitle}</span>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={8}>
          <ProductInfoPanel detail={detail} loading={detailLoading} />
        </Col>
        <Col xs={24} md={16}>
          <Card
            className="list-card"
            title="Lịch sử nhập kho"
            extra={
              <ImportHistoryToolbar
                dateRange={dateRange}
                onDateRangeChange={onDateRangeChange}
              />
            }
          >
            <ImportHistoryTable
              items={historyItems}
              total={historyTotal}
              loading={historyLoading}
              page={historyPage}
              pageSize={historyPageSize}
              onPageChange={onHistoryPageChange}
              onReceiptClick={onReceiptClick}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProductDetailView;
