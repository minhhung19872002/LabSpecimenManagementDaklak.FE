import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Modal,
  Form,
  Row,
  Col,
  Select,
  Input,
  Radio,
  Checkbox,
  DatePicker,
  Typography,
  Divider,
  message,
} from "antd";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import dayjs from "dayjs";
import {
  UserOutlined,
  LockOutlined,
  PhoneOutlined,
  MailOutlined,
} from "../../../components/common/Icon";
import {
  temporaryAccessService,
  TemporaryAccessGrantDto,
  TemporaryEmployeeType,
  CreateTemporaryAccessGrantDto,
  UpdateTemporaryAccessGrantDto,
} from "../../../services/temporaryAccessService";
import { employeeService, EmployeeDto } from "../../../services/employeeService";
import { temporaryAccessSchema, updateTemporaryAccessSchema, TemporaryAccessFormData } from "../schemas/temporaryAccessSchema";

const { Text } = Typography;

const MODULE_OPTIONS = [
  { value: "PhieuYeuCau", label: "Phiếu yêu cầu" },
  { value: "QuanLyCongViec", label: "Quản lý công việc" },
  { value: "QuanLyThuNghiem", label: "Quản lý thử nghiệm" },
  { value: "QuanLyChatLuong", label: "Quản lý chất lượng" },
  { value: "QuanLyPhieuThu", label: "Quản lý phiếu thu" },
  { value: "BaoGia", label: "Báo giá" },
  { value: "QuanLyMau", label: "Quản lý mẫu" },
  { value: "BaoCao", label: "Báo cáo" },
  { value: "NCR", label: "Báo cáo NCR" },
  { value: "ThongKe", label: "Thống kê" },
  { value: "ThongKePhongLab", label: "Thống kê phòng lab" },
  { value: "NhaThauPhu", label: "Nhà thầu phụ" },
  { value: "CoSoDoanhNghiep", label: "Cơ sở/Doanh nghiệp" },
];

