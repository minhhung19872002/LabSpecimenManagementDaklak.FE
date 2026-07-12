import React from "react";
import { Table, Typography } from "antd";
import { LabContractSummaryDto } from "../../../services/statisticsService";
import { formatCurrencyFull } from "./utils";

const { Text } = Typography;

interface Props {
  contracts: LabContractSummaryDto[];
  selectedContractId: string | null;
  onContractClick: (record: LabContractSummaryDto) => void;
}

const columns = (selectedContractId: string | null) => [
  {
    title: "Số hợp đồng",
    key: "contractNumber",
    render: (_: unknown, record: LabContractSummaryDto) => (
      <Text
        strong={selectedContractId === record.testRequestId}
        style={{ color: selectedContractId === record.testRequestId ? "#1890FF" : undefined }}
      >
        {record.contractNumber || record.requestNumber}
      </Text>
    ),
  },
  {
    title: "Số mẫu",
    dataIndex: "sampleCount",
    key: "sampleCount",
    align: "right" as const,
    width: 80,
  },
  {
    title: "Tổng số chỉ tiêu",
    dataIndex: "indicatorCount",
    key: "indicatorCount",
    align: "right" as const,
    width: 120,
  },
  {
    title: "Tổng tiền",
    dataIndex: "totalPrice",
    key: "totalPrice",
    align: "right" as const,
    width: 130,
    render: (val: number) => formatCurrencyFull(val),
  },
];

const ContractTable: React.FC<Props> = ({ contracts, selectedContractId, onContractClick }) => (
  <Table
    dataSource={contracts}
    columns={columns(selectedContractId)}
    rowKey="testRequestId"
    size="small"
    pagination={{ pageSize: 15, showSizeChanger: false, showTotal: (t) => `Tổng ${t}` }}
    scroll={{ x: "max-content" }}
    onRow={(record) => ({
      onClick: () => onContractClick(record),
      style: {
        cursor: "pointer",
        background: selectedContractId === record.testRequestId ? "#E6F7FF" : undefined,
      },
    })}
  />
);

export default ContractTable;
