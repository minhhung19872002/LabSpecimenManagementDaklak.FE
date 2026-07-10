import React from "react";
import { Card, Typography } from "antd";
import { ExperimentOutlined } from "../../../components/common/Icon";
import { Dayjs } from "dayjs";
import { ContractMonthlyIndicatorDto } from "../../../services/statisticsService";
import ContractIndicatorChart from "./ContractIndicatorChart";

const { Text } = Typography;

interface Props {
  indicators: ContractMonthlyIndicatorDto[];
  dateRange: [Dayjs, Dayjs];
}

const ContractIndicatorSection: React.FC<Props> = ({ indicators, dateRange }) => {
  const monthDiff = dateRange[1].diff(dateRange[0], "month") + 1;
  const isMultiMonth = monthDiff >= 2;

  return (
    <Card
      className="list-card"
      title={<><ExperimentOutlined /> Số chỉ tiêu trong tháng theo hợp đồng</>}
      extra={
        isMultiMonth && (
          <Text style={{ fontSize: 12, color: "#fff" }}>Mỗi màu = 1 tháng</Text>
        )
      }
    >
      <div style={{ padding: "0 16px" }}>
        <ContractIndicatorChart indicators={indicators} isMultiMonth={isMultiMonth} />
      </div>
    </Card>
  );
};

export default ContractIndicatorSection;
