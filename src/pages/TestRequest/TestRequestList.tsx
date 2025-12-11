import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, message, Popconfirm, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import { testRequestService } from '../../services/testRequestService';
import { TestRequestDto, TestRequestStatus } from '../../types/testRequest';
import dayjs from 'dayjs';

const TestRequestList: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TestRequestDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadData = async (page: number = currentPage, size: number = pageSize) => {
    setLoading(true);
    try {
      const result = await testRequestService.getList({
        skipCount: (page - 1) * size,
        maxResultCount: size,
        sorting: 'requestDate desc'
      });
      setData(result.items);
      setTotalCount(result.totalCount);
    } catch (error) {
      message.error(t('messages.loadFailed'));
      console.error('Failed to load test requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await testRequestService.delete(id);
      message.success(t('messages.deleteSuccess'));
      loadData();
    } catch (error) {
      message.error(t('messages.deleteFailed'));
      console.error('Failed to delete test request:', error);
    }
  };

  const getStatusTag = (status: TestRequestStatus) => {
    const statusConfig = {
      [TestRequestStatus.Pending]: { color: 'default', text: t('request.status.pending') },
      [TestRequestStatus.InProgress]: { color: 'processing', text: t('request.status.inProgress') },
      [TestRequestStatus.Completed]: { color: 'success', text: t('request.status.completed') },
      [TestRequestStatus.Cancelled]: { color: 'error', text: t('request.status.cancelled') }
    };
    const config = statusConfig[status];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns: ColumnsType<TestRequestDto> = [
    {
      title: t('request.requestNumber'),
      dataIndex: 'requestNumber',
      key: 'requestNumber',
      width: 150,
      fixed: 'left'
    },
    {
      title: t('request.requestDate'),
      dataIndex: 'requestDate',
      key: 'requestDate',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: t('request.customerName'),
      dataIndex: 'customerName',
      key: 'customerName',
      width: 200
    },
    {
      title: t('request.customerEmail'),
      dataIndex: 'customerEmail',
      key: 'customerEmail',
      width: 200,
      ellipsis: true
    },
    {
      title: t('request.customerPhone'),
      dataIndex: 'customerPhone',
      key: 'customerPhone',
      width: 150
    },
    {
      title: t('request.status.label'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: TestRequestStatus) => getStatusTag(status)
    },
    {
      title: t('request.expectedCompletionDate'),
      dataIndex: 'expectedCompletionDate',
      key: 'expectedCompletionDate',
      width: 150,
      render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY') : '-'
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_: any, record: TestRequestDto) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/test-request/${record.id}`)}
          />
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/test-request/edit/${record.id}`)}
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
      title={t('request.testRequest')}
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/test-request/create')}
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
        scroll={{ x: 1200 }}
      />
    </Card>
  );
};

export default TestRequestList;
