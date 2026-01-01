import React from "react";
import { Modal, Form, Select, Input } from "antd";
import { Controller, UseFormReturn } from "react-hook-form";
import { ReportFormData } from "../schemas";

interface ReportFormModalProps {
  open: boolean;
  form: UseFormReturn<ReportFormData>;
  testRequests: any[];
  specimens: any[];
  tests: any[];
  loading: boolean;
  onTestRequestChange: (testRequestId: string) => void;
  onCancel: () => void;
  onSubmit: (data: ReportFormData) => void;
}

const ReportFormModal: React.FC<ReportFormModalProps> = ({
  open,
  form,
  testRequests,
  specimens,
  tests,
  loading,
  onTestRequestChange,
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
      title="Tạo báo cáo mới"
      open={open}
      onOk={handleSubmit(onSubmit)}
      onCancel={onCancel}
      okText="Tạo báo cáo"
      cancelText="Hủy"
      confirmLoading={loading}
      width={600}
      centered
    >
      <Form layout="vertical">
        <Form.Item
          label="Yêu cầu thử nghiệm"
          required
          validateStatus={errors.testRequestId ? "error" : ""}
          help={errors.testRequestId?.message}
        >
          <Controller
            name="testRequestId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                showSearch
                placeholder="Chọn yêu cầu thử nghiệm"
                optionFilterProp="children"
                onChange={(value) => {
                  field.onChange(value);
                  onTestRequestChange(value);
                }}
                filterOption={(input, option) =>
                  (option?.children as unknown as string)
                    ?.toLowerCase()
                    .includes(input.toLowerCase())
                }
              >
                {testRequests.map((tr) => (
                  <Select.Option key={tr.id} value={tr.id}>
                    {tr.requestNumber} - {tr.customerName}
                  </Select.Option>
                ))}
              </Select>
            )}
          />
        </Form.Item>

        <Form.Item
          label="Tiêu đề báo cáo"
          required
          validateStatus={errors.title ? "error" : ""}
          help={errors.title?.message}
        >
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <Input {...field} placeholder="Nhập tiêu đề báo cáo" />
            )}
          />
        </Form.Item>

        <Form.Item
          label="Tên khách hàng"
          required
          validateStatus={errors.customerName ? "error" : ""}
          help={errors.customerName?.message}
        >
          <Controller
            name="customerName"
            control={control}
            render={({ field }) => (
              <Input {...field} placeholder="Nhập tên khách hàng" />
            )}
          />
        </Form.Item>

        {specimens.length > 0 && (
          <Form.Item label="Chọn mẫu thử">
            <Controller
              name="specimenIds"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  mode="multiple"
                  placeholder="Chọn mẫu thử để đưa vào báo cáo"
                  allowClear
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
        )}

        {tests.length > 0 && (
          <Form.Item label="Chọn phép thử">
            <Controller
              name="testIds"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  mode="multiple"
                  placeholder="Chọn phép thử để đưa vào báo cáo"
                  allowClear
                >
                  {tests.map((t) => (
                    <Select.Option key={t.id} value={t.id}>
                      {t.code} - {t.name}
                    </Select.Option>
                  ))}
                </Select>
              )}
            />
          </Form.Item>
        )}

        <Form.Item label="Ghi chú">
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                value={field.value || ""}
                rows={3}
                placeholder="Nhập ghi chú (tùy chọn)"
              />
            )}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ReportFormModal;
