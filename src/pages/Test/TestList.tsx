import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { testService } from '../../services/testService';
import { TestDto, TestStatus } from '../../types/test';

const TestList: React.FC = () => {
  const [tests, setTests] = useState<TestDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const fetchTests = async (page: number = 1, size: number = 10) => {
    setLoading(true);
    try {
      const result = await testService.getList({
        skipCount: (page - 1) * size,
        maxResultCount: size,
      });
      setTests(result.items);
      setTotal(result.totalCount);
    } catch (error) {
      message.error(t('messages.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests(currentPage, pageSize);
  }, [currentPage, pageSize]);

  const handleDelete = async (id: string) => {
    try {
      await testService.delete(id);
      message.success(t('messages.deleteSuccess'));
      fetchTests(currentPage, pageSize);
    } catch (error) {
      message.error(t('messages.deleteFailed'));
    }
  };

  const getStatusColor = (status: TestStatus): string => {
    switch (status) {
      case TestStatus.Pending: return 'default';
      case TestStatus.Assigned: return 'blue';
      case TestStatus.InProgress: return 'processing';
      case TestStatus.Completed: return 'success';
      case TestStatus.Reviewed: return 'cyan';
      case TestStatus.Approved: return 'green';
      default: return 'default';
    }
  };

  const getStatusText = (status: TestStatus): string => {
    switch (status) {
      case TestStatus.Pending: return t('test.status.pending');
      case TestStatus.Assigned: return t('test.status.assigned');
      case TestStatus.InProgress: return t('test.status.inProgress');
      case TestStatus.Completed: return t('test.status.completed');
      case TestStatus.Reviewed: return t('test.status.reviewed');
      case TestStatus.Approved: return t('test.status.approved');
      default: return '';
    }
  };

  const columns = [
    {
      title: t('test.code'),
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: t('test.name'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('test.specimenCode'),
      dataIndex: 'specimenCode',
      key: 'specimenCode',
    },
    {
      title: t('test.method'),
      dataIndex: 'method',
      key: 'method',
    },
    {
      title: t('test.standard'),
      dataIndex: 'standard',
      key: 'standard',
    },
    {
      title: t('test.status.label'),
      dataIndex: 'status',
      key: 'status',
      render: (status: TestStatus) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_: any, record: TestDto) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/test/${record.id}`)}
          >
            {t('common.view')}
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/test/edit/${record.id}`)}
          >
            {t('common.edit')}
          </Button>
          <Popconfirm
            title={t('messages.confirmDelete')}
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
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
        <h2>{t('test.title')}</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/test/create')}
        >
          {t('test.create')}
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={tests}
        rowKey="id"
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: total,
          onChange: (page, size) => {
            setCurrentPage(page);
            setPageSize(size || 10);
          },
          showSizeChanger: true,
          showTotal: (total) => t('common.totalItems', { count: total }),
        }}
      />
    </div>
  );
};

export default TestList;
