import React, { useState, useEffect, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Button, message } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  productService,
  ProductDetailDto,
  ProductImportHistoryDto,
  ProductTypeLabels,
} from "../../services/productService";
import { PATH_ROUTES } from "../../constants/routes";
import { getApiErrorMessage } from "../../utils/errorHandler";
import ProductDetailView from "./ProductDetail/ProductDetailView";
import "../../styles/ListCard.css";
import "./ProductDetail.css";

type DateRange = [dayjs.Dayjs | null, dayjs.Dayjs | null] | null;

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { warehouseId?: string; warehouseName?: string } | null;
  const warehouseId = state?.warehouseId;
  const warehouseName = state?.warehouseName;

  const [detail, setDetail] = useState<ProductDetailDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [historyItems, setHistoryItems] = useState<ProductImportHistoryDto[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(10);
  const [dateRange, setDateRange] = useState<DateRange>(null);

  const loadDetail = useCallback(async () => {
    if (!id) return;
    setDetailLoading(true);
    try {
      const data = await productService.getDetail(id, warehouseId);
      setDetail(data);
    } catch (error) {
      message.error(getApiErrorMessage(error, "Không thể tải thông tin vật tư"));
    } finally {
      setDetailLoading(false);
    }
  }, [id, warehouseId]);

  const loadHistory = useCallback(async () => {
    if (!id) return;
    setHistoryLoading(true);
    try {
      const data = await productService.getImportHistory(id, {
        page: historyPage,
        limit: historyPageSize,
        sorting: "lotExpiryDate asc",
        fromDate: dateRange?.[0]?.format("YYYY-MM-DD"),
        toDate: dateRange?.[1]?.format("YYYY-MM-DD"),
        warehouseId,
      });
      setHistoryItems(data.items);
      setHistoryTotal(data.totalCount);
    } catch (error) {
      message.error(getApiErrorMessage(error, "Không thể tải lịch sử nhập kho"));
    } finally {
      setHistoryLoading(false);
    }
  }, [id, historyPage, historyPageSize, dateRange, warehouseId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleDateRangeChange = useCallback((dates: DateRange) => {
    setDateRange(dates);
    setHistoryPage(1);
  }, []);

  const handleHistoryPageChange = useCallback((page: number, pageSize: number) => {
    setHistoryPage(page);
    setHistoryPageSize(pageSize);
  }, []);

  const handleReceiptClick = useCallback(
    (receiptId: string) => {
      window.open(PATH_ROUTES.warehouseImports.detail(receiptId), "_blank");
    },
    []
  );

  const typeLabel = detail ? ProductTypeLabels[detail.productType] || "" : "";
  const pageTitle = warehouseName
    ? `${warehouseName} - Chi tiết ${typeLabel.toLowerCase()}`
    : `Chi tiết ${typeLabel.toLowerCase()}`;

  return (
    <div className="product-detail">
      <div className="back-button-bar">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(PATH_ROUTES.products.index)}>
          Quay lại
        </Button>
      </div>

      <ProductDetailView
        productId={id!}
        detail={detail}
        detailLoading={detailLoading}
        pageTitle={pageTitle}
        historyItems={historyItems}
        historyTotal={historyTotal}
        historyLoading={historyLoading}
        historyPage={historyPage}
        historyPageSize={historyPageSize}
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        onHistoryPageChange={handleHistoryPageChange}
        onReceiptClick={handleReceiptClick}
      />
    </div>
  );
};

export default ProductDetailPage;
