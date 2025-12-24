// @ts-nocheck
import React from "react";
import { Form, Input, Select, AutoComplete, Row, Col, Typography } from "antd";
import { getWardsByProvince, Province, Ward } from "../../../../utils/vietnamLocations";

const { Title } = Typography;

interface CustomerInfoSectionProps {
  form: any;
  isFieldLocked: (fieldName: string) => boolean;
  provinces: Province[];
  wards: Ward[];
  setWards: React.Dispatch<React.SetStateAction<Ward[]>>;
  organizationOptions: { value: string; label: string }[];
  organizationSearching: boolean;
  handleOrganizationSearch: (searchText: string) => void;
  handleOrganizationSelect: (value: string) => void;
  handlePhoneBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
}

const CustomerInfoSection: React.FC<CustomerInfoSectionProps> = ({
  form,
  isFieldLocked,
  provinces,
  wards,
  setWards,
  organizationOptions,
  organizationSearching,
  handleOrganizationSearch,
  handleOrganizationSelect,
  handlePhoneBlur,
}) => {
  return (
    <div className="form-section">
      <Title level={5} className="section-title">
        Thông tin khách hàng
      </Title>
      <Row gutter={[16, 8]}>
        <Col xs={24} sm={24} lg={12}>
          <Form.Item
            name="customerName"
            label="Tên CS/DN"
            rules={[
              { required: true, message: "Vui lòng nhập tên khách hàng" },
            ]}
          >
            <AutoComplete
              options={organizationOptions}
              onSearch={handleOrganizationSearch}
              onSelect={handleOrganizationSelect}
              placeholder="Nhập tên cơ sở / doanh nghiệp..."
              filterOption={false}
              disabled={isFieldLocked("customerName")}
              notFoundContent={
                organizationSearching ? (
                  <span style={{ color: "#999" }}>Đang tìm kiếm...</span>
                ) : organizationOptions.length === 0 ? null : (
                  <span style={{ color: "#999" }}>Không tìm thấy kết quả</span>
                )
              }
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8} lg={6}>
          <Form.Item
            name="provinceCode"
            label="Tỉnh thành"
            rules={[{ required: true, message: "Vui lòng chọn tỉnh thành" }]}
          >
            <Select
              placeholder="Chọn tỉnh thành"
              allowClear
              showSearch
              optionFilterProp="children"
              disabled={isFieldLocked("provinceCode")}
              filterOption={(input, option) =>
                (option?.children as unknown as string)
                  ?.toLowerCase()
                  .includes(input.toLowerCase())
              }
              onChange={(value) => {
                form.setFieldsValue({
                  wardCode: undefined,
                });
                if (value) {
                  setWards(getWardsByProvince(value));
                } else {
                  setWards([]);
                }
              }}
            >
              {provinces.map((p) => (
                <Select.Option key={p.code} value={p.code}>
                  {p.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={8} lg={6}>
          <Form.Item
            name="wardCode"
            label="Phường xã"
            rules={[{ required: true, message: "Vui lòng chọn phường xã" }]}
          >
            <Select
              placeholder="Chọn phường/xã"
              allowClear
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children as unknown as string)
                  ?.toLowerCase()
                  .includes(input.toLowerCase())
              }
              disabled={wards.length === 0 || isFieldLocked("wardCode")}
            >
              {wards.map((w) => (
                <Select.Option key={w.code} value={w.code}>
                  {w.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={[16, 8]}>
        <Col xs={24} sm={24} lg={12}>
          <Form.Item
            name="address"
            label="Địa chỉ"
            rules={[{ required: true, message: "Vui lòng nhập địa chỉ" }]}
          >
            <Input
              placeholder="Địa chỉ chi tiết"
              disabled={isFieldLocked("address")}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8} lg={4}>
          <Form.Item name="taxCode" label="Mã số thuế">
            <Input placeholder="MST" disabled={isFieldLocked("taxCode")} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8} lg={4}>
          <Form.Item
            name="contactPerson"
            label="Người LH"
            rules={[
              { required: true, message: "Vui lòng nhập người liên hệ" },
            ]}
          >
            <Input
              placeholder="Người liên hệ"
              disabled={isFieldLocked("contactPerson")}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8} lg={4}>
          <Form.Item
            name="phone"
            label="Điện thoại"
            rules={[
              { required: true, message: "Vui lòng nhập số điện thoại" },
              {
                pattern: /^(0|\+84)[0-9]{9,10}$/,
                message: "Số điện thoại không hợp lệ",
              },
            ]}
          >
            <Input
              placeholder="SĐT"
              disabled={isFieldLocked("phone")}
              onBlur={handlePhoneBlur}
            />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
};

export default CustomerInfoSection;
