import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Table,
  Space,
  Typography,
  AutoComplete,
  InputNumber,
  Popconfirm,
  message,
  Spin,
  Row,
  Col,
  Divider,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  SaveOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { quotationService } from "../../services/quotationService";
import { organizationService } from "../../services/organizationService";
import {
  CreateUpdateQuotationDto,
  QuotationStatus,
} from "../../types/quotation";
import { PATH_ROUTES } from "../../constants";
import { formatCurrency } from "../../utils/formatters";
import QuotationIndicatorSelectionModal, {
  SelectedMethodInfo,
} from "./components/QuotationIndicatorSelectionModal";

const { Title, Text } = Typography;

// Local item type for table
interface QuotationItemRow {
  key: string;
  indicatorId: string;
  testMethodId: string;
  indicatorName: string;
  testMethodName: string;
  sampleCount: number;
  unitPrice: number;
  totalPrice: number;
  sortOrder: number;
}

interface OrganizationOption {
  value: string;
  label: string;
  id: string;
}

const QuotationForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<QuotationItemRow[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [organizationOptions, setOrganizationOptions] = useState<
    OrganizationOption[]
  >([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<
    string | undefined
  >();

  // Load organization options
  useEffect(() => {
    loadOrganizations();
  }, []);

  // Load quotation data if editing
  useEffect(() => {
    if (isEdit && id) {
      loadQuotation(id);
    }
  }, [id, isEdit]);

  const loadOrganizations = async () => {
    try {
      const orgs = await organizationService.getAllActive();
      setOrganizationOptions(
        orgs.map((org) => ({
          value: org.name,
          label: org.name,
          id: org.id,
        }))
      );
    } catch (error) {
      console.error("Failed to load organizations:", error);
    }
  };

  const loadQuotation = async (quotationId: string) => {
    setLoading(true);
    try {
      const data = await quotationService.get(quotationId);
      form.setFieldsValue({
        customerName: data.customerName,
        notes: data.notes,
      });
      setSelectedOrganizationId(data.organizationId);

      // Map items
      const mappedItems: QuotationItemRow[] = data.items.map((item, index) => ({
        key: `${item.indicatorId}_${item.testMethodId}`,
        indicatorId: item.indicatorId,
        testMethodId: item.testMethodId,
        indicatorName: item.indicatorName,
        testMethodName: item.testMethodName,
        sampleCount: item.sampleCount,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        sortOrder: item.sortOrder || index,
      }));
      setItems(mappedItems);
    } catch (error) {
      console.error("Failed to load quotation:", error);
      message.error("Không thể tải thông tin báo giá");
    } finally {
      setLoading(false);
    }
  };

  // Handle organization selection
  const handleOrganizationSelect = (value: string, option: OrganizationOption) => {
    setSelectedOrganizationId(option.id);
    form.setFieldsValue({
      customerName: value,
    });
  };

  // Handle organization input change
  const handleOrganizationChange = (value: string) => {
    // If user types manually, clear the organizationId
    const matchedOption = organizationOptions.find(
      (opt) => opt.value === value
    );
    if (!matchedOption) {
      setSelectedOrganizationId(undefined);
    }
  };

  // Handle add indicators from modal
  const handleAddIndicators = (selectedMethods: SelectedMethodInfo[]) => {
    const newItems: QuotationItemRow[] = selectedMethods.map(
      (method, index) => ({
        key: `${method.indicatorId}_${method.testMethodId}`,
        indicatorId: method.indicatorId,
        testMethodId: method.testMethodId,
        indicatorName: method.indicatorName,
        testMethodName: method.testMethodName,
        sampleCount: 1,
        unitPrice: method.unitPrice,
        totalPrice: method.unitPrice,
        sortOrder: items.length + index,
      })
    );

    setItems((prev) => [...prev, ...newItems]);
    setModalVisible(false);
  };

  // Handle sample count change
  const handleSampleCountChange = (key: string, value: number | null) => {
    setItems((prev) =>
      prev.map((item) =>
        item.key === key
          ? {
              ...item,
              sampleCount: value || 1,
              totalPrice: (value || 1) * item.unitPrice,
            }
          : item
      )
    );
  };

  // Handle remove item
  const handleRemoveItem = (key: string) => {
    setItems((prev) => prev.filter((item) => item.key !== key));
  };

  // Calculate total
  const totalCost = items.reduce((sum, item) => sum + item.totalPrice, 0);

  // Get excluded method keys (already added)
  const excludedMethods = items.map((item) => item.key);

  // Handle save
  const handleSave = async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue();

      if (items.length === 0) {
        message.warning("Vui lòng thêm ít nhất một chỉ tiêu");
        return;
      }

      setSaving(true);

      const data: CreateUpdateQuotationDto = {
        quotationDate: dayjs().toISOString(),
        organizationId: selectedOrganizationId,
        customerName: values.customerName,
        notes: values.notes,
        status: QuotationStatus.Draft,
        items: items.map((item, index) => ({
          indicatorId: item.indicatorId,
          testMethodId: item.testMethodId,
          indicatorName: item.indicatorName,
          testMethodName: item.testMethodName,
          sampleCount: item.sampleCount,
          unitPrice: item.unitPrice,
          sortOrder: index,
        })),
      };

      if (isEdit && id) {
        await quotationService.update(id, data);
        message.success("Cập nhật báo giá thành công");
      } else {
        await quotationService.create(data);
        message.success("Tạo báo giá thành công");
      }

      navigate(PATH_ROUTES.quotations.index);
    } catch (error: any) {
      console.error("Failed to save quotation:", error);
      message.error(error.response?.data?.error?.message || "Lưu báo giá thất bại");
    } finally {
      setSaving(false);
    }
  };

  // Table columns
  const columns: ColumnsType<QuotationItemRow> = [
    {
      title: "STT",
      key: "index",
      width: 60,
      align: "center",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Chỉ tiêu",
      dataIndex: "indicatorName",
      key: "indicatorName",
      ellipsis: true,
    },
    {
      title: "Phương pháp",
      dataIndex: "testMethodName",
      key: "testMethodName",
      ellipsis: true,
    },
    {
      title: "Số mẫu",
      dataIndex: "sampleCount",
      key: "sampleCount",
      width: 100,
      align: "center",
      render: (value, record) => (
        <InputNumber
          min={1}
          value={value}
          onChange={(val) => handleSampleCountChange(record.key, val)}
          style={{ width: 70 }}
        />
      ),
    },
    {
      title: "Đơn giá",
      dataIndex: "unitPrice",
      key: "unitPrice",
      width: 130,
      align: "right",
      render: (value) => formatCurrency(value),
    },
    {
      title: "Thành tiền",
      dataIndex: "totalPrice",
      key: "totalPrice",
      width: 130,
      align: "right",
      render: (value) => (
        <Text strong>
          {formatCurrency(value)}
        </Text>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 60,
      align: "center",
      render: (_, record) => (
        <Popconfirm
          title="Xóa chỉ tiêu này?"
          onConfirm={() => handleRemoveItem(record.key)}
          okText="Xóa"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
        >
          <Button type="text" danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Spin spinning={loading}>
        <Card>
          {/* Header */}
          <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
            <Col>
              <Space>
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => navigate(PATH_ROUTES.quotations.index)}
                >
                  Quay lại
                </Button>
                <Title level={4} style={{ margin: 0 }}>
                  {isEdit ? "Chỉnh sửa báo giá" : "Tạo mới báo giá"}
                </Title>
              </Space>
            </Col>
            <Col>
              <Space>
                <Button
                  icon={<EyeOutlined />}
                  onClick={() => {
                    // TODO: Implement preview logic
                    message.info("Chức năng xem trước đang phát triển");
                  }}
                >
                  Xem trước
                </Button>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSave}
                  loading={saving}
                >
                  Lưu nháp
                </Button>
              </Space>
            </Col>
          </Row>

          {/* Customer Info Form */}
          <Form form={form} layout="vertical">
            <Form.Item
              name="customerName"
              label="Tên CS/DN"
              style={{ marginBottom: 0 }}
            >
              <AutoComplete
                options={organizationOptions}
                onSelect={(value, option) =>
                  handleOrganizationSelect(value, option as OrganizationOption)
                }
                onChange={handleOrganizationChange}
                placeholder="Nhập hoặc chọn tên CS/DN"
                filterOption={(inputValue, option) =>
                  option?.label
                    ?.toString()
                    .toLowerCase()
                    .includes(inputValue.toLowerCase()) || false
                }
                size="large"
              />
            </Form.Item>
          </Form>

          <Divider style={{ margin: "16px 0" }} />

          {/* Indicators Section */}
          <div style={{ marginBottom: 16 }}>
            <Row justify="space-between" align="middle">
              <Col>
                <Title level={5} style={{ margin: 0 }}>
                  Danh sách chỉ tiêu
                </Title>
              </Col>
              <Col>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setModalVisible(true)}
                >
                  Thêm chỉ tiêu
                </Button>
              </Col>
            </Row>
          </div>

          <Table
            columns={columns}
            dataSource={items}
            rowKey="key"
            pagination={false}
            size="middle"
            locale={{
              emptyText: (
                <div style={{ padding: 40 }}>
                  <Text type="secondary">
                    Chưa có chỉ tiêu nào. Nhấn "Thêm chỉ tiêu" để bắt đầu.
                  </Text>
                </div>
              ),
            }}
          />

          {/* Total */}
          <div
            style={{
              marginTop: 16,
              padding: 16,
              background: "#fafafa",
              borderRadius: 4,
              border: "1px solid #d9d9d9",
              textAlign: "right",
            }}
          >
            <Text style={{ fontSize: 16 }}>Tổng cộng: </Text>
            <Text
              strong
              style={{ fontSize: 20, color: "#1890ff", marginLeft: 8 }}
            >
              {formatCurrency(totalCost)}
            </Text>
          </div>

          {/* Notes */}
          <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
            <Form.Item name="notes" label="Ghi chú">
              <Input.TextArea rows={3} placeholder="Nhập ghi chú (nếu có)" />
            </Form.Item>
          </Form>
        </Card>
      </Spin>

      {/* Indicator Selection Modal */}
      <QuotationIndicatorSelectionModal
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleAddIndicators}
        excludedMethods={excludedMethods}
      />
    </div>
  );
};

export default QuotationForm;
