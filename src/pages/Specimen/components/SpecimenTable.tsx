import React, { useMemo } from "react";
import { Table, Button, Space, Tag, Popconfirm } from "antd";
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { SpecimenDto, SpecimenStatus } from "../../../types/specimen";
import { SPECIMEN_STATUS_CONFIG, PAGE_SIZE_OPTIONS } from "../constants";

interface SpecimenTableProps {
  data: SpecimenDto[];
  loading: boolean;
  currentPage: number;
  pageSize: number;
  totalCount: number;
  isDeleting: boolean;
  onPageChange: (page: number, size: number) => void;
  onEdit: (record: SpecimenDto) => void;
  onDelete: (id: string) => void;
}

const SpecimenTable: React.FC<SpecimenTableProps> = ({
  data,
  loading,
  currentPage,
  pageSize,
  totalCount,
  isDeleting,
  onPageChange,
  onEdit,
  onDelete,
}) => {
  const navigate = useNavigate();

  const getStatusTag = (status: SpecimenStatus) => {
    const config = SPECIMEN_STATUS_CONFIG[status];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns: ColumnsType<SpecimenDto> = useMemo(
    () => [
      {
        title: "Mã mẫu",
        dataIndex: "code",
        key: "code",
        width: 180,
        fixed: "left",
        sorter: (a, b) => a.code.localeCompare(b.code),
      },
      {
        title: "Tên mẫu",
        dataIndex: "name",
        key: "name",
        width: 200,
        ellipsis: true,
      },
      {
        title: "Loại mẫu",
        dataIndex: "type",
        key: "type",
        width: 120,
      },
      {
        title: "Ngày nhận",
        dataIndex: "receivedDate",
        key: "receivedDate",
        width: 120,
        render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
        sorter: (a, b) => dayjs(a.receivedDate).unix() - dayjs(b.receivedDate).unix(),
      },
      {
        title: "Số yêu cầu",
        dataIndex: "testRequestNumber",
        key: "testRequestNumber",
        width: 180,
      },
      {
        title: "Số lượng",
        key: "quantity",
        width: 100,
        render: (_: any, record: SpecimenDto) => `${record.quantity} ${record.unit}`,
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        width: 140,
        render: (status: SpecimenStatus) => getStatusTag(status),
      },
      {
        title: "Vị trí lưu",
        dataIndex: "storageLocation",
        key: "storageLocation",
        width: 120,
        render: (text: string) => text || "-",
      },
      {
        title: "Thao tác",
        key: "actions",
        width: 150,
        fixed: "right",
        render: (_: any, record: SpecimenDto) => (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/specimen/${record.id}`)}
            />
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            />
            <Popconfirm
              title="Bạn có chắc chắn muốn xóa?"
              onConfirm={() => onDelete(record.id)}
              okText="Có"
              cancelText="Không"
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                loading={isDeleting}
              />
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [navigate, onEdit, onDelete, isDeleting]
  );

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="id"
      loading={loading}
      pagination={{
        current: currentPage,
        pageSize: pageSize,
        total: totalCount,
        pageSizeOptions: PAGE_SIZE_OPTIONS,
        showSizeChanger: true,
        showTotal: (total) => `Tổng ${total} mẫu`,
        onChange: onPageChange,
      }}
      scroll={{ x: 1500 }}
    />
  );
};

export default SpecimenTable;
