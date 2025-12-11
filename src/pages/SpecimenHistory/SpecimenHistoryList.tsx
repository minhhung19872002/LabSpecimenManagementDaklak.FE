import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Popconfirm, message, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { specimenHistoryService } from '../../services/specimenHistoryService';
import { SpecimenHistoryDto, SpecimenStatus } from '../../types/specimenHistory';

const SpecimenHistoryList: React.FC = () => {
  const [data, setData] = useState<SpecimenHistoryDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await specimenHistoryService.getList({
        skipCount: (page - 1) * pageSize,
        maxResultCount: pageSize,
        sorting: 'creationTime desc',
      });
      setData(result.items);
      setTotal(result.totalCount);
    } catch (error) {
      message.error(t('specimenHistory.list.fetchError'));
      console.error('Failed to fetch specimen histories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize]);

  const handleDelete = async (id: string) => {
    try {
      await specimenHistoryService.delete(id);
      message.success(t('specimenHistory.list.deleteSuccess'));
      fetchData();
    } catch (error) {
      message.error(t('specimenHistory.list.deleteError'));
      console.error('Failed to delete specimen history:', error);
    }
  };

  const getStatusTag = (status: SpecimenStatus) => {
    const statusConfig = {
      [SpecimenStatus.Received]: { color: 'blue', label: t('specimenHistory.status.received') },
      [SpecimenStatus.Testing]: { color: 'orange', label: t('specimenHistory.status.testing') },
      [SpecimenStatus.Storage]: { color: 'green', label: t('specimenHistory.status.storage') },
      [SpecimenStatus.Disposal]: { color: 'red', label: t('specimenHistory.status.disposal') },
      [SpecimenStatus.Destroyed]: { color: 'volcano', label: t('specimenHistory.status.destroyed') },
      [SpecimenStatus.ReturnedToCustomer]: { color: 'purple', label: t('specimenHistory.status.returnedToCustomer') },
    };

    const config = statusConfig[status];
    return <Tag color={config.color}>{config.label}</Tag>;
  };

  const columns = [
    {
      title: t('specimenHistory.list.specimenCode'),
      dataIndex: 'specimenCode',
      key: 'specimenCode',
    },
    {
      title: t('specimenHistory.list.action'),
      dataIndex: 'action',
      key: 'action',
    },
    {
      title: t('specimenHistory.list.location'),
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: t('specimenHistory.list.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: SpecimenStatus) => getStatusTag(status),
    },
    {
      title: t('specimenHistory.list.creationTime'),
      dataIndex: 'creationTime',
      key: 'creationTime',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_: any, record: SpecimenHistoryDto) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/specimen-histories/${record.id}`)}
          >
            {t('common.view')}
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/specimen-histories/${record.id}/edit`)}
          >
            {t('common.edit')}
          </Button>
          <Popconfirm
            title={t('specimenHistory.list.deleteConfirm')}
            onConfirm={() => handleDelete(record.id)}
            okText={t('common.yes')}
            cancelText={t('common.no')}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              {t('common.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>{t('specimenHistory.list.title')}</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/specimen-histories/new')}
        >
          {t('specimenHistory.list.create')}
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize: pageSize,
          total: total,
          onChange: (newPage, newPageSize) => {
            setPage(newPage);
            setPageSize(newPageSize || 10);
          },
        }}
      />
    </div>
  );
};

export default SpecimenHistoryList;
