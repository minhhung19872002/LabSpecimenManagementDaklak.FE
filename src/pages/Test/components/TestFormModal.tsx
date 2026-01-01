import React from "react";
import { Modal, Form, Row, Col, Select, DatePicker, Input } from "antd";
import { Controller, UseFormReturn } from "react-hook-form";
import dayjs from "dayjs";
import { TestStatus } from "../../../types/test";
import { UserLookupDto } from "../../../services/userService";
import { TestFormData } from "../schemas";

interface TestFormModalProps {
  open: boolean;
  isEditing: boolean;
  form: UseFormReturn<TestFormData>;
  specimens: { id: string; code: string; name: string }[];
  testMethods: { id: string; code: string; name: string; standard?: string }[];
  standards: string[];
  users: UserLookupDto[];
  onCancel: () => void;
  onSubmit: (data: TestFormData) => void;
}

const TestFormModal: React.FC<TestFormModalProps> = ({
  open,
  isEditing,
  form,
  specimens,
  testMethods,
  standards,
  users,
  onCancel,
  onSubmit,
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <Modal
      title={isEditing ? "Chỉnh sửa phép thử" : "Thêm phép thử mới"}
      open={open}
      onOk={handleSubmit(onSubmit)}
      onCancel={onCancel}
      width={700}
      okText={isEditing ? "Cập nhật" : "Thêm mới"}
      cancelText="Hủy"
      centered
    >
      <Form layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Mã phép thử"
              required
              validateStatus={errors.code ? "error" : ""}
              help={errors.code?.message}
            >
              <Controller
                name="code"
                control={control}
                render={({ field }) => <Input {...field} disabled />}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Mẫu thử"
              required
              validateStatus={errors.specimenId ? "error" : ""}
              help={errors.specimenId?.message}
            >
              <Controller
                name="specimenId"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    showSearch
                    optionFilterProp="children"
                    placeholder="Chọn mẫu thử"
                  >
                    {specimens.map((s) => (
                      <Select.Option key={s.id} value={s.id}>
                        {s.code} - {s.name}
                      </Select.Option>
                    ))}
                  </Select>
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="Tên phép thử"
              required
              validateStatus={errors.name ? "error" : ""}
              help={errors.name?.message}
            >
              <Controller
                name="name"
                control={control}
                render={({ field }) => <Input {...field} />}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Phương pháp thử"
              required
              validateStatus={errors.method ? "error" : ""}
              help={errors.method?.message}
            >
              <Controller
                name="method"
                control={control}
                render={({ field }) => (
                  <Select {...field} showSearch optionFilterProp="children">
                    {testMethods.map((m) => (
                      <Select.Option key={m.id} value={m.name}>
                        {m.code} - {m.name}
                      </Select.Option>
                    ))}
                  </Select>
                )}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Tiêu chuẩn áp dụng"
              required
              validateStatus={errors.standard ? "error" : ""}
              help={errors.standard?.message}
            >
              <Controller
                name="standard"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    showSearch
                    optionFilterProp="children"
                    placeholder="Chọn tiêu chuẩn"
                  >
                    {standards.map((s) => (
                      <Select.Option key={s} value={s}>
                        {s}
                      </Select.Option>
                    ))}
                  </Select>
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Người thực hiện">
              <Controller
                name="assigneeId"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    value={field.value || undefined}
                    placeholder="Chọn người thực hiện"
                    showSearch
                    allowClear
                    optionFilterProp="children"
                  >
                    {users.map((user) => (
                      <Select.Option key={user.id} value={user.id}>
                        {user.displayName}
                      </Select.Option>
                    ))}
                  </Select>
                )}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Trạng thái">
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select {...field}>
                    <Select.Option value={TestStatus.Pending}>
                      Chờ xử lý
                    </Select.Option>
                    <Select.Option value={TestStatus.Assigned}>
                      Đã giao
                    </Select.Option>
                    <Select.Option value={TestStatus.InProgress}>
                      Đang thực hiện
                    </Select.Option>
                    <Select.Option value={TestStatus.Completed}>
                      Hoàn thành
                    </Select.Option>
                    <Select.Option value={TestStatus.Reviewed}>
                      Đã xem xét
                    </Select.Option>
                    <Select.Option value={TestStatus.Approved}>
                      Đã phê duyệt
                    </Select.Option>
                  </Select>
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Ngày bắt đầu">
              <Controller
                name="startDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    style={{ width: "100%" }}
                    format="DD/MM/YYYY"
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(date) => field.onChange(date?.toDate() || null)}
                  />
                )}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Ngày hoàn thành">
              <Controller
                name="completionDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    style={{ width: "100%" }}
                    format="DD/MM/YYYY"
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(date) => field.onChange(date?.toDate() || null)}
                  />
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Ghi chú">
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <Input.TextArea {...field} value={field.value || ""} rows={3} />
            )}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default TestFormModal;
