import React, { useEffect, useState } from "react";
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Avatar,
  Space,
  Typography,
  Spin,
  Row,
  Col,
} from "antd";
import { UserOutlined, SaveOutlined } from "@ant-design/icons";
import { EmployeeDto, UpdateEmployeeDto } from "../../../services/employeeService";
import { authService } from "../../../services/authService";
import { PERMISSIONS } from "../../../constants/permissionMapping";
import { Department } from "../hooks/useEmployeeList";
import { departmentService } from "../../../services/masterDataService";

const { Text, Title } = Typography;

interface UserInfoTabProps {
  employee: EmployeeDto | null;
  loading: boolean;
  saving: boolean;
  onSave: (data: UpdateEmployeeDto) => Promise<boolean>;
}

const UserInfoTab: React.FC<UserInfoTabProps> = ({
  employee,
  loading,
  saving,
  onSave,
}) => {
  const [form] = Form.useForm();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  const canEdit = authService.hasPermission(PERMISSIONS.Users.Edit);

  // Load departments
  useEffect(() => {
    const loadDepartments = async () => {
      setLoadingDepartments(true);
      try {
        const data = await departmentService.getList({ maxResultCount: 100 });
        setDepartments(data.items || []);
      } catch (error) {
        console.error("Error loading departments:", error);
      } finally {
        setLoadingDepartments(false);
      }
    };
    loadDepartments();
  }, []);

  // Initialize form with employee data
  useEffect(() => {
    if (employee) {
      form.setFieldsValue({
        fullName: employee.fullName,
        email: employee.email,
        phone: employee.phone,
        departmentId: employee.departmentId,
        position: employee.position,
      });
    }
  }, [employee, form]);

  const handleSubmit = async (values: UpdateEmployeeDto) => {
    const success = await onSave(values);
    if (success) {
      // Form values are already updated via the employee prop refresh
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!employee) {
    return null;
  }

  return (
    <Card
      style={{ borderTopLeftRadius: 0 }}
      styles={{ body: { padding: 24 } }}
    >
      <div
        style={{
          backgroundColor: "#e6f4ff",
          padding: 24,
          borderRadius: 8,
          marginBottom: 24,
        }}
      >
        <Title level={5} style={{ marginBottom: 8 }}>
          Thông tin cá nhân
        </Title>
        <Text type="secondary">
          Cập nhật thông tin định danh của bạn trên hệ thống
        </Text>
      </div>

      <Row gutter={48}>
        <Col xs={24} md={8} style={{ textAlign: "center", marginBottom: 24 }}>
          <Avatar
            size={120}
            icon={<UserOutlined />}
            style={{ backgroundColor: "#1890ff", marginBottom: 16 }}
          />
          <div>
            <Text strong style={{ fontSize: 16, display: "block" }}>
              {employee.username}
            </Text>
            <Text type="secondary">{employee.username}</Text>
          </div>
        </Col>

        <Col xs={24} md={16}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            disabled={!canEdit}
          >
            <Form.Item
              label="Họ và tên"
              name="fullName"
              rules={[{ required: true, message: "Vui lòng nhập họ và tên" }]}
            >
              <Input placeholder="Nhập họ và tên" />
            </Form.Item>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Email"
                  name="email"
                >
                  <Input disabled />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Số điện thoại" name="phone">
                  <Input placeholder="Nhập số điện thoại" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item label="Phòng ban" name="departmentId">
                  <Select
                    placeholder="Chọn phòng ban"
                    loading={loadingDepartments}
                    allowClear
                    showSearch
                    optionFilterProp="children"
                  >
                    {departments.map((dept) => (
                      <Select.Option key={dept.id} value={dept.id}>
                        {dept.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Chức vụ" name="position">
                  <Select
                    placeholder="Chọn chức vụ"
                    allowClear
                    showSearch
                    optionFilterProp="children"
                  >
                    <Select.Option value="Giám đốc">Giám đốc</Select.Option>
                    <Select.Option value="Phó Giám đốc">Phó Giám đốc</Select.Option>
                    <Select.Option value="Trưởng phòng">Trưởng phòng</Select.Option>
                    <Select.Option value="Phó phòng">Phó phòng</Select.Option>
                    <Select.Option value="Nhân viên">Nhân viên</Select.Option>
                    <Select.Option value="Thực tập sinh">Thực tập sinh</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            {canEdit && (
              <Form.Item style={{ marginTop: 16 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={saving}
                  className="gradient-primary-btn"
                >
                  Cập nhật thông tin
                </Button>
              </Form.Item>
            )}
          </Form>
        </Col>
      </Row>
    </Card>
  );
};

export default UserInfoTab;
