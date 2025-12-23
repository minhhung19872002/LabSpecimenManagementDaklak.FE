import React, { useMemo } from "react";
import { Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import {
  TestRequestDto,
  TestRequestStatus,
  TestRequestStatusLabels,
  TestRequestStatusColors,
} from "../../../types/testRequest";
import { TABLE_SCROLL_X, PAGE_SIZE_OPTIONS } from "../constants";
import { isUrgentRow, formatDate, formatCurrency } from "../utils";
import TestRequestRowActions from "./TestRequestRowActions";

interface TestRequestTableProps {
  data: TestRequestDto[];
  loading: boolean;
  currentPage: number;
  pageSize: number;
  totalCount: number;
  isDeleting: boolean;
  onPageChange: (page: number, size: number) => void;
  onEdit: (record: TestRequestDto) => void;
  onDelete: (id: string) => void;
  onRowDoubleClick: (record: TestRequestDto) => void;
}

const TestRequestTable: React.FC<TestRequestTableProps> = ({
  data,
  loading,
  currentPage,
  pageSize,
  totalCount,
  isDeleting,
  onPageChange,
  onEdit,
  onDelete,
  onRowDoubleClick,
}) => {
  const getStatusTag = (status: TestRequestStatus) => {
    const label = TestRequestStatusLabels[status] || status.toString();
    const color = TestRequestStatusColors[status] || "default";
    return <Tag color={color}>{label}</Tag>;
  };

  const columns: ColumnsType<TestRequestDto> = useMemo(
    () => [
      {
        title: "Số yêu cầu",
        dataIndex: "requestNumber",
        key: "requestNumber",
        width: 180,
        fixed: "left",
        sorter: (a, b) => a.requestNumber.localeCompare(b.requestNumber),
      },
      {
        title: "Ngày yêu cầu",
        dataIndex: "requestDate",
        key: "requestDate",
        width: 130,
        render: (date: string) => formatDate(date),
        sorter: (a, b) => dayjs(a.requestDate).unix() - dayjs(b.requestDate).unix(),
      },
      {
        title: "Ngày hoàn thành dự kiến",
        dataIndex: "expectedCompletionDate",
        key: "expectedCompletionDate",
        width: 180,
        render: (date: string) => (date ? formatDate(date) : "-"),
      },
      {
        title: "Tên CS/DN",
        dataIndex: "customerName",
        key: "customerName",
        width: 200,
        ellipsis: true,
      },
      {
        title: "Người liên hệ",
        dataIndex: "contactPerson",
        key: "contactPerson",
        width: 150,
        ellipsis: true,
      },
      {
        title: "Điện thoại",
        dataIndex: "phone",
        key: "phone",
        width: 130,
      },
      {
        title: "Số mẫu",
        dataIndex: "totalSampleCount",
        key: "totalSampleCount",
        width: 80,
        align: "center" as const,
        render: (value: number) => value || 0,
      },
      {
        title: "Tổng tiền",
        dataIndex: "totalCost",
        key: "totalCost",
        width: 120,
        align: "right" as const,
        render: (value: number) => formatCurrency(value),
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        width: 140,
        render: (status: TestRequestStatus) => getStatusTag(status),
      },
      {
        title: "Thao tác",
        key: "actions",
        width: 80,
        fixed: "right",
        render: (_: any, record: TestRequestDto) => (
          <TestRequestRowActions
            record={record}
            isDeleting={isDeleting}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ),
      },
    ],
    [isDeleting, onEdit, onDelete]
  );

  return (
    <>
      <style>{`
        .urgent-row > td { background-color: #fff2f0 !important; }
        .urgent-row:hover > td { background-color: #ffebe8 !important; }
      `}</style>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        rowClassName={(record) => (isUrgentRow(record) ? "urgent-row" : "")}
        onRow={(record) => ({
          onDoubleClick: () => onRowDoubleClick(record),
          style: { cursor: "pointer" },
        })}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: totalCount,
          pageSizeOptions: PAGE_SIZE_OPTIONS,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} yêu cầu`,
          onChange: onPageChange,
        }}
        scroll={{ x: TABLE_SCROLL_X }}
      />
    </>
  );
};

export default TestRequestTable;