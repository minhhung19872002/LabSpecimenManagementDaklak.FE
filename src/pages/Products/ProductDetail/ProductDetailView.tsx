import React from "react";
import { Row, Col, Card, Tabs } from "antd";
import dayjs from "dayjs";
import {
  ProductDetailDto,
  ProductImportHistoryDto,
} from "../../../services/productService";
import ProductInfoPanel from "./ProductInfoPanel";
import ImportHistoryToolbar from "./ImportHistoryToolbar";
import ImportHistoryTable from "./ImportHistoryTable";
import UsageHistoryTab from "./UsageHistoryTab";

type DateRange = [dayjs.Dayjs | null, dayjs.Dayjs | null] | null;

export interface ProductDetailViewProps {
  productId: string;
  detail: ProductDetailDto | null;
  detailLoading: boolean;
  pageTitle: string;
  historyItems: ProductImportHistoryDto[];
  historyTotal: number;
  historyLoading: boolean;
  historyPage: number;
  historyPageSize: number;
  dateRange: DateRange;
  onDateRangeChange: (dates: DateRange) => void;
  onHistoryPageChange: (page: number, pageSize: number) => void;
  onReceiptClick: (receiptId: string) => void;
}

const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  productId,
  detail,
  detailLoading,
  pageTitle,
  historyItems,
  historyTotal,
  historyLoading,
  historyPage,
  historyPageSize,
  dateRange,
  onDateRangeChange,
  onHistoryPageChange,
  onReceiptClick,
}) => {
  const tabItems = [
    {
      key: "usage-history",
      label: "Lịch sử sử dụng",
      children: <UsageHistoryTab productId={productId} />,
    },
    {
      key: "import-history",
      label: "Lịch sử nhập hàng",
      children: (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            <ImportHistoryToolbar
              dateRange={dateRange}
              onDateRangeChange={onDateRangeChange}
            />
          </div>
          <ImportHistoryTable
            items={historyItems}
            total={historyTotal}
            loading={historyLoading}
            page={historyPage}
            pageSize={historyPageSize}
            onPageChange={onHistoryPageChange}
            onReceiptClick={onReceiptClick}
          />
        </div>
      ),
    },
  ];

  return (
    <Card className="list-card" title={pageTitle}>
      <Row gutter={20}>
        <Col xs={24} md={8} lg={7} className="detail-left-col">
          <ProductInfoPanel detail={detail} loading={detailLoading} />
        </Col>
        <Col xs={24} md={16} lg={17}>
          <Tabs defaultActiveKey="usage-history" items={tabItems} />
        </Col>
      </Row>
    </Card>
  );
};

export default ProductDetailView;
