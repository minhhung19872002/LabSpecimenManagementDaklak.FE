import React from 'react';
import { Table, Button, Space, Tag, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined } from '../../../components/common/Icon';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { OrganizationDto } from '../../../types/organization';
import { getProvinceNameByCode } from '../../../utils/vietnamLocations';

interface OrganizationTableProps {
  data: OrganizationDto[];
  loading: boolean;
  currentPage: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number, size: number) => void;
  onEdit: (record: OrganizationDto) => void;
  onDelete: (id: string) => void;
}

const OrganizationTable: React.FC<OrganizationTableProps> = ({
  data,
  loading,
  currentPage,
  pageSize,
  totalCount,
  onPageChange,
  onEdit,
  onDelete,
}) => {
  const columns: ColumnsType<OrganizationDto> = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: 'Tên CS/DN',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Tỉnh thành',
      dataIndex: 'provinceCode',
      key: 'provinceCode',
      width: 150,
      render: (code: string) => {
        if (!code) return '-';
        // Try to get name from code, if not found, display the value as-is (legacy import data)
        const name = getProvinceNameByCode(code);
        return name || code;
      },
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'address',
      key: 'address',
      width: 200,
      ellipsis: true,
      render: (value: string) => value || '-',
    },
    {
      title: 'Người LH',
      dataIndex: 'contactPerson',
      key: 'contactPerson',
      width: 120,
      ellipsis: true,
      render: (value: string) => value || '-',
    },
    {
      title: 'SĐT',
      dataIndex: 'phone',
      key: 'phone',
      width: 110,
      render: (value: string) => value || '-',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      align: 'center',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'}>
          {isActive ? 'Hoạt động' : 'Ngừng'}
        </Tag>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'creationTime',
      key: 'creationTime',
      width: 130,
      render: (date: string) => (date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '-'),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 100,
      align: 'center',
      fixed: 'right',
      render: (_, record: OrganizationDto) => (
        <Space size="small">
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
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

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
        pageSizeOptions: [20, 50, 100],
        showSizeChanger: true,
        showTotal: (total) => `Tổng ${total} bản ghi`,
        onChange: onPageChange,
      }}
      scroll={{ x: 1200 }}
    />
  );
};

export default OrganizationTable;
