import React, { useEffect, useState } from 'react';
import { Table, Button, Space, message, Popconfirm, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { testResultService } from '../../services/testResultService';
import { TestResultDto, ResultApprovalStatus } from '../../types/testResult';
import type { ColumnsType } from 'antd/es/table';

const TestResultList: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResultDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    fetchTestResults();
  }, [currentPage, pageSize]);

  const fetchTestResults = async () => {
    setLoading(true);
    try {
      const result = await testResultService.getList({
        skipCount: (currentPage - 1) * pageSize,
        maxResultCount: pageSize,
        sorting: 'creationTime desc',
      });
      setTestResults(result.items);
      setTotalCount(result.totalCount);
    } catch (error) {
      message.error(t('messages.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await testResultService.delete(id);
      message.success(t('messages.deleteSuccess'));
      fetchTestResults();
    } catch (error) {
      message.error(t('messages.deleteFailed'));
    }
  };

  const getApprovalStatusColor = (status: ResultApprovalStatus): string => {
    switch (status) {
      case ResultApprovalStatus.Draft: return 'default';
      case ResultApprovalStatus.Submitted: return 'blue';
      case ResultApprovalStatus.Step1Reviewed: return 'cyan';
      case ResultApprovalStatus.Step2Approved: return 'green';
      case ResultApprovalStatus.Rejected: return 'red';
      default: return 'default';
    }
  };

  const getApprovalStatusText = (status: ResultApprovalStatus): string => {
    switch (status) {
      case ResultApprovalStatus.Draft: return t('testResult.approvalStatus.draft');
      case ResultApprovalStatus.Submitted: return t('testResult.approvalStatus.submitted');
      case ResultApprovalStatus.Step1Reviewed: return t('testResult.approvalStatus.step1Reviewed');
      case ResultApprovalStatus.Step2Approved: return t('testResult.approvalStatus.step2Approved');
      case ResultApprovalStatus.Rejected: return t('testResult.approvalStatus.rejected');
      default: return '';
    }
  };

  const columns: ColumnsType<TestResultDto> = [
    {
      title: t('testResult.testCode'),
      dataIndex: 'testCode',
      key: 'testCode',
    },
    {
      title: t('testResult.testName'),
      dataIndex: 'testName',
      key: 'testName',
    },
    {
      title: t('testResult.parameter'),
      dataIndex: 'parameter',
      key: 'parameter',
    },
    {
      title: t('testResult.value'),
      dataIndex: 'value',
      key: 'value',
    },
    {
      title: t('testResult.unit'),
      dataIndex: 'unit',
      key: 'unit',
    },
    {
      title: t('testResult.isPass'),
      dataIndex: 'isPass',
      key: 'isPass',
      render: (isPass?: boolean) => {
        if (isPass === undefined || isPass === null) return '-';
        return isPass ? (
          <Tag color="green">{t('testResult.pass')}</Tag>
        ) : (
          <Tag color="red">{t('testResult.fail')}</Tag>
        );
      },
    },
    {
      title: t('testResult.approvalStatus.label'),
      dataIndex: 'approvalStatus',
      key: 'approvalStatus',
      render: (status: ResultApprovalStatus) => (
        <Tag color={getApprovalStatusColor(status)}>{getApprovalStatusText(status)}</Tag>
      ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_: any, record: TestResultDto) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/test-result/${record.id}`)}
          >
            {t('common.view')}
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/test-result/edit/${record.id}`)}
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
      <div style={{ marginBottom: '16px' }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/test-result/create')}
        >
          {t('testResult.create')}
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={testResults}
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
          },
        }}
      />
    </div>
  );
};

export default TestResultList;
