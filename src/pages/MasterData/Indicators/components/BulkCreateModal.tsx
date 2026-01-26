import React from "react";
import { Modal, Form, Select, Button, Row, Col, Tooltip, Card } from "antd";
import Icon from "../../../../components/common/Icon";
import { RichTextEditor } from "../../../../components/common";
import type { FormInstance } from "antd";
import "./BulkCreateModal.css";

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
  placeholder?: string;
}> = ({ value, onChange, placeholder }) => {
  return (
    <RichTextEditor
      value={value?.formattedName || ""}
      onChange={(html, plainText) => {
        onChange?.({ name: plainText, formattedName: html });
      }}
      placeholder={placeholder || "Nhập tên"}
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
      className="bulk-create-modal"
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
      width={900}
      centered
      styles={{
        body: { paddingTop: 16, maxHeight: "70vh", overflowY: "auto" },
      }}
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
          {(parentFields, { add: addParent, remove: removeParent }) => (
            <>
              <Card size="small" style={{ marginBottom: 16 }}>
                {parentFields.map(({ key: parentKey, name: parentName }) => (
                  <div
                    key={parentKey}
                    style={{
                      marginBottom:
                        parentName === parentFields.length - 1 ? 0 : 24,
                    }}
                  >
                    {/* Parent indicator row with add sub button */}
                    <Form.List name={[parentName, "subIndicators"]}>
                      {(subFields, { add: addSub, remove: removeSub }) => (
                        <>
                          <Row gutter={8} align="middle" wrap={false}>
                            <Col flex="32px">
                              <Tooltip title="Thêm chỉ tiêu phụ">
                                <Icon
                                  name="plus-lg"
                                  onClick={() =>
                                    addSub({ name: "", formattedName: "" })
                                  }
                                  style={{
                                    fontSize: 16,
                                    color: "#8C8C8C",
                                    cursor: "pointer",
                                  }}
                                />
                              </Tooltip>
                            </Col>
                            <Col flex="auto">
                              <div
                                className={`bulk-modal-parent-wrapper ${subFields.length > 0 ? "has-children" : ""}`}
                              >
                                <Form.Item
                                  name={[parentName]}
                                  rules={[
                                    {
                                      validator: (_, value) => {
                                        if (
                                          !value?.name ||
                                          value.name.trim() === ""
                                        ) {
                                          return Promise.reject(
                                            "Vui lòng nhập tên chỉ tiêu",
                                          );
                                        }
                                        return Promise.resolve();
                                      },
                                    },
                                  ]}
                                  style={{ marginBottom: 0 }}
                                >
                                  <RichTextFormItem placeholder="Nhập tên chỉ tiêu cha" />
                                </Form.Item>
                              </div>
                            </Col>
                            <Col flex="32px">
                              {parentFields.length > 1 && (
                                <Tooltip title="Xóa chỉ tiêu">
                                  <Icon
                                    name="trash3"
                                    onClick={() => removeParent(parentName)}
                                    style={{
                                      fontSize: 16,
                                      color: "#CF1322",
                                      cursor: "pointer",
                                    }}
                                  />
                                </Tooltip>
                              )}
                            </Col>
                          </Row>

                          {/* Sub-indicators box */}
                          {subFields.length > 0 && (
                            <Row gutter={8} style={{ marginTop: 12 }}>
                              <Col flex="32px" />
                              <Col flex="auto">
                                <div
                                  style={{
                                    padding: "12px 12px 12px 32px",
                                    background: "#F5F5F5",
                                    borderRadius: "12px",
                                    position: "relative",
                                  }}
                                >
                                  {subFields.map(
                                    ({ key: subKey, name: subName }, index) => (
                                      <Row
                                        key={subKey}
                                        gutter={16}
                                        align="middle"
                                        wrap={false}
                                        style={{
                                          marginBottom:
                                            index === subFields.length - 1
                                              ? 0
                                              : 12,
                                        }}
                                      >
                                        <Col flex="auto">
                                          <div
                                            className={`bulk-modal-sub-wrapper ${index === 0 ? "is-first" : ""} ${index === subFields.length - 1 ? "is-last" : ""}`}
                                          >
                                            <Form.Item
                                              name={[subName]}
                                              rules={[
                                                {
                                                  validator: (_, value) => {
                                                    if (
                                                      !value?.name ||
                                                      value.name.trim() === ""
                                                    ) {
                                                      return Promise.reject(
                                                        "Vui lòng nhập tên chỉ tiêu phụ",
                                                      );
                                                    }
                                                    return Promise.resolve();
                                                  },
                                                },
                                              ]}
                                              style={{ marginBottom: 0 }}
                                            >
                                              <RichTextFormItem placeholder="Nhập tên chỉ tiêu phụ" />
                                            </Form.Item>
                                          </div>
                                        </Col>
                                        <Col flex="32px">
                                          <Tooltip title="Xóa chỉ tiêu phụ">
                                            <Icon
                                              name="trash3"
                                              onClick={() => removeSub(subName)}
                                              style={{
                                                fontSize: 16,
                                                color: "#CF1322",
                                                cursor: "pointer",
                                              }}
                                            />
                                          </Tooltip>
                                        </Col>
                                      </Row>
                                    ),
                                  )}
                                </div>
                              </Col>
                              <Col flex="32px" />
                            </Row>
                          )}
                        </>
                      )}
                    </Form.List>
                  </div>
                ))}
              </Card>

              <Form.Item style={{ margin: "12px 0px" }}>
                <Button
                  type="default"
                  onClick={() =>
                    addParent({
                      name: "",
                      formattedName: "",
                    })
                  }
                  icon={<Icon name="plus-lg" />}
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
