import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Button,
  Row,
  Col,
  Typography,
  Space,
  message,
  Input,
  Table,
  Spin,
  Popover,
  Image,
  Tag,
} from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SaveOutlined,
  EyeOutlined,
} from "../../components/common/Icon";
import { Icon } from "@iconify/react";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import { receiptService } from "../../services/receiptService";
import { API_BASE_URL } from "../../services/api";
import {
  ReceiptDetailDto,
  ReceiptStatus,
  ReceiptStatusLabels,
  ReceiptStatusColors,
} from "../../types/receipt";
import { TestRequestSampleDto } from "../../types/testRequest";
import { PATH_ROUTES } from "../../constants";
import StatusTag from "../../components/common/StatusTag";
import { IndicatorName } from "../../components/common";

const { Title, Text } = Typography;

// Helper components
const BoolIcon: React.FC<{ value: boolean }> = ({ value }) => {
  return value ? (
    <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 16 }} />
  ) : (
    <CloseCircleOutlined style={{ color: "#d9d9d9", fontSize: 16 }} />
  );
};

const BoolItem: React.FC<{ value: boolean; label: string }> = ({
  value,
  label,
}) => (
  <Space size={4}>
    <BoolIcon value={value} />
    <Text style={{ fontSize: 13 }}>{label}</Text>
  </Space>
);

const ReceiptDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Note: Receipts theo Permission Matrix chỉ có Kế toán (A) và Admin (A)
  // Cả 2 đều có full quyền nên không cần check UI chi tiết
  // Route permission đã được config đúng trong permissions.ts

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<ReceiptDetailDto | null>(null);
  const [receiptNumber, setReceiptNumber] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const result = await receiptService.getDetail(id);
        setData(result);
        setReceiptNumber(result.receiptNumber || "");
      } catch (error) {
        console.error("Failed to load receipt:", error);
        message.error("Không thể tải thông tin phiếu thu");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  // Track changes
  useEffect(() => {
    if (data) {
      const changed = receiptNumber !== (data.receiptNumber || "");
      setHasChanges(changed);
    }
  }, [receiptNumber, data]);

  // Validate integer only input
  const handleNumberInput = (value: string, setter: (val: string) => void) => {
    if (/^[0-9]*$/.test(value)) {
      setter(value);
    }
  };

  // Check if can change status
  const canChangeStatus = useMemo(() => {
    if (!data) return false;
    const hasReceiptInfo = !!receiptNumber?.trim();
    const isValidStatus =
      data.status !== ReceiptStatus.Paid &&
      data.status !== ReceiptStatus.Cancelled &&
      data.status !== ReceiptStatus.NoPaymentRequired;
    return hasReceiptInfo && isValidStatus;
  }, [receiptNumber, data]);

  // Check if receipt is read-only (Paid, Cancelled, NoPaymentRequired)
  const isReadOnly = useMemo(() => {
    if (!data) return true;
    return (
      data.status === ReceiptStatus.Paid ||
      data.status === ReceiptStatus.Cancelled ||
      data.status === ReceiptStatus.NoPaymentRequired
    );
  }, [data]);

  // Save receipt info
  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await receiptService.update(id, { receiptNumber });
      message.success("Đã lưu thông tin phiếu thu");
      setHasChanges(false);
      // Reload to get latest data
      const result = await receiptService.getDetail(id);
      setData(result);
    } catch (error: any) {
      console.error("Failed to save:", error);
      // API interceptor đã unwrap errors, format: { general: ["message"] } hoặc { message: "..." }
      const errorData = error?.response?.data;
      const errorMessage =
        errorData?.general?.[0] ||
        errorData?.message ||
        "Không thể lưu thông tin";
      message.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Mark as paid
  const handleMarkAsPaid = async () => {
    if (!id) return;
    setSaving(true);
    try {
      // Save changes first if any
      if (hasChanges) {
        await receiptService.update(id, { receiptNumber });
      }
      await receiptService.markAsPaid(id);
      message.success("Đã đánh dấu thanh toán");
      // Reload data
      const result = await receiptService.getDetail(id);
      setData(result);
      setHasChanges(false);
    } catch (error: any) {
      console.error("Failed to mark as paid:", error);
      const errorData = error?.response?.data;
      const errorMessage =
        errorData?.general?.[0] ||
        errorData?.message ||
        "Không thể cập nhật trạng thái";
      message.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Mark as unpaid
  const handleMarkAsUnpaid = async () => {
    if (!id) return;
    setSaving(true);
    try {
      // Save changes first if any
      if (hasChanges) {
        await receiptService.update(id, { receiptNumber });
      }
      await receiptService.markAsUnpaid(id);
      message.success("Đã đánh dấu chưa thanh toán");
      // Reload data
      const result = await receiptService.getDetail(id);
      setData(result);
      setHasChanges(false);
    } catch (error: any) {
      console.error("Failed to mark as unpaid:", error);
      const errorData = error?.response?.data;
      const errorMessage =
        errorData?.general?.[0] ||
        errorData?.message ||
        "Không thể cập nhật trạng thái";
      message.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const testRequest = data?.testRequestDetail;

  // Sample table columns for read-only display
  const sampleColumns = [
    {
      title: "STT",
      key: "sortOrder",
      width: 50,
      render: (_: unknown, __: TestRequestSampleDto, index: number) =>
        index + 1,
    },
    {
      title: "Mã mẫu",
      dataIndex: "sampleCode",
      key: "sampleCode",
      width: 120,
    },
    {
      title: "Tên mẫu",
      dataIndex: "sampleName",
      key: "sampleName",
      width: 180,
    },
    {
      title: "Loại mẫu",
      dataIndex: "specimenTypeName",
      key: "specimenTypeName",
      width: 150,
    },
    {
      title: "Hình ảnh",
      dataIndex: "attachments",
      key: "attachments",
      width: 120,
      render: (attachments: { url: string; fileName: string }[]) => {
        if (!attachments || attachments.length === 0) return "-";
        return (
          <Image.PreviewGroup>
            <Space size={4}>
              {attachments.slice(0, 3).map((att, idx) => {
                const fullUrl = att.url.startsWith("http")
                  ? att.url
                  : `${API_BASE_URL}${att.url}`;
                return (
                  <div
                    key={idx}
                    style={{
                      position: "relative",
                      width: 32,
                      height: 32,
                      borderRadius: 4,
                      overflow: "hidden",
                    }}
                  >
                    <Image
                      src={fullUrl}
                      width={32}
                      height={32}
                      style={{ objectFit: "cover" }}
                      preview={{
                        mask: (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "100%",
                              height: "100%",
                            }}
                          >
                            <EyeOutlined
                              style={{ fontSize: 14, color: "#fff" }}
                            />
                          </div>
                        ),
                      }}
                    />
                  </div>
                );
              })}
              {attachments.length > 3 && (
                <Text type="secondary">+{attachments.length - 3}</Text>
              )}
            </Space>
          </Image.PreviewGroup>
        );
      },
    },
    {
      title: "Địa chỉ lấy mẫu",
      dataIndex: "samplingAddress",
      key: "samplingAddress",
      width: 180,
      ellipsis: true,
      render: (text: string | undefined) => text || "-",
    },
    {
      title: "Lượng mẫu",
      dataIndex: "sampleQuantity",
      key: "sampleQuantity",
      width: 100,
      render: (text: string | undefined) => text || "-",
    },
    {
      title: "Tình trạng mẫu",
      dataIndex: "statusText",
      key: "statusText",
      width: 130,
      ellipsis: true,
      render: (text: string | undefined) => text || "-",
    },
    {
      title: "Chỉ tiêu kiểm nghiệm",
      dataIndex: "indicators",
      key: "indicators",
      width: 150,
      render: (indicators: TestRequestSampleDto["indicators"]) => {
        if (!indicators || indicators.length === 0) return "-";

        const popoverContent = (
          <div style={{ maxHeight: 300, overflowY: "auto", minWidth: 350 }}>
            {indicators.map((ind, idx) => (
              <div
                key={idx}
                style={{
                  padding: "6px 0",
                  borderBottom:
                    idx < indicators.length - 1 ? "1px solid #f0f0f0" : "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div style={{ flex: 1 }}>
                  <IndicatorName
                    name={ind.indicatorName || ""}
                    formattedName={ind.indicatorFormattedName}
                    style={{ fontSize: 13 }}
                  />
                  {ind.testMethodName && (
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        PP: {ind.testMethodName}
                      </Text>
                    </div>
                  )}
                </div>
                <Text style={{ color: "#1890ff", whiteSpace: "nowrap" }}>
                  {(ind.unitPrice || 0).toLocaleString("vi-VN")} đ
                </Text>
              </div>
            ))}
          </div>
        );

        return (
          <Popover
            content={popoverContent}
            title={`Chỉ tiêu kiểm nghiệm (${indicators.length})`}
            trigger="click"
            placement="bottomLeft"
          >
            <Button
              type="text"
              icon={<Icon icon="mdi:clipboard-check-outline" width={18} />}
              style={{ padding: "4px 8px" }}
            >
              <span style={{ marginLeft: 4 }}>
                {indicators.length} chỉ tiêu
              </span>
            </Button>
          </Popover>
        );
      },
    },
    {
      title: "Ghi chú",
      dataIndex: "notes",
      key: "notes",
      width: 150,
      ellipsis: true,
      render: (text: string | undefined) => text || "-",
    },
    {
      title: "Thành tiền",
      dataIndex: "totalIndicatorCost",
      key: "totalIndicatorCost",
      width: 120,
      align: "right" as const,
      fixed: "right" as const,
      render: (value: number) => (
        <Text strong>{(value || 0).toLocaleString("vi-VN")} đ</Text>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="page-wrapper" style={{ textAlign: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!data || !testRequest) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: 24 }}>
          <Text type="secondary">Không tìm thấy phiếu thu</Text>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ padding: 0 }}>
      {/* Header */}
      <Card style={{ marginBottom: 16 }} bodyStyle={{ padding: "12px 24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(PATH_ROUTES.receipts.index)}
            >
              Quay lại
            </Button>
            <Title level={4} style={{ marginBottom: 0 }}>
              Thông tin phiếu thu
            </Title>
            <StatusTag color={ReceiptStatusColors[data.status]}>
              {ReceiptStatusLabels[data.status]}
            </StatusTag>
          </Space>
          <Space>
            {hasChanges && !isReadOnly && (
              <Button
                icon={<SaveOutlined />}
                onClick={handleSave}
                loading={saving}
              >
                Lưu thay đổi
              </Button>
            )}
            {!isReadOnly && (
              <>
                <Button
                  type="default"
                  onClick={handleMarkAsUnpaid}
                  loading={saving}
                  disabled={!canChangeStatus}
                >
                  Chưa thanh toán
                </Button>
                <Button
                  type="primary"
                  onClick={handleMarkAsPaid}
                  loading={saving}
                  disabled={!canChangeStatus}
                >
                  Đã thanh toán
                </Button>
              </>
            )}
          </Space>
        </div>
      </Card>

      {/* Content */}
      <Card>
        {/* Section 1: Thông tin hợp đồng */}
        <div className="detail-section">
          <Title level={5} style={{ marginBottom: 12 }}>
            Thông tin hợp đồng
          </Title>
          <Row gutter={[16, 12]}>
            <Col xs={24} md={8}>
              <div
                className="detail-item"
                style={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Text type="secondary">Số HĐ:</Text>
                <Text strong>{testRequest.contractNumber || "-"}</Text>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div
                className="detail-item"
                style={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Text type="secondary">Ngày HĐ:</Text>
                <Text strong>
                  {testRequest.contractDate
                    ? dayjs(testRequest.contractDate).format("DD/MM/YYYY")
                    : "-"}
                </Text>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div
                className="detail-item"
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <Text type="secondary" style={{ whiteSpace: "nowrap" }}>
                  Số phiếu thu:
                </Text>
                <Input
                  value={receiptNumber}
                  onChange={(e) =>
                    handleNumberInput(e.target.value, setReceiptNumber)
                  }
                  placeholder="Nhập số phiếu thu"
                  style={{ width: 180 }}
                  disabled={isReadOnly}
                />
              </div>
            </Col>
          </Row>
        </div>

        {/* Section 2: Thông tin khách hàng */}
        <div className="detail-section" style={{ marginTop: 24 }}>
          <Title level={5} style={{ marginBottom: 12 }}>
            Thông tin khách hàng
          </Title>
          <Row gutter={[16, 12]}>
            <Col xs={24} xl={12}>
              <div className="detail-item">
                <Text type="secondary">Tên CS/DN:</Text>
                <Text strong style={{ fontSize: 15 }}>
                  {testRequest.customerName || "-"}
                </Text>
              </div>
            </Col>
            <Col xs={24} xl={12}>
              <div className="detail-item">
                <Text type="secondary">Mã số thuế:</Text>
                <Text>{testRequest.taxCode || "-"}</Text>
              </div>
            </Col>
          </Row>
          <Row gutter={[16, 12]} style={{ marginTop: 8 }}>
            <Col xs={24}>
              <div className="detail-item">
                <Text type="secondary">Địa chỉ:</Text>
                <Text>
                  {[
                    testRequest.address,
                    testRequest.ward,
                    testRequest.district,
                    testRequest.province,
                  ]
                    .filter(Boolean)
                    .join(", ") || "-"}
                </Text>
              </div>
            </Col>
          </Row>
          <Row gutter={[16, 12]} style={{ marginTop: 8 }}>
            <Col xs={24} md={12}>
              <div className="detail-item">
                <Text type="secondary">Người liên hệ:</Text>
                <Text strong>{testRequest.contactPerson || "-"}</Text>
              </div>
            </Col>
          </Row>
        </div>

        {/* Section 3: Thông tin mẫu */}
        <div className="detail-section" style={{ marginTop: 24 }}>
          <Title level={5} style={{ marginBottom: 12 }}>
            Thông tin mẫu ({testRequest.samples?.length || 0} mẫu)
          </Title>
          <Table
            dataSource={testRequest.samples || []}
            columns={sampleColumns}
            rowKey="id"
            pagination={false}
            scroll={{ x: "max-content" }}
            size="small"
            bordered
          />
        </div>

        {/* Section 4: Loại hình mẫu */}
        <div className="detail-section" style={{ marginTop: 24 }}>
          <Title level={5} style={{ marginBottom: 12 }}>
            Loại hình mẫu
          </Title>
          <Row gutter={[16, 8]}>
            <Col xs={24}>
              <Space wrap size={[16, 8]}>
                <BoolItem
                  value={testRequest.sampleTypeService}
                  label="Dịch vụ"
                />
                <BoolItem
                  value={testRequest.sampleTypeContract}
                  label="Hợp đồng"
                />
                <BoolItem value={testRequest.sampleTypeTask} label="Nhiệm vụ" />
                <BoolItem
                  value={testRequest.sampleTypeSubContract}
                  label="Thầu phụ"
                />
              </Space>
            </Col>
          </Row>
          {testRequest.subContract && (
            <Row gutter={[16, 8]} style={{ marginTop: 8 }}>
              <Col xs={24}>
                <div className="detail-item">
                  <Text type="secondary">Thầu phụ:</Text>
                  <Text>{testRequest.subContract}</Text>
                </div>
              </Col>
            </Row>
          )}
        </div>

        {/* Section 5: Yêu cầu về phương pháp */}
        <div className="detail-section" style={{ marginTop: 24 }}>
          <Title level={5} style={{ marginBottom: 12 }}>
            Yêu cầu về phương pháp
          </Title>
          <Row gutter={[16, 12]}>
            <Col xs={24}>
              <Space wrap size={[16, 8]}>
                <BoolItem
                  value={testRequest.methodWestHighlandInstitute}
                  label="Theo Viện KHKT NN Tây Nguyên"
                />
                <BoolItem
                  value={testRequest.methodCustomer}
                  label="Theo yêu cầu khách hàng"
                />
              </Space>
            </Col>
            {testRequest.methodCustomerDetail && (
              <Col xs={24}>
                <div className="detail-item">
                  <Text type="secondary">Chi tiết PP KH:</Text>
                  <Text>{testRequest.methodCustomerDetail}</Text>
                </div>
              </Col>
            )}
          </Row>
        </div>

        {/* Section 6: Thông tin chi phí */}
        <div className="detail-section" style={{ marginTop: 24 }}>
          <Title level={5} style={{ marginBottom: 12 }}>
            Thông tin chi phí
          </Title>
          <Row gutter={[16, 12]}>
            <Col xs={24}>
              <div
                style={{
                  background: "#e6f7ff",
                  padding: "16px",
                  borderRadius: 8,
                  border: "1px solid #91d5ff",
                  textAlign: "center",
                }}
              >
                <Text
                  type="secondary"
                  style={{ display: "block", marginBottom: 4 }}
                >
                  Tổng chi phí:
                </Text>
                <Text strong style={{ fontSize: 24, color: "#1890ff" }}>
                  {(testRequest.totalCost || 0).toLocaleString("vi-VN")} đ
                </Text>
              </div>
            </Col>
            {testRequest.totalCostInWords && (
              <Col xs={24}>
                <div className="detail-item">
                  <Text type="secondary">Bằng chữ:</Text>
                  <Text italic>{testRequest.totalCostInWords}</Text>
                </div>
              </Col>
            )}
          </Row>
        </div>

        {/* Payment info if paid */}
        {data.status === ReceiptStatus.Paid && data.paidDate && (
          <div className="detail-section" style={{ marginTop: 24 }}>
            <Title level={5} style={{ marginBottom: 12 }}>
              Thông tin thanh toán
            </Title>
            <Row gutter={[16, 12]}>
              <Col xs={24}>
                <Tag
                  color="green"
                  style={{ fontSize: 14, padding: "4px 12px" }}
                >
                  Đã thanh toán ngày{" "}
                  {dayjs(data.paidDate).format("DD/MM/YYYY HH:mm")}
                </Tag>
              </Col>
            </Row>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ReceiptDetail;
