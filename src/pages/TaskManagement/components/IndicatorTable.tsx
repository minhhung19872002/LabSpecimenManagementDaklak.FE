import React, { useState } from "react";
import {
  Table,
  Select,
  Input,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Typography,
  message,
} from "antd";
import { CheckOutlined, CloseOutlined, SendOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  LaboratoryTaskIndicatorDto,
  IndicatorApprovalStatus,
  IndicatorApprovalStatusLabels,
  IndicatorApprovalStatusColors,
  MethodLookupDto,
  UserLookupDto,
} from "../../../types/laboratoryTask";

const { Text } = Typography;

interface IndicatorLocalChanges {
  unit?: string;
  result?: string;
}

interface IndicatorTableProps {
  indicators: LaboratoryTaskIndicatorDto[];
  methods: MethodLookupDto[];
  technicians: UserLookupDto[];
  isAssigned: boolean; // true khi đã giao việc (lưu DB thành công)
  localChanges: Record<string, IndicatorLocalChanges>; // local changes chưa lưu DB
  onMethodChange: (indicatorId: string, methodId: string) => void;
  onTechnicianChange: (indicatorId: string, technicianId: string) => void;
  onUnitChange: (indicatorId: string, unit: string) => void;
  onResultChange: (indicatorId: string, result: string) => void;
  onSubmitResult: (indicatorId: string) => void; // Gửi kết quả lên server
  onApprove: (indicatorId: string, approve: boolean, reason?: string) => void;
  loading?: boolean;
}

const IndicatorTable: React.FC<IndicatorTableProps> = ({
  indicators,
  methods,
  technicians,
  isAssigned,
  localChanges,
  onMethodChange,
  onTechnicianChange,
  onUnitChange,
  onResultChange,
  onSubmitResult,
  onApprove,
  loading = false,
}) => {
  // State for reject modal
  const [rejectModal, setRejectModal] = useState<{
    visible: boolean;
    indicatorId?: string;
  }>({
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

  // Validate và gửi kết quả
  const handleSubmitResult = (record: LaboratoryTaskIndicatorDto) => {
    const changes = localChanges[record.id] || {};
    const unit = changes.unit ?? record.unit;
    const result = changes.result ?? record.result;

    if (!unit?.trim()) {
      message.warning("Vui lòng nhập ĐVT trước khi gửi kết quả");
      return;
    }
    if (!result?.trim()) {
      message.warning("Vui lòng nhập Kết quả trước khi gửi");
      return;
    }

    onSubmitResult(record.id);
  };

  const columns = [
    {
      title: "Tên chỉ tiêu",
      dataIndex: "indicatorName",
      key: "indicatorName",
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
      title: "Phương pháp",
      dataIndex: "methodId",
      key: "methodId",
      width: 200,
      render: (value: string, record: LaboratoryTaskIndicatorDto) => (
        <Select
          style={{ width: "100%" }}
          size="small"
          value={value}
          placeholder="Chọn PP"
          onChange={(val) => onMethodChange(record.id, val)}
          options={(methods || []).map((m) => ({
            value: m.id,
            label: m.name,
          }))}
          disabled={
            isAssigned ||
            record.approvalStatus === IndicatorApprovalStatus.Approved
          }
          allowClear
        />
      ),
    },
    {
      title: "ĐVT",
      dataIndex: "unit",
      key: "unit",
      width: 80,
      render: (value: string, record: LaboratoryTaskIndicatorDto) => {
        const currentValue = localChanges[record.id]?.unit ?? value;
        return (
          <Input
            size="small"
            value={currentValue}
            placeholder="ĐVT"
            onChange={(e) => onUnitChange(record.id, e.target.value)}
            disabled={
              !isAssigned ||
              (record.approvalStatus !== IndicatorApprovalStatus.Pending &&
                record.approvalStatus !== IndicatorApprovalStatus.Rejected)
            }
          />
        );
      },
    },
    {
      title: "Kết quả",
      dataIndex: "result",
      key: "result",
      width: 120,
      render: (value: string, record: LaboratoryTaskIndicatorDto) => {
        const currentValue = localChanges[record.id]?.result ?? value;
        return (
          <Input
            size="small"
            value={currentValue}
            placeholder="Nhập KQ"
            onChange={(e) => onResultChange(record.id, e.target.value)}
            disabled={
              !isAssigned ||
              (record.approvalStatus !== IndicatorApprovalStatus.Pending &&
                record.approvalStatus !== IndicatorApprovalStatus.Rejected)
            }
          />
        );
      },
    },
    {
      title: "Kỹ thuật viên",
      dataIndex: "technicianId",
      key: "technicianId",
      width: 180,
      render: (value: string, record: LaboratoryTaskIndicatorDto) => (
        <Select
          style={{ width: "100%" }}
          size="small"
          value={value}
          placeholder="Chọn KTV"
          onChange={(val) => onTechnicianChange(record.id, val)}
          options={(technicians || []).map((t) => ({
            value: t.id,
            label: t.displayName || t.userName,
          }))}
          disabled={
            isAssigned ||
            record.approvalStatus === IndicatorApprovalStatus.Approved
          }
          allowClear
        />
      ),
    },
    {
      title: "Ngày nhập",
      dataIndex: "entryDate",
      key: "entryDate",
      width: 100,
      render: (date: string) => (date ? dayjs(date).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Ngày duyệt",
      dataIndex: "approvalDate",
      key: "approvalDate",
      width: 100,
      render: (date: string) => (date ? dayjs(date).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Trạng thái",
      dataIndex: "approvalStatus",
      key: "approvalStatus",
      width: 180,
      render: (
        status: IndicatorApprovalStatus,
        record: LaboratoryTaskIndicatorDto
      ) => {
        // Chưa giao việc thì không hiển thị gì
        if (!isAssigned) {
          return null;
        }

        switch (status) {
          case IndicatorApprovalStatus.Pending:
            return (
              <Button
                type="primary"
                size="small"
                icon={<SendOutlined />}
                onClick={() => handleSubmitResult(record)}
              >
                Gửi KQ
              </Button>
            );

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
                  onClick={() =>
                    setRejectModal({ visible: true, indicatorId: record.id })
                  }
                >
                  Từ chối
                </Button>
              </Space>
            );

          case IndicatorApprovalStatus.Approved:
            return (
              <Tag color={IndicatorApprovalStatusColors[status]}>
                {IndicatorApprovalStatusLabels[status]}
              </Tag>
            );

          case IndicatorApprovalStatus.Rejected:
            return (
              <Button
                type="primary"
                size="small"
                icon={<SendOutlined />}
                onClick={() => handleSubmitResult(record)}
              >
                Gửi lại KQ
              </Button>
            );

          default:
            return null;
        }
      },
    },
  ];

  // Sort indicators theo id để cố định vị trí
  const sortedIndicators = [...indicators].sort((a, b) =>
    a.id.localeCompare(b.id)
  );

  return (
    <>
      <Table
        columns={columns}
        dataSource={sortedIndicators}
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
        width={600}
        centered
        getContainer={false}
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item
            name="reason"
            label="Lý do"
            rules={[{ required: true, message: "Vui lòng nhập lý do từ chối" }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Nhập lý do từ chối kết quả..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default IndicatorTable;
