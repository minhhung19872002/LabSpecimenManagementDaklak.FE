import React from "react";
import { Space, Typography } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "../../../../components/common/Icon";
import {
  TestRequestStatus,
  TestRequestStatusLabels,
  TestRequestStatusColors,
  ResultLanguage,
  SamplingRequirement,
  SampleStorageOption,
} from "../../../../types/testRequest";
import StatusTag from "../../../../components/common/StatusTag";

const { Text } = Typography;

export const BoolIcon: React.FC<{ value: boolean }> = ({ value }) => {
  return value ? (
    <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 16 }} />
  ) : (
    <CloseCircleOutlined style={{ color: "#d9d9d9", fontSize: 16 }} />
  );
};

export const BoolItem: React.FC<{ value: boolean; label: string }> = ({
  value,
  label,
}) => (
  <Space size={4}>
    <BoolIcon value={value} />
    <Text style={{ fontSize: 13 }}>{label}</Text>
  </Space>
);

export const getStatusTag = (status: TestRequestStatus) => {
  const label = TestRequestStatusLabels[status] || status.toString();
  const color = TestRequestStatusColors[status] || "default";
  return <StatusTag color={color}>{label}</StatusTag>;
};

const PAYMENT_STATUSES = [
  TestRequestStatus.PendingPayment,
  TestRequestStatus.Paid,
  TestRequestStatus.NoPaymentRequired,
];

export const getWorkflowStatusTag = (data: {
  status: TestRequestStatus;
  sentToDepartment: boolean;
  resultReturned: boolean;
}) => {
  if (!PAYMENT_STATUSES.includes(data.status)) {
    return getStatusTag(data.status);
  }

  if (data.resultReturned) {
    return <StatusTag color="success">Hoàn Thành</StatusTag>;
  }
  if (data.sentToDepartment) {
    return <StatusTag color="blue">Đang thử nghiệm</StatusTag>;
  }
  return <StatusTag color="default">Mới</StatusTag>;
};

export const getResultLanguageText = (lang: ResultLanguage) => {
  const langMap = {
    [ResultLanguage.Vietnamese]: "Tiếng Việt",
    [ResultLanguage.English]: "Tiếng Anh",
    [ResultLanguage.VietnameseAndEnglish]: "Tiếng Việt/Anh",
  };
  return langMap[lang] || "Tiếng Việt";
};

export const getSamplingRequirementText = (req: SamplingRequirement) => {
  const reqMap = {
    [SamplingRequirement.LabSampling]: "TTKN lấy mẫu",
    [SamplingRequirement.CustomerSampling]: "KH tự lấy mẫu",
  };
  return reqMap[req] || "KH tự lấy mẫu";
};

export const getSampleStorageText = (opt: SampleStorageOption) => {
  const optMap = {
    [SampleStorageOption.No]: "Không",
    [SampleStorageOption.Yes]: "Có (theo quy định của Trung tâm)",
  };
  return optMap[opt] || "Không";
};
