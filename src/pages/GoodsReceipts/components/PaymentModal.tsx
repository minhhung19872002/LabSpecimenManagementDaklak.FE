import React, { useEffect } from "react";
import { Modal, Form, Input, InputNumber, Select, DatePicker, Button, Row, Col } from "antd";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { paymentSchema, PaymentFormData } from "../schemas";
import { PAYMENT_METHOD_OPTIONS } from "../../../services/goodsReceiptService";
import dayjs from "dayjs";

const { TextArea } = Input;


interface PaymentModalProps {
  open: boolean;
  loading: boolean;
  totalAmount: number;
  totalPaid: number;
  onOk: (data: PaymentFormData) => void;
  onCancel: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  open,
  loading,
  totalAmount,
  totalPaid,
  onOk,
  onCancel,
}) => {
  const remaining = totalAmount - totalPaid;

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: yupResolver(paymentSchema) as any,
    defaultValues: {
      amount: 0,
      paymentMethod: 0,
      paymentDate: dayjs().format("YYYY-MM-DD"),
      phone: "",
      representativeName: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        amount: remaining,
        paymentMethod: 0,
        paymentDate: dayjs().format("YYYY-MM-DD"),
        phone: "",
        representativeName: "",
        notes: "",
      });
    }
  }, [open, remaining, reset]);

  const currentAmount = watch("amount") || 0;
  const afterPayment = remaining - currentAmount;

  return (
    <Modal
      title="Thanh toán"
      open={open}
      onCancel={onCancel}
      centered
      destroyOnClose
      width={600}
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button onClick={onCancel}>Đóng</Button>
          <Button type="primary" onClick={handleSubmit(onOk)} loading={loading}>
            Thanh toán
          </Button>
        </div>
      }
    >
      <Form layout="vertical" size="middle">
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              label={<span>Phương thức thanh toán <span style={{ color: "#ff4d4f" }}>*</span></span>}
              validateStatus={errors.paymentMethod ? "error" : ""}
              help={errors.paymentMethod?.message}
            >
              <Controller
                name="paymentMethod"
                control={control}
                render={({ field }) => (
                  <Select {...field} options={PAYMENT_METHOD_OPTIONS} />
                )}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label={<span>Ngày tất toán <span style={{ color: "#ff4d4f" }}>*</span></span>}
              validateStatus={errors.paymentDate ? "error" : ""}
              help={errors.paymentDate?.message}
            >
              <Controller
                name="paymentDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    style={{ width: "100%" }}
                    format="DD/MM/YYYY"
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(date) => field.onChange(date?.format("YYYY-MM-DD") || "")}
                  />
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              label={<span>Số tiền thanh toán <span style={{ color: "#ff4d4f" }}>*</span></span>}
              validateStatus={errors.amount ? "error" : ""}
              help={errors.amount?.message}
              extra="Chỉ nhập số (VNĐ)"
            >
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    {...field}
                    style={{ width: "100%" }}
                    placeholder="Nhập số tiền"
                    min={1}
                    max={remaining}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                    parser={(value) => Number(value?.replace(/,/g, "") || 0)}
                  />
                )}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Tổng tiền">
              <InputNumber
                style={{ width: "100%" }}
                value={totalAmount}
                disabled
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                suffix="VNĐ"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item label="Số tiền còn lại">
              <InputNumber
                style={{ width: "100%" }}
                value={Math.max(0, afterPayment)}
                disabled
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                suffix="VNĐ"
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Điện thoại">
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <Input {...field} value={field.value || ""} placeholder="Nhập số điện thoại" />
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Người đại diện">
          <Controller
            name="representativeName"
            control={control}
            render={({ field }) => (
              <Input {...field} value={field.value || ""} placeholder="Nhập tên người đại diện" />
            )}
          />
        </Form.Item>

        <Form.Item label="Ghi chú">
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <TextArea {...field} value={field.value || ""} rows={3} placeholder="Nhập ghi chú (nếu có)" />
            )}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PaymentModal;
