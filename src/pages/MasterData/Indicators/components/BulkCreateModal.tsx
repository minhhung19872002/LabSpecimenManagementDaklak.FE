import React from "react";
import { Modal, Form, Input, Select, Button, Row, Col } from "antd";
import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";
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
      title="Thêm nhiều chỉ tiêu"
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
                <Row key={key} gutter={8} align="middle" wrap={false}>
                  <Col flex="auto">
                    <Form.Item
                      {...restField}
                      name={[name, "name"]}
                      rules={[
                        {
                          required: true,
                          message: "Nhập tên",
                        },
                      ]}
                      style={{ marginBottom: 8 }}
                    >
                      <Input placeholder="Tên chỉ tiêu" />
                    </Form.Item>
                  </Col>
                  <Col flex="24px">
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
                  onClick={() => add({ name: "" })}
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
