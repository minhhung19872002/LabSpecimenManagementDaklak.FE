// @ts-nocheck
import React from "react";
import { Form, Radio, Checkbox, DatePicker, Row, Col, Typography, InputNumber, Space } from "antd";
import { SamplingRequirement, SampleStorageOption } from "../../../../types/testRequest";
import dayjs from "dayjs";

const { Title, Text } = Typography;

/**
 * Tính ngày trả kết quả dựa trên số ngày làm việc
 * - Bỏ qua thứ 7 và chủ nhật
 * - Nếu kết quả rơi vào T7/CN thì chuyển sang thứ 2 tiếp theo
 */
const calculateDeliveryDate = (workingDays: number): dayjs.Dayjs => {
  let result = dayjs();
  let daysAdded = 0;

  while (daysAdded < workingDays) {
    result = result.add(1, "day");
    const dayOfWeek = result.day(); // 0 = Sunday, 6 = Saturday
    // Chỉ đếm ngày làm việc (thứ 2 - thứ 6)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      daysAdded++;
    }
  }

  // Nếu kết quả rơi vào T7/CN, chuyển sang thứ 2 tiếp theo
  const finalDayOfWeek = result.day();
  if (finalDayOfWeek === 6) {
    // Thứ 7 -> cộng thêm 2 ngày
    result = result.add(2, "day");
  } else if (finalDayOfWeek === 0) {
    // Chủ nhật -> cộng thêm 1 ngày
    result = result.add(1, "day");
  }

  return result;
};

const SamplingDeliverySection: React.FC = () => {
  const form = Form.useFormInstance();

  // Handle working days input change
  const handleWorkingDaysChange = (value: number | null) => {
    if (value && value > 0) {
      const deliveryDate = calculateDeliveryDate(value);
      form.setFieldValue("expectedCompletionDate", deliveryDate);
    }
  };

  return (
    <div className="form-section">
      <Title level={5} className="section-title">
        Yêu cầu về lấy mẫu & giao trả
      </Title>
      <Row gutter={[16, 12]}>
        <Col xs={24} sm={12}>
          <Row align="middle">
            <Col xs={10}>
              <Text>Lấy mẫu:</Text>
            </Col>
            <Col xs={14}>
              <Form.Item name="samplingRequirement" style={{ marginBottom: 0 }}>
                <Radio.Group
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <Radio value={SamplingRequirement.LabSampling}>
                    TTKN lấy mẫu
                  </Radio>
                  <Radio value={SamplingRequirement.CustomerSampling}>
                    KH tự lấy mẫu
                  </Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>
        </Col>
        <Col xs={24} sm={12}>
          <Row align="middle">
            <Col xs={10}>
              <Text>Lưu mẫu:</Text>
            </Col>
            <Col xs={14}>
              <Form.Item name="sampleStorageOption" style={{ marginBottom: 0 }}>
                <Radio.Group
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <Radio value={SampleStorageOption.No}>Không</Radio>
                  <Radio value={SampleStorageOption.Yes}>
                    Có (theo QĐ của TT)
                  </Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>
        </Col>
      </Row>
      <Row gutter={[16, 8]} style={{ marginTop: 12 }}>
        <Col xs={24}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
            <Form.Item
              name="deliveryDirectPickup"
              valuePropName="checked"
              style={{ marginBottom: 0 }}
            >
              <Checkbox>Nhận trực tiếp</Checkbox>
            </Form.Item>
            <Form.Item
              name="deliveryPostal"
              valuePropName="checked"
              style={{ marginBottom: 0 }}
            >
              <Checkbox>Gửi bưu điện</Checkbox>
            </Form.Item>
            <Form.Item
              name="returnStoredSample"
              valuePropName="checked"
              style={{ marginBottom: 0 }}
            >
              <Checkbox>Trả lại mẫu lưu</Checkbox>
            </Form.Item>
          </div>
        </Col>
      </Row>
      <Row gutter={[16, 8]} style={{ marginTop: 12 }}>
        <Col xs={24} sm={12}>
          <div className="delivery-date-section">
            <Text>Ngày trả KQ:</Text>
            <Space size={8} wrap style={{ marginTop: 4 }}>
              <Space size={4}>
                <InputNumber
                  min={1}
                  max={999}
                  maxLength={3}
                  placeholder="Số"
                  style={{ width: 70 }}
                  onChange={handleWorkingDaysChange}
                  controls={false}
                />
                <Text>ngày</Text>
              </Space>
              <Form.Item name="expectedCompletionDate" style={{ marginBottom: 0 }}>
                <DatePicker format="DD/MM/YYYY" style={{ width: 130 }} />
              </Form.Item>
            </Space>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default SamplingDeliverySection;
