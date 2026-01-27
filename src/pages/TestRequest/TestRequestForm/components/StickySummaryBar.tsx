// @ts-nocheck
import React from "react";
import { Tag, Divider } from "antd";
import {
  UserOutlined,
  FileTextOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  IdcardOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

interface StickySummaryBarProps {
  customerName?: string;
  contactPerson?: string;
  taxCode?: string;
  phone?: string;
  address?: string;
  ward?: string;
  province?: string;
  contractNumber?: string;
  contractDate?: dayjs.Dayjs;
  sampleTypeService?: boolean;
  sampleTypeContract?: boolean;
  sampleTypeTask?: boolean;
  sampleTypeSubContract?: boolean;
  subContract?: string;
}

const StickySummaryBar: React.FC<StickySummaryBarProps> = ({
  customerName,
  contactPerson,
  taxCode,
  phone,
  address,
  ward,
  province,
  contractNumber,
  contractDate,
  sampleTypeService,
  sampleTypeContract,
  sampleTypeTask,
  sampleTypeSubContract,
  subContract,
}) => {
  // Build sample type tags
  const sampleTypeTags = [
    sampleTypeService && { label: "Dịch vụ", color: "blue" },
    sampleTypeContract && { label: "Hợp đồng", color: "green" },
    sampleTypeTask && { label: "Nhiệm vụ", color: "orange" },
    sampleTypeSubContract && { label: "HĐ phụ", color: "purple" },
  ].filter(Boolean);

  // Build full address
  const fullAddress = [address, ward, province].filter(Boolean).join(", ");

  return (
    <div className="sticky-summary-bar">
      {/* Left: Customer Info */}
      <div className="sticky-summary-section">
        <div className="sticky-summary-section-title">
          <UserOutlined /> Khách hàng
        </div>
        <div className="sticky-summary-content">
          <span className="sticky-summary-primary">{customerName || "—"}</span>
          {contactPerson && (
            <span className="sticky-summary-secondary"> • {contactPerson}</span>
          )}
        </div>
        <div className="sticky-summary-details">
          {taxCode && (
            <span className="sticky-summary-detail">
              <IdcardOutlined /> {taxCode}
            </span>
          )}
          {phone && (
            <span className="sticky-summary-detail">
              <PhoneOutlined /> {phone}
            </span>
          )}
          {fullAddress && (
            <span className="sticky-summary-detail sticky-summary-address">
              <EnvironmentOutlined /> {fullAddress}
            </span>
          )}
        </div>
      </div>

      <Divider type="vertical" className="sticky-summary-divider" />

      {/* Right: Contract Info */}
      <div className="sticky-summary-section">
        <div className="sticky-summary-section-title">
          <FileTextOutlined /> Hợp đồng
        </div>
        <div className="sticky-summary-content">
          <span className="sticky-summary-primary">{contractNumber || "—"}</span>
          {contractDate && (
            <span className="sticky-summary-secondary">
              {" "}• {contractDate.format("DD/MM/YYYY")}
            </span>
          )}
        </div>
        <div className="sticky-summary-details">
          {sampleTypeTags.length > 0 && (
            <span className="sticky-summary-tags">
              {sampleTypeTags.map((tag, index) => (
                <Tag key={index} color={tag.color} style={{ marginRight: 4 }}>
                  {tag.label}
                </Tag>
              ))}
            </span>
          )}
          {subContract && (
            <span className="sticky-summary-detail">
              HĐ phụ: {subContract}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default StickySummaryBar;
