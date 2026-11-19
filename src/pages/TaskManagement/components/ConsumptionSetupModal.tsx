import React, { useState, useCallback } from "react";
import { Modal, Table, Button, Space, Tooltip, message } from "antd";
import { CheckCircleFilled, ExclamationCircleOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import MethodNormPanel from "../../MasterData/BatchNorms/MethodNormPanel";
import ForecastSetupModal from "../../MasterData/YearlyForecasts/ForecastSetupModal";
import type { MethodBatchNormDto } from "../../../services/serviceCatalogService";

export interface ConsumptionSetupIndicator {
  id: string;
  sampleCode: string;
  indicatorName: string;
  indicatorFormattedName?: string;
  indicatorGroupName?: string;
  methodName: string;
  methodFormattedName?: string;
  unit?: string;
  testMethodId?: string;
  testMethodIndicatorId?: string;
  /** Đã có định mức theo mẻ (L3) đầy đủ cho dịch vụ (nền mẫu × chỉ tiêu × PP) */
  hasNorm: boolean;
  /** Đã có dự toán mẫu năm (L4) cho dịch vụ */
  hasForecast: boolean;
  /** Năm tính tiêu hao */
  forecastYear: number;
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

const greenStyle: React.CSSProperties = { background: "#52c41a", borderColor: "#52c41a", color: "#fff" };

const withConsumption = (ind: ConsumptionSetupIndicator): ConsumptionSetupIndicator => ({
  ...ind,
  hasConsumption: ind.hasNorm && ind.hasForecast,
});

const ConsumptionSetupModal: React.FC<ConsumptionSetupModalProps> = ({
  open,
  loading,
  indicators: initialIndicators,
  onSkipAndAccept,
  onAcceptAll,
  onCancel,
}) => {
  const [indicators, setIndicators] = useState<ConsumptionSetupIndicator[]>([]);
  const [normTarget, setNormTarget] = useState<ConsumptionSetupIndicator | null>(null);
  const [forecastTarget, setForecastTarget] = useState<ConsumptionSetupIndicator | null>(null);

  React.useEffect(() => {
    if (open) setIndicators(initialIndicators.map(withConsumption));
  }, [open, initialIndicators]);

  const allSetup = indicators.length > 0 && indicators.every((i) => i.hasConsumption);

  const handleOpenNorm = useCallback((indicator: ConsumptionSetupIndicator) => {
    if (!indicator.testMethodId) {
      message.warning("Chỉ tiêu chưa được gán phương pháp");
      return;
    }
    if (!indicator.testMethodIndicatorId) {
      message.warning("Không tìm thấy dịch vụ (chỉ tiêu - nền mẫu - phương pháp) trong Dịch vụ & Bảng giá");
      return;
    }
    setNormTarget(indicator);
  }, []);

  const handleOpenForecast = useCallback((indicator: ConsumptionSetupIndicator) => {
    if (!indicator.testMethodId || !indicator.testMethodIndicatorId) {
      message.warning("Không tìm thấy dịch vụ (chỉ tiêu - nền mẫu - phương pháp) trong Dịch vụ & Bảng giá");
      return;
    }
    setForecastTarget(indicator);
  }, []);

  const handleNormChanged = useCallback(
    (norms: MethodBatchNormDto[]) => {
      if (!normTarget?.testMethodIndicatorId) return;
      const serviceId = normTarget.testMethodIndicatorId;
      const hasNorm = norms.some((n) => n.isActive && n.isComplete);
      setIndicators((prev) =>
        prev.map((ind) => (ind.testMethodIndicatorId === serviceId ? withConsumption({ ...ind, hasNorm }) : ind))
      );
    },
    [normTarget]
  );

  const handleForecastSaved = useCallback(() => {
    const target = forecastTarget;
    setForecastTarget(null);
    if (!target) return;
    setIndicators((prev) =>
      prev.map((ind) =>
        ind.id === target.id ||
        (ind.testMethodIndicatorId === target.testMethodIndicatorId && ind.forecastYear === target.forecastYear)
          ? withConsumption({ ...ind, hasForecast: true })
          : ind
      )
    );
  }, [forecastTarget]);

  const columns: ColumnsType<ConsumptionSetupIndicator> = [
    { title: "Mẫu", dataIndex: "sampleCode", key: "sampleCode", width: 110 },
    { title: "Tên chỉ tiêu", dataIndex: "indicatorName", key: "indicatorName", ellipsis: true },
    { title: "Phương pháp", dataIndex: "methodName", key: "methodName", ellipsis: true },
    {
      title: "",
      key: "action",
      width: 300,
      align: "center",
      render: (_, record) => (
        <Space size={6}>
          <Button
            type="primary"
            size="small"
            icon={record.hasNorm ? <CheckCircleFilled /> : undefined}
            style={record.hasNorm ? greenStyle : undefined}
            onClick={() => handleOpenNorm(record)}
          >
            {record.hasNorm ? "Đã có định mức" : "Thiết lập tiêu hao"}
          </Button>
          <Button
            type="primary"
            size="small"
            icon={record.hasForecast ? <CheckCircleFilled /> : undefined}
            style={record.hasForecast ? greenStyle : undefined}
            onClick={() => handleOpenForecast(record)}
          >
            {record.hasForecast ? `Đã có dự toán ${record.forecastYear}` : "Thiết lập dự toán"}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Modal
        title={
          <Space>
            Thiết lập tiêu hao nguyên vật liệu
            <Tooltip title="Cần định mức theo mẻ + dự toán mẫu năm để hệ thống trừ tồn kho khi nộp kết quả">
              <ExclamationCircleOutlined style={{ color: "#faad14", fontSize: 16 }} />
            </Tooltip>
          </Space>
        }
        open={open}
        centered
        width={860}
        destroyOnHidden
        closable
        onCancel={onCancel}
        footer={
          <Space>
            <Button danger onClick={onSkipAndAccept} loading={loading}>
              Bỏ qua thiết lập và chấp nhận TN
            </Button>
            <Button type="primary" onClick={onAcceptAll} loading={loading} disabled={!allSetup}>
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

      <Modal
        open={!!normTarget}
        title={`Định mức theo mẻ — ${normTarget?.indicatorName ?? ""} — ${normTarget?.methodName ?? ""}`}
        width={1000}
        centered
        destroyOnHidden
        footer={<Button onClick={() => setNormTarget(null)}>Đóng</Button>}
        onCancel={() => setNormTarget(null)}
        styles={{ body: { maxHeight: "70vh", overflowY: "auto" } }}
      >
        {normTarget?.testMethodIndicatorId && (
          <MethodNormPanel
            testMethodIndicatorId={normTarget.testMethodIndicatorId}
            serviceLabel={`${normTarget.indicatorName} — ${normTarget.methodName}`}
            onChanged={handleNormChanged}
          />
        )}
      </Modal>

      {forecastTarget?.testMethodId && forecastTarget.testMethodIndicatorId && (
        <ForecastSetupModal
          open
          testMethodId={forecastTarget.testMethodId}
          testMethodIndicatorId={forecastTarget.testMethodIndicatorId}
          year={forecastTarget.forecastYear}
          serviceName={`${forecastTarget.indicatorName} — ${forecastTarget.methodName}`}
          onSaved={handleForecastSaved}
          onCancel={() => setForecastTarget(null)}
        />
      )}
    </>
  );
};

export default ConsumptionSetupModal;
