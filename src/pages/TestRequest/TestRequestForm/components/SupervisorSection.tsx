// @ts-nocheck
import React from "react";
import { Form, Select, Row, Col, Typography } from "antd";
import { UserLookupDto } from "../../../../services/userService";

const { Title, Text } = Typography;

interface SupervisorSectionProps {
  users: UserLookupDto[];
}

const SupervisorSection: React.FC<SupervisorSectionProps> = ({ users }) => {
  return (
    <div className="form-section">
      <Title level={5} className="section-title">
        Người phụ trách
      </Title>
      <Row gutter={[16, 12]}>
        <Col xs={24}>
          <Row align="middle">
            <Col xs={6}>
              <Text>
                Người giám sát: <span style={{ color: "#ff4d4f" }}>*</span>
              </Text>
            </Col>
            <Col xs={18}>
              <Form.Item
                name="supervisorId"
                style={{ marginBottom: 0 }}
                rules={[
                  {
                    required: true,
                    message: "Vui lòng chọn người phụ trách",
                  },
                ]}
              >
                <Select
                  placeholder="Chọn người phụ trách..."
                  allowClear
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.children as unknown as string)
                      ?.toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  style={{ width: "100%" }}
                >
                  {users.map((user) => (
                    <Select.Option key={user.id} value={user.id}>
                      {user.displayName || user.userName}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Col>
        <Col xs={24}>
          <Row align="middle">
            <Col xs={6}>
              <Text>
                Giám đốc: <span style={{ color: "#ff4d4f" }}>*</span>
              </Text>
            </Col>
            <Col xs={18}>
              <Form.Item
                name="directorId"
                style={{ marginBottom: 0 }}
                rules={[
                  {
                    required: true,
                    message: "Vui lòng chọn GĐ Trung tâm",
                  },
                ]}
              >
                <Select
                  placeholder="Chọn GĐ Trung tâm..."
                  allowClear
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.children as unknown as string)
                      ?.toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  style={{ width: "100%" }}
                >
                  {users.map((user) => (
                    <Select.Option key={user.id} value={user.id}>
                      {user.displayName || user.userName}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
};

export default SupervisorSection;
