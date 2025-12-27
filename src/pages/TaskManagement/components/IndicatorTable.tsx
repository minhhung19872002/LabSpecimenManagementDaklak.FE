import React, { useState, useMemo } from "react";
import {
  Table,
  Select,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Typography,
  Input,
  Tooltip,
} from "antd";
import type { TableRowSelection } from "antd/es/table/interface";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
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

interface IndicatorTableProps {
  indicators: LaboratoryTaskIndicatorDto[];
  methods: MethodLookupDto[];
  technicians: UserLookupDto[];
  isAssigned: boolean; // true khi đã giao việc (lưu DB thành công)
  canEdit: boolean; // true khi task status cho phép edit (NotAssignedTechnician hoặc AssignedTechnician)
  onMethodChange: (indicatorId: string, methodId: string) => void;
  onTechnicianChange: (indicatorId: string, technicianId: string) => void;
  onApprove: (indicatorId: string, approve: boolean, reason?: string) => void;
  loading?: boolean;
  // Bulk selection props
  showCheckbox?: boolean;
  selectedIndicatorIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

const IndicatorTable: React.FC<IndicatorTableProps> = ({
  indicators,
  methods,
  technicians,
  isAssigned,
  canEdit,
  onMethodChange,
  onTechnicianChange,
  onApprove,
  loading = false,
  showCheckbox = false,
  selectedIndicatorIds = [],
  onSelectionChange,
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

  const columns = [
    {
      title: "Tên chỉ tiêu",
      dataIndex: "indicatorName",
      key: "indicatorName",
      width: 200,
      fixed: "left" as const,
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
      render: (value: string, record: LaboratoryTaskIndicatorDto) => {
        // Phương pháp đã được chọn từ TestRequest - hiển thị dạng text, không cho sửa
        if (record.methodName) {
          return (
            <Tooltip title={record.methodName}>
              <Text
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {record.methodName}
              </Text>
            </Tooltip>
          );
        }
        // Chưa có phương pháp - hiển thị dropdown để chọn
        return (
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
              !canEdit ||
              record.approvalStatus === IndicatorApprovalStatus.Approved ||
              record.approvalStatus ===
                IndicatorApprovalStatus.CustomerCancelled
            }
            allowClear
          />
        );
      },
    },
    {
      title: "ĐVT",
      dataIndex: "unit",
      key: "unit",
      width: 120,
      render: (value: string) => {
        return <Text>{value || "-"}</Text>;
      },
    },
    {
      title: "Kết quả",
      dataIndex: "result",
      key: "result",
      width: 200,
      render: (value: string) => {
        return <Text>{value || "-"}</Text>;
      },
    },
    {
      title: "Kỹ thuật viên",
      dataIndex: "technicianId",
      key: "technicianId",
      width: 150,
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
            !canEdit ||
            record.approvalStatus === IndicatorApprovalStatus.Approved ||
            record.approvalStatus === IndicatorApprovalStatus.CustomerCancelled
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
      fixed: "right" as const,
      render: (
        status: IndicatorApprovalStatus,
        record: LaboratoryTaskIndicatorDto
      ) => {
        // Chưa giao việc thì hiển thị tag "Chưa giao việc"
        if (!isAssigned) {
          return <Tag color="default">Chưa giao việc</Tag>;
        }

        switch (status) {
          case IndicatorApprovalStatus.Pending:
            return (
              <Tag color={IndicatorApprovalStatusColors[status]}>
                {IndicatorApprovalStatusLabels[status]}
              </Tag>
            );

          case IndicatorApprovalStatus.Entered:
            return (
              <Space size="small">
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
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={() => onApprove(record.id, true)}
                >
                  Duyệt
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
              <Tag color={IndicatorApprovalStatusColors[status]}>
                {IndicatorApprovalStatusLabels[status]}
              </Tag>
            );

          case IndicatorApprovalStatus.CustomerCancelled:
            return (
              <Tag color={IndicatorApprovalStatusColors[status]}>
                {IndicatorApprovalStatusLabels[status]}
              </Tag>
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

  // Row selection configuration for bulk approval
  const rowSelection:
    | TableRowSelection<LaboratoryTaskIndicatorDto>
    | undefined = useMemo(() => {
    if (!showCheckbox || !onSelectionChange) return undefined;

    return {
      selectedRowKeys: selectedIndicatorIds,
      onChange: (selectedRowKeys: React.Key[]) => {
        onSelectionChange(selectedRowKeys as string[]);
      },
      getCheckboxProps: (record: LaboratoryTaskIndicatorDto) => ({
        // Chỉ cho phép chọn indicators có trạng thái Entered (Chờ phê duyệt) hoặc Rejected
        disabled:
          record.approvalStatus === IndicatorApprovalStatus.Approved ||
          record.approvalStatus === IndicatorApprovalStatus.CustomerCancelled ||
          record.approvalStatus === IndicatorApprovalStatus.Pending,
        name: record.id,
      }),
    };
  }, [showCheckbox, selectedIndicatorIds, onSelectionChange]);

  return (
    <>
      <Table
        columns={columns}
        dataSource={sortedIndicators}
        rowKey="id"
        pagination={false}
        size="small"
        scroll={{ x: 1400 }}
        loading={loading}
        rowSelection={rowSelection}
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
