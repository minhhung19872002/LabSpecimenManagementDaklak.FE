import React from "react";
import { Modal, Form, Select, Button, Row, Col, Tooltip } from "antd";
import Icon, { PlusOutlined, MinusCircleOutlined } from "../../../../components/common/Icon";
import { RichTextEditor } from "../../../../components/common";
import type { FormInstance } from "antd";

interface GroupOption {
  value: string;
  label: string;
}

interface BulkCreateModalProps {
  open: boolean;
  loading: boolean;
  form: FormInstance;
  groupOptions: GroupOption[];
  onOk: () => void;
  onCancel: () => void;
}

// Custom component to wrap RichTextEditor for Form.Item
const RichTextFormItem: React.FC<{
  value?: { name: string; formattedName: string };
  onChange?: (value: { name: string; formattedName: string }) => void;
}> = ({ value, onChange }) => {
  return (
    <RichTextEditor
      value={value?.formattedName || ""}
      onChange={(html, plainText) => {
        onChange?.({ name: plainText, formattedName: html });
      }}
      placeholder="Tên chỉ tiêu"
    />
  );
};

const BulkCreateModal: React.FC<BulkCreateModalProps> = ({
  open,
  loading,
  form,
  groupOptions,
  onOk,
  onCancel,
}) => {
  return (
    <Modal
      title={
        <span>
          Thêm nhiều chỉ tiêu{" "}
          <Tooltip
            title={
              <div>
                <div>Phím tắt định dạng:</div>
                <div>Ctrl+B: Đậm</div>
                <div>Ctrl+I: Nghiêng</div>
                <div>Ctrl+U: Gạch chân</div>
                <div>Ctrl+,: Chỉ số dưới (x₂)</div>
                <div>Ctrl+.: Chỉ số trên (x²)</div>
              </div>
            }
          >
            <span style={{ cursor: "help" }}>
              <Icon name="info-circle" style={{ color: "#8c8c8c" }} />
            </span>
          </Tooltip>
        </span>
      }
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      confirmLoading={loading}
      okText="Thêm tất cả"
      cancelText="Hủy"
      width={560}
      centered
      styles={{ body: { paddingTop: 16 } }}
      forceRender
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="indicatorGroupId"
          label="Nhóm chỉ tiêu"
          rules={[{ required: true, message: "Vui lòng chọn nhóm" }]}
        >
          <Select
            placeholder="Chọn nhóm cho tất cả chỉ tiêu"
            showSearch
            optionFilterProp="label"
            options={groupOptions}
          />
        </Form.Item>

        <Form.List name="indicators">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Row key={key} gutter={8} align="top" wrap={false}>
                  <Col flex="auto">
                    <Form.Item
                      {...restField}
                      name={name}
                      rules={[
                        {
                          validator: (_, value) => {
                            if (!value?.name || value.name.trim() === "") {
                              return Promise.reject("Nhập tên");
                            }
                            return Promise.resolve();
                          },
                        },
                      ]}
                      style={{ marginBottom: 8 }}
                    >
                      <RichTextFormItem />
                    </Form.Item>
                  </Col>
                  <Col flex="24px" style={{ paddingTop: 4 }}>
                    {fields.length > 1 && (
                      <MinusCircleOutlined
                        onClick={() => remove(name)}
                        style={{ color: "red" }}
                      />
                    )}
                  </Col>
                </Row>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add({ name: "", formattedName: "" })}
                  block
                  icon={<PlusOutlined />}
                >
                  Thêm dòng
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
};

export default BulkCreateModal;
