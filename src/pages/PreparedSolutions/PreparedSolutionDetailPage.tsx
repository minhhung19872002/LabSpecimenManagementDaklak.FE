import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { message } from "antd";
import {
  PreparedSolutionBatchDto,
  preparedSolutionService,
} from "../../services/preparedSolutionService";
import { PATH_ROUTES } from "../../constants/routes";
import PreparedSolutionDetailView from "./PreparedSolutionDetail/PreparedSolutionDetailView";

const PreparedSolutionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<PreparedSolutionBatchDto | null>(null);
  const [printBarcodeOpen, setPrintBarcodeOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await preparedSolutionService.getById(id);
      setItem(data);
    } catch {
      message.error("Không thể tải thông tin phiếu pha dung dịch");
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleBack = useCallback(() => {
    const stateData = location.state as
      | { from?: string; supplierId?: string; productDetailPath?: string; productDetailState?: unknown }
      | null;
    if (stateData?.from === "productDetail" && stateData.productDetailPath) {
      navigate(stateData.productDetailPath, { state: stateData.productDetailState });
    } else if (stateData?.from === "supplier" && stateData.supplierId) {
      navigate(`/suppliers-management/${stateData.supplierId}`);
    } else {
      navigate(PATH_ROUTES.preparedSolutions.index);
    }
  }, [location.state, navigate]);

  return (
    <PreparedSolutionDetailView
      loading={loading}
      item={item}
      onBack={handleBack}
      printBarcodeOpen={printBarcodeOpen}
      onOpenPrintBarcode={() => setPrintBarcodeOpen(true)}
      onClosePrintBarcode={() => setPrintBarcodeOpen(false)}
    />
  );
};

export default PreparedSolutionDetailPage;
