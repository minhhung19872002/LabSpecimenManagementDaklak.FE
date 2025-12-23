import React from "react";
import { Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { TestingListDto, TestingStatus } from "../../../types/testing";
import { renderStatusTag, isTaskUrgent } from "../utils/testingStatus";
import { TABLE_SCROLL } from "../constants/testing.constants";

const { Text } = Typography;

interface TestingTableProps {
  tasks: TestingListDto[];
  loading: boolean;
  pagination: {
    current: number;
    pageSize: number;
  };
  totalCount: number;
  onTableChange: (pagination: any) => void;
  onRowDoubleClick: (laboratoryTaskId: string) => void;
}

const TestingTable: React.FC<TestingTableProps> = ({
  tasks,
  loading,
  pagination,
  totalCount,
  onTableChange,
  onRowDoubleClick,
}) => {
  const columns: ColumnsType<TestingListDto> = [
    {
      title: "Số hợp đồng",
      dataIndex: "contractNumber",
      key: "contractNumber",
      width: 150,
      fixed: "left",
      render: (value: string) => value || "-",
    },
    {
      title: "Tổng mẫu",
      dataIndex: "totalSampleCount",
      key: "totalSampleCount",
      width: 100,
      align: "center",
    },
    {
      title: "Tổng CT",
      dataIndex: "totalIndicatorCount",
      key: "totalIndicatorCount",
      width: 100,
      align: "center",
    },
    {
      title: "Kỹ thuật viên",
      dataIndex: "technicianNames",
      key: "technicianNames",
      width: 180,
      ellipsis: true,
      render: (value: string) => value || "-",
    },
    {
      title: "Ngày chuyển đi",
      dataIndex: "transferDate",
      key: "transferDate",
      width: 140,
      render: (date: string) => (date ? dayjs(date).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Ngày YC xong",
      dataIndex: "requestCompletionDate",
      key: "requestCompletionDate",
      width: 130,
      render: (date: string, record: TestingListDto) => {
        if (!date) return "-";
        const d = dayjs(date);
        const shouldHighlight =
          record.isUrgent && record.testingStatus !== TestingStatus.Done;
        return (
          <span
            style={{
              color: shouldHighlight ? "#ff4d4f" : undefined,
              fontWeight: shouldHighlight ? "bold" : undefined,
            }}
          >
            {d.format("DD/MM/YYYY")}
          </span>
        );
      },
    },
    {
      title: "Ngày thí nghiệm",
      dataIndex: "testDate",
      key: "testDate",
      width: 140,
      render: (date: string) =>
        date ? (
          dayjs(date).format("DD/MM/YYYY")
        ) : (
          <Text type="secondary">Chưa đặt</Text>
        ),
    },
    {
      title: "Trạng thái",
      dataIndex: "testingStatus",
      key: "testingStatus",
      width: 140,
      render: (status: TestingStatus) => renderStatusTag(status),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={tasks}
      rowKey="id"
      loading={loading}
      pagination={{
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: totalCount,
        pageSizeOptions: [20, 50, 100],
        showSizeChanger: true,
        showTotal: (total, range) =>
          `${range[0]}-${range[1]} của ${total} xét nghiệm`,
      }}
      onChange={onTableChange}
      scroll={TABLE_SCROLL}
      onRow={(record) => ({
        onDoubleClick: () => onRowDoubleClick(record.laboratoryTaskId),
        style: { cursor: "pointer" },
      })}
      rowClassName={(record) => (isTaskUrgent(record) ? "urgent-row" : "")}
    />
  );
};

export default TestingTable;