export interface TemporaryPermissionModalProps {
  open: boolean;
  editingGrant: TemporaryAccessGrantDto | null;
  preselectedEmployee: EmployeeDto | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const TemporaryPermissionModal: React.FC<TemporaryPermissionModalProps> = ({
  open,
  editingGrant,
  preselectedEmployee,
  onCancel,
  onSuccess,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState<EmployeeDto[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);

  const isEditing = !!editingGrant;
  const isEditingRef = useRef(isEditing);
  isEditingRef.current = isEditing;

  const {
    control,
    handleSubmit,
    watch,
    reset,
    trigger,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<TemporaryAccessFormData>({
    resolver: (values, ctx, opts) => {
      const schema = isEditingRef.current ? updateTemporaryAccessSchema : temporaryAccessSchema;
      return (yupResolver(schema) as any)(values, ctx, opts);
    },
    defaultValues: {
      employeeType: TemporaryEmployeeType.Internal,
      userId: null,
      externalUsername: null,
      externalFullName: null,
      externalPhone: null,
      externalEmail: null,
      externalPassword: null,
      externalConfirmPassword: null,
      startDate: dayjs().format("YYYY-MM-DD"),
      expiryDate: "",
      selectedModules: [],
      reason: null,
    },
  });

  const watchedEmployeeType = watch("employeeType");
  const watchedStartDate = watch("startDate");
  const isExternal = watchedEmployeeType === TemporaryEmployeeType.External;

  const loadEmployees = useCallback(async () => {
    setEmployeesLoading(true);
    try {
      const result = await employeeService.getList({ maxResultCount: 500, sorting: "FullName ASC" });
      setEmployees(result.items || []);
    } catch (error) {
      console.error("Error loading employees:", error);
    } finally {
      setEmployeesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    if (!isEditing) {
      loadEmployees();
      reset({
        employeeType: TemporaryEmployeeType.Internal,
        userId: preselectedEmployee?.id || null,
        externalUsername: null,
        externalFullName: null,
        externalPhone: null,
        externalEmail: null,
        externalPassword: null,
        externalConfirmPassword: null,
        startDate: dayjs().format("YYYY-MM-DD"),
        expiryDate: "",
        selectedModules: [],
        reason: null,
      });
    } else if (editingGrant) {
      reset({
        employeeType: editingGrant.employeeType,
        userId: editingGrant.userId || null,
        externalUsername: null,
        externalFullName: null,
        externalPhone: null,
        externalPassword: null,
        externalConfirmPassword: null,
        startDate: editingGrant.startDate.split("T")[0],
        expiryDate: editingGrant.expiryDate.split("T")[0],
        selectedModules: editingGrant.selectedModules || [],
        reason: editingGrant.reason || null,
      });
      // Show validation error immediately if expiryDate is in the past
      trigger("expiryDate");
    }
  }, [open, isEditing, editingGrant, preselectedEmployee, reset, trigger, loadEmployees]);

  const onSubmit = async (data: TemporaryAccessFormData) => {
    setSubmitting(true);
    try {
      if (isEditing && editingGrant) {
        const updateDto: UpdateTemporaryAccessGrantDto = {
          startDate: data.startDate,
          expiryDate: data.expiryDate,
          selectedModules: data.selectedModules,
          reason: data.reason || undefined,
        };
        await temporaryAccessService.update(editingGrant.id, updateDto);
        message.success("Đã cập nhật lịch trực");
      } else {
        const createDto: CreateTemporaryAccessGrantDto =
          data.employeeType === TemporaryEmployeeType.Internal
            ? {
                employeeType: data.employeeType,
                userId: data.userId!,
                startDate: data.startDate,
                expiryDate: data.expiryDate,
                selectedModules: data.selectedModules,
                reason: data.reason || undefined,
              }
            : {
                employeeType: data.employeeType,
                externalUsername: data.externalUsername!,
                externalFullName: data.externalFullName!,
                externalPhone: data.externalPhone || undefined,
                externalEmail: data.externalEmail || undefined,
                externalPassword: data.externalPassword!,
                externalConfirmPassword: data.externalConfirmPassword!,
                startDate: data.startDate,
                expiryDate: data.expiryDate,
                selectedModules: data.selectedModules,
                reason: data.reason || undefined,
              };
        await temporaryAccessService.create(createDto);
        message.success("Đã cấp quyền tạm thời thành công");
      }
      onSuccess();
    } catch (error: unknown) {
      console.error("Error saving temporary access grant:", error);
      let errorMessage = "Không thể lưu. Vui lòng thử lại.";
      if (error && typeof error === "object" && "response" in error) {
        const resp = (error as { response?: { data?: { message?: string } } }).response;
        if (resp?.data?.message) errorMessage = resp.data.message;
      }
      message.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const modalTitle = isEditing
    ? `Chỉnh sửa lịch trực — ${editingGrant?.employeeFullName}`
    : "Cấp quyền tạm thời";

  return (
    <Modal
      title={modalTitle}
      open={open}
      onOk={handleSubmit(onSubmit)}
      onCancel={onCancel}
      okText={isEditing ? "Cập nhật" : "Cấp quyền"}
      cancelText="Hủy"
      confirmLoading={submitting}
      centered
      width={760}
      styles={{
        body: {
          maxHeight: "calc(100vh - 220px)",
          overflowY: "auto",
          overflowX: "hidden",
        },
      }}
    >
      <Form layout="vertical">
        {/* Employee Type radio — create only, locked when pre-selected */}
        {!isEditing && (
          <Form.Item label="Loại nhân viên" required style={{ marginBottom: 16 }}>
            <Controller
              name="employeeType"
              control={control}
              render={({ field }) => (
                <Radio.Group {...field} disabled={!!preselectedEmployee}>
                  <Radio value={TemporaryEmployeeType.Internal}>Nhân viên nội bộ</Radio>
                  <Radio value={TemporaryEmployeeType.External}>Nhân viên thuê ngoài</Radio>
                </Radio.Group>
              )}
            />
          </Form.Item>
        )}

        {/* Internal: pre-selected employee (read-only) or selector */}
        {!isEditing && !isExternal && (
          preselectedEmployee ? (
            <div
              style={{
                background: "#f0f5ff",
                padding: "10px 14px",
                borderRadius: 8,
                marginBottom: 16,
                border: "1px solid #adc6ff",
              }}
            >
              <Text type="secondary" style={{ fontSize: 12 }}>Nhân viên</Text>
              <div style={{ fontWeight: 500, marginTop: 2 }}>{preselectedEmployee.fullName}</div>
              {preselectedEmployee.email && (
                <div style={{ color: "#666", fontSize: 13 }}>{preselectedEmployee.email}</div>
              )}
            </div>
          ) : (
            <Form.Item
              label="Nhân viên"
              required
              validateStatus={errors.userId ? "error" : ""}
              help={errors.userId?.message}
            >
              <Controller
                name="userId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || undefined}
                    onChange={field.onChange}
                    placeholder="Tìm và chọn nhân viên"
                    showSearch
                    optionFilterProp="label"
                    loading={employeesLoading}
                    style={{ width: "100%" }}
                    options={employees.map((e) => ({
                      value: e.id,
                      label: `${e.fullName}${e.email ? ` (${e.email})` : ""}`,
                    }))}
                  />
                )}
              />
            </Form.Item>
          )
        )}

        {/* External: account fields */}
        {!isEditing && isExternal && (
          <>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Tên đăng nhập"
                  required
                  validateStatus={errors.externalUsername ? "error" : ""}
                  help={errors.externalUsername?.message}
                >
                  <Controller
                    name="externalUsername"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={field.value || ""}
                        prefix={<UserOutlined />}
                        placeholder="nguyen.van.a"
                      />
                    )}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Họ và tên"
                  required
                  validateStatus={errors.externalFullName ? "error" : ""}
                  help={errors.externalFullName?.message}
                >
                  <Controller
                    name="externalFullName"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder="Nguyễn Văn A"
                      />
                    )}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Số điện thoại">
                  <Controller
                    name="externalPhone"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={field.value || ""}
                        prefix={<PhoneOutlined />}
                        placeholder="0905123456"
                      />
                    )}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Email"
                  validateStatus={errors.externalEmail ? "error" : ""}
                  help={errors.externalEmail?.message}
                >
                  <Controller
                    name="externalEmail"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={field.value || ""}
                        prefix={<MailOutlined />}
                        placeholder="example@email.com"
                      />
                    )}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Mật khẩu"
                  required
                  validateStatus={errors.externalPassword ? "error" : ""}
                  help={errors.externalPassword?.message}
                >
                  <Controller
                    name="externalPassword"
                    control={control}
                    render={({ field }) => (
                      <Input.Password
                        {...field}
                        value={field.value || ""}
                        prefix={<LockOutlined />}
                        placeholder="Nhập mật khẩu"
                        autoComplete="new-password"
                      />
                    )}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Xác nhận mật khẩu"
                  required
                  validateStatus={errors.externalConfirmPassword ? "error" : ""}
                  help={errors.externalConfirmPassword?.message}
                >
                  <Controller
                    name="externalConfirmPassword"
                    control={control}
                    render={({ field }) => (
                      <Input.Password
                        {...field}
                        value={field.value || ""}
                        prefix={<LockOutlined />}
                        placeholder="Xác nhận mật khẩu"
                      />
                    )}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 16 }}>
              Mật khẩu phải có ít nhất 6 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
            </Text>
          </>
        )}

        {/* Edit mode: read-only employee info */}
        {isEditing && editingGrant && (
          <div
            style={{
              background: "#fafafa",
              padding: "10px 14px",
              borderRadius: 8,
              marginBottom: 16,
              border: "1px solid #f0f0f0",
            }}
          >
            <Text type="secondary" style={{ fontSize: 12 }}>Nhân viên</Text>
            <div style={{ fontWeight: 500, marginTop: 2 }}>{editingGrant.employeeFullName}</div>
            {editingGrant.employeeEmail && (
              <div style={{ color: "#666", fontSize: 13 }}>{editingGrant.employeeEmail}</div>
            )}
          </div>
        )}

        <Divider style={{ margin: "8px 0 16px" }} />

        {/* Date range */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Ngày phân công"
              required
              validateStatus={errors.startDate ? "error" : ""}
              help={errors.startDate?.message}
            >
              <Controller
                name="startDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(date) => {
                      const newStart = date ? date.format("YYYY-MM-DD") : "";
                      field.onChange(newStart);
                      const currentExpiry = getValues("expiryDate");
                      if (newStart && currentExpiry && currentExpiry < newStart) {
                        setValue("expiryDate", "");
                      }
                    }}
                    format="DD/MM/YYYY"
                    placeholder="Chọn ngày phân công"
                    style={{ width: "100%" }}
                    allowClear={!isEditing}
                    disabledDate={(current) => current < dayjs().startOf("day")}
                  />
                )}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Ngày hết hạn"
              required
              validateStatus={errors.expiryDate ? "error" : ""}
              help={errors.expiryDate?.message}
            >
              <Controller
                name="expiryDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(date) => field.onChange(date ? date.format("YYYY-MM-DD") : "")}
                    format="DD/MM/YYYY"
                    placeholder="Chọn ngày hết hạn"
                    style={{ width: "100%" }}
                    allowClear={!isEditing}
                    disabledDate={(current) => {
                      const today = dayjs().startOf("day");
                      if (current < today) return true;
                      return watchedStartDate ? current < dayjs(watchedStartDate).startOf("day") : false;
                    }}
                  />
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Module checkboxes */}
        <Form.Item
          label="Nhóm quyền"
          required
          validateStatus={errors.selectedModules ? "error" : ""}
          help={errors.selectedModules?.message as string | undefined}
        >
          <div
            style={{
              border: "1px solid #d9d9d9",
              borderRadius: 8,
              padding: "12px 16px",
              background: "#fafafa",
            }}
          >
            <Controller
              name="selectedModules"
              control={control}
              render={({ field }) => (
                <Checkbox.Group
                  value={field.value}
                  onChange={field.onChange}
                  style={{ width: "100%" }}
                >
                  <Row gutter={[8, 10]}>
                    {MODULE_OPTIONS.map((mod) => (
                      <Col span={8} key={mod.value}>
                        <Checkbox value={mod.value}>{mod.label}</Checkbox>
                      </Col>
                    ))}
                  </Row>
                </Checkbox.Group>
              )}
            />
          </div>
        </Form.Item>

        {/* Reason */}
        <Form.Item label="Lý do">
          <Controller
            name="reason"
            control={control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                value={field.value || ""}
                rows={3}
                placeholder="Nhập lý do cấp quyền tạm thời..."
              />
            )}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default TemporaryPermissionModal;
