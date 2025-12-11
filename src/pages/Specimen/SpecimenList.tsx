import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, message, Popconfirm, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import { specimenService } from '../../services/specimenService';
import { SpecimenDto, SpecimenStatus } from '../../types/specimen';
import dayjs from 'dayjs';

const SpecimenList: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SpecimenDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadData = async (page: number = currentPage, size: number = pageSize) => {
    setLoading(true);
    try {
      const result = await specimenService.getList({
        skipCount: (page - 1) * size,
        maxResultCount: size,
        sorting: 'receivedDate desc'
      });
      setData(result.items);
      setTotalCount(result.totalCount);
    } catch (error) {
      message.error(t('messages.loadFailed'));
      console.error('Failed to load specimens:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await specimenService.delete(id);
      message.success(t('messages.deleteSuccess'));
      loadData();
    } catch (error) {
      message.error(t('messages.deleteFailed'));
      console.error('Failed to delete specimen:', error);
    }
  };

  const getStatusTag = (status: SpecimenStatus) => {
    const statusConfig = {
      [SpecimenStatus.Received]: { color: 'default', text: t('specimen.status.received') },
      [SpecimenStatus.Testing]: { color: 'processing', text: t('specimen.status.testing') },
      [SpecimenStatus.Storage]: { color: 'blue', text: t('specimen.status.storage') },
      [SpecimenStatus.Disposal]: { color: 'warning', text: t('specimen.status.disposal') },
      [SpecimenStatus.Destroyed]: { color: 'error', text: t('specimen.status.destroyed') },
      [SpecimenStatus.ReturnedToCustomer]: { color: 'success', text: t('specimen.status.returnedToCustomer') }
    };
    const config = statusConfig[status];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns: ColumnsType<SpecimenDto> = [
    {
      title: t('specimen.code'),
      dataIndex: 'code',
      key: 'code',
      width: 150,
      fixed: 'left'
    },
    {
      title: t('specimen.name'),
      dataIndex: 'name',
      key: 'name',
      width: 200
    },
    {
      title: t('specimen.type'),
      dataIndex: 'type',
      key: 'type',
      width: 150
    },
    {
      title: t('specimen.receivedDate'),
      dataIndex: 'receivedDate',
      key: 'receivedDate',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: t('specimen.testRequestNumber'),
      dataIndex: 'testRequestNumber',
      key: 'testRequestNumber',
      width: 150
    },
    {
      title: t('specimen.quantity'),
      key: 'quantity',
      width: 120,
      render: (_: any, record: SpecimenDto) => `${record.quantity} ${record.unit}`
    },
    {
      title: t('specimen.status.label'),
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status: SpecimenStatus) => getStatusTag(status)
    },
    {
      title: t('specimen.storageLocation'),
      dataIndex: 'storageLocation',
      key: 'storageLocation',
      width: 150,
      ellipsis: true,
      render: (text: string) => text || '-'
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_: any, record: SpecimenDto) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/specimen/${record.id}`)}
          />
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/specimen/edit/${record.id}`)}
          />
          <Popconfirm
            title={t('messages.deleteConfirm')}
            onConfirm={() => handleDelete(record.id)}
            okText={t('common.yes')}
            cancelText={t('common.no')}
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <Card
      title={t('specimen.specimen')}
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/specimen/create')}
        >
          {t('common.create')}
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: totalCount,
          showSizeChanger: true,
          showTotal: (total) => t('common.totalItems', { count: total }),
          onChange: (page, size) => {
            setCurrentPage(page);
            setPageSize(size);
            loadData(page, size);
          }
        }}
        scroll={{ x: 1400 }}
      />
    </Card>
  );
};

export default SpecimenList;
