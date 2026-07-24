import React from "react";
import { Card, Row, Col, Typography, Spin } from "antd";
import { ExperimentOutlined } from "../../../components/common/Icon";
import { Dayjs } from "dayjs";
import { LaboratoryDto } from "../../../services/masterDataService";
import {
  LabReportDataDto,
  LabContractDetailDto,
  LabContractSummaryDto,
} from "../../../services/statisticsService";
import "../../Dashboard/Dashboard.css";
import "../../../styles/ListCard.css";
import { FilterPeriod } from "./utils";
import LabReportToolbar from "./LabReportToolbar";
import SampleRevenueChart from "./SampleRevenueChart";
import ContractIndicatorSection from "./ContractIndicatorSection";
import ContractTable from "./ContractTable";
import ContractDetailPanel from "./ContractDetailPanel";
import TestResultChart from "./TestResultChart";

const { Text } = Typography;

export interface LabReportViewProps {
  allowedLabs: LaboratoryDto[];
  selectedLabId: string;
  selectedLab: LaboratoryDto | undefined;
  filterPeriod: FilterPeriod;
  dateRange: [Dayjs, Dayjs];
  isCustomDateRange: boolean;
  loading: boolean;
  exporting: boolean;
  exportingDetail: boolean;
  canExport: boolean;
  reportData: LabReportDataDto | null;
  selectedContractId: string | null;
  contractDetail: LabContractDetailDto | null;
  detailLoading: boolean;
  onLabChange: (id: string) => void;
  onPeriodChange: (period: FilterPeriod) => void;
  onRangeChange: (dates: [Dayjs | null, Dayjs | null] | null) => void;
  onReload: () => void;
  onExport: () => void;
  onExportDetail: () => void;
  onContractClick: (record: LabContractSummaryDto) => void;
}

const LabReportView: React.FC<LabReportViewProps> = ({
  allowedLabs,
  selectedLabId,
  selectedLab,
  filterPeriod,
  dateRange,
  isCustomDateRange,
  loading,
  exporting,
  exportingDetail,
  canExport,
  reportData,
  selectedContractId,
  contractDetail,
  detailLoading,
  onLabChange,
  onPeriodChange,
  onRangeChange,
  onReload,
  onExport,
  onExportDetail,
  onContractClick,
}) => (
  <div>
    <LabReportToolbar
      allowedLabs={allowedLabs}
      selectedLabId={selectedLabId}
      selectedLab={selectedLab}
      filterPeriod={filterPeriod}
      dateRange={dateRange}
      isCustomDateRange={isCustomDateRange}
      loading={loading}
      exporting={exporting}
      exportingDetail={exportingDetail}
      canExport={canExport}
      reportData={reportData}
      onLabChange={onLabChange}
      onPeriodChange={onPeriodChange}
      onRangeChange={onRangeChange}
      onReload={onReload}
      onExport={onExport}
      onExportDetail={onExportDetail}
    />

    <Spin spinning={loading}>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24}>
          <Card bordered={false} style={{ boxShadow: "0px 2px 8px rgba(0,0,0,0.08)", borderRadius: 16 }}>
            <div style={{ marginBottom: 4 }}>
              <Text strong style={{ fontSize: 16 }}>Số mẫu &amp; doanh thu theo ngày</Text>
            </div>
            <div style={{ marginBottom: 12 }}>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Cột = số mẫu · Đường = doanh thu (triệu đồng)
              </Text>
            </div>
            <SampleRevenueChart data={reportData?.dailyStats ?? []} />
          </Card>
        </Col>
      </Row>

      {/* Section 2: uses same date range as page toolbar */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24}>
          <ContractIndicatorSection
            indicators={reportData?.contractIndicators ?? []}
            indicatorContractCounts={reportData?.indicatorContractCounts ?? []}
            dateRange={dateRange}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={selectedContractId ? 10 : 24}>
          <Card
            className="list-card"
            title={
              <div>
                <div><ExperimentOutlined /> Danh sách hợp đồng</div>
                <div style={{ fontSize: 12, fontWeight: 400, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
                  Nhấp vào dòng để xem chi tiết mẫu
                </div>
              </div>
            }
            extra={
              reportData && (
                <Text style={{ color: "#fff", fontSize: 13 }}>
                  {reportData.contracts.length} hợp đồng
                </Text>
              )
            }
          >
            <ContractTable
              contracts={reportData?.contracts ?? []}
              selectedContractId={selectedContractId}
              onContractClick={onContractClick}
            />
          </Card>
        </Col>
        {selectedContractId && (
          <Col xs={24} lg={14}>
            <ContractDetailPanel
              contractDetail={contractDetail}
              detailLoading={detailLoading}
            />
          </Col>
        )}
      </Row>

      {/* Kết quả thử nghiệm */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12} lg={8}>
          <Card bordered={false} style={{ boxShadow: "0px 2px 8px rgba(0,0,0,0.08)", borderRadius: 16 }}>
            <TestResultChart
              passCount={reportData?.passCount ?? 0}
              failCount={reportData?.failCount ?? 0}
              dateRange={dateRange}
            />
          </Card>
        </Col>
      </Row>
    </Spin>
  </div>
);

export default LabReportView;
