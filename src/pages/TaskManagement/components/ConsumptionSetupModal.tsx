import React, { useState, useCallback } from "react";
import { Modal, Table, Button, Space, Tooltip, message } from "antd";
import { CheckCircleFilled, ExclamationCircleOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import {
  MaterialConsumptionModal,
  type PendingConsumptionItem,
} from "../../MasterData/Indicators/components";

export interface ConsumptionSetupIndicator {
  id: string;
  sampleCode: string;
  indicatorName: string;
  indicatorFormattedName?: string;
  indicatorGroupName?: string;
  methodName: string;
  methodFormattedName?: string;
  unit?: string;
  testMethodIndicatorId?: string;
  hasConsumption: boolean;
}

interface ConsumptionSetupModalProps {
  open: boolean;
  loading: boolean;
  indicators: ConsumptionSetupIndicator[];
  onSkipAndAccept: () => void;
  onAcceptAll: () => void;
  onCancel: () => void;
}

const ConsumptionSetupModal: React.FC<ConsumptionSetupModalProps> = ({
  open,
  loading,
  indicators: initialIndicators,
  onSkipAndAccept,
  onAcceptAll,
  onCancel,
}) => {
  const [indicators, setIndicators] = useState<ConsumptionSetupIndicator[]>([]);
  const requireAll = true;
  const [consumptionModal, setConsumptionModal] = useState<{
    visible: boolean;
    indicator: ConsumptionSetupIndicator | null;
  }>({ visible: false, indicator: null });

  React.useEffect(() => {
    if (open) {
      setIndicators(initialIndicators);
    }
  }, [open, initialIndicators]);

  const allSetup = indicators.length > 0 && indicators.every((i) => i.hasConsumption);
  const acceptEnabled = !requireAll || allSetup;

  const handleOpenConsumption = useCallback(
    (indicator: ConsumptionSetupIndicator) => {
      if (!indicator.testMethodIndicatorId) {
        message.warning("Không tìm thấy liên kết chỉ tiêu - phương pháp trong master data");
        return;
      }
      setConsumptionModal({ visible: true, indicator });
    },
    []
  );

  const handleConsumptionSave = useCallback(
    (_items: PendingConsumptionItem[]) => {
      if (consumptionModal.indicator) {
        const savedTmiId = consumptionModal.indicator!.testMethodIndicatorId;
        setIndicators((prev) =>
          prev.map((ind) =>
            ind.id === consumptionModal.indicator!.id ||
            (savedTmiId && ind.testMethodIndicatorId === savedTmiId)
              ? { ...ind, hasConsumption: true }
              : ind
          )
        );
      }
      setConsumptionModal({ visible: false, indicator: null });
    },
    [consumptionModal.indicator]
  );

  const handleConsumptionCancel = useCallback(() => {
    setConsumptionModal({ visible: false, indicator: null });
  }, []);

  const columns: ColumnsType<ConsumptionSetupIndicator> = [
    {
      title: "Mẫu",
      dataIndex: "sampleCode",
      key: "sampleCode",
      width: 120,
    },
    {
      title: "Tên chỉ tiêu",
      dataIndex: "indicatorName",
      key: "indicatorName",
      ellipsis: true,
    },
    {
      title: "Phương pháp",
      dataIndex: "methodName",
      key: "methodName",
      ellipsis: true,
    },
    {
      title: "",
      key: "action",
      width: 160,
      align: "center",
      render: (_, record) =>
        record.hasConsumption ? (
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleFilled />}
            onClick={() => handleOpenConsumption(record)}
            style={{ background: "#52c41a", borderColor: "#52c41a", color: "#fff" }}
          >
            Đã thiết lập
          </Button>
        ) : (
          <Button
            type="primary"
            size="small"
            onClick={() => handleOpenConsumption(record)}
          >
            Thiết lập tiêu hao
          </Button>
        ),
    },
  ];

  return (
    <>
      <Modal
        title={
          <Space>
            Thiết lập tiêu hao nguyên vật liệu
            <Tooltip title="Thiết lập đầy đủ để tránh sai lệch tồn kho">
              <ExclamationCircleOutlined style={{ color: "#faad14", fontSize: 16 }} />
            </Tooltip>
          </Space>
        }
        open={open}
        centered
        width={720}
        destroyOnHidden
        closable
        onCancel={onCancel}
        footer={
          <Space>
            <Button danger onClick={onSkipAndAccept} loading={loading}>
              Bỏ qua thiết lập và chấp nhận TN
            </Button>
            <Button
              type="primary"
              onClick={onAcceptAll}
              loading={loading}
              disabled={!acceptEnabled}
            >
              Xong &amp; chấp nhận TN
            </Button>
          </Space>
        }
        styles={{
          body: { paddingTop: 12, maxHeight: "65vh", overflowY: "auto", overflowX: "hidden" },
        }}
      >
        <Table
          columns={columns}
          dataSource={indicators}
          rowKey="id"
          pagination={false}
          size="small"
          scroll={{ x: "100%" }}
          locale={{ emptyText: "Không có chỉ tiêu nào cần thiết lập" }}
        />
      </Modal>

      {consumptionModal.indicator && (
        <MaterialConsumptionModal
          open={consumptionModal.visible}
          indicatorGroupName={consumptionModal.indicator.indicatorGroupName || ""}
          indicatorName={consumptionModal.indicator.indicatorName}
          indicatorFormattedName={consumptionModal.indicator.indicatorFormattedName}
          testMethodName={consumptionModal.indicator.methodName}
          testMethodFormattedName={consumptionModal.indicator.methodFormattedName}
          unit={consumptionModal.indicator.unit}
          testMethodIndicatorId={consumptionModal.indicator.testMethodIndicatorId}
          onSave={handleConsumptionSave}
          onCancel={handleConsumptionCancel}
        />
      )}
    </>
  );
};

export default ConsumptionSetupModal;
