import React from "react";
import { Checkbox, Form, Modal, Radio, Select } from "antd";
import { Controller, type UseFormReturn } from "react-hook-form";
import { foldText, type AssignServiceFormData, type AssignTarget, type GroupOption } from "./utils";

export interface AssignServiceModalProps {
  target: AssignTarget | null;
  loading: boolean;
  groupOptions: GroupOption[];
  form: UseFormReturn<AssignServiceFormData>;
  onOk: (data: AssignServiceFormData) => void;
  onCancel: () => void;
}

/**
 * Chuyển dòng cũ / dòng khai báo nhầm sang "Tên dịch vụ" khác và sửa HĐ phụ.
 * Không đổi ĐVT, giá, phương pháp, chỉ tiêu, nền mẫu.
 */
const AssignServiceModal: React.FC<AssignServiceModalProps> = ({ target, loading, groupOptions, form, onOk, onCancel }) => {
  const { control, handleSubmit } = form;
  const count = target?.serviceIds.length ?? 0;
  return (
    <Modal
      title={target?.single ? "Đổi dịch vụ / hợp đồng phụ" : "Chuyển sang dịch vụ khác"}
      open={!!target}
      onOk={handleSubmit(onOk)}
      onCancel={onCancel}
      confirmLoading={loading}
      okText="Lưu"
      cancelText="Hủy"
      width={520}
      centered
      destroyOnHidden
      styles={{ body: { paddingTop: 8 } }}
    >
      {target && (
        <p className="svc-assign-target">
          {target.title}
          {!target.single && <strong> · {count} chỉ tiêu</strong>}
        </p>
      )}
      <Form layout="vertical">
        <Form.Item label="Tên dịch vụ" required>
          <Controller
            name="serviceGroupKey"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                aria-label="Tên dịch vụ"
                showSearch={{
                  filterOption: (input, option) => !!option && option.search.includes(foldText(input.trim())),
                }}
                options={groupOptions}
                placeholder="Chọn tên dịch vụ"
              />
            )}
          />
        </Form.Item>
        <Form.Item label="Hợp đồng phụ" style={{ marginBottom: 0 }}>
          <Controller
            name="subcontract"
            control={control}
            render={({ field }) =>
              target?.single ? (
                <Checkbox
                  checked={field.value === "yes"}
                  onChange={(e) => field.onChange(e.target.checked ? "yes" : "no")}
                >
                  Có hợp đồng phụ
                </Checkbox>
              ) : (
                <Radio.Group
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  options={[
                    { value: "keep", label: "Giữ nguyên" },
                    { value: "yes", label: "Có" },
                    { value: "no", label: "Không" },
                  ]}
                />
              )
            }
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AssignServiceModal;
