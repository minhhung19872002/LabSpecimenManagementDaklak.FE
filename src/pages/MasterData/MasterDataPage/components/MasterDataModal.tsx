import React from "react";
import { Modal, Form, Input, Select, Row, Col } from "antd";
import type { FormInstance } from "antd";
import { MasterDataItem, UserLookupDto } from "../types";
import { categoryLabels } from "../constants";

interface MasterDataModalProps {
  open: boolean;
  loading: boolean;
  activeCategory: string;
  editingItem: MasterDataItem | null;
  form: FormInstance;
  users: UserLookupDto[];
  departments: MasterDataItem[];
  onOk: () => void;
  onCancel: () => void;
}

const MasterDataModal: React.FC<MasterDataModalProps> = ({
  open,
  loading,
  activeCategory,
  editingItem,
  form,
  users,
  departments,
  onOk,
  onCancel,
}) => {
  return (
    <Modal
      title={
        editingItem
          ? `Chỉnh sửa ${categoryLabels[activeCategory]}`
          : `Thêm ${categoryLabels[activeCategory]} mới`
      }
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      width={600}
      okText={editingItem ? "Cập nhật" : "Thêm mới"}
      cancelText="Hủy"
      centered
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical">
        {activeCategory !== "customers" && activeCategory !== "laboratories" && (
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="code"
                label="Mã"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập mã",
                  },
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item
                name="name"
                label="Tên"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập tên",
                  },
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
        )}
        {activeCategory === "customers" && (
          <>
            <Form.Item
              name="name"
              label="Tên khách hàng"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập tên khách hàng",
                },
              ]}
            >
              <Input />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="phone" label="Điện thoại">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    {
                      type: "email",
                      message: "Email không hợp lệ",
                    },
                  ]}
                >
                  <Input />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="address" label="Địa chỉ">
              <Input.TextArea rows={2} />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="taxCode" label="Mã số thuế">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="contactPerson" label="Người liên hệ">
                  <Input />
                </Form.Item>
              </Col>
            </Row>
          </>
        )}
        {activeCategory !== "customers" &&
          activeCategory !== "laboratories" && (
            <>
              <Form.Item name="description" label="Mô tả">
                <Input.TextArea rows={3} />
              </Form.Item>
              {activeCategory === "storageLocations" && (
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item name="temperature" label="Nhiệt độ">
                      <Input placeholder="VD: 2-8°C" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="humidity" label="Độ ẩm">
                      <Input placeholder="VD: 60-70%" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="capacity" label="Sức chứa">
                      <Input type="number" />
                    </Form.Item>
                  </Col>
                </Row>
              )}
              {activeCategory === "testMethods" && (
                <Form.Item name="standard" label="Tiêu chuẩn">
                  <Input placeholder="VD: TCVN 6663-6:2008" />
                </Form.Item>
              )}
              <Row gutter={16}>
                {activeCategory !== "specimenTypes" && (
                  <Col span={12}>
                    <Form.Item name="sortOrder" label="Thứ tự sắp xếp">
                      <Input type="number" />
                    </Form.Item>
                  </Col>
                )}
                <Col span={activeCategory === "specimenTypes" ? 24 : 12}>
                  <Form.Item name="isActive" label="Trạng thái">
                    <Select>
                      <Select.Option value={true}>Hoạt động</Select.Option>
                      <Select.Option value={false}>Ngừng</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}
        {activeCategory === "laboratories" && (
          <>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="code"
                  label="Mã"
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng nhập mã",
                    },
                  ]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={16}>
                <Form.Item
                  name="departmentId"
                  label="Phòng ban"
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng chọn phòng ban",
                    },
                  ]}
                >
                  <Select
                    showSearch
                    placeholder="Chọn phòng ban"
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      (option?.children as unknown as string)
                        ?.toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  >
                    {departments
                      .filter((d) => d.isActive)
                      .map((dept) => (
                        <Select.Option key={dept.id} value={dept.id}>
                          {dept.name}
                        </Select.Option>
                      ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="technicalManagerId" label="Quản lý kỹ thuật">
              <Select
                showSearch
                allowClear
                placeholder="Chọn quản lý kỹ thuật"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.children as unknown as string)
                    ?.toLowerCase()
                    .includes(input.toLowerCase())
                }
              >
                {users.map((user) => (
                  <Select.Option key={user.id} value={user.id}>
                    {user.displayName}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="isActive" label="Trạng thái">
              <Select>
                <Select.Option value={true}>Hoạt động</Select.Option>
                <Select.Option value={false}>Ngừng</Select.Option>
              </Select>
            </Form.Item>
          </>
        )}
        {activeCategory === "customers" && (
          <Form.Item name="isActive" label="Trạng thái">
            <Select>
              <Select.Option value={true}>Hoạt động</Select.Option>
              <Select.Option value={false}>Ngừng</Select.Option>
            </Select>
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

export default MasterDataModal;
