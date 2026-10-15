// @ts-nocheck
import React from "react";
import { Form, Input, AutoComplete, Row, Col, Typography } from "antd";
import {
  getWardsByProvince,
  Province,
  Ward,
} from "../../../../utils/vietnamLocations";

const { Title } = Typography;

interface CustomerInfoSectionProps {
  form: any;
  isFieldLocked: (fieldName: string) => boolean;
  provinces: Province[];
  wards: Ward[];
  setWards: React.Dispatch<React.SetStateAction<Ward[]>>;
  selectedProvinceCode?: string;
  setSelectedProvinceCode: (code: string | undefined) => void;
  selectedWardCode?: string;
  setSelectedWardCode: (code: string | undefined) => void;
  organizationOptions: { value: string; label: string }[];
  organizationSearching: boolean;
  handleOrganizationSearch: (searchText: string) => void;
  handleOrganizationSelect: (value: string) => void;
  handlePhoneBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  handlePhoneEnter: () => void;
}

const CustomerInfoSection: React.FC<CustomerInfoSectionProps> = ({
  form,
  isFieldLocked,
  provinces,
  wards,
  setWards,
  selectedProvinceCode,
  setSelectedProvinceCode,
  selectedWardCode,
  setSelectedWardCode,
  organizationOptions,
  organizationSearching,
  handleOrganizationSearch,
  handleOrganizationSelect,
  handlePhoneBlur,
  handlePhoneEnter,
}) => {
  return (
    <div className="form-section">
      <Title level={5} className="section-title">
        Thông tin khách hàng
      </Title>
      {/* Row 1: Tên CS/DN | Tỉnh thành | Phường xã */}
      <Row gutter={[16, 0]}>
        <Col xs={24} sm={8}>
          <Form.Item
            name="customerName"
            label="Tên CS/DN"
            normalize={(value) => value?.toUpperCase()}
            rules={[
              { required: true, message: "Vui lòng nhập tên khách hàng" },
            ]}
          >
            <AutoComplete
              options={organizationOptions}
              onSearch={handleOrganizationSearch}
              onSelect={handleOrganizationSelect}
              placeholder="Nhập tên CS/DN"
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
        <Col xs={24} sm={8}>
          <Form.Item
            name="province"
            label="Tỉnh thành"
            rules={[{ required: true, message: "Vui lòng chọn tỉnh thành" }]}
          >
            <AutoComplete
              placeholder="Chọn"
              allowClear
              disabled={isFieldLocked("province")}
              options={provinces.map((p) => ({
                value: p.name,
                label: p.name,
                code: p.code,
              }))}
              onSelect={async (value, option) => {
                form.setFieldsValue({
                  province: value,
                  ward: undefined,
                });
                setSelectedProvinceCode(option.code);
                setSelectedWardCode(undefined);
                const loadedWards = await getWardsByProvince(option.code);
                setWards(loadedWards);
              }}
              onChange={(value) => {
                if (!value) {
                  setSelectedProvinceCode(undefined);
                  setSelectedWardCode(undefined);
                  setWards([]);
                  form.setFieldsValue({ ward: undefined });
                }
              }}
              filterOption={(input, option) =>
                (option?.label as string)
                  ?.toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item
            name="ward"
            label="Phường xã"
            rules={[{ required: true, message: "Vui lòng chọn phường xã" }]}
          >
            <AutoComplete
              placeholder="Chọn"
              allowClear
              disabled={isFieldLocked("ward")}
              options={wards.map((w) => ({
                value: w.name,
                label: w.name,
                code: w.code,
              }))}
              onSelect={(value, option) => {
                form.setFieldsValue({ ward: value });
                setSelectedWardCode(option.code);
              }}
              filterOption={(input, option) =>
                (option?.label as string)
                  ?.toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Form.Item>
        </Col>
      </Row>
      {/* Row 2: Địa chỉ | Email */}
      <Row gutter={[16, 0]}>
        <Col xs={24} sm={16}>
          <Form.Item
            name="address"
            label="Địa chỉ"
            rules={[{ required: true, message: "Vui lòng nhập địa chỉ" }]}
          >
            <Input placeholder="Nhập địa chỉ" disabled={isFieldLocked("address")} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="email" label="Email">
            <Input placeholder="Nhập email" maxLength={256} />
          </Form.Item>
        </Col>
      </Row>
      {/* Row 3: Mã số thuế | Người liên hệ | Điện thoại */}
      <Row gutter={[16, 0]}>
        <Col xs={24} sm={8}>
          <Form.Item
            name="taxCode"
            label="Mã số thuế"
            style={{ marginBottom: 0 }}
          >
            <Input
              placeholder="Nhập mã số thuế"
              disabled={isFieldLocked("taxCode")}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item
            name="contactPerson"
            label="Người liên hệ"
            style={{ marginBottom: 0 }}
            rules={[{ required: true, message: "Vui lòng nhập người liên hệ" }]}
          >
            <AutoComplete
              placeholder="Chọn"
              allowClear
              disabled={isFieldLocked("contactPerson")}
              options={[]}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item
            name="phone"
            label="Điện thoại"
            style={{ marginBottom: 0 }}
            rules={[
              { required: true, message: "Vui lòng nhập số điện thoại" },
              {
                pattern: /^(0|\+84)[0-9]{9,10}$/,
                message: "Số điện thoại không hợp lệ",
              },
            ]}
          >
            <Input
              placeholder="Nhập điện thoại"
              disabled={isFieldLocked("phone")}
              onBlur={handlePhoneBlur}
              onPressEnter={handlePhoneEnter}
            />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
};

// memo: chan re-render lan tu form cha khi go phim o bang mau (handlers da useCallback)
export default React.memo(CustomerInfoSection);
