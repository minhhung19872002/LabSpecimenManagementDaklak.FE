import React from "react";
import { Form, Input, DatePicker, Select } from "antd";

const HiddenFields: React.FC = () => {
  return (
    <>
      <Form.Item name="requestDate" hidden>
        <DatePicker />
      </Form.Item>
      <Form.Item name="status" hidden>
        <Select />
      </Form.Item>
      <Form.Item name="customerEmail" hidden>
        <Input />
      </Form.Item>
    </>
  );
};

export default HiddenFields;
