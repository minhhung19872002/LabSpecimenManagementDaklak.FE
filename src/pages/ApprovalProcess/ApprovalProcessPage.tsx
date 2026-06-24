import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Select,
  Tag,
  Space,
  message,
  Popconfirm,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  StopOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import approvalProcessService, {
  ApprovalProcessDto,
  CreateUpdateApprovalProcessDto,
  ApprovalProcessType,
  ApprovalScope,
} from "../../services/approvalProcessService";
import employeeService, { EmployeeDto } from "../../services/employeeService";
import authService from "../../services/authService";
import { PERMISSIONS } from "../../constants/permissionMapping";
import { getApiErrorMessage } from "../../utils/errorHandler";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

const PROCESS_TYPE_LABELS: Record<number, string> = {
  [ApprovalProcessType.PurchaseOrder]: "Dự trù và Đặt hàng",
};

const SCOPE_LABELS: Record<number, string> = {
  [ApprovalScope.SystemWide]: "Toàn hệ thống",
};

const ApprovalProcessPage: React.FC = () => {
  const [data, setData] = useState<ApprovalProcessDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<EmployeeDto[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ApprovalProcessDto | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const canCreate = authService.hasPermission(PERMISSIONS.ApprovalProcesses.Create);
  const canEdit = authService.hasPermission(PERMISSIONS.ApprovalProcesses.Edit);
  const canDelete = authService.hasPermission(PERMISSIONS.ApprovalProcesses.Delete);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await approvalProcessService.getList({ maxResultCount: 100 });
      setData(result.items || []);
    } catch (error) {
      message.error(getApiErrorMessage(error, "Không thể tải danh sách quy trình phê duyệt"));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadEmployees = useCallback(async () => {
    try {
      const result = await employeeService.getList({ maxResultCount: 1000, isActive: true });
      setEmployees(result.items || []);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    loadData();
    loadEmployees();
  }, [loadData, loadEmployees]);

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({
      processType: ApprovalProcessType.PurchaseOrder,
      scope: ApprovalScope.SystemWide,
      approver1Id: undefined,
      approver2Id: undefined,
    });
    setModalOpen(true);
  };

  const handleEdit = (record: ApprovalProcessDto) => {
    setEditingItem(record);
    form.resetFields();
    const sorted = [...record.steps].sort((a, b) => a.stepOrder - b.stepOrder);
    form.setFieldsValue({
      processType: record.processType,
      scope: record.scope,
      approver1Id: sorted[0]?.approverId,
      approver2Id: sorted[1]?.approverId,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await approvalProcessService.delete(id);
      message.success("Đã xóa quy trình phê duyệt");
      loadData();
    } catch (error) {
      message.error(getApiErrorMessage(error, "Không thể xóa quy trình phê duyệt"));
    }
  };

  const handleToggleActive = async (record: ApprovalProcessDto) => {
    try {
      await approvalProcessService.toggleActive(record.id);
      message.success(
        record.isActive ? "Đã ngừng hoạt động quy trình" : "Đã kích hoạt quy trình"
      );
      loadData();
    } catch (error) {
      message.error(getApiErrorMessage(error, "Không thể thay đổi trạng thái quy trình"));
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (values.approver2Id && values.approver1Id === values.approver2Id) {
        message.error("Không được chọn cùng một người duyệt cho cả 2 cấp.");
        return;
      }

      const steps: { stepOrder: number; approverId: string; approverName: string }[] = [];
      const emp1 = employees.find((e) => e.id === values.approver1Id);
      steps.push({ stepOrder: 0, approverId: values.approver1Id, approverName: emp1?.fullName || "" });

      if (values.approver2Id) {
        const emp2 = employees.find((e) => e.id === values.approver2Id);
        steps.push({ stepOrder: 1, approverId: values.approver2Id, approverName: emp2?.fullName || "" });
      }

      const payload: CreateUpdateApprovalProcessDto = {
        processType: values.processType,
        scope: values.scope,
        steps,
      };

      if (editingItem) {
        await approvalProcessService.update(editingItem.id, payload);
        message.success("Đã cập nhật quy trình phê duyệt");
      } else {
        await approvalProcessService.create(payload);
        message.success("Đã tạo quy trình phê duyệt");
      }

      setModalOpen(false);
      loadData();
    } catch (error: any) {
      if (error?.errorFields) {
        // form validation error — ignore
      } else {
        message.error(getApiErrorMessage(error, "Có lỗi xảy ra"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const employeeOptions = employees.map((e) => ({
    value: e.id,
    label: e.fullName,
  }));

  const columns: ColumnsType<ApprovalProcessDto> = [
    {
      title: "Loại quy trình",
      dataIndex: "processType",
      key: "processType",
      render: (val: number) => PROCESS_TYPE_LABELS[val] || val,
    },
    {
      title: "Phạm vi áp dụng",
      dataIndex: "scope",
      key: "scope",
      render: (val: number) => SCOPE_LABELS[val] || val,
    },
    {
      title: "Người duyệt cấp 1",
      key: "approver1",
      render: (_: unknown, record: ApprovalProcessDto) => {
        const step = record.steps.find((s) => s.stepOrder === 0);
        return step?.approverName || "-";
      },
    },
    {
      title: "Người duyệt cấp 2",
      key: "approver2",
      render: (_: unknown, record: ApprovalProcessDto) => {
        const step = record.steps.find((s) => s.stepOrder === 1);
        return step?.approverName || "-";
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      width: 120,
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Hoạt động" : "Ngừng"}
        </Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "creationTime",
      key: "creationTime",
      render: (val: string) => dayjs(val).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 150,
      render: (_: unknown, record: ApprovalProcessDto) => (
        <Space size="small">
          {canEdit && (
            <Tooltip title={record.isActive ? "Tắt hoạt động" : "Bật hoạt động"}>
              <Button
                type="link"
                size="small"
                icon={record.isActive ? <StopOutlined /> : <CheckCircleOutlined />}
                onClick={() => handleToggleActive(record)}
              />
            </Tooltip>
          )}
          {canEdit && (
            <Tooltip title="Sửa">
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
          )}
          {canDelete && (
            <Popconfirm
              title="Xác nhận xóa quy trình này?"
              onConfirm={() => handleDelete(record.id)}
              okText="Xóa"
              cancelText="Hủy"
            >
              <Tooltip title="Xóa">
                <Button type="link" size="small" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Quy trình phê duyệt"
      extra={
        canCreate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Thêm mới quy trình
          </Button>
        )
      }
    >
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={false}
      />

      <Modal
        title={editingItem ? "Chỉnh sửa quy trình phê duyệt" : "Thêm mới quy trình phê duyệt"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        okText={editingItem ? "Cập nhật" : "Tạo mới"}
        cancelText="Hủy"
        destroyOnClose
        centered
        maskClosable={false}
        width={650}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="processType"
            label="Loại quy trình"
            rules={[{ required: true, message: "Vui lòng chọn loại quy trình" }]}
          >
            <Select
              options={[
                { value: ApprovalProcessType.PurchaseOrder, label: "Dự trù và Đặt hàng" },
              ]}
              disabled={!!editingItem}
            />
          </Form.Item>

          <Form.Item
            name="scope"
            label="Phạm vi áp dụng"
            rules={[{ required: true, message: "Vui lòng chọn phạm vi" }]}
          >
            <Select
              options={[
                { value: ApprovalScope.SystemWide, label: "Toàn hệ thống" },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="approver1Id"
            label="Người duyệt cấp 1"
            rules={[{ required: true, message: "Vui lòng chọn người duyệt cấp 1" }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Chọn nhân viên"
              options={employeeOptions}
              allowClear
            />
          </Form.Item>

          <Form.Item
            name="approver2Id"
            label="Người duyệt cấp 2"
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Chọn nhân viên (không bắt buộc)"
              options={employeeOptions}
              allowClear
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default ApprovalProcessPage;
