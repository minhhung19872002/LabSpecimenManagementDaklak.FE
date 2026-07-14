import React from "react";
import { Card, Row, Col, Typography } from "antd";
import { ExperimentOutlined, BarChartOutlined } from "../../../components/common/Icon";
import { Dayjs } from "dayjs";
import { ContractMonthlyIndicatorDto, IndicatorContractCountDto } from "../../../services/statisticsService";
import ContractIndicatorChart from "./ContractIndicatorChart";
import IndicatorContractChart from "./IndicatorContractChart";

const { Text } = Typography;

interface Props {
  indicators: ContractMonthlyIndicatorDto[];
  indicatorContractCounts: IndicatorContractCountDto[];
  dateRange: [Dayjs, Dayjs];
}

const colStyle: React.CSSProperties = { display: "flex", flexDirection: "column" };

const ContractIndicatorSection: React.FC<Props> = ({ indicators, indicatorContractCounts, dateRange }) => {
  const monthDiff = dateRange[1].diff(dateRange[0], "month") + 1;
  const isMultiMonth = monthDiff >= 2;

  const monthBadge = isMultiMonth && (
    <Text style={{ fontSize: 12, color: "#fff" }}>Mỗi màu = 1 tháng</Text>
  );

  return (
    <Row gutter={[16, 16]}>
      {/* Left card — natural height, determines Row height; body flex-end so chart sticks to bottom */}
      <Col xs={24} xl={12} style={colStyle}>
        <Card
          className="list-card"
          style={{ flex: 1, display: "flex", flexDirection: "column" }}
          styles={{ body: { flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" } }}
          title={<><ExperimentOutlined /> Số chỉ tiêu trong tháng theo hợp đồng</>}
          extra={monthBadge}
        >
          <div style={{ padding: "0 16px" }}>
            <ContractIndicatorChart indicators={indicators} isMultiMonth={isMultiMonth} />
          </div>
        </Card>
      </Col>

      {/* Right card — fills Row height, chart body stretches to fill */}
      <Col xs={24} xl={12} style={colStyle}>
        <Card
          className="list-card"
          style={{ flex: 1, display: "flex", flexDirection: "column" }}
          styles={{ body: { flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", overflow: "hidden", minHeight: 0 } }}
          title={<><BarChartOutlined /> Tổng số hợp đồng trên chỉ tiêu</>}
          extra={monthBadge}
        >
          <div style={{ padding: "0 16px", flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <IndicatorContractChart data={indicatorContractCounts} isMultiMonth={isMultiMonth} />
          </div>
        </Card>
      </Col>
    </Row>
  );
};

export default ContractIndicatorSection;
