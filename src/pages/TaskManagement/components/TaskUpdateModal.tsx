import React from "react";
import { Modal, Form, DatePicker, Input } from "antd";
import { FormInstance } from "antd/es/form";
import dayjs from "dayjs";
import { LaboratoryTaskDto } from "../../../types/laboratoryTask";

interface TaskUpdateModalProps {
  visible: boolean;
  selectedTask: LaboratoryTaskDto | null;
  form: FormInstance;
  isUpdating: boolean;
  onCancel: () => void;
  onOk: () => void;
}

const TaskUpdateModal: React.FC<TaskUpdateModalProps> = ({
  visible,
  selectedTask,
  form,
  isUpdating,
  onCancel,
  onOk,
}) => {
  const validateTestDate = (_: any, value: any) => {
    if (!value) return Promise.resolve();

    const testDate = dayjs(value);
    const transferDate = selectedTask?.transferDate
      ? dayjs(selectedTask.transferDate)
      : null;
    const requestCompletionDate = selectedTask?.requestCompletionDate
      ? dayjs(selectedTask.requestCompletionDate)
      : null;

    if (transferDate && testDate.isBefore(transferDate, "day")) {
      return Promise.reject(new Error("Ngày thí nghiệm phải >= ngày chuyển đi"));
    }
    if (requestCompletionDate && testDate.isAfter(requestCompletionDate, "day")) {
      return Promise.reject(new Error("Ngày thí nghiệm phải <= ngày yêu cầu xong"));
    }
    return Promise.resolve();
  };

  const disabledDate = (current: dayjs.Dayjs) => {
    if (!current || !selectedTask) return false;

    const transferDate = selectedTask.transferDate
      ? dayjs(selectedTask.transferDate).startOf("day")
      : null;
    const requestCompletionDate = selectedTask.requestCompletionDate
      ? dayjs(selectedTask.requestCompletionDate).endOf("day")
      : null;

    if (transferDate && current.isBefore(transferDate, "day")) {
      return true;
    }
    if (requestCompletionDate && current.isAfter(requestCompletionDate, "day")) {
      return true;
    }
    return false;
  };

  const renderDateHint = () => {
    if (!selectedTask) return null;

    const parts: string[] = [];
    if (selectedTask.transferDate) {
      parts.push(`Ngày chuyển: ${dayjs(selectedTask.transferDate).format("DD/MM/YYYY")}`);
    }
    if (selectedTask.requestCompletionDate) {
      parts.push(`Ngày YC xong: ${dayjs(selectedTask.requestCompletionDate).format("DD/MM/YYYY")}`);
    }

    return parts.length > 0 ? (
      <span style={{ fontSize: 12, color: "#888" }}>{parts.join(" - ")}</span>
    ) : null;
  };

  return (
    <Modal
      title="Cập nhật công việc"
      open={visible}
      onCancel={onCancel}
      onOk={onOk}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={isUpdating}
      width={600}
      centered
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="testDate"
          label="Ngày thí nghiệm"
          rules={[{ validator: validateTestDate }]}
          extra={renderDateHint()}
        >
          <DatePicker
            style={{ width: "100%" }}
            format="DD/MM/YYYY"
            disabledDate={disabledDate}
          />
        </Form.Item>
        <Form.Item name="notes" label="Ghi chú">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default TaskUpdateModal;
