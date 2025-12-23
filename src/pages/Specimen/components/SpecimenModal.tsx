import React from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Row,
  Col,
  Card,
  Button,
} from "antd";
import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";
import { SpecimenDto } from "../../../types/specimen";
import {
  SPECIMEN_STATUS_CONFIG,
  UNIT_OPTIONS,
  STORAGE_CONDITION_OPTIONS,
} from "../constants";

interface SpecimenModalProps {
  open: boolean;
  editingItem: SpecimenDto | null;
  form: any;
  loading: boolean;
  specimenTypes: string[];
  storageLocations: any[];
  testRequests: any[];
  onOk: () => void;
  onCancel: () => void;
  onAddSpecimen: () => void;
}

const SpecimenModal: React.FC<SpecimenModalProps> = ({
  open,
  editingItem,
  form,
  loading,
  specimenTypes,
  storageLocations,
  testRequests,
  onOk,
  onCancel,
  onAddSpecimen,
}) => {
  return (
    <Modal
      title={editingItem ? "Chỉnh sửa mẫu" : "Thêm mẫu mới"}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      width={900}
      okText={editingItem ? "Cập nhật" : "Thêm mẫu"}
      cancelText="Hủy"
      centered
      confirmLoading={loading}
      styles={{ body: { maxHeight: "70vh", overflowY: "auto" } }}
    >
      <Form form={form} layout="vertical">
        {/* Số yêu cầu thử nghiệm - Dropdown chung cho tất cả mẫu */}
        <Form.Item
          name="testRequestId"
          label="Số yêu cầu thử nghiệm"
          rules={[{ required: true, message: "Vui lòng chọn phiếu yêu cầu" }]}
        >
          <Select
            placeholder="Chọn phiếu yêu cầu thử nghiệm"
            showSearch
            optionFilterProp="children"
            allowClear
          >
            {testRequests.map((tr) => (
              <Select.Option key={tr.id} value={tr.id}>
                {tr.requestNumber} - {tr.customerName}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {/* Danh sách mẫu */}
        <Form.List name="specimens">
          {(fields, { remove }) => (
            <>
              {fields.map(({ key, name, ...restField }, index) => (
                <Card
                  key={key}
                  size="small"
                  title={`Mẫu ${index + 1}`}
                  style={{ marginBottom: 16 }}
                  extra={
                    !editingItem && fields.length > 1 && (
                      <Button
                        type="text"
                        danger
                        icon={<MinusCircleOutlined />}
                        onClick={() => remove(name)}
                      >
                        Xóa
                      </Button>
                    )
                  }
                >
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, "code"]}
                        label="Mã mẫu"
                        rules={[{ required: true, message: "Vui lòng nhập mã mẫu" }]}
                      >
                        <Input disabled />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, "receivedDate"]}
                        label="Ngày nhận"
                        rules={[{ required: true, message: "Vui lòng chọn ngày nhận" }]}
                      >
                        <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, "name"]}
                        label="Tên mẫu"
                        rules={[{ required: true, message: "Vui lòng nhập tên mẫu" }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, "type"]}
                        label="Loại mẫu"
                        rules={[{ required: true, message: "Vui lòng chọn loại mẫu" }]}
                      >
                        <Select placeholder="Chọn loại mẫu">
                          {specimenTypes.map((t) => (
                            <Select.Option key={t} value={t}>
                              {t}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item
                        {...restField}
                        name={[name, "quantity"]}
                        label="Số lượng"
                        rules={[{ required: true, message: "Nhập số lượng" }]}
                      >
                        <InputNumber min={1} style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item
                        {...restField}
                        name={[name, "unit"]}
                        label="Đơn vị"
                        rules={[{ required: true, message: "Chọn đơn vị" }]}
                      >
                        <Select>
                          {UNIT_OPTIONS.map((opt) => (
                            <Select.Option key={opt.value} value={opt.value}>
                              {opt.label}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, "status"]}
                        label="Trạng thái"
                        rules={[{ required: true, message: "Chọn trạng thái" }]}
                      >
                        <Select>
                          {Object.entries(SPECIMEN_STATUS_CONFIG).map(
                            ([status, config]) => (
                              <Select.Option key={status} value={Number(status)}>
                                {config.text}
                              </Select.Option>
                            )
                          )}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              ))}

              {/* Nút thêm mẫu mới - chỉ hiển thị khi tạo mới */}
              {!editingItem && (
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={onAddSpecimen}
                    block
                    icon={<PlusOutlined />}
                  >
                    Thêm mẫu
                  </Button>
                </Form.Item>
              )}
            </>
          )}
        </Form.List>

        {/* Thông tin chung */}
        <Card size="small" title="Thông tin chung" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="storageLocation" label="Vị trí lưu kho">
                <Select allowClear placeholder="Chọn vị trí lưu kho">
                  {storageLocations.map((loc) => (
                    <Select.Option key={loc.id} value={loc.name}>
                      {loc.code} - {loc.name} ({loc.temperature || "N/A"})
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="storageCondition" label="Điều kiện bảo quản">
                <Select allowClear placeholder="Chọn điều kiện bảo quản">
                  {STORAGE_CONDITION_OPTIONS.map((opt) => (
                    <Select.Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Card>
      </Form>
    </Modal>
  );
};

export default SpecimenModal;
