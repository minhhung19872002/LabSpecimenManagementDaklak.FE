import React from "react";
import { Modal, Form, Row, Col, Select, Input, Switch, InputNumber } from "antd";
import { Controller, UseFormReturn } from "react-hook-form";
import { ResultApprovalStatus } from "../../../types/testResult";
import { TestDto } from "../../../types/test";
import { TestResultFormData } from "../schemas";
import { UNIT_OPTIONS } from "../hooks";

interface TestResultFormModalProps {
  open: boolean;
  isEditing: boolean;
  form: UseFormReturn<TestResultFormData>;
  tests: TestDto[];
  onCancel: () => void;
  onSubmit: (data: TestResultFormData) => void;
}

const TestResultFormModal: React.FC<TestResultFormModalProps> = ({
  open,
  isEditing,
  form,
  tests,
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
      title={isEditing ? "Chỉnh sửa kết quả" : "Thêm kết quả mới"}
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
              label="Phép thử"
              required
              validateStatus={errors.testId ? "error" : ""}
              help={errors.testId?.message}
            >
              <Controller
                name="testId"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    showSearch
                    optionFilterProp="children"
                    placeholder="Chọn phép thử"
                    disabled={isEditing}
                  >
                    {tests.map((test) => (
                      <Select.Option key={test.id} value={test.id}>
                        {test.code} - {test.name}
                      </Select.Option>
                    ))}
                  </Select>
                )}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Chỉ tiêu phân tích"
              required
              validateStatus={errors.parameter ? "error" : ""}
              help={errors.parameter?.message}
            >
              <Controller
                name="parameter"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="Nhập chỉ tiêu" />
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="Giá trị"
              required
              validateStatus={errors.value ? "error" : ""}
              help={errors.value?.message}
            >
              <Controller
                name="value"
                control={control}
                render={({ field }) => <Input {...field} />}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="Đơn vị"
              required
              validateStatus={errors.unit ? "error" : ""}
              help={errors.unit?.message}
            >
              <Controller
                name="unit"
                control={control}
                render={({ field }) => (
                  <Select {...field} allowClear>
                    {UNIT_OPTIONS.map((opt) => (
                      <Select.Option key={opt.value} value={opt.value}>
                        {opt.label}
                      </Select.Option>
                    ))}
                  </Select>
                )}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Giới hạn dưới">
              <Controller
                name="lowerLimit"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    {...field}
                    value={field.value ?? undefined}
                    onChange={(val) => field.onChange(val ?? null)}
                    style={{ width: "100%" }}
                    placeholder="Min"
                  />
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Giới hạn trên">
              <Controller
                name="upperLimit"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    {...field}
                    value={field.value ?? undefined}
                    onChange={(val) => field.onChange(val ?? null)}
                    style={{ width: "100%" }}
                    placeholder="Max"
                  />
                )}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Kết quả">
              <Controller
                name="isPass"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onChange={field.onChange}
                    checkedChildren="Đạt"
                    unCheckedChildren="Không đạt"
                  />
                )}
              />
            </Form.Item>
          </Col>
          {isEditing && (
            <Col span={12}>
              <Form.Item label="Trạng thái">
                <Controller
                  name="approvalStatus"
                  control={control}
                  render={({ field }) => (
                    <Select {...field}>
                      <Select.Option value={ResultApprovalStatus.Draft}>
                        Nháp
                      </Select.Option>
                      <Select.Option value={ResultApprovalStatus.Submitted}>
                        Đã nộp
                      </Select.Option>
                      <Select.Option value={ResultApprovalStatus.Step1Reviewed}>
                        Đã xem xét
                      </Select.Option>
                      <Select.Option value={ResultApprovalStatus.Step2Approved}>
                        Đã phê duyệt
                      </Select.Option>
                      <Select.Option value={ResultApprovalStatus.Rejected}>
                        Từ chối
                      </Select.Option>
                    </Select>
                  )}
                />
              </Form.Item>
            </Col>
          )}
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

export default TestResultFormModal;
