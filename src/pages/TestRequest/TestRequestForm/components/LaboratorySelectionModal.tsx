// @ts-nocheck
import React, { useMemo } from "react";
import { Modal, Button, Radio, DatePicker, Table, Space, Row, Col, Typography } from "antd";
import { Icon } from "@iconify/react";
import dayjs from "dayjs";
import { LaboratoryDto, IndicatorDto } from "../../../../services/masterDataService";
import { IndicatorMethodKey, IndicatorMethodInfo } from "../types";
import { IndicatorName } from "../../../../components/common";

const { Text } = Typography;

interface LaboratorySelectionModalProps {
  visible: boolean;
  onCancel: () => void;
  laboratories: LaboratoryDto[];
  selectedLaboratoryId: string | null;
  setSelectedLaboratoryId: (id: string | null) => void;
  laboratoryRequestDate: dayjs.Dayjs | null;
  setLaboratoryRequestDate: (date: dayjs.Dayjs | null) => void;
  indicatorsToSend: string[]; // Now contains IndicatorMethodKey[]
  getIndicatorMethodInfo: (key: IndicatorMethodKey) => {
    indicator: IndicatorDto | undefined;
    method: IndicatorMethodInfo | undefined;
    indicatorId: string;
    testMethodId: string;
  };
  handleConfirmSendToLaboratory: () => void;
}

const LaboratorySelectionModal: React.FC<LaboratorySelectionModalProps> = ({
  visible,
  onCancel,
  laboratories,
  selectedLaboratoryId,
  setSelectedLaboratoryId,
  laboratoryRequestDate,
  setLaboratoryRequestDate,
  indicatorsToSend,
  getIndicatorMethodInfo,
  handleConfirmSendToLaboratory,
}) => {
  // Transform indicatorsToSend (IndicatorMethodKey[]) to table data
  const tableData = useMemo(() => {
    return indicatorsToSend.map((key) => {
      const { indicator, method } = getIndicatorMethodInfo(key as IndicatorMethodKey);
      return {
        key,
        indicatorName: indicator?.name || "",
        indicatorFormattedName: indicator?.formattedName,
        methodName: method?.testMethodName || "",
        methodFormattedName: method?.testMethodFormattedName,
        unitPrice: method?.unitPrice || 0,
      };
    });
  }, [indicatorsToSend, getIndicatorMethodInfo]);

  return (
    <Modal
      title={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon icon="mdi:office-building" width={24} height={24} />
            <span>Chọn khoa phòng</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              type="primary"
              icon={<Icon icon="mdi:check" width={16} />}
              onClick={handleConfirmSendToLaboratory}
            >
              Gửi
            </Button>
            <Button icon={<Icon icon="mdi:close" width={16} />} onClick={onCancel}>
              Thoát
            </Button>
          </div>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      closable={false}
      width={900}
      centered
      footer={null}
      zIndex={1100}
      styles={{
        body: {
          padding: 0,
          maxHeight: "calc(100vh - 200px)",
          overflowY: "auto",
        },
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
              onChange={(date) => setLaboratoryRequestDate(date)}
              format="DD/MM/YYYY"
              style={{ width: "100%" }}
              placeholder="Chọn ngày..."
              disabledDate={(current) => {
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
            onChange={(e) => setSelectedLaboratoryId(e.target.value)}
            style={{ width: "100%" }}
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              {laboratories.map((lab) => (
                <Radio key={lab.id} value={lab.id} style={{ display: "block" }}>
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
              rowKey="key"
              size="small"
              pagination={false}
              columns={[
                {
                  title: "Chỉ tiêu",
                  dataIndex: "indicatorName",
                  key: "indicatorName",
                  ellipsis: true,
                  render: (_: any, record: any) => <IndicatorName name={record.indicatorName} formattedName={record.indicatorFormattedName} />,
                },
                {
                  title: "Phương pháp",
                  dataIndex: "methodName",
                  key: "methodName",
                  width: 250,
                  ellipsis: true,
                  render: (_: any, record: any) => (
                    <IndicatorName name={record.methodName} formattedName={record.methodFormattedName} />
                  ),
                },
                {
                  title: "Đơn giá",
                  dataIndex: "unitPrice",
                  key: "unitPrice",
                  width: 120,
                  align: "right" as const,
                  render: (value: number) => value?.toLocaleString("vi-VN") + "đ",
                },
              ]}
              locale={{ emptyText: "Không có chỉ tiêu nào" }}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default LaboratorySelectionModal;
