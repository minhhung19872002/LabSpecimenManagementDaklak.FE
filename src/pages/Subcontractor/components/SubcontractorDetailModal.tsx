import React from "react";
import {
  Modal,
  Tabs,
  Descriptions,
  List,
  Table,
  Tag,
} from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { Subcontractor, Certification } from "../hooks";
import StatusTag from "../../../components/common/StatusTag";

interface SubcontractorDetailModalProps {
  open: boolean;
  subcontractor: Subcontractor | null;
  onClose: () => void;
}

const getStatusTag = (status: string) => {
  const config: Record<string, { color: string; text: string }> = {
    active: { color: "green", text: "Đang hoạt động" },
    inactive: { color: "red", text: "Ngừng hoạt động" },
    pending: { color: "orange", text: "Chờ đánh giá" },
  };
  const statusConfig = config[status] || { color: "default", text: status };
  return <StatusTag color={statusConfig.color}>{statusConfig.text}</StatusTag>;
};

const SubcontractorDetailModal: React.FC<SubcontractorDetailModalProps> = ({
  open,
  subcontractor,
  onClose,
}) => {
  if (!subcontractor) return null;

  const certificationColumns = [
    {
      title: "Tên chứng nhận",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Cấp bởi",
      dataIndex: "issuedBy",
      key: "issuedBy",
    },
    {
      title: "Ngày cấp",
      dataIndex: "issuedDate",
      key: "issuedDate",
      render: (d: string) => (d ? dayjs(d).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Ngày hết hạn",
      dataIndex: "expiryDate",
      key: "expiryDate",
      render: (d: string) => (d ? dayjs(d).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (s: string) => (
        <Tag
          color={
            s === "valid" ? "green" : s === "expiring" ? "orange" : "red"
          }
        >
          {s === "valid"
            ? "Còn hiệu lực"
            : s === "expiring"
            ? "Sắp hết hạn"
            : "Hết hạn"}
        </Tag>
      ),
    },
  ];

  return (
    <Modal
      title={`Chi tiết nhà thầu phụ: ${subcontractor.name}`}
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
      centered
    >
      <Tabs
        items={[
          {
            key: "info",
            label: "Thông tin chung",
            children: (
              <Descriptions bordered column={2}>
                <Descriptions.Item label="Mã NTP">
                  {subcontractor.code}
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  {getStatusTag(subcontractor.status)}
                </Descriptions.Item>
                <Descriptions.Item label="Tên" span={2}>
                  {subcontractor.name}
                </Descriptions.Item>
                <Descriptions.Item label="Địa chỉ" span={2}>
                  {subcontractor.address || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Người liên hệ">
                  {subcontractor.contactPerson}
                </Descriptions.Item>
                <Descriptions.Item label="Điện thoại">
                  {subcontractor.phone}
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  {subcontractor.email || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Mã số thuế">
                  {subcontractor.taxCode || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Bắt đầu HĐ">
                  {subcontractor.contractStartDate
                    ? dayjs(subcontractor.contractStartDate).format(
                        "DD/MM/YYYY"
                      )
                    : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Kết thúc HĐ">
                  {subcontractor.contractEndDate
                    ? dayjs(subcontractor.contractEndDate).format("DD/MM/YYYY")
                    : "-"}
                </Descriptions.Item>
              </Descriptions>
            ),
          },
          {
            key: "capabilities",
            label: "Năng lực thử nghiệm",
            children: (
              <List
                dataSource={subcontractor.capabilities}
                renderItem={(item) => (
                  <List.Item>
                    <CheckCircleOutlined
                      style={{ color: "#52c41a", marginRight: 8 }}
                    />
                    {item}
                  </List.Item>
                )}
              />
            ),
          },
          {
            key: "certifications",
            label: "Chứng nhận",
            children: (
              <Table<Certification>
                dataSource={subcontractor.certifications}
                rowKey="id"
                pagination={false}
                columns={certificationColumns}
              />
            ),
          },
        ]}
      />
    </Modal>
  );
};

export default SubcontractorDetailModal;
