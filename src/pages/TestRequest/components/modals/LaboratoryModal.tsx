import React from "react";
import { Modal, DatePicker, Radio, Space, Table, Row, Col, Button, Typography } from "antd";
import { Icon } from "@iconify/react";
import dayjs from "dayjs";

const { Text } = Typography;

interface Laboratory {
  id: string;
  name: string;
  code?: string;
}

interface Indicator {
  id: string;
  name: string;
  unitPrice: number;
}

interface LaboratoryModalProps {
  visible: boolean;
  laboratories: Laboratory[];
  selectedLaboratoryId: string | null;
  laboratoryRequestDate: dayjs.Dayjs | null;
  indicatorsToSend: string[];
  indicators: Indicator[];
  onLaboratoryChange: (value: string) => void;
  onDateChange: (value: dayjs.Dayjs | null) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const LaboratoryModal: React.FC<LaboratoryModalProps> = ({
  visible,
  laboratories,
  selectedLaboratoryId,
  laboratoryRequestDate,
  indicatorsToSend,
  indicators,
  onLaboratoryChange,
  onDateChange,
  onConfirm,
  onCancel,
}) => {
  const getIndicatorInfo = (indicatorId: string) => {
    return indicators.find((ind) => ind.id === indicatorId);
  };

  const tableData = indicatorsToSend
    .map((id) => getIndicatorInfo(id))
    .filter(Boolean) as Indicator[];

  const columns = [
    {
      title: "Chỉ tiêu",
      dataIndex: "name",
      key: "name",
      ellipsis: true,
    },
    {
      title: "Đơn giá",
      dataIndex: "unitPrice",
      key: "unitPrice",
      width: 120,
      align: "right" as const,
      render: (value: number) => value?.toLocaleString("vi-VN") + "đ",
    },
  ];

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon icon="mdi:office-building" width={24} height={24} />
            <span>Chọn khoa phòng</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              type="primary"
              icon={<Icon icon="mdi:check" width={16} />}
              onClick={onConfirm}
            >
              Gửi
            </Button>
            <Button
              icon={<Icon icon="mdi:close" width={16} />}
              onClick={onCancel}
            >
              Thoát
            </Button>
          </div>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      closable={false}
      width={800}
      centered
      footer={null}
      styles={{
        body: {
          padding: 0,
          maxHeight: "calc(100vh - 200px)",
          overflowY: "auto"
        }
      }}
    >
      <div style={{ padding: "16px" }}>
        {/* Ngày yêu cầu xong */}
        <Row align="middle" style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Text>Ngày yêu cầu xong:</Text>
          </Col>
          <Col span={16}>
            <DatePicker
              value={laboratoryRequestDate}
              onChange={onDateChange}
              format="DD/MM/YYYY"
              style={{ width: "100%" }}
              placeholder="Chọn ngày..."
              disabledDate={(current) => {
                // Disable dates before today
                return current && current.isBefore(dayjs().startOf("day"));
              }}
            />
          </Col>
        </Row>

        {/* Danh sách khoa phòng - Radio */}
        <div
          style={{
            border: "1px solid #d9d9d9",
            borderRadius: 4,
            padding: 12,
            marginBottom: 16,
            background: "#fafafa",
          }}
        >
          <Radio.Group
            value={selectedLaboratoryId}
            onChange={(e) => onLaboratoryChange(e.target.value)}
            style={{ width: "100%" }}
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              {laboratories.map((lab) => (
                <Radio
                  key={lab.id}
                  value={lab.id}
                  style={{ display: "block" }}
                >
                  {lab.code ? `${lab.code} - ${lab.name}` : lab.name}
                </Radio>
              ))}
            </Space>
          </Radio.Group>
          {laboratories.length === 0 && (
            <Text type="secondary">Không có khoa phòng nào</Text>
          )}
        </div>

        {/* Danh sách chỉ tiêu đã chọn */}
        <div>
          <Text strong style={{ display: "block", marginBottom: 8 }}>
            Chỉ tiêu đã chọn ({indicatorsToSend.length})
          </Text>
          <div
            style={{
              border: "1px solid #d9d9d9",
              borderRadius: 4,
            }}
          >
            <Table
              dataSource={tableData}
              rowKey="id"
              size="small"
              pagination={false}
              columns={columns}
              locale={{ emptyText: "Không có chỉ tiêu nào" }}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default LaboratoryModal;
