import React from "react";
import { Button, Card, Space, Spin, Tag } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { PreparedSolutionBatchDto } from "../../../services/preparedSolutionService";
import { STATUS_COLOR, STATUS_LABEL, formatDate } from "../PreparedSolutions/utils";
import PreparedSolutionIngredientList from "../PreparedSolutions/PreparedSolutionIngredientList";
import PreparedSolutionInfoSection from "./PreparedSolutionInfoSection";
import PreparedSolutionDetailTable from "./PreparedSolutionDetailTable";
import BarcodePrintModal, { BarcodePrintSection } from "../../../components/common/BarcodePrintModal";
import "../../../styles/ListCard.css";
import "../../WarehouseImports/WarehouseImportDetail.css";

export interface PreparedSolutionDetailViewProps {
  loading: boolean;
  item: PreparedSolutionBatchDto | null;
  onBack: () => void;
  printBarcodeOpen: boolean;
  onOpenPrintBarcode: () => void;
  onClosePrintBarcode: () => void;
}

const PreparedSolutionDetailView: React.FC<PreparedSolutionDetailViewProps> = ({
  loading,
  item,
  onBack,
  printBarcodeOpen,
  onOpenPrintBarcode,
  onClosePrintBarcode,
}) => {
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!item) {
    return (
      <Card className="list-card">
        <div style={{ textAlign: "center", padding: 40 }}>
          <p>Không tìm thấy phiếu pha dung dịch</p>
          <Button type="link" onClick={onBack}>
            Quay lại
          </Button>
        </div>
      </Card>
    );
  }

  const barcodeSections: BarcodePrintSection[] =
    item.barcodeValues?.length > 0
      ? [
          {
            key: item.lotCode ?? item.id,
            header: `${item.lotCode ?? "—"} - ${formatDate(item.expiryDate)}`,
            barcodes: item.barcodeValues,
          },
        ]
      : [];

  return (
    <div className="warehouse-import-detail">
      <div className="back-button-bar">
        <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
          Quay lại
        </Button>
      </div>

      <Card
        className="list-card"
        title={
          <div className="card-header-flex">
            <Space wrap>
              <span style={{ fontWeight: 600, fontSize: 16 }}>Chi tiết phiếu pha dung dịch</span>
              <Tag className="receipt-code-tag">{item.preparedSolutionReceiptCode ?? item.lotCode}</Tag>
              <Tag color={STATUS_COLOR[item.computedStatus]}>{STATUS_LABEL[item.computedStatus]}</Tag>
            </Space>
            <Button onClick={onOpenPrintBarcode}>
              In barcode
            </Button>
          </div>
        }
      >
        <PreparedSolutionInfoSection item={item} />

        <div style={{ marginBottom: 16 }}>
          <PreparedSolutionDetailTable item={item} />
        </div>

        <PreparedSolutionIngredientList ingredients={item.ingredients} />
      </Card>

      <BarcodePrintModal
        open={printBarcodeOpen}
        onClose={onClosePrintBarcode}
        title="In barcode"
        printTitle={item.preparedSolutionReceiptCode ?? item.lotCode ?? ""}
        sections={barcodeSections}
        emptyText="Phiếu pha này chưa có barcode"
      />
    </div>
  );
};

export default PreparedSolutionDetailView;
