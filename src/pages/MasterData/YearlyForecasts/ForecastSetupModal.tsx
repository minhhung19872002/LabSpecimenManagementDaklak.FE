import React, { useEffect, useState } from "react";
import { Alert, Form, Input, Modal, Spin, message } from "antd";
import { NumericFormat } from "react-number-format";
import { yearlyForecastService, type YearlyForecastRowDto } from "../../../services/serviceCatalogService";
import { getApiErrorMessage } from "../../../utils/errorHandler";
import ForecastCalculation from "./YearlyForecasts/ForecastCalculation";
import { formatSamples } from "./YearlyForecasts/utils";

export interface ForecastSetupModalProps {
  open: boolean;
  testMethodId: string;
  testMethodIndicatorId: string;
  /** Năm tính tiêu hao (năm của ngày trả kết quả) */
  year: number;
  serviceName: string;
  onSaved: (estimatedSamples: number) => void;
  onCancel: () => void;
}

/** Popup nhập dự toán mẫu năm cho 1 dịch vụ — dùng khi chấp nhận thử nghiệm */
const ForecastSetupModal: React.FC<ForecastSetupModalProps> = ({
  open,
  testMethodId,
  testMethodIndicatorId,
  year,
  serviceName,
  onSaved,
  onCancel,
}) => {
  const [row, setRow] = useState<YearlyForecastRowDto | null>(null);
  const [value, setValue] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setRow(null);
    setValue(null);
    yearlyForecastService
      .getList({ year, testMethodId })
      .then((result) => {
        if (cancelled) return;
        const found = result.items.find((r) => r.testMethodIndicatorId === testMethodIndicatorId) ?? null;
        setRow(found);
        setValue(found?.estimatedSamples ?? null);
      })
      .catch((error) => {
        if (!cancelled) message.error(getApiErrorMessage(error, "Không tải được dự toán"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, year, testMethodId, testMethodIndicatorId]);

  const handleOk = async () => {
    if (!value || value <= 0) {
      message.warning("Nhập số mẫu dự toán lớn hơn 0");
      return;
    }
    setSaving(true);
    try {
      await yearlyForecastService.save(year, [{ testMethodIndicatorId, estimatedSamples: value }]);
      message.success("Đã lưu dự toán mẫu năm");
      onSaved(value);
    } catch (error) {
      message.error(getApiErrorMessage(error, "Không lưu được dự toán"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title={`Thiết lập dự toán mẫu năm ${year}`}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={saving}
      okButtonProps={{ disabled: loading || !row }}
      onOk={handleOk}
      onCancel={onCancel}
      destroyOnHidden
      width={600}
    >
      <Spin spinning={loading}>
        <Form layout="vertical">
          <Form.Item label="Dịch vụ">
            <Input value={serviceName} disabled />
          </Form.Item>
          {!loading && !row ? (
            <Alert
              type="warning"
              showIcon
              message="Dịch vụ chưa có trong danh sách dự toán — cần khai báo định mức theo mẻ (đủ vật tư + tổng tiêu hao) cho phương pháp trước."
            />
          ) : (
            <>
              <Form.Item
                label={`Số mẫu dự toán năm ${year}`}
                extra={row?.previousYearSamples != null ? `Năm ${year - 1}: ${formatSamples(row.previousYearSamples)} mẫu` : undefined}
              >
                <NumericFormat
                  value={value ?? ""}
                  onValueChange={(values) => setValue(values.floatValue ?? null)}
                  allowNegative={false}
                  decimalScale={0}
                  thousandSeparator="."
                  decimalSeparator=","
                  customInput={Input}
                  addonAfter="mẫu"
                  style={{ width: "100%" }}
                  placeholder="Tổng số mẫu dự kiến trong năm"
                />
              </Form.Item>
              {row && <ForecastCalculation row={row} year={year} estimatedSamples={value} />}
            </>
          )}
        </Form>
      </Spin>
    </Modal>
  );
};

export default ForecastSetupModal;
