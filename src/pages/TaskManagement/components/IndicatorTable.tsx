import React, { useState } from 'react';
import { Table, Select, Input, Button, Space, Tag, Modal, Form, Typography } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  LaboratoryTaskIndicatorDto,
  IndicatorApprovalStatus,
  IndicatorApprovalStatusLabels,
  IndicatorApprovalStatusColors,
  MethodLookupDto,
  UserLookupDto,
} from '../../../types/laboratoryTask';

const { Text } = Typography;

interface IndicatorTableProps {
  indicators: LaboratoryTaskIndicatorDto[];
  methods: MethodLookupDto[];
  technicians: UserLookupDto[];
  onMethodChange: (indicatorId: string, methodId: string) => void;
  onTechnicianChange: (indicatorId: string, technicianId: string) => void;
  onUpdateResult: (indicatorId: string, result: string) => void;
  onApprove: (indicatorId: string, approve: boolean, reason?: string) => void;
  loading?: boolean;
}

const IndicatorTable: React.FC<IndicatorTableProps> = ({
  indicators,
  methods,
  technicians,
  onMethodChange,
  onTechnicianChange,
  onUpdateResult,
  onApprove,
  loading = false,
}) => {
  // State for reject modal
  const [rejectModal, setRejectModal] = useState<{ visible: boolean; indicatorId?: string }>({
    visible: false,
  });
  const [rejectForm] = Form.useForm();

  const handleReject = async () => {
    try {
      const values = await rejectForm.validateFields();
      if (rejectModal.indicatorId) {
        onApprove(rejectModal.indicatorId, false, values.reason);
        setRejectModal({ visible: false });
        rejectForm.resetFields();
      }
    } catch (error) {
      // Validation failed
    }
  };

  const columns = [
    {
      title: 'Tên chỉ tiêu',
      dataIndex: 'indicatorName',
      key: 'indicatorName',
      width: 180,
      render: (value: string, record: LaboratoryTaskIndicatorDto) => (
        <div>
          <div>{value}</div>
          {record.indicatorGroupName && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.indicatorGroupName}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Phương pháp',
      dataIndex: 'methodId',
      key: 'methodId',
      width: 200,
      render: (value: string, record: LaboratoryTaskIndicatorDto) => (
        <Select
          style={{ width: '100%' }}
          size="small"
          value={value}
          placeholder="Chọn PP"
          onChange={(val) => onMethodChange(record.id, val)}
          options={methods.map((m) => ({
            value: m.id,
            label: m.name,
          }))}
          disabled={record.approvalStatus === IndicatorApprovalStatus.Approved}
          allowClear
        />
      ),
    },
    {
      title: 'ĐVT',
      dataIndex: 'unit',
      key: 'unit',
      width: 70,
      align: 'center' as const,
      render: (value: string) => value || '-',
    },
    {
      title: 'Kết quả',
      dataIndex: 'result',
      key: 'result',
      width: 120,
      render: (value: string, record: LaboratoryTaskIndicatorDto) => (
        <Input
          size="small"
          defaultValue={value}
          placeholder="Nhập KQ"
          onBlur={(e) => {
            if (e.target.value !== value) {
              onUpdateResult(record.id, e.target.value);
            }
          }}
          onPressEnter={(e) => {
            (e.target as HTMLInputElement).blur();
          }}
          disabled={
            !record.methodId ||
            record.approvalStatus === IndicatorApprovalStatus.Approved
          }
        />
      ),
    },
    {
      title: 'Kỹ thuật viên',
      dataIndex: 'technicianId',
      key: 'technicianId',
      width: 180,
      render: (value: string, record: LaboratoryTaskIndicatorDto) => (
        <Select
          style={{ width: '100%' }}
          size="small"
          value={value}
          placeholder="Chọn KTV"
          onChange={(val) => onTechnicianChange(record.id, val)}
          options={technicians.map((t) => ({
            value: t.id,
            label: t.displayName || t.userName,
          }))}
          disabled={record.approvalStatus === IndicatorApprovalStatus.Approved}
          allowClear
        />
      ),
    },
    {
      title: 'Ngày nhập',
      dataIndex: 'entryDate',
      key: 'entryDate',
      width: 100,
      render: (date: string) => (date ? dayjs(date).format('DD/MM/YYYY') : '-'),
    },
    {
      title: 'Ngày duyệt',
      dataIndex: 'approvalDate',
      key: 'approvalDate',
      width: 100,
      render: (date: string) => (date ? dayjs(date).format('DD/MM/YYYY') : '-'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'approvalStatus',
      key: 'approvalStatus',
      width: 180,
      render: (status: IndicatorApprovalStatus, record: LaboratoryTaskIndicatorDto) => {
        switch (status) {
          case IndicatorApprovalStatus.Pending:
            return <Tag color={IndicatorApprovalStatusColors[status]}>{IndicatorApprovalStatusLabels[status]}</Tag>;

          case IndicatorApprovalStatus.Entered:
            return (
              <Space size="small">
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={() => onApprove(record.id, true)}
                >
                  Duyệt
                </Button>
                <Button
                  danger
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={() => setRejectModal({ visible: true, indicatorId: record.id })}
                >
                  Từ chối
                </Button>
              </Space>
            );

          case IndicatorApprovalStatus.Approved:
            return <Tag color={IndicatorApprovalStatusColors[status]}>{IndicatorApprovalStatusLabels[status]}</Tag>;

          case IndicatorApprovalStatus.Rejected:
            return (
              <div>
                <Tag color={IndicatorApprovalStatusColors[status]}>{IndicatorApprovalStatusLabels[status]}</Tag>
                {record.rejectionReason && (
                  <div>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {record.rejectionReason}
                    </Text>
                  </div>
                )}
              </div>
            );

          default:
            return null;
        }
      },
    },
  ];

  return (
    <>
      <Table
        columns={columns}
        dataSource={indicators}
        rowKey="id"
        pagination={false}
        size="small"
        scroll={{ x: 1200 }}
        loading={loading}
      />

      {/* Reject Reason Modal */}
      <Modal
        title="Lý do từ chối"
        open={rejectModal.visible}
        onOk={handleReject}
        onCancel={() => {
          setRejectModal({ visible: false });
          rejectForm.resetFields();
        }}
        okText="Xác nhận"
        cancelText="Hủy"
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item
            name="reason"
            label="Lý do"
            rules={[{ required: true, message: 'Vui lòng nhập lý do từ chối' }]}
          >
            <Input.TextArea rows={3} placeholder="Nhập lý do từ chối kết quả..." />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default IndicatorTable;
