import React from "react";
import {
  Modal,
  Form,
  Row,
  Col,
  Select,
  DatePicker,
  InputNumber,
  Input,
} from "antd";
import { Controller, UseFormReturn } from "react-hook-form";
import dayjs from "dayjs";
import { SpecimenStatus } from "../../../types/specimenHistory";
import { UserLookupDto } from "../../../services/userService";
import { SpecimenHistoryFormData } from "../schemas";
import { ACTION_OPTIONS } from "../hooks/useSpecimenHistoryList";

interface SpecimenHistoryFormModalProps {
  open: boolean;
  isEditing: boolean;
  form: UseFormReturn<SpecimenHistoryFormData>;
  specimens: { id: string; code: string; name: string }[];
  storageLocations: { id: string; code: string; name: string }[];
  users: UserLookupDto[];
  onCancel: () => void;
  onSubmit: (data: SpecimenHistoryFormData) => void;
}

const SpecimenHistoryFormModal: React.FC<SpecimenHistoryFormModalProps> = ({
  open,
  isEditing,
  form,
  specimens,
  storageLocations,
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
      title={isEditing ? "Chỉnh sửa lịch sử" : "Thêm lịch sử mẫu"}
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
                    placeholder="Chọn mẫu"
                    showSearch
                    optionFilterProp="children"
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
          <Col span={12}>
            <Form.Item label="Thời gian thực hiện">
              <Controller
                name="timestamp"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    showTime
                    style={{ width: "100%" }}
                    format="DD/MM/YYYY HH:mm"
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(date) => field.onChange(date?.toDate() || null)}
                  />
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Hành động"
              required
              validateStatus={errors.action ? "error" : ""}
              help={errors.action?.message}
            >
              <Controller
                name="action"
                control={control}
                render={({ field }) => (
                  <Select {...field} placeholder="Chọn hành động">
                    {ACTION_OPTIONS.map((a) => (
                      <Select.Option key={a} value={a}>
                        {a}
                      </Select.Option>
                    ))}
                  </Select>
                )}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Vị trí"
              required
              validateStatus={errors.location ? "error" : ""}
              help={errors.location?.message}
            >
              <Controller
                name="location"
                control={control}
                render={({ field }) => (
                  <Select {...field} showSearch optionFilterProp="children">
                    <Select.Option value="Quầy tiếp nhận">
                      Quầy tiếp nhận
                    </Select.Option>
                    {storageLocations.map((l) => (
                      <Select.Option key={l.id} value={l.name}>
                        {l.code} - {l.name}
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
            <Form.Item label="Trạng thái mẫu">
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select {...field}>
                    <Select.Option value={SpecimenStatus.Received}>
                      Đã nhận
                    </Select.Option>
                    <Select.Option value={SpecimenStatus.Testing}>
                      Đang thử nghiệm
                    </Select.Option>
                    <Select.Option value={SpecimenStatus.Storage}>
                      Lưu kho
                    </Select.Option>
                    <Select.Option value={SpecimenStatus.Disposal}>
                      Chờ hủy
                    </Select.Option>
                    <Select.Option value={SpecimenStatus.Destroyed}>
                      Đã hủy
                    </Select.Option>
                    <Select.Option value={SpecimenStatus.ReturnedToCustomer}>
                      Đã trả khách
                    </Select.Option>
                  </Select>
                )}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Người thực hiện">
              <Controller
                name="performedById"
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
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Nhiệt độ (°C)">
              <Controller
                name="temperature"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    {...field}
                    value={field.value ?? undefined}
                    style={{ width: "100%" }}
                    placeholder="VD: 25.5"
                    step={0.1}
                    precision={1}
                  />
                )}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Độ ẩm (%)"
              validateStatus={errors.humidity ? "error" : ""}
              help={errors.humidity?.message}
            >
              <Controller
                name="humidity"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    {...field}
                    value={field.value ?? undefined}
                    style={{ width: "100%" }}
                    placeholder="VD: 65"
                    min={0}
                    max={100}
                    step={1}
                    precision={1}
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

export default SpecimenHistoryFormModal;
