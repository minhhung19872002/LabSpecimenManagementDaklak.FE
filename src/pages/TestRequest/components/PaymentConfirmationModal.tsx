import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  InputNumber,
  Radio,
  Input,
  Spin,
  Tag,
  Collapse,
  Typography,
  message,
  Empty,
  Divider,
  Row,
  Col,
} from "antd";
import dayjs from "dayjs";
import { receiptService } from "../../../services/receiptService";
import {
  PaymentInfoDto,
  PaymentHistoryDto,
  PaymentMethod,
  PaymentMethodLabels,
  ReceiptStatusLabels,
  ReceiptStatusColors,
  CreatePaymentInput,
} from "../../../types/receipt";

const { Text, Title } = Typography;
const { Panel } = Collapse;

// Style cho row hiển thị ngang key-value
const fieldRowStyle: React.CSSProperties = {
  marginBottom: 8,
};

const labelStyle: React.CSSProperties = {
  color: "rgba(0, 0, 0, 0.65)",
};

const valueStyle: React.CSSProperties = {
  textAlign: "left",
};

interface PaymentConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  testRequestId: string;
  onSuccess: () => void;
}

const PaymentConfirmationModal: React.FC<PaymentConfirmationModalProps> = ({
  open,
  onClose,
  testRequestId,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfoDto | null>(null);

  useEffect(() => {
    if (open && testRequestId) {
      loadPaymentInfo();
    }
  }, [open, testRequestId]);

  const loadPaymentInfo = async () => {
    setLoading(true);
    try {
      const result = await receiptService.getPaymentInfo(testRequestId);
      setPaymentInfo(result);
      // Reset form when data is loaded
      form.resetFields();
    } catch (error: any) {
      console.error("Error loading payment info:", error);
      message.error(
        error?.response?.data?.error?.message ||
          "Không thể tải thông tin thanh toán"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!paymentInfo) return;

    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const input: CreatePaymentInput = {
        amount: values.amount,
        paymentMethod: values.paymentMethod,
        notes: values.notes,
      };

      const result = await receiptService.processPayment(
        paymentInfo.receiptId,
        input
      );

      message.success(result.message);
      onSuccess();
      onClose();
    } catch (error: any) {
      if (error.errorFields) {
        // Form validation error
        return;
      }
      console.error("Error processing payment:", error);
      message.error(
        error?.response?.data?.error?.message ||
          "Không thể xử lý thanh toán. Vui lòng thử lại."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  const formatCurrency = (value: number) => {
    return (value || 0).toLocaleString("vi-VN") + " đ";
  };

  // Tạo ID phiếu thu format: YYMMDDxx (xx là lần thanh toán)
  const generatePaymentId = (paymentDate: string, paymentNumber: number) => {
    const date = dayjs(paymentDate);
    const yy = date.format("YY");
    const mm = date.format("MM");
    const dd = date.format("DD");
    const xx = paymentNumber.toString().padStart(2, "0");
    return `${yy}${mm}${dd}${xx}`;
  };

  const renderPaymentHistoryItem = (history: PaymentHistoryDto, receiptId: string) => {
    const paymentCode = generatePaymentId(history.paymentDate, history.paymentNumber);
    const shortReceiptId = receiptId.substring(0, 8).toUpperCase();

    return (
      <Panel
        header={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <span>
              {shortReceiptId} - {paymentCode}
              <Tag color="green" style={{ marginLeft: 8 }}>
                {formatCurrency(history.amount)}
              </Tag>
            </span>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {dayjs(history.paymentDate).format("DD/MM/YYYY HH:mm")}
            </Text>
          </div>
        }
        key={history.id}
      >
        {/* Số tiền cần thanh toán */}
        <Row style={fieldRowStyle} gutter={[8, 8]}>
          <Col xs={24} sm={12}>
            <Text style={labelStyle}>Số tiền cần thanh toán:</Text>
          </Col>
          <Col xs={24} sm={12} style={valueStyle}>
            <Text>{formatCurrency(history.remainingAmountBeforePayment)}</Text>
          </Col>
        </Row>

        {/* Số tiền thanh toán */}
        <Row style={fieldRowStyle} gutter={[8, 8]}>
          <Col xs={24} sm={12}>
            <Text style={labelStyle}>Số tiền thanh toán:</Text>
          </Col>
          <Col xs={24} sm={12} style={valueStyle}>
            <Text strong type="success">
              {formatCurrency(history.amount)}
            </Text>
          </Col>
        </Row>

        {/* Phương thức thanh toán */}
        <Row style={fieldRowStyle} gutter={[8, 8]}>
          <Col xs={24} sm={12}>
            <Text style={labelStyle}>Phương thức thanh toán:</Text>
          </Col>
          <Col xs={24} sm={12} style={valueStyle}>
            <Radio.Group value={history.paymentMethod} disabled>
              <Radio value={PaymentMethod.Cash}>
                {PaymentMethodLabels[PaymentMethod.Cash]}
              </Radio>
              <Radio value={PaymentMethod.BankTransfer}>
                {PaymentMethodLabels[PaymentMethod.BankTransfer]}
              </Radio>
            </Radio.Group>
          </Col>
        </Row>

        {/* Người thực hiện */}
        {history.creatorName && (
          <Row style={fieldRowStyle} gutter={[8, 8]}>
            <Col xs={24} sm={12}>
              <Text style={labelStyle}>Người thực hiện:</Text>
            </Col>
            <Col xs={24} sm={12} style={valueStyle}>
              <Text>{history.creatorName}</Text>
            </Col>
          </Row>
        )}

        {/* Ghi chú - luôn hiển thị trên dưới */}
        {history.notes && (
          <div style={{ marginTop: 8 }}>
            <Text style={labelStyle}>Ghi chú:</Text>
            <div style={{ marginTop: 4 }}>
              <Text>{history.notes}</Text>
            </div>
          </div>
        )}
      </Panel>
    );
  };

  const renderNewPaymentForm = () => {
    if (!paymentInfo || paymentInfo.remainingAmount <= 0) {
      return null;
    }

    const nextPaymentNumber = (paymentInfo.paymentHistories?.length || 0) + 1;
    const newPaymentCode = generatePaymentId(dayjs().toISOString(), nextPaymentNumber);
    const shortReceiptId = paymentInfo.receiptId.substring(0, 8).toUpperCase();

    return (
      <Collapse
        defaultActiveKey={["new-payment"]}
        style={{ marginTop: 16 }}
        expandIconPosition="start"
      >
        <Panel
          header={
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <span style={{ fontWeight: 600 }}>
                {shortReceiptId} - {newPaymentCode}
              </span>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {dayjs().format("DD/MM/YYYY HH:mm")}
              </Text>
            </div>
          }
          key="new-payment"
        >
          <Form form={form} layout="vertical">
            {/* Số tiền cần thanh toán - hiển thị ngang */}
            <Row style={fieldRowStyle} gutter={[8, 8]} align="middle">
              <Col xs={24} sm={12}>
                <Text style={labelStyle}>Số tiền cần thanh toán:</Text>
              </Col>
              <Col xs={24} sm={12} style={valueStyle}>
                <Text strong>{formatCurrency(paymentInfo.remainingAmount)}</Text>
              </Col>
            </Row>

            {/* Số tiền thanh toán - hiển thị ngang */}
            <Row style={{ marginBottom: 16 }} gutter={[8, 8]} align="middle">
              <Col xs={24} sm={12}>
                <Text style={labelStyle}>Số tiền thanh toán: <span style={{ color: "#ff4d4f" }}>*</span></Text>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="amount"
                  style={{ marginBottom: 0 }}
                  rules={[
                    { required: true, message: "Vui lòng nhập số tiền thanh toán" },
                    {
                      type: "number",
                      min: 1,
                      message: "Số tiền thanh toán phải lớn hơn 0",
                    },
                    {
                      type: "number",
                      max: paymentInfo.remainingAmount,
                      message: `Số tiền không được vượt quá ${formatCurrency(paymentInfo.remainingAmount)}`,
                    },
                  ]}
                >
                  <InputNumber
                    style={{ width: "100%" }}
                    formatter={(value) =>
                      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    parser={(value) =>
                      value?.replace(/\$\s?|(,*)/g, "") as unknown as number
                    }
                    placeholder="Nhập số tiền"
                    addonAfter="đ"
                    min={1}
                    max={paymentInfo.remainingAmount}
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Phương thức thanh toán - hiển thị ngang */}
            <Row style={{ marginBottom: 16 }} gutter={[8, 8]} align="middle">
              <Col xs={24} sm={12}>
                <Text style={labelStyle}>Phương thức thanh toán: <span style={{ color: "#ff4d4f" }}>*</span></Text>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="paymentMethod"
                  style={{ marginBottom: 0 }}
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng chọn phương thức thanh toán",
                    },
                  ]}
                >
                  <Radio.Group>
                    <Radio value={PaymentMethod.Cash}>
                      {PaymentMethodLabels[PaymentMethod.Cash]}
                    </Radio>
                    <Radio value={PaymentMethod.BankTransfer}>
                      {PaymentMethodLabels[PaymentMethod.BankTransfer]}
                    </Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
            </Row>

            {/* Ghi chú - luôn hiển thị trên dưới */}
            <div style={{ marginBottom: 0 }}>
              <Text style={labelStyle}>Ghi chú:</Text>
              <Form.Item
                name="notes"
                style={{ marginBottom: 0, marginTop: 8 }}
                rules={[{ max: 1000, message: "Ghi chú không quá 1000 ký tự" }]}
              >
                <Input.TextArea
                  rows={2}
                  placeholder="Nhập ghi chú (không bắt buộc)"
                  maxLength={1000}
                  showCount
                />
              </Form.Item>
            </div>
          </Form>
        </Panel>
      </Collapse>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin size="large" />
        </div>
      );
    }

    if (!paymentInfo) {
      return (
        <Empty
          description="Không thể tải thông tin thanh toán"
          style={{ padding: "40px 0" }}
        />
      );
    }

    const isFullyPaid = paymentInfo.remainingAmount <= 0;

    return (
      <div>
        {/* Thông tin thanh toán */}
        <div
          style={{
            background: "#fafafa",
            padding: 16,
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Title level={5} style={{ margin: 0 }}>
              Thông tin thanh toán
            </Title>
            <Tag color={ReceiptStatusColors[paymentInfo.status]}>
              {ReceiptStatusLabels[paymentInfo.status]}
            </Tag>
          </div>

          {/* ID phiếu thu */}
          <Row style={fieldRowStyle} gutter={[8, 8]}>
            <Col xs={24} sm={12}>
              <Text style={labelStyle}>ID phiếu thu:</Text>
            </Col>
            <Col xs={24} sm={12} style={valueStyle}>
              <Text copyable={{ text: paymentInfo.receiptId }}>
                {paymentInfo.receiptId.substring(0, 8)}...
              </Text>
            </Col>
          </Row>

          {/* Tổng chi phí */}
          <Row style={fieldRowStyle} gutter={[8, 8]}>
            <Col xs={24} sm={12}>
              <Text style={labelStyle}>Tổng chi phí:</Text>
            </Col>
            <Col xs={24} sm={12} style={valueStyle}>
              <Text strong>{formatCurrency(paymentInfo.totalCost)}</Text>
            </Col>
          </Row>

          {/* Chi phí còn lại */}
          <Row style={{ marginBottom: 0 }} gutter={[8, 8]}>
            <Col xs={24} sm={12}>
              <Text style={labelStyle}>Chi phí còn lại:</Text>
            </Col>
            <Col xs={24} sm={12} style={valueStyle}>
              <Text
                strong
                type={paymentInfo.remainingAmount > 0 ? "danger" : "success"}
              >
                {formatCurrency(paymentInfo.remainingAmount)}
              </Text>
            </Col>
          </Row>
        </div>

        {/* Lịch sử thanh toán */}
        {paymentInfo.paymentHistories &&
          paymentInfo.paymentHistories.length > 0 && (
            <>
              <Divider style={{ marginTop: 0 }}>Lịch sử thanh toán</Divider>
              <Collapse expandIconPosition="start">
                {paymentInfo.paymentHistories.map((history) =>
                  renderPaymentHistoryItem(history, paymentInfo.receiptId)
                )}
              </Collapse>
            </>
          )}

        {/* Form thanh toán mới */}
        {renderNewPaymentForm()}

        {/* Thông báo khi đã thanh toán đủ */}
        {isFullyPaid && (
          <div
            style={{
              textAlign: "center",
              padding: "24px 0",
              background: "#f6ffed",
              borderRadius: 8,
              marginTop: 16,
            }}
          >
            <Text type="success" strong style={{ fontSize: 16 }}>
              ✓ Đã thanh toán đầy đủ
            </Text>
          </div>
        )}
      </div>
    );
  };

  const isFullyPaid = paymentInfo && paymentInfo.remainingAmount <= 0;

  const modalTitle = isFullyPaid ? "Lịch sử thanh toán" : "Thanh toán hợp đồng";

  return (
    <Modal
      title={
        <span>
          {modalTitle}{" "}
          {paymentInfo?.contractNumber && (
            <Tag color="blue">{paymentInfo.contractNumber}</Tag>
          )}
        </span>
      }
      open={open}
      onOk={isFullyPaid ? handleCancel : handleSubmit}
      onCancel={handleCancel}
      okText={isFullyPaid ? "Đóng" : "Xác nhận"}
      cancelText={isFullyPaid ? undefined : "Hủy"}
      cancelButtonProps={isFullyPaid ? { style: { display: "none" } } : {}}
      confirmLoading={submitting}
      width={600}
      centered
      destroyOnClose
      maskClosable={false}
    >
      {renderContent()}
    </Modal>
  );
};

export default PaymentConfirmationModal;
